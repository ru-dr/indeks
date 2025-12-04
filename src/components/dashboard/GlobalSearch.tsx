"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogPopup } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Globe,
  FileText,
  TrendingUp,
  Settings,
  ShoppingCart,
  Smartphone,
  User,
  Search,
  ArrowRight,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Calendar,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  href?: string;
  category: "Navigation" | "Projects" | "Commands" | "Actions" | "Recent";
  keywords?: string[];
  action?: () => void;
  type: "navigation" | "command" | "action";
}

const navigationItems: SearchItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "View your analytics overview",
    icon: LayoutDashboard,
    href: "/",
    category: "Navigation",
    type: "navigation",
  },
  {
    id: "projects",
    title: "Projects",
    description: "Manage all your projects",
    icon: FolderKanban,
    href: "/projects",
    category: "Navigation",
    type: "navigation",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "View detailed analytics",
    icon: BarChart3,
    href: "/analytics",
    category: "Navigation",
    type: "navigation",
  },
  {
    id: "realtime-traffic",
    title: "Realtime Traffic",
    description: "Monitor live traffic",
    icon: Globe,
    href: "/realtime-traffic",
    category: "Navigation",
    type: "navigation",
  },
  {
    id: "reports",
    title: "Reports",
    description: "Generate and view reports",
    icon: FileText,
    href: "/reports",
    category: "Navigation",
    type: "navigation",
  },
  {
    id: "events",
    title: "Events",
    description: "Track user events",
    icon: TrendingUp,
    href: "/events",
    category: "Navigation",
    type: "navigation",
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure your account",
    icon: Settings,
    href: "/settings",
    category: "Navigation",
    type: "navigation",
  },
  {
    id: "profile",
    title: "Profile",
    description: "View your profile",
    icon: User,
    href: "/profile",
    category: "Navigation",
    type: "navigation",
  },
];

const projectItems: SearchItem[] = [
  {
    id: "project-1",
    title: "E-commerce Platform",
    description: "Main online store project",
    icon: ShoppingCart,
    href: "/projects/1",
    category: "Projects",
    type: "navigation",
  },
  {
    id: "project-2",
    title: "Mobile App Analytics",
    description: "iOS and Android app tracking",
    icon: Smartphone,
    href: "/projects/2",
    category: "Projects",
    type: "navigation",
  },
  {
    id: "project-3",
    title: "Blog Website",
    description: "Content management system",
    icon: FileText,
    href: "/projects/3",
    category: "Projects",
    type: "navigation",
  },
];

const commandItems: SearchItem[] = [
  {
    id: "create-project",
    title: "Create New Project",
    description: "Start a new analytics project",
    icon: Plus,
    category: "Commands",
    type: "command",
    action: () => {
      // Navigate to projects page with create modal
      window.location.href = "/projects?create=true";
    },
  },
  {
    id: "generate-report",
    title: "Generate Report",
    description: "Create a new analytics report",
    icon: Download,
    category: "Commands",
    type: "command",
    action: () => {
      // Navigate to reports page with generate modal
      window.location.href = "/reports?generate=true";
    },
  },
  {
    id: "export-data",
    title: "Export Data",
    description: "Export analytics data to CSV",
    icon: Upload,
    category: "Commands",
    type: "command",
    action: () => {
      // Trigger data export
      alert("Data export started. You'll receive an email when ready.");
    },
  },
  {
    id: "refresh-data",
    title: "Refresh Data",
    description: "Sync latest analytics data",
    icon: RefreshCw,
    category: "Commands",
    type: "command",
    action: () => {
      // Trigger data refresh
      alert("Data refresh initiated. This may take a few minutes.");
    },
  },
  {
    id: "view-insights",
    title: "View Insights",
    description: "AI-powered analytics insights",
    icon: Zap,
    category: "Commands",
    type: "command",
    action: () => {
      // Navigate to insights page
      window.location.href = "/analytics?tab=insights";
    },
  },
  {
    id: "schedule-report",
    title: "Schedule Report",
    description: "Set up automated report delivery",
    icon: Calendar,
    category: "Commands",
    type: "command",
    action: () => {
      // Navigate to scheduled reports
      window.location.href = "/reports?tab=scheduled";
    },
  },
  {
    id: "view-realtime",
    title: "View Realtime Data",
    description: "Monitor live user activity",
    icon: Activity,
    category: "Commands",
    type: "command",
    action: () => {
      // Navigate to realtime traffic
      window.location.href = "/realtime-traffic";
    },
  },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const allItems = [...navigationItems, ...projectItems, ...commandItems];

  const filteredItems = query
    ? allItems.filter((item) => {
        const searchText =
          `${item.title} ${item.description || ""} ${item.keywords?.join(" ") || ""}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
    : allItems;

  // Smart project creation: if user types "project" and project name doesn't exist
  const isProjectQuery =
    query.toLowerCase().includes("project") && filteredItems.length === 0;
  const showCreateProject = isProjectQuery && query.trim().length > 7;

  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, SearchItem[]>,
  );

  const handleSelect = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      setQuery("");

      if (item.type === "command" && item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
      }
    },
    [router],
  );

  const handleCreateProject = useCallback(() => {
    setOpen(false);
    setQuery("");
    window.location.href = "/projects?create=true";
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev,
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (showCreateProject) {
          handleCreateProject();
        } else if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [
    open,
    selectedIndex,
    filteredItems,
    handleSelect,
    showCreateProject,
    handleCreateProject,
  ]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border bg-background px-2 sm:px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground w-full"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">Search...</span>
        <div className="hidden sm:flex items-center gap-1">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </div>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup
          className="max-w-[calc(100vw-2rem)] sm:max-w-2xl p-0 overflow-hidden mx-4 sm:mx-auto"
          showCloseButton={false}
        >
          <div className="border-b">
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base"
                autoFocus
              />
              <Kbd className="hidden sm:inline-flex">ESC</Kbd>
            </div>
          </div>

          <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto p-2">
            {showCreateProject ? (
              <div className="p-2">
                <button
                  onClick={handleCreateProject}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors w-full bg-accent text-accent-foreground"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Plus
                      className="h-5 w-5"
                      style={{ color: "var(--color-indeks-blue)" }}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Create New Project</p>
                    <p className="text-xs text-muted-foreground">
                      No project found. Press Enter to create one
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : Object.keys(groupedItems).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  No results found for &quot;{query}&quot;
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <>
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const globalIndex = filteredItems.indexOf(item);
                        const isSelected = globalIndex === selectedIndex;
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors w-full",
                              isSelected
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg",
                                isSelected ? "bg-primary/10" : "bg-secondary",
                              )}
                            >
                              <Icon
                                className="h-5 w-5"
                                style={
                                  isSelected
                                    ? { color: "var(--color-indeks-blue)" }
                                    : {}
                                }
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium">{item.title}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/50 px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>↵</Kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>ESC</Kbd>
                <span>Close</span>
              </div>
            </div>
            <div className="sm:hidden text-muted-foreground">
              Tap to select
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]">
                {filteredItems.length} results
              </span>
            </div>
          </div>
        </DialogPopup>
      </Dialog>
    </>
  );
}
