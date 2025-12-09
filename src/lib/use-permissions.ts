import { authClient } from "@/lib/auth-client";
import { Role, OrgRole } from "@/lib/permissions";

/**
 * Hook to check if the current user has a specific permission
 * Use this in components to conditionally render based on permissions
 */
export function useHasPermission(permissions: Record<string, string[]>) {
  return authClient.admin.hasPermission({
    permissions,
  });
}

/**
 * Check if a role has specific permissions (client-side only, synchronous)
 * Does NOT check the current user's permissions - just checks role definitions
 */
export function checkRolePermission(
  role: Role,
  permissions: Record<string, string[]>,
) {
  const adminRole =
    role === "owner" || role === "member" || role === "viewer"
      ? "admin"
      : (role as "user" | "admin");

  return authClient.admin.checkRolePermission({
    role: adminRole,
    permissions,
  });
}

/**
 * Hook to get user session with role info
 */
export function useSession() {
  return authClient.useSession();
}

export const {
  createUser,
  listUsers,
  setRole,
  banUser,
  unbanUser,
  impersonateUser,
  stopImpersonating,
  removeUser,
  listUserSessions,
  revokeUserSession,
  revokeUserSessions,
  updateUser,
  setUserPassword,
} = authClient.admin;

export type { Role, OrgRole } from "@/lib/permissions";

export type PermissionResource =
  | "user"
  | "session"
  | "project"
  | "analytics"
  | "organization"
  | "member"
  | "team"
  | "system";
