import { describe, expect, it } from "vitest";
import { aptitud, resumenDeAptitud } from "../src/lib/dominio/aptitud.ts";
import { rotuloNovedad, textoOrigenNovedad } from "../src/lib/dominio/novedades.ts";
import type { Documento, Estado, Unidad } from "../src/lib/dominio/tipos.ts";
import { PROYECTO_BASE, PROYECTO_PIEDRA, documento, estadoVacio, novedad, unidad } from "./ayuda.ts";

const H = "2026-11-18";

/** Documentos obligatorios al día para una unidad de Piedra Lunar. */
function documentosAlDia(unidadId: string, cambios: Partial<Record<string, string>> = {}): Documento[] {
  return (["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"] as const).map((tipo) =>
    documento({ titular: { tipo: "unidad", id: unidadId }, tipo, vence: cambios[tipo] ?? "2027-12-31" }),
  );
}

function estadoCon(u: Unidad, docs: Documento[], extra: Partial<Estado> = {}): Estado {
  return estadoVacio({ unidades: [u], documentos: docs, ...extra });
}

describe("A1: puede salir", () => {
  it("A1: en servicio, documentos al día y sin novedades críticas -> puede salir", () => {
    const u = unidad();
    const a = aptitud(u, estadoCon(u, documentosAlDia("u1")), H);
    expect(a.puedeSalir).toBe(true);
    expect(a.categoria).toBe("puede-salir");
    expect(a.motivos).toEqual([]);
  });

  it("A1: seguro vencido hace 3 días -> no puede salir, con el motivo", () => {
    const u = unidad();
    const a = aptitud(u, estadoCon(u, documentosAlDia("u1", { seguro: "2026-11-15" })), H);
    expect(a.puedeSalir).toBe(false);
    expect(a.categoria).toBe("no-puede-salir");
    expect(a.motivos.map((m) => m.texto)).toEqual(["Seguro vencido hace 3 días"]);
  });

  it("A1: documento obligatorio faltante -> no puede salir (V12)", () => {
    const u = unidad();
    const docs = documentosAlDia("u1").filter((d) => d.tipo !== "habilitacion-proyecto");
    const a = aptitud(u, estadoCon(u, docs), H);
    expect(a.puedeSalir).toBe(false);
    expect(a.motivos.map((m) => m.texto)).toEqual(["Falta cargar: Habilitación de ingreso al proyecto"]);
  });

  it("V13: en la base de mantenimiento la habilitación no se exige", () => {
    const u = unidad({ proyectoId: PROYECTO_BASE.id });
    const docs = documentosAlDia("u1").filter((d) => d.tipo !== "habilitacion-proyecto");
    expect(aptitud(u, estadoCon(u, docs), H).puedeSalir).toBe(true);
  });

  it("A1: novedad crítica abierta -> no puede salir", () => {
    const u = unidad();
    const n = novedad({ gravedad: "critica", origen: { tipo: "parte", parteId: "p1", item: "frenos" }, fecha: "2026-11-16" });
    const a = aptitud(u, estadoCon(u, documentosAlDia("u1"), { novedades: [n] }), H);
    expect(a.puedeSalir).toBe(false);
    expect(a.motivos.map((m) => m.texto)).toEqual(["Novedad crítica abierta: Frenos (parte del 16/11/2026)"]);
  });

  it("A1: una novedad normal abierta o una crítica ya resuelta no impiden salir", () => {
    const u = unidad();
    const normal = novedad({ id: "n1", gravedad: "normal" });
    const resuelta = novedad({ id: "n2", gravedad: "critica", estado: "resuelta" });
    expect(aptitud(u, estadoCon(u, documentosAlDia("u1"), { novedades: [normal, resuelta] }), H).puedeSalir).toBe(true);
  });

  it("A1: las novedades de otra unidad no cuentan", () => {
    const u = unidad();
    const ajena = novedad({ unidadId: "u2", gravedad: "critica" });
    expect(aptitud(u, estadoCon(u, documentosAlDia("u1"), { novedades: [ajena] }), H).puedeSalir).toBe(true);
  });

  it("A1: junta todos los motivos (documentos primero, novedades después)", () => {
    const u = unidad();
    const docs = documentosAlDia("u1", { seguro: "2026-11-15" }).filter((d) => d.tipo !== "matafuego");
    const n = novedad({ gravedad: "critica", origen: { tipo: "parte", parteId: "p1", item: "direccion" }, fecha: "2026-11-17" });
    const a = aptitud(u, estadoCon(u, docs, { novedades: [n] }), H);
    expect(a.motivos.map((m) => m.tipo)).toEqual(["documento-vencido", "documento-faltante", "novedad-critica"]);
  });

  it("A1: los motivos de documento dicen de qué documento son (para el diálogo de volver a servicio, A5)", () => {
    const u = unidad();
    const docs = documentosAlDia("u1", { seguro: "2026-11-15" }).filter((d) => d.tipo !== "matafuego");
    const a = aptitud(u, estadoCon(u, docs), H);
    expect(a.motivos.map((m) => m.documento)).toEqual(["seguro", "matafuego"]);
  });

  it("A1: un documento renovado (V9) deja de ser motivo", () => {
    const u = unidad();
    const viejo = documento({ id: "viejo", titular: { tipo: "unidad", id: "u1" }, tipo: "seguro", vence: "2026-11-15" });
    const nuevo = documento({ id: "nuevo", titular: { tipo: "unidad", id: "u1" }, tipo: "seguro", vence: "2027-11-15", reemplazaA: "viejo" });
    const docs = [...documentosAlDia("u1").filter((d) => d.tipo !== "seguro"), viejo, nuevo];
    expect(aptitud(u, estadoCon(u, docs), H).puedeSalir).toBe(true);
  });

  it("A1: fuera de servicio -> no puede salir, con el motivo del taller", () => {
    const u = unidad({
      estado: { tipo: "fuera-de-servicio", desde: "2026-11-13", motivo: "En taller: cambio de embrague", origen: "manual", novedadIds: [] },
    });
    const a = aptitud(u, estadoCon(u, documentosAlDia("u1")), H);
    expect(a.puedeSalir).toBe(false);
    expect(a.categoria).toBe("fuera-de-servicio");
    expect(a.motivos.map((m) => m.texto)).toEqual(["Fuera de servicio desde 13/11/2026: En taller: cambio de embrague"]);
  });

  it("A7: una unidad de baja no puede salir y tiene su propia categoría", () => {
    const u = unidad({ estado: { tipo: "baja", desde: "2026-11-18", motivo: "Venta" } });
    const a = aptitud(u, estadoCon(u, []), H);
    expect(a.categoria).toBe("baja");
    expect(a.puedeSalir).toBe(false);
    expect(a.motivos.map((m) => m.texto)).toEqual(["Dada de baja el 18/11/2026: Venta"]);
  });
});

