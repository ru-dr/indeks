/**
 * Migration script to update existing users with old roles
 * Run this after deploying the role-based access control changes
 *
 * Role System:
 * - Platform level: user.role = "admin" for super admins (FULL control)
 * - Org/Team level: member.role = owner | member | viewer
 *
 * Usage: npx tsx scripts/migrate-roles.ts
 */

import "dotenv/config";
import { db } from "../src/db/connect";
import { user, member } from "../src/db/schema/schema";
import { eq, or } from "drizzle-orm";

async function migrateRoles() {
  console.log("Starting role migration...\n");

  try {
    // 1. Migrate old "user" role to "viewer" in member table
    console.log("Migrating 'user' role to 'viewer' in organization members...");
    const memberResult = await db
      .update(member)
      .set({ role: "viewer" })
      .where(eq(member.role, "user"));
    console.log("✓ Member roles updated\n");

    // 2. Ensure no invalid roles exist in member table
    // Valid org roles: owner, member, viewer
    console.log("Checking for any 'admin' roles in member table...");
    const adminMembers = await db
      .update(member)
      .set({ role: "owner" }) // Promote admin org members to owner
      .where(eq(member.role, "admin"));
    console.log("✓ Admin org members promoted to owner\n");

    // 3. Clean up any stale roles in user table
    // Only valid values for user.role are: "admin" or null
    console.log("Cleaning up user.role (only 'admin' or null allowed)...");
    // Users with owner/member/viewer as user.role should have it cleared
    // (these are org roles, not platform roles)
    await db
      .update(user)
      .set({ role: null })
      .where(or(
        eq(user.role, "owner"),
        eq(user.role, "member"),
        eq(user.role, "viewer"),
        eq(user.role, "user"),
      ));
    console.log("✓ User platform roles cleaned up\n");

    console.log("=".repeat(50));
    console.log("Migration completed successfully!");
    console.log("=".repeat(50));
    console.log("\nRole structure:");
    console.log("  Platform: user.role = 'admin' (super admin) or null");
    console.log("  Org/Team: member.role = owner | member | viewer");
    console.log("\nHierarchy: viewer < member < owner < admin (platform)");

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrateRoles();
