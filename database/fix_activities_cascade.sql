-- Fix foreign key constraint for activities table to allow cascade deletion
-- This fixes the issue where submissions cannot be deleted due to foreign key constraint violations

-- Drop existing constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_submission_id_fkey;

-- Add new constraint with CASCADE deletion
ALTER TABLE activities ADD CONSTRAINT activities_submission_id_fkey 
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE;

-- Verify the constraint was created correctly
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'activities' 
    AND kcu.column_name = 'submission_id';
