// E2-P (3.9): la ficha en celular abre en la solapa de la causa (documentos o novedades; sin causa, el resumen), con el ejemplo del generador.
import { describe, expect, it } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { aptitud } from "../src/lib/dominio/aptitud.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import type { Estado, Perfil, Unidad } from "../src/lib/dominio/tipos.ts";
import { SOLAPAS_DE_FICHA, fichaDeUnidad, solapaInicial, type FichaDeUnidad } from "../src/lib/estado/ficha.ts";
import { flotaDePrueba, novedad } from "./ayuda.ts";

const H = "2026-11-18";
const e: Estado = generar(SEMILLA_POR_DEFECTO, H);

function fichaDe(estado: Estado, patente: string, perfil: Perfil = { tipo: "encargado" }): FichaDeUnidad {
  const f = fichaDeUnidad(estado, calcularAlertas(estado, H), H, patente, perfil);
  if (!f.encontrada) throw new Error(`No hay ficha de ${patente}`);
  return f;
}

describe("solapa con la que abre la ficha: la causa de que no esté disponible", () => {
  it.each([
    ["ZK214BD", "seguro vencido", "documentos"],
    ["ZZD563", "falta la habilitación", "documentos"],
    ["ZU899QE", "fuera de servicio por una novedad crítica", "novedades"],
    ["ZR536MZ", "fuera de servicio por decisión del encargado (taller)", "resumen"],
    ["ZUE512", "de baja", "resumen"],
    ["ZYN469", "disponible", "resumen"],
  ] as const)("%s (%s): %s", (patente, _porQue, solapa) => {
    expect(fichaDe(e, patente).solapaInicial).toBe(solapa);
  });

  it("una unidad disponible con una novedad abierta sin impedir el uso abre en el resumen: sin bloqueo no hay causa", () => {
    const f = fichaDe(e, "ZWA746");
    expect(f.aptitud.categoria).toBe("puede-salir");
    expect(f.novedades.abiertas.length).toBeGreaterThan(0);
    expect(f.solapaInicial).toBe("resumen");
  });

  it("una unidad en servicio con una novedad crítica abierta abre en Novedades", () => {
    const base = flotaDePrueba();
    const f = fichaDe({ ...base, novedades: [novedad({ id: "n1", unidadId: "u1", gravedad: "critica" })] }, "ZK214BD");
    expect(f.aptitud.categoria).toBe("no-puede-salir");
    expect(f.solapaInicial).toBe("novedades");
  });

  it("con varias causas gana la primera que cuenta la aptitud: los documentos van antes que las novedades", () => {
    const base = flotaDePrueba();
    const sinSeguro: Estado = {
      ...base,
      documentos: base.documentos.filter((d) => !(d.titular.id === "u1" && d.tipo === "seguro")),
      novedades: [novedad({ id: "n1", unidadId: "u1", gravedad: "critica" })],
    };
    const f = fichaDe(sinSeguro, "ZK214BD");
    expect(aptitud(sinSeguro.unidades[0] as Unidad, sinSeguro, H).motivos.map((m) => m.tipo)).toEqual(["documento-faltante", "novedad-critica"]);
    expect(f.solapaInicial).toBe("documentos");
  });

  it("una unidad que ya volvió a servicio pero no sale hoy (la novedad crítica ya está resuelta) abre en el resumen", () => {
    const base = flotaDePrueba();
    const resuelta = novedad({
      id: "n1",
      unidadId: "u1",
      gravedad: "critica",
      estado: "resuelta",
      fecha: H,
      resolucion: { texto: "Se cambiaron las pastillas", instante: `${H}T13:00:00.000Z`, autor: "Rocío Medina" },
    });
    const ya: Estado = { ...base, novedades: [resuelta] };
    expect(aptitud(ya.unidades[0] as Unidad, ya, H).motivos.map((m) => m.tipo)).toEqual(["sin-salida-hoy"]);
    expect(fichaDe(ya, "ZK214BD").solapaInicial).toBe("resumen");
  });

  it("no depende del perfil: el conductor que mira la ficha ve la misma solapa", () => {
    expect(fichaDe(e, "ZK214BD", { tipo: "conductor", conductorId: "c-07" }).solapaInicial).toBe("documentos");
  });
});

