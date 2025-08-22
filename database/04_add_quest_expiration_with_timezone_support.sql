-- Complete Quest Expiration Migration
-- This migration combines all quest expiration functionality including:
-- 1. Adding expires_at column if it doesn't exist
-- 2. Creating indexes for performance
-- 3. Implementing timezone-aware expiration triggers
-- 4. Adding utility functions for manual expiration and debugging

-- =====================================================
-- PART 1: Schema Changes
-- =====================================================

-- Add expires_at column to quests table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quests' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE quests ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added expires_at column to quests table';
    ELSE
        RAISE NOTICE 'expires_at column already exists in quests table';
    END IF;
END $$;

-- Create an index for efficient querying of expired quests
DROP INDEX IF EXISTS idx_quests_expires_at;
CREATE INDEX idx_quests_expires_at ON quests(expires_at) WHERE expires_at IS NOT NULL;

-- Create additional index for status + expiration queries (performance optimization)
DROP INDEX IF EXISTS idx_quests_status_expires_at;
CREATE INDEX idx_quests_status_expires_at ON quests(status, expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- PART 2: Core Expiration Functions
-- =====================================================

-- Enhanced expiration check function with timezone awareness
CREATE OR REPLACE FUNCTION check_quest_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Check expiration on both INSERT and UPDATE
  -- Use UTC timezone for consistent comparison
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() AT TIME ZONE 'UTC' AND NEW.status = 'active' THEN
    NEW.status := 'inactive';
    -- Update the updated_at timestamp if it exists
    IF TG_OP = 'UPDATE' AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quests' AND column_name = 'updated_at'
    ) THEN
        NEW.updated_at := NOW();
    END IF;
    -- Log the automatic expiration
    RAISE NOTICE 'Quest "%" (ID: %) automatically expired due to expiration date %', 
                 NEW.title, NEW.id, NEW.expires_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Manual expiration function for batch operations and cron jobs
CREATE OR REPLACE FUNCTION expire_quests()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
  quest_record RECORD;
BEGIN
  -- Log which quests are about to be expired (for debugging)
  FOR quest_record IN 
    SELECT id, title, expires_at
    FROM quests 
    WHERE expires_at IS NOT NULL 
      AND expires_at <= NOW() AT TIME ZONE 'UTC'
      AND status = 'active'
  LOOP
    RAISE NOTICE 'Expiring quest "%" (ID: %) with expiration date %', 
                 quest_record.title, quest_record.id, quest_record.expires_at;
  END LOOP;

  -- Perform the update
  UPDATE quests 
  SET status = 'inactive',
      updated_at = CASE 
        WHEN EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'quests' AND column_name = 'updated_at'
        ) THEN NOW()
        ELSE updated_at
      END
  WHERE expires_at IS NOT NULL 
    AND expires_at <= NOW() AT TIME ZONE 'UTC'
    AND status = 'active';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log the expiration summary
  IF expired_count > 0 THEN
    RAISE NOTICE 'Successfully expired % quest(s) at %', expired_count, NOW();
  ELSE
    RAISE NOTICE 'No quests needed to be expired at %', NOW();
  END IF;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 3: Trigger Management
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_quest_expiration ON quests;
DROP TRIGGER IF EXISTS trigger_quest_expiration_insert ON quests;
DROP TRIGGER IF EXISTS trigger_quest_expiration_update ON quests;

-- Create comprehensive triggers for both INSERT and UPDATE operations
CREATE TRIGGER trigger_quest_expiration_insert
  BEFORE INSERT ON quests
  FOR EACH ROW
  EXECUTE FUNCTION check_quest_expiration();

CREATE TRIGGER trigger_quest_expiration_update
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION check_quest_expiration();

-- =====================================================
-- PART 4: Utility and Debugging Functions
-- =====================================================

