// Historial (H3, H4): los eventos solo se agregan; acá se ordenan y se filtran para mostrarlos.

import type { Estado, Evento } from "./tipos.ts";

/** H3: instante descendente; a igual instante, la secuencia mayor primero. No modifica la lista recibida. */
export function ordenarHistorial(eventos: readonly Evento[]): Evento[] {
  return [...eventos].sort((a, b) => {
    if (a.instante !== b.instante) return a.instante < b.instante ? 1 : -1;
    return b.secuencia - a.secuencia;
  });
}

/** H4: el historial de una unidad (también si está de baja), del más nuevo al más viejo. */
export function historialDeUnidad(estado: Estado, unidadId: string): Evento[] {
  return ordenarHistorial(estado.eventos.filter((e) => e.unidadId === unidadId));
}
