import { db } from "@/db/connect";
import { user } from "@/db/schema/schema";
import { eq } from "drizzle-orm";

export const profileController = {
  async getProfile(userId: string) {
    const [profile] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        username: user.username,
        displayUsername: user.displayUsername,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return profile || null;
  },

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      image?: string;
      username?: string;
      displayUsername?: string;
    },
  ) {
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.image !== undefined) {
      if (data.image && !isValidUrl(data.image)) {
        throw new Error("Invalid image URL");
      }
      updateData.image = data.image || null;
    }

    if (data.username !== undefined) {
      const normalizedUsername = data.username
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");

      if (normalizedUsername) {
        const [existing] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.username, normalizedUsername))
          .limit(1);

        if (existing && existing.id !== userId) {
          throw new Error("Username is already taken");
        }
      }

      updateData.username = normalizedUsername || null;
      updateData.displayUsername =
        data.displayUsername || normalizedUsername || null;
    }

    if (Object.keys(updateData).length === 0) {
      return null;
    }

    const [updated] = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        username: user.username,
        displayUsername: user.displayUsername,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

    return updated || null;
  },
};

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
