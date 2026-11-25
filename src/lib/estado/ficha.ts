// Ficha de unidad (docs/diseno-ui.md, 5.16 y 6.3): todo lo que la pantalla dibuja, listo, sin DOM y sin reglas nuevas. Parte de
// `calcularAlertas`, `aptitud`, `kmActual` y de los comandos (las mismas piezas que usan el centro de alertas y la flota), así la ficha no
// puede contradecirlas; solo decide qué paneles hay, qué acciones se ofrecen según el estado y el perfil, y cómo se lee el historial.
//
// Los enlaces vienen como `href` ya armados (`#/flota`, `#/parte/ZK214BD/2026-11-18`): por eso vive junto al enrutador y no en `dominio/`.
// Uso: `app.fichaDeUnidad` (se recalcula con cada comando y al cambiar el día; `null` fuera de `#/unidad/…` o antes de terminar el arranque)
// y, para el historial, `vistaDeHistorial(ficha.historial, filtro, limite)` con el filtro y el límite como estado de la vista (`$state`).

import type { ResultadoAlertas } from "../dominio/alertas.ts";
import { aptitud, type Motivo } from "../dominio/aptitud.ts";
import { diaDeLaSemana, fechaEnArgentina, formatearFecha, formatearInstante } from "../dominio/fechas.ts";
import { ofreceVolverAServicio, origenDeNovedad } from "../dominio/formulario-novedad.ts";
import { tiposParaCargar } from "../dominio/formulario-documento.ts";
import { historialDeUnidad } from "../dominio/historial.ts";
import { horizonteDeUnidad, type Horizonte } from "../dominio/horizonte.ts";
import { kmActual, registrosDeKm, textoRecorrido } from "../dominio/kilometraje.ts";
import { rotuloNovedad, criticasAbiertasDeUnidad, type CriticaAbierta } from "../dominio/novedades.ts";
import { ITEMS_CHECKLIST, novedadesDelParte, parteLegible, partePendienteDeCierre, renglonesDeAvisosAceptados } from "../dominio/parte.ts";
import { formatearPatente } from "../dominio/patente.ts";
import {
  NOMBRES_COMBUSTIBLE,
  NOMBRES_DOCUMENTO,
  ROTULO_CAMPO_DOCUMENTO_CORREGIDO,
  TEXTO_FALTA_CARGAR,
  TEXTO_FICHA,
  TEXTO_FLOTA,
  errNovedadesCriticasAbiertas,
  formatearKm,
  textoAccionDocumento,
  textoAdvertencia,
  textoCerrarElParteDel,
  textoAnteriores,
  textoCorreccionKm,
  textoDadaDeBaja,
  textoDescripcionUnidad,
  textoEventos,
  textoInterno,
  textoCierreEnHistorial,
  textoKmConFecha,
  textoKmEnUso,
  textoRevisionEnHistorial,
  textoLineaAptitud,
  textoLitros,
  textoMostrandoEventos,
  textoPuntosEnOrden,
  textoRangoKm,
  textoResumenParteEnviado,
  textoRotuloDocumentos,
  textoRotuloNovedades,
  textoUnidadNoEncontrada,
  textoVerMasEventos,
  textoVencimiento,
} from "../dominio/textos.ts";
import type { Documento, Estado, Evento, FechaCivil, ItemChecklist, Novedad, Parte, Perfil, TipoDocumento, TipoEvento, Unidad } from "../dominio/tipos.ts";
import { REQUISITOS, clasificar, documentoVigente, estadoDeLicencia, tiposObligatoriosDeUnidad, type Grupo } from "../dominio/vencimientos.ts";
import { aHash } from "./enrutador.ts";

// --- Tipos ---------------------------------------------------------------------------------------

export interface Miga {
  texto: string;
  /** `null` en la última (la unidad actual): no es un enlace. */
  href: string | null;
}

export interface FichaNoEncontrada {
  encontrada: false;
  /** El `h1`: «No se encontró la unidad». */
  titulo: string;
  /** «No hay ninguna unidad con la patente ZZ 999 ZZ.» */
  mensaje: string;
  patenteTexto: string;
  enlace: { texto: string; href: string };
}

export type IdAccionDeFicha =
  | "cargar-parte"
  | "poner-fuera-de-servicio"
  | "volver-a-servicio"
  | "corregir-kilometraje"
  | "cambiar-asignacion"
  | "cargar-novedad"
  | "dar-de-baja";

export interface AccionDeFicha {
  id: IdAccionDeFicha;
  etiqueta: string;
  /**
   * Solo el primer botón (`cargar-parte`) es un enlace; las demás abren un diálogo. Su texto y su destino salen del parte (C16, P18, P19): «Cargar parte» (sin parte de hoy o con
   * un borrador), «Cerrar el parte» (el de hoy en uso), «Cerrar el parte del 17/11/2026» (uno anterior en uso: va a ese parte) o «Ver el parte» (el de hoy cerrado, también
   * sin salida aunque la unidad ya esté de vuelta en servicio: hasta mañana).
   */
  href: string | null;
  /** Solo «Volver a servicio» con críticas abiertas (A4): el texto del motivo, para mostrarlo junto al botón. El diálogo lo explica igual. */
  bloqueo: string | null;
}

export interface EstadoOperativoDeFicha {
  tipo: "en-servicio" | "fuera-de-servicio" | "baja";
  /** `dd/mm/aaaa`; `null` si está en servicio. */
  desde: string | null;
  motivo: string | null;
  origen: "manual" | "novedad-critica" | null;
  /** A4: las críticas abiertas que impiden volver a servicio (vacío si no está fuera de servicio). */
  novedadesQueImpiden: CriticaAbierta[];
}

export type TonoDeDocumento = "critico" | "semana" | "quincena" | "mes" | "vigente";

