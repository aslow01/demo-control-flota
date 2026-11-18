import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { aptitud } from "../src/lib/dominio/aptitud.ts";
import { kmActual } from "../src/lib/dominio/kilometraje.ts";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import type { Novedad } from "../src/lib/dominio/tipos.ts";
import { PROYECTO_BASE, PROYECTO_PIEDRA, checklistVacio, conductor, contexto, ejecutarError, ejecutarOk, flotaDePrueba, novedad } from "./ayuda.ts";

const H = "2026-11-18";

const altaValida: Extract<Comando, { tipo: "altaUnidad" }> = {
  tipo: "altaUnidad",
  patente: "zk-300 ba",
  interno: 30,
  marca: "Toyota",
  modelo: "Hilux",
  anio: 2024,
  tipoUnidad: "camioneta",
  proyectoId: PROYECTO_PIEDRA.id,
  conductorId: null,
};

describe("altaUnidad", () => {
  it("U1, U5, H1: nace en servicio, sin documentos, con un evento unidad-alta y alertas de faltantes (4 en Piedra Lunar)", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(e, altaValida);
    const u = r.estado.unidades.find((x) => x.patente === "ZK300BA");
    expect(u).toBeDefined();
    expect(u?.estado).toEqual({ tipo: "en-servicio" });
    expect(u?.creada).toBe("2026-11-18T15:00:00.000Z");
    expect(r.eventos.map((x) => x.tipo)).toEqual(["unidad-alta"]);
    expect(r.eventos[0]?.unidadId).toBe(u?.id);
    expect(r.eventos[0]?.resumen).toBe("Alta de la unidad ZK 300 BA (Int. 30)");
    const alertas = calcularAlertas(r.estado, H).alertas.filter((a) => a.unidadId === u?.id && a.tipo === "documento-faltante");
    expect(alertas).toHaveLength(4);
    expect(aptitud(u!, r.estado, H).puedeSalir).toBe(false);
  });

  it("U5: en la base de mantenimiento faltan 3", () => {
    const r = ejecutarOk(flotaDePrueba(), { ...altaValida, proyectoId: PROYECTO_BASE.id });
    const u = r.estado.unidades.find((x) => x.patente === "ZK300BA");
    const faltan = calcularAlertas(r.estado, H).alertas.filter((a) => a.unidadId === u?.id && a.tipo === "documento-faltante");
    expect(faltan).toHaveLength(3);
  });

  it("el estado original no se modifica (funciones puras)", () => {
    const e = flotaDePrueba();
    const copia = structuredClone(e);
    ejecutarOk(e, altaValida);
    expect(e).toEqual(copia);
  });

  it("D11: el primer comando del visitante marca la demo como modificada", () => {
    const e = flotaDePrueba();
    expect(e.meta.modificada).toBe(false);
    const r = ejecutarOk(e, altaValida);
    expect(r.estado.meta.modificada).toBe(true);
    expect(r.cambios.meta?.modificada).toBe(true);
  });

  it("U1: patente inválida", () => {
    const err = ejecutarError(flotaDePrueba(), { ...altaValida, patente: "A123BCD" });
    expect(err.codigo).toBe("patente-formato");
  });

  it("U2: patente repetida (también la de una unidad de baja)", () => {
    const e = flotaDePrueba();
    const err = ejecutarError(e, { ...altaValida, patente: "zk 214 bd", interno: 99 });
    expect(err.mensaje).toBe("Ya existe una unidad con la patente ZK 214 BD (Int. 07).");
    const conBaja = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u2", motivo: "Venta de la unidad" }).estado;
    expect(ejecutarError(conBaja, { ...altaValida, patente: "ZKB482", interno: 99 }).codigo).toBe("patente-repetida");
  });

  it("U3: interno repetido entre unidades que no están de baja; rango 1 a 999", () => {
    const e = flotaDePrueba();
    const err = ejecutarError(e, { ...altaValida, interno: 7 });
    expect(err.mensaje).toBe("Ya existe una unidad con el número interno 7 (ZK 214 BD).");
    expect(err.campo).toBe("interno");
    // el de una unidad de baja se puede reutilizar
    const conBaja = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" }).estado;
    expect(ejecutarOk(conBaja, { ...altaValida, interno: 7 }).estado.unidades).toHaveLength(3);
    for (const interno of [0, 1000, -1, 1.5, Number.NaN]) {
      expect(ejecutarError(e, { ...altaValida, interno }).codigo, String(interno)).toBe("interno-rango");
    }
    expect(ejecutarOk(e, { ...altaValida, interno: 999 }).estado.unidades).toHaveLength(3);
  });

  it("U4: año de 1980 a año de hoy + 1", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { ...altaValida, anio: 2028 }).codigo).toBe("anio-rango");
    expect(ejecutarOk(e, { ...altaValida, anio: 2027 }).estado.unidades).toHaveLength(3);
    expect(ejecutarOk(e, { ...altaValida, anio: 1980 }).estado.unidades).toHaveLength(3);
    expect(ejecutarError(e, { ...altaValida, anio: 1979 }).codigo).toBe("anio-rango");
    expect(ejecutarError(e, { ...altaValida, anio: 2024.5 }).codigo).toBe("anio-rango");
  });

  it("U7: marca y modelo obligatorios, recortados y con tope; nunca se interpretan como HTML", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { ...altaValida, marca: "   " }).campo).toBe("marca");
    expect(ejecutarError(e, { ...altaValida, modelo: "" }).campo).toBe("modelo");
    expect(ejecutarError(e, { ...altaValida, marca: "x".repeat(41) }).mensaje).toBe("La marca no puede superar 40 caracteres.");
    const r = ejecutarOk(e, { ...altaValida, marca: "  <b>x</b>  " });
    expect(r.estado.unidades.at(-1)?.marca).toBe("<b>x</b>");
  });

  it("proyecto y conductor tienen que existir; el conductor tiene que estar activo", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { ...altaValida, proyectoId: "no-existe" }).codigo).toBe("proyecto-inexistente");
    expect(ejecutarError(e, { ...altaValida, conductorId: "no-existe" }).codigo).toBe("conductor-inexistente");
    const inactivo = { ...e, conductores: [...e.conductores, conductor({ id: "c9", activo: false })] };
    expect(ejecutarError(inactivo, { ...altaValida, conductorId: "c9" }).codigo).toBe("conductor-inactivo");
    expect(ejecutarOk(e, { ...altaValida, conductorId: "c2" }).estado.unidades.at(-1)?.conductorId).toBe("c2");
  });

  it("los ids y eventos salen del contexto: ids únicos y secuencia creciente", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(e, altaValida, contexto());
    const ids = [r.estado.unidades.at(-1)?.id, r.eventos[0]?.id];
    expect(new Set(ids).size).toBe(2);
    expect(r.eventos[0]?.secuencia).toBe(1);
  });
});

