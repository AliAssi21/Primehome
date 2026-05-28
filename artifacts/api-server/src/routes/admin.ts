import { Router } from "express";
import { eq, sql, desc, ilike, and } from "drizzle-orm";
import { db, ordersTable, usersTable, productsTable } from "@workspace/db";
import { ListCustomersQueryParams, GetCustomerParams, UpdateCustomerParams, UpdateCustomerBody, GetSalesChartQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [revenueRow] = await db.select({ total: sql<number>`cast(coalesce(sum(cast(total as numeric)), 0) as float)` }).from(ordersTable).where(eq(ordersTable.status, "delivered"));
  const [ordersCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(ordersTable);
  const [customersCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(usersTable).where(eq(usersTable.role, "customer"));
  const [productsCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(productsTable).where(eq(productsTable.visible, true));
  const [pendingCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(ordersTable).where(eq(ordersTable.status, "pending"));
  const [lowStockCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(productsTable).where(sql`stock < 5`);

  // Today
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const [todayRevenue] = await db.select({ total: sql<number>`cast(coalesce(sum(cast(total as numeric)), 0) as float)` }).from(ordersTable).where(sql`created_at >= ${todayStart}`);
  const [todayOrders] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(ordersTable).where(sql`created_at >= ${todayStart}`);

  // Top products
  const topProducts = await db
    .select({
      productId: productsTable.id,
      productName: productsTable.name,
      imageUrl: sql<string>`${productsTable.images}[1]`,
      salesCount: productsTable.salesCount,
      revenue: sql<number>`cast(cast(${productsTable.price} as numeric) * ${productsTable.salesCount} as float)`,
    })
    .from(productsTable)
    .where(eq(productsTable.visible, true))
    .orderBy(desc(productsTable.salesCount))
    .limit(5);

  // Recent orders
  const recentOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(5);

  res.json({
    totalRevenue: revenueRow?.total ?? 0,
    totalOrders: ordersCount?.count ?? 0,
    totalCustomers: customersCount?.count ?? 0,
    totalProducts: productsCount?.count ?? 0,
    pendingOrders: pendingCount?.count ?? 0,
    lowStockProducts: lowStockCount?.count ?? 0,
    revenueToday: todayRevenue?.total ?? 0,
    ordersToday: todayOrders?.count ?? 0,
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      imageUrl: p.imageUrl ?? null,
      salesCount: p.salesCount,
      revenue: p.revenue ?? 0,
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      address: o.address,
      city: o.city,
      deliveryArea: o.deliveryArea,
      notes: o.notes,
      subtotal: parseFloat(String(o.subtotal)),
      deliveryFee: parseFloat(String(o.deliveryFee)),
      discount: parseFloat(String(o.discount)),
      total: parseFloat(String(o.total)),
      paymentMethod: o.paymentMethod,
      couponCode: o.couponCode,
      items: o.items as unknown[],
      createdAt: o.createdAt.toISOString(),
    })),
  });
});

router.get("/admin/stats/sales", requireAdmin, async (req, res): Promise<void> => {
  const q = GetSalesChartQueryParams.safeParse(req.query);
  const period = q.success ? q.data.period : "monthly";

  if (period === "daily") {
    const rows = await db.execute(sql`
      SELECT
        to_char(created_at, 'YYYY-MM-DD') as label,
        cast(coalesce(sum(cast(total as numeric)), 0) as float) as revenue,
        cast(count(*) as int) as orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY label
      ORDER BY label ASC
    `);
    res.json(rows.rows);
    return;
  }

  const rows = await db.execute(sql`
    SELECT
      to_char(created_at, 'YYYY-MM') as label,
      cast(coalesce(sum(cast(total as numeric)), 0) as float) as revenue,
      cast(count(*) as int) as orders
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY label
    ORDER BY label ASC
  `);
  res.json(rows.rows);
});

router.get("/admin/customers", requireAdmin, async (req, res): Promise<void> => {
  const q = ListCustomersQueryParams.safeParse(req.query);
  const { page = 1, search } = q.success ? q.data : { page: 1, search: undefined };
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(usersTable.role, "customer")];
  if (search) conditions.push(ilike(usersTable.name, `%${search}%`));

  const [countRow] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(usersTable).where(and(...conditions));

  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      banned: usersTable.banned,
      createdAt: usersTable.createdAt,
      orderCount: sql<number>`cast(count(${ordersTable.id}) as int)`,
      totalSpent: sql<number>`cast(coalesce(sum(cast(${ordersTable.total} as numeric)), 0) as float)`,
    })
    .from(usersTable)
    .leftJoin(ordersTable, eq(ordersTable.userId, usersTable.id))
    .where(and(...conditions))
    .groupBy(usersTable.id)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone ?? null,
      banned: r.banned,
      createdAt: r.createdAt.toISOString(),
      orderCount: r.orderCount ?? 0,
      totalSpent: r.totalSpent ?? 0,
    })),
    total: countRow?.count ?? 0,
  });
});

router.get("/admin/customers/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      banned: usersTable.banned,
      createdAt: usersTable.createdAt,
      orderCount: sql<number>`cast(count(${ordersTable.id}) as int)`,
      totalSpent: sql<number>`cast(coalesce(sum(cast(${ordersTable.total} as numeric)), 0) as float)`,
    })
    .from(usersTable)
    .leftJoin(ordersTable, eq(ordersTable.userId, usersTable.id))
    .where(eq(usersTable.id, params.data.id))
    .groupBy(usersTable.id);

  if (!row) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json({ id: row.id, name: row.name, email: row.email, phone: row.phone ?? null, banned: row.banned, createdAt: row.createdAt.toISOString(), orderCount: row.orderCount ?? 0, totalSpent: row.totalSpent ?? 0 });
});

router.patch("/admin/customers/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.update(usersTable).set({ banned: parsed.data.banned }).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone ?? null, banned: user.banned, createdAt: user.createdAt.toISOString(), orderCount: 0, totalSpent: 0 });
});

export default router;
