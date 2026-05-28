import { pgTable, text, serial, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  stock: integer("stock").notNull().default(0),
  sku: text("sku"),
  categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  images: text("images").array().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  bestSeller: boolean("best_seller").notNull().default(false),
  onSale: boolean("on_sale").notNull().default(false),
  visible: boolean("visible").notNull().default(true),
  salesCount: integer("sales_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
