/* Query ShipCountry, year of the order (via STRFTIME) and number of orders from the Order table */

SELECT 
	ShipCountry, 
	STRFTIME('%Y', OrderDate) as OrderYear, 
	COUNT(*) as Orders 
FROM [Order] 
GROUP BY
	ShipCountry, 
	STRFTIME('%Y', OrderDate)
ORDER BY 
	STRFTIME('%Y', OrderDate) DESC,
	COUNT(*) DESC