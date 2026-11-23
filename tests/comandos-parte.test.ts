import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import { kmActual } from "../src/lib/dominio/kilometraje.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import type { Estado, Parte } from "../src/lib/dominio/tipos.ts";
import { checklistEnOrden, checklistVacio, contexto, documento, ejecutarError, ejecutarOk, flotaDePrueba, parte } from "./ayuda.ts";

const H = "2026-11-18";

type Borrador = Extract<Comando, { tipo: "guardarBorrador" }>;
type Revision = Extract<Comando, { tipo: "enviarRevision" }>;
type Cierre = Extract<Comando, { tipo: "enviarCierre" }>;

function borrador(parcial: Partial<Borrador> = {}): Borrador {
  return {
    tipo: "guardarBorrador",
    parteId: null,
    unidadId: "u1",
    fecha: H,
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

/** Una revisión lista para enviar: conductor, kmInicio y los diez puntos en orden (sin datos de cierre). */
function listo(parcial: Partial<Borrador> = {}): Borrador {
  return borrador({ checklist: checklistEnOrden(), ...parcial });
}

/** Guarda un borrador y devuelve el estado y el id del parte creado. */
function conBorrador(e: Estado, cmd: Borrador, ctx = contexto()): { estado: Estado; parteId: string } {
  const r = ejecutarOk(e, cmd, ctx);
  const creado = r.cambios.partes[0];
  if (creado === undefined) throw new Error("no se guardó el borrador");
  return { estado: r.estado, parteId: creado.id };
}

function revision(parteId: string, aceptadas: Revision["advertenciasAceptadas"] = []): Revision {
  return { tipo: "enviarRevision", parteId, advertenciasAceptadas: aceptadas };
}

describe("guardarBorrador (P3)", () => {
  it("P3, H1: con solo el kmInicio se guarda; no cambia el kilometraje de la unidad, no abre novedades y no genera eventos", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(e, borrador());
    const p = r.estado.partes.find((x) => x.estado === "borrador");
    expect(p).toMatchObject({ unidadId: "u1", fecha: H, kmInicio: 84320, kmFin: null, estado: "borrador", enviado: null });
    expect(p?.creado).toBe("2026-11-18T15:00:00.000Z");
    expect(r.eventos).toEqual([]);
    expect(r.estado.novedades).toEqual([]);
    expect(kmActual("u1", r.estado.partes, r.estado.correccionesKm)).toBe(84320); // K9
    expect(r.estado.eventos).toHaveLength(0);
  });

  it("P3: actualizar un borrador conserva su id y su fecha de creación", () => {
    const e = flotaDePrueba();
    const { estado, parteId } = conBorrador(e, borrador());
    const r = ejecutarOk(estado, borrador({ parteId, kmFin: 84400, combustible: "cuarto" }), contexto({ ahora: "2026-11-18T16:30:00.000Z" }));
    const p = r.estado.partes.find((x) => x.id === parteId);
    expect(p).toMatchObject({ kmFin: 84400, combustible: "cuarto", creado: "2026-11-18T15:00:00.000Z", actualizado: "2026-11-18T16:30:00.000Z" });
    expect(r.estado.partes.filter((x) => x.estado === "borrador")).toHaveLength(1);
  });

  it("P3: los textos del borrador se guardan como se escribieron (sin recortar), hasta 500", () => {
    const e = flotaDePrueba();
    const checklist = { ...checklistVacio(), frenos: { estado: "con-novedad" as const, descripcion: "ruido ", impideUso: false } };
    const r = ejecutarOk(e, borrador({ checklist }));
    expect(r.estado.partes.at(-1)?.checklist.frenos).toEqual({ estado: "con-novedad", descripcion: "ruido ", impideUso: false });
    const largo = { ...checklistVacio(), frenos: { estado: "con-novedad" as const, descripcion: "x".repeat(501), impideUso: false } };
    expect(ejecutarError(e, borrador({ checklist: largo })).codigo).toBe("texto-largo");
  });

  it("P1: un segundo parte de la misma unidad y fecha -> error con el estado del existente", () => {
    const e = flotaDePrueba();
    const { estado, parteId } = conBorrador(e, borrador());
    const err = ejecutarError(estado, borrador());
    expect(err.mensaje).toBe("Ya hay un parte de ZK 214 BD para el 18/11/2026 (borrador). Ábralo para continuar.");
    expect(err.codigo).toBe("parte-duplicado");
    expect(err.detalle).toEqual({ parteId });
  });

  it("P1: también contra un parte ya enviado", () => {
    const err = ejecutarError(flotaDePrueba(), borrador({ fecha: "2026-11-17" }));
    expect(err.mensaje).toBe("Ya hay un parte de ZK 214 BD para el 17/11/2026 (enviado). Ábralo para verlo.");
  });

  it("P1: dos unidades distintas o dos fechas distintas no chocan", () => {
    const e = flotaDePrueba();
    const a = conBorrador(e, borrador({ kmInicio: 84320 })).estado;
    expect(ejecutarOk(a, borrador({ unidadId: "u2", kmInicio: 5100, conductorId: "c2" })).estado.partes.filter((p) => p.estado === "borrador")).toHaveLength(2);
    expect(ejecutarOk(a, borrador({ fecha: "2026-11-16", kmInicio: 84000 })).estado.partes.filter((p) => p.estado === "borrador")).toHaveLength(2);
  });

  it("P2: la fecha no puede ser futura ni anterior a hoy - 7", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, borrador({ fecha: "2026-11-19" })).mensaje).toBe("La fecha no puede ser posterior a hoy.");
    expect(ejecutarError(e, borrador({ fecha: "2026-11-10" })).mensaje).toBe("Solo se pueden cargar partes de los últimos 7 días.");
    expect(ejecutarOk(e, borrador({ fecha: "2026-11-11" })).estado.partes.length).toBe(3);
    expect(ejecutarError(e, borrador({ fecha: "2026-02-30" })).codigo).toBe("parte-fecha-invalida");
  });

  it("P7: un parte enviado no se puede modificar", () => {
    const e = flotaDePrueba();
    const err = ejecutarError(e, borrador({ parteId: "p-u1-ayer", fecha: "2026-11-17" }));
    expect(err.mensaje).toBe("Un parte enviado no se puede modificar.");
    expect(err.codigo).toBe("parte-enviado-inmutable");
  });

  it("P8: no se aceptan partes de una unidad fuera de servicio", () => {
    const fuera = ejecutarOk(flotaDePrueba(), { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller: cambio de embrague" }, contexto({ hoy: "2026-11-13", ahora: "2026-11-13T15:00:00.000Z" })).estado;
    const err = ejecutarError(fuera, borrador());
    expect(err.mensaje).toBe(
      "La unidad está fuera de servicio desde el 13/11/2026 (En taller: cambio de embrague). Pida al encargado que la ponga de nuevo en servicio.",
    );
    expect(err.codigo).toBe("unidad-fuera-de-servicio");
  });

  it("P8: ni de una unidad de baja", () => {
    const baja = ejecutarOk(flotaDePrueba(), { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" }).estado;
    expect(ejecutarError(baja, borrador()).codigo).toBe("unidad-de-baja");
  });

  it("P3: solo se valida el tipo de cada campo", () => {
    const e = flotaDePrueba();
    for (const kmInicio of [-1, 1.5, 2_000_001, Number.NaN]) expect(ejecutarError(e, borrador({ kmInicio })).campo, String(kmInicio)).toBe("kmInicio");
    expect(ejecutarError(e, borrador({ kmFin: -5 })).campo).toBe("kmFin");
    for (const litrosCargados of [0, -1, 250, 12.25, Number.NaN]) {
      expect(ejecutarError(e, borrador({ litrosCargados })).campo, String(litrosCargados)).toBe("litrosCargados");
    }
    expect(ejecutarOk(e, borrador({ litrosCargados: 45.5 })).estado.partes.at(-1)?.litrosCargados).toBe(45.5);
    expect(ejecutarError(e, borrador({ combustible: "rebalsando" as never })).campo).toBe("combustible");
    expect(ejecutarError(e, borrador({ conductorId: "zzz" })).codigo).toBe("conductor-inexistente");
    expect(ejecutarError(e, borrador({ unidadId: "zzz" })).codigo).toBe("unidad-inexistente");
    expect(ejecutarError(e, borrador({ checklist: { ...checklistVacio(), frenos: { estado: "raro" } as never } })).campo).toBe("checklist");
    const sinClave = { ...checklistVacio() } as Record<string, unknown>;
    delete sinClave["cabina"];
    expect(ejecutarError(e, borrador({ checklist: sinClave as never })).campo).toBe("checklist");
  });

  it("P3: no se puede mover un borrador a otra unidad", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), borrador());
    expect(ejecutarError(estado, borrador({ parteId, unidadId: "u2" })).codigo).toBe("parte-otra-unidad");
  });

  it("P3: un parte inexistente al actualizar", () => {
    expect(ejecutarError(flotaDePrueba(), borrador({ parteId: "zzz" })).codigo).toBe("parte-inexistente");
  });

  it("D11: guardar un borrador vacío no marca la demo como modificada; uno con datos sí", () => {
    const e = flotaDePrueba();
    const vacio = ejecutarOk(e, borrador());
    expect(vacio.estado.meta.modificada).toBe(false);
    expect(vacio.cambios.meta).toBeNull();
    const conDatos = ejecutarOk(e, borrador({ kmFin: 84400 }));
    expect(conDatos.estado.meta.modificada).toBe(true);
  });

  it("D11: abrir y cerrar el parte sin escribir (guardar y descartar el vacío) sigue sin modificar", () => {
    const e = flotaDePrueba();
    const { estado, parteId } = conBorrador(e, borrador());
    const r = ejecutarOk(estado, { tipo: "descartarBorrador", parteId });
    expect(r.estado.meta.modificada).toBe(false);
  });
});

