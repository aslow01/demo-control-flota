// «Apariencia» (docs/diseno-ui.md, 15.4.5): el tema y «Sin animaciones» viven en «Más», persisten al recargar y se aplican en <html> antes de montar la aplicación.
// Con «Sin animaciones» y el movimiento permitido por el sistema, navegar no deja ninguna animación corriendo.
import { esperarPantalla, vigilar } from "./ayuda.ts";
import { expect, test } from "./base.ts";
import { PATENTE, PATENTE_EN_PANTALLA } from "./ejemplo.ts";

test.use({ reducedMotion: "no-preference", viewport: { width: 1280, height: 900 } });

test("el tema y «Sin animaciones» persisten al recargar y se aplican en <html>", async ({ page }) => {
  const v = await vigilar(page);
  await page.goto("/#/mas");
  await esperarPantalla(page, "Más");
  const apariencia = page.getByRole("region", { name: "Apariencia" });
  await expect(apariencia.getByRole("radio", { name: "Automático" }), "«Automático» es el de por defecto").toBeChecked();
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-modo", /.*/);
  const sinAnimaciones = apariencia.getByRole("button", { name: "Sin animaciones" });
  await expect(sinAnimaciones).toHaveAttribute("aria-pressed", "false");

  await apariencia.getByRole("radio", { name: "Oscuro" }).check();
  await sinAnimaciones.click();
  await expect(html).toHaveAttribute("data-modo", "oscuro");
  await expect(html).toHaveAttribute("data-movimiento", "quieto");
  await expect(sinAnimaciones).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('meta[name="theme-color"]').first(), "theme-color sigue al tema elegido").toHaveAttribute("content", "#0A2550");

  await page.reload();
  await esperarPantalla(page, "Más");
  await expect(html).toHaveAttribute("data-modo", "oscuro");
  await expect(html).toHaveAttribute("data-movimiento", "quieto");
  await expect(apariencia.getByRole("radio", { name: "Oscuro" })).toBeChecked();
  await expect(apariencia.getByRole("button", { name: "Sin animaciones" })).toHaveAttribute("aria-pressed", "true");

  // Se deshacen: «Automático» y animaciones otra vez.
  await apariencia.getByRole("radio", { name: "Automático" }).check();
  await apariencia.getByRole("button", { name: "Sin animaciones" }).click();
  await expect(html).not.toHaveAttribute("data-modo", /.*/);
  await expect(html).not.toHaveAttribute("data-movimiento", /.*/);
  await page.reload();
  await esperarPantalla(page, "Más");
  await expect(apariencia.getByRole("radio", { name: "Automático" })).toBeChecked();
  expect(v.problemas, "consola, pedidos y errores").toEqual([]);
});

test("un valor guardado que no es de la demo (alguien escribió en localStorage) se sanea: automático y con animaciones", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("flota:tema", "<img src=x onerror=alert(1)>");
    localStorage.setItem("flota:sin-animaciones", "quizás");
  });
  await page.goto("/#/mas");
  await esperarPantalla(page, "Más");
  await expect(page.locator("html")).not.toHaveAttribute("data-modo", /.*/);
  await expect(page.locator("html")).not.toHaveAttribute("data-movimiento", /.*/);
  await expect(page.getByRole("region", { name: "Apariencia" }).getByRole("radio", { name: "Automático" })).toBeChecked();
});

test("con «Sin animaciones» y el movimiento permitido en el sistema, navegar a una ficha deja `document.getAnimations()` vacío", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("flota:sin-animaciones", "1"));
  await page.goto("/#/movilidades");
  await esperarPantalla(page, "Movilidades");
  await expect(page.locator("html")).toHaveAttribute("data-movimiento", "quieto");
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), "el sistema permite el movimiento: lo único que lo apaga es la preferencia").toBe(false);

  await page.locator(`a[href$="#/unidad/${PATENTE}"]`).first().click();
  await esperarPantalla(page, PATENTE_EN_PANTALLA);
  expect(await page.evaluate(() => document.getAnimations().length), "ninguna animación corriendo ni pendiente").toBe(0);

  await page.goto("/#/inicio");
  await expect(page.locator("main .pantalla")).toHaveAttribute("data-entrada", "quieta");
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

// El módulo de la aplicación se baja y se ejecuta después de unos 96 kB de JS: sin `public/arranque.js` el primer cuadro saldría con el tema del sistema y después saltaría.
// Acá el módulo no llega nunca (se aborta su pedido): lo que se ve en <html> y en el fondo lo puso solo el script clásico.
test("el tema guardado ya está puesto antes de que corra el módulo de la aplicación (sin un primer cuadro con el tema del sistema)", async ({ browser, baseURL }) => {
  const fondoCon = async (tema: string | null, quieto: boolean): Promise<{ modo: string | null; movimiento: string | null; fondo: string; montada: boolean }> => {
    const contexto = await browser.newContext({ baseURL, colorScheme: "light", viewport: { width: 1280, height: 900 } });
    const pagina = await contexto.newPage();
    await pagina.addInitScript(
      ({ t, q }) => {
        if (t !== null) localStorage.setItem("flota:tema", t);
        if (q) localStorage.setItem("flota:sin-animaciones", "1");
      },
      { t: tema, q: quieto },
    );
    await pagina.route(/\/assets\/[^/]+\.js$/, (ruta) => ruta.abort());
    await pagina.goto("/#/inicio", { waitUntil: "domcontentloaded" });
    const r = await pagina.evaluate(() => ({
      modo: document.documentElement.getAttribute("data-modo"),
      movimiento: document.documentElement.getAttribute("data-movimiento"),
      fondo: getComputedStyle(document.body).backgroundColor,
      montada: (document.getElementById("app")?.childElementCount ?? 0) > 0,
    }));
    await contexto.close();
    return r;
  };
  const oscuro = await fondoCon("oscuro", true);
  expect(oscuro.montada, "el módulo no corrió: la aplicación no está montada").toBe(false);
  expect(oscuro.modo).toBe("oscuro");
  expect(oscuro.movimiento).toBe("quieto");
  const claro = await fondoCon("claro", false);
  expect(claro.modo).toBe("claro");
  expect(claro.movimiento).toBeNull();
  const automatico = await fondoCon(null, false);
  expect(automatico.modo).toBeNull();
  expect(oscuro.fondo, "con el sistema en claro, el oscuro guardado ya se ve oscuro").not.toBe(claro.fondo);
  expect(claro.fondo, "con el sistema en claro, el claro guardado y el automático se ven igual").toBe(automatico.fondo);
});