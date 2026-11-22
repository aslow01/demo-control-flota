import { describe, expect, it } from "vitest";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import { registrosDeKm } from "../src/lib/dominio/kilometraje.ts";
import { validarLitros } from "../src/lib/dominio/parte.ts";
import { abreviar } from "../src/lib/dominio/textos.ts";
import type { CorreccionKm, Documento } from "../src/lib/dominio/tipos.ts";
import { documentoVigente } from "../src/lib/dominio/vencimientos.ts";
import { checklistEnOrden, checklistVacio, documento, ejecutarError, ejecutarOk, flotaDePrueba, parte } from "./ayuda.ts";

// Bordes que ningún otro test fijaba (hallados con mutaciones a mano en la revisión del 18/11/2026, B2).

type Borrador = Extract<Comando, { tipo: "guardarBorrador" }>;

function borrador(parcial: Partial<Borrador> = {}): Borrador {
  return {
    tipo: "guardarBorrador",
    parteId: null,
    unidadId: "u1",
    fecha: "2026-11-18",
    conductorId: "c1",
    kmInicio: 84320,
    kmFin: null,
    combustible: null,
    litrosCargados: null,
    checklist: checklistVacio(),
    otraNovedad: null,
    ...parcial,
  };
}

describe("B2: largo de la descripción de un borrador (tope 500)", () => {
  it("500 caracteres se guardan, 501 se rechazan, en un ítem del checklist y en otra novedad", () => {
    const e = flotaDePrueba();
    const con = (n: number): Borrador["checklist"] => ({
      ...checklistVacio(),
      frenos: { estado: "con-novedad", descripcion: "x".repeat(n), impideUso: false },
    });
    expect(ejecutarOk(e, borrador({ checklist: con(500) })).estado.partes.some((p) => p.estado === "borrador")).toBe(true);
    const largo = ejecutarError(e, borrador({ checklist: con(501) }));
    expect(largo.codigo).toBe("texto-largo");
    expect(largo.mensaje).toBe("La descripción no puede superar 500 caracteres.");

    expect(ejecutarOk(e, borrador({ otraNovedad: { descripcion: "y".repeat(500), impideUso: false } })).estado.partes).toHaveLength(3);
    expect(ejecutarError(e, borrador({ otraNovedad: { descripcion: "y".repeat(501), impideUso: false } })).codigo).toBe("texto-largo");
  });
});

describe("B2: fecha de emisión igual al vencimiento", () => {
  it("cargarDocumento acepta emitido === vence y rechaza emitido un día después", () => {
    const e = flotaDePrueba();
    const sinMatafuego = { ...e, documentos: e.documentos.filter((d) => !(d.titular.id === "u1" && d.tipo === "matafuego")) };
    const comando = (emitido: string): Comando => ({
      tipo: "cargarDocumento",
      titular: { tipo: "unidad", id: "u1" },
      tipoDocumento: "matafuego",
      numero: "DEMO-MF-9",
      emisor: "Recargas Demo",
      vence: "2027-05-01",
      emitido,
    });
    expect(ejecutarOk(sinMatafuego, comando("2027-05-01")).estado.documentos.some((d) => d.numero === "DEMO-MF-9")).toBe(true);
    expect(ejecutarError(sinMatafuego, comando("2027-05-02")).codigo).toBe("emision-posterior");
  });
});

describe("B2: litros del borrador (validarLitros)", () => {
  it("200 vale; 200,1 y 200,5 no; 0 no; 0,1 sí; más de un decimal no; NaN e infinito no", () => {
    expect(validarLitros(200).ok).toBe(true);
    expect(validarLitros(0.1).ok).toBe(true);
    expect(validarLitros(45.5).ok).toBe(true);
    for (const n of [200.1, 200.5, 0, -1, 12.25, Number.NaN, Infinity]) {
      const r = validarLitros(n);
      expect(r.ok, String(n)).toBe(false);
    }
    const r = validarLitros(200.5);
    if (!r.ok) {
      expect(r.error.codigo).toBe("litros-invalidos");
      expect(r.error.mensaje).toBe("Escriba los litros con hasta un decimal, mayores que 0 y hasta 200.");
      expect(r.error.campo).toBe("litrosCargados");
    }
  });

  it("guardarBorrador usa la misma regla", () => {
    const e = flotaDePrueba();
    expect(ejecutarOk(e, borrador({ litrosCargados: 200 })).estado.partes.some((p) => p.litrosCargados === 200)).toBe(true);
    expect(ejecutarError(e, borrador({ litrosCargados: 200.5 })).codigo).toBe("litros-invalidos");
  });
});

