import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable, settingsTable } from "@workspace/db";
import { AddToCartBody, UpdateCartItemBody, UpdateCartItemParams, RemoveFromCartParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// In-memory cart store (keyed by userId) — simple session-based
// For production you'd store in DB or Redis
const carts = new Map<number, Array<{ productId: number; quantity: number }>>();

async function buildCartResponse(userId: number) {
  const cartItems = carts.get(userId) ?? [];
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
  const cartItems = carts.get(req.user!.userId) ?? [];
  const existing = cartItems.find((ci) => ci.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cartItems.push({ productId, quantity });
  }
  carts.set(req.user!.userId, cartItems);
  res.json(await buildCartResponse(req.user!.userId));
});

router.patch("/cart/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCartItemParams.safeParse(req.params);
  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const cartItems = carts.get(req.user!.userId) ?? [];
  const item = cartItems.find((ci) => ci.productId === params.data.productId);
  if (item) item.quantity = parsed.data.quantity;
  carts.set(req.user!.userId, cartItems.filter((ci) => ci.quantity > 0));
  res.json(await buildCartResponse(req.user!.userId));
});

router.delete("/cart/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveFromCartParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }
  const cartItems = (carts.get(req.user!.userId) ?? []).filter((ci) => ci.productId !== params.data.productId);
  carts.set(req.user!.userId, cartItems);
  res.json(await buildCartResponse(req.user!.userId));
});

router.delete("/cart", requireAuth, async (req, res): Promise<void> => {
  carts.delete(req.user!.userId);
  res.sendStatus(204);
});

export default router;
