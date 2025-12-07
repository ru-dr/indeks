import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  uuid,
  real,
  date,
} from "drizzle-orm/pg-core";

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
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable(
  "session",
  {
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
    impersonatedBy: text("impersonated_by"),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
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
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  organizationId: text("organization_id").references(() => organization.id, {
    onDelete: "cascade",
  }),

  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  link: text("link").notNull(),

  publicKey: text("public_key").notNull().unique(),
  keyHash: text("key_hash").notNull(),

  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const analyticsDaily = pgTable("analytics_daily", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  pageViews: integer("page_views").default(0).notNull(),
  uniqueVisitors: integer("unique_visitors").default(0).notNull(),
  sessions: integer("sessions").default(0).notNull(),
  totalClicks: integer("total_clicks").default(0).notNull(),
  totalScrolls: integer("total_scrolls").default(0).notNull(),
  totalErrors: integer("total_errors").default(0).notNull(),

  avgSessionDuration: real("avg_session_duration").default(0),
  bounceRate: real("bounce_rate").default(0),
  avgScrollDepth: real("avg_scroll_depth").default(0),

  rageClicks: integer("rage_clicks").default(0).notNull(),
  deadClicks: integer("dead_clicks").default(0).notNull(),
  errorClicks: integer("error_clicks").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const analyticsTopPages = pgTable("analytics_top_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  url: text("url").notNull(),
  pageViews: integer("page_views").default(0).notNull(),
  uniqueVisitors: integer("unique_visitors").default(0).notNull(),
  avgTimeOnPage: real("avg_time_on_page").default(0),
  bounceRate: real("bounce_rate").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const analyticsDevices = pgTable("analytics_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  deviceType: text("device_type").notNull(),
  browser: text("browser"),
  os: text("os"),
  visits: integer("visits").default(0).notNull(),
  uniqueVisitors: integer("unique_visitors").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const analyticsSyncLog = pgTable("analytics_sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  syncDate: date("sync_date").notNull(),
  syncType: text("sync_type").notNull(),
  status: text("status").notNull(),
  recordsProcessed: integer("records_processed").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const analyticsTrafficSources = pgTable("analytics_traffic_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  trafficSource: text("traffic_source").notNull(),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  sessions: integer("sessions").default(0).notNull(),
  uniqueVisitors: integer("unique_visitors").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsFormEvents = pgTable("analytics_form_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  formId: text("form_id").notNull(),
  pageUrl: text("page_url"),
  submissions: integer("submissions").default(0).notNull(),
  abandonments: integer("abandonments").default(0).notNull(),
  errors: integer("errors").default(0).notNull(),
  avgTimeToComplete: real("avg_time_to_complete").default(0),
  avgFieldsCompleted: real("avg_fields_completed").default(0),
  uniqueUsers: integer("unique_users").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsEngagement = pgTable("analytics_engagement", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  eventType: text("event_type").notNull(),
  elementSelector: text("element_selector"),
  pageUrl: text("page_url"),
  count: integer("count").default(0).notNull(),
  uniqueUsers: integer("unique_users").default(0).notNull(),
  reason: text("reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsPerformance = pgTable("analytics_performance", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  pageUrl: text("page_url").notNull(),
  avgLoadTime: real("avg_load_time").default(0),
  avgFcp: real("avg_fcp").default(0),
  avgLcp: real("avg_lcp").default(0),
  avgFid: real("avg_fid").default(0),
  avgCls: real("avg_cls").default(0),
  avgTtfb: real("avg_ttfb").default(0),
  sampleCount: integer("sample_count").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsScrollDepth = pgTable("analytics_scroll_depth", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  pageUrl: text("page_url").notNull(),
  reached25: integer("reached_25").default(0).notNull(),
  reached50: integer("reached_50").default(0).notNull(),
  reached75: integer("reached_75").default(0).notNull(),
  reached100: integer("reached_100").default(0).notNull(),
  avgScrollDepth: real("avg_scroll_depth").default(0),
  uniqueUsers: integer("unique_users").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsErrors = pgTable("analytics_errors", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  errorMessage: text("error_message").notNull(),
  errorType: text("error_type"),
  filename: text("filename"),
  pageUrl: text("page_url"),
  count: integer("count").default(0).notNull(),
  uniqueUsers: integer("unique_users").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsMedia = pgTable("analytics_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").notNull(),
  pageUrl: text("page_url"),
  plays: integer("plays").default(0).notNull(),
  completions: integer("completions").default(0).notNull(),
  avgWatchTime: real("avg_watch_time").default(0),
  reached25: integer("reached_25").default(0).notNull(),
  reached50: integer("reached_50").default(0).notNull(),
  reached75: integer("reached_75").default(0).notNull(),
  reached100: integer("reached_100").default(0).notNull(),
  uniqueUsers: integer("unique_users").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsOutbound = pgTable("analytics_outbound", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  eventType: text("event_type").notNull(),
  url: text("url").notNull(),
  linkText: text("link_text"),
  domain: text("domain"),
  fileType: text("file_type"),
  pageUrl: text("page_url"),
  clicks: integer("clicks").default(0).notNull(),
  uniqueUsers: integer("unique_users").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsSearch = pgTable("analytics_search", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  query: text("query").notNull(),
  searchLocation: text("search_location"),
  totalSearches: integer("total_searches").default(0).notNull(),
  avgResultsCount: real("avg_results_count").default(0),
  avgResultsClicked: real("avg_results_clicked").default(0),
  zeroResultsCount: integer("zero_results_count").default(0).notNull(),
  uniqueUsers: integer("unique_users").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsCustomEvents = pgTable("analytics_custom_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  eventName: text("event_name").notNull(),
  category: text("category"),
  label: text("label"),
  pageUrl: text("page_url"),
  count: integer("count").default(0).notNull(),
  totalValue: real("total_value").default(0),
  uniqueUsers: integer("unique_users").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsSessions = pgTable("analytics_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  landingPage: text("landing_page").notNull(),
  exitPage: text("exit_page"),
  totalSessions: integer("total_sessions").default(0).notNull(),
  avgPagesPerSession: real("avg_pages_per_session").default(0),
  avgDuration: real("avg_duration").default(0),
  bounces: integer("bounces").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsVisitors = pgTable("analytics_visitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  newVisitors: integer("new_visitors").default(0).notNull(),
  returningVisitors: integer("returning_visitors").default(0).notNull(),
  avgDaysSinceLastVisit: real("avg_days_since_last_visit").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project-specific team access (for projects outside organizations)
export const projectAccess = pgTable(
  "project_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("viewer").notNull(), // owner, admin, editor, viewer
    grantedBy: text("granted_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("project_access_projectId_idx").on(table.projectId),
    index("project_access_userId_idx").on(table.userId),
  ],
);

export const projectAccessRelations = relations(projectAccess, ({ one }) => ({
  project: one(projects, {
    fields: [projectAccess.projectId],
    references: [projects.id],
  }),
  user: one(user, {
    fields: [projectAccess.userId],
    references: [user.id],
  }),
  granter: one(user, {
    fields: [projectAccess.grantedBy],
    references: [user.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(user, {
    fields: [projects.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [projects.organizationId],
    references: [organization.id],
  }),
  accessList: many(projectAccess),
}));
