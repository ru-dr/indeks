"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Clock,
  MoreVertical,
  Plus,
  Filter,
  Share2,
} from "lucide-react";

export default function ReportsPage() {
  const reportStats = [
    {
      label: "Total Reports",
      value: "248",
      change: "+12",
      period: "this month",
      icon: FileText,
      color: "text-[var(--color-indeks-blue)]",
    },
    {
      label: "Scheduled",
      value: "18",
      change: "+3",
      period: "active",
      icon: Clock,
      color: "text-[var(--color-indeks-green)]",
    },
    {
      label: "Downloads",
      value: "1,456",
      change: "+24%",
      period: "vs last month",
      icon: Download,
      color: "text-[var(--color-indeks-yellow)]",
    },
    {
      label: "Shared",
      value: "89",
      change: "+8",
      period: "this week",
      icon: Share2,
      color: "text-[var(--color-indeks-orange)]",
    },
  ];

  const recentReports = [
    {
      title: "Monthly Traffic Report",
      type: "Traffic Analysis",
      date: "November 1, 2025",
      status: "Ready",
      size: "2.4 MB",
      format: "PDF",
      author: "System",
      downloads: 23,
    },
    {
      title: "Q4 Revenue Summary",
      type: "Financial",
      date: "October 28, 2025",
      status: "Ready",
      size: "1.8 MB",
      format: "PDF",
      author: "Admin",
      downloads: 45,
    },
    {
      title: "User Engagement Report",
      type: "Analytics",
      date: "October 25, 2025",
      status: "Ready",
      size: "3.1 MB",
      format: "PDF",
      author: "System",
      downloads: 12,
    },
    {
      title: "Weekly Performance",
      type: "Performance",
      date: "October 20, 2025",
      status: "Processing",
      size: "-",
      format: "PDF",
      author: "System",
      downloads: 0,
    },
    {
      title: "Content Analysis Report",
      type: "Content",
      date: "October 18, 2025",
      status: "Ready",
      size: "4.2 MB",
      format: "PDF",
      author: "Marketing",
      downloads: 67,
    },
  ];

  const scheduledReports = [
    {
      name: "Daily Activity Summary",
      frequency: "Daily",
      nextRun: "Tomorrow 9:00 AM",
      lastRun: "Today 9:00 AM",
      recipients: 5,
      status: "Active",
    },
    {
      name: "Weekly Analytics",
      frequency: "Weekly",
      nextRun: "Monday 8:00 AM",
      lastRun: "Last Monday 8:00 AM",
      recipients: 12,
      status: "Active",
    },
    {
      name: "Monthly Overview",
      frequency: "Monthly",
      nextRun: "Dec 1, 9:00 AM",
      lastRun: "Nov 1, 9:00 AM",
      recipients: 8,
      status: "Active",
    },
    {
      name: "Quarterly Business Review",
      frequency: "Quarterly",
      nextRun: "Jan 1, 2026",
      lastRun: "Oct 1, 2025",
      recipients: 15,
      status: "Active",
    },
  ];

  const reportTemplates = [
    {
      icon: TrendingUp,
      title: "Traffic Analysis",
      description: "Detailed breakdown of website traffic and visitor behavior",
      color: "text-[var(--color-indeks-blue)]",
      bgColor: "bg-[var(--color-indeks-blue)]/10",
      reports: 42,
    },
    {
      icon: Users,
      title: "User Demographics",
      description: "Comprehensive analysis of user demographics and locations",
      color: "text-[var(--color-indeks-green)]",
      bgColor: "bg-[var(--color-indeks-green)]/10",
      reports: 38,
    },
    {
      icon: DollarSign,
      title: "Revenue Report",
      description: "Financial performance and revenue metrics overview",
      color: "text-[var(--color-indeks-yellow)]",
      bgColor: "bg-[var(--color-indeks-yellow)]/10",
      reports: 29,
    },
    {
      icon: Eye,
      title: "Content Performance",
      description: "Detailed insights on page views and content engagement",
      color: "text-[var(--color-indeks-orange)]",
      bgColor: "bg-[var(--color-indeks-orange)]/10",
      reports: 51,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate, schedule, and manage analytics reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button
              variant="secondary"
              className="text-[var(--color-indeks-black)] bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>

        {/* Report Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reportStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-[var(--color-indeks-green)] font-medium">
                        {stat.change}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {stat.period}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg bg-accent`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Report Templates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Report Templates</h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {reportTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.title}
                  className="p-6 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
                >
                  <div
                    className={`p-3 rounded-lg ${template.bgColor} w-fit mb-4`}
                  >
                    <Icon className={`h-6 w-6 ${template.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2">{template.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2 flex-grow">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-muted-foreground">
                      {template.reports} reports
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="group-hover:bg-accent"
                    >
                      Generate
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Reports Table */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Reports</h3>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Report Name
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Generated
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Size
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Downloads
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentReports.map((report, index) => (
                    <tr
                      key={index}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-muted">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {report.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {report.author}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {report.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{report.date}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {report.size}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{report.downloads}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge
                          variant={
                            report.status === "Ready" ? "success" : "outline"
                          }
                          className="text-xs"
                        >
                          {report.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {report.status === "Ready" && (
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Scheduled Reports */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Scheduled Reports</h3>
              <Button variant="ghost" size="sm">
                Manage All
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {scheduledReports.map((schedule, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border hover:border-primary/50 transition-colors flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{schedule.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {schedule.frequency}
                        </Badge>
                        <Badge variant="success" className="text-xs">
                          {schedule.status}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm mt-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Next run:</span>
                      <span className="font-medium">{schedule.nextRun}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last run:</span>
                      <span className="text-muted-foreground text-xs">
                        {schedule.lastRun}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Recipients:</span>
                      <span className="font-medium">
                        {schedule.recipients} users
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
