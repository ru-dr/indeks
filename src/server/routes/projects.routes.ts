import { Elysia, t } from "elysia";
import { projectsController } from "@/server/controllers/projects.controller";
import { auth } from "@/lib/auth";
import { db } from "@/db/connect";
import { member } from "@/db/schema/schema";
import { eq, and } from "drizzle-orm";

export const projectsRoutes = new Elysia({ prefix: "/v1/projects" })

  .post(
    "/",
    async ({ body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "You must be logged in to create a project",
        };
      }

      if (body.organizationId) {
        const [membership] = await db
          .select()
          .from(member)
          .where(
            and(
              eq(member.organizationId, body.organizationId),
              eq(member.userId, session.user.id),
            ),
          )
          .limit(1);

        if (!membership) {
          set.status = 403;
          return {
            error: "Forbidden",
            message: "You don't have access to this organization",
          };
        }
      }

      try {
        const project = await projectsController.createProject(
          session.user.id,
          {
            ...body,
            organizationId: body.organizationId || undefined,
          },
        );

        return {
          success: true,
          data: project,
        };
      } catch (error) {
        console.error("Error creating project:", error);
        set.status = 500;
        return {
          error: "Failed to create project",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 255 }),
        description: t.Optional(t.String()),
        category: t.Optional(t.String()),
        link: t.String({ minLength: 1 }),
        organizationId: t.Optional(t.String()),
      }),
    },
  )

  .get("/", async ({ request, query, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "You must be logged in to view projects",
      };
    }

    try {
      // Always use getUserProjects which respects explicit project access
      // This ensures users only see projects they own or have been granted access to
      const projects = await projectsController.getUserProjects(session.user.id);

      // If organizationId is provided, filter to only that org's projects
      let filteredProjects = projects;
      if (query?.organizationId) {
        // Verify user is a member of the organization
        const [membership] = await db
          .select()
          .from(member)
          .where(
            and(
              eq(member.organizationId, query.organizationId as string),
              eq(member.userId, session.user.id),
            ),
          )
          .limit(1);

        if (!membership) {
          set.status = 403;
          return {
            error: "Forbidden",
            message: "You don't have access to this organization",
          };
        }

        filteredProjects = projects.filter(
          (p) => p.organizationId === query.organizationId
        );
      }

      return {
        success: true,
        data: filteredProjects,
      };
    } catch (error) {
      console.error("Error fetching projects:", error);
      set.status = 500;
      return {
        error: "Failed to fetch projects",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .get("/:id", async ({ params, request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "You must be logged in to view this project",
      };
    }

    try {
      const project = await projectsController.getProject(
        session.user.id,
        params.id,
      );

      if (!project) {
        set.status = 404;
        return {
          error: "Not found",
          message: "Project not found",
        };
      }

      const role = await projectsController.getUserProjectRole(
        session.user.id,
        params.id,
      );

      return {
        success: true,
        data: {
          ...project,
          userRole: role,
        },
      };
    } catch (error) {
      console.error("Error fetching project:", error);
      set.status = 500;
      return {
        error: "Failed to fetch project",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .patch(
    "/:id",
    async ({ params, body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "You must be logged in to update a project",
        };
      }

      try {
        const updated = await projectsController.updateProject(
          session.user.id,
          params.id,
          body,
        );

        if (!updated) {
          set.status = 404;
          return {
            error: "Not found",
            message:
              "Project not found or you don't have permission to update it",
          };
        }

        return {
          success: true,
          data: updated,
        };
      } catch (error) {
        console.error("Error updating project:", error);
        set.status = 500;
        return {
          error: "Failed to update project",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        description: t.Optional(t.String()),
        category: t.Optional(t.String()),
        link: t.Optional(t.String({ minLength: 1 })),
        isActive: t.Optional(t.Boolean()),
      }),
    },
  )

  .delete("/:id", async ({ params, request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "You must be logged in to delete a project",
      };
    }

    try {
      const deleted = await projectsController.deleteProject(
        session.user.id,
        params.id,
      );

      if (!deleted) {
        set.status = 404;
        return {
          error: "Not found",
          message:
            "Project not found or you don't have permission to delete it",
        };
      }

      return {
        success: true,
        message: "Project deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting project:", error);
      set.status = 500;
      return {
        error: "Failed to delete project",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .post("/:id/regenerate-key", async ({ params, request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "You must be logged in to regenerate API key",
      };
    }

    try {
      const updated = await projectsController.regenerateApiKey(
        session.user.id,
        params.id,
      );

      if (!updated) {
        set.status = 404;
        return {
          error: "Not found",
          message: "Project not found or you don't have permission",
        };
      }

      return {
        success: true,
        data: updated,
        message: "API key regenerated successfully",
      };
    } catch (error) {
      console.error("Error regenerating API key:", error);
      set.status = 500;
      return {
        error: "Failed to regenerate API key",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .get("/:id/access", async ({ params, request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "You must be logged in",
      };
    }

    try {
      const accessList = await projectsController.getProjectAccessList(
        session.user.id,
        params.id,
      );

      if (!accessList) {
        set.status = 404;
        return {
          error: "Not found",
          message: "Project not found or you don't have access",
        };
      }

      return {
        success: true,
        data: accessList,
      };
    } catch (error) {
      console.error("Error fetching project access:", error);
      set.status = 500;
      return {
        error: "Failed to fetch project access",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .post(
    "/:id/access",
    async ({ params, body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "You must be logged in",
        };
      }

      try {
        const result = await projectsController.addProjectAccess(
          session.user.id,
          params.id,
          body,
        );

        if ("error" in result && "status" in result) {
          set.status = result.status;
          return {
            error: result.error,
            message: result.error,
          };
        }

        return {
          success: true,
          data: result,
          message: "Access granted successfully",
        };
      } catch (error) {
        console.error("Error adding project access:", error);
        set.status = 500;
        return {
          error: "Failed to add project access",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        role: t.Union([
          t.Literal("admin"),
          t.Literal("member"),
          t.Literal("viewer"),
        ]),
      }),
    },
  )

  .patch(
    "/:id/access/:accessId",
    async ({ params, body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "You must be logged in",
        };
      }

      try {
        const result = await projectsController.updateProjectAccess(
          session.user.id,
          params.id,
          params.accessId,
          body,
        );

        if (!result || ("error" in result && "status" in result)) {
          set.status = result && "status" in result ? result.status : 404;
          return {
            error: "Failed to update access",
            message: result && "error" in result ? result.error : "Not found",
          };
        }

        return {
          success: true,
          data: result,
          message: "Access updated successfully",
        };
      } catch (error) {
        console.error("Error updating project access:", error);
        set.status = 500;
        return {
          error: "Failed to update project access",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        role: t.Union([
          t.Literal("admin"),
          t.Literal("member"),
          t.Literal("viewer"),
        ]),
      }),
    },
  )

  .delete("/:id/access/:accessId", async ({ params, request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "You must be logged in",
      };
    }

    try {
      const result = await projectsController.removeProjectAccess(
        session.user.id,
        params.id,
        params.accessId,
      );

      if (!result || ("error" in result && "status" in result)) {
        set.status = result && "status" in result ? result.status : 404;
        return {
          error: "Failed to remove access",
          message: result && "error" in result ? result.error : "Not found",
        };
      }

      return {
        success: true,
        message: "Access removed successfully",
      };
    } catch (error) {
      console.error("Error removing project access:", error);
      set.status = 500;
      return {
        error: "Failed to remove project access",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
