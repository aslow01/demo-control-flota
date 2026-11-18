// Diálogos «Renovar documento» y «Cargar documento» (docs/diseno-ui.md, 5.11, 5.15 y 5.17): todo lo que el formulario
// necesita, sin DOM y sin reglas nuevas. Las reglas siguen en `comandos.ts` y `validacion.ts`: acá solo se arman los
// textos y los valores iniciales, se convierte lo que escribe la persona en un comando y se reparten los errores por campo.
//
// Los campos del formulario son siempre texto (lo que dan los `input`): `vence` y `emitido` en 'AAAA-MM-DD' (o vacíos).

import type { Comando } from "./comandos.ts";
import { diasEntre } from "./fechas.ts";
import { armarErrores, type ErroresDeFormularioDe } from "./formulario.ts";
import { formatearPatente } from "./patente.ts";
import { SUSTANTIVO_NUMERO_DOCUMENTO, TEXTO_CARGAR, TEXTO_RENOVAR } from "./textos.ts";
import type { Documento, ErrorDeNegocio, Estado, FechaCivil, TipoDocumento, Titular } from "./tipos.ts";
import { REGLAS, validarFecha, validarTexto, validarVencimiento } from "./validacion.ts";
import { NOMBRES_DOCUMENTO, REQUISITOS, documentoVigente } from "./vencimientos.ts";

export type CampoDocumento = "numero" | "emisor" | "vence" | "emitido";

/** En el orden del formulario (y del resumen de errores). */
export const CAMPOS_DOCUMENTO: readonly CampoDocumento[] = ["numero", "emisor", "vence", "emitido"];

export interface ValoresDocumento {
  numero: string;
  emisor: string;
  vence: string;
  emitido: string;
}

/** Errores de los diálogos de documento: por campo (`aria-invalid`), en lista para el resumen (5.15) y uno general. El texto escrito se conserva. */
export type ErroresDeFormulario = ErroresDeFormularioDe<CampoDocumento>;

export interface ContextoRenovar {
  documentoId: string;
  /** «Renovar: Seguro de ZK 214 BD». */
  titulo: string;
  /** «Vigente: póliza DEMO-88-4471, venció el 17/11/2026 (hace 1 día).» */
  contexto: string;
  nombreDocumento: string;
  titularEtiqueta: string;
  /** El emisor viene precargado con el del documento anterior; lo demás, vacío. */
  valoresIniciales: ValoresDocumento;
  primario: string;
}

export interface ContextoCargar {
  titular: Titular;
  tipoDocumento: TipoDocumento;
  /** «Cargar: Habilitación de ingreso al proyecto de ZP 088 KC». */
  titulo: string;
  nombreDocumento: string;
  titularEtiqueta: string;
  valoresIniciales: ValoresDocumento;
  primario: string;
}

const VALORES_VACIOS: ValoresDocumento = { numero: "", emisor: "", vence: "", emitido: "" };

/** `ZK 214 BD` para una unidad; el nombre para un conductor. */
export function etiquetaDeTitular(estado: Estado, titular: Titular): string {
  if (titular.tipo === "unidad") {
    const u = estado.unidades.find((x) => x.id === titular.id);
    return u === undefined ? "unidad desconocida" : formatearPatente(u.patente);
  }
  return estado.conductores.find((c) => c.id === titular.id)?.nombre ?? "conductor desconocido";
}

function textoDelVigente(doc: Documento, hoy: FechaCivil): string {
  const d = diasEntre(hoy, doc.vence);
  const estado = d < 0 ? TEXTO_RENOVAR.vencio(doc.vence, -d) : d === 0 ? TEXTO_RENOVAR.venceHoy(doc.vence) : TEXTO_RENOVAR.vence(doc.vence, d);
  return TEXTO_RENOVAR.vigente(doc.numero, estado, SUSTANTIVO_NUMERO_DOCUMENTO[doc.tipo] ?? "número");
}

/** `null` si el documento no existe o ya no es el vigente (se renovó): en ese caso no hay diálogo que abrir. */
export function contextoDeRenovar(estado: Estado, documentoId: string, hoy: FechaCivil): ContextoRenovar | null {
  const doc = estado.documentos.find((d) => d.id === documentoId);
  if (doc === undefined) return null;
  if (documentoVigente(estado.documentos, doc.titular, doc.tipo)?.id !== doc.id) return null;
  const nombre = NOMBRES_DOCUMENTO[doc.tipo];
  const titular = etiquetaDeTitular(estado, doc.titular);
  return {
    documentoId: doc.id,
    titulo: TEXTO_RENOVAR.titulo(nombre, titular),
    contexto: textoDelVigente(doc, hoy),
    nombreDocumento: nombre,
    titularEtiqueta: titular,
    valoresIniciales: { ...VALORES_VACIOS, emisor: doc.emisor },
    primario: TEXTO_RENOVAR.primario,
  };
}

