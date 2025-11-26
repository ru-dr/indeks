import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  jsonb,
  date,
  real,
} from "drizzle-orm/pg-core";

// ============================= BETTER AUTH Tables ============================= //

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ============================= INDEKS Tables ============================= //

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Core metadata
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  link: text("link").notNull(),

  // API key info
  publicKey: text("public_key").notNull().unique(),
  keyHash: text("key_hash").notNull(),

  // Additional fields
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ============================= ANALYTICS Tables ============================= //

// Daily aggregated metrics per project
export const analyticsDaily = pgTable("analytics_daily", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  // Core metrics
  pageViews: integer("page_views").default(0).notNull(),
  uniqueVisitors: integer("unique_visitors").default(0).notNull(),
  sessions: integer("sessions").default(0).notNull(),
  totalClicks: integer("total_clicks").default(0).notNull(),
  totalScrolls: integer("total_scrolls").default(0).notNull(),
  totalErrors: integer("total_errors").default(0).notNull(),

  // Engagement metrics
  avgSessionDuration: real("avg_session_duration").default(0), // in seconds
  bounceRate: real("bounce_rate").default(0), // percentage
  avgScrollDepth: real("avg_scroll_depth").default(0), // percentage

  // Rage/frustration metrics
  rageClicks: integer("rage_clicks").default(0).notNull(),
  deadClicks: integer("dead_clicks").default(0).notNull(),
  errorClicks: integer("error_clicks").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Top pages per project per day
export const analyticsTopPages = pgTable("analytics_top_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  url: text("url").notNull(),
  pageViews: integer("page_views").default(0).notNull(),
  uniqueVisitors: integer("unique_visitors").default(0).notNull(),
  avgTimeOnPage: real("avg_time_on_page").default(0), // in seconds
  bounceRate: real("bounce_rate").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Top referrers per project per day
export const analyticsReferrers = pgTable("analytics_referrers", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  referrer: text("referrer").notNull(),
  referrerDomain: text("referrer_domain"),
  visits: integer("visits").default(0).notNull(),
  uniqueVisitors: integer("unique_visitors").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Device/browser breakdown per project per day
export const analyticsDevices = pgTable("analytics_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  deviceType: text("device_type").notNull(), // desktop, mobile, tablet
  browser: text("browser"),
  os: text("os"),
  visits: integer("visits").default(0).notNull(),
  uniqueVisitors: integer("unique_visitors").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Event breakdown per project per day
export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  eventType: text("event_type").notNull(),
  count: integer("count").default(0).notNull(),
  uniqueUsers: integer("unique_users").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Top clicked elements per project per day
export const analyticsClickedElements = pgTable("analytics_clicked_elements", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  elementSelector: text("element_selector").notNull(),
  elementText: text("element_text"),
  elementTag: text("element_tag"),
  pageUrl: text("page_url"),
  clickCount: integer("click_count").default(0).notNull(),
  uniqueUsers: integer("unique_users").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sync status tracking
export const analyticsSyncLog = pgTable("analytics_sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  syncDate: date("sync_date").notNull(),
  syncType: text("sync_type").notNull(), // 'daily', 'hourly', 'manual'
  status: text("status").notNull(), // 'success', 'failed', 'in_progress'
  recordsProcessed: integer("records_processed").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
