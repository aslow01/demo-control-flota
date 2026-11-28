// Inicio del conductor (docs/diseno-ui.md, 6.4), «Mis partes» y las opciones de «Ver como»: todo lo que dibujan, listo, sin DOM y sin reglas nuevas. Parte del estado, de las alertas y de la fecha de hoy
// (las mismas que usa el resto de la aplicación), así lo que se ve acá nunca contradice al centro de alertas ni a la ficha. Los enlaces vienen como `href` ya armados (`#/parte/ZK214BD/2026-11-18`):
// por eso vive junto al enrutador y no en `dominio/`. No viaja con el marco: lo traen las pantallas del conductor (Hoy y Mis partes, que se bajan al entrar) y «Ver como», que lo baja al
// abrirse para sumar las sugerencias de a quién elegir. Lo liviano que el marco sí necesita está en `conductor-opciones.ts` (las opciones del diálogo) y `recorrido.ts` (la entrada de Inicio).
// Uso: `leerInicioDelConductor(app, unidadElegidaId)`, `leerMisPartes(app)` y `leerSugerenciasDeVerComo(app)`, dentro de un `$derived` de la vista.

import type { Alerta, ResultadoAlertas } from "../dominio/alertas.ts";
import { aptitud } from "../dominio/aptitud.ts";
import { formatearFecha, formatearHora, parsearInstante } from "../dominio/fechas.ts";
import { faltantesDeValores, valoresDeParte } from "../dominio/formulario-parte-valores.ts";
import { describirRegistro, kmDeRegistro, registrosDeKm, textoRecorrido } from "../dominio/kilometraje.ts";
import { documentacionQueBloquea, ITEMS_CHECKLIST, novedadesDelParte, parteEnUsoDelConductor, parteLegible, partePendienteDeCierre, parteSinSalidaDeHoy } from "../dominio/parte.ts";
import { formatearPatente } from "../dominio/patente.ts";
import { AVISE_AL_ENCARGADO, NOMBRES_DOCUMENTO, textoDescripcionUnidad, textoDocumentacionDeLaUnidad, textoInterno, textoParteSinCerrarDeLaUnidad, textoUltimoRegistro, textoVencimiento } from "../dominio/textos-base.ts";
import { type AvisoDeAptitud, TEXTO_CERRAR_ANTES, TEXTO_CONDUCTOR_PARA_PROBAR, textoBorradorDelConductor, textoEnUsoDesde, textoEnviadoALas, textoHoyDelConductor, textoNoPuedeManejarHoy, textoPendienteBorrador, textoPendienteSinCerrar, textoPendienteSinParte, textoSinParteFueraDeServicio, textoSinSalidaDelConductor, textoSuLicencia, textoUnidadNoPuedeSalir, TEXTO_INICIO_CONDUCTOR as TI } from "../dominio/textos-conductor.ts";
import type { Conductor, Documento, Estado, FechaCivil, ItemChecklist, Parte, Perfil, TipoDocumento, Unidad } from "../dominio/tipos.ts";
import { documentoVigente, estadoDeLicencia, evaluarObligatorio } from "../dominio/vencimientos.ts";
import { type MarcaParaProbar, type SugerenciasDeVerComo, unidadDeHoy } from "./conductor-opciones.ts";
import { aHash, nombreDePantalla } from "./enrutador.ts";
import type { LecturaDeApp } from "./lectura.ts";

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

/**
 * Lo que dice el panel «Hoy». Se decide en este orden (docs/diseno.md, 17.5; el primero que aplica gana): sin unidad → `sin-unidad`; parte de hoy cerrado →
 * `enviado`; en uso → `en-uso` (la licencia no se mira: L3); unidad fuera de servicio → `fuera-de-servicio`; licencia que no ampara hoy → `licencia-no-vigente`;
 * un parte anterior de la unidad en uso, o del conductor en otra unidad → `cierre-pendiente` (estado 5 bis, P18 y P20); borrador → `borrador`; si no, `sin-parte`.
 */
