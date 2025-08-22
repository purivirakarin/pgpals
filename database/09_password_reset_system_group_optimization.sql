-- =====================================================
-- COMPREHENSIVE DATABASE MIGRATION FOR PGPALS
-- This migration combines multiple updates for a complete system setup
-- =====================================================

-- =====================================================
-- PART 1: PASSWORD RESET SYSTEM 
-- =====================================================

-- Create table for storing password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    token VARCHAR(6) NOT NULL, -- 6-digit OTP
    token_hash VARCHAR NOT NULL, -- Hashed version for security
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent multiple unused tokens per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_tokens_user_unused 
ON password_reset_tokens(user_id) 
WHERE used_at IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Function to generate a 6-digit OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS VARCHAR(6)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Generate random 6-digit number
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Function to create a password reset token
CREATE OR REPLACE FUNCTION create_password_reset_token(
    p_user_id INTEGER,
    p_email VARCHAR
)
RETURNS TABLE(
    token VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE,
    success BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_token VARCHAR(6);
    v_token_hash VARCHAR;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Validate user exists and email matches
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id AND email = p_email
    ) THEN
        RAISE EXCEPTION 'User not found or email mismatch';
    END IF;
    
    -- Invalidate any existing unused tokens for this user
    UPDATE password_reset_tokens 
    SET used_at = NOW()
    WHERE user_id = p_user_id AND used_at IS NULL;
    
    -- Generate new token
    v_token := generate_otp();
    v_token_hash := encode(digest(v_token || p_email, 'sha256'), 'hex');
    v_expires_at := NOW() + INTERVAL '15 minutes'; -- Token expires in 15 minutes
    
    -- Insert new token
    INSERT INTO password_reset_tokens (
        user_id,
        email,
        token,
        token_hash,
        expires_at
    ) VALUES (
        p_user_id,
        p_email,
        v_token,
        v_token_hash,
        v_expires_at
    );
    
    RETURN QUERY SELECT v_token, v_expires_at, true;
END;
$$;

-- Function to verify and use a password reset token (FIXED for ambiguous user_id)
CREATE OR REPLACE FUNCTION verify_password_reset_token(
    p_email VARCHAR,
    p_token VARCHAR
)
RETURNS TABLE(
    user_id INTEGER,
    is_valid BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_token_hash VARCHAR;
    v_user_id INTEGER;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_used_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate hash for the provided token
    v_token_hash := encode(digest(p_token || p_email, 'sha256'), 'hex');
    
    -- Find the token
    SELECT 
        prt.user_id,
        prt.expires_at,
        prt.used_at
    INTO 
        v_user_id,
        v_expires_at,
        v_used_at
    FROM password_reset_tokens prt
    WHERE prt.email = p_email 
    AND prt.token_hash = v_token_hash
    ORDER BY prt.created_at DESC
    LIMIT 1;
    
    -- Check if token exists
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT NULL::INTEGER, false, 'Invalid token';
        RETURN;
    END IF;
    
    -- Check if token is already used
    IF v_used_at IS NOT NULL THEN
        RETURN QUERY SELECT v_user_id, false, 'Token has already been used';
        RETURN;
    END IF;
    
    -- Check if token is expired
    IF v_expires_at <= NOW() THEN
        RETURN QUERY SELECT v_user_id, false, 'Token has expired';
        RETURN;
    END IF;
    
    -- Mark token as used (Fixed: Use table alias to avoid ambiguity)
    UPDATE password_reset_tokens prt
    SET used_at = NOW()
    WHERE prt.user_id = v_user_id 
    AND prt.email = p_email 
    AND prt.token_hash = v_token_hash;
    
    RETURN QUERY SELECT v_user_id, true, 'Token is valid'::TEXT;
END;
$$;

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    -- Delete tokens older than 24 hours
    DELETE FROM password_reset_tokens
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    RETURN cleanup_count;
END;
$$;

-- Add password_hash column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR;
        RAISE NOTICE 'Added password_hash column to users table';
    ELSE
        RAISE NOTICE 'password_hash column already exists in users table';
    END IF;
END $$;

-- Enable RLS on password reset tokens table
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own password reset tokens
CREATE POLICY password_reset_tokens_select_own ON password_reset_tokens
FOR SELECT USING (
    user_id = auth.uid()::text::integer OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE auth.uid()::text = id::text AND role = 'admin'
    )
);

-- Only allow service role to insert/update/delete tokens (API endpoints only)
CREATE POLICY password_reset_tokens_service_only ON password_reset_tokens
FOR ALL USING (false); -- Deny all by default

-- Grant service role access
GRANT ALL ON password_reset_tokens TO service_role;

-- Grant execute permissions to service role for functions
GRANT EXECUTE ON FUNCTION generate_otp TO service_role;
GRANT EXECUTE ON FUNCTION create_password_reset_token TO service_role;
GRANT EXECUTE ON FUNCTION verify_password_reset_token TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_password_reset_tokens TO service_role;

