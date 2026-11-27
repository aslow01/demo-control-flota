// `test` de las pruebas de punta a punta: igual al de Playwright, más una guarda que hace que ninguna prueba dependa de la red de afuera.
// La demo no pide nada a otros sitios (la CSP lo prohíbe): todo se sirve desde `dist/`. Si algún día algo intenta salir, la prueba lo corta y falla diciendo adónde,
// en lugar de pasar o fallar según haya internet.
import { expect, test as base } from "@playwright/test";

export const test = base.extend<{ sinRedExterna: void }>({
  sinRedExterna: [
    async ({ context, baseURL }, usar) => {
      const origen = new URL(baseURL ?? "http://127.0.0.1").origin;
      const intentos: string[] = [];
      await context.route(
        (url) => /^https?:$/.test(url.protocol) && url.origin !== origen,
        async (ruta) => {
          intentos.push(ruta.request().url());
          await ruta.abort("blockedbyclient");
        },
      );
      await usar();
      expect(intentos, "pedidos a la red de afuera (la demo no tiene que pedir nada fuera de su propio sitio)").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
