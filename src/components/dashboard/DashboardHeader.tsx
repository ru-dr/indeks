"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(true);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await authClient.getSession();
      if (data?.user?.name) {
        setUserName(data.user.name);
      }
    };
    loadUser();
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "light"
      ? "/assets/images/svgs/INDEKS-light.svg"
      : "/assets/images/svgs/INDEKS-dark.svg";

  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-4 md:px-6">
      {/* Menu button - visible on mobile/tablet, hidden on lg+ */}
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Image
          src={logoSrc}
          alt="INDEKS Logo"
          width={80}
          height={19}
          priority
          className="h-5 w-auto"
        />
      </div>

      {/* Search (Desktop) & Spacer */}
      <div className="flex-1 flex items-center justify-end lg:justify-center px-4">
        <div className="hidden lg:block w-full max-w-sm">
          <GlobalSearch />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Mobile search */}
        <div className="lg:hidden">
          <GlobalSearch trigger="icon" />
        </div>

        {/* Notifications */}
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

        {/* User Profile */}
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
            {userName || "User"}
          </span>
        </Link>
      </div>
    </header>
  );
}
