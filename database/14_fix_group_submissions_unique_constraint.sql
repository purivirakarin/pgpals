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
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'group_submissions_quest_submitter_unique'
    ) THEN
        ALTER TABLE group_submissions ADD CONSTRAINT group_submissions_quest_submitter_unique 
            UNIQUE(quest_id, submitter_user_id);
    END IF;
END $$;

-- Add index for performance on common queries
CREATE INDEX IF NOT EXISTS idx_group_submissions_quest_id ON group_submissions(quest_id);
CREATE INDEX IF NOT EXISTS idx_group_submissions_submitter ON group_submissions(submitter_user_id);

-- Add comment to clarify the new constraint
COMMENT ON CONSTRAINT group_submissions_quest_submitter_unique ON group_submissions IS 
'Allows multiple group submissions per quest but prevents duplicate submissions from the same user';

-- =====================================================
-- FIX GROUP SUBMISSION FUNCTION
-- =====================================================
-- Ensure we have the correct function that creates submissions and handles telegram data

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
    group_sub_id INTEGER;
    quest_title TEXT;
    total_participants INTEGER;
    participants_text TEXT[];
    all_group_codes TEXT[];
    all_participant_ids INTEGER[];
    submitter_group_code TEXT;
    i INTEGER;
BEGIN
    -- Get submitter's group code
    SELECT pg.group_code INTO submitter_group_code
    FROM partner_groups pg
    WHERE (pg.user1_id = p_submitter_user_id OR pg.user2_id = p_submitter_user_id)
    AND pg.is_active = TRUE;
    
    IF submitter_group_code IS NULL THEN
        RAISE EXCEPTION 'Submitter is not part of any active group';
    END IF;
    
    -- Start with submitter's group code
    all_group_codes := ARRAY[submitter_group_code];
    
    -- Add other group codes (excluding submitter's group if accidentally included)
    FOR i IN 1..array_length(p_group_codes, 1) LOOP
        IF p_group_codes[i] != submitter_group_code THEN
            all_group_codes := all_group_codes || p_group_codes[i];
        END IF;
    END LOOP;
    
    -- Validate we have at least 2 groups total
    IF array_length(all_group_codes, 1) < 2 THEN
        RAISE EXCEPTION 'Group submissions require at least 1 other group besides your own (minimum 4 people total). Your group (%) is automatically included. Please specify at least one other group code like GRP001, GRP002, etc.', submitter_group_code;
    END IF;
    
    -- Get quest title
    SELECT title INTO quest_title FROM quests WHERE id = p_quest_id;
    
    -- Create the submission first (without group flags to avoid constraint violation)
    INSERT INTO submissions (
        user_id, quest_id, telegram_file_id, telegram_message_id, 
        status, submitted_at
    ) VALUES (
        p_submitter_user_id, p_quest_id, p_telegram_file_id, p_telegram_message_id,
        'pending_ai', NOW()
    ) RETURNING id INTO submission_id;
    
    -- Create group submission
    INSERT INTO group_submissions (quest_id, submitter_user_id, submission_id)
    VALUES (p_quest_id, p_submitter_user_id, submission_id)
    RETURNING id INTO group_sub_id;
    
    -- Add all participants from all involved groups
    FOR i IN 1..array_length(all_group_codes, 1) LOOP
        INSERT INTO group_participants (group_submission_id, user_id, partner_id)
        SELECT 
            group_sub_id,
            pg.user1_id,
            pg.user2_id
        FROM partner_groups pg
        WHERE pg.group_code = all_group_codes[i] AND pg.is_active = TRUE
        ON CONFLICT (group_submission_id, user_id) DO NOTHING;
        
        INSERT INTO group_participants (group_submission_id, user_id, partner_id)
        SELECT 
            group_sub_id,
            pg.user2_id,
            pg.user1_id
        FROM partner_groups pg
        WHERE pg.group_code = all_group_codes[i] AND pg.is_active = TRUE
        ON CONFLICT (group_submission_id, user_id) DO NOTHING;
    END LOOP;
    
    -- Collect all participant user IDs for represents_pairs
    SELECT array_agg(DISTINCT user_id) INTO all_participant_ids
    FROM (
        SELECT pg.user1_id as user_id 
        FROM partner_groups pg 
        WHERE pg.group_code = ANY(all_group_codes) AND pg.is_active = TRUE
        UNION
        SELECT pg.user2_id as user_id 
        FROM partner_groups pg 
        WHERE pg.group_code = ANY(all_group_codes) AND pg.is_active = TRUE
    ) participant_users;
    
    -- Update the submission with group info (now both fields together to satisfy constraint)
    UPDATE submissions 
    SET 
        is_group_submission = TRUE,
        group_submission_id = group_sub_id,
        represents_pairs = all_participant_ids
    WHERE id = submission_id;
    
    -- Calculate participants info
    total_participants := array_length(all_group_codes, 1) * 2;
    
    -- Get participant group names
    SELECT array_agg(pg.group_name) INTO participants_text
    FROM partner_groups pg 
    WHERE pg.group_code = ANY(all_group_codes);
    
    RETURN json_build_object(
        'submission_id', submission_id,
        'group_submission_id', group_sub_id,
        'quest_title', quest_title,
        'participant_count', total_participants,
        'participants', participants_text
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIX GROUP SUBMISSION FUNCTION
-- =====================================================
-- Ensure we have the correct function that creates submissions and handles telegram data

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
    group_sub_id INTEGER;  -- Changed variable name to avoid conflict
    quest_title TEXT;
    total_participants INTEGER;
    participants_text TEXT[];
    all_group_codes TEXT[];
    all_participant_ids INTEGER[];  -- Added for represents_pairs
    submitter_group_code TEXT;
    i INTEGER;
BEGIN
    -- Get submitter's group code
    SELECT pg.group_code INTO submitter_group_code
    FROM partner_groups pg
    WHERE (pg.user1_id = p_submitter_user_id OR pg.user2_id = p_submitter_user_id)
    AND pg.is_active = TRUE;
    
    IF submitter_group_code IS NULL THEN
        RAISE EXCEPTION 'Submitter is not part of any active group';
    END IF;
    
    -- Start with submitter's group code
    all_group_codes := ARRAY[submitter_group_code];
    
    -- Add other group codes (excluding submitter's group if accidentally included)
    FOR i IN 1..array_length(p_group_codes, 1) LOOP
        IF p_group_codes[i] != submitter_group_code THEN
            all_group_codes := all_group_codes || p_group_codes[i];
        END IF;
    END LOOP;
    
    -- Validate we have at least 2 groups total
    IF array_length(all_group_codes, 1) < 2 THEN
        RAISE EXCEPTION 'Group submissions require at least 1 other group besides your own (minimum 4 people total). Your group (%) is automatically included. Please specify at least one other group code like GRP001, GRP002, etc.', submitter_group_code;
    END IF;
    
    -- Get quest title
    SELECT title INTO quest_title FROM quests WHERE id = p_quest_id;
    
    -- Create the submission first (without group flags to avoid constraint violation)
    INSERT INTO submissions (
        user_id, quest_id, telegram_file_id, telegram_message_id, 
        status, submitted_at
    ) VALUES (
        p_submitter_user_id, p_quest_id, p_telegram_file_id, p_telegram_message_id,
        'pending_ai', NOW()
    ) RETURNING id INTO submission_id;
    
    -- Create group submission
    INSERT INTO group_submissions (quest_id, submitter_user_id, submission_id)
    VALUES (p_quest_id, p_submitter_user_id, submission_id)
    RETURNING id INTO group_sub_id;
    
    -- Add all participants from all involved groups
    FOR i IN 1..array_length(all_group_codes, 1) LOOP
        -- Debug: Log which group we're processing
        RAISE NOTICE 'Processing group code: %', all_group_codes[i];
        
        -- Add participants for current group
        INSERT INTO group_participants (group_submission_id, user_id, partner_id)
        SELECT 
            group_sub_id,
            pg.user1_id,
            pg.user2_id
        FROM partner_groups pg
        WHERE pg.group_code = all_group_codes[i] AND pg.is_active = TRUE;
        
        INSERT INTO group_participants (group_submission_id, user_id, partner_id)
        SELECT 
            group_sub_id,
            pg.user2_id,
            pg.user1_id
        FROM partner_groups pg
        WHERE pg.group_code = all_group_codes[i] AND pg.is_active = TRUE;
        
        -- Debug: Check how many participants were added
        RAISE NOTICE 'Added participants for group %', all_group_codes[i];
    END LOOP;
    
    -- Collect all participant user IDs for represents_pairs
    SELECT array_agg(DISTINCT user_id) INTO all_participant_ids
    FROM (
        SELECT pg.user1_id as user_id 
        FROM partner_groups pg 
        WHERE pg.group_code = ANY(all_group_codes) AND pg.is_active = TRUE
        UNION
        SELECT pg.user2_id as user_id 
        FROM partner_groups pg 
        WHERE pg.group_code = ANY(all_group_codes) AND pg.is_active = TRUE
    ) participant_users;
    
    -- Update the submission with group info (now both fields together to satisfy constraint)
    UPDATE submissions 
    SET 
        is_group_submission = TRUE,
        group_submission_id = group_sub_id,
        represents_pairs = all_participant_ids
    WHERE id = submission_id;
    
    -- Calculate participants info
    total_participants := array_length(all_group_codes, 1) * 2;
    
    -- Get participant group names
    SELECT array_agg(pg.group_name) INTO participants_text
    FROM partner_groups pg 
    WHERE pg.group_code = ANY(all_group_codes);
    
    RETURN json_build_object(
        'submission_id', submission_id,
        'group_submission_id', group_sub_id,
        'quest_title', quest_title,
        'participant_count', total_participants,
        'participants', participants_text
    );
END;
$$ LANGUAGE plpgsql;
