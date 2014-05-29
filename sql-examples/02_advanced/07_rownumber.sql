/* Select top 3 products for each customer by sum of sales quantity */

SELECT * FROM (
SELECT 
	c.CompanyName              AS Customer, 
    od.ProductId               AS ProductId,
	p.ProductName              AS Product,
	SUM(od.Quantity)           AS Quantity,
	ROW_NUMBER() OVER(
		PARTITION BY c.CompanyName
		ORDER BY SUM(od.Quantity) DESC
	) AS Ranking
FROM OrderDetail     AS od
LEFT JOIN [Order]    AS o ON o.Id = od.orderid
LEFT JOIN [Customer] AS c ON o.customerid = c.Id
LEFT JOIN [Product]  AS p ON od.ProductId = p.Id
GROUP BY c.CompanyName, od.ProductId, p.ProductName
) ProductRankingByCustomer
WHERE Ranking < 4