export interface AccionDeDocumentoEnFicha {
  tipo: "renovar" | "corregir" | "cargar";
  etiqueta: "Renovar" | "Corregir" | "Cargar";
  /** «Renovar seguro de ZK 214 BD» (texto oculto del botón). */
  nombreAccesible: string;
  /** El documento a renovar o corregir; `null` en «Cargar» (el documento no existe). */
  documentoId: string | null;
  tipoDocumento: TipoDocumento;
}

export interface DocumentoAnterior {
  documentoId: string;
  numero: string;
  emisor: string | null;
  /** `dd/mm/aaaa`. */
  vence: string;
  /** `dd/mm/aaaa`: cuándo se cargó. */
  cargado: string;
}

export interface FilaDocumento {
  /** Clave del `each`: el tipo de documento (estable aunque se renueve). */
  clave: TipoDocumento;
  tipo: TipoDocumento;
  nombre: string;
  /** `null` si falta. */
  documentoId: string | null;
  numero: string | null;
  emisor: string | null;
  /** `dd/mm/aaaa` o `null`. */
  emitido: string | null;
  /** `dd/mm/aaaa` o «—» si falta. */
  vence: string;
  estado: {
    tipo: "faltante" | "vencido" | "por-vencer" | "vigente";
    /** «Vencido hace 1 día», «Vence en 6 días», «Vigente hasta 02/09/2027», «Falta cargar». */
    texto: string;
    tono: TonoDeDocumento;
  };
  /** Los documentos que este reemplazó, del más nuevo al más viejo. */
  anteriores: DocumentoAnterior[];
  /** «Anteriores (2)»; `null` si no hay. */
  rotuloAnteriores: string | null;
  acciones: AccionDeDocumentoEnFicha[];
}

export interface PanelDocumentos {
  titulo: string;
  /** «4 · 1 vencido · 1 faltante». */
  rotuloCantidad: string;
  /** Mediano, solo con los documentos de esta unidad. */
  horizonte: Horizonte;
  filas: FilaDocumento[];
  /** `null` si no hay ningún tipo para cargar (o no se puede editar): no se ofrece «Cargar otro documento». */
  cargarOtro: { etiqueta: string } | null;
}

export interface FilaNovedad {
  novedadId: string;
  gravedad: "critica" | "normal";
  /** «Crítica», «Abierta» o «Resuelta». */
  estado: string;
  texto: string;
  /** «Parte del 16/11/2026, punto Frenos» o «Cargada por el encargado». */
  origen: string;
  /** `dd/mm/aaaa`. */
  fecha: string;
  /** A4: es una crítica abierta de una unidad fuera de servicio, o sea, impide volver a servicio. */
  impideVolver: boolean;
  /** N2: al resolverla se ofrece «Volver a servicio ahora» (es la última crítica de una unidad fuera de servicio por novedad crítica). */
  ofreceVolverAServicio: boolean;
  /** Solo las resueltas. */
  resolucion: { texto: string; /** `dd/mm/aaaa hh:mm` */ fecha: string; autor: string } | null;
  /** Solo las abiertas y solo con permiso. */
  accion: { tipo: "resolver"; etiqueta: "Resolver"; nombreAccesible: string; novedadId: string } | null;
}

export interface PanelNovedades {
  titulo: string;
  /** «0 abiertas». */
  rotuloCantidad: string;
  filtros: { id: "abiertas" | "resueltas"; etiqueta: string; cantidad: number }[];
  /** Las críticas primero y, dentro, la más antigua (N5). */
  abiertas: FilaNovedad[];
  /** La resuelta más recientemente, primero. */
  resueltas: FilaNovedad[];
  vacioAbiertas: string;
  vacioResueltas: string;
  /** `null` si no se puede (de baja o sin permiso). */
  cargar: { etiqueta: string } | null;
}

export interface FilaKilometraje {
  /** Clave del `each`: el id del parte; las correcciones, su fecha e instante. */
  clave: string;
  tipo: "parte" | "salida" | "correccion";
  /** `dd/mm/aaaa`. */
  fecha: string;
  /** «84.188 → 84.320», «84.452 → en uso» (un parte en uso: solo se sabe el inicio) o «Corrección: 120 km». */
  texto: string;
  /** «132 km» o «Sin uso» (también un parte cerrado sin salida); `null` en las salidas y las correcciones. */
  recorrido: string | null;
  /** Saltos y recorridos largos aceptados al enviar (K6, K7): llevan `i-alerta` tono semana. */
  advertencias: string[];
  /** El motivo de una corrección. */
  motivo: string | null;
  /** Los partes y las salidas: enlace al parte completo. */
  href: string | null;
}

export interface PanelKilometraje {
  titulo: string;
  /** «84.320 km» o «Sin registros». */
  rotuloKm: string;
  subtitulo: string;
  /** Hasta 10, la más nueva primero. */
  filas: FilaKilometraje[];
  /** «Todavía no hay partes enviados ni correcciones.» si no hay filas. */
  vacio: string | null;
  /** `null` si no se puede (de baja o sin permiso). */
  corregir: { etiqueta: string } | null;
}

export type IconoDeEvento = "parte" | "documento" | "novedad" | "estado" | "km" | "unidad" | "caja";
export type CategoriaDeEvento = "partes" | "documentos" | "novedades" | "estado-km" | "otros";
export type IdFiltroHistorial = "todo" | Exclude<CategoriaDeEvento, "otros">;

