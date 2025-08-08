-- creates the currently supposedly missing user_points_view table

CREATE OR REPLACE VIEW user_points_view AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.telegram_id,
    u.telegram_username,
    u.role,
    u.streak_count,
    u.last_submission_date,
    u.created_at,
    u.updated_at,
    -- Calculate total points from approved submissions
    COALESCE(user_points.total, 0) as total_points,
    -- Count completed quests
    COALESCE(user_quests.completed, 0) as completed_quests,
    -- Partnership fields (null for now since partnerships aren't implemented)
    NULL::UUID as partner_id,
    NULL::VARCHAR as partner_name,
    NULL::VARCHAR as partner_telegram
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        SUM(points_awarded) as total
    FROM submissions 
    WHERE status IN ('approved', 'ai_approved')
    GROUP BY user_id
) user_points ON u.id = user_points.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(DISTINCT quest_id) as completed
    FROM submissions 
    WHERE status IN ('approved', 'ai_approved')
    GROUP BY user_id
) user_quests ON u.id = user_quests.user_id;

-- Grant necessary permissions
GRANT SELECT ON user_points_view TO authenticated, anon;