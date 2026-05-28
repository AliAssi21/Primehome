export const CUSTOMER_TOKEN_KEY = "prime_home_token";
export const ADMIN_TOKEN_KEY = "prime_home_admin_token";

export function getToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function removeAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
