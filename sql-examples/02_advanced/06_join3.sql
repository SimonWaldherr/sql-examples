/* Join data from the Order table and Customer to the OrderDetail table */

SELECT 
	c.CompanyName              AS Customer, 
	c.Country                  AS Country, 
	COUNT(DISTINCT od.OrderId) AS Orders,
	COUNT(od.Id)               AS OrderLines
FROM OrderDetail     AS od
LEFT JOIN [Order]    AS o ON o.Id = od.orderid
LEFT JOIN [Customer] AS c ON o.customerid = c.Id
GROUP BY c.CompanyName, c.Country
ORDER BY COUNT(od.Id) DESC 