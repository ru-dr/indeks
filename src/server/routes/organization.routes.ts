import { Elysia, t } from "elysia";
import { auth } from "@/lib/auth";
import { organizationController } from "@/server/controllers/organization.controller";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role?: string | null;
}

export const organizationRoutes = new Elysia({ prefix: "/v1/organizations" })

  /**
   * Get all organizations for the current user
   */
  .get("/", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return {
        success: false,
        error: "Unauthorized",
        data: null,
      };
    }

    try {
      const organizations = await organizationController.getUserOrganizations(
        session.user.id,
      );

      return {
        success: true,
        data: organizations,
      };
    } catch (error) {
      console.error("Error fetching organizations:", error);
      set.status = 500;
      return {
        success: false,
        error: "Failed to fetch organizations",
        data: null,
      };
    }
  })

  /**
   * Get organization details
   */
  .get(
    "/:organizationId",
    async ({ params, request, set }) => {
      const { organizationId } = params;

      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          data: null,
        };
      }

      const currentUser: AuthUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      };

      const membership = await organizationController.getUserMembership(
        currentUser.id,
        organizationId,
      );

      const isSystemAdmin = currentUser.role === "admin";

      if (!membership && !isSystemAdmin) {
        set.status = 403;
        return {
          success: false,
          error: "You are not a member of this organization",
          data: null,
        };
      }

      try {
        const organization =
          await organizationController.getOrganization(organizationId);

        if (!organization) {
          set.status = 404;
          return {
            success: false,
            error: "Organization not found",
            data: null,
          };
        }

        return {
          success: true,
          data: {
            ...organization,
            userRole: membership?.role,
          },
        };
      } catch (error) {
        console.error("Error fetching organization:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to fetch organization",
          data: null,
        };
      }
    },
    {
      params: t.Object({
        organizationId: t.String(),
      }),
    },
  )

  /**
   * Get all members of an organization
   */
  .get(
    "/:organizationId/members",
    async ({ params, request, set }) => {
      const { organizationId } = params;

      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          data: null,
        };
      }

      const currentUser: AuthUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      };

      const membership = await organizationController.getUserMembership(
        currentUser.id,
        organizationId,
      );

      const isSystemAdmin = currentUser.role === "admin";

      if (!membership && !isSystemAdmin) {
        set.status = 403;
        return {
          success: false,
          error: "You are not a member of this organization",
          data: null,
        };
      }

      try {
        const members =
          await organizationController.getOrganizationMembers(organizationId);

        return {
          success: true,
          data: members,
        };
      } catch (error) {
        console.error("Error fetching organization members:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to fetch organization members",
          data: null,
        };
      }
    },
    {
      params: t.Object({
        organizationId: t.String(),
      }),
    },
  )

  /**
   * Get all teams for an organization with member counts
   */
  .get(
    "/:organizationId/teams",
    async ({ params, request, set }) => {
      const { organizationId } = params;

      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          data: null,
        };
      }

      const currentUser: AuthUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      };

      const membership = await organizationController.getUserMembership(
        currentUser.id,
        organizationId,
      );

      const isSystemAdmin = currentUser.role === "admin";

      if (!membership && !isSystemAdmin) {
        set.status = 403;
        return {
          success: false,
          error: "You are not a member of this organization",
          data: null,
        };
      }

      try {
        const teams =
          await organizationController.getOrganizationTeams(organizationId);

        return {
          success: true,
          data: teams,
        };
      } catch (error) {
        console.error("Error fetching organization teams:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to fetch organization teams",
          data: null,
        };
      }
    },
    {
      params: t.Object({
        organizationId: t.String(),
      }),
    },
  )

  /**
   * Create a new team in an organization
   */
  .post(
    "/:organizationId/teams",
    async ({ params, body, request, set }) => {
      const { organizationId } = params;

      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          data: null,
        };
      }

      const canManage = await organizationController.canManageOrganization(
        session.user.id,
        organizationId,
      );

      if (!canManage && session.user.role !== "admin") {
        set.status = 403;
        return {
          success: false,
          error: "You don't have permission to create teams",
          data: null,
        };
      }

      try {
        const newTeam = await organizationController.createTeam(
          organizationId,
          body.name,
        );

        return {
          success: true,
          data: newTeam,
        };
      } catch (error) {
        console.error("Error creating team:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to create team",
          data: null,
        };
      }
    },
    {
      params: t.Object({
        organizationId: t.String(),
      }),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
      }),
    },
  )

  /**
   * Get team members for a team
   * This endpoint allows org owners/admins to view team members
   * even if they are not members of that specific team
   */
  .get(
    "/:organizationId/teams/:teamId/members",
    async ({ params, request, set }) => {
      const { organizationId, teamId } = params;

      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          data: null,
        };
      }

      const currentUser: AuthUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      };

      const membership = await organizationController.getUserMembership(
        currentUser.id,
        organizationId,
      );

      const isSystemAdmin = currentUser.role === "admin";

      if (!membership && !isSystemAdmin) {
        set.status = 403;
        return {
          success: false,
          error: "You are not a member of this organization",
          data: null,
        };
      }

      const teamRecord = await organizationController.verifyTeamInOrganization(
        teamId,
        organizationId,
      );

      if (!teamRecord) {
        set.status = 404;
        return {
          success: false,
          error: "Team not found in this organization",
          data: null,
        };
      }

      try {
        const teamMembers = await organizationController.getTeamMembers(teamId);

        return {
          success: true,
          data: teamMembers,
        };
      } catch (error) {
        console.error("Error fetching team members:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to fetch team members",
          data: null,
        };
      }
    },
    {
      params: t.Object({
        organizationId: t.String(),
        teamId: t.String(),
      }),
    },
  )

  /**
   * Add a member to a team
   */
  .post(
    "/:organizationId/teams/:teamId/members",
    async ({ params, body, request, set }) => {
      const { organizationId, teamId } = params;

      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          data: null,
        };
      }

      const canManage = await organizationController.canManageOrganization(
        session.user.id,
        organizationId,
      );

      if (!canManage && session.user.role !== "admin") {
        set.status = 403;
        return {
          success: false,
          error: "You don't have permission to manage team members",
          data: null,
        };
      }

      const teamRecord = await organizationController.verifyTeamInOrganization(
        teamId,
        organizationId,
      );

      if (!teamRecord) {
        set.status = 404;
        return {
          success: false,
          error: "Team not found in this organization",
          data: null,
        };
      }

      try {
        const result = await organizationController.addTeamMember(
          teamId,
          body.userId,
        );

        if ("error" in result) {
          set.status = result.status;
          return {
            success: false,
            error: result.error,
            data: null,
          };
        }

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("Error adding team member:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to add team member",
          data: null,
        };
      }
    },
    {
      params: t.Object({
        organizationId: t.String(),
        teamId: t.String(),
      }),
      body: t.Object({
        userId: t.String(),
      }),
    },
  )

  /**
   * Remove a member from a team
   */
  .delete(
    "/:organizationId/teams/:teamId/members/:memberId",
    async ({ params, request, set }) => {
      const { organizationId, teamId, memberId } = params;

      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          data: null,
        };
      }

      const canManage = await organizationController.canManageOrganization(
        session.user.id,
        organizationId,
      );

      if (!canManage && session.user.role !== "admin") {
        set.status = 403;
        return {
          success: false,
          error: "You don't have permission to manage team members",
          data: null,
        };
      }

      const teamRecord = await organizationController.verifyTeamInOrganization(
        teamId,
        organizationId,
      );

      if (!teamRecord) {
        set.status = 404;
        return {
          success: false,
          error: "Team not found in this organization",
          data: null,
        };
      }

      try {
        const deleted = await organizationController.removeTeamMember(
          teamId,
          memberId,
        );

        if (!deleted) {
          set.status = 404;
          return {
            success: false,
            error: "Team member not found",
            data: null,
          };
        }

        return {
          success: true,
          message: "Team member removed successfully",
        };
      } catch (error) {
        console.error("Error removing team member:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to remove team member",
          data: null,
        };
      }
    },
    {
      params: t.Object({
        organizationId: t.String(),
        teamId: t.String(),
        memberId: t.String(),
      }),
    },
  )

  /**
   * Update a team
   */
  .patch(
    "/:organizationId/teams/:teamId",
    async ({ params, body, request, set }) => {
      const { organizationId, teamId } = params;

      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          data: null,
        };
      }

      const canManage = await organizationController.canManageOrganization(
        session.user.id,
        organizationId,
      );

      if (!canManage && session.user.role !== "admin") {
        set.status = 403;
        return {
          success: false,
          error: "You don't have permission to update teams",
          data: null,
        };
      }

      const teamRecord = await organizationController.verifyTeamInOrganization(
        teamId,
        organizationId,
      );

      if (!teamRecord) {
        set.status = 404;
        return {
          success: false,
          error: "Team not found in this organization",
          data: null,
        };
      }

      try {
        const updated = await organizationController.updateTeam(
          teamId,
          body.name,
        );

        return {
          success: true,
          data: updated,
        };
      } catch (error) {
        console.error("Error updating team:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to update team",
          data: null,
        };
      }
    },
    {
      params: t.Object({
        organizationId: t.String(),
        teamId: t.String(),
      }),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
      }),
    },
  )

  /**
   * Delete a team
   */
  .delete(
    "/:organizationId/teams/:teamId",
    async ({ params, request, set }) => {
      const { organizationId, teamId } = params;

      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          data: null,
        };
      }

      const canManage = await organizationController.canManageOrganization(
        session.user.id,
        organizationId,
      );

      if (!canManage && session.user.role !== "admin") {
        set.status = 403;
        return {
          success: false,
          error: "You don't have permission to delete teams",
          data: null,
        };
      }

      const teamRecord = await organizationController.verifyTeamInOrganization(
        teamId,
        organizationId,
      );

      if (!teamRecord) {
        set.status = 404;
        return {
          success: false,
          error: "Team not found in this organization",
          data: null,
        };
      }

      try {
        const deleted = await organizationController.deleteTeam(teamId);

        if (!deleted) {
          set.status = 404;
          return {
            success: false,
            error: "Team not found",
            data: null,
          };
        }

        return {
          success: true,
          message: "Team deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting team:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to delete team",
          data: null,
        };
      }
    },
    {
      params: t.Object({
        organizationId: t.String(),
        teamId: t.String(),
      }),
    },
  );
