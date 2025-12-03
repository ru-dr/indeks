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
  Loader2,
  FolderOpen,
  Activity,
  Eye,
  MousePointerClick,
  AlertTriangle,
  XCircle,
  Zap,
  FileText,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ExternalLink,
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

interface RecentEvent {
  event_type: string;
  url: string | null;
  timestamp: string;
  country: string | null;
  city: string | null;
  user_agent: string | null;
  referrer: string | null;
  session_id: string | null;
}

interface TopPage {
  url: string;
  totalPageViews: number;
  totalUniqueVisitors: number;
  avgTimeOnPage: number;
}

interface DeviceBreakdown {
  deviceType: string;
  totalVisits: number;
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

  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [devices, setDevices] = useState<DeviceBreakdown[]>([]);
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
      const [eventsRes, overviewRes, realtimeRes, pagesRes, devicesRes] = await Promise.all([
        fetch(`/api/analytics/${selectedProject}/events${query}`),
        fetch(`/api/analytics/${selectedProject}/overview${query}`),
        fetch(`/api/analytics/${selectedProject}/realtime`),
        fetch(`/api/analytics/${selectedProject}/pages${query}&limit=5`),
        fetch(`/api/analytics/${selectedProject}/devices${query}`),
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setSummary(data.summary);
      }

      if (realtimeRes.ok) {
        const data = await realtimeRes.json();
        setRecentEvents(data.recentEvents || []);
      }

      if (pagesRes.ok) {
        const data = await pagesRes.json();
        setTopPages(data.pages || []);
      }

      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data.deviceTypeBreakdown || []);
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
    if (num === null || num === undefined) return "0";
    
    // Use Intl.NumberFormat for compact notation (enterprise standard)
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Calculate totals
  const totalEvents = events.reduce((sum, e) => sum + e.totalCount, 0);
  const totalClicks = summary?.totalClicks || 0;

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
              <Card key={stat.label} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <h3 className="text-xl font-bold mt-1 truncate" title={stat.value}>{stat.value}</h3>
                  </div>
                  <Icon className={`h-6 w-6 shrink-0 ${stat.color}`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Event Breakdown - Left Column (2/3 width) */}
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

