// La entrada al recorrido de Inicio («Probar como conductor») decidida con lo que ya viaja con el marco (`estado/recorrido.ts`), sin armar el inicio de cada conductor.
// Se la compara con lo que la pantalla «Hoy» de cada conductor dice de verdad (`loQueDiceHoy`, que sí arma ese inicio y no comparte código con el cálculo liviano). Sobre el ejemplo
// del generador y sus variantes los dos tienen que decir lo mismo.
// Con el ejemplo (hoy 18/11/2026): ZK 214 BD (Int. 07) es de Tamara Olivera (c-07) y tiene el seguro vencido desde el 17/11; ZYN 469 (Int. 01) es de c-01 y puede salir.
import { describe, expect, it, vi } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import type { Documento, Estado, Parte, Unidad } from "../src/lib/dominio/tipos.ts";
import { inicioDelConductor } from "../src/lib/estado/conductor.ts";
import type { LecturaDeApp } from "../src/lib/estado/lectura.ts";
import { conductorDelRecorrido, leerEntradaAlRecorrido } from "../src/lib/estado/recorrido.ts";
import { flotaDePrueba } from "./ayuda.ts";

// Armar la pantalla «Hoy» de cada conductor es lento (unos 20 ms cada una, y acá se arman de a decenas): con la máquina cargada una prueba pasa de los 5 s de siempre.
vi.setConfig({ testTimeout: 30_000 });

const H = "2026-11-18";
const e: Estado = generar(SEMILLA_POR_DEFECTO, H);

type Entrada = { conductorId: string } | null;

/** El cálculo completo arma el inicio de cada conductor (es lento) y varias pruebas miran las mismas variantes: cada resultado se calcula una vez. */
function unaVez(calcular: (estado: Estado, hoy: string) => Entrada): (estado: Estado, hoy?: string) => Entrada {
  const hechos = new WeakMap<Estado, Map<string, Entrada>>();
  return (estado, hoy = H) => {
    const delEstado = hechos.get(estado) ?? new Map<string, Entrada>();
    hechos.set(estado, delEstado);
    if (!delEstado.has(hoy)) delEstado.set(hoy, calcular(estado, hoy));
    return delEstado.get(hoy) ?? null;
  };
}

/**
 * La franja promete «vea cómo un seguro vencido impide cargar el parte»: el primer conductor activo cuya pantalla «Hoy» dice exactamente eso
 * («El seguro de ZK 214 BD venció el 17/11/2026. La unidad no puede salir.»). Es lo que el visitante va a leer al elegirlo: la comparación más directa.
 */
const loQueDiceHoy = unaVez((estado, hoy) => {
  const alertas = calcularAlertas(estado, hoy);
  for (const c of estado.conductores) {
    if (!c.activo) continue;
    const dia = inicioDelConductor(estado, alertas, hoy, { tipo: "conductor", conductorId: c.id })?.hoyEstado;
    if (dia?.tipo === "no-puede-salir" && /El seguro de \S[^.]* venció el /.test(dia.renglon1)) return { conductorId: c.id };
  }
  return null;
});

function unidadDe(estado: Estado, conductorId: string): Unidad {
  const u = estado.unidades.find((x) => x.conductorId === conductorId && x.estado.tipo !== "baja");
  if (u === undefined) throw new Error(`${conductorId} no tiene unidad`);
  return u;
}

/** Un parte de `unidad` para `fecha`, con la forma de los del ejemplo (se copia uno cerrado y se le cambia lo que hace falta). */
function parteComo(estado: Estado, unidad: Unidad, fecha: string, cambios: Partial<Parte>): Parte {
  const modelo = estado.partes.find((p) => p.estado === "enviado" && p.kmFin !== null);
  if (modelo === undefined) throw new Error("el ejemplo no tiene partes cerrados");
  return { ...modelo, id: `pt-prueba-${fecha}-${cambios.estado ?? "x"}`, unidadId: unidad.id, conductorId: unidad.conductorId, fecha, ...cambios };
}

const C07 = "c-07";
const u07 = unidadDe(e, C07);
const u01 = unidadDe(e, "c-01");
const seguroVencido = e.documentos.find((d) => d.tipo === "seguro" && d.titular.id === u07.id && d.vence < H);
if (seguroVencido === undefined) throw new Error("el ejemplo ya no tiene el seguro vencido de la unidad de c-07");
/** El seguro de la unidad de c-07 renovado como lo hace la aplicación: un documento nuevo, y el vencido sigue en el historial. */
const renovacion: Documento = { ...seguroVencido, id: "d-prueba-renovacion", vence: "2027-12-31", reemplazaA: seguroVencido.id };
const sinRevisionTecnica = (estado: Estado, unidadId: string): Documento[] => estado.documentos.filter((d) => !(d.tipo === "revision-tecnica" && d.titular.id === unidadId));

