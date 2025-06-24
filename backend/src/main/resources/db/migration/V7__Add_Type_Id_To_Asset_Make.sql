-- Add type_id column to asset_make table and create foreign key relationship
-- Making the column nullable to allow existing records
ALTER TABLE asset_make ADD COLUMN type_id BIGINT NULL;

-- Add foreign key constraint (allowing null values)
ALTER TABLE asset_make 
ADD CONSTRAINT fk_asset_make_type_id 
FOREIGN KEY (type_id) REFERENCES asset_type(type_id);

-- Create index for better query performance
CREATE INDEX idx_asset_make_type_id ON asset_make(type_id); 