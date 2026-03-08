import React, { createContext, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getTenantContext, type TenantContext as TCtx } from "@/lib/mock-api";
import { getEnvConfig } from "@/lib/env-config";
import { getEndpoints } from "@/types/webhook";
import type { EnvConfig, WebhookEndpoints } from "@/types/webhook";

interface TenantContextValue {
  context: TCtx | null;
  env: "dev" | "prod";
  tenantId: string;
  loading: boolean;
  envConfig: EnvConfig | null;
  endpoints: WebhookEndpoints | null;
}

const Ctx = createContext<TenantContextValue>({
  context: null,
  env: "dev",
  tenantId: "realx",
  loading: false,
  envConfig: null,
  endpoints: null,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { env } = useParams<{ env: string }>();
  const validEnv = env === "prod" ? "prod" : "dev";

  const value = useMemo<TenantContextValue>(() => {
    const cfg = getEnvConfig(validEnv);
    return {
      context: getTenantContext("realx", validEnv),
      env: validEnv,
      tenantId: "realx",
      loading: false,
      envConfig: cfg,
      endpoints: getEndpoints(cfg),
    };
  }, [validEnv]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTenant() {
  return useContext(Ctx);
}
