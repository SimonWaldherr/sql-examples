/* Query 10 entries from multiple columns of the Order table ordered by OrderDate descending */

SELECT Id, ShipName, OrderDate FROM [Order] ORDER BY OrderDate DESC LIMIT 0,10