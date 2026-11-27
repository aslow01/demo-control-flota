// Una prueba por ruta: carga sin errores de consola ni violaciones de la CSP, sin violaciones de axe y sin desborde horizontal a 360 px.
// Las rutas del encargado entran directo por la dirección; las del conductor, cambiando el perfil con «Ver como» (como lo haría la persona).
import { test } from "@playwright/test";
import { NOMBRES_DE_PANTALLA } from "../src/lib/dominio/textos-base.ts";
import { comprobarLimpia, verComoConductor, vigilar } from "./ayuda.ts";

/** Una unidad del ejemplo que puede salir hoy, para abrir su ficha y su parte (el ejemplo es el mismo cada día). */
const PATENTE = "ZYN469";
const HOY = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });

const RUTAS_DEL_ENCARGADO: { nombre: string; direccion: string; titulo: string | RegExp }[] = [
  { nombre: "Inicio", direccion: "/#/inicio", titulo: NOMBRES_DE_PANTALLA.inicio },
  { nombre: "Vencimientos", direccion: "/#/vencimientos", titulo: NOMBRES_DE_PANTALLA.vencimientos },
  { nombre: "Operación diaria", direccion: "/#/operacion/partes", titulo: NOMBRES_DE_PANTALLA.operacion },
  { nombre: "Movilidades", direccion: "/#/movilidades", titulo: NOMBRES_DE_PANTALLA.movilidades },
  { nombre: "Ficha de una unidad", direccion: `/#/unidad/${PATENTE}`, titulo: "ZYN 469" },
  { nombre: "Parte diario de una unidad", direccion: `/#/parte/${PATENTE}/${HOY}`, titulo: "Revisión antes de salir" },
  { nombre: "Más", direccion: "/#/mas", titulo: NOMBRES_DE_PANTALLA.mas },
];

for (const ruta of RUTAS_DEL_ENCARGADO) {
  test(ruta.nombre, async ({ page }) => {
    const v = await vigilar(page);
    await page.goto(ruta.direccion);
    await comprobarLimpia(page, v, ruta.titulo);
  });
}

test("Hoy (conductor)", async ({ page }) => {
  const v = await vigilar(page);
  await page.goto("/#/inicio");
  await verComoConductor(page);
  await comprobarLimpia(page, v, NOMBRES_DE_PANTALLA.conductor);
});

test("Mis partes (conductor)", async ({ page }) => {
  const v = await vigilar(page);
  await page.goto("/#/inicio");
  await verComoConductor(page);
  await page.goto("/#/conductor/partes");
  await comprobarLimpia(page, v, NOMBRES_DE_PANTALLA.conductorPartes);
});
