-- Task Categories and Group Submissions Migration
-- This migration implements the new task category system and group submission functionality
-- Run this in your Supabase SQL editor

-- =====================================================
-- PART 1: Update Task Categories
-- =====================================================

-- First, update existing categories to map to new schema BEFORE adding constraint
DO $$
DECLARE
    update_count INTEGER;
BEGIN
    UPDATE quests SET category = CASE 
      WHEN category IN ('Health', 'Education', 'Outdoor', 'Creative', 'Social', 'daily', 'weekly', 'community', 'challenge') THEN 'pair'
      WHEN category = 'special' THEN 'bonus'
      ELSE 'pair'
    END;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated % quest categories to new schema', update_count;
END $$;

-- Now add the new category constraint to quests table (after data migration)
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check for any remaining invalid categories
    SELECT COUNT(*) INTO invalid_count
    FROM quests 
    WHERE category NOT IN ('pair', 'multiple-pair', 'bonus');
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % quests with invalid categories. Please check and fix manually before proceeding.', invalid_count;
    END IF;
    
    RAISE NOTICE 'All quest categories are valid. Proceeding to add constraint.';
END $$;

ALTER TABLE quests DROP CONSTRAINT IF EXISTS quests_category_check;
ALTER TABLE quests ADD CONSTRAINT quests_category_check 
CHECK (category IN ('pair', 'multiple-pair', 'bonus'));

-- Add expires_at column if it doesn't exist (for bonus tasks)
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

-- Create function to validate bonus task expiration
CREATE OR REPLACE FUNCTION validate_bonus_task_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- If category is 'bonus', ensure expires_at is set
    IF NEW.category = 'bonus' THEN
        IF NEW.expires_at IS NULL THEN
            -- Set default expiration to 2 days from creation
            NEW.expires_at = NOW() + INTERVAL '2 days';
        END IF;
        
        -- Ensure expiration is in the future
        IF NEW.expires_at <= NOW() THEN
            RAISE EXCEPTION 'Bonus tasks must have an expiration date in the future';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for bonus task validation
DROP TRIGGER IF EXISTS bonus_task_expiration_trigger ON quests;
CREATE TRIGGER bonus_task_expiration_trigger
    BEFORE INSERT OR UPDATE ON quests
    FOR EACH ROW
    EXECUTE FUNCTION validate_bonus_task_expiration();

-- =====================================================
-- PART 2: Group Submission System
-- =====================================================

-- Create group_submissions table for multiple-pair activities
CREATE TABLE IF NOT EXISTS group_submissions (
    id SERIAL PRIMARY KEY,
    quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    submitter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one group submission per quest
    UNIQUE(quest_id)
);

-- Create group_participants table to track which pairs are in group submissions
CREATE TABLE IF NOT EXISTS group_participants (
    id SERIAL PRIMARY KEY,
    group_submission_id INTEGER NOT NULL REFERENCES group_submissions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    opted_out BOOLEAN DEFAULT FALSE,
    opted_out_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user per group submission
    UNIQUE(group_submission_id, user_id)
);

-- Add group submission fields to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_group_submission BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS group_submission_id INTEGER REFERENCES group_submissions(id) ON DELETE SET NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS represents_pairs TEXT[]; -- Array of user IDs this submission represents
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);

-- =====================================================
-- PART 3: Enhanced Submission System for Pairs
-- =====================================================

-- Update submissions table to support pair-wide visibility
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS visible_to_partner BOOLEAN DEFAULT TRUE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS pair_submission BOOLEAN DEFAULT FALSE;

-- Create function to handle pair submission visibility
CREATE OR REPLACE FUNCTION update_pair_submission_visibility()
RETURNS TRIGGER AS $$
DECLARE
    partner_id INTEGER;
BEGIN
    -- Get the submitter's partner
    SELECT u.partner_id INTO partner_id
    FROM users u
    WHERE u.id = NEW.user_id;
    
    -- If user has a partner, mark as pair submission
    IF partner_id IS NOT NULL THEN
        NEW.pair_submission = TRUE;
        NEW.visible_to_partner = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for pair submission visibility