/** Las variantes del ejemplo: cada una cambia una sola cosa de la unidad o del conductor del recorrido. */
const VARIANTES: [string, Estado][] = [
  ["el ejemplo tal cual", e],
  ["el seguro renovado", { ...e, documentos: [...e.documentos, renovacion] }],
  ["el seguro corregido (el mismo documento con otra fecha)", { ...e, documentos: e.documentos.map((d) => (d.id === seguroVencido.id ? { ...d, vence: "2027-12-31" } : d)) }],
  ["todo lo vencido con otra fecha", { ...e, documentos: e.documentos.map((d) => (d.vence < H ? { ...d, vence: "2027-12-31" } : d)) }],
  ["sin ningún seguro (faltan, no vencieron)", { ...e, documentos: e.documentos.filter((d) => d.tipo !== "seguro") }],
  ["el seguro vencido y, además, sin revisión técnica", { ...e, documentos: sinRevisionTecnica(e, u07.id) }],
  ["el seguro renovado, pero falta la revisión técnica (el vencido sigue en el historial)", { ...e, documentos: [...sinRevisionTecnica(e, u07.id), renovacion] }],
  ["el conductor sin licencia", { ...e, documentos: e.documentos.filter((d) => !(d.tipo === "licencia" && d.titular.id === C07)) }],
  ["el conductor con la licencia vencida", { ...e, documentos: e.documentos.map((d) => (d.tipo === "licencia" && d.titular.id === C07 ? { ...d, vence: "2026-11-01" } : d)) }],
  ["el conductor inactivo", { ...e, conductores: e.conductores.map((c) => (c.id === C07 ? { ...c, activo: false } : c)) }],
  ["la unidad fuera de servicio", { ...e, unidades: e.unidades.map((u) => (u.id === u07.id ? { ...u, estado: { tipo: "fuera-de-servicio", desde: H, motivo: "Taller", origen: "manual", novedadIds: [] } } : u)) }],
  ["la unidad de baja", { ...e, unidades: e.unidades.map((u) => (u.id === u07.id ? { ...u, estado: { tipo: "baja", desde: H, motivo: "Vendida" } } : u)) }],
  ["la unidad sin conductor", { ...e, unidades: e.unidades.map((u) => (u.id === u07.id ? { ...u, conductorId: null } : u)) }],
  ["la unidad con un proyecto que no existe", { ...e, unidades: e.unidades.map((u) => (u.id === u07.id ? { ...u, proyectoId: "no-existe" } : u)) }],
  ["un parte de ayer sin cerrar (en uso)", { ...e, partes: [...e.partes, parteComo(e, u07, "2026-11-17", { estado: "en-uso", kmFin: null, enviado: null })] }],
  ["un borrador de hoy", { ...e, partes: [...e.partes, parteComo(e, u07, H, { estado: "borrador", kmFin: null, enviado: null, revisado: null })] }],
  ["el parte de hoy en uso", { ...e, partes: [...e.partes, parteComo(e, u07, H, { estado: "en-uso", kmFin: null, enviado: null })] }],
  ["el parte de hoy cerrado", { ...e, partes: [...e.partes, parteComo(e, u07, H, { estado: "enviado" })] }],
  ["el parte de hoy ilegible (sin estado)", { ...e, partes: [...e.partes, { ...parteComo(e, u07, H, {}), estado: "roto" } as unknown as Parte] }],
  // Dos unidades para el mismo conductor: «Hoy» muestra la de menor interno (ZYN 469, Int. 01), aunque en la lista esté antes la del seguro vencido.
  [
    "el conductor con otra unidad de menor interno, apta: «Hoy» muestra esa",
    { ...e, unidades: [u07, ...e.unidades.filter((u) => u.id !== u07.id).map((u) => (u.id === u01.id ? { ...u, conductorId: C07 } : u))] },
  ],
  [
    "el conductor con otra unidad de menor interno, bloqueada por otro documento: «Hoy» no habla del seguro",
    { ...e, unidades: [u07, ...e.unidades.filter((u) => u.id !== u07.id).map((u) => (u.id === u01.id ? { ...u, conductorId: C07 } : u))], documentos: sinRevisionTecnica(e, u01.id) },
  ],
  ["sin conductores", { ...e, conductores: [] }],
  ["sin unidades", { ...e, unidades: [] }],
  ["una flota sana", flotaDePrueba()],
];
const variante = (nombre: string): Estado => {
  const v = VARIANTES.find(([n]) => n === nombre);
  if (v === undefined) throw new Error(`no hay una variante «${nombre}»`);
  return v[1];
};

