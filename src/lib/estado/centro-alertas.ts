// Centro de alertas (docs/diseno-ui.md, 6.1): todo lo que la pantalla dibuja, listo y en el orden pedido, sin DOM y sin reglas
// nuevas. Parte de `calcularAlertas` y de `aptitud` (las mismas que usa el resto de la aplicación), así el protagonista, el
// horizonte, la lista y el detalle no pueden contradecirse. Solo decide agrupación, orden, cantidades y textos.
//
// Los enlaces vienen como `href` ya armados (`#/unidad/ZK214BD`): por eso vive junto al enrutador y no en `dominio/`.
// Uso: `app.centroDeAlertas` (es `null` hasta que termina el arranque).

import { aptitud } from "../dominio/aptitud.ts";
import type { Alerta, Gravedad, ResultadoAlertas, TipoAlertaOperacion } from "../dominio/alertas.ts";
import { diasEntre, formatearFecha } from "../dominio/fechas.ts";
import { rotuloNovedad } from "../dominio/novedades.ts";
import { formatearPatente } from "../dominio/patente.ts";
import { NOMBRES_DE_PANTALLA, NOMBRES_DOCUMENTO, TEXTO_FALTA_CARGAR, TEXTO_FLOTA, pluralizar, textoDesgloseNoDisponibles, textoInterno, textoVencimiento } from "../dominio/textos-base.ts";
import { TEXTO_CENTRO, TEXTO_ESTADO_OPERACION, TEXTO_CONDUCTORES_SIN_LICENCIA as TCL, TEXTO_GRUPO_OPERACION, TEXTO_ESTADO_PARTE_INCOMPLETO, TEXTO_GRUPO_VENCIMIENTOS, TEXTO_INICIO, TEXTO_LEYENDA_HORIZONTE, TEXTO_VACIO_PANTALLAS, palabraUnidades, textoAccionDocumento, textoContextoOperacion, textoContextoVencimientos, textoLeyendaConCantidad, textoDisponibles, textoFilaOperacion, textoFilaPartesIncompletos, textoMotivoSinLicencia, tituloGrupoPartesIncompletos, textoGrupoConCantidad, textoHoy, textoMostrando, textoPendientes, textoProtagonista, textoProtagonistaLector, textoVerTodasEnLaFlota } from "../dominio/textos-inicio.ts";
import type { Conductor, Estado, FechaCivil, Novedad, Parte, TipoDocumento, Titular, Unidad } from "../dominio/tipos.ts";
import { documentoVigente, type Grupo } from "../dominio/vencimientos.ts";
import {
  MAX_POR_DIA_EN_REGLA,
  formaDeGrupo,
  horizonteCompleto,
  recorridoDeRegla,
  type ElementoDeRegla,
  type FormaDeMarca,
  type TramoHorizonte,
} from "../dominio/horizonte.ts";
import { aHash, type FiltroDeVencimientosEnRuta, type SolapaDeOperacion } from "./enrutador.ts";

/** Unidades que lista el protagonista; las demás quedan detrás de «Ver las N en la flota» (6.1). */
export const MAX_PROTAGONISTA = 6;

const GRUPOS: readonly Grupo[] = ["vencidos", "7", "15", "30"];
const TIPOS_OPERACION: readonly TipoAlertaOperacion[] = [
  "novedad-critica",
  "parte-sin-enviar",
  "sin-parte",
  "novedad-abierta",
];
/** En qué solapa de Operación diaria se ve cada tipo: los partes en Partes y las novedades en Novedades. */
const SOLAPA_DE_TIPO: Record<TipoAlertaOperacion, SolapaDeOperacion> = {
  "novedad-critica": "novedades",
  "novedad-abierta": "novedades",
  "parte-sin-enviar": "partes",
  "sin-parte": "partes",
};
const TONO_GRUPO: Record<Grupo, "critico" | "semana" | "quincena" | "mes"> = { vencidos: "critico", "7": "semana", "15": "quincena", "30": "mes" };

// --- Tipos ---------------------------------------------------------------------------------------

export interface Encabezado {
  /** «Hoy es miércoles 18/11/2026 (hora de Argentina) · Logística Andina Demo S.A. · 23 unidades». */
  linea: string;
  bajada: string;
}

export interface UnidadDelProtagonista {
  unidadId: string;
  /** Normalizada, sin espacios (`ZK214BD`). */
  patente: string;
  patenteTexto: string;
  interno: string;
  categoria: "no-puede-salir" | "fuera-de-servicio";
  /** «Bloqueada» · «Fuera de servicio»: la misma etiqueta que lleva la fila en Movilidades. */
  etiqueta: string;
  /** El primero de `motivos`. */
  motivo: string;
  motivos: string[];
  href: string;
}

export interface Protagonista {
  titulo: string;
  cifra: number;
  /** «unidad» o «unidades» (con 0, «unidades»), en la misma línea base que la cifra. */
  palabra: "unidad" | "unidades";
  /** Franja y cifra en tono crítico si hay alguna; vigente si no. */
  tono: "critico" | "vigente";
  /** Un solo `p` para lectores: «4 unidades no pueden salir hoy: 2 no pueden salir, 2 fuera de servicio.» / «Todas las unidades activas pueden salir hoy.» */
  textoLector: string;
  /** «2 no pueden salir · 2 fuera de servicio»: la cifra desglosada, con las palabras de la flota; `null` si la cifra es 0. */
  desglose: string | null;
  /** Hasta `MAX_PROTAGONISTA`: primero las que no pueden salir y después las fuera de servicio, cada grupo por patente. */
  items: UnidadDelProtagonista[];
  /** Si hay más unidades que las que se listan: «Ver las 9 en la flota». */
  masEnLaFlota: { texto: string; href: string } | null;
  /** Barra de estado: «Disponibles hoy: 19 de 23 unidades activas.» */
  disponibles: string;
  /** L6: conductores activos que hoy no pueden manejar (por nombre); vacía si no hay. No cambia la cifra (A8). */
  conductores: FilaDeConductorSinLicencia[];
  /** Para lectores, después de la cifra: «1 conductor no puede manejar hoy.»; `null` si no hay. */
  textoLectorConductores: string | null;
  /** `h3` «Conductores que no pueden manejar hoy (1)». */
  tituloConductores: string;
}

