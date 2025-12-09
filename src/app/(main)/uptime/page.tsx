"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Signal,
  Trash2,
  TrendingUp,
  XCircle,
  Zap,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  link: string;
}

interface Monitor {
  id: string;
  projectId: string;
  name: string;
  url: string;
  checkInterval: number;
  timeout: number;
  expectedStatusCode: number;
  isActive: boolean;
  isPaused: boolean;
  currentStatus: string;
  lastCheckedAt: string | null;
  lastStatusChange: string | null;
  createdAt: string;
  projectTitle?: string;
  projectLink?: string;
}

interface UptimeSummary {
  totalMonitors: number;
  monitorsUp: number;
  monitorsDown: number;
  monitorsDegraded: number;
  monitorsUnknown: number;
  ongoingIncidents: number;
  avgUptime: number;
  projectSummaries: {
    projectId: string;
    projectTitle: string;
    totalMonitors: number;
    monitorsUp: number;
    monitorsDown: number;
    monitorsDegraded: number;
  }[];
}

type FilterStatus = "all" | "up" | "down" | "degraded" | "paused";

export default function UptimePage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<UptimeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [checkingMonitor, setCheckingMonitor] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newMonitor, setNewMonitor] = useState({
    projectId: "",
    name: "",
    url: "",
    checkInterval: 60,
    timeout: 30,
    expectedStatusCode: 200,
  });
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const monitorsRes = await fetch("/api/v1/uptime/monitors");
      const monitorsData = await monitorsRes.json();
      if (monitorsData.success) {
        setMonitors(monitorsData.data);
      }

      const summaryRes = await fetch("/api/v1/uptime/summary");
      const summaryData = await summaryRes.json();
      if (summaryData.success) {
        setSummary(summaryData.data);
      }

      const projectsRes = await fetch("/api/v1/projects");
      const projectsData = await projectsRes.json();
      if (projectsData.success) {
        setProjects(projectsData.data);
      }
    } catch (err) {
      console.error("Error fetching uptime data:", err);
      setError("Failed to load uptime data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleManualCheck = async (monitorId: string) => {
    setCheckingMonitor(monitorId);
    try {
      await fetch(`/api/v1/uptime/monitors/${monitorId}/check`, { method: "POST" });
      await fetchData();
    } catch (err) {
      console.error("Error performing check:", err);
    } finally {
      setCheckingMonitor(null);
    }
  };

  const handleTogglePause = async (monitorId: string, isPaused: boolean) => {
    try {
      await fetch(`/api/v1/uptime/monitors/${monitorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaused: !isPaused }),
      });
      await fetchData();
    } catch (err) {
      console.error("Error toggling pause:", err);
    }
  };

  const handleDelete = async (monitorId: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) return;
    try {
      await fetch(`/api/v1/uptime/monitors/${monitorId}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      console.error("Error deleting monitor:", err);
    }
  };

  const handleCreateMonitor = async () => {
    if (!newMonitor.projectId || !newMonitor.name || !newMonitor.url) return;
    
    setCreating(true);
    try {
      const res = await fetch(`/api/v1/uptime/projects/${newMonitor.projectId}/monitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMonitor.name,
          url: newMonitor.url,
          checkInterval: newMonitor.checkInterval,
          timeout: newMonitor.timeout,
          expectedStatusCode: newMonitor.expectedStatusCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateDialogOpen(false);
        setNewMonitor({ projectId: "", name: "", url: "", checkInterval: 60, timeout: 30, expectedStatusCode: 200 });
        await fetchData();
      }
    } catch (err) {
      console.error("Error creating monitor:", err);
    } finally {
      setCreating(false);
    }
  };

  const filteredMonitors = monitors.filter((monitor) => {
    if (filterStatus === "paused" && !monitor.isPaused) return false;
    if (filterStatus === "up" && monitor.currentStatus !== "up") return false;
    if (filterStatus === "down" && monitor.currentStatus !== "down") return false;
    if (filterStatus === "degraded" && monitor.currentStatus !== "degraded") return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return monitor.name.toLowerCase().includes(q) || monitor.url.toLowerCase().includes(q) || monitor.projectTitle?.toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusIcon = (status: string, isPaused: boolean) => {
    if (isPaused) return <Pause className="h-4 w-4 text-muted-foreground" />;
    switch (status) {
      case "up": return <CheckCircle2 className="h-4 w-4 text-[var(--color-indeks-green)]" />;
      case "down": return <XCircle className="h-4 w-4 text-destructive" />;
      case "degraded": return <AlertTriangle className="h-4 w-4 text-[var(--color-indeks-yellow)]" />;
      default: return <Signal className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, isPaused: boolean) => {
    if (isPaused) return <Badge variant="outline">Paused</Badge>;
    switch (status) {
      case "up": return <Badge variant="success">Up</Badge>;
      case "down": return <Badge variant="error">Down</Badge>;
      case "degraded": return <Badge variant="warning">Degraded</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatLastChecked = (date: string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const getHostname = (url: string) => {
    try { return new URL(url).hostname; } catch { return url; }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[90vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Uptime</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Monitor the availability of your projects</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Monitor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Monitor</DialogTitle>
                <DialogDescription>Add a new uptime monitor to track your website's availability.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select value={newMonitor.projectId} onValueChange={(v) => setNewMonitor((p) => ({ ...p, projectId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (<SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Monitor Name</Label>
                  <Input id="name" placeholder="e.g., Main Website" value={newMonitor.name} onChange={(e) => setNewMonitor((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL to Monitor</Label>
                  <Input id="url" placeholder="https://example.com" value={newMonitor.url} onChange={(e) => setNewMonitor((p) => ({ ...p, url: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interval">Check Interval</Label>
                    <Select value={String(newMonitor.checkInterval)} onValueChange={(v) => setNewMonitor((p) => ({ ...p, checkInterval: Number(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout</Label>
                    <Select value={String(newMonitor.timeout)} onValueChange={(v) => setNewMonitor((p) => ({ ...p, timeout: Number(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateMonitor} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Monitor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && <div className="rounded-md bg-destructive/15 p-3 sm:p-4 text-sm text-destructive">{error}</div>}

        {summary && (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Monitors</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{summary.totalMonitors}</h3>
                </div>
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-blue)]" />
              </div>
            </Card>
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Operational</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-[var(--color-indeks-green)]">{summary.monitorsUp}</h3>
                </div>
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-green)]" />
              </div>
            </Card>
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Down</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-destructive">{summary.monitorsDown}</h3>
                </div>
                <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
              </div>
            </Card>
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Uptime</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{summary.avgUptime.toFixed(2)}%</h3>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-indeks-yellow)]" />
              </div>
            </Card>
          </div>
        )}

        {summary && summary.ongoingIncidents > 0 && (
          <Card className="p-4 sm:p-6 border-destructive bg-destructive/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Active Incidents</h3>
                <p className="text-sm text-muted-foreground">{summary.ongoingIncidents} monitor{summary.ongoingIncidents > 1 ? "s are" : " is"} currently experiencing issues.</p>
              </div>
            </div>
          </Card>
        )}

        {monitors.length === 0 ? (
          <Card className="p-8 sm:p-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Activity /></EmptyMedia>
                <EmptyTitle>No monitors yet</EmptyTitle>
                <EmptyDescription>Create your first uptime monitor to start tracking availability.</EmptyDescription>
              </EmptyHeader>
              <Button onClick={() => setCreateDialogOpen(true)} className="mt-4"><Plus className="h-4 w-4 mr-2" />Add Monitor</Button>
            </Empty>
          </Card>
        ) : (
          <>
            {summary && summary.projectSummaries.length > 0 && (
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
                  <h3 className="text-base sm:text-lg font-semibold">Project Overview</h3>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {summary.projectSummaries.map((project) => (
                    <Link key={project.projectId} href={`/projects/${project.projectId}`}>
                      <div className="p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">{project.projectTitle}</h4>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-[var(--color-indeks-green)]" />
                            <span>{project.monitorsUp} up</span>
                          </div>
                          {project.monitorsDown > 0 && (
                            <div className="flex items-center gap-1">
                              <XCircle className="h-3 w-3 text-destructive" />
                              <span className="text-destructive">{project.monitorsDown} down</span>
                            </div>
                          )}
                          {project.monitorsDegraded > 0 && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-[var(--color-indeks-yellow)]" />
                              <span>{project.monitorsDegraded} degraded</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Signal className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                    <h3 className="text-base sm:text-lg font-semibold">All Monitors</h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search monitors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
                  </div>
                  <div className="flex items-center gap-1 border rounded-lg p-1 shrink-0">
                    <Button variant={filterStatus === "all" ? "secondary" : "ghost"} size="sm" onClick={() => setFilterStatus("all")} className="h-7 px-2 sm:px-3 text-xs">All</Button>
                    <Button variant={filterStatus === "up" ? "secondary" : "ghost"} size="sm" onClick={() => setFilterStatus("up")} className="h-7 px-2 sm:px-3 text-xs">
                      <CheckCircle2 className="h-3 w-3 sm:mr-1 text-[var(--color-indeks-green)]" /><span className="hidden sm:inline">Up</span>
                    </Button>
                    <Button variant={filterStatus === "down" ? "secondary" : "ghost"} size="sm" onClick={() => setFilterStatus("down")} className="h-7 px-2 sm:px-3 text-xs">
                      <XCircle className="h-3 w-3 sm:mr-1 text-destructive" /><span className="hidden sm:inline">Down</span>
                    </Button>
                    <Button variant={filterStatus === "paused" ? "secondary" : "ghost"} size="sm" onClick={() => setFilterStatus("paused")} className="h-7 px-2 sm:px-3 text-xs">
                      <Pause className="h-3 w-3 sm:mr-1" /><span className="hidden sm:inline">Paused</span>
                    </Button>
                  </div>
                </div>
              </div>

              {filteredMonitors.length === 0 ? (
                <div className="py-8">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><Search /></EmptyMedia>
                      <EmptyTitle>No monitors found</EmptyTitle>
                      <EmptyDescription>Try adjusting your search or filter.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Frame className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Monitor</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Last Check</TableHead>
                            <TableHead className="text-center">Interval</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMonitors.map((monitor) => (
                            <TableRow key={monitor.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(monitor.currentStatus, monitor.isPaused)}
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{monitor.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{getHostname(monitor.url)}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Link href={`/projects/${monitor.projectId}`} className="text-sm hover:text-[var(--color-indeks-blue)] transition-colors">
                                  {monitor.projectTitle}
                                </Link>
                              </TableCell>
                              <TableCell className="text-center">{getStatusBadge(monitor.currentStatus, monitor.isPaused)}</TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">{formatLastChecked(monitor.lastCheckedAt)}</TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">{formatInterval(monitor.checkInterval)}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleManualCheck(monitor.id)} disabled={checkingMonitor === monitor.id}>
                                    <RefreshCw className={cn("h-4 w-4", checkingMonitor === monitor.id && "animate-spin")} />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleTogglePause(monitor.id, monitor.isPaused)}>
                                        {monitor.isPaused ? <><Play className="h-4 w-4 mr-2" />Resume</> : <><Pause className="h-4 w-4 mr-2" />Pause</>}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild>
                                        <a href={monitor.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Visit URL</a>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleDelete(monitor.id)} className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Frame>
                  </div>

                  <div className="md:hidden space-y-3">
                    {filteredMonitors.map((monitor) => (
                      <div key={monitor.id} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(monitor.currentStatus, monitor.isPaused)}
                              <h4 className="font-medium text-sm truncate">{monitor.name}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mb-2">{getHostname(monitor.url)}</p>
                            <div className="flex items-center gap-3 text-xs">
                              {getStatusBadge(monitor.currentStatus, monitor.isPaused)}
                              <span className="text-muted-foreground">{formatLastChecked(monitor.lastCheckedAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => handleManualCheck(monitor.id)} disabled={checkingMonitor === monitor.id}>
                              <RefreshCw className={cn("h-4 w-4", checkingMonitor === monitor.id && "animate-spin")} />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleTogglePause(monitor.id, monitor.isPaused)}>
                                  {monitor.isPaused ? <><Play className="h-4 w-4 mr-2" />Resume</> : <><Pause className="h-4 w-4 mr-2" />Pause</>}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a href={monitor.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Visit URL</a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(monitor.id)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
