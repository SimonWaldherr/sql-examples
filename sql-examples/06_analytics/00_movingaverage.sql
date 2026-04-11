/* Real-life scenario: Moving average for time-series data.
   A 3-day moving average smooths out day-to-day noise and reveals trends.
   Useful in finance, sales monitoring, and operational dashboards. */

DROP TABLE IF EXISTS DailySales;
CREATE TABLE DailySales (
    sale_date TEXT PRIMARY KEY,
    revenue   REAL
);

INSERT INTO DailySales (sale_date, revenue) VALUES
    ('2023-07-01',  840),
    ('2023-07-02', 1200),
    ('2023-07-03',  760),
    ('2023-07-04',  980),
    ('2023-07-05', 1350),
    ('2023-07-06',  620),
    ('2023-07-07', 1100),
    ('2023-07-08',  930),
    ('2023-07-09', 1480),
    ('2023-07-10',  870),
    ('2023-07-11', 1050),
    ('2023-07-12',  790),
    ('2023-07-13', 1230),
    ('2023-07-14', 1010);

-- 3-day moving average using a window frame
SELECT
    sale_date,
    revenue,
    ROUND(
        AVG(revenue) OVER (
            ORDER BY sale_date
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ), 2
    ) AS moving_avg_3d,
    ROUND(
        AVG(revenue) OVER (
            ORDER BY sale_date
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ), 2
    ) AS moving_avg_7d
FROM DailySales
ORDER BY sale_date;

-- Day with the highest single-day revenue vs. its 3-day moving average
WITH MovingAvg AS (
    SELECT
        sale_date,
        revenue,
        AVG(revenue) OVER (
            ORDER BY sale_date
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ) AS ma3
    FROM DailySales
)
SELECT
    sale_date,
    revenue,
    ROUND(ma3, 2)                          AS moving_avg_3d,
    ROUND(revenue - ma3, 2)                AS deviation,
    ROUND((revenue - ma3) / ma3 * 100, 1)  AS pct_above_avg
FROM MovingAvg
ORDER BY deviation DESC
LIMIT 3;
