import { describe, expect, it } from "vitest";
import {
  NOMBRES_DOCUMENTO,
  REQUISITOS,
  compararUrgencia,
  documentoVigente,
  evaluarObligatorio,
  faltantesDeConductor,
  faltantesDeUnidad,
  tiposObligatoriosDeUnidad,
} from "../src/lib/dominio/vencimientos.ts";
import { PROYECTO_BASE, PROYECTO_PIEDRA, conductor, documento, unidad } from "./ayuda.ts";

const H = "2026-11-18";

describe("REQUISITOS (5.1)", () => {
  it("tiene los seis tipos con su nombre en pantalla", () => {
    expect(REQUISITOS.map((r) => r.tipo)).toEqual([
      "seguro",
      "revision-tecnica",
      "matafuego",
      "habilitacion-proyecto",
      "licencia",
      "habilitacion-manejo",
    ]);
    expect(NOMBRES_DOCUMENTO["habilitacion-proyecto"]).toBe("Habilitación de ingreso al proyecto");
    expect(NOMBRES_DOCUMENTO["licencia"]).toBe("Licencia de conducir");
  });
});

describe("V9: documento vigente", () => {
  it("V9: de dos documentos del mismo tipo cuenta el que vence más tarde", () => {
    const a = documento({ id: "A", vence: "2026-11-10" });
    const b = documento({ id: "B", vence: "2027-11-10", reemplazaA: "A" });
    expect(documentoVigente([a, b], { tipo: "unidad", id: "u1" }, "seguro")?.id).toBe("B");
    expect(documentoVigente([b, a], { tipo: "unidad", id: "u1" }, "seguro")?.id).toBe("B");
  });

  it("V9: no mezcla otros titulares ni otros tipos", () => {
    const delOtro = documento({ id: "X", titular: { tipo: "unidad", id: "u2" }, vence: "2030-01-01" });
    const otroTipo = documento({ id: "Y", tipo: "matafuego", vence: "2030-01-01" });
    const mio = documento({ id: "M", vence: "2027-01-01" });
    expect(documentoVigente([delOtro, otroTipo, mio], { tipo: "unidad", id: "u1" }, "seguro")?.id).toBe("M");
    expect(documentoVigente([delOtro], { tipo: "unidad", id: "u1" }, "seguro")).toBeUndefined();
  });

  it("V9: un conductor y una unidad con el mismo id no se confunden", () => {
    const deUnidad = documento({ id: "U", titular: { tipo: "unidad", id: "z" }, tipo: "licencia" });
    expect(documentoVigente([deUnidad], { tipo: "conductor", id: "z" }, "licencia")).toBeUndefined();
  });

  it("V9: con la misma fecha de vencimiento gana el cargado después (y es estable)", () => {
    const a = documento({ id: "A", vence: "2027-01-01", cargado: "2026-05-01T10:00:00.000Z" });
    const b = documento({ id: "B", vence: "2027-01-01", cargado: "2026-06-01T10:00:00.000Z" });
    expect(documentoVigente([a, b], { tipo: "unidad", id: "u1" }, "seguro")?.id).toBe("B");
    expect(documentoVigente([b, a], { tipo: "unidad", id: "u1" }, "seguro")?.id).toBe("B");
  });
});

