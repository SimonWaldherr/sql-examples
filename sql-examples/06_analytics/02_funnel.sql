/* Real-life scenario: Web session funnel analysis.
   A funnel tracks how many users progress through successive steps of a flow,
   e.g. landing page → product view → add-to-cart → checkout → purchase.
   Drop-off rates at each step highlight where to focus UX improvements. */

DROP TABLE IF EXISTS SessionEvents;
CREATE TABLE SessionEvents (
    session_id TEXT,
    user_id    INTEGER,
    event      TEXT,   -- landing | product_view | add_to_cart | checkout | purchase
    event_time TEXT
);

INSERT INTO SessionEvents (session_id, user_id, event, event_time) VALUES
    -- Completed funnels
    ('s01', 1, 'landing',       '2023-10-01 09:00:00'),
    ('s01', 1, 'product_view',  '2023-10-01 09:02:00'),
    ('s01', 1, 'add_to_cart',   '2023-10-01 09:05:00'),
    ('s01', 1, 'checkout',      '2023-10-01 09:08:00'),
    ('s01', 1, 'purchase',      '2023-10-01 09:10:00'),
    ('s02', 2, 'landing',       '2023-10-01 10:00:00'),
    ('s02', 2, 'product_view',  '2023-10-01 10:03:00'),
    ('s02', 2, 'add_to_cart',   '2023-10-01 10:06:00'),
    ('s02', 2, 'checkout',      '2023-10-01 10:09:00'),
    ('s02', 2, 'purchase',      '2023-10-01 10:12:00'),
    -- Dropped at checkout
    ('s03', 3, 'landing',       '2023-10-02 11:00:00'),
    ('s03', 3, 'product_view',  '2023-10-02 11:04:00'),
    ('s03', 3, 'add_to_cart',   '2023-10-02 11:07:00'),
    ('s03', 3, 'checkout',      '2023-10-02 11:11:00'),
    -- Dropped at add-to-cart
    ('s04', 4, 'landing',       '2023-10-02 14:00:00'),
    ('s04', 4, 'product_view',  '2023-10-02 14:02:00'),
    ('s04', 4, 'add_to_cart',   '2023-10-02 14:05:00'),
    -- Dropped at product view
    ('s05', 5, 'landing',       '2023-10-03 08:30:00'),
    ('s05', 5, 'product_view',  '2023-10-03 08:33:00'),
    -- Bounced immediately
    ('s06', 6, 'landing',       '2023-10-03 12:00:00');

-- ── Funnel step counts ────────────────────────────────────────────────────────
WITH FunnelSteps(step_order, step_name) AS (
    VALUES
        (1, 'landing'),
        (2, 'product_view'),
        (3, 'add_to_cart'),
        (4, 'checkout'),
        (5, 'purchase')
),
StepCounts AS (
    SELECT
        event                    AS step_name,
        COUNT(DISTINCT session_id) AS sessions
    FROM SessionEvents
    GROUP BY event
)
SELECT
    fs.step_order,
    fs.step_name,
    COALESCE(sc.sessions, 0) AS sessions,
    ROUND(
        COALESCE(sc.sessions, 0) * 100.0
        / (SELECT sessions FROM StepCounts WHERE step_name = 'landing'),
        1
    ) AS pct_of_top
FROM FunnelSteps fs
LEFT JOIN StepCounts sc ON sc.step_name = fs.step_name
ORDER BY fs.step_order;

-- ── Step-over-step drop-off ───────────────────────────────────────────────────
WITH FunnelCounts AS (
    SELECT
        event                      AS step,
        COUNT(DISTINCT session_id) AS sessions,
        CASE event
            WHEN 'landing'       THEN 1
            WHEN 'product_view'  THEN 2
            WHEN 'add_to_cart'   THEN 3
            WHEN 'checkout'      THEN 4
            WHEN 'purchase'      THEN 5
        END AS step_order
    FROM SessionEvents
    GROUP BY event
)
SELECT
    step,
    sessions,
    LAG(sessions) OVER (ORDER BY step_order) AS prev_step_sessions,
    ROUND(
        (1.0 - sessions * 1.0 / LAG(sessions) OVER (ORDER BY step_order)) * 100,
        1
    ) AS dropoff_pct
FROM FunnelCounts
ORDER BY step_order;
