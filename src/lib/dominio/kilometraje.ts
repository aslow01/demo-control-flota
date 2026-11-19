// Kilometraje (K1 a K9). Funciones puras: reciben los partes y correcciones y devuelven resultados.

import { formatearFecha } from "./fechas.ts";
import { formatearPatente } from "./patente.ts";
import { ERRORES, errKmExcedido, errKmFinMenor, errKmRetrocede, errKmSuperaSiguiente, formatearKm } from "./textos.ts";
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
    return fallo("km-no-numerico", ERRORES.kmNoNumerico, { campo: "km" });
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

/** Un dato del historial de kilometraje de una unidad: un parte enviado o una corrección (K5). */
export type RegistroKm =
  | { tipo: "parte"; fecha: FechaCivil; instante: Instante; parteId: string; kmInicio: number; kmFin: number }
  | { tipo: "correccion"; fecha: FechaCivil; instante: Instante; kmBase: number };

/** Kilometraje con el que termina un registro. */
export function kmDeRegistro(r: RegistroKm): number {
  return r.tipo === "parte" ? r.kmFin : r.kmBase;
}

export function describirRegistro(r: RegistroKm): string {
  return r.tipo === "parte"
    ? `parte del ${formatearFecha(r.fecha)}`
    : `corrección de kilometraje del ${formatearFecha(r.fecha)}`;
}

function compararRegistros(a: RegistroKm, b: RegistroKm): number {
  if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
  if (a.instante !== b.instante) return a.instante < b.instante ? -1 : 1;
  if (a.tipo !== b.tipo) return a.tipo === "parte" ? -1 : 1;
  return 0;
}

/** Registros de la unidad en orden cronológico: por fecha, después por instante, después partes antes que correcciones. */
export function registrosDeKm(
  unidadId: string,
  partes: readonly Parte[],
  correcciones: readonly CorreccionKm[],
): RegistroKm[] {
  const registros: RegistroKm[] = [];
  for (const p of partes) {
    // K9: los borradores no cuentan.
    if (p.unidadId !== unidadId || p.estado !== "enviado") continue;
    if (p.kmInicio === null || p.kmFin === null || p.enviado === null) continue;
    registros.push({
      tipo: "parte",
      fecha: p.fecha,
      instante: p.enviado,
      parteId: p.id,
      kmInicio: p.kmInicio,
      kmFin: p.kmFin,
    });
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

/** Último registro que vale para un parte de `fecha`: partes de fecha anterior y correcciones desde esa fecha o antes (K3, K5). */
export function registroAnterior(
  unidadId: string,
  fecha: FechaCivil,
  partes: readonly Parte[],
  correcciones: readonly CorreccionKm[],
): RegistroKm | null {
  const previos = registrosDeKm(unidadId, partes, correcciones).filter((r) =>
    r.tipo === "parte" ? r.fecha < fecha : r.fecha <= fecha,
  );
  return previos[previos.length - 1] ?? null;
}

/** Primer registro posterior a un parte de `fecha` (K4): partes y correcciones de fecha posterior. */
export function registroSiguiente(
  unidadId: string,
  fecha: FechaCivil,
  partes: readonly Parte[],
  correcciones: readonly CorreccionKm[],
): RegistroKm | null {
  return registrosDeKm(unidadId, partes, correcciones).find((r) => r.fecha > fecha) ?? null;
}

export interface EntradaKm {
  kmAnterior: number | null;
  kmInicio: number;
  kmFin: number;
}

/** K6 y K7: advertencias que el usuario tiene que aceptar al enviar. */
export function advertenciasDeKm({ kmAnterior, kmInicio, kmFin }: EntradaKm): Advertencia[] {
  const advertencias: Advertencia[] = [];
  if (kmAnterior !== null && kmInicio - kmAnterior > SALTO_MAXIMO_KM) {
    advertencias.push({ tipo: "salto-km", km: kmInicio - kmAnterior });
  }
  if (kmFin - kmInicio > RECORRIDO_MAXIMO_KM) {
    advertencias.push({ tipo: "recorrido-largo", km: kmFin - kmInicio });
  }
  return advertencias;
}

export interface EntradaValidacionKm {
  unidad: Pick<Unidad, "id" | "patente">;
  fecha: FechaCivil;
  kmInicio: number;
  kmFin: number;
  partes: readonly Parte[];
  correcciones: readonly CorreccionKm[];
}

/** K2, K3 y K4 (errores que bloquean el envío) y, si pasan, las advertencias K6 y K7 y el kilometraje anterior. */
export function validarKilometraje(
  entrada: EntradaValidacionKm,
): Resultado<{ advertencias: Advertencia[]; kmAnterior: number | null }> {
  const { unidad, fecha, kmInicio, kmFin, partes, correcciones } = entrada;

  const recorrido = validarRecorrido(kmInicio, kmFin);
  if (!recorrido.ok) return recorrido;

  const anterior = registroAnterior(unidad.id, fecha, partes, correcciones);
  if (anterior !== null && kmInicio < kmDeRegistro(anterior)) {
    return fallo("km-retrocede", errKmRetrocede(formatearPatente(unidad.patente), kmDeRegistro(anterior), describirRegistro(anterior)), {
      campo: "kmInicio",
    });
  }

  const siguiente = registroSiguiente(unidad.id, fecha, partes, correcciones);
  if (siguiente !== null && siguiente.tipo === "parte" && kmFin > siguiente.kmInicio) {
    return fallo("km-supera-siguiente", errKmSuperaSiguiente(siguiente.fecha, siguiente.kmInicio), { campo: "kmFin" });
  }

  const kmAnterior = anterior === null ? null : kmDeRegistro(anterior);
  return ok({ advertencias: advertenciasDeKm({ kmAnterior, kmInicio, kmFin }), kmAnterior });
}
