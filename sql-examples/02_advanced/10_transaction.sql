-- Drop the Account table if it exists, then create it
DROP TABLE IF EXISTS Account;
CREATE TABLE Account (
  account_id INTEGER PRIMARY KEY,
  account_name TEXT,
  balance INTEGER
);

-- Insert sample accounts
INSERT INTO Account (account_name, balance)
VALUES ('Alice', 1000), ('Bob', 500);

-- Begin a transaction to transfer money from Alice to Bob
BEGIN TRANSACTION;

  UPDATE Account
  SET balance = balance - 100
  WHERE account_name = 'Alice';

  UPDATE Account
  SET balance = balance + 100
  WHERE account_name = 'Bob';

COMMIT;

-- Check the results
SELECT * FROM Account;
