// Paso 4.5 (lógica): el autoguardado del borrador (P3: «se guarda solo 500 ms después de la última tecla y al salir del campo»; 5.15: indicador de guardado
// que no se anuncia en cada guardado). El reloj y el guardado se inyectan: acá no pasa tiempo de verdad ni se escribe nada.
import { describe, expect, it } from "vitest";
import { crearAutoguardado, type DependenciasAutoguardado, type IndicadorDeGuardado, type ResultadoDeBorrador } from "../src/lib/estado/autoguardado.ts";
import { errorGeneralParte, valoresIniciales, type ValoresParte } from "../src/lib/dominio/formulario-parte.ts";
import { ERRORES } from "../src/lib/dominio/textos.ts";

function base(): ValoresParte {
  return valoresIniciales({ conductorId: "c1", kmInicio: 84320 });
}
function con(cambios: Partial<ValoresParte>): ValoresParte {
  return { ...base(), ...cambios };
}

/** Un reloj que solo avanza cuando se le pide. */
function relojFalso() {
  let ahora = 0;
  let n = 0;
  const tareas = new Map<number, { en: number; f: () => void }>();
  return {
    programar: (f: () => void, ms: number) => {
      const id = ++n;
      tareas.set(id, { en: ahora + ms, f });
      return id;
    },
    cancelar: (id: unknown) => {
      tareas.delete(id as number);
    },
    pendientes: () => tareas.size,
    async avanzar(ms: number) {
      const hasta = ahora + ms;
      for (;;) {
        const sig = [...tareas.entries()].filter(([, t]) => t.en <= hasta).sort((a, b) => a[1].en - b[1].en)[0];
        if (sig === undefined) break;
        ahora = sig[1].en;
        tareas.delete(sig[0]);
        sig[1].f();
        await esperar();
      }
      ahora = hasta;
      await esperar();
    },
  };
}

const esperar = () => new Promise<void>((r) => setTimeout(r, 0));

const OK: ResultadoDeBorrador = { ok: true, parteId: "pt1", hora: "14:32", sinCambios: false };

function armar(respuestas: ResultadoDeBorrador[] | ((v: ValoresParte) => Promise<ResultadoDeBorrador> | ResultadoDeBorrador) = []) {
  const reloj = relojFalso();
  const guardados: ValoresParte[] = [];
  const indicadores: IndicadorDeGuardado[] = [];
  let enCurso = 0;
  let maxEnCurso = 0;
  const cola = Array.isArray(respuestas) ? [...respuestas] : [];
  const deps: DependenciasAutoguardado = {
    valores: base(),
    guardar: async (v) => {
      enCurso += 1;
      maxEnCurso = Math.max(maxEnCurso, enCurso);
      guardados.push(structuredClone(v));
      try {
        if (typeof respuestas === "function") return await respuestas(v);
        return cola.shift() ?? OK;
      } finally {
        enCurso -= 1;
      }
    },
    alCambiar: (i) => indicadores.push(i),
    programar: reloj.programar,
    cancelar: reloj.cancelar,
  };
  const auto = crearAutoguardado(deps);
  return { auto, reloj, guardados, indicadores, maximoSimultaneos: () => maxEnCurso };
}

describe("P3: se guarda 500 ms después de la última tecla", () => {
  it("no guarda antes de los 500 ms; a los 500 guarda lo último y el indicador dice la hora", async () => {
    const t = armar();
    t.auto.cambio(con({ kmFin: "84.4" }));
    await t.reloj.avanzar(499);
    expect(t.guardados).toHaveLength(0);
    expect(t.auto.indicador).toMatchObject({ estado: "guardando", visible: "Guardando…" });
    await t.reloj.avanzar(1);
    expect(t.guardados).toHaveLength(1);
    expect(t.guardados[0]?.kmFin).toBe("84.4");
    expect(t.auto.indicador).toEqual({ estado: "guardado", visible: "Guardado en este equipo a las 14:32", anuncio: "Borrador guardado en este equipo.", hora: "14:32" });
  });

  it("cada tecla reinicia el plazo: varias seguidas son un solo guardado, con el último valor", async () => {
    const t = armar();
    t.auto.cambio(con({ kmFin: "8" }));
    await t.reloj.avanzar(300);
    t.auto.cambio(con({ kmFin: "84" }));
    await t.reloj.avanzar(300);
    t.auto.cambio(con({ kmFin: "844" }));
    await t.reloj.avanzar(499);
    expect(t.guardados).toHaveLength(0);
    await t.reloj.avanzar(1);
    expect(t.guardados.map((v) => v.kmFin)).toEqual(["844"]);
  });

  it("antes de escribir nada el indicador está vacío", () => {
    expect(armar().auto.indicador).toEqual({ estado: "inicial", visible: "", anuncio: "", hora: null });
  });

  it("no guarda lo que no cambió (valores iguales al último guardado o a los iniciales)", async () => {
    const t = armar();
    t.auto.cambio(base());
    await t.reloj.avanzar(1000);
    expect(t.guardados).toHaveLength(0);
    expect(t.auto.indicador.estado).toBe("inicial");
    expect(t.reloj.pendientes()).toBe(0);
  });

  it("si la persona vuelve al valor que ya estaba guardado antes de que venza el plazo, no se escribe", async () => {
    const t = armar();
    t.auto.cambio(con({ kmFin: "8" }));
    await t.reloj.avanzar(100);
    t.auto.cambio(base());
    await t.reloj.avanzar(1000);
    expect(t.guardados).toHaveLength(0);
    expect(t.auto.indicador.estado).toBe("inicial");
  });
});

