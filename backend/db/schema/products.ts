import { mysqlTable, text, timestamp, boolean, int, decimal, json, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  stock: int("stock").notNull().default(0),
  sku: text("sku"),
  categoryId: int("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  images: json("images").$type<string[]>().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  bestSeller: boolean("best_seller").notNull().default(false),
  onSale: boolean("on_sale").notNull().default(false),
  visible: boolean("visible").notNull().default(true),
  salesCount: int("sales_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
