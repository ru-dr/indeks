import { db } from "@/db/connect";
import { clickhouse } from "@/db/clickhouse";
import {
  projects,
  analyticsDaily,
  analyticsTopPages,
  analyticsReferrers,
  analyticsDevices,
  analyticsEvents,
  analyticsClickedElements,
  analyticsSyncLog,
} from "@/db/schema/schema";
import { eq, and } from "drizzle-orm";

// Helper to parse user agent
function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet";
} {
  const ua = userAgent.toLowerCase();

  // Device type
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    deviceType = "tablet";
  } else if (
    /mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)
  ) {
    deviceType = "mobile";
  }

  // Browser
  let browser = "Unknown";
  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  // OS
  let os = "Unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  return { browser, os, deviceType };
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export const analyticsSyncService = {
  /**
   * Sync analytics data for a specific project and date
   */
  async syncProjectData(projectId: string, date: string): Promise<void> {
    console.log(`Starting sync for project ${projectId} on ${date}`);

    // Create sync log entry
    const [syncLog] = await db
      .insert(analyticsSyncLog)
      .values({
        projectId,
        syncDate: date,
        syncType: "daily",
        status: "in_progress",
      })
      .returning();

    try {
      // Fetch all events for this project and date from ClickHouse
      const eventsResult = await clickhouse.query({
        query: `
          SELECT 
            event_type,
            url,
            session_id,
            user_id,
            user_agent,
            referrer,
            metadata,
            timestamp
          FROM events 
          WHERE project_id = {projectId:UUID}
            AND toDate(timestamp) = {date:Date}
          ORDER BY timestamp
        `,
        query_params: {
          projectId,
          date,
        },
        format: "JSONEachRow",
      });

      type EventRow = {
        event_type: string;
        url: string | null;
        session_id: string | null;
        user_id: string | null;
        user_agent: string | null;
        referrer: string | null;
        metadata: string;
        timestamp: string;
      };

      const events = await eventsResult.json<EventRow>();

      if (events.length === 0) {
        console.log(`No events found for project ${projectId} on ${date}`);
        await db
          .update(analyticsSyncLog)
          .set({
            status: "success",
            recordsProcessed: 0,
            completedAt: new Date(),
          })
          .where(eq(analyticsSyncLog.id, syncLog.id));
        return;
      }

      // Process and aggregate the data
      const aggregatedData = this.aggregateEvents(events);

      // Delete existing data for this project and date (upsert pattern)
      await this.deleteExistingData(projectId, date);

      // Insert daily metrics
      await db.insert(analyticsDaily).values({
        projectId,
        date,
        pageViews: aggregatedData.pageViews,
        uniqueVisitors: aggregatedData.uniqueVisitors,
        sessions: aggregatedData.sessions,
        totalClicks: aggregatedData.totalClicks,
        totalScrolls: aggregatedData.totalScrolls,
        totalErrors: aggregatedData.totalErrors,
        avgSessionDuration: aggregatedData.avgSessionDuration,
        bounceRate: aggregatedData.bounceRate,
        avgScrollDepth: aggregatedData.avgScrollDepth,
        rageClicks: aggregatedData.rageClicks,
        deadClicks: aggregatedData.deadClicks,
        errorClicks: aggregatedData.errorClicks,
      });

      // Insert top pages
      if (aggregatedData.topPages.length > 0) {
        await db.insert(analyticsTopPages).values(
          aggregatedData.topPages.map((page) => ({
            projectId,
            date,
            url: page.url,
            pageViews: page.pageViews,
            uniqueVisitors: page.uniqueVisitors,
            avgTimeOnPage: page.avgTimeOnPage,
            bounceRate: page.bounceRate,
          }))
        );
      }

      // Insert referrers
      if (aggregatedData.referrers.length > 0) {
        await db.insert(analyticsReferrers).values(
          aggregatedData.referrers.map((ref) => ({
            projectId,
            date,
            referrer: ref.referrer,
            referrerDomain: ref.referrerDomain,
            visits: ref.visits,
            uniqueVisitors: ref.uniqueVisitors,
          }))
        );
      }

      // Insert device data
      if (aggregatedData.devices.length > 0) {
        await db.insert(analyticsDevices).values(
          aggregatedData.devices.map((device) => ({
            projectId,
            date,
            deviceType: device.deviceType,
            browser: device.browser,
            os: device.os,
            visits: device.visits,
            uniqueVisitors: device.uniqueVisitors,
          }))
        );
      }

      // Insert event breakdown
      if (aggregatedData.eventBreakdown.length > 0) {
        await db.insert(analyticsEvents).values(
          aggregatedData.eventBreakdown.map((event) => ({
            projectId,
            date,
            eventType: event.eventType,
            count: event.count,
            uniqueUsers: event.uniqueUsers,
          }))
        );
      }

      // Insert clicked elements
      if (aggregatedData.clickedElements.length > 0) {
        await db.insert(analyticsClickedElements).values(
          aggregatedData.clickedElements.map((element) => ({
            projectId,
            date,
            elementSelector: element.elementSelector,
            elementText: element.elementText,
            elementTag: element.elementTag,
            pageUrl: element.pageUrl,
            clickCount: element.clickCount,
            uniqueUsers: element.uniqueUsers,
          }))
        );
      }

      // Update sync log
      await db
        .update(analyticsSyncLog)
        .set({
          status: "success",
          recordsProcessed: events.length,
          completedAt: new Date(),
        })
        .where(eq(analyticsSyncLog.id, syncLog.id));

      console.log(
        `Sync completed for project ${projectId}: ${events.length} events processed`
      );
    } catch (error) {
      console.error(`Sync failed for project ${projectId}:`, error);

      await db
        .update(analyticsSyncLog)
        .set({
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        })
        .where(eq(analyticsSyncLog.id, syncLog.id));

      throw error;
    }
  },

  /**
   * Delete existing analytics data for a project and date
   */
  async deleteExistingData(projectId: string, date: string): Promise<void> {
    await db
      .delete(analyticsDaily)
      .where(
        and(eq(analyticsDaily.projectId, projectId), eq(analyticsDaily.date, date))
      );
    await db
      .delete(analyticsTopPages)
      .where(
        and(
          eq(analyticsTopPages.projectId, projectId),
          eq(analyticsTopPages.date, date)
        )
      );
    await db
      .delete(analyticsReferrers)
      .where(
        and(
          eq(analyticsReferrers.projectId, projectId),
          eq(analyticsReferrers.date, date)
        )
      );
    await db
      .delete(analyticsDevices)
      .where(
        and(
          eq(analyticsDevices.projectId, projectId),
          eq(analyticsDevices.date, date)
        )
      );
    await db
      .delete(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.projectId, projectId),
          eq(analyticsEvents.date, date)
        )
      );
    await db
      .delete(analyticsClickedElements)
      .where(
        and(
          eq(analyticsClickedElements.projectId, projectId),
          eq(analyticsClickedElements.date, date)
        )
      );
  },

  /**
   * Aggregate raw events into analytics metrics
   */
  aggregateEvents(
    events: {
      event_type: string;
      url: string | null;
      session_id: string | null;
      user_id: string | null;
      user_agent: string | null;
      referrer: string | null;
      metadata: string;
      timestamp: string;
    }[]
  ) {
    const uniqueUsers = new Set<string>();
    const uniqueSessions = new Set<string>();
    const pageViewsByUrl = new Map<
      string,
      { views: number; users: Set<string>; timeOnPage: number[] }
    >();
    const referrerCounts = new Map<
      string,
      { visits: number; users: Set<string> }
    >();
    const deviceCounts = new Map<
      string,
      { visits: number; users: Set<string> }
    >();
    const eventCounts = new Map<string, { count: number; users: Set<string> }>();
    const clickedElements = new Map<
      string,
      {
        text: string;
        tag: string;
        pageUrl: string;
        count: number;
        users: Set<string>;
      }
    >();
    const sessionData = new Map<
      string,
      { pageViews: number; startTime: number; endTime: number }
    >();
    const scrollDepths: number[] = [];

    let pageViews = 0;
    let totalClicks = 0;
    let totalScrolls = 0;
    let totalErrors = 0;
    let rageClicks = 0;
    let deadClicks = 0;
    let errorClicks = 0;

    for (const event of events) {
      // Use user_id if available, fallback to session_id for anonymous visitors
      const visitorId = event.user_id || event.session_id || "anonymous";
      const sessionId = event.session_id || "unknown";
      const timestamp = new Date(event.timestamp).getTime();

      uniqueUsers.add(visitorId);
      uniqueSessions.add(sessionId);

      // Parse metadata
      let metadata: Record<string, unknown> = {};
      try {
        metadata =
          typeof event.metadata === "string"
            ? JSON.parse(event.metadata)
            : event.metadata || {};
      } catch {
        metadata = {};
      }

      // Track session data
      if (!sessionData.has(sessionId)) {
        sessionData.set(sessionId, {
          pageViews: 0,
          startTime: timestamp,
          endTime: timestamp,
        });
      }
      const session = sessionData.get(sessionId)!;
      session.endTime = Math.max(session.endTime, timestamp);

      // Event type counts
      if (!eventCounts.has(event.event_type)) {
        eventCounts.set(event.event_type, { count: 0, users: new Set() });
      }
      const eventData = eventCounts.get(event.event_type)!;
      eventData.count++;
      eventData.users.add(visitorId);

      // Process by event type
      switch (event.event_type) {
        case "pageview":
          pageViews++;
          session.pageViews++;
          if (event.url) {
            if (!pageViewsByUrl.has(event.url)) {
              pageViewsByUrl.set(event.url, {
                views: 0,
                users: new Set(),
                timeOnPage: [],
              });
            }
            const pageData = pageViewsByUrl.get(event.url)!;
            pageData.views++;
            pageData.users.add(visitorId);
          }
          break;

        case "click":
          totalClicks++;
          const element = metadata.element as {
            tagName?: string;
            className?: string;
            id?: string;
            textContent?: string;
          } | undefined;
          if (element) {
            const selector =
              element.id
                ? `#${element.id}`
                : element.className
                ? `${element.tagName}.${element.className.split(" ")[0]}`
                : element.tagName || "unknown";

            if (!clickedElements.has(selector)) {
              clickedElements.set(selector, {
                text: element.textContent?.substring(0, 100) || "",
                tag: element.tagName || "",
                pageUrl: event.url || "",
                count: 0,
                users: new Set(),
              });
            }
            const clickData = clickedElements.get(selector)!;
            clickData.count++;
            clickData.users.add(visitorId);
          }
          break;

        case "scroll":
          totalScrolls++;
          const scrollPercentage = metadata.scrollPercentage as number;
          if (typeof scrollPercentage === "number") {
            scrollDepths.push(scrollPercentage);
          }
          break;

        case "scroll_depth":
          const depth = metadata.depth as number;
          if (typeof depth === "number") {
            scrollDepths.push(depth);
          }
          break;

        case "error":
          totalErrors++;
          break;

        case "rage_click":
          rageClicks++;
          break;

        case "dead_click":
          deadClicks++;
          break;

        case "error_click":
          errorClicks++;
          break;
      }

      // Track referrers
      if (event.referrer && event.event_type === "pageview") {
        if (!referrerCounts.has(event.referrer)) {
          referrerCounts.set(event.referrer, { visits: 0, users: new Set() });
        }
        const refData = referrerCounts.get(event.referrer)!;
        refData.visits++;
        refData.users.add(visitorId);
      }

      // Track devices
      if (event.user_agent) {
        const { browser, os, deviceType } = parseUserAgent(event.user_agent);
        const deviceKey = `${deviceType}|${browser}|${os}`;
        if (!deviceCounts.has(deviceKey)) {
          deviceCounts.set(deviceKey, { visits: 0, users: new Set() });
        }
        const deviceData = deviceCounts.get(deviceKey)!;
        deviceData.visits++;
        deviceData.users.add(visitorId);
      }
    }

    // Calculate session metrics
    let totalSessionDuration = 0;
    let bouncedSessions = 0;
    for (const [, session] of sessionData) {
      totalSessionDuration += (session.endTime - session.startTime) / 1000; // Convert to seconds
      if (session.pageViews === 1) {
        bouncedSessions++;
      }
    }

    const avgSessionDuration =
      sessionData.size > 0 ? totalSessionDuration / sessionData.size : 0;
    const bounceRate =
      sessionData.size > 0 ? (bouncedSessions / sessionData.size) * 100 : 0;
    const avgScrollDepth =
      scrollDepths.length > 0
        ? scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length
        : 0;

    // Convert maps to arrays
    const topPages = Array.from(pageViewsByUrl.entries())
      .map(([url, data]) => ({
        url,
        pageViews: data.views,
        uniqueVisitors: data.users.size,
        avgTimeOnPage: 0, // Would need more complex calculation
        bounceRate: 0,
      }))
      .sort((a, b) => b.pageViews - a.pageViews)
      .slice(0, 50);

    const referrers = Array.from(referrerCounts.entries())
      .map(([referrer, data]) => ({
        referrer,
        referrerDomain: extractDomain(referrer),
        visits: data.visits,
        uniqueVisitors: data.users.size,
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 50);

    const devices = Array.from(deviceCounts.entries()).map(([key, data]) => {
      const [deviceType, browser, os] = key.split("|");
      return {
        deviceType,
        browser,
        os,
        visits: data.visits,
        uniqueVisitors: data.users.size,
      };
    });

    const eventBreakdown = Array.from(eventCounts.entries())
      .map(([eventType, data]) => ({
        eventType,
        count: data.count,
        uniqueUsers: data.users.size,
      }))
      .sort((a, b) => b.count - a.count);

    const clickedElementsArray = Array.from(clickedElements.entries())
      .map(([selector, data]) => ({
        elementSelector: selector,
        elementText: data.text,
        elementTag: data.tag,
        pageUrl: data.pageUrl,
        clickCount: data.count,
        uniqueUsers: data.users.size,
      }))
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 100);

    return {
      pageViews,
      uniqueVisitors: uniqueUsers.size,
      sessions: uniqueSessions.size,
      totalClicks,
      totalScrolls,
      totalErrors,
      avgSessionDuration,
      bounceRate,
      avgScrollDepth,
      rageClicks,
      deadClicks,
      errorClicks,
      topPages,
      referrers,
      devices,
      eventBreakdown,
      clickedElements: clickedElementsArray,
    };
  },

  /**
   * Sync all active projects for a specific date
   */
  async syncAllProjects(date: string): Promise<void> {
    console.log(`Starting sync for all projects on ${date}`);

    const activeProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.isActive, true));

    console.log(`Found ${activeProjects.length} active projects`);

    for (const project of activeProjects) {
      try {
        await this.syncProjectData(project.id, date);
      } catch (error) {
        console.error(`Failed to sync project ${project.id}:`, error);
        // Continue with other projects
      }
    }

    console.log(`Completed sync for all projects on ${date}`);
  },

  /**
   * Sync yesterday's data (for scheduled jobs)
   */
  async syncYesterday(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];
    await this.syncAllProjects(dateStr);
  },

  /**
   * Sync today's data (for more frequent updates)
   */
  async syncToday(): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    await this.syncAllProjects(today);
  },
};
