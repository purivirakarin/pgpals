-- Migration: Add profile fields and constraints for users

-- 1) Add new columns if not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS major TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- 2) Ensure unique email is enforced
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'users_email_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END$$;


