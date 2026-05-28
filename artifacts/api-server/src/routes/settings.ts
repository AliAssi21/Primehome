import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

function formatSettings(s: Record<string, unknown>) {
  return {
    storeName: s.storeName,
    logoUrl: s.logoUrl ?? null,
    whatsappNumber: s.whatsappNumber ?? null,
    instagramUrl: s.instagramUrl ?? null,
    email: s.email ?? null,
    address: s.address ?? null,
    deliveryFee: parseFloat(String(s.deliveryFee)),
    freeDeliveryThreshold: s.freeDeliveryThreshold ? parseFloat(String(s.freeDeliveryThreshold)) : null,
    currency: s.currency,
    announcementText: s.announcementText ?? null,
    announcementActive: s.announcementActive,
  };
}

router.get("/settings", async (_req, res): Promise<void> => {
  const [settings] = await db.select().from(settingsTable).limit(1);
  if (!settings) {
    // Return defaults
    res.json({
      storeName: "Prime Home LB",
      logoUrl: null,
      whatsappNumber: null,
      instagramUrl: "https://www.instagram.com/primehome.lb",
      email: null,
      address: "Beirut, Lebanon",
      deliveryFee: 5,
      freeDeliveryThreshold: null,
      currency: "USD",
      announcementText: null,
      announcementActive: false,
    });
    return;
  }
  res.json(formatSettings({ ...settings }));
});

router.patch("/settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.deliveryFee != null) data.deliveryFee = String(parsed.data.deliveryFee);
  if (parsed.data.freeDeliveryThreshold != null) data.freeDeliveryThreshold = String(parsed.data.freeDeliveryThreshold);

  const existing = await db.select().from(settingsTable).limit(1);
  let settings;
  if (existing.length === 0) {
    [settings] = await db.insert(settingsTable).values(data).returning();
  } else {
    [settings] = await db.update(settingsTable).set(data).returning();
  }
  res.json(formatSettings({ ...settings }));
});

export default router;
