"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Signal,
  Trash2,
  TrendingUp,
  XCircle,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/menu";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  link: string;
}

interface DailyStat {
  id: string;
  monitorId: string;
  date: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  uptimePercentage: number | null;
  avgResponseTime: number | null;
  minResponseTime: number | null;
  maxResponseTime: number | null;
  incidentsCount: number;
  totalDowntimeSeconds: number;
}

interface Monitor {
  id: string;
  projectId: string;
  name: string;
  url: string;
  checkInterval: number;
  timeout: number;
  expectedStatusCode: number;
  isActive: boolean;
  isPaused: boolean;
  currentStatus: string;
  lastCheckedAt: string | null;
  lastStatusChange: string | null;
  createdAt: string;
  projectTitle?: string;
  projectLink?: string;
  uptime30d: number;
  uptime60d: number;
  uptime90d: number;
  dailyStats: DailyStat[];
}

interface UptimeSummary {
  totalMonitors: number;
  monitorsUp: number;
  monitorsDown: number;
  monitorsDegraded: number;
  monitorsUnknown: number;
  ongoingIncidents: number;
  avgUptime: number | null;
  projectSummaries: {
    projectId: string;
    projectTitle: string;
    totalMonitors: number;
    monitorsUp: number;
    monitorsDown: number;
    monitorsDegraded: number;
  }[];
}

type FilterStatus = "all" | "up" | "down" | "degraded" | "paused";

// Get bar color based on uptime
function getUptimeBarColor(uptime: number | null, hasData: boolean): string {
  if (!hasData || uptime === null) return "#3f3f46"; // zinc-700 - visible grey for no data
  if (uptime >= 99.9) return "#22c55e"; // green-500
  if (uptime >= 99.0) return "#84cc16"; // lime-500
  if (uptime >= 97.0) return "#eab308"; // yellow-500
  if (uptime >= 95.0) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
}

