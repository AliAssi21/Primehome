import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriesTable, productsTable } from "../../db";
import { CreateCategoryBody, UpdateCategoryBody, GetCategoryParams } from "../../api-zod";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      description: categoriesTable.description,
      imageUrl: categoriesTable.imageUrl,
      createdAt: categoriesTable.createdAt,
      productCount: sql<number>`cast(count(${productsTable.id}) as signed)`,
    })
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  res.json(rows.map((r: typeof rows[0]) => ({ ...r, createdAt: r.createdAt.toISOString(), productCount: r.productCount ?? 0 })));
});

router.post("/categories", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.insert(categoriesTable).values(parsed.data);
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, parsed.data.slug));
  res.status(201).json({ ...cat, productCount: 0, createdAt: cat.createdAt.toISOString() });
});

router.get("/categories/:id", async (req, res): Promise<void> => {
  const params = GetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [cat] = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      description: categoriesTable.description,
      imageUrl: categoriesTable.imageUrl,
      createdAt: categoriesTable.createdAt,
      productCount: sql<number>`cast(count(${productsTable.id}) as signed)`,
    })
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(categoriesTable.id, params.data.id))
    .groupBy(categoriesTable.id);

  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json({ ...cat, productCount: cat.productCount ?? 0, createdAt: cat.createdAt.toISOString() });
});

router.patch("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const id = params.data.id;
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.update(categoriesTable).set(parsed.data).where(eq(categoriesTable.id, id));
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json({ ...cat, productCount: 0, createdAt: cat.createdAt.toISOString() });
});

router.delete("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  // Block deletion if any products are still assigned to this category
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(${productsTable.id}) as signed)` })
    .from(productsTable)
    .where(eq(productsTable.categoryId, params.data.id));

  if (count > 0) {
    res.status(409).json({
      error: `Cannot delete: this category still has ${count} product(s) assigned to it. Reassign or remove them first.`,
    });
    return;
  }

  await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
