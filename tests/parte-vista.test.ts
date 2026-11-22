// Paso 4.5 (lógica): lo que dibujan el inicio del conductor (6.4) y la pantalla del parte (6.5, panel «Parte enviado» y parte en lectura). Funciones puras
// sobre el estado: sin DOM y sin reglas nuevas (reusan aptitud, kilometraje, alertas y los comandos).
import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import type { Estado, Perfil } from "../src/lib/dominio/tipos.ts";
import { opcionesDeConductor } from "../src/lib/dominio/formulario.ts";
import { inicioDelConductor, opcionesParaElegirConductor, panelDeParteEnviado, panelDeRevisionEnviada, panelDeSinSalida, vistaDeParte } from "../src/lib/estado/parte.ts";
import { checklistEnOrden, checklistVacio, documento, ejecutarOk, flotaDePrueba, parte, unidad } from "./ayuda.ts";

const H = "2026-11-18";
const COND: Perfil = { tipo: "conductor", conductorId: "c1" };
const ENC: Perfil = { tipo: "encargado" };

type Borrador = Extract<Comando, { tipo: "guardarBorrador" }>;

function borrador(parcial: Partial<Borrador> = {}): Borrador {
  return { tipo: "guardarBorrador", parteId: null, unidadId: "u1", fecha: H, conductorId: "c1", kmInicio: 84320, kmFin: null, combustible: null, litrosCargados: null, checklist: checklistVacio(), otraNovedad: null, ...parcial };
}

type Aceptable = "salto-km" | "recorrido-largo" | "documentacion-vencida";

/**
 * Guarda, envía la revisión y cierra un parte con los cambios que se pidan; devuelve el estado y el parte. Los datos del cierre (kmFin, combustible, litros) salen de
 * `parcial` (84.452 y 3/4 por defecto). Con una novedad crítica el parte queda cerrado sin salida y no hay cierre.
 */
function enviado(e: Estado, parcial: Partial<Borrador> = {}, aceptadas: Aceptable[] = []) {
  const { kmFin, combustible, litrosCargados, ...revision } = parcial;
  const g = ejecutarOk(e, borrador({ kmFin: null, combustible: null, checklist: checklistEnOrden(), ...revision }));
  const id = g.cambios.partes[0]?.id ?? "";
  const rev = ejecutarOk(g.estado, { tipo: "enviarRevision", parteId: id, advertenciasAceptadas: aceptadas.filter((x) => x !== "recorrido-largo") });
  let estado = rev.estado;
  if (estado.partes.find((x) => x.id === id)?.estado === "en-uso") {
    const c = ejecutarOk(estado, { tipo: "guardarCierre", parteId: id, kmFin: kmFin === undefined ? 84452 : kmFin, combustible: combustible === undefined ? "tres-cuartos" : combustible, litrosCargados: litrosCargados ?? null });
    estado = ejecutarOk(c.estado, { tipo: "enviarCierre", parteId: id, advertenciasAceptadas: aceptadas.filter((x) => x === "recorrido-largo") }).estado;
  }
  const p = estado.partes.find((x) => x.id === id);
  if (p === undefined) throw new Error("no se envió");
  return { estado, parte: p };
}

/** Guarda y envía solo la revisión: el parte queda en uso. */
function enUso(e: Estado, parcial: Partial<Borrador> = {}) {
  const g = ejecutarOk(e, borrador({ checklist: checklistEnOrden(), ...parcial }));
  const id = g.cambios.partes[0]?.id ?? "";
  const rev = ejecutarOk(g.estado, { tipo: "enviarRevision", parteId: id, advertenciasAceptadas: [] });
  const p = rev.estado.partes.find((x) => x.id === id);
  if (p === undefined) throw new Error("no se envió");
  return { estado: rev.estado, parte: p };
}

function alertasDe(e: Estado) {
  return calcularAlertas(e, H);
}

function inicio(e: Estado, perfil: Perfil = COND, elegida: string | null = null) {
  return inicioDelConductor(e, alertasDe(e), H, perfil, elegida);
}