describe("descartarBorrador", () => {
  it("H1: borra el borrador, sin eventos, y no toca los partes enviados", () => {
    const e = flotaDePrueba();
    const { estado, parteId } = conBorrador(e, borrador({ kmFin: 84400 }));
    const r = ejecutarOk(estado, { tipo: "descartarBorrador", parteId });
    expect(r.eventos).toEqual([]);
    expect(r.cambios.partesBorrados).toEqual([parteId]);
    expect(r.estado.partes.map((p) => p.id)).toEqual(["p-u1-ayer", "p-u2-ayer"]);
    expect(r.estado.meta.modificada).toBe(true);
  });

  it("P7: un parte enviado no se descarta; uno inexistente tampoco", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { tipo: "descartarBorrador", parteId: "p-u1-ayer" }).codigo).toBe("parte-enviado-inmutable");
    expect(ejecutarError(e, { tipo: "descartarBorrador", parteId: "zzz" }).codigo).toBe("parte-inexistente");
  });
});

/** El estado después de guardar el borrador y enviar la revisión: el parte queda en uso (o cerrado sin salida, si hay una novedad crítica). */
function conRevision(e: Estado, cmd: Borrador = listo(), aceptadas: Revision["advertenciasAceptadas"] = [], ctx = contexto()) {
  const { estado, parteId } = conBorrador(e, cmd, ctx);
  const r = ejecutarOk(estado, revision(parteId, aceptadas), ctx);
  return { ...r, parteId };
}

/** La unidad en baja, sin pasar por el comando (que no lo permite con un parte en uso): así llegan los datos viejos. */
function deBaja(e: Estado, unidadId: string): Estado {
  return { ...e, unidades: e.unidades.map((u) => (u.id === unidadId ? { ...u, estado: { tipo: "baja" as const, desde: H, motivo: "Venta de la unidad" } } : u)) };
}

function parteDe(e: Estado, id: string) {
  const p = e.partes.find((x) => x.id === id);
  if (p === undefined) throw new Error(`no hay parte ${id}`);
  return p;
}

function conLicenciaQueVence(e: Estado, vence: string): Estado {
  return { ...e, documentos: e.documentos.map((d) => (d.id === "c1-licencia" ? { ...d, vence } : d)) };
}

function conSeguroQueVence(e: Estado, vence: string): Estado {
  return { ...e, documentos: e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence } : d)) };
}

describe("guardarBorrador y descartarBorrador sobre un parte en uso (P7, L4)", () => {
  it("P7: guardarBorrador sobre un parte en uso -> revision-ya-enviada", () => {
    const { estado, parteId } = conRevision(flotaDePrueba());
    const err = ejecutarError(estado, borrador({ parteId, kmInicio: 84330 }));
    expect(err.codigo).toBe("revision-ya-enviada");
    expect(err.mensaje).toBe("La revisión ya se envió: no se puede modificar.");
  });

  it("P7: descartarBorrador sobre un parte en uso -> el mismo error, y el parte sigue ahí", () => {
    const { estado, parteId } = conRevision(flotaDePrueba());
    expect(ejecutarError(estado, { tipo: "descartarBorrador", parteId }).codigo).toBe("revision-ya-enviada");
    expect(parteDe(estado, parteId).estado).toBe("en-uso");
  });

  it("P1: un segundo borrador para la fecha de un parte en uso -> duplicado con el estado «en uso»", () => {
    const { estado, parteId } = conRevision(flotaDePrueba());
    const err = ejecutarError(estado, borrador());
    expect(err.codigo).toBe("parte-duplicado");
    expect(err.mensaje).toBe("Ya hay un parte de ZK 214 BD para el 18/11/2026 (en uso). Ábralo para continuar.");
    expect(err.detalle).toEqual({ parteId });
  });

  it("L4: guardarBorrador y descartarBorrador con un conductor sin licencia vigente se aceptan (no se mira la licencia)", () => {
    const e = conLicenciaQueVence(flotaDePrueba(), "2026-11-15");
    const { estado, parteId } = conBorrador(e, listo());
    expect(ejecutarOk(estado, borrador({ parteId, kmInicio: 84330 })).estado.partes.find((p) => p.id === parteId)?.kmInicio).toBe(84330);
    expect(ejecutarOk(estado, { tipo: "descartarBorrador", parteId }).estado.partes.some((p) => p.id === parteId)).toBe(false);
  });
});

