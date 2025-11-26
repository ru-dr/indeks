import { Elysia, t } from "elysia";
import { collectController } from "@/server/controllers/collect.controller";

export const collectRoutes = new Elysia({ prefix: "/v1/collect" })
  // Collect analytics events
  .post(
    "/",
    async ({ body, headers, set, request }) => {
      const apiKey = headers["x-api-key"];

      if (!apiKey) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "API key is required in x-api-key header",
        };
      }

      // Extract IP address from headers (works with proxies like Vercel, Cloudflare)
      const forwardedFor = headers["x-forwarded-for"];
      const realIp = headers["x-real-ip"];
      const cfConnectingIp = headers["cf-connecting-ip"];
      
      let clientIp = cfConnectingIp || realIp || 
        (forwardedFor ? forwardedFor.split(",")[0].trim() : null) ||
        null;

      try {
        const result = await collectController.collectEvents(apiKey, body, clientIp);

        return {
          success: true,
          message: result.message,
          ingestedCount: result.ingestedCount,
        };
      } catch (error) {
        console.error("Error collecting events:", error);

        if (error instanceof Error) {
          if (error.message === "Invalid API key") {
            set.status = 403;
            return {
              error: "Forbidden",
              message: "Invalid API key",
            };
          }

          if (error.message === "Project is inactive") {
            set.status = 403;
            return {
              error: "Forbidden",
              message: "Project is inactive",
            };
          }

          if (
            error.message === "Events array is required and cannot be empty"
          ) {
            set.status = 400;
            return {
              error: "Bad Request",
              message: error.message,
            };
          }
        }

        set.status = 500;
        return {
          error: "Internal Server Error",
          message: "Failed to process events",
        };
      }
    },
    {
      body: t.Object({
        events: t.Array(
          t.Object({
            type: t.String(),
            url: t.Optional(t.String()),
            sessionId: t.Optional(t.String()),
            userId: t.Optional(t.String()),
            userAgent: t.Optional(t.String()),
            referrer: t.Optional(t.String()),
            properties: t.Optional(t.Record(t.String(), t.Unknown())),
            timestamp: t.Optional(t.Number()),
          }),
        ),
      }),
    },
  );