describe("B2: el tope de 200 caracteres del motivo de fuera de servicio (A3) y abreviar", () => {
  it("abreviar no toca un texto de exactamente el máximo y recorta el que lo pasa en un carácter", () => {
    expect(abreviar("a".repeat(200), 200)).toBe("a".repeat(200));
    const recortado = abreviar("a".repeat(201), 200);
    expect(recortado).toHaveLength(200);
    expect(recortado.endsWith("…")).toBe(true);
    expect(abreviar("corto", 200)).toBe("corto");
  });

  it("el motivo guardado y el del evento son el mismo, de a lo sumo 200 caracteres, aunque la novedad sea larga", () => {
    // una novedad crítica con una descripción larga en un parte con todos los ítems con novedad
    const e = { ...flotaDePrueba(), partes: [] };
    const largo = "z".repeat(500);
    const checklist = checklistEnOrden();
    for (const k of Object.keys(checklist) as (keyof typeof checklist)[]) {
      checklist[k] = { estado: "con-novedad", descripcion: largo, impideUso: true };
    }
    const g = ejecutarOk(e, borrador({ kmInicio: 1000, kmFin: 1100, combustible: "medio", checklist, otraNovedad: { descripcion: largo, impideUso: true } }));
    const enviado = ejecutarOk(g.estado, { tipo: "enviarRevision", parteId: g.cambios.partes[0]!.id, advertenciasAceptadas: ["salto-km", "documentacion-vencida"] });
    const u = enviado.estado.unidades.find((x) => x.id === "u1")!;
    expect(u.estado.tipo).toBe("fuera-de-servicio");
    const evento = enviado.eventos.find((x) => x.tipo === "fuera-de-servicio")!;
    if (u.estado.tipo !== "fuera-de-servicio") return;
    expect(u.estado.motivo.length).toBeLessThanOrEqual(200);
    expect(u.estado.motivo.endsWith("…")).toBe(true);
    expect(evento.datos["motivo"]).toBe(u.estado.motivo);
  });
});

describe("B2: desempates", () => {
  const titular = { tipo: "unidad" as const, id: "u1" };
  const doc = (id: string, parcial: Partial<Documento> = {}): Documento =>
    documento({ id, titular, tipo: "seguro", vence: "2027-01-01", cargado: "2026-06-01T12:00:00.000Z", ...parcial });

  it("V9: con el mismo vencimiento gana el cargado después", () => {
    const a = doc("a", { cargado: "2026-06-01T12:00:00.000Z" });
    const b = doc("b", { cargado: "2026-07-01T12:00:00.000Z" });
    expect(documentoVigente([a, b], titular, "seguro")?.id).toBe("b");
    expect(documentoVigente([b, a], titular, "seguro")?.id).toBe("b");
  });

  it("V9: con el mismo vencimiento y el mismo instante de carga gana el de mayor id, sin depender del orden", () => {
    const a = doc("doc-1");
    const b = doc("doc-2");
    expect(documentoVigente([a, b], titular, "seguro")?.id).toBe("doc-2");
    expect(documentoVigente([b, a], titular, "seguro")?.id).toBe("doc-2");
  });

  it("K5: con la misma fecha y el mismo instante, el parte va antes que la corrección (la corrección es el último registro)", () => {
    const instante = "2026-11-18T18:00:00.000Z";
    const p = parte({ id: "p1", unidadId: "u1", fecha: "2026-11-18", kmInicio: 100, kmFin: 200, enviado: instante });
    const c: CorreccionKm = { id: "k1", unidadId: "u1", desde: "2026-11-18", kmBase: 5, motivo: "Cambio de tablero", instante, autor: "Rocío Medina" };
    expect(registrosDeKm("u1", [p], [c]).map((r) => r.tipo)).toEqual(["parte", "correccion"]);
  });

  it("K5: con la misma fecha, el registro de menor instante va primero", () => {
    const p = parte({ id: "p1", unidadId: "u1", fecha: "2026-11-18", kmInicio: 100, kmFin: 200, enviado: "2026-11-18T18:00:00.000Z" });
    const c: CorreccionKm = { id: "k1", unidadId: "u1", desde: "2026-11-18", kmBase: 5, motivo: "Cambio de tablero", instante: "2026-11-18T12:00:00.000Z", autor: "Rocío Medina" };
    expect(registrosDeKm("u1", [p], [c]).map((r) => r.tipo)).toEqual(["correccion", "parte"]);
  });
});
