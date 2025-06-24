-- Add warranty_expiry_date column to asset_po table

ALTER TABLE asset_po 
ADD COLUMN warranty_expiry_date DATE NULL 
COMMENT 'Warranty expiry date for the purchase order'; 