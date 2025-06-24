CREATE TABLE asset_model (
    model_id SERIAL PRIMARY KEY,
    make_id INT REFERENCES asset_make(make_id) ON DELETE CASCADE,
    model_name VARCHAR(255) NOT NULL,
    ram VARCHAR(100),
    storage VARCHAR(100),
    processor VARCHAR(255)
); 