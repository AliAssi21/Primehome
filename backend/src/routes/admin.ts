import { Router } from "express";
import { eq, sql, desc, like, and } from "drizzle-orm";
import { db, ordersTable, usersTable, productsTable } from "../../db";
import { ListCustomersQueryParams, GetCustomerParams, UpdateCustomerParams, UpdateCustomerBody, GetSalesChartQueryParams } from "../../api-zod";
import { requireAdmin } from "../middlewares/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = (() => {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "backend"))) {
    return path.resolve(cwd, "backend/uploads");
  }
  return path.resolve(cwd, "uploads");
})();

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and WEBP images are allowed"));
    }
  },
});

router.post("/admin/upload", requireAdmin, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || "Failed to upload file" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
});

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [revenueRow] = await db.select({ total: sql<number>`cast(coalesce(sum(total + 0), 0) as double)` }).from(ordersTable).where(eq(ordersTable.status, "delivered"));
  const [ordersCount] = await db.select({ count: sql<number>`cast(count(*) as signed)` }).from(ordersTable);
  const [customersCount] = await db.select({ count: sql<number>`cast(count(*) as signed)` }).from(usersTable).where(eq(usersTable.role, "customer"));
  const [productsCount] = await db.select({ count: sql<number>`cast(count(*) as signed)` }).from(productsTable).where(eq(productsTable.visible, true));
  const [pendingCount] = await db.select({ count: sql<number>`cast(count(*) as signed)` }).from(ordersTable).where(eq(ordersTable.status, "pending"));
  const [lowStockCount] = await db.select({ count: sql<number>`cast(count(*) as signed)` }).from(productsTable).where(sql`stock < 5`);

  // Today
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const [todayRevenue] = await db.select({ total: sql<number>`cast(coalesce(sum(total + 0), 0) as double)` }).from(ordersTable).where(sql`created_at >= ${todayStart}`);
  const [todayOrders] = await db.select({ count: sql<number>`cast(count(*) as signed)` }).from(ordersTable).where(sql`created_at >= ${todayStart}`);

  // Top products
  const topProducts = await db
    .select({
      productId: productsTable.id,
      productName: productsTable.name,
      imageUrl: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${productsTable.images}, '$[0]'))`,
      salesCount: productsTable.salesCount,
      revenue: sql<number>`cast((${productsTable.price} + 0) * ${productsTable.salesCount} as double)`,
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
    topProducts: topProducts.map((p: typeof topProducts[0]) => ({
      productId: p.productId,
      productName: p.productName,
      imageUrl: p.imageUrl ?? null,
      salesCount: p.salesCount,
      revenue: p.revenue ?? 0,
    })),
    recentOrders: recentOrders.map((o: typeof recentOrders[0]) => ({
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
      items: (() => {
        let parsed = o.items;
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {
            parsed = [];
          }
        }
        return (parsed as unknown[]) ?? [];
      })(),
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
        DATE_FORMAT(created_at, '%Y-%m-%d') as label,
        cast(coalesce(sum(total + 0), 0) as double) as revenue,
        cast(count(*) as unsigned) as orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY label
      ORDER BY label ASC
    `);
    res.json(rows[0]);
    return;
  }

  const rows = await db.execute(sql`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') as label,
      cast(coalesce(sum(total + 0), 0) as double) as revenue,
      cast(count(*) as unsigned) as orders
    FROM orders
    WHERE created_at >= NOW() - INTERVAL 12 MONTH
    GROUP BY label
    ORDER BY label ASC
  `);
  res.json(rows[0]);
});

router.get("/admin/customers", requireAdmin, async (req, res): Promise<void> => {
  const q = ListCustomersQueryParams.safeParse(req.query);
  const { page = 1, search } = q.success ? q.data : { page: 1, search: undefined };
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(usersTable.role, "customer")];
  if (search) conditions.push(like(usersTable.name, `%${search}%`));

  const [countRow] = await db.select({ count: sql<number>`cast(count(*) as signed)` }).from(usersTable).where(and(...conditions));

  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      banned: usersTable.banned,
      createdAt: usersTable.createdAt,
      orderCount: sql<number>`cast(count(${ordersTable.id}) as signed)`,
      totalSpent: sql<number>`cast(coalesce(sum(${ordersTable.total} + 0), 0) as double)`,
    })
    .from(usersTable)
    .leftJoin(ordersTable, eq(ordersTable.userId, usersTable.id))
    .where(and(...conditions))
    .groupBy(usersTable.id)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    items: rows.map((r: typeof rows[0]) => ({
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
      orderCount: sql<number>`cast(count(${ordersTable.id}) as signed)`,
      totalSpent: sql<number>`cast(coalesce(sum(${ordersTable.total} + 0), 0) as double)`,
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
  await db.update(usersTable).set({ banned: parsed.data.banned }).where(eq(usersTable.id, params.data.id));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone ?? null, banned: user.banned, createdAt: user.createdAt.toISOString(), orderCount: 0, totalSpent: 0 });
});

export default router;
