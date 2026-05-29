import { mysqlTable, timestamp, int } from "drizzle-orm/mysql-core";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const cartItemsTable = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId: int("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  quantity: int("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type CartItem = typeof cartItemsTable.$inferSelect;
export type InsertCartItem = typeof cartItemsTable.$inferInsert;
