// Entrada de las vistas (docs/diseno-ui.md, 15.10): la coreografía corre UNA vez por vista y por sesión; las demás veces es «breve»; con menos movimiento es «quieta».
// En «completa» las animaciones nacen en pausa hasta que cargan las letras (o pasan 450 ms) y termina la transición entre pantallas; a los 1.500 ms la vista queda «fija».
// Todo con un reloj y unas promesas a mano: nada espera de verdad.
import { describe, expect, it } from "vitest";
import {
  ESPERA_DE_LETRAS_MS,
  FIJA_A_LOS_MS,
  TOPE_DE_LA_PAUSA_MS,
  crearEntrada,
  type DependenciasDeEntrada,
  type SituacionDeEntrada,
} from "../src/componentes/entrada.ts";

function pendiente() {
  let resolver!: (v?: unknown) => void;
  let rechazar!: (e?: unknown) => void;
  const promesa = new Promise<unknown>((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}
/** Deja correr las promesas ya resueltas (un turno de microtareas). */
const soltar = () => new Promise<void>((listo) => setTimeout(listo, 0));

function entorno(opciones: { menosMovimiento?: boolean } = {}) {
  let ahora = 0;
  const timers: { en: number; alCumplirse: () => void; vivo: boolean }[] = [];
  const letras = pendiente();
  const transicion = pendiente();
  const estado = { menosMovimiento: opciones.menosMovimiento ?? false, letras, transicion };
  const dependencias: DependenciasDeEntrada = {
    menosMovimiento: () => estado.menosMovimiento,
    letrasListas: () => estado.letras.promesa,
    transicionTerminada: () => estado.transicion.promesa,
    esperar(ms, alCumplirse) {
      const t = { en: ahora + ms, alCumplirse, vivo: true };
      timers.push(t);
      return () => {
        t.vivo = false;
      };
    },
  };
  /** Avanza el reloj corriendo, en orden, lo que venza. */
  async function avanzar(ms: number): Promise<void> {
    const objetivo = ahora + ms;
    for (;;) {
      const vivos = timers.filter((t) => t.vivo && t.en <= objetivo);
      const siguiente = vivos.sort((a, b) => a.en - b.en)[0];
      if (siguiente === undefined) break;
      ahora = siguiente.en;
      siguiente.vivo = false;
      siguiente.alCumplirse();
      await soltar();
    }
    ahora = objetivo;
    await soltar();
  }
  return { dependencias, estado, avanzar, timersVivos: () => timers.filter((t) => t.vivo).length, hora: () => ahora };
}

/** Empieza una vista y anota cada situación que avisa. */
function mirar(entrada: ReturnType<typeof crearEntrada>, vista: "inicio" | "conductor" = "inicio") {
  const vistas: SituacionDeEntrada[] = [];
  const cancelar = entrada.empezar(vista, (s) => vistas.push({ ...s }));
  return { vistas, cancelar, ultima: () => vistas.at(-1) };
}

describe("las constantes son las de la especificación", () => {
  it("letras 450 ms, fija a los 1.500 ms, y la pausa nunca dura más que el tope", () => {
    expect(ESPERA_DE_LETRAS_MS).toBe(450);
    expect(FIJA_A_LOS_MS).toBe(1500);
    expect(TOPE_DE_LA_PAUSA_MS).toBeGreaterThanOrEqual(ESPERA_DE_LETRAS_MS);
    expect(TOPE_DE_LA_PAUSA_MS).toBeLessThan(FIJA_A_LOS_MS);
  });
});

describe("la primera vez que se ve una vista: «completa»", () => {
  it("avisa enseguida «completa» y en pausa: el primer cuadro está diseñado para leerse", () => {
    const e = entorno();
    const { vistas } = mirar(crearEntrada(e.dependencias));
    expect(vistas).toEqual([{ estado: "completa", pausa: true }]);
  });

  it("suelta la pausa cuando cargaron las letras Y terminó la transición", async () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    e.estado.letras.resolver();
    await soltar();
    expect(v.ultima()).toEqual({ estado: "completa", pausa: true }); // falta la transición
    e.estado.transicion.resolver();
    await soltar();
    expect(v.ultima()).toEqual({ estado: "completa", pausa: false });
  });

  it("si las letras no llegan, a los 450 ms se sueltan igual (con la transición ya terminada)", async () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    e.estado.transicion.resolver();
    await e.avanzar(ESPERA_DE_LETRAS_MS - 1);
    expect(v.ultima()?.pausa).toBe(true);
    await e.avanzar(1);
    expect(v.ultima()).toEqual({ estado: "completa", pausa: false });
  });

  it("si la transición todavía corre a los 450 ms, espera a que termine", async () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    await e.avanzar(ESPERA_DE_LETRAS_MS + 100);
    expect(v.ultima()?.pausa).toBe(true);
    e.estado.transicion.resolver();
    await soltar();
    expect(v.ultima()).toEqual({ estado: "completa", pausa: false });
  });

  it("una transición que no termina nunca no deja la vista en pausa para siempre: a los TOPE ms se suelta", async () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    await e.avanzar(TOPE_DE_LA_PAUSA_MS - 1);
    expect(v.ultima()?.pausa).toBe(true);
    await e.avanzar(1);
    expect(v.ultima()).toEqual({ estado: "completa", pausa: false });
  });

  it("si la API de letras falla (la promesa se rechaza) se trata como «ya están»", async () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    e.estado.transicion.resolver();
    e.estado.letras.rechazar(new Error("sin fonts"));
    await soltar();
    expect(v.ultima()).toEqual({ estado: "completa", pausa: false });
  });

  it("queda «fija» a los 1.500 ms de soltarse la pausa (no de montarse)", async () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    await e.avanzar(300); // mientras tanto, nada pasa
    e.estado.letras.resolver();
    e.estado.transicion.resolver();
    await soltar();
    const desdeLaSuelta = e.hora();
    await e.avanzar(FIJA_A_LOS_MS - 1);
    expect(v.ultima()).toEqual({ estado: "completa", pausa: false });
    await e.avanzar(1);
    expect(v.ultima()).toEqual({ estado: "fija", pausa: false });
    expect(e.hora() - desdeLaSuelta).toBe(FIJA_A_LOS_MS);
  });

  it("la secuencia completa de avisos es completa-en-pausa, completa-andando, fija", async () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    e.estado.letras.resolver();
    e.estado.transicion.resolver();
    await soltar();
    await e.avanzar(FIJA_A_LOS_MS);
    expect(v.vistas).toEqual([
      { estado: "completa", pausa: true },
      { estado: "completa", pausa: false },
      { estado: "fija", pausa: false },
    ]);
  });

  it("una vez suelta no se vuelve a soltar por el tope ni por las letras (sin avisos repetidos)", async () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    e.estado.letras.resolver();
    e.estado.transicion.resolver();
    await soltar();
    await e.avanzar(TOPE_DE_LA_PAUSA_MS + ESPERA_DE_LETRAS_MS);
    expect(v.vistas.filter((s) => s.pausa === false && s.estado === "completa")).toHaveLength(1);
  });
});

