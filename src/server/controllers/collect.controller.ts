import { db } from "@/db/connect";
import { projects } from "@/db/schema/schema";
import { clickhouse } from "@/db/clickhouse";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

interface AnalyticsEvent {
  type: string;
  url?: string;
  sessionId?: string;
  userId?: string;
  userAgent?: string;
  referrer?: string;
  properties?: Record<string, unknown>;
  timestamp?: number; // Unix timestamp in milliseconds
}

interface CollectRequest {
  events: AnalyticsEvent[];
}

// Generate SHA-256 hash of the public key
function generateKeyHash(publicKey: string): string {
  return createHash("sha256").update(publicKey).digest("hex");
}

export const collectController = {
  // Collect analytics events
  async collectEvents(apiKey: string, data: CollectRequest) {
    // Validate API key
    const keyHash = generateKeyHash(apiKey);

    const [project] = await db
      .select({
        id: projects.id,
        isActive: projects.isActive,
      })
      .from(projects)
      .where(eq(projects.keyHash, keyHash))
      .limit(1);

    if (!project) {
      throw new Error("Invalid API key");
    }

    if (!project.isActive) {
      throw new Error("Project is inactive");
    }

    // Validate events payload
    if (
      !data.events ||
      !Array.isArray(data.events) ||
      data.events.length === 0
    ) {
      throw new Error("Events array is required and cannot be empty");
    }

    // Process events
    const processedEvents = data.events.map((event) => ({
      projectId: project.id,
      eventType: event.type,
      url: event.url,
      sessionId: event.sessionId,
      userId: event.userId,
      userAgent: event.userAgent,
      referrer: event.referrer,
      metadata: event.properties || {},
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    }));

    // Store events in ClickHouse
    try {
      const values = processedEvents.map((event) => {
        // Validate projectId is a valid UUID
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            event.projectId,
          )
        ) {
          throw new Error(`Invalid project UUID: ${event.projectId}`);
        }

        // Format timestamp for ClickHouse DateTime (YYYY-MM-DD HH:MM:SS)
        const timestampStr = event.timestamp
          .toISOString()
          .replace("T", " ")
          .replace(/\.\d{3}Z$/, "");

        return {
          project_id: event.projectId,
          event_type: event.eventType,
          url: event.url || null,
          session_id: event.sessionId || null,
          user_id: event.userId || null,
          user_agent: event.userAgent || null,
          referrer: event.referrer || null,
          metadata: JSON.stringify(event.metadata),
          timestamp: timestampStr,
        };
      });

      // Implement batching for large inserts (ClickHouse can reject very large inserts)
      const BATCH_SIZE = 500;
      for (let i = 0; i < values.length; i += BATCH_SIZE) {
        const batch = values.slice(i, i + BATCH_SIZE);
        await clickhouse.insert({
          table: "events",
          values: batch,
          format: "JSONEachRow",
        });
      }

      console.log(
        `Successfully inserted ${processedEvents.length} events for project ${project.id}`,
      );
    } catch (storageError) {
      console.error("Failed to store events in ClickHouse:", storageError);
      console.error(
        "Project ID:",
        project.id,
        "Event count:",
        processedEvents.length,
      );
      throw new Error("Failed to store events");
    }

    return {
      success: true,
      message: "Events ingested successfully",
      ingestedCount: processedEvents.length,
    };
  },
};