export type EstadoDelDia =
  /** «Antes de salir, revise la unidad y envíe la revisión.» + «Empezar la revisión». */
  | { tipo: "sin-parte"; texto: string; primario: EnlaceDeParte }
  /** «Tiene una revisión empezada: faltan 5 datos.» + «Continuar la revisión» + «Descartar borrador» (el descarte es un comando: `app.descartarBorradorDeParte(parteId)`). */
  | { tipo: "borrador"; texto: string; primario: EnlaceDeParte; descartar: { texto: string; parteId: string } }
  /** «En uso desde las 06:52» + «Al terminar la jornada, cierre el parte…» + «Cerrar el parte». */
  | { tipo: "en-uso"; etiqueta: string; texto: string; primario: EnlaceDeParte }
  /**
   * Parte cerrado: «Cerrado a las 18:42» + «Ver el parte». Un parte cerrado sin salida (P16) trae `sinSalida`: «Revisión de las 06:52: novedad crítica en frenos. La
   * unidad no salió.»; la vista lo muestra en lugar de la etiqueta. Con `sinSalida`, `hastaManana` (P19) dice que la unidad no vuelve a salir hoy aunque se resuelva la
   * novedad: «Aunque el encargado resuelva la novedad hoy, la unidad no vuelve a salir hasta mañana.»; `null` si el parte salió.
   */
  | { tipo: "enviado"; etiqueta: string; sinSalida: string | null; hastaManana: string | null; enlace: EnlaceDeParte }
  | { tipo: "fuera-de-servicio"; aviso: string }
  /**
   * L1, segunda persona: `renglon1` «No puede manejar hoy: su licencia de conducir venció el 15/11/2026.» y `renglon2` «Avise al encargado…». Sin «Usar otra unidad» (no
   * cambia nada). Con un borrador, se conserva y se puede descartar.
   */
  | {
      tipo: "licencia-no-vigente";
      renglon1: string;
      renglon2: string;
      borrador: { texto: string; descartar: { texto: string; parteId: string } } | null;
    }
  /**
   * P21: la documentación de la unidad (seguro, revisión técnica…) no está en regla hoy, así que no puede salir y la revisión no se puede empezar. `renglon1` dice qué documento y desde cuándo;
   * `renglon2` «Avise al encargado.». Sin primario (no se deshabilita nada: se explica); «Usar otra unidad» sigue disponible. Con un borrador de hoy, se conserva y se puede descartar.
   */
  | {
      tipo: "no-puede-salir";
      renglon1: string;
      renglon2: string;
      borrador: { texto: string; descartar: { texto: string; parteId: string } } | null;
    }
  /**
   * Estado 5 bis, «Cerrar antes» (A1, P20): la unidad tiene un parte anterior en uso, o el conductor tiene uno en otra unidad, y la revisión de hoy no se puede empezar hasta
   * cerrarlo. `renglon1` «ZK 214 BD: el parte del martes 17/11/2026 quedó sin cerrar.» y `renglon2` «Ciérrelo primero; después podrá empezar la revisión de hoy.»;
   * `primario` «Cerrar el parte anterior» lleva al cierre de ese parte (el más antiguo si hay varios). Sin «Empezar la revisión». Con un borrador de hoy, se conserva y se
   * puede descartar (como en `licencia-no-vigente`).
   */
  | {
      tipo: "cierre-pendiente";
      renglon1: string;
      renglon2: string;
      primario: EnlaceDeParte;
      borrador: { texto: string; descartar: { texto: string; parteId: string } } | null;
    }
  /** Sin unidad asignada (o de baja): hay que elegir una. */
  | { tipo: "sin-unidad" };

export interface PendienteDelConductor {
  /** Id del parte (borrador o en uso) o de la alerta (sin parte): clave del `each`. */
  clave: string;
  tipo: "borrador" | "sin-cerrar" | "sin-parte";
  texto: string;
  /** «Continuarlo», «Cerrarlo» o «Cargarlo». */
  accion: EnlaceDeParte;
  /** Empieza con el texto visible del botón (WCAG 2.5.3): «Cerrarlo. ZK 214 BD: el parte del 17/11/2026 quedó sin cerrar.» */
  nombreAccesible: string;
}

export interface FilaDeParteReciente {
  parteId: string;
  /** `17/11/2026`. */
  fecha: string;
  patenteTexto: string;
  /** «132 km» o «Sin uso». */
  recorrido: string;
  href: string;
}

/**
 * Un documento de la unidad que vence en `DIAS_DE_AVISO_DE_VENCIMIENTO` días o menos (hoy incluido) y todavía vale: el conductor puede salir, pero tiene que saberlo.
 * Es solo la información; la frase («La revisión técnica vence hoy») la arma la vista con los textos.
 */
