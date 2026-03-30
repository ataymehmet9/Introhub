ALTER TABLE "user" ALTER COLUMN "free_tier_start_date" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "current_cycle_start_date" SET DEFAULT now();