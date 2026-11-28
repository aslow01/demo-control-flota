// Cómo se bajan los trozos: el generador de datos solo cuando hace falta, el estado de carga de una pantalla que tarda y el error de una que no baja.
import AxeBuilder from "@axe-core/playwright";
import type { Route } from "@playwright/test";
import { PRIMERA_VISITA, jsDeLaCargaInicial } from "../scripts/peso-js.mjs";
import { TEXTO_MARCO } from "../src/componentes/textos-marco.ts";
import { PLAZO_DE_DESCARGA_MS } from "../src/lib/descarga.ts";
import { TEXTO_AVISO, TEXTO_ERROR_ARRANQUE, TEXTO_ERROR_DESCARGA } from "../src/lib/dominio/textos-base.ts";
import { TEXTO_CONDUCTOR_PARA_PROBAR } from "../src/lib/dominio/textos-conductor.ts";
import { esperarPantalla } from "./ayuda.ts";
import { expect, test } from "./base.ts";
import { CONDUCTOR, PATENTE } from "./ejemplo.ts";

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

// Un despliegue que también cambió los estilos borra, además del trozo, la hoja de estilos de la pantalla (cada pantalla que se baja al entrar tiene la suya). La precarga del
// empaquetador pide primero la hoja y, si no llega, falla sin pedir el `import()`: es otro error, y tiene que decir lo mismo. Las respuestas llevan `nosniff`, como todas las de
// producción: con esa cabecera el navegador no deja ver qué contestó el servidor por la hoja (anota estado 0), así que la versión nueva se reconoce por el trozo.
const SIN_ADIVINAR_EL_TIPO = { "X-Content-Type-Options": "nosniff" };
const INDEX_EN_SU_LUGAR = { status: 200, contentType: "text/html; charset=utf-8", headers: SIN_ADIVINAR_EL_TIPO, body: "<!doctype html><title>Demo</title>" };
const NO_ENCONTRADO = { status: 404, contentType: "text/plain; charset=utf-8", headers: SIN_ADIVINAR_EL_TIPO, body: "No encontrado." };
const TROZO_DE_VENCIMIENTOS = /\/assets\/PantallaVencimientos-[^/]*\.js$/;
const HOJA_DE_VENCIMIENTOS = /\/assets\/PantallaVencimientos-[^/]*\.css$/;
for (const [caso, respuesta, demoraDelTrozoMs] of [
  ["llega el index en su lugar", INDEX_EN_SU_LUGAR, 0],
  ["dan 404", NO_ENCONTRADO, 0],
  // La hoja falla antes de que el servidor conteste por el trozo: todavía no hay nada anotado del trozo cuando la precarga se rinde.
  ["llega el index en su lugar, y el del trozo tarda", INDEX_EN_SU_LUGAR, 800],
] as const) {
  test(`una pantalla cuyo trozo y cuya hoja de estilos ya no existen (${caso}) dice que hay una versión nueva y ofrece recargar`, async ({ page }) => {
    let hojasPedidas = 0;
    await page.route(HOJA_DE_VENCIMIENTOS, async (ruta) => {
      hojasPedidas += 1;
      await ruta.fulfill(respuesta);
    });
    await page.route(TROZO_DE_VENCIMIENTOS, async (ruta) => {
      if (demoraDelTrozoMs > 0) await new Promise((resolver) => setTimeout(resolver, demoraDelTrozoMs));
      await ruta.fulfill(respuesta);
    });
    await page.goto("/#/inicio");
    await esperarPantalla(page, "Inicio");
    await page.getByRole("link", { name: "Vencimientos" }).first().click();

    await expect(page.locator("main h1")).toHaveText(TEXTO_ERROR_DESCARGA.titulo);
    await expect(page.getByText(TEXTO_ERROR_DESCARGA.versionNueva)).toBeVisible();
    await expect(page.getByText(TEXTO_ERROR_DESCARGA.mensaje)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Recargar la página" })).toBeVisible();
    expect(hojasPedidas, "la pantalla tiene que haber pedido su hoja de estilos (si no, esta prueba no prueba nada)").toBeGreaterThan(0);
  });
}

// Límite conocido (docs/diseno.md, 17.15): si lo único que cambió es la hoja de estilos, con `nosniff` el navegador no deja saber si el servidor contestó o no. No se adivina la
// causa; lo que sí se asegura es que la pantalla no se dibuja sin sus estilos y que se ofrece recargar, que es la salida en los dos casos.
test("una pantalla cuya hoja de estilos no llega (y su trozo sí) no se dibuja sin estilos: dice que no se pudo descargar y ofrece recargar", async ({ page }) => {
  await page.route(HOJA_DE_VENCIMIENTOS, (ruta) => ruta.fulfill(INDEX_EN_SU_LUGAR));
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.getByRole("link", { name: "Vencimientos" }).first().click();

  const titulo = page.locator("main h1");
  await expect(titulo).toHaveText(TEXTO_ERROR_DESCARGA.titulo);
  await expect(titulo).toBeFocused();
  await expect(page.getByRole("button", { name: "Recargar la página" })).toBeVisible();
});

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

// ---------- Etapa 2 del rediseño: una pantalla que no responde, la red que se cae a medio camino, lo que pide la primera visita y «Ver como» ----------

test("una pantalla cuyo trozo se cuelga (el pedido nunca responde) deja de esperar a los 15 s: dice qué pasó, lleva el foco al título y ofrece recargar; el marco sigue andando", async ({ page }) => {
  await page.route(/\/assets\/PantallaVencimientos-[^/]*\.js$/, () => new Promise<void>(() => {}));
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.getByRole("link", { name: "Vencimientos" }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "Cargando la pantalla…" })).toBeVisible();

  const titulo = page.locator("main h1");
  await expect(titulo).toHaveText(TEXTO_ERROR_DESCARGA.titulo, { timeout: PLAZO_DE_DESCARGA_MS + 10_000 });
  await expect(titulo).toBeFocused();
  await expect(page.getByText(TEXTO_ERROR_DESCARGA.mensaje)).toBeVisible();
  await expect(page.getByText(TEXTO_ERROR_DESCARGA.versionNueva)).toHaveCount(0);
  await expect(page.getByText("Cargando la pantalla…")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Recargar la página" })).toBeVisible();

  // El marco no se cayó: se puede ir a otra pantalla.
  await page.getByRole("link", { name: "Movilidades" }).first().click();
  await esperarPantalla(page, "Movilidades");
});

