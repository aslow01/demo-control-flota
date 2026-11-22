// Inicio del conductor (docs/diseno-ui.md, 6.4) y pantalla del parte (6.5): todo lo que dibujan, listo, sin DOM y sin reglas nuevas. Parte del
// estado, de las alertas y de la fecha de hoy (las mismas que usa el resto de la aplicación), así lo que se ve acá nunca contradice al centro de alertas
// ni a la ficha. Los enlaces vienen como `href` ya armados (`#/parte/ZK214BD/2026-11-18`): por eso vive junto al enrutador y no en `dominio/`.
//
// El parte tiene dos pasos (docs/diseno.md, sección 17): la revisión antes de salir y el cierre de la jornada. Qué se muestra en cada ruta lo decide el
// estado del parte: sin parte o borrador → revisión; en uso → cierre; cerrado → lectura.

import type { ResultadoAlertas } from "../dominio/alertas.ts";
import { aptitud } from "../dominio/aptitud.ts";
import { diaDeLaSemana, diasEntre, fechaEnArgentina, formatearFecha, formatearHora, parsearInstante } from "../dominio/fechas.ts";
import { opcionesDeConductor, type OpcionDeConductor } from "../dominio/formulario.ts";
import { OPCIONES_COMBUSTIBLE, faltantesDeValores, valoresDeParte, valoresIniciales, type ValoresParte } from "../dominio/formulario-parte.ts";
import { describirRegistro, kmDeRegistro, registroAnterior, registrosDeKm, textoRecorrido } from "../dominio/kilometraje.ts";
import { ITEMS_CHECKLIST, conductorParaParte, novedadesDelParte, parteLegible, partePendienteDeCierre, validarFechaParte } from "../dominio/parte.ts";
import { formatearPatente } from "../dominio/patente.ts";
import {
  NOMBRES_COMBUSTIBLE,
  TEXTO_BORRADOR_CONSERVADO,
  TEXTO_FORMULARIO_PARTE,
  TEXTO_GUARDADO,
  TEXTO_INICIO_CONDUCTOR as TI,
  TEXTO_PANTALLA_PARTE as TP,
  TEXTO_PARTE,
  errParteAnteriorSinCerrar,
  errUnidadDeBaja,
  errUnidadFueraDeServicio,
  formatearKm,
  textoAdvertenciaAceptada,
  textoBorradorDelConductor,
  textoCerrarElParteDel,
  textoCierrePendiente,
  textoDescripcionUnidad,
  textoEnUsoDesde,
  textoEnviadoALas,
  textoHoyDelConductor,
  textoInterno,
  textoLicenciaDelConductorNoAmpara,
  textoLineaParteCerrado,
  textoLineaRevisionEnviada,
  textoLineaSinSalida,
  textoLitros,
  textoNoPuedeManejarHoy,
  textoNovedadesDelParte,
  textoPendienteBorrador,
  textoPendienteSinCerrar,
  textoPendienteSinParte,
  textoPuntosEnOrdenConNombres,
  textoRangoKm,
  textoResumenDeLaRevision,
  textoSinParteFueraDeServicio,
  textoSinSalidaDelConductor,
  textoSuLicencia,
  textoUltimoRegistro,
  textoUnidadNoEncontrada,
  textoUnidadNoPuedeSalir,
  textoUnidadQuedoFueraDeServicio,
} from "../dominio/textos.ts";
import type { Conductor, Estado, FechaCivil, ItemChecklist, NivelCombustible, Parte, Perfil, Unidad } from "../dominio/tipos.ts";
import { documentoVigente, estadoDeLicencia, evaluarObligatorio } from "../dominio/vencimientos.ts";
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

/**
 * Lo que dice el panel «Hoy». Se decide en este orden (docs/diseno.md, 17.5; el primero que aplica gana): sin unidad → `sin-unidad`; parte de hoy cerrado →
 * `enviado`; en uso → `en-uso` (la licencia no se mira: L3); unidad fuera de servicio → `fuera-de-servicio`; licencia que no ampara hoy → `licencia-no-vigente`;
 * un parte anterior de la unidad en uso → `cierre-pendiente` (A1); borrador → `borrador`; si no, `sin-parte`.
 */
