import React, { createContext, useContext, useState, useCallback } from "react";
import type { AuthSession } from "@/lib/mock-auth";
import { mockLogin, mockLogout, mockGetSession, mockVerifyMfa } from "@/lib/mock-auth";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  verifyMfa: () => void;
}

const AuthCtx = createContext<AuthContextValue>({
  session: null,
  isAuthenticated: false,
  login: () => ({ ok: false, error: "Not initialized" }),
  logout: () => {},
  verifyMfa: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(mockGetSession);

  const login = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    const result = mockLogin(email, password, "realx");
    if (!result.ok || !result.session) {
      return { ok: false, error: result.error ?? "Login failed" };
    }
    setSession(result.session);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    mockLogout();
    setSession(null);
  }, []);

  const verifyMfa = useCallback(() => {
    if (mockVerifyMfa()) {
      setSession(mockGetSession());
    }
  }, []);

  return (
    <AuthCtx.Provider value={{ session, isAuthenticated: !!session, login, logout, verifyMfa }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
