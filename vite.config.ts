import { defineConfig } from "vitest/config";

// T2: `npm test` corre por defecto con una zona horaria que NO es la de Argentina, así quien trabaja en Argentina
// también se entera si el dominio usa la hora local por error. `TZ=... npm test` (y `npm run test:tz`) la pisan.
// Tiene que fijarse acá, antes de que se carguen los módulos y de que se creen los procesos de prueba.
// Sin @types/node: se llega a `process` por globalThis.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;
if (entorno !== undefined && (entorno["TZ"] === undefined || entorno["TZ"] === "")) entorno["TZ"] = "Asia/Tokyo";

export default defineConfig({
  build: {
    target: "es2022",
    sourcemap: false,
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
