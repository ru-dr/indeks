import { db } from "@/db/connect";
import {
  projects,
  analyticsDaily,
  analyticsTopPages,
  analyticsReferrers,
  analyticsDevices,
  analyticsEvents,
  analyticsClickedElements,
} from "@/db/schema/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { analyticsSyncService } from "@/services/analytics-sync.service";

interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

interface PaginatedQuery extends DateRangeQuery {
  limit?: string;
}

export const analyticsController = {
  async verifyProject(projectId: string) {
    const [project] = await db
      .select({ id: projects.id, userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    return project;
  },

  async getOverview(projectId: string, query: DateRangeQuery) {
    const { startDate, endDate } = query;

    const project = await this.verifyProject(projectId);
    if (!project) {
      return { error: "Project not found", status: 404 };
    }

    const dailyMetrics = await db
      .select({
        totalPageViews: sql<number>`SUM(${analyticsDaily.pageViews})`,
        totalUniqueVisitors: sql<number>`SUM(${analyticsDaily.uniqueVisitors})`,
        totalSessions: sql<number>`SUM(${analyticsDaily.sessions})`,
        totalClicks: sql<number>`SUM(${analyticsDaily.totalClicks})`,
        avgBounceRate: sql<number>`AVG(${analyticsDaily.bounceRate})`,
        avgSessionDuration: sql<number>`AVG(${analyticsDaily.avgSessionDuration})`,
        totalRageClicks: sql<number>`SUM(${analyticsDaily.rageClicks})`,
        totalDeadClicks: sql<number>`SUM(${analyticsDaily.deadClicks})`,
        totalErrors: sql<number>`SUM(${analyticsDaily.totalErrors})`,
      })
      .from(analyticsDaily)
      .where(
        and(
          eq(analyticsDaily.projectId, projectId),
          startDate ? gte(analyticsDaily.date, startDate) : undefined,
          endDate ? lte(analyticsDaily.date, endDate) : undefined,
        ),
      );

    const dailyBreakdown = await db
      .select({
        date: analyticsDaily.date,
        pageViews: analyticsDaily.pageViews,
        uniqueVisitors: analyticsDaily.uniqueVisitors,
        sessions: analyticsDaily.sessions,
        bounceRate: analyticsDaily.bounceRate,
      })
      .from(analyticsDaily)
      .where(
        and(
          eq(analyticsDaily.projectId, projectId),
          startDate ? gte(analyticsDaily.date, startDate) : undefined,
          endDate ? lte(analyticsDaily.date, endDate) : undefined,
        ),
      )
      .orderBy(analyticsDaily.date);

    return {
      summary: dailyMetrics[0] || {
        totalPageViews: 0,
        totalUniqueVisitors: 0,
        totalSessions: 0,
        totalClicks: 0,
        avgBounceRate: 0,
        avgSessionDuration: 0,
        totalRageClicks: 0,
        totalDeadClicks: 0,
        totalErrors: 0,
      },
      dailyBreakdown,
    };
  },

  async getTopPages(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "20" } = query;

    const pages = await db
      .select({
        url: analyticsTopPages.url,
        totalPageViews: sql<number>`SUM(${analyticsTopPages.pageViews})`,
        totalUniqueVisitors: sql<number>`SUM(${analyticsTopPages.uniqueVisitors})`,
        avgTimeOnPage: sql<number>`AVG(${analyticsTopPages.avgTimeOnPage})`,
      })
      .from(analyticsTopPages)
      .where(
        and(
          eq(analyticsTopPages.projectId, projectId),
          startDate ? gte(analyticsTopPages.date, startDate) : undefined,
          endDate ? lte(analyticsTopPages.date, endDate) : undefined,
        ),
      )
      .groupBy(analyticsTopPages.url)
      .orderBy(desc(sql`SUM(${analyticsTopPages.pageViews})`))
      .limit(parseInt(limit));

    return { pages };
  },

  async getReferrers(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "20" } = query;

    const referrers = await db
      .select({
        referrer: analyticsReferrers.referrer,
        referrerDomain: analyticsReferrers.referrerDomain,
        totalVisits: sql<number>`SUM(${analyticsReferrers.visits})`,
        totalUniqueVisitors: sql<number>`SUM(${analyticsReferrers.uniqueVisitors})`,
      })
      .from(analyticsReferrers)
      .where(
        and(
          eq(analyticsReferrers.projectId, projectId),
          startDate ? gte(analyticsReferrers.date, startDate) : undefined,
          endDate ? lte(analyticsReferrers.date, endDate) : undefined,
        ),
      )
      .groupBy(analyticsReferrers.referrer, analyticsReferrers.referrerDomain)
      .orderBy(desc(sql`SUM(${analyticsReferrers.visits})`))
      .limit(parseInt(limit));

    return { referrers };
  },

  async getDevices(projectId: string, query: DateRangeQuery) {
    const { startDate, endDate } = query;

    const devices = await db
      .select({
        deviceType: analyticsDevices.deviceType,
        browser: analyticsDevices.browser,
        os: analyticsDevices.os,
        totalVisits: sql<number>`SUM(${analyticsDevices.visits})`,
        totalUniqueVisitors: sql<number>`SUM(${analyticsDevices.uniqueVisitors})`,
      })
      .from(analyticsDevices)
      .where(
        and(
          eq(analyticsDevices.projectId, projectId),
          startDate ? gte(analyticsDevices.date, startDate) : undefined,
          endDate ? lte(analyticsDevices.date, endDate) : undefined,
        ),
      )
      .groupBy(
        analyticsDevices.deviceType,
        analyticsDevices.browser,
        analyticsDevices.os,
      )
      .orderBy(desc(sql`SUM(${analyticsDevices.visits})`));

    const deviceTypeBreakdown = await db
      .select({
        deviceType: analyticsDevices.deviceType,
        totalVisits: sql<number>`SUM(${analyticsDevices.visits})`,
      })
      .from(analyticsDevices)
      .where(
        and(
          eq(analyticsDevices.projectId, projectId),
          startDate ? gte(analyticsDevices.date, startDate) : undefined,
          endDate ? lte(analyticsDevices.date, endDate) : undefined,
        ),
      )
      .groupBy(analyticsDevices.deviceType);

    return { devices, deviceTypeBreakdown };
  },

  async getEvents(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "50" } = query;

    const events = await db
      .select({
        eventType: analyticsEvents.eventType,
        totalCount: sql<number>`SUM(${analyticsEvents.count})`,
        totalUniqueUsers: sql<number>`SUM(${analyticsEvents.uniqueUsers})`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.projectId, projectId),
          startDate ? gte(analyticsEvents.date, startDate) : undefined,
          endDate ? lte(analyticsEvents.date, endDate) : undefined,
        ),
      )
      .groupBy(analyticsEvents.eventType)
      .orderBy(desc(sql`SUM(${analyticsEvents.count})`))
      .limit(parseInt(limit));

    return { events };
  },

  async getClickedElements(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "50" } = query;

    const clicks = await db
      .select({
        elementSelector: analyticsClickedElements.elementSelector,
        elementText: analyticsClickedElements.elementText,
        elementTag: analyticsClickedElements.elementTag,
        pageUrl: analyticsClickedElements.pageUrl,
        totalClicks: sql<number>`SUM(${analyticsClickedElements.clickCount})`,
        totalUniqueUsers: sql<number>`SUM(${analyticsClickedElements.uniqueUsers})`,
      })
      .from(analyticsClickedElements)
      .where(
        and(
          eq(analyticsClickedElements.projectId, projectId),
          startDate ? gte(analyticsClickedElements.date, startDate) : undefined,
          endDate ? lte(analyticsClickedElements.date, endDate) : undefined,
        ),
      )
      .groupBy(
        analyticsClickedElements.elementSelector,
        analyticsClickedElements.elementText,
        analyticsClickedElements.elementTag,
        analyticsClickedElements.pageUrl,
      )
      .orderBy(desc(sql`SUM(${analyticsClickedElements.clickCount})`))
      .limit(parseInt(limit));

    return { clicks };
  },

  async triggerSync(projectId: string, date?: string) {
    const project = await this.verifyProject(projectId);
    if (!project) {
      return { error: "Project not found", status: 404 };
    }

    const syncDate = date || new Date().toISOString().split("T")[0];

    analyticsSyncService.syncProjectData(projectId, syncDate).catch((err) => {
      console.error("Background sync failed:", err);
    });

    return {
      success: true,
      message: `Sync started for ${syncDate}`,
    };
  },

  async getRealtimeStats(projectId: string) {
    const { clickhouse } = await import("@/db/clickhouse");

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "");

    const realtimeResult = await clickhouse.query({
      query: `
        SELECT 
          count() as total_events,
          countIf(event_type = 'pageview') as page_views,
          uniq(user_id) as active_users,
          uniq(session_id) as active_sessions
        FROM events 
        WHERE project_id = {projectId:UUID}
          AND timestamp >= {since:DateTime}
      `,
      query_params: {
        projectId,
        since: thirtyMinutesAgo,
      },
      format: "JSONEachRow",
    });

    const [realtime] = await realtimeResult.json<
      {
        total_events: number;
        page_views: number;
        active_users: number;
        active_sessions: number;
      }[]
    >();

    const recentEventsResult = await clickhouse.query({
      query: `
        SELECT 
          event_type,
          url,
          timestamp,
          country,
          city,
          user_agent,
          referrer,
          session_id
        FROM events 
        WHERE project_id = {projectId:UUID}
          AND timestamp >= {since:DateTime}
        ORDER BY timestamp DESC
        LIMIT 20
      `,
      query_params: {
        projectId,
        since: thirtyMinutesAgo,
      },
      format: "JSONEachRow",
    });

    const recentEvents = await recentEventsResult.json<
      {
        event_type: string;
        url: string | null;
        timestamp: string;
        country: string | null;
        city: string | null;
        user_agent: string | null;
        referrer: string | null;
        session_id: string | null;
      }[]
    >();

    const devicesResult = await clickhouse.query({
      query: `
        SELECT 
          CASE
            WHEN user_agent LIKE '%Mobile%' OR user_agent LIKE '%Android%' OR user_agent LIKE '%iPhone%' OR user_agent LIKE '%iPad%' THEN 'mobile'
            WHEN user_agent LIKE '%Tablet%' THEN 'tablet'
            ELSE 'desktop'
          END as device_type,
          count() as totalVisits
        FROM events 
        WHERE project_id = {projectId:UUID}
          AND timestamp >= {since:DateTime}
          AND user_agent IS NOT NULL
          AND user_agent != ''
        GROUP BY device_type
        ORDER BY totalVisits DESC
      `,
      query_params: {
        projectId,
        since: thirtyMinutesAgo,
      },
      format: "JSONEachRow",
    });

    const devices = await devicesResult.json<{
      device_type: string;
      totalVisits: number;
    }>();

    return {
      realtime: realtime || {
        total_events: 0,
        page_views: 0,
        active_users: 0,
        active_sessions: 0,
      },
      recentEvents,
      devices: (devices || []).map((d) => ({
        deviceType: d.device_type,
        totalVisits: d.totalVisits,
      })),
    };
  },

  async getLocations(projectId: string) {
    const { clickhouse } = await import("@/db/clickhouse");

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "");

    const locationsResult = await clickhouse.query({
      query: `
        SELECT 
          country,
          city,
          latitude,
          longitude,
          count() as event_count,
          uniq(session_id) as visitor_count
        FROM events 
        WHERE project_id = {projectId:UUID}
          AND timestamp >= {since:DateTime}
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
        GROUP BY country, city, latitude, longitude
        ORDER BY visitor_count DESC
        LIMIT 50
      `,
      query_params: {
        projectId,
        since: thirtyMinutesAgo,
      },
      format: "JSONEachRow",
    });

    const locations = await locationsResult.json<{
      country: string | null;
      city: string | null;
      latitude: number;
      longitude: number;
      event_count: number;
      visitor_count: number;
    }>();

    const countriesResult = await clickhouse.query({
      query: `
        SELECT 
          country,
          count() as event_count,
          uniq(session_id) as visitor_count
        FROM events 
        WHERE project_id = {projectId:UUID}
          AND timestamp >= {since:DateTime}
          AND country IS NOT NULL
          AND country != ''
        GROUP BY country
        ORDER BY visitor_count DESC
        LIMIT 20
      `,
      query_params: {
        projectId,
        since: thirtyMinutesAgo,
      },
      format: "JSONEachRow",
    });

    const countries = await countriesResult.json<{
      country: string;
      event_count: number;
      visitor_count: number;
    }>();

    return {
      locations: locations || [],
      countries: countries || [],
    };
  },

  async getTrafficTrend(projectId: string, months: string = "8") {
    const monthCount = parseInt(months);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthCount);
    const startDateStr = startDate.toISOString().split("T")[0];

    const dailyData = await db
      .select({
        date: analyticsDaily.date,
        pageViews: analyticsDaily.pageViews,
        sessions: analyticsDaily.sessions,
        uniqueVisitors: analyticsDaily.uniqueVisitors,
      })
      .from(analyticsDaily)
      .where(
        and(
          eq(analyticsDaily.projectId, projectId),
          gte(analyticsDaily.date, startDateStr),
        ),
      )
      .orderBy(analyticsDaily.date);

    return {
      dailyData: dailyData.map((d) => ({
        date: d.date,
        count: (d.pageViews || 0) + (d.sessions || 0),
      })),
    };
  },

  async getGlobalTrafficTrend(months: string = "8") {
    const monthCount = parseInt(months);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthCount);
    const startDateStr = startDate.toISOString().split("T")[0];

    const dailyData = await db
      .select({
        date: analyticsDaily.date,
        totalCount: sql<number>`SUM(${analyticsDaily.pageViews}) + SUM(${analyticsDaily.sessions})`,
      })
      .from(analyticsDaily)
      .where(gte(analyticsDaily.date, startDateStr))
      .groupBy(analyticsDaily.date)
      .orderBy(analyticsDaily.date);

    return {
      dailyData: dailyData.map((d) => ({
        date: d.date,
        count: d.totalCount || 0,
      })),
    };
  },

  async getGlobalLocations() {
    const { clickhouse } = await import("@/db/clickhouse");

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "");

    const locationsResult = await clickhouse.query({
      query: `
        SELECT 
          country,
          city,
          latitude,
          longitude,
          count() as event_count,
          uniq(session_id) as visitor_count
        FROM events 
        WHERE timestamp >= {since:DateTime}
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
        GROUP BY country, city, latitude, longitude
        ORDER BY visitor_count DESC
        LIMIT 100
      `,
      query_params: {
        since: thirtyMinutesAgo,
      },
      format: "JSONEachRow",
    });

    const locations = await locationsResult.json<{
      country: string | null;
      city: string | null;
      latitude: number;
      longitude: number;
      event_count: number;
      visitor_count: number;
    }>();

    return {
      locations: locations || [],
    };
  },
};
