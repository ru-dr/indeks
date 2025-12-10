"use client";

import { useState } from "react";
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
  Loader2,
  CheckCircle,
  AlertCircle,
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";

const EXPORT_API = "/api/reports/export";

interface RawEvent {
  event_type: string;
  url: string | null;
  session_id: string | null;
  user_id: string | null;
  user_agent: string | null;
  referrer: string | null;
  metadata: Record<string, any>;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  created_at: string;
}

interface SessionData {
  sessionId: string;
  userId: string;
  events: RawEvent[];
  startTime: Date;
  endTime: Date;
  landingPage: string;
  exitPage: string;
  pagesViewed: Set<string>;
  totalClicks: number;
  totalScrolls: number;
  maxScrollDepth: number;
  hasError: boolean;
  referrer: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  device: Record<string, any>;
  firstEvent: RawEvent;
}

interface TrafficRow {
  Date: string;
  Time: string;
  "Session ID": string;
  "User ID": string;
  "Landing Page": string;
  "Exit Page": string;
  "Session Duration (ms)": string;
  "Session Duration (formatted)": string;
  "Pages Viewed": string;
  "Page URLs": string;
  "Total Clicks": string;
  "Total Scrolls": string;
  "Max Scroll Depth": string;
  Bounce: string;
  "Has Error": string;
  "Traffic Source": string;
  "Referrer URL": string;
  "Referrer Domain": string;
  "UTM Source": string;
  "UTM Medium": string;
  "UTM Campaign": string;
  Country: string;
  City: string;
  Latitude: string;
  Longitude: string;
  Timezone: string;
  Language: string;
  "Device Type": string;
  "Device Vendor": string;
  "Device Model": string;
  "OS Name": string;
  "OS Version": string;
  "Browser Name": string;
  "Browser Version": string;
  "Screen Width": string;
  "Screen Height": string;
  "Viewport Width": string;
  "Viewport Height": string;
  "Is Mobile": string;
  "Is Tablet": string;
  "Is Desktop": string;
  "Connection Type": string;
  "Is Bot": string;
}

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [selectedProject, setSelectedProject] = useState<string>("");
  const { projects, isLoading: projectsLoading } = useProjects();

  const extractReferrerDomain = (referrer: string | null) => {
    if (!referrer) return "";
    try {
      const url = new URL(referrer);
      return url.hostname;
    } catch {
      return "";
    }
  };

  const determineTrafficSource = (
    referrer: string | null,
    metadata: Record<string, any>
  ) => {
    if (metadata?.trafficSource) return metadata.trafficSource;

    const utmSource = metadata?.utmSource || metadata?.utm_source || "";
    const utmMedium = metadata?.utmMedium || metadata?.utm_medium || "";

    if (utmSource || utmMedium) {
      if (utmMedium === "cpc" || utmMedium === "ppc" || utmMedium === "paid")
        return "paid";
      if (utmMedium === "email") return "email";
      if (utmMedium === "social") return "social";
    }

    if (!referrer) return "direct";

    const domain = extractReferrerDomain(referrer).toLowerCase();
    if (
      domain.includes("google") ||
      domain.includes("bing") ||
      domain.includes("yahoo") ||
      domain.includes("duckduckgo")
    ) {
      return "organic";
    }
    if (
      domain.includes("facebook") ||
      domain.includes("twitter") ||
      domain.includes("linkedin") ||
      domain.includes("instagram")
    ) {
      return "social";
    }

    return "referral";
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const processEventsIntoSessions = (events: RawEvent[]): SessionData[] => {
    const sessionMap = new Map<string, SessionData>();

    // Sort events by timestamp
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const event of sortedEvents) {
      const sessionId = event.session_id || "unknown";

      if (!sessionMap.has(sessionId)) {
        const device = event.metadata?.device || {};
        sessionMap.set(sessionId, {
          sessionId,
          userId: event.user_id || "",
          events: [],
          startTime: new Date(event.timestamp),
          endTime: new Date(event.timestamp),
          landingPage: event.url || "",
          exitPage: event.url || "",
          pagesViewed: new Set(),
          totalClicks: 0,
          totalScrolls: 0,
          maxScrollDepth: 0,
          hasError: false,
          referrer: event.referrer,
          country: event.country,
          city: event.city,
          latitude: event.latitude,
          longitude: event.longitude,
          device,
          firstEvent: event,
        });
      }

      const session = sessionMap.get(sessionId)!;
      session.events.push(event);
      session.endTime = new Date(event.timestamp);
      session.exitPage = event.url || session.exitPage;

      // Track pages viewed
      if (event.url) {
        session.pagesViewed.add(event.url);
      }

      // Count event types
      if (event.event_type === "click" || event.event_type === "double_click") {
        session.totalClicks++;
      }
      if (event.event_type === "scroll" || event.event_type === "scroll_depth") {
        session.totalScrolls++;
        // Extract scroll depth
        const scrollDepth =
          event.metadata?.scrollPercentage ||
          event.metadata?.depth ||
          event.metadata?.scrollPosition?.scrollPercentage ||
          0;
        if (scrollDepth > session.maxScrollDepth) {
          session.maxScrollDepth = scrollDepth;
        }
      }
      if (event.event_type === "error" || event.event_type === "resource_error") {
        session.hasError = true;
      }

      // Update device info if more complete
      if (event.metadata?.device && Object.keys(event.metadata.device).length > Object.keys(session.device).length) {
        session.device = event.metadata.device;
      }
    }

    return Array.from(sessionMap.values());
  };

  const transformSessionToRow = (session: SessionData): TrafficRow => {
    const metadata = session.firstEvent.metadata || {};
    const device = session.device || {};

    const sessionDuration = session.endTime.getTime() - session.startTime.getTime();
    const isBounce = session.pagesViewed.size <= 1 && session.totalClicks === 0;

    return {
      Date: session.startTime.toISOString().split("T")[0],
      Time: session.startTime.toISOString().split("T")[1].split(".")[0],
      "Session ID": session.sessionId,
      "User ID": session.userId,
      "Landing Page": session.landingPage,
      "Exit Page": session.exitPage,
      "Session Duration (ms)": String(sessionDuration),
      "Session Duration (formatted)": formatDuration(sessionDuration),
      "Pages Viewed": String(session.pagesViewed.size),
      "Page URLs": Array.from(session.pagesViewed).join(" | "),
      "Total Clicks": String(session.totalClicks),
      "Total Scrolls": String(session.totalScrolls),
      "Max Scroll Depth": session.maxScrollDepth > 0 ? `${session.maxScrollDepth}%` : "",
      Bounce: isBounce ? "Yes" : "No",
      "Has Error": session.hasError ? "Yes" : "No",
      "Traffic Source": determineTrafficSource(session.referrer, metadata),
      "Referrer URL": session.referrer || "",
      "Referrer Domain": extractReferrerDomain(session.referrer),
      "UTM Source": metadata.utmSource || metadata.utm_source || "",
      "UTM Medium": metadata.utmMedium || metadata.utm_medium || "",
      "UTM Campaign": metadata.utmCampaign || metadata.utm_campaign || "",
      Country: session.country || "",
      City: session.city || "",
      Latitude: session.latitude ? String(session.latitude) : "",
      Longitude: session.longitude ? String(session.longitude) : "",
      Timezone: device.timezone || "",
      Language: device.language || "",
      "Device Type": device.deviceType || (metadata.isMobile ? "mobile" : metadata.isTablet ? "tablet" : "desktop"),
      "Device Vendor": device.deviceVendor || "",
      "Device Model": device.deviceModel || "",
      "OS Name": device.osName || "",
      "OS Version": device.osVersion || "",
      "Browser Name": device.browserName || "",
      "Browser Version": device.browserVersion || "",
      "Screen Width": device.screenWidth ? String(device.screenWidth) : "",
      "Screen Height": device.screenHeight ? String(device.screenHeight) : "",
      "Viewport Width": device.viewportWidth ? String(device.viewportWidth) : "",
      "Viewport Height": device.viewportHeight ? String(device.viewportHeight) : "",
      "Is Mobile": device.deviceType === "mobile" || metadata.isMobile ? "Yes" : "No",
      "Is Tablet": device.deviceType === "tablet" || metadata.isTablet ? "Yes" : "No",
      "Is Desktop": device.deviceType === "desktop" || metadata.isDesktop ? "Yes" : "No",
      "Connection Type": device.connectionType || device.connectionEffectiveType || "",
      "Is Bot": device.isBot ? "Yes" : "No",
    };
  };

  const generateTrafficReport = async () => {
    if (!selectedProject) {
      setStatus({ type: "error", message: "Please select a project first" });
      return;
    }

    setIsGenerating(true);
    setStatus({ type: null, message: "" });

    try {
      // Fetch events from the API (limited to get enough for ~100 sessions)
      const response = await fetch(
        `/api/v1/analytics/${selectedProject}/events-stream?limit=500`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const data = await response.json();
      const events: RawEvent[] = data.events || [];

      if (events.length === 0) {
        setStatus({
          type: "error",
          message: "No analytics data found for this project",
        });
        setIsGenerating(false);
        return;
      }

      // Process events into sessions and calculate metrics
      const sessions = processEventsIntoSessions(events);

      if (sessions.length === 0) {
        setStatus({
          type: "error",
          message: "No session data found to export",
        });
        setIsGenerating(false);
        return;
      }

      // Transform sessions to rows
      const trafficRows = sessions.map((session) => transformSessionToRow(session));

      // Sort by date/time descending (most recent first)
      trafficRows.sort((a, b) => {
        const dateA = new Date(`${a.Date}T${a.Time}`);
        const dateB = new Date(`${b.Date}T${b.Time}`);
        return dateB.getTime() - dateA.getTime();
      });

      // Limit to 100 rows
      const limitedRows = trafficRows.slice(0, 100);

      // Send to our API route which handles SheetDB
      const exportResponse = await fetch(EXPORT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: limitedRows }),
      });

      if (!exportResponse.ok) {
        const errorData = await exportResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to export data");
      }

      const result = await exportResponse.json();
      setStatus({
        type: "success",
        message: `Successfully exported ${limitedRows.length} sessions to Google Sheets`,
      });
    } catch (error) {
      console.error("Failed to generate report:", error);
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to generate report",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
  ];

  const reportTemplates = [
    {
      icon: TrendingUp,
      title: "Traffic Analysis",
      description:
        "Session-based breakdown of website traffic with calculated metrics",
      color: "text-[var(--color-indeks-blue)]",
      reports: 42,
      available: true,
    },
    {
      icon: Users,
      title: "User Demographics",
      description: "Comprehensive analysis of user demographics and locations",
      color: "text-[var(--color-indeks-green)]",
      reports: 0,
      available: false,
    },
    {
      icon: DollarSign,
      title: "Revenue Report",
      description: "Financial performance and revenue metrics overview",
      color: "text-[var(--color-indeks-yellow)]",
      reports: 0,
      available: false,
    },
    {
      icon: Eye,
      title: "Content Performance",
      description: "Detailed insights on page views and content engagement",
      color: "text-[var(--color-indeks-orange)]",
      reports: 0,
      available: false,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Reports
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Generate, schedule, and manage analytics reports
            </p>
          </div>
          <Button
            disabled
            className="bg-[var(--color-indeks-green)] hover:bg-[var(--color-indeks-green)]/90 text-[var(--color-indeks-black)] w-full sm:w-auto disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Report
            <Badge variant="outline" className="ml-2 text-[10px]">
              Soon
            </Badge>
          </Button>
        </div>

        {/* Status Message */}
        {status.type && (
          <div
            className={`flex items-center gap-2 p-4 rounded-lg ${
              status.type === "success"
                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Reports
                </p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">1</h3>
              </div>
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-blue)]" />
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Scheduled
                </p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-muted-foreground">
                  —
                </h3>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-green)] opacity-50" />
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Downloads
                </p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-muted-foreground">
                  —
                </h3>
              </div>
              <Download className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-yellow)] opacity-50" />
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Shared
                </p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-muted-foreground">
                  —
                </h3>
              </div>
              <Share2 className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-orange)] opacity-50" />
            </div>
          </Card>
        </div>

        {/* Report Templates */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--color-indeks-blue)]" />
              <h3 className="text-base sm:text-lg font-semibold">
                Report Templates
              </h3>
            </div>
            {/* Project Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Project:</span>
              <Select
                value={selectedProject}
                onValueChange={(value) => setSelectedProject(value ?? "")}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue>Select a project</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projectsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : projects && projects.length > 0 ? (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No projects found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {reportTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.title}
                  className={`p-3 sm:p-4 rounded-lg border ${
                    template.available
                      ? "hover:bg-muted/50 cursor-pointer"
                      : "opacity-60"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 sm:h-6 sm:w-6 ${template.color} mb-2 sm:mb-3 ${
                      !template.available && "opacity-50"
                    }`}
                  />
                  <h4 className="font-medium text-sm sm:text-base mb-1">
                    {template.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {template.available
                        ? `${template.reports} reports`
                        : "Coming soon"}
                    </span>
                    {template.available ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateTrafficReport}
                        disabled={isGenerating || !selectedProject}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          "Generate"
                        )}
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Soon
                      </Badge>
                    )}
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
            <h3 className="text-base sm:text-lg font-semibold">
              Recent Reports
            </h3>
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
                          <p className="text-xs text-muted-foreground">
                            {report.author}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {report.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.size}
                    </TableCell>
                    <TableCell>{report.downloads}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          report.status === "Ready" ? "success" : "outline"
                        }
                        className="text-xs"
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {report.status === "Ready" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={generateTrafficReport}
                            disabled={isGenerating || !selectedProject}
                          >
                            {isGenerating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Frame>
        </Card>

        {/* Scheduled Reports - Coming Soon */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
            <h3 className="text-base sm:text-lg font-semibold">
              Scheduled Reports
            </h3>
            <Badge variant="outline" className="text-xs ml-2">
              Coming Soon
            </Badge>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h4 className="text-lg font-medium text-muted-foreground mb-2">
              Scheduled Reports Coming Soon
            </h4>
            <p className="text-sm text-muted-foreground max-w-md">
              Automate your reporting workflow by scheduling reports to be
              generated and delivered automatically.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
