import { Elysia, t } from "elysia";
import { auth } from "@/lib/auth";
import { uptimeController } from "@/server/controllers/uptime.controller";

export const uptimeRoutes = new Elysia({ prefix: "/v1/uptime" })

  .get("/monitors", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    try {
      const monitors = await uptimeController.getUserMonitors(session.user.id);
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
        const result = await uptimeController.getProjectMonitors(
          projectId,
          session.user.id,
        );

        if ("error" in result && "status" in result) {
          set.status = result.status;
          return { success: false, message: result.error };
        }

        return { success: true, data: result };
      } catch (error) {
        console.error("Error fetching project monitors:", error);
        set.status = 500;
        return { success: false, message: "Failed to fetch monitors" };
      }
    },
    { params: t.Object({ projectId: t.String() }) },
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
        const result = await uptimeController.createMonitor(
          projectId,
          session.user.id,
          body,
        );

        if ("error" in result && "status" in result) {
          set.status = result.status;
          return { success: false, message: result.error };
        }

        return { success: true, data: result };
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
    },
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
        const result = await uptimeController.updateMonitor(
          monitorId,
          session.user.id,
          body,
        );

        if ("error" in result && "status" in result) {
          set.status = result.status;
          return { success: false, message: result.error };
        }

        return { success: true, data: result };
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
    },
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
        const result = await uptimeController.deleteMonitor(
          monitorId,
          session.user.id,
        );

        if ("error" in result && "status" in result) {
          set.status = result.status;
          return { success: false, message: result.error };
        }

        return result;
      } catch (error) {
        console.error("Error deleting monitor:", error);
        set.status = 500;
        return { success: false, message: "Failed to delete monitor" };
      }
    },
    { params: t.Object({ monitorId: t.String() }) },
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
        const result = await uptimeController.getMonitorDetails(
          monitorId,
          session.user.id,
        );

        if ("error" in result && "status" in result) {
          set.status = result.status;
          return { success: false, message: result.error };
        }

        return { success: true, data: result };
      } catch (error) {
        console.error("Error fetching monitor details:", error);
        set.status = 500;
        return { success: false, message: "Failed to fetch monitor details" };
      }
    },
    { params: t.Object({ monitorId: t.String() }) },
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
        const result = await uptimeController.performCheck(
          monitorId,
          session.user.id,
        );

        if ("error" in result && "status" in result) {
          set.status = result.status as number;
          return { success: false, message: result.error };
        }

        return { success: true, data: result };
      } catch (error) {
        console.error("Error performing check:", error);
        set.status = 500;
        return { success: false, message: "Failed to perform check" };
      }
    },
    { params: t.Object({ monitorId: t.String() }) },
  )

  .get("/summary", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    try {
      const summary = await uptimeController.getUserSummary(session.user.id);
      return { success: true, data: summary };
    } catch (error) {
      console.error("Error fetching uptime summary:", error);
      set.status = 500;
      return { success: false, message: "Failed to fetch uptime summary" };
    }
  });
