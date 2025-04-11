-- Drop any existing tables to start fresh
DROP TABLE IF EXISTS Orders;
CREATE TABLE Orders (
  OrderID INTEGER PRIMARY KEY,
  CustomerName TEXT,
  OrderDate DATE,
  TotalAmount REAL
);

DROP TABLE IF EXISTS OrdersAudit;
CREATE TABLE OrdersAudit (
  AuditID INTEGER PRIMARY KEY,
  OrderID INTEGER,
  AuditDate DATE,
  Action TEXT
);

-- Create a trigger that logs inserts into the OrdersAudit table
DROP TRIGGER IF EXISTS trg_order_insert;
CREATE TRIGGER trg_order_insert
AFTER INSERT ON Orders
BEGIN
  INSERT INTO OrdersAudit (OrderID, AuditDate, Action)
  VALUES (NEW.OrderID, date('now'), 'INSERT');
END;

-- Test the trigger by inserting a new order
INSERT INTO Orders (CustomerName, OrderDate, TotalAmount)
VALUES ('Acme Inc.', '2022-05-01', 1234.56);

-- Show the inserted order and corresponding audit record
SELECT * FROM Orders;
SELECT * FROM OrdersAudit;
