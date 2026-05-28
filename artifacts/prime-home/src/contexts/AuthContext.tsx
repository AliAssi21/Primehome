import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getToken, setToken as saveToken, removeToken as deleteToken } from "../lib/auth";
import { apiRequest } from "../lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!!getToken());

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    apiRequest<User>("GET", "/auth/me", undefined, t)
      .then((u) => setUser(u))
      .catch(() => {
        deleteToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = (newToken: string, userData: User) => {
    saveToken(newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    deleteToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
