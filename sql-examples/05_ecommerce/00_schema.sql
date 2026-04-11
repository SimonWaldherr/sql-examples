/* Real-life scenario: E-commerce database schema.
   This file creates the core tables used by all other examples in this folder.
   Run this file first before running the other e-commerce examples. */

DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Customers;

-- Customers
CREATE TABLE Customers (
    customer_id   INTEGER PRIMARY KEY,
    name          TEXT    NOT NULL,
    email         TEXT    UNIQUE NOT NULL,
    country       TEXT,
    registered_at TEXT    DEFAULT (date('now'))
);

-- Product categories
CREATE TABLE Categories (
    category_id   INTEGER PRIMARY KEY,
    category_name TEXT NOT NULL
);

-- Products
CREATE TABLE Products (
    product_id  INTEGER PRIMARY KEY,
    name        TEXT    NOT NULL,
    category_id INTEGER REFERENCES Categories(category_id),
    price       REAL    NOT NULL,
    stock       INTEGER NOT NULL DEFAULT 0
);

-- Orders (one row per order)
CREATE TABLE Orders (
    order_id    INTEGER PRIMARY KEY,
    customer_id INTEGER REFERENCES Customers(customer_id),
    order_date  TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'pending'  -- pending | shipped | delivered | cancelled
);

-- Order line items (one row per product per order)
CREATE TABLE OrderItems (
    item_id    INTEGER PRIMARY KEY,
    order_id   INTEGER REFERENCES Orders(order_id),
    product_id INTEGER REFERENCES Products(product_id),
    quantity   INTEGER NOT NULL,
    unit_price REAL    NOT NULL
);

-- ── Seed data ────────────────────────────────────────────────────────────────

INSERT INTO Customers (name, email, country, registered_at) VALUES
    ('Alice',   'alice@example.com',   'US', '2022-01-15'),
    ('Bob',     'bob@example.com',     'UK', '2022-03-20'),
    ('Carol',   'carol@example.com',   'DE', '2022-06-05'),
    ('David',   'david@example.com',   'US', '2023-01-10'),
    ('Eva',     'eva@example.com',     'FR', '2023-04-22');

INSERT INTO Categories (category_name) VALUES
    ('Electronics'), ('Clothing'), ('Books'), ('Home & Garden');

INSERT INTO Products (name, category_id, price, stock) VALUES
    ('Laptop',          1, 999.99,  15),
    ('Wireless Mouse',  1,  29.99,  80),
    ('USB-C Hub',       1,  49.99,  50),
    ('T-Shirt',         2,  19.99, 200),
    ('Jeans',           2,  59.99, 100),
    ('SQL for Beginners',3, 34.99,  60),
    ('Garden Hose',     4,  24.99,  40);

INSERT INTO Orders (customer_id, order_date, status) VALUES
    (1, '2023-02-01', 'delivered'),
    (1, '2023-05-15', 'delivered'),
    (2, '2023-03-10', 'delivered'),
    (3, '2023-03-25', 'cancelled'),
    (1, '2023-07-04', 'delivered'),
    (4, '2023-07-20', 'shipped'),
    (2, '2023-08-01', 'delivered'),
    (5, '2023-09-12', 'pending');

INSERT INTO OrderItems (order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 1, 999.99),  -- Alice bought a Laptop
    (1, 2, 2,  29.99),  -- Alice bought 2 Wireless Mice
    (2, 6, 1,  34.99),  -- Alice bought a book
    (3, 4, 3,  19.99),  -- Bob bought 3 T-Shirts
    (3, 5, 1,  59.99),  -- Bob bought Jeans
    (4, 7, 2,  24.99),  -- Carol's cancelled order
    (5, 3, 1,  49.99),  -- Alice bought a USB-C Hub
    (6, 1, 1, 999.99),  -- David bought a Laptop
    (7, 2, 1,  29.99),  -- Bob bought a Mouse
    (7, 6, 2,  34.99),  -- Bob bought 2 books
    (8, 4, 2,  19.99);  -- Eva's pending order

-- Verify
SELECT 'Customers' AS tbl, COUNT(*) AS rows FROM Customers
UNION ALL
SELECT 'Products',  COUNT(*) FROM Products
UNION ALL
SELECT 'Orders',    COUNT(*) FROM Orders
UNION ALL
SELECT 'OrderItems',COUNT(*) FROM OrderItems;