export interface DetalleDeParte {
  tipo: "parte";
  /** «Parte enviado · 132 km (84.320 → 84.452) · combustible 3/4 · 1 novedad». */
  resumenCorto: string;
  kmInicio: string;
  kmFin: string;
  /** «132 km» o «Sin uso». */
  recorrido: string;
  /** «3/4»; `null` si el parte no lo tiene. */
  combustible: string | null;
  /** «45,5 litros» o «Sin carga». */
  litros: string;
  /** Los puntos con novedad, con el texto completo. */
  novedades: { rotulo: string; texto: string; critica: boolean }[];
  /** «8 puntos en orden»; `null` si no hay. */
  puntosEnOrden: string | null;
  /** Las advertencias aceptadas al enviar (K6, K7), ya en texto. */
  advertencias: string[];
  fueraDePlazo: boolean;
  /** «Ver el parte completo». */
  href: string;
}

export interface DetalleDeCorreccion {
  tipo: "documento-corregido";
  /** «Antes / Después» por campo cambiado. */
  cambios: { campo: string; antes: string; despues: string }[];
}

export interface FilaEvento {
  eventoId: string;
  secuencia: number;
  tipo: TipoEvento;
  icono: IconoDeEvento;
  categoria: CategoriaDeEvento;
  /** `dd/mm/aaaa hh:mm`, hora de Argentina (T6). */
  instante: string;
  /** `hh:mm`. */
  hora: string;
  /** Día en Argentina, `AAAA-MM-DD` (agrupa el historial). */
  dia: string;
  /** «Martes 17/11/2026». */
  tituloDia: string;
  resumen: string;
  autor: string;
  /** Lo que se ve al abrir el evento (parte enviado, documento corregido); `null` si no hay o los datos no tienen la forma esperada. */
  detalle: DetalleDeParte | DetalleDeCorreccion | null;
}

export interface PanelHistorial {
  titulo: string;
  /** «128 eventos». */
  rotuloCantidad: string;
  total: number;
  filtros: { id: IdFiltroHistorial; etiqueta: string; cantidad: number }[];
  /** Todos, el más nuevo arriba (H3); `vistaDeHistorial` recorta y agrupa. */
  eventos: FilaEvento[];
}

/** Las solapas de la ficha en pantallas angostas (en las anchas se ven las secciones juntas). */
export const SOLAPAS_DE_FICHA = ["resumen", "documentos", "novedades", "historial"] as const;
export type SolapaDeFicha = (typeof SOLAPAS_DE_FICHA)[number];

/** El número de la pestaña de una solapa (`cantidad`, 0 si no lleva) y si va en tono crítico. */
export interface NumeroDeSolapa {
  id: SolapaDeFicha;
  cantidad: number;
  critica: boolean;
}

/**
 * En qué solapa abre la ficha: la de la causa principal de que la unidad no esté disponible (el primer motivo de la aptitud). Documento vencido o faltante →
 * `documentos`; novedad crítica abierta, o fuera de servicio por una novedad crítica → `novedades`. Sin causa (disponible, fuera de servicio por decisión del
 * encargado, de baja, o una crítica de hoy que ya se resolvió) → `resumen`.
 */
export function solapaInicial(motivos: readonly Pick<Motivo, "tipo">[], estadoDeLaUnidad: Unidad["estado"]): SolapaDeFicha {
  switch (motivos[0]?.tipo) {
    case "documento-vencido":
    case "documento-faltante":
      return "documentos";
    case "novedad-critica":
      return "novedades";
    case "fuera-de-servicio":
      return estadoDeLaUnidad.tipo === "fuera-de-servicio" && estadoDeLaUnidad.origen === "novedad-critica" ? "novedades" : "resumen";
    default:
      return "resumen";
  }
}

export interface FichaDeUnidad {
  encontrada: true;
  unidadId: string;
  /** Normalizada, sin espacios (`ZK214BD`). */
  patente: string;
  patenteTexto: string;
  /** «Int. 07». */
  interno: string;
  internoNumero: number;
  /** «Toyota Hilux 2022 · Camioneta». */
  descripcion: string;
  migas: Miga[];
  aptitud: {
    categoria: "puede-salir" | "no-puede-salir" | "fuera-de-servicio" | "baja";
    /** «Puede salir», «No puede salir», «Fuera de servicio», «De baja». */
    etiqueta: string;
    /** Todos los motivos. */
    motivos: string[];
    /** Lo que va junto a la etiqueta: uno o dos motivos, o «3 motivos»; `null` si puede salir o está de baja (el aviso ya lo dice). */
    linea: string | null;
    /** Más de dos motivos: la lista va debajo. */
    mostrarLista: boolean;
  };
  datos: {
    proyecto: string | null;
    conductor: string | null;
    /** L1: el conductor asignado no tiene licencia que ampare hoy. El encabezado agrega «Sin licencia vigente» junto a su nombre. */
    conductorSinLicencia: boolean;
    km: { valor: number | null; texto: string; /** `dd/mm/aaaa` del último registro. */ fecha: string | null; textoConFecha: string };
  };
  /** Solo una unidad de baja: «Dada de baja el 21/10/2026: Venta. Se conserva su historial.» */
  aviso: string | null;
  estadoOperativo: EstadoOperativoDeFicha;
  /** El perfil Encargado. Con otro perfil no hay ninguna acción (la ficha no se muestra al conductor: es la perspectiva de la demo). */
  puedeEditar: boolean;
  /** La solapa con que abre la ficha en pantallas angostas (`solapaInicial`). La vista la lee una vez, al abrir: si después se resuelve la causa, la solapa no se mueve sola. */
  solapaInicial: SolapaDeFicha;
  /** Las cuatro solapas con su número: documentos vencidos o faltantes (crítico) y novedades abiertas (crítico si alguna lo es). */
  solapas: NumeroDeSolapa[];
  acciones: { encabezado: AccionDeFicha[]; masAcciones: AccionDeFicha[] };
  documentos: PanelDocumentos;
  novedades: PanelNovedades;
  kilometraje: PanelKilometraje;
  historial: PanelHistorial;
}

// --- Armado --------------------------------------------------------------------------------------

