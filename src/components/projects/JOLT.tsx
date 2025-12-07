"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "@base-ui-components/react/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  Play,
  Pause,
  Trash2,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Copy,
  CheckCircle2,
  Loader2,
  Globe,
  MousePointerClick,
  Eye,
  ScrollText,
  AlertTriangle,
  RefreshCw,
  Clock,
  MapPin,
  Link2,
  Hash,
  Braces,
  Terminal,
  Activity,
  X,
  FormInput,
  Keyboard,
  Move,
  Maximize2,
  LogOut,
  Navigation,
  Percent,
  EyeOff,
  HashIcon,
  MousePointer,
  Hand,
  CircleDot,
  GripVertical,
  TextSelect,
  Angry,
  CircleSlash,
  Video,
  FileDown,
  Printer,
  Share2,
  Gauge,
  Timer,
  Wifi,
  WifiOff,
  RotateCw,
  Tag,
  ExternalLink,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RawEvent {
  event_type: string;
  url: string | null;
  session_id: string | null;
  user_id: string | null;
  user_agent: string | null;
  referrer: string | null;
  metadata: Record<string, any>;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  created_at: string;
}

interface TrackedEvent extends RawEvent {
  _uniqueId: string;
}

interface JOLTProps {
  projectId: string;
  projectName?: string;
}

const eventTypeConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  page_view: { icon: <Eye className="h-3 w-3" />, color: "text-[var(--color-indeks-blue)]", bg: "bg-[var(--color-indeks-blue)]/10" },
  click: { icon: <MousePointerClick className="h-3 w-3" />, color: "text-[var(--color-indeks-green)]", bg: "bg-[var(--color-indeks-green)]/10" },
  scroll: { icon: <ScrollText className="h-3 w-3" />, color: "text-[var(--color-indeks-yellow)]", bg: "bg-[var(--color-indeks-yellow)]/10" },
  form_submit: { icon: <FormInput className="h-3 w-3" />, color: "text-[var(--color-indeks-green)]", bg: "bg-[var(--color-indeks-green)]/10" },
  keystroke: { icon: <Keyboard className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  mouse_move: { icon: <Move className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  resize: { icon: <Maximize2 className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  error: { icon: <AlertTriangle className="h-3 w-3" />, color: "text-destructive", bg: "bg-destructive/10" },
  session_start: { icon: <Play className="h-3 w-3" />, color: "text-[var(--color-indeks-orange)]", bg: "bg-[var(--color-indeks-orange)]/10" },
  session_end: { icon: <LogOut className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  page_leave: { icon: <Navigation className="h-3 w-3" />, color: "text-[var(--color-indeks-blue)]", bg: "bg-[var(--color-indeks-blue)]/10" },
  scroll_depth: { icon: <Percent className="h-3 w-3" />, color: "text-[var(--color-indeks-yellow)]", bg: "bg-[var(--color-indeks-yellow)]/10" },
  before_unload: { icon: <LogOut className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  visibility_change: { icon: <EyeOff className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  hash_change: { icon: <HashIcon className="h-3 w-3" />, color: "text-[var(--color-indeks-blue)]", bg: "bg-[var(--color-indeks-blue)]/10" },
  double_click: { icon: <MousePointer className="h-3 w-3" />, color: "text-[var(--color-indeks-green)]", bg: "bg-[var(--color-indeks-green)]/10" },
  context_menu: { icon: <MousePointer className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  touch: { icon: <Hand className="h-3 w-3" />, color: "text-[var(--color-indeks-blue)]", bg: "bg-[var(--color-indeks-blue)]/10" },
  wheel: { icon: <CircleDot className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  drag: { icon: <GripVertical className="h-3 w-3" />, color: "text-[var(--color-indeks-blue)]", bg: "bg-[var(--color-indeks-blue)]/10" },
  drop: { icon: <GripVertical className="h-3 w-3" />, color: "text-[var(--color-indeks-green)]", bg: "bg-[var(--color-indeks-green)]/10" },
  input_change: { icon: <FormInput className="h-3 w-3" />, color: "text-[var(--color-indeks-blue)]", bg: "bg-[var(--color-indeks-blue)]/10" },
  form_abandon: { icon: <FormInput className="h-3 w-3" />, color: "text-[var(--color-indeks-orange)]", bg: "bg-[var(--color-indeks-orange)]/10" },
  form_error: { icon: <FormInput className="h-3 w-3" />, color: "text-destructive", bg: "bg-destructive/10" },
  clipboard: { icon: <Copy className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  text_selection: { icon: <TextSelect className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  rage_click: { icon: <Angry className="h-3 w-3" />, color: "text-destructive", bg: "bg-destructive/10" },
  dead_click: { icon: <CircleSlash className="h-3 w-3" />, color: "text-[var(--color-indeks-orange)]", bg: "bg-[var(--color-indeks-orange)]/10" },
  error_click: { icon: <AlertTriangle className="h-3 w-3" />, color: "text-destructive", bg: "bg-destructive/10" },
  search: { icon: <Search className="h-3 w-3" />, color: "text-[var(--color-indeks-blue)]", bg: "bg-[var(--color-indeks-blue)]/10" },
  media: { icon: <Video className="h-3 w-3" />, color: "text-[var(--color-indeks-blue)]", bg: "bg-[var(--color-indeks-blue)]/10" },
  media_progress: { icon: <Video className="h-3 w-3" />, color: "text-[var(--color-indeks-green)]", bg: "bg-[var(--color-indeks-green)]/10" },
  file_download: { icon: <FileDown className="h-3 w-3" />, color: "text-[var(--color-indeks-green)]", bg: "bg-[var(--color-indeks-green)]/10" },
  print: { icon: <Printer className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  share: { icon: <Share2 className="h-3 w-3" />, color: "text-[var(--color-indeks-blue)]", bg: "bg-[var(--color-indeks-blue)]/10" },
  performance: { icon: <Gauge className="h-3 w-3" />, color: "text-[var(--color-indeks-yellow)]", bg: "bg-[var(--color-indeks-yellow)]/10" },
  page_load: { icon: <Timer className="h-3 w-3" />, color: "text-[var(--color-indeks-green)]", bg: "bg-[var(--color-indeks-green)]/10" },
  network_status: { icon: <Wifi className="h-3 w-3" />, color: "text-[var(--color-indeks-green)]", bg: "bg-[var(--color-indeks-green)]/10" },
  network_change: { icon: <WifiOff className="h-3 w-3" />, color: "text-[var(--color-indeks-orange)]", bg: "bg-[var(--color-indeks-orange)]/10" },
  orientation_change: { icon: <RotateCw className="h-3 w-3" />, color: "text-muted-foreground", bg: "bg-muted" },
  custom: { icon: <Tag className="h-3 w-3" />, color: "text-[var(--color-indeks-yellow)]", bg: "bg-[var(--color-indeks-yellow)]/10" },
  outbound_link: { icon: <ExternalLink className="h-3 w-3" />, color: "text-[var(--color-indeks-blue)]", bg: "bg-[var(--color-indeks-blue)]/10" },
  resource_error: { icon: <FileWarning className="h-3 w-3" />, color: "text-destructive", bg: "bg-destructive/10" },
};

const defaultEventConfig = {
  icon: <Zap className="h-3 w-3" />,
  color: "text-[var(--color-indeks-yellow)]",
  bg: "bg-[var(--color-indeks-yellow)]/10",
};

function hashEvent(event: RawEvent): string {
  const str = `${event.timestamp}|${event.event_type}|${event.session_id || ""}|${event.url || ""}|${event.user_id || ""}|${JSON.stringify(event.metadata)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `evt_${Math.abs(hash).toString(36)}_${event.timestamp.replace(/[^0-9]/g, "")}`;
}

const SyntaxHighlightedValue = memo(function SyntaxHighlightedValue({ value }: { value: any }) {
  if (value === null) return <span className="text-muted-foreground italic">null</span>;
  if (typeof value === "boolean") return <span className="text-[var(--color-indeks-orange)]">{value.toString()}</span>;
  if (typeof value === "number") return <span className="text-[var(--color-indeks-blue)]">{value}</span>;
  if (typeof value === "string") {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return (
        <span className="text-[var(--color-indeks-green)]">
          &quot;<a href={value} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">{value}</a>&quot;
        </span>
      );
    }
    return <span className="text-[var(--color-indeks-green)]">&quot;{value}&quot;</span>;
  }
  return null;
});

const JsonTree = memo(function JsonTree({ data, name, isRoot = false, depth = 0 }: { data: any; name?: string; isRoot?: boolean; depth?: number }) {
  const [expanded, setExpanded] = useState(isRoot || depth < 1);

  if (data === null || typeof data === "boolean" || typeof data === "number" || typeof data === "string") {
    return (
      <div className="flex items-start gap-1">
        {name && <span className="text-[var(--color-indeks-yellow)] shrink-0">&quot;{name}&quot;: </span>}
        <SyntaxHighlightedValue value={data} />
      </div>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div className="flex items-start gap-1">
          {name && <span className="text-[var(--color-indeks-yellow)]">&quot;{name}&quot;: </span>}
          <span className="text-muted-foreground">[]</span>
        </div>
      );
    }
    return (
      <div>
        <div className="flex items-center gap-1 cursor-pointer hover:bg-accent/50 rounded px-1 -ml-1" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
          {name && <span className="text-[var(--color-indeks-yellow)]">&quot;{name}&quot;: </span>}
          <span className="text-muted-foreground">[</span>
          {!expanded && <span className="text-muted-foreground text-xs">{data.length} items</span>}
          {!expanded && <span className="text-muted-foreground">]</span>}
        </div>
        {expanded && (
          <div className="ml-4 pl-2 border-l border-border">
            {data.map((item, index) => <JsonTree key={index} data={item} name={String(index)} depth={depth + 1} />)}
            <span className="text-muted-foreground">]</span>
          </div>
        )}
      </div>
    );
  }

  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return (
        <div className="flex items-start gap-1">
          {name && <span className="text-[var(--color-indeks-yellow)]">&quot;{name}&quot;: </span>}
          <span className="text-muted-foreground">{"{}"}</span>
        </div>
      );
    }
    return (
      <div>
        <div className="flex items-center gap-1 cursor-pointer hover:bg-accent/50 rounded px-1 -ml-1" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
          {name && <span className="text-[var(--color-indeks-yellow)]">&quot;{name}&quot;: </span>}
          <span className="text-muted-foreground">{"{"}</span>
          {!expanded && <span className="text-muted-foreground text-xs">{keys.length} {keys.length === 1 ? "key" : "keys"}</span>}
          {!expanded && <span className="text-muted-foreground">{"}"}</span>}
        </div>
        {expanded && (
          <div className="ml-4 pl-2 border-l border-border">
            {keys.map((key) => <JsonTree key={key} data={data[key]} name={key} depth={depth + 1} />)}
            <span className="text-muted-foreground">{"}"}</span>
          </div>
        )}
      </div>
    );
  }

  return <span className="text-muted-foreground">{String(data)}</span>;
});

const EventRow = memo(function EventRow({ event, onCopy, isSelected, onSelect }: { event: TrackedEvent; onCopy: (text: string) => void; isSelected: boolean; onSelect: () => void }) {
  const config = eventTypeConfig[event.event_type] || defaultEventConfig;
  const timeStr = useMemo(() => {
    return new Date(event.timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }, [event.timestamp]);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(JSON.stringify(event, null, 2));
  }, [event, onCopy]);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 border-b border-border cursor-pointer transition-colors",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
      onClick={onSelect}
    >
      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium shrink-0", config.bg, config.color)}>
        {config.icon}
        <span className="font-mono">{event.event_type}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate text-foreground">{event.url || "—"}</p>
      </div>
      {event.country && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Globe className="h-3 w-3" />
          <span>{event.city ? `${event.city}, ` : ""}{event.country}</span>
        </div>
      )}
      <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono shrink-0">
        <Clock className="h-3 w-3" />
        {timeStr}
      </div>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={handleCopy}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
});

const EventDetail = memo(function EventDetail({ event, onCopy }: { event: TrackedEvent; onCopy: (text: string) => void }) {
  const config = eventTypeConfig[event.event_type] || defaultEventConfig;
  const [copied, setCopied] = useState(false);

  const handleCopyAll = useCallback(() => {
    const displayEvent = { ...event };
    delete (displayEvent as any)._uniqueId;
    onCopy(JSON.stringify(displayEvent, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [event, onCopy]);

  const displayEvent = useMemo(() => {
    const cleaned = { ...event };
    delete (cleaned as any)._uniqueId;
    return cleaned;
  }, [event]);

  const formattedTimestamp = useMemo(() => new Date(event.timestamp).toLocaleString(), [event.timestamp]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium", config.bg, config.color)}>
            {config.icon}
            <span className="font-mono">{event.event_type}</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleCopyAll}>
            {copied ? <CheckCircle2 className="h-4 w-4 mr-2 text-[var(--color-indeks-green)]" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy JSON"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {event.url && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Link2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.url}</span>
            </div>
          )}
          {event.country && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{event.city ? `${event.city}, ` : ""}{event.country}</span>
            </div>
          )}
          {event.session_id && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Hash className="h-3 w-3 shrink-0" />
              <span className="font-mono truncate">{event.session_id.slice(0, 12)}...</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{formattedTimestamp}</span>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Braces className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Event Payload</span>
          </div>
          <div className="p-4 bg-muted/30 border border-border font-mono text-xs leading-relaxed overflow-x-auto">
            <JsonTree data={displayEvent} isRoot />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
});

export function JOLT({ projectId, projectName }: JOLTProps) {
  const [events, setEvents] = useState<TrackedEvent[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(3);
  const [lastFetchTime, setLastFetchTime] = useState<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const seenEventsRef = useRef<Map<string, TrackedEvent>>(new Map());
  const clearedAtRef = useRef<string | null>(null);
  const eventIdCounterRef = useRef(0);
  const hasLoadedOnce = useRef(false);

  const REFRESH_INTERVAL = 3000;

  const generateEventId = useCallback((event: RawEvent): string => {
    const hash = hashEvent(event);
    eventIdCounterRef.current += 1;
    return `${hash}_${eventIdCounterRef.current}`;
  }, []);

  // Core fetch function - merges new events without clearing existing ones
  const doFetch = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsRefreshing(true);
      
      const response = await fetch(`/api/v1/analytics/${projectId}/events-stream?limit=100`);
      const result = await response.json();
      
      if (result.events && Array.isArray(result.events)) {
        const clearedAt = clearedAtRef.current;
        const newEventsMap = new Map<string, TrackedEvent>();
        
        for (const event of result.events as RawEvent[]) {
          // Skip events before clear timestamp
          if (clearedAt && event.timestamp <= clearedAt) continue;
          
          const contentHash = hashEvent(event);
          
          // Check if we already have this event
          if (seenEventsRef.current.has(contentHash)) {
            newEventsMap.set(contentHash, seenEventsRef.current.get(contentHash)!);
          } else {
            // New event
            const trackedEvent: TrackedEvent = {
              ...event,
              _uniqueId: generateEventId(event),
            };
            newEventsMap.set(contentHash, trackedEvent);
            seenEventsRef.current.set(contentHash, trackedEvent);
          }
        }
        
        // Convert map to array, maintaining order from API (newest first typically)
        const eventsArray = Array.from(newEventsMap.values());
        setEvents(eventsArray);
      }
      
      setLastFetchTime(Date.now());
      setNextRefreshIn(3);
      hasLoadedOnce.current = true;
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId, generateEventId]);

  // Auto-fetch that respects isPaused
  const fetchEvents = useCallback(async () => {
    if (isPaused) return;
    await doFetch(false);
  }, [isPaused, doFetch]);

  // Manual refresh - always works regardless of pause state
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await doFetch(false);
  }, [doFetch]);

  // Handle visibility change - refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOpen && !isPaused) {
        doFetch(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOpen, isPaused, doFetch]);

  // Main polling effect
  useEffect(() => {
    if (isOpen) {
      // Initial fetch
      if (!hasLoadedOnce.current) {
        setInitialLoading(true);
        doFetch(true);
      }

      // Set up polling interval
      if (!isPaused) {
        intervalRef.current = setInterval(() => {
          if (document.visibilityState === 'visible') {
            fetchEvents();
          }
        }, REFRESH_INTERVAL);
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isOpen, isPaused, doFetch, fetchEvents]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      hasLoadedOnce.current = false;
      setInitialLoading(true);
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (isOpen && !isPaused) {
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - lastFetchTime;
        const remaining = Math.max(0, Math.ceil((REFRESH_INTERVAL - elapsed) / 1000));
        setNextRefreshIn(remaining);
      }, 100);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      };
    } else {
      setNextRefreshIn(3);
    }
  }, [isOpen, isPaused, lastFetchTime]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleExport = useCallback(() => {
    const exportData = events.map(e => {
      const cleaned = { ...e };
      delete (cleaned as any)._uniqueId;
      return cleaned;
    });
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jolt-export-${projectId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events, projectId]);

  const handleClear = useCallback(() => {
    clearedAtRef.current = new Date().toISOString();
    seenEventsRef.current.clear();
    eventIdCounterRef.current = 0;
    setEvents([]);
    setSelectedEventId(null);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (eventTypeFilter !== "all" && event.event_type !== eventTypeFilter) return false;
      if (filter) {
        const searchStr = filter.toLowerCase();
        return (
          event.event_type.toLowerCase().includes(searchStr) ||
          event.url?.toLowerCase().includes(searchStr) ||
          event.country?.toLowerCase().includes(searchStr) ||
          event.city?.toLowerCase().includes(searchStr) ||
          JSON.stringify(event.metadata).toLowerCase().includes(searchStr)
        );
      }
      return true;
    });
  }, [events, eventTypeFilter, filter]);

  const eventTypes = useMemo(() => Array.from(new Set(events.map((e) => e.event_type))), [events]);

  const stats = useMemo(() => ({
    total: events.length,
    pageViews: events.filter((e) => e.event_type === "page_view").length,
    clicks: events.filter((e) => e.event_type === "click").length,
    errors: events.filter((e) => e.event_type === "error").length,
  }), [events]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find(e => e._uniqueId === selectedEventId) || null;
  }, [events, selectedEventId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
        <Zap className="h-4 w-4 text-[var(--color-indeks-yellow)]" />
        <span className="hidden sm:inline">JOLT</span>
      </DialogTrigger>

      <DialogPortal>
        <DialogBackdrop />
        <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-5xl h-[85vh] flex flex-col bg-popover text-popover-foreground rounded-2xl border shadow-lg transition-all duration-200 data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-indeks-yellow)]/10">
                  <Zap className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg font-bold">JOLT</DialogTitle>
                    {!isPaused && (
                      <Badge variant="outline" className="gap-1.5 text-[var(--color-indeks-green)] border-[var(--color-indeks-green)]/30 bg-[var(--color-indeks-green)]/10">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-indeks-green)] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-indeks-green)]"></span>
                        </span>
                        Live
                      </Badge>
                    )}
                    {isPaused && (
                      <Badge variant="outline" className="text-[var(--color-indeks-orange)] border-[var(--color-indeks-orange)]/30 bg-[var(--color-indeks-orange)]/10">
                        Paused
                      </Badge>
                    )}
                  </div>
                  <DialogDescription className="text-xs mt-0.5">
                    <span className="text-muted-foreground">JSON</span>
                    <span className="text-muted-foreground/50 mx-1">•</span>
                    <span className="text-muted-foreground">Live</span>
                    <span className="text-muted-foreground/50 mx-1">•</span>
                    <span className="text-muted-foreground">Telemetry</span>
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={isPaused ? "default" : "outline"} onClick={() => setIsPaused(!isPaused)}>
                  {isPaused ? <><Play className="h-3.5 w-3.5 mr-1.5" />Resume</> : <><Pause className="h-3.5 w-3.5 mr-1.5" />Pause</>}
                </Button>
                <Button size="sm" variant="outline" onClick={handleClear}>
                  <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
                <Button size="sm" variant="outline" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <DialogClose render={<Button size="sm" variant="ghost" className="h-8 w-8 p-0" />}>
                  <X className="h-4 w-4" />
                </DialogClose>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="px-6 py-2 border-b border-border bg-muted/30 shrink-0">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-[var(--color-indeks-blue)]" />
                <span className="font-medium">{stats.pageViews}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5 text-[var(--color-indeks-green)]" />
                <span className="font-medium">{stats.clicks}</span>
              </div>
              {stats.errors > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <span className="font-medium text-destructive">{stats.errors}</span>
                </div>
              )}
              <div className="flex-1" />
              {copied && (
                <Badge variant="outline" className="text-[var(--color-indeks-green)] border-[var(--color-indeks-green)]/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Copied!
                </Badge>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search events..." value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={eventTypeFilter} onValueChange={(v) => setEventTypeFilter(v || "all")}>
              <SelectTrigger className="w-[160px] h-9">
                <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {eventTypes.map((type) => {
                  const cfg = eventTypeConfig[type] || defaultEventConfig;
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <span className={cfg.color}>{cfg.icon}</span>
                        {type}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">{filteredEvents.length} events</div>
            <Button size="sm" variant="ghost" className="ml-auto gap-1.5" onClick={handleManualRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              {!isPaused && <span className="text-muted-foreground tabular-nums w-4">{nextRefreshIn}s</span>}
            </Button>
          </div>

          {/* Main Content - Fixed height container */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Event List */}
            <div className={cn("flex-1 min-w-0 border-r border-border", selectedEvent && "hidden lg:block lg:max-w-md")}>
              <ScrollArea className="h-full">
                {initialLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading events...</p>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                    <div className="p-3 rounded-full bg-muted">
                      <Terminal className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No events yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Events will appear here as they arrive from your site</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {filteredEvents.map((event) => (
                      <EventRow
                        key={event._uniqueId}
                        event={event}
                        onCopy={handleCopy}
                        isSelected={selectedEventId === event._uniqueId}
                        onSelect={() => setSelectedEventId(event._uniqueId)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Event Detail Panel */}
            {selectedEvent && (
              <div className="flex-1 min-w-0 lg:min-w-[400px]">
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0 lg:hidden">
                    <span className="text-sm font-medium">Event Details</span>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedEventId(null)}>Back to list</Button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <EventDetail event={selectedEvent} onCopy={handleCopy} />
                  </div>
                </div>
              </div>
            )}

            {/* Empty Detail State */}
            {!selectedEvent && (
              <div className="hidden lg:flex flex-1 items-center justify-center bg-muted/20">
                <div className="text-center">
                  <Braces className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select an event to view details</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-2.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/30 shrink-0">
            <div className="flex items-center gap-2">
              <span>Auto-refresh:</span>
              {isPaused ? (
                <span className="text-[var(--color-indeks-orange)]">Paused</span>
              ) : (
                <span className="text-[var(--color-indeks-green)]">
                  Next in <span className="font-mono tabular-nums">{nextRefreshIn}s</span>
                </span>
              )}
              {isRefreshing && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              {projectName && (
                <>
                  <span className="truncate max-w-[150px] sm:max-w-[250px]" title={projectName}>{projectName}</span>
                  <span className="text-muted-foreground/50">•</span>
                </>
              )}
              <span className="font-mono text-[10px] text-muted-foreground/70 hidden sm:inline" title={projectId}>{projectId}</span>
              <span className="font-mono text-[10px] text-muted-foreground/70 sm:hidden" title={projectId}>{projectId.slice(0, 12)}...</span>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