-- Create automatic cleanup trigger
CREATE OR REPLACE FUNCTION trigger_cleanup_old_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Perform cleanup occasionally (1 in 10 chance)
    IF random() < 0.1 THEN
        PERFORM cleanup_expired_password_reset_tokens();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to occasionally clean up old tokens
DROP TRIGGER IF EXISTS trigger_password_reset_cleanup ON password_reset_tokens;
CREATE TRIGGER trigger_password_reset_cleanup
    AFTER INSERT ON password_reset_tokens
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_old_tokens();

-- =====================================================
-- PART 2: GROUP SUBMISSIONS CLEANUP AND OPTIMIZATION
-- =====================================================

-- Remove any orphaned or incomplete group submission records
DELETE FROM group_participants 
WHERE group_submission_id NOT IN (
    SELECT id FROM group_submissions
);

-- Remove group submissions without valid submissions
DELETE FROM group_submissions 
WHERE submission_id NOT IN (
    SELECT id FROM submissions
);

-- Remove group submissions without valid quests
DELETE FROM group_submissions 
WHERE quest_id NOT IN (
    SELECT id FROM quests WHERE status = 'active'
);

-- Add better indexes for group submission queries
CREATE INDEX IF NOT EXISTS idx_group_submissions_quest_submitter 
ON group_submissions(quest_id, submitter_user_id);

CREATE INDEX IF NOT EXISTS idx_group_participants_group_user 
ON group_participants(group_submission_id, user_id, opted_out);

-- Add constraint to ensure submissions table consistency
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_group_submission_consistency'
        AND table_name = 'submissions'
    ) THEN
        ALTER TABLE submissions 
        ADD CONSTRAINT check_group_submission_consistency 
        CHECK (
            (is_group_submission = true AND group_submission_id IS NOT NULL) OR
            (is_group_submission = false AND group_submission_id IS NULL) OR
            (is_group_submission IS NULL)
        );
        RAISE NOTICE 'Added group submission consistency constraint';
    ELSE
        RAISE NOTICE 'Group submission consistency constraint already exists';
    END IF;
END $$;

-- Create function for atomic group submission creation
CREATE OR REPLACE FUNCTION create_group_submission_transaction(
    p_quest_id INTEGER,
    p_submitter_user_id INTEGER,
    p_telegram_file_id VARCHAR,
    p_telegram_message_id INTEGER,
    p_participant_names TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_submission_id INTEGER;
    v_group_submission_id INTEGER;
    v_quest_title VARCHAR;
    v_result JSON;
BEGIN
    -- Validate quest exists and is active
    SELECT title INTO v_quest_title 
    FROM quests 
    WHERE id = p_quest_id AND status = 'active';
    
    IF v_quest_title IS NULL THEN
        RAISE EXCEPTION 'Quest not found or inactive: %', p_quest_id;
    END IF;
    
    -- Check if group submission already exists for this quest
    IF EXISTS (SELECT 1 FROM group_submissions WHERE quest_id = p_quest_id) THEN
        RAISE EXCEPTION 'Group submission already exists for quest: %', p_quest_id;
    END IF;
    
    -- Validate user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_submitter_user_id) THEN
        RAISE EXCEPTION 'User not found: %', p_submitter_user_id;
    END IF;
    
    -- Create the main submission entry
    INSERT INTO submissions (
        user_id,
        quest_id,
        telegram_file_id,
        telegram_message_id,
        status,
        is_group_submission,
        represents_pairs,
        submitted_at
    ) VALUES (
        p_submitter_user_id,
        p_quest_id,
        p_telegram_file_id,
        p_telegram_message_id,
        'pending_ai',
        true,
        p_participant_names,
        NOW()
    ) RETURNING id INTO v_submission_id;
    
    -- Create group submission record
    INSERT INTO group_submissions (
        quest_id,
        submitter_user_id,
        submission_id,
        created_at,
        updated_at
    ) VALUES (
        p_quest_id,
        p_submitter_user_id,
        v_submission_id,
        NOW(),
        NOW()
    ) RETURNING id INTO v_group_submission_id;
    
    -- Update submission with group_submission_id and admin feedback
    UPDATE submissions 
    SET 
        group_submission_id = v_group_submission_id,
        admin_feedback = 'Group submission for: ' || array_to_string(p_participant_names, ', ')
    WHERE id = v_submission_id;
    
    -- Create group participant record for the submitter
    INSERT INTO group_participants (
        group_submission_id,
        user_id,
        partner_id,
        opted_out,
        created_at,
        updated_at
    ) VALUES (
        v_group_submission_id,
        p_submitter_user_id,
        NULL,
        false,
        NOW(),
        NOW()
    );
    
    -- Build result JSON
    v_result := json_build_object(
        'submission_id', v_submission_id,
        'group_submission_id', v_group_submission_id,
        'quest_title', v_quest_title,
        'participant_count', array_length(p_participant_names, 1) * 2,
        'participants', p_participant_names,
        'status', 'success',
        'created_at', NOW()
    );
    
    -- Log activity
    INSERT INTO activities (
        user_id,
        type,
        description,
        quest_id,
        submission_id,
        metadata,
        created_by,
        created_at
    ) VALUES (
        p_submitter_user_id,
        'group_quest_submitted',
        'Created group submission for: ' || v_quest_title,
        p_quest_id,
        v_submission_id,
        json_build_object('participants', p_participant_names, 'group_submission_id', v_group_submission_id),
        p_submitter_user_id,
        NOW()
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error for debugging
        RAISE EXCEPTION 'Group submission transaction failed: %', SQLERRM;
END;
$$;

-- Function to clean up orphaned group submission data
CREATE OR REPLACE FUNCTION cleanup_group_submissions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    -- Remove group participants without valid group submissions
    DELETE FROM group_participants 
    WHERE group_submission_id NOT IN (SELECT id FROM group_submissions);
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    -- Remove group submissions without valid submissions
    DELETE FROM group_submissions 
    WHERE submission_id NOT IN (SELECT id FROM submissions);
    
    -- Update submissions to remove invalid group_submission_id references
    UPDATE submissions 
    SET group_submission_id = NULL 
    WHERE group_submission_id IS NOT NULL 
    AND group_submission_id NOT IN (SELECT id FROM group_submissions);
    
    RETURN cleanup_count;
END;
$$;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS group_submissions_select_policy ON group_submissions;
DROP POLICY IF EXISTS group_participants_select_policy ON group_participants;
DROP POLICY IF EXISTS group_participants_update_policy ON group_participants;

-- Enhanced RLS for group_submissions
CREATE POLICY group_submissions_select_policy ON group_submissions 
FOR SELECT USING (
    submitter_user_id = auth.uid()::text::integer OR
    EXISTS (
        SELECT 1 FROM group_participants gp 
        WHERE gp.group_submission_id = id 
        AND gp.user_id = auth.uid()::text::integer
    ) OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE auth.uid()::text = id::text AND role = 'admin'
    )
);

