"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  FileText,
  Activity,
  Globe,
  TrendingUp,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
    name: "Real-time",
    href: "/realtime",
    icon: Activity,
  },
  {
    name: "Traffic Sources",
    href: "/traffic",
    icon: Globe,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "Events",
    href: "/events",
    icon: TrendingUp,
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Image
            src="/assets/images/svgs/INDEKS-dark.svg"
            alt="INDEKS Logo"
            width={120}
            height={30}
            priority
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t p-4">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Profile</p>
              <p className="text-xs text-muted-foreground">View profile</p>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
