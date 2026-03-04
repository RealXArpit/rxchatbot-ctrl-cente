import { useState, useCallback } from "react";
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
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function KbDetailPage() {
  const { kbId, env } = useParams<{ kbId: string; env: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const role = session?.user.role;
  const isNew = kbId === "new";
  const isAuditor = role === "Auditor";
  const isSupportAgent = role === "SupportAgent";
  const canEdit = role === "KnowledgeManager" || role === "OpsManager" || role === "SuperAdmin";

  const [item, setItem] = useState<KnowledgeBaseItem | null>(() => isNew ? null : getKbById(kbId ?? ""));
  const [editing, setEditing] = useState(isNew);

  const refresh = useCallback(() => {
    if (!isNew && kbId) setItem(getKbById(kbId));
  }, [kbId, isNew]);

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
