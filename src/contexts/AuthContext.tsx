import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/lib/mock-api';

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
  mfa: { required: boolean; method: 'totp'; verified: boolean };
}

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyMfa: () => void;
}

const AuthCtx = createContext<AuthContextValue>({
  session: null,
  isAuthenticated: false,
  loading: true,
  login: async () => ({ ok: false, error: 'Not initialized' }),
  logout: async () => {},
  verifyMfa: () => {},
});

const MFA_REQUIRED_ROLES: Role[] = ['SuperAdmin', 'OpsManager'];

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, name, email, role, permissions')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as Role,
    permissions: data.permissions ?? [],
    tenantId: 'realx',
  };
}

function buildSession(accessToken: string, profile: AuthUser): AuthSession {
  return {
    sessionId: accessToken,
    tenantId: 'realx',
    user: profile,
    mfa: {
      required: MFA_REQUIRED_ROLES.includes(profile.role),
      method: 'totp',
      verified: true,
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const initDone = useRef(false);

  useEffect(() => {
    let mounted = true;

    let initResolved = false;
    const resolveInit = async (accessToken: string | null, userId: string | null) => {
      if (!mounted || initResolved) return;
      initResolved = true;
      if (accessToken && userId) {
        try {
          const profile = await fetchProfile(userId);
          if (mounted && profile) {
            setSession(buildSession(accessToken, profile));
          }
        } catch (e) {
          console.error('[AuthProvider] fetchProfile failed on init:', e);
        }
      }
      if (mounted) {
        setLoading(false);
        initDone.current = true;
      }
    };

    const timeoutId = setTimeout(() => {
      resolveInit(null, null);
    }, 3000);

    supabase.auth.getSession().then(({ data, error }) => {
      clearTimeout(timeoutId);
      if (!error && data.session?.user) {
        resolveInit(data.session.access_token, data.session.user.id);
      } else {
        resolveInit(null, null);
      }
    }).catch(() => {
      clearTimeout(timeoutId);
      resolveInit(null, null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, supabaseSession) => {
        console.log(mounted,"doneeee",event,supabaseSession)
        if (!mounted) return;
        if (event === 'SIGNED_IN' && supabaseSession?.user) {
          try {
            console.log("profile fetching")
            const profile =  fetchProfile(supabaseSession.user.id);
            console.log(profile);
            console.log("profile doneee")
            if (mounted && profile) {
              setSession(buildSession(supabaseSession.access_token, profile));
            }
          } catch (e) {
            console.error('[AuthProvider] fetchProfile failed on SIGNED_IN:', e);
          }
          if (mounted && !initDone.current) {
            setLoading(false);
            initDone.current = true;
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) setSession(null);
        } else if (event === 'TOKEN_REFRESHED' && supabaseSession?.user) {
          if (mounted) {
            setSession(prev =>
              prev ? { ...prev, sessionId: supabaseSession.access_token } : prev
            );
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

const login = async (email: string, password: string) => {
  console.log("supa bhai");
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    console.log(result, "supa hu");
     setSession(buildSession(result.data.session.access_token || "", result.data.user ||{}));
    if (result.error) return { ok: false, error: result.error.message }; // ✅ fixed typo too
    return { ok: true };
  } catch (e) {
    console.error("login threw:", e);
    return { ok: false, error: "Unexpected error" };
  }
};

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const verifyMfa = useCallback(() => {
    if (session) {
      setSession({ ...session, mfa: { ...session.mfa, verified: true } });
    }
  }, [session]);

  return (
    <AuthCtx.Provider
      value={{ session, isAuthenticated: !!session, loading, login, logout, verifyMfa }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
