-- Migration to update user table schema
-- Remove location_id foreign key and column, remove username column, add location column, rename full_name

-- Step 1: Drop foreign key constraint for location_id (if exists)
ALTER TABLE "user" 
DROP CONSTRAINT IF EXISTS user_location_id_fkey;

-- Step 2: Drop the location_id column (if exists)
ALTER TABLE "user"
DROP COLUMN IF EXISTS location_id;

-- Step 3: Drop the username column (if exists)
ALTER TABLE "user"
DROP COLUMN IF EXISTS username;

-- Step 4: Add new location column (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='location') THEN
        ALTER TABLE "user" ADD COLUMN location VARCHAR(255);
    END IF;
END $$;

-- Step 5: Rename full_name to fullname_or_officename (if column exists)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='full_name') THEN
        ALTER TABLE "user" RENAME COLUMN full_name TO fullname_or_officename;
    END IF;
END $$;

-- Step 6: Drop the location table entirely (if exists)
DROP TABLE IF EXISTS location; 