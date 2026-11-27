// Kilometraje (K1 a K10). Funciones puras: reciben los partes y correcciones y devuelven resultados.

import { formatearFecha, parsearInstante } from "./fechas.ts";
import { formatearPatente } from "./patente.ts";
import { ERRORES, errKmExcedido, errKmFinMenor, errKmRetrocede, errKmSuperaSiguiente, formatearKm } from "./textos-base.ts";
import {
  fallo,
  ok,
  type Advertencia,
  type CorreccionKm,
  type FechaCivil,
  type Instante,
  type Parte,
  type Resultado,
  type Unidad,
} from "./tipos.ts";

export const KM_MAXIMO = 2_000_000;
export const SALTO_MAXIMO_KM = 1000;
export const RECORRIDO_MAXIMO_KM = 1200;

const LARGO_MAXIMO_ENTRADA = 20;

/** K1: entero de 0 a 2.000.000. Acepta `84320`, `84.320` y `84 320`. */
export function parsearKm(texto: string): Resultado<number> {
  const t = texto.replace(/[  ]/g, " ").trim();
  if (t === "") return fallo("km-vacio", ERRORES.kmVacio, { campo: "km" });
  if (/^-\s*\d/.test(t)) return fallo("km-negativo", ERRORES.kmNegativo, { campo: "km" });
  if (t.length > LARGO_MAXIMO_ENTRADA) {
    // Solo dígitos y muy largo: es un número, y supera el máximo; con otra cosa mezclada, no es un número.
    return /^\d+$/.test(t) ? fallo("km-excedido", errKmExcedido(KM_MAXIMO), { campo: "km" }) : fallo("km-no-numerico", ERRORES.kmNoNumerico, { campo: "km" });
  }

  let digitos: string | null = null;
  if (/^\d+$/.test(t)) digitos = t;
  else if (/^\d{1,3}(?:[. ]\d{3})+$/.test(t)) digitos = t.replace(/[. ]/g, "");
  else if (/^\d+(?:[.,]\d+)$/.test(t) || /^\d{1,3}(?:[. ]\d{3})+,\d+$/.test(t)) {
    return fallo("km-decimales", ERRORES.kmDecimales, { campo: "km" });
  }
  if (digitos === null) return fallo("km-no-numerico", ERRORES.kmNoNumerico, { campo: "km" });

  const valor = Number(digitos);
  if (valor > KM_MAXIMO) {
    return fallo("km-excedido", errKmExcedido(KM_MAXIMO), { campo: "km" });
  }
  return ok(valor);
}

/**
 * Lo que queda escrito en el campo de kilómetros al salir de él (5.11): un entero bien escrito (`84320`, `84 320`) pasa a `84.320`.
 * Todo lo demás (`84.5`, `1.2.3`, `12 3`) queda tal cual, para que `parsearKm` lo rechace y la persona lo corrija: reformatear un
 * decimal o un tipeo roto lo convertiría en otro kilometraje sin avisar (QA M2, etapa 4).
 */
export function reformatearKm(texto: string): string {
  const r = parsearKm(texto);
  return r.ok ? formatearKm(r.valor) : texto;
}

/** K2: el fin no puede ser menor que el inicio. Devuelve el recorrido. */
export function validarRecorrido(kmInicio: number, kmFin: number): Resultado<number> {
  if (kmFin < kmInicio) {
    return fallo("km-fin-menor", errKmFinMenor(kmFin, kmInicio), { campo: "kmFin" });
  }
  return ok(kmFin - kmInicio);
}

export function textoRecorrido(recorrido: number): string {
  return recorrido === 0 ? "Sin uso" : `${formatearKm(recorrido)} km`;
}

/**
 * Un dato del historial de kilometraje de una unidad (K10): un parte cerrado (inicio y fin; uno sin salida tiene recorrido 0), la salida de un parte en uso
 * (solo se sabe el inicio, desde que se envió la revisión) o una corrección (K5).
 */
