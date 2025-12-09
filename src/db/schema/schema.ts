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
    activeTeamId: text("active_team_id"),
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

export const team = pgTable(
  "team",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(
      () => /* @__PURE__ */ new Date(),
    ),
  },
  (table) => [index("team_organizationId_idx").on(table.organizationId)],
);

export const teamMember = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("teamMember_teamId_idx").on(table.teamId),
    index("teamMember_userId_idx").on(table.userId),
  ],
);

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
    teamId: text("team_id"),
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
  teamMembers: many(teamMember),
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
  teams: many(team),
  members: many(member),
  invitations: many(invitation),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  teamMembers: many(teamMember),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
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
    role: text("role").default("viewer").notNull(),
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

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    
    type: text("type").notNull(), 
    category: text("category").notNull(), 
    
    
    title: text("title").notNull(),
    message: text("message").notNull(),
    
    
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organization.id, { onDelete: "cascade" }),
    invitationId: text("invitation_id").references(() => invitation.id, { onDelete: "cascade" }),
    
    
    actionData: text("action_data"), 
    actionUrl: text("action_url"), 
    
    
    isRead: boolean("is_read").default(false).notNull(),
    isDismissed: boolean("is_dismissed").default(false).notNull(),
    
    
    priority: text("priority").default("normal").notNull(),
    
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    readAt: timestamp("read_at"),
    expiresAt: timestamp("expires_at"), 
  },
  (table) => [
    index("notifications_userId_idx").on(table.userId),
    index("notifications_type_idx").on(table.type),
    index("notifications_category_idx").on(table.category),
    index("notifications_isRead_idx").on(table.isRead),
    index("notifications_createdAt_idx").on(table.createdAt),
  ]
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    
    
    emailAccountUpdates: boolean("email_account_updates").default(true).notNull(),
    emailSecurityAlerts: boolean("email_security_alerts").default(true).notNull(),
    emailWeeklyReports: boolean("email_weekly_reports").default(false).notNull(),
    emailProductUpdates: boolean("email_product_updates").default(true).notNull(),
    emailUsageAlerts: boolean("email_usage_alerts").default(true).notNull(),
    emailOrgActivity: boolean("email_org_activity").default(false).notNull(),
    
    
    inAppTeamInvitations: boolean("in_app_team_invitations").default(true).notNull(),
    inAppUptimeAlerts: boolean("in_app_uptime_alerts").default(true).notNull(),
    inAppErrorAlerts: boolean("in_app_error_alerts").default(true).notNull(),
    inAppUsageAlerts: boolean("in_app_usage_alerts").default(true).notNull(),
    inAppSecurityAlerts: boolean("in_app_security_alerts").default(true).notNull(),
    inAppOrgActivity: boolean("in_app_org_activity").default(true).notNull(),
    inAppProductUpdates: boolean("in_app_product_updates").default(true).notNull(),
    inAppWeeklyReports: boolean("in_app_weekly_reports").default(false).notNull(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("notification_preferences_userId_idx").on(table.userId)]
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
  organization: one(organization, {
    fields: [notifications.organizationId],
    references: [organization.id],
  }),
  invitation: one(invitation, {
    fields: [notifications.invitationId],
    references: [invitation.id],
  }),
}));

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(user, {
      fields: [notificationPreferences.userId],
      references: [user.id],
    }),
  })
);


export const uptimeMonitors = pgTable(
  "uptime_monitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    
    
    name: text("name").notNull(),
    url: text("url").notNull(),
    checkInterval: integer("check_interval").default(60).notNull(), 
    timeout: integer("timeout").default(30).notNull(), 
    
    
    expectedStatusCode: integer("expected_status_code").default(200).notNull(),
    
    
    isActive: boolean("is_active").default(true).notNull(),
    isPaused: boolean("is_paused").default(false).notNull(),
    
    
    currentStatus: text("current_status").default("unknown").notNull(), 
    lastCheckedAt: timestamp("last_checked_at"),
    lastStatusChange: timestamp("last_status_change"),
    
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("uptime_monitors_projectId_idx").on(table.projectId),
    index("uptime_monitors_currentStatus_idx").on(table.currentStatus),
  ]
);

export const uptimeChecks = pgTable(
  "uptime_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => uptimeMonitors.id, { onDelete: "cascade" }),
    
    
    status: text("status").notNull(), 
    statusCode: integer("status_code"),
    responseTime: integer("response_time"), 
    
    
    errorMessage: text("error_message"),
    
    
    checkedAt: timestamp("checked_at").defaultNow().notNull(),
  },
  (table) => [
    index("uptime_checks_monitorId_idx").on(table.monitorId),
    index("uptime_checks_checkedAt_idx").on(table.checkedAt),
    index("uptime_checks_status_idx").on(table.status),
  ]
);

export const uptimeIncidents = pgTable(
  "uptime_incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => uptimeMonitors.id, { onDelete: "cascade" }),
    
    
    status: text("status").notNull(), 
    cause: text("cause"), 
    
    
    startedAt: timestamp("started_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
    
    
    durationSeconds: integer("duration_seconds"),
  },
  (table) => [
    index("uptime_incidents_monitorId_idx").on(table.monitorId),
    index("uptime_incidents_status_idx").on(table.status),
    index("uptime_incidents_startedAt_idx").on(table.startedAt),
  ]
);


export const uptimeDaily = pgTable(
  "uptime_daily",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => uptimeMonitors.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    
    
    totalChecks: integer("total_checks").default(0).notNull(),
    successfulChecks: integer("successful_checks").default(0).notNull(),
    failedChecks: integer("failed_checks").default(0).notNull(),
    
    
    uptimePercentage: real("uptime_percentage").default(100),
    
    
    avgResponseTime: integer("avg_response_time"),
    minResponseTime: integer("min_response_time"),
    maxResponseTime: integer("max_response_time"),
    
    
    incidentsCount: integer("incidents_count").default(0).notNull(),
    totalDowntimeSeconds: integer("total_downtime_seconds").default(0).notNull(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("uptime_daily_monitorId_idx").on(table.monitorId),
    index("uptime_daily_date_idx").on(table.date),
  ]
);


export const uptimeMonitorsRelations = relations(uptimeMonitors, ({ one, many }) => ({
  project: one(projects, {
    fields: [uptimeMonitors.projectId],
    references: [projects.id],
  }),
  checks: many(uptimeChecks),
  incidents: many(uptimeIncidents),
  dailyStats: many(uptimeDaily),
}));

export const uptimeChecksRelations = relations(uptimeChecks, ({ one }) => ({
  monitor: one(uptimeMonitors, {
    fields: [uptimeChecks.monitorId],
    references: [uptimeMonitors.id],
  }),
}));

export const uptimeIncidentsRelations = relations(uptimeIncidents, ({ one }) => ({
  monitor: one(uptimeMonitors, {
    fields: [uptimeIncidents.monitorId],
    references: [uptimeMonitors.id],
  }),
}));

export const uptimeDailyRelations = relations(uptimeDaily, ({ one }) => ({
  monitor: one(uptimeMonitors, {
    fields: [uptimeDaily.monitorId],
    references: [uptimeMonitors.id],
  }),
}));
