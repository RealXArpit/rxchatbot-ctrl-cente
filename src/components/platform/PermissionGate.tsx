import type { Role } from "@/lib/mock-api";

interface PermissionGateProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

/** Stub: always allows access. Will enforce roles when auth is wired. */
export function PermissionGate({ children }: PermissionGateProps) {
  return <>{children}</>;
}
