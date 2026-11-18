// Inicio del conductor (docs/diseno-ui.md, 6.4) y pantalla del parte (6.5): todo lo que dibujan, listo, sin DOM y sin reglas nuevas. Parte del
// estado, de las alertas y de la fecha de hoy (las mismas que usa el resto de la aplicación), así lo que se ve acá nunca contradice al centro de alertas
// ni a la ficha. Los enlaces vienen como `href` ya armados (`#/parte/ZK214BD/2026-11-18`): por eso vive junto al enrutador y no en `dominio/`.

import type { ResultadoAlertas } from "../dominio/alertas.ts";
import { aptitud } from "../dominio/aptitud.ts";
import { diasEntre, fechaEnArgentina, formatearFecha, formatearHora, formatearInstante, parsearInstante } from "../dominio/fechas.ts";
import { opcionesDeConductor, type OpcionDeConductor } from "../dominio/formulario.ts";
import { OPCIONES_COMBUSTIBLE, faltantesDeValores, valoresDeParte, valoresIniciales, type ValoresParte } from "../dominio/formulario-parte.ts";
import { describirRegistro, kmDeRegistro, registroAnterior, registrosDeKm, textoRecorrido } from "../dominio/kilometraje.ts";
import { ITEMS_CHECKLIST, novedadesDelParte, parteLegible, validarFechaParte } from "../dominio/parte.ts";
import { formatearPatente } from "../dominio/patente.ts";
import {
  NOMBRES_COMBUSTIBLE,
  TEXTO_FORMULARIO_PARTE,
  TEXTO_GUARDADO,
  TEXTO_INICIO_CONDUCTOR as TI,
  TEXTO_PANTALLA_PARTE as TP,
  TEXTO_PARTE,
  errUnidadDeBaja,
  errUnidadFueraDeServicio,
  textoAdvertencia,
  textoBorradorDelConductor,
  textoDescripcionUnidad,
  textoEnviadoALas,
  textoHoyDelConductor,
  textoInterno,
  textoLineaParteEnviado,
  textoLitros,
  textoNovedadesDelParte,
  textoParteReciente,
  textoPendienteBorrador,
  textoPendienteSinParte,
  textoPuntosEnOrdenConNombres,
  textoSinParteFueraDeServicio,
  textoSuLicencia,
  textoUltimoRegistro,
  textoUnidadNoEncontrada,
  textoUnidadNoPuedeSalir,
  textoRangoKm,
} from "../dominio/textos.ts";
import type { Conductor, Estado, FechaCivil, ItemChecklist, NivelCombustible, Parte, Perfil, Unidad } from "../dominio/tipos.ts";
import { documentoVigente, evaluarObligatorio } from "../dominio/vencimientos.ts";
import { aHash, nombreDePantalla, rutaPorDefecto } from "./enrutador.ts";

export interface EnlaceDeParte {
  texto: string;
  href: string;
}

export interface OpcionDeUnidad {
  /** El id de la unidad. */
  valor: string;
  /** «ZK 214 BD (Int. 07)». */
  etiqueta: string;
  /** El parte de hoy de esa unidad. */
  href: string;
}

type Tono = "critico" | "semana" | "quincena" | "mes";

// ---------------------------------------------------------------------------------------------
// Inicio del conductor (6.4)
// ---------------------------------------------------------------------------------------------

export type EstadoDelDia =
  | { tipo: "sin-parte"; primario: EnlaceDeParte }
  /** «Tiene un parte empezado: faltan 5 datos.» + «Continuar el parte» + «Descartar borrador» (el descarte es un comando: `app.descartarBorradorDeParte(parteId)`). */
  | { tipo: "borrador"; texto: string; primario: EnlaceDeParte; descartar: { texto: string; parteId: string } }
  | { tipo: "enviado"; etiqueta: string; enlace: EnlaceDeParte }
  | { tipo: "fuera-de-servicio"; aviso: string }
  /** Sin unidad asignada (o de baja): hay que elegir una. */
  | { tipo: "sin-unidad" };

export interface PendienteDelConductor {
  /** Id del parte (borrador) o de la alerta (sin parte): clave del `each`. */
  clave: string;
  tipo: "borrador" | "sin-parte";
  texto: string;
  accion: EnlaceDeParte;
}

