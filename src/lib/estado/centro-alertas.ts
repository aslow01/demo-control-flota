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
import {
  NOMBRES_DOCUMENTO,
  TEXTO_CENTRO,
  TEXTO_ESTADO_OPERACION,
  TEXTO_FALTA_CARGAR,
  TEXTO_CONDUCTORES_SIN_LICENCIA as TCL,
  TEXTO_GRUPO_OPERACION,
  TEXTO_ESTADO_PARTE_INCOMPLETO,
  TEXTO_GRUPO_VENCIMIENTOS,
  palabraUnidades,
  pluralizar,
  textoAccionDocumento,
  textoDesgloseNoDisponibles,
  textoDisponibles,
  textoFilaOperacion,
  textoFilaPartesIncompletos,
  textoMotivoSinLicencia,
  tituloGrupoPartesIncompletos,
  textoGrupoConCantidad,
  textoHoy,
  textoInterno,
  textoMostrando,
  textoPendientes,
  textoProtagonista,
  textoProtagonistaLector,
  textoRotuloVencimientos,
  textoVencimiento,
  textoVerTodasEnLaFlota,
} from "../dominio/textos.ts";
import type { Conductor, Estado, FechaCivil, Novedad, Parte, TipoDocumento, Titular, Unidad } from "../dominio/tipos.ts";
import { documentoVigente, type Grupo } from "../dominio/vencimientos.ts";
import { horizonteCompleto, type Horizonte } from "../dominio/horizonte.ts";
import { aHash } from "./enrutador.ts";

/** Unidades que lista el protagonista; las demás quedan detrás de «Ver las N en la flota» (6.1). */
export const MAX_PROTAGONISTA = 6;

const GRUPOS: readonly Grupo[] = ["vencidos", "7", "15", "30"];
const TIPOS_OPERACION: readonly TipoAlertaOperacion[] = [
  "novedad-critica",
  "parte-sin-enviar",
  "sin-parte",
  "novedad-abierta",
];
const TONO_GRUPO: Record<Grupo, "critico" | "semana" | "quincena" | "mes"> = { vencidos: "critico", "7": "semana", "15": "quincena", "30": "mes" };

// --- Tipos ---------------------------------------------------------------------------------------

export type IdFiltro = "todos" | Grupo;

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
  /** Id del grupo del detalle (`h3`) al que lleva «Ver». */
  idGrupo: string;
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

export interface FiltroVencimientos {
  id: IdFiltro;
  /** «Todos», «Vencidos y faltantes», «7 días o menos», «8 a 15 días», «16 a 30 días». */
  etiqueta: string;
  cantidad: number;
}

export interface PanelVencimientos {
  titulo: string;
  /** Vencidos, faltantes y los de los próximos 30 días: el número de «Todos». El rótulo «próximos 30 días · 9» no cuenta los vencidos. */
  total: number;
  rotuloCantidad: string;
  horizonte: Horizonte;
  filtros: FiltroVencimientos[];
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

export interface CentroDeAlertas {
  titulo: string;
  encabezado: Encabezado;
  protagonista: Protagonista;
  operacion: PanelOperacion;
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
  return {
    titulo: TEXTO_CENTRO.vencimientos,
    total,
    // «próximos 30 días» no cuenta lo ya vencido o faltante (tiene su propio grupo y filtro); «Todos» sí.
    rotuloCantidad: textoRotuloVencimientos(total - r.resumen.porGrupo.vencidos),
    horizonte: horizonteCompleto(r),
    filtros: [
      { id: "todos", etiqueta: "Todos", cantidad: total },
      ...grupos.map((g): FiltroVencimientos => ({ id: g.id, etiqueta: TEXTO_GRUPO_VENCIMIENTOS[g.id].filtro, cantidad: g.cantidad })),
    ],
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

export function vencimientosVisibles(v: PanelVencimientos, filtro: IdFiltro): VencimientosVisibles {
  if (filtro === "todos") {
    const conFilas = v.grupos.filter((g) => g.cantidad > 0);
    return { grupos: conFilas, textoVacio: conFilas.length === 0 ? v.textoVacio : null, anuncio: textoMostrando(v.total, v.total) };
  }
  const grupo = v.grupos.find((g) => g.id === filtro);
  const elegidos = grupo === undefined ? [] : [grupo];
  const cantidad = grupo?.cantidad ?? 0;
  return {
    grupos: elegidos,
    textoVacio: cantidad === 0 ? TEXTO_CENTRO.grupoVacio : null,
    anuncio: textoMostrando(cantidad, v.total),
  };
}

function armarDetalle(estado: Estado, r: ResultadoAlertas): PanelDetalle {
  const unidades = new Map(estado.unidades.map((u) => [u.id, u]));
  const novedades = new Map<string, Novedad>(estado.novedades.map((n) => [`novedad:${n.id}`, n]));
  const partes = new Map<string, Parte>();
  for (const p of estado.partes) {
    partes.set(`parte-sin-enviar:${p.id}`, p);
    partes.set(`uso-doc:${p.id}`, p);
  }

  const fila = (a: Alerta, tipo: TipoAlertaOperacion): FilaOperacion | null => {
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

/**
 * Arma el centro de alertas. `r` es `calcularAlertas(estado, hoy)` (en un componente, `app.alertas`); `empresa` es el nombre
 * de la empresa ficticia (`EMPRESA.nombre`).
 */
export function centroDeAlertas(estado: Estado, r: ResultadoAlertas, hoy: FechaCivil, empresa: string): CentroDeAlertas {
  return {
    titulo: TEXTO_CENTRO.titulo,
    encabezado: {
      linea: `${textoHoy(hoy)} · ${empresa} · ${pluralizar(r.resumen.activas, "unidad", "unidades")}`,
      bajada: TEXTO_CENTRO.bajada,
    },
    protagonista: armarProtagonista(estado, r, hoy),
    operacion: armarOperacion(r, hoy),
    vencimientos: armarVencimientos(estado, r),
    detalle: armarDetalle(estado, r),
  };
}
