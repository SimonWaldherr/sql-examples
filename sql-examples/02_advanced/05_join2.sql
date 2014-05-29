/* Join data from the OrderDetail table to the Order table */

SELECT
	COUNT(DISTINCT [Order].Id) as Orders,
	COUNT(*) as OrderLines
FROM [Order]
JOIN [OrderDetail] on [Order].ID = [OrderDetail].OrderID 