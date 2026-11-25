// Paso 4.4 (lógica): lo que dibuja la ficha de unidad (docs/diseno-ui.md, 6.3 y 5.16), con el ejemplo del generador.
import { describe, expect, it } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { ejecutar } from "../src/lib/dominio/comandos.ts";
import { historialDeUnidad } from "../src/lib/dominio/historial.ts";
import { kmActual } from "../src/lib/dominio/kilometraje.ts";
import { textoAdvertencia } from "../src/lib/dominio/textos.ts";
import type { Estado, Perfil } from "../src/lib/dominio/tipos.ts";
import {
  PASO_HISTORIAL_ANCHO,
  PASO_HISTORIAL_ANGOSTO,
  fichaDeUnidad,
  vistaDeHistorial,
  type FichaDeUnidad,
  type FichaNoEncontrada,
} from "../src/lib/estado/ficha.ts";
import { contexto, flotaDePrueba, parte } from "./ayuda.ts";

const H = "2026-11-18";
const ENCARGADO: Perfil = { tipo: "encargado" };
const e: Estado = generar(SEMILLA_POR_DEFECTO, H);

function fichaDe(estado: Estado, patente: string, perfil: Perfil = ENCARGADO, hoy = H): FichaDeUnidad {
  const f = fichaDeUnidad(estado, calcularAlertas(estado, hoy), hoy, patente, perfil);
  if (!f.encontrada) throw new Error(`No hay ficha de ${patente}`);
  return f;
}

describe("unidad que no existe", () => {
  it("dice que no se encontró, con la patente escrita bien, y ofrece volver a la flota", () => {
    const f: FichaDeUnidad | FichaNoEncontrada = fichaDeUnidad(e, calcularAlertas(e, H), H, "ZZ999ZZ", ENCARGADO);
    expect(f).toEqual({
      encontrada: false,
      titulo: "No se encontró la unidad",
      mensaje: "No hay ninguna unidad con la patente ZZ 999 ZZ.",
      patenteTexto: "ZZ 999 ZZ",
      enlace: { texto: "Ir a Movilidades", href: "#/movilidades" },
    });
  });
});

describe("encabezado de ZK 214 BD (C01: seguro vencido hace 1 día)", () => {
  const f = fichaDe(e, "ZK214BD");

  it("qué unidad es", () => {
    expect(f).toMatchObject({
      unidadId: "u-07",
      patente: "ZK214BD",
      patenteTexto: "ZK 214 BD",
      interno: "Int. 07",
      internoNumero: 7,
      descripcion: "Toyota Hilux 2022 · Camioneta",
    });
    expect(f.migas).toEqual([
      { texto: "Movilidades", href: "#/movilidades" },
      { texto: "ZK 214 BD", href: null },
    ]);
  });

  it("si puede salir y por qué (A1): «Bloqueada · Seguro vencido hace 1 día»", () => {
    expect(f.aptitud).toEqual({
      categoria: "no-puede-salir",
      etiqueta: "Bloqueada",
      motivos: ["Seguro vencido hace 1 día"],
      linea: "Seguro vencido hace 1 día",
      mostrarLista: false,
    });
  });

  it("con más de dos motivos solo dice cuántos y pide la lista debajo", () => {
    const sinDocs = { ...e, documentos: e.documentos.filter((d) => d.titular.id !== "u-07") };
    const g = fichaDe(sinDocs, "ZK214BD");
    expect(g.aptitud.motivos).toHaveLength(4);
    expect(g.aptitud).toMatchObject({ linea: "4 motivos", mostrarLista: true });
  });

  it("proyecto, conductor y kilometraje con la fecha de su último registro (K8)", () => {
    const km = kmActual("u-07", e.partes, e.correccionesKm);
    expect(km).not.toBeNull();
    expect(f.datos.proyecto).toBe("Proyecto Piedra Lunar");
    expect(f.datos.conductor).toBe("Tamara Olivera");
    expect(f.datos.km.valor).toBe(km);
    expect(f.datos.km.textoConFecha).toMatch(/^\d{1,3}(\.\d{3})* km \(al 17\/11\/2026\)$/);
    expect(f.datos.km.fecha).toBe("17/11/2026");
  });

  it("sin registros: «Sin registros» y sin fecha; sin conductor, `null`", () => {
    const g = fichaDe({ ...e, partes: e.partes.filter((p) => p.unidadId !== "u-07"), unidades: e.unidades.map((u) => (u.id === "u-07" ? { ...u, conductorId: null } : u)) }, "ZK214BD");
    expect(g.datos.km).toEqual({ valor: null, texto: "Sin registros", fecha: null, textoConFecha: "Sin registros" });
    expect(g.datos.conductor).toBeNull();
  });

  it("acciones del encabezado (en servicio): cargar parte con enlace al parte de hoy y poner fuera de servicio; las demás, en «Más acciones»", () => {
    expect(f.puedeEditar).toBe(true);
    expect(f.acciones.encabezado).toEqual([
      { id: "cargar-parte", etiqueta: "Cargar parte", href: "#/parte/ZK214BD/2026-11-18", bloqueo: null },
      { id: "poner-fuera-de-servicio", etiqueta: "Poner fuera de servicio", href: null, bloqueo: null },
    ]);
    expect(f.acciones.masAcciones.map((a) => [a.id, a.etiqueta])).toEqual([
      ["corregir-kilometraje", "Corregir kilometraje"],
      ["cambiar-asignacion", "Cambiar proyecto o conductor"],
      ["cargar-novedad", "Cargar novedad"],
      ["dar-de-baja", "Dar de baja"],
    ]);
    expect(f.aviso).toBeNull();
  });

  it("con el perfil Conductor no hay ninguna acción (la ficha es del encargado)", () => {
    const g = fichaDe(e, "ZK214BD", { tipo: "conductor", conductorId: "c-07" });
    expect(g.puedeEditar).toBe(false);
    expect(g.acciones).toEqual({ encabezado: [], masAcciones: [] });
    expect(g.documentos.filas.flatMap((x) => x.acciones)).toEqual([]);
    expect(g.novedades.abiertas.flatMap((x) => (x.accion === null ? [] : [x.accion]))).toEqual([]);
    expect(g.novedades.cargar).toBeNull();
    expect(g.documentos.cargarOtro).toBeNull();
    expect(g.kilometraje.corregir).toBeNull();
  });
});