describe("P3: y al salir del campo", () => {
  it("al salir del campo guarda en el acto (sin esperar los 500 ms) y cancela el plazo", async () => {
    const t = armar();
    t.auto.cambio(con({ kmFin: "84.400" }));
    const r = await t.auto.alSalirDelCampo(con({ kmFin: "84.400" }));
    expect(r).toEqual(OK);
    expect(t.guardados).toHaveLength(1);
    expect(t.reloj.pendientes()).toBe(0);
    await t.reloj.avanzar(1000);
    expect(t.guardados).toHaveLength(1);
  });

  it("al salir de un campo que no cambió no guarda y devuelve null", async () => {
    const t = armar();
    expect(await t.auto.alSalirDelCampo(base())).toBeNull();
    expect(t.guardados).toHaveLength(0);
  });

  it("tras un guardado, salir de un campo sin cambios tampoco vuelve a guardar", async () => {
    const t = armar();
    await t.auto.alSalirDelCampo(con({ kmFin: "84.400" }));
    expect(await t.auto.alSalirDelCampo(con({ kmFin: "84.400" }))).toBeNull();
    expect(t.guardados).toHaveLength(1);
  });
});

describe("guardados de a uno (la cola del estado de la aplicación depende de esto)", () => {
  it("si se escribe mientras se está guardando, se guarda después con el último valor y nunca dos a la vez", async () => {
    let liberar: (() => void) | null = null;
    const t = armar(async () => {
      if (liberar === null && t.guardados.length === 1) await new Promise<void>((r) => (liberar = r));
      return OK;
    });
    t.auto.cambio(con({ kmFin: "1" }));
    await t.reloj.avanzar(500); // empieza a guardar «1» y queda esperando
    expect(t.guardados).toHaveLength(1);
    t.auto.cambio(con({ kmFin: "12" }));
    await t.reloj.avanzar(500); // vence el plazo mientras el primero sigue en curso
    expect(t.guardados).toHaveLength(1);
    (liberar as (() => void) | null)?.();
    await esperar();
    await esperar();
    expect(t.guardados.map((v) => v.kmFin)).toEqual(["1", "12"]);
    expect(t.maximoSimultaneos()).toBe(1);
  });
});

describe("no se pierde lo escrito mientras se guarda", () => {
  it("si se vuelve al valor de antes mientras se guarda otro, el valor de ahora también se guarda después", async () => {
    let liberar: (() => void) | null = null;
    const t = armar(async () => {
      if (liberar === null) await new Promise<void>((r) => (liberar = r));
      return OK;
    });
    t.auto.cambio(con({ kmFin: "1" }));
    await t.reloj.avanzar(500); // guarda «1» y queda esperando
    t.auto.cambio(base()); // la persona borra lo que escribió: es distinto de lo que se está guardando
    await t.reloj.avanzar(500);
    (liberar as (() => void) | null)?.();
    await esperar();
    await esperar();
    expect(t.guardados.map((v) => v.kmFin)).toEqual(["1", ""]);
  });
});

