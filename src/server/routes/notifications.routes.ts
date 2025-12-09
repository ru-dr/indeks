import { Elysia, t } from "elysia";
import { auth } from "@/lib/auth";
import { db } from "@/db/connect";
import {
  notifications,
  notificationPreferences,
  invitation,
  organization,
  user,
  projects,
} from "@/db/schema/schema";
import { eq, and, or, desc, isNull, gt, sql } from "drizzle-orm";

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

      const { category, unreadOnly, limit = 50 } = query;

      try {
        const conditions = [
          eq(notifications.userId, session.user.id),
          eq(notifications.isDismissed, false),
          or(
            isNull(notifications.expiresAt),
            gt(notifications.expiresAt, new Date())
          ),
        ];

        if (category) {
          conditions.push(eq(notifications.category, category));
        }

        if (unreadOnly === "true") {
          conditions.push(eq(notifications.isRead, false));
        }

        const userNotifications = await db
          .select({
            id: notifications.id,
            type: notifications.type,
            category: notifications.category,
            title: notifications.title,
            message: notifications.message,
            projectId: notifications.projectId,
            organizationId: notifications.organizationId,
            invitationId: notifications.invitationId,
            actionData: notifications.actionData,
            actionUrl: notifications.actionUrl,
            isRead: notifications.isRead,
            priority: notifications.priority,
            createdAt: notifications.createdAt,
            expiresAt: notifications.expiresAt,
          })
          .from(notifications)
          .where(and(...conditions))
          .orderBy(desc(notifications.createdAt))
          .limit(Number(limit));

        return { success: true, data: userNotifications };
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

    const userEmail = session.user.email;

    try {
      
      const regularNotifications = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          category: notifications.category,
          title: notifications.title,
          message: notifications.message,
          projectId: notifications.projectId,
          organizationId: notifications.organizationId,
          invitationId: notifications.invitationId,
          actionData: notifications.actionData,
          actionUrl: notifications.actionUrl,
          isRead: notifications.isRead,
          priority: notifications.priority,
          createdAt: notifications.createdAt,
          expiresAt: notifications.expiresAt,
        })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isDismissed, false),
            or(
              isNull(notifications.expiresAt),
              gt(notifications.expiresAt, new Date())
            )
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(50);

      
      const pendingInvitations = userEmail
        ? await db
            .select({
              id: invitation.id,
              email: invitation.email,
              role: invitation.role,
              status: invitation.status,
              expiresAt: invitation.expiresAt,
              organizationId: invitation.organizationId,
              inviterId: invitation.inviterId,
              createdAt: invitation.createdAt,
              organizationName: organization.name,
              organizationSlug: organization.slug,
              inviterEmail: user.email,
              inviterName: user.name,
            })
            .from(invitation)
            .leftJoin(organization, eq(invitation.organizationId, organization.id))
            .leftJoin(user, eq(invitation.inviterId, user.id))
            .where(
              and(
                eq(invitation.email, userEmail),
                eq(invitation.status, "pending"),
                gt(invitation.expiresAt, new Date())
              )
            )
            .orderBy(desc(invitation.createdAt))
        : [];

      
      const invitationNotifications = pendingInvitations.map((inv) => ({
        id: `inv_${inv.id}`,
        type: "team_invitation" as const,
        category: "invitations" as const,
        title: `Invitation to ${inv.organizationName}`,
        message: `${inv.inviterName || inv.inviterEmail} invited you to join as ${inv.role}`,
        projectId: null,
        organizationId: inv.organizationId,
        invitationId: inv.id,
        actionData: JSON.stringify({
          invitationId: inv.id,
          organizationName: inv.organizationName,
          organizationSlug: inv.organizationSlug,
          role: inv.role,
          inviterEmail: inv.inviterEmail,
          inviterName: inv.inviterName,
          expiresAt: inv.expiresAt,
        }),
        actionUrl: `/invite/${inv.id}`,
        isRead: false,
        priority: "high",
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
      }));

      
      const allNotifications = [...invitationNotifications, ...regularNotifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

    const userEmail = session.user.email;

    try {
      
      const [notificationCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isRead, false),
            eq(notifications.isDismissed, false),
            or(
              isNull(notifications.expiresAt),
              gt(notifications.expiresAt, new Date())
            )
          )
        );

      
      const [invitationCount] = userEmail
        ? await db
            .select({ count: sql<number>`count(*)::int` })
            .from(invitation)
            .where(
              and(
                eq(invitation.email, userEmail),
                eq(invitation.status, "pending"),
                gt(invitation.expiresAt, new Date())
              )
            )
        : [{ count: 0 }];

      const total = (notificationCount?.count || 0) + (invitationCount?.count || 0);

      return {
        success: true,
        data: {
          total,
          notifications: notificationCount?.count || 0,
          invitations: invitationCount?.count || 0,
        },
      };
    } catch (error) {
      console.error("Error counting notifications:", error);
      set.status = 500;
      return { success: false, error: "Failed to count notifications", data: null };
    }
  })

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
        await db
          .update(notifications)
          .set({ isRead: true, readAt: new Date() })
          .where(
            and(
              eq(notifications.id, params.id),
              eq(notifications.userId, session.user.id)
            )
          );

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
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isRead, false)
          )
        );

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
        await db
          .update(notifications)
          .set({ isDismissed: true })
          .where(
            and(
              eq(notifications.id, params.id),
              eq(notifications.userId, session.user.id)
            )
          );

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
      const [prefs] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, session.user.id));

      
      if (!prefs) {
        return {
          success: true,
          data: {
            emailAccountUpdates: true,
            emailSecurityAlerts: true,
            emailWeeklyReports: false,
            emailProductUpdates: true,
            emailUsageAlerts: true,
            emailOrgActivity: false,
            inAppTeamInvitations: true,
            inAppUptimeAlerts: true,
            inAppErrorAlerts: true,
            inAppUsageAlerts: true,
            inAppSecurityAlerts: true,
            inAppOrgActivity: true,
            inAppProductUpdates: true,
            inAppWeeklyReports: false,
          },
        };
      }

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
        
        const [existing] = await db
          .select({ id: notificationPreferences.id })
          .from(notificationPreferences)
          .where(eq(notificationPreferences.userId, session.user.id));

        if (existing) {
          await db
            .update(notificationPreferences)
            .set(body)
            .where(eq(notificationPreferences.userId, session.user.id));
        } else {
          await db.insert(notificationPreferences).values({
            userId: session.user.id,
            ...body,
          });
        }

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
        emailSecurityAlerts: t.Optional(t.Boolean()),
        emailWeeklyReports: t.Optional(t.Boolean()),
        emailProductUpdates: t.Optional(t.Boolean()),
        emailUsageAlerts: t.Optional(t.Boolean()),
        emailOrgActivity: t.Optional(t.Boolean()),
        inAppTeamInvitations: t.Optional(t.Boolean()),
        inAppUptimeAlerts: t.Optional(t.Boolean()),
        inAppErrorAlerts: t.Optional(t.Boolean()),
        inAppUsageAlerts: t.Optional(t.Boolean()),
        inAppSecurityAlerts: t.Optional(t.Boolean()),
        inAppOrgActivity: t.Optional(t.Boolean()),
        inAppProductUpdates: t.Optional(t.Boolean()),
        inAppWeeklyReports: t.Optional(t.Boolean()),
      }),
    }
  )

  /**
   * Create a notification (internal use / testing)
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
        const [newNotification] = await db
          .insert(notifications)
          .values({
            userId: body.userId,
            type: body.type,
            category: body.category,
            title: body.title,
            message: body.message,
            projectId: body.projectId,
            organizationId: body.organizationId,
            actionData: body.actionData,
            actionUrl: body.actionUrl,
            priority: body.priority || "normal",
          })
          .returning();

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
  );
