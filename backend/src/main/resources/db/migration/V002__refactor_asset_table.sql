-- Migration script to refactor Asset table structure
-- This script handles column additions, removals, and renames while preserving data

-- Step 1: Add new columns
ALTER TABLE asset ADD COLUMN IF NOT EXISTS inventory_location VARCHAR(255);
ALTER TABLE asset ADD COLUMN IF NOT EXISTS extended_warranty_vendor_id BIGINT;
ALTER TABLE asset ADD COLUMN IF NOT EXISTS warranty_expiration_date DATE;

-- Step 2: Add foreign key constraint for extended warranty vendor
ALTER TABLE asset ADD CONSTRAINT IF NOT EXISTS fk_asset_extended_warranty_vendor 
    FOREIGN KEY (extended_warranty_vendor_id) REFERENCES vendor(id);

-- Step 3: Migrate data from old columns to new columns
-- Copy warranty_expiry to warranty_expiration_date if warranty_expiration_date is null
UPDATE asset 
SET warranty_expiration_date = warranty_expiry 
WHERE warranty_expiration_date IS NULL AND warranty_expiry IS NOT NULL;

-- Step 4: Drop old columns that are being removed
-- Note: Uncomment these after ensuring data migration is complete
-- ALTER TABLE asset DROP COLUMN IF EXISTS ram;
-- ALTER TABLE asset DROP COLUMN IF EXISTS storage;
-- ALTER TABLE asset DROP COLUMN IF EXISTS processor;
-- ALTER TABLE asset DROP COLUMN IF EXISTS location_id;
-- ALTER TABLE asset DROP COLUMN IF EXISTS deleted;
-- ALTER TABLE asset DROP COLUMN IF EXISTS warranty_expiry;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_inventory_location ON asset(inventory_location);
CREATE INDEX IF NOT EXISTS idx_asset_extended_warranty_vendor ON asset(extended_warranty_vendor_id);

-- Step 6: Update any existing records to have default values
UPDATE asset SET inventory_location = 'Unknown' WHERE inventory_location IS NULL;

-- Comments for manual steps:
-- 1. The primary key column is already named 'asset_id' in the database but mapped to 'id' in Java
-- 2. Consider backing up data before running this migration
-- 3. Test thoroughly in development environment first
-- 4. The deleted column removal is commented out - uncomment after confirming application works 