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
