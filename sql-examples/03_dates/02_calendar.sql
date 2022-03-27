/* create a table with dates from 2 years past till 1 year future */

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

SELECT * FROM "calendar" 
ORDER BY "date" DESC
LIMIT 0,100;