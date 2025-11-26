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
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Clock,
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  link: string;
  isActive: boolean;
}

interface ProjectAnalytics {
  projectId: string;
  projectTitle: string;
  summary: {
    totalPageViews: number;
    totalUniqueVisitors: number;
    totalSessions: number;
    totalClicks: number;
    avgBounceRate: number;
    avgSessionDuration: number;
  };
}

interface DeviceBreakdown {
  deviceType: string;
  totalVisits: number;
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch all projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/v1/projects");
        const result = await response.json();
        if (result.success) {
          setProjects(result.data || []);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProjects();
  }, []);

  // Fetch analytics for all projects
  const fetchAllAnalytics = useCallback(async () => {
    if (projects.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { startDate, endDate } = getDateRange();
    const query = `?startDate=${startDate}&endDate=${endDate}`;

    const analyticsPromises = projects.map(async (project) => {
      try {
        const response = await fetch(`/api/analytics/${project.id}/overview${query}`);
        if (response.ok) {
          const data = await response.json();
          return {
            projectId: project.id,
            projectTitle: project.title,
            summary: data.summary,
          };
        }
      } catch (err) {
        console.error(`Error fetching analytics for ${project.id}:`, err);
      }
      return null;
    });

    // Fetch device breakdown from first active project (as sample)
    const activeProject = projects.find((p) => p.isActive);
    if (activeProject) {
      try {
        const deviceRes = await fetch(`/api/analytics/${activeProject.id}/devices${query}`);
        if (deviceRes.ok) {
          const data = await deviceRes.json();
          // Aggregate device types
          const deviceMap = new Map<string, number>();
          (data.deviceTypeBreakdown || []).forEach((d: DeviceBreakdown) => {
            const current = deviceMap.get(d.deviceType) || 0;
            deviceMap.set(d.deviceType, current + d.totalVisits);
          });
          setDeviceBreakdown(
            Array.from(deviceMap.entries()).map(([deviceType, totalVisits]) => ({
              deviceType,
              totalVisits,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching devices:", err);
      }
    }

    const results = await Promise.all(analyticsPromises);
    setProjectAnalytics(results.filter((r): r is ProjectAnalytics => r !== null));
    setLoading(false);
  }, [projects, getDateRange]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  // Aggregate totals
  const totals = projectAnalytics.reduce(
    (acc, pa) => ({
      pageViews: acc.pageViews + (pa.summary?.totalPageViews || 0),
      visitors: acc.visitors + (pa.summary?.totalUniqueVisitors || 0),
      sessions: acc.sessions + (pa.summary?.totalSessions || 0),
      clicks: acc.clicks + (pa.summary?.totalClicks || 0),
      bounceRateSum: acc.bounceRateSum + (pa.summary?.avgBounceRate || 0),
      sessionDurationSum: acc.sessionDurationSum + (pa.summary?.avgSessionDuration || 0),
      count: acc.count + 1,
    }),
    { pageViews: 0, visitors: 0, sessions: 0, clicks: 0, bounceRateSum: 0, sessionDurationSum: 0, count: 0 }
  );

  const avgBounceRate = totals.count > 0 ? totals.bounceRateSum / totals.count : 0;
  const avgSessionDuration = totals.count > 0 ? totals.sessionDurationSum / totals.count : 0;

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatNumber = (num: number) => num.toLocaleString();

  // Calculate device percentages
  const totalDeviceVisits = deviceBreakdown.reduce((sum, d) => sum + d.totalVisits, 0);
  const deviceStats = deviceBreakdown.map((d) => ({
    device: d.deviceType.charAt(0).toUpperCase() + d.deviceType.slice(1),
    visits: d.totalVisits,
    percentage: totalDeviceVisits > 0 ? Math.round((d.totalVisits / totalDeviceVisits) * 100) : 0,
    icon: d.deviceType === "mobile" ? Smartphone : d.deviceType === "tablet" ? Tablet : Monitor,
    color:
      d.deviceType === "mobile"
        ? "bg-[var(--color-indeks-green)]"
        : d.deviceType === "tablet"
        ? "bg-[var(--color-indeks-yellow)]"
        : "bg-[var(--color-indeks-blue)]",
  }));

  const hasData = totals.pageViews > 0 || totals.sessions > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Aggregated analytics across all your projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Period:</span>
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
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="p-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderOpen />
                </EmptyMedia>
                <EmptyTitle>No projects yet</EmptyTitle>
                <EmptyDescription>
                  Create a project to start tracking analytics.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Visitors
                    </p>
                    <h3 className="text-2xl font-bold mt-2">
                      {hasData ? formatNumber(totals.visitors) : "—"}
                    </h3>
                  </div>
                  <Users className="h-8 w-8 text-[var(--color-indeks-blue)]" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Page Views
                    </p>
                    <h3 className="text-2xl font-bold mt-2">
                      {hasData ? formatNumber(totals.pageViews) : "—"}
                    </h3>
                  </div>
                  <Eye className="h-8 w-8 text-[var(--color-indeks-green)]" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg. Session Duration
                    </p>
                    <h3 className="text-2xl font-bold mt-2">
                      {hasData ? formatDuration(avgSessionDuration) : "—"}
                    </h3>
                  </div>
                  <Clock className="h-8 w-8 text-[var(--color-indeks-yellow)]" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Bounce Rate
                    </p>
                    <h3 className="text-2xl font-bold mt-2">
                      {hasData ? `${avgBounceRate.toFixed(1)}%` : "—"}
                    </h3>
                  </div>
                  <MousePointer className="h-8 w-8 text-[var(--color-indeks-orange)]" />
                </div>
              </Card>
            </div>

            {/* Device Stats & Project Breakdown */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Device Breakdown */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-[var(--color-indeks-green)]" />
                    <h3 className="text-lg font-semibold">Device Breakdown</h3>
                  </div>
                  {deviceStats.length > 0 ? (
                    <div className="space-y-4">
                      {deviceStats.map((device) => {
                        const DeviceIcon = device.icon;
                        return (
                          <div key={device.device} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {device.device}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {formatNumber(device.visits)} visits
                                </span>
                                <span className="text-sm font-semibold">
                                  {device.percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className={`${device.color} h-2 rounded-full transition-all`}
                                style={{ width: `${device.percentage}%` }}
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
                          <Smartphone />
                        </EmptyMedia>
                        <EmptyTitle>No device data</EmptyTitle>
                        <EmptyDescription>
                          Device breakdown will appear after syncing.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </div>
              </Card>

              {/* Projects Performance */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                    <h3 className="text-lg font-semibold">Projects Performance</h3>
                  </div>
                  {projectAnalytics.length > 0 ? (
                    <div className="space-y-3">
                      {projectAnalytics
                        .sort((a, b) => (b.summary?.totalPageViews || 0) - (a.summary?.totalPageViews || 0))
                        .slice(0, 5)
                        .map((pa) => (
                          <Link
                            key={pa.projectId}
                            href={`/projects/${pa.projectId}`}
                            className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/50 hover:bg-accent/50 transition-colors"
                          >
                            <div>
                              <p className="text-sm font-medium">{pa.projectTitle}</p>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <p className="text-xs text-muted-foreground">Views</p>
                                <p className="text-sm font-semibold">
                                  {formatNumber(pa.summary?.totalPageViews || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Visitors</p>
                                <p className="text-sm font-semibold">
                                  {formatNumber(pa.summary?.totalUniqueVisitors || 0)}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  ) : (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <BarChart3 />
                        </EmptyMedia>
                        <EmptyTitle>No analytics data</EmptyTitle>
                        <EmptyDescription>
                          Run sync on your projects to see performance data.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </div>
              </Card>
            </div>

            {/* All Projects Table */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[var(--color-indeks-orange)]" />
                  <h3 className="text-lg font-semibold">All Projects</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Project
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Page Views
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Visitors
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Sessions
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Bounce Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => {
                        const analytics = projectAnalytics.find(
                          (pa) => pa.projectId === project.id
                        );
                        return (
                          <tr
                            key={project.id}
                            className="border-b last:border-0 hover:bg-accent/50"
                          >
                            <td className="py-3 px-4">
                              <Link
                                href={`/projects/${project.id}`}
                                className="text-sm font-medium hover:text-[var(--color-indeks-blue)] transition-colors"
                              >
                                {project.title}
                              </Link>
                            </td>
                            <td className="text-right py-3 px-4">
                              <span className="text-sm">
                                {formatNumber(analytics?.summary?.totalPageViews || 0)}
                              </span>
                            </td>
                            <td className="text-right py-3 px-4">
                              <span className="text-sm">
                                {formatNumber(analytics?.summary?.totalUniqueVisitors || 0)}
                              </span>
                            </td>
                            <td className="text-right py-3 px-4">
                              <span className="text-sm">
                                {formatNumber(analytics?.summary?.totalSessions || 0)}
                              </span>
                            </td>
                            <td className="text-right py-3 px-4">
                              <Badge variant="outline" className="text-xs">
                                {(analytics?.summary?.avgBounceRate || 0).toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