describe("las veces siguientes: «breve»", () => {
  it("volver a una vista ya vista es «breve», sin pausa y sin relojes", () => {
    const e = entorno();
    const entrada = crearEntrada(e.dependencias);
    mirar(entrada).cancelar();
    const otra = mirar(entrada);
    expect(otra.vistas).toEqual([{ estado: "breve", pausa: false }]);
    expect(e.timersVivos()).toBe(0);
  });

  it("irse a la mitad de la coreografía cuenta como vista: al volver es «breve»", async () => {
    const e = entorno();
    const entrada = crearEntrada(e.dependencias);
    const primera = mirar(entrada);
    await e.avanzar(100);
    primera.cancelar();
    expect(mirar(entrada).vistas).toEqual([{ estado: "breve", pausa: false }]);
  });

  it("cada vista cuenta aparte: ver Inicio no gasta la entrada de Hoy", () => {
    const e = entorno();
    const entrada = crearEntrada(e.dependencias);
    mirar(entrada, "inicio");
    expect(mirar(entrada, "conductor").vistas).toEqual([{ estado: "completa", pausa: true }]);
    expect(mirar(entrada, "conductor").vistas).toEqual([{ estado: "breve", pausa: false }]);
  });

  it("«breve» no pasa a «fija»: lo único que mueve es la transición entre pantallas", async () => {
    const e = entorno();
    const entrada = crearEntrada(e.dependencias);
    mirar(entrada).cancelar();
    const otra = mirar(entrada);
    await e.avanzar(FIJA_A_LOS_MS * 2);
    expect(otra.vistas).toHaveLength(1);
  });
});

