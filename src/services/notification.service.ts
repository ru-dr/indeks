import { db } from "@/db/connect";
import {
  notifications,
  notificationPreferences,
  user,
  projects,
  member,
} from "@/db/schema/schema";
import { eq, and, or } from "drizzle-orm";
import { emailService } from "@/lib/email";
import { render } from "@react-email/render";
import UptimeAlertEmail from "@/components/email/UptimeAlertEmail";
import AccountNotificationEmail from "@/components/email/AccountNotificationEmail";
import OrgNotificationEmail from "@/components/email/OrgNotificationEmail";

export type NotificationType =
  | "account_update"
  | "account_security"
  | "uptime_down"
  | "uptime_up"
  | "uptime_degraded"
  | "org_member_joined"
  | "org_member_left"
  | "org_role_changed"
  | "team_invitation";

export type NotificationCategory =
  | "account"
  | "uptime"
  | "organization"
  | "invitations";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  projectId?: string;
  organizationId?: string;
  invitationId?: string;
  actionData?: Record<string, unknown>;
  actionUrl?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  expiresAt?: Date;
}

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

const preferenceMapping: Record<
  NotificationType,
  {
    email: keyof typeof defaultPreferences;
    inApp: keyof typeof defaultPreferences;
  }
> = {
  account_update: {
    email: "emailAccountUpdates",
    inApp: "inAppAccountUpdates",
  },
  account_security: {
    email: "emailAccountUpdates",
    inApp: "inAppAccountUpdates",
  },
  uptime_down: { email: "emailUptimeAlerts", inApp: "inAppUptimeAlerts" },
  uptime_up: { email: "emailUptimeAlerts", inApp: "inAppUptimeAlerts" },
  uptime_degraded: { email: "emailUptimeAlerts", inApp: "inAppUptimeAlerts" },
  org_member_joined: { email: "emailOrgUpdates", inApp: "inAppOrgUpdates" },
  org_member_left: { email: "emailOrgUpdates", inApp: "inAppOrgUpdates" },
  org_role_changed: { email: "emailOrgUpdates", inApp: "inAppOrgUpdates" },
  team_invitation: {
    email: "emailTeamInvitations",
    inApp: "inAppTeamInvitations",
  },
};

class NotificationService {
  private baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

  /**
   * Get user's notification preferences
   */
  async getPreferences(userId: string) {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    return prefs || defaultPreferences;
  }

  /**
   * Check if user should receive notification via specific channel
   */
  async shouldNotify(
    userId: string,
    type: NotificationType,
    channel: "email" | "inApp",
  ): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    const mapping = preferenceMapping[type];

    if (!mapping) return true;

