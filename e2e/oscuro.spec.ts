// El modo oscuro («plano nocturno», docs/diseno-ui.md, 15.3): axe a 1280 y 360 px con un diálogo abierto y con el parte con errores, el color calculado de un objeto de noche (papel claro:
// los objetos no se oscurecen) y `data-modo` contrario al sistema (la preferencia de la persona manda sobre la del dispositivo).
// Pasan ya: el color calculado del objeto y `data-modo`. Dependen del acabado visual (puerta de T10, T11 y T13): axe en oscuro con un diálogo abierto y con el parte con errores.
import type { Page } from "@playwright/test";
import { esperarPantalla, esperarRegla, violacionesDeAxe } from "./ayuda.ts";
import { expect, test } from "./base.ts";
import { hoyEnArgentina, PATENTE } from "./ejemplo.ts";

/** La luminancia relativa (WCAG) de un color que el navegador entrega como `rgb()`, `rgba()` o `color(srgb …)`. */
function luminancia(color: string): number {
  const numeros = (color.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const [r, g, b] = color.startsWith("color(") ? numeros.slice(0, 3).map((x) => x * 255) : numeros.slice(0, 3);
  if (r === undefined || g === undefined || b === undefined) throw new Error(`Color que no se entiende: ${color}`);
  const lineal = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
}

/** El color del texto del cuerpo de la página: es claro de noche y oscuro de día. */
async function colorDelTexto(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).color);
}

test.describe("de noche (el sistema pide oscuro)", () => {
  test.use({ colorScheme: "dark", viewport: { width: 1280, height: 900 } });

  test("axe a 1280 y a 360 px con un diálogo abierto", async ({ page }) => {
    await page.goto("/#/inicio");
    await esperarRegla(page);
    await page.getByRole("button", { name: "Cómo funciona" }).first().click();
    await expect(page.getByRole("dialog", { name: "Cómo funciona" })).toBeVisible();
    expect(await violacionesDeAxe(page), "axe a 1280 px").toEqual([]);
    await page.setViewportSize({ width: 360, height: 740 });
    await expect(page.getByRole("dialog", { name: "Cómo funciona" })).toBeVisible();
    expect(await violacionesDeAxe(page), "axe a 360 px").toEqual([]);
  });

  test("axe a 1280 y a 360 px con el parte con errores", async ({ page }) => {
    await page.goto(`/#/parte/${PATENTE}/${hoyEnArgentina()}`);
    await esperarPantalla(page, "Revisión antes de salir");
    await page.getByRole("button", { name: "Enviar revisión" }).click();
    await expect(page.locator("[data-resumen-parte]"), "el resumen de errores").toBeVisible();
    expect(await violacionesDeAxe(page), "axe a 1280 px").toEqual([]);
    await page.setViewportSize({ width: 360, height: 740 });
    await expect(page.locator("[data-resumen-parte]")).toBeVisible();
    expect(await violacionesDeAxe(page), "axe a 360 px").toEqual([]);
  });

  test("un objeto (la llave) sigue siendo papel claro con tinta oscura: no se oscurece de noche", async ({ page }) => {
    await page.goto("/#/inicio");
    await esperarRegla(page);
    expect(luminancia(await colorDelTexto(page)), "el texto de la página es claro de noche").toBeGreaterThan(0.5);
    const tintaDelObjeto = await page.locator(".llave-cuerpo.objeto").first().evaluate((e) => getComputedStyle(e).color);
    expect(luminancia(tintaDelObjeto), "la tinta del objeto es oscura (el papel es claro)").toBeLessThan(0.3);
  });
});

test("`data-modo` contrario al sistema: la preferencia de la persona manda sobre la del dispositivo", async ({ page }) => {
  // Sistema claro, tema automático: texto oscuro.
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/#/inicio");
  await esperarRegla(page);
  const claroPorElSistema = luminancia(await colorDelTexto(page));
  expect(claroPorElSistema, "de día el texto es oscuro").toBeLessThan(0.3);

  // Sistema claro, tema oscuro elegido: texto claro y `data-modo="oscuro"`.
  await page.evaluate(() => localStorage.setItem("flota:tema", "oscuro"));
  await page.reload();
  await esperarRegla(page);
  await expect(page.locator("html")).toHaveAttribute("data-modo", "oscuro");
  expect(luminancia(await colorDelTexto(page)), "con el tema oscuro elegido el texto es claro aunque el sistema pida claro").toBeGreaterThan(0.5);

  // Sistema oscuro, tema claro elegido: vuelve el texto oscuro.
  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => localStorage.setItem("flota:tema", "claro"));
  await page.reload();
  await esperarRegla(page);
  await expect(page.locator("html")).toHaveAttribute("data-modo", "claro");
  expect(luminancia(await colorDelTexto(page)), "con el tema claro elegido el texto es oscuro aunque el sistema pida oscuro").toBeLessThan(0.3);
});
