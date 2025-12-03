"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CommitGraph } from "@/components/dashboard/CommitGraph";
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
import Link from "next/link";
import {
  Eye,
  Users,
  MousePointerClick,
  TrendingUp,
  FolderKanban,
  MoreVertical,
  Calendar,
  Activity,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  link: string;
  isActive: boolean;
  createdAt: string;
}

interface ProjectStats {
  totalPageViews: number;
  totalUniqueVisitors: number;
  totalClicks: number;
  avgSessionDuration: number;
}

interface RecentEvent {
  event_type: string;
  url: string | null;
  timestamp: string;
}

interface AggregatedStats {
  totalViews: number;
  totalVisitors: number;
  totalEvents: number;
  activeProjects: number;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [recentEvents, setRecentEvents] = useState<{ event: RecentEvent; projectTitle: string }[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats>({
    totalViews: 0,
    totalVisitors: 0,
    totalEvents: 0,
    activeProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch projects
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
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch stats for all projects
  const fetchAllStats = useCallback(async () => {
    if (projects.length === 0) return;

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const query = `?startDate=${start.toISOString().split("T")[0]}&endDate=${end.toISOString().split("T")[0]}`;

    const statsMap: Record<string, ProjectStats> = {};
    let totalViews = 0;
    let totalVisitors = 0;
    let totalEvents = 0;
    const allRecentEvents: { event: RecentEvent; projectTitle: string }[] = [];

    await Promise.all(
      projects.map(async (project) => {
        try {
          // Fetch overview
          const overviewRes = await fetch(`/api/analytics/${project.id}/overview${query}`);
          if (overviewRes.ok) {
            const data = await overviewRes.json();
            const stats = {
              totalPageViews: data.summary?.totalPageViews || 0,
              totalUniqueVisitors: data.summary?.totalUniqueVisitors || 0,
              totalClicks: data.summary?.totalClicks || 0,
              avgSessionDuration: data.summary?.avgSessionDuration || 0,
            };
            statsMap[project.id] = stats;
            totalViews += stats.totalPageViews;
            totalVisitors += stats.totalUniqueVisitors;
            totalEvents += stats.totalClicks;
          }

          // Fetch realtime events
          const realtimeRes = await fetch(`/api/analytics/${project.id}/realtime`);
          if (realtimeRes.ok) {
            const data = await realtimeRes.json();
            (data.recentEvents || []).slice(0, 3).forEach((event: RecentEvent) => {
              allRecentEvents.push({ event, projectTitle: project.title });
            });
          }
        } catch (err) {
          console.error(`Error fetching stats for ${project.id}:`, err);
        }
      })
    );

    setProjectStats(statsMap);
    setAggregatedStats({
      totalViews,
      totalVisitors,
      totalEvents,
      activeProjects: projects.filter((p) => p.isActive).length,
    });

    // Sort recent events by timestamp and take top 6
    allRecentEvents.sort(
      (a, b) => new Date(b.event.timestamp).getTime() - new Date(a.event.timestamp).getTime()
    );
    setRecentEvents(allRecentEvents.slice(0, 6));
  }, [projects]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  // Poll for realtime updates
  useEffect(() => {
    if (projects.length === 0) return;

    const pollRealtime = async () => {
      const allRecentEvents: { event: RecentEvent; projectTitle: string }[] = [];

      await Promise.all(
        projects.slice(0, 5).map(async (project) => {
          try {
            const realtimeRes = await fetch(`/api/analytics/${project.id}/realtime`);
            if (realtimeRes.ok) {
              const data = await realtimeRes.json();
              (data.recentEvents || []).slice(0, 3).forEach((event: RecentEvent) => {
                allRecentEvents.push({ event, projectTitle: project.title });
              });
            }
          } catch (err) {
            console.error(`Error polling realtime for ${project.id}:`, err);
          }
        })
      );

      allRecentEvents.sort(
        (a, b) => new Date(b.event.timestamp).getTime() - new Date(a.event.timestamp).getTime()
      );
      setRecentEvents(allRecentEvents.slice(0, 6));
    };

    const interval = setInterval(pollRealtime, 15000);
    return () => clearInterval(interval);
  }, [projects]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-[var(--color-indeks-green)]" : "bg-muted-foreground";
  };

  // Sort projects by views
  const sortedProjects = [...projects]
    .map((p) => ({ ...p, stats: projectStats[p.id] }))
    .sort((a, b) => (b.stats?.totalPageViews || 0) - (a.stats?.totalPageViews || 0));

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
      <div className="space-y-8">
        {/* General Overview Section */}
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">General Overview</h1>
            <p className="text-muted-foreground">Analytics across all your projects</p>
          </div>

          {/* Global Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Views"
              value={formatNumber(aggregatedStats.totalViews)}
              change="Last 30 days"
              changeType="neutral"
              icon={Eye}
              iconColor="text-[var(--color-indeks-green)]"
            />
            <StatsCard
              title="Total Visitors"
              value={formatNumber(aggregatedStats.totalVisitors)}
              change="Last 30 days"
              changeType="neutral"
              icon={Users}
              iconColor="text-[var(--color-indeks-blue)]"
            />
            <StatsCard
              title="Total Events"
              value={formatNumber(aggregatedStats.totalEvents)}
              change="Last 30 days"
              changeType="neutral"
              icon={MousePointerClick}
              iconColor="text-[var(--color-indeks-yellow)]"
            />
            <StatsCard
              title="Active Projects"
              value={aggregatedStats.activeProjects.toString()}
              change={`${projects.length} total`}
              changeType="neutral"
              icon={FolderKanban}
              iconColor="text-[var(--color-indeks-orange)]"
            />
          </div>

          {/* General Charts */}
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Overall Traffic Trend</h3>
                  <p className="text-sm text-muted-foreground">
                    Activity over the last 8 months
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <CommitGraph />
              </div>
            </Card>

            <Card className="col-span-3 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Top Projects</h3>
                <p className="text-sm text-muted-foreground">By total views (30 days)</p>
              </div>
              {sortedProjects.length > 0 ? (
                <div className="space-y-4">
                  {sortedProjects.slice(0, 5).map((project) => {
                    const views = project.stats?.totalPageViews || 0;
                    const maxViews = sortedProjects[0]?.stats?.totalPageViews || 1;
                    const percentage = Math.round((views / maxViews) * 100);
                    return (
                      <div key={project.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{project.title}</p>
                          <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-medium">{formatNumber(views)}</p>
                          <p className="text-xs text-muted-foreground">{percentage}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><FolderKanban /></EmptyMedia>
                    <EmptyTitle>No projects</EmptyTitle>
                    <EmptyDescription>Create a project to see stats.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </Card>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Top Projects</h2>
              <p className="text-muted-foreground">Your most active projects</p>
            </div>
            <Link href="/projects">
              <Button variant="outline">
                View All Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Projects Grid */}
          {sortedProjects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedProjects.slice(0, 6).map((project) => {
                const stats = project.stats;
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="p-4 !gap-2 hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className={`h-2 w-2 rounded-full ${getStatusColor(project.isActive)}`} />
                            <h3 className="text-base font-semibold">{project.title}</h3>
                            <Badge
                              variant={project.isActive ? "success" : "error"}
                              className="text-xs"
                            >
                              {project.isActive ? "active" : "inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              try {
                                return new URL(
                                  project.link.startsWith("http")
                                    ? project.link
                                    : `https://${project.link}`
                                ).hostname;
                              } catch {
                                return project.link;
                              }
                            })()}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="-mt-1 -mr-1">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Project Stats */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-secondary/50">
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" style={{ color: "var(--color-indeks-green)" }} />
                            <p className="text-xs text-muted-foreground">Views</p>
                          </div>
                          <p className="text-lg font-bold">
                            {stats ? formatNumber(stats.totalPageViews) : "-"}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-secondary/50">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" style={{ color: "var(--color-indeks-blue)" }} />
                            <p className="text-xs text-muted-foreground">Visitors</p>
                          </div>
                          <p className="text-lg font-bold">
                            {stats ? formatNumber(stats.totalUniqueVisitors) : "-"}
                          </p>
                        </div>
                      </div>

                      {/* Quick Stats Bar */}
                      <div className="flex items-center text-xs text-muted-foreground mb-2">
                        <MousePointerClick
                          className="h-3 w-3 mr-1"
                          style={{ color: "var(--color-indeks-yellow)" }}
                        />
                        <span>{stats ? formatNumber(stats.totalClicks) : "0"} clicks</span>
                      </div>

                      {/* Last Active */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          <span>Created {formatTimeAgo(project.createdAt)}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="p-12">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FolderKanban /></EmptyMedia>
                  <EmptyTitle>No projects yet</EmptyTitle>
                  <EmptyDescription>
                    Create your first project to start tracking analytics.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </Card>
          )}
        </div>

        {/* Recent Activity Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
            <p className="text-muted-foreground">Latest events across all projects</p>
          </div>

          <Card className="p-6">
            {recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-[var(--color-indeks-green)] animate-pulse" />
                      <div>
                        <p className="text-sm font-medium">{item.event.event_type}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground truncate max-w-48">
                            {item.event.url || "—"}
                          </p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <Badge variant="outline" className="text-xs">
                            {item.projectTitle}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" style={{ color: "var(--color-indeks-yellow)" }} />
                      <span>{formatTimeAgo(item.event.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Activity /></EmptyMedia>
                  <EmptyTitle>No recent activity</EmptyTitle>
                  <EmptyDescription>
                    Events will appear here once your projects start tracking.
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