DROP TRIGGER IF EXISTS pair_submission_visibility_trigger ON submissions;
CREATE TRIGGER pair_submission_visibility_trigger
    BEFORE INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_pair_submission_visibility();

-- =====================================================
-- PART 4: Group Submission Management Functions
-- =====================================================

-- Function to create a group submission
CREATE OR REPLACE FUNCTION create_group_submission(
    p_quest_id INTEGER,
    p_submitter_user_id INTEGER,
    p_submission_id INTEGER,
    p_participant_user_ids INTEGER[]
)
RETURNS INTEGER AS $$
DECLARE
    group_sub_id INTEGER;
    user_id INTEGER;
    partner_id INTEGER;
BEGIN
    -- Create the group submission
    INSERT INTO group_submissions (quest_id, submitter_user_id, submission_id)
    VALUES (p_quest_id, p_submitter_user_id, p_submission_id)
    RETURNING id INTO group_sub_id;
    
    -- Add all participants
    FOREACH user_id IN ARRAY p_participant_user_ids
    LOOP
        -- Get user's partner
        SELECT u.partner_id INTO partner_id
        FROM users u
        WHERE u.id = user_id;
        
        -- Add user and their partner to group
        INSERT INTO group_participants (group_submission_id, user_id, partner_id)
        VALUES (group_sub_id, user_id, partner_id)
        ON CONFLICT (group_submission_id, user_id) DO NOTHING;
        
        -- Also add partner as separate record if they exist
        IF partner_id IS NOT NULL THEN
            INSERT INTO group_participants (group_submission_id, user_id, partner_id)
            VALUES (group_sub_id, partner_id, user_id)
            ON CONFLICT (group_submission_id, user_id) DO NOTHING;
        END IF;
    END LOOP;
    
    -- Update the original submission to mark as group submission
    UPDATE submissions 
    SET 
        is_group_submission = TRUE,
        group_submission_id = group_sub_id,
        represents_pairs = ARRAY(
            SELECT DISTINCT unnest(ARRAY[user_id, partner_id]) 
            FROM group_participants 
            WHERE group_submission_id = group_sub_id 
            AND user_id IS NOT NULL
        )
    WHERE id = p_submission_id;
    
    RETURN group_sub_id;
END;
$$ LANGUAGE plpgsql;

