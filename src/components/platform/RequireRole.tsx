import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/lib/mock-api";

interface RequireRoleProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { session } = useAuth();
  const { env } = useParams<{ env: string }>();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(session.user.role)) {
    return <Navigate to={`/realx/${env || "dev"}/forbidden`} replace />;
  }

  return <>{children}</>;
}
