// Aptitud de una unidad para salir hoy (A1, A2, A8). Se calcula, no se guarda.

import { novedadesCriticasAbiertas, rotuloNovedad, textoOrigenNovedad } from "./novedades.ts";
import { unidadSinSalidaHoy } from "./parte.ts";
import { MOTIVO_APTITUD } from "./textos.ts";
import type { Estado, FechaCivil, TipoDocumento, Unidad } from "./tipos.ts";
import { NOMBRES_DOCUMENTO, documentoVigente, evaluarObligatorio, tiposObligatoriosDeUnidad } from "./vencimientos.ts";

export interface Motivo {
  tipo: "baja" | "fuera-de-servicio" | "documento-vencido" | "documento-faltante" | "novedad-critica" | "sin-salida-hoy";
  texto: string;
  /** Solo en los motivos de documento (vencido o faltante): de cuál. */
  documento?: TipoDocumento;
}

export interface Aptitud {
  categoria: "puede-salir" | "no-puede-salir" | "fuera-de-servicio" | "baja";
  puedeSalir: boolean;
  motivos: Motivo[];
}

type DatosDeAptitud = Pick<Estado, "documentos" | "novedades" | "partes" | "proyectos">;

/**
 * A1: puede salir = en servicio, sin obligatorios vencidos o faltantes, sin novedades críticas abiertas y (P19) sin una novedad crítica de hoy (la de un parte cerrado sin salida o una
 * cargada a mano): aunque se resuelva y la unidad vuelva a servicio, ese día no sale.
 */
export function aptitud(unidad: Unidad, estado: DatosDeAptitud, hoy: FechaCivil): Aptitud {
  const e = unidad.estado;
  if (e.tipo === "baja") {
    return {
      categoria: "baja",
      puedeSalir: false,
      motivos: [{ tipo: "baja", texto: MOTIVO_APTITUD.baja(e.desde, e.motivo) }],
    };
  }
  if (e.tipo === "fuera-de-servicio") {
    return {
      categoria: "fuera-de-servicio",
      puedeSalir: false,
      motivos: [{ tipo: "fuera-de-servicio", texto: MOTIVO_APTITUD.fueraDeServicio(e.desde, e.motivo) }],
    };
  }

  const motivos: Motivo[] = [];
  const proyecto = estado.proyectos.find((p) => p.id === unidad.proyectoId);
  if (proyecto !== undefined) {
    for (const tipo of tiposObligatoriosDeUnidad(proyecto)) {
      const vigente = documentoVigente(estado.documentos, { tipo: "unidad", id: unidad.id }, tipo);
      const evaluacion = evaluarObligatorio(vigente, hoy);
      if (evaluacion.estado === "faltante") {
        motivos.push({ tipo: "documento-faltante", texto: MOTIVO_APTITUD.documentoFaltante(NOMBRES_DOCUMENTO[tipo]), documento: tipo });
      } else if (evaluacion.estado === "vencido") {
        // A2: un documento que vence hoy todavía vale, por eso no entra acá.
        motivos.push({ tipo: "documento-vencido", texto: `${NOMBRES_DOCUMENTO[tipo]} ${minusculaInicial(evaluacion.texto)}`, documento: tipo });
      }
    }
  }
  for (const n of novedadesCriticasAbiertas(estado.novedades, unidad.id)) {
    motivos.push({
      tipo: "novedad-critica",
      texto: MOTIVO_APTITUD.novedadCritica(rotuloNovedad(n), textoOrigenNovedad(n)),
    });
  }

  if (unidadSinSalidaHoy(estado, unidad.id, hoy)) motivos.push({ tipo: "sin-salida-hoy", texto: MOTIVO_APTITUD.sinSalidaHoy });

  const puedeSalir = motivos.length === 0;
  return { categoria: puedeSalir ? "puede-salir" : "no-puede-salir", puedeSalir, motivos };
}

function minusculaInicial(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

export interface ResumenAptitud {
  /** Unidades que no están de baja. */
  activas: number;
  /** Activas que pueden salir. */
  disponibles: number;
  /** En servicio pero sin poder salir. */
  noPuedenSalir: Unidad[];
  fueraDeServicio: Unidad[];
  /** A8: unidades que hoy no pueden salir o están fuera de servicio. */
  protagonista: number;
}

/** A8: protagonista del centro de alertas y "Disponibles: P de T". */
export function resumenDeAptitud(estado: Estado, hoy: FechaCivil): ResumenAptitud {
  const noPuedenSalir: Unidad[] = [];
  const fueraDeServicio: Unidad[] = [];
  let activas = 0;
  let disponibles = 0;
  for (const u of estado.unidades) {
    if (u.estado.tipo === "baja") continue;
    activas += 1;
    const a = aptitud(u, estado, hoy);
    if (a.categoria === "puede-salir") disponibles += 1;
    else if (a.categoria === "fuera-de-servicio") fueraDeServicio.push(u);
    else noPuedenSalir.push(u);
  }
  return { activas, disponibles, noPuedenSalir, fueraDeServicio, protagonista: noPuedenSalir.length + fueraDeServicio.length };
}
