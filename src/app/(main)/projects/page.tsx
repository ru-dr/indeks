import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  MoreVertical,
  Activity,
  Plus,
  Eye,
  Users,
  Clock,
} from "lucide-react";

export default function ProjectsPage() {
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
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
              avgTime: "3m 24s",
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
              avgTime: "2m 45s",
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
              avgTime: "4m 12s",
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
              avgTime: "1m 58s",
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
              avgTime: "3m 45s",
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
              avgTime: "5m 32s",
              status: "active",
              lastActive: "30 min ago",
              statusColor: "bg-[var(--color-indeks-blue)]",
            },
            {
              id: "saas-dashboard",
              name: "SaaS Dashboard",
              domain: "app.example.com",
              apiKey: "indeks_pk_live_17N3N4N5N6N7N8N9N",
              views: "9.8K",
              visitors: "3.5K",
              avgTime: "6m 15s",
              status: "active",
              lastActive: "15 min ago",
              statusColor: "bg-[var(--color-indeks-green)]",
            },
            {
              id: "community-forum",
              name: "Community Forum",
              domain: "forum.example.com",
              apiKey: "indeks_pk_live_28O4O5O6O7O8O9O0O",
              views: "7.2K",
              visitors: "2.8K",
              avgTime: "8m 45s",
              status: "active",
              lastActive: "45 min ago",
              statusColor: "bg-[var(--color-indeks-yellow)]",
            },
            {
              id: "api-documentation",
              name: "API Documentation",
              domain: "api-docs.example.com",
              apiKey: "indeks_pk_live_39P5P6P7P8P9P0P1P",
              views: "5.4K",
              visitors: "2.1K",
              avgTime: "4m 30s",
              status: "active",
              lastActive: "2 hours ago",
              statusColor: "bg-[var(--color-indeks-orange)]",
            },
            {
              id: "mobile-app-landing",
              name: "Mobile App Landing",
              domain: "mobile.example.com",
              apiKey: "indeks_pk_live_40Q6Q7Q8Q9Q0Q1Q2Q",
              views: "4.1K",
              visitors: "1.8K",
              avgTime: "2m 10s",
              status: "active",
              lastActive: "3 hours ago",
              statusColor: "bg-[var(--color-indeks-blue)]",
            },
            {
              id: "beta-testing-site",
              name: "Beta Testing Site",
              domain: "beta.example.com",
              apiKey: "indeks_pk_live_51R7R8R9R0R1R2R3R",
              views: "2.3K",
              visitors: "892",
              avgTime: "3m 05s",
              status: "inactive",
              lastActive: "1 week ago",
              statusColor: "bg-muted-foreground",
            },
            {
              id: "customer-portal",
              name: "Customer Portal",
              domain: "portal.example.com",
              apiKey: "indeks_pk_live_62S8S9S0S1S2S3S4S",
              views: "1.9K",
              visitors: "645",
              avgTime: "7m 20s",
              status: "active",
              lastActive: "5 hours ago",
              statusColor: "bg-[var(--color-indeks-green)]",
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
                    <h3 className="text-lg font-semibold">{project.name}</h3>
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
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Eye
                      className="h-3 w-3"
                      style={{ color: "var(--color-indeks-green)" }}
                    />
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <p className="text-sm font-semibold">{project.views}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Users
                      className="h-3 w-3"
                      style={{ color: "var(--color-indeks-blue)" }}
                    />
                    <p className="text-xs text-muted-foreground">Visitors</p>
                  </div>
                  <p className="text-sm font-semibold">{project.visitors}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Clock
                      className="h-3 w-3"
                      style={{ color: "var(--color-indeks-yellow)" }}
                    />
                    <p className="text-xs text-muted-foreground">Avg Time</p>
                  </div>
                  <p className="text-sm font-semibold">{project.avgTime}</p>
                </div>
              </div>
              {/* Last Active */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity
                  className="h-3 w-3"
                  style={{ color: "var(--color-indeks-orange)" }}
                />
                <span>Last active {project.lastActive}</span>
              </div>
            </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
