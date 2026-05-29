import { getToken, getAdminToken } from "./auth";
import { setBaseUrl } from "../../api-client";

export function getApiHeaders(): Record<string, string> {
  const token = getToken() || getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// In production (Vercel), set VITE_API_BASE_URL=https://your-backend.up.railway.app
// In dev, leave unset — Vite proxy forwards /api to localhost:8080
export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "") + "/api";

if (import.meta.env.VITE_API_BASE_URL) {
  setBaseUrl(import.meta.env.VITE_API_BASE_URL);
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const t = token || getToken() || getAdminToken();
  if (t) headers["Authorization"] = `Bearer ${t}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
