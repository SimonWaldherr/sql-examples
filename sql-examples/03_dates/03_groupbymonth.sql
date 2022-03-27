/* select number of days and weekdays of each month in current year */

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
  substr('JanFebMarAprMayJunJulAugSepOctNovDec', 1 + 3*strftime('%m', "date"), -3) as "Month",
  COUNT(*) as "Days",
  COUNT(CASE WHEN "calendar"."dow" < 5 THEN 1 END) as "Weekdays"
FROM "calendar"
WHERE strftime('%Y', "date") = strftime('%Y', date('now'))
GROUP BY strftime('%m', "date")
ORDER BY strftime('%m', "date") ASC;
