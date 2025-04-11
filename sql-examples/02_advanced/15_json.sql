-- Create a table to store JSON data
DROP TABLE IF EXISTS People;
CREATE TABLE People (
   id INTEGER PRIMARY KEY,
   data JSON
);

-- Insert sample JSON data
INSERT INTO People (data) VALUES
   ('{"name": "Alice", "age": 30, "hobbies": ["reading", "hiking"]}'),
   ('{"name": "Bob", "age": 25, "hobbies": ["cooking", "cycling"]}'),
   ('{"name": "Carol", "age": 27, "hobbies": ["swimming", "traveling"]}');

-- Query to extract fields from the JSON column
SELECT 
    id,
    json_extract(data, '$.name') AS name,
    json_extract(data, '$.age') AS age,
    json_extract(data, '$.hobbies[0]') AS first_hobby
FROM People;

-- Update JSON data: add a new field "active" set to true (1) for Bob
UPDATE People
SET data = json_set(data, '$.active', 1)
WHERE json_extract(data, '$.name') = 'Bob';

-- Verify the update
SELECT id, data FROM People;
