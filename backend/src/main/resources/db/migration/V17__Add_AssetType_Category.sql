-- Add category field to asset_type table
ALTER TABLE asset_type ADD COLUMN category VARCHAR(50);

-- Add index for performance
CREATE INDEX idx_asset_type_category ON asset_type(category);

-- Add check constraint to allow only 'Hardware' or 'Software'
ALTER TABLE asset_type ADD CONSTRAINT chk_asset_type_category 
CHECK (category IS NULL OR category IN ('Hardware', 'Software', 'HARDWARE', 'SOFTWARE'));

-- Add comment
COMMENT ON COLUMN asset_type.category IS 'Category of asset type: Hardware or Software'; 