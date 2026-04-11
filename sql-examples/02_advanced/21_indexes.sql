/* Indexes speed up data retrieval at the cost of slightly slower writes.
   Creating the right indexes is one of the most effective performance optimizations.
   Use EXPLAIN QUERY PLAN to see whether SQLite uses an index for a given query. */

DROP TABLE IF EXISTS Orders;
CREATE TABLE Orders (
    id           INTEGER PRIMARY KEY,
    customer_id  INTEGER,
    order_date   TEXT,
    status       TEXT,
    total_amount REAL
);

-- Insert a batch of sample orders
INSERT INTO Orders (customer_id, order_date, status, total_amount) VALUES
    (1,  '2023-01-05', 'completed', 250.00),
    (2,  '2023-01-10', 'pending',    80.00),
    (1,  '2023-02-14', 'completed', 430.00),
    (3,  '2023-02-20', 'cancelled',  60.00),
    (2,  '2023-03-01', 'completed', 120.00),
    (4,  '2023-03-15', 'pending',   310.00),
    (3,  '2023-04-02', 'completed', 175.00),
    (1,  '2023-04-18', 'completed',  95.00);

-- Without an index the full table is scanned
EXPLAIN QUERY PLAN
SELECT * FROM Orders WHERE customer_id = 1;

-- Create an index on customer_id to speed up customer lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer ON Orders(customer_id);

-- The same query now uses the index
EXPLAIN QUERY PLAN
SELECT * FROM Orders WHERE customer_id = 1;

-- A composite index is useful when filtering on multiple columns together
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON Orders(status, order_date);

EXPLAIN QUERY PLAN
SELECT * FROM Orders WHERE status = 'completed' AND order_date >= '2023-03-01';

-- List all indexes on the Orders table
SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'Orders';

-- Drop an index when it is no longer needed
DROP INDEX IF EXISTS idx_orders_status_date;
