/* Output of different time windows with description */

SELECT 
  'CM' as "period", 'current month' as "description",
  date('now','start of month') as "from", 
  date('now','start of month','+1 month','-1 day') as "till"

UNION ALL

SELECT 
  'YTM' as "period", 'year to month' as "description",
  date('now','start of year') as "from", 
  date('now','start of month','-1 day') as "till"

UNION ALL

SELECT 
  'YTD' as "period", 'year to date' as "description",
  date('now','start of year') as "from", 
  date('now','-1 day') as "till"

UNION ALL

SELECT 
  'MTD' as "period", 'month to date' as "description",
  date('now','start of month') as "from", 
  date('now','-1 day') as "till"

UNION ALL

SELECT 
  'SMPY' as "period", 'same month previous year' as "description",
  date('now','start of month','-1 year') as "from", 
  date('now','start of month','+1 month','-1 day','-1 year') as "till"  

UNION ALL

SELECT 
  'PM' as "period", 'previous month' as "description",
  date('now','start of month','-1 month') as "from", 
  date('now','start of month','-1 day') as "till"

UNION ALL

SELECT 
  'PY' as "period", 'previous year' as "description",
  date('now','start of year','-1 year') as "from", 
  date('now','start of year','-1 day') as "till"

UNION ALL

SELECT 
  'PMPY' as "period", 'previous month in previous year' as "description",
  date('now','start of month','-1 month','-1 year') as "from", 
  date('now','start of month','-1 day','-1 year') as "till"

UNION ALL

SELECT 
  '365' as "period", 'last 365 days' as "description",
  date('now','-366 days') as "from", 
  date('now','-1 day') as "till";