export interface AvisoDeVencimientoDeUnidad {
  tipoDocumento: TipoDocumento;
  /** «Revisión técnica». */
  documento: string;
  /** Días que faltan: 0 es hoy. */
  dias: number;
  venceHoy: boolean;
  /** `dd/mm/aaaa`. */
  vence: string;
  /** «Vence hoy» · «Vence en 3 días». */
  estado: string;
}

/** Desde cuántos días antes se le avisa al conductor que algo de su unidad vence (el del prototipo aprobado). */
export const DIAS_DE_AVISO_DE_VENCIMIENTO = 7;

/** Cuántos partes muestra el panel «Mis últimos partes» de Hoy; el resto se ve en Mis partes. */
export const PARTES_EN_HOY = 3;

export interface InicioDelConductor {
  /** El `h1`: «Parte diario». */
  titulo: string;
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
  /**
   * «ZK 214 BD no puede salir: Seguro vencido hace 1 día.» (`titular`) y «Avise al encargado antes de usarla.» (`accion`), ya partido en dos renglones por la lógica: la vista no corta nada.
   * Solo en los estados `borrador` y `sin-parte` (arriba del botón, que sigue disponible).
   */
  avisoAptitud: AvisoDeAptitud | null;
  /**
   * Lo que vence pronto en su unidad (el que vence primero), mientras la unidad pueda salir y la revisión se pueda empezar o seguir (`sin-parte` y `borrador`, los mismos que
   * `avisoAptitud`). Un documento ya vencido no es un aviso: bloquea y lo dice el estado del día. `null` si no hay nada cerca.
   */
  avisoDeUnidad: AvisoDeVencimientoDeUnidad | null;
  /** `modo: "otra"` = botón-texto «Usar otra unidad» que abre el `select`; `"elegir"` = el `select` «Elija la unidad» ya a la vista. Solo unidades en servicio. */
  elegirUnidad: { modo: "otra" | "elegir"; etiqueta: string; opciones: OpcionDeUnidad[] };
  /** Panel «Pendientes»: solo si hay. */
  pendientes: PendienteDelConductor[];
  /** Panel «Su licencia»: solo si vence en 30 días o menos, está vencida o falta; `null` también cuando el aviso del panel «Hoy» ya lo dice (`licencia-no-vigente`). */
  licencia: { titulo: string; texto: string; tono: Tono } | null;
  /** Hasta cinco; el panel de Hoy muestra los primeros `PARTES_EN_HOY` y `verTodos` lleva a Mis partes (`null` si no hay ninguno). */
  ultimosPartes: { titulo: string; filas: FilaDeParteReciente[]; vacio: string | null; verTodos: { href: string } | null };
}

/** La pantalla Mis partes del conductor: los últimos cinco partes cerrados, los mismos de «Mis últimos partes» de Hoy. */
export interface MisPartes {
  /** El `h1`: «Mis partes». */
  titulo: string;
  /** El nombre del conductor del perfil. */
  conductor: string;
  filas: FilaDeParteReciente[];
  /** «Todavía no cerró partes. Los últimos cinco aparecerán aquí.» si no hay ninguno. */
  vacio: string | null;
}

const MAXIMO_ULTIMOS_PARTES = 5;

function porInterno(a: Unidad, b: Unidad): number {
  return a.interno - b.interno || (a.patente < b.patente ? -1 : 1);
}

export function hrefDelParte(unidad: Unidad, fecha: FechaCivil): string {
  return aHash({ tipo: "parte", patente: unidad.patente, fecha });
}

/** Los datos del almacenamiento son entrada externa: todo parte pasa por `parteLegible` antes de dibujarlo (uno que no se puede leer no existe). */
export function parteDe(estado: Estado, unidadId: string, fecha: FechaCivil): Parte | undefined {
  const crudo = estado.partes.find((p) => p.unidadId === unidadId && p.fecha === fecha);
  return crudo === undefined ? undefined : (parteLegible(crudo) ?? undefined);
}

/** `14:32`, o `null` si el instante guardado no se puede leer. */
export function horaDe(instante: string | null): string | null {
  return instante !== null && parsearInstante(instante) !== null ? formatearHora(instante) : null;
}

