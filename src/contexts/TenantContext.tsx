import React, { createContext, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getTenantContext, type TenantContext as TCtx } from "@/lib/mock-api";

interface TenantContextValue {
  context: TCtx | null;
  env: "dev" | "prod";
  tenantId: string;
  loading: boolean;
}

const Ctx = createContext<TenantContextValue>({
  context: null,
  env: "dev",
  tenantId: "realx",
  loading: false,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { env } = useParams<{ env: string }>();
  const validEnv = env === "prod" ? "prod" : "dev";

  const value = useMemo<TenantContextValue>(() => ({
    context: getTenantContext("realx", validEnv),
    env: validEnv,
    tenantId: "realx",
    loading: false,
  }), [validEnv]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTenant() {
  return useContext(Ctx);
}
