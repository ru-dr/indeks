import { db } from "@/db/connect";
import { projects, member, projectAccess, user } from "@/db/schema/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

interface CreateProjectDto {
  title: string;
  description?: string;
  category?: string;
  link: string;
  organizationId?: string;
}

interface UpdateProjectDto {
  title?: string;
  description?: string;
  category?: string;
  link?: string;
  isActive?: boolean;
}

interface AddProjectAccessDto {
  email: string;
  role: "admin" | "member" | "viewer";
}

interface UpdateProjectAccessDto {
  role: "admin" | "member" | "viewer";
}

export type ProjectRole = "owner" | "admin" | "member" | "viewer";

function generatePublicKey(): string {
  const randomPart = randomBytes(16).toString("hex");
  return `indeks_pk_live_${randomPart}`;
}

function generateKeyHash(publicKey: string): string {
  return createHash("sha256").update(publicKey).digest("hex");
}

/**
 * Get project access IDs where user has been granted explicit access
 * Returns empty array if table doesn't exist yet
 */
async function getUserProjectAccessIds(userId: string): Promise<string[]> {
  try {
    const access = await db
      .select({ projectId: projectAccess.projectId })
      .from(projectAccess)
      .where(eq(projectAccess.userId, userId));

    return access.map((a) => a.projectId);
  } catch (error: any) {
    if (error?.cause?.code === "42P01") {
      console.warn("project_access table does not exist yet, skipping...");
      return [];
    }
    throw error;
  }
}

