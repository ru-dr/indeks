"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  MousePointer,
  ShoppingCart,
  Play,
  Calendar,
  Filter,
} from "lucide-react";

export default function EventsPage() {
  const eventCategories = [
    {
      label: "Total Events",
      value: "156,234",
      change: "+18.5%",
      icon: TrendingUp,
      color: "text-[var(--color-indeks-blue)]",
    },
    {
      label: "Click Events",
      value: "89,456",
      change: "+12.3%",
      icon: MousePointer,
      color: "text-[var(--color-indeks-green)]",
    },
    {
      label: "Conversion Events",
      value: "12,345",
      change: "+24.1%",
      icon: ShoppingCart,
      color: "text-[var(--color-indeks-yellow)]",
    },
    {
      label: "Custom Events",
      value: "54,433",
      change: "+16.7%",
      icon: Play,
      color: "text-[var(--color-indeks-orange)]",
    },
  ];

  const topEvents = [
    {
      event: "button_click",
      count: 23456,
      users: 12345,
      avgPerUser: 1.9,
      category: "Interaction",
    },
    {
      event: "page_view",
      count: 18234,
      users: 8765,
      avgPerUser: 2.1,
      category: "Pageview",
    },
    {
      event: "form_submit",
      count: 15678,
      users: 7890,
      avgPerUser: 2.0,
      category: "Conversion",
    },
    {
      event: "video_play",
      count: 12345,
      users: 6543,
      avgPerUser: 1.9,
      category: "Media",
    },
    {
      event: "download_pdf",
      count: 9876,
      users: 5432,
      avgPerUser: 1.8,
      category: "Download",
    },
    {
      event: "search_query",
      count: 8765,
      users: 4321,
      avgPerUser: 2.0,
      category: "Search",
    },
  ];

  const recentEvents = [
    {
      event: "purchase_complete",
      user: "user_12345",
      page: "/checkout",
      value: "$124.99",
      time: "2 min ago",
    },
    {
      event: "signup_success",
      user: "user_67890",
      page: "/auth/sign-up",
      value: "-",
      time: "5 min ago",
    },
    {
      event: "download_report",
      user: "user_34567",
      page: "/reports",
      value: "monthly.pdf",
      time: "8 min ago",
    },
    {
      event: "video_complete",
      user: "user_89012",
      page: "/tutorials",
      value: "5:32",
      time: "12 min ago",
    },
    {
      event: "form_abandoned",
      user: "user_45678",
      page: "/contact",
      value: "50%",
      time: "15 min ago",
    },
  ];

  const eventsByCategory = [
    {
      category: "User Interactions",
      count: 45678,
      percentage: 29,
      color: "bg-[var(--color-indeks-blue)]",
    },
    {
      category: "Page Navigation",
      count: 38234,
      percentage: 24,
      color: "bg-[var(--color-indeks-green)]",
    },
    {
      category: "Form Submissions",
      count: 29876,
      percentage: 19,
      color: "bg-[var(--color-indeks-yellow)]",
    },
    {
      category: "Media Engagement",
      count: 24567,
      percentage: 16,
      color: "bg-[var(--color-indeks-orange)]",
    },
    {
      category: "E-commerce",
      count: 17879,
      percentage: 12,
      color: "bg-purple-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">
              Track and analyze user interactions and custom events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
          </div>
        </div>

        {/* Event Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {eventCategories.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                    <Badge variant="success" className="text-xs mt-1">
                      {stat.change}
                    </Badge>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Top Events Table & Events by Category */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Events */}
          <Card className="p-6 lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                <h3 className="text-lg font-semibold">Top Events</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">
                        Event Name
                      </th>
                      <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">
                        Count
                      </th>
                      <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">
                        Users
                      </th>
                      <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">
                        Avg/User
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">
                        Category
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topEvents.map((event, index) => (
                      <tr
                        key={index}
                        className="border-b last:border-0 hover:bg-accent/50"
                      >
                        <td className="py-3 px-2">
                          <span className="text-sm font-mono">
                            {event.event}
                          </span>
                        </td>
                        <td className="text-right py-3 px-2">
                          <span className="text-sm font-semibold">
                            {event.count.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-right py-3 px-2">
                          <span className="text-sm">
                            {event.users.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-right py-3 px-2">
                          <span className="text-sm">{event.avgPerUser}</span>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="text-xs">
                            {event.category}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Events by Category */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-[var(--color-indeks-green)]" />
                <h3 className="text-lg font-semibold">By Category</h3>
              </div>
              <div className="space-y-3">
                {eventsByCategory.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {item.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Events Stream */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
              <h3 className="text-lg font-semibold">Recent Events Stream</h3>
              <Badge variant="success" className="ml-2">
                Live
              </Badge>
            </div>
            <div className="space-y-2">
              {recentEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[var(--color-indeks-green)] animate-pulse" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {event.event}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {event.user}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {event.page}
                        </span>
                        {event.value !== "-" && (
                          <>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs font-medium">
                              {event.value}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {event.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
