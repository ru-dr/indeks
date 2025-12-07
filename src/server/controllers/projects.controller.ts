import { db } from "@/db/connect";
import { projects, member, projectAccess, user } from "@/db/schema/schema";
import { eq, and, or, inArray, isNull } from "drizzle-orm";
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
  role: "admin" | "editor" | "viewer";
}

interface UpdateProjectAccessDto {
  role: "admin" | "editor" | "viewer";
}

export type ProjectRole = "owner" | "admin" | "editor" | "viewer";

function generatePublicKey(): string {
  const randomPart = randomBytes(16).toString("hex");
  return `indeks_pk_live_${randomPart}`;
}

function generateKeyHash(publicKey: string): string {
  return createHash("sha256").update(publicKey).digest("hex");
}

/**
 * Get all organization IDs that a user is a member of
 */
async function getUserOrganizationIds(userId: string): Promise<string[]> {
  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId));

  return memberships.map((m) => m.organizationId);
}

/**
 * Get project access IDs where user has been granted access
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
    // If table doesn't exist yet (during migration), return empty array
    if (error?.cause?.code === '42P01') {
      console.warn('project_access table does not exist yet, skipping...');
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
   * - Personal projects (no organizationId, owned by user)
   * - Organization projects (user is a member of the organization)
   * - Projects where user has been granted access
   */
  async getUserProjects(userId: string) {
    const orgIds = await getUserOrganizationIds(userId);
    const accessProjectIds = await getUserProjectAccessIds(userId);

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
      .where(
        or(
          // Personal projects owned by user
          and(eq(projects.userId, userId), isNull(projects.organizationId)),
          // Organization projects
          orgIds.length > 0
            ? inArray(projects.organizationId, orgIds)
            : undefined,
          // Projects with granted access
          accessProjectIds.length > 0
            ? inArray(projects.id, accessProjectIds)
            : undefined,
        ),
      )
      .orderBy(projects.createdAt);

    return userProjects;
  },

  /**
   * Get projects for a specific organization
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
   * User must either own it personally, be a member of its organization, or have explicit access
   */
  async getProject(userId: string, projectId: string) {
    const orgIds = await getUserOrganizationIds(userId);
    const accessProjectIds = await getUserProjectAccessIds(userId);

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
      .where(
        and(
          eq(projects.id, projectId),
          or(
            // Owner of personal project
            and(eq(projects.userId, userId), isNull(projects.organizationId)),
            // Organization member
            orgIds.length > 0
              ? inArray(projects.organizationId, orgIds)
              : undefined,
            // Has explicit access
            accessProjectIds.includes(projectId) ? eq(projects.id, projectId) : undefined,
          ),
        ),
      )
      .limit(1);

    return project;
  },

  /**
   * Get user's role for a project
   */
  async getUserProjectRole(userId: string, projectId: string): Promise<ProjectRole | null> {
    // Check if user is owner
    const [ownedProject] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.userId, userId),
          isNull(projects.organizationId),
        ),
      )
      .limit(1);

    if (ownedProject) {
      return "owner";
    }

    // Check organization membership
    const [project] = await db
      .select({ organizationId: projects.organizationId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project?.organizationId) {
      const [membership] = await db
        .select({ role: member.role })
        .from(member)
        .where(
          and(
            eq(member.organizationId, project.organizationId),
            eq(member.userId, userId),
          ),
        )
        .limit(1);

      if (membership) {
        return membership.role as ProjectRole;
      }
    }

    // Check explicit project access
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
   * Check if user can manage project (owner or admin)
   */
  async canManageProject(userId: string, projectId: string): Promise<boolean> {
    const role = await this.getUserProjectRole(userId, projectId);
    return role === "owner" || role === "admin";
  },

  /**
   * Get all users with access to a project
   */
  async getProjectAccessList(userId: string, projectId: string) {
    const hasAccess = await this.hasProjectAccess(userId, projectId);
    if (!hasAccess) {
      return null;
    }

    // Get project owner
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

    // Add owner
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

    // If organization project, add org members
    if (project.organizationId) {
      const orgMembers = await db
        .select({
          userId: member.userId,
          role: member.role,
          createdAt: member.createdAt,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(eq(member.organizationId, project.organizationId));

      for (const m of orgMembers) {
        if (m.userId !== project.userId) {
          accessList.push({
            id: m.userId,
            userId: m.userId,
            name: m.name,
            email: m.email,
            image: m.image,
            role: m.role as ProjectRole,
            isOwner: false,
            grantedAt: m.createdAt,
          });
        }
      }
    }

    // Add explicit project access
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

    // Find user by email
    const [targetUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.email.toLowerCase()))
      .limit(1);

    if (!targetUser) {
      return { error: "User not found", status: 404 };
    }

    // Check if user already has access
    const existingAccess = await this.getUserProjectRole(targetUser.id, projectId);
    if (existingAccess) {
      return { error: "User already has access", status: 400 };
    }

    // Add access
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
    // Only owner can delete
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
