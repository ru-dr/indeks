import { auth } from "@/lib/auth";
import { projectsController } from "@/server/controllers/projects.controller";

export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  session: {
    id: string;
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
      },
      session: {
        id: session.session.id,
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
 * Check if user is an admin (for global endpoints)
 */
export async function isUserAdmin(request: Request): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user?.role === "admin";
  } catch {
    return false;
  }
}
