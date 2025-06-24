-- Remove timestamp and remarks columns from asset_tag_assignment table
-- This rollback migration removes the columns that were added in V13

-- Drop the index first
DROP INDEX IF EXISTS idx_asset_tag_assignment_assigned_at;

-- Drop the columns
ALTER TABLE asset_tag_assignment 
DROP COLUMN IF EXISTS assigned_at,
DROP COLUMN IF EXISTS remarks; 