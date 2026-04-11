/* Real-life scenario: Cohort analysis.
   A cohort groups users by the period they first performed an action (e.g. registered).
   We then measure how many users in each cohort returned in subsequent periods.
   This reveals retention patterns and is a standard SaaS / e-commerce metric. */

DROP TABLE IF EXISTS UserActivity;
CREATE TABLE UserActivity (
    user_id       INTEGER,
    activity_date TEXT
);

-- Each row represents a day a user was active in the app
INSERT INTO UserActivity (user_id, activity_date) VALUES
    -- Cohort January 2023
    (1, '2023-01-05'), (1, '2023-02-10'), (1, '2023-03-15'), (1, '2023-04-01'),
    (2, '2023-01-12'), (2, '2023-02-20'),
    (3, '2023-01-20'),
    -- Cohort February 2023
    (4, '2023-02-02'), (4, '2023-03-08'), (4, '2023-04-10'),
    (5, '2023-02-14'), (5, '2023-03-14'),
    (6, '2023-02-25'),
    -- Cohort March 2023
    (7, '2023-03-01'), (7, '2023-04-05'),
    (8, '2023-03-10'),
    (9, '2023-03-22'), (9, '2023-04-22');

-- Step 1: find each user's first active month (cohort assignment)
WITH FirstActivity AS (
    SELECT
        user_id,
        STRFTIME('%Y-%m', MIN(activity_date)) AS cohort_month
    FROM UserActivity
    GROUP BY user_id
),

-- Step 2: pair every activity record with the user's cohort month
ActivityWithCohort AS (
    SELECT
        ua.user_id,
        fa.cohort_month,
        STRFTIME('%Y-%m', ua.activity_date) AS active_month,
        -- months elapsed since the cohort month (period index)
        CAST(
            (JULIANDAY(STRFTIME('%Y-%m-01', ua.activity_date))
             - JULIANDAY(cohort_month || '-01'))
            / 30.44
        AS INTEGER)                          AS period
    FROM UserActivity ua
    JOIN FirstActivity fa ON fa.user_id = ua.user_id
),

-- Step 3: count cohort size and distinct returning users per period
CohortSize AS (
    SELECT cohort_month, COUNT(DISTINCT user_id) AS cohort_users
    FROM FirstActivity
    GROUP BY cohort_month
),

RetentionRaw AS (
    SELECT
        cohort_month,
        period,
        COUNT(DISTINCT user_id) AS active_users
    FROM ActivityWithCohort
    GROUP BY cohort_month, period
)

-- Step 4: calculate retention rate for each cohort × period
SELECT
    r.cohort_month,
    cs.cohort_users,
    r.period          AS months_since_start,
    r.active_users,
    ROUND(r.active_users * 100.0 / cs.cohort_users, 1) AS retention_pct
FROM RetentionRaw r
JOIN CohortSize cs ON cs.cohort_month = r.cohort_month
ORDER BY r.cohort_month, r.period;
