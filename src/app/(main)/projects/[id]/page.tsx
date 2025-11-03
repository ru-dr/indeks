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
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Key,
  Copy,
  Eye,
  Users,
  Clock,
  TrendingUp,
  Activity,
  ArrowLeft,
  Settings,
  Globe,
  Calendar,
  BarChart3,
  MousePointerClick,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";

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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/projects/${projectId}`);
        const result = await response.json();

        if (result.success) {
          setProject(result.data);
        } else {
          setError(result.message || "Failed to fetch project");
        }
      } catch (err) {
        setError("An error occurred while fetching the project");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const copyApiKey = () => {
    if (!project) return;
    navigator.clipboard.writeText(project.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-[var(--color-indeks-green)]" : "bg-muted-foreground";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.push("/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Loading project...</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.push("/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The project you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push("/projects")}>
              View All Projects
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.push("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>

        {/* Project Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-2">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`h-3 w-3 rounded-full ${getStatusColor(project.isActive)}`}
                />
                <h1 className="text-3xl font-bold tracking-tight">
                  {project.title}
                </h1>
                <Badge variant={project.isActive ? "success" : "error"}>
                  {project.isActive ? "active" : "inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <Link
                    href={
                      project.link.startsWith("http")
                        ? project.link
                        : `https://${project.link}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--color-indeks-blue)] transition-colors"
                  >
                    {
                      new URL(
                        project.link.startsWith("http")
                          ? project.link
                          : `https://${project.link}`,
                      ).hostname
                    }
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Updated {getTimeAgo(project.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Project Settings
          </Button>
        </div>

        {/* API Key Card - Prominent Display */}
        <Card className="p-6 border-2 border-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">API Key</h2>
              <p className="text-sm text-muted-foreground">
                Use this key to integrate analytics into your project
              </p>
            </div>
            <Key
              className="h-6 w-6"
              style={{ color: "var(--color-indeks-blue)" }}
            />
          </div>

          <div className="rounded-lg bg-secondary p-4">
            <div className="flex items-center justify-between gap-4">
              <code className="text-sm font-mono flex-1">
                {project.publicKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyApiKey}
                className="shrink-0"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed">
            <p className="text-xs text-muted-foreground mb-2">
              <strong>Installation:</strong> Add this script to your
              website&apos;s HTML:
            </p>
            <code className="text-xs font-mono text-muted-foreground block">
              {`<script src="https://indeks.io/analytics.js" data-api-key="${project.publicKey}"></script>`}
            </code>
          </div>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye
                className="h-5 w-5"
                style={{ color: "var(--color-indeks-green)" }}
              />
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Eye />
                </EmptyMedia>
                <EmptyTitle>No views yet</EmptyTitle>
                <EmptyDescription>View tracking coming soon</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users
                className="h-5 w-5"
                style={{ color: "var(--color-indeks-blue)" }}
              />
              <p className="text-sm text-muted-foreground">Visitors</p>
            </div>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>No visitors yet</EmptyTitle>
                <EmptyDescription>
                  Visitor tracking coming soon
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock
                className="h-5 w-5"
                style={{ color: "var(--color-indeks-yellow)" }}
              />
              <p className="text-sm text-muted-foreground">Avg Time</p>
            </div>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Clock />
                </EmptyMedia>
                <EmptyTitle>No data</EmptyTitle>
                <EmptyDescription>Time tracking coming soon</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp
                className="h-5 w-5"
                style={{ color: "var(--color-indeks-orange)" }}
              />
              <p className="text-sm text-muted-foreground">Bounce Rate</p>
            </div>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TrendingUp />
                </EmptyMedia>
                <EmptyTitle>No data</EmptyTitle>
                <EmptyDescription>Bounce tracking coming soon</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <MousePointerClick
                className="h-5 w-5"
                style={{ color: "var(--color-indeks-green)" }}
              />
              <p className="text-sm text-muted-foreground">Events</p>
            </div>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MousePointerClick />
                </EmptyMedia>
                <EmptyTitle>No events</EmptyTitle>
                <EmptyDescription>Event tracking coming soon</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        </div>

        {/* Recent Activity and Top Pages */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity
                className="h-5 w-5"
                style={{ color: "var(--color-indeks-blue)" }}
              />
              <div>
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <p className="text-xs text-muted-foreground">
                  Latest events in the last hour
                </p>
              </div>
            </div>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Activity />
                </EmptyMedia>
                <EmptyTitle>No activity yet</EmptyTitle>
                <EmptyDescription>
                  Events will appear here once your project starts tracking.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>

          {/* Top Pages */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3
                className="h-5 w-5"
                style={{ color: "var(--color-indeks-green)" }}
              />
              <div>
                <h3 className="text-lg font-semibold">Top Pages</h3>
                <p className="text-xs text-muted-foreground">
                  Most visited pages this month
                </p>
              </div>
            </div>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>No page data</EmptyTitle>
                <EmptyDescription>
                  Page statistics will appear here once visitors start browsing.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
