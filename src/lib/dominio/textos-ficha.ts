// Textos de la ficha de unidad (docs/diseno-ui.md, 6.3 y 5.16) y de sus diálogos (5.17). `redactor-ux` los revisa.

import { formatearFecha } from "./fechas.ts";
import type { FechaCivil, TipoDocumento } from "./tipos.ts";
import { concordar, formatearKm, NOMBRES_DOCUMENTO, pluralizar, puntoEnFrase, TEXTO_SIN_CARGA, textoRangoKm } from "./textos-base.ts";
import { TEXTO_NOVEDADES_DE_FICHA } from "./textos-inicio.ts";

/** Rótulos fijos de la ficha (los que llevan datos se arman con las funciones de abajo). */
export const TEXTO_FICHA = {
  migaFlota: "Movilidades",
  /** Las cuatro solapas de la ficha en el celular (los tres últimos rótulos son los títulos de sus paneles). */
  solapas: { resumen: "Resumen", documentos: "Documentos", novedades: "Novedades", historial: "Historial" },
  /**
   * Texto para lector de pantalla del número de cada solapa; se lee después del nombre («Documentos, 2 vencidos o faltantes»).
   * Sin nada que contar, no hay número a la vista y el texto es vacío.
   */
  insigniaSolapa: {
    documentos: (vencidosOFaltantes: number) => (vencidosOFaltantes <= 0 ? "" : pluralizar(vencidosOFaltantes, "vencido o faltante", "vencidos o faltantes")),
    /** «1 abierta», «2 abiertas, 1 crítica», «3 abiertas, todas críticas». Las críticas son un subconjunto de las abiertas. */
    novedades: (abiertas: number, criticas: number) => {
      if (abiertas <= 0) return "";
      const base = pluralizar(abiertas, "abierta", "abiertas");
      const c = Math.min(Math.max(criticas, 0), abiertas);
      if (c === 0) return base;
      if (c === abiertas) return abiertas === 1 ? `${base}, crítica` : `${base}, todas críticas`;
      return `${base}, ${pluralizar(c, "crítica", "críticas")}`;
    },
  },
  noEncontrada: { titulo: "No se encontró la unidad", enlace: "Ir a Movilidades" },
  acciones: {
    cargarParte: "Cargar parte",
    /** C16: el primer botón según el parte (con el de hoy en uso, cerrado, o con uno anterior sin cerrar). */
    cerrarParte: "Cerrar el parte",
    verParte: "Ver el parte",
    ponerFueraDeServicio: "Poner fuera de servicio",
    volverAServicio: "Volver a servicio",
    masAcciones: "Más acciones",
    corregirKilometraje: "Corregir kilometraje",
    cambiarAsignacion: "Cambiar proyecto o conductor",
    cargarNovedad: "Cargar novedad",
    darDeBaja: "Dar de baja",
  },
  documentos: { titulo: "Documentos", cargarOtro: "Cargar otro documento", renovar: "Renovar", corregir: "Corregir", cargar: "Cargar" },
  novedades: TEXTO_NOVEDADES_DE_FICHA,
  kilometraje: {
    titulo: "Kilometraje",
    ultimos: "Últimos 10 partes y correcciones",
    vacio: "Todavía no hay partes enviados ni correcciones.",
    sinRegistros: "Sin registros",
  },
  historial: {
    titulo: "Historial",
    filtros: { todo: "Todo", partes: "Partes", documentos: "Documentos", novedades: "Novedades", "estado-km": "Estado y kilometraje" },
    vacio: "Todavía no hay eventos.",
    sinCarga: TEXTO_SIN_CARGA,
    verParte: "Ver el parte completo",
    antes: "Antes",
    despues: "Después",
    sinValor: "—",
  },
} as const;

/** Línea junto a la etiqueta de aptitud: uno o dos motivos tal cual; con más, solo la cantidad (y la lista debajo). */
export function textoLineaAptitud(motivos: readonly string[]): string | null {
  if (motivos.length === 0) return null;
  if (motivos.length <= 2) return motivos.join(" · ");
  return pluralizar(motivos.length, "motivo", "motivos");
}

/** Aviso de la ficha de una unidad de baja. */
export function textoDadaDeBaja(desde: FechaCivil, motivo: string): string {
  return `Dada de baja el ${formatearFecha(desde)}: ${motivo}. Se conserva su historial.`;
}

/** «84.320 km (al 17/11/2026)»: el kilometraje actual con la fecha de su último registro. */
export function textoKmConFecha(km: number, fecha: FechaCivil): string {
  return `${formatearKm(km)} km (al ${formatearFecha(fecha)})`;
}

/** Cabecera del panel de documentos: «4 · 1 vencido · 1 faltante». */
export function textoRotuloDocumentos(total: number, vencidos: number, faltantes: number): string {
  const partes = [String(total)];
  if (vencidos > 0) partes.push(pluralizar(vencidos, "vencido", "vencidos"));
  if (faltantes > 0) partes.push(pluralizar(faltantes, "faltante", "faltantes"));
  return partes.join(" · ");
}

/** «Anteriores (2)». */
export function textoAnteriores(n: number): string {
  return `Anteriores (${n})`;
}

/** Cabecera del panel de novedades: «0 abiertas», «1 abierta». */
export function textoRotuloNovedades(abiertas: number): string {
  return pluralizar(abiertas, "abierta", "abiertas");
}

/** Fila de corrección del kilometraje: «Corrección: 120 km». */
export function textoCorreccionKm(km: number): string {
  return `Corrección: ${formatearKm(km)} km`;
}