// Uptime Showcase Component - Atlassian style bars
function UptimeShowcase({
  dailyStats,
  days = 90,
}: {
  monitorId: string;
  dailyStats: DailyStat[];
  days?: number;
}) {
  const uptimeData = useMemo(() => {
    // Create a map of existing stats by date
    const statsMap = new Map<string, DailyStat>();
    dailyStats.forEach((stat) => {
      statsMap.set(stat.date.split("T")[0], stat);
    });

    // Generate array for the last N days (oldest first, today last)
    const data: { date: string; uptime: number | null; downtime: number; incidents: number; hasData: boolean; isToday: boolean }[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const stat = statsMap.get(dateStr);
      const isToday = dateStr === todayStr;

      if (stat && stat.totalChecks > 0) {
        data.push({
          date: dateStr,
          uptime: stat.uptimePercentage,
          downtime: Math.round(stat.totalDowntimeSeconds / 60),
          incidents: stat.incidentsCount,
          hasData: true,
          isToday,
        });
      } else {
        data.push({
          date: dateStr,
          uptime: null,
          downtime: 0,
          incidents: 0,
          hasData: false,
          isToday,
        });
      }
    }

    return data;
  }, [dailyStats, days]);

  const overallUptime = useMemo(() => {
    const validData = uptimeData.filter((d) => d.uptime !== null);
    if (validData.length === 0) return null;
    const sum = validData.reduce((acc, d) => acc + (d.uptime || 0), 0);
    return sum / validData.length;
  }, [uptimeData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-[2px]">
        {uptimeData.map((day, i) => (
          <Tooltip key={i}>
            <TooltipTrigger
              render={
                <div
                  className={cn(
                    "h-10 flex-1 min-w-[3px] rounded-sm cursor-pointer transition-opacity hover:opacity-80",
                    day.isToday && "ring-1 ring-foreground/30 ring-offset-1 ring-offset-background"
                  )}
                  style={{ backgroundColor: getUptimeBarColor(day.uptime, day.hasData) }}
                />
              }
            />
            <TooltipPopup>
              <div className="text-center">
                <p className="font-semibold text-sm">
                  {formatDate(day.date)}
                  {day.isToday && " (Today)"}
                </p>
                {day.hasData ? (
                  <>
                    <p
                      className="text-sm font-medium"
                      style={{ color: getUptimeBarColor(day.uptime, day.hasData) }}
                    >
                      {day.uptime?.toFixed(2)}% uptime
                    </p>
                    {day.downtime > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {day.downtime} min downtime
                      </p>
                    )}
                    {day.incidents > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {day.incidents} incident{day.incidents > 1 ? "s" : ""}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </div>
            </TooltipPopup>
          </Tooltip>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{days} days ago</span>
        <span className="font-semibold text-foreground">
          {overallUptime !== null ? `${overallUptime.toFixed(2)}% uptime` : "No data"}
        </span>
        <span>Today</span>
      </div>
    </div>
  );
}

const timeFrameItems = [
  { label: "30 days", value: "30" },
  { label: "60 days", value: "60" },
  { label: "90 days", value: "90" },
];

const intervalItems = [
  { label: "30 seconds", value: "30" },
  { label: "1 minute", value: "60" },
  { label: "5 minutes", value: "300" },
  { label: "10 minutes", value: "600" },
];

const timeoutItems = [
  { label: "10 seconds", value: "10" },
  { label: "30 seconds", value: "30" },
  { label: "60 seconds", value: "60" },
];

export default function UptimePage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<UptimeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [timeFrame, setTimeFrame] = useState<{ label: string; value: string } | null>(
    timeFrameItems[2]
  );
  const [checkingMonitor, setCheckingMonitor] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ label: string; value: string } | null>(
    null
  );
  const [newMonitorName, setNewMonitorName] = useState("");
  const [newMonitorUrl, setNewMonitorUrl] = useState("");
  const [newMonitorInterval, setNewMonitorInterval] = useState<{
    label: string;
    value: string;
  } | null>(intervalItems[1]);
  const [newMonitorTimeout, setNewMonitorTimeout] = useState<{
    label: string;
    value: string;
  } | null>(timeoutItems[1]);
  const [creating, setCreating] = useState(false);

  const projectItems = useMemo(() => {
    return projects.map((p) => ({ label: p.title, value: p.id }));
  }, [projects]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const monitorsRes = await fetch("/api/v1/uptime/monitors");
      const monitorsData = await monitorsRes.json();
      if (monitorsData.success) {
        setMonitors(monitorsData.data);
      }

      const summaryRes = await fetch("/api/v1/uptime/summary");
      const summaryData = await summaryRes.json();
      if (summaryData.success) {
        setSummary(summaryData.data);
      }

      const projectsRes = await fetch("/api/v1/projects");
      const projectsData = await projectsRes.json();
      if (projectsData.success) {
        setProjects(projectsData.data);
      }
    } catch (err) {
      console.error("Error fetching uptime data:", err);
      setError("Failed to load uptime data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleManualCheck = async (monitorId: string) => {
    setCheckingMonitor(monitorId);
    try {
      await fetch(`/api/v1/uptime/monitors/${monitorId}/check`, { method: "POST" });
      await fetchData();
    } catch (err) {
      console.error("Error performing check:", err);
    } finally {
      setCheckingMonitor(null);
    }
  };

  const handleTogglePause = async (monitorId: string, isPaused: boolean) => {
    try {
      await fetch(`/api/v1/uptime/monitors/${monitorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaused: !isPaused }),
      });
      await fetchData();
    } catch (err) {
      console.error("Error toggling pause:", err);
    }
  };

  const handleDelete = async (monitorId: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) return;
    try {
      await fetch(`/api/v1/uptime/monitors/${monitorId}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      console.error("Error deleting monitor:", err);
    }
  };

  const handleCreateMonitor = async () => {
    if (!selectedProject || !newMonitorName || !newMonitorUrl) return;

    setCreating(true);
    try {
      const res = await fetch(`/api/v1/uptime/projects/${selectedProject.value}/monitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMonitorName,
          url: newMonitorUrl,
          checkInterval: Number(newMonitorInterval?.value || "60"),
          timeout: Number(newMonitorTimeout?.value || "30"),
          expectedStatusCode: 200,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateDialogOpen(false);
        setSelectedProject(null);
        setNewMonitorName("");
        setNewMonitorUrl("");
        setNewMonitorInterval(intervalItems[1]);
        setNewMonitorTimeout(timeoutItems[1]);
        await fetchData();
      }
    } catch (err) {
      console.error("Error creating monitor:", err);
    } finally {
      setCreating(false);
    }
  };

  const filteredMonitors = monitors.filter((monitor) => {
    if (filterStatus === "paused" && !monitor.isPaused) return false;
    if (filterStatus === "up" && monitor.currentStatus !== "up") return false;
    if (filterStatus === "down" && monitor.currentStatus !== "down") return false;
    if (filterStatus === "degraded" && monitor.currentStatus !== "degraded") return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        monitor.name.toLowerCase().includes(q) ||
        monitor.url.toLowerCase().includes(q) ||
        monitor.projectTitle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusIcon = (status: string, isPaused: boolean) => {
    if (isPaused) return <Pause className="h-4 w-4 text-muted-foreground" />;
    switch (status) {
      case "up":
        return <CheckCircle2 className="h-4 w-4 text-[var(--color-indeks-green)]" />;
      case "down":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-[var(--color-indeks-yellow)]" />;
      default:
        return <Signal className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, isPaused: boolean) => {
    if (isPaused) return <Badge variant="outline">Paused</Badge>;
    switch (status) {
      case "up":
        return <Badge variant="success">Operational</Badge>;
      case "down":
        return <Badge variant="error">Down</Badge>;
      case "degraded":
        return <Badge variant="warning">Degraded</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[90vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Uptime</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor the availability of your projects
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger
              render={
                <Button className="bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90 text-[var(--color-indeks-black)]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Monitor
                </Button>
              }
            />
            <DialogPopup>
              <DialogHeader>
                <DialogTitle>Create New Monitor</DialogTitle>
                <DialogDescription>
                  Add a new uptime monitor to track your website availability.
                </DialogDescription>
              </DialogHeader>
              <DialogPanel>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectPopup>
                        {projectItems.map((item) => (
                          <SelectItem key={item.value} value={item}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectPopup>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monitor Name</Label>
                    <Input
                      value={newMonitorName}
                      onChange={(e) => setNewMonitorName(e.target.value)}
                      placeholder="My Website Monitor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL to Monitor</Label>
                    <Input
                      value={newMonitorUrl}
                      onChange={(e) => setNewMonitorUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Check Interval</Label>
                      <Select value={newMonitorInterval} onValueChange={setNewMonitorInterval}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectPopup>
                          {intervalItems.map((item) => (
                            <SelectItem key={item.value} value={item}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectPopup>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timeout</Label>
                      <Select value={newMonitorTimeout} onValueChange={setNewMonitorTimeout}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectPopup>
                          {timeoutItems.map((item) => (
                            <SelectItem key={item.value} value={item}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectPopup>
                      </Select>
                    </div>
                  </div>
                </div>
              </DialogPanel>
              <DialogFooter variant="bare">
                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                <Button
                  onClick={handleCreateMonitor}
                  disabled={creating || !selectedProject || !newMonitorName || !newMonitorUrl}
                  className="bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90 text-[var(--color-indeks-black)]"
                >
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Monitor
                </Button>
              </DialogFooter>
            </DialogPopup>
          </Dialog>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 sm:p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {summary && (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Total Monitors
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                    {summary.totalMonitors}
                  </h3>
                </div>
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-blue)]" />
              </div>
            </Card>
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Operational
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-[var(--color-indeks-green)]">
                    {summary.monitorsUp}
                  </h3>
                </div>
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-green)]" />
              </div>
            </Card>
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Down</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-destructive">
                    {summary.monitorsDown}
                  </h3>
                </div>
                <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
              </div>
            </Card>
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Avg Uptime
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                    {summary.totalMonitors > 0 && summary.avgUptime !== null 
                      ? `${summary.avgUptime.toFixed(2)}%` 
                      : "N/A"}
                  </h3>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-yellow)]" />
              </div>
            </Card>
          </div>
        )}

        {/* Active Incidents Alert */}
        {summary && summary.ongoingIncidents > 0 && (
          <Card className="p-4 sm:p-6 border-destructive bg-destructive/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Active Incidents</h3>
                <p className="text-sm text-muted-foreground">
                  {summary.ongoingIncidents} monitor
                  {summary.ongoingIncidents > 1 ? "s are" : " is"} currently experiencing issues.
                </p>
              </div>
            </div>
          </Card>
        )}

        {monitors.length === 0 ? (
          <Card className="p-8 sm:p-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Activity />
                </EmptyMedia>
                <EmptyTitle>No monitors yet</EmptyTitle>
                <EmptyDescription>
                  Create your first uptime monitor to start tracking availability.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-4 bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90 text-[var(--color-indeks-black)]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Monitor
              </Button>
            </Empty>
          </Card>
        ) : (
          <>
            {/* All Monitors */}
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Signal className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                    <h3 className="text-base sm:text-lg font-semibold">All Monitors</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={timeFrame} onValueChange={setTimeFrame}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectPopup>
                        {timeFrameItems.map((item) => (
                          <SelectItem key={item.value} value={item}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectPopup>
                    </Select>
                    <Button variant="outline" size="sm" onClick={fetchData}>
                      <RefreshCw className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search monitors..."
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className="flex items-center gap-1 border rounded-lg p-1 shrink-0">
                    <Button
                      variant={filterStatus === "all" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setFilterStatus("all")}
                      className="h-7 px-2 sm:px-3 text-xs"
                    >
                      All
                    </Button>
                    <Button
                      variant={filterStatus === "up" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setFilterStatus("up")}
                      className="h-7 px-2 sm:px-3 text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3 sm:mr-1 text-[var(--color-indeks-green)]" />
                      <span className="hidden sm:inline">Up</span>
                    </Button>
                    <Button
                      variant={filterStatus === "down" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setFilterStatus("down")}
                      className="h-7 px-2 sm:px-3 text-xs"
                    >
                      <XCircle className="h-3 w-3 sm:mr-1 text-destructive" />
                      <span className="hidden sm:inline">Down</span>
                    </Button>
                    <Button
                      variant={filterStatus === "paused" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setFilterStatus("paused")}
                      className="h-7 px-2 sm:px-3 text-xs"
                    >
                      <Pause className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Paused</span>
                    </Button>
                  </div>
                </div>
              </div>

              {filteredMonitors.length === 0 ? (
                <div className="py-8">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Search />
                      </EmptyMedia>
                      <EmptyTitle>No monitors found</EmptyTitle>
                      <EmptyDescription>Try adjusting your search or filter.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredMonitors.map((monitor) => (
                    <div
                      key={monitor.id}
                      className="p-4 sm:p-5 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      {/* Monitor Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {getStatusIcon(monitor.currentStatus, monitor.isPaused)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">{monitor.name}</h4>
                              {getStatusBadge(monitor.currentStatus, monitor.isPaused)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                              <span className="truncate">{getHostname(monitor.url)}</span>
                              <span>•</span>
                              <Link
                                href={`/projects/${monitor.projectId}`}
                                className="hover:text-[var(--color-indeks-blue)] transition-colors"
                              >
                                {monitor.projectTitle}
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManualCheck(monitor.id)}
                            disabled={checkingMonitor === monitor.id}
                          >
                            <RefreshCw
                              className={cn(
                                "h-4 w-4",
                                checkingMonitor === monitor.id && "animate-spin"
                              )}
                            />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleTogglePause(monitor.id, monitor.isPaused)}
                              >
                                {monitor.isPaused ? (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Resume
                                  </>
                                ) : (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.open(monitor.url, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Visit URL
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(monitor.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Uptime Graph */}
                      <UptimeShowcase
                        monitorId={monitor.id}
                        dailyStats={monitor.dailyStats}
                        days={Number(timeFrame?.value || "90")}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-[#22c55e]" />
                <span>Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-[#eab308]" />
                <span>Degraded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-[#f97316]" />
                <span>Partial outage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-[#ef4444]" />
                <span>Major outage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-zinc-700" />
                <span>No data</span>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