describe("cambiarAsignacion", () => {
  it("U6 y H1: de la base a Piedra Lunar sin habilitación -> evento con antes y después y alerta de faltante en el acto", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(e, { tipo: "cambiarAsignacion", unidadId: "u2", proyectoId: PROYECTO_PIEDRA.id, conductorId: "c2" });
    expect(r.eventos.map((x) => x.tipo)).toEqual(["asignacion-cambiada"]);
    expect(r.eventos[0]?.datos).toMatchObject({
      antes: { proyectoId: PROYECTO_BASE.id, conductorId: "c2" },
      despues: { proyectoId: PROYECTO_PIEDRA.id, conductorId: "c2" },
    });
    expect(r.eventos[0]?.resumen).toBe("Cambio de proyecto de ZKB 482: de Base de mantenimiento a Proyecto Piedra Lunar");
    const faltantes = calcularAlertas(r.estado, H).alertas.filter((a) => a.unidadId === "u2" && a.tipo === "documento-faltante");
    expect(faltantes.map((a) => a.texto)).toEqual(["Falta cargar · Habilitación de ingreso al proyecto"]);
  });

  it("U6: cambiar solo el conductor", () => {
    const r = ejecutarOk(flotaDePrueba(), { tipo: "cambiarAsignacion", unidadId: "u1", proyectoId: PROYECTO_PIEDRA.id, conductorId: "c2" });
    expect(r.eventos[0]?.resumen).toBe("Cambio de conductor de ZK 214 BD: de Luis Ferreyra a Rosa Quiroga");
    expect(r.estado.unidades.find((u) => u.id === "u1")?.conductorId).toBe("c2");
  });

  it("U6: quitar el conductor asignado", () => {
    const r = ejecutarOk(flotaDePrueba(), { tipo: "cambiarAsignacion", unidadId: "u1", proyectoId: PROYECTO_PIEDRA.id, conductorId: null });
    expect(r.eventos[0]?.resumen).toBe("Cambio de conductor de ZK 214 BD: de Luis Ferreyra a sin conductor asignado");
  });

  it("sin cambios no hay comando", () => {
    const err = ejecutarError(flotaDePrueba(), { tipo: "cambiarAsignacion", unidadId: "u1", proyectoId: PROYECTO_PIEDRA.id, conductorId: "c1" });
    expect(err.codigo).toBe("sin-cambios");
  });

  it("unidad inexistente, de baja, proyecto o conductor inexistentes", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { tipo: "cambiarAsignacion", unidadId: "zzz", proyectoId: PROYECTO_BASE.id, conductorId: null }).codigo).toBe("unidad-inexistente");
    expect(ejecutarError(e, { tipo: "cambiarAsignacion", unidadId: "u1", proyectoId: "zzz", conductorId: "c1" }).codigo).toBe("proyecto-inexistente");
    expect(ejecutarError(e, { tipo: "cambiarAsignacion", unidadId: "u1", proyectoId: PROYECTO_PIEDRA.id, conductorId: "zzz" }).codigo).toBe("conductor-inexistente");
    const baja = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" }).estado;
    expect(ejecutarError(baja, { tipo: "cambiarAsignacion", unidadId: "u1", proyectoId: PROYECTO_BASE.id, conductorId: null }).codigo).toBe("unidad-de-baja");
  });
});

