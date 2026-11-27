// Tipos del dominio (docs/diseno.md, sección 5). Solo tipos: sin lógica.

/** 'AAAA-MM-DD', siempre validada con `parsearFechaCivil` (T4). */
export type FechaCivil = string;
/** ISO 8601 en UTC, por ejemplo '2026-11-18T17:32:00.000Z'. */
export type Instante = string;

export interface Empresa {
  nombre: string;
  cuit: string;
}

export interface Proyecto {
  id: string;
  nombre: string;
  requiereHabilitacion: boolean;
}

export interface Conductor {
  id: string;
  nombre: string;
  legajo: string;
  activo: boolean;
}

export type TipoUnidad = "camioneta" | "utilitario" | "camion-liviano" | "minibus";

export const TIPOS_DE_UNIDAD: readonly TipoUnidad[] = ["camioneta", "utilitario", "camion-liviano", "minibus"];

/** Guarda de tipo: `true` si el texto es uno de los tipos de unidad del dominio. */
export function esTipoDeUnidad(valor: string): valor is TipoUnidad {
  return TIPOS_DE_UNIDAD.some((t) => t === valor);
}

export type EstadoOperativo =
  | { tipo: "en-servicio" }
  | {
      tipo: "fuera-de-servicio";
      desde: FechaCivil;
      motivo: string;
      origen: "manual" | "novedad-critica";
      novedadIds: string[];
    }
  | { tipo: "baja"; desde: FechaCivil; motivo: string };

export interface Unidad {
  id: string;
  /** Normalizada: 'ZK214BD' o 'ZKB482' (U1). */
  patente: string;
  /** 1 a 999. */
  interno: number;
  marca: string;
  modelo: string;
  anio: number;
  tipo: TipoUnidad;
  proyectoId: string;
  conductorId: string | null;
  estado: EstadoOperativo;
  creada: Instante;
}

export type TipoDocumentoUnidad = "seguro" | "revision-tecnica" | "habilitacion-proyecto" | "matafuego";
export type TipoDocumentoConductor = "licencia" | "habilitacion-manejo";
export type TipoDocumento = TipoDocumentoUnidad | TipoDocumentoConductor;

export interface Titular {
  tipo: "unidad" | "conductor";
  id: string;
}

export interface Documento {
  id: string;
  titular: Titular;
  tipo: TipoDocumento;
  numero: string;
  emisor: string;
  vence: FechaCivil;
  emitido: FechaCivil | null;
  cargado: Instante;
  /** Id del documento que este renovó. */
  reemplazaA: string | null;
}

export type NivelCombustible = "reserva" | "cuarto" | "medio" | "tres-cuartos" | "lleno";

export type ItemChecklist =
  | "frenos"
  | "direccion"
  | "neumaticos"
  | "luces"
  | "cinturones"
  | "perticaBaliza"
  | "alarmaRetroceso"
  | "niveles"
  | "matafuego"
  | "botiquin"
  | "documentacion"
  | "cabina"
  | "calzasAntiderrame"
  | "radio";

export type RespuestaItem =
  | { estado: "sin-responder" }
  | { estado: "en-orden" }
  | { estado: "con-novedad"; descripcion: string; impideUso: boolean };

/** Advertencias que hay que aceptar antes de enviar (K6, K7). La documentación vencida de la unidad no es una: bloquea (P21). */
export type Advertencia = { tipo: "salto-km"; km: number } | { tipo: "recorrido-largo"; km: number };

