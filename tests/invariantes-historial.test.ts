import { describe, expect, it } from "vitest";
import { aplicar, ejecutar, type Comando } from "../src/lib/dominio/comandos.ts";
import { aplicarCambios } from "../src/lib/dominio/estado.ts";
import { historialDeUnidad, ordenarHistorial } from "../src/lib/dominio/historial.ts";
import type { Estado, Evento } from "../src/lib/dominio/tipos.ts";
import { checklistEnOrden, checklistVacio, contexto, ejecutarOk, flotaDePrueba, novedad, unidadesEnServicioConNovedadCritica } from "./ayuda.ts";

const H = "2026-11-18";

function evento(parcial: Partial<Evento>): Evento {
  return {
    id: "e",
    secuencia: 1,
    instante: "2026-11-18T15:00:00.000Z",
    unidadId: "u1",
    conductorId: null,
    tipo: "novedad-abierta",
    resumen: "x",
    datos: {},
    autor: "Rocío Medina",
    ...parcial,
  };
}

describe("A3: invariante 'nunca en servicio con una novedad crítica abierta'", () => {
  it("el chequeo detecta una unidad en servicio con una crítica abierta", () => {
    const e = flotaDePrueba();
    expect(unidadesEnServicioConNovedadCritica(e)).toEqual([]);
    const roto: Estado = { ...e, novedades: [novedad({ unidadId: "u1", gravedad: "critica" })] };
    expect(unidadesEnServicioConNovedadCritica(roto).map((u) => u.id)).toEqual(["u1"]);
    const normal: Estado = { ...e, novedades: [novedad({ unidadId: "u1", gravedad: "normal" })] };
    expect(unidadesEnServicioConNovedadCritica(normal)).toEqual([]);
  });

  it("se cumple después de cada comando de una secuencia completa", () => {
    let estado = flotaDePrueba();
    const ctx = contexto();
    const pasos: Comando[] = [
      { tipo: "cargarNovedad", unidadId: "u1", descripcion: "Pierde aceite", impideUso: true },
      { tipo: "cargarNovedad", unidadId: "u2", descripcion: "Espejo flojo", impideUso: false },
      { tipo: "ponerFueraDeServicio", unidadId: "u2", motivo: "En taller por el espejo" },
      { tipo: "cargarNovedad", unidadId: "u2", descripcion: "No arranca", impideUso: true },
      { tipo: "guardarBorrador", parteId: null, unidadId: "u1", fecha: H, conductorId: "c1", kmInicio: 84320, kmFin: null, combustible: null, litrosCargados: null, checklist: checklistVacio(), otraNovedad: null },
    ];
    for (const paso of pasos) {
      const r = ejecutar(estado, paso, ctx);
      if (r.ok) estado = r.valor.estado;
      expect(unidadesEnServicioConNovedadCritica(estado)).toEqual([]);
    }
    // resolver todo y volver a servicio
    for (const n of [...estado.novedades].filter((x) => x.estado === "abierta")) {
      const unidad = estado.unidades.find((u) => u.id === n.unidadId)!;
      const r = ejecutarOk(estado, { tipo: "resolverNovedad", novedadId: n.id, texto: "Se arregló", volverAServicio: unidad.estado.tipo === "fuera-de-servicio" && estado.novedades.filter((x) => x.unidadId === n.unidadId && x.estado === "abierta" && x.gravedad === "critica").length === 1 && n.gravedad === "critica" }, ctx);
      estado = r.estado;
      expect(unidadesEnServicioConNovedadCritica(estado)).toEqual([]);
    }
  });

  it("un parte con frenos con novedad deja la invariante en pie", () => {
    const e = flotaDePrueba();
    const guardado = ejecutarOk(e, {
      tipo: "guardarBorrador", parteId: null, unidadId: "u1", fecha: H, conductorId: "c1", kmInicio: 84320, kmFin: 84400, combustible: "medio",
      checklist: { ...checklistEnOrden(), frenos: { estado: "con-novedad", descripcion: "Pedal blando", impideUso: false } }, litrosCargados: null, otraNovedad: null,
    });
    const parteId = guardado.cambios.partes[0]!.id;
    const r = ejecutarOk(guardado.estado, { tipo: "enviarRevision", parteId, advertenciasAceptadas: [] });
    expect(unidadesEnServicioConNovedadCritica(r.estado)).toEqual([]);
  });
});