/**
 * La acción de la fila de un conductor sin licencia (L6, M2, B2): la misma `AccionDeDocumento` de la fila de su licencia en Vencimientos, o «Corregir» (la licencia
 * cargada con una emisión futura, que sigue sin alertar como vencimiento).
 */
export type AccionDeConductorSinLicencia = AccionDeDocumento | (Omit<AccionDeDocumento, "tipo" | "etiqueta"> & { tipo: "corregir"; etiqueta: "Corregir" });

/**
 * Un conductor que no puede manejar hoy (L6). `accion` nunca es `null` (M2): «Renovar» (venció; `documentoId` es la licencia), «Cargar» (falta; `documentoId` es `null`) o
 * «Corregir» (la licencia vale desde una fecha futura: se corrige la emisión; `documentoId` es esa licencia). La trae completa: la vista no la busca en Vencimientos (B2).
 */
export interface FilaDeConductorSinLicencia {
  conductorId: string;
  nombre: string;
  /** «Licencia vencida hace 3 días» · «Falta cargar la licencia» · «Licencia válida desde el 20/11/2026». */
  motivo: string;
  /** Su unidad asignada (no de baja), con el enlace a su ficha. */
  unidad: { patenteTexto: string; href: string } | null;
  accion: AccionDeConductorSinLicencia;
}

export interface FilaOperacionDiaria {
  tipo: TipoAlertaOperacion;
  cifra: number;
  texto: string;
  gravedad: Gravedad;
  /** Id del grupo del detalle (`h3`) al que lleva «Ver» en la pantalla vieja. */
  idGrupo: string;
  /** La solapa de Operación diaria donde está este tipo, y su dirección: adonde lleva la fila en Inicio. */
  solapa: SolapaDeOperacion;
  href: string;
}

export interface PanelOperacion {
  titulo: string;
  total: number;
  /** «6 pendientes». */
  rotuloTotal: string;
  /** Solo los tipos con pendientes, en el orden del detalle. */
  filas: FilaOperacionDiaria[];
  /** «Sin pendientes de operación.» si no hay ninguno. */
  vacio: string | null;
  barraEstado: { intro: string; accion: string; aclaracion: string };
}

export type TitularDeFila =
  | { tipo: "unidad"; patente: string; patenteTexto: string; interno: string; descripcion: string; href: string }
  | {
      tipo: "conductor";
      nombre: string;
      /** «Conductor». */
      detalle: string;
      /** La unidad que tiene asignada, si tiene (enlace a su ficha). */
      unidad: { patenteTexto: string; href: string } | null;
    };

export interface AccionDeDocumento {
  tipo: "renovar" | "cargar";
  etiqueta: "Renovar" | "Cargar";
  /** «Renovar seguro de ZK 214 BD» (texto oculto del botón). */
  nombreAccesible: string;
  /** El documento a renovar; `null` en «Cargar» (el documento no existe). */
  documentoId: string | null;
  titular: Titular;
  tipoDocumento: TipoDocumento;
}

export interface FilaVencimiento {
  /** Estable entre cálculos: sirve de clave del `each`. Cambia cuando se renueva (el documento es otro). */
  alertaId: string;
  tipo: "documento-faltante" | "documento-vencido" | "documento-por-vencer";
  grupo: Grupo;
  gravedad: Gravedad;
  /** «Vencido hace 1 día», «Falta cargar», «Vence en 7 días». */
  estado: string;
  documento: string;
  /** `null` si falta el documento. */
  numero: string | null;
  titular: TitularDeFila;
  /** El de la unidad; el del conductor es el de la unidad que tiene asignada; `null` si no hay. */
  proyecto: string | null;
  /** `dd/mm/aaaa`, o «—» si falta. */
  vence: string;
  /** `true` si falta el documento: la vista agrega «Sin fecha» para lectores sin comparar el texto de `vence`. */
  sinVencimiento: boolean;
  accion: AccionDeDocumento;
}

export interface GrupoVencimientos {
  id: Grupo;
  tono: "critico" | "semana" | "quincena" | "mes";
  titulo: string;
  /** «Vencidos y faltantes (2)». */
  tituloConCantidad: string;
  cantidad: number;
  filas: FilaVencimiento[];
}

/** Los filtros de la pantalla Vencimientos: los mismos de la dirección (`?filtro=`), más «todos», que no viaja. */
export type IdFiltroVencimientos = "todos" | FiltroDeVencimientosEnRuta;

/** Una pastilla de filtro que es un enlace (`aria-current` en la elegida): lleva a la dirección de ese filtro. */
export interface FiltroEnlaceVencimientos {
  id: IdFiltroVencimientos;
  etiqueta: string;
  cantidad: number;
  /** Sin tono ni forma en «Todos» y «Vencen en 30 días», que juntan varios grupos. */
  tono: "critico" | "semana" | "quincena" | "mes" | null;
  forma: FormaDeMarca | null;
  href: string;
}

