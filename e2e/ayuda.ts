// Ayudas de las pruebas de punta a punta: vigilar la consola y la CSP, medir el desborde y pasar axe.
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

declare global {
  interface Window {
    /** Lo que el navegador avisó con `securitypolicyviolation` (la CSP bloqueó algo). */
    __violacionesCsp?: string[];
  }
}

export interface Vigilancia {
  /** Todo lo que no tendría que haber pasado, con el nombre de lo que fue. Vacío si la pantalla cargó limpia. */
  problemas: string[];
}

/** Empieza a escuchar antes de cargar nada: errores y avisos de la consola, errores de la página, pedidos que fallan o dan error y violaciones de la CSP. */
export async function vigilar(page: Page): Promise<Vigilancia> {
  const problemas: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problemas.push(`consola (${m.type()}): ${m.text()}`);
  });
  page.on("pageerror", (e) => problemas.push(`error de la página: ${e.message}`));
  page.on("requestfailed", (r) => problemas.push(`pedido fallido: ${r.url()} (${r.failure()?.errorText ?? "sin detalle"})`));
  page.on("response", (r) => {
    if (r.status() >= 400) problemas.push(`respuesta ${r.status()}: ${r.url()}`);
  });
  await page.addInitScript(() => {
    window.__violacionesCsp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__violacionesCsp?.push(`${e.violatedDirective}: ${e.blockedURI || "(en línea)"}`);
    });
  });
  return { problemas };
}

/** Las violaciones de la CSP que el navegador avisó hasta ahora. */
export async function violacionesDeCsp(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__violacionesCsp ?? []);
}

/** `true` si la página es más ancha que la ventana (aparecería una barra de desplazamiento horizontal). */
export async function desbordaEnHorizontal(page: Page): Promise<{ desborda: boolean; ancho: number; ventana: number }> {
  return page.evaluate(() => {
    const ancho = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    return { desborda: ancho > window.innerWidth, ancho, ventana: window.innerWidth };
  });
}

/** Pasa axe con las etiquetas de WCAG 2.2 AA (más las de mejores prácticas) y devuelve un resumen legible de lo que encontró. */
export async function violacionesDeAxe(page: Page): Promise<string[]> {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  return r.violations.map((v) => `${v.id} (${v.impact ?? "sin impacto"}): ${v.help}. Elementos: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

/** Espera a que la pantalla esté dibujada: hay un `h1` visible, ya no hay «Cargando la pantalla…» y las fuentes llegaron. */
export async function esperarPantalla(page: Page, titulo: string | RegExp): Promise<void> {
  await expect(page.locator("main h1")).toHaveText(titulo);
  await expect(page.getByText("Cargando la pantalla…")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

/** Lo que cada prueba de ruta comprueba, en el orden en que se lo explica la persona que la lee. */
export async function comprobarLimpia(page: Page, vigilancia: Vigilancia, titulo: string | RegExp): Promise<void> {
  await esperarPantalla(page, titulo);
  expect(vigilancia.problemas, "consola, pedidos y errores").toEqual([]);
  expect(await violacionesDeCsp(page), "violaciones de la CSP").toEqual([]);
  expect(await violacionesDeAxe(page), "axe a 1280 px").toEqual([]);
  await page.setViewportSize({ width: 360, height: 740 });
  await esperarPantalla(page, titulo);
  const d = await desbordaEnHorizontal(page);
  expect(d.desborda, `desborde horizontal a 360 px (la página mide ${d.ancho} px)`).toBe(false);
  expect(await violacionesDeAxe(page), "axe a 360 px").toEqual([]);
  expect(vigilancia.problemas, "consola, pedidos y errores (después de achicar)").toEqual([]);
  expect(await violacionesDeCsp(page), "violaciones de la CSP (después de achicar)").toEqual([]);
}

/** Cambia el perfil a «Conductor» (el primero de la lista, con una unidad apta) como lo haría la persona: «Ver como», elegir y «Aplicar». Termina en Hoy. */
export async function verComoConductor(page: Page): Promise<void> {
  await page.getByRole("button", { name: /^Ver como: Encargado/ }).click();
  const dialogo = page.getByRole("dialog", { name: "Ver como" });
  await dialogo.getByRole("radio", { name: /^Conductor/ }).check();
  await dialogo.getByRole("radio", { name: /^Andrés Echegaray/ }).check();
  await dialogo.getByRole("button", { name: "Aplicar" }).click();
  await expect(dialogo).toBeHidden();
  await esperarPantalla(page, "Hoy");
}