/** Cantidad de eventos del historial: «128 eventos». */
export function textoEventos(n: number): string {
  return pluralizar(n, "evento", "eventos");
}

/** Región `role="status"` del historial: «Mostrando 30 de 128 eventos.» */
export function textoMostrandoEventos(mostrados: number, total: number): string {
  return `Mostrando ${mostrados} de ${textoEventos(total)}.`;
}

/** Botón del historial: «Ver 30 más». */
export function textoVerMasEventos(n: number): string {
  return `Ver ${n} más`;
}

/** Un parte en uso en la lista de kilometraje de la ficha: «84.452 → en uso». */
export function textoKmEnUso(km: number): string {
  return `${formatearKm(km)} → en uso`;
}

/**
 * Evento «revision-enviada» en el historial: «Revisión antes de salir · 84.320 km · sin novedades» · «… · 1 novedad: Niveles de aceite y agua» ·
 * «… · novedad crítica en frenos: la unidad no salió», y «(fuera de plazo)» al final.
 */
export function textoRevisionEnHistorial(r: { kmInicio: number; normales: readonly string[]; criticas: readonly string[]; fueraDePlazo: boolean }): string {
  const partes = ["Revisión antes de salir", `${formatearKm(r.kmInicio)} km`];
  if (r.criticas.length > 0) partes.push(`novedad crítica en ${r.criticas.map(puntoEnFrase).join(", ")}: la unidad no salió`);
  else if (r.normales.length === 0) partes.push("sin novedades");
  else partes.push(`${pluralizar(r.normales.length, "novedad", "novedades")}: ${r.normales.join(", ")}`);
  return `${partes.join(" · ")}${r.fueraDePlazo ? " (fuera de plazo)" : ""}`;
}

/** Evento «parte-enviado» (el cierre) en el historial: «Parte cerrado · 132 km (84.320 → 84.452) · combustible 3/4». */
export function textoCierreEnHistorial(r: { kmInicio: number; kmFin: number; combustible: string | null }): string {
  const recorrido = r.kmFin - r.kmInicio;
  const uso = recorrido === 0 ? "sin uso" : `${formatearKm(recorrido)} km`;
  const partes = ["Parte cerrado", `${uso} (${textoRangoKm(r.kmInicio, r.kmFin)})`];
  if (r.combustible !== null) partes.push(`combustible ${r.combustible}`);
  return partes.join(" · ");
}

/** Resumen de un parte cerrado en el historial: «Parte cerrado · 132 km (84.320 → 84.452) · combustible 3/4 · 1 novedad». */
export function textoResumenParteEnviado(r: { kmInicio: number; kmFin: number; combustible: string | null; novedades: number }): string {
  const recorrido = r.kmFin - r.kmInicio;
  const uso = recorrido === 0 ? "sin uso" : `${formatearKm(recorrido)} km`;
  const partes = ["Parte cerrado", `${uso} (${textoRangoKm(r.kmInicio, r.kmFin)})`];
  if (r.combustible !== null) partes.push(`combustible ${r.combustible}`);
  partes.push(r.novedades === 0 ? "sin novedades" : pluralizar(r.novedades, "novedad", "novedades"));
  return partes.join(" · ");
}

/** «8 puntos en orden» (parte enviado, al abrir el detalle). */
export function textoPuntosEnOrden(n: number): string {
  return `${pluralizar(n, "punto", "puntos")} en orden`;
}

/** Rótulo de cada campo de un documento corregido («Antes / Después»). */
export const ROTULO_CAMPO_DOCUMENTO_CORREGIDO = { numero: "Número", emisor: "Emisor", vence: "Vencimiento", emitido: "Emisión" } as const;

/** Barra de estado después de corregir un documento: «Seguro de ZK 214 BD corregido.» */
export function textoDocumentoCorregido(tipo: TipoDocumento, titular: string): string {
  return `${NOMBRES_DOCUMENTO[tipo]} de ${titular} ${concordar(tipo, "corregido", "corregida")}.`;
}

/** Después de cargar una novedad a mano. */
export function textoNovedadCargada(patente: string, critica: boolean): string {
  return critica ? `Novedad cargada. ${patente} queda fuera de servicio hasta que se resuelva.` : "Novedad cargada.";
}

export function textoFueraDeServicio(patente: string): string {
  return `${patente} está fuera de servicio.`;
}

/** Después de volver a servicio (A5): si todavía no puede salir, dice por qué. */
export function textoVueltaAServicio(patente: string, motivosPendientes: readonly string[]): string {
  const base = `${patente} vuelve a servicio.`;
  return motivosPendientes.length === 0 ? base : `${base} Todavía no puede salir: ${motivosPendientes.join("; ")}.`;
}

export function textoKmCorregido(patente: string, km: number): string {
  return `Kilometraje de ${patente} corregido: ${formatearKm(km)} km.`;
}

/** Después de cambiar proyecto o conductor; avisa si el proyecto nuevo exige una habilitación que falta (U6). */
export function textoAsignacionCambiada(cambio: { proyecto: boolean; conductor: boolean }, faltaHabilitacion: boolean): string {
  const que = cambio.proyecto && cambio.conductor ? "Proyecto y conductor actualizados." : cambio.proyecto ? "Proyecto actualizado." : "Conductor actualizado.";
  return faltaHabilitacion ? `${que} Falta cargar la habilitación de ingreso al proyecto.` : que;
}

export function textoUnidadDadaDeBaja(patente: string): string {
  return `${patente} dada de baja. Su historial se conserva.`;
}
