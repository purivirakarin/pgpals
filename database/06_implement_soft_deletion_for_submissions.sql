-- Soft deletion migration for submissions
-- This adds support for soft deletion instead of hard deletion

-- Add soft deletion columns to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);

-- Add indexes for better performance on soft deletion queries
CREATE INDEX IF NOT EXISTS idx_submissions_is_deleted ON submissions(is_deleted) WHERE is_deleted = TRUE;
CREATE INDEX IF NOT EXISTS idx_submissions_deleted_at ON submissions(deleted_at) WHERE deleted_at IS NOT NULL;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name IN ('is_deleted', 'deleted_at', 'deleted_by')
ORDER BY column_name;
