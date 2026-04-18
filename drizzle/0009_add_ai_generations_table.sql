-- Migration: Add AI generations tracking table
-- Created: 2026-04-18
-- Description: Tracks all AI generation requests for analytics, rate limiting, and monitoring

CREATE TABLE IF NOT EXISTS "ai_generations" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "generation_type" VARCHAR(50) NOT NULL DEFAULT 'introduction_message',
  "target_contact_id" INTEGER REFERENCES "contacts"("id") ON DELETE SET NULL,
  "success" BOOLEAN NOT NULL,
  "error_message" TEXT,
  "tokens_used" INTEGER,
  "response_time_ms" INTEGER,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "metadata" JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "ai_generations_user_id_idx" ON "ai_generations"("user_id");
CREATE INDEX IF NOT EXISTS "ai_generations_created_at_idx" ON "ai_generations"("created_at");
CREATE INDEX IF NOT EXISTS "ai_generations_user_created_idx" ON "ai_generations"("user_id", "created_at" DESC);

-- Comment
COMMENT ON TABLE "ai_generations" IS 'Tracks all AI generation requests for analytics and rate limiting';
COMMENT ON COLUMN "ai_generations"."generation_type" IS 'Type of AI generation (e.g., introduction_message)';
COMMENT ON COLUMN "ai_generations"."target_contact_id" IS 'Contact ID for introduction message generation';
COMMENT ON COLUMN "ai_generations"."success" IS 'Whether the AI generation was successful';
COMMENT ON COLUMN "ai_generations"."error_message" IS 'Error message if generation failed';
COMMENT ON COLUMN "ai_generations"."tokens_used" IS 'Number of tokens consumed by the AI provider';
COMMENT ON COLUMN "ai_generations"."response_time_ms" IS 'Time taken for AI generation in milliseconds';
COMMENT ON COLUMN "ai_generations"."metadata" IS 'Additional metadata about the generation (prompt details, model used, etc.)';

-- Made with Bob