describe("inicio del conductor (6.4)", () => {
  it("el perfil Encargado no tiene esta pantalla", () => {
    expect(inicio(flotaDePrueba(), ENC)).toBeNull();
  });

  it("sin parte de hoy: la unidad asignada, el último registro y «Empezar la revisión»", () => {
    const v = inicio(flotaDePrueba());
    expect(v).toMatchObject({
      titulo: "Parte diario",
      hoy: { titulo: "Hoy, miércoles 18/11/2026" },
      unidad: { unidadId: "u1", patente: "ZK214BD", patenteTexto: "ZK 214 BD", interno: "Int. 07", ultimoRegistro: "Último registro: 84.320 km (parte del 17/11/2026)." },
      hoyEstado: { tipo: "sin-parte", texto: "Antes de salir, revise la unidad y envíe la revisión.", primario: { texto: "Empezar la revisión", href: "#/parte/ZK214BD/2026-11-18" } },
      avisoAptitud: null,
    });
    expect(v?.elegirUnidad).toMatchObject({ modo: "otra", etiqueta: "Usar otra unidad" });
  });

  it("las unidades que se pueden elegir son las que están en servicio, con el enlace al parte de hoy", () => {
    const e = flotaDePrueba();
    e.unidades.push(unidad({ id: "u3", patente: "ZMA123", interno: 9, estado: { tipo: "fuera-de-servicio", desde: "2026-11-13", motivo: "En taller", origen: "manual", novedadIds: [] } }));
    e.unidades.push(unidad({ id: "u4", patente: "ZMB456", interno: 10, estado: { tipo: "baja", desde: "2026-10-01", motivo: "Venta" } }));
    expect(inicio(e)?.elegirUnidad.opciones).toEqual([
      { valor: "u1", etiqueta: "ZK 214 BD (Int. 07)", href: "#/parte/ZK214BD/2026-11-18" },
      { valor: "u2", etiqueta: "ZKB 482 (Int. 08)", href: "#/parte/ZKB482/2026-11-18" },
    ]);
  });

  it("«Usar otra unidad»: con otra unidad en servicio elegida, el panel es de esa; una inexistente, de baja o fuera de servicio se ignora", () => {
    const e = flotaDePrueba();
    expect(inicio(e, COND, "u2")?.unidad).toMatchObject({ unidadId: "u2", patenteTexto: "ZKB 482" });
    expect(inicio(e, COND, "u2")?.hoyEstado).toMatchObject({ primario: { href: "#/parte/ZKB482/2026-11-18" } });
    expect(inicio(e, COND, "no-existe")?.unidad?.unidadId).toBe("u1");
    e.unidades[1] = { ...e.unidades[1]!, estado: { tipo: "baja", desde: "2026-11-01", motivo: "Venta" } };
    expect(inicio(e, COND, "u2")?.unidad?.unidadId).toBe("u1");
  });

  it("borrador de hoy: «Tiene una revisión empezada: faltan 2 datos.», «Continuar la revisión» y descartar", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "pb", estado: "borrador", enviado: null, fecha: H, kmFin: null, combustible: null, checklist: { ...checklistEnOrden(), frenos: { estado: "sin-responder" }, luces: { estado: "sin-responder" } } }));
    expect(inicio(e)?.hoyEstado).toEqual({
      tipo: "borrador",
      texto: "Tiene una revisión empezada: faltan 2 datos.",
      primario: { texto: "Continuar la revisión", href: "#/parte/ZK214BD/2026-11-18" },
      descartar: { texto: "Descartar borrador", parteId: "pb" },
    });
  });

  it("borrador de hoy con una sola cosa pendiente, o ya listo", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "pb", estado: "borrador", enviado: null, fecha: H, checklist: { ...checklistEnOrden(), luces: { estado: "sin-responder" } } }));
    expect(inicio(e)?.hoyEstado).toMatchObject({ tipo: "borrador", texto: "Tiene una revisión empezada: falta 1 dato." });
    // los datos del cierre no se piden en la revisión
    e.partes[e.partes.length - 1] = parte({ id: "pb", estado: "borrador", enviado: null, fecha: H, kmFin: null, combustible: null });
    expect(inicio(e)?.hoyEstado).toMatchObject({ tipo: "borrador", texto: "Tiene una revisión empezada y está lista para enviar." });
  });

  it("parte de hoy cerrado: «Cerrado a las 18:42» y «Ver el parte»", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "pe", fecha: H, enviado: "2026-11-18T21:42:00.000Z" }));
    expect(inicio(e)?.hoyEstado).toEqual({ tipo: "enviado", etiqueta: "Cerrado a las 18:42", sinSalida: null, hastaManana: null, enlace: { texto: "Ver el parte", href: "#/parte/ZK214BD/2026-11-18" } });
  });

  it("unidad fuera de servicio: aviso con el motivo y «No hace falta parte»; se puede usar otra", () => {
    const e = flotaDePrueba();
    e.unidades[0] = { ...e.unidades[0]!, estado: { tipo: "fuera-de-servicio", desde: "2026-11-13", motivo: "En taller: cambio de embrague", origen: "manual", novedadIds: [] } };
    const v = inicio(e);
    expect(v?.hoyEstado).toEqual({ tipo: "fuera-de-servicio", aviso: "ZK 214 BD está fuera de servicio desde el 13/11/2026 (En taller: cambio de embrague). No hace falta parte." });
    expect(v?.elegirUnidad).toMatchObject({ modo: "otra", opciones: [{ valor: "u2" }] });
  });

  it("sin unidad asignada: hay que elegir una (de las que están en servicio)", () => {
    const e = flotaDePrueba();
    e.unidades[0] = { ...e.unidades[0]!, conductorId: null };
    const v = inicio(e);
    expect(v?.unidad).toBeNull();
    expect(v?.hoyEstado).toEqual({ tipo: "sin-unidad" });
    expect(v?.elegirUnidad).toMatchObject({ modo: "elegir", etiqueta: "Elija la unidad" });
    expect(v?.elegirUnidad.opciones).toHaveLength(2);
    expect(inicio(e, COND, "u1")?.unidad?.unidadId).toBe("u1");
  });

  it("una unidad de baja asignada no cuenta como asignada", () => {
    const e = flotaDePrueba();
    e.unidades[0] = { ...e.unidades[0]!, estado: { tipo: "baja", desde: "2026-11-01", motivo: "Venta" } };
    expect(inicio(e)?.hoyEstado).toEqual({ tipo: "sin-unidad" });
  });

  it("unidad que no puede salir (documento vencido): aviso arriba del botón, que sigue disponible (P9)", () => {
    const e = flotaDePrueba();
    e.documentos = e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d));
    const v = inicio(e);
    expect(v?.avisoAptitud).toEqual({ titular: "ZK 214 BD no puede salir: Seguro vencido hace 1 día.", accion: "Avise al encargado antes de usarla." });
    expect(v?.hoyEstado).toMatchObject({ tipo: "sin-parte" });
  });

  it("varios motivos se separan con punto y coma", () => {
    const e = flotaDePrueba();
    e.documentos = e.documentos.filter((d) => d.id !== "u1-matafuego").map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d));
    expect(inicio(e)?.avisoAptitud).toEqual({ titular: "ZK 214 BD no puede salir: Seguro vencido hace 1 día; Falta cargar: Carga del matafuego.", accion: "Avise al encargado antes de usarla." });
  });

  it("pendientes: un borrador de ayer sin enviar y un día sin parte, con «Continuarlo» y «Cargarlo»", () => {
    const e = flotaDePrueba();
    e.partes = e.partes.filter((p) => !(p.unidadId === "u1" && p.fecha === "2026-11-17"));
    e.partes.push(parte({ id: "pa", estado: "borrador", enviado: null, fecha: "2026-11-16", unidadId: "u1" }));
    expect(inicio(e)?.pendientes).toEqual([
      {
        clave: "pa",
        tipo: "borrador",
        texto: "ZK 214 BD: el parte del 16/11/2026 está empezado y sin enviar.",
        accion: { texto: "Continuarlo", href: "#/parte/ZK214BD/2026-11-16" },
        nombreAccesible: "Continuarlo. ZK 214 BD: el parte del 16/11/2026 está empezado y sin enviar.",
      },
      {
        clave: "sin-parte:u1:2026-11-17",
        tipo: "sin-parte",
        texto: "ZK 214 BD: no se envió el parte de ayer (17/11/2026).",
        accion: { texto: "Cargarlo", href: "#/parte/ZK214BD/2026-11-17" },
        nombreAccesible: "Cargarlo. ZK 214 BD: no se envió el parte de ayer (17/11/2026).",
      },
    ]);
  });

  it("pendientes: un borrador de otra unidad empezado por este conductor también aparece; el de hoy y los de otros conductores, no", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "pa", estado: "borrador", enviado: null, fecha: "2026-11-16", unidadId: "u2", conductorId: "c1" }));
    e.partes.push(parte({ id: "pb", estado: "borrador", enviado: null, fecha: "2026-11-15", unidadId: "u2", conductorId: "c2" }));
    e.partes.push(parte({ id: "pc", estado: "borrador", enviado: null, fecha: H, unidadId: "u1", conductorId: "c1" }));
    expect(inicio(e)?.pendientes.map((p) => p.clave)).toEqual(["pa"]);
  });

  it("sin pendientes, la lista viene vacía", () => {
    expect(inicio(flotaDePrueba())?.pendientes).toEqual([]);
  });

  it("su licencia: avisa solo si vence en 30 días o menos, está vencida o falta", () => {
    const e = flotaDePrueba();
    expect(inicio(e)?.licencia).toBeNull();
    const con = (vence: string) => {
      const x = flotaDePrueba();
      x.documentos = x.documentos.map((d) => (d.id === "c1-licencia" ? { ...d, vence } : d));
      return inicio(x)?.licencia;
    };
    expect(con("2026-11-30")).toEqual({ titulo: "Su licencia", texto: "Vence en 12 días (30/11/2026)", tono: "quincena" });
    expect(con("2026-11-18")).toMatchObject({ texto: "Vence hoy (18/11/2026)", tono: "semana" });
    expect(con("2026-11-19")).toMatchObject({ texto: "Vence mañana (19/11/2026)", tono: "semana" });
    expect(con("2026-12-18")).toMatchObject({ texto: "Vence en 30 días (18/12/2026)", tono: "mes" });
    expect(con("2026-12-19")).toBeNull();
    // vencida o faltante: el panel «Hoy» ya lo dice (bloqueo, L1) y «Su licencia» no se muestra
    expect(con("2026-11-15")).toBeNull();
    // con el parte de hoy en uso (L3) o la unidad fuera de servicio, el panel «Hoy» no habla de la licencia: «Su licencia» sí
    const enUsoSinLicencia = enUso(flotaDePrueba()).estado;
    enUsoSinLicencia.documentos = enUsoSinLicencia.documentos.map((d) => (d.id === "c1-licencia" ? { ...d, vence: "2026-11-15" } : d));
    expect(inicio(enUsoSinLicencia)?.licencia).toMatchObject({ texto: "Vencida hace 3 días (15/11/2026). Avise al encargado.", tono: "critico" });
  });

  it("mis últimos partes: solo los enviados por este conductor, el más nuevo primero, hasta cinco", () => {
    const e = flotaDePrueba();
    e.partes = [];
    for (let i = 1; i <= 7; i++) {
      const fecha = `2026-11-${String(10 + i).padStart(2, "0")}`;
      e.partes.push(parte({ id: `h${i}`, fecha, kmInicio: 1000, kmFin: 1000 + i * 10, unidadId: "u1", conductorId: "c1", enviado: `${fecha}T21:00:00.000Z` }));
    }
    e.partes.push(parte({ id: "otro", fecha: "2026-11-17", conductorId: "c2", unidadId: "u2" }));
    e.partes.push(parte({ id: "borr", estado: "borrador", enviado: null, fecha: "2026-11-16", conductorId: "c1" }));
    const u = inicio(e)?.ultimosPartes;
    expect(u?.filas.map((f) => f.parteId)).toEqual(["h7", "h6", "h5", "h4", "h3"]);
    expect(u?.filas[0]).toEqual({ parteId: "h7", fecha: "17/11/2026", patenteTexto: "ZK 214 BD", recorrido: "70 km", href: "#/parte/ZK214BD/2026-11-17" });
    expect(u?.vacio).toBeNull();
  });

  it("mis últimos partes: sin partes cerrados, «Todavía no cerró partes. Los últimos cinco aparecerán aquí.»", () => {
    const e = flotaDePrueba();
    e.partes = [];
    expect(inicio(e)?.ultimosPartes).toMatchObject({ filas: [], vacio: "Todavía no cerró partes. Los últimos cinco aparecerán aquí." });
  });

  it("«Sin uso» cuando el recorrido es 0", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "x", fecha: "2026-11-16", kmInicio: 500, kmFin: 500 }));
    expect(inicio(e)?.ultimosPartes.filas.find((f) => f.parteId === "x")?.recorrido).toBe("Sin uso");
  });
});

