-- Admin Competition Controls Migration
-- This migration adds system settings for admin control over submissions and leaderboard visibility

BEGIN;

-- =====================================================
-- PART 1: System Settings Table
-- =====================================================

-- Create system_settings table to store admin controls
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system settings (both disabled by default for admin control)
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
    ('submissions_enabled', 'false', 'Whether participants can submit new entries'),
    ('leaderboard_visible', 'false', 'Whether the leaderboard is visible to participants');

-- =====================================================
-- PART 3: Indexes and Constraints
-- =====================================================

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- =====================================================
-- PART 4: Helper Functions
-- =====================================================

-- Function to get system setting value
CREATE OR REPLACE FUNCTION get_system_setting(setting_name TEXT)
RETURNS JSONB AS $$
DECLARE
    setting_val JSONB;
BEGIN
    SELECT setting_value INTO setting_val
    FROM system_settings
    WHERE setting_key = setting_name;
    
    IF setting_val IS NULL THEN
        -- Return default values for known settings (disabled by default)
        CASE setting_name
            WHEN 'submissions_enabled' THEN RETURN 'false'::JSONB;
            WHEN 'leaderboard_visible' THEN RETURN 'false'::JSONB;
            ELSE RETURN 'null'::JSONB;
        END CASE;
    END IF;
    
    RETURN setting_val;
END;
$$ LANGUAGE plpgsql;

-- Function to update system setting
CREATE OR REPLACE FUNCTION update_system_setting(
    setting_name TEXT,
    setting_val JSONB,
    admin_user_id INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO system_settings (setting_key, setting_value, updated_by)
    VALUES (setting_name, setting_val, admin_user_id)
    ON CONFLICT (setting_key)
    DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 3: Indexes and Constraints
-- =====================================================

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- =====================================================
-- PART 4: Row Level Security
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- System settings: Only admins can read/write
CREATE POLICY system_settings_admin_policy ON system_settings FOR ALL USING (
    (SELECT role FROM users WHERE auth.uid()::text = id::text) = 'admin'
);

-- =====================================================
-- PART 5: Grant Permissions
-- =====================================================

-- Grant permissions on new objects
GRANT SELECT ON system_settings TO authenticated, anon;
GRANT ALL ON system_settings TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_system_setting(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION update_system_setting(TEXT, JSONB, INTEGER) TO authenticated, service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;

-- =====================================================
-- MIGRATION VERIFICATION AND SUMMARY
-- =====================================================

DO $$
DECLARE
    settings_count INTEGER;
    functions_count INTEGER;
BEGIN
    -- Verify system_settings table
    SELECT COUNT(*) INTO settings_count FROM system_settings;
    IF settings_count < 2 THEN
        RAISE EXCEPTION 'System settings were not properly initialized';
    END IF;
    
    -- Verify functions exist
    SELECT COUNT(*) INTO functions_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('get_system_setting', 'update_system_setting');
    
    IF functions_count < 2 THEN
        RAISE EXCEPTION 'Required functions were not created';
    END IF;
    
    RAISE NOTICE '=== ADMIN COMPETITION CONTROLS MIGRATION COMPLETED ===';
    RAISE NOTICE 'System settings table created with % default settings', settings_count;
    RAISE NOTICE 'Helper functions created: %, expected: 2', functions_count;
    RAISE NOTICE 'Row level security policies applied';
    RAISE NOTICE '';
    RAISE NOTICE 'Available admin controls:';
    RAISE NOTICE '• submissions_enabled: Control whether participants can submit (default: DISABLED)';
    RAISE NOTICE '• leaderboard_visible: Control leaderboard visibility (default: DISABLED)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Use admin controls panel to enable features as needed';
    RAISE NOTICE '2. Both features start DISABLED for security';
END $$;

COMMIT;
