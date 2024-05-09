import {
  createProductInDB,
  deleteProductInDB,
  getProductFromDB,
  getProductsCountFromDB,
  getProductsFromDB,
  updateProductInDB,
} from "../data/products.data";
import { Product, ProductData, ProductFilters } from "../models/product";

export async function getProducts(
  filters: ProductFilters = {},
  sort?: string,
  page: number = 1,
  limit: number = 10
): Promise<Product[]> {
  return await getProductsFromDB(filters, sort, page, limit);
}

export async function getProductsCount(
  filters: ProductFilters = {}
): Promise<number> {
  return getProductsCountFromDB(filters);
}

export async function createProduct(product: ProductData): Promise<Product> {
  return await createProductInDB(product);
}

export async function getProduct(id: number): Promise<Product> {
  return await getProductFromDB(id);
}

export async function updateProduct(
  id: number,
  updates: Partial<Product>
): Promise<Product> {
  return await updateProductInDB(id, updates);
}

export async function deleteProduct(id: number): Promise<void> {
  return await deleteProductInDB(id);
}
