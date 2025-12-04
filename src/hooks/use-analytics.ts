import { useState, useEffect, useCallback } from "react";

interface AnalyticsOverview {
  summary: {
    totalPageViews: number;
    totalUniqueVisitors: number;
    totalSessions: number;
    totalClicks: number;
    avgBounceRate: number;
    avgSessionDuration: number;
    totalRageClicks: number;
    totalDeadClicks: number;
    totalErrors: number;
  };
  dailyBreakdown: {
    date: string;
    pageViews: number;
    uniqueVisitors: number;
    sessions: number;
    bounceRate: number;
  }[];
}

interface TopPage {
  url: string;
  totalPageViews: number;
  totalUniqueVisitors: number;
  avgTimeOnPage: number;
}

interface Referrer {
  referrer: string;
  referrerDomain: string | null;
  totalVisits: number;
  totalUniqueVisitors: number;
}

interface Device {
  deviceType: string;
  browser: string | null;
  os: string | null;
  totalVisits: number;
  totalUniqueVisitors: number;
}

interface EventBreakdown {
  eventType: string;
  totalCount: number;
  totalUniqueUsers: number;
}

interface ClickedElement {
  elementSelector: string;
  elementText: string | null;
  elementTag: string | null;
  pageUrl: string | null;
  totalClicks: number;
  totalUniqueUsers: number;
}

interface RealtimeData {
  realtime: {
    total_events: number;
    page_views: number;
    active_users: number;
    active_sessions: number;
  };
  recentEvents: {
    event_type: string;
    url: string | null;
    timestamp: string;
  }[];
}

interface UseAnalyticsOptions {
  startDate?: string;
  endDate?: string;
  refreshInterval?: number; // in milliseconds
}

export function useAnalytics(projectId: string, options: UseAnalyticsOptions = {}) {
  const { startDate, endDate, refreshInterval } = options;

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [events, setEvents] = useState<EventBreakdown[]>([]);
  const [clicks, setClicks] = useState<ClickedElement[]>([]);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return params.toString() ? `?${params.toString()}` : "";
  }, [startDate, endDate]);

  const fetchOverview = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/analytics/${projectId}/overview${buildQuery()}`
      );
      if (!response.ok) throw new Error("Failed to fetch overview");
      const data = await response.json();
      setOverview(data);
    } catch (err) {
      console.error("Error fetching overview:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [projectId, buildQuery]);

  const fetchTopPages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/analytics/${projectId}/pages${buildQuery()}`
      );
      if (!response.ok) throw new Error("Failed to fetch top pages");
      const data = await response.json();
      setTopPages(data.pages || []);
    } catch (err) {
      console.error("Error fetching top pages:", err);
    }
  }, [projectId, buildQuery]);

  const fetchReferrers = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/analytics/${projectId}/referrers${buildQuery()}`
      );
      if (!response.ok) throw new Error("Failed to fetch referrers");
      const data = await response.json();
      setReferrers(data.referrers || []);
    } catch (err) {
      console.error("Error fetching referrers:", err);
    }
  }, [projectId, buildQuery]);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/analytics/${projectId}/devices${buildQuery()}`
      );
      if (!response.ok) throw new Error("Failed to fetch devices");
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error("Error fetching devices:", err);
    }
  }, [projectId, buildQuery]);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/analytics/${projectId}/events${buildQuery()}`
      );
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  }, [projectId, buildQuery]);

  const fetchClicks = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/analytics/${projectId}/clicks${buildQuery()}`
      );
      if (!response.ok) throw new Error("Failed to fetch clicks");
      const data = await response.json();
      setClicks(data.clicks || []);
    } catch (err) {
      console.error("Error fetching clicks:", err);
    }
  }, [projectId, buildQuery]);

  const fetchRealtime = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/analytics/${projectId}/realtime`);
      if (!response.ok) throw new Error("Failed to fetch realtime data");
      const data = await response.json();
      setRealtime(data);
    } catch (err) {
      console.error("Error fetching realtime:", err);
    }
  }, [projectId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    await Promise.all([
      fetchOverview(),
      fetchTopPages(),
      fetchReferrers(),
      fetchDevices(),
      fetchEvents(),
      fetchClicks(),
      fetchRealtime(),
    ]);

    setLoading(false);
  }, [
    fetchOverview,
    fetchTopPages,
    fetchReferrers,
    fetchDevices,
    fetchEvents,
    fetchClicks,
    fetchRealtime,
  ]);

  const triggerSync = useCallback(
    async (date?: string) => {
      try {
        const response = await fetch(`/api/v1/analytics/${projectId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        });
        if (!response.ok) throw new Error("Failed to trigger sync");
        return await response.json();
      } catch (err) {
        console.error("Error triggering sync:", err);
        throw err;
      }
    },
    [projectId]
  );

  // Initial fetch
  useEffect(() => {
    if (projectId) {
      fetchAll();
    }
  }, [projectId, fetchAll]);

  // Refresh interval for realtime data
  useEffect(() => {
    if (refreshInterval && projectId) {
      const interval = setInterval(() => {
        fetchRealtime();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, projectId, fetchRealtime]);

  return {
    // Data
    overview,
    topPages,
    referrers,
    devices,
    events,
    clicks,
    realtime,

    // State
    loading,
    error,

    // Actions
    refresh: fetchAll,
    refreshRealtime: fetchRealtime,
    triggerSync,
  };
}

// Helper hook for date range selection
export function useDateRange(defaultDays: number = 30) {
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - defaultDays);

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  });

  const setRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setDateRange({
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  }, []);

  const setCustomRange = useCallback((startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  }, []);

  return {
    ...dateRange,
    setRange,
    setCustomRange,
    setLast7Days: () => setRange(7),
    setLast30Days: () => setRange(30),
    setLast90Days: () => setRange(90),
  };
}
