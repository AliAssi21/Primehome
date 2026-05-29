import { type Request, type Response, type NextFunction } from "express";

const attempts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(windowMs: number, maxAttempts: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
    const now = Date.now();
    const client = attempts.get(key);

    if (!client) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (now > client.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (client.count >= maxAttempts) {
      const remainingSeconds = Math.ceil((client.resetTime - now) / 1000);
      res.status(429).json({ 
        error: `Too many login attempts. Please try again in ${remainingSeconds} seconds.` 
      });
      return;
    }

    client.count += 1;
    next();
  };
}
