-- PGPals Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE,
    name VARCHAR NOT NULL,
    password_hash VARCHAR,
    telegram_id VARCHAR UNIQUE,
    telegram_username VARCHAR,
    role VARCHAR CHECK (role IN ('participant', 'admin')) DEFAULT 'participant',
    total_points INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    last_submission_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quests table
CREATE TABLE IF NOT EXISTS quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    status VARCHAR CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
    requirements TEXT,
    validation_criteria JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    quest_id UUID REFERENCES quests(id) NOT NULL,
    telegram_file_id VARCHAR NOT NULL,
    telegram_message_id INTEGER,
    status VARCHAR CHECK (status IN ('pending_ai', 'ai_approved', 'ai_rejected', 'manual_review', 'approved', 'rejected')) DEFAULT 'pending_ai',
    ai_analysis JSONB DEFAULT '{}',
    ai_confidence_score FLOAT,
    admin_feedback TEXT,
    reviewed_by UUID REFERENCES users(id),
    points_awarded INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_processed_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- User quest completions table (for tracking completed quests)
CREATE TABLE IF NOT EXISTS user_quest_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    quest_id UUID REFERENCES quests(id) NOT NULL,
    submission_id UUID REFERENCES submissions(id) NOT NULL,
    points_awarded INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, quest_id)
);

-- AI processing batches table
CREATE TABLE IF NOT EXISTS ai_processing_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_date DATE NOT NULL,
    submissions_processed INTEGER DEFAULT 0,
    auto_approved INTEGER DEFAULT 0,
    flagged_for_review INTEGER DEFAULT 0,
    processing_time_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_category ON quests(category);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_quest_id ON submissions(quest_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_user_quest_completions_user_id ON user_quest_completions(user_id);

-- Function to update user total points
CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total points when a submission is approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE users 
        SET 
            total_points = total_points + NEW.points_awarded,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- Insert into completions table
        INSERT INTO user_quest_completions (user_id, quest_id, submission_id, points_awarded)
        VALUES (NEW.user_id, NEW.quest_id, NEW.id, NEW.points_awarded)
        ON CONFLICT (user_id, quest_id) DO NOTHING;
        
    -- Subtract points if approval is revoked
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE users 
        SET 
            total_points = GREATEST(0, total_points - OLD.points_awarded),
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- Remove from completions table
        DELETE FROM user_quest_completions 
        WHERE user_id = NEW.user_id AND quest_id = NEW.quest_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update points
CREATE TRIGGER trigger_update_user_points
    AFTER UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_total_points();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_quests_updated_at BEFORE UPDATE ON quests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_completions ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = id::text);

-- Anyone can read active quests
CREATE POLICY "Anyone can read active quests" ON quests FOR SELECT USING (status = 'active');

-- Users can read their own submissions
CREATE POLICY "Users can read own submissions" ON submissions FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can read their own completions
CREATE POLICY "Users can read own completions" ON user_quest_completions FOR SELECT USING (auth.uid()::text = user_id::text);

-- Sample data for testing
INSERT INTO users (email, name, telegram_id, telegram_username, role) VALUES
    ('admin@pgpals.com', 'Admin User', '123456789', 'admin_user', 'admin'),
    ('user1@example.com', 'John Doe', '987654321', 'john_doe', 'participant'),
    ('user2@example.com', 'Jane Smith', '456789123', 'jane_smith', 'participant')
ON CONFLICT (email) DO NOTHING;

INSERT INTO quests (title, description, category, points, requirements, created_by) VALUES
    ('Morning Exercise', 'Take a photo of yourself doing morning exercise', 'Health', 50, 'Must show clear exercise activity in the photo', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
    ('Healthy Meal', 'Share a photo of a healthy meal you prepared', 'Health', 30, 'Must be a homemade healthy meal', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
    ('Book Reading', 'Take a photo of yourself reading a book', 'Education', 40, 'Must show you actively reading a physical book', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
    ('Nature Walk', 'Take a photo during a nature walk or hike', 'Outdoor', 35, 'Must be in a natural outdoor setting', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
    ('Learning New Skill', 'Document yourself learning something new', 'Education', 60, 'Must show evidence of active learning', (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
ON CONFLICT DO NOTHING;