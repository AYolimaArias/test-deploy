import { Migration } from "../scripts/dbMigrate";

export const up: Migration = async (params) => {
  return params.context.query(`CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    price INTEGER,
    category VARCHAR(255)
);
`);
};

export const down: Migration = async (params) => {
  return params.context.query(`DROP TABLE products;`);
};
