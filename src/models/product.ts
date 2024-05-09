export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

export type ProductData = Omit<Product, "id">;

export type ProductFilters = {
  category?: string;
};
