// Movimiento (componentes/movimiento.ts): solo lo que se puede probar sin navegador: que un filtro o una letra del buscador no lleven transición,
// que la cuenta de la cifra sea una sola curva que termina justo en su valor y que con «menos movimiento» no cuente. Lo visual se mira en el navegador.
import { afterEach, describe, expect, it, vi } from "vitest";
import { conMovimiento, consumirCuenta, contarHasta, pedirCuenta } from "../src/componentes/movimiento.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";

afterEach(() => vi.unstubAllGlobals());

/** Un reloj y un `requestAnimationFrame` a mano: cada `avanzar(ms)` corre el cuadro pendiente a esa hora. */
function relojDeCuadros() {
  let ahora = 1000;
  let pendiente: ((t: number) => void) | null = null;
  vi.stubGlobal("performance", { now: () => ahora });
  vi.stubGlobal("requestAnimationFrame", (f: (t: number) => void) => {
    pendiente = f;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    pendiente = null;
  });
  return {
    avanzar(ms: number) {
      ahora += ms;
      const f = pendiente;
      pendiente = null;
      f?.(ahora);
    },
    hayCuadro: () => pendiente !== null,
  };
}

describe("contarHasta", () => {
  it("cuenta de 0 al valor, sin retroceder, y termina en el valor justo", () => {
    const reloj = relojDeCuadros();
    const vistos: number[] = [];
    let termino = false;
    contarHasta(12, (n) => vistos.push(n), () => (termino = true));
    expect(vistos).toEqual([0]);
    for (let i = 0; i < 12; i++) reloj.avanzar(60);
    expect(vistos[0]).toBe(0);
    expect(vistos.at(-1)).toBe(12);
    expect(vistos).toEqual([...vistos].sort((a, b) => a - b));
    expect(termino).toBe(true);
    expect(reloj.hayCuadro()).toBe(false);
  });

  it("un primer cuadro con hora anterior al inicio no da números negativos", () => {
    const reloj = relojDeCuadros();
    const vistos: number[] = [];
    contarHasta(5, (n) => vistos.push(n), () => {});
    reloj.avanzar(-16);
    expect(vistos.every((n) => n >= 0)).toBe(true);
  });

  it("con 0 no anima: muestra 0 y termina enseguida", () => {
    relojDeCuadros();
    const vistos: number[] = [];
    let termino = false;
    contarHasta(0, (n) => vistos.push(n), () => (termino = true));
    expect(vistos).toEqual([0]);
    expect(termino).toBe(true);
  });

  it("se puede cortar: no pide más cuadros ni avisa que terminó", () => {
    const reloj = relojDeCuadros();
    let termino = false;
    const cortar = contarHasta(9, () => {}, () => (termino = true));
    cortar();
    reloj.avanzar(1000);
    expect(termino).toBe(false);
    expect(reloj.hayCuadro()).toBe(false);
  });
});

describe("consumirCuenta", () => {
  const menosMovimiento = (reducir: boolean) => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: reducir }) });
    vi.stubGlobal("document", { dispatchEvent: () => true });
  };

  it("cuenta una sola vez por pedido (la primera es la de abrir la demo)", () => {
    menosMovimiento(false);
    expect(consumirCuenta()).toBe(true);
    expect(consumirCuenta()).toBe(false);
    pedirCuenta();
    expect(consumirCuenta()).toBe(true);
    expect(consumirCuenta()).toBe(false);
  });

  it("con menos movimiento nunca cuenta, y igual gasta el pedido", () => {
    menosMovimiento(false);
    pedirCuenta();
    menosMovimiento(true);
    expect(consumirCuenta()).toBe(false);
    menosMovimiento(false);
    expect(consumirCuenta()).toBe(false);
  });
});

describe("conMovimiento", () => {
  it("un filtro o una letra del buscador (misma pantalla) llegan al estado enseguida, sin tocar el documento", () => {
    // No hay `window` ni `document` en Node: si el envoltorio los tocara, esta prueba fallaría con un error.
    const base = ubicacionEnMemoria("#/movilidades");
    const u = conMovimiento(base);
    let avisos = 0;
    u.alCambiar(() => avisos++);
    expect(u.leerHash()).toBe("#/movilidades");
    base.irA("#/movilidades?filtro=bloqueadas");
    expect(avisos).toBe(1);
    base.irA("#/movilidades?filtro=bloqueadas&q=zk");
    expect(avisos).toBe(2);
  });

  it("lo que la aplicación ya leyó es lo que cuenta como pantalla anterior", () => {
    const base = ubicacionEnMemoria("#/inicio");
    const u = conMovimiento(base);
    const hashes: string[] = [];
    u.alCambiar(() => hashes.push(u.leerHash()));
    base.irA("#/inicio"); // la misma pantalla: pasa directo
    expect(hashes).toEqual(["#/inicio"]);
  });

  it("deja pasar tal cual lo que no es el aviso de cambio", () => {
    const base = ubicacionEnMemoria("#/inicio");
    const u = conMovimiento(base);
    u.irA("#/mas");
    expect(base.hash).toBe("#/mas");
    u.reemplazarHash("#/inicio");
    expect(base.hash).toBe("#/inicio");
    expect(base.entradas).toBe(2);
  });
});