-- Enhanced RLS for group_participants
CREATE POLICY group_participants_select_policy ON group_participants 
FOR SELECT USING (
    user_id = auth.uid()::text::integer OR
    partner_id = auth.uid()::text::integer OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE auth.uid()::text = id::text AND role = 'admin'
    )
);

-- Allow users to update their opt-out status
CREATE POLICY group_participants_update_policy ON group_participants 
FOR UPDATE USING (
    user_id = auth.uid()::text::integer OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE auth.uid()::text = id::text AND role = 'admin'
    )
);

-- Grant execute permissions to authenticated users and service role
GRANT EXECUTE ON FUNCTION create_group_submission_transaction TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION cleanup_group_submissions TO service_role;

-- Run initial cleanup
SELECT cleanup_group_submissions();

-- =====================================================
-- MIGRATION VERIFICATION AND SUMMARY
-- =====================================================

DO $$
DECLARE
    password_reset_table_exists BOOLEAN;
    password_reset_functions_exist BOOLEAN;
    group_submissions_count INTEGER;
    group_participants_count INTEGER;
    orphaned_count INTEGER;
BEGIN
    -- Check password reset system
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'password_reset_tokens'
    ) INTO password_reset_table_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_password_reset_token'
    ) INTO password_reset_functions_exist;
    
    -- Count group submission records
    SELECT COUNT(*) INTO group_submissions_count FROM group_submissions;
    SELECT COUNT(*) INTO group_participants_count FROM group_participants;
    
    -- Check for orphaned records
    SELECT COUNT(*) INTO orphaned_count 
    FROM group_participants gp 
    WHERE NOT EXISTS (SELECT 1 FROM group_submissions gs WHERE gs.id = gp.group_submission_id);
    
    RAISE NOTICE '=== COMPREHENSIVE MIGRATION COMPLETED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'PASSWORD RESET SYSTEM:';
    RAISE NOTICE '- Password reset tokens table: %', CASE WHEN password_reset_table_exists THEN 'Created' ELSE 'Failed' END;
    RAISE NOTICE '- Helper functions: %', CASE WHEN password_reset_functions_exist THEN 'Created' ELSE 'Failed' END;
    RAISE NOTICE '- Token verification function: FIXED (ambiguous user_id resolved)';
    RAISE NOTICE '';
    RAISE NOTICE 'GROUP SUBMISSIONS OPTIMIZATION:';
    RAISE NOTICE '- Group submissions: %', group_submissions_count;
    RAISE NOTICE '- Group participants: %', group_participants_count;
    RAISE NOTICE '- Orphaned participants: %', orphaned_count;
    RAISE NOTICE '- Transaction function: Created';
    RAISE NOTICE '';
    
    IF password_reset_table_exists AND password_reset_functions_exist THEN
        RAISE NOTICE '✅ Password reset system is ready for use!';
    ELSE
        RAISE EXCEPTION '❌ Password reset system setup failed - please check the logs';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_group_submission_transaction') THEN
        RAISE NOTICE '✅ Group submission system optimized successfully!';
    ELSE
        RAISE EXCEPTION '❌ Group submission optimization failed';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 All systems ready! The comprehensive migration completed successfully.';
    
    -- Test the OTP generation function
    RAISE NOTICE '📧 Sample OTP: %', generate_otp();
END $$;