/** Lo que se elige en la regla: un documento (con todo lo que muestra el detalle) o «y N más» (lleva a la lista del tramo, no abre detalle). */
export type PuntoDeRegla =
  | (Extract<ElementoDeRegla, { tipo: "marca" }> & {
      /** Lo que se escribe junto al punto cuando entra: la patente (`ZK 214 BD`) o el nombre abreviado del conductor (`I. Aguirre`). */
      etiquetaCorta: string;
      /** La fila de la lista de Vencimientos: documento, titular, estado, fecha y acción (`Renovar`). Es la misma que dibuja la lista. */
      vencimiento: FilaVencimiento;
      /** «Ver ficha»: la de la unidad o, en la licencia de un conductor, la de su unidad; `null` si no tiene. */
      fichaHref: string | null;
    })
  | (Extract<ElementoDeRegla, { tipo: "mas" }> & { href: string });

export interface ReglaDeVencimientos {
  /** En el orden de recorrido de las flechas (de hoy hacia adelante); con `fila` ya asignada. */
  elementos: PuntoDeRegla[];
  /** La caja «Vencidos o faltantes»: no entran en la pista. `quienes` son patentes y nombres abreviados, sin repetir. */
  vencidos: { cantidad: number; quienes: string[]; href: string };
  /** Una forma por grupo, con cuántos documentos hay: la leyenda bajo la pista y su texto para lectores. */
  leyenda: { grupo: Grupo; forma: FormaDeMarca; rotulo: string; cantidad: number; textoLector: string }[];
  /** El nombre accesible de la pista (cuenta los de cada tramo, se dibujen o no). */
  etiquetaAria: string | null;
  /** «Nada vence en los próximos 30 días» si no hay ninguna marca. */
  vacio: string | null;
}

export interface PanelVencimientos {
  titulo: string;
  /** Vencidos, faltantes y los de los próximos 30 días: el número de «Todos». El rótulo «próximos 30 días · 9» no cuenta los vencidos. */
  total: number;
  /** «3 vencidos o faltantes · 9 vencen en 30 días». */
  contexto: string;
  /** La regla interactiva de Inicio y Vencimientos (hasta 2 por día, y «y N más»). */
  regla: ReglaDeVencimientos;
  /** Los filtros de la pantalla Vencimientos como enlaces, en este orden: todos, vencidos, próximos (30 días), 7, 15 y 30. */
  filtrosEnlace: FiltroEnlaceVencimientos[];
  /** Los cuatro grupos (también los vacíos); ver `vencimientosVisibles`. */
  grupos: GrupoVencimientos[];
  /** «No hay vencimientos en los próximos 30 días.» */
  textoVacio: string;
}

export type AccionDeOperacion =
  | { tipo: "resolver"; etiqueta: "Resolver"; nombreAccesible: string; novedadId: string }
  | { tipo: "abrir-parte"; etiqueta: "Abrir parte"; nombreAccesible: string; href: string }
  | { tipo: "ver-ficha"; etiqueta: "Ver ficha"; nombreAccesible: string; href: string };

export interface FilaOperacion {
  alertaId: string;
  gravedad: Gravedad;
  /** «Crítica», «Abierta», «Sin enviar», «Sin parte», «Con documentación vencida». */
  estado: string;
  /** El texto de la alerta, tal como lo arma el dominio. */
  texto: string;
  unidad: { unidadId: string; patente: string; patenteTexto: string; interno: string; href: string };
  /** `dd/mm/aaaa` del parte o de la novedad, o «—» si no tiene. */
  fecha: string;
  /** `true` si no tiene fecha (la vista agrega «Sin fecha» para lectores sin comparar el texto de `fecha`). */
  sinFecha: boolean;
  accion: AccionDeOperacion;
}

export interface GrupoOperacion {
  tipo: TipoAlertaOperacion;
  idGrupo: string;
  titulo: string;
  tituloConCantidad: string;
  cantidad: number;
  filas: FilaOperacion[];
}

export interface PanelDetalle {
  titulo: string;
  /** Solo los tipos con pendientes. */
  grupos: GrupoOperacion[];
}

/** Una cifra de Inicio: el número, su rótulo y adónde lleva. `tono` y `forma` solo si hay algo que atender (la forma acompaña al color). */
export interface CifraDeInicio {
  valor: number;
  rotulo: string;
  tono: "critico" | "semana" | "vigente" | "neutro";
  forma: FormaDeMarca | null;
  href: string;
}

export interface CifrasDeInicio {
  /** La principal, la de color: «No disponibles hoy». Es la del protagonista (`protagonista.cifra`), con su bajada y las disponibles. */
  noDisponibles: CifraDeInicio & {
    /** «2 bloqueadas por documentos · 2 fuera de servicio», o «Ninguna unidad bloqueada ni fuera de servicio» si es 0. */
    bajada: string;
    /** «Disponibles hoy: 19 de 23 unidades activas.» */
    disponibles: string;
  };
  vencidos: CifraDeInicio;
  /** Solo los que vencen en 30 días o menos (7, 15 y 30): los vencidos tienen su cifra. */
  proximos: CifraDeInicio;
  /** Partes sin enviar, sin cerrar y unidades sin parte de ayer. */
  partes: CifraDeInicio;
  novedadCritica: CifraDeInicio;
}

/** Un grupo dentro de una solapa de Operación diaria. Los grupos de una solapa están siempre, también sin filas (`sinFilas` dice «Ninguno.»). */
export interface GrupoDeSolapa {
  id: "sin-enviar" | "sin-cerrar" | "sin-parte" | "criticas" | "abiertas";
  titulo: string;
  /** «Partes sin enviar (1)». */
  tituloConCantidad: string;
  cantidad: number;
  filas: FilaOperacion[];
  /** «Ninguno.» si el grupo no tiene filas; `null` si tiene. */
  sinFilas: string | null;
}

