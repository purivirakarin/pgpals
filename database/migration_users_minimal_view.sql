-- Migration: Create minimal users view exposing only desired fields
-- Keeps the underlying schema intact to avoid breaking FKs and app logic.

-- Create or replace a view with: telegram_username, total_points, created_at, partner_username
CREATE OR REPLACE VIEW users_minimal_view AS
WITH partner_map AS (
  SELECT u.id AS user_id,
         p.telegram_username AS partner_username
  FROM users u
  LEFT JOIN users p ON p.id = u.partner_id
)
SELECT
  u.telegram_username,
  COALESCE(u.total_points, 0) AS total_points,
  u.created_at,
  pm.partner_username
FROM users u
LEFT JOIN partner_map pm ON pm.user_id = u.id;

-- Optional helpful index for lookups by username on the base table (no effect on the view shape)
CREATE INDEX IF NOT EXISTS idx_users_telegram_username_ci ON users (lower(telegram_username));


