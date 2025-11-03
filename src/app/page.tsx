import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CommitGraph } from "@/components/dashboard/CommitGraph";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* General Overview Section */}
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              General Overview
            </h1>
            <p className="text-muted-foreground">
              Analytics across all your projects
            </p>
          </div>

          {/* Global Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Views"
              value="145,231"
              change="+20.1% from last month"
              changeType="positive"
              icon={Eye}
              iconColor="text-[var(--color-indeks-green)]"
            />
            <StatsCard
              title="Total Visitors"
              value="52,234"
              change="+12.5% from last month"
              changeType="positive"
              icon={Users}
              iconColor="text-[var(--color-indeks-blue)]"
            />
            <StatsCard
              title="Total Events"
              value="28,492"
              change="+15.3% from last month"
              changeType="positive"
              icon={MousePointerClick}
              iconColor="text-[var(--color-indeks-yellow)]"
            />
            <StatsCard
              title="Active Projects"
              value="8"
              change="2 new this month"
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
                  <h3 className="text-lg font-semibold">
                    Overall Traffic Trend
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Activity over the last 8 months (2 quarters)
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
                <p className="text-sm text-muted-foreground">
                  By total views this month
                </p>
              </div>
              <div className="space-y-4">
                {[
                  {
                    name: "E-commerce Store",
                    views: "45,234",
                    percentage: "31%",
                  },
                  {
                    name: "Marketing Site",
                    views: "33,421",
                    percentage: "23%",
                  },
                  { name: "Blog Platform", views: "28,145", percentage: "19%" },
                  { name: "Landing Page", views: "21,892", percentage: "15%" },
                  {
                    name: "Portfolio Site",
                    views: "16,539",
                    percentage: "12%",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: item.percentage }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-medium">{item.views}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.percentage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Top Projects
              </h2>
              <p className="text-muted-foreground">
                Your 6 most active projects
              </p>
            </div>
            <Link href="/projects">
              <Button variant="outline">
                View All Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Projects Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                id: "e-commerce-store",
                name: "E-commerce Store",
                domain: "shop.example.com",
                apiKey: "indeks_pk_live_51H7H8H9H0H1H2H3H",
                views: "45.2K",
                visitors: "12.3K",
                status: "active",
                lastActive: "2 min ago",
                statusColor: "bg-[var(--color-indeks-green)]",
              },
              {
                id: "marketing-site",
                name: "Marketing Site",
                domain: "marketing.example.com",
                apiKey: "indeks_pk_live_62I8I9I0I1I2I3I4I",
                views: "33.4K",
                visitors: "9.8K",
                status: "active",
                lastActive: "5 min ago",
                statusColor: "bg-[var(--color-indeks-blue)]",
              },
              {
                id: "blog-platform",
                name: "Blog Platform",
                domain: "blog.example.com",
                apiKey: "indeks_pk_live_73J9J0J1J2J3J4J5J",
                views: "28.1K",
                visitors: "8.2K",
                status: "active",
                lastActive: "12 min ago",
                statusColor: "bg-[var(--color-indeks-yellow)]",
              },
              {
                id: "landing-page",
                name: "Landing Page",
                domain: "landing.example.com",
                apiKey: "indeks_pk_live_84K0K1K2K3K4K5K6K",
                views: "21.9K",
                visitors: "6.5K",
                status: "active",
                lastActive: "1 hour ago",
                statusColor: "bg-[var(--color-indeks-orange)]",
              },
              {
                id: "portfolio-site",
                name: "Portfolio Site",
                domain: "portfolio.example.com",
                apiKey: "indeks_pk_live_95L1L2L3L4L5L6L7L",
                views: "16.5K",
                visitors: "5.1K",
                status: "inactive",
                lastActive: "2 days ago",
                statusColor: "bg-muted-foreground",
              },
              {
                id: "documentation",
                name: "Documentation",
                domain: "docs.example.com",
                apiKey: "indeks_pk_live_06M2M3M4M5M6M7M8M",
                views: "12.3K",
                visitors: "4.2K",
                status: "active",
                lastActive: "30 min ago",
                statusColor: "bg-[var(--color-indeks-blue)]",
              },
            ].map((project, index) => (
              <Link key={index} href={`/projects/${project.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`h-2 w-2 rounded-full ${project.statusColor}`}
                        />
                        <h3 className="text-lg font-semibold">
                          {project.name}
                        </h3>
                        <Badge
                          variant={
                            project.status === "active" ? "success" : "error"
                          }
                          className="text-xs"
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.domain}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Project Stats */}
                  <div className="space-y-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye
                            className="h-4 w-4"
                            style={{ color: "var(--color-indeks-green)" }}
                          />
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <p className="text-xl font-bold">{project.views}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Users
                            className="h-4 w-4"
                            style={{ color: "var(--color-indeks-blue)" }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Visitors
                          </p>
                        </div>
                        <p className="text-xl font-bold">{project.visitors}</p>
                      </div>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp
                          className="h-3 w-3"
                          style={{ color: "var(--color-indeks-green)" }}
                        />
                        <span>+12.5%</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MousePointerClick
                          className="h-3 w-3"
                          style={{ color: "var(--color-indeks-yellow)" }}
                        />
                        <span>2.4K events</span>
                      </div>
                    </div>
                  </div>

                  {/* Last Active */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      <span>Last active {project.lastActive}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              Recent Activity
            </h2>
            <p className="text-muted-foreground">
              Latest events across all projects
            </p>
          </div>

          <Card className="p-6">
            <div className="space-y-3">
              {[
                {
                  event: "Page View",
                  path: "/products",
                  project: "E-commerce Store",
                  time: "2 minutes ago",
                },
                {
                  event: "Button Click",
                  path: "/cta-button",
                  project: "Marketing Site",
                  time: "5 minutes ago",
                },
                {
                  event: "Form Submit",
                  path: "/newsletter",
                  project: "Blog Platform",
                  time: "12 minutes ago",
                },
                {
                  event: "Page View",
                  path: "/about",
                  project: "Landing Page",
                  time: "18 minutes ago",
                },
                {
                  event: "Link Click",
                  path: "/external-link",
                  project: "Portfolio Site",
                  time: "25 minutes ago",
                },
                {
                  event: "Search Query",
                  path: "/search",
                  project: "Documentation",
                  time: "32 minutes ago",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[var(--color-indeks-green)]" />
                    <div>
                      <p className="text-sm font-medium">{item.event}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {item.path}
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <Badge variant="outline" className="text-xs">
                          {item.project}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar
                      className="h-3 w-3"
                      style={{ color: "var(--color-indeks-yellow)" }}
                    />
                    <span>{item.time}</span>
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
