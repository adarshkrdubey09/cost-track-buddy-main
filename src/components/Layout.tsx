import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const userEmail = localStorage.getItem("userloginname");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-12 flex items-center border-b border-border bg-card/80 backdrop-blur px-3 sm:px-4">
            <SidebarTrigger className="mr-2 sm:mr-4" />
            <div className="flex-1" />
            <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-32 sm:max-w-none">
              <span className="hidden sm:inline">Welcome, </span>{userEmail}
            </span>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};