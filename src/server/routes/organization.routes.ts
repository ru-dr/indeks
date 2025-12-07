import { Elysia, t } from "elysia";
import { auth } from "@/lib/auth";
import { db } from "@/db/connect";
import { member, user } from "@/db/schema/schema";
import { eq, and } from "drizzle-orm";

/**
 * Organization routes with server-side validation
 * 
 * Key security rules:
 * - Only SYSTEM admins (user.role = "admin") can assign the "admin" org role
 * - Org owners can only assign viewer/member roles
 * - Nobody can directly assign "owner" role (must use ownership transfer)
 */
export const organizationRoutes = new Elysia({ prefix: "/v1/organization" })

  /**
   * Update member role with proper validation
   * Only system admins can assign "admin" role
   */
  .patch(
    "/members/:memberId/role",
    async ({ params, body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "You must be logged in",
        };
      }

      const { memberId } = params;
      const { role, organizationId } = body;

      // Validate role value
      const validRoles = ["viewer", "member", "admin", "owner"];
      if (!validRoles.includes(role)) {
        set.status = 400;
        return {
          error: "Bad request",
          message: "Invalid role",
        };
      }

      // Cannot directly assign owner role
      if (role === "owner") {
        set.status = 403;
        return {
          error: "Forbidden",
          message: "Cannot directly assign owner role. Use ownership transfer instead.",
        };
      }

      // Check if current user is a SYSTEM admin
      const isSystemAdmin = session.user.role === "admin";

      // Only SYSTEM admins can assign "admin" org role
      if (role === "admin" && !isSystemAdmin) {
        set.status = 403;
        return {
          error: "Forbidden",
          message: "Only system administrators can assign the admin role",
        };
      }

      // Get current user's membership in this org
      const [currentUserMembership] = await db
        .select({
          role: member.role,
        })
        .from(member)
        .where(
          and(
            eq(member.userId, session.user.id),
            eq(member.organizationId, organizationId)
          )
        )
        .limit(1);

      // If not a system admin, must be owner to change roles
      if (!isSystemAdmin) {
        if (!currentUserMembership || currentUserMembership.role !== "owner") {
          set.status = 403;
          return {
            error: "Forbidden",
            message: "Only organization owners can change member roles",
          };
        }
      }

      // Get target member info
      const [targetMember] = await db
        .select({
          id: member.id,
          role: member.role,
          userId: member.userId,
        })
        .from(member)
        .where(eq(member.id, memberId))
        .limit(1);

      if (!targetMember) {
        set.status = 404;
        return {
          error: "Not found",
          message: "Member not found",
        };
      }

      // Cannot change owner's role (must transfer ownership)
      if (targetMember.role === "owner") {
        set.status = 403;
        return {
          error: "Forbidden",
          message: "Cannot change owner's role. Use ownership transfer instead.",
        };
      }

      // Cannot change your own role
      if (targetMember.userId === session.user.id) {
        set.status = 403;
        return {
          error: "Forbidden",
          message: "Cannot change your own role",
        };
      }

      // Non-system-admins cannot assign roles higher than their own
      if (!isSystemAdmin) {
        const roleHierarchy = ["viewer", "member", "admin", "owner"];
        const currentRoleIndex = roleHierarchy.indexOf(currentUserMembership!.role);
        const newRoleIndex = roleHierarchy.indexOf(role);
        
        if (newRoleIndex >= currentRoleIndex) {
          set.status = 403;
          return {
            error: "Forbidden",
            message: "Cannot assign a role equal to or higher than your own",
          };
        }
      }

      // Update the member's role
      try {
        await db
          .update(member)
          .set({ role })
          .where(eq(member.id, memberId));

        return {
          success: true,
          message: `Role updated to ${role}`,
        };
      } catch (error) {
        console.error("Error updating member role:", error);
        set.status = 500;
        return {
          error: "Internal error",
          message: "Failed to update role",
        };
      }
    },
    {
      params: t.Object({
        memberId: t.String(),
      }),
      body: t.Object({
        role: t.String(),
        organizationId: t.String(),
      }),
    }
  )

  /**
   * Check if current user is a system admin
   */
  .get("/is-system-admin", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "You must be logged in",
      };
    }

    return {
      isSystemAdmin: session.user.role === "admin",
    };
  });