describe("V12 y V13: obligatorios faltantes", () => {
  it("V12: unidad de un proyecto con habilitación y sin ella -> falta", () => {
    const u = unidad({ proyectoId: PROYECTO_PIEDRA.id });
    const docs = [
      documento({ tipo: "seguro" }),
      documento({ tipo: "revision-tecnica" }),
      documento({ tipo: "matafuego" }),
    ];
    expect(faltantesDeUnidad(u, PROYECTO_PIEDRA, docs)).toEqual(["habilitacion-proyecto"]);
  });

  it("V13: unidad de la base de mantenimiento sin habilitación -> no falta nada", () => {
    const u = unidad({ proyectoId: PROYECTO_BASE.id });
    const docs = [
      documento({ tipo: "seguro" }),
      documento({ tipo: "revision-tecnica" }),
      documento({ tipo: "matafuego" }),
    ];
    expect(tiposObligatoriosDeUnidad(PROYECTO_BASE)).toEqual(["seguro", "revision-tecnica", "matafuego"]);
    expect(faltantesDeUnidad(u, PROYECTO_BASE, docs)).toEqual([]);
  });

  it("U5 (base): una unidad sin documentos falta de todo, en el orden de REQUISITOS", () => {
    const u = unidad();
    expect(faltantesDeUnidad(u, PROYECTO_PIEDRA, [])).toEqual([
      "seguro",
      "revision-tecnica",
      "matafuego",
      "habilitacion-proyecto",
    ]);
    expect(faltantesDeUnidad(u, PROYECTO_BASE, [])).toHaveLength(3);
  });

  it("V12: los documentos vencidos no cuentan como faltantes (eso es V1)", () => {
    const u = unidad({ proyectoId: PROYECTO_BASE.id });
    const docs = [
      documento({ tipo: "seguro", vence: "2020-01-01" }),
      documento({ tipo: "revision-tecnica" }),
      documento({ tipo: "matafuego" }),
    ];
    expect(faltantesDeUnidad(u, PROYECTO_BASE, docs)).toEqual([]);
  });

  it("V12: la licencia del conductor es obligatoria", () => {
    const c = conductor({ id: "c9" });
    expect(faltantesDeConductor(c, [])).toEqual(["licencia"]);
    const lic = documento({ titular: { tipo: "conductor", id: "c9" }, tipo: "licencia" });
    expect(faltantesDeConductor(c, [lic])).toEqual([]);
  });
});

describe("V17: la habilitación de manejo no es obligatoria", () => {
  it("V17: si falta, no es un faltante", () => {
    const c = conductor({ id: "c9" });
    const lic = documento({ titular: { tipo: "conductor", id: "c9" }, tipo: "licencia" });
    expect(faltantesDeConductor(c, [lic])).not.toContain("habilitacion-manejo");
  });

  it("V17: si está cargada, se clasifica como cualquier otra (vence en 12 días -> grupo 15)", () => {
    const hab = documento({ titular: { tipo: "conductor", id: "c9" }, tipo: "habilitacion-manejo", vence: "2026-11-30" });
    const e = evaluarObligatorio(hab, H);
    expect(e.estado).toBe("por-vencer");
    expect(e.grupo).toBe("15");
  });
});

describe("evaluarObligatorio (V12)", () => {
  it("V12: sin documento -> 'Falta cargar', grupo vencidos", () => {
    const e = evaluarObligatorio(undefined, H);
    expect(e).toEqual({ estado: "faltante", grupo: "vencidos", texto: "Falta cargar" });
  });

  it("con documento devuelve la clasificación normal", () => {
    const e = evaluarObligatorio(documento({ vence: "2026-11-17" }), H);
    expect(e.estado).toBe("vencido");
    expect(e.texto).toBe("Vencido hace 1 día");
  });
});

describe("V16: orden por urgencia", () => {
  it("V16: faltante primero, después el más vencido, después el menos vencido", () => {
    const docs = [documento({ vence: "2026-11-17" }), undefined, documento({ vence: "2026-11-08" })];
    const evaluados = docs.map((d) => evaluarObligatorio(d, H));
    const ordenados = [...evaluados].sort(compararUrgencia);
    expect(ordenados.map((e) => (e.estado === "faltante" ? "faltante" : e.d))).toEqual(["faltante", -10, -1]);
  });

  it("V16: lo que vence antes va antes, y vencidos antes que por vencer", () => {
    const a = evaluarObligatorio(documento({ vence: "2026-11-25" }), H);
    const b = evaluarObligatorio(documento({ vence: "2026-11-19" }), H);
    const c = evaluarObligatorio(documento({ vence: "2026-11-01" }), H);
    expect([a, b, c].sort(compararUrgencia).map((e) => (e.estado === "faltante" ? 0 : e.d))).toEqual([-17, 1, 7]);
  });
});
