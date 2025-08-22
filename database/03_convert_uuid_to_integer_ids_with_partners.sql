-- PGPals Comprehensive Migration: UUID to Integer IDs + All System Updates
-- This migration converts all UUID primary keys to sequential integers and applies all system improvements
-- Run this migration on a fresh database or after backing up existing data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create new tables with integer IDs
-- Users table with integer ID and partner support
CREATE TABLE IF NOT EXISTS users_new (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE,
    name VARCHAR NOT NULL,
    password_hash VARCHAR,
    telegram_id VARCHAR UNIQUE,
    telegram_username VARCHAR,
    partner_id INTEGER,
    role VARCHAR CHECK (role IN ('participant', 'admin')) DEFAULT 'participant',
    streak_count INTEGER DEFAULT 0,
    last_submission_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Named foreign key constraint for partner relationship
    CONSTRAINT users_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES users_new(id)
);

-- Quests table with integer ID
CREATE TABLE IF NOT EXISTS quests_new (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    status VARCHAR CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
    requirements TEXT,
    validation_criteria JSONB DEFAULT '{}',
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Named foreign key constraint
    CONSTRAINT quests_created_by_fkey FOREIGN KEY (created_by) REFERENCES users_new(id)
);

-- Submissions table with integer IDs
CREATE TABLE IF NOT EXISTS submissions_new (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    quest_id INTEGER NOT NULL,
    telegram_file_id VARCHAR NOT NULL,
    telegram_message_id INTEGER,
    status VARCHAR CHECK (status IN ('pending_ai', 'ai_approved', 'ai_rejected', 'manual_review', 'approved', 'rejected')) DEFAULT 'pending_ai',
    ai_analysis JSONB DEFAULT '{}',
    ai_confidence_score FLOAT,
    admin_feedback TEXT,
    reviewed_by INTEGER,
    points_awarded INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Named foreign key constraints for Supabase compatibility
    CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users_new(id),
    CONSTRAINT submissions_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES quests_new(id),
    CONSTRAINT submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users_new(id)
);

-- Activities table with integer IDs for comprehensive tracking
CREATE TABLE IF NOT EXISTS activities_new (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    activity_type VARCHAR NOT NULL,
    description TEXT NOT NULL,
    points_change INTEGER DEFAULT 0,
    quest_id INTEGER,
    submission_id INTEGER,
    target_user_id INTEGER,
    metadata JSONB DEFAULT '{}',
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Named foreign key constraints
    CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users_new(id),
    CONSTRAINT activities_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES quests_new(id),
    CONSTRAINT activities_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions_new(id),
    CONSTRAINT activities_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES users_new(id),
    CONSTRAINT activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES users_new(id)
);

-- 2. Migrate data from old tables (if they exist)
-- Note: This section assumes you have existing data. Skip if starting fresh.

-- Migrate users
INSERT INTO users_new (email, name, password_hash, telegram_id, telegram_username, role, streak_count, last_submission_date, created_at, updated_at)
SELECT email, name, password_hash, telegram_id, telegram_username, role, streak_count, last_submission_date, created_at, updated_at
FROM users
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');

-- Migrate quests  
INSERT INTO quests_new (title, description, category, points, status, requirements, validation_criteria, created_by, created_at, updated_at)
SELECT q.title, q.description, q.category, q.points, q.status, q.requirements, q.validation_criteria, 
       u_new.id, q.created_at, q.updated_at
FROM quests q
LEFT JOIN users u_old ON q.created_by = u_old.id
LEFT JOIN users_new u_new ON u_old.email = u_new.email
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quests');

-- Migrate submissions
INSERT INTO submissions_new (user_id, quest_id, telegram_file_id, telegram_message_id, status, ai_analysis, ai_confidence_score, admin_feedback, reviewed_by, points_awarded, submitted_at, reviewed_at, created_at, updated_at)
SELECT u_new.id, q_new.id, s.telegram_file_id, s.telegram_message_id, s.status, s.ai_analysis, s.ai_confidence_score, s.admin_feedback,
       reviewer_new.id, s.points_awarded, s.submitted_at, s.reviewed_at, s.submitted_at, COALESCE(s.reviewed_at, s.submitted_at)
