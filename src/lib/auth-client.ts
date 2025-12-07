import { createAuthClient } from "better-auth/react";
import {
  usernameClient,
  adminClient,
  organizationClient,
} from "better-auth/client/plugins";
import { ac, roles } from "@/lib/permissions";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    usernameClient(),
    adminClient({
      ac,
      roles: {
        viewer: roles.viewer,
        member: roles.member,
        admin: roles.admin,
        owner: roles.owner,
      },
    }),
    organizationClient({
      ac,
      roles: {
        owner: roles.owner,
        admin: roles.admin,
        member: roles.member,
        viewer: roles.viewer,
      },
      teams: {
        enabled: true,
      },
    }),
  ],
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

export const useSession = authClient.useSession;
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;

export const useActiveOrganization = authClient.useActiveOrganization;
export const useListOrganizations = authClient.useListOrganizations;
