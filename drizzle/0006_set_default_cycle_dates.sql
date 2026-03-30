-- Migration: Set default cycle start dates for existing users
-- This ensures all users have a valid currentCycleStartDate and freeTierStartDate
-- so the "Resets On" date displays correctly in the billing UI

-- Update users who don't have a currentCycleStartDate
-- Use their createdAt date if available, otherwise use current timestamp
UPDATE "user"
SET 
  "currentCycleStartDate" = COALESCE("createdAt", NOW()),
  "freeTierStartDate" = COALESCE("createdAt", NOW())
WHERE 
  "currentCycleStartDate" IS NULL
  AND "planType" = 'free';

-- Ensure all free tier users have a freeTierStartDate
UPDATE "user"
SET "freeTierStartDate" = COALESCE("createdAt", NOW())
WHERE 
  "freeTierStartDate" IS NULL
  AND "planType" = 'free';

-- Made with Bob
