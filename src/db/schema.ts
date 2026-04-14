import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  company: text('company'),
  position: text('position'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeSubscriptionStatus: text('stripe_subscription_status'),
  // Subscription plan fields
  planType: varchar('plan_type', { length: 20 }).default('free').notNull(),
  freeTierStartDate: timestamp('free_tier_start_date').defaultNow(),
  requestsUsedThisCycle: integer('requests_used_this_cycle')
    .default(0)
    .notNull(),
  currentCycleStartDate: timestamp('current_cycle_start_date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

// ============================================================================
// APPLICATION TABLES (Custom schema)
// ============================================================================

// Contact source enum
export const contactSourceEnum = pgEnum('contact_source', [
  'manual',
  'csv',
  'hubspot',
  'salesforce',
])

export const contacts = pgTable(
  'contacts',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    company: varchar('company', { length: 255 }),
    position: varchar('position', { length: 255 }),
    notes: text('notes'),
    phone: varchar('phone', { length: 50 }),
    linkedinUrl: varchar('linkedin_url', { length: 255 }),
    // CRM Integration fields
    source: contactSourceEnum('source').default('manual').notNull(),
    crmContactId: varchar('crm_contact_id', { length: 255 }), // External CRM ID
    metadata: text('metadata'), // JSONB for additional CRM fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('contacts_userId_idx').on(table.userId),
    index('contacts_email_idx').on(table.email),
    index('contacts_crmContactId_idx').on(table.crmContactId),
  ],
)

// CRM Provider enum
export const crmProviderEnum = pgEnum('crm_provider', ['hubspot', 'salesforce'])

// CRM Integration status enum
export const crmIntegrationStatusEnum = pgEnum('crm_integration_status', [
  'active',
  'inactive',
  'error',
])

// CRM Sync status enum - tracks current sync state
export const crmSyncStatusEnum = pgEnum('crm_sync_status', [
  'idle',
  'syncing',
  'completed',
  'failed',
])

// CRM Integrations table - stores OAuth tokens and connection info
export const crmIntegrations = pgTable(
  'crm_integrations',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    provider: crmProviderEnum('provider').notNull(),
    accessToken: text('access_token').notNull(), // Encrypted
    refreshToken: text('refresh_token'), // Encrypted
    expiresAt: timestamp('expires_at'),
    status: crmIntegrationStatusEnum('status').default('active').notNull(),
    syncFrequency: varchar('sync_frequency', { length: 20 })
      .default('24h')
      .notNull(), // Options: 6h, 12h, 24h, weekly
    syncStatus: crmSyncStatusEnum('sync_status').default('idle').notNull(),
    lastSyncedAt: timestamp('last_synced_at'),
    lastSyncError: text('last_sync_error'),
    syncStartedAt: timestamp('sync_started_at'),
    nextSyncAt: timestamp('next_sync_at'),
    connectedAt: timestamp('connected_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('crm_integrations_userId_idx').on(table.userId),
    index('crm_integrations_provider_idx').on(table.provider),
    // Ensure one integration per user per provider
    index('crm_integrations_userId_provider_unique').on(
      table.userId,
      table.provider,
    ),
  ],
)

// Sync Log status enum
export const syncLogStatusEnum = pgEnum('sync_log_status', [
  'in_progress',
  'completed',
  'failed',
  'partial',
])

// Sync Logs table - tracks sync history and errors
export const syncLogs = pgTable(
  'sync_logs',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    integrationId: integer('integration_id')
      .notNull()
      .references(() => crmIntegrations.id, { onDelete: 'cascade' }),
    provider: crmProviderEnum('provider').notNull(),
    status: syncLogStatusEnum('status').default('in_progress').notNull(),
    totalContacts: integer('total_contacts').default(0).notNull(),
    successCount: integer('success_count').default(0).notNull(),
    errorCount: integer('error_count').default(0).notNull(),
    skippedCount: integer('skipped_count').default(0).notNull(),
    updatedCount: integer('updated_count').default(0).notNull(),
    errors: text('errors'), // JSONB array of error details
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('sync_logs_userId_idx').on(table.userId),
    index('sync_logs_integrationId_idx').on(table.integrationId),
    index('sync_logs_status_idx').on(table.status),
  ],
)

export const requestStatusEnum = pgEnum('request_status', [
  'pending',
  'approved',
  'declined',
])

export const introductionRequests = pgTable('introduction_requests', {
  id: serial('id').primaryKey(),
  requesterId: text('requester_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  approverId: text('approver_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  targetContactId: integer('target_contact_id')
    .notNull()
    .references(() => contacts.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  status: requestStatusEnum('status').default('pending').notNull(),
  responseMessage: text('response_message'),
  deleted: boolean('deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const notificationTypeEnum = pgEnum('notification_type', [
  'introduction_request',
  'introduction_approved',
  'introduction_declined',
  'crm_sync_started',
  'crm_sync_completed',
  'crm_sync_failed',
  'crm_oauth_expired',
  'unknown',
])

export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    read: boolean('read').default(false).notNull(),
    relatedRequestId: integer('related_request_id').references(
      () => introductionRequests.id,
      { onDelete: 'cascade' },
    ),
    metadata: text('metadata'), // JSON string for additional data
    emailContent: text('email_content'), // HTML content of the email sent with this notification
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('notifications_userId_idx').on(table.userId),
    index('notifications_read_idx').on(table.read),
  ],
)

// ============================================================================
// RELATIONS (Drizzle ORM relationships)
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  contacts: many(contacts),
  sentRequests: many(introductionRequests, { relationName: 'requester' }),
  receivedRequests: many(introductionRequests, { relationName: 'approver' }),
  notifications: many(notifications),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(user, {
    fields: [contacts.userId],
    references: [user.id],
  }),
  introductionRequests: many(introductionRequests),
}))

export const introductionRequestsRelations = relations(
  introductionRequests,
  ({ one, many }) => ({
    requester: one(user, {
      fields: [introductionRequests.requesterId],
      references: [user.id],
      relationName: 'requester',
    }),
    approver: one(user, {
      fields: [introductionRequests.approverId],
      references: [user.id],
      relationName: 'approver',
    }),
    targetContact: one(contacts, {
      fields: [introductionRequests.targetContactId],
      references: [contacts.id],
    }),
    notifications: many(notifications),
  }),
)

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
  relatedRequest: one(introductionRequests, {
    fields: [notifications.relatedRequestId],
    references: [introductionRequests.id],
  }),
}))

export const crmIntegrationsRelations = relations(
  crmIntegrations,
  ({ one, many }) => ({
    user: one(user, {
      fields: [crmIntegrations.userId],
      references: [user.id],
    }),
    syncLogs: many(syncLogs),
  }),
)

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  user: one(user, {
    fields: [syncLogs.userId],
    references: [user.id],
  }),
  integration: one(crmIntegrations, {
    fields: [syncLogs.integrationId],
    references: [crmIntegrations.id],
  }),
}))

export type RequestStatus = 'pending' | 'approved' | 'declined'
export type NotificationType =
  | 'introduction_request'
  | 'introduction_approved'
  | 'introduction_declined'
export type ContactSource = 'manual' | 'csv' | 'hubspot' | 'salesforce'
export type CrmProvider = 'hubspot' | 'salesforce'
export type CrmIntegrationStatus = 'active' | 'inactive' | 'error'
export type SyncLogStatus = 'in_progress' | 'completed' | 'failed' | 'partial'
