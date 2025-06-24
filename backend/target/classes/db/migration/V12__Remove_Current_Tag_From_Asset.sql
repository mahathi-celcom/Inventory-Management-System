-- Remove current_tag_id column from asset table if it exists
-- This rollback migration removes the problematic column that doesn't exist in the actual database

-- Drop the foreign key constraint first if it exists
ALTER TABLE asset 
DROP CONSTRAINT IF EXISTS fk_asset_current_tag;

-- Drop the column if it exists
ALTER TABLE asset 
DROP COLUMN IF EXISTS current_tag_id; 