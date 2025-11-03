"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useState } from "react";

interface ProjectData {
  name: string;
  domain: string;
  apiKey: string;
  views: string;
  visitors: string;
  avgTime: string;
  bounceRate: string;
  events: string;
  status: string;
  lastActive: string;
  statusColor: string;
  createdAt: string;
}

// Mock project data - in a real app, this would come from an API
const projectsData: Record<string, ProjectData> = {
  "e-commerce-store": {
    name: "E-commerce Store",
    domain: "shop.example.com",
    apiKey: "indeks_pk_live_51H7H8H9H0H1H2H3H",
    views: "45.2K",
    visitors: "12.3K",
    avgTime: "3m 24s",
    bounceRate: "42.3%",
    events: "12.4K",
    status: "active",
    lastActive: "2 min ago",
    statusColor: "bg-[var(--color-indeks-green)]",
    createdAt: "Jan 15, 2024",
  },
  "marketing-site": {
    name: "Marketing Site",
    domain: "marketing.example.com",
    apiKey: "indeks_pk_live_62I8I9I0I1I2I3I4I",
    views: "33.4K",
    visitors: "9.8K",
    avgTime: "2m 45s",
    bounceRate: "38.7%",
    events: "9.2K",
    status: "active",
    lastActive: "5 min ago",
    statusColor: "bg-[var(--color-indeks-blue)]",
    createdAt: "Feb 3, 2024",
  },
  "blog-platform": {
    name: "Blog Platform",
    domain: "blog.example.com",
    apiKey: "indeks_pk_live_73J9J0J1J2J3J4J5J",
    views: "28.1K",
    visitors: "8.2K",
    avgTime: "4m 12s",
    bounceRate: "35.2%",
    events: "7.8K",
    status: "active",
    lastActive: "12 min ago",
    statusColor: "bg-[var(--color-indeks-yellow)]",
    createdAt: "Mar 8, 2024",
  },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const project = projectsData[projectId];

  const [copied, setCopied] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(project.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!project) {
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
                <div className={`h-3 w-3 rounded-full ${project.statusColor}`} />
                <h1 className="text-3xl font-bold tracking-tight">
                  {project.name}
                </h1>
                <Badge
                  variant={project.status === "active" ? "success" : "error"}
                >
                  {project.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <Link 
                    href={`https://${project.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[var(--color-indeks-blue)] transition-colors"
                  >
                    {project.domain}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {project.createdAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Active {project.lastActive}</span>
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
            <Key className="h-6 w-6" style={{ color: "var(--color-indeks-blue)" }} />
          </div>
          
          <div className="rounded-lg bg-secondary p-4">
            <div className="flex items-center justify-between gap-4">
              <code className="text-sm font-mono flex-1">{project.apiKey}</code>
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
              <strong>Installation:</strong> Add this script to your website&apos;s HTML:
            </p>
            <code className="text-xs font-mono text-muted-foreground block">
              {`<script src="https://indeks.io/analytics.js" data-api-key="${project.apiKey}"></script>`}
            </code>
          </div>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-5 w-5" style={{ color: "var(--color-indeks-green)" }} />
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
            <p className="text-2xl font-bold">{project.views}</p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5" style={{ color: "var(--color-indeks-blue)" }} />
              <p className="text-sm text-muted-foreground">Visitors</p>
            </div>
            <p className="text-2xl font-bold">{project.visitors}</p>
            <p className="text-xs text-muted-foreground mt-1">Unique users</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5" style={{ color: "var(--color-indeks-yellow)" }} />
              <p className="text-sm text-muted-foreground">Avg Time</p>
            </div>
            <p className="text-2xl font-bold">{project.avgTime}</p>
            <p className="text-xs text-muted-foreground mt-1">Per session</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5" style={{ color: "var(--color-indeks-orange)" }} />
              <p className="text-sm text-muted-foreground">Bounce Rate</p>
            </div>
            <p className="text-2xl font-bold">{project.bounceRate}</p>
            <p className="text-xs text-muted-foreground mt-1">Exit rate</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <MousePointerClick className="h-5 w-5" style={{ color: "var(--color-indeks-green)" }} />
              <p className="text-sm text-muted-foreground">Events</p>
            </div>
            <p className="text-2xl font-bold">{project.events}</p>
            <p className="text-xs text-muted-foreground mt-1">Tracked actions</p>
          </Card>
        </div>

        {/* Recent Activity and Top Pages */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-5 w-5" style={{ color: "var(--color-indeks-blue)" }} />
              <div>
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <p className="text-xs text-muted-foreground">
                  Latest events in the last hour
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { event: "Page View", path: "/products", time: "2 min ago" },
                { event: "Button Click", path: "/checkout", time: "5 min ago" },
                { event: "Form Submit", path: "/contact", time: "8 min ago" },
                { event: "Page View", path: "/about", time: "12 min ago" },
                { event: "Link Click", path: "/blog", time: "15 min ago" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{item.event}</p>
                    <p className="text-xs text-muted-foreground">{item.path}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Pages */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-5 w-5" style={{ color: "var(--color-indeks-green)" }} />
              <div>
                <h3 className="text-lg font-semibold">Top Pages</h3>
                <p className="text-xs text-muted-foreground">
                  Most visited pages this month
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { path: "/", views: "12.4K", percentage: "35%" },
                { path: "/products", views: "8.2K", percentage: "23%" },
                { path: "/about", views: "5.1K", percentage: "15%" },
                { path: "/contact", views: "3.8K", percentage: "11%" },
                { path: "/blog", views: "2.9K", percentage: "8%" },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.path}</p>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.views}</p>
                      <p className="text-xs text-muted-foreground">{item.percentage}</p>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: item.percentage,
                        backgroundColor: "var(--color-indeks-green)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
