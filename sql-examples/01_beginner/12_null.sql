/* NULL represents a missing or unknown value.
   Regular comparison operators (=, !=) do not work with NULL.
   Use IS NULL / IS NOT NULL instead.
   COALESCE and IFNULL are handy for providing fallback values. */

DROP TABLE IF EXISTS Contacts;
CREATE TABLE Contacts (
    id    INTEGER PRIMARY KEY,
    name  TEXT    NOT NULL,
    phone TEXT,
    email TEXT
);

INSERT INTO Contacts (name, phone, email) VALUES
    ('Alice',   '555-0101', 'alice@example.com'),
    ('Bob',     NULL,       'bob@example.com'),
    ('Carol',   '555-0303', NULL),
    ('David',   NULL,       NULL);

-- Find contacts with no phone number
SELECT * FROM Contacts WHERE phone IS NULL;

-- Find contacts that have both a phone and an email
SELECT * FROM Contacts WHERE phone IS NOT NULL AND email IS NOT NULL;

-- IFNULL: return a fallback value when the column is NULL
SELECT name, IFNULL(phone, 'no phone') AS phone FROM Contacts;

-- COALESCE: return the first non-NULL value from a list of arguments
SELECT name, COALESCE(phone, email, 'no contact info') AS contact FROM Contacts;
