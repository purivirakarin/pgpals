-- Group ID System Migration - Complete Implementation
-- This migration creates a group ID system for partner pairs to replace name-based group submissions
-- Run this in your Supabase SQL editor

-- =====================================================
-- PART 1: Create Partner Groups Table
-- =====================================================

-- Create partner_groups table to manage group IDs
CREATE TABLE IF NOT EXISTS partner_groups (
    id SERIAL PRIMARY KEY,
    group_code VARCHAR(10) UNIQUE NOT NULL, -- e.g., "GRP001", "GRP002"
    group_name VARCHAR(100), -- Optional friendly name
    user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ensure each user can only be in one active group
    CONSTRAINT unique_user1_active EXCLUDE (user1_id WITH =) WHERE (is_active = TRUE),
    CONSTRAINT unique_user2_active EXCLUDE (user2_id WITH =) WHERE (is_active = TRUE),
    
    -- Ensure users can't partner with themselves
    CONSTRAINT different_users CHECK (user1_id != user2_id),
    
    -- Ensure consistent ordering (user1_id < user2_id)
    CONSTRAINT ordered_users CHECK (user1_id < user2_id)
);

-- Function to generate unique group codes
CREATE OR REPLACE FUNCTION generate_group_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        code := 'GRP' || LPAD(counter::TEXT, 3, '0');
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM partner_groups WHERE group_code = code) THEN
            RETURN code;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 999 THEN
            RAISE EXCEPTION 'Cannot generate unique group code - too many groups';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate group codes
CREATE OR REPLACE FUNCTION set_group_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.group_code IS NULL OR NEW.group_code = '' THEN
        NEW.group_code := generate_group_code();
    END IF;
    
    -- Ensure proper user ordering
    IF NEW.user1_id > NEW.user2_id THEN
        DECLARE
            temp_id INTEGER := NEW.user1_id;
        BEGIN
            NEW.user1_id := NEW.user2_id;
            NEW.user2_id := temp_id;
        END;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS partner_groups_code_trigger ON partner_groups;
CREATE TRIGGER partner_groups_code_trigger
    BEFORE INSERT OR UPDATE ON partner_groups
    FOR EACH ROW
    EXECUTE FUNCTION set_group_code();

-- =====================================================
-- PART 2: Migrate Existing Partner Data
-- =====================================================

-- Function to create groups for existing partners
CREATE OR REPLACE FUNCTION migrate_existing_partners()
RETURNS INTEGER AS $$
DECLARE
    partner_record RECORD;
    group_count INTEGER := 0;
    group_name TEXT;
BEGIN
    -- Get all users with partners (avoiding duplicates)
    FOR partner_record IN
        SELECT u1.id as user1_id, u1.name as user1_name, 
               u2.id as user2_id, u2.name as user2_name
        FROM users u1
        JOIN users u2 ON u1.partner_id = u2.id
        WHERE u1.id < u2.id -- Avoid duplicates by only processing smaller ID first
        AND u1.partner_id IS NOT NULL
    LOOP
        -- Create friendly group name
        group_name := partner_record.user1_name || ' & ' || partner_record.user2_name;
        
        -- Insert partner group
        INSERT INTO partner_groups (user1_id, user2_id, group_name)
        VALUES (partner_record.user1_id, partner_record.user2_id, group_name)
        ON CONFLICT DO NOTHING; -- In case of duplicates
        
        group_count := group_count + 1;
    END LOOP;
    
    RETURN group_count;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT migrate_existing_partners() INTO migrated_count;
    RAISE NOTICE 'Migrated % existing partner pairs to group system', migrated_count;
END $$;

-- =====================================================
-- PART 3: Update Group Submissions Structure
-- =====================================================

