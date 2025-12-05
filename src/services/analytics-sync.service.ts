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
} from "@/db/schema/schema";
import { eq, and } from "drizzle-orm";

function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet";
} {
  const ua = userAgent.toLowerCase();

  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    deviceType = "tablet";
  } else if (
    /mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)
  ) {
    deviceType = "mobile";
  }

  let browser = "Unknown";
  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  let os = "Unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  return { browser, os, deviceType };
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

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

export const analyticsSyncService = {
  // Helper functions
  avg(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  },

  trackScrollDepth(
    pageUrl: string,
    depth: number,
    userId: string,
    scrollMap: Map<
      string,
      {
        depths: number[];
        reached25: Set<string>;
        reached50: Set<string>;
        reached75: Set<string>;
        reached100: Set<string>;
        users: Set<string>;
      }
    >,
  ) {
    if (!scrollMap.has(pageUrl)) {
      scrollMap.set(pageUrl, {
        depths: [],
        reached25: new Set(),
        reached50: new Set(),
        reached75: new Set(),
        reached100: new Set(),
        users: new Set(),
      });
    }
    const data = scrollMap.get(pageUrl)!;
    data.depths.push(depth);
    data.users.add(userId);
    if (depth >= 25) data.reached25.add(userId);
    if (depth >= 50) data.reached50.add(userId);
    if (depth >= 75) data.reached75.add(userId);
    if (depth >= 100) data.reached100.add(userId);
  },

  trackEngagement(
    eventType: string,
    metadata: Record<string, unknown>,
    url: string | null,
    userId: string,
    engagementMap: Map<
      string,
      {
        eventType: string;
        elementSelector: string;
        pageUrl: string;
        count: number;
        users: Set<string>;
        reason: string;
      }
    >,
  ) {
    const selector = (metadata.element as string) || "unknown";
    const reason =
      (metadata.whyRage as string) ||
      (metadata.expectedBehavior as string) ||
      "";
    const key = `${eventType}|${selector}|${url || ""}`;
    if (!engagementMap.has(key)) {
      engagementMap.set(key, {
        eventType,
        elementSelector: selector,
        pageUrl: url || "",
        count: 0,
        users: new Set(),
        reason,
      });
    }
    const data = engagementMap.get(key)!;
    data.count++;
    data.users.add(userId);
  },

  async syncProjectData(projectId: string, date: string): Promise<void> {
    console.log(`Starting sync for project ${projectId} on ${date}`);

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
        query_params: { projectId, date },
        format: "JSONEachRow",
      });

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

      const aggregatedData = this.aggregateEvents(events);
      await this.deleteExistingData(projectId, date);

      // Insert all analytics data
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

      if (aggregatedData.topPages.length > 0) {
        await db
          .insert(analyticsTopPages)
          .values(
            aggregatedData.topPages.map((p) => ({ projectId, date, ...p })),
          );
      }
      if (aggregatedData.referrers.length > 0) {
        await db.insert(analyticsReferrers).values(
          aggregatedData.referrers.map((r) => ({
            projectId,
            date,
            referrer: r.referrer,
            referrerDomain: r.referrerDomain,
            visits: r.visits,
            uniqueVisitors: r.uniqueVisitors,
          })),
        );
      }
      if (aggregatedData.devices.length > 0) {
        await db.insert(analyticsDevices).values(
          aggregatedData.devices.map((d) => ({
            projectId,
            date,
            deviceType: d.deviceType,
            browser: d.browser,
            os: d.os,
            visits: d.visits,
            uniqueVisitors: d.uniqueVisitors,
          })),
        );
      }
      if (aggregatedData.eventBreakdown.length > 0) {
        await db.insert(analyticsEvents).values(
          aggregatedData.eventBreakdown.map((e) => ({
            projectId,
            date,
            eventType: e.eventType,
            count: e.count,
            uniqueUsers: e.uniqueUsers,
          })),
        );
      }
      if (aggregatedData.clickedElements.length > 0) {
        await db.insert(analyticsClickedElements).values(
          aggregatedData.clickedElements.map((c) => ({
            projectId,
            date,
            elementSelector: c.elementSelector,
            elementText: c.elementText,
            elementTag: c.elementTag,
            pageUrl: c.pageUrl,
            clickCount: c.clickCount,
            uniqueUsers: c.uniqueUsers,
          })),
        );
      }

      // New enhanced analytics
      if (aggregatedData.trafficSources.length > 0) {
        await db.insert(analyticsTrafficSources).values(
          aggregatedData.trafficSources.map((t) => ({
            projectId,
            date,
            ...t,
          })),
        );
      }
      if (aggregatedData.formEvents.length > 0) {
        await db
          .insert(analyticsFormEvents)
          .values(
            aggregatedData.formEvents.map((f) => ({ projectId, date, ...f })),
          );
      }
      if (aggregatedData.engagementEvents.length > 0) {
        await db.insert(analyticsEngagement).values(
          aggregatedData.engagementEvents.map((e) => ({
            projectId,
            date,
            ...e,
          })),
        );
      }
      if (aggregatedData.performanceMetrics.length > 0) {
        await db.insert(analyticsPerformance).values(
          aggregatedData.performanceMetrics.map((p) => ({
            projectId,
            date,
            ...p,
          })),
        );
      }
      if (aggregatedData.scrollDepthData.length > 0) {
        await db.insert(analyticsScrollDepth).values(
          aggregatedData.scrollDepthData.map((s) => ({
            projectId,
            date,
            ...s,
          })),
        );
      }
      if (aggregatedData.errorDetails.length > 0) {
        await db
          .insert(analyticsErrors)
          .values(
            aggregatedData.errorDetails.map((e) => ({ projectId, date, ...e })),
          );
      }
      if (aggregatedData.mediaEvents.length > 0) {
        await db
          .insert(analyticsMedia)
          .values(
            aggregatedData.mediaEvents.map((m) => ({ projectId, date, ...m })),
          );
      }
      if (aggregatedData.outboundEvents.length > 0) {
        await db.insert(analyticsOutbound).values(
          aggregatedData.outboundEvents.map((o) => ({
            projectId,
            date,
            ...o,
          })),
        );
      }
      if (aggregatedData.searchEvents.length > 0) {
        await db
          .insert(analyticsSearch)
          .values(
            aggregatedData.searchEvents.map((s) => ({ projectId, date, ...s })),
          );
      }
      if (aggregatedData.customEvents.length > 0) {
        await db
          .insert(analyticsCustomEvents)
          .values(
            aggregatedData.customEvents.map((c) => ({ projectId, date, ...c })),
          );
      }
      if (aggregatedData.sessionAnalytics.length > 0) {
        await db.insert(analyticsSessions).values(
          aggregatedData.sessionAnalytics.map((s) => ({
            projectId,
            date,
            ...s,
          })),
        );
      }
      if (aggregatedData.visitorAnalytics) {
        await db
          .insert(analyticsVisitors)
          .values({ projectId, date, ...aggregatedData.visitorAnalytics });
      }

      await db
        .update(analyticsSyncLog)
        .set({
          status: "success",
          recordsProcessed: events.length,
          completedAt: new Date(),
        })
        .where(eq(analyticsSyncLog.id, syncLog.id));
      console.log(
        `Sync completed for project ${projectId}: ${events.length} events processed`,
      );
    } catch (error) {
      console.error(`Sync failed for project ${projectId}:`, error);
      await db
        .update(analyticsSyncLog)
        .set({
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        })
        .where(eq(analyticsSyncLog.id, syncLog.id));
      throw error;
    }
  },

  async deleteExistingData(projectId: string, date: string): Promise<void> {
    const tables = [
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
    ];
    for (const table of tables) {
      await db
        .delete(table)
        .where(and(eq(table.projectId, projectId), eq(table.date, date)));
    }
  },

  aggregateEvents(events: EventRow[]) {
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
    const eventCounts = new Map<
      string,
      { count: number; users: Set<string> }
    >();
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
      {
        pageViews: number;
        startTime: number;
        endTime: number;
        landingPage: string;
        exitPage: string;
        pages: string[];
        isNew: boolean;
        converted: boolean;
      }
    >();
    const trafficSourceData = new Map<
      string,
      {
        sessions: Set<string>;
        users: Set<string>;
        utmSource: string | null;
        utmMedium: string | null;
        utmCampaign: string | null;
        conversions: number;
      }
    >();
    const formData = new Map<
      string,
      {
        pageUrl: string;
        submissions: number;
        abandonments: number;
        errors: number;
        timeToComplete: number[];
        fieldsCompleted: number[];
        users: Set<string>;
      }
    >();
    const engagementData = new Map<
      string,
      {
        eventType: string;
        elementSelector: string;
        pageUrl: string;
        count: number;
        users: Set<string>;
        reason: string;
      }
    >();
    const performanceData = new Map<
      string,
      {
        loadTime: number[];
        fcp: number[];
        lcp: number[];
        fid: number[];
        cls: number[];
        ttfb: number[];
      }
    >();
    const scrollDepthByPage = new Map<
      string,
      {
        depths: number[];
        reached25: Set<string>;
        reached50: Set<string>;
        reached75: Set<string>;
        reached100: Set<string>;
        users: Set<string>;
      }
    >();
    const errorData = new Map<
      string,
      {
        errorType: string;
        filename: string;
        pageUrl: string;
        count: number;
        users: Set<string>;
      }
    >();
    const mediaData = new Map<
      string,
      {
        mediaType: string;
        pageUrl: string;
        plays: number;
        completions: number;
        watchTimes: number[];
        reached25: number;
        reached50: number;
        reached75: number;
        reached100: number;
        users: Set<string>;
      }
    >();
    const outboundData = new Map<
      string,
      {
        eventType: string;
        linkText: string;
        domain: string;
        fileType: string;
        pageUrl: string;
        clicks: number;
        users: Set<string>;
      }
    >();
    const searchData = new Map<
      string,
      {
        searchLocation: string;
        searches: number;
        resultsCount: number[];
        resultsClicked: number[];
        zeroResults: number;
        users: Set<string>;
      }
    >();
    const customEventData = new Map<
      string,
      {
        category: string;
        label: string;
        pageUrl: string;
        count: number;
        values: number[];
        users: Set<string>;
      }
    >();

    const scrollDepths: number[] = [];
    let pageViews = 0,
      totalClicks = 0,
      totalScrolls = 0,
      totalErrors = 0,
      rageClicks = 0,
      deadClicks = 0,
      errorClicks = 0;
    let newVisitors = 0,
      returningVisitors = 0,
      daysSinceLastVisitSum = 0,
      daysSinceLastVisitCount = 0;

    for (const event of events) {
      const visitorId = event.user_id || event.session_id || "anonymous";
      const sessionId = event.session_id || "unknown";
      const timestamp = new Date(event.timestamp).getTime();

      uniqueUsers.add(visitorId);
      uniqueSessions.add(sessionId);

      let metadata: Record<string, unknown> = {};
      try {
        metadata =
          typeof event.metadata === "string"
            ? JSON.parse(event.metadata)
            : event.metadata || {};
      } catch {
        metadata = {};
      }

      if (!sessionData.has(sessionId)) {
        sessionData.set(sessionId, {
          pageViews: 0,
          startTime: timestamp,
          endTime: timestamp,
          landingPage: event.url || "",
          exitPage: event.url || "",
          pages: [],
          isNew: false,
          converted: false,
        });
      }
      const session = sessionData.get(sessionId)!;
      session.endTime = Math.max(session.endTime, timestamp);
      if (event.url) {
        session.exitPage = event.url;
        if (!session.pages.includes(event.url)) session.pages.push(event.url);
      }

      if (!eventCounts.has(event.event_type))
        eventCounts.set(event.event_type, { count: 0, users: new Set() });
      const evtData = eventCounts.get(event.event_type)!;
      evtData.count++;
      evtData.users.add(visitorId);

      switch (event.event_type) {
        case "pageview":
          pageViews++;
          session.pageViews++;
          if (event.url) {
            if (!pageViewsByUrl.has(event.url))
              pageViewsByUrl.set(event.url, {
                views: 0,
                users: new Set(),
                timeOnPage: [],
              });
            const pd = pageViewsByUrl.get(event.url)!;
            pd.views++;
            pd.users.add(visitorId);
          }
          break;
        case "click":
          totalClicks++;
          const el = metadata.element as
            | {
                tagName?: string;
                className?: string;
                id?: string;
                textContent?: string;
              }
            | undefined;
          if (el) {
            const sel = el.id
              ? `#${el.id}`
              : el.className
                ? `${el.tagName}.${el.className.split(" ")[0]}`
                : el.tagName || "unknown";
            if (!clickedElements.has(sel))
              clickedElements.set(sel, {
                text: el.textContent?.substring(0, 100) || "",
                tag: el.tagName || "",
                pageUrl: event.url || "",
                count: 0,
                users: new Set(),
              });
            const cd = clickedElements.get(sel)!;
            cd.count++;
            cd.users.add(visitorId);
          }
          break;
        case "scroll":
          totalScrolls++;
          const sp = metadata.scrollPercentage as number;
          if (typeof sp === "number") {
            scrollDepths.push(sp);
            this.trackScrollDepth(
              event.url || "unknown",
              sp,
              visitorId,
              scrollDepthByPage,
            );
          }
          break;
        case "scroll_depth":
          const dep = metadata.depth as number;
          if (typeof dep === "number") {
            scrollDepths.push(dep);
            this.trackScrollDepth(
              event.url || "unknown",
              dep,
              visitorId,
              scrollDepthByPage,
            );
          }
          break;
        case "error":
        case "resource_error":
          totalErrors++;
          const errMsg =
            (metadata.error as { message?: string })?.message ||
            (metadata.errorMessage as string) ||
            "Unknown error";
          const errKey = `${errMsg.substring(0, 100)}|${event.url || ""}`;
          if (!errorData.has(errKey))
            errorData.set(errKey, {
              errorType:
                event.event_type === "resource_error"
                  ? "resource"
                  : "javascript",
              filename:
                (metadata.error as { filename?: string })?.filename || "",
              pageUrl: event.url || "",
              count: 0,
              users: new Set(),
            });
          const ed = errorData.get(errKey)!;
          ed.count++;
          ed.users.add(visitorId);
          break;
        case "rage_click":
          rageClicks++;
          this.trackEngagement(
            "rage_click",
            metadata,
            event.url,
            visitorId,
            engagementData,
          );
          break;
        case "dead_click":
          deadClicks++;
          this.trackEngagement(
            "dead_click",
            metadata,
            event.url,
            visitorId,
            engagementData,
          );
          break;
        case "error_click":
          errorClicks++;
          this.trackEngagement(
            "error_click",
            metadata,
            event.url,
            visitorId,
            engagementData,
          );
          break;
        case "session_start":
          const ts = (metadata.trafficSource as string) || "direct";
          const utmS = (metadata.utmSource as string) || null;
          const utmM = (metadata.utmMedium as string) || null;
          const utmC = (metadata.utmCampaign as string) || null;
          const tsKey = `${ts}|${utmS || ""}|${utmM || ""}|${utmC || ""}`;
          if (!trafficSourceData.has(tsKey))
            trafficSourceData.set(tsKey, {
              sessions: new Set(),
              users: new Set(),
              utmSource: utmS,
              utmMedium: utmM,
              utmCampaign: utmC,
              conversions: 0,
            });
          const tsd = trafficSourceData.get(tsKey)!;
          tsd.sessions.add(sessionId);
          tsd.users.add(visitorId);
          if (metadata.isNewUser) {
            newVisitors++;
            session.isNew = true;
          } else {
            returningVisitors++;
            if (typeof metadata.daysSinceLastVisit === "number") {
              daysSinceLastVisitSum += metadata.daysSinceLastVisit as number;
              daysSinceLastVisitCount++;
            }
          }
          if (metadata.landingPage)
            session.landingPage = metadata.landingPage as string;
          break;
        case "session_end":
          session.converted = (metadata.converted as boolean) || false;
          if (session.converted)
            for (const [, tsd] of trafficSourceData)
              if (tsd.sessions.has(sessionId)) tsd.conversions++;
          break;
        case "form_submit":
          const fid =
            (metadata.formId as string) ||
            (metadata.element as { id?: string })?.id ||
            "unknown-form";
          if (!formData.has(fid))
            formData.set(fid, {
              pageUrl: event.url || "",
              submissions: 0,
              abandonments: 0,
              errors: 0,
              timeToComplete: [],
              fieldsCompleted: [],
              users: new Set(),
            });
          const fd = formData.get(fid)!;
          fd.submissions++;
          fd.users.add(visitorId);
          break;
        case "form_abandon":
          const afid = (metadata.formId as string) || "unknown-form";
          if (!formData.has(afid))
            formData.set(afid, {
              pageUrl: event.url || "",
              submissions: 0,
              abandonments: 0,
              errors: 0,
              timeToComplete: [],
              fieldsCompleted: [],
              users: new Set(),
            });
          const afd = formData.get(afid)!;
          afd.abandonments++;
          afd.users.add(visitorId);
          if (typeof metadata.timeSpent === "number")
            afd.timeToComplete.push(metadata.timeSpent as number);
          if (typeof metadata.fieldsCompleted === "number")
            afd.fieldsCompleted.push(metadata.fieldsCompleted as number);
          break;
        case "form_error":
          const efid = (metadata.formId as string) || "unknown-form";
          if (!formData.has(efid))
            formData.set(efid, {
              pageUrl: event.url || "",
              submissions: 0,
              abandonments: 0,
              errors: 0,
              timeToComplete: [],
              fieldsCompleted: [],
              users: new Set(),
            });
          formData.get(efid)!.errors++;
          formData.get(efid)!.users.add(visitorId);
          break;
        case "performance":
        case "page_load":
          const pUrl = event.url || "unknown";
          if (!performanceData.has(pUrl))
            performanceData.set(pUrl, {
              loadTime: [],
              fcp: [],
              lcp: [],
              fid: [],
              cls: [],
              ttfb: [],
            });
          const pfd = performanceData.get(pUrl)!;
          const pt = metadata.type as string;
          const pv = metadata.value as number;
          if (typeof pv === "number") {
            if (pt === "first_contentful_paint") pfd.fcp.push(pv);
            else if (pt === "largest_contentful_paint") pfd.lcp.push(pv);
            else if (pt === "first_input_delay") pfd.fid.push(pv);
            else if (pt === "cumulative_layout_shift") pfd.cls.push(pv);
            else if (pt === "time_to_first_byte") pfd.ttfb.push(pv);
          }
          if (typeof metadata.loadTime === "number")
            pfd.loadTime.push(metadata.loadTime as number);
          break;
        case "media_play":
        case "media_pause":
        case "media_ended":
        case "media_progress":
          const mUrl =
            (metadata.element as { src?: string })?.src ||
            (metadata.mediaUrl as string) ||
            "unknown";
          const mType =
            (
              metadata.element as { tagName?: string }
            )?.tagName?.toLowerCase() || "video";
          if (!mediaData.has(mUrl))
            mediaData.set(mUrl, {
              mediaType: mType,
              pageUrl: event.url || "",
              plays: 0,
              completions: 0,
              watchTimes: [],
              reached25: 0,
              reached50: 0,
              reached75: 0,
              reached100: 0,
              users: new Set(),
            });
          const md = mediaData.get(mUrl)!;
          md.users.add(visitorId);
          if (event.event_type === "media_play") md.plays++;
          if (event.event_type === "media_ended") md.completions++;
          if (event.event_type === "media_progress") {
            const prog = metadata.progress as number;
            if (prog >= 25) md.reached25++;
            if (prog >= 50) md.reached50++;
            if (prog >= 75) md.reached75++;
            if (prog >= 100) md.reached100++;
          }
          break;
        case "outbound_link":
          const oUrl = (metadata.url as string) || "unknown";
          if (!outboundData.has(oUrl))
            outboundData.set(oUrl, {
              eventType: "outbound_link",
              linkText: (metadata.linkText as string) || "",
              domain: (metadata.domain as string) || extractDomain(oUrl),
              fileType: "",
              pageUrl: event.url || "",
              clicks: 0,
              users: new Set(),
            });
          const od = outboundData.get(oUrl)!;
          od.clicks++;
          od.users.add(visitorId);
          break;
        case "file_download":
          const fUrl =
            (metadata.downloadUrl as string) ||
            (metadata.fileName as string) ||
            "unknown";
          if (!outboundData.has(fUrl))
            outboundData.set(fUrl, {
              eventType: "file_download",
              linkText: (metadata.fileName as string) || "",
              domain: "",
              fileType: (metadata.fileType as string) || "",
              pageUrl: event.url || "",
              clicks: 0,
              users: new Set(),
            });
          const fod = outboundData.get(fUrl)!;
          fod.clicks++;
          fod.users.add(visitorId);
          break;
        case "search":
          const q = (metadata.query as string) || "";
          if (q) {
            if (!searchData.has(q))
              searchData.set(q, {
                searchLocation:
                  (metadata.searchLocation as string) || "unknown",
                searches: 0,
                resultsCount: [],
                resultsClicked: [],
                zeroResults: 0,
                users: new Set(),
              });
            const sd = searchData.get(q)!;
            sd.searches++;
            sd.users.add(visitorId);
            if (typeof metadata.resultsCount === "number") {
              sd.resultsCount.push(metadata.resultsCount as number);
              if (metadata.resultsCount === 0) sd.zeroResults++;
            }
            if (typeof metadata.resultsClicked === "number")
              sd.resultsClicked.push(metadata.resultsClicked as number);
          }
          break;
        case "custom":
          const en = (metadata.eventName as string) || "unknown";
          const ceKey = `${en}|${metadata.category || ""}|${metadata.label || ""}`;
          if (!customEventData.has(ceKey))
            customEventData.set(ceKey, {
              category: (metadata.category as string) || "",
              label: (metadata.label as string) || "",
              pageUrl: event.url || "",
              count: 0,
              values: [],
              users: new Set(),
            });
          const ced = customEventData.get(ceKey)!;
          ced.count++;
          ced.users.add(visitorId);
          if (typeof metadata.value === "number")
            ced.values.push(metadata.value as number);
          break;
      }

      if (event.referrer && event.event_type === "pageview") {
        if (!referrerCounts.has(event.referrer))
          referrerCounts.set(event.referrer, { visits: 0, users: new Set() });
        const rd = referrerCounts.get(event.referrer)!;
        rd.visits++;
        rd.users.add(visitorId);
      }
      if (event.user_agent) {
        const { browser, os, deviceType } = parseUserAgent(event.user_agent);
        const dk = `${deviceType}|${browser}|${os}`;
        if (!deviceCounts.has(dk))
          deviceCounts.set(dk, { visits: 0, users: new Set() });
        const dd = deviceCounts.get(dk)!;
        dd.visits++;
        dd.users.add(visitorId);
      }
    }

    let totalSessionDuration = 0,
      bouncedSessions = 0;
    const sessionAnalytics: {
      landingPage: string;
      exitPage: string;
      totalSessions: number;
      avgPagesPerSession: number;
      avgDuration: number;
      bounces: number;
      conversions: number;
    }[] = [];
    const landingPageData = new Map<
      string,
      {
        sessions: number;
        pages: number[];
        durations: number[];
        bounces: number;
        conversions: number;
        exitPages: Map<string, number>;
      }
    >();

    for (const [, sess] of sessionData) {
      totalSessionDuration += (sess.endTime - sess.startTime) / 1000;
      if (sess.pageViews === 1) bouncedSessions++;
      if (!landingPageData.has(sess.landingPage))
        landingPageData.set(sess.landingPage, {
          sessions: 0,
          pages: [],
          durations: [],
          bounces: 0,
          conversions: 0,
          exitPages: new Map(),
        });
      const lpd = landingPageData.get(sess.landingPage)!;
      lpd.sessions++;
      lpd.pages.push(sess.pages.length);
      lpd.durations.push((sess.endTime - sess.startTime) / 1000);
      if (sess.pageViews === 1) lpd.bounces++;
      if (sess.converted) lpd.conversions++;
      if (!lpd.exitPages.has(sess.exitPage))
        lpd.exitPages.set(sess.exitPage, 0);
      lpd.exitPages.set(sess.exitPage, lpd.exitPages.get(sess.exitPage)! + 1);
    }
    for (const [lp, lpd] of landingPageData) {
      let topExit = "";
      let topExitCount = 0;
      for (const [ep, cnt] of lpd.exitPages)
        if (cnt > topExitCount) {
          topExit = ep;
          topExitCount = cnt;
        }
      sessionAnalytics.push({
        landingPage: lp,
        exitPage: topExit,
        totalSessions: lpd.sessions,
        avgPagesPerSession: this.avg(lpd.pages),
        avgDuration: this.avg(lpd.durations),
        bounces: lpd.bounces,
        conversions: lpd.conversions,
      });
    }

    const avgSessionDuration =
      sessionData.size > 0 ? totalSessionDuration / sessionData.size : 0;
    const bounceRate =
      sessionData.size > 0 ? (bouncedSessions / sessionData.size) * 100 : 0;
    const avgScrollDepth =
      scrollDepths.length > 0
        ? scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length
        : 0;

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
      topPages: Array.from(pageViewsByUrl.entries())
        .map(([url, d]) => ({
          url,
          pageViews: d.views,
          uniqueVisitors: d.users.size,
          avgTimeOnPage: 0,
          bounceRate: 0,
        }))
        .sort((a, b) => b.pageViews - a.pageViews)
        .slice(0, 50),
      referrers: Array.from(referrerCounts.entries())
        .map(([ref, d]) => ({
          referrer: ref,
          referrerDomain: extractDomain(ref),
          visits: d.visits,
          uniqueVisitors: d.users.size,
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 50),
      devices: Array.from(deviceCounts.entries()).map(([k, d]) => {
        const [dt, br, os] = k.split("|");
        return {
          deviceType: dt,
          browser: br,
          os,
          visits: d.visits,
          uniqueVisitors: d.users.size,
        };
      }),
      eventBreakdown: Array.from(eventCounts.entries())
        .map(([et, d]) => ({
          eventType: et,
          count: d.count,
          uniqueUsers: d.users.size,
        }))
        .sort((a, b) => b.count - a.count),
      clickedElements: Array.from(clickedElements.entries())
        .map(([s, d]) => ({
          elementSelector: s,
          elementText: d.text,
          elementTag: d.tag,
          pageUrl: d.pageUrl,
          clickCount: d.count,
          uniqueUsers: d.users.size,
        }))
        .sort((a, b) => b.clickCount - a.clickCount)
        .slice(0, 100),
      trafficSources: Array.from(trafficSourceData.entries()).map(([k, d]) => {
        const [ts] = k.split("|");
        return {
          trafficSource: ts,
          utmSource: d.utmSource,
          utmMedium: d.utmMedium,
          utmCampaign: d.utmCampaign,
          sessions: d.sessions.size,
          uniqueVisitors: d.users.size,
          conversions: d.conversions,
        };
      }),
      formEvents: Array.from(formData.entries()).map(([fid, d]) => ({
        formId: fid,
        pageUrl: d.pageUrl,
        submissions: d.submissions,
        abandonments: d.abandonments,
        errors: d.errors,
        avgTimeToComplete: this.avg(d.timeToComplete),
        avgFieldsCompleted: this.avg(d.fieldsCompleted),
        uniqueUsers: d.users.size,
      })),
      engagementEvents: Array.from(engagementData.entries()).map(([, d]) => ({
        eventType: d.eventType,
        elementSelector: d.elementSelector,
        pageUrl: d.pageUrl,
        count: d.count,
        uniqueUsers: d.users.size,
        reason: d.reason,
      })),
      performanceMetrics: Array.from(performanceData.entries())
        .map(([url, d]) => ({
          pageUrl: url,
          avgLoadTime: this.avg(d.loadTime),
          avgFcp: this.avg(d.fcp),
          avgLcp: this.avg(d.lcp),
          avgFid: this.avg(d.fid),
          avgCls: this.avg(d.cls),
          avgTtfb: this.avg(d.ttfb),
          sampleCount: Math.max(d.loadTime.length, d.fcp.length, d.lcp.length),
        }))
        .filter((p) => p.sampleCount > 0),
      scrollDepthData: Array.from(scrollDepthByPage.entries()).map(
        ([url, d]) => ({
          pageUrl: url,
          reached25: d.reached25.size,
          reached50: d.reached50.size,
          reached75: d.reached75.size,
          reached100: d.reached100.size,
          avgScrollDepth: this.avg(d.depths),
          uniqueUsers: d.users.size,
        }),
      ),
      errorDetails: Array.from(errorData.entries())
        .map(([k, d]) => {
          const [msg] = k.split("|");
          return {
            errorMessage: msg,
            errorType: d.errorType,
            filename: d.filename,
            pageUrl: d.pageUrl,
            count: d.count,
            uniqueUsers: d.users.size,
          };
        })
        .slice(0, 100),
      mediaEvents: Array.from(mediaData.entries()).map(([url, d]) => ({
        mediaUrl: url,
        mediaType: d.mediaType,
        pageUrl: d.pageUrl,
        plays: d.plays,
        completions: d.completions,
        avgWatchTime: this.avg(d.watchTimes),
        reached25: d.reached25,
        reached50: d.reached50,
        reached75: d.reached75,
        reached100: d.reached100,
        uniqueUsers: d.users.size,
      })),
      outboundEvents: Array.from(outboundData.entries())
        .map(([url, d]) => ({
          eventType: d.eventType,
          url,
          linkText: d.linkText,
          domain: d.domain,
          fileType: d.fileType,
          pageUrl: d.pageUrl,
          clicks: d.clicks,
          uniqueUsers: d.users.size,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 100),
      searchEvents: Array.from(searchData.entries())
        .map(([q, d]) => ({
          query: q,
          searchLocation: d.searchLocation,
          totalSearches: d.searches,
          avgResultsCount: this.avg(d.resultsCount),
          avgResultsClicked: this.avg(d.resultsClicked),
          zeroResultsCount: d.zeroResults,
          uniqueUsers: d.users.size,
        }))
        .sort((a, b) => b.totalSearches - a.totalSearches)
        .slice(0, 100),
      customEvents: Array.from(customEventData.entries())
        .map(([k, d]) => {
          const [en] = k.split("|");
          return {
            eventName: en,
            category: d.category,
            label: d.label,
            pageUrl: d.pageUrl,
            count: d.count,
            totalValue: d.values.reduce((a, b) => a + b, 0),
            uniqueUsers: d.users.size,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 100),
      sessionAnalytics: sessionAnalytics
        .sort((a, b) => b.totalSessions - a.totalSessions)
        .slice(0, 50),
      visitorAnalytics: {
        newVisitors,
        returningVisitors,
        avgDaysSinceLastVisit:
          daysSinceLastVisitCount > 0
            ? daysSinceLastVisitSum / daysSinceLastVisitCount
            : 0,
      },
    };
  },

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
      }
    }
    console.log(`Completed sync for all projects on ${date}`);
  },

  async syncYesterday(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await this.syncAllProjects(yesterday.toISOString().split("T")[0]);
  },

  async syncToday(): Promise<void> {
    await this.syncAllProjects(new Date().toISOString().split("T")[0]);
  },
};