describe("enviarRevision: el parte pasa a en uso (P14)", () => {
  it("P14, H1, P12: una revisión completa sin novedades -> en uso, revisado = ahora, sin cierre y un solo evento revision-enviada", () => {
    const r = conRevision(flotaDePrueba());
    const p = parteDe(r.estado, r.parteId);
    expect(p).toMatchObject({
      estado: "en-uso",
      revisado: "2026-11-18T15:00:00.000Z",
      enviado: null,
      sinSalida: false,
      autor: "Rocío Medina",
      documentacionVencida: [],
      advertenciasAceptadas: [],
    });
    expect(r.eventos.map((x) => x.tipo)).toEqual(["revision-enviada"]);
    expect(r.eventos[0]).toMatchObject({ unidadId: "u1", conductorId: "c1" });
    expect(r.eventos[0]?.datos).toEqual({ parteId: r.parteId, fecha: H, kmInicio: 84320, fueraDeTermino: false, sinSalida: false, advertencias: [] });
    expect(r.eventos[0]?.resumen).toBe("Revisión del 18/11/2026 de ZK 214 BD enviada: sale con 84.320 km");
    expect(r.estado.unidades[0]?.estado).toEqual({ tipo: "en-servicio" });
    expect(r.cambios.novedades).toEqual([]);
    expect(r.estado.meta.modificada).toBe(true);
  });

  it("K9, K10: el kilometraje actual pasa a ser el kmInicio del parte en uso (los datos de cierre de un borrador viejo no cuentan)", () => {
    const { estado } = conRevision(flotaDePrueba(), listo({ kmInicio: 84330, kmFin: 99999, combustible: "lleno" }));
    expect(kmActual("u1", estado.partes, estado.correccionesKm)).toBe(84330);
  });

  it("K9: los datos de cierre que traía el borrador (versiones viejas) se conservan como datos de cierre sin cerrar", () => {
    const { estado, parteId } = conRevision(flotaDePrueba(), listo({ kmFin: 84450, combustible: "medio", litrosCargados: 20 }));
    expect(parteDe(estado, parteId)).toMatchObject({ estado: "en-uso", kmFin: 84450, combustible: "medio", litrosCargados: 20 });
  });

  it("U7: el checklist y «Otra novedad» se recortan al enviar", () => {
    const checklist = { ...checklistEnOrden(), niveles: { estado: "con-novedad" as const, descripcion: "  Falta agua  ", impideUso: false } };
    const { estado, parteId } = conRevision(flotaDePrueba(), listo({ checklist, otraNovedad: { descripcion: "  Vidrio rayado ", impideUso: false } }));
    expect(parteDe(estado, parteId).checklist.niveles).toEqual({ estado: "con-novedad", descripcion: "Falta agua", impideUso: false });
    expect(parteDe(estado, parteId).otraNovedad).toEqual({ descripcion: "Vidrio rayado", impideUso: false });
  });

  it("P4: a la revisión le faltan kmInicio y luces -> ['kmInicio', 'luces'] (no pide kmFin ni combustible)", () => {
    const checklist = { ...checklistEnOrden(), luces: { estado: "sin-responder" as const } };
    const { estado, parteId } = conBorrador(flotaDePrueba(), listo({ kmInicio: null, checklist }));
    const err = ejecutarError(estado, revision(parteId));
    expect(err.codigo).toBe("faltan-datos");
    expect(err.mensaje).toBe("Faltan 2 datos");
    expect(err.detalle).toEqual({ faltan: ["kmInicio", "luces"] });
  });

  it("P4: el conductor es obligatorio; sin conductor va con los faltantes", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), listo({ conductorId: null }));
    expect(ejecutarError(estado, revision(parteId)).detalle).toEqual({ faltan: ["conductor"] });
  });

  it("P7: enviarRevision sobre un parte en uso -> revision-ya-enviada; sobre uno cerrado -> parte-enviado-inmutable", () => {
    const { estado, parteId } = conRevision(flotaDePrueba());
    expect(ejecutarError(estado, revision(parteId)).codigo).toBe("revision-ya-enviada");
    expect(ejecutarError(flotaDePrueba(), revision("p-u1-ayer")).codigo).toBe("parte-enviado-inmutable");
  });

  it("parte inexistente", () => {
    expect(ejecutarError(flotaDePrueba(), revision("zzz")).codigo).toBe("parte-inexistente");
  });

  it("P8 y P2 en la revisión: unidad fuera de servicio, de baja y fecha H - 8", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), listo());
    const fuera = ejecutarOk(estado, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" }).estado;
    expect(ejecutarError(fuera, revision(parteId)).codigo).toBe("unidad-fuera-de-servicio");
    const baja = ejecutarOk(estado, { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" }).estado;
    expect(ejecutarError(baja, revision(parteId)).codigo).toBe("unidad-de-baja");

    const base = flotaDePrueba();
    const viejo = parte({ id: "viejo", unidadId: "u1", fecha: "2026-11-10", estado: "borrador", enviado: null, revisado: null, kmInicio: 100, kmFin: null, combustible: null, checklist: checklistEnOrden() });
    expect(ejecutarError({ ...base, partes: [...base.partes, viejo] }, revision("viejo")).codigo).toBe("parte-fecha-antigua");
  });

  it("P5: una revisión de H - 1 enviada hoy lleva fueraDeTermino en el evento y en el resumen", () => {
    const e: Estado = { ...flotaDePrueba(), partes: [] };
    const r = conRevision(e, listo({ fecha: "2026-11-17", kmInicio: 1000 }));
    expect(r.eventos[0]?.datos).toMatchObject({ fueraDeTermino: true });
    expect(r.eventos[0]?.resumen).toBe("Revisión del 17/11/2026 de ZK 214 BD enviada fuera de plazo: sale con 1.000 km");
  });

  it("C3: el motivo de fuera de servicio nombra el parte solo si es de otro día que el «Desde» (una revisión de ayer enviada hoy)", () => {
    const e: Estado = { ...flotaDePrueba(), partes: [] };
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Pedal blando", impideUso: false } };
    const r = conRevision(e, listo({ fecha: "2026-11-17", kmInicio: 1000, checklist }));
    const u = r.estado.unidades[0]!;
    expect(u.estado.tipo === "fuera-de-servicio" && [u.estado.desde, u.estado.motivo]).toEqual(["2026-11-18", "Novedad crítica en Frenos, parte del 17/11/2026"]);
  });

  it("P5: el límite es la medianoche de Argentina: 02:59:59.999Z todavía es el mismo día y 03:00:00.000Z ya no", () => {
    const base: Estado = { ...flotaDePrueba(), partes: [] };
    const ayer = contexto({ hoy: "2026-11-17", ahora: "2026-11-17T15:00:00.000Z" });
    const a = ejecutarOk(base, listo({ fecha: "2026-11-17", kmInicio: 1000 }), ayer);
    const id = a.cambios.partes[0]!.id;
    const mismoDia = ejecutarOk(a.estado, revision(id), contexto({ hoy: "2026-11-17", ahora: "2026-11-18T02:59:59.999Z" }));
    expect(mismoDia.eventos[0]?.datos).toMatchObject({ fueraDeTermino: false });
    const alDiaSiguiente = ejecutarOk(a.estado, revision(id), contexto({ hoy: "2026-11-18", ahora: "2026-11-18T03:00:00.000Z" }));
    expect(alDiaSiguiente.eventos[0]?.datos).toMatchObject({ fueraDeTermino: true });
  });
});

describe("enviarRevision: kilometraje (K3, K4, K6, K10)", () => {
  it("K3: el kilometraje no retrocede (con el último parte cerrado de fecha anterior)", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), listo({ kmInicio: 84319 }));
    const err = ejecutarError(estado, revision(parteId));
    expect(err.codigo).toBe("km-retrocede");
    expect(err.campo).toBe("kmInicio");
    expect(err.mensaje).toBe(
      "El último registro de ZK 214 BD es 84.320 km (parte del 17/11/2026). Revise el número. Si se cambió el tablero, hay que informarlo al encargado.",
    );
  });

  it("K10 (K4 de la salida): la revisión de una fecha intermedia no puede superar el inicio del siguiente parte", () => {
    const base = flotaDePrueba();
    const e: Estado = {
      ...base,
      partes: [
        parte({ id: "a", unidadId: "u1", fecha: "2026-11-15", kmInicio: 79000, kmFin: 80000, enviado: "2026-11-15T18:00:00.000Z" }),
        parte({ id: "b", unidadId: "u1", fecha: "2026-11-17", kmInicio: 80500, kmFin: 81000, enviado: "2026-11-17T18:00:00.000Z" }),
      ],
    };
    const { estado, parteId } = conBorrador(e, listo({ fecha: "2026-11-16", kmInicio: 80600 }));
    const err = ejecutarError(estado, revision(parteId));
    expect(err.codigo).toBe("km-supera-siguiente");
    expect(err.campo).toBe("kmInicio");
    expect(err.mensaje).toBe("El kilometraje supera el del inicio del parte del 17/11/2026 (80.500 km). Revise el número.");
  });

  it("K5: después de una corrección de kilometraje la salida siguiente se compara con la base nueva", () => {
    const base = flotaDePrueba();
    const e: Estado = { ...base, partes: [parte({ id: "a", unidadId: "u1", fecha: "2026-11-15", kmInicio: 84000, kmFin: 84320, enviado: "2026-11-15T18:00:00.000Z" })] };
    const corregido = ejecutarOk(e, { tipo: "corregirKilometraje", unidadId: "u1", desde: "2026-11-16", kmBase: 120, motivo: "Cambio de tablero" }).estado;
    const ok = conBorrador(corregido, listo({ fecha: "2026-11-17", kmInicio: 130 }));
    expect(parteDe(ejecutarOk(ok.estado, revision(ok.parteId)).estado, ok.parteId).estado).toBe("en-uso");
    const menor = conBorrador(corregido, listo({ fecha: "2026-11-17", kmInicio: 100 }));
    expect(ejecutarError(menor.estado, revision(menor.parteId)).codigo).toBe("km-retrocede");
  });

  it("K6 en la revisión: un salto de 1.001 km pide aceptar la advertencia; 1.000 no", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), listo({ kmInicio: 85321 }));
    const err = ejecutarError(estado, revision(parteId));
    expect(err.codigo).toBe("advertencias-sin-aceptar");
    expect(err.detalle).toEqual({ advertencias: [{ tipo: "salto-km", km: 1001 }] });
    const r = ejecutarOk(estado, revision(parteId, ["salto-km"]));
    expect(parteDe(r.estado, parteId).advertenciasAceptadas).toEqual([{ tipo: "salto-km", km: 1001 }]);
    expect(r.eventos[0]?.datos).toMatchObject({ advertencias: [{ tipo: "salto-km", km: 1001 }] });
    const justo = conBorrador(flotaDePrueba(), listo({ kmInicio: 85320 }));
    expect(parteDe(ejecutarOk(justo.estado, revision(justo.parteId)).estado, justo.parteId).advertenciasAceptadas).toEqual([]);
  });

  it("K7 no se mira en la revisión: un kmFin viejo del borrador no pide advertencia", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), listo({ kmFin: 99999 }));
    expect(ejecutarOk(estado, revision(parteId)).estado.partes.find((p) => p.id === parteId)?.estado).toBe("en-uso");
  });
});

