import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connect";
import {
  uptimeMonitors,
  uptimeChecks,
  uptimeIncidents,
  uptimeDaily,
} from "@/db/schema/schema";
import { eq, and, sql } from "drizzle-orm";
import { notificationService } from "@/services/notification.service";

async function performCheck(monitor: typeof uptimeMonitors.$inferSelect) {
  const startTime = Date.now();
  let status = "up";
  let statusCode: number | null = null;
  let errorMessage: string | null = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      monitor.timeout * 1000,
    );

    const response = await fetch(monitor.url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "Indeks-Uptime-Monitor/1.0" },
    });

    clearTimeout(timeoutId);
    statusCode = response.status;

    if (response.status !== monitor.expectedStatusCode) {
      status = "down";
      errorMessage = `Expected status ${monitor.expectedStatusCode}, got ${response.status}`;
    }
  } catch (err: unknown) {
    status = "down";
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        errorMessage = "Request timed out";
      } else {
        errorMessage = err.message || "Connection failed";
      }
    } else {
      errorMessage = "Connection failed";
    }
  }

  const responseTime = Date.now() - startTime;

  if (status === "up" && responseTime > 2000) {
    status = "degraded";
  }

  return { status, statusCode, responseTime, errorMessage };
}

async function updateDailyStats(
  monitorId: string,
  status: string,
  responseTime: number,
) {
  const today = new Date().toISOString().split("T")[0];

  const existing = await db
    .select()
    .from(uptimeDaily)
    .where(
      and(eq(uptimeDaily.monitorId, monitorId), eq(uptimeDaily.date, today)),
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(uptimeDaily).values({
      monitorId,
      date: today,
      totalChecks: 1,
      successfulChecks: status === "up" || status === "degraded" ? 1 : 0,
      failedChecks: status === "down" ? 1 : 0,
      uptimePercentage: status === "down" ? 0 : 100,
      avgResponseTime: responseTime,
      minResponseTime: responseTime,
      maxResponseTime: responseTime,
      incidentsCount: 0,
      totalDowntimeSeconds: 0,
    });
  } else {
    const record = existing[0];
    const newTotalChecks = record.totalChecks + 1;
    const newSuccessfulChecks =
      record.successfulChecks +
      (status === "up" || status === "degraded" ? 1 : 0);
    const newFailedChecks = record.failedChecks + (status === "down" ? 1 : 0);
    const newUptimePercentage = (newSuccessfulChecks / newTotalChecks) * 100;

    const newAvgResponseTime = Math.round(
      ((record.avgResponseTime || 0) * record.totalChecks + responseTime) /
        newTotalChecks,
    );

    await db
      .update(uptimeDaily)
      .set({
        totalChecks: newTotalChecks,
        successfulChecks: newSuccessfulChecks,
        failedChecks: newFailedChecks,
        uptimePercentage: Math.round(newUptimePercentage * 100) / 100,
        avgResponseTime: newAvgResponseTime,
        minResponseTime: Math.min(
          record.minResponseTime || responseTime,
          responseTime,
        ),
        maxResponseTime: Math.max(
          record.maxResponseTime || responseTime,
          responseTime,
        ),
      })
      .where(eq(uptimeDaily.id, record.id));
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const monitorsToCheck = await db
      .select()
      .from(uptimeMonitors)
      .where(
        and(
          eq(uptimeMonitors.isActive, true),
          eq(uptimeMonitors.isPaused, false),
        ),
      );

    const monitorsNeedingCheck = monitorsToCheck.filter((monitor) => {
      if (!monitor.lastCheckedAt) return true;
      const lastCheck = new Date(monitor.lastCheckedAt);
      const secondsSinceLastCheck =
        (now.getTime() - lastCheck.getTime()) / 1000;
      return secondsSinceLastCheck >= monitor.checkInterval;
    });

    const results = [];

    for (const monitor of monitorsNeedingCheck) {
      const { status, statusCode, responseTime, errorMessage } =
        await performCheck(monitor);

      const [check] = await db
        .insert(uptimeChecks)
        .values({
          monitorId: monitor.id,
          status,
          statusCode,
          responseTime,
          errorMessage,
        })
        .returning();

      await updateDailyStats(monitor.id, status, responseTime);

      const previousStatus = monitor.currentStatus;
      const statusChanged = previousStatus !== status;

      await db
        .update(uptimeMonitors)
        .set({
          currentStatus: status,
          lastCheckedAt: now,
          ...(statusChanged && { lastStatusChange: now }),
        })
        .where(eq(uptimeMonitors.id, monitor.id));

      if (statusChanged) {
        if (status === "down") {
          await db.insert(uptimeIncidents).values({
            monitorId: monitor.id,
            status: "ongoing",
            cause: errorMessage || "Unknown",
          });

          const today = new Date().toISOString().split("T")[0];
          await db
            .update(uptimeDaily)
            .set({
              incidentsCount: sql`${uptimeDaily.incidentsCount} + 1`,
            })
            .where(
              and(
                eq(uptimeDaily.monitorId, monitor.id),
                eq(uptimeDaily.date, today),
              ),
            );

          try {
            await notificationService.sendUptimeAlert({
              monitorId: monitor.id,
              status: "down",
              monitorName: monitor.name,
              monitorUrl: monitor.url,
              errorMessage: errorMessage || undefined,
              projectId: monitor.projectId,
            });
          } catch (notifyError) {
            console.error("Failed to send uptime notification:", notifyError);
          }
        } else if (previousStatus === "down") {
          const ongoingIncident = await db
            .select()
            .from(uptimeIncidents)
            .where(
              and(
                eq(uptimeIncidents.monitorId, monitor.id),
                eq(uptimeIncidents.status, "ongoing"),
              ),
            )
            .limit(1);

          if (ongoingIncident.length > 0) {
            const duration = Math.floor(
              (now.getTime() -
                new Date(ongoingIncident[0].startedAt).getTime()) /
                1000,
            );

            await db
              .update(uptimeIncidents)
              .set({
                status: "resolved",
                resolvedAt: now,
                durationSeconds: duration,
              })
              .where(eq(uptimeIncidents.id, ongoingIncident[0].id));

            const today = new Date().toISOString().split("T")[0];
            await db
              .update(uptimeDaily)
              .set({
                totalDowntimeSeconds: sql`${uptimeDaily.totalDowntimeSeconds} + ${duration}`,
              })
              .where(
                and(
                  eq(uptimeDaily.monitorId, monitor.id),
                  eq(uptimeDaily.date, today),
                ),
              );
          }

          try {
            await notificationService.sendUptimeAlert({
              monitorId: monitor.id,
              status: "up",
              monitorName: monitor.name,
              monitorUrl: monitor.url,
              projectId: monitor.projectId,
            });
          } catch (notifyError) {
            console.error("Failed to send uptime notification:", notifyError);
          }
        }

        if (status === "degraded" && previousStatus !== "degraded") {
          try {
            await notificationService.sendUptimeAlert({
              monitorId: monitor.id,
              status: "degraded",
              monitorName: monitor.name,
              monitorUrl: monitor.url,
              projectId: monitor.projectId,
            });
          } catch (notifyError) {
            console.error("Failed to send uptime notification:", notifyError);
          }
        }
      }

      results.push({
        monitorId: monitor.id,
        name: monitor.name,
        url: monitor.url,
        status,
        statusCode,
        responseTime,
        statusChanged,
        previousStatus,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${results.length} monitors`,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("Uptime check failed:", error);
    return NextResponse.json(
      {
        error: "Check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
