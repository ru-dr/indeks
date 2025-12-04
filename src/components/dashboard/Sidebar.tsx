"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  FileText,
  Globe,
  FolderKanban,
  X,
  BookUp2,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "next-themes";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Realtime Traffic",
    href: "/realtime-traffic",
    icon: Globe,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BookUp2,
  },
  {
    name: "Documentation",
    href: "/docs",
    icon: FileText,
  },
  {
    name: "Journeys",
    href: "/journeys",
    icon: Route,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>("");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className="flex h-full w-full flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 sm:h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
        <Image
          src={logoSrc}
          alt="INDEKS Logo"
          width={100}
          height={24}
          priority
          className="w-20 sm:w-[100px] h-auto"
        />
        {/* Close button for mobile */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="shrink-0 border-t p-3 sm:p-4">
        <Link
          href="/profile"
          onClick={handleLinkClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName || "User"}</p>
            <p className="text-xs text-muted-foreground">View profile</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
