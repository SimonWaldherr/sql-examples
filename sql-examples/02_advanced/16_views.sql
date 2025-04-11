-- Drop and create a table representing sales transactions
DROP TABLE IF EXISTS Sales;
CREATE TABLE Sales (
    SaleID INTEGER PRIMARY KEY,
    Product TEXT,
    SaleDate DATE,
    Quantity INTEGER,
    UnitPrice REAL
);

-- Insert sample sales data
INSERT INTO Sales (Product, SaleDate, Quantity, UnitPrice)
VALUES 
  ('Widget', '2023-01-15', 10, 2.50),
  ('Widget', '2023-01-20', 5, 2.50),
  ('Gadget', '2023-02-01', 7, 3.00),
  ('Widget', '2023-02-05', 8, 2.50),
  ('Gadget', '2023-02-15', 3, 3.00);

-- Create a view that summarizes sales by product
DROP VIEW IF EXISTS SalesSummary;
CREATE VIEW SalesSummary AS
SELECT 
    Product,
    COUNT(*) AS SalesCount,
    SUM(Quantity) AS TotalQuantity,
    ROUND(SUM(Quantity * UnitPrice), 2) AS TotalRevenue
FROM Sales
GROUP BY Product;

-- Query the view for a summary of sales
SELECT * FROM SalesSummary;
