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

const baseUrl = import.meta.env.VITE_API_URL ?? "";

export const API_BASE = `${baseUrl}/api`;

if (baseUrl) {
  setBaseUrl(baseUrl);
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

  const cleanPath = path.replace(/✔|\s+/g, "");
  const res = await fetch(`${API_BASE}${cleanPath}`, {
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