/**
 * `null` si el titular no existe, el tipo no le corresponde o ya tiene ese documento vigente (ahí se renueva, no se carga).
 * El dominio sigue siendo quien decide al guardar.
 */
export function contextoDeCargar(estado: Estado, titular: Titular, tipoDocumento: TipoDocumento): ContextoCargar | null {
  const existe =
    titular.tipo === "unidad" ? estado.unidades.some((u) => u.id === titular.id) : estado.conductores.some((c) => c.id === titular.id);
  if (!existe) return null;
  if (!REQUISITOS.some((r) => r.titular === titular.tipo && r.tipo === tipoDocumento)) return null;
  if (documentoVigente(estado.documentos, titular, tipoDocumento) !== undefined) return null;
  const nombre = NOMBRES_DOCUMENTO[tipoDocumento];
  const etiqueta = etiquetaDeTitular(estado, titular);
  return {
    titular: { tipo: titular.tipo, id: titular.id },
    tipoDocumento,
    titulo: TEXTO_CARGAR.titulo(nombre, etiqueta),
    nombreDocumento: nombre,
    titularEtiqueta: etiqueta,
    valoresIniciales: { ...VALORES_VACIOS },
    primario: TEXTO_CARGAR.primario,
  };
}

function datosDelComando(v: ValoresDocumento) {
  const emitido = v.emitido.trim();
  return { numero: v.numero.trim(), emisor: v.emisor.trim(), vence: v.vence.trim(), emitido: emitido === "" ? null : emitido };
}

export function comandoDeRenovar(documentoId: string, v: ValoresDocumento): Comando {
  return { tipo: "renovarDocumento", documentoId, ...datosDelComando(v) };
}

export function comandoDeCargar(titular: Titular, tipoDocumento: TipoDocumento, v: ValoresDocumento): Comando {
  return { tipo: "cargarDocumento", titular: { tipo: titular.tipo, id: titular.id }, tipoDocumento, ...datosDelComando(v) };
}

/**
 * Revisa todos los campos a la vez con los mismos validadores del dominio, para decir cuántas cosas hay que corregir en una
 * sola pasada (5.15). No mira lo que depende de dos campos (V10, emisión posterior al vencimiento) ni del estado: eso lo dice
 * el comando al ejecutarse. Devuelve `null` si no encontró nada.
 */
export function validarValores(v: ValoresDocumento, hoy: FechaCivil): ErroresDeFormulario | null {
  const datos = datosDelComando(v);
  const lista: { campo: CampoDocumento; mensaje: string }[] = [];
  const revisar = (campo: CampoDocumento, r: { ok: true } | { ok: false; error: ErrorDeNegocio }) => {
    if (!r.ok) lista.push({ campo, mensaje: r.error.mensaje });
  };
  revisar("numero", validarTexto(datos.numero, REGLAS.numeroDocumento));
  revisar("emisor", validarTexto(datos.emisor, REGLAS.emisor));
  revisar("vence", validarVencimiento(datos.vence, hoy));
  if (datos.emitido !== null) revisar("emitido", validarFecha(datos.emitido, "emitido"));
  return lista.length === 0 ? null : armarErrores(lista, null);
}

function esCampoDocumento(campo: string | undefined): campo is CampoDocumento {
  return CAMPOS_DOCUMENTO.some((c) => c === campo);
}

/** Un error de negocio del comando, repartido para el formulario: al campo si es uno del diálogo; si no, general. */
export function erroresDeNegocio(error: ErrorDeNegocio): ErroresDeFormulario {
  if (esCampoDocumento(error.campo)) return armarErrores([{ campo: error.campo, mensaje: error.mensaje }], null);
  return armarErrores([], error.mensaje);
}

/** Solo un error general (para lo que falla antes o después de los campos: sin datos, sin permiso, guardado). */
export function errorGeneral(mensaje: string): ErroresDeFormulario {
  return armarErrores([], mensaje);
}
