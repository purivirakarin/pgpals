-- Fix quest expiration handling
-- This migration addresses timezone issues and adds missing triggers

-- Update the expiration check function to be more robust
CREATE OR REPLACE FUNCTION check_quest_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Check expiration on both INSERT and UPDATE
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() AT TIME ZONE 'UTC' AND NEW.status = 'active' THEN
    NEW.status := 'inactive';
    -- Log the automatic expiration
    RAISE NOTICE 'Quest % automatically expired due to expiration date %', NEW.title, NEW.expires_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_quest_expiration ON quests;

-- Create triggers for both INSERT and UPDATE
CREATE TRIGGER trigger_quest_expiration_insert
  BEFORE INSERT ON quests
  FOR EACH ROW
  EXECUTE FUNCTION check_quest_expiration();

CREATE TRIGGER trigger_quest_expiration_update
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION check_quest_expiration();

-- Update the expire_quests function to be more timezone-aware
CREATE OR REPLACE FUNCTION expire_quests()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE quests 
  SET status = 'inactive',
      updated_at = NOW()
  WHERE expires_at IS NOT NULL 
    AND expires_at <= NOW() AT TIME ZONE 'UTC'
    AND status = 'active';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log the expiration if any quests were expired
  IF expired_count > 0 THEN
    RAISE NOTICE 'Expired % quest(s) at %', expired_count, NOW();
  END IF;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Run the expiration function once to catch any currently expired quests
SELECT expire_quests();

-- Create a function to check quest expiration status (for debugging)
CREATE OR REPLACE FUNCTION check_expired_quests()
RETURNS TABLE(
  id UUID,
  title TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT,
  is_expired BOOLEAN,
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
    NOW() AT TIME ZONE 'UTC' as check_time
  FROM quests q
  WHERE q.expires_at IS NOT NULL
  ORDER BY q.expires_at;
END;
$$ LANGUAGE plpgsql;