export interface FilaDeParteReciente {
  parteId: string;
  /** `17/11/2026`. */
  fecha: string;
  /** `17/11`. */
  fechaCorta: string;
  patenteTexto: string;
  /** «132 km» o «Sin uso». */
  recorrido: string;
  href: string;
  nombreAccesible: string;
}

export interface InicioDelConductor {
  /** El `h1`: «Parte diario». */
  titulo: string;
  conductor: { id: string; nombre: string };
  hoy: { titulo: string };
  /** La unidad del panel «Hoy»: la elegida o, si no hay, la asignada. `null` si hay que elegir una. */
  unidad: {
    unidadId: string;
    patente: string;
    patenteTexto: string;
    interno: string;
    descripcion: string;
    /** «Último registro: 84.320 km (parte del 17/11/2026).» o «Sin registros». */
    ultimoRegistro: string;
  } | null;
  hoyEstado: EstadoDelDia;
  /** «ZK 214 BD no puede salir: Seguro vencido hace 1 día. Avise al encargado antes de usarla.» (arriba del botón; el botón sigue disponible, P9). */
  avisoAptitud: string | null;
  /** `modo: "otra"` = botón-texto «Usar otra unidad» que abre el `select`; `"elegir"` = el `select` «Elija la unidad» ya a la vista. Solo unidades en servicio. */
  elegirUnidad: { modo: "otra" | "elegir"; etiqueta: string; opciones: OpcionDeUnidad[] };
  /** Panel «Pendientes»: solo si hay. */
  pendientes: PendienteDelConductor[];
  /** Panel «Su licencia»: solo si vence en 30 días o menos, está vencida o falta. */
  licencia: { titulo: string; texto: string; tono: Tono } | null;
  ultimosPartes: { titulo: string; filas: FilaDeParteReciente[]; vacio: string | null };
}

const MAXIMO_ULTIMOS_PARTES = 5;

function porInterno(a: Unidad, b: Unidad): number {
  return a.interno - b.interno || (a.patente < b.patente ? -1 : 1);
}

function hrefDelParte(unidad: Unidad, fecha: FechaCivil): string {
  return aHash({ tipo: "parte", patente: unidad.patente, fecha });
}

/** Los datos del almacenamiento son entrada externa: todo parte pasa por `parteLegible` antes de dibujarlo (uno que no se puede leer no existe). */
function parteDe(estado: Estado, unidadId: string, fecha: FechaCivil): Parte | undefined {
  const crudo = estado.partes.find((p) => p.unidadId === unidadId && p.fecha === fecha);
  return crudo === undefined ? undefined : (parteLegible(crudo) ?? undefined);
}

/** `14:32`, o `null` si el instante guardado no se puede leer. */
function horaDe(instante: string | null): string | null {
  return instante !== null && parsearInstante(instante) !== null ? formatearHora(instante) : null;
}

function textoDeNoPuedeSalir(estado: Estado, unidad: Unidad, hoy: FechaCivil, alConductor: boolean): string | null {
  const a = aptitud(unidad, estado, hoy);
  return a.categoria === "no-puede-salir" ? textoUnidadNoPuedeSalir(formatearPatente(unidad.patente), a.motivos.map((m) => m.texto), alConductor) : null;
}

function licenciaDe(estado: Estado, conductor: Conductor, hoy: FechaCivil): InicioDelConductor["licencia"] {
  const vigente = documentoVigente(estado.documentos, { tipo: "conductor", id: conductor.id }, "licencia");
  const e = evaluarObligatorio(vigente, hoy);
  if (e.estado === "vigente") return null;
  if (e.estado === "faltante" || vigente === undefined) return { titulo: TI.licenciaTitulo, texto: textoSuLicencia(null, null), tono: "critico" };
  const tono: Tono = e.estado === "vencido" ? "critico" : e.d <= 7 ? "semana" : e.d <= 15 ? "quincena" : "mes";
  return { titulo: TI.licenciaTitulo, texto: textoSuLicencia(e.d, vigente.vence), tono };
}

/**
 * La pantalla del perfil Conductor (6.4). `unidadElegidaId` es lo que eligió con «Usar otra unidad» (estado de la vista): una unidad que no existe o que no
 * está en servicio se ignora y vale la asignada. `null` con el perfil Encargado (esa pantalla no es suya).
 */
