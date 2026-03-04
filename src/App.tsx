import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/platform/RequireAuth";
import { AppShell } from "@/components/platform/AppShell";
import ModulePage from "@/pages/platform/ModulePage";
import ConversationDetailPage from "@/pages/platform/ConversationDetailPage";
import EscalationDetailPage from "@/pages/platform/EscalationDetailPage";
import KbDetailPage from "@/pages/platform/KbDetailPage";
import PlatformNotFound from "@/pages/platform/PlatformNotFound";
import PlatformForbidden from "@/pages/platform/ForbiddenPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/realx/dev/overview" replace />} />

            {/* Environment redirects */}
            <Route path="/realx" element={<Navigate to="/realx/dev/overview" replace />} />
            <Route path="/realx/dev" element={<Navigate to="/realx/dev/overview" replace />} />
            <Route path="/realx/prod" element={<Navigate to="/realx/prod/overview" replace />} />

            {/* Platform shell — requires auth */}
            <Route
              path="/realx/:env"
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="chat-logs/:conversationId" element={<ConversationDetailPage />} />
              <Route path="escalations/:ticketId" element={<EscalationDetailPage />} />
              <Route path="train/kb/:kbId" element={<KbDetailPage />} />
              <Route path=":module" element={<ModulePage />} />
              <Route path="forbidden" element={<PlatformForbidden />} />
              <Route path="not-found" element={<PlatformNotFound />} />
              <Route path="*" element={<PlatformNotFound />} />
            </Route>

            {/* Public pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
