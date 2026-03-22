import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, FlaskConical, FileText, LayoutList, LayoutGrid, BookCheck } from "lucide-react";
import { CuratedKbTable } from "@/components/knowledge/CuratedKbTable";
import { PageHeader } from "@/components/platform/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { getKbItems, type KbFilters, type KnowledgeBaseItem } from "@/lib/mock-kb";
import { KbTable } from "@/components/knowledge/KbTable";
import { KbFiltersBar, type KbFilterState } from "@/components/knowledge/KbFiltersBar";
import { TestbenchPanel } from "@/components/knowledge/TestbenchPanel";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";
import { ErrorPanel } from "@/components/platform/ErrorPanel";
import { useKbItems, usePublishedCuratedQuestions } from "@/hooks/useKbItems";
import { KbCardView } from "@/components/knowledge/KbCardView";

function mapLiveRow(row: any): KnowledgeBaseItem {
  return {
    id: row.id ?? "",
    tenantId: "realx",
    env: "dev",
    category: row.category ?? "",
    question: row.question ?? "",
    answer: row.answer ?? "",
    keywords: Array.isArray(row.keywords)
      ? row.keywords
      : typeof row.keywords === "string"
        ? row.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
        : [],
    sourceUrl: row.source_url ?? "",
    lastUpdated: row.updated_at ?? row.created_at ?? "",
    status: row.status ?? "Draft",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    versions: [],
    adminReferenceAnswer: row.admin_reference_answer ?? null,
    adminReviewedAt: row.admin_reviewed_at ?? null,
    adminReviewerId: row.admin_reviewer_id ?? null,
    n8nSyncedAt: row.n8n_synced_at ?? null,
    n8nSyncStatus: row.n8n_sync_status ?? "never",
  };
}

export default function TrainPage() {
  const { env } = useParams<{ env: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const role = session?.user.role;
  const isAuditor = role === "Auditor";
  const canCreate = role === "KnowledgeManager" || role === "OpsManager" || role === "SuperAdmin";

  const [tab, setTab] = useState("kb");
  const [filters, setFilters] = useState<KbFilterState>({ q: "", status: "", category: "" });
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [kbView, setKbView] = useState<"list" | "cards">(() => {
    return (localStorage.getItem("rxchat_kb_view") as "list" | "cards") ?? "list";
  });

  const handleKbViewChange = (v: "list" | "cards") => {
    setKbView(v);
    localStorage.setItem("rxchat_kb_view", v);
  };

  const { data: liveData, isLoading, error, refetch } = useKbItems();
  const { data: curatedQuestions } = usePublishedCuratedQuestions();

  const items = useMemo(() => {
    let source: KnowledgeBaseItem[];
    if (liveData && liveData.length > 0) {
      source = liveData.map(mapLiveRow);
    } else {
      const f: KbFilters = { q: filters.q || undefined };
      if (filters.status && (filters.status as string) !== "all-statuses") f.status = filters.status;
      if (filters.category) f.category = filters.category;
      return getKbItems(env ?? "dev", f);
    }

    return source.filter((item) => {
      if (filters.q && !item.question.toLowerCase().includes(filters.q.toLowerCase()) && !item.answer.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.status && (filters.status as string) !== "all-statuses" && item.status !== filters.status) return false;
      if (filters.category && item.category !== filters.category) return false;
      return true;
    });
  }, [env, filters, liveData]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Train / Knowledge" subtitle="Manage knowledge bases, FAQs, and training data." />
        <div className="px-6 py-4"><LoadingSkeleton /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Train / Knowledge" subtitle="Manage knowledge bases, FAQs, and training data." />
        <div className="px-6 py-4"><ErrorPanel onRetry={() => refetch()} /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Train / Knowledge" subtitle="Manage knowledge bases, FAQs, and training data." />
      <div className="px-6 py-4 space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="kb">Knowledge Base</TabsTrigger>
              <TabsTrigger value="testbench"><FlaskConical className="h-3.5 w-3.5 mr-1" />Testbench</TabsTrigger>
              <TabsTrigger value="curated"><BookCheck className="h-3.5 w-3.5 mr-1" />Curated</TabsTrigger>
              <TabsTrigger value="prompts"><FileText className="h-3.5 w-3.5 mr-1" />Prompts</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              {tab === "kb" && (
                <div className="flex rounded-md border border-border overflow-hidden">
                  <button
                    onClick={() => handleKbViewChange("list")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${kbView === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                  >
                    <LayoutList className="h-3.5 w-3.5" /> List
                  </button>
                  <button
                    onClick={() => handleKbViewChange("cards")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${kbView === "cards" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" /> Cards
                  </button>
                </div>
              )}
              {tab === "kb" && canCreate && (
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => navigate(`/realx/${env}/train/kb/new`)}>
                  <Plus className="h-3.5 w-3.5" /> New Item
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="kb" className="space-y-3">
            <KbFiltersBar filters={filters} onChange={setFilters} />
            {kbView === "list" ? (
              <KbTable items={items} isAuditor={isAuditor} curatedQuestions={curatedQuestions} />
            ) : (
              <KbCardView
                items={items}
                onClearFilters={() => setFilters({ q: "", status: "", category: "" })}
              />
            )}
          </TabsContent>

          <TabsContent value="curated">
            <CuratedKbTable />
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
