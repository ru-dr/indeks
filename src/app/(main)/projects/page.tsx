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
  MoreVertical,
  Activity,
  Eye,
  Users,
  Clock,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Fetch stats for all projects
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
            <p className="text-muted-foreground">
              Manage and monitor all your analytics projects
            </p>
          </div>
          <CreateProjectDialog onProjectCreated={fetchProjects} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="flex items-center justify-center min-h-[790px]">
            <Card className="max-w-md w-full">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderOpen />
                  </EmptyMedia>
                  <EmptyTitle>No projects yet</EmptyTitle>
                  <EmptyDescription>
                    Create your first project to start tracking analytics and
                    insights.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </Card>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const stats = projectStats[project.id];
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`h-2 w-2 rounded-full ${getStatusColor(
                              project.isActive
                            )}`}
                          />
                          <h3 className="text-lg font-semibold">
                            {project.title}
                          </h3>
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
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {project.category && (
                      <div className="mb-4">
                        <Badge variant="outline" className="text-xs">
                          {project.category}
                        </Badge>
                      </div>
                    )}

                    {/* Project Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Eye
                            className="h-3 w-3"
                            style={{ color: "var(--color-indeks-green)" }}
                          />
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <p className="text-sm font-semibold">
                          {stats ? formatNumber(stats.totalPageViews) : "-"}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Users
                            className="h-3 w-3"
                            style={{ color: "var(--color-indeks-blue)" }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Visitors
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {stats ? formatNumber(stats.totalUniqueVisitors) : "-"}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Clock
                            className="h-3 w-3"
                            style={{ color: "var(--color-indeks-yellow)" }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Avg Time
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {stats ? formatDuration(stats.avgSessionDuration) : "-"}
                        </p>
                      </div>
                    </div>

                    {/* Last Active */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Activity
                        className="h-3 w-3"
                        style={{ color: "var(--color-indeks-orange)" }}
                      />
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