export function fichaDeUnidad(
  estado: Estado,
  alertas: Pick<ResultadoAlertas, "alertas">,
  hoy: FechaCivil,
  patente: string,
  perfil: Perfil,
): FichaDeUnidad | FichaNoEncontrada {
  const unidad = estado.unidades.find((u) => u.patente === patente);
  if (unidad === undefined) {
    const patenteTexto = formatearPatente(patente);
    return {
      encontrada: false,
      titulo: TEXTO_FICHA.noEncontrada.titulo,
      mensaje: textoUnidadNoEncontrada(patenteTexto),
      patenteTexto,
      enlace: { texto: TEXTO_FICHA.noEncontrada.enlace, href: aHash({ tipo: "movilidades" }) },
    };
  }
  const patenteTexto = formatearPatente(unidad.patente);
  const puedeEditar = perfil.tipo === "encargado";
  const baja = unidad.estado.tipo === "baja";
  const a = aptitud(unidad, estado, hoy);
  const km = kmDeLaUnidad(estado, unidad);
  const criticas = criticasAbiertasDeUnidad(estado.novedades, unidad.id);
  const fuera = unidad.estado.tipo === "fuera-de-servicio";
  const documentos = panelDeDocumentos(estado, alertas, unidad, hoy, puedeEditar && !baja);
  const novedades = panelDeNovedades(estado, unidad, puedeEditar, !baja);
  const malos = documentos.filas.filter((f) => f.estado.tipo === "vencido" || f.estado.tipo === "faltante").length;

  return {
    encontrada: true,
    unidadId: unidad.id,
    patente: unidad.patente,
    patenteTexto,
    interno: textoInterno(unidad.interno),
    internoNumero: unidad.interno,
    descripcion: textoDescripcionUnidad(unidad.marca, unidad.modelo, unidad.anio, unidad.tipo),
    migas: [
      { texto: TEXTO_FICHA.migaFlota, href: aHash({ tipo: "movilidades" }) },
      { texto: patenteTexto, href: null },
    ],
    aptitud: {
      categoria: a.categoria,
      etiqueta: TEXTO_FLOTA.estado[a.categoria],
      motivos: a.motivos.map((m) => m.texto),
      linea: baja ? null : textoLineaAptitud(a.motivos.map((m) => m.texto)),
      mostrarLista: !baja && a.motivos.length > 2,
    },
    datos: {
      proyecto: estado.proyectos.find((p) => p.id === unidad.proyectoId)?.nombre ?? null,
      conductor: unidad.conductorId === null ? null : (estado.conductores.find((c) => c.id === unidad.conductorId)?.nombre ?? null),
      conductorSinLicencia: unidad.conductorId !== null && !estadoDeLicencia(estado.documentos, unidad.conductorId, hoy).vigente,
      km,
    },
    aviso: unidad.estado.tipo === "baja" ? textoDadaDeBaja(unidad.estado.desde, unidad.estado.motivo) : null,
    estadoOperativo: {
      tipo: unidad.estado.tipo,
      desde: unidad.estado.tipo === "en-servicio" ? null : formatearFecha(unidad.estado.desde),
      motivo: unidad.estado.tipo === "en-servicio" ? null : unidad.estado.motivo,
      origen: unidad.estado.tipo === "fuera-de-servicio" ? unidad.estado.origen : null,
      novedadesQueImpiden: fuera ? criticas : [],
    },
    puedeEditar,
    solapaInicial: solapaInicial(a.motivos, unidad.estado),
    solapas: [
      { id: "resumen", cantidad: 0, critica: false },
      { id: "documentos", cantidad: malos, critica: malos > 0 },
      { id: "novedades", cantidad: novedades.abiertas.length, critica: novedades.abiertas.some((n) => n.gravedad === "critica") },
      { id: "historial", cantidad: 0, critica: false },
    ],
    acciones: accionesDe(unidad, hoy, puedeEditar, fuera && criticas.length > 0 ? errNovedadesCriticasAbiertas(criticas.map((c) => c.texto)) : null, estado.partes),
    documentos,
    novedades,
    kilometraje: panelDeKilometraje(estado, unidad, km, puedeEditar && !baja),
    historial: panelDeHistorial(estado, unidad),
  };
}

function kmDeLaUnidad(estado: Estado, unidad: Unidad): FichaDeUnidad["datos"]["km"] {
  const valor = kmActual(unidad.id, estado.partes, estado.correccionesKm);
  const ultimo = registrosDeKm(unidad.id, estado.partes, estado.correccionesKm).at(-1);
  if (valor === null || ultimo === undefined) return { valor: null, texto: TEXTO_FICHA.kilometraje.sinRegistros, fecha: null, textoConFecha: TEXTO_FICHA.kilometraje.sinRegistros };
  return { valor, texto: `${formatearKm(valor)} km`, fecha: formatearFecha(ultimo.fecha), textoConFecha: textoKmConFecha(valor, ultimo.fecha) };
}

/** C16: el texto y el destino del primer botón según el parte de la unidad. */
function accionDelParte(unidad: Unidad, hoy: FechaCivil, partes: readonly Parte[]): { etiqueta: string; fecha: FechaCivil } {
  const t = TEXTO_FICHA.acciones;
  const legibles = partes.flatMap((p) => parteLegible(p) ?? []);
  const deHoy = legibles.find((p) => p.unidadId === unidad.id && p.fecha === hoy);
  if (deHoy?.estado === "enviado") return { etiqueta: t.verParte, fecha: hoy };
  if (deHoy?.estado === "en-uso") return { etiqueta: t.cerrarParte, fecha: hoy };
  const anterior = partePendienteDeCierre(legibles, unidad.id, hoy);
  if (anterior !== undefined) return { etiqueta: textoCerrarElParteDel(anterior.fecha), fecha: anterior.fecha };
  return { etiqueta: t.cargarParte, fecha: hoy };
}

