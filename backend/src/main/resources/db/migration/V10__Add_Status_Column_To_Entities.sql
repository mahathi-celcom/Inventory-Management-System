-- Migration to add status column to multiple entities
-- Add status column with default value 'Active' to specified tables

-- Add status to asset_type table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asset_type' AND column_name='status') THEN
        ALTER TABLE asset_type ADD COLUMN status VARCHAR(255) DEFAULT 'Active' NOT NULL;
    END IF;
END $$;

-- Add status to asset_make table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asset_make' AND column_name='status') THEN
        ALTER TABLE asset_make ADD COLUMN status VARCHAR(255) DEFAULT 'Active' NOT NULL;
    END IF;
END $$;

-- Add status to asset_model table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asset_model' AND column_name='status') THEN
        ALTER TABLE asset_model ADD COLUMN status VARCHAR(255) DEFAULT 'Active' NOT NULL;
    END IF;
END $$;

-- Add status to os table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='os' AND column_name='status') THEN
        ALTER TABLE os ADD COLUMN status VARCHAR(255) DEFAULT 'Active' NOT NULL;
    END IF;
END $$;

-- Add status to os_version table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='os_version' AND column_name='status') THEN
        ALTER TABLE os_version ADD COLUMN status VARCHAR(255) DEFAULT 'Active' NOT NULL;
    END IF;
END $$;

-- Add status to vendor table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendor' AND column_name='status') THEN
        ALTER TABLE vendor ADD COLUMN status VARCHAR(255) DEFAULT 'Active' NOT NULL;
    END IF;
END $$;

-- Add status to user table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='status') THEN
        ALTER TABLE "user" ADD COLUMN status VARCHAR(255) DEFAULT 'Active' NOT NULL;
    END IF;
END $$; 