import { createClient } from "@clickhouse/client";

export const clickhouse = createClient({
  url:
    process.env.CLICKHOUSE_URL ||
    "https://dj4oovjkh6.us-east-1.aws.clickhouse.cloud:8443",
  username: process.env.CLICKHOUSE_USERNAME || "default",
  password: process.env.CLICKHOUSE_PASSWORD || "",
  database: process.env.CLICKHOUSE_DATABASE || "indeks_analytics",
  request_timeout: 30000,
});

export const testClickHouseConnection = async () => {
  try {
    const result = await clickhouse.query({
      query: "SELECT 1 as test",
      format: "JSONEachRow",
    });

    const data = await result.json();
    return true;
  } catch (error) {
    console.error("ClickHouse connection failed:", error);
    return false;
  }
};

export const initializeClickHouseTables = async () => {
  try {
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS events (
          project_id UUID,
          event_type String,
          url Nullable(String),
          session_id Nullable(String),
          user_id Nullable(String),
          user_agent Nullable(String),
          referrer Nullable(String),
          metadata String, -- JSON string
          -- Geo-location fields
          country Nullable(String),
          city Nullable(String),
          latitude Nullable(Float64),
          longitude Nullable(Float64),
          ip_address Nullable(String),
          timestamp DateTime,
          created_at DateTime DEFAULT now()
        ) ENGINE = MergeTree()
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (project_id, timestamp, event_type)
        TTL timestamp + INTERVAL 1 YEAR
      `,
    });
  } catch (error) {
    console.error("Failed to initialize ClickHouse tables:", error);
    throw error;
  }
};
