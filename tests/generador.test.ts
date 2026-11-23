import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { aptitud } from "../src/lib/dominio/aptitud.ts";
import { ejecutar } from "../src/lib/dominio/comandos.ts";
import { unidadesEnServicioConNovedadCritica } from "../src/lib/dominio/estado.ts";
import { diasEntre, fechaEnArgentina, formatearFecha, parsearFechaCivil, sumarDias } from "../src/lib/dominio/fechas.ts";
import { kmActual, validarKmDeCierre, validarKmDeSalida } from "../src/lib/dominio/kilometraje.ts";
import { documentacionVencidaEn } from "../src/lib/dominio/parte.ts";
import { formatoDePatente } from "../src/lib/dominio/patente.ts";
import type { Documento, Estado, Parte, TipoDocumento, Unidad } from "../src/lib/dominio/tipos.ts";
import { clasificar, documentoVigente, hayDocumentoQueAmpare } from "../src/lib/dominio/vencimientos.ts";
import { cuitValido } from "../src/lib/datos/cuit.ts";
import { APELLIDOS, EMPRESA, ENCARGADA, NOMBRES, SEMILLA_POR_DEFECTO, VERSION_ESQUEMA, generar } from "../src/lib/datos/generador.ts";
import { contexto } from "./ayuda.ts";

const H = "2026-11-18";
const e: Estado = generar(SEMILLA_POR_DEFECTO, H);
const d = (n: number) => sumarDias(H, n);

function unidad(interno: number): Unidad {
  const u = e.unidades.find((x) => x.interno === interno && x.estado.tipo !== "baja") ?? e.unidades.find((x) => x.interno === interno);
  if (u === undefined) throw new Error(`no hay unidad ${interno}`);
  return u;
}

function vigente(u: Unidad, tipo: TipoDocumento): Documento {
  const doc = documentoVigente(e.documentos, { tipo: "unidad", id: u.id }, tipo);
  if (doc === undefined) throw new Error(`la unidad ${u.interno} no tiene ${tipo}`);
  return doc;
}

const partesDe = (u: Unidad): Parte[] => e.partes.filter((p) => p.unidadId === u.id).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
const alertas = () => calcularAlertas(e, H);

/** Corre todas las fechas del estado `n` días (en ISO y en dd/mm/aaaa) para comparar dos fechas base. */
function correrFechas(estado: Estado, n: number): unknown {
  const texto = JSON.stringify(estado)
    .replace(/\d{4}-\d{2}-\d{2}/g, (f) => sumarDias(f, n))
    .replace(/(\d{2})\/(\d{2})\/(\d{4})/g, (_m, dd: string, mm: string, aaaa: string) => formatearFecha(sumarDias(`${aaaa}-${mm}-${dd}`, n)));
  return JSON.parse(texto);
}

