"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const analyticsOverview = [
    {
      label: "Total Visitors",
      value: "45,231",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "text-[var(--color-indeks-blue)]",
    },
    {
      label: "Page Views",
      value: "178,523",
      change: "+8.2%",
      trend: "up",
      icon: Eye,
      color: "text-[var(--color-indeks-green)]",
    },
    {
      label: "Avg. Session Duration",
      value: "5m 23s",
      change: "-3.1%",
      trend: "down",
      icon: Clock,
      color: "text-[var(--color-indeks-yellow)]",
    },
    {
      label: "Bounce Rate",
      value: "34.2%",
      change: "-5.4%",
      trend: "up",
      icon: MousePointer,
      color: "text-[var(--color-indeks-orange)]",
    },
  ];

  const deviceStats = [
    { device: "Desktop", users: 23456, percentage: 52, icon: Monitor, color: "bg-[var(--color-indeks-blue)]" },
    { device: "Mobile", users: 18234, percentage: 40, icon: Smartphone, color: "bg-[var(--color-indeks-green)]" },
    { device: "Tablet", users: 3541, percentage: 8, icon: Tablet, color: "bg-[var(--color-indeks-yellow)]" },
  ];

  const topChannels = [
    { channel: "Organic Search", sessions: 25678, conversion: "3.4%", revenue: "$12,345", trend: "+15%" },
    { channel: "Direct", sessions: 18234, conversion: "4.2%", revenue: "$9,876", trend: "+8%" },
    { channel: "Social Media", sessions: 12456, conversion: "2.1%", revenue: "$5,432", trend: "+22%" },
    { channel: "Email", sessions: 8765, conversion: "5.6%", revenue: "$7,654", trend: "+12%" },
    { channel: "Referral", sessions: 6543, conversion: "2.8%", revenue: "$3,210", trend: "+5%" },
    { channel: "Paid Search", sessions: 4321, conversion: "6.2%", revenue: "$8,901", trend: "+18%" },
  ];

  const contentMetrics = [
    { metric: "Most Viewed Page", value: "/dashboard", views: "12,345" },
    { metric: "Highest Engagement", value: "/products/analytics", time: "8m 32s" },
    { metric: "Best Conversion", value: "/pricing", rate: "12.4%" },
    { metric: "Lowest Bounce", value: "/docs", rate: "18.2%" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your website performance
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {analyticsOverview.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge
                        variant={stat.trend === "up" ? "success" : "error"}
                        className="text-xs"
                      >
                        {stat.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        vs last month
                      </span>
                    </div>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Device Stats & Content Metrics */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Device Breakdown */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[var(--color-indeks-green)]" />
                <h3 className="text-lg font-semibold">Device Breakdown</h3>
              </div>
              <div className="space-y-4">
                {deviceStats.map((device) => {
                  const DeviceIcon = device.icon;
                  return (
                    <div key={device.device} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{device.device}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {device.users.toLocaleString()} users
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
            </div>
          </Card>

          {/* Content Metrics */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                <h3 className="text-lg font-semibold">Content Performance</h3>
              </div>
              <div className="space-y-3">
                {contentMetrics.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/50"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">{item.metric}</p>
                      <p className="text-sm font-medium mt-1">{item.value}</p>
                    </div>
                    <div className="text-right">
                      {item.views && (
                        <Badge variant="success" className="text-xs">
                          {item.views} views
                        </Badge>
                      )}
                      {item.time && (
                        <Badge className="text-xs bg-[var(--color-indeks-yellow)]">
                          {item.time}
                        </Badge>
                      )}
                      {item.rate && (
                        <Badge className="text-xs bg-[var(--color-indeks-green)]">
                          {item.rate}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Top Channels */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--color-indeks-orange)]" />
              <h3 className="text-lg font-semibold">Top Marketing Channels</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Channel
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Sessions
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Conversion
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Revenue
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topChannels.map((channel, index) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-accent/50">
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">{channel.channel}</span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="text-sm">{channel.sessions.toLocaleString()}</span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge variant="success" className="text-xs">
                          {channel.conversion}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="text-sm font-semibold">{channel.revenue}</span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">{channel.trend}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
