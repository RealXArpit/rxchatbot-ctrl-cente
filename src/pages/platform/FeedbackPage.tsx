import { PageHeader } from "@/components/platform/PageHeader";
import { RequireRole } from "@/components/platform/RequireRole";
import { routeMetadata } from "@/lib/mock-api";
import { FeedbackSummaryCards } from "@/components/feedback/FeedbackSummaryCards";
import { FeedbackTable } from "@/components/feedback/FeedbackTable";
import { KbScoreLeaderboard } from "@/components/feedback/KbScoreLeaderboard";
import { KbHealthPanel } from "@/components/feedback/KbHealthPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";
import { Timestamp } from "@/components/platform/Timestamp";
import { useAuth } from "@/contexts/AuthContext";
import { useSuggestedAnswers, useReviewSuggestedAnswer } from "@/hooks/useSuggestedAnswers";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

const statusBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  PENDING:  { variant: "outline",     className: "border-warning text-warning" },
  APPROVED: { variant: "default",     className: "bg-success text-success-foreground" },
  REJECTED: { variant: "destructive", className: "" },
  EXPIRED:  { variant: "secondary",   className: "" },
  APPLIED:  { variant: "default",     className: "bg-primary text-primary-foreground" },
};

const CAN_REVIEW: string[] = ["SuperAdmin", "OpsManager"];

function AdminSuggestionsTab() {
  const { session } = useAuth();
  const { data, isLoading } = useSuggestedAnswers();
  const reviewMutation = useReviewSuggestedAnswer();
  const userEmail = session?.user?.email ?? session?.user?.name ?? "unknown";
  const role = session?.user?.role ?? "";
  const canReview = CAN_REVIEW.includes(role);

  const handleReview = (id: string, status: "APPROVED" | "REJECTED") => {
    reviewMutation.mutate(
      { id, status, reviewed_by: userEmail },
      {
        onSuccess: () => toast.success(`Suggestion ${status.toLowerCase()}`),
        onError: () => toast.error("Failed to update — try again"),
      }
    );
  };

  if (isLoading) return <LoadingSkeleton />;

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No suggestions submitted yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Message</TableHead>
            <TableHead>Suggested Answer</TableHead>
            <TableHead>Suggested By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Suggested At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const badge = statusBadge[row.status] ?? statusBadge.PENDING;
            const isPending = row.status === "PENDING";
            const isOwnSuggestion = row.suggested_by === userEmail;
            const showActions = isPending && canReview && !isOwnSuggestion;
            const isReviewing = reviewMutation.isPending;
            return (
              <TableRow key={row.id}>
                <TableCell className="max-w-[160px] text-xs">{truncate(row.user_message, 60)}</TableCell>
                <TableCell className="max-w-[160px] text-xs">{truncate(row.suggested_answer, 60)}</TableCell>
                <TableCell className="text-xs">{row.suggested_by}</TableCell>
                <TableCell>
                  <Badge variant={badge.variant} className={badge.className}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell><Timestamp date={row.suggested_at} /></TableCell>
                <TableCell className="text-right">
                  {showActions && (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 w-7 p-0 text-success hover:text-success"
                        disabled={isReviewing}
                        onClick={() => handleReview(row.id, "APPROVED")}
                      >
                        {isReviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        disabled={isReviewing}
                        onClick={() => handleReview(row.id, "REJECTED")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <RequireRole allowedRoles={routeMetadata.feedback.allowedRoles}>
      <div className="space-y-6">
        <PageHeader title="Feedback" subtitle="User satisfaction scores and feedback entries." />

        <Tabs defaultValue="feedback">
          <TabsList>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="suggestions">Admin Suggestions</TabsTrigger>
            <TabsTrigger value="kb-health">KB Health</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback" className="space-y-6 mt-4">
            <FeedbackSummaryCards />
            <KbScoreLeaderboard />
            <FeedbackTable />
          </TabsContent>

          <TabsContent value="suggestions" className="mt-4">
            <AdminSuggestionsTab />
          </TabsContent>

          <TabsContent value="kb-health" className="mt-4">
            <KbHealthPanel />
          </TabsContent>
        </Tabs>
      </div>
    </RequireRole>
  );
}
