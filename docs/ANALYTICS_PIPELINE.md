# Analytics Pipeline Documentation

## Overview

This document describes the analytics pipeline that syncs data from ClickHouse to PostgreSQL and exposes it via API endpoints.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SDK Events    │───▶│   ClickHouse    │───▶│   PostgreSQL    │
│   (Real-time)   │    │   (Raw Events)  │    │  (Aggregated)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                       │
                              ▼                       ▼
                       Real-time API           Historical API
                       (Live data)             (Aggregated data)
```

## Database Schema (PostgreSQL)

### `analytics_daily`
Daily aggregated metrics per project:
- Page views, unique visitors, sessions
- Clicks, scrolls, errors
- Bounce rate, avg session duration
- Rage clicks, dead clicks, error clicks

### `analytics_top_pages`
Top pages by page views per day

### `analytics_referrers`
Traffic sources and referrers

### `analytics_devices`
Device type, browser, and OS breakdown

### `analytics_events`
Event type breakdown with counts

### `analytics_clicked_elements`
Most clicked elements with selectors and text

### `analytics_sync_log`
Sync job status tracking

## API Endpoints

### Overview
```
GET /api/analytics/:projectId/overview?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### Top Pages
```
GET /api/analytics/:projectId/pages?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=20
```

### Referrers
```
GET /api/analytics/:projectId/referrers?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=20
```

### Devices
```
GET /api/analytics/:projectId/devices?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### Events
```
GET /api/analytics/:projectId/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=50
```

### Clicked Elements
```
GET /api/analytics/:projectId/clicks?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=50
```

### Real-time (from ClickHouse)
```
GET /api/analytics/:projectId/realtime
```

### Manual Sync Trigger
```
POST /api/analytics/:projectId/sync
Body: { "date": "YYYY-MM-DD" } // optional, defaults to today
```

## Cron Jobs

Configured in `vercel.json`:

1. **Daily Sync** (2:00 AM UTC): Syncs yesterday's data
2. **Periodic Sync** (Every 6 hours): Syncs today's data for near-real-time updates

## Usage in React

```tsx
import { useAnalytics, useDateRange } from "@/hooks/use-analytics";

function AnalyticsDashboard({ projectId }: { projectId: string }) {
  const { startDate, endDate, setLast7Days, setLast30Days } = useDateRange(30);
  
  const {
    overview,
    topPages,
    referrers,
    devices,
    events,
    clicks,
    realtime,
    loading,
    error,
    refresh,
    triggerSync,
  } = useAnalytics(projectId, {
    startDate,
    endDate,
    refreshInterval: 30000, // Refresh realtime every 30 seconds
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Page Views" value={overview?.summary.totalPageViews} />
        <Card title="Visitors" value={overview?.summary.totalUniqueVisitors} />
        <Card title="Sessions" value={overview?.summary.totalSessions} />
        <Card title="Bounce Rate" value={`${overview?.summary.avgBounceRate?.toFixed(1)}%`} />
      </div>

      {/* Real-time Stats */}
      <div className="mt-4">
        <h3>Live (Last 30 min)</h3>
        <p>Active Users: {realtime?.realtime.active_users}</p>
        <p>Active Sessions: {realtime?.realtime.active_sessions}</p>
      </div>

      {/* Charts using dailyBreakdown */}
      <LineChart data={overview?.dailyBreakdown} />

      {/* Top Pages Table */}
      <Table data={topPages} />

      {/* Date Range Selector */}
      <button onClick={setLast7Days}>Last 7 Days</button>
      <button onClick={setLast30Days}>Last 30 Days</button>

      {/* Manual Sync */}
      <button onClick={() => triggerSync()}>Sync Now</button>
    </div>
  );
}
```

## Environment Variables

Add to `.env`:

```env
# Cron job authentication (optional but recommended)
CRON_SECRET=your-secret-key-here
```

## Running Migrations

After adding the schema, run:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Or push directly:

```bash
npx drizzle-kit push
```

## Manual Sync

To manually sync data for a specific date:

```bash
# Sync yesterday's data
curl -X POST "https://your-domain.com/api/cron/sync-analytics?type=yesterday"

# Sync today's data
curl -X POST "https://your-domain.com/api/cron/sync-analytics?type=today"

# Sync a specific date
curl -X POST "https://your-domain.com/api/cron/sync-analytics?type=2025-01-15"
```

## Notes

1. **Real-time data** comes directly from ClickHouse (last 30 minutes)
2. **Historical data** comes from PostgreSQL (aggregated daily)
3. Sync runs automatically every 6 hours for today's data and daily at 2 AM for yesterday's data
4. Data is aggregated at the daily level to reduce storage and improve query performance
5. The sync process uses an upsert pattern - running it multiple times for the same date will replace existing data
