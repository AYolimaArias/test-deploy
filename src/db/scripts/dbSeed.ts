import { configDotenv } from "dotenv";
import { query, pool } from "..";

if (process.env["NODE_ENV"] === "test") {
  configDotenv({ path: ".env.test" });
} else {
  configDotenv();
}

query(`INSERT INTO products (name, price, category)
  SELECT
      'Product ' || s.id, -- Genera un nombre de producto concatenando una cadena con el ID
      ROUND((RANDOM() * 1000)) * 100, -- Genera un precio aleatorio entre 0 y 10000
      CASE 
          WHEN s.id % 3 = 0 THEN 'Electronic'
          WHEN s.id % 3 = 1 THEN 'Clothing'
          ELSE 'Food'
      END -- Asigna categorías de manera aleatoria
  FROM generate_series(1, 200) AS s(id);
  `).then(() => {
  console.log("Products inserted");
  pool.end();
});
