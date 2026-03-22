import { Outlet, useParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TenantProvider } from "@/contexts/TenantContext";
import { LeftSidebarNav } from "./LeftSidebarNav";
import { TopBar } from "./TopBar";
import { TestChatWidget } from "@/components/test-chat/TestChatWidget";
import { useEscalationWatcher } from "@/hooks/useEscalationWatcher";

function EscalationWatcher() {
  const { env } = useParams<{ env: string }>();
  useEscalationWatcher(env ?? "dev");
  return null;
}

export function AppShell() {
  return (
    <TenantProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <LeftSidebarNav />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 p-6 overflow-auto">
              <EscalationWatcher />
              <Outlet />
            </main>
          </div>
        </div>
        <TestChatWidget />
      </SidebarProvider>
    </TenantProvider>
  );
}
