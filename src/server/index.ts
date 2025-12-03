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
  .all("/auth/*", ({ request }) => auth.handler(request))
  .use(projectsRoutes)
  .use(collectRoutes)
  .use(analyticsRoutes);