function accionesDe(unidad: Unidad, hoy: FechaCivil, puedeEditar: boolean, bloqueo: string | null, partes: readonly Parte[]): FichaDeUnidad["acciones"] {
  const t = TEXTO_FICHA.acciones;
  const accion = (id: IdAccionDeFicha, etiqueta: string, href: string | null = null, motivo: string | null = null): AccionDeFicha => ({ id, etiqueta, href, bloqueo: motivo });
  if (!puedeEditar || unidad.estado.tipo === "baja") return { encabezado: [], masAcciones: [] };
  const encabezado: AccionDeFicha[] = [];
  if (unidad.estado.tipo === "en-servicio") {
    // P8: solo una unidad en servicio recibe partes.
    const parte = accionDelParte(unidad, hoy, partes);
    encabezado.push(accion("cargar-parte", parte.etiqueta, aHash({ tipo: "parte", patente: unidad.patente, fecha: parte.fecha })));
    encabezado.push(accion("poner-fuera-de-servicio", t.ponerFueraDeServicio));
  } else {
    encabezado.push(accion("volver-a-servicio", t.volverAServicio, null, bloqueo));
  }
  return {
    encabezado,
    masAcciones: [
      accion("corregir-kilometraje", t.corregirKilometraje),
      accion("cambiar-asignacion", t.cambiarAsignacion),
      accion("cargar-novedad", t.cargarNovedad),
      accion("dar-de-baja", t.darDeBaja),
    ],
  };
}

// --- Documentos ----------------------------------------------------------------------------------

const TONO_DE_GRUPO: Record<Grupo, TonoDeDocumento> = { vencidos: "critico", "7": "semana", "15": "quincena", "30": "mes" };

function fechaDeCarga(d: Documento): string {
  try {
    return formatearFecha(fechaEnArgentina(d.cargado));
  } catch {
    return TEXTO_FICHA.historial.sinValor;
  }
}

function panelDeDocumentos(estado: Estado, alertas: Pick<ResultadoAlertas, "alertas">, unidad: Unidad, hoy: FechaCivil, puedeModificar: boolean): PanelDocumentos {
  const titular = { tipo: "unidad" as const, id: unidad.id };
  const etiqueta = formatearPatente(unidad.patente);
  const proyecto = estado.proyectos.find((p) => p.id === unidad.proyectoId);
  const obligatorios: readonly TipoDocumento[] = proyecto === undefined ? [] : tiposObligatoriosDeUnidad(proyecto);
  // Una unidad de baja no exige nada (V14): se muestra lo que tiene cargado, no lo que le falta.
  const exigidos = unidad.estado.tipo === "baja" ? [] : obligatorios;

  const filas: FilaDocumento[] = [];
  for (const r of REQUISITOS) {
    if (r.titular !== "unidad") continue;
    const vigente = documentoVigente(estado.documentos, titular, r.tipo);
    if (vigente === undefined && !exigidos.includes(r.tipo)) continue;
    const nombre = NOMBRES_DOCUMENTO[r.tipo];
    if (vigente === undefined) {
      filas.push({
        clave: r.tipo,
        tipo: r.tipo,
        nombre,
        documentoId: null,
        numero: null,
        emisor: null,
        emitido: null,
        vence: TEXTO_FICHA.historial.sinValor,
        estado: { tipo: "faltante", texto: TEXTO_FALTA_CARGAR, tono: "critico" },
        anteriores: [],
        rotuloAnteriores: null,
        acciones: puedeModificar ? [{ tipo: "cargar", etiqueta: "Cargar", nombreAccesible: textoAccionDocumento("Cargar", r.tipo, etiqueta), documentoId: null, tipoDocumento: r.tipo }] : [],
      });
      continue;
    }
    const c = clasificar(vigente.vence, hoy, vigente.tipo);
    const anteriores = estado.documentos
      .filter((d) => d.id !== vigente.id && d.tipo === r.tipo && d.titular.tipo === "unidad" && d.titular.id === unidad.id)
      .sort((x, y) => (x.vence !== y.vence ? (x.vence < y.vence ? 1 : -1) : x.cargado < y.cargado ? 1 : -1))
      .map((d) => ({ documentoId: d.id, numero: d.numero, emisor: d.emisor === "" ? null : d.emisor, vence: formatearFecha(d.vence), cargado: fechaDeCarga(d) }));
    filas.push({
      clave: r.tipo,
      tipo: r.tipo,
      nombre,
      documentoId: vigente.id,
      numero: vigente.numero,
      emisor: vigente.emisor === "" ? null : vigente.emisor,
      emitido: vigente.emitido === null ? null : formatearFecha(vigente.emitido),
      vence: formatearFecha(vigente.vence),
      estado: {
        tipo: c.estado === "vence-hoy" ? "por-vencer" : c.estado,
        texto: textoVencimiento(c.d, vigente.vence, vigente.tipo),
        tono: c.grupo === null ? "vigente" : TONO_DE_GRUPO[c.grupo],
      },
      anteriores,
      rotuloAnteriores: anteriores.length === 0 ? null : textoAnteriores(anteriores.length),
      acciones: puedeModificar
        ? [
            { tipo: "renovar", etiqueta: "Renovar", nombreAccesible: textoAccionDocumento("Renovar", r.tipo, etiqueta), documentoId: vigente.id, tipoDocumento: r.tipo },
            { tipo: "corregir", etiqueta: "Corregir", nombreAccesible: textoAccionDocumento("Corregir", r.tipo, etiqueta), documentoId: vigente.id, tipoDocumento: r.tipo },
          ]
        : [],
    });
  }
  const vencidos = filas.filter((f) => f.estado.tipo === "vencido").length;
  const faltantes = filas.filter((f) => f.estado.tipo === "faltante").length;
  return {
    titulo: TEXTO_FICHA.documentos.titulo,
    rotuloCantidad: textoRotuloDocumentos(filas.length, vencidos, faltantes),
    horizonte: horizonteDeUnidad(alertas, unidad.id),
    filas,
    cargarOtro: puedeModificar && tiposParaCargar(estado, unidad.id).length > 0 ? { etiqueta: TEXTO_FICHA.documentos.cargarOtro } : null,
  };
}