describe("darDeBaja (A7)", () => {
  it("A7: exige motivo", () => {
    expect(ejecutarError(flotaDePrueba(), { tipo: "darDeBaja", unidadId: "u1", motivo: "  " }).codigo).toBe("motivo-vacio");
  });

  it("A7, H1: queda de baja con fecha de hoy, evento unidad-baja, y sale de la flota activa y de las alertas", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" });
    expect(r.estado.unidades.find((u) => u.id === "u1")?.estado).toEqual({ tipo: "baja", desde: H, motivo: "Venta de la unidad" });
    expect(r.eventos.map((x) => x.tipo)).toEqual(["unidad-baja"]);
    expect(r.eventos[0]?.resumen).toBe("ZK 214 BD dada de baja: Venta de la unidad");
    const { resumen, alertas } = calcularAlertas(r.estado, H);
    expect(resumen.activas).toBe(1);
    expect(alertas.every((a) => a.unidadId !== "u1")).toBe(true);
  });

  it("A7: conserva documentos, partes e historial (no se borra nada)", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" });
    expect(r.estado.documentos).toHaveLength(e.documentos.length);
    expect(r.estado.partes).toHaveLength(e.partes.length);
    expect(r.cambios.partesBorrados).toEqual([]);
  });

  it("A7: es irreversible: no se puede volver a servicio ni dar de baja otra vez", () => {
    const baja = ejecutarOk(flotaDePrueba(), { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" }).estado;
    expect(ejecutarError(baja, { tipo: "volverAServicio", unidadId: "u1" }).codigo).toBe("unidad-de-baja");
    expect(ejecutarError(baja, { tipo: "darDeBaja", unidadId: "u1", motivo: "Otra vez" }).codigo).toBe("unidad-de-baja");
    expect(ejecutarError(baja, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "Taller de nuevo" }).codigo).toBe("unidad-de-baja");
  });

  it("una unidad fuera de servicio también se puede dar de baja", () => {
    const fuera = ejecutarOk(flotaDePrueba(), { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" }).estado;
    expect(ejecutarOk(fuera, { tipo: "darDeBaja", unidadId: "u1", motivo: "No se repara" }).estado.unidades[0]?.estado.tipo).toBe("baja");
  });
});

describe("ponerFueraDeServicio (A6)", () => {
  it("A6: motivo vacío -> mensaje con ejemplo", () => {
    const err = ejecutarError(flotaDePrueba(), { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "" });
    expect(err.mensaje).toBe("Escriba el motivo (por ejemplo, «En taller: cambio de embrague»).");
    expect(err.campo).toBe("motivo");
  });

  it("A6: de 5 a 200 caracteres", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "abcd" }).mensaje).toBe("El motivo tiene que tener al menos 5 caracteres.");
    expect(ejecutarError(e, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "x".repeat(201) }).mensaje).toBe("El motivo no puede superar 200 caracteres.");
    expect(ejecutarOk(e, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "x".repeat(200) }).estado.unidades[0]?.estado.tipo).toBe("fuera-de-servicio");
    expect(ejecutarOk(e, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "abcde" }).estado.unidades[0]?.estado.tipo).toBe("fuera-de-servicio");
  });

  it("A6, H1: queda fuera de servicio desde hoy, origen manual y un solo evento", () => {
    const r = ejecutarOk(flotaDePrueba(), { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "  En taller: cambio de embrague " });
    expect(r.estado.unidades[0]?.estado).toEqual({
      tipo: "fuera-de-servicio",
      desde: H,
      motivo: "En taller: cambio de embrague",
      origen: "manual",
      novedadIds: [],
    });
    expect(r.eventos.map((x) => x.tipo)).toEqual(["fuera-de-servicio"]);
    expect(r.eventos[0]?.resumen).toBe("ZK 214 BD fuera de servicio: En taller: cambio de embrague");
  });

  it("A6: una unidad ya fuera de servicio no se vuelve a poner", () => {
    const fuera = ejecutarOk(flotaDePrueba(), { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" }).estado;
    expect(ejecutarError(fuera, { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller otra vez" }).codigo).toBe("ya-fuera-de-servicio");
  });
});

describe("volverAServicio (A4, A5)", () => {
  const fuera = () => ejecutarOk(flotaDePrueba(), { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" }).estado;

  it("H1: vuelve a servicio con un evento", () => {
    const r = ejecutarOk(fuera(), { tipo: "volverAServicio", unidadId: "u1" });
    expect(r.estado.unidades[0]?.estado).toEqual({ tipo: "en-servicio" });
    expect(r.eventos.map((x) => x.tipo)).toEqual(["vuelta-a-servicio"]);
    expect(r.eventos[0]?.resumen).toBe("ZK 214 BD vuelve a servicio");
  });

  it("A4: con una novedad crítica abierta se rechaza y el error la nombra", () => {
    const n: Novedad = novedad({
      id: "n1",
      unidadId: "u1",
      gravedad: "critica",
      origen: { tipo: "parte", parteId: "p", item: "frenos" },
      fecha: "2026-11-16",
    });
    const e = { ...fuera(), novedades: [n] };
    const err = ejecutarError(e, { tipo: "volverAServicio", unidadId: "u1" });
    expect(err.mensaje).toBe("Antes de volver a servicio, resuelva: Frenos (parte del 16/11/2026).");
    expect(err.codigo).toBe("novedades-criticas-abiertas");
    expect(err.detalle).toEqual({ novedadIds: ["n1"] });
  });

  it("A4: con dos novedades las lista a las dos, la más antigua primero", () => {
    const a = novedad({ id: "a", unidadId: "u1", gravedad: "critica", origen: { tipo: "parte", parteId: "p", item: "direccion" }, fecha: "2026-11-17" });
    const b = novedad({ id: "b", unidadId: "u1", gravedad: "critica", origen: { tipo: "manual" }, descripcion: "Pierde aceite", fecha: "2026-11-16" });
    const err = ejecutarError({ ...fuera(), novedades: [a, b] }, { tipo: "volverAServicio", unidadId: "u1" });
    expect(err.mensaje).toBe("Antes de volver a servicio, resuelva: Pierde aceite (cargada el 16/11/2026), Dirección (parte del 17/11/2026).");
  });

  it("A4: una novedad normal abierta no impide volver", () => {
    const n = novedad({ unidadId: "u1", gravedad: "normal" });
    expect(ejecutarOk({ ...fuera(), novedades: [n] }, { tipo: "volverAServicio", unidadId: "u1" }).estado.unidades[0]?.estado.tipo).toBe("en-servicio");
  });

  it("A5: volver con un seguro vencido se permite: queda en servicio y 'No puede salir'", () => {
    const e = fuera();
    const vencido = { ...e, documentos: e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-15" } : d)) };
    const r = ejecutarOk(vencido, { tipo: "volverAServicio", unidadId: "u1" });
    const u = r.estado.unidades[0]!;
    expect(u.estado.tipo).toBe("en-servicio");
    const a = aptitud(u, r.estado, H);
    expect(a.puedeSalir).toBe(false);
    expect(a.motivos.map((m) => m.texto)).toEqual(["Seguro vencido hace 3 días"]);
  });

  it("una unidad en servicio no 'vuelve'", () => {
    expect(ejecutarError(flotaDePrueba(), { tipo: "volverAServicio", unidadId: "u1" }).codigo).toBe("ya-en-servicio");
  });
});

describe("corregirKilometraje (K5)", () => {
  const base = { tipo: "corregirKilometraje" as const, unidadId: "u1", desde: H, kmBase: 120, motivo: "Cambio de tablero" };

  it("K5, H1: crea la corrección y un evento km-corregido con el antes y el después", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(e, base);
    expect(r.estado.correccionesKm).toHaveLength(1);
    expect(r.estado.correccionesKm[0]).toMatchObject({ unidadId: "u1", desde: H, kmBase: 120, autor: "Rocío Medina" });
    expect(r.eventos.map((x) => x.tipo)).toEqual(["km-corregido"]);
    expect(r.eventos[0]?.datos).toMatchObject({ kmAnterior: 84320, kmBase: 120, desde: H });
    expect(r.eventos[0]?.resumen).toBe("Kilometraje de ZK 214 BD corregido: de 84.320 a 120 km desde el 18/11/2026");
    expect(kmActual("u1", r.estado.partes, r.estado.correccionesKm)).toBe(120);
  });

  it("K5: motivo de 10 a 200 caracteres", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { ...base, motivo: "Tablero" }).mensaje).toBe("El motivo tiene que tener al menos 10 caracteres.");
    expect(ejecutarError(e, { ...base, motivo: "x".repeat(201) }).mensaje).toBe("El motivo no puede superar 200 caracteres.");
    expect(ejecutarError(e, { ...base, motivo: "" }).codigo).toBe("motivo-vacio");
    expect(ejecutarOk(e, { ...base, motivo: "1234567890" }).estado.correccionesKm).toHaveLength(1);
  });

  it("K5: la fecha tiene que ser válida y no futura", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { ...base, desde: "2026-11-19" }).mensaje).toBe("La fecha no puede ser posterior a hoy.");
    expect(ejecutarError(e, { ...base, desde: "2026-02-30" }).codigo).toBe("fecha-invalida");
    expect(ejecutarOk(e, { ...base, desde: "2026-11-17" }).estado.correccionesKm).toHaveLength(1);
  });

  describe("M3 (a confirmar): una corrección con fecha anterior a registros ya cargados se rechaza", () => {
    it("desde anterior al último parte enviado: error claro, sin corrección ni evento", () => {
      const e = flotaDePrueba(); // el último parte de u1 es del 17/11/2026
      const err = ejecutarError(e, { ...base, desde: "2026-11-16" });
      expect(err.codigo).toBe("km-correccion-anterior");
      expect(err.campo).toBe("desde");
      expect(err.mensaje).toBe(
        "Ya hay un parte del 17/11/2026, posterior a la fecha elegida: la corrección no cambiaría el kilometraje actual. Use la fecha de ese parte o una posterior.",
      );
      expect(e.correccionesKm).toHaveLength(0);
    });

    it("desde igual a la fecha del último parte: se acepta y pasa a ser el kilometraje actual", () => {
      const r = ejecutarOk(flotaDePrueba(), { ...base, desde: "2026-11-17" });
      expect(kmActual("u1", r.estado.partes, r.estado.correccionesKm)).toBe(120);
    });

    it("el kilometraje actual no cambia con un rechazo", () => {
      const e = flotaDePrueba();
      ejecutarError(e, { ...base, desde: "2026-11-10" });
      expect(kmActual("u1", e.partes, e.correccionesKm)).toBe(84320);
    });

    it("tampoco se acepta una fecha anterior a otra corrección ya cargada", () => {
      const e = ejecutarOk(flotaDePrueba(), { ...base, desde: "2026-11-18" }).estado;
      const err = ejecutarError(e, { ...base, desde: "2026-11-17", kmBase: 500 });
      expect(err.codigo).toBe("km-correccion-anterior");
      expect(err.mensaje).toContain("una corrección del 18/11/2026");
    });

    it("un borrador posterior no cuenta (K9) y una unidad sin partes acepta cualquier fecha pasada", () => {
      const e = flotaDePrueba();
      const conBorrador = ejecutarOk(e, {
        tipo: "guardarBorrador", parteId: null, unidadId: "u1", fecha: H, conductorId: "c1", kmInicio: 84320, kmFin: null,
        combustible: null, litrosCargados: null, checklist: checklistVacio(), otraNovedad: null,
      }).estado;
      expect(ejecutarOk(conBorrador, { ...base, desde: "2026-11-17" }).estado.correccionesKm).toHaveLength(1);
      const sinPartes = { ...e, partes: e.partes.filter((p) => p.unidadId !== "u1") };
      expect(ejecutarOk(sinPartes, { ...base, desde: "2026-01-05" }).estado.correccionesKm).toHaveLength(1);
    });
  });

  it("K1: el kilometraje base es un entero de 0 a 2.000.000", () => {
    const e = flotaDePrueba();
    for (const kmBase of [-1, 1.5, 2_000_001, Number.NaN]) {
      expect(ejecutarError(e, { ...base, kmBase }).codigo, String(kmBase)).toBe("km-rango");
    }
    expect(ejecutarOk(e, { ...base, kmBase: 0 }).estado.correccionesKm).toHaveLength(1);
    expect(ejecutarOk(e, { ...base, kmBase: 2_000_000 }).estado.correccionesKm).toHaveLength(1);
  });

  it("unidad inexistente o de baja", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { ...base, unidadId: "zzz" }).codigo).toBe("unidad-inexistente");
    const baja = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" }).estado;
    expect(ejecutarError(baja, base).codigo).toBe("unidad-de-baja");
  });
});
