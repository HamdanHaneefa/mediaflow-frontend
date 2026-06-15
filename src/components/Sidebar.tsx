"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Clapperboard, Calendar, BarChart3, Video, CheckSquare, FolderOpen, Target, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/contacts", icon: Users, label: "Contacts" },
  { to: "/leads", icon: Target, label: "Leads" },
  { to: "/projects", icon: Clapperboard, label: "Projects" },
  { to: "/accounting", icon: Wallet, label: "Accounting" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/assets", icon: FolderOpen, label: "Assets" },
  { to: "/approvals", icon: CheckSquare, label: "Approvals" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r border-border">
      <div className="p-6 flex items-center">
        <img src="/logo.svg" alt="MediaFlow Logo" className="h-16 w-auto" />
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);

          return (
            <Link
              key={item.label}
              href={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-4 h-4", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card flex-col z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-card border-border">
          <div className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </div>
          <div className="flex flex-col h-full">
            <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
