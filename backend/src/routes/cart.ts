import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, productsTable, settingsTable, cartItemsTable } from "../../db";
import { AddToCartBody, UpdateCartItemBody, UpdateCartItemParams, RemoveFromCartParams } from "../../api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

async function buildCartResponse(userId: number) {
  // Query persistent cart items from database
  const cartItems = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.userId, userId));

  const items = [];
  let subtotal = 0;

  for (const ci of cartItems) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, ci.productId));
    if (!product) continue;
    const price = product.salePrice ? parseFloat(product.salePrice) : parseFloat(product.price);
    subtotal += price * ci.quantity;
    items.push({
      productId: product.id,
      productName: product.name,
      price: parseFloat(product.price),
      salePrice: product.salePrice ? parseFloat(product.salePrice) : null,
      quantity: ci.quantity,
      imageUrl: product.images[0] ?? "",
      stock: product.stock,
    });
  }

  // Get delivery fee from settings
  const [settings] = await db.select().from(settingsTable).limit(1);
  const deliveryFee = settings ? parseFloat(settings.deliveryFee) : 5;
  const freeThreshold = settings?.freeDeliveryThreshold ? parseFloat(settings.freeDeliveryThreshold) : null;
  const actualDeliveryFee = freeThreshold != null && subtotal >= freeThreshold ? 0 : deliveryFee;

  return {
    items,
    subtotal,
    deliveryFee: actualDeliveryFee,
    discount: 0,
    total: subtotal + actualDeliveryFee,
    couponCode: null,
  };
}

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  res.json(await buildCartResponse(req.user!.userId));
});

router.post("/cart", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { productId, quantity } = parsed.data;

  // Check if item already exists in database cart
  const [existing] = await db
    .select()
    .from(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, req.user!.userId), eq(cartItemsTable.productId, productId)));

  if (existing) {
    await db
      .update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({
      userId: req.user!.userId,
      productId,
      quantity,
    });
  }

  res.json(await buildCartResponse(req.user!.userId));
});

router.patch("/cart/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCartItemParams.safeParse(req.params);
  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  
  if (parsed.data.quantity <= 0) {
    await db
      .delete(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, req.user!.userId), eq(cartItemsTable.productId, params.data.productId)));
  } else {
    await db
      .update(cartItemsTable)
      .set({ quantity: parsed.data.quantity })
      .where(and(eq(cartItemsTable.userId, req.user!.userId), eq(cartItemsTable.productId, params.data.productId)));
  }

  res.json(await buildCartResponse(req.user!.userId));
});

router.delete("/cart/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveFromCartParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }
  
  await db
    .delete(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, req.user!.userId), eq(cartItemsTable.productId, params.data.productId)));

  res.json(await buildCartResponse(req.user!.userId));
});

router.delete("/cart", requireAuth, async (req, res): Promise<void> => {
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.userId));
  res.sendStatus(204);
});

export default router;