export type EstadoDelDia =
  /** «Antes de salir, revise la unidad y envíe la revisión.» + «Empezar la revisión». */
  | { tipo: "sin-parte"; texto: string; primario: EnlaceDeParte }
  /** «Tiene una revisión empezada: faltan 5 datos.» + «Continuar la revisión» + «Descartar borrador» (el descarte es un comando: `app.descartarBorradorDeParte(parteId)`). */
  | { tipo: "borrador"; texto: string; primario: EnlaceDeParte; descartar: { texto: string; parteId: string } }
  /** «En uso desde las 06:52» + «Al terminar la jornada, cierre el parte…» + «Cerrar el parte». */
  | { tipo: "en-uso"; etiqueta: string; texto: string; primario: EnlaceDeParte }
  /**
   * Parte cerrado: «Cerrado a las 18:42» + «Ver el parte». Un parte cerrado sin salida (P16) trae `sinSalida`: «Revisión de las 06:52: novedad crítica en Frenos. La
   * unidad no salió.»; la vista lo muestra en lugar de la etiqueta.
   */
  | { tipo: "enviado"; etiqueta: string; sinSalida: string | null; enlace: EnlaceDeParte }
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
   * A1: la unidad tiene un parte anterior en uso (sin cerrar) y la revisión de hoy no se puede empezar hasta cerrarlo. `texto` «Antes de empezar la revisión de hoy, cierre el
   * parte del 17/11/2026.»; `primario` «Cerrar el parte del 17/11/2026» (lleva al cierre de ese día, el más antiguo si hay varios). Sin «Empezar la revisión». Con un
   * borrador de hoy, se conserva y se puede descartar (como en `licencia-no-vigente`).
   */
  | { tipo: "cierre-pendiente"; texto: string; primario: EnlaceDeParte; borrador: { texto: string; descartar: { texto: string; parteId: string } } | null }
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
  /** «ZK 214 BD no puede salir: Seguro vencido hace 1 día. Avise al encargado antes de usarla.» Solo en los estados `borrador` y `sin-parte` (arriba del botón, que sigue disponible: P9). */
  avisoAptitud: string | null;
  /** `modo: "otra"` = botón-texto «Usar otra unidad» que abre el `select`; `"elegir"` = el `select` «Elija la unidad» ya a la vista. Solo unidades en servicio. */
  elegirUnidad: { modo: "otra" | "elegir"; etiqueta: string; opciones: OpcionDeUnidad[] };
  /** Panel «Pendientes»: solo si hay. */
  pendientes: PendienteDelConductor[];
  /** Panel «Su licencia»: solo si vence en 30 días o menos, está vencida o falta; `null` también cuando el aviso del panel «Hoy» ya lo dice (`licencia-no-vigente`). */
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

