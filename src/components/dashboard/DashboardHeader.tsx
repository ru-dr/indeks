"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-4 md:px-6">
      {/* Menu button - visible on mobile/tablet, hidden on lg+ */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0 h-9 w-9"
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search - grows to fill available space */}
      <div className="flex-1 max-w-md min-w-0">
        <GlobalSearch />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9"
          aria-label="Notifications"
        >
          <Bell
            className="h-5 w-5"
            style={{ color: "var(--color-indeks-yellow)" }}
          />
        </Button>
      </div>
    </header>
  );
}
