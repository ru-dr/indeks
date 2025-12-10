import { db } from "@/db/connect";
import {
  uptimeMonitors,
  uptimeChecks,
  uptimeIncidents,
  uptimeDaily,
  projects,
} from "@/db/schema/schema";
import { eq, and, desc, gte, sql, asc } from "drizzle-orm";

class UptimeController {
  /**
   * Get all monitors for a user
   */
  async getUserMonitors(userId: string) {
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.userId, userId));

    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return [];
    }

    const monitors = await db
      .select({
        id: uptimeMonitors.id,
        projectId: uptimeMonitors.projectId,
        name: uptimeMonitors.name,
        url: uptimeMonitors.url,
        checkInterval: uptimeMonitors.checkInterval,
        timeout: uptimeMonitors.timeout,
        expectedStatusCode: uptimeMonitors.expectedStatusCode,
        isActive: uptimeMonitors.isActive,
        isPaused: uptimeMonitors.isPaused,
        currentStatus: uptimeMonitors.currentStatus,
        lastCheckedAt: uptimeMonitors.lastCheckedAt,
        lastStatusChange: uptimeMonitors.lastStatusChange,
        createdAt: uptimeMonitors.createdAt,
        projectTitle: projects.title,
        projectLink: projects.link,
      })
      .from(uptimeMonitors)
      .innerJoin(projects, eq(uptimeMonitors.projectId, projects.id))
      .where(sql`${uptimeMonitors.projectId} IN ${projectIds}`)
      .orderBy(desc(uptimeMonitors.createdAt));

    const monitorIds = monitors.map((m) => m.id);

    if (monitorIds.length === 0) {
      return [];
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const dailyStats = await db
      .select()
      .from(uptimeDaily)
      .where(
        and(
          sql`${uptimeDaily.monitorId} IN ${monitorIds}`,
          gte(uptimeDaily.date, ninetyDaysAgo.toISOString().split("T")[0]),
        ),
      )
      .orderBy(asc(uptimeDaily.date));

    const statsByMonitor = new Map<string, typeof dailyStats>();
    for (const stat of dailyStats) {
      if (!statsByMonitor.has(stat.monitorId)) {
        statsByMonitor.set(stat.monitorId, []);
      }
      statsByMonitor.get(stat.monitorId)!.push(stat);
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const calculateUptime = (stats: typeof dailyStats, afterDate: Date) => {
      const filtered = stats.filter((s) => new Date(s.date) >= afterDate);
      if (filtered.length === 0) return 100;
      const totalChecks = filtered.reduce((sum, d) => sum + d.totalChecks, 0);
      const successfulChecks = filtered.reduce(
        (sum, d) => sum + d.successfulChecks,
        0,
      );
      return totalChecks > 0
        ? Math.round((successfulChecks / totalChecks) * 10000) / 100
        : 100;
    };

    const monitorsWithUptime = monitors.map((monitor) => {
      const stats = statsByMonitor.get(monitor.id) || [];
      return {
        ...monitor,
        uptime30d: calculateUptime(stats, thirtyDaysAgo),
        uptime60d: calculateUptime(stats, sixtyDaysAgo),
        uptime90d: calculateUptime(stats, ninetyDaysAgo),
        dailyStats: stats,
      };
    });

    return monitorsWithUptime;
  }

  /**
   * Get monitors for a specific project
   */
  async getProjectMonitors(projectId: string, userId: string) {
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (project.length === 0) {
      return { error: "Project not found", status: 404 };
    }

    const monitors = await db
      .select()
      .from(uptimeMonitors)
      .where(eq(uptimeMonitors.projectId, projectId))
      .orderBy(desc(uptimeMonitors.createdAt));

    return monitors;
  }

  /**
   * Create a new monitor
   */
  async createMonitor(
    projectId: string,
    userId: string,
    data: {
      name: string;
      url: string;
      checkInterval?: number;
      timeout?: number;
      expectedStatusCode?: number;
    },
  ) {
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (project.length === 0) {
      return { error: "Project not found", status: 404 };
    }

    const [monitor] = await db
      .insert(uptimeMonitors)
      .values({
        projectId,
        name: data.name,
        url: data.url,
        checkInterval: data.checkInterval || 60,
        timeout: data.timeout || 30,
        expectedStatusCode: data.expectedStatusCode || 200,
        currentStatus: "unknown",
      })
      .returning();

    return monitor;
  }

  /**
   * Update a monitor
   */
  async updateMonitor(
    monitorId: string,
    userId: string,
    data: {
      name?: string;
      url?: string;
      checkInterval?: number;
      timeout?: number;
      expectedStatusCode?: number;
      isPaused?: boolean;
      isActive?: boolean;
    },
  ) {
    const monitor = await db
      .select({ monitor: uptimeMonitors, project: projects })
      .from(uptimeMonitors)
      .innerJoin(projects, eq(uptimeMonitors.projectId, projects.id))
      .where(and(eq(uptimeMonitors.id, monitorId), eq(projects.userId, userId)))
      .limit(1);

    if (monitor.length === 0) {
      return { error: "Monitor not found", status: 404 };
    }

    const [updated] = await db
      .update(uptimeMonitors)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.url && { url: data.url }),
        ...(data.checkInterval && { checkInterval: data.checkInterval }),
        ...(data.timeout && { timeout: data.timeout }),
        ...(data.expectedStatusCode && {
          expectedStatusCode: data.expectedStatusCode,
        }),
        ...(data.isPaused !== undefined && { isPaused: data.isPaused }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      })
      .where(eq(uptimeMonitors.id, monitorId))
      .returning();

    return updated;
  }

  /**
   * Delete a monitor
   */
  async deleteMonitor(monitorId: string, userId: string) {
    const monitor = await db
      .select({ monitor: uptimeMonitors, project: projects })
      .from(uptimeMonitors)
      .innerJoin(projects, eq(uptimeMonitors.projectId, projects.id))
      .where(and(eq(uptimeMonitors.id, monitorId), eq(projects.userId, userId)))
      .limit(1);

    if (monitor.length === 0) {
      return { error: "Monitor not found", status: 404 };
    }

    await db.delete(uptimeMonitors).where(eq(uptimeMonitors.id, monitorId));

    return { success: true, message: "Monitor deleted" };
  }

  /**
   * Get monitor details
   */
  async getMonitorDetails(monitorId: string, userId: string) {
    const monitorData = await db
      .select({ monitor: uptimeMonitors, project: projects })
      .from(uptimeMonitors)
      .innerJoin(projects, eq(uptimeMonitors.projectId, projects.id))
      .where(and(eq(uptimeMonitors.id, monitorId), eq(projects.userId, userId)))
      .limit(1);

    if (monitorData.length === 0) {
      return { error: "Monitor not found", status: 404 };
    }

    const recentChecks = await db
      .select()
      .from(uptimeChecks)
      .where(eq(uptimeChecks.monitorId, monitorId))
      .orderBy(desc(uptimeChecks.checkedAt))
      .limit(100);

    const recentIncidents = await db
      .select()
      .from(uptimeIncidents)
      .where(eq(uptimeIncidents.monitorId, monitorId))
      .orderBy(desc(uptimeIncidents.startedAt))
      .limit(10);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await db
      .select()
      .from(uptimeDaily)
      .where(
        and(
          eq(uptimeDaily.monitorId, monitorId),
          gte(uptimeDaily.date, thirtyDaysAgo.toISOString().split("T")[0]),
        ),
      )
      .orderBy(asc(uptimeDaily.date));

    const totalChecks = dailyStats.reduce((sum, d) => sum + d.totalChecks, 0);
    const successfulChecks = dailyStats.reduce(
      (sum, d) => sum + d.successfulChecks,
      0,
    );
    const overallUptime =
      totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

    const responseTimes = dailyStats
      .filter((d) => d.avgResponseTime !== null)
      .map((d) => d.avgResponseTime!);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : null;

    return {
      ...monitorData[0].monitor,
      project: {
        id: monitorData[0].project.id,
        title: monitorData[0].project.title,
        link: monitorData[0].project.link,
      },
      recentChecks,
      recentIncidents,
      dailyStats,
      stats: {
        overallUptime: Math.round(overallUptime * 100) / 100,
        avgResponseTime: avgResponseTime ? Math.round(avgResponseTime) : null,
        totalIncidents: recentIncidents.length,
        ongoingIncidents: recentIncidents.filter((i) => i.status === "ongoing")
          .length,
      },
    };
  }

  /**
   * Perform a manual check on a monitor
   */
  async performCheck(monitorId: string, userId: string) {
    const monitorData = await db
      .select({ monitor: uptimeMonitors, project: projects })
      .from(uptimeMonitors)
      .innerJoin(projects, eq(uptimeMonitors.projectId, projects.id))
      .where(and(eq(uptimeMonitors.id, monitorId), eq(projects.userId, userId)))
      .limit(1);

    if (monitorData.length === 0) {
      return { error: "Monitor not found", status: 404 };
    }

    const monitor = monitorData[0].monitor;

    const startTime = Date.now();
    let status = "up";
    let statusCode: number | null = null;
    let errorMessage: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        monitor.timeout * 1000,
      );

      const response = await fetch(monitor.url, {
        method: "GET",
        signal: controller.signal,
        headers: { "User-Agent": "Indeks-Uptime-Monitor/1.0" },
      });

      clearTimeout(timeoutId);
      statusCode = response.status;

      if (response.status !== monitor.expectedStatusCode) {
        status = "down";
        errorMessage = `Expected status ${monitor.expectedStatusCode}, got ${response.status}`;
      }
    } catch (err: unknown) {
      status = "down";
      if (err instanceof Error && err.name === "AbortError") {
        errorMessage = "Request timed out";
      } else if (err instanceof Error) {
        errorMessage = err.message || "Connection failed";
      } else {
        errorMessage = "Connection failed";
      }
    }

    const responseTime = Date.now() - startTime;

    if (status === "up" && responseTime > 2000) {
      status = "degraded";
    }

    const [check] = await db
      .insert(uptimeChecks)
      .values({ monitorId, status, statusCode, responseTime, errorMessage })
      .returning();

    const previousStatus = monitor.currentStatus;
    const statusChanged = previousStatus !== status;

    await db
      .update(uptimeMonitors)
      .set({
        currentStatus: status,
        lastCheckedAt: new Date(),
        ...(statusChanged && { lastStatusChange: new Date() }),
      })
      .where(eq(uptimeMonitors.id, monitorId));

    if (statusChanged) {
      if (status === "down") {
        await db
          .insert(uptimeIncidents)
          .values({
            monitorId,
            status: "ongoing",
            cause: errorMessage || "Unknown",
          });
      } else if (previousStatus === "down") {
        const ongoingIncident = await db
          .select()
          .from(uptimeIncidents)
          .where(
            and(
              eq(uptimeIncidents.monitorId, monitorId),
              eq(uptimeIncidents.status, "ongoing"),
            ),
          )
          .limit(1);

        if (ongoingIncident.length > 0) {
          const duration = Math.floor(
            (Date.now() - new Date(ongoingIncident[0].startedAt).getTime()) /
              1000,
          );
          await db
            .update(uptimeIncidents)
            .set({
              status: "resolved",
              resolvedAt: new Date(),
              durationSeconds: duration,
            })
            .where(eq(uptimeIncidents.id, ongoingIncident[0].id));
        }
      }
    }

    return { ...check, statusChanged, previousStatus };
  }

  /**
   * Get uptime summary for a user
   */
  async getUserSummary(userId: string) {
    const userProjects = await db
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .where(eq(projects.userId, userId));

    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return {
        totalMonitors: 0,
        monitorsUp: 0,
        monitorsDown: 0,
        monitorsDegraded: 0,
        monitorsUnknown: 0,
        ongoingIncidents: 0,
        avgUptime: null,
        projectSummaries: [],
      };
    }

    const monitors = await db
      .select()
      .from(uptimeMonitors)
      .where(sql`${uptimeMonitors.projectId} IN ${projectIds}`);

    const ongoingIncidents = await db
      .select({ count: sql<number>`count(*)` })
      .from(uptimeIncidents)
      .innerJoin(
        uptimeMonitors,
        eq(uptimeIncidents.monitorId, uptimeMonitors.id),
      )
      .where(
        and(
          sql`${uptimeMonitors.projectId} IN ${projectIds}`,
          eq(uptimeIncidents.status, "ongoing"),
        ),
      );

    const statusCounts = monitors.reduce(
      (acc, m) => {
        if (m.currentStatus === "up") acc.up++;
        else if (m.currentStatus === "down") acc.down++;
        else if (m.currentStatus === "degraded") acc.degraded++;
        else acc.unknown++;
        return acc;
      },
      { up: 0, down: 0, degraded: 0, unknown: 0 },
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monitorIds = monitors.map((m) => m.id);

    let avgUptime: number | null = null;
    if (monitorIds.length > 0) {
      const dailyStats = await db
        .select()
        .from(uptimeDaily)
        .where(
          and(
            sql`${uptimeDaily.monitorId} IN ${monitorIds}`,
            gte(uptimeDaily.date, thirtyDaysAgo.toISOString().split("T")[0]),
          ),
        );

      if (dailyStats.length > 0) {
        const totalChecks = dailyStats.reduce(
          (sum, d) => sum + d.totalChecks,
          0,
        );
        const successfulChecks = dailyStats.reduce(
          (sum, d) => sum + d.successfulChecks,
          0,
        );
        if (totalChecks > 0) {
          avgUptime = (successfulChecks / totalChecks) * 100;
        }
      }
    }

    const projectSummaries = userProjects.map((project) => {
      const projectMonitors = monitors.filter(
        (m) => m.projectId === project.id,
      );
      return {
        projectId: project.id,
        projectTitle: project.title,
        totalMonitors: projectMonitors.length,
        monitorsUp: projectMonitors.filter((m) => m.currentStatus === "up")
          .length,
        monitorsDown: projectMonitors.filter((m) => m.currentStatus === "down")
          .length,
        monitorsDegraded: projectMonitors.filter(
          (m) => m.currentStatus === "degraded",
        ).length,
      };
    });

    return {
      totalMonitors: monitors.length,
      monitorsUp: statusCounts.up,
      monitorsDown: statusCounts.down,
      monitorsDegraded: statusCounts.degraded,
      monitorsUnknown: statusCounts.unknown,
      ongoingIncidents: Number(ongoingIncidents[0]?.count || 0),
      avgUptime: avgUptime !== null ? Math.round(avgUptime * 100) / 100 : null,
      projectSummaries,
    };
  }
}

export const uptimeController = new UptimeController();
