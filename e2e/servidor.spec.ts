// El servidor de las pruebas (`scripts/servir-dist.mjs`): manda la CSP real y no esconde un archivo que falta detrás del `index.html`.
import { expect, test } from "./base.ts";

test("un archivo con extensión que no existe da 404 (no el index con 200) y una ruta de la aplicación recibe el index", async ({ request }) => {
  const falta = await request.get("/assets/no-existe-AbC123.js");
  expect(falta.status()).toBe(404);
  expect(await falta.text()).not.toContain("<!doctype html>");

  const imagenQueFalta = await request.get("/no-existe.png");
  expect(imagenQueFalta.status()).toBe(404);

  const ruta = await request.get("/alguna/ruta");
  expect(ruta.status()).toBe(200);
  expect(ruta.headers()["content-type"]).toContain("text/html");
});

test("todas las respuestas llevan la CSP de public/_headers, también el 404", async ({ request }) => {
  for (const direccion of ["/", "/assets/no-existe-AbC123.js"]) {
    const r = await request.get(direccion);
    expect(r.headers()["content-security-policy"], `CSP en ${direccion}`).toContain("default-src 'none'");
    expect(r.headers()["x-content-type-options"], `nosniff en ${direccion}`).toBe("nosniff");
  }
});

test("una dirección mal codificada da 400 y el servidor sigue contestando", async ({ request }) => {
  const mala = await request.get("/%E0%A4%A");
  expect(mala.status()).toBe(400);
  expect((await request.get("/")).status()).toBe(200);
});
