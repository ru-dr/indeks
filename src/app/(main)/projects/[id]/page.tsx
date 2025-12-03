"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Key,
  Copy,
  Eye,
  Users,
  Clock,
  TrendingUp,
  Activity,
  ArrowLeft,
  Settings,
  Globe,
  Calendar,
  BarChart3,
  MousePointerClick,
  FileText,
  RefreshCw,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  ExternalLink,
  Zap,
  Link2,
  MapPin,
  Code,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

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

interface AnalyticsSummary {
  totalPageViews: number;
  totalUniqueVisitors: number;
  totalSessions: number;
  totalClicks: number;
  avgBounceRate: number;
  avgSessionDuration: number;
  totalRageClicks: number;
  totalDeadClicks: number;
  totalErrors: number;
}

interface TopPage {
  url: string;
  totalPageViews: number;
  totalUniqueVisitors: number;
  avgTimeOnPage: number;
}

interface Referrer {
  referrer: string;
  referrerDomain: string | null;
  totalVisits: number;
  totalUniqueVisitors: number;
}

interface Device {
  deviceType: string;
  browser: string | null;
  os: string | null;
  totalVisits: number;
  totalUniqueVisitors: number;
}

interface DeviceTypeBreakdown {
  deviceType: string;
  totalVisits: number;
}

interface EventBreakdown {
  eventType: string;
  totalCount: number;
  totalUniqueUsers: number;
}

interface ClickedElement {
  elementSelector: string;
  elementText: string | null;
  elementTag: string | null;
  pageUrl: string | null;
  totalClicks: number;
  totalUniqueUsers: number;
}

interface RealtimeData {
  realtime: {
    total_events: number;
    page_views: number;
    active_users: number;
    active_sessions: number;
  };
  recentEvents: {
    event_type: string;
    url: string | null;
    timestamp: string;
    country: string | null;
    city: string | null;
  }[];
}

