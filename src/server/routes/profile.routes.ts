import { Elysia, t } from "elysia";
import { profileController } from "@/server/controllers/profile.controller";
import { auth } from "@/lib/auth";

export const profileRoutes = new Elysia({ prefix: "/v1/profile" })
  .get("/", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "You must be logged in to view your profile",
      };
    }

    try {
      const profile = await profileController.getProfile(session.user.id);

      if (!profile) {
        set.status = 404;
        return {
          error: "Not found",
          message: "Profile not found",
        };
      }

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      set.status = 500;
      return {
        error: "Failed to fetch profile",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .patch(
    "/",
    async ({ body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "You must be logged in to update your profile",
        };
      }

      try {
        const updated = await profileController.updateProfile(
          session.user.id,
          body,
        );

        if (!updated) {
          set.status = 400;
          return {
            error: "Bad request",
            message: "No valid fields to update",
          };
        }

        return {
          success: true,
          data: updated,
        };
      } catch (error) {
        console.error("Error updating profile:", error);

        if (error instanceof Error) {
          if (error.message === "Username is already taken") {
            set.status = 409;
            return {
              error: "Conflict",
              message: error.message,
            };
          }
          if (error.message === "Invalid image URL") {
            set.status = 400;
            return {
              error: "Bad request",
              message: error.message,
            };
          }
        }

        set.status = 500;
        return {
          error: "Failed to update profile",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        image: t.Optional(t.String()),
        username: t.Optional(t.String({ maxLength: 50 })),
        displayUsername: t.Optional(t.String({ maxLength: 50 })),
      }),
    },
  );
