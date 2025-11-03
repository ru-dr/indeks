import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { auth } from "@/lib/auth";

export const app = new Elysia({ prefix: "/api" })
  .use(openapi())
  .get("/health", () => ({
    status: "ok",
    message: "INDEKS is running",
    timestamp: Date.now(),
  }))
  .all("/auth/*", ({ request }) => auth.handler(request));
