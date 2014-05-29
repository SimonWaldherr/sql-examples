/* Query entries from multiple columns of the Order table where ShipCountry is Germany and ShipPostalCode is 68306 */

SELECT Id, ShipName, OrderDate FROM [Order] WHERE ShipCountry = 'Germany' AND ShipPostalCode = '68306'