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

export interface CriticaAbierta {
  novedadId: string;
  /** «Frenos». */
  rotulo: string;
  /** «parte del 16/11/2026». */
  origen: string;
  /** «Frenos (parte del 16/11/2026)»: como se nombra en el error de A4 y en el diálogo de volver a servicio. */
  texto: string;
}

/** A4: las novedades críticas abiertas de la unidad, con el texto con que se nombran. Es lo que dice el error y lo que lista el diálogo. */
export function criticasAbiertasDeUnidad(novedades: readonly Novedad[], unidadId: string): CriticaAbierta[] {
  return novedadesCriticasAbiertas(novedades, unidadId).map((n) => {
    const rotulo = rotuloNovedad(n);
    const origen = textoOrigenNovedad(n);
    return { novedadId: n.id, rotulo, origen, texto: `${rotulo} (${origen})` };
  });
}