// --- Novedades -----------------------------------------------------------------------------------

function filaDeNovedad(estado: Estado, unidad: Unidad, n: Novedad, puedeResolver: boolean): FilaNovedad {
  const abierta = n.estado === "abierta";
  const patente = formatearPatente(unidad.patente);
  return {
    novedadId: n.id,
    gravedad: n.gravedad,
    estado: !abierta ? TEXTO_FICHA.novedades.etiquetaResuelta : n.gravedad === "critica" ? TEXTO_FICHA.novedades.etiquetaCritica : TEXTO_FICHA.novedades.etiquetaAbierta,
    // Igual que en el centro de alertas: el punto del parte delante («Frenos: ruido al frenar en bajada»).
    texto: n.origen.tipo === "parte" && n.origen.item !== "otra" ? `${rotuloNovedad(n)}: ${n.descripcion}` : n.descripcion,
    origen: origenDeNovedad(n),
    fecha: formatearFecha(n.fecha),
    impideVolver: abierta && n.gravedad === "critica" && unidad.estado.tipo === "fuera-de-servicio",
    ofreceVolverAServicio: ofreceVolverAServicio(estado, unidad, n),
    resolucion:
      n.resolucion === null ? null : { texto: n.resolucion.texto, fecha: formatearInstante(n.resolucion.instante), autor: n.resolucion.autor },
    accion:
      abierta && puedeResolver
        ? { tipo: "resolver", etiqueta: "Resolver", nombreAccesible: `${TEXTO_FICHA.novedades.resolver} novedad de ${patente}: ${rotuloNovedad(n)}`, novedadId: n.id }
        : null,
  };
}

/** N5: las críticas primero y, dentro de cada grupo, la más antigua. */
function ordenAbiertas(a: Novedad, b: Novedad): number {
  if (a.gravedad !== b.gravedad) return a.gravedad === "critica" ? -1 : 1;
  if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
  return a.id < b.id ? -1 : 1;
}

function panelDeNovedades(estado: Estado, unidad: Unidad, puedeEditar: boolean, noEsBaja: boolean): PanelNovedades {
  const propias = estado.novedades.filter((n) => n.unidadId === unidad.id);
  // Resolver sigue disponible en una unidad de baja: lo único que se puede cerrar de ella son sus novedades abiertas (docs/diseno.md, §16).
  const abiertas = propias.filter((n) => n.estado === "abierta").sort(ordenAbiertas).map((n) => filaDeNovedad(estado, unidad, n, puedeEditar));
  const resueltas = propias
    .filter((n) => n.estado === "resuelta")
    .sort((a, b) => ((a.resolucion?.instante ?? "") === (b.resolucion?.instante ?? "") ? (a.id < b.id ? 1 : -1) : (a.resolucion?.instante ?? "") < (b.resolucion?.instante ?? "") ? 1 : -1))
    .map((n) => filaDeNovedad(estado, unidad, n, false));
  return {
    titulo: TEXTO_FICHA.novedades.titulo,
    rotuloCantidad: textoRotuloNovedades(abiertas.length),
    filtros: [
      { id: "abiertas", etiqueta: TEXTO_FICHA.novedades.abiertas, cantidad: abiertas.length },
      { id: "resueltas", etiqueta: TEXTO_FICHA.novedades.resueltas, cantidad: resueltas.length },
    ],
    abiertas,
    resueltas,
    vacioAbiertas: TEXTO_FICHA.novedades.vacioAbiertas,
    vacioResueltas: TEXTO_FICHA.novedades.vacioResueltas,
    cargar: puedeEditar && noEsBaja ? { etiqueta: TEXTO_FICHA.novedades.cargar } : null,
  };
}

// --- Kilometraje ---------------------------------------------------------------------------------

const FILAS_DE_KILOMETRAJE = 10;

function panelDeKilometraje(estado: Estado, unidad: Unidad, km: FichaDeUnidad["datos"]["km"], puedeCorregir: boolean): PanelKilometraje {
  const registros = registrosDeKm(unidad.id, estado.partes, estado.correccionesKm);
  const filas: FilaKilometraje[] = registros
    .slice(-FILAS_DE_KILOMETRAJE)
    .reverse()
    .map((r): FilaKilometraje => {
      if (r.tipo === "salida") {
        return {
          clave: r.parteId,
          tipo: "salida",
          fecha: formatearFecha(r.fecha),
          texto: textoKmEnUso(r.kmInicio),
          recorrido: null,
          advertencias: [],
          motivo: null,
          href: aHash({ tipo: "parte", patente: unidad.patente, fecha: r.fecha }),
        };
      }
      if (r.tipo === "parte") {
        const parte = estado.partes.find((p) => p.id === r.parteId);
        const delKm = (parte?.advertenciasAceptadas ?? []).filter((a) => a.tipo === "salto-km" || a.tipo === "recorrido-largo");
        return {
          clave: r.parteId,
          tipo: "parte",
          fecha: formatearFecha(r.fecha),
          texto: textoRangoKm(r.kmInicio, r.kmFin),
          recorrido: textoRecorrido(r.kmFin - r.kmInicio),
          advertencias: delKm.map((a) => textoAdvertencia(a)),
          motivo: null,
          href: aHash({ tipo: "parte", patente: unidad.patente, fecha: r.fecha }),
        };
      }
      const correccion = estado.correccionesKm.find((c) => c.unidadId === unidad.id && c.desde === r.fecha && c.instante === r.instante);
      return {
        clave: `correccion-${r.fecha}-${r.instante}`,
        tipo: "correccion",
        fecha: formatearFecha(r.fecha),
        texto: textoCorreccionKm(r.kmBase),
        recorrido: null,
        advertencias: [],
        motivo: correccion?.motivo ?? null,
        href: null,
      };
    });
  return {
    titulo: TEXTO_FICHA.kilometraje.titulo,
    rotuloKm: km.texto,
    subtitulo: TEXTO_FICHA.kilometraje.ultimos,
    filas,
    vacio: filas.length === 0 ? TEXTO_FICHA.kilometraje.vacio : null,
    corregir: puedeCorregir ? { etiqueta: TEXTO_FICHA.acciones.corregirKilometraje } : null,
  };
}

