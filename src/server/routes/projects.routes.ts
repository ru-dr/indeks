import { Elysia, t } from "elysia";
import { projectsController } from "@/server/controllers/projects.controller";
import { auth } from "@/lib/auth";

export const projectsRoutes = new Elysia({ prefix: "/v1/projects" })
  // Create a new project
  .post(
    "/",
    async ({ body, request }) => {
      // Get session from request
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        return {
          error: "Unauthorized",
          message: "You must be logged in to create a project",
        };
      }

      try {
        const project = await projectsController.createProject(
          session.user.id,
          body,
        );

        return {
          success: true,
          data: project,
        };
      } catch (error) {
        console.error("Error creating project:", error);
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
      }),
    },
  )
  // Get all projects for the logged-in user
  .get("/", async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return {
        error: "Unauthorized",
        message: "You must be logged in to view projects",
      };
    }

    try {
      const userProjects = await projectsController.getUserProjects(
        session.user.id,
      );

      return {
        success: true,
        data: userProjects,
      };
    } catch (error) {
      console.error("Error fetching projects:", error);
      return {
        error: "Failed to fetch projects",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Get a single project
  .get("/:id", async ({ params, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
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
        return {
          error: "Not found",
          message: "Project not found",
        };
      }

      return {
        success: true,
        data: project,
      };
    } catch (error) {
      console.error("Error fetching project:", error);
      return {
        error: "Failed to fetch project",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Update a project
  .patch(
    "/:id",
    async ({ params, body, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
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
          return {
            error: "Not found",
            message: "Project not found",
          };
        }

        return {
          success: true,
          data: updated,
        };
      } catch (error) {
        console.error("Error updating project:", error);
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

  // Delete a project
  .delete("/:id", async ({ params, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
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
        return {
          error: "Not found",
          message: "Project not found",
        };
      }

      return {
        success: true,
        message: "Project deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting project:", error);
      return {
        error: "Failed to delete project",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Regenerate API key
  .post("/:id/regenerate-key", async ({ params, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
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
        return {
          error: "Not found",
          message: "Project not found",
        };
      }

      return {
        success: true,
        data: updated,
        message: "API key regenerated successfully",
      };
    } catch (error) {
      console.error("Error regenerating API key:", error);
      return {
        error: "Failed to regenerate API key",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
