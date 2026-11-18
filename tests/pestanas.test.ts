import { describe, expect, it } from "vitest";
import { avisoEntrePestanas, NOMBRE_CANAL, type CanalDePestanas } from "../src/lib/persistencia/pestanas.ts";

/** Una "red" de pestañas falsa: los canales con el mismo nombre se hablan entre sí, nunca consigo mismos (como BroadcastChannel). */
function redFalsa() {
  const canales: CanalFalso[] = [];
  class CanalFalso implements CanalDePestanas {
    private oyente: ((dato: unknown) => void) | null = null;
    cerrado = false;
    constructor(readonly nombre: string) {
      canales.push(this);
    }
    escuchar(alRecibirDato: ((dato: unknown) => void) | null): void {
      this.oyente = alRecibirDato;
    }
    postMessage(mensaje: unknown): void {
      if (this.cerrado) throw new Error("canal cerrado");
      for (const otro of canales) if (otro !== this && !otro.cerrado && otro.nombre === this.nombre) otro.oyente?.(structuredClone(mensaje));
    }
    close(): void {
      this.cerrado = true;
    }
  }
  return { crearCanal: (nombre: string): CanalDePestanas => new CanalFalso(nombre), canales };
}

describe("D9: aviso entre pestañas", () => {
  it("el canal se llama 'control-flota'", () => {
    expect(NOMBRE_CANAL).toBe("control-flota");
  });

  it("cuando una pestaña avisa un cambio, la otra se entera y la que avisó no", () => {
    const red = redFalsa();
    let enA = 0;
    let enB = 0;
    const a = avisoEntrePestanas({ crearCanal: red.crearCanal, alRecibir: () => enA++ });
    const b = avisoEntrePestanas({ crearCanal: red.crearCanal, alRecibir: () => enB++ });
    a.avisarCambio();
    expect(enB).toBe(1);
    expect(enA).toBe(0);
    b.avisarCambio();
    expect(enA).toBe(1);
    a.cerrar();
    b.cerrar();
  });

  it("cada cambio avisado llega una vez (no se acumulan ni se pierden)", () => {
    const red = redFalsa();
    let enB = 0;
    const a = avisoEntrePestanas({ crearCanal: red.crearCanal, alRecibir: () => {} });
    avisoEntrePestanas({ crearCanal: red.crearCanal, alRecibir: () => enB++ });
    a.avisarCambio();
    a.avisarCambio();
    a.avisarCambio();
    expect(enB).toBe(3);
  });

  it("varias pestañas: todas las demás se enteran", () => {
    const red = redFalsa();
    const llegadas = [0, 0, 0];
    const hs = llegadas.map((_, i) => avisoEntrePestanas({ crearCanal: red.crearCanal, alRecibir: () => llegadas[i]!++ }));
    hs[0]!.avisarCambio();
    expect(llegadas).toEqual([0, 1, 1]);
  });

  it("solo usa el canal con el nombre de la demo", () => {
    const red = redFalsa();
    let nombreUsado = "";
    avisoEntrePestanas({
      crearCanal: (n) => {
        nombreUsado = n;
        return red.crearCanal(n);
      },
      alRecibir: () => {},
    });
    expect(nombreUsado).toBe("control-flota");
  });

  it("ignora los mensajes que no son un aviso de cambio (entrada no confiable)", () => {
    const red = redFalsa();
    let llamadas = 0;
    avisoEntrePestanas({ crearCanal: red.crearCanal, alRecibir: () => llamadas++ });
    const otra = red.crearCanal("control-flota");
    for (const basura of [null, undefined, "cambio", 42, [], {}, { tipo: "otro" }, { tipo: 1 }, { Tipo: "cambio" }]) otra.postMessage(basura);
    expect(llamadas).toBe(0);
    otra.postMessage({ tipo: "cambio" });
    expect(llamadas).toBe(1);
  });

  it("un mensaje con campos de más sigue siendo un aviso, y los campos de más no se usan", () => {
    const red = redFalsa();
    let recibido: unknown[] = [];
    avisoEntrePestanas({ crearCanal: red.crearCanal, alRecibir: (...args: unknown[]) => (recibido = args) });
    red.crearCanal("control-flota").postMessage({ tipo: "cambio", html: "<img src=x onerror=alert(1)>" });
    expect(recibido).toEqual([]);
  });

  it("después de cerrar no recibe ni envía, y cerrar dos veces no falla", () => {
    const red = redFalsa();
    let enB = 0;
    const a = avisoEntrePestanas({ crearCanal: red.crearCanal, alRecibir: () => {} });
    const b = avisoEntrePestanas({ crearCanal: red.crearCanal, alRecibir: () => enB++ });
    b.cerrar();
    a.avisarCambio();
    expect(enB).toBe(0);
    expect(() => b.avisarCambio()).not.toThrow();
    expect(() => b.cerrar()).not.toThrow();
  });

  it("si avisar falla (canal ya cerrado por el navegador) no rompe la escritura que ya salió bien", () => {
    const rota: CanalDePestanas = {
      escuchar() {},
      postMessage() {
        throw new Error("InvalidStateError");
      },
      close() {},
    };
    const h = avisoEntrePestanas({ crearCanal: () => rota, alRecibir: () => {} });
    expect(() => h.avisarCambio()).not.toThrow();
  });

  it("sin BroadcastChannel (o si crearlo falla) no hace nada y no lanza", () => {
    let llamadas = 0;
    const sinSoporte = avisoEntrePestanas({
      crearCanal: () => {
        throw new Error("no existe BroadcastChannel");
      },
      alRecibir: () => llamadas++,
    });
    expect(() => sinSoporte.avisarCambio()).not.toThrow();
    expect(() => sinSoporte.cerrar()).not.toThrow();
    const nulo = avisoEntrePestanas({ crearCanal: () => null, alRecibir: () => llamadas++ });
    expect(() => nulo.avisarCambio()).not.toThrow();
    expect(llamadas).toBe(0);
  });

  it("con el BroadcastChannel de verdad (el de Node en estos tests) también llega", async () => {
    let resolver: () => void = () => {};
    const llegada = new Promise<void>((r) => (resolver = r));
    const b = avisoEntrePestanas({ alRecibir: () => resolver() });
    const a = avisoEntrePestanas({ alRecibir: () => {} });
    a.avisarCambio();
    await llegada;
    a.cerrar();
    b.cerrar();
  });
});
