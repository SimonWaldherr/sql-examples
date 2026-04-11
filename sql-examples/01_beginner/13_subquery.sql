/* A subquery (inner query) is a SELECT statement nested inside another query.
   Subqueries can appear in SELECT, FROM, or WHERE clauses. */

DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Sales;

CREATE TABLE Products (
    id    INTEGER PRIMARY KEY,
    name  TEXT,
    price REAL
);

CREATE TABLE Sales (
    id         INTEGER PRIMARY KEY,
    product_id INTEGER,
    quantity   INTEGER
);

INSERT INTO Products (name, price) VALUES
    ('Widget',  2.50),
    ('Gadget',  3.00),
    ('Doohick', 1.75),
    ('Thingam', 5.00);

INSERT INTO Sales (product_id, quantity) VALUES
    (1, 10), (1, 5), (2, 7), (3, 20), (2, 3), (4, 1);

-- Subquery in WHERE: find products priced above the average price
SELECT name, price
FROM Products
WHERE price > (SELECT AVG(price) FROM Products);

-- Subquery in FROM (derived table): total units sold per product
SELECT p.name, s.total_sold
FROM Products p
JOIN (
    SELECT product_id, SUM(quantity) AS total_sold
    FROM Sales
    GROUP BY product_id
) s ON p.id = s.product_id
ORDER BY s.total_sold DESC;

-- Correlated subquery in SELECT: show each product's price relative to the maximum price
SELECT
    name,
    price,
    ROUND(price / (SELECT MAX(price) FROM Products) * 100, 1) AS pct_of_max
FROM Products;