describe("inicio del conductor: el orden de los siete estados y la licencia (17.5)", () => {
  const vencida = (e: Estado, vence = "2026-11-15"): Estado => ({ ...e, documentos: e.documentos.map((d) => (d.id === "c1-licencia" ? { ...d, vence } : d)) });
  const fuera = (e: Estado): Estado => ({
    ...e,
    unidades: e.unidades.map((u) => (u.id === "u1" ? { ...u, estado: { tipo: "fuera-de-servicio", desde: "2026-11-13", motivo: "En taller", origen: "manual", novedadIds: [] } } : u)),
  });

  it("1. sin unidad -> sin-unidad (aunque no tenga licencia)", () => {
    const e = vencida(flotaDePrueba());
    e.unidades = e.unidades.map((u) => ({ ...u, conductorId: null }));
    expect(inicio(e)?.hoyEstado).toEqual({ tipo: "sin-unidad" });
  });

  it("2. un parte de hoy cerrado -> enviado, también con la licencia vencida o la unidad fuera de servicio", () => {
    const cerrado = enviado(flotaDePrueba()).estado;
    expect(inicio(vencida(cerrado))?.hoyEstado).toMatchObject({ tipo: "enviado" });
    expect(inicio(fuera(cerrado))?.hoyEstado).toMatchObject({ tipo: "enviado" });
  });

  it("2. sin salida con la unidad fuera de servicio -> enviado, con el texto de la novedad crítica en lugar de la hora de cierre", () => {
    const sinSalida = enviado(flotaDePrueba(), { checklist: { ...checklistEnOrden(), frenos: { estado: "con-novedad", descripcion: "Pedal blando", impideUso: false } } }).estado;
    expect(sinSalida.unidades[0]?.estado.tipo).toBe("fuera-de-servicio");
    const h = inicio(sinSalida)?.hoyEstado;
    expect(h).toMatchObject({ tipo: "enviado", sinSalida: expect.stringMatching(/^Revisión de las \d\d:\d\d: novedad crítica en Frenos\. La unidad no salió\.$/) });
    // P19: aunque se resuelva la novedad y la unidad vuelva a servicio, hoy no sale: el inicio lo dice
    expect(h).toMatchObject({ hastaManana: "Aunque el encargado resuelva la novedad hoy, la unidad vuelve a salir recién mañana." });
    const resuelta = ejecutarOk(sinSalida, { tipo: "resolverNovedad", novedadId: sinSalida.novedades[0]!.id, texto: "Se cambiaron las pastillas", volverAServicio: true }).estado;
    expect(resuelta.unidades[0]?.estado.tipo).toBe("en-servicio");
    expect(inicio(resuelta)?.hoyEstado).toMatchObject({ tipo: "enviado", hastaManana: expect.any(String) });
  });

  it("3. un parte en uso -> en-uso con «Cerrar el parte»; la licencia no se mira (L3): licencia vencida con parte en uso -> en-uso", () => {
    const uso = enUso(flotaDePrueba()).estado;
    expect(inicio(uso)?.hoyEstado).toEqual({
      tipo: "en-uso",
      etiqueta: "En uso desde las 12:00",
      texto: "Al terminar la jornada, cierre el parte con el kilometraje y el combustible.",
      primario: { texto: "Cerrar el parte", href: "#/parte/ZK214BD/2026-11-18" },
    });
    expect(inicio(vencida(uso))?.hoyEstado).toMatchObject({ tipo: "en-uso" });
    expect(inicio(fuera(uso))?.hoyEstado).toMatchObject({ tipo: "en-uso" });
  });

  it("4. unidad fuera de servicio (antes que la licencia) -> fuera-de-servicio", () => {
    expect(inicio(vencida(fuera(flotaDePrueba())))?.hoyEstado).toMatchObject({ tipo: "fuera-de-servicio" });
  });

  it("5. licencia que no ampara hoy -> licencia-no-vigente, con los renglones de L1 y sin «Su licencia» ni aviso de aptitud", () => {
    const e = vencida(flotaDePrueba());
    e.documentos = e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d)); // la unidad tampoco puede salir
    const v = inicio(e);
    expect(v?.hoyEstado).toEqual({
      tipo: "licencia-no-vigente",
      renglon1: "No puede manejar hoy: su licencia de conducir venció el 15/11/2026.",
      renglon2: "Avise al encargado: cuando cargue una licencia vigente, podrá empezar la revisión.",
      borrador: null,
    });
    expect(v?.licencia).toBeNull();
    expect(v?.avisoAptitud).toBeNull();
  });

  it("5. los tres motivos: faltante y posterior", () => {
    const sin = flotaDePrueba();
    sin.documentos = sin.documentos.filter((d) => d.id !== "c1-licencia");
    expect(inicio(sin)?.hoyEstado).toMatchObject({ renglon1: "No puede manejar hoy: no tiene una licencia de conducir cargada." });
    const nueva = vencida(flotaDePrueba());
    nueva.documentos = [...nueva.documentos, documento({ id: "c1-nueva", titular: { tipo: "conductor", id: "c1" }, tipo: "licencia", vence: "2031-01-01", emitido: "2026-11-20", reemplazaA: "c1-licencia" })];
    expect(inicio(nueva)?.hoyEstado).toMatchObject({ renglon1: "No puede manejar hoy: su licencia nueva vale desde el 20/11/2026." });
  });

  it("5. con un borrador de hoy se conserva y se ofrece descartarlo", () => {
    const e = vencida(flotaDePrueba());
    e.partes.push(parte({ id: "pb", estado: "borrador", enviado: null, revisado: null, fecha: H }));
    expect(inicio(e)?.hoyEstado).toMatchObject({ tipo: "licencia-no-vigente", borrador: { texto: "Tiene una revisión empezada: se conserva.", descartar: { texto: "Descartar borrador", parteId: "pb" } } });
  });

  it("6 y 7. con licencia vigente: borrador o sin parte, y el aviso de aptitud solo en esos dos", () => {
    const e = flotaDePrueba();
    e.documentos = e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d));
    expect(inicio(e)?.hoyEstado.tipo).toBe("sin-parte");
    expect(inicio(e)?.avisoAptitud).not.toBeNull();
    const g = ejecutarOk(e, borrador({ checklist: checklistEnOrden() }));
    const id = g.cambios.partes[0]?.id ?? "";
    const uso = ejecutarOk(g.estado, { tipo: "enviarRevision", parteId: id, advertenciasAceptadas: ["documentacion-vencida"] });
    expect(inicio(uso.estado)?.hoyEstado.tipo).toBe("en-uso");
    expect(inicio(uso.estado)?.avisoAptitud).toBeNull();
  });

  it("pendientes: un parte en uso de ayer -> «sin cerrar» con «Cerrarlo» y su nombre accesible; el de hoy no", () => {
    const e = flotaDePrueba();
    e.partes = e.partes.filter((p) => !(p.unidadId === "u1"));
    e.partes.push(parte({ id: "pu", estado: "en-uso", enviado: null, kmFin: null, combustible: null, fecha: "2026-11-17", unidadId: "u1", conductorId: "c1", revisado: "2026-11-17T09:00:00.000Z" }));
    e.partes.push(parte({ id: "ph", estado: "en-uso", enviado: null, kmFin: null, combustible: null, fecha: H, unidadId: "u1", conductorId: "c1", kmInicio: 1100 }));
    expect(inicio(e)?.pendientes).toEqual([
      {
        clave: "pu",
        tipo: "sin-cerrar",
        texto: "ZK 214 BD: el parte del 17/11/2026 quedó sin cerrar.",
        accion: { texto: "Cerrarlo", href: "#/parte/ZK214BD/2026-11-17" },
        nombreAccesible: "Cerrarlo. ZK 214 BD: el parte del 17/11/2026 quedó sin cerrar.",
      },
    ]);
  });

  it("mis últimos partes: un parte cerrado sin salida dice «Sin uso»; uno en uso no figura", () => {
    const sinSalida = enviado(flotaDePrueba(), { checklist: { ...checklistEnOrden(), frenos: { estado: "con-novedad", descripcion: "Pedal blando", impideUso: false } } }).estado;
    expect(inicio(sinSalida)?.ultimosPartes.filas[0]).toMatchObject({ fecha: "18/11/2026", recorrido: "Sin uso" });
    const uso = enUso(flotaDePrueba()).estado;
    expect(inicio(uso)?.ultimosPartes.filas.every((f) => f.fecha !== "18/11/2026")).toBe(true);
  });
});

