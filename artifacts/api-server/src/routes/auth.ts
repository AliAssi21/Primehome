import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken, requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, phone } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash, phone, role: "customer" }).returning();
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, banned: user.banned, createdAt: user.createdAt.toISOString() },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.banned) {
    res.status(403).json({ error: "Account suspended" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, banned: user.banned, createdAt: user.createdAt.toISOString() },
  });
});

router.post("/auth/admin/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.role !== "admin") {
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, banned: user.banned, createdAt: user.createdAt.toISOString() },
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, banned: user.banned, createdAt: user.createdAt.toISOString() });
});

router.patch("/auth/me/update", requireAuth, async (req, res): Promise<void> => {
  const { name, phone } = req.body as { name?: string; phone?: string };
  const [user] = await db.update(usersTable).set({ name: name ?? undefined, phone: phone ?? undefined }).where(eq(usersTable.id, req.user!.userId)).returning();
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, banned: user.banned, createdAt: user.createdAt.toISOString() });
});

export default router;
