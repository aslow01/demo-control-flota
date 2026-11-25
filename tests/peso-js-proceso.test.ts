// Control del peso del JS ejecutado como proceso (`node scripts/peso-js.mjs`), no solo sus funciones.
// Cubre el defecto del 25/11/2026: en Linux la guarda "¿me ejecutaron directamente?" nunca coincidía y el
// control salía con 0 sin medir nada. Por eso además del código de salida se exige la medición impresa.
import { describe, expect, it } from "vitest";
import { TOPE_INICIAL } from "../scripts/peso-js.mjs";
import { correrPesoJsConDist } from "./ayuda/correr-peso-js.mjs";

describe("scripts/peso-js.mjs como proceso", () => {
  it("con la carga inicial por debajo del tope sale con 0 y muestra la medición (no pasa sin medir)", () => {
    const r = correrPesoJsConDist(10_000);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/JS inicial: \d+ B con gzip/);
  });
  it("con la carga inicial por encima del tope sale con un código distinto de 0", () => {
    const r = correrPesoJsConDist(TOPE_INICIAL + 20_000);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/FALLA/);
  });
});
