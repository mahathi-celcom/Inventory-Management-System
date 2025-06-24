CREATE TABLE asset_status_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    asset_id INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    changed_by INT NOT NULL,
    change_date DATETIME NOT NULL,
    remarks TEXT,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    FOREIGN KEY (changed_by) REFERENCES "user"(user_id)
); 