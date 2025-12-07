/**
 * Migration script to update existing users with 'user' role to 'viewer'
 * Run this after deploying the role-based access control changes
 *
 * Usage: npx tsx scripts/migrate-roles.ts
 */

import "dotenv/config";
import { db } from "../src/db/connect";
import { user } from "../src/db/schema/schema";
import { eq } from "drizzle-orm";

async function migrateRoles() {
  try {
    const result = await db
      .update(user)
      .set({ role: "viewer" })
      .where(eq(user.role, "user"));
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrateRoles();
