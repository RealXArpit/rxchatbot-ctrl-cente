import {
  LayoutDashboard,
  GraduationCap,
  Activity,
  MessageSquare,
  AlertCircle,
  ThumbsUp,
  Settings,
  Plug,
  Users,
  FileText,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useTenant } from "@/contexts/TenantContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const modules = [
  { title: "Overview", slug: "overview", icon: LayoutDashboard },
  { title: "Train / Knowledge", slug: "train", icon: GraduationCap },
  { title: "Monitoring", slug: "monitoring", icon: Activity },
  { title: "Chat Logs", slug: "chat-logs", icon: MessageSquare },
  { title: "Manual Escalations", slug: "escalations", icon: AlertCircle },
  { title: "Feedback", slug: "feedback", icon: ThumbsUp },
  { title: "Configuration", slug: "configuration", icon: Settings },
  { title: "Integrations", slug: "integrations", icon: Plug },
  { title: "Users & Roles", slug: "users", icon: Users },
  { title: "Audit", slug: "audit", icon: FileText },
];

export function LeftSidebarNav() {
  const { env } = useTenant();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-3 border-b border-sidebar-border">
        <span className="text-lg font-bold tracking-tight text-primary italic">
          {collapsed ? "R" : "RealX"}
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((m) => (
                <SidebarMenuItem key={m.slug}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`/realx/${env}/${m.slug}`}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <m.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{m.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
