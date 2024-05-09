import { Router } from "express";
import { ProductFilters } from "../models/product";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  getProductsCount,
  updateProduct,
} from "../services/products.service";

export const productRouter = Router();

productRouter.get("/products", async (req, res) => {
  const filters: ProductFilters = {
    category: req.query["category"] as string,
  };
  const sort = req.query["sort"] as string | undefined;
  const page = Number(req.query["page"]) || 1;
  const limit = Number(req.query["limit"]) || 10;

  const products = await getProducts(filters, sort, page, limit);

  // Pagination
  const totalItems = await getProductsCount(filters);
  const totalPages = Math.ceil(totalItems / limit);

  res.json({
    ok: true,
    data: products,
    pagination: {
      page,
      pageSize: limit,
      totalItems,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    },
  });
});

productRouter.post("/products", async (req, res) => {
  const { name, price, category } = req.body;
  const product = await createProduct({ name, price, category });
  res.status(201).json({ ok: true, data: product });
});

productRouter.get("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const product = await getProduct(id);
  if (product) {
    res.json({ ok: true, data: product });
  } else {
    // TODO: Integrar manejo de errores centralizado en el último middleware de app
    res.status(404).json({ ok: false, error: "Product not found" });
  }
});

productRouter.patch("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, price, category } = req.body;
  const product = await updateProduct(id, { name, price, category });
  res.json({ ok: true, data: product });
});

productRouter.delete("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  await deleteProduct(id);
  res.json({ ok: true });
});
