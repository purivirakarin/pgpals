-- =====================================================
-- COMPREHENSIVE FIX FOR MULTI-PAIR SUBMISSION VISIBILITY
-- =====================================================
-- This migration ensures that all members of multi-pair submissions
-- can see the submission in their my-submissions page and the count
-- is correctly reflected in their profile page

-- =====================================================
-- 1. VERIFY AND FIX GROUP PARTICIPANTS DATA
-- =====================================================

-- Function to ensure all group submission participants are properly recorded
CREATE OR REPLACE FUNCTION fix_missing_group_participants()
RETURNS TABLE(fixed_submissions INT, total_participants_added INT) AS $$
DECLARE
    rec RECORD;
    missing_count INT := 0;
    fixed_count INT := 0;
    total_added INT := 0;
BEGIN
    -- Check each group submission for missing participants
    FOR rec IN 
        SELECT DISTINCT 
            gs.id as group_submission_id,
            gs.quest_id,
            s.represents_pairs,
            array_length(s.represents_pairs, 1) as expected_participants,
            COUNT(gp.user_id) as actual_participants
        FROM group_submissions gs
        JOIN submissions s ON gs.submission_id = s.id
        LEFT JOIN group_participants gp ON gs.id = gp.group_submission_id
        GROUP BY gs.id, gs.quest_id, s.represents_pairs
        HAVING COUNT(gp.user_id) < array_length(s.represents_pairs, 1)
    LOOP
        fixed_count := fixed_count + 1;
        
        -- Add missing participants
        INSERT INTO group_participants (group_submission_id, user_id, partner_id)
        SELECT 
            rec.group_submission_id,
            unnest(rec.represents_pairs)::INTEGER,
            u.partner_id
        FROM users u
        WHERE u.id = ANY(rec.represents_pairs)
        ON CONFLICT (group_submission_id, user_id) DO NOTHING;
        
        GET DIAGNOSTICS missing_count = ROW_COUNT;
        total_added := total_added + missing_count;
        
        RAISE NOTICE 'Fixed group submission %, added % missing participants', 
                     rec.group_submission_id, missing_count;
    END LOOP;
    
    RETURN QUERY SELECT fixed_count, total_added;
END;
$$ LANGUAGE plpgsql;

-- Run the fix
SELECT * FROM fix_missing_group_participants();

-- =====================================================
-- 2. ENHANCED GROUP SUBMISSION CREATION FUNCTION
-- =====================================================

