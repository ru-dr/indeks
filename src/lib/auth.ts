import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username, admin, organization } from "better-auth/plugins";
import { db } from "@/db/connect";
import * as schema from "@/db/schema/schema";
import { emailService } from "@/lib/email";
import { ac, roles } from "@/lib/permissions";

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
      defaultRole: "viewer",
    }),
    organization({
      ac,
      roles: {
        owner: roles.owner,
        admin: roles.admin,
        member: roles.member,
        viewer: roles.viewer,
      },
      // Creator of a team becomes owner
      creatorRole: "owner",
      // Allow users to create teams (you can restrict this later)
      allowUserToCreateOrganization: true,
      // Max teams per user (set to 1 for simple use case, increase if needed)
      organizationLimit: 5,
      // Max members per team
      membershipLimit: 50,
      // Invitation expires in 7 days
      invitationExpiresIn: 60 * 60 * 24 * 7,
      // Send invitation email
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
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [
    "http://localhost:3000",
    "http://10.0.0.126:3000",
    process.env.BETTER_AUTH_URL!,
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  ].filter(Boolean),
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
});
