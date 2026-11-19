// Paso 4.5 (lógica): lo que dibujan el inicio del conductor (6.4) y la pantalla del parte (6.5, panel «Parte enviado» y parte en lectura). Funciones puras
// sobre el estado: sin DOM y sin reglas nuevas (reusan aptitud, kilometraje, alertas y los comandos).
import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import type { Estado, Perfil } from "../src/lib/dominio/tipos.ts";
import { inicioDelConductor, panelDeParteEnviado, vistaDeParte } from "../src/lib/estado/parte.ts";
import { checklistEnOrden, checklistVacio, documento, ejecutarOk, flotaDePrueba, parte, unidad } from "./ayuda.ts";

const H = "2026-11-18";
const COND: Perfil = { tipo: "conductor", conductorId: "c1" };
const ENC: Perfil = { tipo: "encargado" };

type Borrador = Extract<Comando, { tipo: "guardarBorrador" }>;

function borrador(parcial: Partial<Borrador> = {}): Borrador {
  return { tipo: "guardarBorrador", parteId: null, unidadId: "u1", fecha: H, conductorId: "c1", kmInicio: 84320, kmFin: null, combustible: null, litrosCargados: null, checklist: checklistVacio(), otraNovedad: null, ...parcial };
}

/** Guarda y envía un parte completo con los cambios que se pidan; devuelve el estado y el parte enviado. */
function enviado(e: Estado, parcial: Partial<Borrador> = {}, aceptadas: ("salto-km" | "recorrido-largo" | "documentacion-vencida")[] = []) {
  const completo = borrador({ kmFin: 84452, combustible: "tres-cuartos", checklist: checklistEnOrden(), ...parcial });
  const g = ejecutarOk(e, completo);
  const id = g.cambios.partes[0]?.id ?? "";
  const r = ejecutarOk(g.estado, { tipo: "enviarParte", parteId: id, advertenciasAceptadas: aceptadas });
  const p = r.estado.partes.find((x) => x.id === id);
  if (p === undefined) throw new Error("no se envió");
  return { estado: r.estado, parte: p };
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

  it("sin parte de hoy: la unidad asignada, el último registro y «Empezar el parte»", () => {
    const v = inicio(flotaDePrueba());
    expect(v).toMatchObject({
      titulo: "Parte diario",
      hoy: { titulo: "Hoy, miércoles 18/11/2026" },
      unidad: { unidadId: "u1", patente: "ZK214BD", patenteTexto: "ZK 214 BD", interno: "Int. 07", ultimoRegistro: "Último registro: 84.320 km (parte del 17/11/2026)." },
      hoyEstado: { tipo: "sin-parte", primario: { texto: "Empezar el parte", href: "#/parte/ZK214BD/2026-11-18" } },
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

  it("borrador de hoy: «Tiene un parte empezado: faltan 4 datos.», «Continuar el parte» y descartar", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "pb", estado: "borrador", enviado: null, fecha: H, kmFin: null, combustible: null, checklist: { ...checklistEnOrden(), frenos: { estado: "sin-responder" }, luces: { estado: "sin-responder" } } }));
    expect(inicio(e)?.hoyEstado).toEqual({
      tipo: "borrador",
      texto: "Tiene un parte empezado: faltan 4 datos.",
      primario: { texto: "Continuar el parte", href: "#/parte/ZK214BD/2026-11-18" },
      descartar: { texto: "Descartar borrador", parteId: "pb" },
    });
  });

  it("borrador de hoy con una sola cosa pendiente, o ya listo", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "pb", estado: "borrador", enviado: null, fecha: H, combustible: null }));
    expect(inicio(e)?.hoyEstado).toMatchObject({ tipo: "borrador", texto: "Tiene un parte empezado: falta 1 dato." });
    e.partes[e.partes.length - 1] = parte({ id: "pb", estado: "borrador", enviado: null, fecha: H });
    expect(inicio(e)?.hoyEstado).toMatchObject({ tipo: "borrador", texto: "Tiene un parte empezado y está listo para enviar." });
  });

  it("parte de hoy enviado: «Enviado a las 18:42» y «Ver el parte»", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "pe", fecha: H, enviado: "2026-11-18T21:42:00.000Z" }));
    expect(inicio(e)?.hoyEstado).toEqual({ tipo: "enviado", etiqueta: "Enviado a las 18:42", enlace: { texto: "Ver el parte", href: "#/parte/ZK214BD/2026-11-18" } });
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
    expect(v?.avisoAptitud).toBe("ZK 214 BD no puede salir: Seguro vencido hace 1 día. Avise al encargado antes de usarla.");
    expect(v?.hoyEstado).toMatchObject({ tipo: "sin-parte" });
  });

  it("varios motivos se separan con punto y coma", () => {
    const e = flotaDePrueba();
    e.documentos = e.documentos.filter((d) => d.id !== "u1-matafuego").map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d));
    expect(inicio(e)?.avisoAptitud).toBe("ZK 214 BD no puede salir: Seguro vencido hace 1 día; Falta cargar: Carga del matafuego. Avise al encargado antes de usarla.");
  });

  it("pendientes: un borrador de ayer sin enviar y un día sin parte, con «Continuarlo» y «Cargarlo»", () => {
    const e = flotaDePrueba();
    e.partes = e.partes.filter((p) => !(p.unidadId === "u1" && p.fecha === "2026-11-17"));
    e.partes.push(parte({ id: "pa", estado: "borrador", enviado: null, fecha: "2026-11-16", unidadId: "u1" }));
    expect(inicio(e)?.pendientes).toEqual([
      { clave: "pa", tipo: "borrador", texto: "ZK 214 BD: el parte del 16/11/2026 está empezado y sin enviar.", accion: { texto: "Continuarlo", href: "#/parte/ZK214BD/2026-11-16" } },
      { clave: "sin-parte:u1:2026-11-17", tipo: "sin-parte", texto: "ZK 214 BD: no se envió el parte de ayer (17/11/2026).", accion: { texto: "Cargarlo", href: "#/parte/ZK214BD/2026-11-17" } },
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
    expect(con("2026-11-15")).toMatchObject({ texto: "Vencida hace 3 días (15/11/2026). Avise al encargado.", tono: "critico" });
    const sin = flotaDePrueba();
    sin.documentos = sin.documentos.filter((d) => d.id !== "c1-licencia");
    expect(inicio(sin)?.licencia).toEqual({ titulo: "Su licencia", texto: "Falta cargar su licencia. Avise al encargado.", tono: "critico" });
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

  it("mis últimos partes: sin partes enviados, «Todavía no envió partes. Los últimos cinco aparecerán aquí.»", () => {
    const e = flotaDePrueba();
    e.partes = [];
    expect(inicio(e)?.ultimosPartes).toMatchObject({ filas: [], vacio: "Todavía no envió partes. Los últimos cinco aparecerán aquí." });
  });

  it("«Sin uso» cuando el recorrido es 0", () => {
    const e = flotaDePrueba();
    e.partes.push(parte({ id: "x", fecha: "2026-11-16", kmInicio: 500, kmFin: 500 }));
    expect(inicio(e)?.ultimosPartes.filas.find((f) => f.parteId === "x")?.recorrido).toBe("Sin uso");
  });
});

describe("pantalla del parte, edición (6.5)", () => {
  const ver = (e: Estado, perfil: Perfil, patente = "ZK214BD", fecha = H) => vistaDeParte(e, H, perfil, patente, fecha);

  it("parte nuevo de hoy con el perfil Conductor: P13 (conductor y kilometraje inicial ya completados), ayuda del último registro y diez puntos", () => {
    const v = ver(flotaDePrueba(), COND);
    expect(v.tipo).toBe("edicion");
    if (v.tipo !== "edicion") return;
    expect(v).toMatchObject({
      titulo: "Parte del miércoles 18/11/2026",
      unidadId: "u1",
      patente: "ZK214BD",
      patenteTexto: "ZK 214 BD",
      interno: "Int. 07",
      descripcion: "Marca Modelo 2020 · Camioneta",
      fecha: H,
      avisoFueraDeTermino: null,
      avisoAptitud: null,
      parteId: null,
      borrador: null,
      conductor: { tipo: "fijo", id: "c1", nombre: "Luis Ferreyra" },
      vuelta: { texto: "Parte diario", href: "#/conductor" },
      ayudaKmInicio: "Último registro: 84.320 km (parte del 17/11/2026).",
      ayudaKmFin: "Complételo al final del día.",
      ayudaLitros: "Déjelo vacío si no cargó.",
    });
    expect(v.valoresIniciales).toMatchObject({ conductorId: "c1", kmInicio: "84.320", kmFin: "", combustible: "" });
    expect(v.puntos).toHaveLength(10);
    expect(v.puntos[0]).toEqual({ id: "frenos", texto: "Frenos", critico: true, notaCritica: "Al enviar, la unidad queda fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio." });
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
        { valor: "", etiqueta: "Elija quién conduce", asignadoA: null },
        { valor: "c1", etiqueta: "Luis Ferreyra", asignadoA: "ZK 214 BD" },
        { valor: "c2", etiqueta: "Rosa Quiroga", asignadoA: "ZKB 482" },
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

  it("un parte de un día pasado (dentro de los 7 días): aviso de fuera de término y el kilometraje inicial sale del registro anterior a esa fecha", () => {
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
    expect(w).toMatchObject({ avisoFueraDeTermino: "Este parte es del 17/11/2026: se va a enviar fuera de término.", ayudaKmInicio: "Último registro: 84.000 km (parte del 16/11/2026)." });
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
    expect(v).toMatchObject({ tipo: "edicion", avisoAptitud: "ZK 214 BD no puede salir: Seguro vencido hace 1 día. Avise al encargado antes de usarla." });
  });
  it("el aviso de aptitud no le dice «avise al encargado» al propio encargado, y concuerda en género (QA M-2)", () => {
    const e = flotaDePrueba();
    e.documentos = e.documentos.map((d) => (d.id === "u1-revision-tecnica" ? { ...d, vence: "2026-11-17" } : d));
    const v = ver(e, ENC);
    expect(v).toMatchObject({ tipo: "edicion", avisoAptitud: "ZK 214 BD no puede salir: Revisión técnica vencida hace 1 día." });
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
      borrador: null,
      enlace: { texto: "Ir a Parte diario", href: "#/conductor" },
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

describe("parte enviado: lectura y panel «Parte enviado» (6.5)", () => {
  it("P7: un parte enviado se ve en lectura, nunca en edición", () => {
    const { estado } = enviado(flotaDePrueba());
    expect(vistaDeParte(estado, H, COND, "ZK214BD", H).tipo).toBe("lectura");
    expect(vistaDeParte(estado, H, ENC, "ZK214BD", H).tipo).toBe("lectura");
  });

  it("el panel: recorrido, combustible, litros, novedades y «Volver al inicio»", () => {
    const { estado, parte: p } = enviado(flotaDePrueba(), { litrosCargados: 45.5 });
    expect(panelDeParteEnviado(estado, p, COND)).toEqual({
      titulo: "Parte enviado",
      linea: "ZK 214 BD, 18/11/2026, enviado a las 12:00.",
      filas: [
        { rotulo: "Recorrido", valor: "132 km (84.320 → 84.452)" },
        { rotulo: "Combustible", valor: "3/4" },
        { rotulo: "Combustible cargado", valor: "Cargó 45,5 litros" },
        { rotulo: "Novedades", valor: "Sin novedades" },
      ],
      avisoCritica: null,
      advertencias: [],
      fueraDeTermino: null,
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

  it("frenos con novedad: «1 crítica: Frenos» y el aviso de que la unidad quedó fuera de servicio (A3)", () => {
    const checklist = { ...checklistEnOrden(), frenos: { estado: "con-novedad" as const, descripcion: "Ruido al frenar", impideUso: false } };
    const { estado, parte: p } = enviado(flotaDePrueba(), { checklist });
    const panel = panelDeParteEnviado(estado, p, COND);
    expect(panel.filas.find((f) => f.rotulo === "Novedades")?.valor).toBe("1 crítica: Frenos");
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

  it("advertencias aceptadas (K6, P9) y envío fuera de término", () => {
    const e = flotaDePrueba();
    e.documentos = e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d));
    const g = ejecutarOk(e, borrador({ fecha: "2026-11-18", kmInicio: 85500, kmFin: 85600, combustible: "medio", checklist: checklistEnOrden() }));
    const r = ejecutarOk(g.estado, { tipo: "enviarParte", parteId: g.cambios.partes[0]?.id ?? "", advertenciasAceptadas: ["salto-km", "documentacion-vencida"] });
    const p = r.estado.partes.find((x) => x.estado === "enviado" && x.fecha === H);
    if (p === undefined) throw new Error("falta el parte");
    const panel = panelDeParteEnviado(r.estado, p, COND);
    expect(panel.advertencias).toEqual([
      "1.180 km sin registrar desde el último parte",
      "Seguro: vencido o sin cargar. Se envió igual: quedó registrado que la unidad circuló con documentación vencida.",
    ]);
    // Fuera de término: el parte es de ayer y se envía hoy.
    const tarde = { ...p, fecha: "2026-11-17", enviado: "2026-11-18T12:30:00.000Z" };
    const t = panelDeParteEnviado(r.estado, tarde, COND);
    expect(t.linea).toBe("ZK 214 BD, 17/11/2026, enviado el 18/11/2026 a las 09:30 (fuera de término).");
    expect(t.fueraDeTermino).toBe("Enviado fuera de término.");
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
    expect(v.panel.titulo).toBe("Parte enviado");
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
