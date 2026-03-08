import React, { createContext, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getTenantContext, type TenantContext as TCtx } from "@/lib/mock-api";
import { getEnvConfig } from "@/lib/env-config";
import { getEndpoints } from "@/types/webhook";
import { getN8nClient, type N8nClient } from "@/lib/n8n-client";
import type { EnvConfig, WebhookEndpoints } from "@/types/webhook";

interface TenantContextValue {
  context: TCtx | null;
  env: "dev" | "prod";
  tenantId: string;
  loading: boolean;
  envConfig: EnvConfig | null;
  endpoints: WebhookEndpoints | null;
  client: N8nClient | null;
}

const Ctx = createContext<TenantContextValue>({
  context: null,
  env: "dev",
  tenantId: "realx",
  loading: false,
  envConfig: null,
  endpoints: null,
  client: null,
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
      client: getN8nClient(validEnv),
    };
  }, [validEnv]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTenant() {
  return useContext(Ctx);
}
