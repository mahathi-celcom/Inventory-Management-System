-- Add current_tag_id column to asset table for tracking currently assigned tag
ALTER TABLE asset 
ADD COLUMN current_tag_id INT,
ADD CONSTRAINT fk_asset_current_tag 
    FOREIGN KEY (current_tag_id) 
    REFERENCES asset_tag(tag_id) 
    ON DELETE SET NULL; 