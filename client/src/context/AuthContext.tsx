import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearStoredToken, getStoredToken, setStoredToken } from "../api/client";
import type { User } from "../types";

type AuthResult = {
  token: string;
  user: User;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await api<User>("/auth/me");
      setUser(currentUser);
    } catch {
      clearStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshUser();
  }, []);

  async function login(email: string, password: string) {
    const result = await api<AuthResult>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuth: true
    });
    setStoredToken(result.token);
    setUser(result.user);
  }

  async function signup(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) {
    const result = await api<AuthResult>("/auth/signup", {
      method: "POST",
      body: payload,
      skipAuth: true
    });
    setStoredToken(result.token);
    setUser(result.user);
  }

  function logout() {
    clearStoredToken();
    setUser(null);
    void api("/auth/logout", { method: "POST" }).catch(() => undefined);
  }

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