export function textoDeNoPuedeSalir(estado: Estado, unidad: Unidad, hoy: FechaCivil, alConductor: boolean): AvisoDeAptitud | null {
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

export function nombreDelPunto(item: ItemChecklist | "otra"): string {
  return item === "otra" ? "Otra novedad" : (ITEMS_CHECKLIST.find((i) => i.id === item)?.texto ?? item);
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
  const elegida = unidadElegidaId === null ? undefined : enServicio.find((u) => u.id === unidadElegidaId);
  // Sin una elegida, la suya: con dos asignadas, la de menor interno (`unidadDeHoy`, la misma que nombran «Ver como» y la entrada al recorrido).
  const unidad = elegida ?? unidadDeHoy(estado, conductor.id) ?? null;

  // Estado del día (en este orden: 17.5).
  const licencia = estadoDeLicencia(estado.documentos, conductor.id, hoy);
  let hoyEstado: EstadoDelDia;
  let conAviso = false;
  if (unidad === null) hoyEstado = { tipo: "sin-unidad" };
  else {
    const delDia = parteDe(estado, unidad.id, hoy);
    const href = hrefDelParte(unidad, hoy);
    const patente = formatearPatente(unidad.patente);
    const legibles = { partes: estado.partes.flatMap((p) => parteLegible(p) ?? []), unidades: estado.unidades };
    const sinCerrar = partePendienteDeCierre(legibles.partes, unidad.id, hoy) ?? parteEnUsoDelConductor(legibles, conductor.id, unidad.id);
    // P21: la documentación de la unidad hoy (el mismo cálculo que el comando, para la fecha de hoy).
    const proyecto = estado.proyectos.find((p) => p.id === unidad.proyectoId);
    const sinPapeles = unidad.estado.tipo === "en-servicio" && proyecto !== undefined ? documentacionQueBloquea({ fecha: hoy, unidad, proyecto, documentos: estado.documentos }) : null;
    const unidadSinCerrar = sinCerrar === undefined ? undefined : estado.unidades.find((u) => u.id === sinCerrar.unidadId);
    if (delDia?.estado === "enviado") {
      const hora = horaDe(delDia.enviado ?? delDia.actualizado);
      const criticas = novedadesDelParte(delDia).filter((n) => n.gravedad === "critica").map((n) => nombreDelPunto(n.item));
      hoyEstado = {
        tipo: "enviado",
        etiqueta: hora === null ? TI.enviado : textoEnviadoALas(hora),
        sinSalida: delDia.sinSalida ? textoSinSalidaDelConductor(horaDe(delDia.revisado), criticas) : null,
        // P19: lo decide `parteSinSalidaDeHoy`, el mismo que lee la aptitud (ficha, flota y centro de alertas).
        hastaManana: parteSinSalidaDeHoy(estado.partes, unidad.id, hoy) !== undefined ? TI.sinSalidaHastaManana : null,
        enlace: { texto: TI.verParte, href },
      };
    } else if (delDia?.estado === "en-uso") {
      const hora = horaDe(delDia.revisado);
      hoyEstado = { tipo: "en-uso", etiqueta: hora === null ? "En uso" : textoEnUsoDesde(hora), texto: TI.alTerminar, primario: { texto: TI.cerrar, href } };
    } else if (unidad.estado.tipo === "fuera-de-servicio") {
      hoyEstado = { tipo: "fuera-de-servicio", aviso: textoSinParteFueraDeServicio(patente, unidad.estado.desde, unidad.estado.motivo) };
    } else if (!licencia.vigente) {
      hoyEstado = {
        tipo: "licencia-no-vigente",
        renglon1: textoNoPuedeManejarHoy(licencia),
        renglon2: TI.licenciaAvise,
        borrador: delDia === undefined ? null : { texto: TI.revisionConservada, descartar: { texto: TI.descartar, parteId: delDia.id } },
      };
    } else if (sinPapeles !== null) {
      hoyEstado = {
        tipo: "no-puede-salir",
        renglon1: textoDocumentacionDeLaUnidad(sinPapeles.documentos, sinPapeles.contexto),
        renglon2: AVISE_AL_ENCARGADO,
        borrador: delDia === undefined ? null : { texto: TI.revisionConservada, descartar: { texto: TI.descartar, parteId: delDia.id } },
      };
    } else if (sinCerrar !== undefined && unidadSinCerrar !== undefined) {
      hoyEstado = {
        tipo: "cierre-pendiente",
        renglon1: textoParteSinCerrarDeLaUnidad(formatearPatente(unidadSinCerrar.patente), sinCerrar.fecha, hoy),
        renglon2: TEXTO_CERRAR_ANTES.inicioRenglon2,
        primario: { texto: TEXTO_CERRAR_ANTES.primario, href: hrefDelParte(unidadSinCerrar, sinCerrar.fecha) },
        borrador: delDia === undefined ? null : { texto: TI.revisionConservada, descartar: { texto: TI.descartar, parteId: delDia.id } },
      };
    } else if (delDia !== undefined) {
      conAviso = true;
      hoyEstado = {
        tipo: "borrador",
        texto: textoBorradorDelConductor(faltantesDeValores(valoresDeParte(delDia)).length),
        primario: { texto: TI.continuar, href },
        descartar: { texto: TI.descartar, parteId: delDia.id },
      };
    } else {
      conAviso = true;
      hoyEstado = { tipo: "sin-parte", texto: TI.antesDeSalir, primario: { texto: TI.empezar, href } };
    }
  }

  const ultimo = unidad === null ? undefined : registrosDeKm(unidad.id, estado.partes, estado.correccionesKm).at(-1);

  // Pendientes: partes de días anteriores sin enviar (borrador) o sin cerrar (en uso) de las unidades asignadas o empezados por este conductor, y los días sin parte.
  const idsAsignadas = new Set(estado.unidades.filter((u) => u.conductorId === conductor.id && u.estado.tipo !== "baja").map((u) => u.id));
  const pendientes: (PendienteDelConductor & { fecha: FechaCivil })[] = [];
  const agregar = (p: Omit<PendienteDelConductor, "nombreAccesible"> & { fecha: FechaCivil }): void => {
    pendientes.push({ ...p, nombreAccesible: `${p.accion.texto}. ${p.texto}` });
  };
  for (const crudo of estado.partes) {
    const p = parteLegible(crudo);
    if (p === null || p.estado === "enviado" || p.fecha >= hoy) continue;
    if (p.conductorId !== conductor.id && !idsAsignadas.has(p.unidadId)) continue;
    const u = estado.unidades.find((x) => x.id === p.unidadId);
    if (u === undefined || u.estado.tipo === "baja") continue;
    const patente = formatearPatente(u.patente);
    if (p.estado === "borrador") {
      agregar({ clave: p.id, tipo: "borrador", fecha: p.fecha, texto: textoPendienteBorrador(p.fecha, patente), accion: { texto: TI.continuarPendiente, href: hrefDelParte(u, p.fecha) } });
    } else {
      agregar({ clave: p.id, tipo: "sin-cerrar", fecha: p.fecha, texto: textoPendienteSinCerrar(p.fecha, patente), accion: { texto: TI.cerrarPendiente, href: hrefDelParte(u, p.fecha) } });
    }
  }
  for (const a of alertas.alertas) {
    if (a.tipo !== "sin-parte" || a.unidadId === null || a.fecha === null || !idsAsignadas.has(a.unidadId)) continue;
    const u = estado.unidades.find((x) => x.id === a.unidadId);
    if (u === undefined) continue;
    agregar({ clave: a.id, tipo: "sin-parte", fecha: a.fecha, texto: textoPendienteSinParte(a.fecha, formatearPatente(u.patente)), accion: { texto: TI.cargarPendiente, href: hrefDelParte(u, a.fecha) } });
  }
  pendientes.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.clave < b.clave ? -1 : 1));

  const filas = ultimosPartesDe(estado, conductor.id);
  // Lo que vence pronto en la unidad: solo cuando puede salir y la revisión se puede empezar o seguir (los estados con aviso de aptitud).
  const avisoDeUnidad = unidad === null || !conAviso ? null : avisoDeVencimientoDe(alertas, unidad.id, estado.documentos);

  return {
    titulo: nombreDePantalla({ tipo: "conductor" }),
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
    avisoAptitud: unidad === null || !conAviso ? null : textoDeNoPuedeSalir(estado, unidad, hoy, true),
    avisoDeUnidad,
    elegirUnidad: {
      modo: unidad === null ? "elegir" : "otra",
      etiqueta: unidad === null ? TI.elegirUnidad : TI.usarOtra,
      opciones: enServicio.map((u) => ({ valor: u.id, etiqueta: `${formatearPatente(u.patente)} (${textoInterno(u.interno)})`, href: hrefDelParte(u, hoy) })),
    },
    pendientes: pendientes.map(({ fecha: _fecha, ...p }) => p),
    licencia: hoyEstado.tipo === "licencia-no-vigente" ? null : licenciaDe(estado, conductor, hoy),
    ultimosPartes: {
      titulo: TI.ultimosTitulo,
      filas,
      vacio: filas.length === 0 ? TI.ultimosVacio : null,
      verTodos: filas.length === 0 ? null : { href: aHash({ tipo: "mis-partes" }) },
    },
  };
}