describe("cerrar antes (A1, P20): un parte anterior en uso bloquea el de hoy", () => {
  /** u1 con el parte de ayer en uso (sin cerrar) y nada hoy. */
  function conUsoDeAyer(): Estado {
    const e = flotaDePrueba();
    return {
      ...e,
      partes: [
        ...e.partes.filter((p) => p.unidadId !== "u1"),
        parte({ id: "pu", estado: "en-uso", enviado: null, kmFin: null, combustible: null, fecha: "2026-11-17", unidadId: "u1", conductorId: "c1", revisado: "2026-11-17T09:00:00.000Z" }),
      ],
    };
  }
  const sinLicencia = (e: Estado): Estado => ({ ...e, documentos: e.documentos.map((d) => (d.id === "c1-licencia" ? { ...d, vence: "2026-11-15" } : d)) });
  const RENGLON_1 = "ZK 214 BD: el parte del martes 17/11/2026 quedó sin cerrar.";

  it("inicio (estado 5 bis): sin parte de hoy y con uno de ayer en uso -> cierre-pendiente, que lleva al cierre y no ofrece empezar la revisión", () => {
    expect(inicio(conUsoDeAyer())?.hoyEstado).toEqual({
      tipo: "cierre-pendiente",
      renglon1: RENGLON_1,
      renglon2: "Ciérrelo primero; después podrá empezar la revisión de hoy.",
      primario: { texto: "Cerrar el parte anterior", href: "#/parte/ZK214BD/2026-11-17" },
      borrador: null,
    });
  });

  it("inicio: con un borrador de hoy se conserva y se puede descartar", () => {
    const e = conUsoDeAyer();
    e.partes.push(parte({ id: "pb", estado: "borrador", enviado: null, revisado: null, fecha: H }));
    expect(inicio(e)?.hoyEstado).toMatchObject({ tipo: "cierre-pendiente", borrador: { texto: "Tiene una revisión empezada: se conserva.", descartar: { texto: "Descartar borrador", parteId: "pb" } } });
  });

  it("inicio: el aviso de aptitud no se calcula en este estado, y el pendiente «Cerrarlo» sigue en su panel", () => {
    const v = inicio(conUsoDeAyer());
    expect(v?.avisoAptitud).toBeNull();
    expect(v?.pendientes.map((p) => [p.tipo, p.accion.texto])).toEqual([["sin-cerrar", "Cerrarlo"]]);
  });

  it("inicio: con varios sin cerrar lleva al más antiguo", () => {
    const e = conUsoDeAyer();
    e.partes.push(parte({ id: "pu2", estado: "en-uso", enviado: null, kmFin: null, combustible: null, fecha: "2026-11-15", unidadId: "u1", conductorId: "c1", revisado: "2026-11-15T09:00:00.000Z" }));
    expect(inicio(e)?.hoyEstado).toMatchObject({ tipo: "cierre-pendiente", renglon1: "ZK 214 BD: el parte del domingo 15/11/2026 quedó sin cerrar.", primario: { href: "#/parte/ZK214BD/2026-11-15" } });
  });

  it("inicio: el orden — fuera de servicio y licencia ganan; un parte de hoy en uso o cerrado también", () => {
    const fuera: Estado = { ...conUsoDeAyer(), unidades: conUsoDeAyer().unidades.map((u) => (u.id === "u1" ? { ...u, estado: { tipo: "fuera-de-servicio" as const, desde: "2026-11-13", motivo: "En taller", origen: "manual" as const, novedadIds: [] } } : u)) };
    expect(inicio(fuera)?.hoyEstado.tipo).toBe("fuera-de-servicio");
    expect(inicio(sinLicencia(conUsoDeAyer()))?.hoyEstado.tipo).toBe("licencia-no-vigente");
    const hoyEnUso = conUsoDeAyer();
    hoyEnUso.partes.push(parte({ id: "ph", estado: "en-uso", enviado: null, kmFin: null, combustible: null, fecha: H, unidadId: "u1", conductorId: "c1", kmInicio: 84320 }));
    expect(inicio(hoyEnUso)?.hoyEstado.tipo).toBe("en-uso");
    const hoyCerrado = conUsoDeAyer();
    hoyCerrado.partes.push(parte({ id: "pc", fecha: H, unidadId: "u1", conductorId: "c1" }));
    expect(inicio(hoyCerrado)?.hoyEstado.tipo).toBe("enviado");
  });

  it("inicio: cerrado el de ayer, vuelve «Empezar la revisión»", () => {
    const e = conUsoDeAyer();
    const cerrado = { ...e, partes: e.partes.map((p) => (p.id === "pu" ? { ...p, estado: "enviado" as const, kmFin: 84400, combustible: "medio" as const, enviado: "2026-11-17T18:00:00.000Z" } : p)) };
    expect(inicio(cerrado)?.hoyEstado.tipo).toBe("sin-parte");
  });

  it("inicio (P20): el conductor con un parte en uso en una unidad, al elegir otra, ve el aviso con el parte de la primera", () => {
    expect(inicio(conUsoDeAyer(), COND, "u2")?.hoyEstado).toMatchObject({
      tipo: "cierre-pendiente",
      renglon1: RENGLON_1,
      primario: { texto: "Cerrar el parte anterior", href: "#/parte/ZK214BD/2026-11-17" },
    });
  });

  it("pantalla del parte: la revisión de hoy no se puede cargar y el aviso lleva al cierre pendiente (los dos perfiles)", () => {
    for (const perfil of [COND, ENC]) {
      const v = vistaDeParte(conUsoDeAyer(), H, perfil, "ZK214BD", H);
      expect(v, perfil.tipo).toMatchObject({
        tipo: "no-disponible",
        titulo: "No se puede cargar este parte",
        mensaje: `${RENGLON_1} Ciérrelo primero; después se puede empezar la revisión del 18/11/2026.`,
        nota: null,
        borrador: null,
        cerrarAntes: {
          renglon1: RENGLON_1,
          renglon2: "Ciérrelo primero; después se puede empezar la revisión del 18/11/2026.",
          primario: { texto: "Cerrar el parte anterior", href: "#/parte/ZK214BD/2026-11-17" },
        },
      });
    }
  });

  it("pantalla del parte: con un borrador se conserva y se puede descartar; el parte en uso de ayer sigue abriéndose en su cierre", () => {
    const e = conUsoDeAyer();
    e.partes.push(parte({ id: "pb", estado: "borrador", enviado: null, revisado: null, fecha: H, unidadId: "u1" }));
    expect(vistaDeParte(e, H, ENC, "ZK214BD", H)).toMatchObject({ tipo: "no-disponible", nota: "Tiene una revisión empezada para el 18/11/2026: se conserva.", borrador: { parteId: "pb", descartar: "Descartar borrador" } });
    expect(vistaDeParte(e, H, ENC, "ZK214BD", "2026-11-17").tipo).toBe("cierre");
  });

  it("pantalla del parte: si la licencia también bloquea, gana la licencia (perfil Conductor); un día anterior al parte en uso no queda bloqueado", () => {
    expect(vistaDeParte(sinLicencia(conUsoDeAyer()), H, COND, "ZK214BD", H)).toMatchObject({ cerrarAntes: null, mensaje: expect.stringContaining("no tiene licencia de conducir vigente") });
    expect(vistaDeParte(conUsoDeAyer(), H, ENC, "ZK214BD", "2026-11-16").tipo).toBe("edicion");
  });

  it("QA B1 (P20): si el parte en uso de la otra unidad es de hoy, el aviso dice que está en uso y no que «quedó sin cerrar»", () => {
    const { estado } = enUso(flotaDePrueba());
    expect(inicio(estado, COND, "u2")?.hoyEstado).toMatchObject({
      tipo: "cierre-pendiente",
      renglon1: "ZK 214 BD: el parte de hoy está en uso.",
      renglon2: "Ciérrelo primero; después podrá empezar la revisión de hoy.",
      primario: { texto: "Cerrar el parte anterior", href: "#/parte/ZK214BD/2026-11-18" },
    });
    expect(vistaDeParte(estado, H, COND, "ZKB482", H)).toMatchObject({
      tipo: "no-disponible",
      mensaje: "ZK 214 BD: el parte de hoy está en uso. Ciérrelo primero; después se puede empezar la revisión del 18/11/2026.",
      cerrarAntes: { renglon1: "ZK 214 BD: el parte de hoy está en uso." },
    });
  });

  it("pantalla del parte (P20): el conductor con un parte en uso en otra unidad no puede cargar la revisión de esta, y el aviso lleva a ese cierre", () => {
    const e = conUsoDeAyer();
    expect(vistaDeParte(e, H, COND, "ZKB482", H)).toMatchObject({
      tipo: "no-disponible",
      cerrarAntes: { renglon1: RENGLON_1, primario: { texto: "Cerrar el parte anterior", href: "#/parte/ZK214BD/2026-11-17" } },
    });
    // el encargado elige al conductor en el formulario: ahí el error llega al enviar
    expect(vistaDeParte(e, H, ENC, "ZKB482", H).tipo).toBe("edicion");
  });
});

describe("opciones del diálogo «¿Quién completa el parte?» (L1)", () => {
  it("todo conductor activo es elegible; cada uno trae si su licencia ampara hoy", () => {
    const e = flotaDePrueba();
    e.documentos = e.documentos.map((d) => (d.id === "c2-licencia" ? { ...d, vence: "2026-11-15" } : d));
    expect(opcionesParaElegirConductor(e, H)).toEqual([
      { id: "c1", nombre: "Luis Ferreyra", unidad: "ZK 214 BD", licenciaVigente: true },
      { id: "c2", nombre: "Rosa Quiroga", unidad: "ZKB 482", licenciaVigente: false },
    ]);
  });

  it("un conductor inactivo no se ofrece", () => {
    const e = flotaDePrueba();
    e.conductores = e.conductores.map((c) => (c.id === "c2" ? { ...c, activo: false } : c));
    expect(opcionesParaElegirConductor(e, H).map((o) => o.id)).toEqual(["c1"]);
  });
});

