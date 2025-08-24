-- Fix user_points_view to exclude soft-deleted submissions
-- This ensures that when submissions are deleted, points are properly recalculated

-- Drop and recreate the user_points_view to include is_deleted filter
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
            -- Combined points for partners
            COALESCE(user_points.total, 0) + COALESCE(partner_points.total, 0)
        ELSE 
            -- Individual points
            COALESCE(user_points.total, 0)
    END as total_points,
    CASE 
        WHEN u.partner_id IS NOT NULL THEN 
            -- Combined completed quests for partners
            COALESCE(user_quests.completed, 0) + COALESCE(partner_quests.completed, 0)
        ELSE 
            -- Individual completed quests
            COALESCE(user_quests.completed, 0)
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
        SUM(points_awarded) as total,
        COUNT(DISTINCT quest_id) as completed
    FROM submissions 
    WHERE status IN ('approved', 'ai_approved')
    AND (is_deleted IS NULL OR is_deleted = FALSE)  -- Exclude soft-deleted submissions
    GROUP BY user_id
) user_points ON u.id = user_points.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(DISTINCT quest_id) as completed
    FROM submissions 
    WHERE status IN ('approved', 'ai_approved')
    AND (is_deleted IS NULL OR is_deleted = FALSE)  -- Exclude soft-deleted submissions
    GROUP BY user_id
) user_quests ON u.id = user_quests.user_id
LEFT JOIN users p ON u.partner_id = p.id
LEFT JOIN (
    SELECT 
        user_id,
        SUM(points_awarded) as total
    FROM submissions 
    WHERE status IN ('approved', 'ai_approved')
    AND (is_deleted IS NULL OR is_deleted = FALSE)  -- Exclude soft-deleted submissions
    GROUP BY user_id
) partner_points ON u.partner_id = partner_points.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(DISTINCT quest_id) as completed
    FROM submissions 
    WHERE status IN ('approved', 'ai_approved')
    AND (is_deleted IS NULL OR is_deleted = FALSE)  -- Exclude soft-deleted submissions
    GROUP BY user_id
) partner_quests ON u.partner_id = partner_quests.user_id;

-- Grant permissions
GRANT SELECT ON user_points_view TO authenticated, anon;