"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { QuickActions } from "./QuickActions";
import { useAuth } from "@/contexts/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // If this is an external client portal route, bypass the internal CRM layout chrome
  if (pathname?.startsWith("/client/")) {
    return <>{children}</>;
  }

  // If on the login page, just render children without chrome
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Auth Guard
  if (!loading && !isAuthenticated) {
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
        <MobileBottomNav />
        <QuickActions />
      </div>
    </div>
  );
}
