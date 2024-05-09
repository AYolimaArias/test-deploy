# DB Migrations

Este proyecto de ejemplo implementa la gestión de **Migraciones** utilizando la librería `umzug`.

## Implementación de Umzug

La implementación de `umzug` se encuentra en el archivo `src/db/scripts/dbMigrate.ts`

```ts
import "dotenv/config"; // configurar acceso a las variables de entorno del archivo .env
import path from "node:path";
import fs from "node:fs";
import { query } from "..";
import { JSONStorage, Umzug } from "umzug";

const migrator = new Umzug({
  migrations: { glob: path.join(__dirname, "..", "migrations", "*.ts") }, // directorio de migraciones
  context: { query },  // objeto que estará disponible en funciones 'up' y 'down' en archivos de migración
  storage: new JSONStorage({
    path: path.join(__dirname, "..", "migrations", "migrations.json"), // ubicación del archivo de historial de migraciones
  }),
  logger: console,
  create: { // configuración de la acción 'create' (crear archivos de migración)
    folder: path.join(__dirname, "..", "migrations"), // directorio de destino
    template: (filepath) => [ // plantilla base custom
      [
        filepath,
        fs
          .readFileSync(
            path.join(__dirname, "..", "template/migration-template.ts")
          )
          .toString(),
      ],
    ],
  },
});

export type Migration = typeof migrator._types.migration; // tipo de la función de migración ('up' p 'down')

migrator.runAsCLI(); // iniciar CLI
```

## Archivos de migración

Los archivos de migración ubicados en le directorio `src/db/migrations` tienen el formato `[año].[mes].[dia]T[hora].[minuto].[segundo].[nombre-de-migración].ts`. La plantilla base es la siguiente:

```ts
import { Migration } from "../scripts/dbMigrate";

export const up: Migration = async (params) => {
  params.context.query(`RAISE EXCEPTION 'up migration not implemented'`);
};
export const down: Migration = async (params) => {
  params.context.query(`RAISE EXCEPTION 'down migration not implemented'`);
};
```

Es posible destructurar el objeto `params` y re-nombrar la propiedad `context` para que sea más legible:

```ts
import { Migration } from "../scripts/dbMigrate";

export const up: Migration = async ({ context: db }) => {
  db.query(`RAISE EXCEPTION 'up migration not implemented'`);
};
export const down: Migration = async ({ context: db }) => {
  db.query(`RAISE EXCEPTION 'down migration not implemented'`);
};
```

## Seguimiento a migraciones ejecutadas

Cuando se ejecuta una o más migraciones, `umzug` modifica el archivo `src/db/migrations/migrations.json` indicando todas las migraciones que han sido ejecutadas:

```json
[
  "2024.01.15T16.51.08.create-usets.ts",
  // otras migraciones
]
```

## Umzug CLI

Para ejecutar el programa "migrador" de `umzug` se ha agregado el siguiente script al `package.json`:

```json
"scripts": {
  // ...
  "db:migrate": "ts-node src/db/scripts/dbMigrate.ts",
  // ...
},
```

El CLI de `umzug` tiene 5 comandos:

- `up`: Aplica migraciones pendientes (función `up` del archivo de migración)
- `down`: Revierte migraciones (función `down` del archivo de migración)
- `pending`: Lista migraciones pendientes
- `executed`: Lista migraciones ejecutadas
- `create`: Crea una archivo de migración (usando la plantilla indicada en la configuración)

Si necesitas pasar 'opciones' a un comando ejecutado con `npm run` deberás agregar un doble guion (`--`) antes de listar las opciones deseadas. Por ejemplo, el comando `create` require que la opción `--name` esté presente:

```bash
npm run db:migrate create -- --name [filename.ts]
```

Mayor detalle de cómo utilizar el CLI de `umzug` se encuentra en su Github: https://github.com/sequelize/umzug?tab=readme-ov-file#cli-usage

## Scripts adicionales

Así como se creó `dbMigrate.ts` para gestionar migraciones sobre una base de datos existente, no es mala idea crear otros scripts que nos permitan gestionar la creación, eliminación y reseteo de la base de datos de la aplicación.

Estas acciones necesitan de un cliente con permisos de administración que esté conectado a una base de datos diferente a la base de datos de la aplicación (no puedes borrar una base de datos a la cual estás conectado actualmente). Para ello, creamos un cliente sencillo que se conecte a la base de datos con el nombre de usuario (también puede ser `postgres`):

```ts title=db/index.ts {15-21}
import { Client, Pool } from "pg";

export const pool = new Pool({
  host: process.env["PGHOST"],
  port: Number(process.env["PGPORT"]),
  database: process.env["PGDATABASE"],
  user: process.env["PGUSER"],
  password: process.env["PGPASSWORD"],
});

export const query = (text: string, params?: (string | number | boolean)[]) => {
  return pool.query(text, params);
};

export const adminClient = new Client({
  host: process.env["PGHOST"],
  port: Number(process.env["PGPORT"]),
  database: process.env["PGUSER"], // podría ser "postgres" también
  user: process.env["PGUSER"],
  password: process.env["PGPASSWORD"],
});
```

Este `adminClient` lo usaremos para crear y borrar la base de datos del proyecto.

### Crear la base de datos

El script `src/db/scripts/dbCreate.ts` creamos la base de datos usando el `adminClient`

```ts
import "dotenv/config";
import { adminClient } from "..";

const dbName = process.env["PGDATABASE"];

adminClient.connect();

adminClient.query(`CREATE DATABASE "${dbName}"`, (err) => {
  if (err) {
    console.error("Error al crear la base de datos", err.stack);
  } else {
    console.log(`Base de datos "${dbName}" creada exitosamente`);
  }
  adminClient.end();
});
```

### Eliminar la base de datos

El script `src/db/scripts/dbDrop.ts` elimina la base de datos usando el `adminClient`

```ts
import "dotenv/config";
import { adminClient } from "..";

const dbName = process.env["PGDATABASE"];

adminClient.connect();

adminClient.query(`DROP DATABASE IF EXISTS "${dbName}"`, (err) => {
  if (err) {
    console.error("Error al eliminar la base de datos", err.stack);
  } else {
    console.log(`Base de datos "${dbName}" eliminada exitosamente`);
  }
  adminClient.end();
});
```

### Scripts adicionales en `package.json`

Agregamos 3 scripts adicionales:

```json {4-6}
"scripts": {
  // ...
  "db:migrate": "ts-node src/db/scripts/dbMigrate.ts",
  "db:create": "ts-node src/db/scripts/dbCreate.ts",
  "db:drop": "ts-node src/db/scripts/dbDrop.ts && rm -f src/db/migrations/migrations.json",
  "db:reset": "npm run db:drop && npm run db:create && npm run db:migrate up"
},
```

- `db:create`: Ejecuta el archivo `dbMigrate.ts`
- `db:drop`: Ejecuta el archivo `dbDrop.ts` y luego borrar el archivo json de migraciones (`migrations.json`). Lo hacemos para que, al volver a crear la base de datos, podemos volver a correr todas las migraciones desde cero.
- `db:reset`: Ejecuta los scripts `db:drop` y `db:create` y luego corre todas las migraciones ejecutando `db:migrate up`.