"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  TrendingUp,
  MousePointer,
  Play,
  Calendar,
  Loader2,
  FolderOpen,
  Activity,
  Eye,
  MousePointerClick,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  isActive: boolean;
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

interface RecentEvent {
  event_type: string;
  url: string | null;
  timestamp: string;
}

interface AnalyticsSummary {
  totalPageViews: number;
  totalClicks: number;
  totalErrors: number;
  rageClicks: number;
  deadClicks: number;
}

export default function EventsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [events, setEvents] = useState<EventBreakdown[]>([]);
  const [clicks, setClicks] = useState<ClickedElement[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

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

  const getDateRange = useCallback(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [days]);

  // Fetch event data
  const fetchEventData = useCallback(async () => {
    if (!selectedProject) return;

    const { startDate, endDate } = getDateRange();
    const query = `?startDate=${startDate}&endDate=${endDate}`;

    try {
      const [eventsRes, clicksRes, overviewRes, realtimeRes] = await Promise.all([
        fetch(`/api/analytics/${selectedProject}/events${query}`),
        fetch(`/api/analytics/${selectedProject}/clicks${query}`),
        fetch(`/api/analytics/${selectedProject}/overview${query}`),
        fetch(`/api/analytics/${selectedProject}/realtime`),
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }

      if (clicksRes.ok) {
        const data = await clicksRes.json();
        setClicks(data.clicks || []);
      }

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setSummary(data.summary);
      }

      if (realtimeRes.ok) {
        const data = await realtimeRes.json();
        setRecentEvents(data.recentEvents || []);
      }
    } catch (err) {
      console.error("Error fetching event data:", err);
    }
  }, [selectedProject, getDateRange]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  // Poll for realtime events
  useEffect(() => {
    if (!selectedProject) return;

    const fetchRealtime = async () => {
      try {
        const response = await fetch(`/api/analytics/${selectedProject}/realtime`);
        if (response.ok) {
          const data = await response.json();
          setRecentEvents(data.recentEvents || []);
        }
      } catch (err) {
        console.error("Error fetching realtime:", err);
      }
    };

    const interval = setInterval(fetchRealtime, 10000);
    return () => clearInterval(interval);
  }, [selectedProject]);

  const formatNumber = (num: number | undefined | null) => {
    if (!num) return "0";
    return num.toLocaleString();
  };

  // Calculate totals
  const totalEvents = events.reduce((sum, e) => sum + e.totalCount, 0);
  const totalClicks = clicks.reduce((sum, c) => sum + c.totalClicks, 0);

  // Group events by category
  const eventCategories = [
    {
      label: "Total Events",
      value: formatNumber(totalEvents),
      icon: TrendingUp,
      color: "text-[var(--color-indeks-blue)]",
    },
    {
      label: "Click Events",
      value: formatNumber(totalClicks),
      icon: MousePointer,
      color: "text-[var(--color-indeks-green)]",
    },
    {
      label: "Page Views",
      value: formatNumber(summary?.totalPageViews),
      icon: Eye,
      color: "text-[var(--color-indeks-yellow)]",
    },
    {
      label: "Errors",
      value: formatNumber(summary?.totalErrors),
      icon: Activity,
      color: "text-[var(--color-indeks-orange)]",
    },
  ];

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
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">
              Track and analyze user interactions and custom events
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
                  Create a project to start tracking events.
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
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">
              Track and analyze user interactions and custom events
            </p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Event Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {eventCategories.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Top Events Table & Events by Type */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Events */}
          <Card className="p-6 lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                <h3 className="text-lg font-semibold">Event Breakdown</h3>
              </div>
              {events.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">
                          Event Type
                        </th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">
                          Count
                        </th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">
                          Unique Users
                        </th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">
                          Avg/User
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event, index) => (
                        <tr
                          key={index}
                          className="border-b last:border-0 hover:bg-accent/50"
                        >
                          <td className="py-3 px-2">
                            <span className="text-sm font-mono">{event.eventType}</span>
                          </td>
                          <td className="text-right py-3 px-2">
                            <span className="text-sm font-semibold">
                              {formatNumber(event.totalCount)}
                            </span>
                          </td>
                          <td className="text-right py-3 px-2">
                            <span className="text-sm">
                              {formatNumber(event.totalUniqueUsers)}
                            </span>
                          </td>
                          <td className="text-right py-3 px-2">
                            <span className="text-sm">
                              {event.totalUniqueUsers > 0
                                ? (event.totalCount / event.totalUniqueUsers).toFixed(1)
                                : "0"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><TrendingUp /></EmptyMedia>
                    <EmptyTitle>No event data</EmptyTitle>
                    <EmptyDescription>Run sync to see event breakdown.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </Card>

          {/* Top Clicked Elements */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-5 w-5 text-[var(--color-indeks-green)]" />
                <h3 className="text-lg font-semibold">Top Clicked Elements</h3>
              </div>
              {clicks.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {clicks.slice(0, 10).map((click, index) => (
                    <div key={index} className="space-y-1 pb-3 border-b last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono bg-secondary px-2 py-1 rounded truncate max-w-32">
                          {click.elementSelector}
                        </span>
                        <span className="text-sm font-semibold">
                          {formatNumber(click.totalClicks)}
                        </span>
                      </div>
                      {click.elementText && (
                        <p className="text-xs text-muted-foreground truncate">
                          {click.elementText}
                        </p>
                      )}
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div
                          className="bg-[var(--color-indeks-green)] h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, (click.totalClicks / (clicks[0]?.totalClicks || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><MousePointerClick /></EmptyMedia>
                    <EmptyTitle>No click data</EmptyTitle>
                    <EmptyDescription>Run sync to see clicked elements.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Events Stream */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
              <h3 className="text-lg font-semibold">Recent Events Stream</h3>
              <Badge variant="success" className="ml-2">Live</Badge>
            </div>
            {recentEvents.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-[var(--color-indeks-green)] animate-pulse" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {event.event_type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-64">
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
                  <EmptyMedia variant="icon"><Play /></EmptyMedia>
                  <EmptyTitle>No recent events</EmptyTitle>
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