describe("enviarRevision: cerrar antes (P18)", () => {
  /** u1 con el parte de ayer EN USO (revisión enviada, sin cerrar) en lugar del cerrado. */
  function conParteDeAyerEnUso(): Estado {
    const base = flotaDePrueba();
    return {
      ...base,
      partes: [
        parte({ id: "uso-ayer", unidadId: "u1", fecha: "2026-11-17", estado: "en-uso", kmInicio: 84320, kmFin: null, combustible: null, revisado: "2026-11-17T09:00:00.000Z", enviado: null }),
        ...base.partes.filter((p) => p.unidadId !== "u1"),
      ],
    };
  }

  it("A1: con un parte en uso anterior de la misma unidad no se envía la revisión de una fecha posterior, y el error dice cuál cerrar", () => {
    const { estado, parteId } = conBorrador(conParteDeAyerEnUso(), listo());
    const err = ejecutarError(estado, revision(parteId));
    expect(err.codigo).toBe("parte-anterior-sin-cerrar");
    expect(err.mensaje).toBe("ZK 214 BD: el parte del martes 17/11/2026 quedó sin cerrar. Ciérrelo primero; después se puede empezar la revisión del 18/11/2026.");
    expect(err.detalle).toEqual({ parteId: "uso-ayer", fecha: "2026-11-17" });
    expect(parteDe(estado, parteId).estado).toBe("borrador");
  });

  it("A1: con varios sin cerrar, el error nombra el más antiguo", () => {
    const e = conParteDeAyerEnUso();
    const mas = parte({ id: "uso-antes", unidadId: "u1", fecha: "2026-11-15", estado: "en-uso", kmInicio: 84000, kmFin: null, combustible: null, enviado: null });
    const { estado, parteId } = conBorrador({ ...e, partes: [...e.partes, mas] }, listo());
    expect(ejecutarError(estado, revision(parteId)).detalle).toEqual({ parteId: "uso-antes", fecha: "2026-11-15" });
  });

  it("A1: el bloqueo es solo de esa unidad", () => {
    const { estado, parteId } = conBorrador(conParteDeAyerEnUso(), listo({ unidadId: "u2", conductorId: "c2", kmInicio: 5100 }));
    expect(parteDe(ejecutarOk(estado, revision(parteId)).estado, parteId).estado).toBe("en-uso");
  });

  it("A1: un parte en uso de una fecha posterior no bloquea (la revisión de un día anterior la limita K4, no A1)", () => {
    const e = flotaDePrueba();
    const despues = parte({ id: "uso-hoy", unidadId: "u1", fecha: H, estado: "en-uso", kmInicio: 84400, kmFin: null, combustible: null, enviado: null });
    const { estado, parteId } = conBorrador({ ...e, partes: [...e.partes, despues] }, listo({ fecha: "2026-11-16", kmInicio: 84000 }), contexto());
    expect(parteDe(ejecutarOk(estado, revision(parteId)).estado, parteId).estado).toBe("en-uso");
  });

  it("A1: cerrado el parte de ayer, la revisión de hoy se envía", () => {
    const e = conParteDeAyerEnUso();
    const cerrado = ejecutarOk({ ...e, partes: e.partes.map((p) => (p.id === "uso-ayer" ? { ...p, kmFin: 84400, combustible: "medio" as const } : p)) }, { tipo: "enviarCierre", parteId: "uso-ayer", advertenciasAceptadas: [] }).estado;
    const { estado, parteId } = conBorrador(cerrado, listo({ kmInicio: 84400 }));
    expect(parteDe(ejecutarOk(estado, revision(parteId)).estado, parteId).estado).toBe("en-uso");
  });

  it("A1 va después de L1 (si la licencia también bloquea, gana la licencia) y antes de los faltantes", () => {
    const e = conParteDeAyerEnUso();
    const sinLicencia: Estado = { ...e, documentos: e.documentos.filter((d) => d.tipo !== "licencia" || d.titular.id !== "c1") };
    const a = conBorrador(sinLicencia, listo());
    expect(ejecutarError(a.estado, revision(a.parteId)).codigo).toBe("licencia-no-vigente");
    const incompleto = conBorrador(e, borrador({ kmInicio: 84320 }));
    expect(ejecutarError(incompleto.estado, revision(incompleto.parteId)).codigo).toBe("parte-anterior-sin-cerrar");
  });

  it("A1 no mira la licencia al cerrar: un conductor sin licencia vigente puede cerrar el parte anterior (L3)", () => {
    const e = conParteDeAyerEnUso();
    const sinLicencia: Estado = { ...e, documentos: e.documentos.filter((d) => d.tipo !== "licencia" || d.titular.id !== "c1"), partes: e.partes.map((p) => (p.id === "uso-ayer" ? { ...p, kmFin: 84400, combustible: "medio" as const } : p)) };
    expect(ejecutarOk(sinLicencia, { tipo: "enviarCierre", parteId: "uso-ayer", advertenciasAceptadas: [] }).estado.partes.find((p) => p.id === "uso-ayer")?.estado).toBe("enviado");
  });

  it("A1 (QA, A1 de código): la revisión con el número precargado no se puede enviar, así que el cierre del parte anterior sigue siendo posible con el kilometraje real", () => {
    const { estado, parteId } = conBorrador(conParteDeAyerEnUso(), listo({ kmInicio: 84320 }));
    expect(ejecutarError(estado, revision(parteId)).codigo).toBe("parte-anterior-sin-cerrar");
    const cierre = ejecutarOk(estado, { tipo: "guardarCierre", parteId: "uso-ayer", kmFin: 84452, combustible: "medio", litrosCargados: null }).estado;
    expect(ejecutarOk(cierre, { tipo: "enviarCierre", parteId: "uso-ayer", advertenciasAceptadas: [] }).estado.partes.find((p) => p.id === "uso-ayer")?.kmFin).toBe(84452);
  });
});

