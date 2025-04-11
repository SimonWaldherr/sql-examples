-- Drop and create an Employees table
DROP TABLE IF EXISTS Employees;
CREATE TABLE Employees (
  EmployeeID INTEGER PRIMARY KEY,
  Name TEXT,
  Department TEXT,
  Salary INTEGER
);

-- Insert sample employee data
INSERT INTO Employees (Name, Department, Salary) VALUES
  ('Alice', 'Sales', 50000),
  ('Bob', 'Sales', 60000),
  ('Charlie', 'Sales', 55000),
  ('David', 'Marketing', 65000),
  ('Eva', 'Marketing', 64000),
  ('Frank', 'Marketing', 62000);

-- Use a window function to rank employees by salary in each department
SELECT 
  EmployeeID,
  Name,
  Department,
  Salary,
  RANK() OVER (PARTITION BY Department ORDER BY Salary DESC) AS SalaryRank
FROM Employees
ORDER BY Department, SalaryRank;
