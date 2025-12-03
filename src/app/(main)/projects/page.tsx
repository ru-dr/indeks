"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { Card } from "@/components/ui/card";
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
  Clock,
  FolderOpen,
  Loader2,
  FolderKanban,
  Activity,
  Zap,
} from "lucide-react";

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

interface ProjectStats {
  totalPageViews: number;
  totalUniqueVisitors: number;
  avgSessionDuration: number;
  totalSessions: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/projects");
      const result = await response.json();

      if (result.success) {
        setProjects(result.data);
      } else {
        setError(result.message || "Failed to fetch projects");
      }
    } catch (err) {
      setError("An error occurred while fetching projects");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = useCallback(async () => {
    if (projects.length === 0) return;

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const query = `?startDate=${start.toISOString().split("T")[0]}&endDate=${end.toISOString().split("T")[0]}`;

    const statsMap: Record<string, ProjectStats> = {};

    await Promise.all(
      projects.map(async (project) => {
        try {
          const response = await fetch(`/api/analytics/${project.id}/overview${query}`);
          if (response.ok) {
            const data = await response.json();
            statsMap[project.id] = {
              totalPageViews: data.summary?.totalPageViews || 0,
              totalUniqueVisitors: data.summary?.totalUniqueVisitors || 0,
              avgSessionDuration: data.summary?.avgSessionDuration || 0,
              totalSessions: data.summary?.totalSessions || 0,
            };
          }
        } catch (err) {
          console.error(`Error fetching stats for ${project.id}:`, err);
        }
      })
    );

    setProjectStats(statsMap);
  }, [projects]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchProjectStats();
  }, [fetchProjectStats]);

  const totalViews = Object.values(projectStats).reduce((sum, s) => sum + s.totalPageViews, 0);
  const totalVisitors = Object.values(projectStats).reduce((sum, s) => sum + s.totalUniqueVisitors, 0);
  const totalSessions = Object.values(projectStats).reduce((sum, s) => sum + s.totalSessions, 0);
  const activeProjects = projects.filter((p) => p.isActive).length;

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-[var(--color-indeks-green)]" : "bg-muted-foreground";
  };

  const formatDate = (dateString: string) => {
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

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage and monitor all your analytics projects
            </p>
          </div>
          <CreateProjectDialog onProjectCreated={fetchProjects} />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-destructive">{error}</div>
        )}

        {projects.length === 0 ? (
          <Card className="p-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><FolderOpen /></EmptyMedia>
                <EmptyTitle>No projects yet</EmptyTitle>
                <EmptyDescription>Create your first project to start tracking analytics.</EmptyDescription>
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
                    <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                    <h3 className="text-2xl font-bold mt-2">{projects.length}</h3>
                  </div>
                  <FolderKanban className="h-8 w-8 text-[var(--color-indeks-blue)]" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                    <h3 className="text-2xl font-bold mt-2">{activeProjects}</h3>
                  </div>
                  <Activity className="h-8 w-8 text-[var(--color-indeks-green)]" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                    <h3 className="text-2xl font-bold mt-2">{formatNumber(totalViews)}</h3>
                  </div>
                  <Eye className="h-8 w-8 text-[var(--color-indeks-yellow)]" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Visitors</p>
                    <h3 className="text-2xl font-bold mt-2">{formatNumber(totalVisitors)}</h3>
                  </div>
                  <Users className="h-8 w-8 text-[var(--color-indeks-orange)]" />
                </div>
              </Card>
            </div>

            {/* Projects Table */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FolderKanban className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                <h3 className="text-lg font-semibold">All Projects</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Project</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Views</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Visitors</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Sessions</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Time</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects
                      .sort((a, b) => (projectStats[b.id]?.totalPageViews || 0) - (projectStats[a.id]?.totalPageViews || 0))
                      .map((project) => {
                        const stats = projectStats[project.id];
                        return (
                          <tr key={project.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <Link href={`/projects/${project.id}`} className="hover:text-[var(--color-indeks-blue)] transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${getStatusColor(project.isActive)}`} />
                                  <div>
                                    <p className="text-sm font-medium">{project.title}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-48">
                                      {(() => {
                                        try {
                                          return new URL(project.link.startsWith("http") ? project.link : `https://${project.link}`).hostname;
                                        } catch {
                                          return project.link;
                                        }
                                      })()}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </td>
                            <td className="text-center py-3 px-4">
                              <Badge variant={project.isActive ? "success" : "error"} className="text-xs">
                                {project.isActive ? "active" : "inactive"}
                              </Badge>
                            </td>
                            <td className="text-right py-3 px-4 text-sm font-semibold">
                              {stats ? formatNumber(stats.totalPageViews) : "-"}
                            </td>
                            <td className="text-right py-3 px-4 text-sm">
                              {stats ? formatNumber(stats.totalUniqueVisitors) : "-"}
                            </td>
                            <td className="text-right py-3 px-4 text-sm">
                              {stats ? formatNumber(stats.totalSessions) : "-"}
                            </td>
                            <td className="text-right py-3 px-4 text-sm">
                              {stats ? formatDuration(stats.avgSessionDuration) : "-"}
                            </td>
                            <td className="text-right py-3 px-4 text-sm text-muted-foreground">
                              {formatDate(project.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Projects Grid */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-[var(--color-indeks-green)]" />
                <h3 className="text-lg font-semibold">Quick Overview</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.slice(0, 6).map((project) => {
                  const stats = projectStats[project.id];
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`h-2 w-2 rounded-full ${getStatusColor(project.isActive)}`} />
                          <h4 className="font-medium truncate">{project.title}</h4>
                          <Badge variant={project.isActive ? "success" : "error"} className="text-xs ml-auto">
                            {project.isActive ? "active" : "inactive"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-[var(--color-indeks-green)]" />
                              <p className="text-xs text-muted-foreground">Views</p>
                            </div>
                            <p className="text-sm font-semibold">{stats ? formatNumber(stats.totalPageViews) : "-"}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-[var(--color-indeks-blue)]" />
                              <p className="text-xs text-muted-foreground">Visitors</p>
                            </div>
                            <p className="text-sm font-semibold">{stats ? formatNumber(stats.totalUniqueVisitors) : "-"}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-[var(--color-indeks-yellow)]" />
                              <p className="text-xs text-muted-foreground">Time</p>
                            </div>
                            <p className="text-sm font-semibold">{stats ? formatDuration(stats.avgSessionDuration) : "-"}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
