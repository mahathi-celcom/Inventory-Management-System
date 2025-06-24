-- Add new fields to user table
ALTER TABLE "user" 
ADD COLUMN employee_code VARCHAR(50) UNIQUE,
ADD COLUMN user_type VARCHAR(20),
ADD COLUMN country VARCHAR(100),
ADD COLUMN city VARCHAR(100);

-- Make email nullable
ALTER TABLE "user" ALTER COLUMN email DROP NOT NULL;

-- Add indexes for performance
CREATE INDEX idx_user_employee_code ON "user"(employee_code);
CREATE INDEX idx_user_user_type ON "user"(user_type);
CREATE INDEX idx_user_country ON "user"(country);
CREATE INDEX idx_user_city ON "user"(city);

-- Add comments
COMMENT ON COLUMN "user".employee_code IS 'Unique employee code for identification';
COMMENT ON COLUMN "user".user_type IS 'Type of user: EMPLOYEE, CONTRACTOR, VENDOR';
COMMENT ON COLUMN "user".country IS 'Country where user is located';
COMMENT ON COLUMN "user".city IS 'City where user is located'; 