// «Hay una versión nueva» se dice solo cuando el servidor contestó que el trozo ya no está (404, o el `index.html` en su lugar). Que el servidor haya contestado otra cosa no alcanza.
test("si el trozo de una pantalla llega pero la red se cae al pedir lo que ese trozo necesita, es un problema de conexión: no dice «versión nueva»", async ({ page }) => {
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  // Desde acá la red está caída para todo el JS, salvo el trozo de la ficha, que llega bien.
  const sinRespuesta: string[] = [];
  await page.route(/\/assets\/[^/]*\.js$/, async (ruta) => {
    if (/\/PantallaFicha-[^/]*\.js$/.test(ruta.request().url())) return ruta.continue();
    sinRespuesta.push(ruta.request().url());
    await ruta.abort("failed");
  });
  await page.goto(`/#/unidad/${PATENTE}`);

  await expect(page.locator("main h1")).toHaveText(TEXTO_ERROR_DESCARGA.titulo);
  await expect(page.getByText(TEXTO_ERROR_DESCARGA.mensaje)).toBeVisible();
  await expect(page.getByText(TEXTO_ERROR_DESCARGA.versionNueva)).toHaveCount(0);
  expect(sinRespuesta.length, "la ficha tiene que haber pedido algo además de su propio trozo (si no, esta prueba no prueba nada)").toBeGreaterThan(0);
});

test("un error del servidor al pedir el trozo de una pantalla (503) tampoco es una versión nueva", async ({ page }) => {
  await page.route(/\/assets\/PantallaVencimientos-[^/]*\.js$/, (ruta) => ruta.fulfill({ status: 503, contentType: "text/plain", body: "No disponible" }));
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.getByRole("link", { name: "Vencimientos" }).first().click();

  await expect(page.locator("main h1")).toHaveText(TEXTO_ERROR_DESCARGA.titulo);
  await expect(page.getByText(TEXTO_ERROR_DESCARGA.mensaje)).toBeVisible();
  await expect(page.getByText(TEXTO_ERROR_DESCARGA.versionNueva)).toHaveCount(0);
});

/**
 * Cuántos archivos pide como mucho una primera visita (el documento, las hojas de estilo, el JS y las fuentes). Antes de la etapa 2 eran 29. Al sacar el código del conductor de la
 * carga inicial son 30: se fue un trozo y lo que compartía con el marco quedó en dos trozos chicos. Subir este número es una decisión que se anota (docs/stack.md, sección 7).
 */
const MAXIMO_DE_PEDIDOS_EN_LA_PRIMERA_VISITA = 31; // 30 + `arranque.js` (T16: el tema guardado se pone antes del primer pintado; 174 B con gzip)
/** Un texto que solo está en el código del conductor (`estado/conductor.ts` y sus textos): sirve para reconocer el trozo sin depender de cómo se llame el archivo. */
const MARCA_DEL_CODIGO_DEL_CONDUCTOR = TEXTO_CONDUCTOR_PARA_PROBAR["puede-salir"];