interface LocationData {
  locations: {
    country: string | null;
    city: string | null;
    latitude: number;
    longitude: number;
    event_count: number;
    visitor_count: number;
  }[];
  countries: {
    country: string;
    event_count: number;
    visitor_count: number;
  }[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceTypeBreakdown, setDeviceTypeBreakdown] = useState<DeviceTypeBreakdown[]>([]);
  const [events, setEvents] = useState<EventBreakdown[]>([]);
  const [clicks, setClicks] = useState<ClickedElement[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [locations, setLocations] = useState<LocationData | null>(null);
  const [realtimeLoading, setRealtimeLoading] = useState(true);

  const [days, setDays] = useState(30);

  const getDateRange = useCallback(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [days]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/projects/${projectId}`);
        const result = await response.json();
        if (result.success) {
          setProject(result.data);
        } else {
          setError(result.message || "Failed to fetch project");
        }
      } catch (err) {
        setError("An error occurred while fetching the project");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const fetchAnalytics = useCallback(async () => {
    if (!projectId) return;
    setAnalyticsLoading(true);
    const { startDate, endDate } = getDateRange();
    const query = `?startDate=${startDate}&endDate=${endDate}`;

    try {
      const [overviewRes, pagesRes, referrersRes, devicesRes, eventsRes, clicksRes] =
        await Promise.all([
          fetch(`/api/analytics/${projectId}/overview${query}`),
          fetch(`/api/analytics/${projectId}/pages${query}`),
          fetch(`/api/analytics/${projectId}/referrers${query}`),
          fetch(`/api/analytics/${projectId}/devices${query}`),
          fetch(`/api/analytics/${projectId}/events${query}`),
          fetch(`/api/analytics/${projectId}/clicks${query}`),
        ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setSummary(data.summary);
      }
      if (pagesRes.ok) {
        const data = await pagesRes.json();
        setTopPages(data.pages || []);
      }
      if (referrersRes.ok) {
        const data = await referrersRes.json();
        setReferrers(data.referrers || []);
      }
      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data.devices || []);
        setDeviceTypeBreakdown(data.deviceTypeBreakdown || []);
      }
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }
      if (clicksRes.ok) {
        const data = await clicksRes.json();
        setClicks(data.clicks || []);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [projectId, getDateRange]);

  const fetchRealtime = useCallback(async () => {
    if (!projectId) return;
    try {
      const [realtimeRes, locationsRes] = await Promise.all([
        fetch(`/api/analytics/${projectId}/realtime`),
        fetch(`/api/analytics/${projectId}/locations`),
      ]);
      if (realtimeRes.ok) {
        const data = await realtimeRes.json();
        setRealtime(data);
      }
      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setLocations(data);
      }
    } catch (err) {
      console.error("Error fetching realtime:", err);
    } finally {
      setRealtimeLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAnalytics();
    fetchRealtime();
  }, [fetchAnalytics, fetchRealtime]);

  useEffect(() => {
    const interval = setInterval(fetchRealtime, 10000);
    return () => clearInterval(interval);
  }, [fetchRealtime]);

  useEffect(() => {
    fetchAnalytics();
  }, [days, fetchAnalytics]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`/api/analytics/${projectId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setTimeout(() => {
        fetchAnalytics();
        setSyncing(false);
      }, 3000);
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatNumber = (num: number | null | undefined) => {
    return (num ?? 0).toLocaleString();
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getTotalDeviceVisits = () =>
    deviceTypeBreakdown.reduce((acc, d) => acc + (d.totalVisits || 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.push("/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <Card className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading project...</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.push("/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The project you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push("/projects")}>View All Projects</Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.push("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>

        {/* Project Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`h-3 w-3 rounded-full ${project.isActive ? "bg-[var(--color-indeks-green)]" : "bg-muted-foreground"}`}
              />
              <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
              <Badge variant={project.isActive ? "success" : "error"}>
                {project.isActive ? "active" : "inactive"}
              </Badge>
              {project.category && <Badge variant="outline">{project.category}</Badge>}
            </div>
            {project.description && (
              <p className="text-muted-foreground mb-3 max-w-2xl">{project.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link
                href={project.link.startsWith("http") ? project.link : `https://${project.link}`}
                target="_blank"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Globe className="h-4 w-4" />
                {(() => {
                  try {
                    return new URL(
                      project.link.startsWith("http") ? project.link : `https://${project.link}`
                    ).hostname;
                  } catch {
                    return project.link;
                  }
                })()}
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {formatDate(project.createdAt)}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Updated {getTimeAgo(project.updatedAt)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {syncing ? "Syncing..." : "Sync"}
            </Button>
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* API Key & Installation */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4" style={{ color: "var(--color-indeks-blue)" }} />
              <span className="text-sm font-medium">API Key</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-secondary px-3 py-2 rounded truncate">
                {project.publicKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(project.publicKey, "key")}
              >
                {copied === "key" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-4 w-4" style={{ color: "var(--color-indeks-green)" }} />
              <span className="text-sm font-medium">Installation Script</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-secondary px-3 py-2 rounded truncate text-muted-foreground">
                {`<script src="https://cdn.indeks.io/sdk.js" data-api-key="${project.publicKey}" async></script>`}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    `<script src="https://cdn.indeks.io/sdk.js" data-api-key="${project.publicKey}" async></script>`,
                    "script"
                  )
                }
              >
                {copied === "script" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
        </div>

        {/* Live Activity Banner */}
        {realtime && realtime.realtime.total_events > 0 && (
          <Card className="p-4 border-green-500/30 bg-green-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold">Live</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span>
                  <Users className="h-4 w-4 inline mr-1" />
                  {realtime.realtime.active_users} users
                </span>
                <span>
                  <Activity className="h-4 w-4 inline mr-1" />
                  {realtime.realtime.active_sessions} sessions
                </span>
                <span>
                  <Zap className="h-4 w-4 inline mr-1" />
                  {realtime.realtime.total_events} events
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
          {analyticsLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-5 w-5" style={{ color: "var(--color-indeks-green)" }} />
              <span className="text-xs text-muted-foreground">Page Views</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(summary?.totalPageViews)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5" style={{ color: "var(--color-indeks-blue)" }} />
              <span className="text-xs text-muted-foreground">Visitors</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(summary?.totalUniqueVisitors)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5" style={{ color: "var(--color-indeks-yellow)" }} />
              <span className="text-xs text-muted-foreground">Avg Session</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(summary?.avgSessionDuration || 0)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5" style={{ color: "var(--color-indeks-orange)" }} />
              <span className="text-xs text-muted-foreground">Bounce Rate</span>
            </div>
            <p className="text-2xl font-bold">{(summary?.avgBounceRate || 0).toFixed(1)}%</p>
          </Card>
        </div>

        {/* Recent Activity & Top Pages */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5" style={{ color: "var(--color-indeks-blue)" }} />
              <h3 className="font-semibold">Recent Activity</h3>
              <span className="text-xs text-muted-foreground ml-auto">Live 30m</span>
              {realtimeLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {realtime?.recentEvents?.length ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {realtime.recentEvents.map((event, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-accent/30 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-xs shrink-0">{event.event_type}</Badge>
                      <span className="truncate text-muted-foreground">{event.url || "—"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Activity /></EmptyMedia>
                  <EmptyTitle>No recent activity</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5" style={{ color: "var(--color-indeks-green)" }} />
              <h3 className="font-semibold">Top Pages</h3>
            </div>
            {topPages.length ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {topPages.slice(0, 10).map((page, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-accent/30 text-sm">
                    <span className="truncate flex-1">{page.url}</span>
                    <span className="shrink-0 ml-2 text-muted-foreground">
                      {formatNumber(page.totalPageViews)} views
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                  <EmptyTitle>No page data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        </div>

        {/* Referrers & Devices */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="h-5 w-5" style={{ color: "var(--color-indeks-blue)" }} />
              <h3 className="font-semibold">Traffic Sources</h3>
            </div>
            {referrers.length ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {referrers.slice(0, 10).map((ref, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-accent/30 text-sm">
                    <span className="truncate flex-1">{ref.referrerDomain || ref.referrer || "Direct"}</span>
                    <span className="shrink-0 ml-2 text-muted-foreground">
                      {formatNumber(ref.totalVisits)} visits
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Link2 /></EmptyMedia>
                  <EmptyTitle>No referrer data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="h-5 w-5" style={{ color: "var(--color-indeks-yellow)" }} />
              <h3 className="font-semibold">Devices</h3>
            </div>
            {deviceTypeBreakdown.length ? (
              <div className="space-y-4">
                {deviceTypeBreakdown.map((device, i) => {
                  const total = getTotalDeviceVisits();
                  const percent = total > 0 ? (device.totalVisits / total) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {getDeviceIcon(device.deviceType)}
                          <span className="capitalize">{device.deviceType}</span>
                        </span>
                        <span>{percent.toFixed(1)}%</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Monitor /></EmptyMedia>
                  <EmptyTitle>No device data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        </div>

        {/* Browsers & Events */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Chrome className="h-5 w-5" style={{ color: "var(--color-indeks-blue)" }} />
              <h3 className="font-semibold">Browsers & OS</h3>
            </div>
            {devices.length ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {devices.slice(0, 10).map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-accent/30 text-sm">
                    <span className="flex items-center gap-2">
                      {getDeviceIcon(d.deviceType)}
                      <span>{d.browser || "Unknown"} / {d.os || "Unknown"}</span>
                    </span>
                    <span className="text-muted-foreground">{formatNumber(d.totalVisits)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Chrome /></EmptyMedia>
                  <EmptyTitle>No browser data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5" style={{ color: "var(--color-indeks-orange)" }} />
              <h3 className="font-semibold">Events</h3>
            </div>
            {events.length ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {events.map((event, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-accent/30 text-sm">
                    <Badge variant="outline">{event.eventType}</Badge>
                    <div className="flex items-center gap-4">
                      <span>{formatNumber(event.totalCount)} total</span>
                      <span className="text-muted-foreground">{formatNumber(event.totalUniqueUsers)} users</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Zap /></EmptyMedia>
                  <EmptyTitle>No event data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        </div>

        {/* Clicked Elements & Locations */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <MousePointerClick className="h-5 w-5" style={{ color: "var(--color-indeks-green)" }} />
              <h3 className="font-semibold">Top Clicked Elements</h3>
            </div>
            {clicks.length ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {clicks.slice(0, 10).map((click, i) => (
                  <div key={i} className="p-2 rounded bg-accent/30 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-xs shrink-0">{click.elementTag || "el"}</Badge>
                        <span className="truncate">{click.elementText || click.elementSelector}</span>
                      </div>
                      <span className="shrink-0 ml-2 font-medium">{formatNumber(click.totalClicks)}</span>
                    </div>
                    {click.pageUrl && (
                      <p className="text-xs text-muted-foreground truncate mt-1">{click.pageUrl}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><MousePointerClick /></EmptyMedia>
                  <EmptyTitle>No click data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5" style={{ color: "var(--color-indeks-blue)" }} />
              <h3 className="font-semibold">Countries</h3>
              <span className="text-xs text-muted-foreground ml-auto">Live 30m</span>
            </div>
            {locations?.countries?.length ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {locations.countries.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-accent/30 text-sm">
                    <span>{c.country}</span>
                    <span className="text-muted-foreground">{formatNumber(c.visitor_count)} visitors</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Globe /></EmptyMedia>
                  <EmptyTitle>No location data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        </div>

        {/* Cities */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5" style={{ color: "var(--color-indeks-green)" }} />
            <h3 className="font-semibold">Cities</h3>
            <span className="text-xs text-muted-foreground ml-auto">Live 30m</span>
          </div>
          {locations?.locations?.length ? (
            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-h-64 overflow-y-auto">
              {locations.locations.slice(0, 20).map((loc, i) => (
                <div key={i} className="p-2 rounded bg-accent/30 text-sm">
                  <p className="font-medium truncate">{loc.city || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{loc.country} • {loc.visitor_count} visitors</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><MapPin /></EmptyMedia>
                <EmptyTitle>No city data</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
