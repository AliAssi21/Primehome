import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "../../db";
import { RegisterBody, LoginBody } from "../../api-zod";
import { signToken, requireAuth } from "../middlewares/auth.js";
import { rateLimiter } from "../middlewares/rate-limit.js";

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
  await db.insert(usersTable).values({ name, email, passwordHash, phone, role: "customer" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, banned: user.banned, createdAt: user.createdAt.toISOString() },
  });
});

router.post("/auth/login", rateLimiter(60000, 5), async (req, res): Promise<void> => {
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

router.post("/auth/admin/login", rateLimiter(60000, 5), async (req, res): Promise<void> => {
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
  await db.update(usersTable).set({ name: name ?? undefined, phone: phone ?? undefined }).where(eq(usersTable.id, req.user!.userId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, banned: user.banned, createdAt: user.createdAt.toISOString() });
});

router.patch("/auth/me/change-password", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current password and new password are required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Incorrect current password" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters long" });
    return;
  }
  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));
  res.json({ message: "Password updated successfully" });
});

export default router;
