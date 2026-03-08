import { PageHeader } from "@/components/platform/PageHeader";
import { RequireRole } from "@/components/platform/RequireRole";
import { routeMetadata } from "@/lib/mock-api";
import { FeedbackSummaryCards } from "@/components/feedback/FeedbackSummaryCards";
import { FeedbackTable } from "@/components/feedback/FeedbackTable";
import { KbScoreLeaderboard } from "@/components/feedback/KbScoreLeaderboard";

export default function FeedbackPage() {
  return (
    <RequireRole allowedRoles={routeMetadata.feedback.allowedRoles}>
      <div className="space-y-6">
        <PageHeader title="Feedback" subtitle="User satisfaction scores and feedback entries." />
        <FeedbackSummaryCards />
        <KbScoreLeaderboard />
        <FeedbackTable />
      </div>
    </RequireRole>
  );
}
