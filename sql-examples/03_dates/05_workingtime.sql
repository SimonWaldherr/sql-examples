/* Here is an example that should make it clear how easy it can be to record working hours with SQL. */

-- delete tables
DROP TABLE IF EXISTS "type";
DROP TABLE IF EXISTS "entries";

-- create temporary tables
CREATE TEMPORARY TABLE IF NOT EXISTS "type" (
  "status" TEXT UNIQUE NOT NULL,
  "work" INT NOT NULL,
  "comment" TEXT NULL
);

CREATE TEMPORARY TABLE IF NOT EXISTS "entries" (
  "date" DATE NOT NULL,
  "type" TEXT NOT NULL,
  "user" TEXT NOT NULL,
  "comment" TEXT NULL
);

-- insert working time registration entries
INSERT INTO  "type" ("status", "work", "comment") VALUES ('work', '1', 'clock in');
INSERT INTO  "type" ("status", "work", "comment") VALUES ('end of work', '0', 'clock out');
INSERT INTO  "type" ("status", "work", "comment") VALUES ('break', '0', 'clock out');
INSERT INTO  "type" ("status", "work", "comment") VALUES ('clean up', '1', 'additional activities');
INSERT INTO  "entries" ("date", "type", "user", "comment") VALUES ('2022-04-11 10:00:00', 'work', 'JohnDoe', '');
INSERT INTO  "entries" ("date", "type", "user", "comment") VALUES ('2022-04-11 16:15:00', 'end of work', 'JohnDoe', '');
INSERT INTO  "entries" ("date", "type", "user", "comment") VALUES ('2022-04-12 09:00:00', 'work', 'JohnDoe', '');
INSERT INTO  "entries" ("date", "type", "user", "comment") VALUES ('2022-04-13 01:00:00', 'end of work', 'JohnDoe', '');
INSERT INTO  "entries" ("date", "type", "user", "comment") VALUES ('2022-04-14 09:00:00', 'work', 'JohnDoe', '');
INSERT INTO  "entries" ("date", "type", "user", "comment") VALUES ('2022-04-14 19:00:00', 'end of work', 'JohnDoe', '');
INSERT INTO  "entries" ("date", "type", "user", "comment") VALUES ('2022-04-15 09:00:00', 'work', 'JohnDoe', '');
INSERT INTO  "entries" ("date", "type", "user", "comment") VALUES ('2022-04-15 12:00:00', 'break', 'JohnDoe', '');
INSERT INTO  "entries" ("date", "type", "user", "comment") VALUES ('2022-04-15 13:00:00', 'work', 'JohnDoe', '');
INSERT INTO  "entries" ("date", "type", "user", "comment") VALUES ('2022-04-15 17:00:00', 'end of work', 'JohnDoe', '');

-- select sum of working time 
SELECT
    x. "user",
    x. "type",
    ROUND((JULIANDAY("till") - JULIANDAY("from")) * 3600) AS "worktime"
FROM (
    SELECT
        entries. "user",
        entries. "type",
        "type"."work",
        entries. "comment",
        DATETIME (entries. "date") AS "from",
        IFNULL((
                SELECT
                    DATETIME (nextentry. "date")
                FROM
                    entries AS nextentry
                WHERE
                    nextentry. "user" = entries. "user"
                    AND DATETIME (nextentry. "date") > DATETIME (entries. "date")
                ORDER BY
                    DATETIME (nextentry. "date") ASC
                LIMIT 0,
                1),
            DATETIME ('now')) AS "till",
        "type"."work"
    FROM
        entries
    LEFT JOIN "type" ON "type".status = entries. "type"
ORDER BY
    DATETIME (entries. "date") ASC) x
WHERE
    "work" = 1
GROUP BY x. "user",
    x. "type"
