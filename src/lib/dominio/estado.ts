// Estado en memoria y cambios (docs/diseno.md, secciones 8 y 10). Funciones puras: nada se modifica en el lugar.

import type { CorreccionKm, Documento, Estado, Evento, Meta, Novedad, Parte, Unidad } from "./tipos.ts";

/**
 * Lo que un comando le pide al repositorio que escriba, junto con sus eventos, en una sola transacción (P12).
 * Las listas son altas o reemplazos por `id`; `partesBorrados` son ids de borradores descartados.
 */
export interface Cambios {
  unidades: Unidad[];
  documentos: Documento[];
  partes: Parte[];
  novedades: Novedad[];
  correccionesKm: CorreccionKm[];
  partesBorrados: string[];
  /** Si no es `null`, reemplaza el registro `meta`. */
  meta: Meta | null;
}

export function sinCambios(): Cambios {
  return { unidades: [], documentos: [], partes: [], novedades: [], correccionesKm: [], partesBorrados: [], meta: null };
}

function reemplazarOAgregar<T extends { id: string }>(lista: readonly T[], nuevos: readonly T[]): T[] {
  if (nuevos.length === 0) return [...lista];
  const porId = new Map(nuevos.map((n) => [n.id, n]));
  const resultado = lista.map((x) => porId.get(x.id) ?? x);
  const existentes = new Set(lista.map((x) => x.id));
  for (const n of nuevos) if (!existentes.has(n.id)) resultado.push(n);
  return resultado;
}

/** Estado nuevo con los cambios y los eventos aplicados (los eventos van al final: solo se agregan, H2). */
export function aplicarCambios(estado: Estado, cambios: Cambios, eventos: readonly Evento[]): Estado {
  const borrados = new Set(cambios.partesBorrados);
  return {
    meta: cambios.meta ?? estado.meta,
    proyectos: estado.proyectos,
    conductores: estado.conductores,
    unidades: reemplazarOAgregar(estado.unidades, cambios.unidades),
    documentos: reemplazarOAgregar(estado.documentos, cambios.documentos),
    partes: reemplazarOAgregar(estado.partes, cambios.partes).filter((p) => !borrados.has(p.id)),
    novedades: reemplazarOAgregar(estado.novedades, cambios.novedades),
    correccionesKm: reemplazarOAgregar(estado.correccionesKm, cambios.correccionesKm),
    eventos: [...estado.eventos, ...eventos],
  };
}

/** A3: unidades en servicio con una novedad crítica abierta. Tiene que ser siempre una lista vacía. */
export function unidadesEnServicioConNovedadCritica(estado: Estado): Unidad[] {
  const conCritica = new Set(estado.novedades.filter((n) => n.estado === "abierta" && n.gravedad === "critica").map((n) => n.unidadId));
  return estado.unidades.filter((u) => u.estado.tipo === "en-servicio" && conCritica.has(u.id));
}