function nombreDelPunto(item: ItemChecklist | "otra"): string {
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
  const asignadas = estado.unidades.filter((u) => u.conductorId === conductor.id && u.estado.tipo !== "baja").sort(porInterno);
  const elegida = unidadElegidaId === null ? undefined : enServicio.find((u) => u.id === unidadElegidaId);
  const unidad = elegida ?? asignadas[0] ?? null;

  // Estado del día (en este orden: 17.5).
  const licencia = estadoDeLicencia(estado.documentos, conductor.id, hoy);
  let hoyEstado: EstadoDelDia;
  let conAviso = false;
  if (unidad === null) hoyEstado = { tipo: "sin-unidad" };
  else {
    const delDia = parteDe(estado, unidad.id, hoy);
    const href = hrefDelParte(unidad, hoy);
    const patente = formatearPatente(unidad.patente);
    const sinCerrar = partePendienteDeCierre(estado.partes.flatMap((p) => parteLegible(p) ?? []), unidad.id, hoy);
    if (delDia?.estado === "enviado") {
      const hora = horaDe(delDia.enviado ?? delDia.actualizado);
      const criticas = novedadesDelParte(delDia).filter((n) => n.gravedad === "critica").map((n) => nombreDelPunto(n.item));
      hoyEstado = {
        tipo: "enviado",
        etiqueta: hora === null ? TI.enviado : textoEnviadoALas(hora),
        sinSalida: delDia.sinSalida ? textoSinSalidaDelConductor(horaDe(delDia.revisado), criticas) : null,
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
    } else if (sinCerrar !== undefined) {
      hoyEstado = {
        tipo: "cierre-pendiente",
        texto: textoCierrePendiente(sinCerrar.fecha),
        primario: { texto: textoCerrarElParteDel(sinCerrar.fecha), href: hrefDelParte(unidad, sinCerrar.fecha) },
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
  const idsAsignadas = new Set(asignadas.map((u) => u.id));
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

  // Mis últimos partes: solo los cerrados (uno sin salida dice «Sin uso»).
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
      return [{ parteId: p.id, fecha, patenteTexto, recorrido, href: hrefDelParte(u, p.fecha) }];
    });

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
    elegirUnidad: {
      modo: unidad === null ? "elegir" : "otra",
      etiqueta: unidad === null ? TI.elegirUnidad : TI.usarOtra,
      opciones: enServicio.map((u) => ({ valor: u.id, etiqueta: `${formatearPatente(u.patente)} (${textoInterno(u.interno)})`, href: hrefDelParte(u, hoy) })),
    },
    pendientes: pendientes.map(({ fecha: _fecha, ...p }) => p),
    licencia: hoyEstado.tipo === "licencia-no-vigente" ? null : licenciaDe(estado, conductor, hoy),
    ultimosPartes: { titulo: TI.ultimosTitulo, filas, vacio: filas.length === 0 ? TI.ultimosVacio : null },
  };
}

/** Una opción del diálogo «¿Quién completa el parte?»: todo conductor activo es elegible (es un punto de vista); `licenciaVigente` es la de hoy (L1). */
export interface OpcionParaElegirConductor {
  id: string;
  nombre: string;
  /** La patente con espacios de su unidad asignada, o `null`. */
  unidad: string | null;
  licenciaVigente: boolean;
}

export function opcionesParaElegirConductor(estado: Estado, hoy: FechaCivil): OpcionParaElegirConductor[] {
  return estado.conductores
    .filter((c) => c.activo)
    .map((c) => {
      const unidad = estado.unidades.find((u) => u.conductorId === c.id && u.estado.tipo !== "baja");
      return {
        id: c.id,
        nombre: c.nombre,
        unidad: unidad === undefined ? null : formatearPatente(unidad.patente),
        licenciaVigente: estadoDeLicencia(estado.documentos, c.id, hoy).vigente,
      };
    });
}

// ---------------------------------------------------------------------------------------------
// Pantalla del parte (6.5)
// ---------------------------------------------------------------------------------------------

/**
 * El panel de resultado de un parte (5.4): lo que se muestra al enviar la revisión (C1), cuando una novedad crítica deja la unidad sin salir (C2) y al cerrar (C3) y,
 * con los mismos datos, al abrir un parte ya cerrado (D). `variante` dice cuál es; los campos que no corresponden vienen `null` o vacíos.
 */
export interface PanelParteEnviado {
  variante: "revision-enviada" | "sin-salida" | "cerrado";
  /** «Revisión enviada» · «La unidad no puede salir» · «Parte cerrado». */
  titulo: string;
  /** «ZK 214 BD puede salir. Revisión enviada a las 06:52.» · «Revisión enviada a las 06:52 con una novedad crítica: Frenos.» · «ZK 214 BD, 18/11/2026: revisión a las 06:52, cierre a las 18:42.» */
  linea: string;
  /**
   * Un `dl`. C1: Al iniciar y Novedades. C3: Recorrido «132 km (84.320 → 84.452)», Combustible «3/4», Combustible cargado «Cargó 45,5 litros», Novedades. Sin salida
   * (lectura): Recorrido «Sin uso: la unidad no salió» y Combustible «No se registró: la unidad no salió», sin litros. C2: vacío.
   */
  filas: { rotulo: string; valor: string }[];
  /** Aviso en tono semana si hubo una novedad crítica y la unidad está fuera de servicio (A3): en C2 y, mientras siga así, en la lectura de un parte sin salida. */
  avisoCritica: string | null;
  /** Las advertencias que se aceptaron al enviar (K6, K7, P9), ya en texto (C3 y lectura: las de la revisión y las del cierre). */
  advertencias: string[];
  /** «Revisión enviada fuera de plazo.» (P5) o `null`. */
  fueraDeTermino: string | null;
  /** C1: «El encargado la ve en el centro de alertas.» si la revisión abrió novedades normales. */
  notaEncargado: string | null;
  /** El párrafo final: C1 «Al terminar la jornada, vuelva a este parte…», C2 «Si tiene que salir, elija otra unidad desde el inicio.»; `null` en C3. */
  parrafo: string | null;
  /** Solo C1: «Completar el cierre ahora» (parte de hoy: botón-texto) o «Completar el cierre» (parte de un día pasado: primario). `href` es el de la misma ruta. */
  completarCierre: { texto: string; href: string; primario: boolean } | null;
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

/** No se puede cargar (P2, P8, baja, L1): el mensaje de la regla. Con un borrador, se ofrece descartarlo (P5: es la salida). */
export interface ParteNoDisponible {
  tipo: "no-disponible";
  titulo: string;
  mensaje: string;
  /** L1 con el perfil Conductor, parte de hoy y un borrador: «El borrador se conserva: cuando el encargado cargue una licencia vigente, podrá enviarlo.» */
  nota: string | null;
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

/** Los diez puntos de la revisión y «Otra novedad», tal como se enviaron: el resumen del paso 2 y la lectura de un parte cerrado. */
export interface RevisionEnLectura {
  /** «9 puntos en orden: Dirección, …»; `null` si ninguno. */
  puntosEnOrden: string | null;
  /** Los puntos con novedad y «Otra novedad», con el texto completo. */
  novedades: { rotulo: string; texto: string; critica: boolean }[];
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
  /** La etiqueta de estado: «Cerrado». */
  etiqueta: string;
  /** Revisión «06:52» y Cierre «18:42» (sin salida: solo la revisión); un instante ilegible no se muestra. */
  momentos: { rotulo: string; valor: string }[];
  sinSalida: boolean;
  panel: PanelParteEnviado;
  /** «9 puntos en orden: Dirección, …»; `null` si ninguno. */
  puntosEnOrden: string | null;
  /** Los puntos con novedad y «Otra novedad», con el texto completo. */
  novedades: { rotulo: string; texto: string; critica: boolean }[];
  vuelta: EnlaceDeParte;
}

/** Paso 1: la revisión antes de salir (parte sin enviar o borrador). */
export interface ParteEnEdicion {
  tipo: "edicion";
  paso: "revision";
  /** El `h1` y el título de la pestaña: «Revisión antes de salir». */
  titulo: string;
  /** «Parte del miércoles 18/11/2026 · paso 1 de 2». */
  contexto: string;
  unidadId: string;
  patente: string;
  patenteTexto: string;
  interno: string;
  descripcion: string;
  fecha: FechaCivil;
  /** «Este parte es del 17/11/2026: la revisión se va a enviar fuera de plazo.» */
  avisoFueraDeTermino: string | null;
  avisoAptitud: string | null;
  /** El id del borrador guardado; `null` si todavía no se guardó nada (se crea con el primer cambio). */
  parteId: string | null;
  /** Un borrador que ya existía al abrir (por ejemplo, tras recargar): cuándo se guardó. */
  borrador: { mensaje: string } | null;
  /**
   * Perfil Conductor: el conductor es quien completa (texto fijo). Perfil Encargado: un `select`; cada opción dice si su licencia ampara la fecha del parte
   * (`licenciaVigente`: la vista agrega « (sin licencia vigente)»). El asignado se precarga solo si su licencia ampara la fecha (P13).
   */
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

/** Paso 2: el cierre de la jornada (parte en uso). */
export interface ParteEnCierre {
  tipo: "cierre";
  paso: "cierre";
  /** El `h1` y el título de la pestaña: «Cierre de la jornada». */
  titulo: string;
  /** «Parte del miércoles 18/11/2026 · paso 2 de 2». */
  contexto: string;
  unidadId: string;
  patente: string;
  patenteTexto: string;
  interno: string;
  descripcion: string;
  fecha: FechaCivil;
  parteId: string;
  /**
   * Lo que ya se envió y no cambia (P7): «Revisión enviada a las 06:52 · Al iniciar: 84.320 km · Sin novedades» (con el perfil Encargado agrega «· Conductor: {Nombre}») y,
   * en el `details` «Ver la revisión», los puntos como en la lectura. Sin hora legible: «Revisión enviada · …».
   */
  resumen: { linea: string; verLaRevision: string; revision: RevisionEnLectura };
  /** «84.320 km»: «Al iniciar» como texto (a partir de 30rem va junto al campo «Al terminar»). */
  kmInicioTexto: string;
  /** Los valores para ARRANCAR el cierre (lo que hubiera guardado): solo cuentan `kmFin`, `combustible` y `litros`; `kmInicio` sirve para el recorrido. */
  valoresIniciales: ValoresParte;
  /** Un cierre que ya tenía datos guardados al abrir: cuándo se guardó. */
  borrador: { mensaje: string } | null;
  ayudaKmFin: string;
  ayudaLitros: string;
  combustible: readonly { valor: NivelCombustible; etiqueta: string }[];
  /** «← Parte diario» (Conductor) o «← Ficha de ZK 214 BD» (Encargado). */
  vuelta: EnlaceDeParte;
}

export type VistaDeParte = ParteNoEncontrada | ParteNoDisponible | ParteEnLectura | ParteEnEdicion | ParteEnCierre;

function enlaceAlInicio(perfil: Perfil): EnlaceDeParte {
  const ruta = rutaPorDefecto(perfil);
  return { texto: `Ir a ${nombreDePantalla(ruta)}`, href: aHash(ruta) };
}

function enlaceDeVuelta(perfil: Perfil, unidad: Unidad): EnlaceDeParte {
  return perfil.tipo === "conductor"
    ? { texto: TP.vueltaConductor, href: aHash({ tipo: "conductor" }) }
    : { texto: TP.vueltaFicha(formatearPatente(unidad.patente)), href: aHash({ tipo: "unidad", patente: unidad.patente }) };
}

function diaConFecha(fecha: FechaCivil): string {
  return `${diaDeLaSemana(fecha)} ${formatearFecha(fecha)}`;
}

/** Las novedades de un parte, separadas por gravedad y con el nombre del punto. */
function novedadesPorGravedad(parte: Parte): { criticas: string[]; normales: string[] } {
  const novedades = novedadesDelParte(parte);
  return {
    criticas: novedades.filter((n) => n.gravedad === "critica").map((n) => nombreDelPunto(n.item)),
    normales: novedades.filter((n) => n.gravedad === "normal").map((n) => nombreDelPunto(n.item)),
  };
}

function revisionEnLectura(parte: Parte): RevisionEnLectura {
  const enOrden = ITEMS_CHECKLIST.filter((i) => parte.checklist[i.id].estado === "en-orden").map((i) => i.texto);
  return {
    puntosEnOrden: enOrden.length === 0 ? null : textoPuntosEnOrdenConNombres(enOrden),
    novedades: novedadesDelParte(parte).map((n) => ({ rotulo: nombreDelPunto(n.item), texto: n.descripcion, critica: n.gravedad === "critica" })),
  };
}

function panelBase(estado: Estado, parte: Parte, perfil: Perfil): { patente: string; unidad: Unidad | undefined; volverAlInicio: EnlaceDeParte } {
  const unidad = estado.unidades.find((u) => u.id === parte.unidadId);
  return { patente: unidad === undefined ? "" : formatearPatente(unidad.patente), unidad, volverAlInicio: { texto: TP.volverAlInicio, href: aHash(rutaPorDefecto(perfil)) } };
}

/** El panel «Parte cerrado» (C3) de un parte cerrado, y con los mismos datos la lectura (D). Un parte con la forma rota se lee con `parteLegible`: lo que no se puede leer se muestra como «—», sin inventar nada. */
export function panelDeParteEnviado(estado: Estado, entrada: Parte, perfil: Perfil): PanelParteEnviado {
  const parte = parteLegible(entrada) ?? entrada;
  const { patente, unidad, volverAlInicio } = panelBase(estado, parte, perfil);
  const { criticas, normales } = novedadesPorGravedad(parte);
  const revision = parte.revisado;
  const diaDeRevision = revision === null || parsearInstante(revision) === null ? null : fechaEnArgentina(revision);
  const sinValor = TEXTO_FORMULARIO_PARTE.sinRecorrido;

  const filas: PanelParteEnviado["filas"] = [];
  if (parte.sinSalida) {
    filas.push({ rotulo: TP.rotulos.recorrido, valor: TP.sinUsoSinSalida }, { rotulo: TP.rotulos.combustible, valor: TP.noSeRegistroSinSalida });
  } else {
    filas.push(
      { rotulo: TP.rotulos.recorrido, valor: parte.kmInicio === null || parte.kmFin === null ? sinValor : `${textoRecorrido(parte.kmFin - parte.kmInicio)} (${textoRangoKm(parte.kmInicio, parte.kmFin)})` },
      { rotulo: TP.rotulos.combustible, valor: parte.combustible === null ? sinValor : NOMBRES_COMBUSTIBLE[parte.combustible] },
      { rotulo: TP.rotulos.litros, valor: parte.litrosCargados === null ? TP.noCargo : `Cargó ${textoLitros(parte.litrosCargados)}` },
    );
  }
  filas.push({ rotulo: TP.rotulos.novedades, valor: textoNovedadesDelParte(criticas, normales) });

  return {
    variante: "cerrado",
    titulo: TP.enviado,
    linea: textoLineaParteCerrado(patente, parte.fecha, horaDe(revision), parte.sinSalida ? null : horaDe(parte.enviado ?? (parte.actualizado === "" ? null : parte.actualizado))),
    filas,
    avisoCritica: criticas.length > 0 && unidad?.estado.tipo === "fuera-de-servicio" && parte.sinSalida ? TEXTO_PARTE.enviadoConCritica : null,
    advertencias: parte.advertenciasAceptadas.map(textoAdvertenciaAceptada),
    fueraDeTermino: diaDeRevision !== null && diasEntre(parte.fecha, diaDeRevision) > 0 ? TP.fueraDeTermino : null,
    notaEncargado: null,
    parrafo: null,
    completarCierre: null,
    volverAlInicio,
  };
}

/** C1: el panel de «Revisión enviada» (el parte quedó en uso). `hoy` decide cuál de las dos acciones es la primaria. */
export function panelDeRevisionEnviada(estado: Estado, entrada: Parte, perfil: Perfil, hoy: FechaCivil): PanelParteEnviado {
  const parte = parteLegible(entrada) ?? entrada;
  const { patente, unidad, volverAlInicio } = panelBase(estado, parte, perfil);
  const { criticas, normales } = novedadesPorGravedad(parte);
  const hora = horaDe(parte.revisado);
  const diaDeEnvio = hora === null || parte.revisado === null ? null : fechaEnArgentina(parte.revisado);
  const esHoy = parte.fecha === hoy;
  const href = unidad === undefined ? volverAlInicio.href : aHash({ tipo: "parte", patente: unidad.patente, fecha: parte.fecha });

  return {
    variante: "revision-enviada",
    titulo: TP.tituloRevisionEnviada,
    linea: textoLineaRevisionEnviada(patente, parte.fecha, diaDeEnvio, hora),
    filas: [
      { rotulo: TP.rotulos.alIniciar, valor: parte.kmInicio === null ? TEXTO_FORMULARIO_PARTE.sinRecorrido : `${formatearKm(parte.kmInicio)} km` },
      { rotulo: TP.rotulos.novedades, valor: textoNovedadesDelParte(criticas, normales) },
    ],
    avisoCritica: null,
    advertencias: parte.advertenciasAceptadas.map(textoAdvertenciaAceptada),
    // El texto de «fuera de plazo» ya va en la línea (C1).
    fueraDeTermino: null,
    notaEncargado: normales.length > 0 ? TP.encargadoLaVe : null,
    parrafo: TP.alTerminarVuelva,
    completarCierre: { texto: esHoy ? TP.completarCierreAhora : TP.completarCierre, href, primario: !esHoy },
    volverAlInicio,
  };
}

/** C2: el panel «La unidad no puede salir» (la revisión informó una novedad crítica y el parte quedó cerrado sin uso). */
export function panelDeSinSalida(estado: Estado, entrada: Parte, perfil: Perfil): PanelParteEnviado {
  const parte = parteLegible(entrada) ?? entrada;
  const { patente, volverAlInicio } = panelBase(estado, parte, perfil);
  const { criticas } = novedadesPorGravedad(parte);
  return {
    variante: "sin-salida",
    titulo: TP.tituloSinSalida,
    linea: textoLineaSinSalida(horaDe(parte.revisado), criticas),
    filas: [],
    avisoCritica: textoUnidadQuedoFueraDeServicio(patente),
    advertencias: parte.advertenciasAceptadas.map(textoAdvertenciaAceptada),
    fueraDeTermino: null,
    notaEncargado: null,
    parrafo: TP.siTieneQueSalir,
    completarCierre: null,
    volverAlInicio,
  };
}

function lecturaDe(estado: Estado, unidad: Unidad, parte: Parte, perfil: Perfil): ParteEnLectura {
  const revision = revisionEnLectura(parte);
  const momentos: ParteEnLectura["momentos"] = [];
  const horaRevision = horaDe(parte.revisado);
  const horaCierre = parte.sinSalida ? null : horaDe(parte.enviado);
  if (horaRevision !== null) momentos.push({ rotulo: TP.rotulos.revision, valor: horaRevision });
  if (horaCierre !== null) momentos.push({ rotulo: TP.rotulos.cierre, valor: horaCierre });
  return {
    tipo: "lectura",
    titulo: nombreDePantalla({ tipo: "parte", patente: unidad.patente, fecha: parte.fecha }),
    unidadId: unidad.id,
    patente: unidad.patente,
    patenteTexto: formatearPatente(unidad.patente),
    interno: textoInterno(unidad.interno),
    descripcion: textoDescripcionUnidad(unidad.marca, unidad.modelo, unidad.anio, unidad.tipo),
    conductor: estado.conductores.find((c) => c.id === parte.conductorId)?.nombre ?? null,
    etiqueta: TI.enviado,
    momentos,
    sinSalida: parte.sinSalida,
    panel: panelDeParteEnviado(estado, parte, perfil),
    puntosEnOrden: revision.puntosEnOrden,
    novedades: revision.novedades,
    vuelta: enlaceDeVuelta(perfil, unidad),
  };
}

/** Cuándo se guardó el borrador que se retoma; sin un instante legible, solo «Borrador recuperado.» */
function borradorRecuperado(p: Parte): { mensaje: string } {
  const hora = horaDe(p.actualizado === "" ? null : p.actualizado);
  if (hora === null) return { mensaje: TEXTO_GUARDADO.recuperadoSinFecha };
  return { mensaje: TEXTO_GUARDADO.recuperado(formatearFecha(fechaEnArgentina(p.actualizado)), hora) };
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
 * Lo que muestra `#/parte/ZK214BD/2026-11-18`: la revisión para completar (sin parte o borrador), el cierre (en uso), el parte ya cerrado (lectura), o el motivo por el
 * que no se puede cargar. Un parte cerrado se ve siempre en lectura, sin importar la fecha ni el estado de la unidad (P7, A7). Con el perfil Conductor, una licencia
 * que no ampara la fecha del parte también es «No se puede cargar» (L1); con el perfil Encargado el formulario se muestra y el error llega al enviar.
 */
export function vistaDeParte(estado: Estado, hoy: FechaCivil, perfil: Perfil, patente: string, fecha: FechaCivil): VistaDeParte {
  const unidad = estado.unidades.find((u) => u.patente === patente);
  if (unidad === undefined) {
    return { tipo: "no-encontrada", titulo: "No se encontró la unidad", mensaje: textoUnidadNoEncontrada(formatearPatente(patente)), enlace: enlaceAlInicio(perfil) };
  }
  const existente = parteDe(estado, unidad.id, fecha);
  if (existente?.estado === "enviado") return lecturaDe(estado, unidad, existente, perfil);

  const noDisponible = (mensaje: string, nota: string | null = null, conBorrador = true): ParteNoDisponible => ({
    tipo: "no-disponible",
    titulo: TP.noDisponible,
    mensaje,
    nota,
    borrador: existente === undefined || !conBorrador ? null : { parteId: existente.id, descartar: TP.descartar },
    enlace: enlaceAlInicio(perfil),
  });

  // Un parte en uso: el cierre. Con la unidad de baja no se puede (A7) y no hay nada que descartar (P7).
  if (existente?.estado === "en-uso") {
    const e = unidad.estado;
    if (e.tipo === "baja") return noDisponible(errUnidadDeBaja(formatearPatente(unidad.patente), e.desde), null, false);
    return cierreDe(estado, unidad, existente, perfil, fecha);
  }

  const bloqueo = motivoDeBloqueo(unidad, fecha, hoy);
  if (bloqueo !== null) return noDisponible(bloqueo);

  // A1: con un parte anterior en uso, primero hay que cerrarlo; el enlace de la pantalla lleva a ese cierre.
  const sinCerrar = partePendienteDeCierre(estado.partes.flatMap((p) => parteLegible(p) ?? []), unidad.id, fecha);
  if (sinCerrar !== undefined) {
    return { ...noDisponible(errParteAnteriorSinCerrar(formatearPatente(unidad.patente), sinCerrar.fecha)), enlace: { texto: textoCerrarElParteDel(sinCerrar.fecha), href: hrefDelParte(unidad, sinCerrar.fecha) } };
  }

  // L1: el conductor del perfil sin licencia vigente para la fecha del parte.
  if (perfil.tipo === "conductor") {
    const licencia = estadoDeLicencia(estado.documentos, perfil.conductorId, fecha);
    if (!licencia.vigente) return noDisponible(textoLicenciaDelConductorNoAmpara(fecha, licencia), existente !== undefined && fecha === hoy ? TEXTO_BORRADOR_CONSERVADO : null);
  }

  const previo = registroAnterior(unidad.id, fecha, estado.partes, estado.correccionesKm);
  const kmPrevio = previo === null ? null : kmDeRegistro(previo);

  // El conductor del parte: quien lo completa (perfil Conductor), o el del borrador / el asignado con licencia vigente (perfil Encargado, P13).
  const activos = new Set(estado.conductores.filter((c) => c.activo).map((c) => c.id));
  const delPerfil = conductorParaParte(perfil, unidad, estado.documentos, fecha);
  const asignado = delPerfil !== null && activos.has(delPerfil) ? delPerfil : null;
  const conductorId = perfil.tipo === "conductor" ? perfil.conductorId : (existente?.conductorId ?? asignado);

  const valores = existente === undefined ? valoresIniciales({ conductorId, kmInicio: kmPrevio }) : { ...valoresDeParte(existente), conductorId: conductorId ?? "" };

  let conductor: ParteEnEdicion["conductor"];
  if (perfil.tipo === "conductor") {
    conductor = { tipo: "fijo", id: perfil.conductorId, nombre: estado.conductores.find((c) => c.id === perfil.conductorId)?.nombre ?? "" };
  } else {
    const lista = opcionesDeConductor(estado, { conservarId: existente?.conductorId ?? null, fecha });
    conductor = { tipo: "elegir", etiqueta: TP.conductorEtiqueta, opciones: lista.map((o, i) => (i === 0 ? { ...o, etiqueta: TP.conductorSinElegir } : o)) };
  }

  const aviso = unidad.estado.tipo === "en-servicio" ? textoDeNoPuedeSalir(estado, unidad, hoy, perfil.tipo === "conductor") : null;
  return {
    tipo: "edicion",
    paso: "revision",
    titulo: TP.tituloRevision,
    contexto: TP.contexto(diaConFecha(fecha), 1),
    unidadId: unidad.id,
    patente: unidad.patente,
    patenteTexto: formatearPatente(unidad.patente),
    interno: textoInterno(unidad.interno),
    descripcion: textoDescripcionUnidad(unidad.marca, unidad.modelo, unidad.anio, unidad.tipo),
    fecha,
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

function cierreDe(estado: Estado, unidad: Unidad, parte: Parte, perfil: Perfil, fecha: FechaCivil): ParteEnCierre {
  const revision = revisionEnLectura(parte);
  const nombresNovedades = novedadesDelParte(parte).map((n) => nombreDelPunto(n.item));
  const quien = perfil.tipo === "encargado" ? (estado.conductores.find((c) => c.id === parte.conductorId)?.nombre ?? null) : null;
  const guardado = parte.kmFin !== null || parte.combustible !== null || parte.litrosCargados !== null;
  return {
    tipo: "cierre",
    paso: "cierre",
    titulo: TP.tituloCierre,
    contexto: TP.contexto(diaConFecha(fecha), 2),
    unidadId: unidad.id,
    patente: unidad.patente,
    patenteTexto: formatearPatente(unidad.patente),
    interno: textoInterno(unidad.interno),
    descripcion: textoDescripcionUnidad(unidad.marca, unidad.modelo, unidad.anio, unidad.tipo),
    fecha,
    parteId: parte.id,
    resumen: { linea: textoResumenDeLaRevision(horaDe(parte.revisado), parte.kmInicio, nombresNovedades, quien), verLaRevision: TP.verLaRevision, revision },
    kmInicioTexto: parte.kmInicio === null ? TEXTO_FORMULARIO_PARTE.sinRecorrido : `${formatearKm(parte.kmInicio)} km`,
    valoresIniciales: valoresDeParte(parte),
    borrador: guardado ? borradorRecuperado(parte) : null,
    ayudaKmFin: TEXTO_FORMULARIO_PARTE.ayudaKmFin,
    ayudaLitros: TEXTO_FORMULARIO_PARTE.ayudaLitros,
    combustible: OPCIONES_COMBUSTIBLE,
    vuelta: enlaceDeVuelta(perfil, unidad),
  };
}
