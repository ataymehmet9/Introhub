/**
 * Central export file for all Zod schemas
 *
 * This file provides a single import point for all validation schemas
 * used throughout the application.
 */

// User schemas
export {
  userSchema,
  insertUserSchema,
  updateUserSchema,
  publicUserSchema,
  userEmailSchema,
  userResetPasswordSchema,
  userSignupSchema,
  type User,
  type InsertUser,
  type UpdateUser,
  type PublicUser,
  type UserEmail,
  type UserResetPassword,
  type UserSignup,
} from './user.schema'

// Session schemas
export {
  sessionSchema,
  insertSessionSchema,
  updateSessionSchema,
  type Session,
  type InsertSession,
  type UpdateSession,
} from './session.schema'

// Account schemas
export {
  accountSchema,
  insertAccountSchema,
  updateAccountSchema,
  type Account,
  type InsertAccount,
  type UpdateAccount,
} from './account.schema'

// Verification schemas
export {
  verificationSchema,
  insertVerificationSchema,
  updateVerificationSchema,
  type Verification,
  type InsertVerification,
  type UpdateVerification,
} from './verification.schema'

// Contact schemas
export {
  contactSchema,
  insertContactSchema,
  updateContactSchema,
  type Contact,
  type InsertContact,
  type UpdateContact,
} from './contact.schema'

// Introduction Request schemas
export {
  introductionRequestSchema,
  insertIntroductionRequestSchema,
  updateIntroductionRequestSchema,
  approveRequestSchema,
  declineRequestSchema,
  updateRequestStatusSchema,
  requestStatusEnum,
  type IntroductionRequest,
  type InsertIntroductionRequest,
  type UpdateIntroductionRequest,
  type ApproveRequest,
  type DeclineRequest,
  type UpdateRequestStatus,
  type RequestStatus,
} from './introduction-request.schema'

export {
  forgotPasswordEmailSchema,
  introductionRequestEmailSchema,
  introductionResponseEmailSchema,
  introductionEmailSchema,
  welcomeEmailSchema,
  crmSyncFailureEmailSchema,
  type ForgotPasswordEmail,
  type IntroductionRequestEmail,
  type IntroductionResponseEmail,
  type IntroductionEmail,
  type WelcomeEmail,
  type CRMSyncFailureEmail,
} from './email.schema'

// Search schemas
export {
  searchFieldEnum,
  globalSearchInputSchema,
  searchResultSchema,
  globalSearchResponseSchema,
  type SearchField,
  type GlobalSearchInput,
  type SearchResult,
  type GlobalSearchResponse,
} from './search.schema'

// Notification schemas
export {
  notificationSchema,
  insertNotificationSchema,
  updateNotificationSchema,
  markAsReadSchema,
  markAllAsReadSchema,
  getNotificationsSchema,
  notificationMetadataSchema,
  createNotificationInputSchema,
  notificationWithMetadataSchema,
  notificationTypeEnum,
  notificationSearchSchema,
  type Notification,
  type InsertNotification,
  type UpdateNotification,
  type MarkAsRead,
  type MarkAllAsRead,
  type GetNotifications,
  type NotificationMetadata,
  type CreateNotificationInput,
  type NotificationWithMetadata,
  type NotificationType,
  type PaginatedNotifications,
  type NotificationSearchParams,
} from './notification.schema'

// Dashboard schemas
export {
  granularityEnum,
  dashboardQuerySchema,
  responseTimeSchema,
  periodStatsSchema,
  statsComparisonSchema,
  trendDataPointSchema,
  trendDataSchema,
  statusBreakdownSchema,
  topContactSchema,
  topContactsSchema,
  dashboardStatsSchema,
  exportDataSchema,
  type Granularity,
  type DashboardQuery,
  type ResponseTime,
  type PeriodStats,
  type StatsComparison,
  type TrendDataPoint,
  type TrendData,
  type StatusBreakdown,
  type TopContact,
  type TopContacts,
  type DashboardStats,
  type ExportData,
} from './dashboard.schema'

// CRM Integration schemas
export {
  crmIntegrationSchema,
  insertCrmIntegrationSchema,
  updateCrmIntegrationSchema,
  oauthTokenSchema,
  type CrmIntegration,
  type InsertCrmIntegration,
  type UpdateCrmIntegration,
  type OAuthToken,
} from './crm-integration.schema'

// Sync Log schemas
export {
  syncLogSchema,
  insertSyncLogSchema,
  updateSyncLogSchema,
  syncErrorSchema,
  syncResultSchema,
  type SyncLog,
  type InsertSyncLog,
  type UpdateSyncLog,
  type SyncError,
  type SyncResult,
} from './sync-log.schema'
