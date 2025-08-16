-- Migration: Extend user_points_view with profile fields (pair-aware, no partner_id column)

-- Drop the old view to avoid column rename/order conflicts
DROP VIEW IF EXISTS user_points_view;

CREATE VIEW user_points_view AS
WITH user_individual_points AS (
  SELECT
    s.user_id,
    COALESCE(SUM(q.points), 0) AS total_points
  FROM submissions s
  JOIN quests q ON q.id = s.quest_id
  WHERE s.status IN ('approved', 'ai_approved')
  GROUP BY s.user_id
),
user_individual_quests AS (
  SELECT
    s.user_id,
    COALESCE(COUNT(DISTINCT s.quest_id), 0) AS completed_quests
  FROM submissions s
  WHERE s.status IN ('approved', 'ai_approved')
  GROUP BY s.user_id
),
user_pair AS (
  -- Find a pair for each user if any
  SELECT u.id AS user_id, p.id AS pair_id,
         CASE WHEN p.user1_id = u.id THEN p.user2_id ELSE p.user1_id END AS partner_id
  FROM users u
  LEFT JOIN pairs p ON (p.user1_id = u.id OR p.user2_id = u.id)
)
SELECT
  u.id,
  u.name,
  u.email,
  u.telegram_id,
  u.telegram_username,
  COALESCE(ppv.total_points, uip.total_points, 0) AS total_points,
  COALESCE(ppv.completed_quests, uiq.completed_quests, 0) AS completed_quests,
  u.role,
  u.streak_count,
  u.last_submission_date,
  u.created_at,
  u.updated_at,
  u.faculty,
  u.major,
  u.profile_image_url,
  pu.name AS partner_name,
  pu.telegram_username AS partner_telegram
FROM users u
LEFT JOIN user_pair up ON up.user_id = u.id
LEFT JOIN pair_points_view ppv ON ppv.pair_id = up.pair_id
LEFT JOIN users pu ON pu.id = up.partner_id
LEFT JOIN user_individual_points uip ON uip.user_id = u.id
LEFT JOIN user_individual_quests uiq ON uiq.user_id = u.id;


