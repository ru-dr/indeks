import { db } from "@/db/connect";
import { projects, member } from "@/db/schema/schema";
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
   */
  async getUserProjects(userId: string) {
    const orgIds = await getUserOrganizationIds(userId);

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
          and(eq(projects.userId, userId), isNull(projects.organizationId)),

          orgIds.length > 0
            ? inArray(projects.organizationId, orgIds)
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
   * User must either own it personally or be a member of its organization
   */
  async getProject(userId: string, projectId: string) {
    const orgIds = await getUserOrganizationIds(userId);

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
            and(eq(projects.userId, userId), isNull(projects.organizationId)),

            orgIds.length > 0
              ? inArray(projects.organizationId, orgIds)
              : undefined,
          ),
        ),
      )
      .limit(1);

    return project;
  },

  /**
   * Check if user has access to a project
   */
  async hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
    const project = await this.getProject(userId, projectId);
    return !!project;
  },

  async updateProject(
    userId: string,
    projectId: string,
    data: UpdateProjectDto,
  ) {
    const hasAccess = await this.hasProjectAccess(userId, projectId);
    if (!hasAccess) {
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
    const hasAccess = await this.hasProjectAccess(userId, projectId);
    if (!hasAccess) {
      return null;
    }

    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    return deleted;
  },

  async regenerateApiKey(userId: string, projectId: string) {
    const hasAccess = await this.hasProjectAccess(userId, projectId);
    if (!hasAccess) {
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
