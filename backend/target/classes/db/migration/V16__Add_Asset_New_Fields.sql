-- Add new fields to asset table
ALTER TABLE asset 
ADD COLUMN asset_category VARCHAR(20),
ADD COLUMN license_name VARCHAR(100),
ADD COLUMN license_validity_period DATE,
ADD COLUMN license_user_count INTEGER;

-- Add indexes for performance
CREATE INDEX idx_asset_category ON asset(asset_category);
CREATE INDEX idx_asset_license_validity ON asset(license_validity_period);

-- Add comments
COMMENT ON COLUMN asset.asset_category IS 'Category of asset: HARDWARE, SOFTWARE, PERIPHERAL';
COMMENT ON COLUMN asset.license_name IS 'Name of software license';
COMMENT ON COLUMN asset.license_validity_period IS 'Date when software license expires';
COMMENT ON COLUMN asset.license_user_count IS 'Number of users covered by the license';

-- Add check constraint for asset category
ALTER TABLE asset ADD CONSTRAINT chk_asset_category 
CHECK (asset_category IN ('HARDWARE', 'SOFTWARE', 'PERIPHERAL'));

-- Add check constraint for license user count
ALTER TABLE asset ADD CONSTRAINT chk_license_user_count 
CHECK (license_user_count IS NULL OR license_user_count > 0); 