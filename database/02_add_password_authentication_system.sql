-- Migration to add password_hash column to users table
-- Run this in your Supabase SQL editor if you already have the users table without password_hash

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;