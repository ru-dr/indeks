import { Elysia, t } from "elysia";
import { analyticsController } from "@/server/controllers/analytics.controller";

export const analyticsRoutes = new Elysia({ prefix: "/v1/analytics" })

  .get(
    "/:projectId/overview",
    async ({ params, query, set }) => {
      const { projectId } = params;
      const { startDate, endDate } = query;

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
    async ({ params, query, set }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

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
    async ({ params, query, set }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

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
    async ({ params, query, set }) => {
      const { projectId } = params;
      const { startDate, endDate } = query;

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
    async ({ params, query, set }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

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
    async ({ params, query, set }) => {
      const { projectId } = params;
      const { startDate, endDate, limit } = query;

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
    async ({ params, body, set }) => {
      const { projectId } = params;
      const { date } = body;

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
    async ({ params, set }) => {
      const { projectId } = params;

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
    async ({ params, set }) => {
      const { projectId } = params;

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
    async ({ params, query, set }) => {
      const { projectId } = params;
      const { months } = query;

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

  .get(
    "/global/traffic-trend",
    async ({ query, set }) => {
      const { months } = query;

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

  .get("/global/locations", async ({ set }) => {
    try {
      return await analyticsController.getGlobalLocations();
    } catch (error) {
      console.error("Error fetching global visitor locations:", error);
      set.status = 500;
      return { error: "Failed to fetch global visitor locations" };
    }
  });
