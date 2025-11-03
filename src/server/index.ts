import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { auth } from "@/lib/auth";
import { projectsRoutes } from "./routes/projects.routes";
import { collectRoutes } from "./routes/collect.routes";
import { initializeClickHouseTables } from "@/db/clickhouse";

initializeClickHouseTables().catch((error) => {
  console.warn(
    "ClickHouse initialization failed, analytics features will be unavailable:",
    error.message,
  );
});

export const app = new Elysia({ prefix: "/api" })
  .use(openapi())
  .get("/health", () => ({
    status: "ok",
    message: "INDEKS is running",
    timestamp: Date.now(),
  }))
  .all("/auth/*", ({ request }) => auth.handler(request))
  .use(projectsRoutes)
  .use(collectRoutes);
