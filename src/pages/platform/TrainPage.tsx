import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, FlaskConical, FileText } from "lucide-react";
import { PageHeader } from "@/components/platform/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { getKbItems, type KbFilters } from "@/lib/mock-kb";
import { KbTable } from "@/components/knowledge/KbTable";
import { KbFiltersBar, type KbFilterState } from "@/components/knowledge/KbFiltersBar";
import { TestbenchPanel } from "@/components/knowledge/TestbenchPanel";

export default function TrainPage() {
  const { env } = useParams<{ env: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const role = session?.user.role;
  const isAuditor = role === "Auditor";
  const canCreate = role === "KnowledgeManager" || role === "OpsManager" || role === "SuperAdmin";

  const [tab, setTab] = useState("kb");
  const [filters, setFilters] = useState<KbFilterState>({ q: "", status: "", category: "" });

  const items = useMemo(() => {
    const f: KbFilters = { q: filters.q || undefined };
    if (filters.status && (filters.status as string) !== "all-statuses") f.status = filters.status;
    if (filters.category) f.category = filters.category;
    return getKbItems(env ?? "dev", f);
  }, [env, filters]);

  return (
    <div>
      <PageHeader title="Train / Knowledge" subtitle="Manage knowledge bases, FAQs, and training data." />
      <div className="px-6 py-4 space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="kb">Knowledge Base</TabsTrigger>
              <TabsTrigger value="testbench"><FlaskConical className="h-3.5 w-3.5 mr-1" />Testbench</TabsTrigger>
              <TabsTrigger value="prompts"><FileText className="h-3.5 w-3.5 mr-1" />Prompts</TabsTrigger>
            </TabsList>
            {tab === "kb" && canCreate && (
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => navigate(`/realx/${env}/train/kb/new`)}>
                <Plus className="h-3.5 w-3.5" /> New Item
              </Button>
            )}
          </div>

          <TabsContent value="kb" className="space-y-3">
            <KbFiltersBar filters={filters} onChange={setFilters} />
            <KbTable items={items} isAuditor={isAuditor} />
          </TabsContent>

          <TabsContent value="testbench">
            <TestbenchPanel />
          </TabsContent>

          <TabsContent value="prompts">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Prompt management coming soon.</p>
              <p className="text-xs">Configure system prompts and version them here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
