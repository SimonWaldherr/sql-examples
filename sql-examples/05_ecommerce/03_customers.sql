/* Real-life scenario: Customer analysis – top customers, purchase frequency,
   and a simple RFM (Recency, Frequency, Monetary) score.
   (Run 00_schema.sql first to create and populate the tables.) */

-- ── Lifetime value per customer ───────────────────────────────────────────────
SELECT
    c.customer_id,
    c.name,
    c.country,
    COUNT(DISTINCT o.order_id)                           AS total_orders,
    ROUND(SUM(oi.quantity * oi.unit_price), 2)           AS lifetime_value
FROM Customers c
LEFT JOIN Orders     o  ON o.customer_id = c.customer_id AND o.status != 'cancelled'
LEFT JOIN OrderItems oi ON oi.order_id   = o.order_id
GROUP BY c.customer_id
ORDER BY lifetime_value DESC;

-- ── Customers who have not ordered in the last 180 days ──────────────────────
SELECT
    c.name,
    c.email,
    MAX(o.order_date) AS last_order_date
FROM Customers c
LEFT JOIN Orders o ON o.customer_id = c.customer_id AND o.status != 'cancelled'
GROUP BY c.customer_id
HAVING last_order_date < date('now', '-180 days')
    OR last_order_date IS NULL
ORDER BY last_order_date;

-- ── Simple RFM scoring ────────────────────────────────────────────────────────
-- Recency:   days since last purchase (lower = better)
-- Frequency: number of completed orders
-- Monetary:  total spend
WITH CustomerMetrics AS (
    SELECT
        c.customer_id,
        c.name,
        CAST(JULIANDAY('now') - JULIANDAY(MAX(o.order_date)) AS INTEGER) AS recency_days,
        COUNT(DISTINCT o.order_id)                                         AS frequency,
        ROUND(SUM(oi.quantity * oi.unit_price), 2)                         AS monetary
    FROM Customers c
    LEFT JOIN Orders     o  ON o.customer_id = c.customer_id AND o.status = 'delivered'
    LEFT JOIN OrderItems oi ON oi.order_id   = o.order_id
    GROUP BY c.customer_id
)
SELECT
    customer_id,
    name,
    recency_days,
    frequency,
    monetary,
    CASE
        WHEN recency_days <= 90  AND frequency >= 2 AND monetary >= 100 THEN 'Champion'
        WHEN recency_days <= 180 AND frequency >= 1                     THEN 'Loyal'
        WHEN monetary IS NULL                                            THEN 'Prospect'
        ELSE 'At Risk'
    END AS rfm_segment
FROM CustomerMetrics
ORDER BY monetary DESC NULLS LAST;
