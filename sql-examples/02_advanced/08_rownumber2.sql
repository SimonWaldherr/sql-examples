/* Select top 3 customers for each product by sum of sales quantity */

SELECT * FROM (
SELECT 
    od.ProductId               AS ProductId,
	p.ProductName              AS Product,
	c.CompanyName              AS Customer, 
	SUM(od.Quantity)           AS Quantity,
	ROW_NUMBER() OVER(
		PARTITION BY od.ProductId
		ORDER BY SUM(od.Quantity) DESC
	) AS Ranking
FROM OrderDetail     AS od
LEFT JOIN [Order]    AS o ON o.Id = od.orderid
LEFT JOIN [Customer] AS c ON o.customerid = c.Id
LEFT JOIN [Product]  AS p ON od.ProductId = p.Id
GROUP BY c.CompanyName, od.ProductId, p.ProductName
) ProductRankingByCustomer
WHERE Ranking < 4