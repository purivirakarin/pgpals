-- =====================================================
-- FIX GROUP SUBMISSIONS UNIQUE CONSTRAINT
-- =====================================================
-- This migration fixes the overly restrictive unique constraint on group_submissions
-- that prevents multiple groups from submitting the same multi-pair quest.
-- 
-- The original UNIQUE(quest_id) constraint meant only one group submission per quest
-- across the entire system, but multi-pair quests should allow multiple separate
-- group collaborations.

-- Remove the overly restrictive unique constraint
ALTER TABLE group_submissions DROP CONSTRAINT IF EXISTS group_submissions_quest_id_key;

-- Add a more appropriate constraint that allows multiple group submissions per quest
-- but prevents a user from submitting multiple times as the submitter for the same quest
ALTER TABLE group_submissions ADD CONSTRAINT group_submissions_quest_submitter_unique 
    UNIQUE(quest_id, submitter_user_id);

-- Add index for performance on common queries
CREATE INDEX IF NOT EXISTS idx_group_submissions_quest_id ON group_submissions(quest_id);
CREATE INDEX IF NOT EXISTS idx_group_submissions_submitter ON group_submissions(submitter_user_id);

-- Add comment to clarify the new constraint
COMMENT ON CONSTRAINT group_submissions_quest_submitter_unique ON group_submissions IS 
'Allows multiple group submissions per quest but prevents duplicate submissions from the same user';