describe("aplicar y aplicarCambios", () => {
  it("aplicar devuelve cambios y eventos sin tocar el estado original", () => {
    const e = flotaDePrueba();
    const copia = structuredClone(e);
    const r = aplicar(e, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" }, contexto());
    expect(r.ok).toBe(true);
    expect(e).toEqual(copia);
    if (r.ok) {
      expect(r.valor.cambios.unidades).toHaveLength(1);
      expect(r.valor.eventos).toHaveLength(1);
    }
  });

  it("aplicarCambios agrega los eventos al final del historial del estado", () => {
    const e = flotaDePrueba();
    const r = aplicar(e, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" }, contexto());
    if (!r.ok) throw new Error("no debería fallar");
    const nuevo = aplicarCambios(e, r.valor.cambios, r.valor.eventos);
    expect(nuevo.eventos).toHaveLength(1);
    expect(nuevo.unidades[0]?.estado.tipo).toBe("fuera-de-servicio");
  });

  it("la secuencia de los eventos sigue la del historial existente", () => {
    const e: Estado = { ...flotaDePrueba(), eventos: [evento({ id: "viejo", secuencia: 41 })] };
    const r = ejecutarOk(e, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" });
    expect(r.eventos[0]?.secuencia).toBe(42);
    const dos = ejecutarOk(e, { tipo: "cargarNovedad", unidadId: "u1", descripcion: "Pierde aceite", impideUso: true });
    expect(dos.eventos.map((x) => x.secuencia)).toEqual([42, 43]);
  });

  it("H1/H2: el historial solo crece (los eventos viejos quedan idénticos)", () => {
    const viejo = evento({ id: "viejo", secuencia: 1 });
    const e: Estado = { ...flotaDePrueba(), eventos: [viejo] };
    const r = ejecutarOk(e, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" });
    expect(r.estado.eventos[0]).toEqual(viejo);
    expect(r.estado.eventos).toHaveLength(2);
  });
});

describe("historial (H3, H4)", () => {
  it("H3: instante descendente; a igual instante, la secuencia mayor primero", () => {
    const a = evento({ id: "a", instante: "2026-11-18T10:00:00.000Z", secuencia: 1 });
    const b = evento({ id: "b", instante: "2026-11-18T12:00:00.000Z", secuencia: 2 });
    const c = evento({ id: "c", instante: "2026-11-18T12:00:00.000Z", secuencia: 3 });
    expect(ordenarHistorial([a, b, c]).map((x) => x.id)).toEqual(["c", "b", "a"]);
    expect(ordenarHistorial([c, a, b]).map((x) => x.id)).toEqual(["c", "b", "a"]);
  });

  it("H3: no modifica la lista que recibe", () => {
    const lista = [evento({ id: "a", secuencia: 1 }), evento({ id: "b", secuencia: 2 })];
    ordenarHistorial(lista);
    expect(lista.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("H4: el historial de una unidad de baja se conserva y se puede ver", () => {
    const e: Estado = {
      ...flotaDePrueba(),
      eventos: [evento({ id: "a", secuencia: 1, unidadId: "u1" }), evento({ id: "b", secuencia: 2, unidadId: "u2" })],
    };
    const baja = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" }).estado;
    const h = historialDeUnidad(baja, "u1");
    expect(h.map((x) => x.tipo)).toEqual(["unidad-baja", "novedad-abierta"]);
    expect(h.every((x) => x.unidadId === "u1")).toBe(true);
  });
});
