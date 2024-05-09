import { Product, ProductData, ProductFilters } from "../models/product";
import { filtering, sorting } from "./utils";
import * as db from "../db";

export async function getProductsFromDB(
  filters: ProductFilters = {},
  sort?: string,
  page?: number,
  limit?: number
): Promise<Product[]> {
  let query = "SELECT * FROM products";
  const queryParams: (string | boolean | number)[] = [];

  // Filtering
  query = filtering(query, filters, queryParams);
  // Sorting
  query = sorting(query, sort);

  // Pagination
  if (page && limit) {
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;
  }

  const result = await db.query(query, queryParams);
  return result.rows;
}

export async function getProductsCountFromDB(
  filters: ProductFilters = {}
): Promise<number> {
  let query = "SELECT COUNT(*) FROM products";
  const queryParams: (string | boolean | number)[] = [];
  // Filtering
  query = filtering(query, filters, queryParams);

  // console.log({ query, queryParams });
  const result = await db.query(query, queryParams);
  return Number(result.rows[0].count);
}

export async function getProductFromDB(id: number): Promise<Product> {
  const query = "SELECT * FROM products WHERE id = $1";
  const queryParams = [id];
  const result = await db.query(query, queryParams);
  return result.rows[0];
}

export async function createProductInDB(
  product: ProductData
): Promise<Product> {
  const query =
    "INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *";
  const queryParams = [product.name, product.price, product.category];
  const result = await db.query(query, queryParams);
  return result.rows[0];
}

export async function updateProductInDB(
  id: number,
  updates: Partial<ProductData>
): Promise<Product> {
  let query = "UPDATE products SET";
  const queryParams = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (value) {
      if (queryParams.length > 0) {
        query += ",";
      }
      queryParams.push(value);
      query += ` ${key} = $${queryParams.length}`;
    }
  });

  queryParams.push(id);
  query += ` WHERE id = $${queryParams.length} RETURNING *`;

  const result = await db.query(query, queryParams);
  return result.rows[0];
}

export async function deleteProductInDB(id: number): Promise<void> {
  const query = "DELETE FROM products WHERE id = $1";
  const queryParams = [id];
  await db.query(query, queryParams);
}
