"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Frame } from "@/components/ui/frame";
import { RealtimeGlobe } from "@/components/ui/cobe-globe";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  latitude: number;
  longitude: number;
  event_count: number;
  visitor_count: number;
}

interface DeviceData {
  deviceType: string;
  totalVisits: number;
}

export default function RealtimeTrafficPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(
    null,
  );
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [cities, setCities] = useState<LocationData[]>([]);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextRefresh, setNextRefresh] = useState(10);

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

  const fetchRealtimeData = useCallback(async () => {
    if (!selectedProject) return;

    try {
      const [realtimeRes, locationsRes] = await Promise.all([
        fetch(`/api/v1/analytics/${selectedProject}/realtime`),
        fetch(`/api/v1/analytics/${selectedProject}/locations`),
      ]);

      if (realtimeRes.ok) {
        const data = await realtimeRes.json();
        setRealtimeStats(data.realtime);
        setRecentEvents(data.recentEvents || []);
        setDevices(data.devices || []);
      }

      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setCountries(data.countries || []);
        setCities(data.locations || []);
      }

      setNextRefresh(10);
    } catch (err) {
      console.error("Error fetching realtime data:", err);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 10000);
    return () => clearInterval(interval);
  }, [fetchRealtimeData]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setNextRefresh((prev) => (prev > 0 ? prev - 1 : 10));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const formatNumber = (num: number | undefined) => (num || 0).toLocaleString();

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "mobile":
        return Smartphone;
      case "tablet":
        return Tablet;
      default:
        return Monitor;
    }
  };

  const getDeviceColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "mobile":
        return "bg-[var(--color-indeks-green)]";
      case "tablet":
        return "bg-[var(--color-indeks-yellow)]";
      default:
        return "bg-[var(--color-indeks-blue)]";
    }
  };

  const totalDeviceVisits = devices.reduce((sum, d) => sum + d.totalVisits, 0);

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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Realtime Traffic
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor live traffic and user activity
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {projects.length > 1 && (
              <select
                value={selectedProject || ""}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background text-sm flex-1 sm:flex-none min-w-0"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
            <Badge variant="success" className="gap-1 shrink-0">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </Badge>
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="p-8 sm:p-12">
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
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      Active Users
                    </p>
                    <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                      {formatNumber(realtimeStats?.active_users)}
                    </h3>
                  </div>
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-blue)] shrink-0" />
                </div>
              </Card>
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      Page Views
                    </p>
                    <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                      {formatNumber(realtimeStats?.page_views)}
                    </h3>
                  </div>
                  <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-green)] shrink-0" />
                </div>
              </Card>
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      Sessions
                    </p>
                    <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                      {formatNumber(realtimeStats?.active_sessions)}
                    </h3>
                  </div>
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-yellow)] shrink-0" />
                </div>
              </Card>
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      Events
                    </p>
                    <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                      {formatNumber(realtimeStats?.total_events)}
                    </h3>
                  </div>
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-orange)] shrink-0" />
                </div>
              </Card>
            </div>

            {/* Globe Card with Details */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Globe className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                <h3 className="text-base sm:text-lg font-semibold">
                  Global Traffic Map
                </h3>
                <Badge variant="outline" className="ml-auto text-xs">
                  {cities.length} locations
                </Badge>
              </div>

              {/* Mobile: Stack vertically, Desktop: Side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Globe */}
                <div className="flex items-center justify-center order-1 lg:order-1">
                  <div className="w-full max-w-[280px] sm:max-w-[500px] lg:max-w-[700px] aspect-square">
                    <RealtimeGlobe
                      projectId={selectedProject || undefined}
                      markerColor="#22c55e"
                      baseColor="#fff5e1"
                      opacity={1.0}
                      mapBrightness={5}
                      className="!min-h-0"
                      style={{ minHeight: "auto" }}
                    />
                  </div>
                </div>

                {/* Location Details - Table View */}
                <div className="order-2 lg:order-2 h-full flex flex-col">
                  {cities.length > 0 ? (
                    <>
                      {/* Desktop: Table View */}
                      <div className="hidden md:block">
                        <Frame className="w-full">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Location</TableHead>
                                <TableHead className="text-center">
                                  Status
                                </TableHead>
                                <TableHead className="text-right">
                                  Visitors
                                </TableHead>
                                <TableHead className="text-right">
                                  Events
                                </TableHead>
                                <TableHead className="text-right">
                                  Coordinates
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cities.slice(0, 10).map((loc, i) => (
                                <TableRow key={i}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="h-2 w-2 rounded-full bg-[var(--color-indeks-green)] animate-pulse shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium">
                                          {loc.city || "Unknown"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {loc.country}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge
                                      variant="success"
                                      className="text-xs"
                                    >
                                      Live
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {loc.visitor_count}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatNumber(loc.event_count)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {loc.latitude?.toFixed(2)}°,{" "}
                                      {loc.longitude?.toFixed(2)}°
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Frame>

                        {/* Summary below table */}
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-lg font-bold">{cities.length}</p>
                            <p className="text-xs text-muted-foreground">
                              Active Locations
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-lg font-bold">
                              {countries.length}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Countries
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-lg font-bold">
                              {formatNumber(
                                cities.reduce(
                                  (sum, c) => sum + c.visitor_count,
                                  0,
                                ),
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total Visitors
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile: Card View */}
                      <div className="md:hidden space-y-3">
                        {cities.slice(0, 8).map((loc, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="h-2 w-2 rounded-full bg-[var(--color-indeks-green)] animate-pulse shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {loc.city || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {loc.country}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-sm font-bold">
                                {loc.visitor_count}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                visitors
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Mobile Summary */}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <div className="p-2 rounded-lg bg-muted/30 text-center">
                            <p className="text-base font-bold">
                              {cities.length}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Locations
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/30 text-center">
                            <p className="text-base font-bold">
                              {countries.length}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Countries
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/30 text-center">
                            <p className="text-base font-bold">
                              {formatNumber(
                                cities.reduce(
                                  (sum, c) => sum + c.visitor_count,
                                  0,
                                ),
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Visitors
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[300px]">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <MapPin />
                          </EmptyMedia>
                          <EmptyTitle>No active locations</EmptyTitle>
                          <EmptyDescription className="text-xs sm:text-sm">
                            Location data will appear once visitors are tracked.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Live Activity & Devices */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Live Activity */}
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Activity className="h-5 w-5 text-[var(--color-indeks-green)]" />
                  <h3 className="text-base sm:text-lg font-semibold">
                    Live Activity
                  </h3>
                  <span className="ml-auto text-xs text-muted-foreground">
                    Refresh in {nextRefresh}s
                  </span>
                </div>
                {recentEvents.length > 0 ? (
                  <div className="space-y-1.5 sm:space-y-2 max-h-64 sm:max-h-80 overflow-y-auto">
                    {recentEvents.map((event, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 py-2 px-2 sm:px-3 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="h-2 w-2 rounded-full bg-[var(--color-indeks-green)] animate-pulse shrink-0" />
                          <div className="min-w-0 flex-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] sm:text-xs"
                            >
                              {event.event_type}
                            </Badge>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5 sm:mt-1">
                              {event.url || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] sm:text-xs text-muted-foreground block">
                            {new Date(event.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {event.country && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-[120px]">
                              {event.city ? `${event.city}` : event.country}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Activity />
                      </EmptyMedia>
                      <EmptyTitle>No recent activity</EmptyTitle>
                      <EmptyDescription className="text-xs sm:text-sm">
                        Events will appear here in real-time.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </Card>

              {/* Device Breakdown */}
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
                  <h3 className="text-base sm:text-lg font-semibold">
                    Device Breakdown
                  </h3>
                </div>
                {devices.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {devices.map((device, i) => {
                      const DeviceIcon = getDeviceIcon(device.deviceType);
                      const percentage =
                        totalDeviceVisits > 0
                          ? Math.round(
                              (device.totalVisits / totalDeviceVisits) * 100,
                            )
                          : 0;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium capitalize">
                                {device.deviceType}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {formatNumber(device.totalVisits)}
                              </span>
                              <span className="text-xs sm:text-sm font-semibold w-10 text-right">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`${getDeviceColor(device.deviceType)} h-2 rounded-full transition-all`}
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
                      <EmptyMedia variant="icon">
                        <Monitor />
                      </EmptyMedia>
                      <EmptyTitle>No device data</EmptyTitle>
                      <EmptyDescription className="text-xs sm:text-sm">
                        Device breakdown will appear after syncing.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </Card>
            </div>

            {/* Top Countries */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <MapPin className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                <h3 className="text-base sm:text-lg font-semibold">
                  Top Countries
                </h3>
                <Badge variant="outline" className="ml-auto text-xs">
                  Last 30 min
                </Badge>
              </div>
              {countries.length > 0 ? (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {countries.slice(0, 8).map((country, i) => {
                    const maxVisitors = countries[0]?.visitor_count || 1;
                    const percentage = Math.round(
                      (country.visitor_count / maxVisitors) * 100,
                    );
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {country.country}
                          </span>
                          <span className="text-sm text-muted-foreground shrink-0 ml-2">
                            {formatNumber(country.visitor_count)}
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
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
                    <EmptyMedia variant="icon">
                      <MapPin />
                    </EmptyMedia>
                    <EmptyTitle>No location data</EmptyTitle>
                    <EmptyDescription className="text-xs sm:text-sm">
                      Location data will appear once visitors are tracked.
                    </EmptyDescription>
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