/** Mis últimos partes: solo los cerrados de este conductor, el más nuevo primero, hasta cinco (uno sin salida dice «Sin uso»). */
function ultimosPartesDe(estado: Estado, conductorId: string): FilaDeParteReciente[] {
  return estado.partes
    .flatMap((crudo) => parteLegible(crudo) ?? [])
    .filter((p) => p.estado === "enviado" && p.conductorId === conductorId && p.kmInicio !== null && p.kmFin !== null)
    .sort((a, b) => (a.fecha !== b.fecha ? (a.fecha < b.fecha ? 1 : -1) : (b.enviado ?? "") < (a.enviado ?? "") ? -1 : 1))
    .slice(0, MAXIMO_ULTIMOS_PARTES)
    .flatMap((p) => {
      const u = estado.unidades.find((x) => x.id === p.unidadId);
      if (u === undefined || p.kmInicio === null || p.kmFin === null) return [];
      return [{ parteId: p.id, fecha: formatearFecha(p.fecha), patenteTexto: formatearPatente(u.patente), recorrido: textoRecorrido(p.kmFin - p.kmInicio), href: hrefDelParte(u, p.fecha) }];
    });
}

/** El documento de la unidad que vence primero dentro de `DIAS_DE_AVISO_DE_VENCIMIENTO` días (hoy incluido), o `null`. Las alertas de «por vencer» ya excluyen lo vencido. */
function avisoDeVencimientoDe(alertas: ResultadoAlertas, unidadId: string, documentos: readonly Documento[]): AvisoDeVencimientoDeUnidad | null {
  const proxima = alertas.alertas
    .filter((a) => a.tipo === "documento-por-vencer" && a.unidadId === unidadId && a.d !== null && a.d <= DIAS_DE_AVISO_DE_VENCIMIENTO && a.tipoDocumento !== null)
    .reduce<Alerta | null>((m, a) => (m === null || (a.d ?? 0) < (m.d ?? 0) ? a : m), null);
  const doc = proxima === null ? undefined : documentos.find((d) => d.id === proxima.documentoId);
  if (proxima === null || proxima.tipoDocumento === null || proxima.d === null || doc === undefined) return null;
  return {
    tipoDocumento: proxima.tipoDocumento,
    documento: NOMBRES_DOCUMENTO[proxima.tipoDocumento],
    dias: proxima.d,
    venceHoy: proxima.d === 0,
    vence: formatearFecha(doc.vence),
    estado: textoVencimiento(proxima.d, doc.vence, proxima.tipoDocumento),
  };
}