FROM submissions s
LEFT JOIN users u_old ON s.user_id = u_old.id
LEFT JOIN users_new u_new ON u_old.email = u_new.email
LEFT JOIN quests q_old ON s.quest_id = q_old.id  
LEFT JOIN quests_new q_new ON q_old.title = q_new.title
LEFT JOIN users reviewer_old ON s.reviewed_by = reviewer_old.id
LEFT JOIN users_new reviewer_new ON reviewer_old.email = reviewer_new.email
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions');

-- 3. Drop old tables and rename new ones
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS users CASCADE;

ALTER TABLE users_new RENAME TO users;
ALTER TABLE quests_new RENAME TO quests;
ALTER TABLE submissions_new RENAME TO submissions;
ALTER TABLE activities_new RENAME TO activities;

-- 3.1. Update foreign key constraints to reference the renamed tables
-- Drop existing constraints that reference the old table names
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_partner_id_fkey;
ALTER TABLE quests DROP CONSTRAINT IF EXISTS quests_created_by_fkey;
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_user_id_fkey;
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_quest_id_fkey;
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_reviewed_by_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_user_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_quest_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_submission_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_target_user_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_created_by_fkey;

-- Recreate constraints with correct table references
ALTER TABLE users ADD CONSTRAINT users_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES users(id);
ALTER TABLE quests ADD CONSTRAINT quests_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE submissions ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE submissions ADD CONSTRAINT submissions_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES quests(id);
ALTER TABLE submissions ADD CONSTRAINT submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users(id);
ALTER TABLE activities ADD CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE activities ADD CONSTRAINT activities_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES quests(id);
ALTER TABLE activities ADD CONSTRAINT activities_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id);
ALTER TABLE activities ADD CONSTRAINT activities_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES users(id);
ALTER TABLE activities ADD CONSTRAINT activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_category ON quests(category);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_quest_id ON submissions(quest_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_quest_id ON activities(quest_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- 5. Create views for automatic point calculation
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
    GROUP BY user_id
) user_points ON u.id = user_points.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(DISTINCT quest_id) as completed
    FROM submissions 
    WHERE status IN ('approved', 'ai_approved')
    GROUP BY user_id
) user_quests ON u.id = user_quests.user_id
LEFT JOIN users p ON u.partner_id = p.id
LEFT JOIN (
    SELECT 
        user_id,
        SUM(points_awarded) as total
    FROM submissions 
    WHERE status IN ('approved', 'ai_approved')
    GROUP BY user_id
) partner_points ON u.partner_id = partner_points.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(DISTINCT quest_id) as completed
    FROM submissions 
    WHERE status IN ('approved', 'ai_approved')
    GROUP BY user_id
) partner_quests ON u.partner_id = partner_quests.user_id;

-- Create recent activities view with proper joins
CREATE OR REPLACE VIEW recent_activities_view AS
SELECT 
    a.id,
    a.activity_type as type,
    a.user_id,
    a.target_user_id,
    a.quest_id,
    a.submission_id,
    a.description,
    a.points_change,
    a.metadata,
    a.created_at,
    a.created_by,
    -- User who performed the action
    u.name as actor_name,
    u.telegram_username as actor_telegram,
    -- Target user (for admin actions)
    tu.name as target_user_name,
    tu.telegram_username as target_user_telegram,
    -- Quest details
    q.title as quest_title,
    q.category as quest_category,
    q.points as quest_points,
    -- Submission details
    s.status as submission_status
FROM activities a
LEFT JOIN users u ON a.created_by = u.id
LEFT JOIN users tu ON a.target_user_id = tu.id
LEFT JOIN quests q ON a.quest_id = q.id
LEFT JOIN submissions s ON a.submission_id = s.id
ORDER BY a.created_at DESC;