describe("5.15: el indicador y lo que se anuncia", () => {
  it("el anuncio al lector solo cambia al cambiar de estado, no en cada guardado", async () => {
    const t = armar([OK, { ...OK, hora: "14:33" }, { ...OK, hora: "14:34" }]);
    await t.auto.alSalirDelCampo(con({ kmFin: "1" }));
    await t.auto.alSalirDelCampo(con({ kmFin: "12" }));
    await t.auto.alSalirDelCampo(con({ kmFin: "123" }));
    expect(t.auto.indicador.visible).toBe("Guardado en este equipo a las 14:34");
    const anuncios = new Set(t.indicadores.map((i) => i.anuncio).filter((a) => a !== ""));
    expect([...anuncios]).toEqual(["Borrador guardado en este equipo."]);
  });

  it("D10: si falla la escritura, el indicador lo dice, lo escrito no se pierde y el anuncio cambia una sola vez", async () => {
    const t = armar([{ ok: false, tipo: "escritura", errores: errorGeneralParte(ERRORES.noPudoGuardarElParte) }, { ok: false, tipo: "escritura", errores: errorGeneralParte(ERRORES.noPudoGuardarElParte) }]);
    const r = await t.auto.alSalirDelCampo(con({ kmFin: "1" }));
    expect(r).toMatchObject({ ok: false, tipo: "escritura" });
    expect(t.auto.indicador).toEqual({ estado: "error", visible: "No se pudo guardar en este equipo. Lo escrito sigue en pantalla; no cierre la pestaña.", anuncio: "No se pudo guardar en este equipo. Lo escrito sigue en pantalla; no cierre la pestaña.", hora: null });
    await t.auto.alSalirDelCampo(con({ kmFin: "12" }));
    expect(t.indicadores.filter((i) => i.estado === "error" && i.anuncio !== "").length).toBeGreaterThan(0);
    expect(new Set(t.indicadores.filter((i) => i.estado === "error").map((i) => i.anuncio)).size).toBe(1);
  });

  it("después de un error, el siguiente guardado exitoso anuncia que se recuperó", async () => {
    const t = armar([{ ok: false, tipo: "escritura", errores: errorGeneralParte(ERRORES.noPudoGuardarElParte) }]);
    await t.auto.alSalirDelCampo(con({ kmFin: "1" }));
    await t.auto.alSalirDelCampo(con({ kmFin: "12" }));
    expect(t.auto.indicador).toMatchObject({ estado: "guardado", anuncio: "Borrador guardado de nuevo en este equipo.", hora: "14:32" });
    expect(t.guardados.map((v) => v.kmFin)).toEqual(["1", "12"]);
  });

  it("tras recuperarse, los guardados siguientes no vuelven a anunciar nada (el anuncio queda en «Borrador guardado de nuevo»)", async () => {
    const t = armar([{ ok: false, tipo: "escritura", errores: errorGeneralParte(ERRORES.noPudoGuardarElParte) }]);
    await t.auto.alSalirDelCampo(con({ kmFin: "1" }));
    await t.auto.alSalirDelCampo(con({ kmFin: "12" }));
    await t.auto.alSalirDelCampo(con({ kmFin: "123" }));
    expect(t.auto.indicador).toMatchObject({ estado: "guardado", anuncio: "Borrador guardado de nuevo en este equipo." });
    const distintos = [...new Set(t.indicadores.map((i) => i.anuncio).filter((x) => x !== ""))];
    expect(distintos).toEqual(["No se pudo guardar en este equipo. Lo escrito sigue en pantalla; no cierre la pestaña.", "Borrador guardado de nuevo en este equipo."]);
  });

  it("tras un error, `vaciar` (antes de enviar) reintenta con lo que había fallado, aunque no se le pasen los valores", async () => {
    const t = armar([{ ok: false, tipo: "escritura", errores: errorGeneralParte(ERRORES.noPudoGuardarElParte) }]);
    await t.auto.alSalirDelCampo(con({ kmFin: "1" }));
    expect(await t.auto.vaciar()).toEqual(OK);
    expect(t.guardados.map((v) => v.kmFin)).toEqual(["1", "1"]);
  });

  it("tras un error, aunque no cambie nada más, se reintenta al salir del campo (lo que falló sigue pendiente)", async () => {
    const t = armar([{ ok: false, tipo: "escritura", errores: errorGeneralParte(ERRORES.noPudoGuardarElParte) }]);
    await t.auto.alSalirDelCampo(con({ kmFin: "1" }));
    const r = await t.auto.alSalirDelCampo(con({ kmFin: "1" }));
    expect(r).toEqual(OK);
    expect(t.guardados.map((v) => v.kmFin)).toEqual(["1", "1"]);
  });

  it("si el dominio rechaza el parte (por ejemplo, la unidad pasó a fuera de servicio), el indicador muestra el mensaje de la regla", async () => {
    const mensaje = "La unidad está fuera de servicio desde el 13/11/2026 (En taller). Pida al encargado que la ponga de nuevo en servicio.";
    const t = armar([{ ok: false, tipo: "regla", errores: errorGeneralParte(mensaje) }]);
    await t.auto.alSalirDelCampo(con({ kmFin: "1" }));
    expect(t.auto.indicador).toEqual({ estado: "error", visible: mensaje, anuncio: mensaje, hora: null });
  });

  it("P3: un dato con formato inválido no se guarda: el indicador pide corregir los campos marcados y devuelve los errores", async () => {
    const errores = { porCampo: { kmFin: "Escriba el kilometraje solo con números." }, lista: [{ campo: "kmFin" as const, mensaje: "Escriba el kilometraje solo con números." }], general: null, titulo: "Revise 1 dato para enviar el parte" };
    const t = armar([{ ok: false, tipo: "campos", errores }]);
    const r = await t.auto.alSalirDelCampo(con({ kmFin: "abc" }));
    expect(r).toEqual({ ok: false, tipo: "campos", errores });
    expect(t.auto.indicador).toEqual({ estado: "campos", visible: "Sin guardar: corrija los campos marcados.", anuncio: "Hay datos que no se pueden guardar: revise los campos marcados.", hora: null });
    await t.auto.alSalirDelCampo(con({ kmFin: "84.400" }));
    expect(t.auto.indicador).toMatchObject({ estado: "guardado", anuncio: "Borrador guardado en este equipo." });
  });

  it("un guardado sin escritura (todavía no hay nada que guardar) no dice «Guardado»", async () => {
    const t = armar([{ ok: true, parteId: null, hora: null, sinCambios: true }]);
    await t.auto.alSalirDelCampo(con({ kmFin: "1" }));
    expect(t.auto.indicador.estado).toBe("inicial");
  });
});

