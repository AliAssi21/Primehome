import { pgTable, text, serial, boolean, numeric, timestamp } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("Prime Home LB"),
  logoUrl: text("logo_url"),
  whatsappNumber: text("whatsapp_number"),
  instagramUrl: text("instagram_url"),
  email: text("email"),
  address: text("address"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("5"),
  freeDeliveryThreshold: numeric("free_delivery_threshold", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  announcementText: text("announcement_text"),
  announcementActive: boolean("announcement_active").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Settings = typeof settingsTable.$inferSelect;
