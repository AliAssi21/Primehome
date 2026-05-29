import { mysqlTable, text, int, boolean, decimal, timestamp } from "drizzle-orm/mysql-core";

export const settingsTable = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  storeName: text("store_name").notNull().default("Prime Home LB"),
  logoUrl: text("logo_url"),
  whatsappNumber: text("whatsapp_number"),
  instagramUrl: text("instagram_url"),
  email: text("email"),
  address: text("address"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("5"),
  freeDeliveryThreshold: decimal("free_delivery_threshold", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  announcementText: text("announcement_text"),
  announcementActive: boolean("announcement_active").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Settings = typeof settingsTable.$inferSelect;
