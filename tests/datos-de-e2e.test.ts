// Las pruebas de punta a punta (`e2e/`) dependen de dos datos del ejemplo: una patente y un conductor (`e2e/ejemplo.ts`). Acá se comprueba, sin navegador, que el generador los sigue produciendo
// con la semilla de la demo y el día de hoy: si no, falla esta prueba y dice cuál dato cambió, en vez de un tiempo agotado en Playwright.
import { describe, expect, it } from "vitest";
import { SEMILLA_POR_DEFECTO } from "../src/lib/datos/constantes.ts";
import { generar } from "../src/lib/datos/generador.ts";
import { CONDUCTOR, hoyEnArgentina, PATENTE, PATENTE_EN_PANTALLA } from "../e2e/ejemplo.ts";

describe("los datos del ejemplo que usan las pruebas de punta a punta", () => {
  const estado = generar(SEMILLA_POR_DEFECTO, hoyEnArgentina());
  const unidad = estado.unidades.find((u) => u.patente === PATENTE);

  it(`la patente ${PATENTE} existe en el ejemplo (si el generador cambió, corregirla en e2e/ejemplo.ts)`, () => {
    expect(unidad, `no hay una unidad con patente ${PATENTE}; hay: ${estado.unidades.map((u) => u.patente).join(", ")}`).toBeDefined();
  });

  it(`la patente se escribe en pantalla como «${PATENTE_EN_PANTALLA}»`, () => {
    expect(PATENTE_EN_PANTALLA.replace(" ", "")).toBe(PATENTE);
  });

  it(`el conductor «${CONDUCTOR}» existe y es el de esa unidad`, () => {
    const conductor = estado.conductores.find((c) => c.nombre === CONDUCTOR);
    expect(conductor, `no hay un conductor llamado ${CONDUCTOR}; hay: ${estado.conductores.map((c) => c.nombre).join(", ")}`).toBeDefined();
    expect(unidad?.conductorId).toBe(conductor?.id);
  });

  it("hoyEnArgentina da una fecha AAAA-MM-DD", () => {
    expect(hoyEnArgentina()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
