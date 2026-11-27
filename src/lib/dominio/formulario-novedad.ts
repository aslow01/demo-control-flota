// Diálogos «Resolver novedad» y «Cargar novedad» (docs/diseno-ui.md, 5.11, 5.15 y 5.17; reglas N1 a N3, A3, A4). Todo lo que el formulario
// necesita, sin DOM y sin reglas nuevas: las reglas siguen en `comandos.ts` y `validacion.ts`; acá se arman los textos y los valores
// iniciales, se convierte lo que escribe la persona en un comando y se reparten los errores por campo.

import type { Comando } from "./comandos.ts";
import { armarErrores, erroresDeNegocioEn, errorGeneralEn, type ErroresDeFormularioDe } from "./formulario.ts";
import { avisoDeVueltaSinPoderSalir, vuelveSinSalirHastaManana } from "./formulario-ficha.ts";
import { formatearFecha } from "./fechas.ts";
import { criticasAbiertasDeUnidad, rotuloNovedad } from "./novedades.ts";
import { formatearPatente } from "./patente.ts";
import { TEXTO_DIALOGOS_FICHA } from "./textos-base.ts";
import { TEXTO_FICHA, textoOrigenEnFicha } from "./textos-ficha.ts";
import type { ErrorDeNegocio, Estado, FechaCivil, Novedad, Unidad } from "./tipos.ts";
import { ITEMS_CHECKLIST } from "./parte.ts";
import { REGLAS, validarTexto } from "./validacion.ts";

/** Cómo se dice de dónde salió una novedad: «Parte del 16/11/2026, punto Frenos» o «Cargada por el encargado» (una sola fuente con la ficha). */
export function origenDeNovedad(n: Novedad): string {
  if (n.origen.tipo === "manual") return textoOrigenEnFicha({ tipo: "manual" }, n.fecha);
  const origen = n.origen;
  const item = origen.item === "otra" ? null : (ITEMS_CHECKLIST.find((i) => i.id === origen.item)?.texto ?? null);
  return textoOrigenEnFicha({ tipo: "parte", item }, n.fecha);
}

// --- Resolver ------------------------------------------------------------------------------------

export type CampoResolver = "texto";
export const CAMPOS_RESOLVER: readonly CampoResolver[] = ["texto"];

export interface ValoresResolver {
  texto: string;
  /** La casilla «Volver a servicio ahora» (N2). Si no se ofreció, `false`. */
  volverAServicio: boolean;
}

export type ErroresResolver = ErroresDeFormularioDe<CampoResolver>;

export interface ContextoResolver {
  novedadId: string;
  unidadId: string;
  /** «Resolver novedad de ZK 214 BD». */
  titulo: string;
  /** Lo que se está resolviendo, para leerlo antes de contar qué se hizo. */
  novedad: { rotulo: string; texto: string; origen: string; fecha: string; gravedad: "critica" | "normal"; etiqueta: string };
  /** N2: es la última crítica abierta de una unidad que quedó fuera de servicio por una novedad crítica. */
  ofreceVolverAServicio: boolean;
  etiquetaVolverAServicio: string;
  /** «ZK 214 BD está fuera de servicio por esta novedad. Con la casilla marcada, vuelve a servicio al resolverla.»; `null` si no se ofrece. */
  notaVolverAServicio: string | null;
  /** A5: si al volver sigue sin poder salir por documentos, lo dice junto a la casilla (solo si se ofrece). */
  avisoDocumentos: string | null;
  /** La casilla viene marcada cuando se ofrece (N2). */
  valoresIniciales: ValoresResolver;
  primario: string;
}

/**
 * N2: al resolver esta novedad se ofrece «Volver a servicio ahora» si la unidad quedó fuera de servicio POR una novedad crítica y esta es
 * la última crítica que queda abierta. (Si quedó fuera a mano no se ofrece: «Volver a servicio» está en su ficha.)
 */
export function ofreceVolverAServicio(estado: Estado, unidad: Unidad, novedad: Novedad): boolean {
  const criticas = criticasAbiertasDeUnidad(estado.novedades, unidad.id);
  return (
    novedad.estado === "abierta" &&
    unidad.estado.tipo === "fuera-de-servicio" &&
    unidad.estado.origen === "novedad-critica" &&
    criticas.length === 1 &&
    criticas[0]?.novedadId === novedad.id
  );
}

