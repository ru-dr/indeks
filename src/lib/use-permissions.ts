import { authClient } from "@/lib/auth-client";

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
  role: "viewer" | "member" | "admin" | "owner",
  permissions: Record<string, string[]>,
) {
  return authClient.admin.checkRolePermission({
    role,
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

export type Role = "viewer" | "member" | "admin" | "owner";

export type PermissionResource = "user" | "session" | "project" | "analytics";
