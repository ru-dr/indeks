import { db } from "@/db/connect";
import {
  notifications,
  notificationPreferences,
  invitation,
  organization,
  user,
} from "@/db/schema/schema";
import { eq, and, or, desc, isNull, gt, sql } from "drizzle-orm";
import { notificationService } from "@/services/notification.service";

// Default preferences
const defaultPreferences = {
  emailAccountUpdates: true,
  inAppAccountUpdates: true,
  emailUptimeAlerts: true,
  inAppUptimeAlerts: true,
  emailOrgUpdates: true,
  inAppOrgUpdates: true,
  emailTeamInvitations: true,
  inAppTeamInvitations: true,
};

class NotificationsController {
  /**
   * Get all notifications for a user
   */
  async getNotifications(
    userId: string,
    options: {
      category?: string;
      unreadOnly?: string;
      limit?: number;
    }
  ) {
    const { category, unreadOnly, limit = 50 } = options;

    const conditions = [
      eq(notifications.userId, userId),
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

    return userNotifications;
  }

  /**
   * Get all notifications including pending invitations
   */
  async getAllNotifications(userId: string, userEmail: string | null) {
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
          eq(notifications.userId, userId),
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

    return allNotifications;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string, userEmail: string | null) {
    const [notificationCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
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
      total,
      notifications: notificationCount?.count || 0,
      invitations: invitationCount?.count || 0,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );

    return { success: true };
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    return { success: true };
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: string, userId: string) {
    await db
      .update(notifications)
      .set({ isDismissed: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );

    return { success: true };
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string) {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    return prefs || defaultPreferences;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<typeof defaultPreferences>
  ) {
    const [existing] = await db
      .select({ id: notificationPreferences.id })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    if (existing) {
      await db
        .update(notificationPreferences)
        .set(updates)
        .where(eq(notificationPreferences.userId, userId));
    } else {
      await db.insert(notificationPreferences).values({
        userId,
        ...updates,
      });
    }

    return { success: true };
  }

  /**
   * Create a notification (admin only)
   */
  async createNotification(data: {
    userId: string;
    type: string;
    category: string;
    title: string;
    message: string;
    projectId?: string;
    organizationId?: string;
    actionData?: string;
    actionUrl?: string;
    priority?: string;
  }) {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        type: data.type,
        category: data.category,
        title: data.title,
        message: data.message,
        projectId: data.projectId,
        organizationId: data.organizationId,
        actionData: data.actionData,
        actionUrl: data.actionUrl,
        priority: data.priority || "normal",
      })
      .returning();

    return newNotification;
  }

