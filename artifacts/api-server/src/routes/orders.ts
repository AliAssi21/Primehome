import { Router } from "express";
import { eq, and, ilike, desc, sql } from "drizzle-orm";
import { db, ordersTable, productsTable, couponsTable, usersTable } from "@workspace/db";
import {
  CreateOrderBody,
  ListOrdersQueryParams,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";
import { requireAuth, optionalAuth, requireAdmin } from "../middlewares/auth.js";

const router = Router();

function formatOrder(o: Record<string, unknown>) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    customerName: o.customerName,
    customerEmail: o.customerEmail ?? null,
    customerPhone: o.customerPhone,
    address: o.address,
    city: o.city,
    deliveryArea: o.deliveryArea ?? null,
    notes: o.notes ?? null,
    subtotal: parseFloat(String(o.subtotal)),
    deliveryFee: parseFloat(String(o.deliveryFee)),
    discount: parseFloat(String(o.discount)),
    total: parseFloat(String(o.total)),
    paymentMethod: o.paymentMethod,
    couponCode: o.couponCode ?? null,
    items: (o.items as unknown[]) ?? [],
    createdAt: (o.createdAt as Date).toISOString(),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const q = ListOrdersQueryParams.safeParse(req.query);
  if (!q.success) {
    res.status(400).json({ error: q.error.message });
    return;
  }
  const { status, page = 1, limit = 20, search } = q.data;
  const offset = (page - 1) * limit;

  const conditions = [];

  // Non-admins only see their own orders
  if (req.user!.role !== "admin") {
    conditions.push(eq(ordersTable.userId, req.user!.userId));
  }
  if (status) conditions.push(eq(ordersTable.status, status));
  if (search) {
    conditions.push(ilike(ordersTable.orderNumber, `%${search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(ordersTable)
    .where(whereClause);

  const rows = await db
    .select()
    .from(ordersTable)
    .where(whereClause)
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    items: rows.map(formatOrder),
    total: countRow?.count ?? 0,
    page,
    limit,
  });
});

router.post("/orders", optionalAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { couponCode, items, ...orderData } = parsed.data;

  // Calculate totals from items
  let subtotal = 0;
  const orderItems = [];
  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    const price = product.salePrice ? parseFloat(product.salePrice) : parseFloat(product.price);
    const itemSubtotal = price * item.quantity;
    subtotal += itemSubtotal;
    orderItems.push({
      productId: product.id,
      productName: product.name,
      productImageUrl: product.images[0] ?? null,
      price,
      quantity: item.quantity,
      subtotal: itemSubtotal,
    });

    // Reduce stock
    await db.update(productsTable).set({
      stock: product.stock - item.quantity,
      salesCount: product.salesCount + item.quantity,
    }).where(eq(productsTable.id, product.id));
  }

  // Get delivery fee from settings
  const deliveryFee = 5; // Default

  // Apply coupon if present
  let discount = 0;
  let appliedCoupon: string | null = null;
  if (couponCode) {
    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, couponCode.toUpperCase()));
    if (coupon && coupon.active) {
      const minAmount = coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount) : 0;
      if (subtotal >= minAmount) {
        if (coupon.type === "percentage") {
          discount = subtotal * (parseFloat(coupon.value) / 100);
        } else {
          discount = parseFloat(coupon.value);
        }
        discount = Math.min(discount, subtotal);
        appliedCoupon = coupon.code;
        await db.update(couponsTable).set({ usedCount: coupon.usedCount + 1 }).where(eq(couponsTable.id, coupon.id));
      }
    }
  }

  const total = subtotal + deliveryFee - discount;
  const orderNumber = `PH-${Date.now().toString(36).toUpperCase()}`;

  const [order] = await db.insert(ordersTable).values({
    orderNumber,
    userId: req.user?.userId ?? null,
    status: "pending",
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail ?? null,
    customerPhone: orderData.customerPhone,
    address: orderData.address,
    city: orderData.city,
    deliveryArea: orderData.deliveryArea ?? null,
    notes: orderData.notes ?? null,
    subtotal: String(subtotal),
    deliveryFee: String(deliveryFee),
    discount: String(discount),
    total: String(total),
    paymentMethod: orderData.paymentMethod,
    couponCode: appliedCoupon,
    items: orderItems,
  }).returning();

  res.status(201).json(formatOrder({ ...order }));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  // Users can only see their own orders; admins can see all
  if (req.user!.role !== "admin" && order.userId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(formatOrder({ ...order }));
});

router.patch("/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [order] = await db.update(ordersTable).set({ status: parsed.data.status }).where(eq(ordersTable.id, params.data.id)).returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(formatOrder({ ...order }));
});

export default router;
