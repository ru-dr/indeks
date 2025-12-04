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

interface GeoData {
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

// Simple in-memory cache for geo lookups (to avoid hitting API too much)
const geoCache = new Map<string, { data: GeoData; timestamp: number }>();
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Generate SHA-256 hash of the public key
function generateKeyHash(publicKey: string): string {
  return createHash("sha256").update(publicKey).digest("hex");
}

// Lookup geo data from IP address using multiple geo services for reliability
async function getGeoFromIp(ip: string | null): Promise<GeoData> {
  const defaultGeo: GeoData = {
    country: null,
    city: null,
    latitude: null,
    longitude: null,
  };

  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    console.log(`🌍 Skipping geo lookup for local IP: ${ip}`);
    return defaultGeo;
  }

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL) {
    console.log(`🌍 Using cached geo data for IP: ${ip}`);
    return cached.data;
  }

  // Try multiple geo services in order of preference
  const geoServices = [
    // ipapi.co - supports HTTPS, free tier 1000/day
    async () => {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: AbortSignal.timeout(3000),
        headers: { 'User-Agent': 'indeks-analytics/1.0' },
      });
      if (!response.ok) throw new Error(`ipapi.co error: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.reason || 'ipapi.co error');
      return {
        country: data.country_name || null,
        city: data.city || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      };
    },
    // ip-api.com - HTTP only but very reliable, 45 req/min
    async () => {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,city,lat,lon`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) throw new Error(`ip-api.com error: ${response.status}`);
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'ip-api.com failed');
      return {
        country: data.country || null,
        city: data.city || null,
        latitude: data.lat || null,
        longitude: data.lon || null,
      };
    },
    // ipwho.is - supports HTTPS, unlimited free
    async () => {
      const response = await fetch(`https://ipwho.is/${ip}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) throw new Error(`ipwho.is error: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'ipwho.is failed');
      return {
        country: data.country || null,
        city: data.city || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      };
    },
  ];

  for (const service of geoServices) {
    try {
      const geoData = await service();
      
      // Validate we got actual data
      if (geoData.country || geoData.latitude) {
        // Cache the result
        geoCache.set(ip, { data: geoData, timestamp: Date.now() });
        console.log(`🌍 Geo lookup success for IP ${ip}:`, geoData);
        return geoData;
      }
    } catch (error) {
      // Try next service
      console.warn(`🌍 Geo service failed for IP ${ip}:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  // All services failed
  console.warn(`🌍 All geo services failed for IP: ${ip}`);
  return defaultGeo;
}

export const collectController = {
  // Collect analytics events
  async collectEvents(apiKey: string, data: CollectRequest, clientIp: string | null = null) {
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

    // Get geo data from IP (only once per request, not per event)
    const geoData = await getGeoFromIp(clientIp);

    // Debug: Log first received event
    if (process.env.NODE_ENV === 'development' && data.events.length > 0) {
      console.log('📥 Received event from SDK:', JSON.stringify(data.events[0], null, 2));
      console.log('🌍 Geo data:', geoData);
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
      // Geo data
      country: geoData.country,
      city: geoData.city,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
      ipAddress: clientIp,
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

        // Ensure metadata is valid JSON object (not stringified)
        let metadataObj: Record<string, unknown>;
        try {
          metadataObj = event.metadata || {};
        } catch (err) {
          console.error('Invalid metadata:', event.metadata);
          metadataObj = {};
        }

        return {
          project_id: event.projectId,
          event_type: event.eventType,
          url: event.url || null,
          session_id: event.sessionId || null,
          user_id: event.userId || null,
          user_agent: event.userAgent || null,
          referrer: event.referrer || null,
          metadata: JSON.stringify(metadataObj), // Must be JSON string for ClickHouse
          country: event.country,
          city: event.city,
          latitude: event.latitude,
          longitude: event.longitude,
          ip_address: event.ipAddress,
          timestamp: timestampStr,
        };
      });

      // Implement batching for large inserts
      const BATCH_SIZE = 500;
      for (let i = 0; i < values.length; i += BATCH_SIZE) {
        const batch = values.slice(i, i + BATCH_SIZE);
        
        // Debug: Log first event to see format
        if (process.env.NODE_ENV === 'development' && batch.length > 0) {
          console.log('📤 Sending to ClickHouse:', JSON.stringify(batch[0], null, 2));
        }
        
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
