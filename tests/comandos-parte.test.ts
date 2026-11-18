import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import { kmActual } from "../src/lib/dominio/kilometraje.ts";
import { enviadoFueraDeTermino } from "../src/lib/dominio/parte.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import type { Estado, Parte } from "../src/lib/dominio/tipos.ts";
import { checklistEnOrden, checklistVacio, contexto, ejecutarError, ejecutarOk, flotaDePrueba, parte } from "./ayuda.ts";

const H = "2026-11-18";

type Borrador = Extract<Comando, { tipo: "guardarBorrador" }>;
type Enviar = Extract<Comando, { tipo: "enviarParte" }>;

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

function completo(parcial: Partial<Borrador> = {}): Borrador {
  return borrador({ kmFin: 84450, combustible: "medio", checklist: checklistEnOrden(), ...parcial });
}

/** Guarda un borrador y devuelve el estado y el id del parte creado. */
function conBorrador(e: Estado, cmd: Borrador): { estado: Estado; parteId: string } {
  const r = ejecutarOk(e, cmd);
  const creado = r.cambios.partes[0];
  if (creado === undefined) throw new Error("no se guardó el borrador");
  return { estado: r.estado, parteId: creado.id };
}

function enviar(parteId: string, aceptadas: Enviar["advertenciasAceptadas"] = []): Enviar {
  return { tipo: "enviarParte", parteId, advertenciasAceptadas: aceptadas };
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
      "La unidad está fuera de servicio desde el 13/11/2026 (En taller: cambio de embrague). Pida al encargado que la vuelva a servicio.",
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

describe("enviarParte", () => {
  it("H1, P12: un parte completo se envía en un solo paso: parte enviado, un evento y kilometraje actualizado", () => {
    const e = flotaDePrueba();
    const { estado, parteId } = conBorrador(e, completo());
    const r = ejecutarOk(estado, enviar(parteId));
    const p = r.estado.partes.find((x) => x.id === parteId)!;
    expect(p).toMatchObject({ estado: "enviado", enviado: "2026-11-18T15:00:00.000Z", autor: "Rocío Medina", documentacionVencida: [], advertenciasAceptadas: [] });
    expect(r.eventos.map((x) => x.tipo)).toEqual(["parte-enviado"]);
    expect(r.eventos[0]).toMatchObject({ unidadId: "u1", conductorId: "c1" });
    expect(r.eventos[0]?.resumen).toBe("Parte del 18/11/2026 de ZK 214 BD enviado: 84.320 a 84.450 km (130 km)");
    expect(r.eventos[0]?.datos).toMatchObject({ parteId, fecha: H, kmInicio: 84320, kmFin: 84450, fueraDeTermino: false });
    expect(kmActual("u1", r.estado.partes, r.estado.correccionesKm)).toBe(84450);
    expect(r.estado.unidades[0]?.estado).toEqual({ tipo: "en-servicio" });
    expect(r.cambios.novedades).toEqual([]);
    expect(r.estado.meta.modificada).toBe(true);
  });

  it("K2: un recorrido de cero se dice 'sin uso' en el resumen", () => {
    const e = flotaDePrueba();
    const { estado, parteId } = conBorrador(e, completo({ kmFin: 84320 }));
    const r = ejecutarOk(estado, enviar(parteId));
    expect(r.eventos[0]?.resumen).toBe("Parte del 18/11/2026 de ZK 214 BD enviado: 84.320 a 84.320 km (sin uso)");
  });

  it("P4: si falta algo no se envía: lista los faltantes en el orden del formulario", () => {
    const e = flotaDePrueba();
    const checklist = { ...checklistEnOrden(), luces: { estado: "sin-responder" as const } };
    const { estado, parteId } = conBorrador(e, completo({ kmFin: null, combustible: null, checklist }));
    const err = ejecutarError(estado, enviar(parteId));
    expect(err.codigo).toBe("faltan-datos");
    expect(err.mensaje).toBe("Faltan 3 datos");
    expect(err.detalle).toEqual({ faltan: ["kmFin", "luces", "combustible"] });
  });

  it("P4: el conductor es obligatorio para enviar", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ conductorId: null }));
    expect(ejecutarError(estado, enviar(parteId)).detalle).toEqual({ faltan: ["conductor"] });
  });

  it("K2: kmFin menor que kmInicio bloquea el envío y el borrador queda", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ kmFin: 84319 }));
    const err = ejecutarError(estado, enviar(parteId));
    expect(err.mensaje).toBe("El kilometraje al terminar (84.319) es menor que al iniciar (84.320).");
    expect(estado.partes.find((p) => p.id === parteId)?.estado).toBe("borrador");
  });

  it("K3: el kilometraje no retrocede (con el último parte enviado de fecha anterior)", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ kmInicio: 84319, kmFin: 84400 }));
    const err = ejecutarError(estado, enviar(parteId));
    expect(err.codigo).toBe("km-retrocede");
    expect(err.mensaje).toBe(
      "El último registro de ZK 214 BD es 84.320 km (parte del 17/11/2026). Revise el número. Si se cambió el tablero, avise al encargado.",
    );
  });

  it("K4: un parte de una fecha intermedia no puede superar el inicio del siguiente", () => {
    const base = flotaDePrueba();
    const e: Estado = {
      ...base,
      partes: [
        parte({ id: "a", unidadId: "u1", fecha: "2026-11-15", kmInicio: 79000, kmFin: 80000, enviado: "2026-11-15T18:00:00.000Z" }),
        parte({ id: "b", unidadId: "u1", fecha: "2026-11-17", kmInicio: 80500, kmFin: 81000, enviado: "2026-11-17T18:00:00.000Z" }),
      ],
    };
    const { estado, parteId } = conBorrador(e, completo({ fecha: "2026-11-16", kmInicio: 80000, kmFin: 80600 }));
    expect(ejecutarError(estado, enviar(parteId)).mensaje).toBe("Supera el kilometraje con que empezó el parte del 17/11/2026 (80.500).");
  });

  it("K5: después de una corrección de kilometraje el parte siguiente se compara con la base nueva", () => {
    // último parte enviado: el 15 (termina en 84.320); el 16 se cambió el tablero (base 120); el 17 empieza en 130
    const base = flotaDePrueba();
    const e: Estado = {
      ...base,
      partes: [parte({ id: "a", unidadId: "u1", fecha: "2026-11-15", kmInicio: 84000, kmFin: 84320, enviado: "2026-11-15T18:00:00.000Z" })],
    };
    const corregido = ejecutarOk(e, { tipo: "corregirKilometraje", unidadId: "u1", desde: "2026-11-16", kmBase: 120, motivo: "Cambio de tablero" }).estado;
    const { estado, parteId } = conBorrador(corregido, completo({ fecha: "2026-11-17", kmInicio: 130, kmFin: 200 }));
    expect(ejecutarOk(estado, enviar(parteId)).estado.partes.find((p) => p.id === parteId)?.estado).toBe("enviado");
    // 100 (menor que la base 120) sigue siendo un retroceso
    const menor = conBorrador(corregido, completo({ fecha: "2026-11-17", kmInicio: 100, kmFin: 200 }));
    expect(ejecutarError(menor.estado, enviar(menor.parteId)).codigo).toBe("km-retrocede");
  });

  it("K6: un salto de más de 1.000 km pide aceptar la advertencia; aceptada, queda guardada", () => {
    const e = flotaDePrueba();
    const { estado, parteId } = conBorrador(e, completo({ kmInicio: 85570, kmFin: 85700 }));
    const err = ejecutarError(estado, enviar(parteId));
    expect(err.codigo).toBe("advertencias-sin-aceptar");
    expect(err.detalle).toEqual({ advertencias: [{ tipo: "salto-km", km: 1250 }] });
    const r = ejecutarOk(estado, enviar(parteId, ["salto-km"]));
    expect(r.estado.partes.find((p) => p.id === parteId)?.advertenciasAceptadas).toEqual([{ tipo: "salto-km", km: 1250 }]);
    expect(r.eventos[0]?.datos).toMatchObject({ advertencias: [{ tipo: "salto-km", km: 1250 }] });
  });

  it("K6: justo 1.000 km no es salto", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ kmInicio: 85320, kmFin: 85400 }));
    expect(ejecutarOk(estado, enviar(parteId)).estado.partes.find((p) => p.id === parteId)?.advertenciasAceptadas).toEqual([]);
  });

  it("K7: un recorrido de más de 1.200 km pide aceptar la advertencia", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ kmInicio: 84320, kmFin: 85521 }));
    expect(ejecutarError(estado, enviar(parteId)).detalle).toEqual({ advertencias: [{ tipo: "recorrido-largo", km: 1201 }] });
    expect(ejecutarOk(estado, enviar(parteId, ["recorrido-largo"])).estado.partes.find((p) => p.id === parteId)?.advertenciasAceptadas).toEqual([{ tipo: "recorrido-largo", km: 1201 }]);
  });

  it("aceptar solo una de dos advertencias no alcanza", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ kmInicio: 85570, kmFin: 87000 }));
    expect(ejecutarError(estado, enviar(parteId, ["salto-km"])).detalle).toEqual({ advertencias: [{ tipo: "recorrido-largo", km: 1430 }] });
    expect(ejecutarOk(estado, enviar(parteId, ["salto-km", "recorrido-largo"])).estado.partes.find((p) => p.id === parteId)?.advertenciasAceptadas).toHaveLength(2);
  });

  it("P9: con el seguro vencido hay que aceptar; aceptado queda documentacionVencida y la alerta crítica dura 30 días", () => {
    const base = flotaDePrueba();
    const e: Estado = { ...base, documentos: base.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-15" } : d)) };
    const { estado, parteId } = conBorrador(e, completo());
    const err = ejecutarError(estado, enviar(parteId));
    expect(err.detalle).toEqual({ advertencias: [{ tipo: "documentacion-vencida", documentos: ["seguro"] }] });
    const r = ejecutarOk(estado, enviar(parteId, ["documentacion-vencida"]));
    expect(r.estado.partes.find((p) => p.id === parteId)?.documentacionVencida).toEqual(["seguro"]);
    const alerta = (hoy: string) => calcularAlertas(r.estado, hoy).alertas.filter((a) => a.tipo === "uso-con-documentacion-vencida");
    expect(alerta(H)).toHaveLength(1);
    expect(alerta(H)[0]?.gravedad).toBe("critica");
    expect(alerta(sumarDias(H, 30))).toHaveLength(1);
    expect(alerta(sumarDias(H, 31))).toHaveLength(0);
  });

  it("P9: la licencia vencida del conductor también cuenta", () => {
    const base = flotaDePrueba();
    const e: Estado = { ...base, documentos: base.documentos.map((d) => (d.id === "c1-licencia" ? { ...d, vence: "2026-11-01" } : d)) };
    const { estado, parteId } = conBorrador(e, completo());
    expect(ejecutarError(estado, enviar(parteId)).detalle).toEqual({ advertencias: [{ tipo: "documentacion-vencida", documentos: ["licencia"] }] });
  });

  it("P9 (C01): un seguro que venció ayer todavía valía ayer: el parte de ayer se envía sin advertencia", () => {
    const base = flotaDePrueba();
    const e: Estado = {
      ...base,
      partes: [],
      documentos: base.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d)),
    };
    const { estado, parteId } = conBorrador(e, completo({ fecha: "2026-11-17", kmInicio: 1000, kmFin: 1100 }));
    const r = ejecutarOk(estado, enviar(parteId));
    expect(r.estado.partes.find((p) => p.id === parteId)?.documentacionVencida).toEqual([]);
    // hoy, en cambio, el mismo seguro está vencido y hay que aceptar
    const hoy = conBorrador(e, completo({ fecha: H, kmInicio: 1000, kmFin: 1100 }));
    expect(ejecutarError(hoy.estado, enviar(hoy.parteId)).codigo).toBe("advertencias-sin-aceptar");
  });

  it("A3, P11, H1: una novedad crítica en el parte deja la unidad fuera de servicio, con los eventos en orden", () => {
    const e = flotaDePrueba();
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "  ruido al frenar en bajada  ", impideUso: false } };
    const { estado, parteId } = conBorrador(e, completo({ checklist }));
    const r = ejecutarOk(estado, enviar(parteId));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["parte-enviado", "novedad-abierta", "fuera-de-servicio"]);
    expect(r.cambios.novedades).toHaveLength(1);
    const n = r.estado.novedades[0]!;
    expect(n).toMatchObject({
      unidadId: "u1",
      origen: { tipo: "parte", parteId, item: "frenos" },
      descripcion: "ruido al frenar en bajada",
      gravedad: "critica",
      fecha: H,
      estado: "abierta",
      resolucion: null,
    });
    expect(r.estado.unidades[0]?.estado).toEqual({
      tipo: "fuera-de-servicio",
      desde: H,
      motivo: "Novedad crítica en el parte del 18/11/2026: Frenos",
      origen: "novedad-critica",
      novedadIds: [n.id],
    });
    expect(r.eventos[2]?.resumen).toBe("ZK 214 BD fuera de servicio: Novedad crítica en el parte del 18/11/2026: Frenos");
    // el parte y la novedad también quedan trimmeados y consistentes
    expect(r.estado.partes.find((p) => p.id === parteId)?.checklist.frenos).toEqual({ estado: "con-novedad", descripcion: "ruido al frenar en bajada", impideUso: false });
  });

  it("A3: dos novedades críticas -> un solo evento fuera-de-servicio con las dos en el motivo", () => {
    const checklist = {
      ...checklistEnOrden(),
      frenos: { estado: "con-novedad" as const, descripcion: "Pedal blando", impideUso: false },
      direccion: { estado: "con-novedad" as const, descripcion: "Juego en el volante", impideUso: false },
    };
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ checklist }));
    const r = ejecutarOk(estado, enviar(parteId));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["parte-enviado", "novedad-abierta", "novedad-abierta", "fuera-de-servicio"]);
    const u = r.estado.unidades[0]!;
    expect(u.estado.tipo === "fuera-de-servicio" && u.estado.motivo).toBe("Novedad crítica en el parte del 18/11/2026: Frenos, Dirección");
    expect(u.estado.tipo === "fuera-de-servicio" && u.estado.novedadIds).toHaveLength(2);
  });

  it("P11: ítem no crítico con novedad sin marcar -> normal, la unidad sigue en servicio", () => {
    const checklist = { ...checklistEnOrden(), niveles: { estado: "con-novedad" as const, descripcion: "Falta agua", impideUso: false } };
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ checklist }));
    const r = ejecutarOk(estado, enviar(parteId));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["parte-enviado", "novedad-abierta"]);
    expect(r.estado.novedades[0]?.gravedad).toBe("normal");
    expect(r.estado.unidades[0]?.estado.tipo).toBe("en-servicio");
  });

  it("P11 -> A3: con 'Impide usar la unidad' la novedad es crítica y la unidad queda fuera de servicio", () => {
    const checklist = { ...checklistEnOrden(), niveles: { estado: "con-novedad" as const, descripcion: "Pierde aceite", impideUso: true } };
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ checklist }));
    const r = ejecutarOk(estado, enviar(parteId));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["parte-enviado", "novedad-abierta", "fuera-de-servicio"]);
    expect(r.estado.novedades[0]?.gravedad).toBe("critica");
  });

  it("P11: 'Otra novedad' crítica -> motivo 'Otra novedad'", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ otraNovedad: { descripcion: "Vidrio roto", impideUso: true } }));
    const r = ejecutarOk(estado, enviar(parteId));
    const u = r.estado.unidades[0]!;
    expect(u.estado.tipo === "fuera-de-servicio" && u.estado.motivo).toBe("Novedad crítica en el parte del 18/11/2026: Otra novedad");
    expect(r.estado.novedades[0]?.origen).toEqual({ tipo: "parte", parteId, item: "otra" });
  });

  it("P5: se marca como fuera de término en el evento y se detecta desde el parte", () => {
    const base = flotaDePrueba();
    const e: Estado = { ...base, partes: [] };
    const { estado, parteId } = conBorrador(e, completo({ fecha: "2026-11-17", kmInicio: 1000, kmFin: 1100 }));
    const r = ejecutarOk(estado, enviar(parteId));
    expect(r.eventos[0]?.datos).toMatchObject({ fueraDeTermino: true });
    expect(r.eventos[0]?.resumen).toBe("Parte del 17/11/2026 de ZK 214 BD enviado fuera de término: 1.000 a 1.100 km (100 km)");
    const p = r.estado.partes.find((x) => x.id === parteId) as Parte;
    expect(enviadoFueraDeTermino(p)).toBe(true);
  });

  it("P7: un parte ya enviado no se vuelve a enviar", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo());
    const enviado = ejecutarOk(estado, enviar(parteId)).estado;
    expect(ejecutarError(enviado, enviar(parteId)).mensaje).toBe("Un parte enviado no se puede modificar.");
  });

  it("P8: si mientras tanto la unidad quedó fuera de servicio, no se envía", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo());
    const fuera = ejecutarOk(estado, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" }).estado;
    expect(ejecutarError(fuera, enviar(parteId)).codigo).toBe("unidad-fuera-de-servicio");
  });

  it("P2: al enviar se vuelve a controlar la fecha (un borrador viejo no se envía)", () => {
    const base = flotaDePrueba();
    const viejo = parte({ id: "viejo", unidadId: "u1", fecha: "2026-11-05", estado: "borrador", enviado: null, kmInicio: 100, kmFin: 200 });
    const e: Estado = { ...base, partes: [...base.partes, viejo] };
    expect(ejecutarError(e, enviar("viejo")).codigo).toBe("parte-fecha-antigua");
  });

  it("parte inexistente", () => {
    expect(ejecutarError(flotaDePrueba(), enviar("zzz")).codigo).toBe("parte-inexistente");
  });

  it("P12: el envío devuelve todo junto (parte, novedades, unidad y eventos) para escribirlo en una sola transacción", () => {
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Pedal blando", impideUso: false } };
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ checklist }));
    const r = ejecutarOk(estado, enviar(parteId));
    expect(r.cambios.partes.map((p) => p.id)).toEqual([parteId]);
    expect(r.cambios.novedades).toHaveLength(1);
    expect(r.cambios.unidades.map((u) => u.id)).toEqual(["u1"]);
    expect(r.eventos).toHaveLength(3);
  });

  it("el parte de un conductor distinto del asignado guarda a quien lo hizo", () => {
    const { estado, parteId } = conBorrador(flotaDePrueba(), completo({ conductorId: "c2" }));
    const r = ejecutarOk(estado, enviar(parteId), contexto({ autor: "Rosa Quiroga" }));
    expect(r.estado.partes.find((p) => p.id === parteId)).toMatchObject({ conductorId: "c2", autor: "Rosa Quiroga" });
    expect(r.eventos[0]?.autor).toBe("Rosa Quiroga");
  });
});
