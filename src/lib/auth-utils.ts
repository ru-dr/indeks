import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role, roleHierarchy, statement } from "@/lib/permissions";

type Resource = keyof typeof statement;
type Action<R extends Resource> = (typeof statement)[R][number];

type PermissionCheck = {
  [K in Resource]?: Action<K>[];
};

/**
 * Get the current session server-side
 */
export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Require authentication - redirects to sign-in if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/sign-in");
  }

  if (!session.user.emailVerified) {
    redirect("/auth/sign-in?error=email-not-verified");
  }

  return session;
}

/**
 * Get the current user's role
 */
export async function getUserRole(): Promise<Role | null> {
  const session = await getSession();
  if (!session?.user?.role) return null;
  return session.user.role as Role;
}

/**
 * Check if the current user has a specific role or higher
 */
export async function hasRole(requiredRole: Role): Promise<boolean> {
  const userRole = await getUserRole();
  if (!userRole) return false;

  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Check if a given role string is at least the required role
 */
export function isRoleAtLeast(
  userRole: string | null | undefined,
  requiredRole: Role,
): boolean {
  if (!userRole) return false;

  const userRoleIndex = roleHierarchy.indexOf(userRole as Role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  if (userRoleIndex === -1) return false;

  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Check if the current user has specific permission(s)
 * Uses Better Auth's permission system
 */
export async function hasPermission(
  permissions: PermissionCheck,
): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  try {
    const result = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: permissions as Record<string, string[]>,
      },
    });

    return result?.success ?? false;
  } catch {
    return false;
  }
}

/**
 * Require a specific role - redirects to dashboard if not authorized
 */
export async function requireRole(requiredRole: Role) {
  const session = await requireAuth();

  if (!isRoleAtLeast(session.user.role, requiredRole)) {
    redirect("/?error=unauthorized");
  }

  return session;
}

/**
 * Require specific permission(s) - redirects if not authorized
 */
export async function requirePermission(permissions: PermissionCheck) {
  await requireAuth();

  const hasAccess = await hasPermission(permissions);
  if (!hasAccess) {
    redirect("/?error=unauthorized");
  }
}

/**
 * Check if user is an admin (admin or owner role)
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole("admin");
}

/**
 * Check if user is the owner
 */
export async function isOwner(): Promise<boolean> {
  return hasRole("owner");
}

/**
 * Get user with role information
 */
export async function getAuthenticatedUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return {
    ...session.user,
    role: (session.user.role as Role) || "viewer",
    isAdmin: isRoleAtLeast(session.user.role, "admin"),
    isOwner: session.user.role === "owner",
  };
}
