import { mysqlTable, int, decimal, text, timestamp } from "drizzle-orm/mysql-core";
import { ordersTable } from "./orders";
import { productsTable } from "./products";

export const orderItemsTable = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: int("product_id").references(() => productsTable.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type OrderItem = typeof orderItemsTable.$inferSelect;
export type InsertOrderItem = typeof orderItemsTable.$inferInsert;
