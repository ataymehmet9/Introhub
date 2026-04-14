CREATE TYPE "public"."contact_source" AS ENUM('manual', 'csv', 'hubspot', 'salesforce');--> statement-breakpoint
CREATE TYPE "public"."crm_integration_status" AS ENUM('active', 'inactive', 'error');--> statement-breakpoint
CREATE TYPE "public"."crm_provider" AS ENUM('hubspot', 'salesforce');--> statement-breakpoint
CREATE TYPE "public"."sync_log_status" AS ENUM('in_progress', 'completed', 'failed', 'partial');--> statement-breakpoint
CREATE TABLE "crm_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" "crm_provider" NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"status" "crm_integration_status" DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"integration_id" integer NOT NULL,
	"provider" "crm_provider" NOT NULL,
	"status" "sync_log_status" DEFAULT 'in_progress' NOT NULL,
	"total_contacts" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"errors" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "source" "contact_source" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "crm_contact_id" varchar(255);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "crm_integrations" ADD CONSTRAINT "crm_integrations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_integration_id_crm_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."crm_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crm_integrations_userId_idx" ON "crm_integrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "crm_integrations_provider_idx" ON "crm_integrations" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "crm_integrations_userId_provider_unique" ON "crm_integrations" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "sync_logs_userId_idx" ON "sync_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sync_logs_integrationId_idx" ON "sync_logs" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "sync_logs_status_idx" ON "sync_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contacts_userId_idx" ON "contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contacts_crmContactId_idx" ON "contacts" USING btree ("crm_contact_id");