export function inicioDelConductor(
  estado: Estado,
  alertas: ResultadoAlertas,
  hoy: FechaCivil,
  perfil: Perfil,
  unidadElegidaId: string | null = null,
): InicioDelConductor | null {
  if (perfil.tipo !== "conductor") return null;
  const conductor = estado.conductores.find((c) => c.id === perfil.conductorId);
  if (conductor === undefined) return null;

  const enServicio = estado.unidades.filter((u) => u.estado.tipo === "en-servicio").sort(porInterno);
  const asignadas = estado.unidades.filter((u) => u.conductorId === conductor.id && u.estado.tipo !== "baja").sort(porInterno);
  const elegida = unidadElegidaId === null ? undefined : enServicio.find((u) => u.id === unidadElegidaId);
  const unidad = elegida ?? asignadas[0] ?? null;

  // Estado del día.
  let hoyEstado: EstadoDelDia;
  if (unidad === null) hoyEstado = { tipo: "sin-unidad" };
  else if (unidad.estado.tipo === "fuera-de-servicio") {
    hoyEstado = { tipo: "fuera-de-servicio", aviso: textoSinParteFueraDeServicio(formatearPatente(unidad.patente), unidad.estado.desde, unidad.estado.motivo) };
  } else {
    const delDia = parteDe(estado, unidad.id, hoy);
    const href = hrefDelParte(unidad, hoy);
    if (delDia?.estado === "enviado") {
      const hora = horaDe(delDia.enviado ?? delDia.actualizado);
      hoyEstado = { tipo: "enviado", etiqueta: hora === null ? TI.enviado : textoEnviadoALas(hora), enlace: { texto: TI.verParte, href } };
    } else if (delDia !== undefined) {
      hoyEstado = {
        tipo: "borrador",
        texto: textoBorradorDelConductor(faltantesDeValores(valoresDeParte(delDia)).length),
        primario: { texto: TI.continuar, href },
        descartar: { texto: TI.descartar, parteId: delDia.id },
      };
    } else hoyEstado = { tipo: "sin-parte", primario: { texto: TI.empezar, href } };
  }

  const ultimo = unidad === null ? undefined : registrosDeKm(unidad.id, estado.partes, estado.correccionesKm).at(-1);

  // Pendientes: borradores de días anteriores (de la unidad asignada o empezados por este conductor) y los días sin parte de las unidades asignadas.
  const idsAsignadas = new Set(asignadas.map((u) => u.id));
  const pendientes: (PendienteDelConductor & { fecha: FechaCivil })[] = [];
  for (const crudo of estado.partes) {
    const p = parteLegible(crudo);
    if (p === null || p.estado !== "borrador" || p.fecha >= hoy) continue;
    if (p.conductorId !== conductor.id && !idsAsignadas.has(p.unidadId)) continue;
    const u = estado.unidades.find((x) => x.id === p.unidadId);
    if (u === undefined || u.estado.tipo === "baja") continue;
    pendientes.push({
      clave: p.id,
      tipo: "borrador",
      fecha: p.fecha,
      texto: textoPendienteBorrador(p.fecha, formatearPatente(u.patente)),
      accion: { texto: TI.continuarPendiente, href: hrefDelParte(u, p.fecha) },
    });
  }
  for (const a of alertas.alertas) {
    if (a.tipo !== "sin-parte" || a.unidadId === null || a.fecha === null || !idsAsignadas.has(a.unidadId)) continue;
    const u = estado.unidades.find((x) => x.id === a.unidadId);
    if (u === undefined) continue;
    pendientes.push({
      clave: a.id,
      tipo: "sin-parte",
      fecha: a.fecha,
      texto: textoPendienteSinParte(a.fecha, formatearPatente(u.patente)),
      accion: { texto: TI.cargarPendiente, href: hrefDelParte(u, a.fecha) },
    });
  }
  pendientes.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.clave < b.clave ? -1 : 1));

  // Mis últimos partes.
  const filas: FilaDeParteReciente[] = estado.partes
    .flatMap((crudo) => parteLegible(crudo) ?? [])
    .filter((p) => p.estado === "enviado" && p.conductorId === conductor.id && p.kmInicio !== null && p.kmFin !== null)
    .sort((a, b) => (a.fecha !== b.fecha ? (a.fecha < b.fecha ? 1 : -1) : (b.enviado ?? "") < (a.enviado ?? "") ? -1 : 1))
    .slice(0, MAXIMO_ULTIMOS_PARTES)
    .flatMap((p) => {
      const u = estado.unidades.find((x) => x.id === p.unidadId);
      if (u === undefined || p.kmInicio === null || p.kmFin === null) return [];
      const patenteTexto = formatearPatente(u.patente);
      const recorrido = textoRecorrido(p.kmFin - p.kmInicio);
      const fecha = formatearFecha(p.fecha);
      return [{ parteId: p.id, fecha, fechaCorta: fecha.slice(0, 5), patenteTexto, recorrido, href: hrefDelParte(u, p.fecha), nombreAccesible: textoParteReciente(p.fecha, patenteTexto, recorrido) }];
    });

  return {
    titulo: nombreDePantalla({ tipo: "conductor" }),
    conductor: { id: conductor.id, nombre: conductor.nombre },
    hoy: { titulo: textoHoyDelConductor(hoy) },
    unidad:
      unidad === null
        ? null
        : {
            unidadId: unidad.id,
            patente: unidad.patente,
            patenteTexto: formatearPatente(unidad.patente),
            interno: textoInterno(unidad.interno),
            descripcion: textoDescripcionUnidad(unidad.marca, unidad.modelo, unidad.anio, unidad.tipo),
            ultimoRegistro: ultimo === undefined ? textoUltimoRegistro(null, null) : textoUltimoRegistro(kmDeRegistro(ultimo), describirRegistro(ultimo)),
          },
    hoyEstado,
    avisoAptitud: unidad === null || unidad.estado.tipo !== "en-servicio" ? null : textoDeNoPuedeSalir(estado, unidad, hoy, true),
    elegirUnidad: {
      modo: unidad === null ? "elegir" : "otra",
      etiqueta: unidad === null ? TI.elegirUnidad : TI.usarOtra,
      opciones: enServicio.map((u) => ({ valor: u.id, etiqueta: `${formatearPatente(u.patente)} (${textoInterno(u.interno)})`, href: hrefDelParte(u, hoy) })),
    },
    pendientes: pendientes.map(({ fecha: _fecha, ...p }) => p),
    licencia: licenciaDe(estado, conductor, hoy),
    ultimosPartes: { titulo: TI.ultimosTitulo, filas, vacio: filas.length === 0 ? TI.ultimosVacio : null },
  };
}

