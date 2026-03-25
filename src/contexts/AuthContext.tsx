import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/lib/mock-api';

export interface AuthUser {
  id: string; name: string; email: string;
  role: Role; permissions: string[]; tenantId: string;
}
export interface AuthSession {
  sessionId: string; tenantId: string; user: AuthUser;
  mfa: { required: boolean; method: 'totp'; verified: boolean };
}
interface AuthContextValue {
  session: AuthSession | null; isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>; verifyMfa: () => void;
}
const AuthCtx = createContext<AuthContextValue>({
  session: null, isAuthenticated: false,
  login: async () => ({ ok: false, error: 'Not initialized' }),
  logout: async () => {}, verifyMfa: () => {},
});
const MFA_REQUIRED_ROLES: Role[] = ['SuperAdmin', 'OpsManager'];
async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase.from('user_profiles')
    .select('id, name, email, role, permissions').eq('id', userId).single();
  if (error || !data) return null;
  return { id: data.id, name: data.name, email: data.email,
    role: data.role as Role, permissions: data.permissions ?? [], tenantId: 'realx' };
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const profile = await fetchProfile(data.session.user.id);
        if (profile) setSession({ sessionId: data.session.access_token,
          tenantId: 'realx', user: profile,
          mfa: { required: MFA_REQUIRED_ROLES.includes(profile.role), method: 'totp', verified: true } });
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (s?.user) {
        const profile = await fetchProfile(s.user.id);
        if (profile) setSession({ sessionId: s.access_token, tenantId: 'realx', user: profile,
          mfa: { required: MFA_REQUIRED_ROLES.includes(profile.role), method: 'totp', verified: true } });
      } else { setSession(null); }
    });
    return () => subscription.unsubscribe();
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);
  const logout = useCallback(async () => {
    await supabase.auth.signOut(); setSession(null);
  }, []);
  const verifyMfa = useCallback(() => {
    if (session) setSession({ ...session, mfa: { ...session.mfa, verified: true } });
  }, [session]);
  if (loading) return <div />;
  return <AuthCtx.Provider value={{ session, isAuthenticated: !!session, login, logout, verifyMfa }}>{children}</AuthCtx.Provider>;
}
export function useAuth() { return useContext(AuthCtx); }
