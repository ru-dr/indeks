"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Eye,
  Zap,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";

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
  country: string | null;
  city: string | null;
}

interface CountryData {
  country: string;
  event_count: number;
  visitor_count: number;
}

interface LocationData {
  city: string | null;
  country: string | null;
  visitor_count: number;
}

interface DeviceData {
  deviceType: string;
  totalVisits: number;
}

export default function RealtimeTrafficPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [cities, setCities] = useState<LocationData[]>([]);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getDateString = (daysOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split("T")[0];
  };

  const fetchRealtimeData = useCallback(async () => {
    if (!selectedProject) return;

    try {
      const [realtimeRes, locationsRes, devicesRes] = await Promise.all([
        fetch(`/api/analytics/${selectedProject}/realtime`),
        fetch(`/api/analytics/${selectedProject}/locations`),
        fetch(`/api/analytics/${selectedProject}/devices?startDate=${getDateString(-1)}&endDate=${getDateString(0)}`),
      ]);

      if (realtimeRes.ok) {
        const data = await realtimeRes.json();
        setRealtimeStats(data.realtime);
        setRecentEvents(data.recentEvents || []);
      }

      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setCountries(data.countries || []);
        setCities(data.locations || []);
      }

      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data.deviceTypeBreakdown || []);
      }
    } catch (err) {
      console.error("Error fetching realtime data:", err);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 10000);
    return () => clearInterval(interval);
  }, [fetchRealtimeData]);

  const formatNumber = (num: number | undefined) => (num || 0).toLocaleString();

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "mobile": return Smartphone;
      case "tablet": return Tablet;
      default: return Monitor;
    }
  };

  const getDeviceColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "mobile": return "bg-[var(--color-indeks-green)]";
      case "tablet": return "bg-[var(--color-indeks-yellow)]";
      default: return "bg-[var(--color-indeks-blue)]";
    }
  };

  const totalDeviceVisits = devices.reduce((sum, d) => sum + d.totalVisits, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin" />
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
            <h1 className="text-3xl font-bold tracking-tight">Realtime Traffic</h1>
            <p className="text-muted-foreground">
              Monitor live traffic and user activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            {projects.length > 1 && (
              <select
                value={selectedProject || ""}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background text-sm"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
            <Badge variant="success" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </Badge>
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="p-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><FolderOpen /></EmptyMedia>
                <EmptyTitle>No projects yet</EmptyTitle>
                <EmptyDescription>Create a project to start tracking realtime traffic.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <h3 className="text-2xl font-bold mt-2">{formatNumber(realtimeStats?.active_users)}</h3>
                  </div>
                  <Users className="h-8 w-8 text-[var(--color-indeks-blue)]" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Page Views (30m)</p>
                    <h3 className="text-2xl font-bold mt-2">{formatNumber(realtimeStats?.page_views)}</h3>
                  </div>
                  <Eye className="h-8 w-8 text-[var(--color-indeks-green)]" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                    <h3 className="text-2xl font-bold mt-2">{formatNumber(realtimeStats?.active_sessions)}</h3>
                  </div>
                  <Clock className="h-8 w-8 text-[var(--color-indeks-yellow)]" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Events (30m)</p>
                    <h3 className="text-2xl font-bold mt-2">{formatNumber(realtimeStats?.total_events)}</h3>
                  </div>
                  <Zap className="h-8 w-8 text-[var(--color-indeks-orange)]" />
                </div>
              </Card>
            </div>

            {/* Globe & Live Activity */}
            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="p-6 lg:col-span-3">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                  <h3 className="text-lg font-semibold">Global Traffic Map</h3>
                </div>
                <div className="flex items-center justify-center">
                  <RealtimeGlobe
                    projectId={selectedProject || undefined}
                    markerColor="#22c55e"
                    baseColor="#fff5e1"
                    opacity={1.0}
                    mapBrightness={5}
                  />
                </div>
              </Card>

              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-[var(--color-indeks-green)]" />
                  <h3 className="text-lg font-semibold">Live Activity</h3>
                </div>
                {recentEvents.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {recentEvents.map((event, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-[var(--color-indeks-green)] animate-pulse" />
                          <div>
                            <Badge variant="outline" className="text-xs">{event.event_type}</Badge>
                            <p className="text-xs text-muted-foreground truncate max-w-40 mt-1">{event.url || "—"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</span>
                          {event.country && (
                            <p className="text-xs text-muted-foreground">{event.city ? `${event.city}, ` : ""}{event.country}</p>
                          )}
                        </div>
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
              </Card>
            </div>

            {/* Countries & Cities */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                  <h3 className="text-lg font-semibold">Top Countries</h3>
                </div>
                {countries.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {countries.slice(0, 10).map((country, i) => {
                      const maxVisitors = countries[0]?.visitor_count || 1;
                      const percentage = Math.round((country.visitor_count / maxVisitors) * 100);
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{country.country}</span>
                            <span className="text-sm text-muted-foreground">{formatNumber(country.visitor_count)} visitors</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div className="bg-[var(--color-indeks-blue)] h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
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
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-[var(--color-indeks-green)]" />
                  <h3 className="text-lg font-semibold">Active Cities</h3>
                </div>
                {cities.length > 0 ? (
                  <div className="grid gap-3 grid-cols-2 max-h-64 overflow-y-auto">
                    {cities.slice(0, 8).map((loc, i) => (
                      <div key={i} className="p-3 rounded-lg border hover:bg-muted/50">
                        <p className="text-sm font-medium truncate">{loc.city || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{loc.country}</p>
                        <p className="text-lg font-bold mt-1">{loc.visitor_count}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><MapPin /></EmptyMedia>
                      <EmptyTitle>No city data</EmptyTitle>
                      <EmptyDescription>City data will appear once visitors are tracked.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </Card>
            </div>

            {/* Devices */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
                <h3 className="text-lg font-semibold">Device Breakdown</h3>
              </div>
              {devices.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {devices.map((device, i) => {
                    const DeviceIcon = getDeviceIcon(device.deviceType);
                    const percentage = totalDeviceVisits > 0 ? Math.round((device.totalVisits / totalDeviceVisits) * 100) : 0;
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium capitalize">{device.deviceType}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{formatNumber(device.totalVisits)}</span>
                            <span className="text-sm font-semibold">{percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className={`${getDeviceColor(device.deviceType)} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Monitor /></EmptyMedia>
                    <EmptyTitle>No device data</EmptyTitle>
                    <EmptyDescription>Device breakdown will appear after syncing.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