// ---------------------------------------------------------------------------------------------
// Pantalla del parte (6.5)
// ---------------------------------------------------------------------------------------------

/** El panel «Parte enviado» (6.5): lo que se muestra al enviar y, con los mismos datos, al abrir un parte ya enviado. */
export interface PanelParteEnviado {
  /** «Parte enviado». */
  titulo: string;
  /** «ZK 214 BD, 18/11/2026, enviado a las 18:42.» */
  linea: string;
  /** Un `dl`: Recorrido «132 km (84.320 → 84.452)», Combustible «3/4», Combustible cargado «Cargó 45,5 litros», Novedades «1 crítica: Frenos». */
  filas: { rotulo: string; valor: string }[];
  /** Aviso en tono semana si hubo una novedad crítica y la unidad está fuera de servicio (A3). */
  avisoCritica: string | null;
  /** Las advertencias que se aceptaron al enviar (K6, K7, P9), ya en texto. */
  advertencias: string[];
  /** «Enviado fuera de término.» (P5) o `null`. */
  fueraDeTermino: string | null;
  /** «Volver al inicio»: el inicio del perfil. */
  volverAlInicio: EnlaceDeParte;
}

export interface ParteNoEncontrada {
  tipo: "no-encontrada";
  /** El `h1`: «No se encontró la unidad». */
  titulo: string;
  mensaje: string;
  enlace: EnlaceDeParte;
}

/** No se puede cargar (P2, P8, baja): el mensaje de la regla. Con un borrador, se ofrece descartarlo (P5: es la salida). */
export interface ParteNoDisponible {
  tipo: "no-disponible";
  titulo: string;
  mensaje: string;
  borrador: { parteId: string; descartar: string } | null;
  enlace: EnlaceDeParte;
}

export interface PuntoDelFormulario {
  id: ItemChecklist;
  texto: string;
  critico: boolean;
  /** La nota en tono crítico de un punto crítico (5.12); `null` en los demás, que tienen la casilla «Impide usar la unidad». */
  notaCritica: string | null;
}

