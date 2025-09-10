import { LayoutDashboard, Plus, Home, MessageSquare } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/images/RTL-LOGO 1 (1).png"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "New Chat", url: "/chat", icon: MessageSquare },
  { title: "Home", url: "/home", icon: Home },
  { title: "Add Expense", url: "/add-expense", icon: Plus },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <h1 
            className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent cursor-pointer hover:opacity-80"
            onClick={() => navigate("/chat")}
          >
          <div className="flex justify-start items-center">
  <img
    src={Logo}
    alt="logo"
    className="w-28 h-auto md:w-40 md:h-30 object-contain !m-0 !p-0"
    style={{ margin: 0, padding: 0 }}
  />
</div>

          </h1>
        )}
        {isCollapsed && (
          <div 
            className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded cursor-pointer hover:opacity-80"
            onClick={() => navigate("/chat")}
          ></div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout at bottom */}
        <div className="mt-auto p-4">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full"
            size={isCollapsed ? "icon" : "default"}
          >
            {isCollapsed ? "→" : "Logout"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}