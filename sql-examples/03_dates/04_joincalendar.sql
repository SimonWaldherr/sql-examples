/* combine "timeperiods" example with "calendar" example */

CREATE TEMPORARY TABLE IF NOT EXISTS calendar (
  "date" date UNIQUE NOT NULL,
  "dow" INT NOT NULL
);

INSERT OR ignore INTO "calendar"
SELECT * FROM (
  WITH RECURSIVE dates(d) AS (
    VALUES(date('now','-2 year'))
    UNION ALL
    SELECT date(d, '+1 day') FROM dates WHERE d < date('now','+1 year')
  )
  SELECT d, (CAST(strftime('%w', d) AS INT) + 6) % 7 AS "dow" FROM dates
);

SELECT 
  "period", 
  "description", 
  "from", 
  "till", 
  CAST (JulianDay("till") - JulianDay("from") as Integer) as "days",
  COUNT(CASE WHEN "calendar"."dow" < 5 THEN 1 END) as "weekdays"
FROM (

SELECT 
  'CM' as "period", 'current month' as "description",
  date('now','start of month') as "from", 
  date('now','start of month','+1 month','-1 day') as "till"

UNION ALL

SELECT 
  'YTM' as "period", 'year to month' as "description",
  date('now','start of year') as "from", 
  date('now','start of month','-1 day') as "till"

UNION ALL

SELECT 
  'YTD' as "period", 'year to date' as "description",
  date('now','start of year') as "from", 
  date('now','-1 day') as "till"

UNION ALL

SELECT 
  'MTD' as "period", 'month to date' as "description",
  date('now','start of month') as "from", 
  date('now','-1 day') as "till"

UNION ALL

SELECT 
  'SMPY' as "period", 'same month previous year' as "description",
  date('now','start of month','-1 year') as "from", 
  date('now','start of month','+1 month','-1 day','-1 year') as "till"  

UNION ALL

SELECT 
  'PM' as "period", 'previous month' as "description",
  date('now','start of month','-1 month') as "from", 
  date('now','start of month','-1 day') as "till"

UNION ALL

SELECT 
  'PY' as "period", 'previous year' as "description",
  date('now','start of year','-1 year') as "from", 
  date('now','start of year','-1 day') as "till"

UNION ALL

SELECT 
  'PMPY' as "period", 'previous month in previous year' as "description",
  date('now','start of month','-1 month','-1 year') as "from", 
  date('now','start of month','-1 day','-1 year') as "till"

UNION ALL

SELECT 
  '365' as "period", 'last 365 days' as "description",
  date('now','-366 days') as "from", 
  date('now','-1 day') as "till"
) x
LEFT JOIN "calendar" ON "calendar"."date" BETWEEN "x"."from" AND "x"."till"
GROUP BY "period",  "description",  "from",  "till";
