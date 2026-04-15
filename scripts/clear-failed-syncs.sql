-- Script to clear failed sync status from CRM integrations
-- Run with: psql $DATABASE_URL -f scripts/clear-failed-syncs.sql

-- Show current state
SELECT 
  id,
  provider,
  status,
  sync_status,
  last_sync_error,
  sync_started_at
FROM crm_integrations;

-- Clear failed syncs
UPDATE crm_integrations
SET 
  sync_status = 'idle',
  last_sync_error = NULL,
  sync_started_at = NULL
WHERE sync_status = 'failed' OR last_sync_error IS NOT NULL;

-- Show updated state
SELECT 
  id,
  provider,
  status,
  sync_status,
  last_sync_error,
  sync_started_at
FROM crm_integrations;

-- Made with Bob
