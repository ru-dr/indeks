import { Elysia, t } from "elysia";
import { analyticsController } from "@/server/controllers/analytics.controller";
import {
  getAuthFromRequest,
  verifyProjectAccess,
  isUserAdmin,
} from "@/server/middleware/auth.middleware";

export const analyticsRoutes = new Elysia({ prefix: "/v1/analytics" })

  .get(
    "/:projectId/overview",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate } = query;

      // Auth check
      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      // Authorization check
      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        const result = await analyticsController.getOverview(projectId, {
          startDate,
          endDate,
        });

        if ("error" in result && "status" in result) {
          set.status = result.status;
          return { error: result.error };
        }

        return result;
      } catch (error) {
        console.error("Error fetching analytics overview:", error);
        set.status = 500;
        return { error: "Failed to fetch analytics" };
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/pages",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getTopPages(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching top pages:", error);
        set.status = 500;
        return { error: "Failed to fetch top pages" };
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/referrers",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getReferrers(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching referrers:", error);
        set.status = 500;
        return { error: "Failed to fetch referrers" };
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/devices",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getDevices(projectId, {
          startDate,
          endDate,
        });
      } catch (error) {
        console.error("Error fetching devices:", error);
        set.status = 500;
        return { error: "Failed to fetch device data" };
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/events",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getEvents(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching events:", error);
        set.status = 500;
        return { error: "Failed to fetch events" };
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/clicks",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getClickedElements(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching clicked elements:", error);
        set.status = 500;
        return { error: "Failed to fetch clicked elements" };
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .post(
    "/:projectId/sync",
    async ({ params, body, set, request }) => {
      const { projectId } = params;
      const { date } = body;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        const result = await analyticsController.triggerSync(projectId, date);

        if ("error" in result && "status" in result) {
          set.status = result.status;
          return { error: result.error };
        }

        return result;
      } catch (error) {
        console.error("Error triggering sync:", error);
        set.status = 500;
        return { error: "Failed to trigger sync" };
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
      body: t.Object({
        date: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/realtime",
    async ({ params, set, request }) => {
      const { projectId } = params;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getRealtimeStats(projectId);
      } catch (error) {
        console.error("Error fetching realtime data:", error);
        set.status = 500;
        return { error: "Failed to fetch realtime data" };
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
    },
  )

  .get(
    "/:projectId/locations",
    async ({ params, set, request }) => {
      const { projectId } = params;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getLocations(projectId);
      } catch (error) {
        console.error("Error fetching visitor locations:", error);
        set.status = 500;
        return { error: "Failed to fetch visitor locations" };
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
    },
  )

  .get(
    "/:projectId/traffic-trend",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { months } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getTrafficTrend(projectId, months);
      } catch (error) {
        console.error("Error fetching traffic trend:", error);
        set.status = 500;
        return { error: "Failed to fetch traffic trend" };
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
      query: t.Object({
        months: t.Optional(t.String()),
      }),
    },
  )

  // Global endpoints - Admin only
  .get(
    "/global/traffic-trend",
    async ({ query, set, request }) => {
      const { months } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      // Global endpoints require admin access
      const admin = await isUserAdmin(request);
      if (!admin) {
        set.status = 403;
        return { error: "Forbidden", message: "Admin access required" };
      }

      try {
        return await analyticsController.getGlobalTrafficTrend(months);
      } catch (error) {
        console.error("Error fetching global traffic trend:", error);
        set.status = 500;
        return { error: "Failed to fetch global traffic trend" };
      }
    },
    {
      query: t.Object({
        months: t.Optional(t.String()),
      }),
    },
  )

  .get("/global/locations", async ({ set, request }) => {
    const authContext = await getAuthFromRequest(request);
    if (!authContext) {
      set.status = 401;
      return { error: "Unauthorized", message: "You must be logged in" };
    }

    // Global endpoints require admin access
    const admin = await isUserAdmin(request);
    if (!admin) {
      set.status = 403;
      return { error: "Forbidden", message: "Admin access required" };
    }

    try {
      return await analyticsController.getGlobalLocations();
    } catch (error) {
      console.error("Error fetching global visitor locations:", error);
      set.status = 500;
      return { error: "Failed to fetch global visitor locations" };
    }
  })

  .get(
    "/:projectId/traffic-sources",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getTrafficSources(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching traffic sources:", error);
        set.status = 500;
        return { error: "Failed to fetch traffic sources" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/forms",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getFormAnalytics(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching form analytics:", error);
        set.status = 500;
        return { error: "Failed to fetch form analytics" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/engagement",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getEngagementIssues(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching engagement issues:", error);
        set.status = 500;
        return { error: "Failed to fetch engagement issues" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/performance",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getPerformanceMetrics(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching performance metrics:", error);
        set.status = 500;
        return { error: "Failed to fetch performance metrics" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/scroll-depth",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getScrollDepthAnalytics(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching scroll depth:", error);
        set.status = 500;
        return { error: "Failed to fetch scroll depth data" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/errors",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getErrorAnalytics(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching error analytics:", error);
        set.status = 500;
        return { error: "Failed to fetch error analytics" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/media",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getMediaAnalytics(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching media analytics:", error);
        set.status = 500;
        return { error: "Failed to fetch media analytics" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/outbound",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getOutboundAnalytics(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching outbound analytics:", error);
        set.status = 500;
        return { error: "Failed to fetch outbound analytics" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/search",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getSearchAnalytics(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching search analytics:", error);
        set.status = 500;
        return { error: "Failed to fetch search analytics" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/custom-events",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getCustomEvents(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching custom events:", error);
        set.status = 500;
        return { error: "Failed to fetch custom events" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/sessions",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getSessionAnalytics(projectId, {
          startDate,
          endDate,
          limit,
        });
      } catch (error) {
        console.error("Error fetching session analytics:", error);
        set.status = 500;
        return { error: "Failed to fetch session analytics" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectId/visitors",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { startDate, endDate } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getVisitorAnalytics(projectId, {
          startDate,
          endDate,
        });
      } catch (error) {
        console.error("Error fetching visitor analytics:", error);
        set.status = 500;
        return { error: "Failed to fetch visitor analytics" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    },
  )

  // Raw events stream for JSON mode
  .get(
    "/:projectId/events-stream",
    async ({ params, query, set, request }) => {
      const { projectId } = params;
      const { limit = "100", offset = "0" } = query;

      const authContext = await getAuthFromRequest(request);
      if (!authContext) {
        set.status = 401;
        return { error: "Unauthorized", message: "You must be logged in" };
      }

      const hasAccess = await verifyProjectAccess(authContext.user.id, projectId);
      if (!hasAccess) {
        set.status = 403;
        return { error: "Forbidden", message: "You don't have access to this project" };
      }

      try {
        return await analyticsController.getRawEventsStream(projectId, {
          limit: parseInt(limit),
          offset: parseInt(offset),
        });
      } catch (error) {
        console.error("Error fetching raw events:", error);
        set.status = 500;
        return { error: "Failed to fetch raw events" };
      }
    },
    {
      params: t.Object({ projectId: t.String() }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    },
  );
