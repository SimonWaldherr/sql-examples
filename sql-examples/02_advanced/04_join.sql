/* Join data from the Category table to the Product table */

SELECT  
	Product.Id, 
	Product.ProductName, 
	Category.CategoryName, 
	Category.Description as [CategoryDescription]
FROM [Product]
LEFT JOIN [Category] on Product.CategoryId = Category.id