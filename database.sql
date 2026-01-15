CREATE DATABASE IF NOT EXISTS ecommerce_inventory;
USE ecommerce_inventory;

-- Categories table
CREATE TABLE categories (
    category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Suppliers table
CREATE TABLE suppliers (
    supplier_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20)
);

-- Products table
CREATE TABLE products (
    product_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT UNSIGNED DEFAULT 0,
    category_id INT UNSIGNED,
    supplier_id INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

-- Sample data
INSERT INTO categories (category_name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Apparel and fashion items'),
('Books', 'Physical and digital books');

INSERT INTO suppliers (supplier_name, contact_email, phone_number) VALUES
('Tech Supplies Co.', 'contact@techsupplies.com', '+1-555-0101'),
('Fashion Wholesalers', 'info@fashionwholesale.com', '+1-555-0102'),
('Book Distributors Inc.', 'sales@bookdist.com', '+1-555-0103');

INSERT INTO products (product_name, description, price, stock_quantity, category_id, supplier_id) VALUES
('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 29.99, 150, 1, 1),
('Cotton T-Shirt', 'Premium cotton t-shirt, various colors', 19.99, 200, 2, 2),
('JavaScript Guide', 'Comprehensive JavaScript programming book', 45.00, 75, 3, 3),
('Laptop Stand', 'Adjustable aluminum laptop stand', 39.99, 50, 1, 1);
