import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function SecurityBanner() {
  const { session, verifyMfa } = useAuth();

  if (!session?.mfa.required || session.mfa.verified) return null;

  return (
    <div className="flex items-center gap-3 rounded-md border border-warning/30 bg-warning/10 px-4 py-2 text-sm">
      <ShieldAlert className="h-4 w-4 text-warning shrink-0" />
      <span className="text-foreground">
        MFA is required for <strong>{session.user.role}</strong>. Verify to unlock full access.
      </span>
      <Button variant="outline" size="sm" className="ml-auto shrink-0 text-xs" onClick={verifyMfa}>
        Verify MFA
      </Button>
    </div>
  );
}