export interface ParteEnLectura {
  tipo: "lectura";
  /** El `h1`: «Parte del miércoles 18/11/2026». Con el panel recién enviado, el `h1` es `panel.titulo`. */
  titulo: string;
  unidadId: string;
  patente: string;
  patenteTexto: string;
  interno: string;
  descripcion: string;
  conductor: string | null;
  panel: PanelParteEnviado;
  /** «9 puntos en orden: Dirección, …»; `null` si ninguno. */
  puntosEnOrden: string | null;
  /** Los puntos con novedad y «Otra novedad», con el texto completo. */
  novedades: { rotulo: string; texto: string; critica: boolean }[];
  vuelta: EnlaceDeParte;
}

export interface ParteEnEdicion {
  tipo: "edicion";
  /** El `h1`: «Parte del miércoles 18/11/2026». */
  titulo: string;
  unidadId: string;
  patente: string;
  patenteTexto: string;
  interno: string;
  descripcion: string;
  fecha: FechaCivil;
  fechaTexto: string;
  esHoy: boolean;
  /** «Este parte es del 17/11/2026: se va a enviar fuera de término.» */
  avisoFueraDeTermino: string | null;
  avisoAptitud: string | null;
  /** El id del borrador guardado; `null` si todavía no se guardó nada (se crea con el primer cambio). */
  parteId: string | null;
  /** Un borrador que ya existía al abrir (por ejemplo, tras recargar): cuándo se guardó. */
  borrador: { guardadoEl: string | null; hora: string | null; mensaje: string } | null;
  /** Perfil Conductor: el conductor es quien completa (texto fijo). Perfil Encargado: un `select`. */
  conductor: { tipo: "fijo"; id: string; nombre: string } | { tipo: "elegir"; etiqueta: string; opciones: OpcionDeConductor[] };
  /**
   * Los valores para ARRANCAR el formulario (el borrador guardado o los de P13). La vista los copia a su propio estado y no los vuelve a leer: cada
   * autoguardado cambia el estado de la aplicación y esta vista se recalcula, pero lo que escribe la persona no se pisa.
   */
  valoresIniciales: ValoresParte;
  ayudaKmInicio: string;
  ayudaKmFin: string;
  ayudaLitros: string;
  puntos: PuntoDelFormulario[];
  /** «Impide usar la unidad» de los puntos no críticos y de «Otra novedad». */
  etiquetaImpideUso: string;
  etiquetaOtraNovedad: string;
  combustible: readonly { valor: NivelCombustible; etiqueta: string }[];
  /** «← Parte diario» (Conductor) o «← Ficha de ZK 214 BD» (Encargado). */
  vuelta: EnlaceDeParte;
}

export type VistaDeParte = ParteNoEncontrada | ParteNoDisponible | ParteEnLectura | ParteEnEdicion;

function enlaceAlInicio(perfil: Perfil): EnlaceDeParte {
  const ruta = rutaPorDefecto(perfil);
  return { texto: `Ir a ${nombreDePantalla(ruta)}`, href: aHash(ruta) };
}

function enlaceDeVuelta(perfil: Perfil, unidad: Unidad): EnlaceDeParte {
  return perfil.tipo === "conductor"
    ? { texto: TP.vueltaConductor, href: aHash({ tipo: "conductor" }) }
    : { texto: TP.vueltaFicha(formatearPatente(unidad.patente)), href: aHash({ tipo: "unidad", patente: unidad.patente }) };
}

function nombreDelPunto(item: ItemChecklist | "otra"): string {
  return item === "otra" ? "Otra novedad" : (ITEMS_CHECKLIST.find((i) => i.id === item)?.texto ?? item);
}

