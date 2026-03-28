import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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

function KbPaginationBar({
  page, totalPages, pageSize, totalItems,
  onPageChange, onPageSizeChange,
}: {
  page: number; totalPages: number; pageSize: number; totalItems: number;
  onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
}) {
  if (totalItems === 0) return null;

  const getPages = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };
    add(1);
    if (page > 3) pages.push("...");
    if (page > 2) add(page - 1);
    add(page);
    if (page < totalPages - 1) add(page + 1);
    if (page < totalPages - 2) pages.push("...");
    add(totalPages);
    return pages;
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between flex-wrap gap-2 py-1 pr-36">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {from}–{to} of {totalItems}
        </span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {[10, 25, 50, 100].map(s => (
            <option key={s} value={s}>{s} / page</option>
          ))}
        </select>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="h-7 w-7 rounded-md border border-input text-xs flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
          >‹</button>

          {getPages().map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="h-7 w-7 flex items-center justify-center text-xs text-muted-foreground">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`h-7 w-7 rounded-md border text-xs flex items-center justify-center transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input hover:bg-muted"
                }`}
              >{p}</button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="h-7 w-7 rounded-md border border-input text-xs flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
          >›</button>
        </div>
      )}
    </div>
  );
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
  const [sortBy, setSortBy] = useState<"created" | "updated">("created");

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = [10, 25, 50, 100].includes(parseInt(searchParams.get("size") ?? "25", 10))
    ? parseInt(searchParams.get("size") ?? "25", 10)
    : 25;

  const setPage = (p: number) => setSearchParams(prev => { const n = new URLSearchParams(prev); n.set("page", String(p)); return n; }, { replace: true });
  const setPageSize = (s: number) => setSearchParams(prev => { const n = new URLSearchParams(prev); n.set("size", String(s)); n.set("page", "1"); return n; }, { replace: true });

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

    source = source.filter((item) => {
      if (filters.q && !item.question.toLowerCase().includes(filters.q.toLowerCase()) && !item.answer.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.status && (filters.status as string) !== "all-statuses" && item.status !== filters.status) return false;
      if (filters.category && item.category !== filters.category) return false;
      return true;
    });

    if (sortBy === "updated") {
      source.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return source;
  }, [env, filters, liveData, sortBy]);

  const prevQRef = useRef(filters.q);
  useEffect(() => {
    if (filters.q !== prevQRef.current) {
      setPage(1);
      prevQRef.current = filters.q;
    }
  }, [filters.q]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

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
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as "created" | "updated")}
                  className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="created">Newest first</option>
                  <option value="updated">Recently edited</option>
                </select>
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
              <>
                <KbPaginationBar
                  page={page} totalPages={totalPages} pageSize={pageSize} totalItems={items.length}
                  onPageChange={setPage} onPageSizeChange={setPageSize}
                />
                <KbTable items={pagedItems} isAuditor={isAuditor} curatedQuestions={curatedQuestions} startIndex={(page - 1) * pageSize} />
                <KbPaginationBar
                  page={page} totalPages={totalPages} pageSize={pageSize} totalItems={items.length}
                  onPageChange={setPage} onPageSizeChange={setPageSize}
                />
              </>
            ) : (
              <KbCardView items={items} onClearFilters={() => setFilters({ q: "", status: "", category: "" })} />
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
