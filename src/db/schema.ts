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

export const contacts = pgTable('contacts', {
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

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

export type RequestStatus = 'pending' | 'approved' | 'declined'
export type NotificationType =
  | 'introduction_request'
  | 'introduction_approved'
  | 'introduction_declined'
