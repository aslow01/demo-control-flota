// La entrada de Inicio con el movimiento activado (docs/diseno-ui.md, 15.10): sin violaciones de la CSP (la coreografía va por CSSOM y CSS, nunca por `style` en línea), estado final a los 1,5 s
// y salto de diseño menor que 0,05, en la primera visita y al volver a Inicio.
// Pasan ya: la CSP y el estado de la entrada (`data-entrada`). Dependen del acabado visual (puerta de T10, T11 y T13): el salto de diseño, porque sin la hoja de estilos de la regla y del cuadro cero
// del arranque el contenido se acomoda cuando llega.
import { esperarRegla, saltoDeDiseno, violacionesDeCsp, vigilar, vigilarSaltos } from "./ayuda.ts";
import { expect, test } from "./base.ts";

test.use({ reducedMotion: "no-preference", viewport: { width: 1280, height: 900 } });

/** El máximo de salto de diseño que se acepta en una entrada (el umbral de «bueno» de las métricas web es 0,1; el diseño pide la mitad). */
const SALTO_MAXIMO = 0.05;

test("primera visita: sin violaciones de la CSP, la entrada pasa a «fija» y no hay salto de diseño", async ({ page }) => {
  const v = await vigilar(page);
  await vigilarSaltos(page);
  await page.goto("/#/inicio");
  await esperarRegla(page);

  const pantalla = page.locator("main .pantalla");
  // Con el movimiento permitido la vista nace «completa» (primera vez en la sesión) y queda «fija» a los 1,5 s de soltarse la pausa (que dura 1 s como mucho).
  await expect(pantalla).toHaveAttribute("data-entrada", "fija", { timeout: 5000 });
  await expect(pantalla, "la pausa ya se soltó").not.toHaveAttribute("data-pausa", /.*/);
  expect(await violacionesDeCsp(page), "violaciones de la CSP").toEqual([]);
  expect(v.problemas, "consola, pedidos y errores").toEqual([]);
  expect(await saltoDeDiseno(page), "salto de diseño de la primera visita").toBeLessThan(SALTO_MAXIMO);
});

test("al volver a Inicio la entrada es «breve» (no corre la coreografía otra vez) y tampoco hay salto de diseño", async ({ page }) => {
  const v = await vigilar(page);
  await vigilarSaltos(page);
  await page.goto("/#/inicio");
  await esperarRegla(page);
  await expect(page.locator("main .pantalla")).toHaveAttribute("data-entrada", "fija", { timeout: 5000 });

  await page.goto("/#/vencimientos");
  await expect(page.locator("main h1")).toHaveText("Vencimientos");
  const antes = await saltoDeDiseno(page);
  await page.goto("/#/inicio");
  await esperarRegla(page);
  await expect(page.locator("main .pantalla"), "una vista que ya se vio no repite la coreografía").toHaveAttribute("data-entrada", "breve");
  // A los 1,5 s sigue «breve»: no pasa a «fija» (solo la entrada completa lo hace). La espera es a propósito y no hay un estado al que esperar: lo que se prueba es que NO pasa nada.
  await page.waitForTimeout(1600);
  await expect(page.locator("main .pantalla")).toHaveAttribute("data-entrada", "breve");
  expect(await violacionesDeCsp(page), "violaciones de la CSP").toEqual([]);
  expect(v.problemas, "consola, pedidos y errores").toEqual([]);
  expect((await saltoDeDiseno(page)) - antes, "salto de diseño al volver").toBeLessThan(SALTO_MAXIMO);
});

test.describe("movimiento reducido del sistema", () => {
  test.use({ reducedMotion: "reduce" });

  test("la entrada nace «quieta»: todo completo y sin pausa desde el primer cuadro", async ({ page }) => {
    await page.goto("/#/inicio");
    await esperarRegla(page);
    await expect(page.locator("main .pantalla")).toHaveAttribute("data-entrada", "quieta");
    await expect(page.locator("main .pantalla")).not.toHaveAttribute("data-pausa", /.*/);
  });
});