-- Updated function with better error handling and participant tracking
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
    participant_count INTEGER;
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
    
    -- Collect all participant user IDs for represents_pairs FIRST
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
    
    -- Validate we have participants
    IF array_length(all_participant_ids, 1) IS NULL OR array_length(all_participant_ids, 1) < 4 THEN
        RAISE EXCEPTION 'Could not find enough participants. Expected at least 4 users from groups: %', all_group_codes;
    END IF;
    
    -- Create the submission with all required fields (without group flags initially)
    INSERT INTO submissions (
        user_id, quest_id, telegram_file_id, telegram_message_id, 
        status, submitted_at, represents_pairs
    ) VALUES (
        p_submitter_user_id, p_quest_id, p_telegram_file_id, p_telegram_message_id,
        'pending_ai', NOW(), all_participant_ids
    ) RETURNING id INTO submission_id;
    
    -- Create group submission
    INSERT INTO group_submissions (quest_id, submitter_user_id, submission_id)
    VALUES (p_quest_id, p_submitter_user_id, submission_id)
    RETURNING id INTO group_sub_id;
    
    -- Update submission with group info (now both fields together to satisfy constraint)
    UPDATE submissions 
    SET 
        is_group_submission = TRUE,
        group_submission_id = group_sub_id
    WHERE id = submission_id;
    
    -- Add ALL participants to group_participants table
    INSERT INTO group_participants (group_submission_id, user_id, partner_id)
    SELECT 
        group_sub_id,
        participant_id,
        u.partner_id
    FROM unnest(all_participant_ids) AS participant_id
    JOIN users u ON u.id = participant_id
    ON CONFLICT (group_submission_id, user_id) DO NOTHING;
    
    -- Verify all participants were added
    SELECT COUNT(*) INTO participant_count
    FROM group_participants
    WHERE group_submission_id = group_sub_id;
    
    IF participant_count != array_length(all_participant_ids, 1) THEN
        RAISE EXCEPTION 'Failed to add all participants. Expected %, got %', 
                       array_length(all_participant_ids, 1), participant_count;
    END IF;
    
    -- Calculate participants info
    total_participants := array_length(all_participant_ids, 1);
    
    -- Get participant group names
    SELECT array_agg(DISTINCT pg.group_name) INTO participants_text
    FROM partner_groups pg 
    WHERE pg.group_code = ANY(all_group_codes);
    
    RAISE NOTICE 'Created group submission % with % participants from groups: %', 
                 group_sub_id, total_participants, all_group_codes;
    
    RETURN json_build_object(
        'submission_id', submission_id,
        'group_submission_id', group_sub_id,
        'quest_title', quest_title,
        'participant_count', total_participants,
        'participants', participants_text,
        'participant_ids', all_participant_ids
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. VALIDATE EXISTING GROUP SUBMISSIONS
-- =====================================================

-- Function to validate and report on group submission completeness
CREATE OR REPLACE FUNCTION validate_group_submissions()
RETURNS TABLE(
    group_submission_id INT,
    quest_id INT,
    quest_title TEXT,
    expected_participants INT,
    actual_participants INT,
    missing_participants INT[],
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gs.id,
        gs.quest_id,
        q.title::TEXT,
        array_length(s.represents_pairs, 1) as expected,
        COUNT(gp.user_id)::INT as actual,
        array(
            SELECT unnest(s.represents_pairs)::INTEGER
            EXCEPT 
            SELECT gp2.user_id FROM group_participants gp2 WHERE gp2.group_submission_id = gs.id
        ) as missing,
        CASE 
            WHEN array_length(s.represents_pairs, 1) = COUNT(gp.user_id) THEN 'COMPLETE'::TEXT
            ELSE 'MISSING_PARTICIPANTS'::TEXT
        END as status
    FROM group_submissions gs
    JOIN submissions s ON gs.submission_id = s.id
    JOIN quests q ON gs.quest_id = q.id
    LEFT JOIN group_participants gp ON gs.id = gp.group_submission_id
    GROUP BY gs.id, gs.quest_id, q.title, s.represents_pairs
    ORDER BY gs.id;
END;
$$ LANGUAGE plpgsql;

-- Run validation
SELECT * FROM validate_group_submissions();

-- =====================================================
-- 4. ADD INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Ensure we have proper indexes for group submission queries
CREATE INDEX IF NOT EXISTS idx_group_participants_user_id ON group_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_group_submission_id ON group_participants(group_submission_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user_group ON group_participants(user_id, group_submission_id);
CREATE INDEX IF NOT EXISTS idx_submissions_represents_pairs ON submissions USING GIN(represents_pairs);
CREATE INDEX IF NOT EXISTS idx_submissions_group_fields ON submissions(is_group_submission, group_submission_id) WHERE is_group_submission = TRUE;

-- =====================================================
-- 5. CREATE VIEW FOR EASY GROUP SUBMISSION QUERIES
-- =====================================================

-- Create a view that makes it easy to query group submissions with participants
CREATE OR REPLACE VIEW group_submission_details AS
SELECT 
    gs.id as group_submission_id,
    gs.quest_id,
    gs.submitter_user_id,
    s.id as submission_id,
    s.status,
    s.submitted_at,
    s.points_awarded,
    q.title as quest_title,
    q.category as quest_category,
    q.points as quest_points,
    array_agg(DISTINCT gp.user_id ORDER BY gp.user_id) as participant_ids,
    array_agg(DISTINCT u.name ORDER BY u.name) as participant_names,
    COUNT(DISTINCT gp.user_id) as participant_count,
    COUNT(DISTINCT CASE WHEN gp.opted_out = TRUE THEN gp.user_id END) as opted_out_count,
    submitter.name as submitter_name
FROM group_submissions gs
JOIN submissions s ON gs.submission_id = s.id
JOIN quests q ON gs.quest_id = q.id
JOIN group_participants gp ON gs.id = gp.group_submission_id
JOIN users u ON gp.user_id = u.id
JOIN users submitter ON gs.submitter_user_id = submitter.id
WHERE s.is_deleted = FALSE
GROUP BY gs.id, gs.quest_id, gs.submitter_user_id, s.id, s.status, s.submitted_at, 
         s.points_awarded, q.title, q.category, q.points, submitter.name;

-- Grant access to the view
GRANT SELECT ON group_submission_details TO authenticated;

-- =====================================================
-- 6. CLEANUP AND VERIFICATION
-- =====================================================

-- Clean up the functions we created for this migration
DROP FUNCTION IF EXISTS fix_missing_group_participants();

-- Run final validation
DO $$
DECLARE
    issue_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO issue_count
    FROM validate_group_submissions()
    WHERE status != 'COMPLETE';
    
    IF issue_count > 0 THEN
        RAISE WARNING 'Found % group submissions with missing participants. Check validate_group_submissions() output.', issue_count;
    ELSE
        RAISE NOTICE 'All group submissions are complete with proper participants.';
    END IF;
END $$;

-- Final comment
COMMENT ON FUNCTION validate_group_submissions() IS 'Function to validate that all group submissions have complete participant lists';
COMMENT ON VIEW group_submission_details IS 'View providing comprehensive group submission information with participant details';
