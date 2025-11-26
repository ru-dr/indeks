"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { RealtimeGlobe } from "@/components/ui/cobe-globe";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Users,
  Globe,
  MapPin,
  Activity,
  Clock,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  title: string;
  isActive: boolean;
}

interface RealtimeStats {
  total_events: number;
  page_views: number;
  active_users: number;
  active_sessions: number;
}

interface RecentEvent {
  event_type: string;
  url: string | null;
  timestamp: string;
}

interface TopPage {
  url: string;
  totalPageViews: number;
  totalUniqueVisitors: number;
}

interface Referrer {
  referrerDomain: string | null;
  totalVisits: number;
}

interface CountryData {
  country: string;
  event_count: number;
  visitor_count: number;
}

export default function RealtimeTrafficPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/v1/projects");
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          setProjects(result.data);
          setSelectedProject(result.data[0].id);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch realtime data
  const fetchRealtimeData = useCallback(async () => {
    if (!selectedProject) return;

    try {
      const [realtimeRes, pagesRes, referrersRes, locationsRes] = await Promise.all([
        fetch(`/api/analytics/${selectedProject}/realtime`),
        fetch(`/api/analytics/${selectedProject}/pages?startDate=${getDateString(-7)}&endDate=${getDateString(0)}`),
        fetch(`/api/analytics/${selectedProject}/referrers?startDate=${getDateString(-7)}&endDate=${getDateString(0)}`),
        fetch(`/api/analytics/${selectedProject}/locations`),
      ]);

      if (realtimeRes.ok) {
        const data = await realtimeRes.json();
        setRealtimeStats(data.realtime);
        setRecentEvents(data.recentEvents || []);
      }

      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setCountries(data.countries || []);
      }

      if (pagesRes.ok) {
        const data = await pagesRes.json();
        setTopPages(data.pages || []);
      }

      if (referrersRes.ok) {
        const data = await referrersRes.json();
        setReferrers(data.referrers || []);
      }
    } catch (err) {
      console.error("Error fetching realtime data:", err);
    }
  }, [selectedProject]);

  // Initial fetch and polling
  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchRealtimeData]);

  const getDateString = (daysOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split("T")[0];
  };

  const formatNumber = (num: number | undefined) => {
    if (!num) return "0";
    return num.toLocaleString();
  };

  // Calculate traffic source percentages
  const totalReferrerVisits = referrers.reduce((sum, r) => sum + r.totalVisits, 0);
  const trafficSources = referrers.slice(0, 5).map((r, i) => ({
    source: r.referrerDomain || "Direct",
    visits: r.totalVisits,
    percentage: totalReferrerVisits > 0 ? Math.round((r.totalVisits / totalReferrerVisits) * 100) : 0,
    color: ["bg-[var(--color-indeks-green)]", "bg-[var(--color-indeks-blue)]", "bg-[var(--color-indeks-yellow)]", "bg-[var(--color-indeks-orange)]", "bg-purple-500"][i] || "bg-gray-500",
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Realtime Traffic</h1>
            <p className="text-muted-foreground">
              Monitor your website&apos;s traffic and user activity in real-time
            </p>
          </div>
          <Card className="p-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderOpen />
                </EmptyMedia>
                <EmptyTitle>No projects yet</EmptyTitle>
                <EmptyDescription>
                  Create a project to start tracking realtime traffic.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Realtime Traffic
            </h1>
            <p className="text-muted-foreground">
              Monitor your website&apos;s traffic and user activity in real-time
            </p>
          </div>
          {projects.length > 1 && (
            <select
              value={selectedProject || ""}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Real-time Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <h3 className="text-2xl font-bold mt-2">
                  {formatNumber(realtimeStats?.active_users)}
                </h3>
                <Badge variant="success" className="text-xs mt-1">Live</Badge>
              </div>
              <Users className="h-8 w-8 text-[var(--color-indeks-blue)]" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Page Views (30m)</p>
                <h3 className="text-2xl font-bold mt-2">
                  {formatNumber(realtimeStats?.page_views)}
                </h3>
                <Badge variant="success" className="text-xs mt-1">Live</Badge>
              </div>
              <Activity className="h-8 w-8 text-[var(--color-indeks-green)]" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <h3 className="text-2xl font-bold mt-2">
                  {formatNumber(realtimeStats?.active_sessions)}
                </h3>
                <Badge variant="success" className="text-xs mt-1">Live</Badge>
              </div>
              <Clock className="h-8 w-8 text-[var(--color-indeks-yellow)]" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events (30m)</p>
                <h3 className="text-2xl font-bold mt-2">
                  {formatNumber(realtimeStats?.total_events)}
                </h3>
                <Badge variant="success" className="text-xs mt-1">Live</Badge>
              </div>
              <Globe className="h-8 w-8 text-[var(--color-indeks-orange)]" />
            </div>
          </Card>
        </div>

        {/* Globe and Top Pages */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Globe Visualization */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Global Traffic Map</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time visualization of visitor locations worldwide
                </p>
              </div>
              <div className="flex items-center justify-center py-4">
                <RealtimeGlobe
                  projectId={selectedProject || undefined}
                  className="w-full"
                  markerColor="#22c55e"
                  baseColor="#fff5e1"
                  opacity={1.0}
                  mapBrightness={5}
                />
              </div>
            </div>
          </Card>

          {/* Top Pages */}
          <Card className="p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-[var(--color-indeks-green)]" />
              <h3 className="text-lg font-semibold">Top Pages (7 days)</h3>
            </div>
            {topPages.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-80">
                {topPages.slice(0, 10).map((page, index) => (
                  <div
                    key={index}
                    className="bg-accent/30 hover:bg-accent/50 rounded-lg p-3 transition-colors border border-border/50"
                  >
                    <p className="text-sm font-medium truncate mb-2">{page.url}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatNumber(page.totalPageViews)} views</span>
                      <span>{formatNumber(page.totalUniqueVisitors)} visitors</span>
                    </div>
                    <div className="mt-2 w-full bg-secondary rounded-full h-1.5">
                      <div
                        className="bg-[var(--color-indeks-green)] h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, (page.totalPageViews / (topPages[0]?.totalPageViews || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><MapPin /></EmptyMedia>
                  <EmptyTitle>No page data</EmptyTitle>
                  <EmptyDescription>Run sync to see top pages.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        </div>

        {/* Countries and Traffic Sources */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Countries (Live) */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                <h3 className="text-lg font-semibold">Top Countries</h3>
                <Badge variant="success" className="text-xs">Live</Badge>
              </div>
              {countries.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {countries.slice(0, 10).map((country, index) => {
                    const maxVisitors = countries[0]?.visitor_count || 1;
                    const percentage = Math.round((country.visitor_count / maxVisitors) * 100);
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{country.country}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatNumber(country.visitor_count)} visitors
                          </span>
                        </div>
                        <div className="relative w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-[var(--color-indeks-blue)] h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><MapPin /></EmptyMedia>
                    <EmptyTitle>No location data</EmptyTitle>
                    <EmptyDescription>Location data will appear once visitors are tracked.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </Card>

          {/* Traffic Sources */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[var(--color-indeks-orange)]" />
                <h3 className="text-lg font-semibold">Traffic Sources</h3>
              </div>
              {trafficSources.length > 0 ? (
                <div className="space-y-3">
                  {trafficSources.map((source) => (
                    <div key={source.source} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{source.source}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(source.visits)} visits
                        </span>
                      </div>
                      <div className="relative w-full bg-secondary rounded-full h-2">
                        <div
                          className={`${source.color} h-2 rounded-full transition-all`}
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {source.percentage}% of total traffic
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Globe /></EmptyMedia>
                    <EmptyTitle>No referrer data</EmptyTitle>
                    <EmptyDescription>Run sync to see traffic sources.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </Card>
        </div>

        {/* Live Activity */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
              <h3 className="text-lg font-semibold">Live Activity</h3>
              <Badge variant="success" className="ml-2">Live</Badge>
            </div>
            {recentEvents.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-[var(--color-indeks-green)] animate-pulse" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.event_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-48">
                          {event.url || "—"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
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
                  <EmptyDescription>Events will appear here in real-time.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
