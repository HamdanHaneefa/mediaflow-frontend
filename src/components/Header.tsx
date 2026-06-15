"use client";

import { Bell, Search, Menu, ChevronDown, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "U";

  return (
    <header className="h-20 bg-background flex items-center justify-between px-6 z-40 shadow-xs border-b border-border">
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden min-h-[44px] min-w-[44px]"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex-1 max-w-xl hidden sm:block">
          <GlobalSearch />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden min-h-[44px] min-w-[44px]"
        >
          <Search className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center gap-6 flex-1 justify-end">
        <div className="relative cursor-pointer">
          <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-full border-2 border-background translate-x-1/2 -translate-y-1/2"></span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer group">
              <Avatar className="w-8 h-8 rounded-full">
                <AvatarImage src={user?.avatar_url || ""} />
                <AvatarFallback className="bg-blue-600 text-white font-medium text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors leading-tight">
                  {user?.full_name || "User"}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-tight">
                  {user?.job_title || user?.system_role || "Agent"}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border border-border shadow-md rounded-xl">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer font-medium">
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-medium">Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 cursor-pointer font-medium focus:text-red-600 focus:bg-red-500/10" onClick={logout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
