/* INSERT OR REPLACE (also written as REPLACE INTO) and ON CONFLICT let you
   handle duplicate key violations gracefully instead of raising an error.
   SQLite supports several conflict resolution strategies:
     REPLACE  – delete the conflicting row and insert the new one
     IGNORE   – skip the insert silently
     UPDATE   – update specific columns (requires ON CONFLICT ... DO UPDATE) */

DROP TABLE IF EXISTS Settings;
CREATE TABLE Settings (
    key   TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Initial inserts
INSERT INTO Settings (key, value) VALUES ('theme', 'light');
INSERT INTO Settings (key, value) VALUES ('language', 'en');
INSERT INTO Settings (key, value) VALUES ('timezone', 'UTC');

SELECT * FROM Settings;

-- REPLACE INTO: if 'theme' already exists the old row is deleted and a new one inserted
REPLACE INTO Settings (key, value) VALUES ('theme', 'dark');

-- INSERT OR IGNORE: the insert is silently skipped if the key already exists
INSERT OR IGNORE INTO Settings (key, value) VALUES ('language', 'de');

-- INSERT ... ON CONFLICT DO UPDATE (upsert): update only specific columns on conflict
INSERT INTO Settings (key, value)
VALUES ('timezone', 'Europe/Berlin')
ON CONFLICT(key) DO UPDATE SET
    value      = excluded.value,
    updated_at = datetime('now');

-- Show final state
SELECT * FROM Settings;
