// Sin desborde horizontal a 320, 768 y 1024 px en las nueve pantallas (docs/diseno-ui.md, 15.9). Las pruebas de ruta ya miden 360 px.
// Depende del acabado visual: es una puerta de la maquetación (T10, T11 y T13). Los 1024 px caen entre el celular y el escritorio (corte único en 64 rem = 1024 px): se prueba el ancho justo.
import { desbordaEnHorizontal, esperarPantalla, verComoConductor } from "./ayuda.ts";
import { test, expect } from "./base.ts";
import { hoyEnArgentina, PATENTE, PATENTE_EN_PANTALLA } from "./ejemplo.ts";

const ANCHOS = [320, 768, 1024] as const;

const RUTAS_DEL_ENCARGADO: { nombre: string; direccion: () => string; titulo: string | RegExp }[] = [
  { nombre: "Inicio", direccion: () => "/#/inicio", titulo: "Inicio" },
  { nombre: "Movilidades", direccion: () => "/#/movilidades", titulo: "Movilidades" },
  { nombre: "Vencimientos", direccion: () => "/#/vencimientos", titulo: "Vencimientos" },
  { nombre: "Operación diaria", direccion: () => "/#/operacion/partes", titulo: "Operación diaria" },
  { nombre: "Ficha de una unidad", direccion: () => `/#/unidad/${PATENTE}`, titulo: PATENTE_EN_PANTALLA },
  { nombre: "Parte diario de una unidad", direccion: () => `/#/parte/${PATENTE}/${hoyEnArgentina()}`, titulo: "Revisión antes de salir" },
  { nombre: "Más", direccion: () => "/#/mas", titulo: "Más" },
];

for (const ancho of ANCHOS) {
  for (const ruta of RUTAS_DEL_ENCARGADO) {
    test(`${ruta.nombre} no desborda a ${ancho} px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 900 });
      await page.goto(ruta.direccion());
      await esperarPantalla(page, ruta.titulo);
      const d = await desbordaEnHorizontal(page);
      expect(d.desborda, `la página mide ${d.ancho} px en una ventana de ${d.ventana} px`).toBe(false);
    });
  }

  for (const [nombre, direccion, titulo] of [
    ["Hoy (conductor)", "/#/conductor", "Hoy"],
    ["Mis partes (conductor)", "/#/conductor/partes", "Mis partes"],
  ] as const) {
    test(`${nombre} no desborda a ${ancho} px`, async ({ page }) => {
      await page.goto("/#/inicio");
      await verComoConductor(page);
      await page.setViewportSize({ width: ancho, height: 900 });
      await page.goto(direccion);
      await esperarPantalla(page, titulo);
      const d = await desbordaEnHorizontal(page);
      expect(d.desborda, `la página mide ${d.ancho} px en una ventana de ${d.ventana} px`).toBe(false);
    });
  }
}

// Texto agrandado (el tamaño de letra del navegador al 200 %): los cinco destinos de la barra inferior ya no entran en 360 px. La barra se desplaza POR DENTRO (la página no) y lo que queda
// afuera se alcanza con el teclado, que lo trae a la vista: nada queda inalcanzable. Es la decisión de 15.4.4 (la alternativa, partir la barra en dos filas, le quita a la pantalla 126 px más).
// El tamaño de letra se simula con `font-size` en <html>, que la CSP bloquea como estilo inyectado: este contexto la saltea (solo para esta prueba).
test("con el texto al 200 % la barra inferior se desplaza por dentro, «Más» se alcanza con el teclado y la página no desborda", async ({ browser, baseURL }) => {
  const contexto = await browser.newContext({ baseURL, bypassCSP: true, viewport: { width: 360, height: 800 }, locale: "es-AR", reducedMotion: "reduce" });
  const page = await contexto.newPage();
  await page.goto("/#/inicio");
  await esperarPantalla(page, "Inicio");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  const fila = await page.locator("nav.barra-inferior ul").evaluate((ul) => ({ contenido: ul.scrollWidth, visible: ul.clientWidth }));
  expect(fila.contenido, "con el texto grande los destinos no entran: la fila tiene que desplazarse").toBeGreaterThan(fila.visible);

  const mas = page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: /^Más/ });
  await mas.focus();
  const caja = await mas.boundingBox();
  expect(caja, "el enlace «Más» existe").not.toBeNull();
  expect((caja?.x ?? 0) + (caja?.width ?? 0), "el foco trajo «Más» a la vista").toBeLessThanOrEqual(360 + 1);
  const d = await desbordaEnHorizontal(page);
  expect(d.desborda, `la página mide ${d.ancho} px en una ventana de ${d.ventana} px`).toBe(false);
  await contexto.close();
});