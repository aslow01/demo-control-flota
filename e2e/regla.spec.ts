// La regla de salida de Inicio (docs/diseno-ui.md, 15.6 y 15.7): el teclado (una sola parada de Tab; flechas, Inicio y Fin), el árbol de accesibilidad con el valor final desde el primer
// cuadro, la «Acción del día» dentro de la primera pantalla del celular y la cantidad de llaves, que sigue a los datos.
// Con movimiento activado (el sistema lo permite): así se prueba la entrada de verdad, no el estado quieto.
// Las pruebas de comportamiento no dependen del acabado visual. La de la primera pantalla (390 × 844 y 360 × 800) SÍ: es una puerta de la maquetación (T11): falla si la regla deja de entrar.
import type { Locator } from "@playwright/test";
import { entraEnLaPrimeraPantalla, esperarPantalla, esperarRegla, leerLaRegla } from "./ayuda.ts";
import { expect, test } from "./base.ts";

test.use({ reducedMotion: "no-preference" });

/** La posición, entre las llaves, de la que tiene el foco (−1 si ninguna). */
async function indiceEnfocado(llaves: Locator): Promise<number> {
  return llaves.evaluateAll((l) => l.findIndex((e) => e === document.activeElement));
}

test.describe("teclado del tablero de llaves (1280 px)", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("un Tab entra, las flechas, Inicio y Fin recorren y otro Tab sale; en todo momento una sola llave es parada de Tab", async ({ page }) => {
    await page.goto("/#/inicio");
    await esperarRegla(page);
    const llaves = page.locator("ul.llaves a.llave");
    const cantidad = await llaves.count();
    expect(cantidad, "hay una llave por unidad activa").toBe((await leerLaRegla(page)).activas);
    const paradas = (): Promise<number> => page.locator('ul.llaves a.llave[tabindex="0"]').count();
    expect(await paradas(), "una sola parada de Tab desde el primer cuadro").toBe(1);

    // Entra desde el sello (lo que va antes en el orden de Tab): la primera vez, en la primera que no sale.
    const primeraQueNoSale = await llaves.evaluateAll((l) => l.findIndex((e) => e.getAttribute("data-sale") === "no"));
    expect(primeraQueNoSale, "el ejemplo tiene unidades que no salen").toBeGreaterThan(0);
    await page.locator("a.sello-roja").focus();
    await page.keyboard.press("Tab");
    expect(await indiceEnfocado(llaves), "la primera vez entra en la primera que no sale").toBe(primeraQueNoSale);

    await page.keyboard.press("ArrowRight");
    expect(await indiceEnfocado(llaves), "la flecha derecha pasa a la siguiente").toBe(primeraQueNoSale + 1);
    expect(await paradas(), "la parada de Tab se mueve con el foco").toBe(1);
    await expect(llaves.nth(primeraQueNoSale + 1)).toHaveAttribute("tabindex", "0");

    await page.keyboard.press("ArrowLeft");
    expect(await indiceEnfocado(llaves)).toBe(primeraQueNoSale);
    await page.keyboard.press("Home");
    expect(await indiceEnfocado(llaves), "Inicio va a la primera").toBe(0);
    await page.keyboard.press("ArrowLeft");
    expect(await indiceEnfocado(llaves), "sin vuelta en el extremo").toBe(0);
    await page.keyboard.press("End");
    expect(await indiceEnfocado(llaves), "Fin va a la última").toBe(cantidad - 1);
    await page.keyboard.press("ArrowRight");
    expect(await indiceEnfocado(llaves), "sin vuelta en el otro extremo").toBe(cantidad - 1);
    expect(await paradas()).toBe(1);

    // Otro Tab sale del tablero; con Shift+Tab se vuelve a la última que se enfocó.
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.closest("ul.llaves") ?? null), "el foco salió del tablero").toBeNull();
    await page.keyboard.press("Shift+Tab");
    expect(await indiceEnfocado(llaves)).toBe(cantidad - 1);
  });

  test("con el foco de teclado el rótulo de cota suma la ayuda de las flechas; Escape lo oculta sin mover el foco", async ({ page }) => {
    await page.goto("/#/inicio");
    await esperarRegla(page);
    await page.locator("a.sello-roja").focus();
    await page.keyboard.press("Tab");
    const rotulo = page.locator(".rotulo-cota");
    await expect(rotulo).toHaveCount(1);
    await expect(rotulo).toHaveAttribute("data-origen", "teclado");
    await expect(rotulo).toContainText("Use las flechas para recorrer las unidades.");
    await expect(rotulo, "es decorativo: lo mismo está en el nombre accesible de la llave").toHaveAttribute("aria-hidden", "true");
    const enfocada = await page.evaluate(() => document.activeElement?.getAttribute("href"));
    await page.keyboard.press("Escape");
    await expect(rotulo).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.getAttribute("href")), "Escape no mueve el foco").toBe(enfocada);
  });
});

