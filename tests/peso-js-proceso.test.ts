// Control del peso del JS ejecutado como proceso (`node scripts/peso-js.mjs`), no solo sus funciones.
// Cubre el defecto del 25/11/2026: en Linux la guarda "¿me ejecutaron directamente?" nunca coincidía y el
// control salía con 0 sin medir nada. Por eso además del código de salida se exige la medición impresa.
import { describe, expect, it } from "vitest";
import { AVISO_TROZO, TOPE_INICIAL, TOPE_PRIMERA_VISITA } from "../scripts/peso-js.mjs";
import { correrPesoJsConDist } from "./ayuda/correr-peso-js.mjs";

describe("scripts/peso-js.mjs como proceso", () => {
  it("con la carga inicial por debajo del tope sale con 0 y muestra la medición (no pasa sin medir)", () => {
    const r = correrPesoJsConDist(10_000);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/JS inicial: \d+ B con gzip/);
    expect(r.stdout).toMatch(/Primera visita: \d+ B con gzip/);
  });
  it("con la carga inicial por encima del tope sale con un código distinto de 0", () => {
    const r = correrPesoJsConDist(TOPE_INICIAL + 20_000);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/FALLA/);
  });

  it("con la carga inicial bien pero la primera visita (inicial más generador) por encima de su tope, sale con un código distinto de 0 y lo dice", () => {
    const r = correrPesoJsConDist(TOPE_INICIAL - 10_000, TOPE_PRIMERA_VISITA - TOPE_INICIAL + 20_000);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/FALLA: la primera visita/);
    expect(r.stderr).not.toMatch(/FALLA: la carga inicial/);
  });
  it("con la primera visita dentro de su tope, con el generador sumado, sale con 0", () => {
    const r = correrPesoJsConDist(60_000, 20_000);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Primera visita: 8\d{4} B con gzip \(la inicial más assets\/generador-PRUEBA\.js/);
  });

  describe("avisos", () => {
    // Un trozo de más de 30.000 B (incompresible) hace saltar el aviso de trozo sin hacer fallar nada.
    it("en local, un aviso sale como texto «AVISO:» y no escribe ningún resumen", () => {
      const r = correrPesoJsConDist(10_000, 0, { bytesDelTrozo: AVISO_TROZO + 5_000 });
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/^AVISO: El trozo assets\/PantallaPrueba-PRUEBA\.js/m);
      expect(r.stderr).not.toMatch(/::warning/);
      expect(r.resumen).toBe("");
    });
    it("en GitHub Actions, el aviso sale como anotación ::warning:: y la medición va al resumen de la corrida", () => {
      const r = correrPesoJsConDist(10_000, 0, { bytesDelTrozo: AVISO_TROZO + 5_000, enActions: true });
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/^::warning title=Peso del JS::El trozo assets\/PantallaPrueba-PRUEBA\.js/m);
      expect(r.resumen).toMatch(/### Peso del JS/);
      expect(r.resumen).toMatch(/- AVISO: El trozo assets\/PantallaPrueba-PRUEBA\.js/);
    });
    it("en GitHub Actions, sin avisos el resumen lo dice", () => {
      const r = correrPesoJsConDist(10_000, 0, { enActions: true });
      expect(r.status).toBe(0);
      expect(r.resumen).toMatch(/Sin avisos\./);
    });
  });
});