/** `null` si la novedad no existe o ya está resuelta (no hay diálogo que abrir). */
export function contextoDeResolver(estado: Estado, novedadId: string, hoy: FechaCivil): ContextoResolver | null {
  const n = estado.novedades.find((x) => x.id === novedadId);
  if (n === undefined || n.estado !== "abierta") return null;
  const u = estado.unidades.find((x) => x.id === n.unidadId);
  if (u === undefined) return null;
  const patente = formatearPatente(u.patente);
  const ofrece = ofreceVolverAServicio(estado, u, n);
  // P19: con el parte de hoy cerrado sin salida, volver a servicio no hace que la unidad salga hoy: el diálogo no lo promete.
  const hastaManana = ofrece && vuelveSinSalirHastaManana(estado, u, hoy);
  const t = TEXTO_DIALOGOS_FICHA.resolver;
  return {
    novedadId: n.id,
    unidadId: u.id,
    titulo: t.titulo(patente),
    novedad: {
      rotulo: rotuloNovedad(n),
      texto: n.descripcion,
      origen: origenDeNovedad(n),
      fecha: formatearFecha(n.fecha),
      gravedad: n.gravedad,
      etiqueta: n.gravedad === "critica" ? TEXTO_FICHA.novedades.etiquetaCritica : TEXTO_FICHA.novedades.etiquetaAbierta,
    },
    ofreceVolverAServicio: ofrece,
    etiquetaVolverAServicio: hastaManana ? t.volverEtiquetaHastaManana : t.volverEtiqueta,
    notaVolverAServicio: !ofrece ? null : hastaManana ? t.volverNotaHastaManana(patente) : t.volverNota(patente),
    avisoDocumentos: ofrece ? avisoDeVueltaSinPoderSalir(estado, u, hoy) : null,
    valoresIniciales: { texto: "", volverAServicio: ofrece },
    primario: t.primario,
  };
}

export function comandoDeResolver(novedadId: string, v: ValoresResolver): Comando {
  return { tipo: "resolverNovedad", novedadId, texto: v.texto, volverAServicio: v.volverAServicio };
}

/** N1: el texto de 5 a 500 caracteres. Todo lo demás (ya resuelta, A4) lo dice el comando. */
export function validarResolver(v: ValoresResolver): ErroresResolver | null {
  const r = validarTexto(v.texto, REGLAS.resolucion);
  return r.ok ? null : armarErrores<CampoResolver>([{ campo: "texto", mensaje: r.error.mensaje }], null);
}

export function erroresDeNegocioResolver(error: ErrorDeNegocio): ErroresResolver {
  return erroresDeNegocioEn(error, CAMPOS_RESOLVER);
}

export function errorGeneralResolver(mensaje: string): ErroresResolver {
  return errorGeneralEn(mensaje);
}

// --- Cargar novedad ------------------------------------------------------------------------------

export type CampoCargarNovedad = "descripcion";
export const CAMPOS_CARGAR_NOVEDAD: readonly CampoCargarNovedad[] = ["descripcion"];

export interface ValoresCargarNovedad {
  descripcion: string;
  /** «Impide usar la unidad» (N3, A3). */
  impideUso: boolean;
}

export type ErroresCargarNovedad = ErroresDeFormularioDe<CampoCargarNovedad>;

export interface ContextoCargarNovedad {
  unidadId: string;
  /** «Cargar novedad de ZK 214 BD». */
  titulo: string;
  valoresIniciales: ValoresCargarNovedad;
  etiquetaImpideUso: string;
  /** La nota de A3: si impide el uso, la unidad queda fuera de servicio. */
  notaImpideUso: string;
  primario: string;
}

/** `null` si la unidad no existe o está de baja (no se le cargan novedades). */
export function contextoDeCargarNovedad(estado: Estado, unidadId: string): ContextoCargarNovedad | null {
  const u = estado.unidades.find((x) => x.id === unidadId);
  if (u === undefined || u.estado.tipo === "baja") return null;
  const t = TEXTO_DIALOGOS_FICHA.cargarNovedad;
  return {
    unidadId: u.id,
    titulo: t.titulo(formatearPatente(u.patente)),
    valoresIniciales: { descripcion: "", impideUso: false },
    etiquetaImpideUso: t.impideEtiqueta,
    notaImpideUso: t.impideNota,
    primario: t.primario,
  };
}

export function comandoDeCargarNovedad(unidadId: string, v: ValoresCargarNovedad): Comando {
  return { tipo: "cargarNovedad", unidadId, descripcion: v.descripcion, impideUso: v.impideUso };
}

export function validarCargarNovedad(v: ValoresCargarNovedad): ErroresCargarNovedad | null {
  const r = validarTexto(v.descripcion, REGLAS.novedad);
  return r.ok ? null : armarErrores<CampoCargarNovedad>([{ campo: "descripcion", mensaje: r.error.mensaje }], null);
}

export function erroresDeNegocioCargarNovedad(error: ErrorDeNegocio): ErroresCargarNovedad {
  return erroresDeNegocioEn(error, CAMPOS_CARGAR_NOVEDAD);
}

export function errorGeneralCargarNovedad(mensaje: string): ErroresCargarNovedad {
  return errorGeneralEn(mensaje);
}