describe("enviarRevision: el mismo conductor con un parte en uso en otra unidad (P20)", () => {
  /** Luis (c1) salió ayer con la u2 y no cerró el parte. */
  function conLuisEnLaOtra(fecha = "2026-11-17"): Estado {
    const base = flotaDePrueba();
    return { ...base, partes: [...base.partes, parte({ id: "uso-otra", unidadId: "u2", fecha, conductorId: "c1", estado: "en-uso", kmInicio: 5100, kmFin: null, combustible: null, enviado: null })] };
  }

  it("P20: no envía la revisión de otra unidad hasta cerrar el parte anterior: mismo código que A1, en el campo Conductor, con el parte a cerrar", () => {
    const { estado, parteId } = conBorrador(conLuisEnLaOtra(), listo());
    const err = ejecutarError(estado, revision(parteId));
    expect(err.codigo).toBe("parte-anterior-sin-cerrar");
    expect(err.campo).toBe("conductorId");
    expect(err.mensaje).toBe("Luis Ferreyra tiene sin cerrar el parte del martes 17/11/2026 de ZKB 482. Ciérrelo primero; después se puede enviar esta revisión.");
    expect(err.detalle).toEqual({ parteId: "uso-otra", fecha: "2026-11-17", unidadId: "u2" });
  });

  it("P20: también si el otro parte en uso es de hoy", () => {
    const { estado, parteId } = conBorrador(conLuisEnLaOtra(H), listo());
    const err = ejecutarError(estado, revision(parteId));
    expect(err.codigo).toBe("parte-anterior-sin-cerrar");
    // QA B1: el parte de hoy no «quedó sin cerrar»: está en uso
    expect(err.mensaje).toBe("Luis Ferreyra tiene en uso el parte de hoy de ZKB 482. Ciérrelo primero; después se puede enviar esta revisión.");
  });

  it("P20: otro conductor en la otra unidad no bloquea; cerrado el parte, se envía; una unidad de baja no deja al conductor trabado", () => {
    const e = conLuisEnLaOtra();
    const deOtro = { ...e, partes: e.partes.map((p) => (p.id === "uso-otra" ? { ...p, conductorId: "c2" } : p)) };
    const a = conBorrador(deOtro, listo());
    expect(parteDe(ejecutarOk(a.estado, revision(a.parteId)).estado, a.parteId).estado).toBe("en-uso");
    const cerrado = { ...e, partes: e.partes.map((p) => (p.id === "uso-otra" ? { ...p, estado: "enviado" as const, kmFin: 5200, combustible: "medio" as const, enviado: "2026-11-17T18:00:00.000Z" } : p)) };
    const b = conBorrador(cerrado, listo());
    expect(parteDe(ejecutarOk(b.estado, revision(b.parteId)).estado, b.parteId).estado).toBe("en-uso");
    const deBajaLaOtra = deBaja(e, "u2");
    const c = conBorrador(deBajaLaOtra, listo());
    expect(parteDe(ejecutarOk(c.estado, revision(c.parteId)).estado, c.parteId).estado).toBe("en-uso");
  });

  it("P20 va después de L1 y de A1 de la unidad", () => {
    const e = conLuisEnLaOtra();
    const sinLicencia: Estado = { ...e, documentos: e.documentos.filter((d) => d.tipo !== "licencia" || d.titular.id !== "c1") };
    const a = conBorrador(sinLicencia, listo());
    expect(ejecutarError(a.estado, revision(a.parteId)).codigo).toBe("licencia-no-vigente");
  });
});

describe("enviarRevision: la licencia bloquea (L1 a L5)", () => {
  it("L1: licencia vencida -> licencia-no-vigente en conductorId, sin cambios ni eventos", () => {
    const e = conLicenciaQueVence(flotaDePrueba(), "2026-11-15");
    const { estado, parteId } = conBorrador(e, listo());
    const err = ejecutarError(estado, revision(parteId));
    expect(err.codigo).toBe("licencia-no-vigente");
    expect(err.campo).toBe("conductorId");
    expect(err.mensaje).toBe("Luis Ferreyra no tiene licencia vigente para el 18/11/2026: venció el 15/11/2026. Elija otro conductor.");
    expect(err.detalle).toEqual({ motivo: "vencida", vence: "2026-11-15" });
    expect(parteDe(estado, parteId).estado).toBe("borrador");
    expect(estado.eventos).toEqual([]);
  });

  it("L1, L5: sin licencia cargada y licencia nueva que empieza a valer después", () => {
    const sin: Estado = { ...flotaDePrueba(), documentos: flotaDePrueba().documentos.filter((d) => d.id !== "c1-licencia") };
    const a = conBorrador(sin, listo());
    const faltante = ejecutarError(a.estado, revision(a.parteId));
    expect(faltante.mensaje).toBe("Luis Ferreyra no tiene licencia de conducir cargada. Elija otro conductor.");
    expect(faltante.detalle).toEqual({ motivo: "faltante" });

    const base = conLicenciaQueVence(flotaDePrueba(), "2026-11-15");
    const nueva = { ...base, documentos: [...base.documentos, documento({ id: "c1-nueva", titular: { tipo: "conductor", id: "c1" }, tipo: "licencia", vence: "2031-01-01", emitido: "2026-11-20", reemplazaA: "c1-licencia" })] };
    const b = conBorrador(nueva, listo());
    const posterior = ejecutarError(b.estado, revision(b.parteId));
    expect(posterior.mensaje).toBe("Luis Ferreyra no tiene licencia vigente para el 18/11/2026: la nueva vale desde el 20/11/2026. Elija otro conductor.");
    expect(posterior.detalle).toEqual({ motivo: "posterior", desde: "2026-11-20" });
  });

  it("L1: gana sobre los faltantes (licencia vencida y faltan datos)", () => {
    const e = conLicenciaQueVence(flotaDePrueba(), "2026-11-15");
    const { estado, parteId } = conBorrador(e, listo({ kmInicio: null, checklist: checklistVacio() }));
    expect(ejecutarError(estado, revision(parteId)).codigo).toBe("licencia-no-vigente");
  });

  it("L1: el mismo bloqueo con el autor encargado", () => {
    const e = conLicenciaQueVence(flotaDePrueba(), "2026-11-15");
    const { estado, parteId } = conBorrador(e, listo());
    expect(ejecutarError(estado, revision(parteId), contexto({ autor: "Rocío Medina" })).codigo).toBe("licencia-no-vigente");
  });

  it("L1, L2: un parte de H - 4 con la licencia vencida en H - 3 se acepta; la licencia que vence hoy vale todo el día", () => {
    const e = conLicenciaQueVence(flotaDePrueba(), "2026-11-15");
    const { estado, parteId } = conBorrador(e, listo({ fecha: "2026-11-14", kmInicio: 83000 }));
    expect(parteDe(ejecutarOk(estado, revision(parteId)).estado, parteId).estado).toBe("en-uso");
    const hoy = conBorrador(conLicenciaQueVence(flotaDePrueba(), H), listo());
    const tarde = contexto({ ahora: "2026-11-19T02:59:59.999Z" });
    expect(parteDe(ejecutarOk(hoy.estado, revision(hoy.parteId), tarde).estado, hoy.parteId).estado).toBe("en-uso");
  });

  it("L4: tras cargar o renovar la licencia hoy, la revisión de hoy pasa; la de ayer (sin emisión: cargada hoy) sigue bloqueada", () => {
    const e = conLicenciaQueVence(flotaDePrueba(), "2026-11-10");
    const hoy = conBorrador(e, listo());
    const ayer = conBorrador(hoy.estado, listo({ fecha: "2026-11-16", kmInicio: 83000 }));
    expect(ejecutarError(ayer.estado, revision(hoy.parteId)).codigo).toBe("licencia-no-vigente");
    const renovado = ejecutarOk(ayer.estado, { tipo: "renovarDocumento", documentoId: "c1-licencia", numero: "DEMO-N", emisor: "", vence: "2031-01-01", emitido: null }).estado;
    expect(parteDe(ejecutarOk(renovado, revision(hoy.parteId)).estado, hoy.parteId).estado).toBe("en-uso");
    const bloqueada = ejecutarError(renovado, revision(ayer.parteId));
    expect(bloqueada.codigo).toBe("licencia-no-vigente");
    expect(bloqueada.detalle).toEqual({ motivo: "posterior", desde: "2026-11-18" });
  });

  it("L1: se mira la licencia del conductor del parte, no la del asignado a la unidad", () => {
    const e = conLicenciaQueVence(flotaDePrueba(), "2026-11-15"); // c1, asignado a u1, sin licencia
    const { estado, parteId } = conBorrador(e, listo({ conductorId: "c2" }));
    expect(parteDe(ejecutarOk(estado, revision(parteId)).estado, parteId).estado).toBe("en-uso");
  });
});

