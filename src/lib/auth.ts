import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "@/db/connect";
import * as schema from "@/db/schema/schema";
import { emailService } from "@/lib/email";

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
  plugins: [username()],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