describe("panel Documentos", () => {
  const f = fichaDe(e, "ZK214BD");
  const d = f.documentos;

  it("título, cabecera con vencidos y horizonte mediano de la unidad (solo sus documentos)", () => {
    expect(d.titulo).toBe("Documentos");
    expect(d.rotuloCantidad).toBe("4 · 1 vencido");
    expect(d.horizonte.variante).toBe("mediana");
    expect(d.horizonte.vencidos).toBe(1);
  });

  it("una fila por documento obligatorio, en el orden de los requisitos (5.1)", () => {
    expect(d.filas.map((x) => x.tipo)).toEqual(["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"]);
  });

  it("el seguro vencido: número, vence, estado crítico (V1) y las acciones Renovar y Corregir", () => {
    const seguro = d.filas[0];
    expect(seguro).toMatchObject({
      nombre: "Seguro",
      documentoId: "d-0031",
      vence: "17/11/2026",
      estado: { tipo: "vencido", texto: "Vencido hace 1 día", tono: "critico" },
    });
    expect(seguro?.numero).toMatch(/^DEMO-/);
    expect(seguro?.acciones.map((a) => [a.tipo, a.etiqueta, a.nombreAccesible, a.documentoId])).toEqual([
      ["renovar", "Renovar", "Renovar seguro de ZK 214 BD", "d-0031"],
      ["corregir", "Corregir", "Corregir seguro de ZK 214 BD", "d-0031"],
    ]);
  });

  it("un documento vigente dice «Vigente hasta» y su fecha, sin alerta (V6)", () => {
    const rt = d.filas[1];
    expect(rt?.estado).toEqual({ tipo: "vigente", texto: "Vigente hasta 02/09/2027", tono: "vigente" });
  });

  it("los documentos reemplazados quedan en «Anteriores (N)», del más nuevo al más viejo, y no son filas", () => {
    const matafuego = d.filas[2];
    expect(matafuego?.documentoId).toBe("d-0034");
    expect(matafuego?.rotuloAnteriores).toBe("Anteriores (1)");
    expect(matafuego?.anteriores).toEqual([expect.objectContaining({ documentoId: "d-0033", vence: "07/05/2026" })]);
    expect(d.filas[1]?.anteriores).toEqual([]);
    expect(d.filas[1]?.rotuloAnteriores).toBeNull();
  });

  it("un documento por vencer lleva su plazo y el tono del tramo (V2 a V5)", () => {
    const con = { ...e, documentos: e.documentos.map((x) => (x.id === "d-0032" ? { ...x, vence: "2026-11-24" } : x)) };
    expect(fichaDe(con, "ZK214BD").documentos.filas[1]?.estado).toEqual({ tipo: "por-vencer", texto: "Vence en 6 días", tono: "semana" });
    const hoy = { ...e, documentos: e.documentos.map((x) => (x.id === "d-0032" ? { ...x, vence: H } : x)) };
    expect(fichaDe(hoy, "ZK214BD").documentos.filas[1]?.estado).toMatchObject({ tipo: "por-vencer", texto: "Vence hoy", tono: "semana" });
  });

  it("C10: la habilitación que falta es una fila «Falta cargar» con la acción Cargar (y «Cargar otro documento» la ofrece)", () => {
    const g = fichaDe(e, "ZZD563").documentos;
    const falta = g.filas.find((x) => x.tipo === "habilitacion-proyecto");
    expect(falta).toMatchObject({
      documentoId: null,
      numero: null,
      vence: "—",
      estado: { tipo: "faltante", texto: "Falta cargar", tono: "critico" },
    });
    expect(falta?.acciones).toEqual([
      { tipo: "cargar", etiqueta: "Cargar", nombreAccesible: "Cargar habilitación de ingreso al proyecto de ZZD 563", documentoId: null, tipoDocumento: "habilitacion-proyecto" },
    ]);
    expect(g.rotuloCantidad).toBe("4 · 1 faltante");
    expect(g.cargarOtro).toEqual({ etiqueta: "Cargar otro documento" });
  });

  it("«Cargar otro documento» no se ofrece si la unidad ya tiene todos", () => {
    expect(d.cargarOtro).toBeNull();
  });

  it("la habilitación de ingreso cargada en un proyecto que no la pide también se muestra (generalización de V17)", () => {
    const conExtra = {
      ...e,
      documentos: [...e.documentos, { id: "x", titular: { tipo: "unidad" as const, id: "u-24" }, tipo: "habilitacion-proyecto" as const, numero: "DEMO-X", emisor: "", vence: "2027-01-01", emitido: null, cargado: "2026-01-01T12:00:00.000Z", reemplazaA: null }],
    };
    const base = fichaDe(conExtra, "ZUE512").documentos;
    expect(base.filas.map((x) => x.tipo)).toContain("habilitacion-proyecto");
  });
});

