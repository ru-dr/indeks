import { Elysia, t } from "elysia";
import { db } from "@/db/connect";
import {
  uptimeMonitors,
  uptimeChecks,
  uptimeIncidents,
  uptimeDaily,
  projects,
} from "@/db/schema/schema";
import { eq, and, desc, gte, sql, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const uptimeRoutes = new Elysia({ prefix: "/v1/uptime" })
  
  .get("/monitors", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    try {
      const userProjects = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.userId, session.user.id));

      const projectIds = userProjects.map((p) => p.id);

      if (projectIds.length === 0) {
        return { success: true, data: [] };
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

      return { success: true, data: monitors };
    } catch (error) {
      console.error("Error fetching monitors:", error);
      set.status = 500;
      return { success: false, message: "Failed to fetch monitors" };
    }
  })
  
  .get(
    "/projects/:projectId/monitors",
    async ({ params: { projectId }, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const project = await db
          .select()
          .from(projects)
          .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
          .limit(1);

        if (project.length === 0) {
          set.status = 404;
          return { success: false, message: "Project not found" };
        }

        const monitors = await db
          .select()
          .from(uptimeMonitors)
          .where(eq(uptimeMonitors.projectId, projectId))
          .orderBy(desc(uptimeMonitors.createdAt));

        return { success: true, data: monitors };
      } catch (error) {
        console.error("Error fetching project monitors:", error);
        set.status = 500;
        return { success: false, message: "Failed to fetch monitors" };
      }
    },
    { params: t.Object({ projectId: t.String() }) }
  )
  
  .post(
    "/projects/:projectId/monitors",
    async ({ params: { projectId }, body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const project = await db
          .select()
          .from(projects)
          .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
          .limit(1);

        if (project.length === 0) {
          set.status = 404;
          return { success: false, message: "Project not found" };
        }

        const [monitor] = await db
          .insert(uptimeMonitors)
          .values({
            projectId,
            name: body.name,
            url: body.url,
            checkInterval: body.checkInterval || 60,
            timeout: body.timeout || 30,
            expectedStatusCode: body.expectedStatusCode || 200,
            currentStatus: "unknown",
          })
          .returning();

        return { success: true, data: monitor };
      } catch (error) {
        console.error("Error creating monitor:", error);
        set.status = 500;
        return { success: false, message: "Failed to create monitor" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      body: t.Object({
        name: t.String(),
        url: t.String(),
        checkInterval: t.Optional(t.Number()),
        timeout: t.Optional(t.Number()),
        expectedStatusCode: t.Optional(t.Number()),
      }),
    }
  )
  
  .patch(
    "/monitors/:monitorId",
    async ({ params: { monitorId }, body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const monitor = await db
          .select({ monitor: uptimeMonitors, project: projects })
          .from(uptimeMonitors)
          .innerJoin(projects, eq(uptimeMonitors.projectId, projects.id))
          .where(and(eq(uptimeMonitors.id, monitorId), eq(projects.userId, session.user.id)))
          .limit(1);

        if (monitor.length === 0) {
          set.status = 404;
          return { success: false, message: "Monitor not found" };
        }

        const [updated] = await db
          .update(uptimeMonitors)
          .set({
            ...(body.name && { name: body.name }),
            ...(body.url && { url: body.url }),
            ...(body.checkInterval && { checkInterval: body.checkInterval }),
            ...(body.timeout && { timeout: body.timeout }),
            ...(body.expectedStatusCode && { expectedStatusCode: body.expectedStatusCode }),
            ...(body.isPaused !== undefined && { isPaused: body.isPaused }),
            ...(body.isActive !== undefined && { isActive: body.isActive }),
          })
          .where(eq(uptimeMonitors.id, monitorId))
          .returning();

        return { success: true, data: updated };
      } catch (error) {
        console.error("Error updating monitor:", error);
        set.status = 500;
        return { success: false, message: "Failed to update monitor" };
      }
    },
    {
      params: t.Object({ monitorId: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        url: t.Optional(t.String()),
        checkInterval: t.Optional(t.Number()),
        timeout: t.Optional(t.Number()),
        expectedStatusCode: t.Optional(t.Number()),
        isPaused: t.Optional(t.Boolean()),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )
  
  .delete(
    "/monitors/:monitorId",
    async ({ params: { monitorId }, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const monitor = await db
          .select({ monitor: uptimeMonitors, project: projects })
          .from(uptimeMonitors)
          .innerJoin(projects, eq(uptimeMonitors.projectId, projects.id))
          .where(and(eq(uptimeMonitors.id, monitorId), eq(projects.userId, session.user.id)))
          .limit(1);

        if (monitor.length === 0) {
          set.status = 404;
          return { success: false, message: "Monitor not found" };
        }

        await db.delete(uptimeMonitors).where(eq(uptimeMonitors.id, monitorId));

        return { success: true, message: "Monitor deleted" };
      } catch (error) {
        console.error("Error deleting monitor:", error);
        set.status = 500;
        return { success: false, message: "Failed to delete monitor" };
      }
    },
    { params: t.Object({ monitorId: t.String() }) }
  )
  
  .get(
    "/monitors/:monitorId",
    async ({ params: { monitorId }, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const monitorData = await db
          .select({ monitor: uptimeMonitors, project: projects })
          .from(uptimeMonitors)
          .innerJoin(projects, eq(uptimeMonitors.projectId, projects.id))
          .where(and(eq(uptimeMonitors.id, monitorId), eq(projects.userId, session.user.id)))
          .limit(1);

        if (monitorData.length === 0) {
          set.status = 404;
          return { success: false, message: "Monitor not found" };
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
              gte(uptimeDaily.date, thirtyDaysAgo.toISOString().split("T")[0])
            )
          )
          .orderBy(asc(uptimeDaily.date));

        const totalChecks = dailyStats.reduce((sum, d) => sum + d.totalChecks, 0);
        const successfulChecks = dailyStats.reduce((sum, d) => sum + d.successfulChecks, 0);
        const overallUptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

        const responseTimes = dailyStats.filter((d) => d.avgResponseTime !== null).map((d) => d.avgResponseTime!);
        const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : null;

        return {
          success: true,
          data: {
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
              ongoingIncidents: recentIncidents.filter((i) => i.status === "ongoing").length,
            },
          },
        };
      } catch (error) {
        console.error("Error fetching monitor details:", error);
        set.status = 500;
        return { success: false, message: "Failed to fetch monitor details" };
      }
    },
    { params: t.Object({ monitorId: t.String() }) }
  )
  
  .post(
    "/monitors/:monitorId/check",
    async ({ params: { monitorId }, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const monitorData = await db
          .select({ monitor: uptimeMonitors, project: projects })
          .from(uptimeMonitors)
          .innerJoin(projects, eq(uptimeMonitors.projectId, projects.id))
          .where(and(eq(uptimeMonitors.id, monitorId), eq(projects.userId, session.user.id)))
          .limit(1);

        if (monitorData.length === 0) {
          set.status = 404;
          return { success: false, message: "Monitor not found" };
        }

        const monitor = monitorData[0].monitor;

        const startTime = Date.now();
        let status = "up";
        let statusCode: number | null = null;
        let errorMessage: string | null = null;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), monitor.timeout * 1000);

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
        } catch (err: any) {
          status = "down";
          if (err.name === "AbortError") {
            errorMessage = "Request timed out";
          } else {
            errorMessage = err.message || "Connection failed";
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
            await db.insert(uptimeIncidents).values({ monitorId, status: "ongoing", cause: errorMessage || "Unknown" });
          } else if (previousStatus === "down") {
            const ongoingIncident = await db
              .select()
              .from(uptimeIncidents)
              .where(and(eq(uptimeIncidents.monitorId, monitorId), eq(uptimeIncidents.status, "ongoing")))
              .limit(1);

            if (ongoingIncident.length > 0) {
              const duration = Math.floor((Date.now() - new Date(ongoingIncident[0].startedAt).getTime()) / 1000);
              await db
                .update(uptimeIncidents)
                .set({ status: "resolved", resolvedAt: new Date(), durationSeconds: duration })
                .where(eq(uptimeIncidents.id, ongoingIncident[0].id));
            }
          }
        }

        return { success: true, data: { ...check, statusChanged, previousStatus } };
      } catch (error) {
        console.error("Error performing check:", error);
        set.status = 500;
        return { success: false, message: "Failed to perform check" };
      }
    },
    { params: t.Object({ monitorId: t.String() }) }
  )
  
  .get("/summary", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    try {
      const userProjects = await db
        .select({ id: projects.id, title: projects.title })
        .from(projects)
        .where(eq(projects.userId, session.user.id));

      const projectIds = userProjects.map((p) => p.id);

      if (projectIds.length === 0) {
        return {
          success: true,
          data: {
            totalMonitors: 0,
            monitorsUp: 0,
            monitorsDown: 0,
            monitorsDegraded: 0,
            monitorsUnknown: 0,
            ongoingIncidents: 0,
            avgUptime: 100,
            projectSummaries: [],
          },
        };
      }

      const monitors = await db
        .select()
        .from(uptimeMonitors)
        .where(sql`${uptimeMonitors.projectId} IN ${projectIds}`);

      const ongoingIncidents = await db
        .select({ count: sql<number>`count(*)` })
        .from(uptimeIncidents)
        .innerJoin(uptimeMonitors, eq(uptimeIncidents.monitorId, uptimeMonitors.id))
        .where(and(sql`${uptimeMonitors.projectId} IN ${projectIds}`, eq(uptimeIncidents.status, "ongoing")));

      const statusCounts = monitors.reduce(
        (acc, m) => {
          if (m.currentStatus === "up") acc.up++;
          else if (m.currentStatus === "down") acc.down++;
          else if (m.currentStatus === "degraded") acc.degraded++;
          else acc.unknown++;
          return acc;
        },
        { up: 0, down: 0, degraded: 0, unknown: 0 }
      );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monitorIds = monitors.map((m) => m.id);

      let avgUptime = 100;
      if (monitorIds.length > 0) {
        const dailyStats = await db
          .select()
          .from(uptimeDaily)
          .where(and(sql`${uptimeDaily.monitorId} IN ${monitorIds}`, gte(uptimeDaily.date, thirtyDaysAgo.toISOString().split("T")[0])));

        if (dailyStats.length > 0) {
          const totalChecks = dailyStats.reduce((sum, d) => sum + d.totalChecks, 0);
          const successfulChecks = dailyStats.reduce((sum, d) => sum + d.successfulChecks, 0);
          avgUptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;
        }
      }

      const projectSummaries = userProjects.map((project) => {
        const projectMonitors = monitors.filter((m) => m.projectId === project.id);
        return {
          projectId: project.id,
          projectTitle: project.title,
          totalMonitors: projectMonitors.length,
          monitorsUp: projectMonitors.filter((m) => m.currentStatus === "up").length,
          monitorsDown: projectMonitors.filter((m) => m.currentStatus === "down").length,
          monitorsDegraded: projectMonitors.filter((m) => m.currentStatus === "degraded").length,
        };
      });

      return {
        success: true,
        data: {
          totalMonitors: monitors.length,
          monitorsUp: statusCounts.up,
          monitorsDown: statusCounts.down,
          monitorsDegraded: statusCounts.degraded,
          monitorsUnknown: statusCounts.unknown,
          ongoingIncidents: Number(ongoingIncidents[0]?.count || 0),
          avgUptime: Math.round(avgUptime * 100) / 100,
          projectSummaries,
        },
      };
    } catch (error) {
      console.error("Error fetching uptime summary:", error);
      set.status = 500;
      return { success: false, message: "Failed to fetch uptime summary" };
    }
  });
