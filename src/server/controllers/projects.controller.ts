import { db } from "@/db/connect";
import { projects } from "@/db/schema/schema";
import { eq, and } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

interface CreateProjectDto {
  title: string;
  description?: string;
  category?: string;
  link: string;
}

interface UpdateProjectDto {
  title?: string;
  description?: string;
  category?: string;
  link?: string;
  isActive?: boolean;
}

// Generate a secure public key
function generatePublicKey(): string {
  const randomPart = randomBytes(16).toString("hex");
  return `indeks_pk_live_${randomPart}`;
}

// Generate SHA-256 hash of the public key
function generateKeyHash(publicKey: string): string {
  return createHash("sha256").update(publicKey).digest("hex");
}

export const projectsController = {
  // Create a new project
  async createProject(userId: string, data: CreateProjectDto) {
    const publicKey = generatePublicKey();
    const keyHash = generateKeyHash(publicKey);

    const [project] = await db
      .insert(projects)
      .values({
        userId,
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
      publicKey, // Return the public key only once during creation
    };
  },

  // Get all projects for a user
  async getUserProjects(userId: string) {
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
      })
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(projects.createdAt);

    return userProjects;
  },

  // Get a single project
  async getProject(userId: string, projectId: string) {
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
      })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    return project;
  },

  // Update a project
  async updateProject(
    userId: string,
    projectId: string,
    data: UpdateProjectDto,
  ) {
    const [updated] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();

    return updated;
  },

  // Delete a project
  async deleteProject(userId: string, projectId: string) {
    const [deleted] = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();

    return deleted;
  },

  // Regenerate API key for a project
  async regenerateApiKey(userId: string, projectId: string) {
    const publicKey = generatePublicKey();
    const keyHash = generateKeyHash(publicKey);

    const [updated] = await db
      .update(projects)
      .set({
        publicKey,
        keyHash,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();

    return {
      ...updated,
      publicKey, // Return the new public key
    };
  },
};