describe("enviarRevision: documentación de la unidad (P9) y novedades (A3, P11, P16)", () => {
  it("P9: con el seguro vencido hay que aceptar; aceptado queda en uso con ['seguro'] y la alerta crítica dura 30 días", () => {
    const e = conSeguroQueVence(flotaDePrueba(), "2026-11-15");
    const { estado, parteId } = conBorrador(e, listo());
    const err = ejecutarError(estado, revision(parteId));
    expect(err.detalle).toEqual({ advertencias: [{ tipo: "documentacion-vencida", documentos: ["seguro"] }] });
    const r = ejecutarOk(estado, revision(parteId, ["documentacion-vencida"]));
    expect(parteDe(r.estado, parteId)).toMatchObject({ estado: "en-uso", documentacionVencida: ["seguro"] });
    const alerta = (hoy: string) => calcularAlertas(r.estado, hoy).alertas.filter((a) => a.tipo === "uso-con-documentacion-vencida");
    expect(alerta(H)).toHaveLength(1);
    expect(alerta(H)[0]?.gravedad).toBe("critica");
    expect(alerta(sumarDias(H, 30))).toHaveLength(1);
    expect(alerta(sumarDias(H, 31))).toHaveLength(0);
  });

  it("P9 (C01): un seguro que venció ayer todavía valía ayer: la revisión de ayer pasa sin advertencia; la de hoy no", () => {
    const base = flotaDePrueba();
    const e: Estado = { ...conSeguroQueVence(base, "2026-11-17"), partes: [] };
    const ayer = conBorrador(e, listo({ fecha: "2026-11-17", kmInicio: 1000 }));
    expect(parteDe(ejecutarOk(ayer.estado, revision(ayer.parteId)).estado, ayer.parteId).documentacionVencida).toEqual([]);
    const hoy = conBorrador(e, listo({ fecha: H, kmInicio: 1000 }));
    expect(ejecutarError(hoy.estado, revision(hoy.parteId)).codigo).toBe("advertencias-sin-aceptar");
  });

  it("aceptar solo una de dos advertencias no alcanza", () => {
    const e = conSeguroQueVence(flotaDePrueba(), "2026-11-15");
    const { estado, parteId } = conBorrador(e, listo({ kmInicio: 85570 }));
    expect(ejecutarError(estado, revision(parteId, ["salto-km"])).detalle).toEqual({ advertencias: [{ tipo: "documentacion-vencida", documentos: ["seguro"] }] });
    expect(parteDe(ejecutarOk(estado, revision(parteId, ["salto-km", "documentacion-vencida"])).estado, parteId).advertenciasAceptadas).toHaveLength(2);
  });

  it("P16, A3, H1: una novedad crítica cierra el parte sin salida y deja la unidad fuera de servicio, con los eventos en orden", () => {
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "  ruido al frenar en bajada  ", impideUso: false } };
    const r = conRevision(flotaDePrueba(), listo({ checklist, kmFin: 99999, combustible: "lleno", litrosCargados: 12 }));
    const ahora = "2026-11-18T15:00:00.000Z";
    expect(parteDe(r.estado, r.parteId)).toMatchObject({
      estado: "enviado",
      sinSalida: true,
      kmInicio: 84320,
      kmFin: 84320,
      combustible: null,
      litrosCargados: null,
      revisado: ahora,
      enviado: ahora,
      documentacionVencida: [],
    });
    expect(r.eventos.map((x) => x.tipo)).toEqual(["revision-enviada", "novedad-abierta", "fuera-de-servicio"]);
    expect(r.eventos[0]?.datos).toMatchObject({ sinSalida: true, kmInicio: 84320 });
    const n = r.estado.novedades[0]!;
    expect(n).toMatchObject({ unidadId: "u1", origen: { tipo: "parte", parteId: r.parteId, item: "frenos" }, descripcion: "ruido al frenar en bajada", gravedad: "critica", fecha: H, estado: "abierta" });
    expect(r.estado.unidades[0]?.estado).toEqual({
      tipo: "fuera-de-servicio",
      desde: H,
      motivo: "Novedad crítica en Frenos",
      origen: "novedad-critica",
      novedadIds: [n.id],
    });
    expect(r.eventos[2]?.resumen).toBe("ZK 214 BD fuera de servicio: Novedad crítica en Frenos");
    expect(r.eventos[0]?.resumen).toBe("Revisión del 18/11/2026 de ZK 214 BD enviada: la unidad no salió por una novedad crítica");
    expect(r.estado.eventos.some((x) => x.tipo === "parte-enviado")).toBe(false);
    expect(kmActual("u1", r.estado.partes, r.estado.correccionesKm)).toBe(84320);
  });

  it("P16 + P9: seguro vencido y frenos con novedad -> sin advertencia de documentación y documentacionVencida vacía", () => {
    const e = conSeguroQueVence(flotaDePrueba(), "2026-11-15");
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Pedal blando", impideUso: false } };
    const r = conRevision(e, listo({ checklist }));
    expect(parteDe(r.estado, r.parteId)).toMatchObject({ sinSalida: true, documentacionVencida: [], advertenciasAceptadas: [] });
    expect(calcularAlertas(r.estado, H).alertas.some((a) => a.tipo === "uso-con-documentacion-vencida")).toBe(false);
  });

  it("P16 + K6: con salto de kilometraje también hay que aceptar la advertencia, y queda guardada", () => {
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Pedal blando", impideUso: false } };
    const { estado, parteId } = conBorrador(flotaDePrueba(), listo({ checklist, kmInicio: 85570 }));
    expect(ejecutarError(estado, revision(parteId)).detalle).toEqual({ advertencias: [{ tipo: "salto-km", km: 1250 }] });
    expect(parteDe(ejecutarOk(estado, revision(parteId, ["salto-km"])).estado, parteId).advertenciasAceptadas).toEqual([{ tipo: "salto-km", km: 1250 }]);
  });

  it("A3: dos novedades críticas -> un solo evento fuera-de-servicio con las dos en el motivo", () => {
    const checklist = {
      ...checklistEnOrden(),
      frenos: { estado: "con-novedad" as const, descripcion: "Pedal blando", impideUso: false },
      direccion: { estado: "con-novedad" as const, descripcion: "Juego en el volante", impideUso: false },
    };
    const r = conRevision(flotaDePrueba(), listo({ checklist }));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["revision-enviada", "novedad-abierta", "novedad-abierta", "fuera-de-servicio"]);
    const u = r.estado.unidades[0]!;
    expect(u.estado.tipo === "fuera-de-servicio" && u.estado.motivo).toBe("Novedad crítica en Frenos, Dirección");
    expect(u.estado.tipo === "fuera-de-servicio" && u.estado.novedadIds).toHaveLength(2);
  });

  it("P11, P14: un ítem no crítico con novedad sin marcar -> normal; el parte queda en uso y la unidad en servicio", () => {
    const checklist = { ...checklistEnOrden(), niveles: { estado: "con-novedad" as const, descripcion: "Falta agua", impideUso: false } };
    const r = conRevision(flotaDePrueba(), listo({ checklist }));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["revision-enviada", "novedad-abierta"]);
    expect(r.estado.novedades[0]?.gravedad).toBe("normal");
    expect(r.estado.unidades[0]?.estado.tipo).toBe("en-servicio");
    expect(parteDe(r.estado, r.parteId)).toMatchObject({ estado: "en-uso", sinSalida: false });
  });

  it("P11 -> P16: con 'Impide usar la unidad' la novedad es crítica y el parte se cierra sin salida", () => {
    const checklist = { ...checklistEnOrden(), niveles: { estado: "con-novedad" as const, descripcion: "Pierde aceite", impideUso: true } };
    const r = conRevision(flotaDePrueba(), listo({ checklist }));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["revision-enviada", "novedad-abierta", "fuera-de-servicio"]);
    expect(r.estado.novedades[0]?.gravedad).toBe("critica");
    expect(parteDe(r.estado, r.parteId).sinSalida).toBe(true);
  });

  it("P11: 'Otra novedad' crítica -> motivo 'Otra novedad'", () => {
    const r = conRevision(flotaDePrueba(), listo({ otraNovedad: { descripcion: "Vidrio roto", impideUso: true } }));
    const u = r.estado.unidades[0]!;
    expect(u.estado.tipo === "fuera-de-servicio" && u.estado.motivo).toBe("Novedad crítica en Otra novedad");
    expect(r.estado.novedades[0]?.origen).toEqual({ tipo: "parte", parteId: r.parteId, item: "otra" });
  });

  it("P12: la revisión devuelve todo junto (parte, novedades, unidad y eventos) para escribirlo en una sola transacción", () => {
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Pedal blando", impideUso: false } };
    const r = conRevision(flotaDePrueba(), listo({ checklist }));
    expect(r.cambios.partes.map((p) => p.id)).toEqual([r.parteId]);
    expect(r.cambios.novedades).toHaveLength(1);
    expect(r.cambios.unidades.map((u) => u.id)).toEqual(["u1"]);
    expect(r.eventos).toHaveLength(3);
  });

  it("el parte de un conductor distinto del asignado guarda a quien envió la revisión", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), listo({ conductorId: "c2" }));
    const r = ejecutarOk(estado, revision(parteId), contexto({ autor: "Rosa Quiroga" }));
    expect(parteDe(r.estado, parteId)).toMatchObject({ conductorId: "c2", autor: "Rosa Quiroga" });
    expect(r.eventos[0]?.autor).toBe("Rosa Quiroga");
  });
});