-- 6. Create triggers for automatic activity logging
CREATE OR REPLACE FUNCTION log_submission_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Log submission creation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activities (user_id, activity_type, description, quest_id, submission_id, created_by, created_at)
        VALUES (
            NEW.user_id,
            'quest_submitted',
            'Submitted quest: ' || (SELECT title FROM quests WHERE id = NEW.quest_id),
            NEW.quest_id,
            NEW.id,
            NEW.user_id,
            NOW()
        );
        RETURN NEW;
    END IF;
    
    -- Log status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO activities (user_id, activity_type, description, points_change, quest_id, submission_id, created_by, created_at)
        VALUES (
            NEW.user_id,
            CASE 
                WHEN NEW.status IN ('approved', 'ai_approved') THEN 'quest_completed'
                WHEN NEW.status IN ('rejected', 'ai_rejected') THEN 'quest_rejected'
                ELSE 'submission_updated'
            END,
            CASE 
                WHEN NEW.status IN ('approved', 'ai_approved') THEN 'Quest completed: ' || (SELECT title FROM quests WHERE id = NEW.quest_id)
                WHEN NEW.status IN ('rejected', 'ai_rejected') THEN 'Quest rejected: ' || (SELECT title FROM quests WHERE id = NEW.quest_id)
                ELSE 'Submission status updated to: ' || NEW.status
            END,
            CASE WHEN NEW.status IN ('approved', 'ai_approved') THEN NEW.points_awarded ELSE 0 END,
            NEW.quest_id,
            NEW.id,
            COALESCE(NEW.reviewed_by, NEW.user_id),
            NOW()
        );
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS submission_activity_trigger ON submissions;
CREATE TRIGGER submission_activity_trigger
    AFTER INSERT OR UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION log_submission_activity();

-- 7. Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see all users (for leaderboard)
CREATE POLICY users_select_policy ON users FOR SELECT USING (true);
CREATE POLICY users_update_policy ON users FOR UPDATE USING (auth.uid()::text = id::text OR (SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin');

-- Quests are readable by all, manageable by admins
CREATE POLICY quests_select_policy ON quests FOR SELECT USING (status = 'active' OR (SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin');
CREATE POLICY quests_insert_policy ON quests FOR INSERT WITH CHECK ((SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin');
CREATE POLICY quests_update_policy ON quests FOR UPDATE USING ((SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin');

-- Submissions: users can see their own, admins can see all
CREATE POLICY submissions_select_policy ON submissions FOR SELECT USING (auth.uid()::text = user_id::text OR (SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin');
CREATE POLICY submissions_insert_policy ON submissions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY submissions_update_policy ON submissions FOR UPDATE USING ((SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin');

-- Activities: users can see activities related to them, admins can see all
CREATE POLICY activities_select_policy ON activities FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = target_user_id::text OR 
    (SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin'
);

-- 8. Grant permissions
GRANT SELECT ON user_points_view TO authenticated, anon;
GRANT SELECT ON recent_activities_view TO authenticated, anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- 9. Insert initial admin user (update credentials as needed)
INSERT INTO users (email, name, role, created_at, updated_at)
VALUES ('admin@pgpals.com', 'Admin User', 'admin', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 10. Create sample quests (optional)
INSERT INTO quests (title, description, category, points, status, requirements, created_at, updated_at) VALUES
('Daily Exercise', 'Complete 30 minutes of physical exercise', 'Health', 10, 'active', 'Photo proof of exercise activity', NOW(), NOW()),
('Read a Book', 'Read for at least 1 hour', 'Education', 15, 'active', 'Photo of book with bookmark or notes', NOW(), NOW()),
('Nature Walk', 'Take a walk in nature for 45 minutes', 'Outdoor', 12, 'active', 'Photo from your nature walk', NOW(), NOW()),
('Learn Something New', 'Spend 1 hour learning a new skill', 'Education', 20, 'active', 'Photo or screenshot of learning progress', NOW(), NOW()),
('Creative Project', 'Work on any creative project for 1 hour', 'Creative', 18, 'active', 'Photo of your creative work', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Migration completed successfully
-- The system now uses integer IDs and includes:
-- - Partnership system for shared points
-- - Automatic activity tracking
-- - Automatic point calculation via views
-- - Proper indexing and security policies
