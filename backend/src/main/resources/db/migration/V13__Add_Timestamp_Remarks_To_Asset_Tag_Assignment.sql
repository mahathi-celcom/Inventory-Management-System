-- Add timestamp and remarks columns to asset_tag_assignment table for historical tracking
ALTER TABLE asset_tag_assignment 
ADD COLUMN assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN remarks VARCHAR(500);

-- Add index on assigned_at for better query performance
CREATE INDEX idx_asset_tag_assignment_assigned_at ON asset_tag_assignment(assigned_at);

-- Update existing records to have assigned_at timestamp
UPDATE asset_tag_assignment 
SET assigned_at = CURRENT_TIMESTAMP 
WHERE assigned_at IS NULL; 