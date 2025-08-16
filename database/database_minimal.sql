-- Minimal schema: only the fields you requested
-- Columns: telegram_username, total_points, created_at, partner_username
-- Safe to run on a fresh database. If you run this on an existing DB, do it in a new project or after manual backup/cleanup.

BEGIN;

-- Users table (minimal)
CREATE TABLE IF NOT EXISTS users (
  telegram_username TEXT PRIMARY KEY,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  partner_username TEXT NULL
);

-- Self-referential FK for partner (optional; comment out if you prefer no FK)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_partner_username'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_partner_username
      FOREIGN KEY (partner_username)
      REFERENCES users(telegram_username)
      ON DELETE SET NULL;
  END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_users_total_points_desc ON users ((total_points)) DESC;
CREATE INDEX IF NOT EXISTS idx_users_partner_username ON users (partner_username);

COMMIT;