export interface PanelSolapaOperacion {
  id: SolapaDeOperacion;
  /** «Partes» · «Novedades». */
  rotulo: string;
  /** Pendientes de la solapa: la cifra de su pestaña. */
  cantidad: number;
  /** Solo Novedades: hay alguna crítica (la cifra de la pestaña va en tono crítico). */
  critica: boolean;
  href: string;
  /** Vacía si la solapa no tiene nada (el estado vacío es `vacio`). */
  grupos: GrupoDeSolapa[];
  /** Título y ayuda del estado vacío; `null` si hay algo. */
  vacio: { titulo: string; ayuda: string } | null;
}

/** Operación diaria de la pantalla nueva: el reparto del detalle en dos solapas (Partes y Novedades). */
export interface OperacionDiaria {
  titulo: string;
  total: number;
  /** «5 pendientes». */
  rotuloTotal: string;
  /** «5 pendientes · al 18/11/2026». */
  contexto: string;
  solapas: [PanelSolapaOperacion, PanelSolapaOperacion];
}

export interface CentroDeAlertas {
  titulo: string;
  encabezado: Encabezado;
  protagonista: Protagonista;
  /** Las cinco cifras de Inicio, cada una con su destino. */
  cifras: CifrasDeInicio;
  /** El panel de operación de las pantallas viejas. */
  operacion: PanelOperacion;
  /** La pantalla Operación diaria: dos solapas con sus grupos y filas. */
  operacionDiaria: OperacionDiaria;
  vencimientos: PanelVencimientos;
  detalle: PanelDetalle;
}

// --- Armado --------------------------------------------------------------------------------------

function href(patente: string): string {
  return aHash({ tipo: "unidad", patente });
}

/** Cantidad de vencimientos (vencidos, faltantes y próximos 30 días): lo que cuenta «Quedan 10 vencimientos». */
export function contarVencimientos(r: ResultadoAlertas): number {
  const g = r.resumen.porGrupo;
  return g.vencidos + g["7"] + g["15"] + g["30"];
}