export interface Parte {
  id: string;
  unidadId: string;
  fecha: FechaCivil;
  /** `null` solo en borrador. */
  conductorId: string | null;
  /**
   * 'borrador' = revisión sin enviar; 'en-uso' = revisión enviada, cierre pendiente; 'enviado' = cerrado (sección 17).
   * En pantalla, 'enviado' se llama «Cerrado».
   */
  estado: "borrador" | "en-uso" | "enviado";
  /** Cuándo se envió la revisión antes de salir; `null` en un borrador. */
  revisado: Instante | null;
  /** `true` = la revisión informó una novedad crítica y el parte se cerró ahí (P16). */
  sinSalida: boolean;
  kmInicio: number | null;
  kmFin: number | null;
  combustible: NivelCombustible | null;
  /** `null` = no cargó. */
  litrosCargados: number | null;
  checklist: Record<ItemChecklist, RespuestaItem>;
  otraNovedad: { descripcion: string; impideUso: boolean } | null;
  advertenciasAceptadas: Advertencia[];
  creado: Instante;
  actualizado: Instante;
  /** Cuándo se cerró el parte; en un parte sin salida es igual a `revisado`. */
  enviado: Instante | null;
  /** Nombre del perfil que envió la revisión. */
  autor: string;
}

export interface Novedad {
  id: string;
  unidadId: string;
  origen: { tipo: "parte"; parteId: string; item: ItemChecklist | "otra" } | { tipo: "manual" };
  descripcion: string;
  gravedad: "critica" | "normal";
  fecha: FechaCivil;
  estado: "abierta" | "resuelta";
  resolucion: { texto: string; instante: Instante; autor: string } | null;
}

export interface CorreccionKm {
  id: string;
  unidadId: string;
  /** A partir de esta fecha vale el nuevo kilometraje base. */
  desde: FechaCivil;
  kmBase: number;
  motivo: string;
  instante: Instante;
  autor: string;
}

export type TipoEvento =
  | "unidad-alta"
  | "asignacion-cambiada"
  | "documento-cargado"
  | "documento-renovado"
  | "documento-corregido"
  | "revision-enviada"
  | "parte-enviado"
  | "novedad-abierta"
  | "novedad-resuelta"
  | "fuera-de-servicio"
  | "vuelta-a-servicio"
  | "km-corregido"
  | "unidad-baja";

/** Historial: solo se agrega, nunca se edita ni se borra (H2). */
export interface Evento {
  id: string;
  /** Creciente global; desempata instantes iguales (H3). */
  secuencia: number;
  instante: Instante;
  unidadId: string | null;
  conductorId: string | null;
  tipo: TipoEvento;
  /** Texto listo para mostrar, en español neutro. */
  resumen: string;
  datos: Record<string, unknown>;
  autor: string;
}

export type Perfil = { tipo: "encargado" } | { tipo: "conductor"; conductorId: string };

export interface Meta {
  versionEsquema: number;
  semilla: number;
  fechaBase: FechaCivil;
  modificada: boolean;
  perfil: Perfil;
}

/** Todo lo que sabe la aplicación, en memoria. Las funciones del dominio lo reciben y no lo modifican. */
export interface Estado {
  meta: Meta;
  proyectos: Proyecto[];
  conductores: Conductor[];
  unidades: Unidad[];
  documentos: Documento[];
  partes: Parte[];
  novedades: Novedad[];
  correccionesKm: CorreccionKm[];
  eventos: Evento[];
}

/** Error de negocio con mensaje listo para mostrar (español neutro). */
export interface ErrorDeNegocio {
  /** Identificador estable para la interfaz y los tests, por ejemplo 'renovacion-no-posterior'. */
  codigo: string;
  mensaje: string;
  /** Campo del formulario al que apunta, si corresponde. */
  campo?: string;
  /** Datos adicionales (por ejemplo, los faltantes de un parte). */
  detalle?: Record<string, unknown>;
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: ErrorDeNegocio };

export function ok<T>(valor: T): Resultado<T> {
  return { ok: true, valor };
}

export function fallo<T = never>(
  codigo: string,
  mensaje: string,
  extra: { campo?: string; detalle?: Record<string, unknown> } = {},
): Resultado<T> {
  const error: ErrorDeNegocio = { codigo, mensaje };
  if (extra.campo !== undefined) error.campo = extra.campo;
  if (extra.detalle !== undefined) error.detalle = extra.detalle;
  return { ok: false, error };
}