-- Function to opt out from group submission
CREATE OR REPLACE FUNCTION opt_out_group_submission(
    p_user_id INTEGER,
    p_group_submission_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    partner_id INTEGER;
BEGIN
    -- Get user's partner
    SELECT partner_id INTO partner_id
    FROM group_participants
    WHERE group_submission_id = p_group_submission_id 
    AND user_id = p_user_id;
    
    -- Opt out the user
    UPDATE group_participants
    SET 
        opted_out = TRUE,
        opted_out_at = NOW(),
        updated_at = NOW()
    WHERE group_submission_id = p_group_submission_id 
    AND user_id = p_user_id;
    
    -- Opt out their partner too
    IF partner_id IS NOT NULL THEN
        UPDATE group_participants
        SET 
            opted_out = TRUE,
            opted_out_at = NOW(),
            updated_at = NOW()
        WHERE group_submission_id = p_group_submission_id 
        AND user_id = partner_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to opt back into group submission
CREATE OR REPLACE FUNCTION opt_in_group_submission(
    p_user_id INTEGER,
    p_group_submission_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    partner_id INTEGER;
    submission_status TEXT;
BEGIN
    -- Check if the group submission is still valid
    SELECT s.status INTO submission_status
    FROM group_submissions gs
    JOIN submissions s ON gs.submission_id = s.id
    WHERE gs.id = p_group_submission_id;
    
    -- Only allow opt-in if submission is still pending or approved
    IF submission_status NOT IN ('pending_ai', 'manual_review', 'approved', 'ai_approved') THEN
        RETURN FALSE;
    END IF;
    
    -- Get user's partner
    SELECT partner_id INTO partner_id
    FROM group_participants
    WHERE group_submission_id = p_group_submission_id 
    AND user_id = p_user_id;
    
    -- Opt in the user
    UPDATE group_participants
    SET 
        opted_out = FALSE,
        opted_out_at = NULL,
        updated_at = NOW()
    WHERE group_submission_id = p_group_submission_id 
    AND user_id = p_user_id;
    
    -- Opt in their partner too
    IF partner_id IS NOT NULL THEN
        UPDATE group_participants
        SET 
            opted_out = FALSE,
            opted_out_at = NULL,
            updated_at = NOW()
        WHERE group_submission_id = p_group_submission_id 
        AND user_id = partner_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 5: Views for Group Submission Management
-- =====================================================

-- View to get submission status for pairs
DROP VIEW IF EXISTS pair_submission_status;
CREATE VIEW pair_submission_status AS
SELECT 
    u.id as user_id,
    u.partner_id,
    q.id as quest_id,
    q.title as quest_title,
    q.category as quest_category,
    
    -- Direct submission by user (excluding deleted)
    s_user.id as user_submission_id,
    s_user.status as user_submission_status,
    s_user.submitted_at as user_submitted_at,
    s_user.is_deleted as user_submission_deleted,
    
    -- Direct submission by partner (excluding deleted)
    s_partner.id as partner_submission_id,
    s_partner.status as partner_submission_status,
    s_partner.submitted_at as partner_submitted_at,
    s_partner.is_deleted as partner_submission_deleted,
    
    -- Group submission info (excluding deleted)
    gs.id as group_submission_id,
    gs.submitter_user_id as group_submitter_id,
    s_group.status as group_submission_status,
    s_group.submitted_at as group_submitted_at,
    s_group.is_deleted as group_submission_deleted,
    gp.opted_out as opted_out_of_group,
    
    -- Overall status for the pair (considering only non-deleted submissions)
    CASE 
        WHEN (s_user.status IN ('approved', 'ai_approved') AND COALESCE(s_user.is_deleted, FALSE) = FALSE) OR 
             (s_partner.status IN ('approved', 'ai_approved') AND COALESCE(s_partner.is_deleted, FALSE) = FALSE) OR
             (s_group.status IN ('approved', 'ai_approved') AND COALESCE(s_group.is_deleted, FALSE) = FALSE AND NOT COALESCE(gp.opted_out, FALSE)) THEN 'completed'
        WHEN (s_user.status IN ('pending_ai', 'manual_review') AND COALESCE(s_user.is_deleted, FALSE) = FALSE) OR 
             (s_partner.status IN ('pending_ai', 'manual_review') AND COALESCE(s_partner.is_deleted, FALSE) = FALSE) OR
             (s_group.status IN ('pending_ai', 'manual_review') AND COALESCE(s_group.is_deleted, FALSE) = FALSE AND NOT COALESCE(gp.opted_out, FALSE)) THEN 'pending'
        WHEN (s_user.status IN ('rejected', 'ai_rejected') OR COALESCE(s_user.is_deleted, FALSE) = TRUE) AND 
             (s_partner.status IN ('rejected', 'ai_rejected') OR COALESCE(s_partner.is_deleted, FALSE) = TRUE) AND
             (s_group.status IN ('rejected', 'ai_rejected') OR COALESCE(s_group.is_deleted, FALSE) = TRUE OR gp.opted_out OR s_group.id IS NULL) THEN 'rejected'
        ELSE 'available'
    END as pair_status

FROM users u
CROSS JOIN quests q
LEFT JOIN submissions s_user ON s_user.user_id = u.id AND s_user.quest_id = q.id
LEFT JOIN submissions s_partner ON s_partner.user_id = u.partner_id AND s_partner.quest_id = q.id
LEFT JOIN group_participants gp ON gp.user_id = u.id AND gp.group_submission_id IN (
    SELECT gs.id FROM group_submissions gs 
    JOIN submissions s ON s.id = gs.submission_id 
    WHERE gs.quest_id = q.id AND COALESCE(s.is_deleted, FALSE) = FALSE
)
LEFT JOIN group_submissions gs ON gs.id = gp.group_submission_id
LEFT JOIN submissions s_group ON s_group.id = gs.submission_id
WHERE q.status = 'active';

-- =====================================================
-- PART 6: Indexes for Performance
-- =====================================================

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_group_submissions_quest_id ON group_submissions(quest_id);
CREATE INDEX IF NOT EXISTS idx_group_submissions_submitter ON group_submissions(submitter_user_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_group_id ON group_participants(group_submission_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user_id ON group_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_opted_out ON group_participants(opted_out);

-- Indexes for new submission columns
CREATE INDEX IF NOT EXISTS idx_submissions_group_submission ON submissions(is_group_submission) WHERE is_group_submission = TRUE;
CREATE INDEX IF NOT EXISTS idx_submissions_pair_submission ON submissions(pair_submission) WHERE pair_submission = TRUE;

-- Index for quest expiration
CREATE INDEX IF NOT EXISTS idx_quests_expires_at ON quests(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quests_category ON quests(category);

-- Add index for soft deletion queries
CREATE INDEX IF NOT EXISTS idx_submissions_is_deleted ON submissions(is_deleted) WHERE is_deleted = TRUE;
CREATE INDEX IF NOT EXISTS idx_submissions_deleted_at ON submissions(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- PART 7: Row Level Security Updates
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE group_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;

-- RLS for group_submissions: users can see groups they're part of, admins see all
DROP POLICY IF EXISTS group_submissions_select_policy ON group_submissions;
CREATE POLICY group_submissions_select_policy ON group_submissions FOR SELECT USING (
    submitter_user_id = auth.uid()::text::integer OR
    EXISTS (
        SELECT 1 FROM group_participants gp 
        WHERE gp.group_submission_id = id 
        AND gp.user_id = auth.uid()::text::integer
    ) OR
    (SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin'
);

-- RLS for group_participants: users can see their own participation
DROP POLICY IF EXISTS group_participants_select_policy ON group_participants;
CREATE POLICY group_participants_select_policy ON group_participants FOR SELECT USING (
    user_id = auth.uid()::text::integer OR
    partner_id = auth.uid()::text::integer OR
    (SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin'
);

-- Allow users to update their opt-out status
DROP POLICY IF EXISTS group_participants_update_policy ON group_participants;
CREATE POLICY group_participants_update_policy ON group_participants FOR UPDATE USING (
    user_id = auth.uid()::text::integer OR
    (SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin'
);

-- =====================================================
-- PART 8: Update Existing Data
-- =====================================================

-- Set default expiration for existing bonus tasks (2 days from now)
DO $$
DECLARE
    bonus_count INTEGER;
BEGIN
    UPDATE quests 
    SET expires_at = NOW() + INTERVAL '2 days'
    WHERE category = 'bonus' AND expires_at IS NULL;
    
    GET DIAGNOSTICS bonus_count = ROW_COUNT;
    RAISE NOTICE 'Set default expiration for % bonus tasks', bonus_count;
END $$;

-- Update existing pair submissions to reflect new structure
DO $$
DECLARE
    pair_count INTEGER;
BEGIN
    UPDATE submissions 
    SET 
        pair_submission = TRUE,
        visible_to_partner = TRUE
    WHERE user_id IN (
        SELECT id FROM users WHERE partner_id IS NOT NULL
    );
    
    GET DIAGNOSTICS pair_count = ROW_COUNT;
    RAISE NOTICE 'Updated % submissions to reflect pair structure', pair_count;
END $$;

-- =====================================================
-- PART 9: Helper Functions
-- =====================================================

-- Function to get submission status for a user-quest pair
CREATE OR REPLACE FUNCTION get_user_quest_status(p_user_id INTEGER, p_quest_id INTEGER)
RETURNS TABLE(
    status TEXT,
    submission_id INTEGER,
    submitted_by TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    can_opt_out BOOLEAN,
    group_submission_id INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pss.pair_status,
        COALESCE(pss.user_submission_id, pss.partner_submission_id, pss.group_submission_id),
        CASE 
            WHEN pss.user_submission_id IS NOT NULL THEN 'self'
            WHEN pss.partner_submission_id IS NOT NULL THEN 'partner'
            WHEN pss.group_submission_id IS NOT NULL THEN 'group'
            ELSE NULL
        END,
        COALESCE(pss.user_submitted_at, pss.partner_submitted_at, pss.group_submitted_at),
        (pss.group_submission_id IS NOT NULL AND NOT COALESCE(pss.opted_out_of_group, FALSE)),
        pss.group_submission_id
    FROM pair_submission_status pss
    WHERE pss.user_id = p_user_id AND pss.quest_id = p_quest_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired bonus tasks
CREATE OR REPLACE FUNCTION cleanup_expired_bonus_tasks()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE quests 
    SET status = 'inactive'
    WHERE category = 'bonus' 
    AND expires_at <= NOW() 
    AND status = 'active';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 10: Triggers for Activity Logging
-- =====================================================

-- Update the existing submission activity trigger to handle group submissions
CREATE OR REPLACE FUNCTION log_submission_activity()
RETURNS TRIGGER AS $$
DECLARE
    quest_title TEXT;
    group_participant_names TEXT;
BEGIN
    SELECT title INTO quest_title FROM quests WHERE id = NEW.quest_id;
    
    -- Log submission creation
    IF TG_OP = 'INSERT' THEN
        IF NEW.is_group_submission THEN
            -- Get names of all participants
            SELECT string_agg(u.name, ', ') INTO group_participant_names
            FROM group_participants gp
            JOIN users u ON u.id = gp.user_id
            WHERE gp.group_submission_id = NEW.group_submission_id
            AND NOT gp.opted_out;
            
            INSERT INTO activities (user_id, activity_type, description, quest_id, submission_id, metadata, created_by, created_at)
            VALUES (
                NEW.user_id,
                'group_quest_submitted',
                'Submitted quest on behalf of group: ' || quest_title,
                NEW.quest_id,
                NEW.id,
                jsonb_build_object('participants', group_participant_names),
                NEW.user_id,
                NOW()
            );
        ELSE
            INSERT INTO activities (user_id, activity_type, description, quest_id, submission_id, created_by, created_at)
            VALUES (
                NEW.user_id,
                CASE WHEN NEW.pair_submission THEN 'pair_quest_submitted' ELSE 'quest_submitted' END,
                'Submitted quest: ' || quest_title,
                NEW.quest_id,
                NEW.id,
                NEW.user_id,
                NOW()
            );
        END IF;
        RETURN NEW;
    END IF;
    
    -- Log submission status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO activities (user_id, activity_type, description, quest_id, submission_id, points_change, created_by, created_at)
        VALUES (
            NEW.user_id,
            'quest_' || NEW.status,
            'Quest ' || NEW.status || ': ' || quest_title,
            NEW.quest_id,
            NEW.id,
            CASE WHEN NEW.status IN ('approved', 'ai_approved') THEN NEW.points_awarded ELSE 0 END,
            COALESCE(NEW.reviewed_by, NEW.user_id),
            NOW()
        );
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the updated trigger
DROP TRIGGER IF EXISTS submission_activity_trigger ON submissions;
CREATE TRIGGER submission_activity_trigger
    AFTER INSERT OR UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION log_submission_activity();

-- =====================================================
-- MIGRATION VERIFICATION
-- =====================================================

DO $$
DECLARE
    quest_count INTEGER;
    pair_count INTEGER;
    multiple_pair_count INTEGER;
    bonus_count INTEGER;
BEGIN
    -- Count quests by category
    SELECT COUNT(*) INTO quest_count FROM quests;
    SELECT COUNT(*) INTO pair_count FROM quests WHERE category = 'pair';
    SELECT COUNT(*) INTO multiple_pair_count FROM quests WHERE category = 'multiple-pair';
    SELECT COUNT(*) INTO bonus_count FROM quests WHERE category = 'bonus';
    
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Total quests: %', quest_count;
    RAISE NOTICE 'Pair tasks: %', pair_count;
    RAISE NOTICE 'Multiple-pair tasks: %', multiple_pair_count;
    RAISE NOTICE 'Bonus tasks: %', bonus_count;
    
    -- Verify all tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_submissions') THEN
        RAISE EXCEPTION 'group_submissions table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_participants') THEN
        RAISE EXCEPTION 'group_participants table was not created';
    END IF;
    
    RAISE NOTICE 'All required tables created successfully';
    RAISE NOTICE 'Task categories and group submissions migration completed!';
END $$;

COMMIT;