describe("antes de enviar, de salir o de descartar", () => {
  it("vaciar guarda en el acto lo que estaba esperando el plazo", async () => {
    const t = armar();
    t.auto.cambio(con({ kmFin: "84.400" }));
    const r = await t.auto.vaciar();
    expect(r).toEqual(OK);
    expect(t.guardados.map((v) => v.kmFin)).toEqual(["84.400"]);
    await t.reloj.avanzar(1000);
    expect(t.guardados).toHaveLength(1);
  });

  it("vaciar sin nada pendiente devuelve null y no guarda", async () => {
    const t = armar();
    expect(await t.auto.vaciar()).toBeNull();
    expect(t.guardados).toHaveLength(0);
  });

  it("vaciar espera al guardado que ya está en curso", async () => {
    let liberar: (() => void) | null = null;
    const t = armar(async () => {
      await new Promise<void>((r) => (liberar = r));
      return OK;
    });
    t.auto.cambio(con({ kmFin: "1" }));
    await t.reloj.avanzar(500);
    let termino = false;
    const espera = t.auto.vaciar().then((r) => {
      termino = true;
      return r;
    });
    await esperar();
    expect(termino).toBe(false);
    (liberar as (() => void) | null)?.();
    expect(await espera).toEqual(OK);
  });

  it("reiniciar (descartar el borrador) cancela lo pendiente y la nueva base son los valores que se le pasan", async () => {
    const t = armar();
    t.auto.cambio(con({ kmFin: "1" }));
    t.auto.reiniciar(base());
    await t.reloj.avanzar(1000);
    expect(t.guardados).toHaveLength(0);
    expect(t.auto.indicador).toEqual({ estado: "inicial", visible: "", anuncio: "", hora: null });
    // La nueva base es la inicial: escribir lo mismo no guarda.
    t.auto.cambio(base());
    await t.reloj.avanzar(1000);
    expect(t.guardados).toHaveLength(0);
  });

  it("reiniciar mientras se guarda: el resultado que llega tarde no pisa el indicador ni la base", async () => {
    let liberar: (() => void) | null = null;
    const t = armar(async () => {
      await new Promise<void>((r) => (liberar = r));
      return OK;
    });
    t.auto.cambio(con({ kmFin: "1" }));
    await t.reloj.avanzar(500);
    t.auto.reiniciar(base());
    (liberar as (() => void) | null)?.();
    await esperar();
    await esperar();
    expect(t.auto.indicador.estado).toBe("inicial");
    t.auto.cambio(con({ kmFin: "1" })); // distinto de la base nueva: se guarda
    await t.reloj.avanzar(500);
    expect(t.guardados).toHaveLength(2);
  });

  it("cerrar: no se guarda nada más", async () => {
    const t = armar();
    t.auto.cambio(con({ kmFin: "1" }));
    t.auto.cerrar();
    await t.reloj.avanzar(1000);
    expect(t.guardados).toHaveLength(0);
    t.auto.cambio(con({ kmFin: "12" }));
    await t.reloj.avanzar(1000);
    expect(t.guardados).toHaveLength(0);
  });
});
