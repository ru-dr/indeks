import { Elysia, t } from "elysia";
import { auth } from "@/lib/auth";
import { notificationsController } from "@/server/controllers/notifications.controller";

export const notificationsRoutes = new Elysia({ prefix: "/v1/notifications" })
  /**
   * Get all notifications for the current user
   */
  .get(
    "/",
    async ({ request, set, query }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return { success: false, error: "Unauthorized", data: null };
      }

      const { category, unreadOnly, limit = "50" } = query;

      try {
        const notifications = await notificationsController.getNotifications(
          session.user.id,
          { category, unreadOnly, limit: Number(limit) }
        );

        return { success: true, data: notifications };
      } catch (error) {
        console.error("Error fetching notifications:", error);
        set.status = 500;
        return { success: false, error: "Failed to fetch notifications", data: null };
      }
    },
    {
      query: t.Object({
        category: t.Optional(t.String()),
        unreadOnly: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Get all notifications including pending invitations (combined view)
   */
  .get("/all", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return { success: false, error: "Unauthorized", data: null };
    }

    try {
      const allNotifications = await notificationsController.getAllNotifications(
        session.user.id,
        session.user.email
      );

      return { success: true, data: allNotifications };
    } catch (error) {
      console.error("Error fetching all notifications:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch notifications", data: null };
    }
  })

  /**
   * Get unread notification count
   */
  .get("/count", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return { success: false, error: "Unauthorized", data: null };
    }

    try {
      const counts = await notificationsController.getUnreadCount(
        session.user.id,
        session.user.email
      );

      return { success: true, data: counts };
    } catch (error) {
      console.error("Error counting notifications:", error);
      set.status = 500;
      return { success: false, error: "Failed to count notifications", data: null };
    }
  })

  /**
   * Test endpoint - GET (check status or send test notification via query params)
   * 
   * Without params: Returns system status and usage info
   * With params: Sends a test notification
   * 
   * Examples:
   *   GET /api/v1/notifications/test
   *   GET /api/v1/notifications/test?type=uptime&status=down&monitorName=My%20Site
   *   GET /api/v1/notifications/test?type=account&accountType=password_changed
   *   GET /api/v1/notifications/test?type=org&orgType=member_joined&memberName=John&orgName=Acme
   */
  .get(
    "/test",
    async ({ request, set, query }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      // If no type param, return status/usage info
      if (!query.type) {
        return notificationsController.getTestStatus();
      }

      // Otherwise, send a test notification
      try {
        const result = await notificationsController.sendTestNotificationViaQuery(
          session.user.id,
          query
        );

        if ("error" in result && "status" in result) {
          set.status = result.status;
          return { success: false, error: result.error };
        }

        return result;
      } catch (error) {
        console.error("Error sending test notification:", error);
        set.status = 500;
        return { success: false, error: "Failed to send test notification" };
      }
    },
    {
      query: t.Object({
        type: t.Optional(t.String()),
        status: t.Optional(t.String()),
        monitorName: t.Optional(t.String()),
        monitorUrl: t.Optional(t.String()),
        errorMessage: t.Optional(t.String()),
        projectId: t.Optional(t.String()),
        accountType: t.Optional(t.String()),
        details: t.Optional(t.String()),
        organizationId: t.Optional(t.String()),
        orgType: t.Optional(t.String()),
        memberName: t.Optional(t.String()),
        orgName: t.Optional(t.String()),
        newRole: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Mark notification as read
   */
  .patch(
    "/:id/read",
    async ({ params, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      try {
        await notificationsController.markAsRead(params.id, session.user.id);
        return { success: true };
      } catch (error) {
        console.error("Error marking notification as read:", error);
        set.status = 500;
        return { success: false, error: "Failed to update notification" };
      }
    },
    { params: t.Object({ id: t.String() }) }
  )

  /**
   * Mark all notifications as read
   */
  .patch("/read-all", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      await notificationsController.markAllAsRead(session.user.id);
      return { success: true };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      set.status = 500;
      return { success: false, error: "Failed to update notifications" };
    }
  })

  /**
   * Dismiss notification
   */
  .patch(
    "/:id/dismiss",
    async ({ params, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      try {
        await notificationsController.dismissNotification(params.id, session.user.id);
        return { success: true };
      } catch (error) {
        console.error("Error dismissing notification:", error);
        set.status = 500;
        return { success: false, error: "Failed to dismiss notification" };
      }
    },
    { params: t.Object({ id: t.String() }) }
  )

  /**
   * Get notification preferences
   */
  .get("/preferences", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return { success: false, error: "Unauthorized", data: null };
    }

    try {
      const prefs = await notificationsController.getPreferences(session.user.id);
      return { success: true, data: prefs };
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      set.status = 500;
      return { success: false, error: "Failed to fetch preferences", data: null };
    }
  })

  /**
   * Update notification preferences
   */
  .patch(
    "/preferences",
    async ({ body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      try {
        await notificationsController.updatePreferences(session.user.id, body);
        return { success: true };
      } catch (error) {
        console.error("Error updating notification preferences:", error);
        set.status = 500;
        return { success: false, error: "Failed to update preferences" };
      }
    },
    {
      body: t.Object({
        emailAccountUpdates: t.Optional(t.Boolean()),
        inAppAccountUpdates: t.Optional(t.Boolean()),
        emailUptimeAlerts: t.Optional(t.Boolean()),
        inAppUptimeAlerts: t.Optional(t.Boolean()),
        emailOrgUpdates: t.Optional(t.Boolean()),
        inAppOrgUpdates: t.Optional(t.Boolean()),
        emailTeamInvitations: t.Optional(t.Boolean()),
        inAppTeamInvitations: t.Optional(t.Boolean()),
      }),
    }
  )

  /**
   * Create a notification (internal use / admin only)
   */
  .post(
    "/",
    async ({ body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      if (session.user.role !== "admin") {
        set.status = 403;
        return { success: false, error: "Forbidden" };
      }

      try {
        const newNotification = await notificationsController.createNotification(body);
        return { success: true, data: newNotification };
      } catch (error) {
        console.error("Error creating notification:", error);
        set.status = 500;
        return { success: false, error: "Failed to create notification" };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        type: t.String(),
        category: t.String(),
        title: t.String(),
        message: t.String(),
        projectId: t.Optional(t.String()),
        organizationId: t.Optional(t.String()),
        actionData: t.Optional(t.String()),
        actionUrl: t.Optional(t.String()),
        priority: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Test notification endpoint - POST (for sending test notifications)
   */
  .post("/test", async ({ request, set, body }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const result = await notificationsController.sendTestNotification(
        session.user.id,
        body
      );

      if ("error" in result && "status" in result) {
        set.status = result.status;
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error("Error sending test notification:", error);
      set.status = 500;
      return { success: false, error: "Failed to send test notification" };
    }
  }, {
    body: t.Object({
      type: t.String(),
      status: t.Optional(t.String()),
      monitorName: t.Optional(t.String()),
      monitorUrl: t.Optional(t.String()),
      errorMessage: t.Optional(t.String()),
      projectId: t.Optional(t.String()),
      accountType: t.Optional(t.String()),
      details: t.Optional(t.String()),
      organizationId: t.Optional(t.String()),
      orgType: t.Optional(t.String()),
      memberName: t.Optional(t.String()),
      orgName: t.Optional(t.String()),
      newRole: t.Optional(t.String()),
    }),
  });
