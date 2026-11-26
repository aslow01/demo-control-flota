// Movimiento (componentes/movimiento.ts): solo lo que se puede probar sin navegador: que un filtro o una letra del buscador no lleven transición,
// que la cuenta de la cifra sea una sola curva que termina justo en su valor y que con «menos movimiento» no cuente. Lo visual se mira en el navegador.
import { afterEach, describe, expect, it, vi } from "vitest";
import { conMovimiento, consumirCuenta, contarHasta, esWebKitSinChromium, pedirCuenta } from "../src/componentes/movimiento.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";

afterEach(() => vi.unstubAllGlobals());

/** Un reloj y un `requestAnimationFrame` a mano: cada `avanzar(ms)` corre el cuadro pendiente a esa hora. */
function relojDeCuadros(reducir = false) {
  let ahora = 1000;
  vi.stubGlobal("window", { matchMedia: () => ({ matches: reducir }) });
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

  it("con menos movimiento no anima ni con un valor mayor que 0: muestra el valor final y termina enseguida", () => {
    const reloj = relojDeCuadros(true);
    const vistos: number[] = [];
    let termino = false;
    contarHasta(12, (n) => vistos.push(n), () => (termino = true));
    expect(vistos).toEqual([12]);
    expect(termino).toBe(true);
    expect(reloj.hayCuadro()).toBe(false);
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

// Los agentes de usuario son los que mandan hoy los navegadores (versiones de ejemplo).
const UA = {
  chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0",
  chromeAndroid: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0",
  safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
  safariIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1",
  chromeIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.0.0 Mobile/15E148 Safari/604.1",
  firefoxIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/146.0 Mobile/15E148 Safari/605.1.15",
  webkitPlaywright: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15",
};

describe("esWebKitSinChromium", () => {
  it("Safari y todo navegador de iPhone (que usan WebKit) cuentan; Chrome, Edge y Firefox no", () => {
    for (const ua of [UA.safariMac, UA.safariIphone, UA.chromeIphone, UA.firefoxIphone, UA.webkitPlaywright]) expect(esWebKitSinChromium({ userAgent: ua }), ua).toBe(true);
    for (const ua of [UA.chrome, UA.edge, UA.chromeAndroid, UA.firefox]) expect(esWebKitSinChromium({ userAgent: ua }), ua).toBe(false);
  });

  it("si el agente de usuario no dice nada, el fabricante «Apple» lo delata; un agente raro o vacío no cuenta", () => {
    expect(esWebKitSinChromium({ userAgent: "", vendor: "Apple Computer, Inc." })).toBe(true);
    expect(esWebKitSinChromium({ userAgent: UA.chrome, vendor: "Google Inc." })).toBe(false);
    expect(esWebKitSinChromium({ userAgent: "", vendor: "" })).toBe(false);
    expect(esWebKitSinChromium({ userAgent: "" })).toBe(false);
  });
});

describe("conMovimiento con otra pantalla", () => {
  /** Un documento mínimo: sin diálogos abiertos, con `startViewTransition` espiado, y el navegador que se diga. */
  function navegador(userAgent: string) {
    const iniciadas: unknown[] = [];
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }), innerHeight: 800 });
    vi.stubGlobal("navigator", { userAgent, vendor: "" });
    vi.stubGlobal("document", {
      querySelector: (selector: string) => (selector === "main h1" ? {} : null), // el título ya está: no hay que esperar la pantalla
      querySelectorAll: () => [],
      getElementById: () => null,
      documentElement: { classList: { add: () => {}, remove: () => {} } },
      startViewTransition: (actualizar: () => unknown) => {
        iniciadas.push(actualizar);
        const hecho = Promise.resolve(actualizar());
        return { ready: hecho, updateCallbackDone: hecho, finished: hecho };
      },
    });
    return iniciadas;
  }
  const dejarCorrer = () => new Promise((listo) => setTimeout(listo, 20));

  it("en Chromium la transición se inicia y el estado cambia dentro de ella", async () => {
    const iniciadas = navegador(UA.chrome);
    const base = ubicacionEnMemoria("#/inicio");
    const u = conMovimiento(base);
    let avisos = 0;
    u.alCambiar(() => avisos++);
    base.irA("#/movilidades");
    await dejarCorrer();
    expect(iniciadas).toHaveLength(1);
    expect(avisos).toBe(1);
  });

  it("en WebKit que no es Chromium no se usa startViewTransition (se cae el renderizador): el estado cambia igual y entra la animación CSS", async () => {
    const iniciadas = navegador(UA.webkitPlaywright);
    const base = ubicacionEnMemoria("#/inicio");
    const u = conMovimiento(base);
    let avisos = 0;
    u.alCambiar(() => avisos++);
    base.irA("#/movilidades");
    await dejarCorrer();
    expect(iniciadas).toHaveLength(0);
    expect(avisos).toBe(1);
  });

  it("un error al cambiar el estado dentro de la transición se informa, no se traga", async () => {
    navegador(UA.chrome);
    const fallo = new Error("falló aplicar");
    const documento = (globalThis as unknown as { document: { startViewTransition: unknown } }).document;
    documento.startViewTransition = () => ({ ready: Promise.resolve(), updateCallbackDone: Promise.reject(fallo), finished: Promise.reject(fallo) });
    const consola = vi.spyOn(console, "error").mockImplementation(() => {});
    const base = ubicacionEnMemoria("#/inicio");
    conMovimiento(base).alCambiar(() => {});
    base.irA("#/movilidades");
    await dejarCorrer();
    expect(consola).toHaveBeenCalledWith(fallo);
    consola.mockRestore();
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
