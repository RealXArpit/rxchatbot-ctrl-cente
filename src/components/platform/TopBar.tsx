import { SidebarTrigger } from "@/components/ui/sidebar";
import { EnvironmentSelector } from "./EnvironmentSelector";
import { OrgTeamSwitcher } from "./OrgTeamSwitcher";
import { UserMenu } from "./UserMenu";
import { RoleBadge } from "./RoleBadge";
import { SecurityBanner } from "./SecurityBanner";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";

export function TopBar() {
  const { session } = useAuth();

  return (
    <div className="shrink-0">
      <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-muted-foreground" />
          <div className="h-5 w-px bg-border" />
          <OrgTeamSwitcher />
        </div>
        <div className="flex items-center gap-3">
          {session && <RoleBadge role={session.user.role} />}
          <EnvironmentSelector />
          <div className="h-5 w-px bg-border" />
          <button className="relative text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
          </button>
          <UserMenu />
        </div>
      </header>
      <SecurityBanner />
    </div>
  );
}
