import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("member_role", ["owner", "admin", "viewer"]);
export const planEnum = pgEnum("billing_plan", ["free", "pro"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    shortPrefix: text("short_prefix").notNull().unique(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    plan: planEnum("plan").default("free").notNull(),
    linkLimit: integer("link_limit").default(10).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("workspaces_slug_idx").on(table.slug),
    shortPrefixIdx: uniqueIndex("workspaces_short_prefix_idx").on(
      table.shortPrefix
    ),
    stripeSubscriptionIdIdx: index("workspaces_stripe_sub_idx").on(
      table.stripeSubscriptionId
    ),
  })
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").default("viewer").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    memberLookupIdx: index("member_lookup_idx").on(
      table.workspaceId,
      table.userId
    ),
  })
);

export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: roleEnum("role").default("viewer").notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("invite_token_idx").on(table.token),
    workspaceEmailIdx: index("invite_workspace_email_idx").on(
      table.workspaceId,
      table.email
    ),
  })
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    vTokenIdx: uniqueIndex("verification_token_idx").on(table.token),
  })
);

export const links = pgTable(
  "links",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    shortCode: text("short_code").notNull(),
    originalUrl: text("original_url").notNull(),
    title: text("title"),
    isActive: boolean("is_active").default(true).notNull(),
    password: text("password"),
    expiresAt: timestamp("expires_at"),
    maxClicks: integer("max_clicks"),
    clicksCount: integer("clicks_count").default(0).notNull(),
    iosUrl: text("ios_url"),
    androidUrl: text("android_url"),
    desktopUrl: text("desktop_url"),
    geoRouting: jsonb("geo_routing").$type<Record<string, string>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workspaceShortCodeIdx: uniqueIndex("links_workspace_short_code_idx").on(
      table.workspaceId,
      table.shortCode
    ),
    workspaceLinksIdx: index("links_workspace_idx").on(table.workspaceId),
  })
);

export const analytics = pgTable(
  "analytics",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    country: text("country").default("Unknown").notNull(),
    referrer: text("referrer").default("Direct").notNull(),
    device: text("device").default("Desktop").notNull(),
    browser: text("browser").default("Unknown").notNull(),
    ipHash: text("ip_hash").notNull(),
  },
  (table) => ({
    linkAnalyticsIdx: index("analytics_link_idx").on(table.linkId),
  })
);

export const failedAttempts = pgTable(
  "failed_attempts",
  {
    id: text("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    attempts: integer("attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    ipLinkIdx: uniqueIndex("ip_link_idx").on(table.ipHash, table.linkId),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(workspaceMembers),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  links: many(links),
  invitations: many(workspaceInvitations),
}));

export const workspaceInvitationsRelations = relations(
  workspaceInvitations,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceInvitations.workspaceId],
      references: [workspaces.id],
    }),
  })
);

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
    }),
  })
);

export const linksRelations = relations(links, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [links.workspaceId],
    references: [workspaces.id],
  }),
  clicks: many(analytics),
  failedAttempts: many(failedAttempts),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  link: one(links, {
    fields: [analytics.linkId],
    references: [links.id],
  }),
}));

export const failedAttemptsRelations = relations(failedAttempts, ({ one }) => ({
  link: one(links, {
    fields: [failedAttempts.linkId],
    references: [links.id],
  }),
}));
