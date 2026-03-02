import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/platform/PageHeader";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { env } = useParams<{ env: string }>();

  return (
    <div>
      <PageHeader title="Access Denied" subtitle="You don't have permission to view this module." />
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShieldX className="h-12 w-12 text-destructive/50 mb-4" />
        <p className="text-sm text-muted-foreground mb-4">Your current role doesn't grant access to this page.</p>
        <Button variant="outline" onClick={() => navigate(`/realx/${env || "dev"}/overview`)}>
          Back to Overview
        </Button>
      </div>
    </div>
  );
}