// --- Historial -----------------------------------------------------------------------------------

/** Cuántos eventos suma cada «Ver más» (5.16; D2): 10 con poco ancho y 30 desde 40rem. La vista elige uno al abrir la ficha y se lo pasa a `vistaDeHistorial`. */
export const PASO_HISTORIAL_ANGOSTO = 10;
export const PASO_HISTORIAL_ANCHO = 30;

const FORMA_DEL_EVENTO: Record<TipoEvento, { icono: IconoDeEvento; categoria: CategoriaDeEvento }> = {
  "revision-enviada": { icono: "parte", categoria: "partes" },
  "parte-enviado": { icono: "parte", categoria: "partes" },
  "documento-cargado": { icono: "documento", categoria: "documentos" },
  "documento-renovado": { icono: "documento", categoria: "documentos" },
  "documento-corregido": { icono: "documento", categoria: "documentos" },
  "novedad-abierta": { icono: "novedad", categoria: "novedades" },
  "novedad-resuelta": { icono: "novedad", categoria: "novedades" },
  "fuera-de-servicio": { icono: "estado", categoria: "estado-km" },
  "vuelta-a-servicio": { icono: "estado", categoria: "estado-km" },
  "km-corregido": { icono: "km", categoria: "estado-km" },
  "unidad-baja": { icono: "caja", categoria: "estado-km" },
  "unidad-alta": { icono: "unidad", categoria: "otros" },
  "asignacion-cambiada": { icono: "unidad", categoria: "otros" },
};

const FILTROS_DE_HISTORIAL: readonly IdFiltroHistorial[] = ["todo", "partes", "documentos", "novedades", "estado-km"];

function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Un evento guardado con un instante que no se puede leer no rompe la ficha: sale sin fecha. */
function momentoDelEvento(instante: string): { instante: string; hora: string; dia: string; tituloDia: string } {
  try {
    const completo = formatearInstante(instante);
    const dia = fechaEnArgentina(instante);
    return { instante: completo, hora: completo.slice(-5), dia, tituloDia: `${mayuscula(diaDeLaSemana(dia))} ${formatearFecha(dia)}` };
  } catch {
    return { instante: TEXTO_FICHA.historial.sinValor, hora: "", dia: "", tituloDia: TEXTO_FICHA.historial.sinValor };
  }
}

function esTexto(v: unknown): v is string {
  return typeof v === "string";
}

