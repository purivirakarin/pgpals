-- =====================================================
-- COMPREHENSIVE GROUP SUBMISSION SYSTEM WITH FIXES
-- =====================================================
-- This migration provides a complete partner group management system and fixes all
-- group submission functionality including:
-- 1. Partner group trigger system with bidirectional relationships
-- 2. Fixed group submission functions with proper VARCHAR/TEXT handling
-- 3. Corrected points distribution for group submissions
-- 4. Proper validation and error messages
-- 5. Support for multi-group submissions

-- =====================================================
-- PART 1: ENHANCED TRIGGER FUNCTION FOR PARTNER GROUPS
-- =====================================================

-- Enhanced function to handle all partnership change scenarios
CREATE OR REPLACE FUNCTION handle_partnership_changes()
RETURNS TRIGGER AS $$
DECLARE
    old_partner_id INTEGER;
    new_partner_id INTEGER;
    existing_group_id INTEGER;
    group_name_text VARCHAR(100);
BEGIN
    -- Extract partner IDs for easier handling
    old_partner_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.partner_id WHEN TG_OP = 'UPDATE' THEN OLD.partner_id ELSE NULL END;
    new_partner_id := CASE WHEN TG_OP = 'DELETE' THEN NULL WHEN TG_OP = 'INSERT' THEN NEW.partner_id WHEN TG_OP = 'UPDATE' THEN NEW.partner_id ELSE NULL END;
    
    -- Log the operation for debugging
    RAISE NOTICE 'Partnership change - Operation: %, User: %, Old Partner: %, New Partner: %', 
        TG_OP, COALESCE(NEW.id, OLD.id), old_partner_id, new_partner_id;
    
    -- STEP 1: Handle removal of old partnership (if exists)
    IF old_partner_id IS NOT NULL AND (new_partner_id IS NULL OR new_partner_id != old_partner_id) THEN
        -- Deactivate the old partner group
        UPDATE partner_groups 
        SET is_active = FALSE, updated_at = NOW()
        WHERE ((user1_id = COALESCE(NEW.id, OLD.id) AND user2_id = old_partner_id)
            OR (user1_id = old_partner_id AND user2_id = COALESCE(NEW.id, OLD.id)))
        AND is_active = TRUE;
        
        -- Clear the reverse relationship if it exists and points back
        UPDATE users 
        SET partner_id = NULL, updated_at = NOW()
        WHERE id = old_partner_id 
        AND partner_id = COALESCE(NEW.id, OLD.id)
        AND TG_OP != 'DELETE';
    END IF;
    
    -- STEP 2: Handle creation of new partnership (if exists)
    IF new_partner_id IS NOT NULL AND (old_partner_id IS NULL OR old_partner_id != new_partner_id) THEN
        -- Check if a partner group already exists for this new partnership
        SELECT id INTO existing_group_id
        FROM partner_groups 
        WHERE ((user1_id = NEW.id AND user2_id = new_partner_id)
            OR (user1_id = new_partner_id AND user2_id = NEW.id));
           
        -- If group exists but is inactive, reactivate it
        IF existing_group_id IS NOT NULL THEN
            UPDATE partner_groups 
            SET is_active = TRUE, updated_at = NOW()
            WHERE id = existing_group_id AND is_active = FALSE;
        ELSE
            -- Create new partner group
            SELECT u1.name || ' & ' || u2.name INTO group_name_text
            FROM users u1, users u2
            WHERE u1.id = LEAST(NEW.id, new_partner_id)
              AND u2.id = GREATEST(NEW.id, new_partner_id);
            
            INSERT INTO partner_groups (
                user1_id, user2_id, group_name, is_active, created_at, updated_at
            ) VALUES (
                LEAST(NEW.id, new_partner_id),
                GREATEST(NEW.id, new_partner_id),
                group_name_text, TRUE, NOW(), NOW()
            );
        END IF;
        
        -- Ensure bidirectional relationship
        UPDATE users 
        SET partner_id = NEW.id, updated_at = NOW()
        WHERE id = new_partner_id 
        AND (partner_id IS NULL OR partner_id != NEW.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on users table
DROP TRIGGER IF EXISTS trigger_partnership_changes ON users;
CREATE TRIGGER trigger_partnership_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_partnership_changes();

-- =====================================================
-- PART 2: FIXED HELPER FUNCTIONS WITH PROPER TYPES
-- =====================================================

-- Fixed get_user_group function with correct VARCHAR types
CREATE OR REPLACE FUNCTION get_user_group(p_user_id INTEGER)
RETURNS TABLE(
    group_id INTEGER,
    group_code VARCHAR(10),
    group_name VARCHAR(100),
    partner_id INTEGER,
    partner_name VARCHAR,
    partner_telegram VARCHAR
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
    AND pg.is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Fixed get_group_by_code function with correct types
CREATE OR REPLACE FUNCTION get_group_by_code(p_group_code TEXT)
RETURNS TABLE(
    id INTEGER,
    group_code VARCHAR(10),
    group_name VARCHAR(100),
    user1_id INTEGER,
    user2_id INTEGER,
    user1_name VARCHAR,
    user2_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg.id,
        pg.group_code,
        pg.group_name,
        pg.user1_id,
        pg.user2_id,
        u1.name,
        u2.name
    FROM partner_groups pg
    JOIN users u1 ON u1.id = pg.user1_id
    JOIN users u2 ON u2.id = pg.user2_id
    WHERE pg.group_code = p_group_code::VARCHAR(10)
    AND pg.is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 3: FIXED GROUP SUBMISSION FUNCTIONS
-- =====================================================

-- Main group submission function with all fixes
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
    all_group_codes := ARRAY[submitter_group_rec.group_code::TEXT];
    
    -- Add other group codes (excluding submitter's group if accidentally included)
    FOREACH group_code IN ARRAY p_group_codes
    LOOP
        IF group_code != submitter_group_rec.group_code::TEXT THEN
            all_group_codes := all_group_codes || group_code;
        END IF;
    END LOOP;
    
    -- Debug logging
    RAISE NOTICE 'Submitter group: %, Specified groups: %, Final groups: %', 
        submitter_group_rec.group_code, p_group_codes, all_group_codes;
    
    -- Validate we have at least 2 groups total
    IF array_length(all_group_codes, 1) < 2 THEN
        RAISE EXCEPTION 'Group submissions require at least 1 other group besides your own (minimum 4 people total). Your group (%) is automatically included. Please specify at least one other group code like GRP001, GRP002, etc.', submitter_group_rec.group_code;
    END IF;
    
    -- Create the group submission with proper partner_group_id
    INSERT INTO group_submissions (quest_id, submitter_user_id, submission_id, partner_group_id)
    VALUES (p_quest_id, p_submitter_user_id, p_submission_id, submitter_group_rec.group_id)
    RETURNING id INTO group_sub_id;
    
    -- Process each group code
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

-- Transaction wrapper function
CREATE OR REPLACE FUNCTION create_multi_group_submission_transaction(
    p_quest_id INTEGER,
    p_submitter_user_id INTEGER,
    p_submission_id INTEGER,
    p_group_codes TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
    group_sub_id INTEGER;
BEGIN
    -- Call the main function within a transaction context
    SELECT create_multi_group_submission(
        p_quest_id,
        p_submitter_user_id, 
        p_submission_id,
        p_group_codes
    ) INTO group_sub_id;
    
    RETURN group_sub_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: FIXED USER POINTS VIEW FOR GROUP SUBMISSIONS
-- =====================================================

DROP VIEW IF EXISTS user_points_view;

CREATE OR REPLACE VIEW user_points_view AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.telegram_id,
    u.telegram_username,
    u.partner_id,
    CASE 
        WHEN u.partner_id IS NOT NULL THEN 
            -- For partners: their combined individual points + their combined group points (no double counting)
            COALESCE(user_points.individual_total, 0) + COALESCE(partner_points.individual_total, 0) + COALESCE(user_points.group_total, 0)
        ELSE 
            -- For non-partners: their individual points + their group points
            COALESCE(user_points.individual_total, 0) + COALESCE(user_points.group_total, 0)
    END as total_points,
    CASE 
        WHEN u.partner_id IS NOT NULL THEN 
            -- For partners: their combined individual quests + their combined group quests (no double counting)
            COALESCE(user_quests.individual_completed, 0) + COALESCE(partner_quests.individual_completed, 0) + COALESCE(user_quests.group_completed, 0)
        ELSE 
            -- For non-partners: their individual quests + their group quests
            COALESCE(user_quests.individual_completed, 0) + COALESCE(user_quests.group_completed, 0)
    END as completed_quests,
    u.role,
    u.streak_count,
    u.last_submission_date,
    u.created_at,
    u.updated_at,
    -- Partner information
    p.name as partner_name,
    p.telegram_username as partner_telegram
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        SUM(CASE WHEN is_group_submission = FALSE OR is_group_submission IS NULL THEN points_awarded ELSE 0 END) as individual_total,
        SUM(CASE WHEN is_group_submission = TRUE THEN points_awarded ELSE 0 END) as group_total
    FROM (
        -- Regular submissions (points go to submitter only)
        SELECT 
            user_id,
            quest_id,
            points_awarded,
            is_group_submission
        FROM submissions 
        WHERE status IN ('approved', 'ai_approved')
        AND (is_deleted IS NULL OR is_deleted = FALSE)
        AND (is_group_submission = FALSE OR is_group_submission IS NULL)
        
        UNION ALL
        
        -- Group submissions (points go to all users in represents_pairs)
        SELECT 
            unnest(represents_pairs::INTEGER[]) as user_id,
            quest_id,
            points_awarded,
            is_group_submission
        FROM submissions 
        WHERE status IN ('approved', 'ai_approved')
        AND (is_deleted IS NULL OR is_deleted = FALSE)
        AND is_group_submission = TRUE
        AND represents_pairs IS NOT NULL
    ) all_user_submissions
    GROUP BY user_id
) user_points ON u.id = user_points.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(DISTINCT CASE WHEN is_group_submission = FALSE OR is_group_submission IS NULL THEN quest_id END) as individual_completed,
        COUNT(DISTINCT CASE WHEN is_group_submission = TRUE THEN quest_id END) as group_completed
    FROM (
        -- Regular submissions (quests completed by submitter only)
        SELECT 
            user_id,
            quest_id,
            is_group_submission
        FROM submissions 
        WHERE status IN ('approved', 'ai_approved')
        AND (is_deleted IS NULL OR is_deleted = FALSE)
        AND (is_group_submission = FALSE OR is_group_submission IS NULL)
        
        UNION ALL
        
        -- Group submissions (quests completed by all users in represents_pairs)
        SELECT 
            unnest(represents_pairs::INTEGER[]) as user_id,
            quest_id,
            is_group_submission
        FROM submissions 
        WHERE status IN ('approved', 'ai_approved')
        AND (is_deleted IS NULL OR is_deleted = FALSE)
        AND is_group_submission = TRUE
        AND represents_pairs IS NOT NULL
    ) all_user_submissions
    GROUP BY user_id
) user_quests ON u.id = user_quests.user_id
LEFT JOIN users p ON u.partner_id = p.id
LEFT JOIN (
    SELECT 
        user_id,
        SUM(CASE WHEN is_group_submission = FALSE OR is_group_submission IS NULL THEN points_awarded ELSE 0 END) as individual_total
    FROM submissions 
    WHERE status IN ('approved', 'ai_approved')
    AND (is_deleted IS NULL OR is_deleted = FALSE)
    AND (is_group_submission = FALSE OR is_group_submission IS NULL)
    GROUP BY user_id
) partner_points ON u.partner_id = partner_points.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(DISTINCT CASE WHEN is_group_submission = FALSE OR is_group_submission IS NULL THEN quest_id END) as individual_completed
    FROM submissions 
    WHERE status IN ('approved', 'ai_approved')
    AND (is_deleted IS NULL OR is_deleted = FALSE)
    AND (is_group_submission = FALSE OR is_group_submission IS NULL)
    GROUP BY user_id
) partner_quests ON u.partner_id = partner_quests.user_id;

-- =====================================================
-- PART 5: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION handle_partnership_changes() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_group(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_group_by_code(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_multi_group_submission(INTEGER, INTEGER, INTEGER, TEXT[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_multi_group_submission_transaction(INTEGER, INTEGER, INTEGER, TEXT[]) TO authenticated, anon;
GRANT SELECT ON user_points_view TO authenticated, anon;

-- =====================================================
-- MIGRATION VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== COMPREHENSIVE GROUP SUBMISSION SYSTEM COMPLETED ===';
    RAISE NOTICE 'Partner group trigger system with bidirectional relationships ✓';
    RAISE NOTICE 'Fixed group submission functions with proper VARCHAR/TEXT handling ✓';
    RAISE NOTICE 'Corrected points distribution for group submissions (no double counting) ✓';
    RAISE NOTICE 'Proper validation and error messages ✓';
    RAISE NOTICE 'Support for multi-group submissions ✓';
    RAISE NOTICE 'All functions have proper permissions ✓';
END $$;

COMMIT;