/** El panel «Parte enviado» de un parte enviado. Un parte con la forma rota se lee con `parteLegible`: lo que no se puede leer se muestra como «—», sin inventar nada. */
export function panelDeParteEnviado(estado: Estado, entrada: Parte, perfil: Perfil): PanelParteEnviado {
  const parte = parteLegible(entrada) ?? entrada;
  const unidad = estado.unidades.find((u) => u.id === parte.unidadId);
  const patente = unidad === undefined ? "" : formatearPatente(unidad.patente);
  const instante = parte.enviado ?? (parte.actualizado === "" ? null : parte.actualizado);
  const diaDeEnvio = instante === null ? null : fechaEnArgentina(instante);
  const fueraDeTermino = diaDeEnvio !== null && diasEntre(parte.fecha, diaDeEnvio) > 0;

  const novedades = novedadesDelParte(parte);
  const criticas = novedades.filter((n) => n.gravedad === "critica").map((n) => nombreDelPunto(n.item));
  const normales = novedades.filter((n) => n.gravedad === "normal").map((n) => nombreDelPunto(n.item));

  return {
    titulo: TP.enviado,
    linea: textoLineaParteEnviado(patente, parte.fecha, diaDeEnvio, horaDe(instante)),
    filas: [
      { rotulo: TP.rotulos.recorrido, valor: parte.kmInicio === null || parte.kmFin === null ? TEXTO_FORMULARIO_PARTE.sinRecorrido : `${textoRecorrido(parte.kmFin - parte.kmInicio)} (${textoRangoKm(parte.kmInicio, parte.kmFin)})` },
      { rotulo: TP.rotulos.combustible, valor: parte.combustible === null ? TEXTO_FORMULARIO_PARTE.sinRecorrido : NOMBRES_COMBUSTIBLE[parte.combustible] },
      { rotulo: TP.rotulos.litros, valor: parte.litrosCargados === null ? TP.noCargo : `Cargó ${textoLitros(parte.litrosCargados)}` },
      { rotulo: TP.rotulos.novedades, valor: textoNovedadesDelParte(criticas, normales) },
    ],
    avisoCritica: criticas.length > 0 && unidad?.estado.tipo === "fuera-de-servicio" ? TEXTO_PARTE.enviadoConCritica : null,
    advertencias: parte.advertenciasAceptadas.map(textoAdvertencia),
    fueraDeTermino: fueraDeTermino ? TP.fueraDeTermino : null,
    volverAlInicio: { texto: TP.volverAlInicio, href: aHash(rutaPorDefecto(perfil)) },
  };
}

function lecturaDe(estado: Estado, unidad: Unidad, parte: Parte, perfil: Perfil): ParteEnLectura {
  const enOrden = ITEMS_CHECKLIST.filter((i) => parte.checklist[i.id].estado === "en-orden").map((i) => i.texto);
  return {
    tipo: "lectura",
    titulo: nombreDePantalla({ tipo: "parte", patente: unidad.patente, fecha: parte.fecha }),
    unidadId: unidad.id,
    patente: unidad.patente,
    patenteTexto: formatearPatente(unidad.patente),
    interno: textoInterno(unidad.interno),
    descripcion: textoDescripcionUnidad(unidad.marca, unidad.modelo, unidad.anio, unidad.tipo),
    conductor: estado.conductores.find((c) => c.id === parte.conductorId)?.nombre ?? null,
    panel: panelDeParteEnviado(estado, parte, perfil),
    puntosEnOrden: enOrden.length === 0 ? null : textoPuntosEnOrdenConNombres(enOrden),
    novedades: novedadesDelParte(parte).map((n) => ({ rotulo: nombreDelPunto(n.item), texto: n.descripcion, critica: n.gravedad === "critica" })),
    vuelta: enlaceDeVuelta(perfil, unidad),
  };
}

/** Cuándo se guardó el borrador que se retoma; sin un instante legible, solo «Borrador recuperado.» */
function borradorRecuperado(p: Parte): NonNullable<ParteEnEdicion["borrador"]> {
  const hora = horaDe(p.actualizado === "" ? null : p.actualizado);
  if (hora === null) return { guardadoEl: null, hora: null, mensaje: TEXTO_GUARDADO.recuperadoSinFecha };
  return {
    guardadoEl: formatearInstante(p.actualizado),
    hora,
    mensaje: TEXTO_GUARDADO.recuperado(formatearFecha(fechaEnArgentina(p.actualizado)), hora),
  };
}

/** Por qué no se puede cargar un parte nuevo o seguir uno empezado (P8 y P2, en el orden en que los revisa el comando); `null` si se puede. */
function motivoDeBloqueo(unidad: Unidad, fecha: FechaCivil, hoy: FechaCivil): string | null {
  const e = unidad.estado;
  if (e.tipo === "baja") return errUnidadDeBaja(formatearPatente(unidad.patente), e.desde);
  if (e.tipo === "fuera-de-servicio") return errUnidadFueraDeServicio(e.desde, e.motivo);
  const f = validarFechaParte(fecha, hoy);
  return f.ok ? null : f.error.mensaje;
}

/**
 * Lo que muestra `#/parte/ZK214BD/2026-11-18`: el parte para completar (edición), el parte ya enviado (lectura), o el motivo por el que no se
 * puede cargar. Un parte enviado se ve siempre en lectura, sin importar la fecha ni el estado de la unidad (P7, A7).
 */
