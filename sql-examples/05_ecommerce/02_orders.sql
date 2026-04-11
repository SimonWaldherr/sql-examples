/* Real-life scenario: Order tracking and revenue analysis.
   Common reporting queries an e-commerce back-end would run daily.
   (Run 00_schema.sql first to create and populate the tables.) */

-- ── Revenue per order ─────────────────────────────────────────────────────────
SELECT
    o.order_id,
    o.order_date,
    c.name        AS customer,
    o.status,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS order_total
FROM Orders o
JOIN Customers  c  ON c.customer_id = o.customer_id
JOIN OrderItems oi ON oi.order_id   = o.order_id
GROUP BY o.order_id
ORDER BY o.order_date;

-- ── Monthly revenue (delivered orders only) ───────────────────────────────────
SELECT
    STRFTIME('%Y-%m', o.order_date)       AS month,
    COUNT(DISTINCT o.order_id)            AS orders,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
FROM Orders o
JOIN OrderItems oi ON oi.order_id = o.order_id
WHERE o.status = 'delivered'
GROUP BY month
ORDER BY month;

-- ── Best-selling products by revenue ─────────────────────────────────────────
SELECT
    p.name                                     AS product,
    SUM(oi.quantity)                           AS units_sold,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
FROM OrderItems oi
JOIN Products p ON p.product_id  = oi.product_id
JOIN Orders   o ON o.order_id    = oi.order_id
WHERE o.status != 'cancelled'
GROUP BY p.product_id
ORDER BY revenue DESC;

-- ── Order status summary ──────────────────────────────────────────────────────
SELECT
    status,
    COUNT(*) AS order_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Orders), 1) AS pct
FROM Orders
GROUP BY status
ORDER BY order_count DESC;

-- ── Average order value per country ──────────────────────────────────────────
SELECT
    c.country,
    COUNT(DISTINCT o.order_id)                          AS orders,
    ROUND(AVG(oi.quantity * oi.unit_price), 2)          AS avg_item_value,
    ROUND(SUM(oi.quantity * oi.unit_price)
          / COUNT(DISTINCT o.order_id), 2)              AS avg_order_value
FROM Orders o
JOIN Customers  c  ON c.customer_id = o.customer_id
JOIN OrderItems oi ON oi.order_id   = o.order_id
WHERE o.status = 'delivered'
GROUP BY c.country
ORDER BY avg_order_value DESC;
