import { mysqlTable, text, timestamp, boolean, int, decimal, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const couponsTable = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  type: text("type").notNull(), // 'percentage' | 'fixed'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxUses: int("max_uses"),
  usedCount: int("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCouponSchema = createInsertSchema(couponsTable).omit({ id: true, createdAt: true, usedCount: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof couponsTable.$inferSelect;
