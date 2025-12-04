import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { auth } from "@/lib/auth";
import { projectsRoutes } from "./routes/projects.routes";
import { collectRoutes } from "./routes/collect.routes";
import { analyticsRoutes } from "./routes/analytics.routes";
import { initializeClickHouseTables } from "@/db/clickhouse";

initializeClickHouseTables().catch((error) => {
  console.warn(
    "ClickHouse initialization failed, analytics features will be unavailable:",
    error.message,
  );
});

export const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "x-api-key",
        "Authorization",
        "User-Agent",
        "Accept",
        "Accept-Language",
        "Accept-Encoding",
        "Origin",
        "Referer",
        "X-Requested-With",
      ],
      exposeHeaders: ["*"],
      credentials: true,
      maxAge: 86400,
    })
  )
  .use(openapi())
  .get("/health", () => ({
    status: "ok",
    message: "INDEKS is running",
    timestamp: Date.now(),
  }))
  .get("/v1/health", () => ({
    status: "ok",
    message: "INDEKS API v1 is running",
    timestamp: Date.now(),
  }))
  // Better Auth routes - keep at /api/auth for compatibility with better-auth client
  .all("/auth/*", ({ request }) => auth.handler(request))
  .use(projectsRoutes)
  .use(collectRoutes)
  .use(analyticsRoutes);