export function vistaDeParte(estado: Estado, hoy: FechaCivil, perfil: Perfil, patente: string, fecha: FechaCivil): VistaDeParte {
  const unidad = estado.unidades.find((u) => u.patente === patente);
  if (unidad === undefined) {
    return { tipo: "no-encontrada", titulo: "No se encontró la unidad", mensaje: textoUnidadNoEncontrada(formatearPatente(patente)), enlace: enlaceAlInicio(perfil) };
  }
  const existente = parteDe(estado, unidad.id, fecha);
  if (existente?.estado === "enviado") return lecturaDe(estado, unidad, existente, perfil);

  const bloqueo = motivoDeBloqueo(unidad, fecha, hoy);
  if (bloqueo !== null) {
    return {
      tipo: "no-disponible",
      titulo: TP.noDisponible,
      mensaje: bloqueo,
      borrador: existente === undefined ? null : { parteId: existente.id, descartar: TP.descartar },
      enlace: enlaceAlInicio(perfil),
    };
  }

  const previo = registroAnterior(unidad.id, fecha, estado.partes, estado.correccionesKm);
  const kmPrevio = previo === null ? null : kmDeRegistro(previo);

  // El conductor del parte: quien lo completa (perfil Conductor), o el del borrador / el asignado (perfil Encargado).
  const activos = new Set(estado.conductores.filter((c) => c.activo).map((c) => c.id));
  const asignado = unidad.conductorId !== null && activos.has(unidad.conductorId) ? unidad.conductorId : null;
  const conductorId = perfil.tipo === "conductor" ? perfil.conductorId : (existente?.conductorId ?? asignado);

  const valores = existente === undefined ? valoresIniciales({ conductorId, kmInicio: kmPrevio }) : { ...valoresDeParte(existente), conductorId: conductorId ?? "" };

  let conductor: ParteEnEdicion["conductor"];
  if (perfil.tipo === "conductor") {
    conductor = { tipo: "fijo", id: perfil.conductorId, nombre: estado.conductores.find((c) => c.id === perfil.conductorId)?.nombre ?? "" };
  } else {
    const lista = opcionesDeConductor(estado, { conservarId: existente?.conductorId ?? null });
    conductor = { tipo: "elegir", etiqueta: TP.conductorEtiqueta, opciones: lista.map((o, i) => (i === 0 ? { ...o, etiqueta: TP.conductorSinElegir } : o)) };
  }

  const aviso = unidad.estado.tipo === "en-servicio" ? textoDeNoPuedeSalir(estado, unidad, hoy, perfil.tipo === "conductor") : null;
  return {
    tipo: "edicion",
    titulo: nombreDePantalla({ tipo: "parte", patente: unidad.patente, fecha }),
    unidadId: unidad.id,
    patente: unidad.patente,
    patenteTexto: formatearPatente(unidad.patente),
    interno: textoInterno(unidad.interno),
    descripcion: textoDescripcionUnidad(unidad.marca, unidad.modelo, unidad.anio, unidad.tipo),
    fecha,
    fechaTexto: formatearFecha(fecha),
    esHoy: fecha === hoy,
    avisoFueraDeTermino: fecha < hoy ? TEXTO_FORMULARIO_PARTE.fueraDeTermino(fecha) : null,
    avisoAptitud: aviso,
    parteId: existente?.id ?? null,
    borrador: existente === undefined ? null : borradorRecuperado(existente),
    conductor,
    valoresIniciales: valores,
    ayudaKmInicio: previo === null ? TEXTO_FORMULARIO_PARTE.ayudaPrimerRegistro : textoUltimoRegistro(kmDeRegistro(previo), describirRegistro(previo)),
    ayudaKmFin: TEXTO_FORMULARIO_PARTE.ayudaKmFin,
    ayudaLitros: TEXTO_FORMULARIO_PARTE.ayudaLitros,
    puntos: ITEMS_CHECKLIST.map((i) => ({ id: i.id, texto: i.texto, critico: i.critico, notaCritica: i.critico ? TEXTO_PARTE.puntoCritico : null })),
    etiquetaImpideUso: TP.impideUso,
    etiquetaOtraNovedad: TP.otraNovedad,
    combustible: OPCIONES_COMBUSTIBLE,
    vuelta: enlaceDeVuelta(perfil, unidad),
  };
}
