"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Clapperboard, Calendar, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/projects", icon: Clapperboard, label: "Projects" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/assets", icon: FolderOpen, label: "Assets" },
  { to: "/contacts", icon: Users, label: "Contacts" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? pathname === "/"
              : pathname === item.to || pathname.startsWith(item.to + "/");

          return (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg",
                "min-w-[56px] min-h-[48px] touch-manipulation transition-colors",
                isActive
                  ? "text-blue-600"
                  : "text-muted-foreground active:bg-muted"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
              <span className="text-xs font-medium truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
