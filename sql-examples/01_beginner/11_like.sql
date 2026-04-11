/* LIKE is used for pattern matching in text columns.
   Two wildcards are available:
     %  matches any sequence of zero or more characters
     _  matches exactly one character */

DROP TABLE IF EXISTS Employees;
CREATE TABLE Employees (
    id        INTEGER PRIMARY KEY,
    firstname TEXT,
    lastname  TEXT,
    email     TEXT
);

INSERT INTO Employees (firstname, lastname, email) VALUES
    ('Alice',   'Anderson', 'alice@example.com'),
    ('Bob',     'Brown',    'bob@work.org'),
    ('Charlie', 'Clark',    'charlie@example.com'),
    ('Diana',   'Davis',    'diana@example.net'),
    ('Edward',  'Evans',    'edward@work.org');

-- Names starting with 'A'
SELECT * FROM Employees WHERE firstname LIKE 'A%';

-- Names ending with 'e'
SELECT * FROM Employees WHERE firstname LIKE '%e';

-- Email addresses from the example.com domain
SELECT * FROM Employees WHERE email LIKE '%@example.com';

-- First names with exactly 3 characters
SELECT * FROM Employees WHERE firstname LIKE '___';

-- Case-insensitive search (SQLite LIKE is case-insensitive for ASCII letters by default)
SELECT * FROM Employees WHERE lastname LIKE 'b%';