export type RegistroKm =
  | { tipo: "parte"; fecha: FechaCivil; instante: Instante; parteId: string; kmInicio: number; kmFin: number }
  | { tipo: "salida"; fecha: FechaCivil; instante: Instante; parteId: string; kmInicio: number }
  | { tipo: "correccion"; fecha: FechaCivil; instante: Instante; kmBase: number };

/** Kilometraje con el que termina un registro (K8): el fin de un parte cerrado, el inicio de una salida o la base de una corrección. */
export function kmDeRegistro(r: RegistroKm): number {
  return r.tipo === "parte" ? r.kmFin : r.tipo === "salida" ? r.kmInicio : r.kmBase;
}

export function describirRegistro(r: RegistroKm): string {
  if (r.tipo === "parte") return `parte del ${formatearFecha(r.fecha)}`;
  if (r.tipo === "salida") return `revisión del ${formatearFecha(r.fecha)}`;
  return `corrección de kilometraje del ${formatearFecha(r.fecha)}`;
}

function compararRegistros(a: RegistroKm, b: RegistroKm): number {
  if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
  if (a.instante !== b.instante) return a.instante < b.instante ? -1 : 1;
  const rango = (r: RegistroKm): number => (r.tipo === "correccion" ? 1 : 0);
  return rango(a) - rango(b);
}

/**
 * Registros de la unidad en orden cronológico: por fecha, después por instante, después partes y salidas antes que correcciones (K8, K10). Cuentan los partes
 * cerrados y los **en uso con `kmInicio` y `revisado` legibles** (el instante de la salida es la revisión); los borradores no (K9), ni los datos de cierre de
 * un parte en uso sin cerrar.
 */
export function registrosDeKm(
  unidadId: string,
  partes: readonly Parte[],
  correcciones: readonly CorreccionKm[],
): RegistroKm[] {
  const registros: RegistroKm[] = [];
  for (const p of partes) {
    if (p.unidadId !== unidadId || p.kmInicio === null) continue;
    if (p.estado === "enviado") {
      if (p.kmFin === null || p.enviado === null) continue;
      registros.push({ tipo: "parte", fecha: p.fecha, instante: p.enviado, parteId: p.id, kmInicio: p.kmInicio, kmFin: p.kmFin });
    } else if (p.estado === "en-uso") {
      if (p.revisado === null || parsearInstante(p.revisado) === null) continue;
      registros.push({ tipo: "salida", fecha: p.fecha, instante: p.revisado, parteId: p.id, kmInicio: p.kmInicio });
    }
  }
  for (const c of correcciones) {
    if (c.unidadId !== unidadId) continue;
    registros.push({ tipo: "correccion", fecha: c.desde, instante: c.instante, kmBase: c.kmBase });
  }
  return registros.sort(compararRegistros);
}

/** K8: kilometraje actual de la unidad, o `null` si no tiene registros. */
export function kmActual(
  unidadId: string,
  partes: readonly Parte[],
  correcciones: readonly CorreccionKm[],
): number | null {
  const registros = registrosDeKm(unidadId, partes, correcciones);
  const ultimo = registros[registros.length - 1];
  return ultimo === undefined ? null : kmDeRegistro(ultimo);
}

/** Último registro que vale para un parte de `fecha`: partes y salidas de fecha anterior y correcciones desde esa fecha o antes (K3, K5). */
export function registroAnterior(
  unidadId: string,
  fecha: FechaCivil,
  partes: readonly Parte[],
  correcciones: readonly CorreccionKm[],
): RegistroKm | null {
  const previos = registrosDeKm(unidadId, partes, correcciones).filter((r) =>
    r.tipo === "correccion" ? r.fecha <= fecha : r.fecha < fecha,
  );
  return previos[previos.length - 1] ?? null;
}

/** Primer registro posterior a un parte de `fecha` (K4): partes, salidas y correcciones de fecha posterior. */
export function registroSiguiente(
  unidadId: string,
  fecha: FechaCivil,
  partes: readonly Parte[],
  correcciones: readonly CorreccionKm[],
): RegistroKm | null {
  return registrosDeKm(unidadId, partes, correcciones).find((r) => r.fecha > fecha) ?? null;
}

