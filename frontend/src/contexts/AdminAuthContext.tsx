import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getAdminToken, setAdminToken as saveAdminToken, removeAdminToken as deleteAdminToken } from "../lib/auth";
import { apiRequest } from "../lib/api";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getAdminToken());
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(!!getAdminToken());

  useEffect(() => {
    const t = getAdminToken();
    if (!t) {
      setAdmin(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    apiRequest<AdminUser>("GET", "/auth/me", undefined, t)
      .then((u) => {
        if (u.role !== "admin") {
          deleteAdminToken();
          setToken(null);
          setAdmin(null);
        } else {
          setAdmin(u);
        }
      })
      .catch(() => {
        deleteAdminToken();
        setToken(null);
        setAdmin(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = (newToken: string, userData: AdminUser) => {
    saveAdminToken(newToken);
    setToken(newToken);
    setAdmin(userData);
  };

  const logout = () => {
    deleteAdminToken();
    setToken(null);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