          {/* Right Column - Stacked Cards */}
          <div className="flex flex-col gap-6">
            {/* Top Pages */}
            <Card className="p-6 flex-1">
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                  <h3 className="text-lg font-semibold">Top Pages</h3>
                </div>
                {topPages.length > 0 ? (
                  <div className="space-y-2 flex-1">
                    {topPages.slice(0, 5).map((page, index) => {
                      const maxViews = topPages[0]?.totalPageViews || 1;
                      const percentage = Math.round((page.totalPageViews / maxViews) * 100);
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm truncate flex-1" title={page.url}>
                              {(() => {
                                try {
                                  const url = new URL(page.url);
                                  return url.pathname || "/";
                                } catch {
                                  return page.url;
                                }
                              })()}
                            </span>
                            <span className="text-sm font-semibold tabular-nums shrink-0">
                              {formatNumber(page.totalPageViews)}
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1">
                            <div
                              className="bg-[var(--color-indeks-blue)] h-1 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No page data yet</p>
                )}
              </div>
            </Card>

            {/* Device Breakdown */}
            <Card className="p-6 flex-1">
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-[var(--color-indeks-green)]" />
                  <h3 className="text-lg font-semibold">Devices</h3>
                </div>
                {devices.length > 0 ? (
                  <div className="space-y-2 flex-1">
                    {(() => {
                      const totalVisits = devices.reduce((sum, d) => sum + d.totalVisits, 0);
                      const getDeviceIcon = (type: string) => {
                        switch (type?.toLowerCase()) {
                          case "mobile": return Smartphone;
                          case "tablet": return Tablet;
                          default: return Monitor;
                        }
                      };
                      const getDeviceColor = (type: string) => {
                        switch (type?.toLowerCase()) {
                          case "mobile": return "var(--color-indeks-blue)";
                          case "tablet": return "var(--color-indeks-yellow)";
                          default: return "var(--color-indeks-green)";
                        }
                      };
                      return devices.map((device, index) => {
                        const Icon = getDeviceIcon(device.deviceType);
                        const color = getDeviceColor(device.deviceType);
                        const percentage = totalVisits > 0 ? (device.totalVisits / totalVisits) * 100 : 0;
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm capitalize">{device.deviceType || "Unknown"}</span>
                                <span className="text-sm font-semibold">{percentage.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-1 mt-1">
                                <div
                                  className="h-1 rounded-full"
                                  style={{ width: `${percentage}%`, backgroundColor: color }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No device data yet</p>
                )}
              </div>
            </Card>

            {/* Interaction Quality */}
            <Card className="p-6 flex-1">
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
                  <h3 className="text-lg font-semibold">Interaction Quality</h3>
                </div>
                <div className="space-y-2 flex-1">
                  {/* Rage Clicks */}
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[var(--color-indeks-orange)]" />
                        <span className="text-sm">Rage Clicks</span>
                      </div>
                      <span className="text-sm font-bold">{formatNumber(summary?.rageClicks)}</span>
                    </div>
                  </div>

                  {/* Dead Clicks */}
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="text-sm">Dead Clicks</span>
                      </div>
                      <span className="text-sm font-bold">{formatNumber(summary?.deadClicks)}</span>
                    </div>
                  </div>

                  {/* Total Clicks */}
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-[var(--color-indeks-green)]" />
                        <span className="text-sm">Total Clicks</span>
                      </div>
                      <span className="text-sm font-bold">{formatNumber(summary?.totalClicks)}</span>
                    </div>
                  </div>

                  {/* Errors */}
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[var(--color-indeks-blue)]" />
                        <span className="text-sm">JS Errors</span>
                      </div>
                      <span className="text-sm font-bold">{formatNumber(summary?.totalErrors)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Events Stream - Full Width */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
              <h3 className="text-lg font-semibold">Recent Events Stream</h3>
              <Badge variant="success" className="ml-2">Live</Badge>
            </div>
            {recentEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Event</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Page</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Location</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Device</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Source</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEvents.map((event, index) => {
                      // Parse user agent for device info
                      const getDeviceInfo = (ua: string | null) => {
                        if (!ua) return { type: "Unknown", icon: Monitor };
                        const lowerUA = ua.toLowerCase();
                        if (lowerUA.includes("mobile") || lowerUA.includes("android") || lowerUA.includes("iphone")) {
                          return { type: "Mobile", icon: Smartphone };
                        }
                        if (lowerUA.includes("tablet") || lowerUA.includes("ipad")) {
                          return { type: "Tablet", icon: Tablet };
                        }
                        return { type: "Desktop", icon: Monitor };
                      };
                      const deviceInfo = getDeviceInfo(event.user_agent);
                      const DeviceIcon = deviceInfo.icon;
                      
                      // Get browser from user agent
                      const getBrowser = (ua: string | null) => {
                        if (!ua) return null;
                        if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
                        if (ua.includes("Firefox")) return "Firefox";
                        if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
                        if (ua.includes("Edg")) return "Edge";
                        return null;
                      };
                      const browser = getBrowser(event.user_agent);

                      // Parse referrer
                      const getSource = (ref: string | null) => {
                        if (!ref) return "Direct";
                        try {
                          const url = new URL(ref);
                          return url.hostname.replace("www.", "");
                        } catch {
                          return ref.substring(0, 20);
                        }
                      };

                      // Parse page path
                      const getPagePath = (url: string | null) => {
                        if (!url) return "/";
                        try {
                          const parsed = new URL(url);
                          return parsed.pathname || "/";
                        } catch {
                          return url;
                        }
                      };

                      return (
                        <tr key={index} className="border-b last:border-0 hover:bg-accent/50">
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-[var(--color-indeks-green)] animate-pulse" />
                              <span className="font-mono text-xs font-medium">{event.event_type}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <span className="text-xs text-muted-foreground truncate max-w-32 block" title={event.url || undefined}>
                              {getPagePath(event.url)}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            {event.country ? (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">
                                  {event.city ? `${event.city}, ` : ""}{event.country}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1">
                              <DeviceIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">
                                {browser || deviceInfo.type}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            {event.referrer ? (
                              <div className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs truncate max-w-24 block" title={event.referrer}>
                                  {getSource(event.referrer)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Direct</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
