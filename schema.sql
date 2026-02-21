CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- Default Admin Account (admin@lecomax.com / zemzami2026)
-- Generated bcrypt hash for 'zemzami2026'
INSERT IGNORE INTO admins (username, password_hash) 
VALUES ('admin@lecomax.com', '$2b$10$X/1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6.7'); -- Replace with actual hash when running

CREATE TABLE IF NOT EXISTS gmail_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expiry_date BIGINT
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    phone VARCHAR(255),
    city VARCHAR(255),
    address TEXT,
    total DECIMAL(10,2),
    payment_method VARCHAR(50),
    order_date DATETIME,
    raw_email TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(255),
    item_name VARCHAR(255),
    quantity INT,
    price DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    emails_processed INT DEFAULT 0,
    new_orders INT DEFAULT 0
);