-- Function to check quest expiration status (for debugging and monitoring)
CREATE OR REPLACE FUNCTION check_expired_quests()
RETURNS TABLE(
  id UUID,
  title TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT,
  is_expired BOOLEAN,
  time_until_expiry INTERVAL,
  check_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.title,
    q.expires_at,
    q.status,
    (q.expires_at IS NOT NULL AND q.expires_at <= NOW() AT TIME ZONE 'UTC') as is_expired,
    CASE 
      WHEN q.expires_at IS NOT NULL THEN q.expires_at - (NOW() AT TIME ZONE 'UTC')
      ELSE NULL
    END as time_until_expiry,
    NOW() AT TIME ZONE 'UTC' as check_time
  FROM quests q
  WHERE q.expires_at IS NOT NULL
  ORDER BY q.expires_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get expiration statistics
CREATE OR REPLACE FUNCTION get_expiration_stats()
RETURNS TABLE(
  total_quests_with_expiration INTEGER,
  expired_quests INTEGER,
  active_expiring_quests INTEGER,
  expiring_within_24h INTEGER,
  expiring_within_1h INTEGER
) AS $$
DECLARE
  now_utc TIMESTAMPTZ := NOW() AT TIME ZONE 'UTC';
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM quests WHERE expires_at IS NOT NULL) as total_quests_with_expiration,
    (SELECT COUNT(*)::INTEGER FROM quests WHERE expires_at IS NOT NULL AND expires_at <= now_utc) as expired_quests,
    (SELECT COUNT(*)::INTEGER FROM quests WHERE expires_at IS NOT NULL AND expires_at > now_utc AND status = 'active') as active_expiring_quests,
    (SELECT COUNT(*)::INTEGER FROM quests WHERE expires_at IS NOT NULL AND expires_at > now_utc AND expires_at <= now_utc + INTERVAL '24 hours' AND status = 'active') as expiring_within_24h,
    (SELECT COUNT(*)::INTEGER FROM quests WHERE expires_at IS NOT NULL AND expires_at > now_utc AND expires_at <= now_utc + INTERVAL '1 hour' AND status = 'active') as expiring_within_1h;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 5: Initial Data Processing
-- =====================================================

-- Run the expiration function once to catch any currently expired quests
DO $$
DECLARE
  initial_expired_count INTEGER;
BEGIN
  SELECT expire_quests() INTO initial_expired_count;
  RAISE NOTICE 'Initial migration: Processed % expired quest(s)', initial_expired_count;
END $$;

-- =====================================================
-- PART 6: Verification and Summary
-- =====================================================

-- Display current expiration statistics
DO $$
DECLARE
  stats_record RECORD;
BEGIN
  SELECT * FROM get_expiration_stats() INTO stats_record;
  
  RAISE NOTICE '=== Quest Expiration Migration Summary ===';
  RAISE NOTICE 'Total quests with expiration: %', stats_record.total_quests_with_expiration;
  RAISE NOTICE 'Expired quests: %', stats_record.expired_quests;
  RAISE NOTICE 'Active expiring quests: %', stats_record.active_expiring_quests;
  RAISE NOTICE 'Expiring within 24 hours: %', stats_record.expiring_within_24h;
  RAISE NOTICE 'Expiring within 1 hour: %', stats_record.expiring_within_1h;
  RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- USAGE EXAMPLES AND DOCUMENTATION
-- =====================================================

/*
-- USAGE EXAMPLES:

-- 1. Manually expire all overdue quests:
SELECT expire_quests();

-- 2. Check current expiration status:
SELECT * FROM check_expired_quests();

-- 3. Get expiration statistics:
SELECT * FROM get_expiration_stats();

-- 4. Find quests expiring soon:
SELECT id, title, expires_at, 
       expires_at - NOW() AT TIME ZONE 'UTC' as time_remaining
FROM quests 
WHERE expires_at IS NOT NULL 
  AND expires_at > NOW() AT TIME ZONE 'UTC'
  AND expires_at <= NOW() AT TIME ZONE 'UTC' + INTERVAL '24 hours'
  AND status = 'active'
ORDER BY expires_at;

-- 5. Set up a cron job to run expiration (example for every hour):
-- 0 * * * * psql -d your_database -c "SELECT expire_quests();"

-- IMPORTANT NOTES:
-- - All timestamps are stored and compared in UTC for consistency
-- - Triggers automatically handle expiration on INSERT/UPDATE operations
-- - The expire_quests() function should be called periodically via cron
-- - Use check_expired_quests() and get_expiration_stats() for monitoring
-- - The system handles both manual and automatic expiration scenarios
*/
