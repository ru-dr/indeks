import { auth } from "@/lib/auth";
import { projectsController } from "@/server/controllers/projects.controller";

export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string | null;
    role?: string | null;
  };
  session: {
    id: string;
    activeOrganizationId?: string | null;
    activeTeamId?: string | null;
  };
}

/**
 * Get authenticated user from request headers
 * Returns null if not authenticated
 */
export async function getAuthFromRequest(
  request: Request,
): Promise<AuthContext | null> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
      session: {
        id: session.session.id,
        activeOrganizationId: session.session.activeOrganizationId,
        activeTeamId: session.session.activeTeamId,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Verify user has access to a specific project
 * Returns true if user owns the project or is a member of its organization
 */
export async function verifyProjectAccess(
  userId: string,
  projectId: string,
): Promise<boolean> {
  return projectsController.hasProjectAccess(userId, projectId);
}

/**
 * Check if user is a PLATFORM ADMIN (Indeks super admin)
 * Platform admins have FULL control over EVERYTHING - all organizations, 
 * all users, all projects, and all system-level operations.
 *
 * NOTE: The user.role field is for platform-level permissions:
 * - "admin" = Platform super admin with FULL access
 * - null/undefined = Regular user (uses org-level roles)
 *
 * Org/Team roles (owner, member, viewer) are stored in the member table.
 * 
 * Hierarchy: viewer < member < owner < admin (platform)
 * Platform admin supersedes ALL org/team roles.
 */
export async function isUserAdmin(request: Request): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user?.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Alias for clarity - checks if user is a platform admin
 */
export const isPlatformAdmin = isUserAdmin;
export const isSystemAdmin = isUserAdmin; // backwards compatibility