test("la primera visita pide solo el JS de la carga inicial y el generador de datos, sin el código del conductor, y no pasa del máximo de pedidos", async ({ page }) => {
  const pedidos: string[] = [];
  page.on("request", (r) => pedidos.push(new URL(r.url()).pathname));
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.waitForLoadState("networkidle");

  // La carga inicial es lo que `index.html` nombra (lo mismo que mide `npm run peso`); el resto del JS tiene que estar en `PRIMERA_VISITA`.
  const iniciales = jsDeLaCargaInicial(await (await page.request.get("/")).text()).map((ruta) => `/${ruta}`);
  expect(iniciales.length, "el JS que nombra index.html").toBeGreaterThan(0);
  const js = pedidos.filter((ruta) => ruta.endsWith(".js"));
  const deMas = js.filter((ruta) => !iniciales.includes(ruta) && !PRIMERA_VISITA.some((patron) => patron.test(ruta.slice(1))));
  expect(deMas, "JS pedido en la primera visita que no es de la carga inicial ni está en PRIMERA_VISITA (scripts/peso-js.mjs)").toEqual([]);
  expect(js.filter((ruta) => PRIMERA_VISITA.some((patron) => patron.test(ruta.slice(1)))), "el generador de datos, una vez").toHaveLength(1);

  // El código del conductor no viaja: ninguno de los archivos pedidos lo trae.
  for (const ruta of js) expect((await (await page.request.get(ruta)).text()).includes(MARCA_DEL_CODIGO_DEL_CONDUCTOR), `${ruta} trae el código del conductor`).toBe(false);

  expect(pedidos.length, `pedidos de la primera visita:\n${pedidos.join("\n")}`).toBeLessThanOrEqual(MAXIMO_DE_PEDIDOS_EN_LA_PRIMERA_VISITA);
});

test("«Ver como» baja el código del conductor al abrirse y marca a quién elegir para probar cada caso", async ({ page }) => {
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  const pedidos: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".js")) pedidos.push(new URL(r.url()).pathname);
  });
  await page.getByRole("button", { name: /^Ver como Encargado/ }).click();
  const dialogo = page.getByRole("dialog", { name: "Ver como" });
  await dialogo.getByRole("radio", { name: /^Conductor/ }).check();
  for (const marca of Object.values(TEXTO_CONDUCTOR_PARA_PROBAR)) await expect(dialogo.getByText(marca)).toHaveCount(1);

  // La marca de arriba sirve para reconocer el trozo: uno de los archivos que se acaban de pedir la trae (si no, la prueba de la primera visita no vería nada).
  const conLaMarca: string[] = [];
  for (const ruta of pedidos) if ((await (await page.request.get(ruta)).text()).includes(MARCA_DEL_CODIGO_DEL_CONDUCTOR)) conLaMarca.push(ruta);
  expect(conLaMarca, "trozos con el código del conductor pedidos al abrir «Ver como»").toHaveLength(1);
});

// Las sugerencias son un agregado: sin ellas el diálogo sirve igual. Si no bajan (sin red) o tardan más que el plazo corto (2 s), se abre sin marcas.
for (const [caso, sinSugerencias, vuelveLaRed] of [
  ["no bajan", (ruta: Route) => ruta.abort("failed"), true],
  // El pedido queda abierto para siempre (no hay forma de soltarlo desde la prueba): alcanza con ver que el diálogo no lo espera.
  ["no responden", () => new Promise<void>(() => {}), false],
] as const) {
  test(`si las sugerencias de «Ver como» ${caso}, el diálogo se abre igual y sin marcas`, async ({ page }) => {
    await page.goto("/#/inicio");
    await esperarPantalla(page, "Inicio");
    await page.route(/\/assets\/[^/]*\.js$/, sinSugerencias);
    await page.getByRole("button", { name: /^Ver como Encargado/ }).click();

    const dialogo = page.getByRole("dialog", { name: "Ver como" });
    await expect(dialogo).toBeVisible();
    await dialogo.getByRole("radio", { name: /^Conductor/ }).check();
    await expect(dialogo.getByRole("radio", { name: new RegExp(`^${CONDUCTOR}`) })).toBeVisible();
    await expect(dialogo.getByText(/^Para probar:/)).toHaveCount(0);

    if (!vuelveLaRed) return;
    // Con la red de vuelta, el perfil se cambia como siempre.
    await page.unroute(/\/assets\/[^/]*\.js$/);
    await dialogo.getByRole("radio", { name: new RegExp(`^${CONDUCTOR}`) }).check();
    await dialogo.getByRole("button", { name: "Aplicar" }).click();
    await expect(dialogo).toBeHidden();
    await esperarPantalla(page, "Hoy");
  });
}

