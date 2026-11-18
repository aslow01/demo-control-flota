// Clasificación de vencimientos (V1 a V8) y, más abajo, documento vigente y requisitos (V9 a V17).

import { diasEntre } from "./fechas.ts";
import { textoVencimiento } from "./textos.ts";
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
export function clasificar(vence: FechaCivil, hoy: FechaCivil): Clasificacion {
  const d = diasEntre(hoy, vence);
  const texto = textoVencimiento(d, vence);
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
  { titular: "unidad", tipo: "seguro", nombre: "Seguro", obligatorio: "siempre" },
  { titular: "unidad", tipo: "revision-tecnica", nombre: "Revisión técnica", obligatorio: "siempre" },
  { titular: "unidad", tipo: "matafuego", nombre: "Carga del matafuego", obligatorio: "siempre" },
  {
    titular: "unidad",
    tipo: "habilitacion-proyecto",
    nombre: "Habilitación de ingreso al proyecto",
    obligatorio: "si-proyecto-requiere",
  },
  { titular: "conductor", tipo: "licencia", nombre: "Licencia de conducir", obligatorio: "siempre" },
  { titular: "conductor", tipo: "habilitacion-manejo", nombre: "Habilitación de manejo en el proyecto", obligatorio: "no" },
];

export const NOMBRES_DOCUMENTO: Record<TipoDocumento, string> = Object.fromEntries(
  REQUISITOS.map((r) => [r.tipo, r.nombre]),
) as Record<TipoDocumento, string>;

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
  if (vigente === undefined) return { estado: "faltante", grupo: "vencidos", texto: "Falta cargar" };
  return clasificar(vigente.vence, hoy);
}

/** V16: los faltantes primero; después, el que vence antes (el más vencido, primero). */
export function compararUrgencia(a: Evaluacion, b: Evaluacion): number {
  if (a.estado === "faltante" && b.estado === "faltante") return 0;
  if (a.estado === "faltante") return -1;
  if (b.estado === "faltante") return 1;
  return a.d - b.d;
}