  /**
   * Send test notification
   */
  async sendTestNotification(
    userId: string,
    testData: {
      type: string;
      status?: string;
      monitorName?: string;
      monitorUrl?: string;
      errorMessage?: string;
      projectId?: string;
      accountType?: string;
      details?: string;
      organizationId?: string;
      orgType?: string;
      memberName?: string;
      orgName?: string;
      newRole?: string;
    }
  ) {
    // For test notifications, we create them directly without foreign key constraints
    // This allows testing the notification system without requiring real projects/orgs
    
    switch (testData.type) {
      case "uptime": {
        const status = (testData.status as "down" | "up" | "degraded") || "down";
        const monitorName = testData.monitorName || "Test Monitor";
        const monitorUrl = testData.monitorUrl || "https://example.com";
        
        const titleMap = {
          down: `🔴 ${monitorName} is DOWN`,
          up: `🟢 ${monitorName} is back UP`,
          degraded: `🟡 ${monitorName} is DEGRADED`,
        };

        const messageMap = {
          down: `Your monitor "${monitorName}" (${monitorUrl}) is currently down.${testData.errorMessage ? ` Error: ${testData.errorMessage}` : ""}`,
          up: `Your monitor "${monitorName}" (${monitorUrl}) has recovered and is now operational.`,
          degraded: `Your monitor "${monitorName}" (${monitorUrl}) is experiencing degraded performance.`,
        };

        const typeMap = {
          down: "uptime_down",
          up: "uptime_up",
          degraded: "uptime_degraded",
        };

        // Create test notification without projectId to avoid FK constraint
        await db.insert(notifications).values({
          userId,
          type: typeMap[status],
          category: "uptime",
          title: titleMap[status],
          message: messageMap[status],
          actionUrl: "/uptime",
          actionData: JSON.stringify({
            monitorId: "test-monitor-id",
            monitorName,
            monitorUrl,
            status,
            isTest: true,
          }),
          priority: status === "down" ? "urgent" : status === "degraded" ? "high" : "normal",
        });
        break;
      }

      case "account": {
        const accountType = (testData.accountType as "password_changed" | "email_changed" | "profile_updated" | "security_alert") || "password_changed";
        
        const titleMap = {
          password_changed: "🔐 Password Changed",
          email_changed: "📧 Email Address Changed",
          profile_updated: "✨ Profile Updated",
          security_alert: "⚠️ Security Alert",
        };

        const messageMap = {
          password_changed: "Your password was successfully changed. If you didn't make this change, please secure your account immediately.",
          email_changed: "Your email address has been updated. If you didn't make this change, please contact support.",
          profile_updated: "Your profile information has been updated successfully.",
          security_alert: testData.details || "A security-related action was detected on your account.",
        };

        await db.insert(notifications).values({
          userId,
          type: accountType === "security_alert" ? "account_security" : "account_update",
          category: "account",
          title: titleMap[accountType],
          message: messageMap[accountType],
          actionUrl: "/settings",
          actionData: JSON.stringify({ isTest: true }),
          priority: accountType === "security_alert" ? "urgent" : "normal",
        });
        break;
      }

      case "org": {
        const orgType = (testData.orgType as "member_joined" | "member_left" | "role_changed") || "member_joined";
        const memberName = testData.memberName || "Test User";
        const orgName = testData.orgName || "Test Organization";
        const newRole = testData.newRole;

        const typeMap: Record<string, string> = {
          member_joined: "org_member_joined",
          member_left: "org_member_left",
          role_changed: "org_role_changed",
        };

        const titleMap = {
          member_joined: `👋 ${memberName} joined ${orgName}`,
          member_left: `👤 ${memberName} left ${orgName}`,
          role_changed: `🔄 Role updated in ${orgName}`,
        };

        const messageMap = {
          member_joined: `${memberName} has joined your organization "${orgName}".`,
          member_left: `${memberName} has left your organization "${orgName}".`,
          role_changed: `${memberName}'s role in "${orgName}" has been changed to ${newRole}.`,
        };

        // Create test notification without organizationId to avoid FK constraint
        await db.insert(notifications).values({
          userId,
          type: typeMap[orgType],
          category: "organization",
          title: titleMap[orgType],
          message: messageMap[orgType],
          actionUrl: "/settings/organization",
          actionData: JSON.stringify({
            memberName,
            orgName,
            newRole,
            isTest: true,
          }),
          priority: "normal",
        });
        break;
      }

      default:
        return { error: "Invalid notification type. Use: uptime, account, or org", status: 400 };
    }

    return { success: true, message: `Test ${testData.type} notification sent` };
  }

  /**
   * Get test endpoint status (for checking if notifications system is working)
   */
  getTestStatus() {
    return {
      success: true,
      message: "Notifications system is operational",
      timestamp: new Date().toISOString(),
      availableTestTypes: ["uptime", "account", "org"],
      usage: {
        description: "Send a test notification via GET request with query parameters",
        endpoint: "GET /api/v1/notifications/test",
        parameters: {
          type: "Required. One of: uptime, account, org",
          status: "For uptime: down, up, degraded (default: down)",
          monitorName: "For uptime: Monitor name (default: Test Monitor)",
          monitorUrl: "For uptime: Monitor URL (default: https://example.com)",
          errorMessage: "For uptime: Error message",
          projectId: "For uptime: Project ID",
          accountType: "For account: password_changed, email_changed, profile_updated, security_alert",
          details: "For account: Additional details",
          orgType: "For org: member_joined, member_left, role_changed",
          organizationId: "For org: Organization ID",
          memberName: "For org: Member name",
          orgName: "For org: Organization name",
          newRole: "For org: New role (for role_changed)",
        },
        examples: [
          "/api/v1/notifications/test?type=uptime&status=down&monitorName=My%20Website",
          "/api/v1/notifications/test?type=account&accountType=password_changed",
          "/api/v1/notifications/test?type=org&orgType=member_joined&memberName=John&orgName=Acme",
        ],
      },
    };
  }

  /**
   * Send test notification via query parameters (GET request)
   */
  async sendTestNotificationViaQuery(
    userId: string,
    query: {
      type?: string;
      status?: string;
      monitorName?: string;
      monitorUrl?: string;
      errorMessage?: string;
      projectId?: string;
      accountType?: string;
      details?: string;
      organizationId?: string;
      orgType?: string;
      memberName?: string;
      orgName?: string;
      newRole?: string;
    }
  ) {
    if (!query.type) {
      return {
        error: "Missing 'type' parameter. Use: uptime, account, or org",
        status: 400,
      };
    }

    const testData = {
      type: query.type,
      status: query.status,
      monitorName: query.monitorName,
      monitorUrl: query.monitorUrl,
      errorMessage: query.errorMessage,
      projectId: query.projectId,
      accountType: query.accountType,
      details: query.details,
      organizationId: query.organizationId,
      orgType: query.orgType,
      memberName: query.memberName,
      orgName: query.orgName,
      newRole: query.newRole,
    };

    return this.sendTestNotification(userId, testData);
  }
}

export const notificationsController = new NotificationsController();
