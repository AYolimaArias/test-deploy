import express from "express";
import cors from "cors";

import { configDotenv } from "dotenv";
import { productRouter } from "./routers/products.router";

if (process.env["NODE_ENV"] === "test") {
  configDotenv({ path: ".env.test" });
} else {
  configDotenv();
}

export const app = express();

// Configurar CORS para permitir solicitudes desde el frontend
const corsOptions = {
  origin: process.env["CLIENT_ORIGIN"], // http:localhost:5173
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Configurar JSON middleware
app.use(express.json());

// Configurar rutas
app.use(productRouter);
