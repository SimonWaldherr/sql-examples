-- Recursive CTE to generate a Fibonacci sequence
WITH RECURSIVE Fib(n, a, b) AS (
  SELECT 1, 0, 1  -- starting values: n=1, Fibonacci number 0, next number 1
  UNION ALL
  SELECT n + 1, b, a + b 
  FROM Fib 
  WHERE n < 10
)
SELECT n, a AS FibonacciNumber FROM Fib;