function formatearValorDeCampo(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return TEXTO_FICHA.historial.sinValor;
  if (esTexto(valor) && (campo === "vence" || campo === "emitido") && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return formatearFecha(valor);
  return esTexto(valor) ? valor : String(valor);
}

function detalleDeCorreccion(datos: Record<string, unknown>): DetalleDeCorreccion | null {
  const cambios = datos["cambios"];
  if (typeof cambios !== "object" || cambios === null) return null;
  const lista: DetalleDeCorreccion["cambios"] = [];
  for (const campo of Object.keys(ROTULO_CAMPO_DOCUMENTO_CORREGIDO) as (keyof typeof ROTULO_CAMPO_DOCUMENTO_CORREGIDO)[]) {
    const c: unknown = (cambios as Record<string, unknown>)[campo];
    if (typeof c !== "object" || c === null || !("antes" in c) || !("despues" in c)) continue;
    lista.push({ campo: ROTULO_CAMPO_DOCUMENTO_CORREGIDO[campo], antes: formatearValorDeCampo(campo, c.antes), despues: formatearValorDeCampo(campo, c.despues) });
  }
  return lista.length === 0 ? null : { tipo: "documento-corregido", cambios: lista };
}

function detalleDeParte(estado: Estado, unidad: Unidad, datos: Record<string, unknown>): DetalleDeParte | null {
  const parteId = datos["parteId"];
  const parte: Parte | undefined = esTexto(parteId) ? estado.partes.find((p) => p.id === parteId) : undefined;
  if (parte === undefined || parte.kmInicio === null || parte.kmFin === null) return null;
  const novedades = novedadesDelParte(parte).map((n) => ({
    rotulo: n.item === "otra" ? "Otra novedad" : (ITEMS_CHECKLIST.find((i) => i.id === n.item)?.texto ?? n.item),
    texto: n.descripcion,
    critica: n.gravedad === "critica",
  }));
  const enOrden = Object.values(parte.checklist).filter((r) => r.estado === "en-orden").length;
  const combustible = parte.combustible === null ? null : NOMBRES_COMBUSTIBLE[parte.combustible];
  return {
    tipo: "parte",
    resumenCorto: textoResumenParteEnviado({ kmInicio: parte.kmInicio, kmFin: parte.kmFin, combustible, novedades: novedades.length }),
    kmInicio: `${formatearKm(parte.kmInicio)} km`,
    kmFin: `${formatearKm(parte.kmFin)} km`,
    recorrido: textoRecorrido(parte.kmFin - parte.kmInicio),
    combustible,
    litros: textoLitros(parte.litrosCargados),
    novedades,
    puntosEnOrden: enOrden === 0 ? null : textoPuntosEnOrden(enOrden),
    advertencias: renglonesDeAvisosAceptados(parte).map((r) => r.texto),
    fueraDePlazo: datos["fueraDeTermino"] === true,
    href: aHash({ tipo: "parte", patente: unidad.patente, fecha: parte.fecha }),
  };
}

/** El resumen de los eventos del parte, armado con el parte (docs/diseno-ui.md, sección 7: «Revisión antes de salir · 84.320 km · sin novedades»); si no se puede leer, el que se guardó. */
function resumenDeParteEnHistorial(estado: Estado, e: Evento): string {
  const parteId = e.datos["parteId"];
  const parte: Parte | undefined = esTexto(parteId) ? estado.partes.find((p) => p.id === parteId) : undefined;
  const kmInicio = e.datos["kmInicio"];
  if (typeof kmInicio !== "number") return e.resumen;
  if (e.tipo === "revision-enviada") {
    const novedades = parte === undefined ? [] : novedadesDelParte(parte);
    const nombre = (n: { item: ItemChecklist | "otra" }): string => (n.item === "otra" ? "Otra novedad" : (ITEMS_CHECKLIST.find((i) => i.id === n.item)?.texto ?? n.item));
    return textoRevisionEnHistorial({
      kmInicio,
      normales: novedades.filter((n) => n.gravedad === "normal").map(nombre),
      criticas: novedades.filter((n) => n.gravedad === "critica").map(nombre),
      fueraDePlazo: e.datos["fueraDeTermino"] === true,
    });
  }
  const kmFin = e.datos["kmFin"];
  if (typeof kmFin !== "number") return e.resumen;
  return textoCierreEnHistorial({ kmInicio, kmFin, combustible: parte?.combustible === undefined || parte.combustible === null ? null : NOMBRES_COMBUSTIBLE[parte.combustible] });
}

function filaDeEvento(estado: Estado, unidad: Unidad, e: Evento): FilaEvento {
  const forma = FORMA_DEL_EVENTO[e.tipo];
  const detalle = e.tipo === "parte-enviado" ? detalleDeParte(estado, unidad, e.datos) : e.tipo === "documento-corregido" ? detalleDeCorreccion(e.datos) : null;
  return { eventoId: e.id, secuencia: e.secuencia, tipo: e.tipo, icono: forma.icono, categoria: forma.categoria, ...momentoDelEvento(e.instante), resumen: e.tipo === "revision-enviada" || e.tipo === "parte-enviado" ? resumenDeParteEnHistorial(estado, e) : e.resumen, autor: e.autor, detalle };
}

function panelDeHistorial(estado: Estado, unidad: Unidad): PanelHistorial {
  // H3 y H4: del más nuevo al más viejo; una unidad de baja conserva todo.
  const eventos = historialDeUnidad(estado, unidad.id).map((e) => filaDeEvento(estado, unidad, e));
  return {
    titulo: TEXTO_FICHA.historial.titulo,
    rotuloCantidad: textoEventos(eventos.length),
    total: eventos.length,
    filtros: FILTROS_DE_HISTORIAL.map((id) => ({
      id,
      etiqueta: TEXTO_FICHA.historial.filtros[id],
      cantidad: id === "todo" ? eventos.length : eventos.filter((e) => e.categoria === id).length,
    })),
    eventos,
  };
}

export interface GrupoDeDia {
  /** `AAAA-MM-DD`. */
  dia: string;
  /** «Martes 17/11/2026». */
  titulo: string;
  eventos: FilaEvento[];
}

export interface VistaHistorial {
  grupos: GrupoDeDia[];
  mostrados: number;
  /** Los del filtro elegido. */
  total: number;
  hayMas: boolean;
  /** «Ver 10 más» o «Ver 30 más» según el paso (o menos, si queda poco); `null` si ya se ven todos. */
  botonVerMas: string | null;
  /** «Mostrando 30 de 128 eventos.» para la región `role="status"`. */
  anuncio: string;
  /** Los ids de los eventos visibles, en orden: el primer evento nuevo tras «Ver 30 más» es `ids[límiteAnterior]`. */
  ids: string[];
  /** «Todavía no hay eventos.» si el filtro no deja ninguno. */
  vacio: string | null;
}

/**
 * El historial filtrado, recortado a `limite` eventos y agrupado por día (el más nuevo arriba). Filtro y límite son estado de la vista; `paso` es lo que suma cada
 * «Ver más» (`PASO_HISTORIAL_ANGOSTO` o `PASO_HISTORIAL_ANCHO`) y solo cambia el texto de `botonVerMas`. Sin `paso`, el ancho.
 */
export function vistaDeHistorial(h: PanelHistorial, filtro: IdFiltroHistorial, limite: number, paso: number = PASO_HISTORIAL_ANCHO): VistaHistorial {
  const lista = filtro === "todo" ? h.eventos : h.eventos.filter((e) => e.categoria === filtro);
  const visibles = lista.slice(0, Math.max(0, limite));
  const grupos: GrupoDeDia[] = [];
  for (const e of visibles) {
    const ultimo = grupos.at(-1);
    if (ultimo !== undefined && ultimo.dia === e.dia) ultimo.eventos.push(e);
    else grupos.push({ dia: e.dia, titulo: e.tituloDia, eventos: [e] });
  }
  const resto = lista.length - visibles.length;
  return {
    grupos,
    mostrados: visibles.length,
    total: lista.length,
    hayMas: resto > 0,
    botonVerMas: resto > 0 ? textoVerMasEventos(Math.min(paso, resto)) : null,
    anuncio: textoMostrandoEventos(visibles.length, lista.length),
    ids: visibles.map((e) => e.eventoId),
    vacio: lista.length === 0 ? TEXTO_FICHA.historial.vacio : null,
  };
}

