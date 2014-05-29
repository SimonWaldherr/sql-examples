/* Query all entries from the Order table and add a new column with the value DACH if the ShipCountry value is Germany, Austria or Switzerland */

SELECT 
	*, 
	CASE 
	WHEN ShipCountry IN ('Germany', 'Austria', 'Switzerland') THEN 'DACH'
	ELSE 'non-DACH' 
	END AS DACH
FROM [Order] 