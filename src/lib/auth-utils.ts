import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Role,
  OrgRole,
  roleHierarchy,
  statement,
  isRoleAtLeast as checkRoleAtLeast,
  getEffectiveRole,
} from "@/lib/permissions";

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
 * Get the current user's platform role (admin or null)
 */
export async function getPlatformRole(): Promise<"admin" | null> {
  const session = await getSession();
  if (session?.user?.role === "admin") return "admin";
  return null;
}

/**
 * Get the current user's effective role (considering both platform and org)
 * Platform admin supersedes all org roles
 */
export async function getUserRole(): Promise<Role | null> {
  const session = await getSession();
  if (!session?.user) return null;

  if (session.user.role === "admin") return "admin";

  return (session.user.role as Role) || null;
}

/**
 * Check if the current user has a specific role or higher
 * Platform admin always returns true for any role check
 */
export async function hasRole(requiredRole: Role): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  if (session.user.role === "admin") return true;

  const userRole = session.user.role as Role;
  return checkRoleAtLeast(userRole, requiredRole);
}

/**
 * Check if a given role string is at least the required role
 */
export function isRoleAtLeast(
  userRole: string | null | undefined,
  requiredRole: Role,
): boolean {
  if (!userRole) return false;

  if (userRole === "admin") return true;

  return checkRoleAtLeast(userRole as Role, requiredRole);
}

/**
 * Check if the current user has specific permission(s)
 * Platform admin has ALL permissions
 */
export async function hasPermission(
  permissions: PermissionCheck,
): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  if (session.user.role === "admin") return true;

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
 * Check if user is a PLATFORM ADMIN (super admin with FULL control)
 * This is the highest authority in the system
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === "admin";
}

/**
 * Check if user is an owner OR platform admin
 * Platform admin can do anything an owner can do
 */
export async function isOwner(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  if (session.user.role === "admin") return true;

  return session.user.role === "owner";
}

/**
 * Get user with role information
 */
export async function getAuthenticatedUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const isPlatAdmin = session.user.role === "admin";

  return {
    ...session.user,
    role: (session.user.role as Role) || "viewer",
    platformRole: isPlatAdmin ? "admin" : null,
    isPlatformAdmin: isPlatAdmin,
    isAdmin: isPlatAdmin,
    isOwner: isPlatAdmin || session.user.role === "owner",
  };
}

export const isAdmin = isPlatformAdmin;