/** K6: salto de más de 1.000 km entre el último registro y el inicio de la jornada. */
export function advertenciasDeSalida({ kmAnterior, kmInicio }: { kmAnterior: number | null; kmInicio: number }): Advertencia[] {
  return kmAnterior !== null && kmInicio - kmAnterior > SALTO_MAXIMO_KM ? [{ tipo: "salto-km", km: kmInicio - kmAnterior }] : [];
}

/** K7: recorrido del día de más de 1.200 km. */
export function advertenciasDeRecorrido({ kmInicio, kmFin }: { kmInicio: number; kmFin: number }): Advertencia[] {
  return kmFin - kmInicio > RECORRIDO_MAXIMO_KM ? [{ tipo: "recorrido-largo", km: kmFin - kmInicio }] : [];
}

interface EntradaValidacion {
  unidad: Pick<Unidad, "id" | "patente">;
  fecha: FechaCivil;
  partes: readonly Parte[];
  correcciones: readonly CorreccionKm[];
}

/** K4: si lo que sigue es un parte (cerrado o en uso), `km` no puede superar su kilometraje inicial. Una corrección corta la comparación (K5). */
function errorSiSuperaAlSiguiente(entrada: EntradaValidacion, km: number, campo: "kmInicio" | "kmFin"): Resultado<null> {
  const siguiente = registroSiguiente(entrada.unidad.id, entrada.fecha, entrada.partes, entrada.correcciones);
  if (siguiente !== null && siguiente.tipo !== "correccion" && km > siguiente.kmInicio) {
    return fallo("km-supera-siguiente", errKmSuperaSiguiente(siguiente.fecha, siguiente.kmInicio), { campo });
  }
  return ok(null);
}

export interface EntradaKmDeSalida extends EntradaValidacion {
  kmInicio: number;
}

/**
 * K3 y K4 de la revisión antes de salir (K10): `kmInicio` no retrocede respecto del último registro anterior y no supera el inicio del siguiente parte (en
 * uso o cerrado). Si pasan, el kilometraje anterior y la advertencia K6.
 */
export function validarKmDeSalida(entrada: EntradaKmDeSalida): Resultado<{ advertencias: Advertencia[]; kmAnterior: number | null }> {
  const { unidad, fecha, kmInicio, partes, correcciones } = entrada;
  const anterior = registroAnterior(unidad.id, fecha, partes, correcciones);
  if (anterior !== null && kmInicio < kmDeRegistro(anterior)) {
    return fallo("km-retrocede", errKmRetrocede(formatearPatente(unidad.patente), kmDeRegistro(anterior), describirRegistro(anterior)), {
      campo: "kmInicio",
    });
  }
  const siguiente = errorSiSuperaAlSiguiente(entrada, kmInicio, "kmInicio");
  if (!siguiente.ok) return siguiente;
  const kmAnterior = anterior === null ? null : kmDeRegistro(anterior);
  return ok({ advertencias: advertenciasDeSalida({ kmAnterior, kmInicio }), kmAnterior });
}

export interface EntradaKmDeCierre extends EntradaValidacion {
  kmInicio: number;
  kmFin: number;
}

/** K2 y K4 del cierre (errores que bloquean) y, si pasan, la advertencia K7. No vuelve a mirar K3: la salida ya lo controló. */
export function validarKmDeCierre(entrada: EntradaKmDeCierre): Resultado<{ advertencias: Advertencia[] }> {
  const { kmInicio, kmFin } = entrada;
  const recorrido = validarRecorrido(kmInicio, kmFin);
  if (!recorrido.ok) return recorrido;
  const siguiente = errorSiSuperaAlSiguiente(entrada, kmFin, "kmFin");
  if (!siguiente.ok) return siguiente;
  return ok({ advertencias: advertenciasDeRecorrido({ kmInicio, kmFin }) });
}