describe("con menos movimiento o «Sin animaciones»: «quieta»", () => {
  it("todo en su estado final desde el primer cuadro: «quieta», sin pausa y sin relojes", () => {
    const e = entorno({ menosMovimiento: true });
    const v = mirar(crearEntrada(e.dependencias));
    expect(v.vistas).toEqual([{ estado: "quieta", pausa: false }]);
    expect(e.timersVivos()).toBe(0);
  });

  it("no gasta la entrada: si después se permite el movimiento, la primera vez corre «completa»", () => {
    const e = entorno({ menosMovimiento: true });
    const entrada = crearEntrada(e.dependencias);
    mirar(entrada).cancelar();
    e.estado.menosMovimiento = false;
    expect(mirar(entrada).vistas).toEqual([{ estado: "completa", pausa: true }]);
  });

  it("si se aprieta «Sin animaciones» durante la pausa, al soltarse queda «quieta» (no corre nada)", async () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    e.estado.menosMovimiento = true;
    e.estado.letras.resolver();
    e.estado.transicion.resolver();
    await soltar();
    expect(v.ultima()).toEqual({ estado: "quieta", pausa: false });
    await e.avanzar(FIJA_A_LOS_MS * 2);
    expect(v.ultima()).toEqual({ estado: "quieta", pausa: false });
  });

  it("si se aprieta «Sin animaciones» con la coreografía andando, a los 1.500 ms queda «quieta» y no «fija»", async () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    e.estado.letras.resolver();
    e.estado.transicion.resolver();
    await soltar();
    e.estado.menosMovimiento = true;
    await e.avanzar(FIJA_A_LOS_MS);
    expect(v.ultima()).toEqual({ estado: "quieta", pausa: false });
  });
});

describe("cancelar", () => {
  it("al irse la vista no se avisa nada más y no queda ningún reloj vivo", async () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    v.cancelar();
    e.estado.letras.resolver();
    e.estado.transicion.resolver();
    await e.avanzar(FIJA_A_LOS_MS * 2);
    expect(v.vistas).toEqual([{ estado: "completa", pausa: true }]);
    expect(e.timersVivos()).toBe(0);
  });

  it("cancelar dos veces no hace nada raro", () => {
    const e = entorno();
    const v = mirar(crearEntrada(e.dependencias));
    v.cancelar();
    expect(() => v.cancelar()).not.toThrow();
  });
});

describe("«Reiniciar demo» la vuelve a pedir", () => {
  it("después de reiniciar, una vista ya vista vuelve a empezar «completa»", () => {
    const e = entorno();
    const entrada = crearEntrada(e.dependencias);
    mirar(entrada).cancelar();
    const segunda = mirar(entrada);
    expect(segunda.vistas).toEqual([{ estado: "breve", pausa: false }]);
    segunda.cancelar();
    entrada.reiniciar();
    expect(mirar(entrada).vistas).toEqual([{ estado: "completa", pausa: true }]);
  });

  it("una vista que sigue en pantalla durante el reinicio vuelve a empezar sola, y lo que quedaba de la anterior no la pisa", async () => {
    const e = entorno();
    const entrada = crearEntrada(e.dependencias);
    const v = mirar(entrada);
    e.estado.letras.resolver();
    e.estado.transicion.resolver();
    await soltar();
    await e.avanzar(500);
    // En el reinicio hay promesas nuevas: las de la transición y las letras de ahora.
    e.estado.letras = pendiente();
    e.estado.transicion = pendiente();
    entrada.reiniciar();
    expect(v.ultima()).toEqual({ estado: "completa", pausa: true });
    await e.avanzar(ESPERA_DE_LETRAS_MS - 1);
    expect(v.ultima()).toEqual({ estado: "completa", pausa: true });
    e.estado.letras.resolver();
    e.estado.transicion.resolver();
    await soltar();
    expect(v.ultima()).toEqual({ estado: "completa", pausa: false });
    // El reloj de «fija» de la corrida anterior vencía a los 1.000 ms del reinicio: no tiene que dispararse. El de la nueva, a los 1.500 ms de soltarse.
    await e.avanzar(FIJA_A_LOS_MS - 1);
    expect(v.ultima()).toEqual({ estado: "completa", pausa: false });
    await e.avanzar(1);
    expect(v.ultima()).toEqual({ estado: "fija", pausa: false });
  });

  it("una vista que ya se fue no se reinicia sola", async () => {
    const e = entorno();
    const entrada = crearEntrada(e.dependencias);
    const v = mirar(entrada);
    v.cancelar();
    entrada.reiniciar();
    expect(v.vistas).toEqual([{ estado: "completa", pausa: true }]);
  });

  it("con menos movimiento, reiniciar deja la vista «quieta»", () => {
    const e = entorno({ menosMovimiento: true });
    const entrada = crearEntrada(e.dependencias);
    const v = mirar(entrada);
    entrada.reiniciar();
    expect(v.ultima()).toEqual({ estado: "quieta", pausa: false });
  });
});
