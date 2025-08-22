-- Remove unused user_quest_completions table and related triggers
-- This table is not used in the current application architecture

-- Drop the table and all its dependencies
DROP TABLE IF EXISTS user_quest_completions CASCADE;

-- Remove the trigger function that inserted into this table
DROP TRIGGER IF EXISTS trigger_update_user_points ON submissions;
DROP FUNCTION IF EXISTS update_user_total_points() CASCADE;

-- The new system uses the user_points_view for automatic point calculation
-- and doesn't need the user_quest_completions table for tracking completed quests

-- Optional: If you want to keep track of completed quests, you can query submissions directly:
-- SELECT DISTINCT user_id, quest_id FROM submissions WHERE status IN ('approved', 'ai_approved');
