/* A Common Table Expression (CTE) gives a name to a subquery so it can be
   referenced like a table later in the same statement.
   CTEs make complex queries easier to read and maintain. */

DROP TABLE IF EXISTS Employees;
CREATE TABLE Employees (
    id         INTEGER PRIMARY KEY,
    name       TEXT,
    department TEXT,
    salary     REAL
);

INSERT INTO Employees (name, department, salary) VALUES
    ('Alice',   'Engineering', 90000),
    ('Bob',     'Engineering', 85000),
    ('Carol',   'Marketing',   70000),
    ('David',   'Marketing',   75000),
    ('Eve',     'Engineering', 95000),
    ('Frank',   'HR',          60000);

-- CTE: compute average salary per department, then find employees above their dept average
WITH DeptAvg AS (
    SELECT department, AVG(salary) AS avg_salary
    FROM Employees
    GROUP BY department
)
SELECT
    e.name,
    e.department,
    e.salary,
    ROUND(da.avg_salary, 2) AS dept_avg
FROM Employees e
JOIN DeptAvg da ON e.department = da.department
WHERE e.salary > da.avg_salary
ORDER BY e.department, e.salary DESC;

-- Multiple CTEs chained together
WITH
  DeptStats AS (
      SELECT department, MIN(salary) AS min_sal, MAX(salary) AS max_sal
      FROM Employees
      GROUP BY department
  ),
  TopDept AS (
      SELECT department FROM DeptStats ORDER BY max_sal DESC LIMIT 1
  )
SELECT e.name, e.salary
FROM Employees e
JOIN TopDept td ON e.department = td.department
ORDER BY e.salary DESC;