describe("pantalla del parte, edición (6.5)", () => {
  const ver = (e: Estado, perfil: Perfil, patente = "ZK214BD", fecha = H) => vistaDeParte(e, H, perfil, patente, fecha);

  it("parte nuevo de hoy con el perfil Conductor: P13 (conductor y kilometraje inicial ya completados), ayuda del último registro y diez puntos", () => {
    const v = ver(flotaDePrueba(), COND);
    expect(v.tipo).toBe("edicion");
    if (v.tipo !== "edicion") return;
    expect(v).toMatchObject({
      paso: "revision",
      titulo: "Revisión antes de salir",
      contexto: "Parte del miércoles 18/11/2026 · paso 1 de 2",
      unidadId: "u1",
      patente: "ZK214BD",
      patenteTexto: "ZK 214 BD",
      interno: "Int. 07",
      descripcion: "Marca Modelo 2020 · Camioneta",
      fecha: H,
      avisoFueraDePlazo: null,
      avisoAptitud: null,
      parteId: null,
      borrador: null,
      conductor: { tipo: "fijo", id: "c1", nombre: "Luis Ferreyra" },
      vuelta: { texto: "Parte diario", href: "#/conductor" },
      ayudaKmInicio: "Último registro: 84.320 km (parte del 17/11/2026).",
      ayudaKmFin: "Lo que marca el tablero al terminar la jornada.",
      ayudaLitros: "Déjelo vacío si no cargó.",
    });
    expect(v.valoresIniciales).toMatchObject({ conductorId: "c1", kmInicio: "84.320", kmFin: "", combustible: "" });
    expect(v.puntos).toHaveLength(10);
    expect(v.puntos[0]).toEqual({ id: "frenos", texto: "Frenos", critico: true, notaCritica: "Al enviar la revisión, la unidad queda fuera de servicio y no sale, hasta que el encargado resuelva la novedad y la vuelva a poner en servicio." });
    expect(v.puntos[5]).toEqual({ id: "niveles", texto: "Niveles de aceite y agua", critico: false, notaCritica: null });
    expect(v.combustible.map((o) => o.valor)).toEqual(["reserva", "cuarto", "medio", "tres-cuartos", "lleno"]);
  });

  it("con el perfil Encargado: un `select` de conductores activos, con el asignado elegido y su unidad al lado", () => {
    const e = flotaDePrueba();
    e.conductores.push({ id: "c3", nombre: "Inés Paz", legajo: "L-0103", activo: false });
    const v = ver(e, ENC);
    expect(v.tipo).toBe("edicion");
    if (v.tipo !== "edicion") return;
    expect(v.conductor).toEqual({
      tipo: "elegir",
      etiqueta: "Conductor",
      opciones: [
        { valor: "", etiqueta: "Elija quién conduce", asignadoA: null, licenciaVigente: true, textoDeOpcion: "Elija quién conduce" },
        { valor: "c1", etiqueta: "Luis Ferreyra", asignadoA: "ZK 214 BD", licenciaVigente: true, textoDeOpcion: "Luis Ferreyra · ZK 214 BD" },
        { valor: "c2", etiqueta: "Rosa Quiroga", asignadoA: "ZKB 482", licenciaVigente: true, textoDeOpcion: "Rosa Quiroga · ZKB 482" },
      ],
    });
    expect(v.valoresIniciales.conductorId).toBe("c1");
    expect(v.vuelta).toEqual({ texto: "Ficha de ZK 214 BD", href: "#/unidad/ZK214BD" });
  });

  it("encargado y unidad sin conductor asignado: el `select` arranca sin elegir", () => {
    const e = flotaDePrueba();
    e.unidades[0] = { ...e.unidades[0]!, conductorId: null };
    const v = ver(e, ENC);
    expect(v.tipo === "edicion" && v.valoresIniciales.conductorId).toBe("");
  });

  it("con el perfil Conductor el conductor del parte es siempre quien lo completa, aunque el borrador lo hubiera empezado otro", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "pb", estado: "borrador", enviado: null, fecha: H, conductorId: "c2", checklist: checklistVacio(), kmFin: null, combustible: null }));
    const v = ver(e, COND);
    expect(v.tipo === "edicion" && v.valoresIniciales.conductorId).toBe("c1");
    const w = ver(e, ENC);
    expect(w.tipo === "edicion" && w.valoresIniciales.conductorId).toBe("c2");
  });

  it("un borrador guardado vuelve con todo lo escrito (sobrevive a una recarga) y dice cuándo se guardó", () => {
    const e0 = flotaDePrueba();
    const checklist = { ...checklistVacio(), frenos: { estado: "con-novedad" as const, descripcion: "Ruido al frenar", impideUso: true } };
    const g = ejecutarOk(e0, borrador({ kmFin: 84400, combustible: "cuarto", litrosCargados: 45.5, checklist }));
    const v = ver(g.estado, COND);
    expect(v.tipo).toBe("edicion");
    if (v.tipo !== "edicion") return;
    expect(v.parteId).toBe(g.cambios.partes[0]?.id);
    expect(v.valoresIniciales).toMatchObject({ kmInicio: "84.320", kmFin: "84.400", combustible: "cuarto", litros: "45,5" });
    expect(v.valoresIniciales.checklist.frenos).toEqual({ respuesta: "con-novedad", descripcion: "Ruido al frenar", impideUso: true });
    expect(v.borrador).toEqual({ mensaje: "Borrador recuperado, guardado en este equipo el 18/11/2026 a las 12:00." });
  });

  it("un parte de un día pasado (dentro de los 7 días): aviso de fuera de plazo y el kilometraje inicial sale del registro anterior a esa fecha", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "p16", unidadId: "u1", fecha: "2026-11-16", kmInicio: 83800, kmFin: 84000, enviado: "2026-11-16T21:00:00.000Z" }));
    e.partes = e.partes.filter((p) => !(p.unidadId === "u1" && p.fecha === "2026-11-17"));
    e.partes.push(parte({ id: "p17", unidadId: "u1", fecha: "2026-11-17", kmInicio: 84000, kmFin: 84320, enviado: "2026-11-17T21:00:00.000Z" }));
    const v = ver(e, COND, "ZK214BD", "2026-11-17");
    expect(v.tipo).toBe("lectura"); // ya está enviado
    // Ya hay un parte posterior (el de hoy, 84.500): el último registro de un parte de ayer es el anterior a ayer, no el más nuevo.
    const posterior = parte({ id: "p18", unidadId: "u1", fecha: H, kmInicio: 84320, kmFin: 84500, enviado: "2026-11-18T14:00:00.000Z" });
    const w = ver({ ...e, partes: [...e.partes.filter((p) => p.id !== "p17"), posterior] }, COND, "ZK214BD", "2026-11-17");
    expect(w.tipo).toBe("edicion");
    if (w.tipo !== "edicion") return;
    expect(w).toMatchObject({ avisoFueraDePlazo: "Este parte es del 17/11/2026: la revisión se enviará fuera de plazo.", contexto: "Parte del martes 17/11/2026 · paso 1 de 2", ayudaKmInicio: "Último registro: 84.000 km (parte del 16/11/2026)." });
    expect(w.valoresIniciales.kmInicio).toBe("84.000");
  });

  it("una unidad sin registros de kilometraje: el inicio queda vacío y la ayuda dice que es el primer registro", () => {
    const e = flotaDePrueba();
    e.partes = [];
    const v = ver(e, COND);
    expect(v).toMatchObject({ tipo: "edicion", ayudaKmInicio: "Es el primer registro de esta unidad." });
    expect(v.tipo === "edicion" && v.valoresIniciales.kmInicio).toBe("");
  });

  it("después de una corrección de kilometraje, el último registro es la corrección", () => {
    const e = flotaDePrueba();
    e.correccionesKm.push({ id: "k1", unidadId: "u1", desde: H, kmBase: 120, motivo: "Cambio de tablero", instante: "2026-11-18T14:00:00.000Z", autor: "Rocío" });
    const v = ver(e, COND);
    expect(v).toMatchObject({ tipo: "edicion", ayudaKmInicio: "Último registro: 120 km (corrección de kilometraje del 18/11/2026)." });
    expect(v.tipo === "edicion" && v.valoresIniciales.kmInicio).toBe("120");
  });

  it("una unidad que no puede salir (seguro vencido) lo avisa también en el parte, pero se puede cargar (P9)", () => {
    const e = flotaDePrueba();
    e.documentos = e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d));
    const v = ver(e, COND);
    expect(v).toMatchObject({ tipo: "edicion", avisoAptitud: { titular: "ZK 214 BD no puede salir: Seguro vencido hace 1 día.", accion: "Avise al encargado antes de usarla." } });
  });
  it("el aviso de aptitud no le dice «avise al encargado» al propio encargado, y concuerda en género (QA M-2)", () => {
    const e = flotaDePrueba();
    e.documentos = e.documentos.map((d) => (d.id === "u1-revision-tecnica" ? { ...d, vence: "2026-11-17" } : d));
    const v = ver(e, ENC);
    expect(v).toMatchObject({ tipo: "edicion", avisoAptitud: { titular: "ZK 214 BD no puede salir: Revisión técnica vencida hace 1 día.", accion: "" } });
  });

  it("una patente que no existe: «No se encontró la unidad»", () => {
    expect(ver(flotaDePrueba(), COND, "ZZ999ZZ")).toEqual({
      tipo: "no-encontrada",
      titulo: "No se encontró la unidad",
      mensaje: "No hay ninguna unidad con la patente ZZ 999 ZZ.",
      enlace: { texto: "Ir a Parte diario", href: "#/conductor" },
    });
    expect(ver(flotaDePrueba(), ENC, "ZZ999ZZ")).toMatchObject({ tipo: "no-encontrada", enlace: { texto: "Ir a Centro de alertas", href: "#/alertas" } });
  });
});

