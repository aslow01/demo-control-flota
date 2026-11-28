// «Ver como» sin el trozo del conductor: las opciones del diálogo (livianas, viajan con el marco) y las marcas «Para probar: …», que llegan después con
// `estado/conductor.ts` (se baja al abrir el diálogo). Con el ejemplo del generador (hoy 18/11/2026): ZK 214 BD es de c-07 y tiene el seguro vencido.
import { describe, expect, it, vi } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import type { Estado, Unidad } from "../src/lib/dominio/tipos.ts";
import { conductoresParaProbar, inicioDelConductor, leerInicioDelConductor, leerMisPartes, leerSugerenciasDeVerComo } from "../src/lib/estado/conductor.ts";
import { PLAZO_DE_SUGERENCIAS_MS, conSugerencias, opcionesParaElegirConductor, unidadDeHoy, type SugerenciasDeVerComo } from "../src/lib/estado/conductor-opciones.ts";
import { PLAZO_DE_DESCARGA_MS } from "../src/lib/descarga.ts";
import type { LecturaDeApp } from "../src/lib/estado/lectura.ts";
import { conductor, estadoVacio, unidad } from "./ayuda.ts";

// Armar la pantalla «Hoy» de cada conductor es lento (unos 20 ms cada una, y acá se arman de a decenas): con la máquina cargada una prueba pasa de los 5 s de siempre.
vi.setConfig({ testTimeout: 30_000 });

const H = "2026-11-18";
const e: Estado = generar(SEMILLA_POR_DEFECTO, H);
const alertas = calcularAlertas(e, H);

/**
 * El ejemplo con dos unidades para c-07: la suya (ZK 214 BD, Int. 07, con el seguro vencido), puesta primera en la lista, y la de c-01 (ZYN 469, Int. 01, apta), que pasa a ser suya.
 * «Hoy» le muestra la de menor interno: ZYN 469.
 */
const DOS_UNIDADES: Estado = (() => {
  const u07 = e.unidades.find((u) => u.conductorId === "c-07");
  const u01 = e.unidades.find((u) => u.conductorId === "c-01");
  if (u07 === undefined || u01 === undefined || u07.interno <= u01.interno) throw new Error("el ejemplo ya no tiene las unidades de c-07 (Int. 07) y c-01 (Int. 01)");
  return { ...e, unidades: [u07, ...e.unidades.filter((u) => u.id !== u07.id).map((u) => (u.id === u01.id ? { ...u, conductorId: "c-07" } : u))] };
})();

/** Lo que las funciones `leer…` le piden a la aplicación: alcanza con un doble. */
function lectura(cambios: Partial<LecturaDeApp> = {}): LecturaDeApp {
  return { estado: e, alertas, hoy: H, ruta: { tipo: "inicio" }, perfil: { tipo: "encargado" }, ...cambios };
}
const SIN_ARRANCAR = lectura({ estado: null, alertas: null });

describe("opcionesParaElegirConductor", () => {
  const opciones = opcionesParaElegirConductor(e, H);

  it("son los conductores activos del ejemplo, en su orden, con la patente de su unidad (o `null`) y si su licencia ampara hoy", () => {
    expect(opciones.map((o) => o.id)).toEqual(e.conductores.filter((c) => c.activo).map((c) => c.id));
    expect(opciones.find((o) => o.id === "c-01")).toEqual({ id: "c-01", nombre: "Andrés Echegaray", unidad: "ZYN 469", licenciaVigente: true });
    expect(opciones.find((o) => o.id === "c-07")?.unidad).toBe("ZK 214 BD");
    const sinUnidad = e.conductores.filter((c) => c.activo && !e.unidades.some((u) => u.conductorId === c.id));
    expect(sinUnidad.length).toBeGreaterThan(0);
    for (const c of sinUnidad) expect(opciones.find((o) => o.id === c.id)?.unidad, c.id).toBeNull();
  });

  it("la licencia que no ampara hoy se dice (L1): son los mismos conductores que el centro de alertas cuenta sin licencia", () => {
    expect(opciones.filter((o) => !o.licenciaVigente).map((o) => o.id)).toEqual(alertas.resumen.conductoresSinLicencia.map((c) => c.conductorId));
  });
});

