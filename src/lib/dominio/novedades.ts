// Rótulos y consultas de novedades (A3, A4, N5).

import { formatearFecha } from "./fechas.ts";
import { ITEMS_CHECKLIST } from "./parte.ts";
import type { Novedad } from "./tipos.ts";

const LARGO_ROTULO = 40;

/** Cómo se nombra una novedad en un renglón: el ítem del checklist, "Otra novedad" o su descripción abreviada. */
export function rotuloNovedad(n: Novedad): string {
  const origen = n.origen;
  if (origen.tipo === "parte") {
    if (origen.item === "otra") return "Otra novedad";
    const item = ITEMS_CHECKLIST.find((i) => i.id === origen.item);
    if (item !== undefined) return item.texto;
  }
  return n.descripcion.length > LARGO_ROTULO ? `${n.descripcion.slice(0, LARGO_ROTULO)}…` : n.descripcion;
}

/** De dónde salió: `parte del 16/11/2026` o `cargada el 16/11/2026`. */
export function textoOrigenNovedad(n: Novedad): string {
  return n.origen.tipo === "parte" ? `parte del ${formatearFecha(n.fecha)}` : `cargada el ${formatearFecha(n.fecha)}`;
}

/** Novedades críticas abiertas de una unidad, de la más antigua a la más nueva. */
export function novedadesCriticasAbiertas(novedades: readonly Novedad[], unidadId: string): Novedad[] {
  return novedades
    .filter((n) => n.unidadId === unidadId && n.estado === "abierta" && n.gravedad === "critica")
    .sort((a, b) => (a.fecha === b.fecha ? (a.id < b.id ? -1 : 1) : a.fecha < b.fecha ? -1 : 1));
}
