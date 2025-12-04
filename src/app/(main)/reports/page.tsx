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
  Share2,
} from "lucide-react";
import { Frame } from "@/components/ui/frame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ReportsPage() {
  const recentReports = [
    {
      title: "Monthly Traffic Report",
      type: "Traffic Analysis",
      date: "November 1, 2025",
      status: "Ready",
      size: "2.4 MB",
      author: "System",
      downloads: 23,
    },
    {
      title: "Q4 Revenue Summary",
      type: "Financial",
      date: "October 28, 2025",
      status: "Ready",
      size: "1.8 MB",
      author: "Admin",
      downloads: 45,
    },
    {
      title: "User Engagement Report",
      type: "Analytics",
      date: "October 25, 2025",
      status: "Ready",
      size: "3.1 MB",
      author: "System",
      downloads: 12,
    },
    {
      title: "Weekly Performance",
      type: "Performance",
      date: "October 20, 2025",
      status: "Processing",
      size: "-",
      author: "System",
      downloads: 0,
    },
    {
      title: "Content Analysis Report",
      type: "Content",
      date: "October 18, 2025",
      status: "Ready",
      size: "4.2 MB",
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
      reports: 42,
    },
    {
      icon: Users,
      title: "User Demographics",
      description: "Comprehensive analysis of user demographics and locations",
      color: "text-[var(--color-indeks-green)]",
      reports: 38,
    },
    {
      icon: DollarSign,
      title: "Revenue Report",
      description: "Financial performance and revenue metrics overview",
      color: "text-[var(--color-indeks-yellow)]",
      reports: 29,
    },
    {
      icon: Eye,
      title: "Content Performance",
      description: "Detailed insights on page views and content engagement",
      color: "text-[var(--color-indeks-orange)]",
      reports: 51,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Generate, schedule, and manage analytics reports
            </p>
          </div>
          <Button className="bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90 text-[var(--color-indeks-black)] w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Reports</p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">248</h3>
              </div>
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-blue)]" />
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Scheduled</p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">18</h3>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-green)]" />
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Downloads</p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">1,456</h3>
              </div>
              <Download className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-yellow)]" />
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Shared</p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">89</h3>
              </div>
              <Share2 className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-orange)]" />
            </div>
          </Card>
        </div>

        {/* Report Templates */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[var(--color-indeks-blue)]" />
            <h3 className="text-base sm:text-lg font-semibold">Report Templates</h3>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {reportTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div key={template.title} className="p-3 sm:p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${template.color} mb-2 sm:mb-3`} />
                  <h4 className="font-medium text-sm sm:text-base mb-1">{template.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">{template.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{template.reports} reports</span>
                    <Button variant="ghost" size="sm">Generate</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Reports Table */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-[var(--color-indeks-green)]" />
            <h3 className="text-base sm:text-lg font-semibold">Recent Reports</h3>
          </div>
          <Frame className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReports.map((report, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{report.title}</p>
                          <p className="text-xs text-muted-foreground">{report.author}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{report.type}</Badge>
                    </TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell className="text-muted-foreground">{report.size}</TableCell>
                    <TableCell>{report.downloads}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={report.status === "Ready" ? "success" : "outline"} className="text-xs">
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {report.status === "Ready" && (
                          <Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button>
                        )}
                        <Button size="sm" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Frame>
        </Card>

        {/* Scheduled Reports */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
            <h3 className="text-base sm:text-lg font-semibold">Scheduled Reports</h3>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            {scheduledReports.map((schedule, index) => (
              <div key={index} className="p-3 sm:p-4 rounded-lg border hover:bg-muted/50">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm sm:text-base mb-1 truncate">{schedule.name}</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{schedule.frequency}</Badge>
                      <Badge variant="success" className="text-xs">{schedule.status}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-1 sm:space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs sm:text-sm">Next run:</span>
                    <span className="font-medium text-xs sm:text-sm">{schedule.nextRun}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs sm:text-sm">Last run:</span>
                    <span className="text-muted-foreground text-xs">{schedule.lastRun}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground text-xs sm:text-sm">Recipients:</span>
                    <span className="font-medium text-xs sm:text-sm">{schedule.recipients} users</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
