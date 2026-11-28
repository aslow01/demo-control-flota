// Control del peso del JS ejecutado como proceso (`node scripts/peso-js.mjs`), no solo sus funciones.
// Cubre el defecto del 25/11/2026: en Linux la guarda "¿me ejecutaron directamente?" nunca coincidía y el
// control salía con 0 sin medir nada. Por eso además del código de salida se exige la medición impresa.
import { describe, expect, it } from "vitest";
import { AVISO_CSS_INICIAL, AVISO_CSS_TOTAL, AVISO_TROZO, TOPE_CSS_INICIAL, TOPE_FUENTES, TOPE_INICIAL, TOPE_PRIMERA_VISITA } from "../scripts/peso-js.mjs";
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

  describe("el CSS y las fuentes", () => {
    it("los mide y los muestra: el CSS inicial (la hoja de index.html), el total y las fuentes por su tamaño en disco", () => {
      const r = correrPesoJsConDist(10_000, 0, { bytesDeCssInicial: 5_000, bytesDeCssDiferido: 2_000, bytesDeFuentes: 40_000 });
      expect(r.status).toBe(0);
      expect(r.stdout).toMatch(/CSS inicial: 5\d{3} B con gzip en 1 hojas/);
      expect(r.stdout).toMatch(/CSS total: +7\d{3} B con gzip en 2 hojas/);
      expect(r.stdout).toMatch(/Fuentes: +40000 B en 1 archivos/);
      expect(r.stderr).toBe("");
    });
    it("sin CSS ni fuentes mide 0 y no falla", () => {
      const r = correrPesoJsConDist(10_000);
      expect(r.status).toBe(0);
      expect(r.stdout).toMatch(/CSS inicial: 0 B con gzip en 0 hojas/);
      expect(r.stdout).toMatch(/Fuentes: +0 B en 0 archivos/);
    });
    it("con el CSS inicial por encima de su tope sale con un código distinto de 0 y lo dice", () => {
      const r = correrPesoJsConDist(10_000, 0, { bytesDeCssInicial: TOPE_CSS_INICIAL + 2_000 });
      expect(r.status).not.toBe(0);
      expect(r.stderr).toMatch(/FALLA: el CSS inicial/);
      expect(r.stderr).not.toMatch(/FALLA: la carga inicial/);
    });
    it("con el CSS inicial entre el aviso y el tope avisa y sale con 0", () => {
      const r = correrPesoJsConDist(10_000, 0, { bytesDeCssInicial: AVISO_CSS_INICIAL + 1_000 });
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/^AVISO: El CSS inicial/m);
      expect(r.stderr).not.toMatch(/FALLA/);
    });
    it("el CSS de las pantallas que se bajan después no cuenta como inicial: pasado el aviso del total, avisa y sale con 0", () => {
      const r = correrPesoJsConDist(10_000, 0, { bytesDeCssInicial: 5_000, bytesDeCssDiferido: AVISO_CSS_TOTAL });
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/^AVISO: El CSS total/m);
      expect(r.stderr).not.toMatch(/CSS inicial/);
    });
    it("con las fuentes por encima de su tope sale con un código distinto de 0 y lo dice", () => {
      const r = correrPesoJsConDist(10_000, 0, { bytesDeFuentes: TOPE_FUENTES + 1 });
      expect(r.status).not.toBe(0);
      expect(r.stderr).toMatch(/FALLA: las fuentes/);
    });
    it("en GitHub Actions el resumen de la corrida trae también la tabla del CSS y las fuentes", () => {
      const r = correrPesoJsConDist(10_000, 0, { bytesDeCssInicial: 5_000, bytesDeFuentes: 40_000, enActions: true });
      expect(r.status).toBe(0);
      expect(r.resumen).toMatch(/\| CSS inicial \|/);
      expect(r.resumen).toMatch(/\| Fuentes \| 40\.000 B \|/);
    });
  });
});
