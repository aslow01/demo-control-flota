// Movimiento (componentes/movimiento.ts): solo lo que se puede probar sin navegador: que un filtro o una letra del buscador no lleven transición, que «menos movimiento»
// incluya «Sin animaciones» (`data-movimiento="quieto"` en <html>) y que se pueda esperar a que termine la transición entre pantallas. Lo visual se mira en el navegador.
// (La cuenta de la cifra cobre —`pedirCuenta`, `consumirCuenta`, `alPedirseLaCuenta`, `contarHasta`— se retiró en la etapa 2: la cifra ya no cuenta, 15.10.)
import { afterEach, describe, expect, it, vi } from "vitest";
import { conMovimiento, esWebKitSinChromium, esperarTransicion, quiereMenosMovimiento } from "../src/componentes/movimiento.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";

afterEach(() => vi.unstubAllGlobals());

describe("quiereMenosMovimiento", () => {
  /** El sistema pide menos movimiento (o no) y <html> trae (o no) `data-movimiento`. */
  function preferencias(sistema: boolean, movimiento?: string) {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: sistema }) });
    vi.stubGlobal("document", { documentElement: { dataset: movimiento === undefined ? {} : { movimiento } } });
  }

  it("sin ninguna de las dos preferencias, el movimiento está permitido", () => {
    preferencias(false);
    expect(quiereMenosMovimiento()).toBe(false);
  });

  it("el sistema pide menos movimiento: sí", () => {
    preferencias(true);
    expect(quiereMenosMovimiento()).toBe(true);
  });

  it("«Sin animaciones» (`data-movimiento=\"quieto\"`): sí, aunque el sistema permita el movimiento", () => {
    preferencias(false, "quieto");
    expect(quiereMenosMovimiento()).toBe(true);
  });

  it("cualquier otro valor de `data-movimiento` no cuenta", () => {
    preferencias(false, "andando");
    expect(quiereMenosMovimiento()).toBe(false);
    preferencias(false, "");
    expect(quiereMenosMovimiento()).toBe(false);
  });

  it("las dos a la vez: sí", () => {
    preferencias(true, "quieto");
    expect(quiereMenosMovimiento()).toBe(true);
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
      documentElement: { classList: { add: () => {}, remove: () => {} }, dataset: {} },
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

  /** Una transición que termina cuando la prueba lo dice (`terminar`). */
  function transicionQueTermina() {
    let terminar!: () => void;
    const finished = new Promise<void>((listo) => (terminar = listo));
    const documento = (globalThis as unknown as { document: { startViewTransition: unknown } }).document;
    documento.startViewTransition = (actualizar: () => unknown) => ({ ready: Promise.resolve(), updateCallbackDone: Promise.resolve(actualizar()), finished });
    return terminar;
  }

  it("esperarTransicion: sin ninguna transición en curso se cumple enseguida", async () => {
    navegador(UA.chrome);
    let cumplida = false;
    void esperarTransicion().then(() => (cumplida = true));
    await dejarCorrer();
    expect(cumplida).toBe(true);
  });

  it("esperarTransicion: con una transición entre pantallas en curso espera a que termine, y después vuelve a cumplirse enseguida", async () => {
    navegador(UA.chrome);
    const terminar = transicionQueTermina();
    const base = ubicacionEnMemoria("#/inicio");
    conMovimiento(base).alCambiar(() => {});
    base.irA("#/movilidades");
    let cumplida = false;
    void esperarTransicion().then(() => (cumplida = true));
    await dejarCorrer();
    expect(cumplida).toBe(false);
    terminar();
    await dejarCorrer();
    expect(cumplida).toBe(true);
    let otra = false;
    void esperarTransicion().then(() => (otra = true));
    await dejarCorrer();
    expect(otra).toBe(true);
  });

  it("esperarTransicion: sin View Transitions (WebKit) espera a que termine la animación CSS de entrada, no antes", async () => {
    navegador(UA.webkitPlaywright);
    // El `#principal` de la página: guarda el oyente de «animationend» para poder dispararlo.
    const captura: { alTerminar: ((e: unknown) => void) | null } = { alTerminar: null };
    const principal = {
      addEventListener: (_nombre: string, oyente: (e: unknown) => void) => (captura.alTerminar = oyente),
      classList: { add: () => {}, remove: () => {} },
      offsetWidth: 0,
    };
    (globalThis as unknown as { document: { getElementById: unknown } }).document.getElementById = () => principal;
    vi.stubGlobal("HTMLElement", class {});
    const base = ubicacionEnMemoria("#/inicio");
    conMovimiento(base).alCambiar(() => {});
    base.irA("#/movilidades");
    await dejarCorrer();
    let cumplida = false;
    void esperarTransicion().then(() => (cumplida = true));
    await dejarCorrer();
    expect(cumplida).toBe(false);
    const elemento = Object.assign(new (globalThis as unknown as { HTMLElement: new () => object }).HTMLElement(), principal);
    captura.alTerminar?.({ target: elemento, currentTarget: elemento });
    await dejarCorrer();
    expect(cumplida).toBe(true);
  });

  it("esperarTransicion: una transición saltada o rota (`finished` rechazada) tampoco deja esperando", async () => {
    navegador(UA.chrome);
    const documento = (globalThis as unknown as { document: { startViewTransition: unknown } }).document;
    documento.startViewTransition = () => ({ ready: Promise.resolve(), updateCallbackDone: Promise.resolve(), finished: Promise.reject(new Error("saltada")) });
    const base = ubicacionEnMemoria("#/inicio");
    conMovimiento(base).alCambiar(() => {});
    base.irA("#/movilidades");
    let cumplida = false;
    void esperarTransicion().then(() => (cumplida = true));
    await dejarCorrer();
    expect(cumplida).toBe(true);
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
