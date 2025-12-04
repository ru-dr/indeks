"use client";

import { Frame } from "@/components/ui/frame";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
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
  Smartphone,
  Monitor,
  Tablet,
  Loader2,
  FolderOpen,
  Zap,
  FileText,
  Link2,
  MapPin,
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
  projectLink: string;
  summary: {
    totalPageViews: number;
    totalUniqueVisitors: number;
    totalSessions: number;
    totalClicks: number;
    avgBounceRate: number;
    avgSessionDuration: number;
    totalRageClicks: number;
    totalDeadClicks: number;
    totalErrors: number;
  };
  topPages: { url: string; totalPageViews: number; totalUniqueVisitors: number }[];
  referrers: { referrerDomain: string | null; totalVisits: number }[];
  devices: { deviceType: string; totalVisits: number }[];
}

interface CountryData {
  country: string;
  event_count: number;
  visitor_count: number;
  projectTitle?: string;
}

interface AggregatedPage {
  url: string;
  totalPageViews: number;
  totalUniqueVisitors: number;
  projectTitle: string;
  projectId: string;
}

interface AggregatedReferrer {
  domain: string;
  totalVisits: number;
  projectTitle: string;
  projectId: string;
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics[]>([]);
  const [countries, setCountries] = useState<(CountryData & { projectTitle: string; projectId: string })[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
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
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/v1/projects");
        const result = await response.json();
        if (result.success) {
          setProjects(result.data || []);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const fetchAllAnalytics = useCallback(async () => {
    if (projects.length === 0) return;

    setAnalyticsLoading(true);
    const { startDate, endDate } = getDateRange();
    const query = `?startDate=${startDate}&endDate=${endDate}`;

    const analyticsPromises = projects.map(async (project) => {
      try {
        const [overviewRes, pagesRes, referrersRes, devicesRes] = await Promise.all([
          fetch(`/api/v1/analytics/${project.id}/overview${query}`),
          fetch(`/api/v1/analytics/${project.id}/pages${query}&limit=10`),
          fetch(`/api/v1/analytics/${project.id}/referrers${query}&limit=10`),
          fetch(`/api/v1/analytics/${project.id}/devices${query}`),
        ]);

        const overview = overviewRes.ok ? await overviewRes.json() : { summary: null };
        const pages = pagesRes.ok ? await pagesRes.json() : { pages: [] };
        const referrers = referrersRes.ok ? await referrersRes.json() : { referrers: [] };
        const devices = devicesRes.ok ? await devicesRes.json() : { deviceTypeBreakdown: [] };

        return {
          projectId: project.id,
          projectTitle: project.title,
          projectLink: project.link,
          summary: overview.summary,
          topPages: pages.pages || [],
          referrers: referrers.referrers || [],
          devices: devices.deviceTypeBreakdown || [],
        };
      } catch (err) {
        console.error(`Error fetching analytics for ${project.id}:`, err);
        return null;
      }
    });

    const results = await Promise.all(analyticsPromises);
    setProjectAnalytics(results.filter((r): r is ProjectAnalytics => r !== null));
    setAnalyticsLoading(false);
  }, [projects, getDateRange]);

  const fetchCountries = useCallback(async () => {
    if (projects.length === 0) return;

    try {
      const allCountries: (CountryData & { projectTitle: string; projectId: string })[] = [];

      for (const project of projects) {
        try {
          const response = await fetch(`/api/v1/analytics/${project.id}/locations`);
          if (response.ok) {
            const data = await response.json();
            (data.countries || []).forEach((c: CountryData) => {
              allCountries.push({
                ...c,
                projectTitle: project.title,
                projectId: project.id,
              });
            });
          }
        } catch {
          // Continue with other projects
        }
      }

      allCountries.sort((a, b) => b.visitor_count - a.visitor_count);
      setCountries(allCountries);
    } catch (err) {
      console.error("Error fetching countries:", err);
    }
  }, [projects]);

  useEffect(() => {
    if (projects.length > 0) {
      fetchAllAnalytics();
    }
  }, [projects, fetchAllAnalytics]);

  useEffect(() => {
    if (projects.length > 0) {
      fetchCountries();
      const interval = setInterval(fetchCountries, 30000);
      return () => clearInterval(interval);
    }
  }, [projects, fetchCountries]);

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

  const aggregatedDevices = projectAnalytics.reduce((acc, pa) => {
    pa.devices.forEach((d) => {
      const visits = Number(d.totalVisits || 0);
      const existing = acc.find((a) => a.deviceType === d.deviceType);
      if (existing) existing.totalVisits += visits;
      else acc.push({ deviceType: d.deviceType, totalVisits: visits });
    });
    return acc;
  }, [] as { deviceType: string; totalVisits: number }[]);

  const aggregatedReferrers: AggregatedReferrer[] = projectAnalytics.flatMap((pa) =>
    pa.referrers.map((r) => ({
      domain: r.referrerDomain || "Direct",
      totalVisits: r.totalVisits,
      projectTitle: pa.projectTitle,
      projectId: pa.projectId,
    }))
  ).sort((a, b) => b.totalVisits - a.totalVisits).slice(0, 15);

  const aggregatedPages: AggregatedPage[] = projectAnalytics.flatMap((pa) =>
    pa.topPages.map((p) => ({
      url: p.url,
      totalPageViews: p.totalPageViews,
      totalUniqueVisitors: p.totalUniqueVisitors,
      projectTitle: pa.projectTitle,
      projectId: pa.projectId,
    }))
  ).sort((a, b) => b.totalPageViews - a.totalPageViews).slice(0, 15);

  const avgBounceRate = totals.count > 0 ? totals.bounceRateSum / totals.count : 0;
  const avgSessionDuration = totals.count > 0 ? totals.sessionDurationSum / totals.count : 0;
  const totalDeviceVisits = aggregatedDevices.reduce((sum, d) => sum + Number(d.totalVisits || 0), 0);
  const totalCountryVisitors = countries.reduce((sum, c) => sum + c.visitor_count, 0);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatNumber = (num: number) => num.toLocaleString();

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

  const hasData = totals.pageViews > 0 || totals.sessions > 0;

  // Show loading spinner during initial project fetch
  if (initialLoading) {
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
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Aggregated analytics across all {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {projects.length > 0 && (
              <>
                <Button variant={days === 7 ? "default" : "outline"} size="sm" onClick={() => setDays(7)}>7d</Button>
                <Button variant={days === 30 ? "default" : "outline"} size="sm" onClick={() => setDays(30)}>30d</Button>
                <Button variant={days === 90 ? "default" : "outline"} size="sm" onClick={() => setDays(90)}>90d</Button>
              </>
            )}
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="p-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><FolderOpen /></EmptyMedia>
                <EmptyTitle>No projects yet</EmptyTitle>
                <EmptyDescription>Create a project to start tracking analytics.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Visitors</p>
                    <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                      {analyticsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : hasData ? formatNumber(totals.visitors) : "—"}
                    </h3>
                  </div>
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-blue)]" />
                </div>
              </Card>
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Page Views</p>
                    <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                      {analyticsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : hasData ? formatNumber(totals.pageViews) : "—"}
                    </h3>
                  </div>
                  <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-green)]" />
                </div>
              </Card>
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Sessions</p>
                    <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                      {analyticsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : hasData ? formatNumber(totals.sessions) : "—"}
                    </h3>
                  </div>
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-yellow)]" />
                </div>
              </Card>
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Bounce Rate</p>
                    <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                      {analyticsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : hasData ? `${avgBounceRate.toFixed(1)}%` : "—"}
                    </h3>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-orange)]" />
                </div>
              </Card>
            </div>

            {/* Projects Table */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                <h3 className="text-base sm:text-lg font-semibold">Projects Overview</h3>
                {analyticsLoading && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
              </div>
              {projectAnalytics.length > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-[600px] px-4 sm:px-0">
                    <Frame className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead className="text-right">Views</TableHead>
                            <TableHead className="text-right">Visitors</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">Sessions</TableHead>
                            <TableHead className="text-right hidden md:table-cell">Avg Duration</TableHead>
                            <TableHead className="text-right">Bounce</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectAnalytics.sort((a, b) => (b.summary?.totalPageViews || 0) - (a.summary?.totalPageViews || 0)).map((pa) => (
                            <TableRow key={pa.projectId}>
                              <TableCell>
                                <Link href={`/projects/${pa.projectId}`} className="hover:text-[var(--color-indeks-blue)] transition-colors">
                                  <p className="text-sm font-medium truncate">{pa.projectTitle}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-32 sm:max-w-48">{pa.projectLink}</p>
                                </Link>
                              </TableCell>
                              <TableCell className="text-right font-semibold">{formatNumber(pa.summary?.totalPageViews || 0)}</TableCell>
                              <TableCell className="text-right">{formatNumber(pa.summary?.totalUniqueVisitors || 0)}</TableCell>
                              <TableCell className="text-right hidden sm:table-cell">{formatNumber(pa.summary?.totalSessions || 0)}</TableCell>
                              <TableCell className="text-right hidden md:table-cell">{formatDuration(pa.summary?.avgSessionDuration || 0)}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className="text-xs">{(pa.summary?.avgBounceRate || 0).toFixed(1)}%</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell className="font-semibold">Total ({projects.length} projects)</TableCell>
                            <TableCell className="text-right font-semibold">{formatNumber(totals.pageViews)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatNumber(totals.visitors)}</TableCell>
                            <TableCell className="text-right font-semibold hidden sm:table-cell">{formatNumber(totals.sessions)}</TableCell>
                            <TableCell className="text-right font-semibold hidden md:table-cell">{formatDuration(avgSessionDuration)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="text-xs">{avgBounceRate.toFixed(1)}%</Badge>
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </Frame>
                  </div>
                </div>
              ) : analyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><BarChart3 /></EmptyMedia>
                    <EmptyTitle>No analytics data</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              )}
            </Card>

            {/* Devices & Countries */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
                  <h3 className="text-base sm:text-lg font-semibold">Devices</h3>
                </div>
                {aggregatedDevices.length > 0 ? (
                  <div className="space-y-4">
                    {aggregatedDevices.map((device) => {
                      const DeviceIcon = getDeviceIcon(device.deviceType);
                      const percentage = totalDeviceVisits > 0 ? (device.totalVisits / totalDeviceVisits) * 100 : 0;
                      return (
                        <div key={device.deviceType} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium capitalize">{device.deviceType}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{formatNumber(device.totalVisits)}</span>
                              <span className="text-sm font-semibold">{percentage.toFixed(1)}%</span>
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
                    </EmptyHeader>
                  </Empty>
                )}
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <MapPin className="h-5 w-5 text-[var(--color-indeks-green)]" />
                  <h3 className="text-base sm:text-lg font-semibold">Top Countries</h3>
                  <Badge variant="outline" className="ml-auto text-xs">Last 30 min</Badge>
                </div>
                {countries.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {countries.slice(0, 10).map((country, i) => {
                      const percentage = totalCountryVisitors > 0 ? Math.round((country.visitor_count / totalCountryVisitors) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium">{country.country}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">{country.projectTitle}</Badge>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm text-muted-foreground">{formatNumber(country.visitor_count)}</span>
                            <span className="text-xs font-semibold w-8 text-right">{percentage}%</span>
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
                      <EmptyDescription>Country data appears from recent traffic.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </Card>
            </div>

            {/* Top Pages & Traffic Sources */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-[var(--color-indeks-green)]" />
                  <h3 className="text-base sm:text-lg font-semibold">Top Pages</h3>
                </div>
                {aggregatedPages.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {aggregatedPages.map((page, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-sm gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">{page.projectTitle}</Badge>
                          <span className="truncate text-muted-foreground">{page.url}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-medium">{formatNumber(page.totalPageViews)}</span>
                          <span className="text-xs text-muted-foreground">views</span>
                        </div>
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

              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Link2 className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                  <h3 className="text-base sm:text-lg font-semibold">Traffic Sources</h3>
                </div>
                {aggregatedReferrers.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {aggregatedReferrers.map((ref, i) => {
                      const totalReferrerVisits = aggregatedReferrers.reduce((s, r) => s + r.totalVisits, 0);
                      const percentage = totalReferrerVisits > 0 ? Math.round((ref.totalVisits / totalReferrerVisits) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-sm gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">{ref.projectTitle}</Badge>
                            <span className="truncate font-medium">{ref.domain}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-muted-foreground">{formatNumber(ref.totalVisits)}</span>
                            <span className="text-xs font-semibold w-8 text-right">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
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
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
