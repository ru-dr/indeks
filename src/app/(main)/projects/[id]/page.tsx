"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  }[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Project state
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Analytics state (from Postgres - historical)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Realtime state (from ClickHouse - live)
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [realtimeLoading, setRealtimeLoading] = useState(true);

  // Date range
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

  // Fetch project details
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

  // Fetch historical analytics from Postgres
  const fetchAnalytics = useCallback(async () => {
    if (!projectId) return;
    
    setAnalyticsLoading(true);
    const { startDate, endDate } = getDateRange();
    const query = `?startDate=${startDate}&endDate=${endDate}`;

    try {
      const [overviewRes, pagesRes] = await Promise.all([
        fetch(`/api/analytics/${projectId}/overview${query}`),
        fetch(`/api/analytics/${projectId}/pages${query}`),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setSummary(data.summary);
      }

      if (pagesRes.ok) {
        const data = await pagesRes.json();
        setTopPages(data.pages || []);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [projectId, getDateRange]);

  // Fetch realtime data from ClickHouse
  const fetchRealtime = useCallback(async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/analytics/${projectId}/realtime`);
      if (response.ok) {
        const data = await response.json();
        setRealtime(data);
      }
    } catch (err) {
      console.error("Error fetching realtime:", err);
    } finally {
      setRealtimeLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
    fetchRealtime();
  }, [fetchAnalytics, fetchRealtime]);

  // Realtime polling - every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchRealtime, 10000);
    return () => clearInterval(interval);
  }, [fetchRealtime]);

  // Re-fetch analytics when date range changes
  useEffect(() => {
    fetchAnalytics();
  }, [days, fetchAnalytics]);

  const copyApiKey = () => {
    if (!project) return;
    navigator.clipboard.writeText(project.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`/api/analytics/${projectId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      // Wait then refresh
      setTimeout(() => {
        fetchAnalytics();
        setSyncing(false);
      }, 3000);
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncing(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-[var(--color-indeks-green)]" : "bg-muted-foreground";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "0";
    return num.toLocaleString();
  };

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
            <Button onClick={() => router.push("/projects")}>
              View All Projects
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const hasData = summary && (summary.totalPageViews > 0 || summary.totalSessions > 0);

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
          <div className="flex items-start gap-4">
            <div className="mt-2">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`h-3 w-3 rounded-full ${getStatusColor(project.isActive)}`}
                />
                <h1 className="text-3xl font-bold tracking-tight">
                  {project.title}
                </h1>
                <Badge variant={project.isActive ? "success" : "error"}>
                  {project.isActive ? "active" : "inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <Link
                    href={
                      project.link.startsWith("http")
                        ? project.link
                        : `https://${project.link}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--color-indeks-blue)] transition-colors"
                  >
                    {
                      new URL(
                        project.link.startsWith("http")
                          ? project.link
                          : `https://${project.link}`,
                      ).hostname
                    }
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Updated {getTimeAgo(project.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {syncing ? "Syncing..." : "Sync Data"}
            </Button>
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Project Settings
            </Button>
          </div>
        </div>

        {/* API Key Card */}
        <Card className="p-6 border-2 border-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">API Key</h2>
              <p className="text-sm text-muted-foreground">
                Use this key to integrate analytics into your project
              </p>
            </div>
            <Key
              className="h-6 w-6"
              style={{ color: "var(--color-indeks-blue)" }}
            />
          </div>

          <div className="rounded-lg bg-secondary p-4">
            <div className="flex items-center justify-between gap-4">
              <code className="text-sm font-mono flex-1">
                {project.publicKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyApiKey}
                className="shrink-0"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed">
            <p className="text-xs text-muted-foreground mb-2">
              <strong>Installation:</strong> Add this script to your
              website&apos;s HTML:
            </p>
            <code className="text-xs font-mono text-muted-foreground block">
              {`<script src="https://indeks.io/analytics.js" data-api-key="${project.publicKey}"></script>`}
            </code>
          </div>
        </Card>

        {/* Live Activity Banner */}
        {realtime && realtime.realtime.total_events > 0 && (
          <Card className="p-4 border-2 border-green-500/30 bg-green-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold">Live Now</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Active Users: </span>
                  <span className="font-bold">{realtime.realtime.active_users}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sessions: </span>
                  <span className="font-bold">{realtime.realtime.active_sessions}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Events (30m): </span>
                  <span className="font-bold">{realtime.realtime.total_events}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Historical data:</span>
          <Button
            variant={days === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(7)}
          >
            7 days
          </Button>
          <Button
            variant={days === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(30)}
          >
            30 days
          </Button>
          <Button
            variant={days === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(90)}
          >
            90 days
          </Button>
          {analyticsLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
          )}
        </div>

        {/* Stats Overview (Historical from Postgres) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-5 w-5" style={{ color: "var(--color-indeks-green)" }} />
              <p className="text-sm text-muted-foreground">Page Views</p>
            </div>
            {hasData ? (
              <h3 className="text-2xl font-bold">{formatNumber(summary?.totalPageViews)}</h3>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Eye /></EmptyMedia>
                  <EmptyTitle>No data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5" style={{ color: "var(--color-indeks-blue)" }} />
              <p className="text-sm text-muted-foreground">Unique Visitors</p>
            </div>
            {hasData ? (
              <h3 className="text-2xl font-bold">{formatNumber(summary?.totalUniqueVisitors)}</h3>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Users /></EmptyMedia>
                  <EmptyTitle>No data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5" style={{ color: "var(--color-indeks-yellow)" }} />
              <p className="text-sm text-muted-foreground">Avg Session</p>
            </div>
            {hasData ? (
              <h3 className="text-2xl font-bold">{formatDuration(summary?.avgSessionDuration || 0)}</h3>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Clock /></EmptyMedia>
                  <EmptyTitle>No data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5" style={{ color: "var(--color-indeks-orange)" }} />
              <p className="text-sm text-muted-foreground">Bounce Rate</p>
            </div>
            {hasData ? (
              <h3 className="text-2xl font-bold">{(summary?.avgBounceRate || 0).toFixed(1)}%</h3>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><TrendingUp /></EmptyMedia>
                  <EmptyTitle>No data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <MousePointerClick className="h-5 w-5" style={{ color: "var(--color-indeks-green)" }} />
              <p className="text-sm text-muted-foreground">Total Clicks</p>
            </div>
            {hasData ? (
              <h3 className="text-2xl font-bold">{formatNumber(summary?.totalClicks)}</h3>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><MousePointerClick /></EmptyMedia>
                  <EmptyTitle>No data</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        </div>

        {/* Recent Activity (Live from ClickHouse) and Top Pages (Historical from Postgres) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity - LIVE from ClickHouse */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5" style={{ color: "var(--color-indeks-blue)" }} />
                <div>
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                  <p className="text-xs text-muted-foreground">
                    Live events from the last 30 minutes
                  </p>
                </div>
              </div>
              {realtimeLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {realtime && realtime.recentEvents.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {realtime.recentEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-accent/30 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {event.event_type}
                      </Badge>
                      <span className="text-muted-foreground truncate">
                        {event.url || "—"}
                      </span>
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
                  <EmptyDescription>
                    Events will appear here in real-time once tracking starts.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </Card>

          {/* Top Pages - Historical from Postgres */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-5 w-5" style={{ color: "var(--color-indeks-green)" }} />
              <div>
                <h3 className="text-lg font-semibold">Top Pages</h3>
                <p className="text-xs text-muted-foreground">
                  Most visited pages in the last {days} days
                </p>
              </div>
            </div>
            {topPages && topPages.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {topPages.slice(0, 10).map((page, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-accent/30 text-sm"
                  >
                    <span className="truncate max-w-48">{page.url}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground">
                        {formatNumber(page.totalPageViews)} views
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                  <EmptyTitle>No page data</EmptyTitle>
                  <EmptyDescription>
                    Run sync to aggregate page statistics.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