/** Hash FNV-1a de 32 bits (solo para fijar el contenido del ejemplo en un test). */
function hash(texto: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

describe("D1: el generador es determinista", () => {
  it("D1: dos llamadas con (20261118, 2026-11-18) dan exactamente lo mismo", () => {
    const otra = generar(20261118, "2026-11-18");
    expect(JSON.stringify(otra)).toBe(JSON.stringify(e));
    expect(hash(JSON.stringify(otra))).toBe(hash(JSON.stringify(e)));
  });

  it("D1: con fechaBase 2026-11-25 son las mismas entidades con todas las fechas corridas 7 días", () => {
    const siete = generar(20261118, "2026-11-25");
    expect(correrFechas(e, 7)).toEqual(JSON.parse(JSON.stringify(siete)));
  });

  it("D1: otra semilla da otra flota (pero igual de coherente)", () => {
    const otra = generar(7, H);
    expect(JSON.stringify(otra)).not.toBe(JSON.stringify(e));
    expect(calcularAlertas(otra, H).resumen.protagonista).toBe(4);
  });

  it("D1: el contenido del ejemplo está fijado (si cambia, cambia a propósito: actualizar este hash y el registro)", () => {
    // Si este test falla, se cambió el generador o el orden de las llamadas al azar (docs/diseno.md, 9.3).
    expect(hash(JSON.stringify(e))).toBe(HASH_DEL_EJEMPLO);
  });

  it("el estado generado no comparte referencias entre llamadas (se puede mutar sin afectar a la otra)", () => {
    const a = generar(1, H);
    const b = generar(1, H);
    a.unidades[0]!.interno = 999;
    expect(b.unidades[0]!.interno).not.toBe(999);
  });

  it("tarda poco (el diseño espera menos de 100 ms en Node; acá, con margen para equipos lentos)", () => {
    const t0 = performance.now();
    generar(20261118, H);
    expect(performance.now() - t0).toBeLessThan(500);
  });
});

describe("D3: todo es ficticio y se nota", () => {
  it("la empresa tiene 'Demo' en el nombre y un CUIT ficticio con dígito verificador válido", () => {
    expect(EMPRESA.nombre).toContain("Demo");
    expect(cuitValido(EMPRESA.cuit)).toBe(true);
  });

  it("D3: todas las patentes son válidas y empiezan con Z (serie no emitida)", () => {
    expect(e.unidades.length).toBeGreaterThan(0);
    for (const u of e.unidades) {
      expect(u.patente.startsWith("Z"), u.patente).toBe(true);
      expect(formatoDePatente(u.patente), u.patente).not.toBeNull();
    }
    expect(new Set(e.unidades.map((u) => u.patente)).size).toBe(e.unidades.length);
  });

  it("D3: las unidades de 2016 en adelante tienen patente Mercosur; las anteriores, el formato anterior", () => {
    for (const u of e.unidades) {
      expect(formatoDePatente(u.patente), `${u.patente} (${u.anio})`).toBe(u.anio >= 2016 ? "mercosur" : "anterior");
    }
  });

  it("D3: los nombres salen de las listas inventadas y no se repiten", () => {
    expect(e.conductores).toHaveLength(24);
    const completos = new Set<string>();
    for (const c of e.conductores) {
      const [nombre, apellido] = c.nombre.split(" ");
      expect(NOMBRES).toContain(nombre);
      expect(APELLIDOS).toContain(apellido);
      completos.add(c.nombre);
    }
    expect(completos.size).toBe(24);
    expect(ENCARGADA).toBe("Rocío Medina");
    expect(NOMBRES).not.toContain("Rocío");
    expect(APELLIDOS).not.toContain("Medina");
  });

  it("los números de documento llevan prefijo DEMO- y los emisores 'Demo'", () => {
    for (const doc of e.documentos) {
      expect(doc.numero.startsWith("DEMO-"), doc.numero).toBe(true);
      expect(doc.emisor, doc.id).toMatch(/Demo/);
    }
  });

  it("los proyectos son tres, inventados, y la base de mantenimiento no exige habilitación", () => {
    expect(e.proyectos.map((p) => [p.nombre, p.requiereHabilitacion])).toEqual([
      ["Proyecto Piedra Lunar", true],
      ["Proyecto Arroyo Escondido", true],
      ["Base de mantenimiento", false],
    ]);
  });

  it("ningún texto del ejemplo menciona empresas ni sistemas reales", () => {
    // sin direcciones de correo ni enlaces: nada que pueda ser un dato real de contacto
    const todo = JSON.stringify(e).toLowerCase();
    for (const prohibido of ["@", "http", "www."]) expect(todo.includes(prohibido), prohibido).toBe(false);
  });
});

describe("la flota de relleno", () => {
  it("24 unidades: 14 camionetas, 4 utilitarios, 3 camiones livianos, 2 minibuses activos y 1 de baja", () => {
    expect(e.unidades).toHaveLength(24);
    const activas = e.unidades.filter((u) => u.estado.tipo !== "baja");
    const cuenta = (t: string) => activas.filter((u) => u.tipo === t).length;
    expect([cuenta("camioneta"), cuenta("utilitario"), cuenta("camion-liviano"), cuenta("minibus")]).toEqual([14, 4, 3, 2]);
    expect(e.unidades.filter((u) => u.estado.tipo === "baja")).toHaveLength(1);
  });

  it("los números internos de las unidades activas son únicos y van de 1 a 24", () => {
    const internos = e.unidades.filter((u) => u.estado.tipo !== "baja").map((u) => u.interno);
    expect(new Set(internos).size).toBe(internos.length);
    for (const n of internos) expect(n >= 1 && n <= 24).toBe(true);
  });

  it("referencias consistentes: todo apunta a algo que existe y los ids no se repiten", () => {
    const ids = (lista: { id: string }[]) => new Set(lista.map((x) => x.id));
    const unidades = ids(e.unidades);
    const conductores = ids(e.conductores);
    const proyectos = ids(e.proyectos);
    for (const lista of [e.unidades, e.conductores, e.documentos, e.partes, e.novedades, e.correccionesKm, e.eventos]) {
      expect(ids(lista).size).toBe(lista.length);
    }
    for (const u of e.unidades) {
      expect(proyectos.has(u.proyectoId)).toBe(true);
      if (u.conductorId !== null) expect(conductores.has(u.conductorId)).toBe(true);
    }
    for (const doc of e.documentos) {
      expect((doc.titular.tipo === "unidad" ? unidades : conductores).has(doc.titular.id)).toBe(true);
      if (doc.reemplazaA !== null) expect(e.documentos.some((x) => x.id === doc.reemplazaA)).toBe(true);
    }
    for (const p of e.partes) {
      expect(unidades.has(p.unidadId)).toBe(true);
      if (p.conductorId !== null) expect(conductores.has(p.conductorId)).toBe(true);
    }
    for (const n of e.novedades) expect(unidades.has(n.unidadId)).toBe(true);
    for (const ev of e.eventos) if (ev.unidadId !== null) expect(unidades.has(ev.unidadId)).toBe(true);
  });

  it("partes: uno por unidad y fecha, todas las fechas válidas y ninguna futura", () => {
    const claves = new Set<string>();
    for (const p of e.partes) {
      claves.add(`${p.unidadId}|${p.fecha}`);
      expect(parsearFechaCivil(p.fecha)).toBe(p.fecha);
      expect(diasEntre(p.fecha, H)).toBeGreaterThanOrEqual(1);
    }
    expect(claves.size).toBe(e.partes.length);
  });

  it("hay unos 900 partes cerrados (45 días por unidad en servicio), 1 solo borrador y ninguno en uso", () => {
    const enviados = e.partes.filter((p) => p.estado === "enviado");
    expect(enviados.length).toBeGreaterThan(800);
    expect(enviados.length).toBeLessThan(1100);
    expect(e.partes.filter((p) => p.estado === "borrador")).toHaveLength(1);
    expect(e.partes.filter((p) => p.estado === "en-uso")).toHaveLength(0);
  });

  it("recorrido diario de 40 a 260 km en los partes normales", () => {
    const normales = e.partes.filter((p) => p.estado === "enviado" && !p.sinSalida && p.advertenciasAceptadas.length === 0);
    for (const p of normales) {
      const km = (p.kmFin as number) - (p.kmInicio as number);
      expect(km >= 40 && km <= 260, `${p.id}: ${km}`).toBe(true);
    }
  });

  it("el kilometraje de cada unidad es coherente: K3 y K4 de la salida y K2 y K4 del cierre pasan en todos los partes cerrados", () => {
    for (const p of e.partes.filter((x) => x.estado === "enviado")) {
      const u = e.unidades.find((x) => x.id === p.unidadId)!;
      const salida = validarKmDeSalida({ unidad: u, fecha: p.fecha, kmInicio: p.kmInicio as number, partes: e.partes, correcciones: e.correccionesKm });
      expect(salida.ok, `${u.patente} ${p.fecha} (salida)`).toBe(true);
      const cierre = validarKmDeCierre({ unidad: u, fecha: p.fecha, kmInicio: p.kmInicio as number, kmFin: p.kmFin as number, partes: e.partes, correcciones: e.correccionesKm });
      expect(cierre.ok, `${u.patente} ${p.fecha} (cierre)`).toBe(true);
    }
  });

  it("los partes cerrados tienen todo completo, con la revisión (06:00 a 07:29) y el cierre (18:00 a 19:29) dentro de su día (hora de Argentina)", () => {
    for (const p of e.partes.filter((x) => x.estado === "enviado")) {
      if (!p.sinSalida) expect(p.combustible).not.toBeNull();
      expect(p.conductorId).not.toBeNull();
      expect(p.enviado).not.toBeNull();
      expect(fechaEnArgentina(p.enviado as string), p.id).toBe(p.fecha);
      expect(fechaEnArgentina(p.revisado as string), p.id).toBe(p.fecha);
      expect((p.revisado as string) <= (p.enviado as string), p.id).toBe(true);
      const hora = (i: string): string => new Date(Date.parse(i) - 3 * 3_600_000).toISOString().slice(11, 16);
      expect(hora(p.revisado as string) >= "06:00" && hora(p.revisado as string) <= "07:29", `${p.id} revisión ${hora(p.revisado as string)}`).toBe(true);
      if (!p.sinSalida) expect(hora(p.enviado as string) >= "18:00" && hora(p.enviado as string) <= "19:29", `${p.id} cierre ${hora(p.enviado as string)}`).toBe(true);
      expect(Object.values(p.checklist).every((r) => r.estado !== "sin-responder")).toBe(true);
      if (p.litrosCargados !== null) {
        expect(p.litrosCargados).toBeGreaterThan(0);
        expect(p.litrosCargados).toBeLessThanOrEqual(200);
      }
    }
  });

  it("A3: nunca hay una unidad en servicio con una novedad crítica abierta", () => {
    expect(unidadesEnServicioConNovedadCritica(e)).toEqual([]);
  });

  it("las novedades del pasado están resueltas (solo quedan abiertas las de C11 y C19)", () => {
    const abiertas = e.novedades.filter((n) => n.estado === "abierta");
    expect(abiertas).toHaveLength(2);
    expect(e.novedades.filter((n) => n.estado === "resuelta").length).toBeGreaterThan(3);
    for (const n of e.novedades.filter((x) => x.estado === "resuelta")) {
      expect(n.resolucion).not.toBeNull();
      expect(n.gravedad).toBe("normal");
    }
  });

  it("H3: los eventos están ordenados en el tiempo y su secuencia crece de a uno", () => {
    expect(e.eventos.length).toBeGreaterThan(900);
    e.eventos.forEach((ev, i) => {
      expect(ev.secuencia).toBe(i + 1);
      if (i > 0) expect(ev.instante >= e.eventos[i - 1]!.instante).toBe(true);
      expect(ev.instante <= `${H}T23:59:59.999Z`).toBe(true);
    });
  });

  it("hay un evento 'revision-enviada' por cada parte cerrado y uno 'parte-enviado' por cada uno con salida (los sin salida solo tienen el primero)", () => {
    const cerrados = e.partes.filter((p) => p.estado === "enviado");
    expect(e.eventos.filter((x) => x.tipo === "revision-enviada")).toHaveLength(cerrados.length);
    expect(e.eventos.filter((x) => x.tipo === "parte-enviado")).toHaveLength(cerrados.filter((p) => !p.sinSalida).length);
    for (const p of cerrados) {
      const propios = e.eventos.filter((x) => x.datos["parteId"] === p.id).map((x) => x.tipo);
      expect(propios.filter((t) => t === "revision-enviada" || t === "parte-enviado"), p.id).toEqual(p.sinSalida ? ["revision-enviada"] : ["revision-enviada", "parte-enviado"]);
    }
  });

  it("L1 sobre la historia: ningún parte en uso o cerrado del ejemplo tiene un conductor sin licencia que ampare su fecha", () => {
    for (const p of e.partes.filter((x) => x.estado !== "borrador")) {
      expect(hayDocumentoQueAmpare(e.documentos, { tipo: "conductor", id: p.conductorId as string }, "licencia", p.fecha), `${p.id} ${p.fecha}`).toBe(true);
    }
  });

  it("meta: esquema actual, semilla, fecha base, sin modificar y perfil de encargado", () => {
    expect(e.meta).toEqual({ versionEsquema: VERSION_ESQUEMA, semilla: 20261118, fechaBase: H, modificada: false, perfil: { tipo: "encargado" } });
  });

  it("D2: los vencimientos aleatorios caen a más de 30 días (H+31 a H+400)", () => {
    // Los documentos vigentes que vencen en 30 días o menos son solo los plantados: C01 a C08, C12, C17, C21 y el seguro de la baja (C16).
    const vigentes = e.documentos.filter((doc) => documentoVigente(e.documentos, doc.titular, doc.tipo)?.id === doc.id);
    const cercanos = vigentes.filter((doc) => diasEntre(H, doc.vence) <= 30);
    expect(cercanos).toHaveLength(12);
    for (const doc of vigentes) expect(diasEntre(H, doc.vence)).toBeLessThanOrEqual(400);
  });
});

describe("D2: casos garantizados (docs/diseno.md, 9.2)", () => {
  it("C01: el seguro de ZK 214 BD venció ayer: 'Vencido hace 1 día', hoy no puede salir y su parte de ayer es legítimo", () => {
    const u = e.unidades.find((x) => x.patente === "ZK214BD")!;
    expect(u.interno).toBe(7);
    const seguro = vigente(u, "seguro");
    expect(seguro.vence).toBe(d(-1));
    expect(clasificar(seguro.vence, H).texto).toBe("Vencido hace 1 día");
    const a = aptitud(u, e, H);
    expect(a.puedeSalir).toBe(false);
    expect(a.motivos.map((m) => m.texto)).toEqual(["Seguro vencido hace 1 día"]);
    const ayer = partesDe(u).find((p) => p.fecha === d(-1))!;
    expect(ayer.estado).toBe("enviado");
    expect(ayer.documentacionVencida).toEqual([]);
    expect(partesDe(u).some((p) => p.fecha === H)).toBe(false);
  });

  it("C02: una revisión técnica que vence hoy; la unidad puede salir", () => {
    const u = unidad(1);
    expect(vigente(u, "revision-tecnica").vence).toBe(H);
    expect(aptitud(u, e, H).puedeSalir).toBe(true);
    expect(alertas().alertas.find((a) => a.unidadId === u.id)?.texto).toBe("Vence hoy · Revisión técnica");
  });

  it("C03: una revisión técnica que vence mañana", () => {
    expect(vigente(unidad(2), "revision-tecnica").vence).toBe(d(1));
    expect(clasificar(d(1), H).texto).toBe("Vence mañana");
  });

  it("C04: un seguro que vence en H + 7 (grupo 7)", () => {
    const doc = vigente(unidad(3), "seguro");
    expect(doc.vence).toBe(d(7));
    expect(clasificar(doc.vence, H).grupo).toBe("7");
  });

  it("C05: un matafuego que vence en H + 8 (grupo 15)", () => {
    const doc = vigente(unidad(4), "matafuego");
    expect(doc.vence).toBe(d(8));
    expect(clasificar(doc.vence, H).grupo).toBe("15");
  });

  it("C06: una habilitación que vence en H + 15 (grupo 15)", () => {
    const u = unidad(5);
    expect(e.proyectos.find((p) => p.id === u.proyectoId)?.requiereHabilitacion).toBe(true);
    expect(vigente(u, "habilitacion-proyecto").vence).toBe(d(15));
  });

  it("C07: un seguro que vence en H + 16 (grupo 30)", () => {
    const doc = vigente(unidad(6), "seguro");
    expect(doc.vence).toBe(d(16));
    expect(clasificar(doc.vence, H).grupo).toBe("30");
  });

  it("C08: una revisión técnica que vence en H + 30 (grupo 30)", () => {
    expect(vigente(unidad(8), "revision-tecnica").vence).toBe(d(30));
  });

  it("C09: un seguro que vence en H + 31: no está en las alertas y en la ficha figura vigente", () => {
    const u = unidad(9);
    const doc = vigente(u, "seguro");
    expect(doc.vence).toBe(d(31));
    expect(clasificar(doc.vence, H).estado).toBe("vigente");
    expect(alertas().alertas.some((a) => a.unidadId === u.id)).toBe(false);
  });

  it("C10: una unidad reasignada hoy de la Base a Piedra Lunar, sin habilitación (sus partes anteriores eran válidos)", () => {
    const u = unidad(10);
    expect(e.proyectos.find((p) => p.id === u.proyectoId)?.nombre).toBe("Proyecto Piedra Lunar");
    const cambio = e.eventos.find((x) => x.unidadId === u.id && x.tipo === "asignacion-cambiada")!;
    expect(fechaEnArgentina(cambio.instante)).toBe(H);
    // B7: a las 00:00 de Argentina del día base, así nunca es posterior a "ahora" (03:00Z)
    expect(cambio.instante).toBe(`${H}T03:00:00.000Z`);
    expect((cambio.datos["antes"] as { proyectoId: string }).proyectoId).toBe(e.proyectos.find((p) => p.nombre === "Base de mantenimiento")!.id);
    expect(documentoVigente(e.documentos, { tipo: "unidad", id: u.id }, "habilitacion-proyecto")).toBeUndefined();
    expect(aptitud(u, e, H).motivos.map((m) => m.texto)).toEqual(["Falta cargar: Habilitación de ingreso al proyecto"]);
    expect(partesDe(u).every((p) => p.documentacionVencida.length === 0)).toBe(true);
    expect(partesDe(u).some((p) => p.fecha === d(-1))).toBe(true);
  });

  it("C11: fuera de servicio por una novedad crítica de frenos del parte de H - 2 (y A4 impide volver)", () => {
    const u = unidad(11);
    expect(u.estado).toMatchObject({ tipo: "fuera-de-servicio", desde: d(-2), origen: "novedad-critica", motivo: "Novedad crítica en frenos" });
    const n = e.novedades.find((x) => x.unidadId === u.id && x.estado === "abierta")!;
    expect(n).toMatchObject({ gravedad: "critica", fecha: d(-2), origen: { tipo: "parte", item: "frenos" } });
    expect(u.estado.tipo === "fuera-de-servicio" && u.estado.novedadIds).toEqual([n.id]);
    const parte = partesDe(u).at(-1)!;
    expect(parte.fecha).toBe(d(-2));
    expect(parte.estado).toBe("enviado");
    expect(parte.checklist.frenos.estado).toBe("con-novedad");
    // P16: la revisión informó la novedad y el parte se cerró sin salida, con recorrido 0
    expect(parte).toMatchObject({ sinSalida: true, combustible: null, litrosCargados: null });
    expect(parte.kmFin).toBe(parte.kmInicio);
    expect(parte.enviado).toBe(parte.revisado);
    const r = ejecutar(e, { tipo: "volverAServicio", unidadId: u.id }, contexto());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toBe(`Antes de volver a servicio, resuelva: Frenos (parte del ${formatearFecha(d(-2))}).`);
    // los tres eventos de la revisión (no hay «parte cerrado» aparte)
    const mismos = e.eventos.filter((x) => x.unidadId === u.id && x.instante === parte.revisado);
    expect(mismos.map((x) => x.tipo)).toEqual(["revision-enviada", "novedad-abierta", "fuera-de-servicio"]);
    expect(e.eventos.some((x) => x.unidadId === u.id && x.tipo === "parte-enviado" && x.datos["parteId"] === parte.id)).toBe(false);
  });

  it("C12: fuera de servicio a mano ('En taller: cambio de embrague') desde H - 5, con la revisión a H + 5", () => {
    const u = unidad(12);
    expect(u.estado).toEqual({ tipo: "fuera-de-servicio", desde: d(-5), motivo: "En taller: cambio de embrague", origen: "manual", novedadIds: [] });
    expect(vigente(u, "revision-tecnica").vence).toBe(d(5));
    expect(alertas().alertas.find((a) => a.unidadId === u.id)).toMatchObject({ grupo: "7", texto: "Vence en 5 días · Revisión técnica" });
    expect(partesDe(u).every((p) => p.fecha < d(-5))).toBe(true);
  });

  it("C13: un borrador de parte de H - 1 sin enviar", () => {
    const b = e.partes.find((p) => p.estado === "borrador")!;
    expect(b.fecha).toBe(d(-1));
    expect(b.enviado).toBeNull();
    const a = alertas().alertas.filter((x) => x.tipo === "parte-sin-enviar");
    expect(a).toHaveLength(1);
    expect(a[0]?.unidadId).toBe(b.unidadId);
    expect(a[0]?.texto).toMatch(/^Parte del \d{2}\/\d{2}\/\d{4} sin enviar \(iniciado por [A-ZÁÉÍÓÚÑ]\. \S+\)$/);
  });

  it("C14: dos unidades en servicio sin parte de H - 1", () => {
    const sin = alertas().alertas.filter((x) => x.tipo === "sin-parte");
    expect(sin).toHaveLength(2);
    for (const a of sin) {
      const u = e.unidades.find((x) => x.id === a.unidadId)!;
      expect(u.estado.tipo).toBe("en-servicio");
      expect(partesDe(u).some((p) => p.fecha === d(-1))).toBe(false);
      expect(partesDe(u).some((p) => p.fecha === d(-2))).toBe(true);
    }
  });

  it("M3: ningún conductor tiene más de un parte por día; los 8 de relevo no tienen unidad propia y se turnan en las unidades sin conductor asignado", () => {
    const porDia = new Map<string, number>();
    for (const p of e.partes) porDia.set(`${p.conductorId}|${p.fecha}`, (porDia.get(`${p.conductorId}|${p.fecha}`) ?? 0) + 1);
    expect([...porDia].filter(([, n]) => n > 1)).toEqual([]);
    const conUnidad = new Set(e.unidades.flatMap((u) => (u.conductorId === null ? [] : [u.conductorId])));
    const sinUnidad = e.conductores.filter((c) => !conUnidad.has(c.id));
    expect(conUnidad.size).toBe(16);
    expect(sinUnidad).toHaveLength(8);
    // las unidades sin conductor asignado las conducen solo los de relevo, y ellos solo conducen esas unidades
    const sinConductor = new Set(e.unidades.filter((u) => u.conductorId === null).map((u) => u.id));
    for (const p of e.partes) {
      const esDeRelevo = sinUnidad.some((c) => c.id === p.conductorId);
      expect(esDeRelevo, `${p.unidadId} ${p.fecha}`).toBe(sinConductor.has(p.unidadId) || (p.unidadId === unidad(16).id && p.fecha >= d(-2)));
    }
    // todos activos, con licencia vigente a la fecha de cada parte
    for (const c of sinUnidad) {
      expect(c.activo).toBe(true);
      expect((documentoVigente(e.documentos, { tipo: "conductor", id: c.id }, "licencia")?.vence ?? "") > d(30)).toBe(true);
    }
  });

  it("C21: conductor activo con licencia vencida en H - 3 y unidad asignada que puede salir; los partes de H - 2 y H - 1 los firmó otro conductor con licencia vigente", () => {
    const c = e.conductores.find((x) => documentoVigente(e.documentos, { tipo: "conductor", id: x.id }, "licencia")?.vence === d(-3));
    expect(c).toBeDefined();
    if (c === undefined) return;
    expect(c.activo).toBe(true);
    const lic = e.documentos.filter((x) => x.tipo === "licencia" && x.titular.id === c.id);
    expect(lic).toHaveLength(1);
    const u = e.unidades.find((x) => x.conductorId === c.id)!;
    expect(u.estado.tipo).toBe("en-servicio");
    expect(aptitud(u, e, H).puedeSalir).toBe(true);
    expect(partesDe(u).filter((p) => p.fecha >= d(-2)).map((p) => [p.fecha, p.conductorId !== c.id])).toEqual([[d(-2), true], [d(-1), true]]);
    for (const p of partesDe(u).filter((x) => x.fecha >= d(-2))) {
      expect(hayDocumentoQueAmpare(e.documentos, { tipo: "conductor", id: p.conductorId as string }, "licencia", p.fecha)).toBe(true);
      expect(e.conductores.find((x) => x.id === p.conductorId)?.activo).toBe(true);
    }
    // sin otros casos plantados: nada más alerta sobre esa unidad
    expect(alertas().alertas.filter((a) => a.unidadId === u.id)).toEqual([]);
    expect(alertas().alertas.find((a) => a.conductorId === c.id)).toMatchObject({ gravedad: "critica", grupo: "vencidos", texto: "Vencida hace 3 días · Licencia de conducir" });
    expect(alertas().resumen.conductoresSinLicencia.map((x) => x.conductorId)).toEqual([c.id]);
  });

  it("C15: un parte de H - 4 con un salto de 1.250 km aceptado", () => {
    const p = e.partes.find((x) => x.advertenciasAceptadas.some((a) => a.tipo === "salto-km"))!;
    expect(p.fecha).toBe(d(-4));
    expect(p.advertenciasAceptadas).toEqual([{ tipo: "salto-km", km: 1250 }]);
    const anterior = partesDe(e.unidades.find((u) => u.id === p.unidadId)!).find((x) => x.fecha === d(-5))!;
    expect((p.kmInicio as number) - (anterior.kmFin as number)).toBe(1250);
    const ev = e.eventos.find((x) => x.datos["parteId"] === p.id)!;
    expect(ev.datos["advertencias"]).toEqual([{ tipo: "salto-km", km: 1250 }]);
  });

  it("C16: una unidad dada de baja con el seguro vencido, que no alerta; conserva todo", () => {
    const u = e.unidades.find((x) => x.estado.tipo === "baja")!;
    expect(u.estado).toMatchObject({ tipo: "baja", desde: d(-28) });
    const seguro = documentoVigente(e.documentos, { tipo: "unidad", id: u.id }, "seguro")!;
    expect(diasEntre(H, seguro.vence)).toBeLessThan(0);
    expect(alertas().alertas.some((a) => a.unidadId === u.id)).toBe(false);
    expect(partesDe(u).length).toBeGreaterThan(5);
    expect(e.eventos.some((x) => x.unidadId === u.id && x.tipo === "unidad-baja")).toBe(true);
    expect(calcularAlertas(e, H).resumen.activas).toBe(23);
  });

  it("C17: la licencia de un conductor vence en H + 12 (grupo 15)", () => {
    const licencias = e.documentos.filter((doc) => doc.tipo === "licencia" && doc.vence === d(12));
    expect(licencias).toHaveLength(1);
    const a = alertas().alertas.find((x) => x.documentoId === licencias[0]!.id)!;
    expect(a).toMatchObject({ grupo: "15", texto: "Vence en 12 días · Licencia de conducir" });
    expect(a.conductorId).toBe(licencias[0]!.titular.id);
  });

  it("C18: revisión técnica vencida en H - 7 y renovada en H - 6 antes de la revisión del día: el parte de H - 6 sale con los papeles en regla (P21)", () => {
    const u = unidad(14);
    const nueva = vigente(u, "revision-tecnica");
    const vieja = e.documentos.find((x) => x.id === nueva.reemplazaA)!;
    expect(vieja.vence).toBe(d(-7));
    expect(fechaEnArgentina(nueva.cargado)).toBe(d(-6));
    const delDia = e.partes.find((x) => x.unidadId === u.id && x.fecha === d(-6))!;
    expect(nueva.cargado < (delDia.revisado as string)).toBe(true);
    expect(delDia.documentacionVencida).toEqual([]);
    expect(delDia.advertenciasAceptadas).toEqual([]);
    expect(diasEntre(H, nueva.vence)).toBeGreaterThan(30);
    expect(e.eventos.some((x) => x.tipo === "documento-renovado" && x.datos["documentoId"] === nueva.id)).toBe(true);
    expect(calcularAlertas(e, H).alertas.some((x) => x.tipo === "uso-con-documentacion-vencida")).toBe(false);
  });

  it("C18, M1: la renovación de H - 6 ampara el parte de ese día; sin la fecha de emisión y cargada después, no", () => {
    const u = unidad(14);
    const proyecto = e.proyectos.find((x) => x.id === u.proyectoId)!;
    const renovacion = vigente(u, "revision-tecnica");
    const evaluar = (documentos: Documento[]) => documentacionVencidaEn({ fecha: d(-6), unidad: u, proyecto, documentos });
    expect(evaluar(e.documentos)).toEqual([]);
    const tarde = e.documentos.map((doc) => (doc.id === renovacion.id ? { ...doc, emitido: null, cargado: `${d(-5)}T15:00:00.000Z` } : doc));
    expect(evaluar(tarde)).toEqual(["revision-tecnica"]);
  });

  it("P21: ningún parte del ejemplo salió con la documentación de la unidad vencida (las renovaciones del pasado se hicieron antes de vencer o a tiempo)", () => {
    expect(e.partes.filter((x) => x.documentacionVencida.length > 0)).toEqual([]);
    expect(e.partes.flatMap((x) => x.advertenciasAceptadas).some((a) => a.tipo === "documentacion-vencida")).toBe(false);
    // recalculado a la fecha de cada parte (salvo C10, que cambió de proyecto hoy)
    const c10 = unidad(10);
    for (const p of e.partes.filter((x) => x.estado === "enviado" && x.unidadId !== c10.id)) {
      const u = e.unidades.find((x) => x.id === p.unidadId)!;
      const proyecto = e.proyectos.find((x) => x.id === u.proyectoId)!;
      expect(documentacionVencidaEn({ fecha: p.fecha, unidad: u, proyecto, documentos: e.documentos }), `${u.patente} ${p.fecha}`).toEqual([]);
    }
  });

  it("C19: una novedad normal abierta desde H - 9 ('Luz de patente quemada')", () => {
    const n = e.novedades.find((x) => x.gravedad === "normal" && x.estado === "abierta")!;
    expect(n).toMatchObject({ descripcion: "Luz de patente quemada", fecha: d(-9) });
    expect(alertas().alertas.find((a) => a.id === `novedad:${n.id}`)?.texto).toBe("Luz de patente quemada · abierta hace 9 días");
    const parte = e.partes.find((p) => n.origen.tipo === "parte" && p.id === n.origen.parteId)!;
    expect(parte.fecha).toBe(d(-9));
    expect(parte.otraNovedad).toEqual({ descripcion: "Luz de patente quemada", impideUso: false });
  });

  it("C20: una corrección de kilometraje en H - 20 (cambio de tablero) que K3 y K8 respetan", () => {
    expect(e.correccionesKm).toHaveLength(1);
    const k = e.correccionesKm[0]!;
    expect(k.desde).toBe(d(-20));
    expect(k.kmBase).toBe(120);
    expect(k.motivo).toMatch(/tablero/i);
    const u = e.unidades.find((x) => x.id === k.unidadId)!;
    const despues = partesDe(u).filter((p) => p.fecha >= k.desde);
    expect(despues[0]!.kmInicio).toBe(120);
    expect(kmActual(u.id, e.partes, e.correccionesKm)).toBe(despues.at(-1)!.kmFin);
    expect(e.eventos.some((x) => x.tipo === "km-corregido" && x.unidadId === u.id)).toBe(true);
  });
});

describe("D2: el ejemplo completo con H = 2026-11-18 (docs/diseno.md, 9.2)", () => {
  const { resumen } = alertas();

  it("protagonista 4 (2 no pueden salir + 2 fuera de servicio) y 19 disponibles de 23 activas", () => {
    expect(resumen.protagonista).toBe(4);
    expect(resumen.noPuedenSalir).toHaveLength(2);
    expect(resumen.fueraDeServicio).toHaveLength(2);
    expect(resumen.disponibles).toBe(19);
    expect(resumen.activas).toBe(23);
  });

  it("vencidos y faltantes 3 (C01, C10, C21); 7 días o menos 4; 8 a 15 días 3; 16 a 30 días 2; 12 vencimientos en total", () => {
    expect(resumen.porGrupo).toEqual({ vencidos: 3, "7": 4, "15": 3, "30": 2 });
    expect(Object.values(resumen.porGrupo).reduce((a, b) => a + b, 0)).toBe(12);
  });

  it("pendientes de operación 5: C11, C13, C14 (x2) y C19 (antes de P21, 6: también C18, «Circuló con documentación vencida»)", () => {
    expect(resumen.totalOperacion).toBe(5);
    expect(resumen.operacion).toEqual({
      "novedad-critica": 1,
      "uso-con-documentacion-vencida": 0,
      "parte-sin-enviar": 1,
      "sin-parte": 2,
      "novedad-abierta": 1,
    });
  });

  it("alertas críticas (insignia de la pestaña) 4: C01, C10, C11 y C21 (antes de P21, 5: también C18)", () => {
    expect(resumen.criticas).toBe(4);
  });

  it("conductores que no pueden manejar hoy (L6): 1, el de C21", () => {
    expect(resumen.conductoresSinLicencia).toHaveLength(1);
  });

  it("el horizonte tiene 9 puntos (4 + 3 + 2)", () => {
    const { horizonte } = alertas();
    expect(horizonte).toHaveLength(9);
    expect(horizonte.map((p) => p.dia)).toEqual([0, 1, 5, 7, 8, 12, 15, 16, 30]);
  });

  it("la coherencia se mantiene con otra fecha base: mismas cifras con H = 2026-12-01 y H = 2027-02-28", () => {
    for (const base of ["2026-12-01", "2027-02-28", "2028-02-29"]) {
      const otro = generar(20261118, base);
      const r = calcularAlertas(otro, base).resumen;
      expect(r.protagonista, base).toBe(4);
      expect(r.porGrupo, base).toEqual({ vencidos: 3, "7": 4, "15": 3, "30": 2 });
      expect(r.totalOperacion, base).toBe(5);
      expect(r.criticas, base).toBe(4);
      expect(r.conductoresSinLicencia, base).toHaveLength(1);
      expect(unidadesEnServicioConNovedadCritica(otro), base).toEqual([]);
    }
  });
});

describe("el ejemplo reacciona a los comandos (criterio de la pantalla 4.2)", () => {
  const ctx = () => contexto();

  it("renovar el seguro de ZK 214 BD (C01) lo saca de la lista y de 'No pueden salir'", () => {
    const u = e.unidades.find((x) => x.patente === "ZK214BD")!;
    const seguro = vigente(u, "seguro");
    const r = ejecutar(e, { tipo: "renovarDocumento", documentoId: seguro.id, numero: "DEMO-88-9999", emisor: "Seguros Puna Demo", vence: d(365), emitido: null }, ctx());
    if (!r.ok) throw new Error(r.error.mensaje);
    const { resumen, alertas: lista } = calcularAlertas(r.valor.estado, H);
    expect(resumen.protagonista).toBe(3);
    expect(resumen.porGrupo.vencidos).toBe(2);
    expect(resumen.disponibles).toBe(20);
    expect(lista.some((a) => a.unidadId === u.id)).toBe(false);
  });

  it("volver a servicio la unidad del taller (C12) se permite y deja de contar como fuera de servicio (A5)", () => {
    const u = unidad(12);
    const r = ejecutar(e, { tipo: "volverAServicio", unidadId: u.id }, ctx());
    if (!r.ok) throw new Error(r.error.mensaje);
    expect(calcularAlertas(r.valor.estado, H).resumen.fueraDeServicio).toHaveLength(1);
    expect(unidadesEnServicioConNovedadCritica(r.valor.estado)).toEqual([]);
  });

  it("resolver la novedad de frenos (C11) y volver a servicio en un paso", () => {
    const n = e.novedades.find((x) => x.estado === "abierta" && x.gravedad === "critica")!;
    const r = ejecutar(e, { tipo: "resolverNovedad", novedadId: n.id, texto: "Se cambiaron las pastillas", volverAServicio: true }, ctx());
    if (!r.ok) throw new Error(r.error.mensaje);
    const resumen = calcularAlertas(r.valor.estado, H).resumen;
    expect(resumen.protagonista).toBe(3);
    expect(resumen.operacion["novedad-critica"]).toBe(0);
    expect(r.valor.eventos.map((x) => x.tipo)).toEqual(["novedad-resuelta", "vuelta-a-servicio"]);
  });

  it("completar y enviar la revisión del borrador de ayer (C13): la alerta pasa de «sin enviar» a «sin cerrar», con aviso de fuera de plazo; al cerrarlo desaparece", () => {
    const b = e.partes.find((p) => p.estado === "borrador")!;
    const guardado = ejecutar(
      e,
      {
        tipo: "guardarBorrador",
        parteId: b.id,
        unidadId: b.unidadId,
        fecha: b.fecha,
        conductorId: b.conductorId,
        kmInicio: b.kmInicio,
        kmFin: (b.kmInicio as number) + 120,
        combustible: "medio",
        litrosCargados: null,
        checklist: Object.fromEntries(Object.keys(b.checklist).map((k) => [k, { estado: "en-orden" }])) as Parte["checklist"],
        otraNovedad: null,
      },
      ctx(),
    );
    if (!guardado.ok) throw new Error(guardado.error.mensaje);
    const enviado = ejecutar(guardado.valor.estado, { tipo: "enviarRevision", parteId: b.id, advertenciasAceptadas: [] }, ctx());
    if (!enviado.ok) throw new Error(enviado.error.mensaje);
    expect(enviado.valor.eventos[0]?.datos["fueraDeTermino"]).toBe(true);
    const enUso = calcularAlertas(enviado.valor.estado, H).alertas.filter((a) => a.tipo === "parte-sin-enviar");
    expect(enUso).toHaveLength(1);
    expect(enUso[0]).toMatchObject({ etapaParte: "en-uso" });
    const cerrado = ejecutar(enviado.valor.estado, { tipo: "guardarCierre", parteId: b.id, kmFin: (b.kmInicio as number) + 120, combustible: "medio", litrosCargados: null }, ctx());
    if (!cerrado.ok) throw new Error(cerrado.error.mensaje);
    const fin = ejecutar(cerrado.valor.estado, { tipo: "enviarCierre", parteId: b.id, advertenciasAceptadas: [] }, ctx());
    if (!fin.ok) throw new Error(fin.error.mensaje);
    expect(calcularAlertas(fin.valor.estado, H).resumen.operacion["parte-sin-enviar"]).toBe(0);
  });

  it("el parte de hoy de una unidad en servicio se puede abrir, revisar y cerrar (kilometraje continúa)", () => {
    const u = unidad(1);
    const km = kmActual(u.id, e.partes, e.correccionesKm)!;
    const c = ctx();
    const g = ejecutar(
      e,
      {
        tipo: "guardarBorrador", parteId: null, unidadId: u.id, fecha: H, conductorId: u.conductorId, kmInicio: km, kmFin: null, combustible: null, litrosCargados: null,
        checklist: Object.fromEntries(Object.keys(partesDe(u)[0]!.checklist).map((k) => [k, { estado: "en-orden" }])) as Parte["checklist"], otraNovedad: null,
      },
      c,
    );
    if (!g.ok) throw new Error(g.error.mensaje);
    const id = g.valor.cambios.partes[0]!.id;
    const revisado = ejecutar(g.valor.estado, { tipo: "enviarRevision", parteId: id, advertenciasAceptadas: [] }, c);
    if (!revisado.ok) throw new Error(revisado.error.mensaje);
    expect(kmActual(u.id, revisado.valor.estado.partes, revisado.valor.estado.correccionesKm)).toBe(km);
    const cierre = ejecutar(revisado.valor.estado, { tipo: "guardarCierre", parteId: id, kmFin: km + 90, combustible: "lleno", litrosCargados: 45.5 }, c);
    if (!cierre.ok) throw new Error(cierre.error.mensaje);
    const cerrado = ejecutar(cierre.valor.estado, { tipo: "enviarCierre", parteId: id, advertenciasAceptadas: [] }, c);
    expect(cerrado.ok).toBe(true);
    if (cerrado.ok) expect(kmActual(u.id, cerrado.valor.estado.partes, cerrado.valor.estado.correccionesKm)).toBe(km + 90);
  });
});

const HASH_DEL_EJEMPLO = "08ce263e";
