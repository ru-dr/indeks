import { db } from "@/db/connect";
import {
  projects,
  analyticsDaily,
  analyticsTopPages,
  analyticsReferrers,
  analyticsDevices,
  analyticsEvents,
  analyticsClickedElements,
  analyticsTrafficSources,
  analyticsFormEvents,
  analyticsEngagement,
  analyticsPerformance,
  analyticsScrollDepth,
  analyticsErrors,
  analyticsMedia,
  analyticsOutbound,
  analyticsSearch,
  analyticsCustomEvents,
  analyticsSessions,
  analyticsVisitors,
  member,
  projectAccess,
} from "@/db/schema/schema";
import { eq, and, gte, lte, desc, sql, or, inArray, isNull } from "drizzle-orm";
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
        referrer: sql<string>`MIN(${analyticsReferrers.referrer})`,
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
      .groupBy(analyticsReferrers.referrerDomain)
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

  /**
   * Get traffic trend for all projects the user has access to
   * This includes:
   * - Projects owned by the user (personal projects)
   * - Projects in organizations the user is a member of
   * - Projects explicitly shared with the user
   */
  async getUserTrafficTrend(userId: string, months: string = "8") {
    const monthCount = parseInt(months);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthCount);
    const startDateStr = startDate.toISOString().split("T")[0];

    
    const userMemberships = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, userId));
    const orgIds = userMemberships.map((m) => m.organizationId);

    
    let accessProjectIds: string[] = [];
    try {
      const accessRecords = await db
        .select({ projectId: projectAccess.projectId })
        .from(projectAccess)
        .where(eq(projectAccess.userId, userId));
      accessProjectIds = accessRecords.map((a) => a.projectId);
    } catch (error: any) {
      
      if (error?.cause?.code !== "42P01") {
        throw error;
      }
    }

    
    const conditions = [];

    
    conditions.push(
      and(eq(projects.userId, userId), isNull(projects.organizationId)),
    );

    
    if (orgIds.length > 0) {
      conditions.push(inArray(projects.organizationId, orgIds));
    }

    
    if (accessProjectIds.length > 0) {
      conditions.push(inArray(projects.id, accessProjectIds));
    }

    
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(or(...conditions));

    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return { dailyData: [] };
    }

    const dailyData = await db
      .select({
        date: analyticsDaily.date,
        totalCount: sql<number>`SUM(${analyticsDaily.pageViews}) + SUM(${analyticsDaily.sessions})`,
      })
      .from(analyticsDaily)
      .where(
        and(
          gte(analyticsDaily.date, startDateStr),
          inArray(analyticsDaily.projectId, projectIds),
        ),
      )
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

  async getTrafficSources(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "20" } = query;

    const sources = await db
      .select({
        trafficSource: analyticsTrafficSources.trafficSource,
        utmSource: analyticsTrafficSources.utmSource,
        utmMedium: analyticsTrafficSources.utmMedium,
        utmCampaign: analyticsTrafficSources.utmCampaign,
        totalSessions: sql<number>`SUM(${analyticsTrafficSources.sessions})`,
        totalVisitors: sql<number>`SUM(${analyticsTrafficSources.uniqueVisitors})`,
        totalConversions: sql<number>`SUM(${analyticsTrafficSources.conversions})`,
      })
      .from(analyticsTrafficSources)
      .where(
        and(
          eq(analyticsTrafficSources.projectId, projectId),
          startDate ? gte(analyticsTrafficSources.date, startDate) : undefined,
          endDate ? lte(analyticsTrafficSources.date, endDate) : undefined,
        ),
      )
      .groupBy(
        analyticsTrafficSources.trafficSource,
        analyticsTrafficSources.utmSource,
        analyticsTrafficSources.utmMedium,
        analyticsTrafficSources.utmCampaign,
      )
      .orderBy(desc(sql`SUM(${analyticsTrafficSources.sessions})`))
      .limit(parseInt(limit));

    return { sources };
  },

  async getFormAnalytics(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "20" } = query;

    const forms = await db
      .select({
        formId: analyticsFormEvents.formId,
        pageUrl: analyticsFormEvents.pageUrl,
        totalSubmissions: sql<number>`SUM(${analyticsFormEvents.submissions})`,
        totalAbandonments: sql<number>`SUM(${analyticsFormEvents.abandonments})`,
        totalErrors: sql<number>`SUM(${analyticsFormEvents.errors})`,
        avgTimeToComplete: sql<number>`AVG(${analyticsFormEvents.avgTimeToComplete})`,
        avgFieldsCompleted: sql<number>`AVG(${analyticsFormEvents.avgFieldsCompleted})`,
        totalUsers: sql<number>`SUM(${analyticsFormEvents.uniqueUsers})`,
      })
      .from(analyticsFormEvents)
      .where(
        and(
          eq(analyticsFormEvents.projectId, projectId),
          startDate ? gte(analyticsFormEvents.date, startDate) : undefined,
          endDate ? lte(analyticsFormEvents.date, endDate) : undefined,
        ),
      )
      .groupBy(analyticsFormEvents.formId, analyticsFormEvents.pageUrl)
      .orderBy(desc(sql`SUM(${analyticsFormEvents.submissions})`))
      .limit(parseInt(limit));

    return { forms };
  },

  async getEngagementIssues(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "50" } = query;

    const issues = await db
      .select({
        eventType: analyticsEngagement.eventType,
        elementSelector: analyticsEngagement.elementSelector,
        pageUrl: analyticsEngagement.pageUrl,
        reason: analyticsEngagement.reason,
        totalCount: sql<number>`SUM(${analyticsEngagement.count})`,
        totalUsers: sql<number>`SUM(${analyticsEngagement.uniqueUsers})`,
      })
      .from(analyticsEngagement)
      .where(
        and(
          eq(analyticsEngagement.projectId, projectId),
          startDate ? gte(analyticsEngagement.date, startDate) : undefined,
          endDate ? lte(analyticsEngagement.date, endDate) : undefined,
        ),
      )
      .groupBy(
        analyticsEngagement.eventType,
        analyticsEngagement.elementSelector,
        analyticsEngagement.pageUrl,
        analyticsEngagement.reason,
      )
      .orderBy(desc(sql`SUM(${analyticsEngagement.count})`))
      .limit(parseInt(limit));

    return { issues };
  },

  async getPerformanceMetrics(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "20" } = query;

    const performance = await db
      .select({
        pageUrl: analyticsPerformance.pageUrl,
        avgLoadTime: sql<number>`AVG(${analyticsPerformance.avgLoadTime})`,
        avgFcp: sql<number>`AVG(${analyticsPerformance.avgFcp})`,
        avgLcp: sql<number>`AVG(${analyticsPerformance.avgLcp})`,
        avgFid: sql<number>`AVG(${analyticsPerformance.avgFid})`,
        avgCls: sql<number>`AVG(${analyticsPerformance.avgCls})`,
        avgTtfb: sql<number>`AVG(${analyticsPerformance.avgTtfb})`,
        totalSamples: sql<number>`SUM(${analyticsPerformance.sampleCount})`,
      })
      .from(analyticsPerformance)
      .where(
        and(
          eq(analyticsPerformance.projectId, projectId),
          startDate ? gte(analyticsPerformance.date, startDate) : undefined,
          endDate ? lte(analyticsPerformance.date, endDate) : undefined,
        ),
      )
      .groupBy(analyticsPerformance.pageUrl)
      .orderBy(desc(sql`SUM(${analyticsPerformance.sampleCount})`))
      .limit(parseInt(limit));

    return { performance };
  },

  async getScrollDepthAnalytics(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "20" } = query;

    const scrollData = await db
      .select({
        pageUrl: analyticsScrollDepth.pageUrl,
        reached25: sql<number>`SUM(${analyticsScrollDepth.reached25})`,
        reached50: sql<number>`SUM(${analyticsScrollDepth.reached50})`,
        reached75: sql<number>`SUM(${analyticsScrollDepth.reached75})`,
        reached100: sql<number>`SUM(${analyticsScrollDepth.reached100})`,
        avgScrollDepth: sql<number>`AVG(${analyticsScrollDepth.avgScrollDepth})`,
        totalUsers: sql<number>`SUM(${analyticsScrollDepth.uniqueUsers})`,
      })
      .from(analyticsScrollDepth)
      .where(
        and(
          eq(analyticsScrollDepth.projectId, projectId),
          startDate ? gte(analyticsScrollDepth.date, startDate) : undefined,
          endDate ? lte(analyticsScrollDepth.date, endDate) : undefined,
        ),
      )
      .groupBy(analyticsScrollDepth.pageUrl)
      .orderBy(desc(sql`SUM(${analyticsScrollDepth.uniqueUsers})`))
      .limit(parseInt(limit));

    return { scrollData };
  },

  async getErrorAnalytics(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "50" } = query;

    const errors = await db
      .select({
        errorMessage: analyticsErrors.errorMessage,
        errorType: analyticsErrors.errorType,
        filename: analyticsErrors.filename,
        pageUrl: analyticsErrors.pageUrl,
        totalCount: sql<number>`SUM(${analyticsErrors.count})`,
        totalUsers: sql<number>`SUM(${analyticsErrors.uniqueUsers})`,
      })
      .from(analyticsErrors)
      .where(
        and(
          eq(analyticsErrors.projectId, projectId),
          startDate ? gte(analyticsErrors.date, startDate) : undefined,
          endDate ? lte(analyticsErrors.date, endDate) : undefined,
        ),
      )
      .groupBy(
        analyticsErrors.errorMessage,
        analyticsErrors.errorType,
        analyticsErrors.filename,
        analyticsErrors.pageUrl,
      )
      .orderBy(desc(sql`SUM(${analyticsErrors.count})`))
      .limit(parseInt(limit));

    return { errors };
  },

  async getMediaAnalytics(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "20" } = query;

    const media = await db
      .select({
        mediaUrl: analyticsMedia.mediaUrl,
        mediaType: analyticsMedia.mediaType,
        pageUrl: analyticsMedia.pageUrl,
        totalPlays: sql<number>`SUM(${analyticsMedia.plays})`,
        totalCompletions: sql<number>`SUM(${analyticsMedia.completions})`,
        avgWatchTime: sql<number>`AVG(${analyticsMedia.avgWatchTime})`,
        reached25: sql<number>`SUM(${analyticsMedia.reached25})`,
        reached50: sql<number>`SUM(${analyticsMedia.reached50})`,
        reached75: sql<number>`SUM(${analyticsMedia.reached75})`,
        reached100: sql<number>`SUM(${analyticsMedia.reached100})`,
        totalUsers: sql<number>`SUM(${analyticsMedia.uniqueUsers})`,
      })
      .from(analyticsMedia)
      .where(
        and(
          eq(analyticsMedia.projectId, projectId),
          startDate ? gte(analyticsMedia.date, startDate) : undefined,
          endDate ? lte(analyticsMedia.date, endDate) : undefined,
        ),
      )
      .groupBy(
        analyticsMedia.mediaUrl,
        analyticsMedia.mediaType,
        analyticsMedia.pageUrl,
      )
      .orderBy(desc(sql`SUM(${analyticsMedia.plays})`))
      .limit(parseInt(limit));

    return { media };
  },

  async getOutboundAnalytics(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "50" } = query;

    const outbound = await db
      .select({
        eventType: analyticsOutbound.eventType,
        url: analyticsOutbound.url,
        linkText: analyticsOutbound.linkText,
        domain: analyticsOutbound.domain,
        fileType: analyticsOutbound.fileType,
        pageUrl: analyticsOutbound.pageUrl,
        totalClicks: sql<number>`SUM(${analyticsOutbound.clicks})`,
        totalUsers: sql<number>`SUM(${analyticsOutbound.uniqueUsers})`,
      })
      .from(analyticsOutbound)
      .where(
        and(
          eq(analyticsOutbound.projectId, projectId),
          startDate ? gte(analyticsOutbound.date, startDate) : undefined,
          endDate ? lte(analyticsOutbound.date, endDate) : undefined,
        ),
      )
      .groupBy(
        analyticsOutbound.eventType,
        analyticsOutbound.url,
        analyticsOutbound.linkText,
        analyticsOutbound.domain,
        analyticsOutbound.fileType,
        analyticsOutbound.pageUrl,
      )
      .orderBy(desc(sql`SUM(${analyticsOutbound.clicks})`))
      .limit(parseInt(limit));

    return { outbound };
  },

  async getSearchAnalytics(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "50" } = query;

    const searches = await db
      .select({
        query: analyticsSearch.query,
        searchLocation: analyticsSearch.searchLocation,
        totalSearches: sql<number>`SUM(${analyticsSearch.totalSearches})`,
        avgResultsCount: sql<number>`AVG(${analyticsSearch.avgResultsCount})`,
        avgResultsClicked: sql<number>`AVG(${analyticsSearch.avgResultsClicked})`,
        zeroResultsCount: sql<number>`SUM(${analyticsSearch.zeroResultsCount})`,
        totalUsers: sql<number>`SUM(${analyticsSearch.uniqueUsers})`,
      })
      .from(analyticsSearch)
      .where(
        and(
          eq(analyticsSearch.projectId, projectId),
          startDate ? gte(analyticsSearch.date, startDate) : undefined,
          endDate ? lte(analyticsSearch.date, endDate) : undefined,
        ),
      )
      .groupBy(analyticsSearch.query, analyticsSearch.searchLocation)
      .orderBy(desc(sql`SUM(${analyticsSearch.totalSearches})`))
      .limit(parseInt(limit));

    return { searches };
  },

  async getCustomEvents(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "50" } = query;

    const customEvents = await db
      .select({
        eventName: analyticsCustomEvents.eventName,
        category: analyticsCustomEvents.category,
        label: analyticsCustomEvents.label,
        pageUrl: analyticsCustomEvents.pageUrl,
        totalCount: sql<number>`SUM(${analyticsCustomEvents.count})`,
        totalValue: sql<number>`SUM(${analyticsCustomEvents.totalValue})`,
        totalUsers: sql<number>`SUM(${analyticsCustomEvents.uniqueUsers})`,
      })
      .from(analyticsCustomEvents)
      .where(
        and(
          eq(analyticsCustomEvents.projectId, projectId),
          startDate ? gte(analyticsCustomEvents.date, startDate) : undefined,
          endDate ? lte(analyticsCustomEvents.date, endDate) : undefined,
        ),
      )
      .groupBy(
        analyticsCustomEvents.eventName,
        analyticsCustomEvents.category,
        analyticsCustomEvents.label,
        analyticsCustomEvents.pageUrl,
      )
      .orderBy(desc(sql`SUM(${analyticsCustomEvents.count})`))
      .limit(parseInt(limit));

    return { customEvents };
  },

  async getSessionAnalytics(projectId: string, query: PaginatedQuery) {
    const { startDate, endDate, limit = "20" } = query;

    const sessions = await db
      .select({
        landingPage: analyticsSessions.landingPage,
        exitPage: analyticsSessions.exitPage,
        totalSessions: sql<number>`SUM(${analyticsSessions.totalSessions})`,
        avgPagesPerSession: sql<number>`AVG(${analyticsSessions.avgPagesPerSession})`,
        avgDuration: sql<number>`AVG(${analyticsSessions.avgDuration})`,
        totalBounces: sql<number>`SUM(${analyticsSessions.bounces})`,
        totalConversions: sql<number>`SUM(${analyticsSessions.conversions})`,
      })
      .from(analyticsSessions)
      .where(
        and(
          eq(analyticsSessions.projectId, projectId),
          startDate ? gte(analyticsSessions.date, startDate) : undefined,
          endDate ? lte(analyticsSessions.date, endDate) : undefined,
        ),
      )
      .groupBy(analyticsSessions.landingPage, analyticsSessions.exitPage)
      .orderBy(desc(sql`SUM(${analyticsSessions.totalSessions})`))
      .limit(parseInt(limit));

    return { sessions };
  },

  async getVisitorAnalytics(projectId: string, query: DateRangeQuery) {
    const { startDate, endDate } = query;

    const visitors = await db
      .select({
        date: analyticsVisitors.date,
        newVisitors: analyticsVisitors.newVisitors,
        returningVisitors: analyticsVisitors.returningVisitors,
        avgDaysSinceLastVisit: analyticsVisitors.avgDaysSinceLastVisit,
      })
      .from(analyticsVisitors)
      .where(
        and(
          eq(analyticsVisitors.projectId, projectId),
          startDate ? gte(analyticsVisitors.date, startDate) : undefined,
          endDate ? lte(analyticsVisitors.date, endDate) : undefined,
        ),
      )
      .orderBy(analyticsVisitors.date);

    const totals = visitors.reduce(
      (acc, v) => ({
        newVisitors: acc.newVisitors + (v.newVisitors || 0),
        returningVisitors: acc.returningVisitors + (v.returningVisitors || 0),
      }),
      { newVisitors: 0, returningVisitors: 0 },
    );

    return { visitors, totals };
  },

  /**
   * Get raw events stream from ClickHouse for JSON mode
   */
  async getRawEventsStream(
    projectId: string,
    options: { limit: number; offset: number },
  ) {
    const { clickhouse } = await import("@/db/clickhouse");
    const { limit = 100, offset = 0 } = options;

    try {
      const countResult = await clickhouse.query({
        query: `
          SELECT count() as total
          FROM events
          WHERE project_id = {projectId:UUID}
        `,
        query_params: { projectId },
        format: "JSONEachRow",
      });
      const countData = await countResult.json<{ total: string }>();
      const total = parseInt(
        (Array.isArray(countData) ? countData[0]?.total : "0") || "0",
      );

      const result = await clickhouse.query({
        query: `
          SELECT
            event_type,
            url,
            session_id,
            user_id,
            user_agent,
            referrer,
            metadata,
            country,
            city,
            latitude,
            longitude,
            timestamp,
            created_at
          FROM events
          WHERE project_id = {projectId:UUID}
          ORDER BY timestamp DESC
          LIMIT {limit:UInt32}
          OFFSET {offset:UInt32}
        `,
        query_params: { projectId, limit, offset },
        format: "JSONEachRow",
      });

      interface RawEvent {
        event_type: string;
        url: string | null;
        session_id: string | null;
        user_id: string | null;
        user_agent: string | null;
        referrer: string | null;
        metadata: string;
        country: string | null;
        city: string | null;
        latitude: number | null;
        longitude: number | null;
        timestamp: string;
        created_at: string;
      }

      const eventsData = await result.json<RawEvent>();
      const events = Array.isArray(eventsData) ? eventsData : [];

      const parsedEvents = events.map((event) => {
        let parsedMetadata = {};
        try {
          if (event.metadata) {
            parsedMetadata = JSON.parse(event.metadata);
          }
        } catch {}
        return {
          ...event,
          metadata: parsedMetadata,
        };
      });

      return {
        events: parsedEvents,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + events.length < total,
        },
      };
    } catch (error) {
      console.error("Error fetching raw events from ClickHouse:", error);
      return {
        events: [],
        pagination: { total: 0, limit, offset, hasMore: false },
        error: "Failed to fetch events",
      };
    }
  },
};
