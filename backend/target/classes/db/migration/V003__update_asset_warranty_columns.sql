-- Migration script to update asset warranty columns
-- 1. Rename warranty_expiration_date to extended_warranty_expiry
-- 2. Add new warranty_expiry column

-- Step 1: Add the new warranty_expiry column
ALTER TABLE asset ADD COLUMN IF NOT EXISTS warranty_expiry DATE;

-- Step 2: Copy data from warranty_expiration_date to warranty_expiry if needed
-- (You can customize this based on your business logic)
UPDATE asset 
SET warranty_expiry = warranty_expiration_date 
WHERE warranty_expiry IS NULL AND warranty_expiration_date IS NOT NULL;

-- Step 3: Rename warranty_expiration_date to extended_warranty_expiry
ALTER TABLE asset RENAME COLUMN warranty_expiration_date TO extended_warranty_expiry;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_warranty_expiry ON asset(warranty_expiry);
CREATE INDEX IF NOT EXISTS idx_asset_extended_warranty_expiry ON asset(extended_warranty_expiry);

-- Comments:
-- 1. The new warranty_expiry column represents the standard product warranty
-- 2. The extended_warranty_expiry column represents extended warranty purchased separately
-- 3. Both columns can have different dates and are independent of each other 