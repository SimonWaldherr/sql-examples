/* Real-life scenario: Inventory management.
   Track current stock levels, identify low-stock products, and simulate
   restocking after a batch of orders is fulfilled.
   (Run 00_schema.sql first to create and populate the tables.) */

-- ── Current stock levels with category information ────────────────────────────
SELECT
    p.product_id,
    p.name         AS product,
    c.category_name,
    p.stock        AS units_in_stock,
    ROUND(p.price * p.stock, 2) AS stock_value
FROM Products p
JOIN Categories c ON p.category_id = c.category_id
ORDER BY stock_value DESC;

-- ── Low-stock alert: products with fewer than 20 units ───────────────────────
SELECT
    p.name AS product,
    p.stock AS units_in_stock
FROM Products p
WHERE p.stock < 20
ORDER BY p.stock ASC;

-- ── Total units ordered per product (delivered orders only) ──────────────────
SELECT
    p.name       AS product,
    SUM(oi.quantity) AS units_ordered
FROM OrderItems oi
JOIN Products p  ON p.product_id  = oi.product_id
JOIN Orders   o  ON o.order_id    = oi.order_id
WHERE o.status = 'delivered'
GROUP BY p.product_id
ORDER BY units_ordered DESC;

-- ── Simulate restocking: add 50 units to every product below the threshold ───
UPDATE Products
SET stock = stock + 50
WHERE stock < 20;

-- Confirm new stock levels
SELECT name, stock FROM Products ORDER BY stock ASC;
