"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogPopup } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  LayoutDashboard,
  FolderKanban,
  Globe,
  Settings,
  Search,
  ArrowRight,
  Plus,
  BarChart3,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { appEvents, EVENTS } from "@/lib/events";

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  href?: string;
  category: "Navigation" | "Commands";
  keywords?: string[];
  action?: () => void;
  type: "navigation" | "command";
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
    id: "uptime",
    title: "Uptime",
    description: "Monitor website uptime",
    icon: Activity,
    href: "/uptime",
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
];

const commandItems: SearchItem[] = [
  {
    id: "create-project",
    title: "Create New Project",
    description: "Start a new analytics project",
    icon: Plus,
    category: "Commands",
    type: "command",
    keywords: ["new", "add", "project", "create"],
  },
];

function SearchContent({
  query,
  setQuery,
  filteredItems,
  groupedItems,
  selectedIndex,
  setSelectedIndex,
  showCreateProject,
  handleSelect,
  handleCreateProject,
  onClose,
  isMobile = false,
  inputRef,
}: {
  query: string;
  setQuery: (q: string) => void;
  filteredItems: SearchItem[];
  groupedItems: Record<string, SearchItem[]>;
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  showCreateProject: boolean;
  handleSelect: (item: SearchItem) => void;
  handleCreateProject: () => void;
  onClose: () => void;
  isMobile?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      {/* Search Input */}
      <div className={cn("border-b", isMobile ? "px-4 py-3" : "px-4 py-3")}>
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-auto p-0"
            autoFocus={!isMobile}
          />
          {isMobile ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 px-2 text-muted-foreground shrink-0"
            >
              Cancel
            </Button>
          ) : (
            <Kbd>ESC</Kbd>
          )}
        </div>
      </div>

      {/* Results */}
      <div
        className={cn(
          "overflow-y-auto",
          isMobile ? "flex-1 p-2" : "max-h-[400px] p-2",
        )}
      >
        {showCreateProject ? (
          <div className="p-2">
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors w-full bg-accent text-accent-foreground active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Plus
                  className="h-5 w-5"
                  style={{ color: "var(--color-indeks-blue)" }}
                />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium">Create New Project</p>
                <p className="text-xs text-muted-foreground">
                  No project found. Tap to create one
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </div>
        ) : Object.keys(groupedItems).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
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
                <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {category}
                </div>
                <div className="space-y-0.5">
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
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors w-full active:scale-[0.98]",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                            isSelected ? "bg-primary/10" : "bg-secondary",
                          )}
                        >
                          <Icon
                            className="h-[18px] w-[18px]"
                            style={
                              isSelected
                                ? { color: "var(--color-indeks-blue)" }
                                : {}
                            }
                          />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {isSelected && !isMobile && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
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
      <div
        className={cn(
          "border-t bg-muted/50 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground",
          isMobile ? "pb-[calc(0.5rem+env(safe-area-inset-bottom))]" : "",
        )}
      >
        {isMobile ? (
          <span className="text-[11px]">
            {filteredItems.length} result
            {filteredItems.length !== 1 ? "s" : ""}
          </span>
        ) : (
          <>
            <div className="flex items-center gap-4">
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
            <span className="text-[11px] tabular-nums">
              {filteredItems.length} result
              {filteredItems.length !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>
    </>
  );
}

export function GlobalSearch({
  trigger = "button",
}: {
  trigger?: "button" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const allItems = [...navigationItems, ...commandItems];

  const filteredItems = query
    ? allItems.filter((item) => {
        const searchText =
          `${item.title} ${item.description || ""} ${item.keywords?.join(" ") || ""}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
    : allItems;

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
      setSelectedIndex(0);

      if (item.id === "create-project") {
        appEvents.emit(EVENTS.OPEN_CREATE_PROJECT_DIALOG);
      } else if (item.href) {
        router.push(item.href);
      } else if (item.action) {
        item.action();
      }
    },
    [router],
  );

  const handleCreateProject = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
    appEvents.emit(EVENTS.OPEN_CREATE_PROJECT_DIALOG);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
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
        setSelectedIndex(0);
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

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setSelectedIndex(0);
  };

  const sharedProps = {
    query,
    setQuery: handleQueryChange,
    filteredItems,
    groupedItems,
    selectedIndex,
    setSelectedIndex,
    showCreateProject,
    handleSelect,
    handleCreateProject,
    onClose: handleClose,
  };

  return (
    <>
      {/* Search Trigger Button */}
      {trigger === "button" ? (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full justify-start text-muted-foreground font-normal"
        >
          <Search className="mr-2 h-4 w-4 shrink-0" />
          <span className="flex-1 text-left truncate">Search...</span>
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </div>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="h-9 w-9"
        >
          <Search className="h-5 w-5" />
        </Button>
      )}

      {/* Mobile: Bottom Sheet */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50">
          {/* Backdrop - no blur on mobile to prevent glitches with keyboard */}
          <div
            className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
            onClick={handleClose}
          />
          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col bg-popover border-t rounded-t-2xl max-h-[85vh] animate-in slide-in-from-bottom duration-300">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <SearchContent
              {...sharedProps}
              isMobile
              inputRef={mobileInputRef}
            />
          </div>
        </div>
      )}

      {/* Desktop: Centered Dialog */}
      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setQuery("");
            setSelectedIndex(0);
          }
        }}
      >
        <DialogPopup
          className="hidden sm:flex sm:flex-col sm:max-w-2xl p-0 overflow-hidden"
          showCloseButton={false}
        >
          <SearchContent {...sharedProps} isMobile={false} />
        </DialogPopup>
      </Dialog>
    </>
  );
}