describe("guardarCierre (P3, K9)", () => {
  const cierreCmd = (parteId: string, parcial: Partial<Extract<Comando, { tipo: "guardarCierre" }>> = {}): Comando => ({
    tipo: "guardarCierre",
    parteId,
    kmFin: 84450,
    combustible: "medio",
    litrosCargados: null,
    ...parcial,
  });

  it("sobre un borrador -> parte-sin-revision; sobre un parte cerrado -> parte-enviado-inmutable", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), listo());
    const err = ejecutarError(estado, cierreCmd(parteId));
    expect(err.codigo).toBe("parte-sin-revision");
    expect(err.mensaje).toBe("Primero envíe la revisión antes de salir.");
    expect(ejecutarError(flotaDePrueba(), cierreCmd("p-u1-ayer")).codigo).toBe("parte-enviado-inmutable");
    expect(ejecutarError(flotaDePrueba(), cierreCmd("zzz")).codigo).toBe("parte-inexistente");
  });

  it("K9, H1: guarda los tres campos, sin eventos, sin cambiar kmActual ni la fecha de la revisión", () => {
    const { estado, parteId } = conRevision(flotaDePrueba(), listo({ kmInicio: 84330 }));
    const r = ejecutarOk(estado, cierreCmd(parteId, { kmFin: 84999, litrosCargados: 45.5 }), contexto({ ahora: "2026-11-18T20:00:00.000Z" }));
    expect(parteDe(r.estado, parteId)).toMatchObject({ estado: "en-uso", kmFin: 84999, combustible: "medio", litrosCargados: 45.5, actualizado: "2026-11-18T20:00:00.000Z", revisado: "2026-11-18T15:00:00.000Z", enviado: null });
    expect(r.eventos).toEqual([]);
    expect(kmActual("u1", r.estado.partes, r.estado.correccionesKm)).toBe(84330);
  });

  it("P3: un km que no es entero o litros inválidos -> error de tipo; sin cambios -> modifica false (no marca la demo)", () => {
    const { estado, parteId } = conRevision(flotaDePrueba());
    expect(ejecutarError(estado, cierreCmd(parteId, { kmFin: 1.5 })).campo).toBe("kmFin");
    expect(ejecutarError(estado, cierreCmd(parteId, { kmFin: -3 })).campo).toBe("kmFin");
    expect(ejecutarError(estado, cierreCmd(parteId, { litrosCargados: 12.25 })).campo).toBe("litrosCargados");
    expect(ejecutarError(estado, cierreCmd(parteId, { combustible: "rebalsando" as never })).campo).toBe("combustible");
    const una = ejecutarOk(estado, cierreCmd(parteId));
    const dos = ejecutarOk({ ...una.estado, meta: { ...una.estado.meta, modificada: false } }, cierreCmd(parteId), contexto({ ahora: "2026-11-18T16:00:00.000Z" }));
    expect(dos.cambios.partes).toEqual([]);
    expect(dos.estado.meta.modificada).toBe(false);
  });

  it("P15: sin control de fecha: un parte en uso de H - 10 se guarda; unidad fuera de servicio se acepta (P8), de baja no (A7)", () => {
    const e: Estado = { ...flotaDePrueba(), partes: [] };
    const viejo = conRevision(e, listo({ fecha: "2026-11-08", kmInicio: 1000 }), [], contexto({ hoy: "2026-11-08", ahora: "2026-11-08T15:00:00.000Z" }));
    expect(parteDe(ejecutarOk(viejo.estado, cierreCmd(viejo.parteId, { kmFin: 1100 })).estado, viejo.parteId).kmFin).toBe(1100);

    const { estado, parteId } = conRevision(flotaDePrueba());
    const fuera = ejecutarOk(estado, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" }).estado;
    expect(ejecutarOk(fuera, cierreCmd(parteId)).estado.partes.find((p) => p.id === parteId)?.kmFin).toBe(84450);
    const baja = deBaja(estado, "u1"); // datos viejos: el comando ya no da de baja una unidad con un parte en uso
    expect(ejecutarError(baja, cierreCmd(parteId)).codigo).toBe("unidad-de-baja");
  });
});

