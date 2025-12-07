import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username, admin, organization } from "better-auth/plugins";
import { db } from "@/db/connect";
import * as schema from "@/db/schema/schema";
import { emailService } from "@/lib/email";
import { ac, roles } from "@/lib/permissions";
import { nanoid } from "nanoid";

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
      ac,
      roles: {
        viewer: roles.viewer,
        member: roles.member,
        admin: roles.admin,
        owner: roles.owner,
      },
      // Default role is NOT set here - this is for SYSTEM admin role
      // The user.role field is for system-level permissions only
      // "admin" in user.role means SYSTEM ADMIN (platform admin of Indeks)
      // Regular users should have no system role (null/undefined)
      defaultRole: false, // Don't set a default system role
    }),
    organization({
      ac,
      roles: {
        owner: roles.owner,
        admin: roles.admin,
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
  // Auto-create a default organization for new users
  user: {
    additionalFields: {},
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Create a default "Personal" organization for new users
          const slug = `personal-${user.id.slice(0, 8)}`;
          const orgId = nanoid();

          try {
            // Create the organization
            await db.insert(schema.organization).values({
              id: orgId,
              name: `${user.name || "Personal"}'s Workspace`,
              slug,
              createdAt: new Date(),
            });

            // Add the user as owner of the organization
            await db.insert(schema.member).values({
              id: nanoid(),
              organizationId: orgId,
              userId: user.id,
              role: "owner", // User is OWNER of their default org
              createdAt: new Date(),
            });

            console.log(
              `Created default organization "${slug}" for user ${user.id}`
            );
          } catch (error) {
            console.error(
              `Failed to create default organization for user ${user.id}:`,
              error
            );
            // Don't throw - user creation should still succeed
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
  },
});
