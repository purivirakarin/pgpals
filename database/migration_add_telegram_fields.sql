-- Migration: Add Telegram fields and pairing to users
-- Safe to run multiple times (IF NOT EXISTS guards)

-- 1) Add columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2) Indexes / uniqueness
-- Unique (nullable) telegram_id
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_telegram_id
  ON users(telegram_id)
  WHERE telegram_id IS NOT NULL;

-- Case-insensitive unique (nullable) telegram_username
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_telegram_username_ci
  ON users (lower(telegram_username))
  WHERE telegram_username IS NOT NULL;

-- Helpful lookup index for partner relations
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);