// Con dos unidades para la misma persona hay una sola manera de decidir cuál es «la suya»: la que le muestra la pantalla «Hoy». La usan las opciones de «Ver como», las marcas
// «Para probar» y la entrada al recorrido de Inicio, para que el diálogo, el marco y la pantalla nunca nombren patentes distintas.
describe("unidadDeHoy", () => {
  const C = "c-x";
  const estadoCon = (...unidades: Unidad[]): Estado => estadoVacio({ conductores: [conductor({ id: C })], unidades });

  it("es la unidad asignada; sin ninguna, con la de otra persona o con la suya de baja, no hay", () => {
    const suya = unidad({ id: "u-a", conductorId: C });
    expect(unidadDeHoy(estadoCon(suya), C)).toBe(suya);
    expect(unidadDeHoy(estadoCon(), C)).toBeUndefined();
    expect(unidadDeHoy(estadoCon(unidad({ id: "u-b", conductorId: "c-otro" })), C)).toBeUndefined();
    expect(unidadDeHoy(estadoCon(unidad({ id: "u-a", conductorId: C, estado: { tipo: "baja", desde: H, motivo: "Vendida" } })), C)).toBeUndefined();
  });

  it("con dos unidades es la de menor interno y, a igual interno, la de menor patente, estén en el orden que estén; una de baja no cuenta", () => {
    const interno9 = unidad({ id: "u-9", patente: "ZA111AA", interno: 9, conductorId: C });
    const interno3 = unidad({ id: "u-3", patente: "ZZ999ZZ", interno: 3, conductorId: C });
    expect(unidadDeHoy(estadoCon(interno9, interno3), C)).toBe(interno3);
    expect(unidadDeHoy(estadoCon(interno3, interno9), C)).toBe(interno3);

    const mismoInterno = unidad({ id: "u-3b", patente: "ZB222BB", interno: 3, conductorId: C });
    expect(unidadDeHoy(estadoCon(interno3, mismoInterno), C)).toBe(mismoInterno);
    expect(unidadDeHoy(estadoCon(mismoInterno, interno3), C)).toBe(mismoInterno);

    const deBaja = unidad({ id: "u-1", patente: "ZC333CC", interno: 1, conductorId: C, estado: { tipo: "baja", desde: H, motivo: "Vendida" } });
    expect(unidadDeHoy(estadoCon(deBaja, interno9, interno3), C)).toBe(interno3);
  });

  it("es la unidad que muestra la pantalla «Hoy»: en el ejemplo, con dos unidades para la misma persona y para quien se quedó sin ninguna", () => {
    // Armar «Hoy» es lento: alcanza con quien tiene una unidad, quien tiene dos (c-07), quien se quedó sin la suya (c-01) y alguien de relevo, sin unidad.
    const deRelevo = e.conductores.find((c) => c.activo && !e.unidades.some((u) => u.conductorId === c.id));
    if (deRelevo === undefined) throw new Error("el ejemplo ya no tiene conductores sin unidad");
    const casos: [Estado, string][] = [[e, "c-01"], [e, "c-07"], [e, deRelevo.id], [DOS_UNIDADES, "c-07"], [DOS_UNIDADES, "c-01"]];
    for (const [estado, conductorId] of casos) {
      const hoy = inicioDelConductor(estado, estado === e ? alertas : calcularAlertas(estado, H), H, { tipo: "conductor", conductorId });
      expect(hoy, conductorId).not.toBeNull();
      expect(unidadDeHoy(estado, conductorId)?.id ?? null, conductorId).toBe(hoy?.unidad?.unidadId ?? null);
    }
    expect(unidadDeHoy(DOS_UNIDADES, "c-07")?.patente).toBe("ZYN469");
    expect(unidadDeHoy(DOS_UNIDADES, "c-01")).toBeUndefined();
  });
});

describe("opcionesParaElegirConductor con dos unidades para la misma persona", () => {
  it("nombra la unidad que esa persona ve en «Hoy» (la de menor interno), no la primera de la lista", () => {
    const hoy = inicioDelConductor(DOS_UNIDADES, calcularAlertas(DOS_UNIDADES, H), H, { tipo: "conductor", conductorId: "c-07" });
    expect(hoy?.unidad?.patenteTexto).toBe("ZYN 469");
    expect(opcionesParaElegirConductor(DOS_UNIDADES, H).find((o) => o.id === "c-07")?.unidad).toBe("ZYN 469");
  });
});

