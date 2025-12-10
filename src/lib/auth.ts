import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username, admin, organization } from "better-auth/plugins";
import { db } from "@/db/connect";
import * as schema from "@/db/schema/schema";
import { emailService } from "@/lib/email";
import { ac, roles } from "@/lib/permissions";
import { nanoid } from "nanoid";
import { eq, and, inArray } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.user,
      account: schema.account,
      session: schema.session,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await emailService.sendResetPasswordEmail({ user, url });
    },
    resetPasswordTokenExpiresIn: 3600,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.sendVerificationEmail({ user, url });
    },
  },
  plugins: [
    username(),
    admin({
      defaultRole: "viewer",
    }),
    organization({
      ac,
      roles: {
        owner: roles.owner,
        member: roles.member,
        viewer: roles.viewer,
      },

      teams: {
        enabled: true,
        maximumTeams: 10,
      },

      creatorRole: "owner",

      allowUserToCreateOrganization: true,

      organizationLimit: 5,

      membershipLimit: 50,

      invitationExpiresIn: 60 * 60 * 24 * 7,

      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.BETTER_AUTH_URL}/invite/${data.id}`;
        await emailService.sendTeamInvitationEmail({
          email: data.email,
          inviterName: data.inviter.user.name,
          inviterEmail: data.inviter.user.email,
          teamName: data.organization.name,
          inviteLink,
          role: data.role,
        });
      },
    }),
  ],
  user: {
    additionalFields: {},
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const slug = `personal-${user.id.slice(0, 8)}`;
          const orgId = nanoid();

          try {
            await db.insert(schema.organization).values({
              id: orgId,
              name: `${user.name || "Personal"}'s Workspace`,
              slug,
              createdAt: new Date(),
            });

            await db.insert(schema.member).values({
              id: nanoid(),
              organizationId: orgId,
              userId: user.id,
              role: "owner",
              createdAt: new Date(),
            });

            console.log(
              `Created default organization "${slug}" for user ${user.id}`,
            );
          } catch (error) {
            console.error(
              `Failed to create default organization for user ${user.id}:`,
              error,
            );
          }
        },
      },
    },
    
    member: {
      create: {
        after: async (member: typeof schema.member.$inferSelect) => {
          // Notify org admins when a new member joins
          try {
            const { notificationService } = await import("@/services/notification.service");
            
            // Get member and org info
            const [memberInfo] = await db
              .select({ name: schema.user.name })
              .from(schema.user)
              .where(eq(schema.user.id, member.userId));
            
            const [orgInfo] = await db
              .select({ name: schema.organization.name })
              .from(schema.organization)
              .where(eq(schema.organization.id, member.organizationId));

            if (memberInfo && orgInfo) {
              await notificationService.notifyOrgAdmins({
                organizationId: member.organizationId,
                type: "member_joined",
                memberName: memberInfo.name || "A new user",
                orgName: orgInfo.name,
                excludeUserId: member.userId, // Don't notify the user who just joined
              });
            }
          } catch (error) {
            console.error("Failed to send member joined notification:", error);
          }
        },
      },
      
      update: {
        after: async (member: typeof schema.member.$inferSelect) => {
          // Notify when role changes
          try {
            const { notificationService } = await import("@/services/notification.service");
            
            const [memberInfo] = await db
              .select({ name: schema.user.name })
              .from(schema.user)
              .where(eq(schema.user.id, member.userId));
            
            const [orgInfo] = await db
              .select({ name: schema.organization.name })
              .from(schema.organization)
              .where(eq(schema.organization.id, member.organizationId));

            if (memberInfo && orgInfo) {
              // Notify the member whose role changed
              await notificationService.sendOrgNotification({
                userId: member.userId,
                organizationId: member.organizationId,
                type: "role_changed",
                memberName: "Your",
                orgName: orgInfo.name,
                newRole: member.role,
              });

              // Notify admins
              await notificationService.notifyOrgAdmins({
                organizationId: member.organizationId,
                type: "role_changed",
                memberName: memberInfo.name || "A member",
                orgName: orgInfo.name,
                newRole: member.role,
                excludeUserId: member.userId,
              });
            }
          } catch (error) {
            console.error("Failed to send role changed notification:", error);
          }
        },
      },
      
      delete: {
        after: async (member: typeof schema.member.$inferSelect) => {
          try {
            // Get member info before they're fully removed
            const [memberInfo] = await db
              .select({ name: schema.user.name })
              .from(schema.user)
              .where(eq(schema.user.id, member.userId));
            
            const [orgInfo] = await db
              .select({ name: schema.organization.name })
              .from(schema.organization)
              .where(eq(schema.organization.id, member.organizationId));

            // Send notification to org admins
            if (memberInfo && orgInfo) {
              const { notificationService } = await import("@/services/notification.service");
              await notificationService.notifyOrgAdmins({
                organizationId: member.organizationId,
                type: "member_left",
                memberName: memberInfo.name || "A member",
                orgName: orgInfo.name,
              });
            }
            
            // Clean up project access
            const orgProjects = await db
              .select({ id: schema.projects.id })
              .from(schema.projects)
              .where(eq(schema.projects.organizationId, member.organizationId));

            if (orgProjects.length > 0) {
              const projectIds = orgProjects.map((p) => p.id);

              await db
                .delete(schema.projectAccess)
                .where(
                  and(
                    eq(schema.projectAccess.userId, member.userId),
                    inArray(schema.projectAccess.projectId, projectIds),
                  ),
                );

              console.log(
                `Revoked project access for user ${member.userId} in org ${member.organizationId}`,
              );
            }

            // Clean up team memberships
            const orgTeams = await db
              .select({ id: schema.team.id })
              .from(schema.team)
              .where(eq(schema.team.organizationId, member.organizationId));

            if (orgTeams.length > 0) {
              const teamIds = orgTeams.map((t) => t.id);

              await db
                .delete(schema.teamMember)
                .where(
                  and(
                    eq(schema.teamMember.userId, member.userId),
                    inArray(schema.teamMember.teamId, teamIds),
                  ),
                );

              console.log(
                `Removed user ${member.userId} from all teams in org ${member.organizationId}`,
              );
            }
          } catch (error) {
            console.error(
              `Error cleaning up access for removed member ${member.userId}:`,
              error,
            );
          }
        },
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [
    "http://localhost:3000",
    "http://10.0.0.126:3000",
    process.env.BETTER_AUTH_URL!,
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
    "https://indeks.bl0q.app",
  ].filter(Boolean),
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      sameSite: "lax",

      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
    },

    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
