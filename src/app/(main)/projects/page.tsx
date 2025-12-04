"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
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
  Eye,
  Users,
  Clock,
  FolderOpen,
  Loader2,
  FolderKanban,
  Activity,
  ChevronRight,
  Zap,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  LayoutGrid,
  List,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Link2,
  FileText,
  RefreshCw,
  MousePointerClick,
  Timer,
  BarChart3,
  MapPin,
} from "lucide-react";
import { Frame } from "@/components/ui/frame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  link: string;
  publicKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStats {
  totalPageViews: number;
  totalUniqueVisitors: number;
  avgSessionDuration: number;
  totalSessions: number;
  bounceRate: number;
  totalClicks: number;
}

interface DeviceData {
  deviceType: string;
  totalVisits: number;
}

interface ReferrerData {
  referrer: string;
  totalVisits: number;
}

interface TopPageData {
  url: string;
  totalPageViews: number;
}

interface EventData {
  eventType: string;
  totalCount: number;
}

interface LocationData {
  country: string;
  visitor_count: number;
}

type ViewMode = "grid" | "list";
type FilterStatus = "all" | "active" | "inactive";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Data states
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [topReferrers, setTopReferrers] = useState<ReferrerData[]>([]);
  const [topPages, setTopPages] = useState<TopPageData[]>([]);
  const [topEvents, setTopEvents] = useState<EventData[]>([]);
  const [topCountries, setTopCountries] = useState<LocationData[]>([]);
  const [realtimeCounts, setRealtimeCounts] = useState<Record<string, number>>({});
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/projects");
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setProjects(result.data);
      } else {
        setError(result.message || "Failed to fetch projects");
        setProjects([]);
      }
    } catch (err) {
      setError("An error occurred while fetching projects");
      setProjects([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = useCallback(async () => {
    if (!projects || projects.length === 0) return;

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const query = `?startDate=${start.toISOString().split("T")[0]}&endDate=${end.toISOString().split("T")[0]}`;

    const statsMap: Record<string, ProjectStats> = {};
    const allDevices: Record<string, number> = {};
    const allReferrers: Record<string, number> = {};
    const allPages: Record<string, number> = {};
    const allEvents: Record<string, number> = {};
    const allCountries: Record<string, number> = {};
    const realtimeMap: Record<string, number> = {};

    for (const project of projects) {
      try {
        // Fetch overview stats
        const overviewRes = await fetch(`/api/v1/analytics/${project.id}/overview${query}`);
        if (overviewRes.ok) {
          const data = await overviewRes.json();
          if (data && data.summary) {
            statsMap[project.id] = {
              totalPageViews: data.summary.totalPageViews || 0,
              totalUniqueVisitors: data.summary.totalUniqueVisitors || 0,
              avgSessionDuration: data.summary.avgSessionDuration || 0,
              totalSessions: data.summary.totalSessions || 0,
              bounceRate: data.summary.avgBounceRate || 0,
              totalClicks: data.summary.totalClicks || 0,
            };
          }
        }
      } catch (err) {
        console.error(`Error fetching overview for ${project.id}:`, err);
      }

      try {
        // Fetch devices - API returns deviceTypeBreakdown
        const devicesRes = await fetch(`/api/v1/analytics/${project.id}/devices${query}`);
        if (devicesRes.ok) {
          const data = await devicesRes.json();
          if (data && Array.isArray(data.deviceTypeBreakdown)) {
            data.deviceTypeBreakdown.forEach((d: DeviceData) => {
              if (d && d.deviceType) {
                allDevices[d.deviceType] = (allDevices[d.deviceType] || 0) + (d.totalVisits || 0);
              }
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching devices for ${project.id}:`, err);
      }

      try {
        // Fetch referrers - API returns referrer and totalVisits
        const referrersRes = await fetch(`/api/v1/analytics/${project.id}/referrers${query}&limit=10`);
        if (referrersRes.ok) {
          const data = await referrersRes.json();
          if (data && Array.isArray(data.referrers)) {
            data.referrers.forEach((r: ReferrerData) => {
              if (r) {
                const key = r.referrer || "Direct";
                allReferrers[key] = (allReferrers[key] || 0) + (r.totalVisits || 0);
              }
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching referrers for ${project.id}:`, err);
      }

      try {
        // Fetch top pages - API returns url and totalPageViews
        const pagesRes = await fetch(`/api/v1/analytics/${project.id}/pages${query}&limit=10`);
        if (pagesRes.ok) {
          const data = await pagesRes.json();
          if (data && Array.isArray(data.pages)) {
            data.pages.forEach((p: TopPageData) => {
              if (p && p.url) {
                allPages[p.url] = (allPages[p.url] || 0) + (p.totalPageViews || 0);
              }
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching pages for ${project.id}:`, err);
      }

      try {
        // Fetch events - API returns eventType and totalCount
        const eventsRes = await fetch(`/api/v1/analytics/${project.id}/events${query}&limit=10`);
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          if (data && Array.isArray(data.events)) {
            data.events.forEach((e: EventData) => {
              if (e && e.eventType) {
                allEvents[e.eventType] = (allEvents[e.eventType] || 0) + (e.totalCount || 0);
              }
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching events for ${project.id}:`, err);
      }

      try {
        // Fetch locations for countries
        const locationsRes = await fetch(`/api/v1/analytics/${project.id}/locations`);
        if (locationsRes.ok) {
          const data = await locationsRes.json();
          if (data && Array.isArray(data.countries)) {
            data.countries.forEach((c: LocationData) => {
              if (c && c.country) {
                allCountries[c.country] = (allCountries[c.country] || 0) + (c.visitor_count || 0);
              }
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching locations for ${project.id}:`, err);
      }

      try {
        // Fetch realtime
        const realtimeRes = await fetch(`/api/v1/analytics/${project.id}/realtime`);
        if (realtimeRes.ok) {
          const data = await realtimeRes.json();
          if (data && data.realtime) {
            realtimeMap[project.id] = data.realtime.active_users || 0;
          }
        }
      } catch (err) {
        console.error(`Error fetching realtime for ${project.id}:`, err);
      }
    }

    setProjectStats(statsMap);
    setRealtimeCounts(realtimeMap);

    // Process aggregated data
    setDeviceData(
      Object.entries(allDevices)
        .map(([deviceType, totalVisits]) => ({ deviceType, totalVisits }))
        .sort((a, b) => b.totalVisits - a.totalVisits)
    );

    setTopReferrers(
      Object.entries(allReferrers)
        .map(([referrer, totalVisits]) => ({ referrer, totalVisits }))
        .sort((a, b) => b.totalVisits - a.totalVisits)
        .slice(0, 5)
    );

    setTopPages(
      Object.entries(allPages)
        .map(([url, totalPageViews]) => ({ url, totalPageViews }))
        .sort((a, b) => b.totalPageViews - a.totalPageViews)
        .slice(0, 5)
    );

    setTopEvents(
      Object.entries(allEvents)
        .map(([eventType, totalCount]) => ({ eventType, totalCount }))
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 5)
    );

    setTopCountries(
      Object.entries(allCountries)
        .map(([country, visitor_count]) => ({ country, visitor_count }))
        .sort((a, b) => b.visitor_count - a.visitor_count)
        .slice(0, 5)
    );
  }, [projects]);

  const handleSync = async (projectId: string) => {
    setSyncing(projectId);
    try {
      await fetch(`/api/v1/analytics/${projectId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await fetchProjectStats();
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(null);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      fetchProjectStats();
    }
  }, [projects, fetchProjectStats]);

  // Computed values
  const totalViews = Object.values(projectStats).reduce((sum, s) => sum + (s?.totalPageViews || 0), 0);
  const totalVisitors = Object.values(projectStats).reduce((sum, s) => sum + (s?.totalUniqueVisitors || 0), 0);
  const totalSessions = Object.values(projectStats).reduce((sum, s) => sum + (s?.totalSessions || 0), 0);
  const totalClicks = Object.values(projectStats).reduce((sum, s) => sum + (s?.totalClicks || 0), 0);
  const avgBounceRate = Object.values(projectStats).length > 0 
    ? Object.values(projectStats).reduce((sum, s) => sum + (s?.bounceRate || 0), 0) / Object.values(projectStats).length 
    : 0;
  const avgSessionDuration = Object.values(projectStats).length > 0
    ? Object.values(projectStats).reduce((sum, s) => sum + (s?.avgSessionDuration || 0), 0) / Object.values(projectStats).length
    : 0;
  const activeProjects = projects.filter((p) => p?.isActive).length;
  const totalActiveVisitors = Object.values(realtimeCounts).reduce((sum, c) => sum + (c || 0), 0);

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    
    return projects
      .filter((project) => {
        if (!project) return false;
        if (filterStatus === "active" && !project.isActive) return false;
        if (filterStatus === "inactive" && project.isActive) return false;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return project.title?.toLowerCase().includes(q) || 
                 project.link?.toLowerCase().includes(q) || 
                 project.category?.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => (projectStats[b.id]?.totalPageViews || 0) - (projectStats[a.id]?.totalPageViews || 0));
  }, [projects, projectStats, searchQuery, filterStatus]);

  // Recently updated projects
  const recentlyUpdated = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return projects
      .filter((p) => p && p.updatedAt && new Date(p.updatedAt) > sevenDaysAgo)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [projects]);

  // Top performing project
  const topProject = useMemo(() => {
    if (!filteredProjects || filteredProjects.length === 0) return null;
    const top = filteredProjects[0];
    if (!top) return null;
    return { ...top, stats: projectStats[top.id] };
  }, [filteredProjects, projectStats]);

  const getStatusColor = (isActive: boolean) => isActive ? "bg-[var(--color-indeks-green)]" : "bg-muted-foreground";

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    if (!num && num !== 0) return "-";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatPercent = (num: number) => {
    if (!num && num !== 0) return "-";
    return `${Math.round(num)}%`;
  };

  const getPerformanceIndicator = (views: number) => {
    if (views > 1000) return { icon: TrendingUp, color: "text-[var(--color-indeks-green)]", label: "High" };
    if (views > 100) return { icon: Minus, color: "text-[var(--color-indeks-yellow)]", label: "Medium" };
    return { icon: TrendingDown, color: "text-muted-foreground", label: "Low" };
  };

  const getDeviceIcon = (device: string) => {
    if (!device) return Monitor;
    const d = device.toLowerCase();
    if (d.includes("mobile") || d.includes("phone")) return Smartphone;
    if (d.includes("tablet")) return Tablet;
    return Monitor;
  };

  const getHostname = (link: string) => {
    if (!link) return "-";
    try {
      return new URL(link.startsWith("http") ? link : `https://${link}`).hostname;
    } catch {
      return link;
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage and monitor all your analytics projects
            </p>
          </div>
          <CreateProjectDialog onProjectCreated={fetchProjects} />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 sm:p-4 text-sm text-destructive">{error}</div>
        )}

        {projects.length === 0 ? (
          <Card className="p-8 sm:p-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><FolderOpen /></EmptyMedia>
                <EmptyTitle>No projects yet</EmptyTitle>
                <EmptyDescription>Create your first project to start tracking analytics.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : (
          <>
            {/* Stats Cards - Row 1 */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">Projects</p>
                    <h3 className="text-lg sm:text-xl font-bold mt-0.5">{projects.length}</h3>
                  </div>
                  <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-indeks-blue)] shrink-0" />
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">Active</p>
                    <h3 className="text-lg sm:text-xl font-bold mt-0.5">{activeProjects}</h3>
                  </div>
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-indeks-green)] shrink-0" />
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">Views</p>
                    <h3 className="text-lg sm:text-xl font-bold mt-0.5">{formatNumber(totalViews)}</h3>
                  </div>
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-indeks-yellow)] shrink-0" />
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">Visitors</p>
                    <h3 className="text-lg sm:text-xl font-bold mt-0.5">{formatNumber(totalVisitors)}</h3>
                  </div>
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-indeks-orange)] shrink-0" />
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">Sessions</p>
                    <h3 className="text-lg sm:text-xl font-bold mt-0.5">{formatNumber(totalSessions)}</h3>
                  </div>
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-indeks-blue)] shrink-0" />
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">Live Now</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <h3 className="text-lg sm:text-xl font-bold">{totalActiveVisitors}</h3>
                      {totalActiveVisitors > 0 && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-indeks-green)] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-indeks-green)]"></span>
                        </span>
                      )}
                    </div>
                  </div>
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-indeks-green)] shrink-0" />
                </div>
              </Card>
            </div>

            {/* Stats Cards - Row 2 */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">Total Clicks</p>
                    <h3 className="text-lg sm:text-xl font-bold mt-0.5">{formatNumber(totalClicks)}</h3>
                  </div>
                  <MousePointerClick className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-indeks-yellow)] shrink-0" />
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">Avg. Duration</p>
                    <h3 className="text-lg sm:text-xl font-bold mt-0.5">{formatDuration(avgSessionDuration)}</h3>
                  </div>
                  <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-indeks-blue)] shrink-0" />
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">Bounce Rate</p>
                    <h3 className="text-lg sm:text-xl font-bold mt-0.5">{formatPercent(avgBounceRate)}</h3>
                  </div>
                  <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-indeks-orange)] shrink-0" />
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">Countries</p>
                    <h3 className="text-lg sm:text-xl font-bold mt-0.5">{topCountries.length}</h3>
                  </div>
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-indeks-green)] shrink-0" />
                </div>
              </Card>
            </div>

            {/* Insights Row 1 */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              {/* Top Performer */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-[var(--color-indeks-yellow)]" />
                  <h3 className="text-sm font-semibold">Top Performer</h3>
                  {topProject && <Badge variant="success" className="ml-auto text-[10px]">#1</Badge>}
                </div>
                {topProject && topProject.stats ? (
                  <Link href={`/projects/${topProject.id}`}>
                    <div className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusColor(topProject.isActive)}`} />
                        <p className="font-medium text-sm truncate">{topProject.title}</p>
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground shrink-0 ml-auto" />
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span><strong>{formatNumber(topProject.stats.totalPageViews)}</strong> views</span>
                        <span><strong>{formatNumber(topProject.stats.totalUniqueVisitors)}</strong> visitors</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground">No data available</p>
                )}
              </Card>

              {/* Devices */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="h-4 w-4 text-[var(--color-indeks-blue)]" />
                  <h3 className="text-sm font-semibold">Devices</h3>
                </div>
                {deviceData.length > 0 ? (
                  <div className="space-y-2">
                    {deviceData.slice(0, 3).map((d, i) => {
                      const Icon = getDeviceIcon(d.deviceType);
                      const total = deviceData.reduce((s, x) => s + (x.totalVisits || 0), 0);
                      const pct = total > 0 ? Math.round((d.totalVisits / total) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs truncate flex-1 capitalize">{d.deviceType || "Unknown"}</span>
                          <span className="text-xs font-medium">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No device data yet</p>
                )}
              </Card>

              {/* Top Referrers */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="h-4 w-4 text-[var(--color-indeks-orange)]" />
                  <h3 className="text-sm font-semibold">Top Referrers</h3>
                </div>
                {topReferrers.length > 0 ? (
                  <div className="space-y-2">
                    {topReferrers.slice(0, 3).map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                        <span className="text-xs truncate flex-1">{r.referrer || "Direct"}</span>
                        <span className="text-xs font-medium">{formatNumber(r.totalVisits)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No referrer data yet</p>
                )}
              </Card>

              {/* Top Pages */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-[var(--color-indeks-green)]" />
                  <h3 className="text-sm font-semibold">Top Pages</h3>
                </div>
                {topPages.length > 0 ? (
                  <div className="space-y-2">
                    {topPages.slice(0, 3).map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                        <span className="text-xs truncate flex-1">{p.url || "/"}</span>
                        <span className="text-xs font-medium">{formatNumber(p.totalPageViews)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No page data yet</p>
                )}
              </Card>
            </div>

            {/* Insights Row 2 */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              {/* Top Events */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MousePointerClick className="h-4 w-4 text-[var(--color-indeks-yellow)]" />
                  <h3 className="text-sm font-semibold">Top Events</h3>
                </div>
                {topEvents.length > 0 ? (
                  <div className="space-y-2">
                    {topEvents.slice(0, 3).map((e, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                        <span className="text-xs truncate flex-1">{e.eventType}</span>
                        <span className="text-xs font-medium">{formatNumber(e.totalCount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No events yet</p>
                )}
              </Card>

              {/* Top Countries */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-[var(--color-indeks-green)]" />
                  <h3 className="text-sm font-semibold">Top Countries</h3>
                </div>
                {topCountries.length > 0 ? (
                  <div className="space-y-2">
                    {topCountries.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                        <span className="text-xs truncate flex-1">{c.country}</span>
                        <span className="text-xs font-medium">{formatNumber(c.visitor_count)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No location data yet</p>
                )}
              </Card>

              {/* Recently Updated - spans 2 columns */}
              <Card className="p-4 sm:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-[var(--color-indeks-blue)]" />
                  <h3 className="text-sm font-semibold">Recently Updated</h3>
                </div>
                {recentlyUpdated.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recentlyUpdated.map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                          <div className={`h-1.5 w-1.5 rounded-full mr-1.5 ${getStatusColor(project.isActive)}`} />
                          {project.title}
                          <span className="text-muted-foreground ml-1.5">{formatDate(project.updatedAt)}</span>
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No recent updates</p>
                )}
              </Card>
            </div>

            {/* All Projects Card */}
            <Card className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                    <h3 className="text-base sm:text-lg font-semibold">All Projects</h3>
                    <Badge variant="secondary" className="text-xs">{filteredProjects.length}</Badge>
                  </div>
                  <div className="hidden md:flex items-center gap-1 border rounded-lg p-1">
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-7 px-2"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-7 px-2"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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
                      variant={filterStatus === "active" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setFilterStatus("active")}
                      className="h-7 px-2 sm:px-3 text-xs"
                    >
                      <Activity className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Active</span>
                    </Button>
                    <Button
                      variant={filterStatus === "inactive" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setFilterStatus("inactive")}
                      className="h-7 px-2 sm:px-3 text-xs"
                    >
                      <Minus className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Inactive</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Projects Content with Fixed Height and Scroll */}
              {filteredProjects.length === 0 ? (
                <div className="py-8">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><Search /></EmptyMedia>
                      <EmptyTitle>No projects found</EmptyTitle>
                      <EmptyDescription>Try adjusting your search or filter.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              ) : (
                <>
                  {/* Mobile: Card View with scroll */}
                  <div className="md:hidden max-h-[400px] overflow-y-auto space-y-3 pr-1">
                    {filteredProjects.map((project) => {
                      const stats = projectStats[project.id];
                      const perf = getPerformanceIndicator(stats?.totalPageViews || 0);
                      const PerfIcon = perf.icon;
                      const liveCount = realtimeCounts[project.id] || 0;
                      return (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                          <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusColor(project.isActive)}`} />
                                  <h4 className="font-medium text-sm truncate">{project.title}</h4>
                                  <PerfIcon className={cn("h-3 w-3 shrink-0", perf.color)} />
                                </div>
                                <p className="text-xs text-muted-foreground truncate mb-2">
                                  {getHostname(project.link)}
                                </p>
                                <div className="flex items-center gap-3 text-xs">
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3 text-[var(--color-indeks-green)]" />
                                    <span className="font-medium">{stats ? formatNumber(stats.totalPageViews) : "-"}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-[var(--color-indeks-blue)]" />
                                    <span className="font-medium">{stats ? formatNumber(stats.totalUniqueVisitors) : "-"}</span>
                                  </div>
                                  {liveCount > 0 && (
                                    <div className="flex items-center gap-1">
                                      <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-indeks-green)] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-indeks-green)]"></span>
                                      </span>
                                      <span className="font-medium">{liveCount}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <Badge variant={project.isActive ? "success" : "error"} className="text-[10px]">
                                  {project.isActive ? "active" : "inactive"}
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground mt-auto" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Desktop: Table or Grid View with scroll */}
                  <div className="hidden md:block max-h-[500px] overflow-y-auto">
                    {viewMode === "list" ? (
                      <Frame className="w-full">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead>Project</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-center">Live</TableHead>
                              <TableHead className="text-right">Views</TableHead>
                              <TableHead className="text-right">Visitors</TableHead>
                              <TableHead className="text-right hidden lg:table-cell">Sessions</TableHead>
                              <TableHead className="text-right hidden xl:table-cell">Avg Time</TableHead>
                              <TableHead className="text-center hidden xl:table-cell">Sync</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProjects.map((project) => {
                              const stats = projectStats[project.id];
                              const liveCount = realtimeCounts[project.id] || 0;
                              return (
                                <TableRow key={project.id}>
                                  <TableCell>
                                    <Link href={`/projects/${project.id}`} className="hover:text-[var(--color-indeks-blue)] transition-colors">
                                      <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusColor(project.isActive)}`} />
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium truncate">{project.title}</p>
                                          <p className="text-xs text-muted-foreground truncate max-w-48">
                                            {getHostname(project.link)}
                                          </p>
                                        </div>
                                      </div>
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant={project.isActive ? "success" : "error"} className="text-xs">
                                      {project.isActive ? "active" : "inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {liveCount > 0 ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-indeks-green)] opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-indeks-green)]"></span>
                                        </span>
                                        <span className="text-sm font-medium">{liveCount}</span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {stats ? formatNumber(stats.totalPageViews) : "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {stats ? formatNumber(stats.totalUniqueVisitors) : "-"}
                                  </TableCell>
                                  <TableCell className="text-right hidden lg:table-cell">
                                    {stats ? formatNumber(stats.totalSessions) : "-"}
                                  </TableCell>
                                  <TableCell className="text-right hidden xl:table-cell">
                                    {stats ? formatDuration(stats.avgSessionDuration) : "-"}
                                  </TableCell>
                                  <TableCell className="text-center hidden xl:table-cell">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleSync(project.id);
                                      }}
                                      disabled={syncing === project.id}
                                    >
                                      <RefreshCw className={cn("h-3.5 w-3.5", syncing === project.id && "animate-spin")} />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </Frame>
                    ) : (
                      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                        {filteredProjects.map((project) => {
                          const stats = projectStats[project.id];
                          const perf = getPerformanceIndicator(stats?.totalPageViews || 0);
                          const PerfIcon = perf.icon;
                          const liveCount = realtimeCounts[project.id] || 0;
                          return (
                            <Link key={project.id} href={`/projects/${project.id}`}>
                              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors h-full">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusColor(project.isActive)}`} />
                                    <h4 className="font-medium text-sm truncate">{project.title}</h4>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {liveCount > 0 && (
                                      <div className="flex items-center gap-1">
                                        <span className="relative flex h-1.5 w-1.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-indeks-green)] opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-indeks-green)]"></span>
                                        </span>
                                        <span className="text-xs font-medium">{liveCount}</span>
                                      </div>
                                    )}
                                    <PerfIcon className={cn("h-4 w-4", perf.color)} />
                                    <Badge variant={project.isActive ? "success" : "error"} className="text-xs">
                                      {project.isActive ? "active" : "inactive"}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mb-3">
                                  {getHostname(project.link)}
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3 text-[var(--color-indeks-green)]" />
                                      <p className="text-xs text-muted-foreground">Views</p>
                                    </div>
                                    <p className="text-sm font-semibold">{stats ? formatNumber(stats.totalPageViews) : "-"}</p>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3 text-[var(--color-indeks-blue)]" />
                                      <p className="text-xs text-muted-foreground">Visitors</p>
                                    </div>
                                    <p className="text-sm font-semibold">{stats ? formatNumber(stats.totalUniqueVisitors) : "-"}</p>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-[var(--color-indeks-yellow)]" />
                                      <p className="text-xs text-muted-foreground">Time</p>
                                    </div>
                                    <p className="text-sm font-semibold">{stats ? formatDuration(stats.avgSessionDuration) : "-"}</p>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