test("el árbol de accesibilidad de la regla dice lo mismo a los 0 ms y a los 1,5 s, con el valor final", async ({ page }) => {
  await page.goto("/#/inicio");
  const regla = page.locator("section.salida");
  await expect(regla).toBeVisible();
  const { texto, disponibles, activas } = await leerLaRegla(page);
  expect(texto).toContain(`Disponibles hoy: ${disponibles} de ${activas} unidades activas.`);
  const alPrincipio = await regla.ariaSnapshot();
  expect(alPrincipio, "el valor final está desde el primer cuadro").toContain(`Disponibles hoy: ${disponibles} de ${activas}`);
  // La entrada pasa a «fija» a los 1,5 s de soltarse la pausa (a lo sumo 1 s después de empezar).
  await expect(page.locator("main .pantalla")).toHaveAttribute("data-entrada", "fija", { timeout: 5000 });
  expect(await regla.ariaSnapshot(), "nada se anunció ni cambió durante la entrada").toBe(alPrincipio);
});

for (const [ancho, alto] of [
  [390, 844],
  [360, 800],
] as const) {
  test(`«Acción del día» entra entera en la primera pantalla a ${ancho} × ${alto} (puerta de la maquetación, T11)`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: alto });
    await page.goto("/#/inicio");
    await esperarRegla(page);
    await expect(page.locator(".accion")).toBeVisible();
    const m = await entraEnLaPrimeraPantalla(page, ".accion");
    expect(m.entra, `la nota termina en ${Math.round(m.abajo)} px y la barra inferior empieza en ${Math.round(m.limite)} px`).toBe(true);
  });
}

test("la cantidad de llaves sigue a los datos: un alta suma una llave y la regla lo dice", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#/inicio");
  await esperarRegla(page);
  const antes = await leerLaRegla(page);
  const llaves = page.locator("ul.llaves a.llave");
  expect(await llaves.count()).toBe(antes.activas);

  await page.goto("/#/movilidades");
  await esperarPantalla(page, "Movilidades");
  await page.getByRole("button", { name: "Agregar unidad" }).click();
  const dialogo = page.getByRole("dialog", { name: "Agregar unidad" });
  await dialogo.getByLabel("Patente").fill("AB123CD");
  await dialogo.getByLabel("Interno").fill("97");
  await dialogo.getByLabel("Tipo").selectOption({ index: 1 });
  await dialogo.getByLabel("Marca").fill("Demo");
  await dialogo.getByLabel("Modelo").fill("Uno");
  await dialogo.getByLabel("Año").fill(String(new Date().getFullYear() - 1));
  await dialogo.getByLabel("Proyecto").selectOption({ index: 1 });
  await dialogo.getByRole("button", { name: "Agregar unidad" }).click();
  await expect(dialogo).toBeHidden();

  await page.goto("/#/inicio");
  await esperarRegla(page);
  const despues = await leerLaRegla(page);
  expect(despues.activas, "el párrafo de la regla cuenta la unidad nueva").toBe(antes.activas + 1);
  await expect(llaves).toHaveCount(antes.activas + 1);
  await expect(page.locator('ul.llaves a.llave[href$="AB123CD"]')).toHaveCount(1);
});
