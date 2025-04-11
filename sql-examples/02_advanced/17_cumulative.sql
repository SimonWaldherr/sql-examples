-- Create a table with daily expense records
DROP TABLE IF EXISTS Expenses;
CREATE TABLE Expenses (
    ExpenseDate DATE,
    Amount REAL
);

-- Insert sample daily expenses data
INSERT INTO Expenses (ExpenseDate, Amount) VALUES 
  ('2023-01-01', 10.0),
  ('2023-01-02', 15.0),
  ('2023-01-03', 20.0),
  ('2023-01-04', 5.0),
  ('2023-01-05', 12.0);

-- Use a window function to compute a cumulative expense total by date
SELECT 
    ExpenseDate,
    Amount,
    SUM(Amount) OVER (ORDER BY ExpenseDate ASC) AS CumulativeTotal
FROM Expenses
ORDER BY ExpenseDate ASC;
