// Cómo se bajan los trozos: el generador de datos solo cuando hace falta, el estado de carga de una pantalla que tarda y el error de una que no baja.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { TEXTO_ERROR_DESCARGA } from "../src/lib/dominio/textos-base.ts";
import { esperarPantalla } from "./ayuda.ts";

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
