-- Add expires_at column to quests table
ALTER TABLE quests 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create an index for efficient querying of expired quests
CREATE INDEX idx_quests_expires_at ON quests(expires_at) WHERE expires_at IS NOT NULL;

-- Add a trigger to automatically set status to inactive when expired
CREATE OR REPLACE FUNCTION check_quest_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() AND NEW.status = 'active' THEN
    NEW.status := 'inactive';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs on update
CREATE TRIGGER trigger_quest_expiration
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION check_quest_expiration();

-- Create a function to expire quests (for cron job)
CREATE OR REPLACE FUNCTION expire_quests()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE quests 
  SET status = 'inactive'
  WHERE expires_at <= NOW() 
    AND status = 'active';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;
