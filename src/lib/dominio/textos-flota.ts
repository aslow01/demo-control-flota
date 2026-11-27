// Textos de Movilidades (antes «Flota»; docs/diseno-ui.md, 5.10 y 6.2) y del diálogo «Agregar unidad» (5.17). `redactor-ux` los revisa.

import { pluralizar, textoDesgloseNoDisponibles } from "./textos-base.ts";
import { textoLeFaltan } from "./textos-inicio.ts";

/**
 * Línea bajo el título: «23 unidades activas · 19 disponibles · 4 no disponibles hoy (2 bloqueadas por documentos · 2 fuera de servicio) · 1 de baja».
 * `noPueden` son las bloqueadas por documentos (el nombre del campo es de la lógica y no cambia en esta etapa).
 */
export function textoResumenFlota(r: { activas: number; pueden: number; noPueden: number; fuera: number; baja: number }): string {
  const noDisponibles = r.noPueden + r.fuera;
  return [
    pluralizar(r.activas, "unidad activa", "unidades activas"),
    `${r.pueden} ${r.pueden === 1 ? "disponible" : "disponibles"}`,
    `${noDisponibles} ${noDisponibles === 1 ? "no disponible" : "no disponibles"} hoy (${textoDesgloseNoDisponibles(r.noPueden, r.fuera)})`,
    `${r.baja} de baja`,
  ].join(" · ");
}

/** Segunda línea del estado: «y 1 motivo más», «y 2 motivos más». */
export function textoMotivosMas(n: number): string {
  return `y ${pluralizar(n, "motivo", "motivos")} más`;
}

/** Nombre accesible del enlace de la patente: «Ficha de ZK 214 BD». */
export function textoFichaDe(patente: string): string {
  return `Ficha de ${patente}`;
}

/** «Revisión técnica · en 6 días»: la parte de plazo (hoy, mañana, en N días). */
export function textoPlazoCorto(d: number): string {
  if (d === 0) return "hoy";
  if (d === 1) return "mañana";
  return `en ${d} días`;
}

/** Columna «Novedades»: la cifra de abiertas y, si hay críticas, cuántas («1 (crítica)», «3 (2 críticas)»). */
export function textoNovedadesDeUnidad(abiertas: number, criticas: number): string {
  if (criticas === 0) return String(abiertas);
  if (abiertas === 1) return "1 (crítica)";
  return `${abiertas} (${criticas} ${criticas === 1 ? "crítica" : "críticas"})`;
}

/** Barra de estado de la flota: «Mostrando 23 de 23 unidades.» */
export function textoMostrandoUnidades(mostradas: number, total: number): string {
  return `Mostrando ${mostradas} de ${pluralizar(total, "unidad", "unidades")}.`;
}

/** Vacío por filtro: «Ninguna unidad coincide con «zz9» en Proyecto Piedra Lunar.» (la búsqueda ya viene acortada). */
export function textoSinCoincidencias(c: { busqueda: string | null; proyecto: string | null; filtro: string | null }): string {
  const con = c.busqueda === null ? "" : ` con «${c.busqueda}»`;
  const en = c.proyecto === null ? "" : ` en ${c.proyecto}`;
  const filtro = c.filtro === null ? "" : ` (filtro: ${c.filtro})`;
  return `Ninguna unidad coincide${con}${en}${filtro}.`;
}

/** Mensaje al agregar una unidad (se muestra en su ficha): «Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí.» */
export function textoUnidadAgregada(faltantes: number): string {
  if (faltantes === 0) return "Unidad agregada.";
  return `Unidad agregada. ${textoLeFaltan(faltantes)}: ${faltantes === 1 ? "cárguelo" : "cárguelos"} desde aquí.`;
}