describe("panel Novedades", () => {
  const resueltasDe = (unidadId: string) =>
    e.novedades.filter((x) => x.unidadId === unidadId && x.estado === "resuelta").sort((a, b) => (a.resolucion?.instante ?? "") < (b.resolucion?.instante ?? "") ? 1 : -1);

  it("sin novedades abiertas: «0 abiertas», vacío y la acción de cargar", () => {
    const n = fichaDe(e, "ZK214BD").novedades;
    expect(n.titulo).toBe("Novedades");
    expect(n.rotuloCantidad).toBe("0 abiertas");
    expect(n.filtros).toEqual([
      { id: "abiertas", etiqueta: "Abiertas", cantidad: 0 },
      { id: "resueltas", etiqueta: "Resueltas", cantidad: resueltasDe("u-07").length },
    ]);
    expect(n.abiertas).toEqual([]);
    expect(n.vacioAbiertas).toBe("Sin novedades abiertas.");
    expect(n.vacioResueltas).toBe("Sin novedades resueltas.");
    expect(n.cargar).toEqual({ etiqueta: "Cargar novedad" });
  });

  it("las resueltas muestran qué se hizo, quién y cuándo; la más reciente primero", () => {
    const esperadas = resueltasDe("u-07");
    const r = fichaDe(e, "ZK214BD").novedades.resueltas;
    expect(r.map((x) => x.novedadId)).toEqual(esperadas.map((x) => x.id));
    expect(r[0]).toMatchObject({
      estado: "Resuelta",
      texto: expect.stringContaining(esperadas[0]?.descripcion ?? ""),
      resolucion: { texto: esperadas[0]?.resolucion?.texto, autor: "Rocío Medina" },
      accion: null,
      impideVolver: false,
    });
    expect(r[0]?.resolucion?.fecha).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  it("una abierta normal (C19) es «Abierta» con la acción Resolver; no impide volver ni ofrece volver a servicio", () => {
    const patente = e.unidades.find((u) => u.id === "u-19")?.patente ?? "";
    const g = fichaDe(e, patente).novedades;
    expect(g.rotuloCantidad).toBe("1 abierta");
    expect(g.abiertas[0]).toMatchObject({
      novedadId: "n-009",
      gravedad: "normal",
      estado: "Abierta",
      texto: "Luz de patente quemada",
      origen: "Parte del 09/11/2026, otra novedad",
      fecha: "09/11/2026",
      impideVolver: false,
      ofreceVolverAServicio: false,
      accion: { tipo: "resolver", etiqueta: "Resolver", nombreAccesible: expect.stringMatching(/^Resolver novedad de .+: Otra novedad$/), novedadId: "n-009" },
    });
  });

  it("las abiertas van primero las críticas y después la más antigua (N5)", () => {
    const base = flotaDePrueba();
    const hay = (id: string, gravedad: "critica" | "normal", fecha: string) => ({
      id, unidadId: "u1", origen: { tipo: "manual" as const }, descripcion: id, gravedad, fecha, estado: "abierta" as const, resolucion: null,
    });
    const conVarias = { ...base, novedades: [hay("normal-vieja", "normal", "2026-11-01"), hay("critica-reciente", "critica", "2026-11-16"), hay("critica-vieja", "critica", "2026-11-10")] };
    expect(fichaDe(conVarias, "ZK214BD").novedades.abiertas.map((x) => x.novedadId)).toEqual(["critica-vieja", "critica-reciente", "normal-vieja"]);
  });
});

describe("C11 (ZU 899 QE): A4 y N2 a la vista", () => {
  const f = fichaDe(e, "ZU899QE");

  it("está fuera de servicio por la novedad de frenos: etiqueta, motivo y estado operativo", () => {
    expect(f.aptitud).toMatchObject({ categoria: "fuera-de-servicio", etiqueta: "Fuera de servicio" });
    expect(f.aptitud.linea).toBe("Desde el 16/11/2026: novedad crítica en frenos");
    expect(f.estadoOperativo).toMatchObject({ tipo: "fuera-de-servicio", desde: "16/11/2026", origen: "novedad-critica" });
  });

  it("A4: el estado operativo lista las críticas que impiden volver, y la acción «Volver a servicio» trae el motivo del bloqueo", () => {
    expect(f.estadoOperativo.novedadesQueImpiden).toEqual([
      { novedadId: "n-005", rotulo: "Frenos", origen: "parte del 16/11/2026", texto: "Frenos (parte del 16/11/2026)" },
    ]);
    expect(f.acciones.encabezado).toEqual([
      { id: "volver-a-servicio", etiqueta: "Volver a servicio", href: null, bloqueo: "Antes de volver a servicio, resuelva: Frenos (parte del 16/11/2026)." },
    ]);
  });

  it("N2: la novedad crítica abierta es «Crítica», impide volver y ofrece volver a servicio al resolverla", () => {
    expect(f.novedades.rotuloCantidad).toBe("1 abierta");
    expect(f.novedades.abiertas[0]).toMatchObject({
      novedadId: "n-005",
      gravedad: "critica",
      estado: "Crítica",
      impideVolver: true,
      ofreceVolverAServicio: true,
      origen: "Parte del 16/11/2026, punto Frenos",
      accion: { tipo: "resolver", etiqueta: "Resolver", nombreAccesible: "Resolver novedad de ZU 899 QE: Frenos", novedadId: "n-005" },
    });
  });

  it("una crítica abierta en una unidad dada de baja no «impide volver» (no hay a dónde volver) pero se puede cerrar", () => {
    const base = flotaDePrueba();
    const baja = {
      ...base,
      unidades: base.unidades.map((u) => (u.id === "u1" ? { ...u, estado: { tipo: "baja" as const, desde: "2026-11-17", motivo: "Venta" } } : u)),
      novedades: [{ id: "n9", unidadId: "u1", origen: { tipo: "manual" as const }, descripcion: "Golpe en el chasis", gravedad: "critica" as const, fecha: "2026-11-10", estado: "abierta" as const, resolucion: null }],
    };
    const [n] = fichaDe(baja, "ZK214BD").novedades.abiertas;
    expect(n).toMatchObject({ impideVolver: false, ofreceVolverAServicio: false });
    expect(n?.accion).toMatchObject({ tipo: "resolver", novedadId: "n9" });
  });

  it("no ofrece «Cargar parte» (P8) pero sí corregir, cambiar y cargar novedad", () => {
    expect(f.acciones.encabezado.map((a) => a.id)).not.toContain("cargar-parte");
    expect(f.acciones.masAcciones.map((a) => a.id)).toEqual(["corregir-kilometraje", "cambiar-asignacion", "cargar-novedad", "dar-de-baja"]);
  });

  it("C12 (fuera de servicio a mano): «Volver a servicio» sin bloqueo", () => {
    const g = fichaDe(e, "ZR536MZ");
    expect(g.estadoOperativo).toMatchObject({ tipo: "fuera-de-servicio", origen: "manual", novedadesQueImpiden: [] });
    expect(g.acciones.encabezado).toEqual([{ id: "volver-a-servicio", etiqueta: "Volver a servicio", href: null, bloqueo: null }]);
  });
});

describe("unidad de baja (C16, A7, H4)", () => {
  const f = fichaDe(e, "ZUE512");

  it("aviso neutro, sin ninguna acción y sin acciones sobre sus documentos", () => {
    expect(f.aviso).toBe("Dada de baja el 21/10/2026: Venta de la unidad. Se conserva su historial.");
    expect(f.aptitud).toMatchObject({ categoria: "baja", etiqueta: "De baja", linea: null });
    expect(f.puedeEditar).toBe(true);
    expect(f.acciones).toEqual({ encabezado: [], masAcciones: [] });
    expect(f.documentos.filas.flatMap((x) => x.acciones)).toEqual([]);
    expect(f.documentos.cargarOtro).toBeNull();
    expect(f.novedades.cargar).toBeNull();
    expect(f.kilometraje.corregir).toBeNull();
  });

  it("conserva el historial completo", () => {
    expect(f.historial.total).toBe(e.eventos.filter((x) => x.unidadId === "u-24").length);
    expect(f.historial.eventos.some((x) => x.tipo === "unidad-baja")).toBe(true);
  });
});

describe("panel Kilometraje", () => {
  it("cabecera con el kilometraje actual; hasta 10 filas, la más nueva primero, con recorrido", () => {
    const k = fichaDe(e, "ZK214BD").kilometraje;
    expect(k.titulo).toBe("Kilometraje");
    expect(k.rotuloKm).toBe(fichaDe(e, "ZK214BD").datos.km.texto);
    expect(k.filas).toHaveLength(10);
    expect(k.filas[0]?.fecha).toBe("17/11/2026");
    expect(k.filas[0]?.tipo).toBe("parte");
    expect(k.filas[0]?.texto).toMatch(/^[\d.]+ → [\d.]+$/);
    expect(k.filas[0]?.recorrido).toMatch(/^[\d.]+ km$|^Sin uso$/);
    const fechas = k.filas.map((x) => x.fecha.split("/").reverse().join("-"));
    expect([...fechas].sort().reverse()).toEqual(fechas);
    expect(k.corregir).toEqual({ etiqueta: "Corregir kilometraje" });
  });

  it("una corrección reciente (K5) aparece primero, con el kilometraje, el motivo y sin recorrido", () => {
    const c = ejecutar(e, { tipo: "corregirKilometraje", unidadId: "u-07", desde: H, kmBase: 120, motivo: "Cambio de tablero por avería" }, contexto());
    if (!c.ok) throw new Error(c.error.mensaje);
    const k = fichaDe(c.valor.estado, "ZK214BD").kilometraje;
    expect(k.rotuloKm).toBe("120 km");
    expect(k.filas[0]).toMatchObject({ tipo: "correccion", texto: "Corrección: 120 km", recorrido: null, motivo: "Cambio de tablero por avería", fecha: "18/11/2026", advertencias: [] });
    expect(k.filas[1]?.tipo).toBe("parte");
    expect(k.filas).toHaveLength(10);
  });

  it("K6: el salto aceptado aparece como advertencia en la fila del parte", () => {
    const parte = e.partes.find((p) => p.fecha >= "2026-11-09" && p.advertenciasAceptadas.some((a) => a.tipo === "salto-km"));
    expect(parte).toBeDefined();
    const patente = e.unidades.find((u) => u.id === parte?.unidadId)?.patente ?? "";
    const salto = parte?.advertenciasAceptadas.find((a) => a.tipo === "salto-km");
    const fila = fichaDe(e, patente).kilometraje.filas.find((x) => x.clave === parte?.id);
    expect(fila?.advertencias).toEqual(salto === undefined ? [] : [textoAdvertencia(salto)]);
    expect(fila?.advertencias).toHaveLength(1);
  });

  it("sin partes ni correcciones: vacío con su texto y sin filas", () => {
    const k = fichaDe({ ...e, partes: e.partes.filter((p) => p.unidadId !== "u-07") }, "ZK214BD").kilometraje;
    expect(k.rotuloKm).toBe("Sin registros");
    expect(k.filas).toEqual([]);
    expect(k.vacio).toBe("Todavía no hay partes enviados ni correcciones.");
  });
});

describe("panel Historial (5.16, H3, H4)", () => {
  const f = fichaDe(e, "ZK214BD");
  const h = f.historial;

  it("todos los eventos de la unidad, el más nuevo arriba (H3), con la cantidad", () => {
    const propios = e.eventos.filter((x) => x.unidadId === "u-07");
    expect(h.total).toBe(propios.length);
    expect(h.rotuloCantidad).toBe(`${propios.length} eventos`);
    expect(h.eventos.map((x) => x.eventoId)).toEqual(historialDeUnidad(e, "u-07").map((x) => x.id));
    const crudos = h.eventos.map((x) => e.eventos.find((y) => y.id === x.eventoId)?.instante ?? "");
    expect([...crudos].sort().reverse()).toEqual(crudos);
    expect(h.eventos[0]?.tipo).toBe("parte-enviado");
  });

  it("cada evento trae hora y día de Argentina, ícono, categoría para el filtro, resumen y autor", () => {
    const ev = h.eventos[0];
    expect(ev?.hora).toMatch(/^\d{2}:\d{2}$/);
    expect(ev?.instante).toMatch(/^17\/11\/2026 \d{2}:\d{2}$/);
    expect(ev?.dia).toBe("2026-11-17");
    expect(ev?.tituloDia).toBe("Martes 17/11/2026");
    expect(ev).toMatchObject({ icono: "parte", categoria: "partes" });
    expect(ev?.resumen).toMatch(/^Parte cerrado · ([\d.]+ km|sin uso) \([\d.]+ → [\d.]+\) · combustible /);
    expect(ev?.autor.length).toBeGreaterThan(0);
  });

  it("los filtros (5.8) cuentan por categoría; «Todo» es el total", () => {
    expect(h.filtros.map((x) => x.id)).toEqual(["todo", "partes", "documentos", "novedades", "estado-km"]);
    expect(h.filtros.map((x) => x.etiqueta)).toEqual(["Todo", "Partes", "Documentos", "Novedades", "Estado y kilometraje"]);
    expect(h.filtros[0]?.cantidad).toBe(h.total);
    const porTipo = (tipos: string[]) => h.eventos.filter((x) => tipos.includes(x.tipo)).length;
    expect(h.filtros[1]?.cantidad).toBe(porTipo(["revision-enviada", "parte-enviado"]));
    expect(h.filtros[2]?.cantidad).toBe(porTipo(["documento-cargado", "documento-renovado", "documento-corregido"]));
    expect(h.filtros[3]?.cantidad).toBe(porTipo(["novedad-abierta", "novedad-resuelta"]));
    expect(h.filtros[4]?.cantidad).toBe(porTipo(["fuera-de-servicio", "vuelta-a-servicio", "km-corregido", "unidad-baja"]));
  });

  it("el parte enviado trae su detalle para abrir: kilometraje, combustible, litros, puntos y el enlace al parte", () => {
    const ev = h.eventos[0];
    expect(ev?.detalle).toMatchObject({
      tipo: "parte",
      href: "#/parte/ZK214BD/2026-11-17",
      fueraDePlazo: false,
      advertencias: [],
    });
    if (ev?.detalle?.tipo !== "parte") throw new Error("falta el detalle del parte");
    expect(ev.detalle.resumenCorto).toMatch(/^Parte cerrado · ([\d.]+ km|sin uso) \([\d.]+ → [\d.]+\) · combustible (reserva|1\/4|1\/2|3\/4|lleno) · sin novedades$/);
    expect(ev.detalle.puntosEnOrden).toMatch(/^\d+ puntos en orden$/);
    expect(ev.detalle.novedades).toEqual([]);
    expect(ev.detalle.litros).toMatch(/^Sin carga$|^[\d,]+ litros?$/);
  });

  it("la revisión enviada va en una línea, sin detalle, y dice las novedades; con una crítica, que la unidad no salió", () => {
    const eventos = fichaDe(e, "ZU899QE").historial.eventos;
    const frenos = eventos.find((x) => x.tipo === "revision-enviada" && x.resumen.includes("novedad crítica"));
    expect(frenos).toMatchObject({ icono: "parte", categoria: "partes", detalle: null });
    expect(frenos?.resumen).toMatch(/^Revisión antes de salir · [\d.]+ km · novedad crítica en frenos: la unidad no salió$/);
    // sin salida no hay un «parte cerrado» aparte (P16)
    expect(eventos.filter((x) => x.dia === frenos?.dia && x.tipo === "parte-enviado")).toEqual([]);
    const normal = h.eventos.find((x) => x.tipo === "revision-enviada");
    expect(normal?.resumen).toMatch(/^Revisión antes de salir · [\d.]+ km · sin novedades$/);
  });

  it("un documento corregido trae «Antes / Después» por campo cambiado", () => {
    const base = flotaDePrueba();
    const c = ejecutar(base, { tipo: "corregirDocumento", documentoId: "u1-seguro", numero: "DEMO-NUEVO", vence: "2027-07-30" }, contexto());
    if (!c.ok) throw new Error(c.error.mensaje);
    const g = fichaDe(c.valor.estado, "ZK214BD", ENCARGADO, H);
    const ev = g.historial.eventos[0];
    expect(ev).toMatchObject({ tipo: "documento-corregido", icono: "documento", categoria: "documentos" });
    expect(ev?.detalle).toEqual({
      tipo: "documento-corregido",
      cambios: [
        { campo: "Número", antes: "DEMO-u1-seguro", despues: "DEMO-NUEVO" },
        { campo: "Vencimiento", antes: "30/06/2027", despues: "30/07/2027" },
      ],
    });
  });

  it("un evento con datos que no tienen la forma esperada se muestra igual, sin detalle", () => {
    const raro = { ...e, eventos: e.eventos.map((x) => (x.id === "e-00047" || x.tipo !== "parte-enviado" ? x : { ...x, datos: { parteId: 7 } })) };
    const ev = fichaDe(raro, "ZK214BD").historial.eventos.find((x) => x.tipo === "parte-enviado");
    expect(ev?.detalle).toBeNull();
    expect(ev?.resumen.length).toBeGreaterThan(0);
  });
});

describe("vistaDeHistorial: filtro, páginas de 30 y días", () => {
  const h = fichaDe(e, "ZK214BD").historial;
  // El de ZK 214 BD tiene 90 eventos: para probar las páginas de 30 se arma uno de 130 repitiendo los suyos con otros ids.
  const grande = { ...h, total: 130, eventos: Array.from({ length: 130 }, (_, i) => ({ ...(h.eventos[i % h.eventos.length] as (typeof h.eventos)[number]), eventoId: `x${i}` })) };

  it("los primeros 30, agrupados por día (el más nuevo arriba), con el botón «Ver 30 más» y el anuncio", () => {
    expect(PASO_HISTORIAL_ANCHO).toBe(30);
    const v = vistaDeHistorial(grande, "todo", PASO_HISTORIAL_ANCHO);
    expect(v.mostrados).toBe(30);
    expect(v.total).toBe(130);
    expect(v.hayMas).toBe(true);
    expect(v.botonVerMas).toBe("Ver 30 más");
    expect(v.anuncio).toBe("Mostrando 30 de 130 eventos.");
    expect(v.ids).toHaveLength(30);
    expect(v.grupos.flatMap((g) => g.eventos)).toHaveLength(30);
  });

  it("D2: el paso es un parámetro: 10 con poco ancho y 30 desde 40rem; el botón dice cuántos suma y, al final, cuántos quedan", () => {
    expect(PASO_HISTORIAL_ANGOSTO).toBe(10);
    expect(PASO_HISTORIAL_ANCHO).toBe(30);
    expect(vistaDeHistorial(grande, "todo", 10, PASO_HISTORIAL_ANGOSTO).botonVerMas).toBe("Ver 10 más");
    expect(vistaDeHistorial(grande, "todo", 125, PASO_HISTORIAL_ANGOSTO).botonVerMas).toBe("Ver 5 más");
    expect(vistaDeHistorial(grande, "todo", 10, PASO_HISTORIAL_ANCHO).botonVerMas).toBe("Ver 30 más");
    expect(vistaDeHistorial(grande, "todo", 10).botonVerMas).toBe("Ver 30 más"); // sin paso, el ancho
  });

  it("agrupa por día con el título del día; el primer grupo es el del evento más nuevo", () => {
    const v = vistaDeHistorial(h, "todo", PASO_HISTORIAL_ANCHO);
    const dias = v.grupos.map((g) => g.dia);
    expect(new Set(dias).size).toBe(dias.length);
    expect([...dias].sort().reverse()).toEqual(dias);
    expect(v.grupos[0]).toMatchObject({ dia: "2026-11-17", titulo: "Martes 17/11/2026" });
    expect(v.botonVerMas).toBe("Ver 30 más");
  });

  it("«Ver 30 más»: el primer evento nuevo es el que sigue (para llevarle el foco); al final, el botón dice cuántos quedan y después desaparece", () => {
    const una = vistaDeHistorial(grande, "todo", 30);
    const dos = vistaDeHistorial(grande, "todo", 60);
    expect(dos.ids[30]).toBe("x30");
    expect(dos.ids.slice(0, 30)).toEqual(una.ids);
    expect(vistaDeHistorial(grande, "todo", 120).botonVerMas).toBe("Ver 10 más");
    const todo = vistaDeHistorial(grande, "todo", 1000);
    expect(todo.mostrados).toBe(130);
    expect(todo.hayMas).toBe(false);
    expect(todo.botonVerMas).toBeNull();
  });

  it("el filtro «Partes» deja solo los partes; el total del anuncio es el del filtro", () => {
    const v = vistaDeHistorial(h, "partes", 30);
    const partes = h.eventos.filter((x) => x.categoria === "partes").length;
    expect(v.grupos.flatMap((g) => g.eventos).every((x) => x.tipo === "parte-enviado" || x.tipo === "revision-enviada")).toBe(true);
    expect(v.total).toBe(partes);
    expect(v.anuncio).toBe(`Mostrando ${Math.min(30, partes)} de ${partes} eventos.`);
  });

  it("un filtro sin eventos dice que no hay", () => {
    const sinNovedades = vistaDeHistorial({ ...h, eventos: h.eventos.filter((x) => x.categoria !== "novedades") }, "novedades", 30);
    expect(sinNovedades.grupos).toEqual([]);
    expect(sinNovedades.vacio).toBe("Todavía no hay eventos.");
  });
});

describe("ficha: conductor sin licencia y kilometraje con la salida (L1, K10, 17.5)", () => {
  it("datos.conductorSinLicencia: la unidad de C21 lo trae en true; una sana, en false", () => {
    const conMarca = e.unidades.filter((u) => u.conductorId !== null).filter((u) => fichaDe(e, u.patente).datos.conductorSinLicencia);
    expect(conMarca).toHaveLength(1);
    expect(fichaDe(e, "ZK214BD").datos.conductorSinLicencia).toBe(false);
  });

  it("un parte en uso aparece en el kilometraje como «84.452 → en uso» con enlace al parte; un parte sin salida dice «Sin uso»", () => {
    const base = flotaDePrueba();
    const uso = parte({ id: "uso", unidadId: "u1", fecha: H, estado: "en-uso", kmInicio: 84452, kmFin: null, combustible: null, enviado: null, revisado: "2026-11-18T12:00:00.000Z" });
    const f = fichaDe({ ...base, partes: [...base.partes, uso] }, "ZK214BD");
    expect(f.kilometraje.filas[0]).toMatchObject({ tipo: "salida", fecha: "18/11/2026", texto: "84.452 → en uso", recorrido: null, href: "#/parte/ZK214BD/2026-11-18" });
    expect(f.datos.km).toMatchObject({ valor: 84452 });
    const sin = parte({ id: "ss", unidadId: "u1", fecha: H, sinSalida: true, kmInicio: 84320, kmFin: 84320 });
    expect(fichaDe({ ...base, partes: [...base.partes, sin] }, "ZK214BD").kilometraje.filas[0]).toMatchObject({ tipo: "parte", recorrido: "Sin uso" });
  });
});

describe("ficha: el primer botón sale del parte (C16, P18, P19)", () => {
  const base = flotaDePrueba();
  const primero = (partes: Estado["partes"]) => fichaDe({ ...base, partes }, "ZK214BD").acciones.encabezado[0];
  const ayer = base.partes.filter((p) => p.unidadId === "u1"); // el parte cerrado de ayer
  const enUso = (fecha: string) => parte({ id: `uso-${fecha}`, unidadId: "u1", fecha, estado: "en-uso", kmInicio: 84452, kmFin: null, combustible: null, enviado: null, revisado: `${fecha}T12:00:00.000Z` });

  it("sin parte de hoy: «Cargar parte»; con un borrador de hoy, también", () => {
    expect(primero(ayer)).toEqual({ id: "cargar-parte", etiqueta: "Cargar parte", href: "#/parte/ZK214BD/2026-11-18", bloqueo: null });
    expect(primero([...ayer, parte({ id: "b", unidadId: "u1", fecha: H, estado: "borrador", enviado: null, revisado: null })])?.etiqueta).toBe("Cargar parte");
  });

  it("con el parte de hoy en uso: «Cerrar el parte», al mismo enlace", () => {
    expect(primero([...ayer, enUso(H)])).toEqual({ id: "cargar-parte", etiqueta: "Cerrar el parte", href: "#/parte/ZK214BD/2026-11-18", bloqueo: null });
  });

  it("con un parte anterior en uso (cerrar antes): «Cerrar el parte del 17/11/2026», que lleva a ese parte", () => {
    expect(primero([enUso("2026-11-17")])).toEqual({ id: "cargar-parte", etiqueta: "Cerrar el parte del 17/11/2026", href: "#/parte/ZK214BD/2026-11-17", bloqueo: null });
  });

  it("con el parte de hoy cerrado: «Ver el parte»; también sin salida y con la unidad ya devuelta a servicio (hasta mañana)", () => {
    const cerrado = parte({ id: "c", unidadId: "u1", fecha: H, kmInicio: 84320, kmFin: 84452 });
    expect(primero([...ayer, cerrado])).toEqual({ id: "cargar-parte", etiqueta: "Ver el parte", href: "#/parte/ZK214BD/2026-11-18", bloqueo: null });
    const sin = parte({ id: "ss", unidadId: "u1", fecha: H, sinSalida: true, kmInicio: 84320, kmFin: 84320 });
    expect(primero([...ayer, sin])?.etiqueta).toBe("Ver el parte");
  });
});