/** La pantalla Mis partes del perfil Conductor (`#/conductor/partes`). `null` con el perfil Encargado o un conductor que no existe. */
export function misPartes(estado: Estado, perfil: Perfil): MisPartes | null {
  if (perfil.tipo !== "conductor") return null;
  const conductor = estado.conductores.find((c) => c.id === perfil.conductorId);
  if (conductor === undefined) return null;
  const filas = ultimosPartesDe(estado, conductor.id);
  return { titulo: nombreDePantalla({ tipo: "mis-partes" }), conductor: conductor.nombre, filas, vacio: filas.length === 0 ? TI.ultimosVacio : null };
}

/**
 * La pantalla del perfil Conductor (6.4) con el estado, el día y el perfil de la aplicación. `unidadElegidaId` es lo que eligió con «Usar otra unidad» (estado de la vista).
 * `null` con el perfil Encargado o antes de terminar el arranque.
 */
export function leerInicioDelConductor(app: LecturaDeApp, unidadElegidaId: string | null = null): InicioDelConductor | null {
  if (app.estado === null || app.alertas === null) return null;
  return inicioDelConductor(app.estado, app.alertas, app.hoy, app.perfil, unidadElegidaId);
}

/** La pantalla Mis partes (`#/conductor/partes`) del conductor del perfil. `null` con el perfil Encargado o antes de terminar el arranque. */
export function leerMisPartes(app: LecturaDeApp): MisPartes | null {
  return app.estado === null ? null : misPartes(app.estado, app.perfil);
}