function menor(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function armarProtagonista(estado: Estado, r: ResultadoAlertas, hoy: FechaCivil): Protagonista {
  const { noPuedenSalir, fueraDeServicio, protagonista: cifra, disponibles, activas } = r.resumen;
  const deCategoria = (unidades: readonly Unidad[], categoria: UnidadDelProtagonista["categoria"]): UnidadDelProtagonista[] =>
    [...unidades]
      .sort((a, b) => menor(a.patente, b.patente))
      .map((u) => {
        const motivos = aptitud(u, estado, hoy).motivos.map((m) => m.texto);
        return {
          unidadId: u.id,
          patente: u.patente,
          patenteTexto: formatearPatente(u.patente),
          interno: textoInterno(u.interno),
          categoria,
          etiqueta: TEXTO_FLOTA.estado[categoria],
          motivo: motivos[0] ?? "",
          motivos,
          href: href(u.patente),
        };
      });
  const desglose = cifra > 0 ? textoDesgloseNoDisponibles(noPuedenSalir.length, fueraDeServicio.length) : null;
  const todas = [...deCategoria(noPuedenSalir, "no-puede-salir"), ...deCategoria(fueraDeServicio, "fuera-de-servicio")];
  return {
    titulo: TEXTO_CENTRO.protagonista,
    cifra,
    palabra: palabraUnidades(cifra),
    tono: cifra > 0 ? "critico" : "vigente",
    // Una sola frase para lectores: la cifra y su desglose (la línea visual del desglose va con `aria-hidden`).
    textoLector: desglose === null ? textoProtagonistaLector(cifra) : `${textoProtagonista(cifra)}: ${desglose.replace(" · ", ", ")}.`,
    desglose,
    items: todas.slice(0, MAX_PROTAGONISTA),
    masEnLaFlota: todas.length > MAX_PROTAGONISTA ? { texto: textoVerTodasEnLaFlota(todas.length), href: aHash({ tipo: "movilidades", filtro: "no-disponibles" }) } : null,
    disponibles: textoDisponibles(disponibles, activas),
    conductores: armarConductoresSinLicencia(estado, r, hoy),
    textoLectorConductores: r.resumen.conductoresSinLicencia.length === 0 ? null : TCL.lector(r.resumen.conductoresSinLicencia.length),
    tituloConductores: TCL.titulo(r.resumen.conductoresSinLicencia.length),
  };
}

/** L6: una fila por conductor activo cuya licencia no ampara hoy. */
function armarConductoresSinLicencia(estado: Estado, r: ResultadoAlertas, hoy: FechaCivil): FilaDeConductorSinLicencia[] {
  return r.resumen.conductoresSinLicencia.map((c) => {
    const unidad = estado.unidades.find((u) => u.conductorId === c.conductorId && u.estado.tipo !== "baja");
    const m = c.motivo;
    const titular: Titular = { tipo: "conductor", id: c.conductorId };
    const vigente = documentoVigente(estado.documentos, titular, "licencia");
    const base = { titular, tipoDocumento: "licencia" as const };
    let accion: AccionDeConductorSinLicencia;
    if (m.motivo === "faltante" || vigente === undefined) {
      accion = { ...base, tipo: "cargar", etiqueta: "Cargar", nombreAccesible: TCL.nombreAccesible("Cargar", c.nombre), documentoId: null };
    } else if (m.motivo === "vencida") {
      accion = { ...base, tipo: "renovar", etiqueta: "Renovar", nombreAccesible: TCL.nombreAccesible("Renovar", c.nombre), documentoId: vigente.id };
    } else {
      accion = { ...base, tipo: "corregir", etiqueta: "Corregir", nombreAccesible: TCL.nombreAccesible("Corregir", c.nombre), documentoId: vigente.id };
    }
    return {
      conductorId: c.conductorId,
      nombre: c.nombre,
      motivo: textoMotivoSinLicencia(m.motivo === "vencida" ? { motivo: "vencida", diasVencida: diasEntre(m.vence, hoy) } : m),
      unidad: unidad === undefined ? null : { patenteTexto: formatearPatente(unidad.patente), href: href(unidad.patente) },
      accion,
    };
  });
}

function idGrupoDeOperacion(tipo: TipoAlertaOperacion): string {
  return `detalle-${tipo}`;
}

function armarOperacion(r: ResultadoAlertas, hoy: FechaCivil): PanelOperacion {
  const filas: FilaOperacionDiaria[] = [];
  for (const tipo of TIPOS_OPERACION) {
    const cifra = r.resumen.operacion[tipo];
    if (cifra === 0) continue;
    const delTipo = r.alertas.filter((a) => a.tipo === tipo);
    // Solo las novedades abiertas dicen su antigüedad: la de la más antigua (las alertas ya vienen de la más antigua a la más nueva).
    const masAntigua = tipo === "novedad-abierta" ? (delTipo[0]?.fecha ?? null) : null;
    // P5: los partes incompletos dicen si son borradores («sin enviar»), partes en uso («sin cerrar») o ambos.
    const texto =
      tipo === "parte-sin-enviar"
        ? textoFilaPartesIncompletos(delTipo.filter((a) => a.etapaParte !== "en-uso").length, delTipo.filter((a) => a.etapaParte === "en-uso").length)
        : textoFilaOperacion(tipo, cifra, masAntigua === null ? null : diasEntre(masAntigua, hoy));
    filas.push({
      tipo,
      cifra,
      texto,
      gravedad: delTipo[0]?.gravedad ?? "media",
      idGrupo: idGrupoDeOperacion(tipo),
      solapa: SOLAPA_DE_TIPO[tipo],
      href: aHash({ tipo: "operacion", solapa: SOLAPA_DE_TIPO[tipo] }),
    });
  }
  const total = r.resumen.totalOperacion;
  return {
    titulo: TEXTO_CENTRO.operacion,
    total,
    rotuloTotal: textoPendientes(total),
    filas,
    vacio: total === 0 ? TEXTO_CENTRO.operacionVacia : null,
    barraEstado: { ...TEXTO_CENTRO.conductor },
  };
}

function titularDeFila(estado: Estado, a: Alerta): TitularDeFila {
  if (a.unidadId !== null) {
    const u = estado.unidades.find((x) => x.id === a.unidadId);
    if (u !== undefined) {
      return {
        tipo: "unidad",
        patente: u.patente,
        patenteTexto: formatearPatente(u.patente),
        interno: textoInterno(u.interno),
        descripcion: `${u.marca} ${u.modelo}`,
        href: href(u.patente),
      };
    }
  }
  const c: Conductor | undefined = estado.conductores.find((x) => x.id === a.conductorId);
  const asignada = c === undefined ? undefined : estado.unidades.find((u) => u.conductorId === c.id && u.estado.tipo !== "baja");
  return {
    tipo: "conductor",
    nombre: c?.nombre ?? "",
    detalle: "Conductor",
    unidad: asignada === undefined ? null : { patenteTexto: formatearPatente(asignada.patente), href: href(asignada.patente) },
  };
}

function proyectoDeFila(estado: Estado, a: Alerta): string | null {
  const unidad =
    a.unidadId !== null
      ? estado.unidades.find((u) => u.id === a.unidadId)
      : estado.unidades.find((u) => u.conductorId === a.conductorId && u.estado.tipo !== "baja");
  return estado.proyectos.find((p) => p.id === unidad?.proyectoId)?.nombre ?? null;
}

function filaDeVencimiento(estado: Estado, a: Alerta): FilaVencimiento | null {
  const tipoDocumento = a.tipoDocumento;
  const grupo = a.grupo;
  if (tipoDocumento === null || grupo === null || (a.tipo !== "documento-faltante" && a.tipo !== "documento-vencido" && a.tipo !== "documento-por-vencer")) {
    return null;
  }
  const titular = titularDeFila(estado, a);
  const etiquetaTitular = titular.tipo === "unidad" ? titular.patenteTexto : titular.nombre;
  const titularDominio: Titular = a.unidadId !== null ? { tipo: "unidad", id: a.unidadId } : { tipo: "conductor", id: a.conductorId ?? "" };
  const documento = estado.documentos.find((d) => d.id === a.documentoId);
  const falta = a.tipo === "documento-faltante" || documento === undefined;
  const accion: "Renovar" | "Cargar" = falta ? "Cargar" : "Renovar";
  return {
    alertaId: a.id,
    tipo: a.tipo,
    grupo,
    gravedad: a.gravedad,
    estado: falta || a.d === null ? TEXTO_FALTA_CARGAR : textoVencimiento(a.d, documento.vence, tipoDocumento),
    documento: NOMBRES_DOCUMENTO[tipoDocumento],
    numero: documento?.numero ?? null,
    titular,
    proyecto: proyectoDeFila(estado, a),
    vence: documento === undefined ? TEXTO_CENTRO.sinFecha : formatearFecha(documento.vence),
    sinVencimiento: documento === undefined,
    accion: {
      tipo: falta ? "cargar" : "renovar",
      etiqueta: accion,
      nombreAccesible: textoAccionDocumento(accion, tipoDocumento, etiquetaTitular),
      documentoId: falta ? null : (documento?.id ?? null),
      titular: titularDominio,
      tipoDocumento,
    },
  };
}

/** `I. Aguirre`: lo que cabe junto al punto de un conductor. Un nombre de una sola palabra queda como está. */
function nombreAbreviado(nombre: string): string {
  const [primero = "", ...resto] = nombre.trim().split(/\s+/);
  return resto.length === 0 ? primero : `${primero.charAt(0)}. ${resto.join(" ")}`;
}

const GRUPO_DE_TRAMO: Record<TramoHorizonte, "7" | "15" | "30"> = { semana: "7", quincena: "15", mes: "30" };

function armarRegla(r: ResultadoAlertas, filas: readonly FilaVencimiento[]): ReglaDeVencimientos {
  const horizonte = horizonteCompleto(r, { maxApiladas: MAX_POR_DIA_EN_REGLA });
  const porAlerta = new Map(filas.map((f) => [f.alertaId, f]));
  const quien = (f: FilaVencimiento): string => (f.titular.tipo === "unidad" ? f.titular.patenteTexto : nombreAbreviado(f.titular.nombre));
  const elementos = recorridoDeRegla(horizonte).flatMap((x): PuntoDeRegla[] => {
    if (x.tipo === "mas") return [{ ...x, href: aHash({ tipo: "vencimientos", filtro: GRUPO_DE_TRAMO[x.tramo] }) }];
    const f = porAlerta.get(x.alertaId);
    if (f === undefined) return [];
    const t = f.titular;
    return [{ ...x, etiquetaCorta: quien(f), vencimiento: f, fichaHref: t.tipo === "unidad" ? t.href : (t.unidad?.href ?? null) }];
  });
  const rotulos: Record<Grupo, string> = { vencidos: TEXTO_LEYENDA_HORIZONTE.vencidos, "7": TEXTO_LEYENDA_HORIZONTE["7"], "15": TEXTO_LEYENDA_HORIZONTE["15"], "30": TEXTO_LEYENDA_HORIZONTE["30"] };
  return {
    elementos,
    vencidos: {
      cantidad: horizonte.vencidos,
      quienes: [...new Set(filas.filter((f) => f.grupo === "vencidos").map(quien))],
      href: aHash({ tipo: "vencimientos", filtro: "vencidos" }),
    },
    leyenda: GRUPOS.map((grupo) => {
      const cantidad = horizonte.porGrupo[grupo];
      return { grupo, forma: formaDeGrupo(grupo), rotulo: rotulos[grupo], cantidad, textoLector: textoLeyendaConCantidad(rotulos[grupo], cantidad) };
    }),
    etiquetaAria: horizonte.etiquetaAria,
    vacio: horizonte.textoVacio,
  };
}

function armarFiltrosEnlace(r: ResultadoAlertas, total: number, proximos: number): FiltroEnlaceVencimientos[] {
  const g = r.resumen.porGrupo;
  const filtro = (id: IdFiltroVencimientos, etiqueta: string, cantidad: number, grupo: Grupo | null): FiltroEnlaceVencimientos => ({
    id,
    etiqueta,
    cantidad,
    tono: grupo === null ? null : TONO_GRUPO[grupo],
    forma: grupo === null ? null : formaDeGrupo(grupo),
    href: aHash(id === "todos" ? { tipo: "vencimientos" } : { tipo: "vencimientos", filtro: id }),
  });
  return [
    filtro("todos", "Todos", total, null),
    filtro("vencidos", TEXTO_GRUPO_VENCIMIENTOS.vencidos.filtro, g.vencidos, "vencidos"),
    filtro("proximos", TEXTO_INICIO.cifraProximos, proximos, null),
    filtro("7", TEXTO_GRUPO_VENCIMIENTOS["7"].filtro, g["7"], "7"),
    filtro("15", TEXTO_GRUPO_VENCIMIENTOS["15"].filtro, g["15"], "15"),
    filtro("30", TEXTO_GRUPO_VENCIMIENTOS["30"].filtro, g["30"], "30"),
  ];
}

function armarVencimientos(estado: Estado, r: ResultadoAlertas): PanelVencimientos {
  const filas = r.alertas.filter((a) => a.categoria === "vencimientos").flatMap((a) => filaDeVencimiento(estado, a) ?? []);
  const grupos: GrupoVencimientos[] = GRUPOS.map((id) => {
    const delGrupo = filas.filter((f) => f.grupo === id);
    return {
      id,
      tono: TONO_GRUPO[id],
      titulo: TEXTO_GRUPO_VENCIMIENTOS[id].titulo,
      tituloConCantidad: textoGrupoConCantidad(TEXTO_GRUPO_VENCIMIENTOS[id].titulo, delGrupo.length),
      cantidad: delGrupo.length,
      filas: delGrupo,
    };
  });
  const total = contarVencimientos(r);
  const proximos = total - r.resumen.porGrupo.vencidos;
  return {
    titulo: TEXTO_CENTRO.vencimientos,
    total,
    // «próximos 30 días» no cuenta lo ya vencido o faltante (tiene su propio grupo y filtro); «Todos» sí.
    contexto: textoContextoVencimientos(r.resumen.porGrupo.vencidos, proximos),
    regla: armarRegla(r, filas),
    filtrosEnlace: armarFiltrosEnlace(r, total, proximos),
    grupos,
    textoVacio: TEXTO_CENTRO.vencimientosVacio,
  };
}

/** Qué se muestra con el filtro elegido (5.8 y 5.9): los grupos, el texto de vacío si corresponde y el anuncio del filtro. */
export interface VencimientosVisibles {
  grupos: GrupoVencimientos[];
  /** «No hay documentos en este grupo.» (grupo elegido vacío) o «No hay vencimientos en los próximos 30 días.» (todos, sin ninguno). */
  textoVacio: string | null;
  /** Para la región `role="status"`: «Mostrando 4 de 11 vencimientos.» */
  anuncio: string;
}

export function vencimientosVisibles(v: PanelVencimientos, filtro: IdFiltroVencimientos): VencimientosVisibles {
  if (filtro === "todos") {
    const conFilas = v.grupos.filter((g) => g.cantidad > 0);
    return { grupos: conFilas, textoVacio: conFilas.length === 0 ? v.textoVacio : null, anuncio: textoMostrando(v.total, v.total) };
  }
  // «proximos» junta los tres grupos de 30 días o menos y deja afuera los vencidos y faltantes.
  const elegidos = filtro === "proximos" ? v.grupos.filter((g) => g.id !== "vencidos" && g.cantidad > 0) : v.grupos.filter((g) => g.id === filtro);
  const cantidad = elegidos.reduce((n, g) => n + g.cantidad, 0);
  return {
    grupos: elegidos,
    textoVacio: cantidad === 0 ? TEXTO_CENTRO.grupoVacio : null,
    anuncio: textoMostrando(cantidad, v.total),
  };
}

/** Arma la fila de una alerta de operación (la misma en el detalle viejo y en las solapas de Operación diaria); `null` si su unidad ya no existe. */
function armadorDeFilasDeOperacion(estado: Estado): (a: Alerta, tipo: TipoAlertaOperacion) => FilaOperacion | null {
  const unidades = new Map(estado.unidades.map((u) => [u.id, u]));
  const novedades = new Map<string, Novedad>(estado.novedades.map((n) => [`novedad:${n.id}`, n]));
  const partes = new Map<string, Parte>();
  for (const p of estado.partes) {
    partes.set(`parte-sin-enviar:${p.id}`, p);
    partes.set(`uso-doc:${p.id}`, p);
  }

  return (a, tipo) => {
    const u = a.unidadId === null ? undefined : unidades.get(a.unidadId);
    if (u === undefined) return null;
    const patenteTexto = formatearPatente(u.patente);
    const unidad = { unidadId: u.id, patente: u.patente, patenteTexto, interno: textoInterno(u.interno), href: href(u.patente) };
    let accion: AccionDeOperacion;
    const novedad = novedades.get(a.id);
    const parte = partes.get(a.id);
    if (novedad !== undefined) {
      accion = { tipo: "resolver", etiqueta: "Resolver", nombreAccesible: `Resolver novedad de ${patenteTexto}: ${rotuloNovedad(novedad)}`, novedadId: novedad.id };
    } else if (tipo === "parte-sin-enviar" && parte !== undefined) {
      accion = {
        tipo: "abrir-parte",
        etiqueta: "Abrir parte",
        nombreAccesible: `Abrir parte del ${formatearFecha(parte.fecha)} de ${patenteTexto}`,
        href: aHash({ tipo: "parte", patente: u.patente, fecha: parte.fecha }),
      };
    } else {
      accion = { tipo: "ver-ficha", etiqueta: "Ver ficha", nombreAccesible: `Ver ficha de ${patenteTexto}`, href: unidad.href };
    }
    return {
      alertaId: a.id,
      gravedad: a.gravedad,
      estado: a.etapaParte === "en-uso" ? TEXTO_ESTADO_PARTE_INCOMPLETO["en-uso"] : TEXTO_ESTADO_OPERACION[tipo],
      texto: a.texto,
      unidad,
      fecha: a.fecha === null ? TEXTO_CENTRO.sinFecha : formatearFecha(a.fecha),
      sinFecha: a.fecha === null,
      accion,
    };
  };
}

function armarDetalle(estado: Estado, r: ResultadoAlertas): PanelDetalle {
  const fila = armadorDeFilasDeOperacion(estado);
  const grupos: GrupoOperacion[] = [];
  for (const tipo of TIPOS_OPERACION) {
    const filas = r.alertas.filter((a) => a.tipo === tipo).flatMap((a) => fila(a, tipo) ?? []);
    if (filas.length === 0) continue;
    const titulo =
      tipo === "parte-sin-enviar"
        ? tituloGrupoPartesIncompletos(
            r.alertas.filter((a) => a.tipo === tipo && a.etapaParte !== "en-uso").length,
            r.alertas.filter((a) => a.tipo === tipo && a.etapaParte === "en-uso").length,
          )
        : TEXTO_GRUPO_OPERACION[tipo];
    grupos.push({
      tipo,
      idGrupo: idGrupoDeOperacion(tipo),
      titulo,
      tituloConCantidad: textoGrupoConCantidad(titulo, filas.length),
      cantidad: filas.length,
      filas,
    });
  }
  return { titulo: TEXTO_CENTRO.detalle, grupos };
}

// --- Cifras de Inicio (3.5) ----------------------------------------------------------------------

/** Una cifra con algo que atender lleva su tono y su forma (rombo crítico, triángulo azufre); en cero, o sin tono (`null`), es neutra. */
function cifra(valor: number, rotulo: string, tonoConValor: "critico" | "semana" | null, href: string): CifraDeInicio {
  return valor > 0 && tonoConValor !== null
    ? { valor, rotulo, tono: tonoConValor, forma: tonoConValor === "critico" ? "rombo" : "triangulo", href }
    : { valor, rotulo, tono: "neutro", forma: null, href };
}

function armarCifras(r: ResultadoAlertas, protagonista: Protagonista): CifrasDeInicio {
  const g = r.resumen.porGrupo;
  const op = r.resumen.operacion;
  return {
    noDisponibles: {
      valor: protagonista.cifra,
      rotulo: protagonista.titulo,
      tono: protagonista.tono,
      forma: null,
      href: aHash({ tipo: "movilidades", filtro: "no-disponibles" }),
      bajada: protagonista.desglose ?? TEXTO_INICIO.sinNoDisponibles,
      disponibles: protagonista.disponibles,
    },
    vencidos: cifra(g.vencidos, TEXTO_INICIO.cifraVencidos, "critico", aHash({ tipo: "vencimientos", filtro: "vencidos" })),
    proximos: cifra(g["7"] + g["15"] + g["30"], TEXTO_INICIO.cifraProximos, "semana", aHash({ tipo: "vencimientos", filtro: "proximos" })),
    partes: cifra(op["parte-sin-enviar"] + op["sin-parte"], TEXTO_INICIO.cifraPartes, null, aHash({ tipo: "operacion", solapa: "partes" })),
    novedadCritica: cifra(op["novedad-critica"], TEXTO_INICIO.cifraNovedadCritica(op["novedad-critica"]), "critico", aHash({ tipo: "operacion", solapa: "novedades" })),
  };
}

// --- Operación diaria en dos solapas (3.6) ----------------------------------------------------------

function grupoDeSolapa(id: GrupoDeSolapa["id"], titulo: string, filas: FilaOperacion[]): GrupoDeSolapa {
  return {
    id,
    titulo,
    tituloConCantidad: textoGrupoConCantidad(titulo, filas.length),
    cantidad: filas.length,
    filas,
    sinFilas: filas.length === 0 ? TEXTO_VACIO_PANTALLAS.grupoSinFilas : null,
  };
}

function armarOperacionDiaria(estado: Estado, r: ResultadoAlertas, hoy: FechaCivil): OperacionDiaria {
  const fila = armadorDeFilasDeOperacion(estado);
  const de = (tipo: TipoAlertaOperacion, etapa?: "en-uso" | "no-en-uso"): FilaOperacion[] =>
    r.alertas
      .filter((a) => a.tipo === tipo && (etapa === undefined || (etapa === "en-uso") === (a.etapaParte === "en-uso")))
      .flatMap((a) => fila(a, tipo) ?? []);
  const sinEnviar = de("parte-sin-enviar", "no-en-uso");
  const sinCerrar = de("parte-sin-enviar", "en-uso");
  const sinParte = de("sin-parte");
  const criticas = de("novedad-critica");
  const abiertas = de("novedad-abierta");
  const total = r.resumen.totalOperacion;
  const solapa = (id: SolapaDeOperacion, cantidad: number, critica: boolean, grupos: GrupoDeSolapa[]): PanelSolapaOperacion => ({
    id,
    rotulo: id === "partes" ? NOMBRES_DE_PANTALLA.operacionPartes : NOMBRES_DE_PANTALLA.operacionNovedades,
    cantidad,
    critica,
    href: aHash({ tipo: "operacion", solapa: id }),
    grupos: cantidad === 0 ? [] : grupos,
    vacio: cantidad === 0 ? TEXTO_VACIO_PANTALLAS[id] : null,
  });
  return {
    titulo: TEXTO_CENTRO.operacion,
    total,
    rotuloTotal: textoPendientes(total),
    contexto: textoContextoOperacion(total, hoy),
    solapas: [
      solapa("partes", r.resumen.operacion["parte-sin-enviar"] + r.resumen.operacion["sin-parte"], false, [
        grupoDeSolapa("sin-enviar", tituloGrupoPartesIncompletos(1, 0), sinEnviar),
        grupoDeSolapa("sin-cerrar", tituloGrupoPartesIncompletos(0, 1), sinCerrar),
        grupoDeSolapa("sin-parte", TEXTO_GRUPO_OPERACION["sin-parte"], sinParte),
      ]),
      solapa("novedades", r.resumen.operacion["novedad-critica"] + r.resumen.operacion["novedad-abierta"], r.resumen.operacion["novedad-critica"] > 0, [
        grupoDeSolapa("criticas", TEXTO_GRUPO_OPERACION["novedad-critica"], criticas),
        grupoDeSolapa("abiertas", TEXTO_GRUPO_OPERACION["novedad-abierta"], abiertas),
      ]),
    ],
  };
}

/**
 * Arma el centro de alertas. `r` es `calcularAlertas(estado, hoy)` (en un componente, `app.alertas`); `empresa` es el nombre
 * de la empresa ficticia (`EMPRESA.nombre`).
 */
export function centroDeAlertas(estado: Estado, r: ResultadoAlertas, hoy: FechaCivil, empresa: string): CentroDeAlertas {
  const protagonista = armarProtagonista(estado, r, hoy);
  return {
    titulo: TEXTO_CENTRO.titulo,
    encabezado: {
      linea: `${textoHoy(hoy)} · ${empresa} · ${pluralizar(r.resumen.activas, "unidad", "unidades")}`,
      bajada: TEXTO_CENTRO.bajada,
    },
    protagonista,
    cifras: armarCifras(r, protagonista),
    operacion: armarOperacion(r, hoy),
    operacionDiaria: armarOperacionDiaria(estado, r, hoy),
    vencimientos: armarVencimientos(estado, r),
    detalle: armarDetalle(estado, r),
  };
}
