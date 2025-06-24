-- Create user table with updated schema
CREATE TABLE IF NOT EXISTS "user" (
    user_id BIGSERIAL PRIMARY KEY,
    fullname_or_officename VARCHAR(255),
    department VARCHAR(255),
    designation VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    location VARCHAR(255),
    is_office_asset BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 