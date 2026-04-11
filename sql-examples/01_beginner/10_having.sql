/* HAVING filters groups produced by GROUP BY.
   WHERE filters individual rows before grouping;
   HAVING filters the aggregated groups after grouping. */

DROP TABLE IF EXISTS Orders;
CREATE TABLE Orders (
    id INTEGER PRIMARY KEY,
    customer TEXT,
    amount REAL
);

INSERT INTO Orders (customer, amount) VALUES
    ('Alice', 50.00),
    ('Bob',   120.00),
    ('Alice', 30.00),
    ('Carol', 200.00),
    ('Bob',   80.00),
    ('Alice', 90.00),
    ('Carol', 150.00);

-- Show customers whose total order amount exceeds 150
SELECT
    customer,
    COUNT(*)        AS order_count,
    SUM(amount)     AS total_amount
FROM Orders
GROUP BY customer
HAVING total_amount > 150;

-- Combine WHERE and HAVING:
-- Only consider orders above 40, then keep groups with more than 1 such order
SELECT
    customer,
    COUNT(*)    AS qualifying_orders,
    SUM(amount) AS total_amount
FROM Orders
WHERE amount > 40
GROUP BY customer
HAVING qualifying_orders > 1;