/** Un caso del parte que la demo permite probar eligiendo a un conductor (M1). */
export type CasoParaProbar = "puede-salir" | "documentacion-vencida" | "fuera-de-servicio" | "sin-licencia";

/** Un conductor del ejemplo que sirve para probar un caso: `etiqueta` es la marca «Para probar: …» para el diálogo «¿Quién completa el parte?». */
export interface ConductorParaProbar {
  conductorId: string;
  nombre: string;
  /** La patente con espacios de su unidad (la que ve en «Hoy»). */
  patente: string;
  caso: CasoParaProbar;
  etiqueta: string;
}

/** En este orden se devuelven los casos (el primero es el recorrido principal de «Cómo usarla»). */
const CASOS_PARA_PROBAR: readonly CasoParaProbar[] = ["puede-salir", "documentacion-vencida", "fuera-de-servicio", "sin-licencia"];

/**
 * M1: a quién elegir para probar cada caso. Mira lo que vería ese conductor en su inicio (`inicioDelConductor`, el mismo cálculo que la pantalla), así la sugerencia nunca contradice lo que
 * aparece al elegirlo: unidad apta y sin parte hoy (`sin-parte` y sin aviso de aptitud), documentación de la unidad vencida (P21), unidad fuera de servicio (se prefiere una que quedó
 * así por una novedad crítica, la de frenos del ejemplo) y sin licencia vigente (L1). Uno por caso, el primero del listado; solo conductores activos con una unidad asignada. Un caso que
 * el estado no tiene no aparece.
 */
export function conductoresParaProbar(estado: Estado, alertas: ResultadoAlertas, hoy: FechaCivil): ConductorParaProbar[] {
  const hallados = new Map<CasoParaProbar, { sugerido: ConductorParaProbar; porNovedadCritica: boolean }>();
  for (const c of estado.conductores) {
    if (!c.activo) continue;
    // La unidad que el conductor ve en «Hoy» (la de menor interno): la patente de la sugerencia es la que va a ver al elegirlo.
    const unidad = unidadDeHoy(estado, c.id);
    if (unidad === undefined) continue;
    const inicio = inicioDelConductor(estado, alertas, hoy, { tipo: "conductor", conductorId: c.id });
    const caso = inicio === null ? null : casoParaProbar(inicio);
    if (caso === null) continue;
    const porNovedadCritica = unidad.estado.tipo === "fuera-de-servicio" && unidad.estado.origen === "novedad-critica";
    const previo = hallados.get(caso);
    if (previo !== undefined && !(caso === "fuera-de-servicio" && porNovedadCritica && !previo.porNovedadCritica)) continue;
    hallados.set(caso, { sugerido: { conductorId: c.id, nombre: c.nombre, patente: formatearPatente(unidad.patente), caso, etiqueta: TEXTO_CONDUCTOR_PARA_PROBAR[caso] }, porNovedadCritica });
  }
  return CASOS_PARA_PROBAR.flatMap((caso) => hallados.get(caso)?.sugerido ?? []);
}

/**
 * M1 para el diálogo «Ver como»: la marca «Para probar: …» de cada conductor sugerido (`conductoresParaProbar`), por su id y en el orden de los casos. Vacío antes de terminar el
 * arranque. El marco las suma a las opciones con `conSugerencias` (`conductor-opciones.ts`) cuando este módulo termina de bajar.
 */
export function leerSugerenciasDeVerComo(app: LecturaDeApp): SugerenciasDeVerComo {
  const marcas = new Map<string, MarcaParaProbar>();
  if (app.estado === null || app.alertas === null) return marcas;
  for (const s of conductoresParaProbar(app.estado, app.alertas, app.hoy)) marcas.set(s.conductorId, { etiqueta: s.etiqueta, sinLicencia: s.caso === "sin-licencia" });
  return marcas;
}

function casoParaProbar(inicio: InicioDelConductor): CasoParaProbar | null {
  switch (inicio.hoyEstado.tipo) {
    case "sin-parte":
      return inicio.avisoAptitud === null ? "puede-salir" : null;
    case "no-puede-salir":
      return "documentacion-vencida";
    case "fuera-de-servicio":
      return "fuera-de-servicio";
    case "licencia-no-vigente":
      return "sin-licencia";
    default:
      return null;
  }
}
