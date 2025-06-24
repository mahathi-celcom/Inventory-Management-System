-- Migration script to add deleted field back to asset table
-- Add deleted column for soft delete functionality

-- Step 1: Add the deleted column with default value false
ALTER TABLE asset ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Step 2: Set default value for existing records
UPDATE asset SET deleted = FALSE WHERE deleted IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE asset ALTER COLUMN deleted SET NOT NULL;

-- Step 4: Create index for performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_asset_deleted ON asset(deleted);

-- Comments:
-- 1. The deleted field is used for soft delete functionality
-- 2. FALSE means the asset is active, TRUE means it's deleted
-- 3. This allows maintaining referential integrity while hiding deleted records 