describe("pantalla del parte, lo que no se puede cargar (P2, P8)", () => {
  const ver = (e: Estado, fecha: string, perfil: Perfil = COND, patente = "ZK214BD") => vistaDeParte(e, H, perfil, patente, fecha);

  it("P2: una fecha futura sin parte: el mensaje de la regla y el enlace al inicio", () => {
    expect(ver(flotaDePrueba(), "2026-11-19")).toEqual({
      tipo: "no-disponible",
      titulo: "No se puede cargar este parte",
      mensaje: "La fecha no puede ser posterior a hoy.",
      nota: null,
      borrador: null,
      enlace: { texto: "Ir a Parte diario", href: "#/conductor" },
      cerrarAntes: null,
    });
  });

  it("P2: una fecha de hace más de 7 días sin parte; hace 7 sí se puede", () => {
    expect(ver(flotaDePrueba(), "2026-11-10")).toMatchObject({ tipo: "no-disponible", mensaje: "Solo se pueden cargar partes de los últimos 7 días." });
    expect(ver(flotaDePrueba(), "2026-11-11").tipo).toBe("edicion");
  });

  it("un borrador de hace más de 7 días ya no se puede enviar: se ofrece descartarlo (P5)", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "viejo", estado: "borrador", enviado: null, fecha: "2026-11-05" }));
    expect(ver(e, "2026-11-05")).toMatchObject({ tipo: "no-disponible", mensaje: "Solo se pueden cargar partes de los últimos 7 días.", borrador: { parteId: "viejo", descartar: "Descartar borrador" } });
  });

  it("un parte enviado de hace más de 7 días se ve en lectura", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "viejo", fecha: "2026-11-05", kmInicio: 100, kmFin: 200 }));
    expect(ver(e, "2026-11-05").tipo).toBe("lectura");
  });

  it("P8: unidad fuera de servicio sin parte: el mensaje de la regla; con un borrador, además se puede descartar", () => {
    const e = flotaDePrueba();
    e.unidades[0] = { ...e.unidades[0]!, estado: { tipo: "fuera-de-servicio", desde: "2026-11-13", motivo: "En taller: cambio de embrague", origen: "manual", novedadIds: [] } };
    const msg = "La unidad está fuera de servicio desde el 13/11/2026 (En taller: cambio de embrague). Pida al encargado que la ponga de nuevo en servicio.";
    expect(ver(e, H)).toMatchObject({ tipo: "no-disponible", mensaje: msg, borrador: null });
    e.partes.push(parte({ id: "pb", estado: "borrador", enviado: null, fecha: H }));
    expect(ver(e, H)).toMatchObject({ tipo: "no-disponible", mensaje: msg, borrador: { parteId: "pb" } });
  });

  it("A7: unidad de baja sin parte: no se acepta; con un parte enviado se ve en lectura (se conserva el historial)", () => {
    const e = flotaDePrueba();
    e.unidades[0] = { ...e.unidades[0]!, estado: { tipo: "baja", desde: "2026-11-10", motivo: "Venta" } };
    expect(ver(e, H)).toMatchObject({ tipo: "no-disponible", mensaje: "La unidad ZK 214 BD está dada de baja desde el 10/11/2026." });
    expect(ver(e, "2026-11-17").tipo).toBe("lectura");
  });

  it("el enlace de vuelta depende del perfil", () => {
    expect(ver(flotaDePrueba(), "2026-11-19", ENC)).toMatchObject({ enlace: { href: "#/alertas" } });
  });
});

