/* Create a temporary table with the content of the subsequent query */

CREATE TEMPORARY TABLE OrdersByYearAndArea AS 
SELECT 
	STRFTIME('%Y', OrderDate) as OrderYear,
	CASE 
	WHEN ShipCountry IN ('Germany', 'Austria', 'Switzerland') THEN 'DACH'
	ELSE 'non-DACH' 
	END AS DACH,
	COUNT(*) as Orders 
FROM [Order] 
GROUP BY
	STRFTIME('%Y', OrderDate),
	CASE 
	WHEN ShipCountry IN ('Germany', 'Austria', 'Switzerland') THEN 'DACH'
	ELSE 'non-DACH' 
	END