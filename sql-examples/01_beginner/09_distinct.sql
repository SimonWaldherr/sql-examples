/* DISTINCT removes duplicate rows from the result set.
   This is useful when you want to see each unique value only once. */

-- Create a sample table
DROP TABLE IF EXISTS Animals;
CREATE TABLE Animals (
    id INTEGER PRIMARY KEY,
    species TEXT,
    name TEXT
);

INSERT INTO Animals (species, name) VALUES
    ('Dog', 'Rex'),
    ('Cat', 'Whiskers'),
    ('Dog', 'Buddy'),
    ('Bird', 'Tweety'),
    ('Cat', 'Luna'),
    ('Dog', 'Max');

-- Without DISTINCT: all rows are returned
SELECT species FROM Animals;

-- With DISTINCT: each species appears only once
SELECT DISTINCT species FROM Animals;

-- DISTINCT works across multiple columns too
SELECT DISTINCT species, name FROM Animals;
