/* Query ShipCountry and Orders per ShipCountry from the Order table */

SELECT ShipCountry, COUNT(*) as Orders FROM [Order] GROUP BY ShipCountry ORDER BY COUNT(*) DESC