describe("parte cerrado: lectura y panel «Parte cerrado» (6.5)", () => {
  it("P7: un parte enviado se ve en lectura, nunca en edición", () => {
    const { estado } = enviado(flotaDePrueba());
    expect(vistaDeParte(estado, H, COND, "ZK214BD", H).tipo).toBe("lectura");
    expect(vistaDeParte(estado, H, ENC, "ZK214BD", H).tipo).toBe("lectura");
  });

  it("el panel: recorrido, combustible, litros, novedades y «Volver al inicio»", () => {
    const { estado, parte: p } = enviado(flotaDePrueba(), { litrosCargados: 45.5 });
    expect(panelDeParteEnviado(estado, p, COND)).toEqual({
      variante: "cerrado",
      titulo: "Parte cerrado",
      linea: "ZK 214 BD, 18/11/2026: revisión a las 12:00, cierre a las 12:00.",
      filas: [
        { rotulo: "Recorrido", valor: "132 km (84.320 → 84.452)" },
        { rotulo: "Combustible", valor: "3/4" },
        { rotulo: "Combustible cargado", valor: "Cargó 45,5 litros" },
        { rotulo: "Novedades", valor: "Sin novedades" },
      ],
      avisoCritica: null,
      advertencias: [],
      conDocumentacionVencida: false,
      fueraDePlazo: null,
      notaEncargado: null,
      parrafo: null,
      completarCierre: null,
      volverAlInicio: { texto: "Volver al inicio", href: "#/conductor" },
    });
    expect(panelDeParteEnviado(estado, p, ENC).volverAlInicio.href).toBe("#/alertas");
  });

  it("sin carga de combustible y sin recorrido: «No cargó» y «Sin uso»", () => {
    const { estado, parte: p } = enviado(flotaDePrueba(), { kmFin: 84320 });
    const panel = panelDeParteEnviado(estado, p, COND);
    expect(panel.filas.find((f) => f.rotulo === "Recorrido")?.valor).toBe("Sin uso (84.320 → 84.320)");
    expect(panel.filas.find((f) => f.rotulo === "Combustible cargado")?.valor).toBe("No cargó");
  });

  it("frenos con novedad: parte cerrado sin salida (P16): «Sin uso: la unidad no salió», sin fila de litros, y el aviso de que la unidad quedó fuera de servicio (A3)", () => {
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Ruido al frenar", impideUso: false } };
    const { estado, parte: p } = enviado(flotaDePrueba(), { checklist });
    const panel = panelDeParteEnviado(estado, p, COND);
    expect(panel.filas.find((f) => f.rotulo === "Novedades")?.valor).toBe("1 crítica: Frenos");
    expect(panel.filas.map((f) => f.rotulo)).toEqual(["Recorrido", "Combustible", "Novedades"]);
    expect(panel.filas[0]).toEqual({ rotulo: "Recorrido", valor: "Sin uso: la unidad no salió" });
    expect(panel.filas[1]).toEqual({ rotulo: "Combustible", valor: "No se registró: la unidad no salió" });
    expect(panel.linea).toBe("ZK 214 BD, 18/11/2026: revisión a las 12:00.");
    expect(panel.avisoCritica).toBe("La unidad quedó fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio.");
  });

  it("novedades de las dos gravedades, con «Otra novedad»", () => {
    const checklist = {
      ...checklistEnOrden(),
      frenos: { estado: "con-novedad" as const, descripcion: "Ruido", impideUso: false },
      direccion: { estado: "con-novedad" as const, descripcion: "Juego", impideUso: false },
      cabina: { estado: "con-novedad" as const, descripcion: "Sucia", impideUso: false },
    };
    const { estado, parte: p } = enviado(flotaDePrueba(), { checklist, otraNovedad: { descripcion: "Luz de patente", impideUso: false } });
    expect(panelDeParteEnviado(estado, p, COND).filas.find((f) => f.rotulo === "Novedades")?.valor).toBe("2 críticas: Frenos, Dirección; 2 normales: Orden y limpieza de la cabina, Otra novedad");
  });

  it("una sola novedad normal: no hay aviso de fuera de servicio", () => {
    const checklist = { ...checklistEnOrden(), cabina: { estado: "con-novedad" as const, descripcion: "Sucia", impideUso: false } };
    const { estado, parte: p } = enviado(flotaDePrueba(), { checklist });
    const panel = panelDeParteEnviado(estado, p, COND);
    expect(panel.avisoCritica).toBeNull();
    expect(panel.filas.find((f) => f.rotulo === "Novedades")?.valor).toBe("1 normal: Orden y limpieza de la cabina");
  });

  it("el aviso de «quedó fuera de servicio» solo sale mientras la unidad sigue fuera de servicio (si ya volvió a servicio, no)", () => {
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Ruido", impideUso: false } };
    const hecho = enviado(flotaDePrueba(), { checklist });
    const sinEfecto = { ...hecho.estado, unidades: hecho.estado.unidades.map((u) => (u.id === "u1" ? { ...u, estado: { tipo: "en-servicio" as const } } : u)) };
    expect(panelDeParteEnviado(sinEfecto, hecho.parte, COND).avisoCritica).toBeNull();
    expect(panelDeParteEnviado(hecho.estado, hecho.parte, COND).avisoCritica).not.toBeNull();
  });

  it("advertencias aceptadas (K6, P9 de la revisión y K7 del cierre) y revisión fuera de plazo", () => {
    const e = flotaDePrueba();
    e.documentos = e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d));
    const { estado, parte: p } = enviado(e, { kmInicio: 85500, kmFin: 86800 }, ["salto-km", "documentacion-vencida", "recorrido-largo"]);
    const panel = panelDeParteEnviado(estado, p, COND);
    expect(panel.advertencias).toEqual([
      { tono: "semana", texto: "1.180 km sin registrar desde el último parte" },
      { tono: "critico", texto: "El seguro de ZK 214 BD venció el 17/11/2026. Se envió de todos modos: quedó registrado." },
      { tono: "semana", texto: "Recorrido del día inusualmente largo: 1.300 km" },
    ]);
    // Fuera de plazo: la revisión del parte de ayer se envió hoy.
    const tarde = { ...p, fecha: "2026-11-17", revisado: "2026-11-18T12:30:00.000Z" };
    const t = panelDeParteEnviado(estado, tarde, COND);
    expect(t.fueraDePlazo).toBe("Revisión enviada fuera de plazo.");
  });

  it("C1: «Revisión enviada»: el parte quedó en uso, con «Completar el cierre ahora» (hoy) o «Completar el cierre» como primario (día pasado)", () => {
    const { estado, parte: p } = enUso(flotaDePrueba());
    const c1 = panelDeRevisionEnviada(estado, p, COND, H);
    expect(c1).toEqual({
      variante: "revision-enviada",
      titulo: "Revisión enviada",
      linea: "ZK 214 BD puede salir. Revisión enviada a las 12:00.",
      filas: [
        { rotulo: "Al iniciar", valor: "84.320 km" },
        { rotulo: "Novedades", valor: "Sin novedades" },
      ],
      avisoCritica: null,
      advertencias: [],
      conDocumentacionVencida: false,
      fueraDePlazo: null,
      notaEncargado: null,
      parrafo: "Al terminar la jornada, vuelva a este parte para cerrarlo con el kilometraje y el combustible.",
      completarCierre: { texto: "Completar el cierre ahora", href: "#/parte/ZK214BD/2026-11-18", primario: false },
      volverAlInicio: { texto: "Volver al inicio", href: "#/conductor" },
    });
    const deAyer = panelDeRevisionEnviada(estado, p, COND, "2026-11-19");
    expect(deAyer.completarCierre).toEqual({ texto: "Completar el cierre", href: "#/parte/ZK214BD/2026-11-18", primario: true });
    // C4: un parte de un día pasado no dice «al terminar la jornada»: la jornada ya terminó
    expect(deAyer.parrafo).toBe("Falta cerrar este parte con el kilometraje y el combustible de esa jornada.");
  });

  it("C1 (S1): con documentación vencida aceptada la línea no dice «puede salir» y el panel lo marca; fuera de plazo también", () => {
    const e = flotaDePrueba();
    e.documentos = e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d));
    const { parte: p, estado } = enUso(flotaDePrueba());
    // el parte en uso con documentación vencida se arma aceptando el aviso
    const g = ejecutarOk(e, borrador({ checklist: checklistEnOrden() }));
    const id = g.cambios.partes[0]?.id ?? "";
    const uso = ejecutarOk(g.estado, { tipo: "enviarRevision", parteId: id, advertenciasAceptadas: ["documentacion-vencida"] });
    const conAviso = uso.estado.partes.find((x) => x.id === id)!;
    const panel = panelDeRevisionEnviada(uso.estado, conAviso, COND, H);
    expect(panel.conDocumentacionVencida).toBe(true);
    expect(panel.linea).toBe("ZK 214 BD: revisión enviada a las 12:00. Sale con documentación vencida: quedó registrado.");
    expect(panel.advertencias).toEqual([{ tono: "critico", texto: "El seguro de ZK 214 BD venció el 17/11/2026. Se envió de todos modos: quedó registrado." }]);
    const tarde = { ...conAviso, fecha: "2026-11-17", revisado: "2026-11-18T08:10:00.000Z" };
    expect(panelDeRevisionEnviada(uso.estado, tarde, COND, H).linea).toBe("Revisión del 17/11/2026 enviada el 18/11/2026 a las 05:10 (fuera de plazo). Salió con documentación vencida: quedó registrado.");
    // sin documentación vencida, como siempre
    expect(panelDeRevisionEnviada(estado, p, COND, H).conDocumentacionVencida).toBe(false);
    expect(panelDeRevisionEnviada(estado, p, COND, H).linea).toMatch(/puede salir\. Revisión enviada a las/);
  });

  it("C1: con una novedad normal la nota dice que el encargado la ve; fuera de plazo lo dice la línea", () => {
    const checklist = { ...checklistEnOrden(), niveles: { estado: "con-novedad" as const, descripcion: "Falta agua", impideUso: false } };
    const { estado, parte: p } = enUso(flotaDePrueba(), { checklist });
    const c1 = panelDeRevisionEnviada(estado, p, COND, H);
    expect(c1.filas[1]).toEqual({ rotulo: "Novedades", valor: "1 normal: Niveles de aceite y agua" });
    expect(c1.notaEncargado).toBe("El encargado la ve en el centro de alertas.");
    const tarde = panelDeRevisionEnviada(estado, { ...p, fecha: "2026-11-17", revisado: "2026-11-18T11:10:00.000Z" }, COND, H);
    expect(tarde.linea).toBe("Revisión del 17/11/2026 enviada el 18/11/2026 a las 08:10 (fuera de plazo).");
  });

  it("C2: «La unidad no puede salir»: la novedad crítica, el aviso, el párrafo y solo «Volver al inicio»", () => {
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Pedal blando", impideUso: false }, direccion: { estado: "con-novedad" as const, descripcion: "Juego", impideUso: false } };
    const { estado, parte: p } = enviado(flotaDePrueba(), { checklist });
    const c2 = panelDeSinSalida(estado, p, COND);
    expect(c2).toMatchObject({
      variante: "sin-salida",
      titulo: "La unidad no puede salir",
      linea: "Revisión enviada a las 12:00 con 2 novedades críticas: Frenos, Dirección.",
      avisoCritica: "ZK 214 BD quedó fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio. El parte quedó cerrado sin uso.",
      parrafo: "Si tiene que salir, elija otra unidad desde el inicio.",
      completarCierre: null,
      filas: [],
    });
    const una = enviado(flotaDePrueba(), { checklist: { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Pedal blando", impideUso: false } } });
    expect(panelDeSinSalida(una.estado, una.parte, COND).linea).toBe("Revisión enviada a las 12:00 con una novedad crítica: Frenos.");
  });

  it("D: la lectura de un parte cerrado trae Revisión y Cierre; sin salida, solo la revisión y la etiqueta «Cerrado»", () => {
    const normal = enviado(flotaDePrueba());
    const v = vistaDeParte(normal.estado, H, COND, "ZK214BD", H);
    expect(v).toMatchObject({ tipo: "lectura", etiqueta: "Cerrado", sinSalida: false, momentos: [{ rotulo: "Revisión", valor: "12:00" }, { rotulo: "Cierre", valor: "12:00" }] });
    const sin = enviado(flotaDePrueba(), { checklist: { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Pedal blando", impideUso: false } } });
    expect(vistaDeParte(sin.estado, H, COND, "ZK214BD", H)).toMatchObject({ tipo: "lectura", sinSalida: true, momentos: [{ rotulo: "Revisión", valor: "12:00" }] });
  });

  it("la lectura trae el conductor, el panel, los puntos en orden y las novedades con su texto", () => {
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Ruido al frenar", impideUso: false } };
    const { estado } = enviado(flotaDePrueba(), { checklist, otraNovedad: { descripcion: "Luz de patente", impideUso: false } });
    const v = vistaDeParte(estado, H, ENC, "ZK214BD", H);
    expect(v.tipo).toBe("lectura");
    if (v.tipo !== "lectura") return;
    expect(v).toMatchObject({
      titulo: "Parte del miércoles 18/11/2026",
      patenteTexto: "ZK 214 BD",
      conductor: "Luis Ferreyra",
      puntosEnOrden: "9 puntos en orden: Dirección, Neumáticos y rueda de auxilio, Luces y balizas, Cinturones de seguridad, Niveles de aceite y agua, Matafuego a bordo, Botiquín y kit de emergencia, Documentación a bordo, Orden y limpieza de la cabina",
      vuelta: { texto: "Ficha de ZK 214 BD", href: "#/unidad/ZK214BD" },
    });
    expect(v.novedades).toEqual([
      { rotulo: "Frenos", texto: "Ruido al frenar", critica: true },
      { rotulo: "Otra novedad", texto: "Luz de patente", critica: false },
    ]);
    expect(v.panel.titulo).toBe("Parte cerrado");
  });

  it("sin puntos en orden (los diez con novedad) no hay línea de «puntos en orden»", () => {
    const checklist = Object.fromEntries(Object.keys(checklistEnOrden()).map((k) => [k, { estado: "con-novedad" as const, descripcion: "xx x", impideUso: false }])) as ReturnType<typeof checklistEnOrden>;
    const { estado } = enviado(flotaDePrueba(), { checklist });
    const v = vistaDeParte(estado, H, COND, "ZK214BD", H);
    expect(v.tipo === "lectura" && v.puntosEnOrden).toBeNull();
  });
});

// Evita que el linter de variables sin uso se queje de las fábricas que solo usan algunos casos.
void documento;

describe("pantalla del parte y licencia (L1, P13; 17.5)", () => {
  const sinLicencia = (e: Estado, vence = "2026-11-15"): Estado => ({ ...e, documentos: e.documentos.map((d) => (d.id === "c1-licencia" ? { ...d, vence } : d)) });

  it("perfil Conductor sin licencia para la fecha: «No se puede cargar este parte» con el texto de L1 en segunda persona", () => {
    const v = vistaDeParte(sinLicencia(flotaDePrueba()), H, COND, "ZK214BD", H);
    expect(v).toEqual({
      tipo: "no-disponible",
      titulo: "No se puede cargar este parte",
      mensaje: "Para el 18/11/2026 no tiene licencia de conducir vigente (venció el 15/11/2026). Sin licencia vigente no se puede enviar la revisión ni salir con la unidad.",
      nota: null,
      borrador: null,
      enlace: { texto: "Ir a Parte diario", href: "#/conductor" },
      cerrarAntes: null,
    });
  });

  it("los tres motivos de la pantalla: «no hay ninguna cargada» y «la nueva vale desde el 20/11/2026»", () => {
    const sin = flotaDePrueba();
    sin.documentos = sin.documentos.filter((d) => d.id !== "c1-licencia");
    expect(vistaDeParte(sin, H, COND, "ZK214BD", H)).toMatchObject({ mensaje: expect.stringContaining("(no hay ninguna cargada)") });
    const nueva = sinLicencia(flotaDePrueba());
    nueva.documentos = [...nueva.documentos, documento({ id: "c1-nueva", titular: { tipo: "conductor", id: "c1" }, tipo: "licencia", vence: "2031-01-01", emitido: "2026-11-20", reemplazaA: "c1-licencia" })];
    expect(vistaDeParte(nueva, H, COND, "ZK214BD", H)).toMatchObject({ mensaje: expect.stringContaining("(la nueva vale desde el 20/11/2026)") });
  });

  it("con un borrador de hoy: se ofrece descartarlo y se dice que se conserva; con un borrador de un día pasado, solo descartarlo", () => {
    const e = sinLicencia(flotaDePrueba());
    e.partes = e.partes.filter((p) => !(p.unidadId === "u1" && p.fecha === "2026-11-17"));
    e.partes.push(parte({ id: "pb", estado: "borrador", enviado: null, revisado: null, fecha: H, unidadId: "u1" }));
    expect(vistaDeParte(e, H, COND, "ZK214BD", H)).toMatchObject({
      tipo: "no-disponible",
      nota: "El borrador se conserva: cuando el encargado cargue una licencia vigente, podrá enviarlo.",
      borrador: { parteId: "pb", descartar: "Descartar borrador" },
    });
    e.partes.push(parte({ id: "pc", estado: "borrador", enviado: null, revisado: null, fecha: "2026-11-17", unidadId: "u1" }));
    expect(vistaDeParte(e, H, COND, "ZK214BD", "2026-11-17")).toMatchObject({ tipo: "no-disponible", nota: null, borrador: { parteId: "pc" } });
  });

  it("la licencia se mira a la fecha del parte: la que vencía H - 3 todavía vale para un parte de H - 4", () => {
    const e = sinLicencia({ ...flotaDePrueba(), partes: [] }, "2026-11-15");
    expect(vistaDeParte(e, H, COND, "ZK214BD", "2026-11-14").tipo).toBe("edicion");
    expect(vistaDeParte(e, H, COND, "ZK214BD", "2026-11-16").tipo).toBe("no-disponible");
  });

  it("perfil Encargado: el formulario se muestra igual; el conductor asignado sin licencia no se precarga (P13) y su opción lo dice", () => {
    const e = sinLicencia(flotaDePrueba());
    const v = vistaDeParte(e, H, ENC, "ZK214BD", H);
    expect(v.tipo).toBe("edicion");
    if (v.tipo !== "edicion") return;
    expect(v.valoresIniciales.conductorId).toBe("");
    expect(v.conductor.tipo === "elegir" && v.conductor.opciones.map((o) => [o.valor, o.licenciaVigente])).toEqual([["", true], ["c1", false], ["c2", true]]);
    // con la licencia al día se precarga como siempre
    expect(vistaDeParte(flotaDePrueba(), H, ENC, "ZK214BD", H)).toMatchObject({ valoresIniciales: { conductorId: "c1" } });
  });

  it("C13: la opción del `select` dice el dato primero y la patente al final: «{Nombre} (sin licencia vigente) · {P}»", () => {
    const v = vistaDeParte(sinLicencia(flotaDePrueba()), H, ENC, "ZK214BD", H);
    expect(v.tipo).toBe("edicion");
    if (v.tipo !== "edicion" || v.conductor.tipo !== "elegir") return;
    expect(v.conductor.opciones.map((o) => o.textoDeOpcion)).toEqual(["Elija quién conduce", "Luis Ferreyra (sin licencia vigente) · ZK 214 BD", "Rosa Quiroga · ZKB 482"]);
  });

  it("B5: las opciones de conductor evalúan la licencia solo con la fecha y los documentos juntos; sin ellos no se evalúa (todas vigentes)", () => {
    const e = sinLicencia(flotaDePrueba());
    expect(opcionesDeConductor(e, { licencia: { fecha: H, documentos: e.documentos } }).map((o) => [o.valor, o.licenciaVigente])).toEqual([["", true], ["c1", false], ["c2", true]]);
    expect(opcionesDeConductor(e).every((o) => o.licenciaVigente)).toBe(true);
  });

  it("un parte en uso con la licencia vencida después: se abre el cierre (L3), con el perfil Conductor también", () => {
    const uso = sinLicencia(enUso(flotaDePrueba()).estado);
    expect(vistaDeParte(uso, H, COND, "ZK214BD", H).tipo).toBe("cierre");
    expect(vistaDeParte(uso, H, ENC, "ZK214BD", H).tipo).toBe("cierre");
  });

  it("un parte en uso de una unidad de baja: «No se puede cargar», sin descartar (A7, P7)", () => {
    const uso = enUso(flotaDePrueba()).estado;
    const baja = { ...uso, unidades: uso.unidades.map((u) => (u.id === "u1" ? { ...u, estado: { tipo: "baja" as const, desde: "2026-11-10", motivo: "Venta" } } : u)) };
    expect(vistaDeParte(baja, H, COND, "ZK214BD", H)).toMatchObject({ tipo: "no-disponible", borrador: null, mensaje: "La unidad ZK 214 BD está dada de baja desde el 10/11/2026." });
  });

  it("un parte en uso con la unidad fuera de servicio: el cierre se acepta (P8)", () => {
    const uso = enUso(flotaDePrueba()).estado;
    const fuera = { ...uso, unidades: uso.unidades.map((u) => (u.id === "u1" ? { ...u, estado: { tipo: "fuera-de-servicio" as const, desde: H, motivo: "En taller", origen: "manual" as const, novedadIds: [] } } : u)) };
    expect(vistaDeParte(fuera, H, COND, "ZK214BD", H).tipo).toBe("cierre");
  });
});
