CREATE TYPE "public"."crm_sync_status" AS ENUM('idle', 'syncing', 'completed', 'failed');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'crm_sync_started' BEFORE 'unknown';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'crm_sync_completed' BEFORE 'unknown';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'crm_sync_failed' BEFORE 'unknown';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'crm_oauth_expired' BEFORE 'unknown';--> statement-breakpoint
ALTER TABLE "crm_integrations" ADD COLUMN "sync_frequency" varchar(20) DEFAULT '24h' NOT NULL;--> statement-breakpoint
ALTER TABLE "crm_integrations" ADD COLUMN "sync_status" "crm_sync_status" DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "crm_integrations" ADD COLUMN "last_sync_error" text;--> statement-breakpoint
ALTER TABLE "crm_integrations" ADD COLUMN "sync_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "crm_integrations" ADD COLUMN "next_sync_at" timestamp;