describe("conSugerencias", () => {
  const opciones = opcionesParaElegirConductor(e, H);

  it("sin sugerencias (el trozo todavía no bajó, o no bajó) deja las mismas opciones, en el mismo orden y sin ninguna marca", () => {
    const sin = conSugerencias(opciones, null);
    expect(sin).toEqual(opciones.map((o) => ({ ...o, paraProbar: null })));
    expect(conSugerencias(opciones, new Map())).toEqual(sin);
  });

  it("con sugerencias marca solo a esos conductores y no cambia el orden ni los demás datos", () => {
    const sugerencias: SugerenciasDeVerComo = new Map([["c-07", { etiqueta: "Para probar: algo", sinLicencia: false }]]);
    const con = conSugerencias(opciones, sugerencias);
    expect(con.map((o) => o.id)).toEqual(opciones.map((o) => o.id));
    expect(con.filter((o) => o.paraProbar !== null)).toEqual([{ ...opciones.find((o) => o.id === "c-07"), paraProbar: { etiqueta: "Para probar: algo", sinLicencia: false } }]);
  });

  it("una sugerencia de alguien que no está entre las opciones no agrega a nadie", () => {
    expect(conSugerencias(opciones, new Map([["no-existe", { etiqueta: "Para probar: x", sinLicencia: false }]]))).toEqual(conSugerencias(opciones, null));
  });

  it("no cambia lo que recibe", () => {
    const copia = structuredClone(opciones);
    conSugerencias(opciones, new Map([["c-07", { etiqueta: "x", sinLicencia: true }]]));
    expect(opciones).toEqual(copia);
  });
});

describe("leerSugerenciasDeVerComo (M1, desde el trozo del conductor)", () => {
  it("antes de terminar el arranque no hay ninguna", () => {
    expect(leerSugerenciasDeVerComo(SIN_ARRANCAR).size).toBe(0);
  });

  it("con el ejemplo son los de `conductoresParaProbar`, por conductor, con su marca; solo el caso «sin licencia» lleva `sinLicencia`", () => {
    const sugerencias = leerSugerenciasDeVerComo(lectura());
    const esperados = conductoresParaProbar(e, alertas, H);
    expect([...sugerencias.keys()]).toEqual(esperados.map((s) => s.conductorId));
    for (const s of esperados) expect(sugerencias.get(s.conductorId)).toEqual({ etiqueta: s.etiqueta, sinLicencia: s.caso === "sin-licencia" });
    expect(sugerencias.get("c-07")?.etiqueta).toBe("Para probar: la unidad tiene la documentación vencida");
    expect([...sugerencias.values()].filter((s) => s.sinLicencia)).toHaveLength(1);
  });

  it("no depende del perfil: el diálogo sugiere lo mismo se mire como se mire", () => {
    expect(leerSugerenciasDeVerComo(lectura({ perfil: { tipo: "conductor", conductorId: "c-01" } }))).toEqual(leerSugerenciasDeVerComo(lectura()));
  });

  it("sumadas a las opciones, el diálogo muestra primero a quién elegir para cada caso: cuatro marcas en el ejemplo", () => {
    const opciones = conSugerencias(opcionesParaElegirConductor(e, H), leerSugerenciasDeVerComo(lectura()));
    expect(opciones.filter((o) => o.paraProbar !== null).map((o) => o.paraProbar?.etiqueta)).toHaveLength(4);
    expect(opciones.find((o) => o.id === "c-07")?.paraProbar?.etiqueta).toBe("Para probar: la unidad tiene la documentación vencida");
  });
});

describe("leerInicioDelConductor y leerMisPartes con un doble de la aplicación", () => {
  it("antes de terminar el arranque no hay nada", () => {
    expect(leerInicioDelConductor(SIN_ARRANCAR)).toBeNull();
    expect(leerMisPartes(SIN_ARRANCAR)).toBeNull();
    expect(leerInicioDelConductor(lectura({ estado: null, alertas: null, perfil: { tipo: "conductor", conductorId: "c-01" } }))).toBeNull();
  });

  it("con el perfil Encargado tampoco; con Conductor, su unidad (o la que eligió) y sus partes", () => {
    expect(leerInicioDelConductor(lectura())).toBeNull();
    expect(leerMisPartes(lectura())).toBeNull();
    const c07 = lectura({ perfil: { tipo: "conductor", conductorId: "c-07" } });
    expect(leerInicioDelConductor(c07)?.unidad?.patenteTexto).toBe("ZK 214 BD");
    expect(leerInicioDelConductor(c07, "u-01")?.unidad?.patenteTexto).toBe("ZYN 469");
    expect(leerMisPartes(c07)?.conductor).toBe(e.conductores.find((c) => c.id === "c-07")?.nombre);
  });
});

describe("el plazo de las sugerencias", () => {
  it("es corto: «Ver como» no espera las sugerencias tanto como una pantalla (son un agregado, el diálogo sirve sin ellas)", () => {
    expect(PLAZO_DE_SUGERENCIAS_MS).toBeGreaterThanOrEqual(1_000);
    expect(PLAZO_DE_SUGERENCIAS_MS).toBeLessThanOrEqual(3_000);
    expect(PLAZO_DE_SUGERENCIAS_MS).toBeLessThan(PLAZO_DE_DESCARGA_MS);
  });
});