describe("la función pura `solapaInicial`", () => {
  const baja: Unidad["estado"] = { tipo: "baja", desde: "2026-11-01", motivo: "Venta" };
  const fueraPorNovedad: Unidad["estado"] = { tipo: "fuera-de-servicio", desde: H, motivo: "x", origen: "novedad-critica", novedadIds: [] };
  const fueraManual: Unidad["estado"] = { tipo: "fuera-de-servicio", desde: H, motivo: "x", origen: "manual", novedadIds: [] };
  const servicio: Unidad["estado"] = { tipo: "en-servicio" };

  it("según el primer motivo y el origen del fuera de servicio", () => {
    expect(solapaInicial([], servicio)).toBe("resumen");
    expect(solapaInicial([{ tipo: "documento-vencido" }], servicio)).toBe("documentos");
    expect(solapaInicial([{ tipo: "documento-faltante" }], servicio)).toBe("documentos");
    expect(solapaInicial([{ tipo: "novedad-critica" }], servicio)).toBe("novedades");
    expect(solapaInicial([{ tipo: "sin-salida-hoy" }], servicio)).toBe("resumen");
    expect(solapaInicial([{ tipo: "fuera-de-servicio" }], fueraPorNovedad)).toBe("novedades");
    expect(solapaInicial([{ tipo: "fuera-de-servicio" }], fueraManual)).toBe("resumen");
    expect(solapaInicial([{ tipo: "baja" }], baja)).toBe("resumen");
  });

  it("solo mira el primero (la causa principal)", () => {
    expect(solapaInicial([{ tipo: "novedad-critica" }, { tipo: "documento-vencido" }], servicio)).toBe("novedades");
  });
});

describe("las cuatro solapas de la ficha y sus números", () => {
  it("son resumen, documentos, novedades e historial, en ese orden", () => {
    expect(SOLAPAS_DE_FICHA).toEqual(["resumen", "documentos", "novedades", "historial"]);
    expect(fichaDe(e, "ZK214BD").solapas.map((s) => s.id)).toEqual([...SOLAPAS_DE_FICHA]);
  });

  it("Documentos cuenta los vencidos y faltantes (en tono crítico) y Novedades, las abiertas", () => {
    const f = fichaDe(e, "ZK214BD");
    const malos = f.documentos.filas.filter((x) => x.estado.tipo === "vencido" || x.estado.tipo === "faltante").length;
    expect(malos).toBeGreaterThan(0);
    expect(f.solapas.find((s) => s.id === "documentos")).toEqual({ id: "documentos", cantidad: malos, critica: true });
    expect(f.solapas.find((s) => s.id === "novedades")).toEqual({ id: "novedades", cantidad: f.novedades.abiertas.length, critica: f.novedades.abiertas.some((n) => n.gravedad === "critica") });
  });

  it("una unidad con una crítica abierta marca la solapa de Novedades como crítica", () => {
    const f = fichaDe(e, "ZU899QE");
    expect(f.solapas.find((s) => s.id === "novedades")).toEqual({ id: "novedades", cantidad: 1, critica: true });
    expect(f.solapas.find((s) => s.id === "documentos")?.cantidad).toBe(f.documentos.filas.filter((x) => x.estado.tipo === "vencido" || x.estado.tipo === "faltante").length);
  });

  it("una novedad abierta que no es crítica cuenta pero no es crítica", () => {
    expect(fichaDe(e, "ZWA746").solapas.find((s) => s.id === "novedades")).toEqual({ id: "novedades", cantidad: 1, critica: false });
  });

  it("Resumen e Historial no llevan número", () => {
    const f = fichaDe(e, "ZK214BD");
    for (const id of ["resumen", "historial"] as const) expect(f.solapas.find((s) => s.id === id)).toEqual({ id, cantidad: 0, critica: false });
  });

  it("una unidad al día y sin novedades: todo en cero", () => {
    const f = fichaDe(e, "ZYN469");
    expect(f.solapas.map((s) => [s.cantidad, s.critica])).toEqual([[0, false], [0, false], [0, false], [0, false]]);
  });
});
