

SELECT 
    p.ProductName, 
    strftime('%Y', o.OrderDate) as OrderYear,
    od.UnitPrice*od.Quantity*(1-od.Discount) as Sales
FROM Product p 
INNER JOIN OrderDetail od on p.Id = od.ProductId
INNER JOIN [Order] o on o.[Id] = od.OrderID
GROUP BY p.ProductName, strftime('%Y', o.OrderDate)
ORDER BY strftime('%Y', o.OrderDate) ASC, od.UnitPrice*od.Quantity*(1-od.Discount) DESC;







SELECT 
    p.ProductName, 
    strftime('%Y', o.OrderDate) as OrderYear,
    od.UnitPrice*od.Quantity*(1-od.Discount) as Sales,
    count(distinct o.[Id]) as Orders,
    count(*) as OrderLines,
    sum(od.Quantity) as Quantity
FROM Product p 
INNER JOIN OrderDetail od on p.Id = od.ProductId
INNER JOIN [Order] o on o.[Id] = od.OrderID
GROUP BY p.ProductName, strftime('%Y', o.OrderDate)
ORDER BY strftime('%Y', o.OrderDate) ASC, od.UnitPrice*od.Quantity*(1-od.Discount) DESC;



SELECT 
    o.[Id],
    p.ProductName, 
    o.OrderDate,
    od.UnitPrice,
    od.Quantity,
    od.Discount,
    od.UnitPrice*od.Quantity*(1-od.Discount) as Sales
FROM OrderDetail od
INNER JOIN Product p on p.Id = od.ProductId
INNER JOIN [Order] o on o.[Id] = od.OrderID
ORDER BY o.OrderDate ASC;




SELECT 
    o.[Id] as [Order],
    od.ProductId,
    p.ProductName, 
    o.OrderDate,
    od.UnitPrice,
    od.Quantity,
    od.Discount,
    od.UnitPrice*od.Quantity*(1-od.Discount) as Sales
FROM OrderDetail od
INNER JOIN Product p on p.Id = od.ProductId
INNER JOIN [Order] o on o.[Id] = od.OrderID
ORDER BY o.OrderDate ASC;




SELECT 
    [Order].[Id] as [Order],
    od.ProductId,
    [Customer].CompanyName as Customer,
    --[Product].ProductName, 
    [Order].OrderDate,
    [Shipper].CompanyName as Carrier,
    od.UnitPrice,
    od.Quantity,
    od.Discount,
    round(od.UnitPrice*od.Quantity*(1-od.Discount),2) as Sales
FROM OrderDetail od
INNER JOIN [Product] on [Product].Id = od.ProductId
INNER JOIN [Order] on [Order].[Id] = od.OrderID
INNER JOIN [Shipper] on [Order].[ShipVia] = [Shipper].[Id]
INNER JOIN [Customer] on [Order].CustomerId = [Customer].[Id]
ORDER BY [Order].OrderDate ASC;