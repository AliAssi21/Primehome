import { mysqlTable, timestamp, int, unique } from "drizzle-orm/mysql-core";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const wishlistTable = mysqlTable("wishlist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId: int("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.productId)]);

export type Wishlist = typeof wishlistTable.$inferSelect;