describe("conductorDelRecorrido", () => {
  it("con el ejemplo es Tamara Olivera (c-07): su unidad tiene el seguro vencido y su parte de hoy está bloqueado por eso", () => {
    expect(conductorDelRecorrido(e, H)).toEqual({ conductorId: C07 });
    expect(loQueDiceHoy(e)).toEqual({ conductorId: C07 });
  });

  it.each(VARIANTES)("coincide con lo que dice «Hoy»: %s", (_nombre, estado) => {
    expect(conductorDelRecorrido(estado, H)).toEqual(loQueDiceHoy(estado));
  });

  it("las variantes cubren los dos resultados (si no, la comparación no probaría nada)", () => {
    const resultados = VARIANTES.map(([, estado]) => loQueDiceHoy(estado));
    expect(resultados.filter((r) => r !== null).length).toBeGreaterThanOrEqual(4);
    expect(resultados.filter((r) => r === null).length).toBeGreaterThanOrEqual(12);
  });

  it("renovado el seguro, sin licencia, con la unidad fuera de servicio o con el parte de hoy ya enviado, no hay recorrido que ofrecer", () => {
    for (const nombre of ["el seguro renovado", "el conductor sin licencia", "la unidad fuera de servicio", "el parte de hoy en uso", "el parte de hoy cerrado"]) {
      expect(conductorDelRecorrido(variante(nombre), H), nombre).toBeNull();
    }
  });

  it("un parte de ayer sin cerrar o un borrador de hoy no lo quitan: el bloqueo por el documento se muestra antes (17.5)", () => {
    expect(conductorDelRecorrido(variante("un parte de ayer sin cerrar (en uso)"), H)).toEqual({ conductorId: C07 });
    expect(conductorDelRecorrido(variante("un borrador de hoy"), H)).toEqual({ conductorId: C07 });
  });

  it("promete un seguro VENCIDO: renovado el seguro, otro documento que bloquea no deja la franja (aunque el vencido siga en el historial)", () => {
    const estado = variante("el seguro renovado, pero falta la revisión técnica (el vencido sigue en el historial)");
    const dia = inicioDelConductor(estado, calcularAlertas(estado, H), H, { tipo: "conductor", conductorId: C07 })?.hoyEstado;
    expect(dia).toMatchObject({ tipo: "no-puede-salir", renglon1: "Falta cargar la revisión técnica de ZK 214 BD. La unidad no puede salir." });
    expect(conductorDelRecorrido(estado, H)).toBeNull();
    expect(loQueDiceHoy(estado)).toBeNull();
  });

  it("mira la unidad que el conductor ve en «Hoy» (la de menor interno), no la primera de la lista", () => {
    const estado = variante("el conductor con otra unidad de menor interno, bloqueada por otro documento: «Hoy» no habla del seguro");
    const inicio = inicioDelConductor(estado, calcularAlertas(estado, H), H, { tipo: "conductor", conductorId: C07 });
    expect(inicio?.unidad?.patenteTexto).toBe("ZYN 469");
    expect(inicio?.hoyEstado).toMatchObject({ tipo: "no-puede-salir", renglon1: "Falta cargar la revisión técnica de ZYN 469. La unidad no puede salir." });
    expect(conductorDelRecorrido(estado, H)).toBeNull();
    expect(loQueDiceHoy(estado)).toBeNull();
  });

  it("coincide para cada conductor del ejemplo al dejarlo solo, y en otras fechas", () => {
    for (const c of e.conductores) {
      const solo: Estado = { ...e, conductores: [c] };
      expect(conductorDelRecorrido(solo, H), c.id).toEqual(loQueDiceHoy(solo));
    }
    for (const hoy of ["2026-11-10", "2026-11-17", "2026-11-19", "2026-12-18", "2027-06-01"]) {
      expect(conductorDelRecorrido(e, hoy), hoy).toEqual(loQueDiceHoy(e, hoy));
    }
  });

  it("si el seguro vencido es de la unidad de otro conductor, el recorrido es de ese otro", () => {
    const sinC07: Estado = { ...e, conductores: e.conductores.filter((c) => c.id !== C07) };
    const vencido: Estado = { ...sinC07, documentos: sinC07.documentos.map((d) => (d.tipo === "seguro" && d.titular.id === u01.id ? { ...d, vence: "2026-11-10" } : d)) };
    expect(loQueDiceHoy(vencido)).toEqual({ conductorId: "c-01" });
    expect(conductorDelRecorrido(vencido, H)).toEqual({ conductorId: "c-01" });
  });

  it("no cambia el estado que recibe", () => {
    const copia = structuredClone(e);
    conductorDelRecorrido(e, H);
    expect(e).toEqual(copia);
  });
});

describe("leerEntradaAlRecorrido", () => {
  const lectura = (cambios: Partial<LecturaDeApp> = {}): LecturaDeApp => ({ estado: e, alertas: calcularAlertas(e, H), hoy: H, ruta: { tipo: "inicio" }, perfil: { tipo: "encargado" }, ...cambios });

  it("antes de terminar el arranque no hay ninguna; después, la del estado y el día de la aplicación", () => {
    expect(leerEntradaAlRecorrido(lectura({ estado: null, alertas: null }))).toBeNull();
    expect(leerEntradaAlRecorrido(lectura())).toEqual({ conductorId: C07 });
    expect(leerEntradaAlRecorrido(lectura({ hoy: "2026-11-10" }))).toEqual(loQueDiceHoy(e, "2026-11-10"));
  });
});
