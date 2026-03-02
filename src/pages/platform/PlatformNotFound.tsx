import { PageHeader } from "@/components/platform/PageHeader";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PlatformNotFound() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Page not found" subtitle="The module you're looking for doesn't exist." />
      <div className="text-center py-16">
        <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    </div>
  );
}
