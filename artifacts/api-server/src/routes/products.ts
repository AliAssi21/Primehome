import { Router } from "express";
import { eq, ilike, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  GetRelatedProductsParams,
  ListProductsQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth.js";

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

router.get("/products/featured", async (_req, res): Promise<void> => {
  const featured = await db
    .select({ p: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
    .where(and(eq(productsTable.featured, true), eq(productsTable.visible, true)))
    .orderBy(desc(productsTable.createdAt))
    .limit(8);

  const bestSellers = await db
    .select({ p: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
    .where(and(eq(productsTable.bestSeller, true), eq(productsTable.visible, true)))
    .orderBy(desc(productsTable.salesCount))
    .limit(8);

  res.json({
    featured: featured.map((r) => formatProduct({ ...r.p }, r.categoryName)),
    bestSellers: bestSellers.map((r) => formatProduct({ ...r.p }, r.categoryName)),
  });
});

router.get("/products/flash-sale", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ p: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
    .where(and(eq(productsTable.onSale, true), eq(productsTable.visible, true)))
    .orderBy(desc(productsTable.createdAt))
    .limit(12);

  res.json(rows.map((r) => formatProduct({ ...r.p }, r.categoryName)));
});

router.get("/products", async (req, res): Promise<void> => {
  const q = ListProductsQueryParams.safeParse(req.query);
  if (!q.success) {
    res.status(400).json({ error: q.error.message });
    return;
  }
  const { categoryId, search, minPrice, maxPrice, sort, page = 1, limit = 20, featured, onSale } = q.data;

  const conditions = [eq(productsTable.visible, true)];
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (minPrice != null) conditions.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice != null) conditions.push(lte(productsTable.price, String(maxPrice)));
  if (featured === true) conditions.push(eq(productsTable.featured, true));
  if (onSale === true) conditions.push(eq(productsTable.onSale, true));

  const offset = (page - 1) * limit;

  let orderBy;
  switch (sort) {
    case "price_asc": orderBy = asc(productsTable.price); break;
    case "price_desc": orderBy = desc(productsTable.price); break;
    case "popular": orderBy = desc(productsTable.salesCount); break;
    default: orderBy = desc(productsTable.createdAt);
  }

  const [countRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(productsTable)
    .where(and(...conditions));

  const rows = await db
    .select({ p: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  res.json({
    items: rows.map((r) => formatProduct({ ...r.p }, r.categoryName)),
    total: countRow?.count ?? 0,
    page,
    limit,
  });
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = {
    ...parsed.data,
    price: String(parsed.data.price),
    salePrice: parsed.data.salePrice != null ? String(parsed.data.salePrice) : null,
  };
  const [product] = await db.insert(productsTable).values(data).returning();
  res.status(201).json(formatProduct({ ...product }));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select({ p: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
    .where(eq(productsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(formatProduct({ ...row.p }, row.categoryName));
});

router.patch("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price != null) data.price = String(parsed.data.price);
  if (parsed.data.salePrice != null) data.salePrice = String(parsed.data.salePrice);
  if (parsed.data.salePrice === null) data.salePrice = null;

  const [product] = await db.update(productsTable).set(data).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(formatProduct({ ...product }));
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/products/:id/related", async (req, res): Promise<void> => {
  const params = GetRelatedProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.json([]);
    return;
  }
  const conditions = [eq(productsTable.visible, true)];
  if (product.categoryId) conditions.push(eq(productsTable.categoryId, product.categoryId));

  const rows = await db
    .select({ p: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
    .where(and(...conditions))
    .orderBy(desc(productsTable.salesCount))
    .limit(6);

  res.json(rows.filter((r) => r.p.id !== params.data.id).slice(0, 4).map((r) => formatProduct({ ...r.p }, r.categoryName)));
});

export default router;
