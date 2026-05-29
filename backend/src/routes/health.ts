import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "../../api-zod";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/debug-uploads", (_req, res) => {
  const cwd = process.cwd();
  const resolvedDir = (() => {
    if (fs.existsSync(path.join(cwd, "backend"))) {
      return path.resolve(cwd, "backend/uploads");
    }
    return path.resolve(cwd, "uploads");
  })();

  let files: string[] = [];
  let exists = false;
  try {
    exists = fs.existsSync(resolvedDir);
    if (exists) {
      files = fs.readdirSync(resolvedDir);
    }
  } catch (err: any) {
    files = [err.message];
  }

  res.json({
    cwd,
    resolvedDir,
    exists,
    files
  });
});

export default router;
