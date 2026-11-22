// Clasificación de vencimientos (V1 a V8) y, más abajo, documento vigente y requisitos (V9 a V17).

import { diasEntre, fechaEnArgentina } from "./fechas.ts";
import { NOMBRES_DOCUMENTO, TEXTO_FALTA_CARGAR, textoVencimiento } from "./textos.ts";
import type { Conductor, Documento, FechaCivil, Proyecto, TipoDocumento, Titular, Unidad } from "./tipos.ts";

export type Grupo = "vencidos" | "7" | "15" | "30";

export interface Clasificacion {
  /** Días desde hoy hasta el vencimiento (negativo si ya venció). */
  d: number;
  estado: "vencido" | "vence-hoy" | "por-vencer" | "vigente";
  /** `null` si está vigente (sin alerta). */
  grupo: Grupo | null;
  texto: string;
}

/** V1 a V8: clasifica un vencimiento respecto de hoy (fecha civil de Argentina). */
export function clasificar(vence: FechaCivil, hoy: FechaCivil, tipo?: TipoDocumento): Clasificacion {
  const d = diasEntre(hoy, vence);
  const texto = textoVencimiento(d, vence, tipo);
  if (d < 0) return { d, estado: "vencido", grupo: "vencidos", texto };
  if (d === 0) return { d, estado: "vence-hoy", grupo: "7", texto };
  if (d <= 7) return { d, estado: "por-vencer", grupo: "7", texto };
  if (d <= 15) return { d, estado: "por-vencer", grupo: "15", texto };
  if (d <= 30) return { d, estado: "por-vencer", grupo: "30", texto };
  return { d, estado: "vigente", grupo: null, texto };
}

// ---------------------------------------------------------------------------------------------
// Requisitos, documento vigente y faltantes (V9, V12, V13, V16, V17)
// ---------------------------------------------------------------------------------------------

export interface Requisito {
  titular: "unidad" | "conductor";
  tipo: TipoDocumento;
  /** Nombre en pantalla. */
  nombre: string;
  obligatorio: "siempre" | "si-proyecto-requiere" | "no";
}

/** 5.1: requisitos por titular, en el orden en que se muestran. */
export const REQUISITOS: readonly Requisito[] = [
  { titular: "unidad", tipo: "seguro", nombre: NOMBRES_DOCUMENTO.seguro, obligatorio: "siempre" },
  { titular: "unidad", tipo: "revision-tecnica", nombre: NOMBRES_DOCUMENTO["revision-tecnica"], obligatorio: "siempre" },
  { titular: "unidad", tipo: "matafuego", nombre: NOMBRES_DOCUMENTO.matafuego, obligatorio: "siempre" },
  {
    titular: "unidad",
    tipo: "habilitacion-proyecto",
    nombre: NOMBRES_DOCUMENTO["habilitacion-proyecto"],
    obligatorio: "si-proyecto-requiere",
  },
  { titular: "conductor", tipo: "licencia", nombre: NOMBRES_DOCUMENTO.licencia, obligatorio: "siempre" },
  { titular: "conductor", tipo: "habilitacion-manejo", nombre: NOMBRES_DOCUMENTO["habilitacion-manejo"], obligatorio: "no" },
];

export { NOMBRES_DOCUMENTO };

/** Guarda de tipo: `true` si el texto es uno de los tipos de documento del dominio (`NOMBRES_DOCUMENTO` tiene todos, y solo esos). */
export function esTipoDocumento(valor: string): valor is TipoDocumento {
  return Object.hasOwn(NOMBRES_DOCUMENTO, valor);
}

/** V9: el documento vigente de un titular y un tipo es el de `vence` más tardío (desempata el cargado después, y el id). */
export function documentoVigente(
  documentos: readonly Documento[],
  titular: Titular,
  tipo: TipoDocumento,
): Documento | undefined {
  let mejor: Documento | undefined;
  for (const d of documentos) {
    if (d.tipo !== tipo || d.titular.tipo !== titular.tipo || d.titular.id !== titular.id) continue;
    if (mejor === undefined || gana(d, mejor)) mejor = d;
  }
  return mejor;
}

/**
 * M1 (a confirmar): ¿este documento amparaba la fecha `fecha`? Vence ese día o después y ya existía: su emisión es ese día
 * o antes y, si no se cargó la emisión, se carga ese día (en hora de Argentina) o antes. Así una renovación cargada
 * tarde, sin emisión o con emisión posterior, no borra el hecho de que el parte se hizo con el documento vencido.
 */
export function amparaLaFecha(d: Documento, fecha: FechaCivil): boolean {
  return d.vence >= fecha && inicioDeDocumento(d) <= fecha;
}

/** M1: desde cuándo vale un documento: su emisión o, si no se cargó, el día (en Argentina) en que se cargó. */
export function inicioDeDocumento(d: Documento): FechaCivil {
  return d.emitido ?? fechaEnArgentina(d.cargado);
}

/** L5: cómo está la licencia de un conductor para la fecha de un parte. Con `vigente: false` dice por qué (el texto del bloqueo). */
export type EstadoLicencia =
  | { vigente: true; vence: FechaCivil }
  | { vigente: false; motivo: "faltante" }
  | { vigente: false; motivo: "vencida"; vence: FechaCivil }
  | { vigente: false; motivo: "posterior"; desde: FechaCivil };