    const key = channel === "email" ? mapping.email : mapping.inApp;
    return (prefs as unknown as Record<string, boolean>)[key] ?? true;
  }

  /**
   * Create an in-app notification
   */
  async createInAppNotification(
    params: CreateNotificationParams,
  ): Promise<string | null> {
    const shouldNotify = await this.shouldNotify(
      params.userId,
      params.type,
      "inApp",
    );

    if (!shouldNotify) {
      console.log(
        `Skipping in-app notification for user ${params.userId} (disabled)`,
      );
      return null;
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        userId: params.userId,
        type: params.type,
        category: params.category,
        title: params.title,
        message: params.message,
        projectId: params.projectId,
        organizationId: params.organizationId,
        invitationId: params.invitationId,
        actionData: params.actionData
          ? JSON.stringify(params.actionData)
          : null,
        actionUrl: params.actionUrl,
        priority: params.priority || "normal",
        expiresAt: params.expiresAt,
      })
      .returning({ id: notifications.id });

    return notification.id;
  }

  /**
   * Send uptime alert notification
   */
  async sendUptimeAlert(params: {
    monitorId: string;
    status: "down" | "up" | "degraded";
    monitorName: string;
    monitorUrl: string;
    errorMessage?: string;
    projectId: string;
  }): Promise<void> {
    const [project] = await db
      .select({ userId: projects.userId, title: projects.title })
      .from(projects)
      .where(eq(projects.id, params.projectId));

    if (!project) return;

    const [userData] = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, project.userId));

    if (!userData) return;

    const type: NotificationType =
      params.status === "down"
        ? "uptime_down"
        : params.status === "up"
          ? "uptime_up"
          : "uptime_degraded";

    const titleMap = {
      down: `🔴 ${params.monitorName} is DOWN`,
      up: `🟢 ${params.monitorName} is back UP`,
      degraded: `🟡 ${params.monitorName} is DEGRADED`,
    };

    const messageMap = {
      down: `Your monitor "${params.monitorName}" (${params.monitorUrl}) is currently down.${params.errorMessage ? ` Error: ${params.errorMessage}` : ""}`,
      up: `Your monitor "${params.monitorName}" (${params.monitorUrl}) has recovered and is now operational.`,
      degraded: `Your monitor "${params.monitorName}" (${params.monitorUrl}) is experiencing degraded performance.`,
    };

    await this.createInAppNotification({
      userId: project.userId,
      type,
      category: "uptime",
      title: titleMap[params.status],
      message: messageMap[params.status],
      projectId: params.projectId,
      actionUrl: `/uptime`,
      actionData: {
        monitorId: params.monitorId,
        monitorName: params.monitorName,
        monitorUrl: params.monitorUrl,
        status: params.status,
      },
      priority:
        params.status === "down"
          ? "urgent"
          : params.status === "degraded"
            ? "high"
            : "normal",
    });

    const shouldSendEmail = await this.shouldNotify(
      project.userId,
      type,
      "email",
    );
    if (shouldSendEmail) {
      try {
        const html = await render(
          UptimeAlertEmail({
            monitorName: params.monitorName,
            monitorUrl: params.monitorUrl,
            status: params.status,
            errorMessage: params.errorMessage,
            dashboardLink: `${this.baseUrl}/uptime`,
          }),
        );

        emailService.sendEmail({
          to: userData.email,
          subject: titleMap[params.status],
          html,
        });
      } catch (error) {
        console.error("Failed to send uptime alert email:", error);
      }
    }
  }

  /**
   * Send account update notification
   */
  async sendAccountNotification(params: {
    userId: string;
    type:
      | "password_changed"
      | "email_changed"
      | "profile_updated"
      | "security_alert";
    details?: string;
  }): Promise<void> {
    const [userData] = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, params.userId));

    if (!userData) return;

    const titleMap = {
      password_changed: "🔐 Password Changed",
      email_changed: "📧 Email Address Changed",
      profile_updated: "✨ Profile Updated",
      security_alert: "⚠️ Security Alert",
    };

    const messageMap = {
      password_changed:
        "Your password was successfully changed. If you didn't make this change, please secure your account immediately.",
      email_changed:
        "Your email address has been updated. If you didn't make this change, please contact support.",
      profile_updated:
        "Your profile information has been updated successfully.",
      security_alert:
        params.details ||
        "A security-related action was detected on your account.",
    };

    const notificationType: NotificationType =
      params.type === "security_alert" ? "account_security" : "account_update";

    await this.createInAppNotification({
      userId: params.userId,
      type: notificationType,
      category: "account",
      title: titleMap[params.type],
      message: messageMap[params.type],
      actionUrl: "/settings",
      priority: params.type === "security_alert" ? "urgent" : "normal",
    });

    const shouldSendEmail = await this.shouldNotify(
      params.userId,
      notificationType,
      "email",
    );
    if (shouldSendEmail) {
      try {
        const html = await render(
          AccountNotificationEmail({
            userName: userData.name,
            type: params.type,
            details: params.details,
            settingsLink: `${this.baseUrl}/settings`,
          }),
        );

        emailService.sendEmail({
          to: userData.email,
          subject: titleMap[params.type],
          html,
        });
      } catch (error) {
        console.error("Failed to send account notification email:", error);
      }
    }
  }

  /**
   * Send organization notification to a specific user
   */
  async sendOrgNotification(params: {
    userId: string;
    organizationId: string;
    type: "member_joined" | "member_left" | "role_changed";
    memberName: string;
    orgName: string;
    newRole?: string;
  }): Promise<void> {
    const [userData] = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, params.userId));

    if (!userData) return;

    const typeMap: Record<string, NotificationType> = {
      member_joined: "org_member_joined",
      member_left: "org_member_left",
      role_changed: "org_role_changed",
    };

    const titleMap = {
      member_joined: `👋 ${params.memberName} joined ${params.orgName}`,
      member_left: `👤 ${params.memberName} left ${params.orgName}`,
      role_changed: `🔄 Role updated in ${params.orgName}`,
    };

    const messageMap = {
      member_joined: `${params.memberName} has joined your organization "${params.orgName}".`,
      member_left: `${params.memberName} has left your organization "${params.orgName}".`,
      role_changed: `${params.memberName}'s role in "${params.orgName}" has been changed to ${params.newRole}.`,
    };

    const notificationType = typeMap[params.type];

    await this.createInAppNotification({
      userId: params.userId,
      type: notificationType,
      category: "organization",
      title: titleMap[params.type],
      message: messageMap[params.type],
      organizationId: params.organizationId,
      actionUrl: `/settings/organization`,
      actionData: {
        memberName: params.memberName,
        orgName: params.orgName,
        newRole: params.newRole,
      },
    });

    const shouldSendEmail = await this.shouldNotify(
      params.userId,
      notificationType,
      "email",
    );
    if (shouldSendEmail) {
      try {
        const html = await render(
          OrgNotificationEmail({
            userName: userData.name,
            type: params.type,
            memberName: params.memberName,
            orgName: params.orgName,
            newRole: params.newRole,
            settingsLink: `${this.baseUrl}/settings/organization`,
          }),
        );

        emailService.sendEmail({
          to: userData.email,
          subject: titleMap[params.type],
          html,
        });
      } catch (error) {
        console.error("Failed to send org notification email:", error);
      }
    }
  }

  /**
   * Notify all org admins/owners about an event
   */
  async notifyOrgAdmins(params: {
    organizationId: string;
    type: "member_joined" | "member_left" | "role_changed";
    memberName: string;
    orgName: string;
    newRole?: string;
    excludeUserId?: string;
  }): Promise<void> {
    const admins = await db
      .select({ userId: member.userId })
      .from(member)
      .where(
        and(
          eq(member.organizationId, params.organizationId),
          or(eq(member.role, "owner"), eq(member.role, "admin")),
        ),
      );

    for (const admin of admins) {
      if (params.excludeUserId && admin.userId === params.excludeUserId)
        continue;

      await this.sendOrgNotification({
        userId: admin.userId,
        organizationId: params.organizationId,
        type: params.type,
        memberName: params.memberName,
        orgName: params.orgName,
        newRole: params.newRole,
      });
    }
  }

  /**
   * Create a team invitation notification (in-app only, email handled by better-auth)
   */
  async sendTeamInvitationNotification(params: {
    userId: string;
    inviterName: string;
    orgName: string;
    organizationId: string;
    invitationId: string;
    role: string;
  }): Promise<void> {
    await this.createInAppNotification({
      userId: params.userId,
      type: "team_invitation",
      category: "invitations",
      title: `Invitation to ${params.orgName}`,
      message: `${params.inviterName} invited you to join "${params.orgName}" as ${params.role}.`,
      organizationId: params.organizationId,
      invitationId: params.invitationId,
      actionUrl: `/invite/${params.invitationId}`,
      actionData: {
        inviterName: params.inviterName,
        orgName: params.orgName,
        role: params.role,
      },
      priority: "high",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }
}

export const notificationService = new NotificationService();
