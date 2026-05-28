import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, wishlistTable, productsTable, categoriesTable } from "@workspace/db";
import { AddToWishlistParams, RemoveFromWishlistParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function formatProduct(p: Record<string, unknown>, categoryName?: string | null) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    price: parseFloat(String(p.price)),
    salePrice: p.salePrice ? parseFloat(String(p.salePrice)) : null,
    stock: p.stock,
    sku: p.sku ?? null,
    categoryId: p.categoryId ?? null,
    categoryName: categoryName ?? null,
    images: (p.images as string[]) ?? [],
    featured: p.featured,
    bestSeller: p.bestSeller,
    onSale: p.onSale,
    visible: p.visible,
    salesCount: p.salesCount ?? 0,
    createdAt: (p.createdAt as Date).toISOString(),
  };
}

router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select({ p: productsTable, categoryName: categoriesTable.name })
    .from(wishlistTable)
    .innerJoin(productsTable, eq(productsTable.id, wishlistTable.productId))
    .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
    .where(eq(wishlistTable.userId, req.user!.userId));

  res.json(rows.map((r) => formatProduct({ ...r.p }, r.categoryName)));
});

router.post("/wishlist/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = AddToWishlistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }
  await db.insert(wishlistTable).values({ userId: req.user!.userId, productId: params.data.productId }).onConflictDoNothing();
  res.json({ inWishlist: true });
});

router.delete("/wishlist/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveFromWishlistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }
  await db.delete(wishlistTable).where(and(eq(wishlistTable.userId, req.user!.userId), eq(wishlistTable.productId, params.data.productId)));
  res.json({ inWishlist: false });
});

export default router;
