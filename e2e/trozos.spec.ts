// Cómo se bajan los trozos: el generador de datos solo cuando hace falta, el estado de carga de una pantalla que tarda y el error de una que no baja.
import AxeBuilder from "@axe-core/playwright";
import type { Route } from "@playwright/test";
import { PLAZO_DE_DESCARGA_MS } from "../src/lib/descarga.ts";
import { TEXTO_AVISO, TEXTO_ERROR_ARRANQUE, TEXTO_ERROR_DESCARGA } from "../src/lib/dominio/textos-base.ts";
import { esperarPantalla } from "./ayuda.ts";
import { expect, test } from "./base.ts";

test("el generador de datos se baja en la primera visita y no cuando ya hay datos guardados", async ({ page }) => {
  const pedidos: string[] = [];
  page.on("request", (r) => {
    if (/\/assets\/generador-[^/]*\.js$/.test(r.url())) pedidos.push(r.url());
  });
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  expect(pedidos, "primera visita: no hay datos y hay que generarlos").toHaveLength(1);

  pedidos.length = 0;
  await page.reload();
  await esperarPantalla(page, "Inicio");
  expect(pedidos, "con los datos de hoy guardados no hace falta").toEqual([]);
});

test("una pantalla que tarda en bajar muestra «Cargando la pantalla…» con una barra de progreso, y después la pantalla", async ({ page }) => {
  await page.route(/\/assets\/PantallaMas-[^/]*\.js$/, async (ruta) => {
    await new Promise((resolver) => setTimeout(resolver, 1500));
    await ruta.continue();
  });
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.getByRole("link", { name: "Más" }).first().click();
  const cargando = page.getByRole("status").filter({ hasText: "Cargando la pantalla…" });
  await expect(cargando).toBeVisible();
  await expect(cargando.getByRole("progressbar")).toBeVisible();
  // `page-has-heading-one` se deja afuera solo acá: mientras el trozo baja la pantalla todavía no tiene título; el `h1` llega con ella y el foco pasa a él.
  const mientrasCarga = await new AxeBuilder({ page }).disableRules(["page-has-heading-one"]).analyze();
  expect(mientrasCarga.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`), "axe mientras carga").toEqual([]);
  await esperarPantalla(page, "Más");
});

test("una pantalla que no baja dice qué pasó, lleva el foco al título y ofrece recargar; el marco sigue andando", async ({ page }) => {
  await page.route(/\/assets\/PantallaVencimientos-[^/]*\.js$/, (ruta) => ruta.abort("failed"));
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.getByRole("link", { name: "Vencimientos" }).first().click();

  const titulo = page.locator("main h1");
  await expect(titulo).toHaveText(TEXTO_ERROR_DESCARGA.titulo);
  await expect(titulo).toBeFocused();
  await expect(page.getByText(TEXTO_ERROR_DESCARGA.mensaje)).toBeVisible();
  await expect(page.getByRole("button", { name: "Recargar la página" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id), "axe en el error de carga").toEqual([]);

  // El marco no se cayó: se puede ir a otra pantalla.
  await page.getByRole("link", { name: "Movilidades" }).first().click();
  await esperarPantalla(page, "Movilidades");
});

// Un despliegue nuevo borra los trozos viejos: pedirlos da 404, o (Cloudflare Pages sin 404.html) llega el `index.html` con 200 en lugar del trozo.
// El navegador no distingue ese fallo del de la red, pero sí anota que el servidor contestó: el mensaje dice que hay una versión nueva y que hay que recargar.
for (const [caso, respuesta] of [
  ["da 404", { status: 404, contentType: "text/plain", body: "No encontrado" }],
  ["llega el index en su lugar", { status: 200, contentType: "text/html; charset=utf-8", body: "<!doctype html><title>Demo</title>" }],
] as const) {
  test(`una pantalla cuyo trozo ya no existe (${caso}) dice que hay una versión nueva y ofrece recargar`, async ({ page }) => {
    await page.route(/\/assets\/PantallaVencimientos-[^/]*\.js$/, (ruta) => ruta.fulfill(respuesta));
    await page.goto("/#/inicio");
    await esperarPantalla(page, "Inicio");
    await page.getByRole("link", { name: "Vencimientos" }).first().click();

    await expect(page.locator("main h1")).toHaveText(TEXTO_ERROR_DESCARGA.titulo);
    await expect(page.getByText(TEXTO_ERROR_DESCARGA.versionNueva)).toBeVisible();
    await expect(page.getByText(TEXTO_ERROR_DESCARGA.mensaje)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Recargar la página" })).toBeVisible();
  });
}

test("si el generador de datos no baja en la primera visita, la demo lo dice y ofrece recargar (no queda «Preparando…» ni cae a «sin almacenamiento»)", async ({ page }) => {
  await page.route(/\/assets\/generador-[^/]*\.js$/, (ruta) => ruta.abort("failed"));
  await page.goto("/#/inicio");

  await expect(page.locator("main h1")).toHaveText(TEXTO_ERROR_ARRANQUE.titulo);
  await expect(page.getByText(TEXTO_ERROR_DESCARGA.mensaje)).toBeVisible();
  await expect(page.getByRole("button", { name: "Recargar la página" })).toBeVisible();
  await expect(page.getByText("Preparando la flota de ejemplo…")).toHaveCount(0);
  await expect(page.getByText(TEXTO_AVISO.sinAlmacenamiento)).toHaveCount(0);
});

test("si el generador de datos se cuelga (el pedido nunca responde), a los 15 s la demo lo dice y ofrece recargar; no queda «Preparando…» para siempre", async ({ page }) => {
  // El pedido queda abierto sin contestar nunca: es lo que pasa con una conexión que se corta a medio camino.
  await page.route(/\/assets\/generador-[^/]*\.js$/, () => new Promise<void>(() => {}));
  await page.goto("/#/inicio");
  await expect(page.getByText("Preparando la flota de ejemplo…")).toBeVisible();

  await expect(page.locator("main h1")).toHaveText(TEXTO_ERROR_ARRANQUE.titulo, { timeout: PLAZO_DE_DESCARGA_MS + 10_000 });
  await expect(page.getByText(TEXTO_ERROR_DESCARGA.mensaje)).toBeVisible();
  await expect(page.getByRole("button", { name: "Recargar la página" })).toBeVisible();
  await expect(page.getByText("Preparando la flota de ejemplo…")).toHaveCount(0);
  await expect(page.getByText(TEXTO_AVISO.sinAlmacenamiento)).toHaveCount(0);
});

test("un generador de datos que llega tarde (más que el plazo del almacenamiento, 8 s) pero antes del plazo de descarga igual arranca la demo y guarda", async ({ page }) => {
  const pedidos: string[] = [];
  page.on("request", (r) => {
    if (/\/assets\/generador-[^/]*\.js$/.test(r.url())) pedidos.push(r.url());
  });
  await page.route(/\/assets\/generador-[^/]*\.js$/, async (ruta) => {
    await new Promise((resolver) => setTimeout(resolver, 9000));
    await ruta.continue();
  });
  await page.goto("/#/inicio");
  // El generador tarda 9 s y la espera de siempre por el título es de 10 s: se alarga para que no dependa de unos milisegundos.
  await expect(page.locator("main h1")).toHaveText("Inicio", { timeout: 30_000 });
  await esperarPantalla(page, "Inicio");
  await expect(page.getByText(TEXTO_AVISO.sinAlmacenamiento)).toHaveCount(0);

  // Guardó de verdad: al recargar hay datos de hoy y no hace falta volver a pedir el generador.
  await page.unroute(/\/assets\/generador-[^/]*\.js$/);
  pedidos.length = 0;
  await page.reload();
  await esperarPantalla(page, "Inicio");
  expect(pedidos).toEqual([]);
  await expect(page.getByText(TEXTO_AVISO.sinAlmacenamiento)).toHaveCount(0);
});

// El foco va al título cuando llega la pantalla que se estaba bajando, salvo que la persona ya lo haya movido a otro lado mientras esperaba (2.4.3).
const PANTALLA_MAS = /\/assets\/PantallaMas-[^/]*\.js$/;
const tardaEnBajar = (ms: number) => async (ruta: Route) => {
  await new Promise((resolver) => setTimeout(resolver, ms));
  await ruta.continue();
};

test("al llegar una pantalla lenta, el foco va a su título", async ({ page }) => {
  await page.route(PANTALLA_MAS, tardaEnBajar(1200));
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.getByRole("link", { name: "Más" }).first().click();
  await expect(page.getByText("Cargando la pantalla…")).toBeVisible();
  await esperarPantalla(page, "Más");
  await expect(page.locator("main h1")).toBeFocused();
});

test("si la persona movió el foco mientras la pantalla bajaba, al llegar no se lo quitan", async ({ page }) => {
  await page.route(PANTALLA_MAS, tardaEnBajar(2500));
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.getByRole("link", { name: "Más" }).first().click();
  await expect(page.getByText("Cargando la pantalla…")).toBeVisible();
  const otroControl = page.getByRole("button", { name: "Cómo funciona" }).first();
  await otroControl.focus();
  await esperarPantalla(page, "Más");
  await expect(otroControl).toBeFocused();
});