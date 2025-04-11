-- Create and populate the calendar table if not exists
CREATE TEMPORARY TABLE IF NOT EXISTS calendar (
  "date" DATE UNIQUE NOT NULL,
  "dow" INT NOT NULL
);

INSERT OR IGNORE INTO calendar
SELECT d, (CAST(strftime('%w', d) AS INT) + 6) % 7
FROM (
  WITH RECURSIVE dates(d) AS (
    VALUES(date('now','-2 year'))
    UNION ALL
    SELECT date(d, '+1 day') FROM dates WHERE d < date('now','+1 year')
  )
  SELECT d FROM dates
);

SELECT 
  SUBSTR('JanFebMarAprMayJunJulAugSepOctNovDec', (CAST(strftime('%m', date) AS INTEGER)-1)*3+1, 3) AS Month,
  COUNT(*) AS Days,
  COUNT(CASE WHEN dow < 5 THEN 1 END) AS Weekdays
FROM calendar
WHERE strftime('%Y', date) = strftime('%Y', date('now'))
GROUP BY strftime('%m', date)
ORDER BY strftime('%m', date) ASC;