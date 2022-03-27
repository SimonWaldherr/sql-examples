/* Output different dates - today, current first day of the month, end of month, first of may 2022 */

SELECT 
    date('now') as "today",
    date('now','start of month') as "start of month", 
    date('now','start of month','+1 month') as "end of month",
    date('2022-05-01') as "first of may 2022"
