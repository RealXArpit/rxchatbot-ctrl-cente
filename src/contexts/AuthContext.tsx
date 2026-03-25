import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/lib/mock-api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
  tenantId: string;
}

export interface AuthSession {
  sessionId: string;
  tenantId: string;
  user: AuthUser;
  mfa: { required: boolean; method: "totp"; verified: boolean };
}

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyMfa: () => void;
}

const AuthCtx = createContext<AuthContextValue>({
  session: null,
  isAuthenticated: false,
  login: async () => ({ ok: false, error: "Not initialized" }),
  logout: async () => {},
  verifyMfa: () => {},
});

const MFA_REQUIRED_ROLES: Role[] = ["SuperAdmin", "OpsManager"];

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, name, email, role, permissions")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as Role,
    permissions: data.permissions ?? [],
    tenantId: "realx",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      try {
        if (!error && data.session?.user) {
          const profile = await fetchProfile(data.session.user.id);
          if (profile && mounted) {
            setSession({
              sessionId: data.session.access_token,
              tenantId: "realx",
              user: profile,
              mfa: {
                required: MFA_REQUIRED_ROLES.includes(profile.role),
                method: "totp",
                verified: true,
              },
            });
          }
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }).catch((e) => {
      console.error("getSession failed:", e);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        if (!mounted) return;
        try {
          if (supabaseSession?.user) {
            const profile = await fetchProfile(supabaseSession.user.id);
            if (profile && mounted) {
              setSession({
                sessionId: supabaseSession.access_token,
                tenantId: "realx",
                user: profile,
                mfa: {
                  required: MFA_REQUIRED_ROLES.includes(profile.role),
                  method: "totp",
                  verified: true,
                },
              });
            }
          } else {
            if (mounted) setSession(null);
          }
        } catch (e) {
          console.error("Auth state change error:", e);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const verifyMfa = useCallback(() => {
    if (session) {
      setSession({ ...session, mfa: { ...session.mfa, verified: true } });
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthCtx.Provider value={{ session, isAuthenticated: !!session, login, logout, verifyMfa }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
