-- Migration: Pairs-based leaderboard
-- Creates pairs table and a view that aggregates points per pair

-- 1) Pairs table
CREATE TABLE IF NOT EXISTS pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT pairs_distinct_members CHECK (user1_id <> user2_id)
);

-- Ensure a pair combination is unique regardless of order
CREATE UNIQUE INDEX IF NOT EXISTS idx_pairs_unique_combo
  ON pairs (LEAST(user1_id::text, user2_id::text), GREATEST(user1_id::text, user2_id::text));

-- Optional: try to keep each user in at most one pair (best-effort)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pairs_unique_user1 ON pairs(user1_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pairs_unique_user2 ON pairs(user2_id);

-- 2) Helper materialized user points via submissions
-- Note: Adjust table/column names if they differ in your schema
DROP VIEW IF EXISTS pair_points_view;
CREATE VIEW pair_points_view AS
WITH user_points AS (
  SELECT
    s.user_id,
    COALESCE(SUM(q.points), 0) AS total_points,
    COALESCE(COUNT(DISTINCT s.quest_id), 0) AS completed_quests
  FROM submissions s
  JOIN quests q ON q.id = s.quest_id
  WHERE s.status IN ('approved', 'ai_approved')
  GROUP BY s.user_id
)
SELECT
  p.id                         AS pair_id,
  u1.id                        AS user1_id,
  u2.id                        AS user2_id,
  u1.name                      AS user1_name,
  u2.name                      AS user2_name,
  u1.telegram_username         AS user1_telegram,
  u2.telegram_username         AS user2_telegram,
  COALESCE(up1.total_points, 0) + COALESCE(up2.total_points, 0)      AS total_points,
  COALESCE(up1.completed_quests, 0) + COALESCE(up2.completed_quests, 0) AS completed_quests,
  GREATEST(u1.updated_at, u2.updated_at) AS updated_at
FROM pairs p
JOIN users u1 ON u1.id = p.user1_id
JOIN users u2 ON u2.id = p.user2_id
LEFT JOIN user_points up1 ON up1.user_id = p.user1_id
LEFT JOIN user_points up2 ON up2.user_id = p.user2_id;

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_quest ON submissions(quest_id);

-- 4) (Optional) Seed a demo pair if two participants exist
-- Seed sample pairs by pairing participants in order of creation (u1 with u2, u3 with u4, ...)
WITH participants AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM users
  WHERE role = 'participant'
), paired AS (
  SELECT p1.id AS user1_id, p2.id AS user2_id
  FROM participants p1
  JOIN participants p2 ON p2.rn = p1.rn + 1
  WHERE (p1.rn % 2) = 1
)
INSERT INTO pairs (user1_id, user2_id)
SELECT user1_id, user2_id
FROM paired
ON CONFLICT DO NOTHING;