describe("enviarCierre (P15)", () => {
  const cerrar = (parteId: string, aceptadas: Cierre["advertenciasAceptadas"] = []): Cierre => ({ tipo: "enviarCierre", parteId, advertenciasAceptadas: aceptadas });
  const conCierre = (kmFin: number | null, combustible: Borrador["combustible"], extra: Partial<Parte> = {}) => {
    const { estado, parteId } = conRevision(flotaDePrueba(), listo({ kmInicio: 84330 }));
    const guardado = estado.partes.map((p) => (p.id === parteId ? { ...p, kmFin, combustible, ...extra } : p));
    return { estado: { ...estado, partes: guardado }, parteId };
  };
  const tarde = contexto({ ahora: "2026-11-18T21:40:00.000Z" });

  it("P15, H1: un cierre completo -> cerrado, recorrido en el evento parte-enviado, kmActual = kmFin y autor del parte sin cambiar", () => {
    const { estado, parteId } = conCierre(84452, "tres-cuartos");
    const r = ejecutarOk(estado, cerrar(parteId), contexto({ autor: "Luis Ferreyra", ahora: "2026-11-18T21:40:00.000Z" }));
    expect(parteDe(r.estado, parteId)).toMatchObject({ estado: "enviado", enviado: "2026-11-18T21:40:00.000Z", revisado: "2026-11-18T15:00:00.000Z", actualizado: "2026-11-18T21:40:00.000Z", autor: "Rocío Medina", sinSalida: false });
    expect(r.eventos.map((x) => x.tipo)).toEqual(["parte-enviado"]);
    expect(r.eventos[0]?.datos).toEqual({ parteId, fecha: H, kmInicio: 84330, kmFin: 84452, recorrido: 122, advertencias: [] });
    expect(r.eventos[0]?.autor).toBe("Luis Ferreyra");
    expect(r.eventos[0]?.resumen).toBe("Parte del 18/11/2026 de ZK 214 BD cerrado: 84.330 a 84.452 km (122 km)");
    expect(kmActual("u1", r.estado.partes, r.estado.correccionesKm)).toBe(84452);
  });

  it("K2: un recorrido de cero se dice 'sin uso' en el resumen", () => {
    const { estado, parteId } = conCierre(84330, "medio");
    expect(ejecutarOk(estado, cerrar(parteId), tarde).eventos[0]?.resumen).toBe("Parte del 18/11/2026 de ZK 214 BD cerrado: 84.330 a 84.330 km (sin uso)");
  });

  it("P4: un cierre sin nada -> ['kmFin', 'combustible']; con uno solo, el que falta", () => {
    const vacio = conCierre(null, null);
    const err = ejecutarError(vacio.estado, cerrar(vacio.parteId), tarde);
    expect(err.codigo).toBe("faltan-datos");
    expect(err.detalle).toEqual({ faltan: ["kmFin", "combustible"] });
    const medio = conCierre(84400, null);
    expect(ejecutarError(medio.estado, cerrar(medio.parteId), tarde).detalle).toEqual({ faltan: ["combustible"] });
  });

  it("estados: sobre un borrador -> parte-sin-revision; sobre uno cerrado -> parte-enviado-inmutable; inexistente", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), listo());
    expect(ejecutarError(estado, cerrar(parteId)).codigo).toBe("parte-sin-revision");
    expect(ejecutarError(flotaDePrueba(), cerrar("p-u1-ayer")).codigo).toBe("parte-enviado-inmutable");
    expect(ejecutarError(flotaDePrueba(), cerrar("zzz")).codigo).toBe("parte-inexistente");
  });

  it("K2 y K4 en el cierre (con el siguiente parte en uso)", () => {
    const { estado, parteId } = conCierre(84329, "medio");
    expect(ejecutarError(estado, cerrar(parteId), tarde).codigo).toBe("km-fin-menor");

    const base: Estado = {
      ...flotaDePrueba(),
      partes: [parte({ id: "a", unidadId: "u1", fecha: "2026-11-15", kmInicio: 79000, kmFin: 80000, enviado: "2026-11-15T18:00:00.000Z" })],
    };
    const uso = conRevision(base, listo({ fecha: "2026-11-16", kmInicio: 80000 }), [], contexto({ hoy: "2026-11-16", ahora: "2026-11-16T15:00:00.000Z" }));
    const siguiente = parte({ id: "b", unidadId: "u1", fecha: "2026-11-17", estado: "en-uso", kmInicio: 80500, kmFin: null, combustible: null, revisado: "2026-11-17T09:00:00.000Z", enviado: null });
    const conSiguiente: Estado = { ...uso.estado, partes: [...uso.estado.partes.map((p) => (p.id === uso.parteId ? { ...p, kmFin: 80600, combustible: "medio" as const } : p)), siguiente] };
    const err = ejecutarError(conSiguiente, cerrar(uso.parteId), tarde);
    expect(err.codigo).toBe("km-supera-siguiente");
    expect(err.campo).toBe("kmFin");
  });

  it("K7: un recorrido de 1.201 km pide aceptar; aceptada, advertenciasAceptadas = las de la revisión + las del cierre", () => {
    const e = conSeguroQueVence(flotaDePrueba(), "2026-11-15");
    const rev = conRevision(e, listo({ kmInicio: 84320 }), ["documentacion-vencida"]);
    const estado: Estado = { ...rev.estado, partes: rev.estado.partes.map((p) => (p.id === rev.parteId ? { ...p, kmFin: 85521, combustible: "lleno" as const } : p)) };
    const err = ejecutarError(estado, cerrar(rev.parteId), tarde);
    expect(err.codigo).toBe("advertencias-sin-aceptar");
    expect(err.detalle).toEqual({ advertencias: [{ tipo: "recorrido-largo", km: 1201 }] });
    const r = ejecutarOk(estado, cerrar(rev.parteId, ["recorrido-largo"]), tarde);
    expect(parteDe(r.estado, rev.parteId).advertenciasAceptadas).toEqual([{ tipo: "documentacion-vencida", documentos: ["seguro"] }, { tipo: "recorrido-largo", km: 1201 }]);
    expect(r.eventos[0]?.datos).toMatchObject({ advertencias: [{ tipo: "recorrido-largo", km: 1201 }] });
    expect(parteDe(r.estado, rev.parteId).documentacionVencida).toEqual(["seguro"]);
  });

  it("K7: 1.200 km justo no avisa", () => {
    const { estado, parteId } = conCierre(85530, "medio");
    expect(parteDe(ejecutarOk(estado, cerrar(parteId), tarde).estado, parteId).estado).toBe("enviado");
  });

  it("P8: una unidad puesta fuera de servicio a mano después de la revisión: el cierre se acepta", () => {
    const { estado, parteId } = conCierre(84450, "medio");
    const fuera = ejecutarOk(estado, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" }).estado;
    expect(parteDe(ejecutarOk(fuera, cerrar(parteId), tarde).estado, parteId).estado).toBe("enviado");
  });

  it("A7: la unidad de baja -> unidad-de-baja en el cierre", () => {
    const { estado, parteId } = conCierre(84450, "medio");
    const baja = deBaja(estado, "u1"); // datos viejos: el comando ya no da de baja una unidad con un parte en uso
    expect(ejecutarError(baja, cerrar(parteId), tarde).codigo).toBe("unidad-de-baja");
  });

  it("P15: un parte en uso de H - 10 todavía se cierra (sin límite de fecha)", () => {
    const e: Estado = { ...flotaDePrueba(), partes: [] };
    const uso = conRevision(e, listo({ fecha: "2026-11-08", kmInicio: 1000 }), [], contexto({ hoy: "2026-11-08", ahora: "2026-11-08T15:00:00.000Z" }));
    const estado: Estado = { ...uso.estado, partes: uso.estado.partes.map((p) => (p.id === uso.parteId ? { ...p, kmFin: 1100, combustible: "medio" as const } : p)) };
    expect(parteDe(ejecutarOk(estado, cerrar(uso.parteId), tarde).estado, uso.parteId).estado).toBe("enviado");
  });

  it("L3: el reloj pasa a F + 1 y la licencia vencía F: el cierre se acepta (no mira la licencia)", () => {
    const e = conLicenciaQueVence(flotaDePrueba(), H);
    const rev = conRevision(e, listo({ kmInicio: 84330 }), [], contexto({ ahora: "2026-11-18T22:00:00.000Z" }));
    const estado: Estado = { ...rev.estado, partes: rev.estado.partes.map((p) => (p.id === rev.parteId ? { ...p, kmFin: 84400, combustible: "medio" as const } : p)) };
    const r = ejecutarOk(estado, cerrar(rev.parteId), contexto({ hoy: "2026-11-19", ahora: "2026-11-19T09:00:00.000Z" }));
    expect(parteDe(r.estado, rev.parteId).estado).toBe("enviado");
  });

  it("P12: el cierre devuelve el parte y su evento juntos", () => {
    const { estado, parteId } = conCierre(84450, "medio");
    const r = ejecutarOk(estado, cerrar(parteId), tarde);
    expect(r.cambios.partes.map((p) => p.id)).toEqual([parteId]);
    expect(r.cambios.novedades).toEqual([]);
    expect(r.eventos).toHaveLength(1);
  });
});