describe("A2: vence hoy no impide salir", () => {
  it("A2: seguro que vence hoy -> puede salir", () => {
    const u = unidad();
    expect(aptitud(u, estadoCon(u, documentosAlDia("u1", { seguro: H })), H).puedeSalir).toBe(true);
  });

  it("A2: pasada la medianoche (vencido ayer) ya no puede", () => {
    const u = unidad();
    expect(aptitud(u, estadoCon(u, documentosAlDia("u1", { seguro: "2026-11-17" })), H).puedeSalir).toBe(false);
  });
});

describe("A8: protagonista y disponibles", () => {
  it("A8: 23 activas, 2 no pueden salir y 2 fuera de servicio -> '4 unidades' y 'Disponibles: 19 de 23'", () => {
    const unidades: Unidad[] = [];
    const documentos: Documento[] = [];
    for (let i = 1; i <= 23; i++) {
      const id = `u${i}`;
      let estado: Unidad["estado"] = { tipo: "en-servicio" };
      if (i === 22 || i === 23) {
        estado = { tipo: "fuera-de-servicio", desde: "2026-11-16", motivo: "En taller", origen: "manual", novedadIds: [] };
      }
      unidades.push(unidad({ id, patente: `ZK${100 + i}BD`, interno: i, estado }));
      documentos.push(...documentosAlDia(id, i <= 2 ? { seguro: "2026-11-10" } : {}));
    }
    unidades.push(unidad({ id: "baja", patente: "ZKB999", interno: 24, estado: { tipo: "baja", desde: "2026-10-01", motivo: "Venta" } }));
    const r = resumenDeAptitud(estadoVacio({ unidades, documentos }), H);
    expect(r.activas).toBe(23);
    expect(r.noPuedenSalir.map((u) => u.id)).toEqual(["u1", "u2"]);
    expect(r.fueraDeServicio.map((u) => u.id)).toEqual(["u22", "u23"]);
    expect(r.disponibles).toBe(19);
    expect(r.protagonista).toBe(4);
  });

  it("A8: una flota vacía tiene todo en cero", () => {
    const r = resumenDeAptitud(estadoVacio(), H);
    expect(r).toMatchObject({ activas: 0, disponibles: 0, protagonista: 0 });
  });

  it("A8: usa el proyecto de cada unidad para saber qué se le exige", () => {
    const base = unidad({ id: "ub", patente: "ZK111BD", interno: 1, proyectoId: PROYECTO_BASE.id });
    const piedra = unidad({ id: "up", patente: "ZK112BD", interno: 2, proyectoId: PROYECTO_PIEDRA.id });
    const docs = [...documentosAlDia("ub"), ...documentosAlDia("up")].filter(
      (d) => !(d.tipo === "habilitacion-proyecto"),
    );
    const r = resumenDeAptitud(estadoVacio({ unidades: [base, piedra], documentos: docs }), H);
    expect(r.noPuedenSalir.map((u) => u.id)).toEqual(["up"]);
  });
});

describe("novedades: rótulos", () => {
  it("rotuloNovedad: nombre del ítem, 'Otra novedad' o la descripción abreviada", () => {
    expect(rotuloNovedad(novedad({ origen: { tipo: "parte", parteId: "p", item: "frenos" } }))).toBe("Frenos");
    expect(rotuloNovedad(novedad({ origen: { tipo: "parte", parteId: "p", item: "otra" } }))).toBe("Otra novedad");
    expect(rotuloNovedad(novedad({ origen: { tipo: "manual" }, descripcion: "Ruido en la caja" }))).toBe("Ruido en la caja");
    const largo = rotuloNovedad(novedad({ origen: { tipo: "manual" }, descripcion: "x".repeat(100) }));
    expect(largo.length).toBeLessThanOrEqual(41);
    expect(largo.endsWith("…")).toBe(true);
  });

  it("textoOrigenNovedad: parte o carga manual con su fecha", () => {
    expect(textoOrigenNovedad(novedad({ origen: { tipo: "parte", parteId: "p", item: "frenos" }, fecha: "2026-11-16" }))).toBe("parte del 16/11/2026");
    expect(textoOrigenNovedad(novedad({ origen: { tipo: "manual" }, fecha: "2026-11-16" }))).toBe("cargada el 16/11/2026");
  });
});
