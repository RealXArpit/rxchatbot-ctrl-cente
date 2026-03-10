import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/platform/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { getKbById, createKbItem, updateKbItem, type KnowledgeBaseItem } from "@/lib/mock-kb";
import { KbEditor } from "@/components/knowledge/KbEditor";
import { KbApprovalPanel } from "@/components/knowledge/KbApprovalPanel";
import { VersionTimeline } from "@/components/knowledge/VersionTimeline";
import { AdminTrainingPanel } from "@/components/knowledge/AdminTrainingPanel";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { Role } from "@/lib/mock-api";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";
import { ErrorPanel } from "@/components/platform/ErrorPanel";
import { useKbItems, useUpdateKbItem } from "@/hooks/useKbItems";

const ADMIN_PANEL_ROLES: Role[] = ["KnowledgeManager", "OpsManager", "SuperAdmin"];

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

export default function KbDetailPage() {
  const { kbId, env } = useParams<{ kbId: string; env: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const role = session?.user.role as Role;
  const isNew = kbId === "new";
  const isAuditor = role === "Auditor";
  const isSupportAgent = role === "SupportAgent";
  const canEdit = role === "KnowledgeManager" || role === "OpsManager" || role === "SuperAdmin";
  const showAdminPanel = !isNew && ADMIN_PANEL_ROLES.includes(role);

  const { data: liveData, isLoading, error, refetch } = useKbItems();
  const updateMutation = useUpdateKbItem();

  const liveItem = useMemo(() => {
    if (!liveData || !kbId || isNew) return null;
    const row = liveData.find((r: any) => r.id === kbId);
    return row ? mapLiveRow(row) : null;
  }, [liveData, kbId, isNew]);

  const [mockItem, setMockItem] = useState<KnowledgeBaseItem | null>(() => isNew ? null : getKbById(kbId ?? ""));
  const item = liveItem ?? mockItem;

  const [editing, setEditing] = useState(isNew);

  const refresh = useCallback(() => {
    refetch();
    if (!isNew && kbId) setMockItem(getKbById(kbId));
  }, [kbId, isNew, refetch]);

  if (isLoading && !isNew) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !isNew) {
    return (
      <div className="p-6">
        <ErrorPanel onRetry={() => refetch()} />
      </div>
    );
  }

  if (!isNew && !item) {
    return (
      <div className="p-6">
        <PageHeader title="Item Not Found" subtitle="This knowledge base item does not exist." />
        <Button variant="outline" onClick={() => navigate(`/realx/${env}/train`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>
    );
  }

  const handleSave = (data: { category: string; question: string; answer: string; keywords: string; sourceUrl: string }) => {
    const kws = data.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);

    // Try Supabase mutation for existing items
    if (!isNew && item) {
      updateMutation.mutate(
        {
          id: item.id,
          category: data.category,
          question: data.question,
          answer: data.answer,
          keywords: data.keywords,
        },
        {
          onSuccess: () => {
            toast.success("KB item saved to database");
            setEditing(false);
          },
          onError: () => {
            // Fallback to mock
            updateKbItem(item.id, { ...data, keywords: kws }, session!.user.id);
            toast.success("KB item updated (local)");
            refresh();
            setEditing(false);
          },
        }
      );
      return;
    }

    if (isNew) {
      const created = createKbItem(env ?? "dev", { ...data, keywords: kws, sourceUrl: data.sourceUrl }, session!.user.id, session!.user.name);
      toast.success("KB item created");
      navigate(`/realx/${env}/train/kb/${created.id}`, { replace: true });
    } else {
      updateKbItem(item!.id, { ...data, keywords: kws }, session!.user.id);
      toast.success("KB item updated");
      refresh();
      setEditing(false);
    }
  };

  const handleSyncUpdate = (updates: Partial<KnowledgeBaseItem>) => {
    if (item) {
      Object.assign(item, updates);
      setMockItem({ ...item });
    }
  };

  const formData = item ? {
    category: item.category,
    question: item.question,
    answer: item.answer,
    keywords: item.keywords.join(", "),
    sourceUrl: item.sourceUrl,
  } : undefined;

  return (
    <div>
      <div className="px-6 pt-4 pb-2">
        <Button variant="ghost" size="sm" className="gap-1 mb-2 text-xs" onClick={() => navigate(`/realx/${env}/train`)}>
          <ArrowLeft className="h-3.5 w-3.5" /> Knowledge Base
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{isNew ? "New KB Item" : item!.id}</h1>
      </div>

      <div className="px-6 py-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{editing ? "Edit" : "Details"}</CardTitle>
                {!editing && canEdit && !isNew && item?.status === "Draft" && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditing(true)}>Edit</Button>
                )}
                {isSupportAgent && !isNew && (
                  <Button size="sm" variant="outline" className="text-xs" disabled>Suggest Edit</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <KbEditor
                  initial={formData}
                  onSave={handleSave}
                  onCancel={() => isNew ? navigate(`/realx/${env}/train`) : setEditing(false)}
                  kbId={item?.id}
                  isNew={isNew}
                />
              ) : (
                <KbEditor initial={formData} onSave={() => {}} onCancel={() => {}} readOnly />
              )}
            </CardContent>
          </Card>
        </div>

        {!isNew && item && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Approval Pipeline</CardTitle></CardHeader>
              <CardContent>
                <KbApprovalPanel item={item} onUpdate={refresh} />
              </CardContent>
            </Card>

            {showAdminPanel && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Admin Training</CardTitle></CardHeader>
                <CardContent>
                  <AdminTrainingPanel item={item} onSyncUpdate={handleSyncUpdate} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-4 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="tabular-nums">{new Date(item.createdAt).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span className="tabular-nums">{new Date(item.updatedAt).toLocaleString()}</span></div>
                <div className="pt-1">
                  <Link to={`/realx/${env}/audit`} className="text-primary text-xs flex items-center gap-1 hover:underline">
                    <ExternalLink className="h-3 w-3" /> Audit Trail
                  </Link>
                </div>
              </CardContent>
            </Card>

            <VersionTimeline versions={item.versions} />
          </div>
        )}
      </div>
    </div>
  );
}