/**
 * L1, L2, L5: la licencia del conductor a la fecha `fecha`. Se miran todas sus licencias (no solo la de vencimiento más tardío) con el criterio de
 * `amparaLaFecha`. Vigente si alguna ampara la fecha (`vence` = la más tardía de esas). Si no: sin licencias, `faltante`; alguna que vence en la fecha o
 * después pero empieza a valer más tarde, `posterior` (`desde` = el menor de esos inicios); si no, `vencida` (`vence` = la más tardía de todas).
 * Invariante: `vigente` es lo mismo que `hayDocumentoQueAmpare(documentos, conductor, 'licencia', fecha)`.
 */
export function estadoDeLicencia(documentos: readonly Documento[], conductorId: string, fecha: FechaCivil): EstadoLicencia {
  const licencias = documentos.filter((d) => d.tipo === "licencia" && d.titular.tipo === "conductor" && d.titular.id === conductorId);
  if (licencias.length === 0) return { vigente: false, motivo: "faltante" };
  const masTardia = (lista: readonly Documento[]): FechaCivil => lista.reduce((v, d) => (d.vence > v ? d.vence : v), lista[0]?.vence ?? "");

  const amparan = licencias.filter((d) => amparaLaFecha(d, fecha));
  if (amparan.length > 0) return { vigente: true, vence: masTardia(amparan) };

  const posteriores = licencias.filter((d) => d.vence >= fecha);
  if (posteriores.length > 0) {
    const desde = posteriores.reduce((m, d) => (inicioDeDocumento(d) < m ? inicioDeDocumento(d) : m), inicioDeDocumento(posteriores[0] as Documento));
    return { vigente: false, motivo: "posterior", desde };
  }
  return { vigente: false, motivo: "vencida", vence: masTardia(licencias) };
}

/** M1: hay algún documento del titular y el tipo que ampare la fecha (se miran todos, no solo el vigente de hoy). */
export function hayDocumentoQueAmpare(documentos: readonly Documento[], titular: Titular, tipo: TipoDocumento, fecha: FechaCivil): boolean {
  return documentos.some(
    (d) => d.tipo === tipo && d.titular.tipo === titular.tipo && d.titular.id === titular.id && amparaLaFecha(d, fecha),
  );
}

function gana(a: Documento, b: Documento): boolean {
  if (a.vence !== b.vence) return a.vence > b.vence;
  if (a.cargado !== b.cargado) return a.cargado > b.cargado;
  return a.id > b.id;
}

/** Tipos de documento obligatorios para una unidad de un proyecto (V13: la habilitación solo si el proyecto la pide). */
export function tiposObligatoriosDeUnidad(proyecto: Proyecto): TipoDocumento[] {
  return REQUISITOS.filter(
    (r) =>
      r.titular === "unidad" &&
      (r.obligatorio === "siempre" || (r.obligatorio === "si-proyecto-requiere" && proyecto.requiereHabilitacion)),
  ).map((r) => r.tipo);
}

export function tiposObligatoriosDeConductor(): TipoDocumento[] {
  return REQUISITOS.filter((r) => r.titular === "conductor" && r.obligatorio === "siempre").map((r) => r.tipo);
}

/** V12: tipos obligatorios que la unidad no tiene cargados (en el orden de `REQUISITOS`). */
export function faltantesDeUnidad(unidad: Unidad, proyecto: Proyecto, documentos: readonly Documento[]): TipoDocumento[] {
  return tiposObligatoriosDeUnidad(proyecto).filter(
    (tipo) => documentoVigente(documentos, { tipo: "unidad", id: unidad.id }, tipo) === undefined,
  );
}

/** V12 y V17: solo la licencia es obligatoria para un conductor. */
export function faltantesDeConductor(conductor: Conductor, documentos: readonly Documento[]): TipoDocumento[] {
  return tiposObligatoriosDeConductor().filter(
    (tipo) => documentoVigente(documentos, { tipo: "conductor", id: conductor.id }, tipo) === undefined,
  );
}

export interface Faltante {
  estado: "faltante";
  grupo: "vencidos";
  texto: string;
}

export type Evaluacion = Clasificacion | Faltante;

/** V12: un obligatorio sin documento se trata como vencido ("Falta cargar"); si hay documento, V1 a V6. */
export function evaluarObligatorio(vigente: Documento | undefined, hoy: FechaCivil): Evaluacion {
  if (vigente === undefined) return { estado: "faltante", grupo: "vencidos", texto: TEXTO_FALTA_CARGAR };
  return clasificar(vigente.vence, hoy, vigente.tipo);
}

/** V16: los faltantes primero; después, el que vence antes (el más vencido, primero). */
export function compararUrgencia(a: Evaluacion, b: Evaluacion): number {
  if (a.estado === "faltante" && b.estado === "faltante") return 0;
  if (a.estado === "faltante") return -1;
  if (b.estado === "faltante") return 1;
  return a.d - b.d;
}
