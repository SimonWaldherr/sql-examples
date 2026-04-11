/* LAG and LEAD are window functions that let you access a previous or next row's
   value within the same result set without a self-join.
   Useful for comparing a row to its predecessor or successor. */

DROP TABLE IF EXISTS MonthlyRevenue;
CREATE TABLE MonthlyRevenue (
    month   TEXT,
    revenue REAL
);

INSERT INTO MonthlyRevenue (month, revenue) VALUES
    ('2023-01', 12000),
    ('2023-02', 15000),
    ('2023-03', 11000),
    ('2023-04', 18000),
    ('2023-05', 21000),
    ('2023-06', 19500);

-- LAG: compare each month's revenue to the previous month
SELECT
    month,
    revenue,
    LAG(revenue, 1) OVER (ORDER BY month)                   AS prev_month_revenue,
    revenue - LAG(revenue, 1) OVER (ORDER BY month)         AS revenue_change,
    ROUND(
        (revenue - LAG(revenue, 1) OVER (ORDER BY month))
        / LAG(revenue, 1) OVER (ORDER BY month) * 100, 1
    )                                                        AS pct_change
FROM MonthlyRevenue
ORDER BY month;

-- LEAD: show each month alongside the next month's revenue (a forward-looking view)
SELECT
    month,
    revenue,
    LEAD(revenue, 1) OVER (ORDER BY month) AS next_month_revenue
FROM MonthlyRevenue
ORDER BY month;