-- Add group_id reference to group_submissions
ALTER TABLE group_submissions ADD COLUMN IF NOT EXISTS partner_group_id INTEGER REFERENCES partner_groups(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_group_submissions_partner_group ON group_submissions(partner_group_id);

-- Function to get group by group code
CREATE OR REPLACE FUNCTION get_group_by_code(p_group_code TEXT)
RETURNS TABLE(
    group_id INTEGER,
    group_code TEXT,
    group_name TEXT,
    user1_id INTEGER,
    user1_name TEXT,
    user1_telegram TEXT,
    user2_id INTEGER,
    user2_name TEXT,
    user2_telegram TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg.id,
        pg.group_code,
        pg.group_name,
        pg.user1_id,
        u1.name,
        u1.telegram_username,
        pg.user2_id,
        u2.name,
        u2.telegram_username,
        pg.is_active
    FROM partner_groups pg
    JOIN users u1 ON u1.id = pg.user1_id
    JOIN users u2 ON u2.id = pg.user2_id
    WHERE pg.group_code = UPPER(p_group_code)
    AND pg.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's group info
CREATE OR REPLACE FUNCTION get_user_group(p_user_id INTEGER)
RETURNS TABLE(
    group_id INTEGER,
    group_code TEXT,
    group_name TEXT,
    partner_id INTEGER,
    partner_name TEXT,
    partner_telegram TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg.id,
        pg.group_code,
        pg.group_name,
        CASE WHEN pg.user1_id = p_user_id THEN pg.user2_id ELSE pg.user1_id END,
        CASE WHEN pg.user1_id = p_user_id THEN u2.name ELSE u1.name END,
        CASE WHEN pg.user1_id = p_user_id THEN u2.telegram_username ELSE u1.telegram_username END
    FROM partner_groups pg
    JOIN users u1 ON u1.id = pg.user1_id
    JOIN users u2 ON u2.id = pg.user2_id
    WHERE (pg.user1_id = p_user_id OR pg.user2_id = p_user_id)
    AND pg.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: Enhanced Group Submission Functions
-- =====================================================

-- Updated function to automatically include submitter's group
CREATE OR REPLACE FUNCTION create_multi_group_submission(
    p_quest_id INTEGER,
    p_submitter_user_id INTEGER,
    p_submission_id INTEGER,
    p_group_codes TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
    group_sub_id INTEGER;
    group_code TEXT;
    partner_group_rec RECORD;
    submitter_group_rec RECORD;
    all_user_ids INTEGER[] := ARRAY[]::INTEGER[];
    all_group_codes TEXT[];
BEGIN
    -- Get submitter's group first
    SELECT * INTO submitter_group_rec 
    FROM get_user_group(p_submitter_user_id);
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submitter is not part of any active group';
    END IF;
    
    -- Start with submitter's group code, then add other groups
    all_group_codes := ARRAY[submitter_group_rec.group_code];
    
    -- Add other group codes (excluding submitter's group if accidentally included)
    FOREACH group_code IN ARRAY p_group_codes
    LOOP
        IF group_code != submitter_group_rec.group_code THEN
            all_group_codes := all_group_codes || group_code;
        END IF;
    END LOOP;
    
    -- Validate we have at least 2 groups total (4+ people)
    IF array_length(all_group_codes, 1) < 2 THEN
        RAISE EXCEPTION 'Multiple-pair tasks require at least 2 groups (4+ people). You need to specify at least one other group besides your own.';
    END IF;
    
    -- Create the group submission first
    INSERT INTO group_submissions (quest_id, submitter_user_id, submission_id)
    VALUES (p_quest_id, p_submitter_user_id, p_submission_id)
    RETURNING id INTO group_sub_id;
    
    -- Process each group code (now including submitter's group)
    FOREACH group_code IN ARRAY all_group_codes
    LOOP
        -- Get the partner group by code
        SELECT * INTO partner_group_rec 
        FROM get_group_by_code(group_code);
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Group code % not found or inactive', group_code;
        END IF;
        
        -- Add both users as participants
        INSERT INTO group_participants (group_submission_id, user_id, partner_id)
        VALUES 
            (group_sub_id, partner_group_rec.user1_id, partner_group_rec.user2_id),
            (group_sub_id, partner_group_rec.user2_id, partner_group_rec.user1_id)
        ON CONFLICT (group_submission_id, user_id) DO NOTHING;
        
        -- Collect all user IDs
        all_user_ids := all_user_ids || ARRAY[partner_group_rec.user1_id, partner_group_rec.user2_id];
    END LOOP;
    
    -- Update the original submission
    UPDATE submissions 
    SET 
        is_group_submission = TRUE,
        group_submission_id = group_sub_id,
        represents_pairs = all_user_ids
    WHERE id = p_submission_id;
    
    RETURN group_sub_id;
END;
$$ LANGUAGE plpgsql;

-- Updated function to create group submission using group code
CREATE OR REPLACE FUNCTION create_group_submission_by_code(
    p_quest_id INTEGER,
    p_submitter_user_id INTEGER,
    p_submission_id INTEGER,
    p_group_code TEXT
)
RETURNS INTEGER AS $$
DECLARE
    group_sub_id INTEGER;
    partner_group_rec RECORD;
BEGIN
    -- Get the partner group by code
    SELECT * INTO partner_group_rec 
    FROM get_group_by_code(p_group_code);
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group code % not found or inactive', p_group_code;
    END IF;
    
    -- Verify submitter is part of this group
    IF p_submitter_user_id != partner_group_rec.user1_id AND 
       p_submitter_user_id != partner_group_rec.user2_id THEN
        RAISE EXCEPTION 'Submitter is not part of group %', p_group_code;
    END IF;
    
    -- Create the group submission
    INSERT INTO group_submissions (quest_id, submitter_user_id, submission_id, partner_group_id)
    VALUES (p_quest_id, p_submitter_user_id, p_submission_id, partner_group_rec.group_id)
    RETURNING id INTO group_sub_id;
    
    -- Add both users as participants
    INSERT INTO group_participants (group_submission_id, user_id, partner_id)
    VALUES 
        (group_sub_id, partner_group_rec.user1_id, partner_group_rec.user2_id),
        (group_sub_id, partner_group_rec.user2_id, partner_group_rec.user1_id)
    ON CONFLICT (group_submission_id, user_id) DO NOTHING;
    
    -- Update the original submission to mark as group submission
    UPDATE submissions 
    SET 
        is_group_submission = TRUE,
        group_submission_id = group_sub_id,
        represents_pairs = ARRAY[partner_group_rec.user1_id, partner_group_rec.user2_id]
    WHERE id = p_submission_id;
    
    RETURN group_sub_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 5: Views and Helper Functions
-- =====================================================

-- View to show all active groups with member info
DROP VIEW IF EXISTS active_groups_view;
CREATE VIEW active_groups_view AS
SELECT 
    pg.id,
    pg.group_code,
    pg.group_name,
    pg.created_at,
    u1.id as user1_id,
    u1.name as user1_name,
    u1.email as user1_email,
    u1.telegram_username as user1_telegram,
    u2.id as user2_id,
    u2.name as user2_name,
    u2.email as user2_email,
    u2.telegram_username as user2_telegram,
    -- Count of group submissions
    COALESCE(gs_count.count, 0) as total_group_submissions,
    COALESCE(gs_approved.count, 0) as approved_group_submissions
FROM partner_groups pg
JOIN users u1 ON u1.id = pg.user1_id
JOIN users u2 ON u2.id = pg.user2_id
LEFT JOIN (
    SELECT partner_group_id, COUNT(*) as count
    FROM group_submissions gs
    JOIN submissions s ON s.id = gs.submission_id
    WHERE s.is_deleted = FALSE
    GROUP BY partner_group_id
) gs_count ON gs_count.partner_group_id = pg.id
LEFT JOIN (
    SELECT partner_group_id, COUNT(*) as count
    FROM group_submissions gs
    JOIN submissions s ON s.id = gs.submission_id
    WHERE s.is_deleted = FALSE AND s.status IN ('approved', 'ai_approved')
    GROUP BY partner_group_id
) gs_approved ON gs_approved.partner_group_id = pg.id
WHERE pg.is_active = TRUE
ORDER BY pg.group_code;

-- Function to list all groups (for admin/help) - Updated to fix return type
DROP FUNCTION IF EXISTS list_all_active_groups();

CREATE OR REPLACE FUNCTION list_all_active_groups()
RETURNS TABLE(
    group_code VARCHAR(10), -- Match the actual column type
    group_name VARCHAR(100), -- Match the actual column type  
    member_count INTEGER,
    members TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        agv.group_code,
        agv.group_name,
        2::INTEGER as member_count,
        (agv.user1_name || ' & ' || agv.user2_name)::TEXT as members
    FROM active_groups_view agv
    ORDER BY agv.group_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 6: Update Existing Group Submissions (Migration)
-- =====================================================

-- Function to migrate existing group submissions to use partner groups
CREATE OR REPLACE FUNCTION migrate_existing_group_submissions()
RETURNS INTEGER AS $$
DECLARE
    submission_record RECORD;
    migrated_count INTEGER := 0;
    partner_group_id INTEGER;
BEGIN
    -- Get all existing group submissions without partner_group_id
    FOR submission_record IN
        SELECT gs.id as group_submission_id, gs.quest_id, gs.submitter_user_id,
               array_agg(DISTINCT gp.user_id) as participant_ids
        FROM group_submissions gs
        JOIN group_participants gp ON gp.group_submission_id = gs.id
        WHERE gs.partner_group_id IS NULL
        GROUP BY gs.id, gs.quest_id, gs.submitter_user_id
    LOOP
        -- Try to find matching partner group
        SELECT pg.id INTO partner_group_id
        FROM partner_groups pg
        WHERE (pg.user1_id = ANY(submission_record.participant_ids) AND 
               pg.user2_id = ANY(submission_record.participant_ids))
        OR (pg.user1_id = submission_record.submitter_user_id OR 
            pg.user2_id = submission_record.submitter_user_id)
        AND pg.is_active = TRUE
        LIMIT 1;
        
        -- Update group submission if partner group found
        IF partner_group_id IS NOT NULL THEN
            UPDATE group_submissions 
            SET partner_group_id = partner_group_id 
            WHERE id = submission_record.group_submission_id;
            
            migrated_count := migrated_count + 1;
        END IF;
    END LOOP;
    
    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Execute migration of existing group submissions
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT migrate_existing_group_submissions() INTO migrated_count;
    RAISE NOTICE 'Migrated % existing group submissions to use partner groups', migrated_count;
END $$;

-- =====================================================
-- PART 7: API Functions
-- =====================================================

-- Update the transaction function to return correct participant count
-- (now the participant count calculation should account for automatic inclusion)
CREATE OR REPLACE FUNCTION create_multi_group_submission_transaction(
    p_quest_id INTEGER,
    p_submitter_user_id INTEGER,
    p_telegram_file_id TEXT,
    p_telegram_message_id INTEGER,
    p_group_codes TEXT[]
)
RETURNS JSON AS $$
DECLARE
    submission_id INTEGER;
    group_submission_id INTEGER;
    quest_title TEXT;
    total_participants INTEGER;
    participants_text TEXT[];
    submitter_group_code TEXT;
    all_group_codes TEXT[];
BEGIN
    -- Get submitter's group code
    SELECT group_code INTO submitter_group_code 
    FROM get_user_group(p_submitter_user_id);
    
    IF submitter_group_code IS NULL THEN
        RAISE EXCEPTION 'Submitter is not part of any active group';
    END IF;
    
    -- Build final group codes list (submitter's group + other groups, excluding duplicates)
    all_group_codes := ARRAY[submitter_group_code];
    FOR i IN 1..array_length(p_group_codes, 1)
    LOOP
        IF p_group_codes[i] != submitter_group_code THEN
            all_group_codes := all_group_codes || p_group_codes[i];
        END IF;
    END LOOP;
    
    -- Get quest title
    SELECT title INTO quest_title FROM quests WHERE id = p_quest_id;
    
    -- Create the submission first
    INSERT INTO submissions (
        user_id, quest_id, telegram_file_id, telegram_message_id, 
        status, submitted_at, is_group_submission
    ) VALUES (
        p_submitter_user_id, p_quest_id, p_telegram_file_id, p_telegram_message_id,
        'pending_ai', NOW(), TRUE
    ) RETURNING id INTO submission_id;
    
    -- Create group submission using the updated function
    SELECT create_multi_group_submission(
        p_quest_id, p_submitter_user_id, submission_id, p_group_codes
    ) INTO group_submission_id;
    
    -- Calculate participants info (total groups including submitter's)
    total_participants := array_length(all_group_codes, 1) * 2;
    
    -- Get participant names for response (all groups including submitter's)
    SELECT array_agg(agv.group_name) INTO participants_text
    FROM active_groups_view agv 
    WHERE agv.group_code = ANY(all_group_codes);
    
    RETURN json_build_object(
        'submission_id', submission_id,
        'group_submission_id', group_submission_id,
        'quest_title', quest_title,
        'participant_count', total_participants,
        'participants', participants_text
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 8: Indexes and Performance
-- =====================================================

-- Indexes for partner_groups
CREATE INDEX IF NOT EXISTS idx_partner_groups_code ON partner_groups(group_code);
CREATE INDEX IF NOT EXISTS idx_partner_groups_user1 ON partner_groups(user1_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_partner_groups_user2 ON partner_groups(user2_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_partner_groups_active ON partner_groups(is_active) WHERE is_active = TRUE;

-- =====================================================
-- PART 9: Row Level Security
-- =====================================================

-- Enable RLS on partner_groups
ALTER TABLE partner_groups ENABLE ROW LEVEL SECURITY;

-- Users can see groups they're part of, admins see all
DROP POLICY IF EXISTS partner_groups_select_policy ON partner_groups;
CREATE POLICY partner_groups_select_policy ON partner_groups FOR SELECT USING (
    user1_id = auth.uid()::text::integer OR
    user2_id = auth.uid()::text::integer OR
    (SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin'
);

-- Only admins can create/update partner groups
DROP POLICY IF EXISTS partner_groups_insert_policy ON partner_groups;
CREATE POLICY partner_groups_insert_policy ON partner_groups FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin'
);

DROP POLICY IF EXISTS partner_groups_update_policy ON partner_groups;
CREATE POLICY partner_groups_update_policy ON partner_groups FOR UPDATE USING (
    (SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin'
);

-- =====================================================
-- PART 10: Grant Permissions
-- =====================================================

-- Grant permissions on new objects
GRANT SELECT ON partner_groups TO authenticated, anon;
GRANT SELECT ON active_groups_view TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_group_by_code(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_group(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION list_all_active_groups() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_multi_group_submission_transaction(INTEGER, INTEGER, TEXT, INTEGER, TEXT[]) TO authenticated, anon;

-- =====================================================
-- MIGRATION VERIFICATION
-- =====================================================

DO $$
DECLARE
    groups_count INTEGER;
    submissions_with_groups INTEGER;
BEGIN
    -- Count partner groups
    SELECT COUNT(*) INTO groups_count FROM partner_groups WHERE is_active = TRUE;
    
    -- Count group submissions with partner groups
    SELECT COUNT(*) INTO submissions_with_groups 
    FROM group_submissions 
    WHERE partner_group_id IS NOT NULL;
    
    RAISE NOTICE '=== GROUP ID SYSTEM MIGRATION COMPLETED ===';
    RAISE NOTICE 'Active partner groups created: %', groups_count;
    RAISE NOTICE 'Group submissions linked to partner groups: %', submissions_with_groups;
    
    -- Verify tables and functions exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_groups') THEN
        RAISE EXCEPTION 'partner_groups table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_group_by_code') THEN
        RAISE EXCEPTION 'get_group_by_code function was not created';
    END IF;
    
    RAISE NOTICE 'Group ID system successfully implemented!';
    RAISE NOTICE 'Groups can now be referenced by codes like: GRP001, GRP002, etc.';
    RAISE NOTICE 'Users only need to specify OTHER groups - their own group is automatically included';
END $$;

COMMIT;