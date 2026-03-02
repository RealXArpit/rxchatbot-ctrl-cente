import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/platform/AppShell";
import ModulePage from "@/pages/platform/ModulePage";
import PlatformNotFound from "@/pages/platform/PlatformNotFound";
import LoginPage from "@/pages/LoginPage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const MODULES = [
  "overview", "train", "monitoring", "chat-logs",
  "escalations", "feedback", "configuration",
  "integrations", "users", "audit",
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/realx/dev/overview" replace />} />

          {/* Environment redirects */}
          <Route path="/realx" element={<Navigate to="/realx/dev/overview" replace />} />
          <Route path="/realx/dev" element={<Navigate to="/realx/dev/overview" replace />} />
          <Route path="/realx/prod" element={<Navigate to="/realx/prod/overview" replace />} />

          {/* Platform shell */}
          <Route path="/realx/:env" element={<AppShell />}>
            <Route path=":module" element={<ModulePage />} />
            <Route path="not-found" element={<PlatformNotFound />} />
            <Route path="*" element={<PlatformNotFound />} />
          </Route>

          {/* Standalone pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
