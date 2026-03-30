ALTER TABLE "user" ADD COLUMN "plan_type" varchar(20) DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "free_tier_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "requests_used_this_cycle" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "current_cycle_start_date" timestamp;--> statement-breakpoint

-- Initialize existing users to free tier with current date as start
UPDATE "user"
SET
  free_tier_start_date = CURRENT_TIMESTAMP,
  current_cycle_start_date = CURRENT_TIMESTAMP
WHERE free_tier_start_date IS NULL;--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_plan_type ON "user"(plan_type);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_user_free_tier_start ON "user"(free_tier_start_date) WHERE free_tier_start_date IS NOT NULL;