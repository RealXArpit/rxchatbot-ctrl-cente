import { useParams, Navigate } from "react-router-dom";
import { PageHeader } from "@/components/platform/PageHeader";
import { EmptyStatePanel } from "@/components/platform/EmptyStatePanel";
import { RequireRole } from "@/components/platform/RequireRole";
import { routeMetadata } from "@/lib/mock-api";
import OverviewPage from "./OverviewPage";
import ChatLogsPage from "./ChatLogsPage";
import EscalationsPage from "./EscalationsPage";
import TrainPage from "./TrainPage";
import MonitoringPage from "./MonitoringPage";

const moduleMeta: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "High-level metrics and system health at a glance." },
  train: { title: "Train / Knowledge", subtitle: "Manage knowledge bases, FAQs, and training data." },
  monitoring: { title: "Monitoring", subtitle: "Real-time bot performance and system metrics." },
  "chat-logs": { title: "Chat Logs", subtitle: "Browse and search conversation transcripts." },
  escalations: { title: "Manual Escalations", subtitle: "Review and resolve escalated conversations." },
  feedback: { title: "Feedback", subtitle: "User satisfaction scores and feedback entries." },
  configuration: { title: "Configuration", subtitle: "Bot behavior, prompts, and workflow settings." },
  integrations: { title: "Integrations", subtitle: "Manage third-party connections and credentials." },
  users: { title: "Users & Roles", subtitle: "Team members, roles, and permissions." },
  audit: { title: "Audit", subtitle: "Activity log of all system changes." },
};

export default function ModulePage() {
  const { module, env } = useParams<{ module: string; env: string }>();
  const meta = moduleMeta[module ?? ""];

  if (!meta) {
    return <Navigate to={`/realx/${env}/not-found`} replace />;
  }

  if (module === "overview") return <OverviewPage />;
  if (module === "chat-logs") return <ChatLogsPage />;
  if (module === "escalations") return <EscalationsPage />;
  if (module === "train") return <TrainPage />;
  if (module === "monitoring") return <MonitoringPage />;

  const allowedRoles = routeMetadata[module!]?.allowedRoles ?? [];

  return (
    <RequireRole allowedRoles={allowedRoles}>
      <div>
        <PageHeader title={meta.title} subtitle={meta.subtitle} />
        <EmptyStatePanel />
      </div>
    </RequireRole>
  );
}
