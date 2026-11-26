// «Después del clic» (componentes/despues-del-clic.ts): lo que hay que esperar para mostrar algo que mueve la página cuando el foco salió de un campo porque la
// persona tocó otro control. Sin DOM: un `document` mínimo con los oyentes a mano.
import { afterEach, describe, expect, it, vi } from "vitest";
import { clicEnCurso, despuesDelClic } from "../src/componentes/despues-del-clic.ts";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

/** Un documento que guarda los oyentes y deja disparar un clic. */
function documentoDePrueba() {
  const oyentes = new Map<string, Set<() => void>>();
  vi.stubGlobal("document", {
    addEventListener: (tipo: string, f: () => void) => (oyentes.get(tipo) ?? oyentes.set(tipo, new Set()).get(tipo)!).add(f),
    removeEventListener: (tipo: string, f: () => void) => oyentes.get(tipo)?.delete(f),
  });
  return {
    clic: () => [...(oyentes.get("click") ?? [])].forEach((f) => f()),
    oyentesDeClic: () => oyentes.get("click")?.size ?? 0,
  };
}

describe("clicEnCurso", () => {
  it("sin un toque reciente no hay clic que esperar (tecla Tab, por ejemplo)", () => {
    expect(clicEnCurso(10_000, 0)).toBe(false);
    expect(clicEnCurso(10_000, Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it("con un toque de hace menos de 700 ms, sí", () => {
    expect(clicEnCurso(10_000, 9_500)).toBe(true);
    expect(clicEnCurso(10_000, 10_000)).toBe(true);
    expect(clicEnCurso(10_000, 9_299)).toBe(false);
  });
});

describe("despuesDelClic", () => {
  it("espera al clic: no resuelve antes y resuelve cuando llega", async () => {
    vi.useFakeTimers();
    const doc = documentoDePrueba();
    let listo = false;
    const espera = despuesDelClic().then(() => (listo = true));
    await vi.advanceTimersByTimeAsync(100);
    expect(listo).toBe(false);
    doc.clic();
    await vi.advanceTimersByTimeAsync(1);
    await espera;
    expect(listo).toBe(true);
    expect(doc.oyentesDeClic()).toBe(0);
  });

  it("si no llega ningún clic (se arrastró, se soltó afuera), resuelve igual al cabo del tope y no deja el oyente puesto", async () => {
    vi.useFakeTimers();
    const doc = documentoDePrueba();
    let listo = false;
    const espera = despuesDelClic(500).then(() => (listo = true));
    await vi.advanceTimersByTimeAsync(499);
    expect(listo).toBe(false);
    await vi.advanceTimersByTimeAsync(10);
    await espera;
    expect(listo).toBe(true);
    expect(doc.oyentesDeClic()).toBe(0);
  });

  it("resuelve una sola vez aunque lleguen el clic y el tope", async () => {
    vi.useFakeTimers();
    const doc = documentoDePrueba();
    let veces = 0;
    const espera = despuesDelClic(500).then(() => veces++);
    doc.clic();
    doc.clic();
    await vi.advanceTimersByTimeAsync(1000);
    await espera;
    expect(veces).toBe(1);
  });
});