test("si mientras bajan las sugerencias de «Ver como» se abre otro diálogo, «Ver como» no se le pone encima", async ({ page }) => {
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.route(/\/assets\/[^/]*\.js$/, tardaEnBajar(1000));
  const llegaron = page.waitForResponse((r) => r.url().endsWith(".js"));
  await page.getByRole("button", { name: /^Ver como Encargado/ }).click();
  await page.getByRole("button", { name: "Cómo funciona" }).first().click();
  await expect(page.getByRole("dialog", { name: "Cómo funciona" })).toBeVisible();

  // Las sugerencias llegan con el otro diálogo abierto. Escape cierra el diálogo de arriba: si «Ver como» se hubiera abierto encima, quedaría uno abierto.
  await llegaron;
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  // «Ver como» quedó como estaba: al pedirlo de nuevo se abre, ya con las marcas.
  await page.getByRole("button", { name: /^Ver como Encargado/ }).click();
  const dialogo = page.getByRole("dialog", { name: "Ver como" });
  await dialogo.getByRole("radio", { name: /^Conductor/ }).check();
  await expect(dialogo.getByText(TEXTO_CONDUCTOR_PARA_PROBAR["puede-salir"])).toHaveCount(1);
});

// Las marcas arman el inicio de cada conductor (es el cálculo caro del diálogo): con «Ver como» cerrado no se calculan, aunque el diálogo siga montado con su lista.
test("las marcas de «Ver como» solo existen con el diálogo abierto: al cerrarlo la lista queda sin ninguna y al abrirlo de nuevo vuelven", async ({ page }) => {
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  const abrir = page.getByRole("button", { name: /^Ver como Encargado/ });
  const dialogo = page.getByRole("dialog", { name: "Ver como" });
  const cantidadDeMarcas = Object.keys(TEXTO_CONDUCTOR_PARA_PROBAR).length;

  await abrir.click();
  await dialogo.getByRole("radio", { name: /^Conductor/ }).check();
  await expect(dialogo.getByText(/^Para probar:/)).toHaveCount(cantidadDeMarcas);
  // Llegaron enseguida: no hubo nada que avisar.
  await expect(page.getByText(TEXTO_MARCO.abriendoVerComo)).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  // El diálogo cerrado sigue en la página con la lista de conductores que mostraba, ya sin marcas.
  const cerrado = page.locator("dialog").filter({ has: page.locator('input[name="conductor-del-parte"]') });
  await expect(cerrado).toHaveCount(1);
  await expect(cerrado.getByText(/^Para probar:/)).toHaveCount(0);

  // Se reabre desde otro botón, lejos del radio recién pulsado: al cerrarse, el diálogo absorbe por un instante los clics en ese mismo lugar (es su guarda contra el doble clic).
  await page.getByRole("button", { name: "Probar como conductor" }).click();
  await expect(dialogo.getByRole("radio", { name: /^Conductor/ })).toBeChecked();
  await expect(dialogo.getByText(/^Para probar:/)).toHaveCount(cantidadDeMarcas);
});

test("si las sugerencias de «Ver como» tardan, un mensaje de estado dice que se está abriendo; al abrirse el diálogo el mensaje se va", async ({ page }) => {
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.route(/\/assets\/[^/]*\.js$/, tardaEnBajar(1500));
  await page.getByRole("button", { name: /^Ver como Encargado/ }).click();

  const dialogo = page.getByRole("dialog", { name: "Ver como" });
  await expect(page.getByRole("status").filter({ hasText: TEXTO_MARCO.abriendoVerComo })).toHaveCount(1);
  await expect(dialogo, "el mensaje se dice mientras se espera, antes de que el diálogo se abra").toBeHidden();

  await expect(dialogo).toBeVisible();
  await expect(page.getByText(TEXTO_MARCO.abriendoVerComo)).toHaveCount(0);
});

test("«Probar como conductor» de Inicio abre «Ver como» con la persona del seguro vencido ya elegida; al aplicar, su pantalla dice que la unidad no puede salir por el seguro", async ({ page }) => {
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.getByRole("button", { name: "Probar como conductor" }).click();

  const dialogo = page.getByRole("dialog", { name: "Ver como" });
  await expect(dialogo.getByRole("radio", { name: /^Conductor/ })).toBeChecked();
  // La persona que Inicio eligió (con lo que viaja con el marco) es la misma que el diálogo marca para ese caso (con el cálculo completo).
  await expect(dialogo.getByRole("radio", { name: new RegExp(TEXTO_CONDUCTOR_PARA_PROBAR["documentacion-vencida"]) })).toBeChecked();
  await dialogo.getByRole("button", { name: "Aplicar" }).click();
  await expect(dialogo).toBeHidden();

  await esperarPantalla(page, "Hoy");
  // El motivo, sin el remate «La unidad no puede salir.» (ya lo dice el veredicto del pie de la llave), y el veredicto.
  await expect(page.getByText(/^El seguro de [^.]+ venció el [^.]+\.$/)).toBeVisible();
  await expect(page.getByText("No puede salir hoy")).toBeVisible();
});