export const projectsController = {
  async createProject(userId: string, data: CreateProjectDto) {
    const publicKey = generatePublicKey();
    const keyHash = generateKeyHash(publicKey);

    const [project] = await db
      .insert(projects)
      .values({
        userId,
        organizationId: data.organizationId || null,
        title: data.title,
        description: data.description,
        category: data.category,
        link: data.link,
        publicKey,
        keyHash,
      })
      .returning();

    return {
      ...project,
      publicKey,
    };
  },

  /**
   * Get projects for a user
   * Access is granted through:
   * - Projects owned by the user (userId matches)
   * - Projects where user has been granted explicit access via projectAccess table
   *
   * NOTE: Being an organization member does NOT automatically grant access to all org projects.
   * The project owner must explicitly grant access to team members via the projectAccess table.
   * This ensures proper access control even within organizations.
   */
  async getUserProjects(userId: string) {
    const accessProjectIds = await getUserProjectAccessIds(userId);

    // Build conditions array
    const conditions = [];

    // Include projects owned by user (regardless of whether they're in an org)
    conditions.push(eq(projects.userId, userId));

    // Include explicitly shared projects (via projectAccess table)
    if (accessProjectIds.length > 0) {
      conditions.push(inArray(projects.id, accessProjectIds));
    }

    const userProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        category: projects.category,
        link: projects.link,
        publicKey: projects.publicKey,
        isActive: projects.isActive,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        organizationId: projects.organizationId,
        userId: projects.userId,
      })
      .from(projects)
      .where(or(...conditions))
      .orderBy(projects.createdAt);

    return userProjects;
  },

  /**
   * Get projects for a specific organization
   * This returns ALL projects in the org - use for admin views only
   */
  async getOrganizationProjects(organizationId: string) {
    const orgProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        category: projects.category,
        link: projects.link,
        publicKey: projects.publicKey,
        isActive: projects.isActive,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        organizationId: projects.organizationId,
        userId: projects.userId,
      })
      .from(projects)
      .where(eq(projects.organizationId, organizationId))
      .orderBy(projects.createdAt);

    return orgProjects;
  },

  /**
   * Get a single project
   * User must either own it or have explicit access via projectAccess table
   */
  async getProject(userId: string, projectId: string) {
    // First check if user has any access at all
    const role = await this.getUserProjectRole(userId, projectId);
    if (!role) {
      return null; // No access
    }

    // User has access, fetch the project
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        category: projects.category,
        link: projects.link,
        publicKey: projects.publicKey,
        isActive: projects.isActive,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        organizationId: projects.organizationId,
        userId: projects.userId,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    return project;
  },

  /**
   * Get user's role for a project
   * This is the core access control function - it determines if and how a user can access a project
   *
   * Access hierarchy:
   * 1. Project owner (userId matches project.userId) -> "owner"
   * 2. Explicit project access (entry in projectAccess table) -> access role
   * 3. No access -> null
   *
   * NOTE: Organization membership alone does NOT grant project access.
   * The project owner must explicitly grant access via the projectAccess table.
   */
  async getUserProjectRole(
    userId: string,
    projectId: string,
  ): Promise<ProjectRole | null> {
    // First, get the project to check ownership
    const [project] = await db
      .select({
        id: projects.id,
        userId: projects.userId,
        organizationId: projects.organizationId,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    // Project doesn't exist
    if (!project) {
      return null;
    }

    // Check 1: Is the user the project owner?
    if (project.userId === userId) {
      return "owner";
    }

    // Check 2: Does the user have explicit project access?
    // This is the ONLY way non-owners can access a project
    try {
      const [access] = await db
        .select({ role: projectAccess.role })
        .from(projectAccess)
        .where(
          and(
            eq(projectAccess.projectId, projectId),
            eq(projectAccess.userId, userId),
          ),
        )
        .limit(1);

      if (access) {
        return access.role as ProjectRole;
      }
    } catch (error: any) {
      // Handle case where projectAccess table doesn't exist yet
      if (error?.cause?.code !== "42P01") {
        throw error;
      }
    }

    // No access - organization membership alone does NOT grant access
    return null;
  },

  /**
   * Check if user has access to a project
   */
  async hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
    const role = await this.getUserProjectRole(userId, projectId);
    return role !== null;
  },

  /**
   * Check if user can manage project (owner, admin, or member)
   */
  async canManageProject(userId: string, projectId: string): Promise<boolean> {
    const role = await this.getUserProjectRole(userId, projectId);
    return role === "owner" || role === "admin" || role === "member";
  },

  /**
   * Get all users with access to a project
   * Shows: owner + explicit projectAccess entries
   * Does NOT automatically include all org members (since org membership doesn't grant access)
   */
  async getProjectAccessList(userId: string, projectId: string) {
    const hasAccess = await this.hasProjectAccess(userId, projectId);
    if (!hasAccess) {
      return null;
    }

    const [project] = await db
      .select({
        userId: projects.userId,
        organizationId: projects.organizationId,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return null;
    }

    const accessList: {
      id: string;
      userId: string;
      name: string | null;
      email: string;
      image: string | null;
      role: ProjectRole;
      isOwner: boolean;
      grantedAt: Date | null;
    }[] = [];

    // Add the owner
    const [owner] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, project.userId))
      .limit(1);

    if (owner) {
      accessList.push({
        id: "owner",
        userId: owner.id,
        name: owner.name,
        email: owner.email,
        image: owner.image,
        role: "owner",
        isOwner: true,
        grantedAt: null,
      });
    }

    // Add users with explicit project access
    const explicitAccess = await db
      .select({
        id: projectAccess.id,
        userId: projectAccess.userId,
        role: projectAccess.role,
        createdAt: projectAccess.createdAt,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(projectAccess)
      .innerJoin(user, eq(projectAccess.userId, user.id))
      .where(eq(projectAccess.projectId, projectId));

    for (const access of explicitAccess) {
      accessList.push({
        id: access.id,
        userId: access.userId,
        name: access.name,
        email: access.email,
        image: access.image,
        role: access.role as ProjectRole,
        isOwner: false,
        grantedAt: access.createdAt,
      });
    }

    return accessList;
  },

  /**
   * Add access to a project
   */
  async addProjectAccess(
    granterId: string,
    projectId: string,
    data: AddProjectAccessDto,
  ) {
    const canManage = await this.canManageProject(granterId, projectId);
    if (!canManage) {
      return { error: "Forbidden", status: 403 };
    }

    const [targetUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.email.toLowerCase()))
      .limit(1);

    if (!targetUser) {
      return { error: "User not found", status: 404 };
    }

    const existingAccess = await this.getUserProjectRole(
      targetUser.id,
      projectId,
    );
    if (existingAccess) {
      return { error: "User already has access", status: 400 };
    }

    const [access] = await db
      .insert(projectAccess)
      .values({
        projectId,
        userId: targetUser.id,
        role: data.role,
        grantedBy: granterId,
      })
      .returning();

    return access;
  },

  /**
   * Update project access role
   */
  async updateProjectAccess(
    userId: string,
    projectId: string,
    accessId: string,
    data: UpdateProjectAccessDto,
  ) {
    const canManage = await this.canManageProject(userId, projectId);
    if (!canManage) {
      return { error: "Forbidden", status: 403 };
    }

    const [updated] = await db
      .update(projectAccess)
      .set({
        role: data.role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectAccess.id, accessId),
          eq(projectAccess.projectId, projectId),
        ),
      )
      .returning();

    return updated;
  },

  /**
   * Remove project access
   */
  async removeProjectAccess(
    userId: string,
    projectId: string,
    accessId: string,
  ) {
    const canManage = await this.canManageProject(userId, projectId);
    if (!canManage) {
      return { error: "Forbidden", status: 403 };
    }

    const [deleted] = await db
      .delete(projectAccess)
      .where(
        and(
          eq(projectAccess.id, accessId),
          eq(projectAccess.projectId, projectId),
        ),
      )
      .returning();

    return deleted;
  },

  /**
   * Remove all explicit project access for a user in a specific organization
   * This should be called when a user is removed from an organization
   * to ensure they lose access to any projects they were explicitly shared on
   */
  async revokeUserOrgProjectAccess(
    userId: string,
    organizationId: string,
  ): Promise<number> {
    try {
      // Get all projects in this organization
      const orgProjects = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.organizationId, organizationId));

      if (orgProjects.length === 0) {
        return 0;
      }

      const projectIds = orgProjects.map((p) => p.id);

      // Remove user's explicit access to all these projects
      const result = await db
        .delete(projectAccess)
        .where(
          and(
            eq(projectAccess.userId, userId),
            inArray(projectAccess.projectId, projectIds),
          ),
        );

      // Return the count of deleted rows (if available)
      return (result as any).rowCount ?? 0;
    } catch (error: any) {
      // Handle case where projectAccess table doesn't exist yet
      if (error?.cause?.code === "42P01") {
        return 0;
      }
      throw error;
    }
  },

  async updateProject(
    userId: string,
    projectId: string,
    data: UpdateProjectDto,
  ) {
    const canManage = await this.canManageProject(userId, projectId);
    if (!canManage) {
      return null;
    }

    const [updated] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return updated;
  },

  async deleteProject(userId: string, projectId: string) {
    const role = await this.getUserProjectRole(userId, projectId);
    if (role !== "owner") {
      return null;
    }

    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    return deleted;
  },

  async regenerateApiKey(userId: string, projectId: string) {
    const canManage = await this.canManageProject(userId, projectId);
    if (!canManage) {
      return null;
    }

    const publicKey = generatePublicKey();
    const keyHash = generateKeyHash(publicKey);

    const [updated] = await db
      .update(projects)
      .set({
        publicKey,
        keyHash,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return {
      ...updated,
      publicKey,
    };
  },
};
