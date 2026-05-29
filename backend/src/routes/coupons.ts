import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, couponsTable } from "../../db";
import { CreateCouponBody, DeleteCouponParams, ValidateCouponBody } from "../../api-zod";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

function formatCoupon(c: Record<string, unknown>) {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: parseFloat(String(c.value)),
    minOrderAmount: c.minOrderAmount ? parseFloat(String(c.minOrderAmount)) : null,
    maxUses: c.maxUses ?? null,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt ? (c.expiresAt as Date).toISOString() : null,
    active: c.active,
    createdAt: (c.createdAt as Date).toISOString(),
  };
}

router.get("/coupons", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(couponsTable).orderBy(couponsTable.createdAt);
  res.json(rows.map(formatCoupon));
});

router.post("/coupons", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCouponBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = {
    ...parsed.data,
    code: parsed.data.code.toUpperCase(),
    value: String(parsed.data.value),
    minOrderAmount: parsed.data.minOrderAmount ? String(parsed.data.minOrderAmount) : null,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  };
  await db.insert(couponsTable).values(data);
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, data.code));
  res.status(201).json(formatCoupon({ ...coupon }));
});

router.delete("/coupons/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCouponParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(couponsTable).where(eq(couponsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/coupons/validate", async (req, res): Promise<void> => {
  const parsed = ValidateCouponBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, orderAmount } = parsed.data;
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code.toUpperCase()));

  if (!coupon || !coupon.active) {
    res.json({ valid: false, discount: 0, message: "Invalid coupon code" });
    return;
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    res.json({ valid: false, discount: 0, message: "Coupon has expired" });
    return;
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    res.json({ valid: false, discount: 0, message: "Coupon usage limit reached" });
    return;
  }
  const minAmount = coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount) : 0;
  if (orderAmount < minAmount) {
    res.json({ valid: false, discount: 0, message: `Minimum order amount is $${minAmount}` });
    return;
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = orderAmount * (parseFloat(coupon.value) / 100);
  } else {
    discount = parseFloat(coupon.value);
  }
  discount = Math.min(discount, orderAmount);
  res.json({ valid: true, discount, message: null });
});

export default router;
