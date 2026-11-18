// Textos de estados y errores, en español neutro, en un solo lugar (se completa en el paso 1.10).

import { formatearFecha } from "./fechas.ts";
import type { FechaCivil } from "./tipos.ts";

/** `1 día`, `3 días`. */
export function pluralizar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** V1 a V6: texto del estado de un vencimiento. `d` = días desde hoy hasta el vencimiento. */
export function textoVencimiento(d: number, vence: FechaCivil): string {
  if (d < 0) return `Vencido hace ${pluralizar(-d, "día", "días")}`;
  if (d === 0) return "Vence hoy";
  if (d === 1) return "Vence mañana";
  if (d <= 30) return `Vence en ${d} días`;
  return `Vigente hasta ${formatearFecha(vence)}`;
}

/** Separa los miles con punto: 84320 -> `84.320`. */
export function formatearKm(km: number): string {
  return String(km).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** P4: `Falta 1 dato`, `Faltan 3 datos`. */
export function textoFaltantes(n: number): string {
  return n === 1 ? "Falta 1 dato" : `Faltan ${n} datos`;
}

// ---------------------------------------------------------------------------------------------
// Errores de los comandos (sección 8). Los recibe la interfaz tal cual; no se arman en otro lado.
// ---------------------------------------------------------------------------------------------

export const ERRORES = {
  unidadInexistente: "No se encontró la unidad.",
  conductorInexistente: "No se encontró el conductor.",
  conductorInactivo: "El conductor no está activo.",
  proyectoInexistente: "No se encontró el proyecto.",
  documentoInexistente: "No se encontró el documento.",
  parteInexistente: "No se encontró el parte.",
  novedadInexistente: "No se encontró la novedad.",
  parteEnviadoInmutable: "Un parte enviado no se puede modificar.",
  sinCambios: "No hay cambios para guardar.",
  unidadYaFueraDeServicio: "La unidad ya está fuera de servicio.",
  unidadYaEnServicio: "La unidad ya está en servicio.",
  novedadYaResuelta: "La novedad ya está resuelta.",
  documentoNoVigente: "Solo se puede renovar el documento vigente.",
  emisionPosterior: "La fecha de emisión no puede ser posterior al vencimiento.",
  fechaFutura: "La fecha no puede ser posterior a hoy.",
  advertenciasSinAceptar: "Hay advertencias que tiene que aceptar antes de enviar el parte.",
  tipoDeUnidadInvalido: "Elija el tipo de unidad.",
  combustibleInvalido: "Elija el nivel de combustible.",
  checklistInvalido: "El checklist del parte no es válido.",
  otraNovedadInvalida: "La otra novedad no es válida.",
  parteOtraUnidad: "No se puede cambiar la unidad de un parte.",
  noPudoGuardarElParte: "No se pudo guardar el parte. Sus datos siguen en este equipo; intente de nuevo.",
} as const;

/** `ZK 214 BD` con su número interno: `Int. 07`. */
export function textoInterno(interno: number): string {
  return `Int. ${String(interno).padStart(2, "0")}`;
}

export function errUnidadDeBaja(patente: string, desde: FechaCivil): string {
  return `La unidad ${patente} está dada de baja desde el ${formatearFecha(desde)}.`;
}

export function errPatenteRepetida(patente: string, interno: number): string {
  return `Ya existe una unidad con la patente ${patente} (${textoInterno(interno)}).`;
}

export function errInternoRepetido(interno: number, patente: string): string {
  return `Ya existe una unidad con el número interno ${interno} (${patente}).`;
}

export function errAnioFueraDeRango(minimo: number, maximo: number): string {
  return `El año tiene que estar entre ${minimo} y ${maximo}.`;
}

export function errRenovacionNoPosterior(vigenteVence: FechaCivil): string {
  return `La renovación tiene que vencer después del ${formatearFecha(vigenteVence)}.`;
}

export function errVenceAntesQueSuRenovacion(venceRenovacion: FechaCivil): string {
  return `El vencimiento tiene que ser anterior al de su renovación (${formatearFecha(venceRenovacion)}).`;
}

export function errDocumentoExistente(nombre: string): string {
  return `Ya hay un documento de ${nombre} cargado. Use «Renovar».`;
}

export function errTipoDeDocumentoNoCorresponde(nombre: string, titular: "unidad" | "conductor"): string {
  return `${nombre} no corresponde a ${titular === "unidad" ? "una unidad" : "un conductor"}.`;
}

export function errNovedadesCriticasAbiertas(lista: readonly string[]): string {
  return `Antes de volver a servicio, resuelva: ${lista.join(", ")}.`;
}

export function errParteDuplicado(patente: string, fecha: FechaCivil, estado: "borrador" | "enviado"): string {
  const final = estado === "borrador" ? "Ábralo para continuar." : "Ábralo para verlo.";
  return `Ya hay un parte de ${patente} para el ${formatearFecha(fecha)} (${estado}). ${final}`;
}

export function errUnidadFueraDeServicio(desde: FechaCivil, motivo: string): string {
  return `La unidad está fuera de servicio desde el ${formatearFecha(desde)} (${motivo}). Pida al encargado que la vuelva a servicio.`;
}

// ---------------------------------------------------------------------------------------------
// Resúmenes de los eventos del historial.
// ---------------------------------------------------------------------------------------------

export const RESUMEN_EVENTO = {
  unidadAlta: (patente: string, interno: number) => `Alta de la unidad ${patente} (${textoInterno(interno)})`,
  cambioDeProyecto: (patente: string, de: string, a: string) => `Cambio de proyecto de ${patente}: de ${de} a ${a}`,
  cambioDeConductor: (patente: string, de: string, a: string) => `Cambio de conductor de ${patente}: de ${de} a ${a}`,
  cambioDeProyectoYConductor: (patente: string, proyecto: string, conductor: string) =>
    `Cambio de proyecto y de conductor de ${patente}: proyecto ${proyecto}; conductor ${conductor}`,
  documentoCargado: (titular: string, nombre: string, vence: FechaCivil) =>
    `Documento cargado (${titular}): ${nombre}, vence el ${formatearFecha(vence)}`,
  documentoRenovado: (nombre: string, titular: string, anterior: FechaCivil, nuevo: FechaCivil) =>
    `Renovación de ${nombre} (${titular}): vencía el ${formatearFecha(anterior)}, ahora vence el ${formatearFecha(nuevo)}`,
  documentoCorregido: (nombre: string, titular: string, campos: readonly string[]) =>
    `Corrección de ${nombre} (${titular}): ${campos.join(", ")}`,
  parteEnviado: (patente: string, fecha: FechaCivil, fueraDeTermino: boolean, kmInicio: number, kmFin: number) => {
    const recorrido = kmFin - kmInicio;
    const texto = recorrido === 0 ? "sin uso" : `${formatearKm(recorrido)} km`;
    return `Parte del ${formatearFecha(fecha)} de ${patente} enviado${fueraDeTermino ? " fuera de término" : ""}: ${formatearKm(kmInicio)} a ${formatearKm(kmFin)} km (${texto})`;
  },
  novedadAbierta: (patente: string, critica: boolean, detalle: string) =>
    `Novedad ${critica ? "crítica " : ""}abierta (${patente}): ${detalle}`,
  novedadResuelta: (patente: string, rotulo: string, texto: string) => `Novedad resuelta (${patente}): ${rotulo}. ${texto}`,
  fueraDeServicio: (patente: string, motivo: string) => `${patente} fuera de servicio: ${motivo}`,
  vueltaAServicio: (patente: string) => `${patente} vuelve a servicio`,
  kmCorregido: (patente: string, anterior: number | null, base: number, desde: FechaCivil) =>
    anterior === null
      ? `Kilometraje de ${patente} fijado en ${formatearKm(base)} km desde el ${formatearFecha(desde)}`
      : `Kilometraje de ${patente} corregido: de ${formatearKm(anterior)} a ${formatearKm(base)} km desde el ${formatearFecha(desde)}`,
  unidadBaja: (patente: string, motivo: string) => `${patente} dada de baja: ${motivo}`,
} as const;
