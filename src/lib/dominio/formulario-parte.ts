// Formulario del parte diario (docs/diseno-ui.md, 5.11 a 5.15 y 6.5; reglas P3, P4, P10, P11, K1, K2). Todo lo que la pantalla necesita para el
// formulario, sin DOM y sin reglas nuevas: los valores del formulario son siempre texto; acá se convierten en un comando, se listan los faltantes en
// el orden del formulario, se reparten los errores por campo y se arman los textos de la barra de envío. Las reglas siguen en `parte.ts`,
// `kilometraje.ts` y `comandos.ts`.

import type { Comando } from "./comandos.ts";
import { armarErrores, type ErroresDeFormularioDe } from "./formulario.ts";
import { parsearKm, textoRecorrido } from "./kilometraje.ts";
import {
  ITEMS_CHECKLIST,
  faltantesDeCierre,
  faltantesDeRevision,
  parsearLitros,
  type CampoDeCierre,
  type CampoDeRevision,
  type CampoFaltante,
} from "./parte.ts";
import { TEXTO_FORMULARIO_PARTE as T } from "./textos-parte.ts";
import { formatearKm, textoFaltantes } from "./textos-base.ts";
import type { ErrorDeNegocio, ItemChecklist, NivelCombustible, Parte, RespuestaItem } from "./tipos.ts";
import { validarTextoDeBorrador } from "./validacion.ts";

/** Un campo del formulario: el conductor, el inicio y el fin del kilometraje, los diez puntos, el combustible, los litros y «Otra novedad». */
export type CampoParte = CampoFaltante | "litrosCargados";

/** Los dos pasos del parte (sección 17): la revisión antes de salir y el cierre de la jornada. */
export type PasoDelParte = "revision" | "cierre";

/** Los campos de la revisión (paso 1), en el orden del formulario (5.12). */
export const CAMPOS_DE_REVISION: readonly CampoDeRevision[] = ["conductor", "kmInicio", ...ITEMS_CHECKLIST.map((i) => i.id), "otraNovedad"];
/** Los campos del cierre (paso 2), en el orden del formulario. */
export const CAMPOS_DE_CIERRE: readonly (CampoDeCierre | "litrosCargados")[] = ["kmFin", "combustible", "litrosCargados"];

/**
 * El orden del formulario: primero la revisión y después el cierre. Es el del resumen de errores de cada paso (se filtra por paso) y el de las listas de
 * faltantes (P4).
 */
export const CAMPOS_PARTE: readonly CampoParte[] = [...CAMPOS_DE_REVISION, ...CAMPOS_DE_CIERRE];

function camposDelPaso(paso: PasoDelParte): readonly CampoParte[] {
  return paso === "revision" ? CAMPOS_DE_REVISION : CAMPOS_DE_CIERRE;
}

/** La respuesta a un punto del checklist: `""` es «sin responder». El texto escrito se conserva aunque se vuelva a «En orden» (por si se arrepiente). */
export interface ValoresItem {
  respuesta: "" | "en-orden" | "con-novedad";
  descripcion: string;
  impideUso: boolean;
}

export interface ValoresParte {
  /** El id del conductor; `""` = sin elegir. */
  conductorId: string;
  /** Texto con punto de miles (`84.320`) o como se escribió. */
  kmInicio: string;
  kmFin: string;
  checklist: Record<ItemChecklist, ValoresItem>;
  combustible: "" | NivelCombustible;
  /** `45,5`; vacío = no cargó (P10). */
  litros: string;
  /** Vacía y sin «Impide usar la unidad» = no hay otra novedad. */
  otraNovedad: { descripcion: string; impideUso: boolean };
}

export type ErroresDeParte = ErroresDeFormularioDe<CampoParte> & {
  /** El `h2` del resumen de errores: «Faltan 3 datos para enviar el parte». */
  titulo: string;
};

export type ComandoDeBorrador = Extract<Comando, { tipo: "guardarBorrador" }>;
export type ComandoDeCierre = Extract<Comando, { tipo: "guardarCierre" }>;

/** 5.13: los cinco niveles del selector, de la reserva al lleno. */
export const OPCIONES_COMBUSTIBLE: readonly { valor: NivelCombustible; etiqueta: string }[] = [
  { valor: "reserva", etiqueta: "Reserva" },
  { valor: "cuarto", etiqueta: "1/4" },
  { valor: "medio", etiqueta: "1/2" },
  { valor: "tres-cuartos", etiqueta: "3/4" },
  { valor: "lleno", etiqueta: "Lleno" },
];

// --- Valores -------------------------------------------------------------------------------------

function itemVacio(): ValoresItem {
  return { respuesta: "", descripcion: "", impideUso: false };
}

function checklistVacio(): Record<ItemChecklist, ValoresItem> {
  const lista = {} as Record<ItemChecklist, ValoresItem>;
  for (const i of ITEMS_CHECKLIST) lista[i.id] = itemVacio();
  return lista;
}

/**
 * P13: un formulario nuevo con el conductor ya elegido; todo lo demás, vacío. El kilometraje inicial NO se completa: el odómetro es justamente el dato que se
 * controla, y la ayuda del campo dice el último registro (K3 rechaza uno menor).
 */
export function valoresIniciales(entrada: { conductorId: string | null }): ValoresParte {
  return {
    conductorId: entrada.conductorId ?? "",
    kmInicio: "",
    kmFin: "",
    checklist: checklistVacio(),
    combustible: "",
    litros: "",
    otraNovedad: { descripcion: "", impideUso: false },
  };
}

function valoresDeRespuesta(r: RespuestaItem): ValoresItem {
  if (r.estado === "sin-responder") return itemVacio();
  if (r.estado === "en-orden") return { respuesta: "en-orden", descripcion: "", impideUso: false };
  return { respuesta: "con-novedad", descripcion: r.descripcion, impideUso: r.impideUso };
}

/** Los valores del formulario de un parte ya guardado (un borrador que se retoma, por ejemplo después de recargar). */
export function valoresDeParte(p: Parte): ValoresParte {
  const checklist = {} as Record<ItemChecklist, ValoresItem>;
  for (const i of ITEMS_CHECKLIST) checklist[i.id] = valoresDeRespuesta(p.checklist[i.id]);
  return {
    conductorId: p.conductorId ?? "",
    kmInicio: p.kmInicio === null ? "" : formatearKm(p.kmInicio),
    kmFin: p.kmFin === null ? "" : formatearKm(p.kmFin),
    checklist,
    combustible: p.combustible ?? "",
    litros: p.litrosCargados === null ? "" : String(p.litrosCargados).replace(".", ","),
    otraNovedad: p.otraNovedad === null ? { descripcion: "", impideUso: false } : { ...p.otraNovedad },
  };
}

function clave(v: ValoresParte): string {
  return JSON.stringify([
    v.conductorId,
    v.kmInicio,
    v.kmFin,
    ITEMS_CHECKLIST.map((i) => [v.checklist[i.id].respuesta, v.checklist[i.id].descripcion, v.checklist[i.id].impideUso]),
    v.combustible,
    v.litros,
    v.otraNovedad.descripcion,
    v.otraNovedad.impideUso,
  ]);
}

/** Igualdad por contenido: el autoguardado la usa para no escribir lo que ya está escrito. */
export function mismosValores(a: ValoresParte, b: ValoresParte): boolean {
  return clave(a) === clave(b);
}

// --- De los valores a los datos (P3) ---------------------------------------------------------------

type Datos = Pick<Parte, "conductorId" | "kmInicio" | "kmFin" | "combustible" | "litrosCargados" | "checklist" | "otraNovedad">;

interface Conversion {
  datos: Datos;
  /** Un error de formato por campo (P3): lo que no se puede guardar. */
  errores: Map<CampoParte, string>;
}

function convertir(v: ValoresParte, paso: PasoDelParte): Conversion {
  const errores = new Map<CampoParte, string>();
  const km = (texto: string, campo: "kmInicio" | "kmFin"): number | null => {
    if (texto.trim() === "") return null;
    const r = parsearKm(texto);
    if (r.ok) return r.valor;
    errores.set(campo, r.error.mensaje);
    return null;
  };
  const kmInicio = km(v.kmInicio, "kmInicio");
  const kmFin = km(v.kmFin, "kmFin");

  const litros = parsearLitros(v.litros);
  if (!litros.ok) errores.set("litrosCargados", litros.error.mensaje);

  const checklist = {} as Record<ItemChecklist, RespuestaItem>;
  for (const i of ITEMS_CHECKLIST) {
    const x = v.checklist[i.id];
    if (x.respuesta === "con-novedad") {
      const largo = validarTextoDeBorrador(x.descripcion, i.id);
      if (!largo.ok) errores.set(i.id, largo.error.mensaje);
      checklist[i.id] = { estado: "con-novedad", descripcion: x.descripcion, impideUso: x.impideUso };
    } else {
      checklist[i.id] = { estado: x.respuesta === "en-orden" ? "en-orden" : "sin-responder" };
    }
  }

  const o = v.otraNovedad;
  const hayOtra = o.descripcion.trim() !== "" || o.impideUso;
  if (hayOtra) {
    const largo = validarTextoDeBorrador(o.descripcion, "otraNovedad");
    if (!largo.ok) errores.set("otraNovedad", largo.error.mensaje);
  }

  // Solo cuentan los errores de formato del paso que se está completando: un dato del otro paso (por ejemplo, un `kmFin` viejo de un borrador) no bloquea.
  for (const campo of [...errores.keys()]) if (!camposDelPaso(paso).includes(campo)) errores.delete(campo);

  return {
    errores,
    datos: {
      conductorId: v.conductorId === "" ? null : v.conductorId,
      kmInicio,
      kmFin,
      combustible: v.combustible === "" ? null : v.combustible,
      litrosCargados: litros.ok ? litros.valor : null,
      checklist,
      otraNovedad: hayOtra ? { descripcion: o.descripcion, impideUso: o.impideUso } : null,
    },
  };
}

function enOrden(errores: Map<CampoParte, string>): { campo: CampoParte; mensaje: string }[] {
  const lista: { campo: CampoParte; mensaje: string }[] = [];
  for (const campo of CAMPOS_PARTE) {
    const mensaje = errores.get(campo);
    if (mensaje !== undefined) lista.push({ campo, mensaje });
  }
  return lista;
}

/** D1: hasta cuántos puntos sin completar se listan uno por uno en el resumen de errores. */
const PUNTOS_SIN_AGRUPAR = 3;

/**
 * D1: el resumen de errores con los puntos de la revisión sin completar agrupados. Un punto sin completar es el que no tiene respuesta o el «Con novedad» sin
 * descripción;
 * un texto demasiado largo es otro error y no se agrupa. Con más de 3, un solo enlace «Faltan 10 puntos de la revisión» (en el lugar del primero y apuntando a
 * él); con 3 o
 * menos, la lista queda como está.
 */
export function agruparResumen(lista: readonly { campo: CampoParte; mensaje: string }[]): { campo: CampoParte; mensaje: string }[] {
  const esPuntoSinCompletar = (x: { campo: CampoParte; mensaje: string }): boolean => {
    const punto = ITEMS_CHECKLIST.find((i) => i.id === x.campo);
    return punto !== undefined && (x.mensaje === T.itemSinResponder(punto.texto) || x.mensaje === T.itemSinDescripcion(punto.texto));
  };
  const puntos = lista.filter(esPuntoSinCompletar);
  if (puntos.length <= PUNTOS_SIN_AGRUPAR) return [...lista];
  const resumen: { campo: CampoParte; mensaje: string }[] = [];
  let agrupado = false;
  for (const x of lista) {
    if (!esPuntoSinCompletar(x)) resumen.push(x);
    else if (!agrupado) {
      resumen.push({ campo: x.campo, mensaje: T.faltanPuntos(puntos.length) });
      agrupado = true;
    }
  }
  return resumen;
}

function conTitulo(
  lista: { campo: CampoParte; mensaje: string }[],
  general: string | null,
  faltan: number,
  tituloGeneral: string = T.tituloGeneral,
  paso: PasoDelParte = "revision",
): ErroresDeParte {
  const base = armarErrores<CampoParte>(lista, general);
  let titulo: string;
  if (lista.length === 0) titulo = tituloGeneral;
  else if (faltan === lista.length) titulo = T.tituloFaltan(faltan, paso);
  else titulo = T.tituloRevise(lista.length, paso);
  return { ...base, titulo };
}

/**
 * P3: el comando que guarda el borrador. Solo se controla el formato de cada campo (un kilometraje con letras, litros con dos decimales, un texto de más
 * de 500 caracteres): con un error no se guarda nada y vuelve el error en el campo, en el orden del formulario. Los textos se guardan tal como se
 * escribieron; un punto «En orden» no lleva texto; «Otra novedad» vacía y sin «Impide usar la unidad» es `null`.
 */
export function comandoDeBorrador(
  unidadId: string,
  fecha: string,
  parteId: string | null,
  valores: ValoresParte,
): { ok: true; comando: ComandoDeBorrador } | { ok: false; errores: ErroresDeParte } {
  const { datos, errores } = convertir(valores, "revision");
  if (errores.size > 0) return { ok: false, errores: conTitulo(enOrden(errores), null, 0) };
  return {
    ok: true,
    comando: {
      tipo: "guardarBorrador",
      parteId,
      unidadId,
      fecha,
      conductorId: datos.conductorId,
      kmInicio: datos.kmInicio,
      kmFin: datos.kmFin,
      combustible: datos.combustible,
      litrosCargados: datos.litrosCargados,
      checklist: datos.checklist,
      otraNovedad: datos.otraNovedad,
    },
  };
}

/**
 * P3: el comando que guarda el cierre de un parte en uso (autoguardado del paso 2). Solo se controla el formato: con un error no se guarda nada y
 * vuelve el error en el campo. Los litros vacíos son `null` (no cargó).
 */
export function comandoDeCierre(parteId: string, valores: ValoresParte): { ok: true; comando: ComandoDeCierre } | { ok: false; errores: ErroresDeParte } {
  const { datos, errores } = convertir(valores, "cierre");
  if (errores.size > 0) return { ok: false, errores: conTitulo(enOrden(errores), null, 0, T.tituloGeneralCierre, "cierre") };
  return { ok: true, comando: { tipo: "guardarCierre", parteId, kmFin: datos.kmFin, combustible: datos.combustible, litrosCargados: datos.litrosCargados } };
}

// --- Qué falta para enviar la revisión o cerrar (P4) -------------------------------------------------

/**
 * P4: lo que falta para enviar la revisión (o cerrar el parte), en el orden del formulario. Un campo con un error de formato no cuenta: es otro problema (ver
 * `validarParaEnviar`).
 */
export function faltantesDeValores(v: ValoresParte, paso: PasoDelParte = "revision"): CampoFaltante[] {
  const { datos, errores } = convertir(v, paso);
  const faltan: CampoFaltante[] = paso === "revision" ? faltantesDeRevision(datos) : faltantesDeCierre(datos);
  return faltan.filter((c) => !errores.has(c));
}

function mensajeDeFaltante(campo: CampoFaltante, v: ValoresParte): string {
  if (campo === "conductor" || campo === "kmInicio" || campo === "kmFin" || campo === "combustible" || campo === "otraNovedad") return T.faltante[campo];
  const punto = ITEMS_CHECKLIST.find((i) => i.id === campo)?.texto ?? campo;
  return v.checklist[campo].respuesta === "con-novedad" ? T.itemSinDescripcion(punto) : T.itemSinResponder(punto);
}

/**
 * 5.15: todo lo que impide enviar la revisión (o cerrar el parte), en el orden del formulario: los faltantes de P4 y los errores de formato. `null` si se puede
 * intentar
 * el envío (las reglas de licencia, kilometraje, fecha y unidad las dice el comando). El `titulo` es el del resumen de ese paso.
 */
export function validarParaEnviar(v: ValoresParte, paso: PasoDelParte = "revision"): ErroresDeParte | null {
  const { datos, errores } = convertir(v, paso);
  const faltan = (paso === "revision" ? faltantesDeRevision(datos) : faltantesDeCierre(datos)).filter((c) => !errores.has(c));
  const todos = new Map(errores);
  for (const c of faltan) todos.set(c, mensajeDeFaltante(c, v));
  if (todos.size === 0) return null;
  return conTitulo(enOrden(todos), null, faltan.length, paso === "revision" ? T.tituloGeneral : T.tituloGeneralCierre, paso);
}

/**
 * Un error del comando, repartido para el formulario: al campo si lo es (K2, K3, K4; L1 va al campo Conductor); si no, general (P2, P8, guardado). Con
 * `paso` el título de lo general es el del paso.
 */
export function erroresDeNegocioParte(error: ErrorDeNegocio, paso: PasoDelParte = "revision"): ErroresDeParte {
  const campoDeError = error.campo === "conductorId" ? "conductor" : error.campo;
  const campo = CAMPOS_PARTE.find((c) => c === campoDeError);
  const tituloGeneral = paso === "revision" ? T.tituloGeneral : T.tituloGeneralCierre;
  if (campo === undefined) return conTitulo([], error.mensaje, 0, tituloGeneral, paso);
  return conTitulo([{ campo, mensaje: error.mensaje }], null, 0, tituloGeneral, paso);
}

/**
 * m3 (accesibilidad): un error de regla del kilometraje (K3, K4) que el comando todavía no llegó a decir porque faltan datos se suma al resumen de los
 * faltantes, en su lugar del
 * formulario, para que la persona vea todo junto y no de a uno al ir corrigiendo. Si ese campo ya tiene un error (formato o faltante), no se pisa.
 */
export function sumarErrorDeRegla(v: ValoresParte, previos: ErroresDeParte, regla: ErrorDeNegocio, paso: PasoDelParte = "revision"): ErroresDeParte {
  const campo = CAMPOS_PARTE.find((c) => c === regla.campo);
  if (campo === undefined || previos.lista.some((x) => x.campo === campo)) return previos;
  const lista = [...previos.lista, { campo, mensaje: regla.mensaje }].sort((a, b) => CAMPOS_PARTE.indexOf(a.campo) - CAMPOS_PARTE.indexOf(b.campo));
  return conTitulo(lista, previos.general, faltantesDeValores(v, paso).length, paso === "revision" ? T.tituloGeneral : T.tituloGeneralCierre, paso);
}

/**
 * Solo un error general (sin datos, sin permiso, guardado fallido, algo que cambió en otra pestaña). El título por defecto es el del envío de la revisión;
 * otras acciones pasan el suyo.
 */
export function errorGeneralParte(mensaje: string, titulo: string = T.tituloGeneral): ErroresDeParte {
  return conTitulo([], mensaje, 0, titulo);
}

// --- Lo que muestra el formulario ------------------------------------------------------------------

/**
 * Barra de envío (5.14): «Faltan 5 datos» o «Listo para enviar» («Listo para cerrar» en el cierre). Cuenta también lo que tiene un error de formato.
 * `camposDelIntento` son los campos con error del último intento de envío que siguen vigentes (la persona no los tocó): si alguno no es un faltante ni un error
 * de
 * formato (una regla: la licencia, el kilometraje), la barra dice «Revise N datos» —el mismo N que el título del resumen— en lugar de «Listo para enviar».
 * `lista` dice si
 * la vista puede mostrar el tilde.
 */
export function barraDeEnvio(
  v: ValoresParte,
  paso: PasoDelParte = "revision",
  camposDelIntento: readonly CampoParte[] = [],
): { texto: string; lista: boolean } {
  const actuales = new Set((validarParaEnviar(v, paso)?.lista ?? []).map((x) => x.campo));
  const deReglas = new Set(camposDelIntento.filter((c) => !actuales.has(c)));
  const n = actuales.size + deReglas.size;
  if (n === 0) return { texto: paso === "revision" ? T.barraLista : T.barraListaCierre, lista: true };
  return { texto: deReglas.size > 0 ? T.barraRevise(n) : textoFaltantes(n), lista: false };
}

/** «Respondidos: 3 de 14» (5.12). */
export function respondidos(v: ValoresParte): number {
  return ITEMS_CHECKLIST.filter((i) => v.checklist[i.id].respuesta !== "").length;
}

/**
 * `<output>` del recorrido (6.5): «132 km», «Sin uso», o «—» si falta un dato, no es un número o el fin es menor que el inicio (K2 lo dice en «Al terminar»).
 */
export function recorridoDe(kmInicio: string, kmFin: string): string {
  const inicio = parsearKm(kmInicio);
  const fin = parsearKm(kmFin);
  if (!inicio.ok || !fin.ok || fin.valor < inicio.valor) return T.sinRecorrido;
  return textoRecorrido(fin.valor - inicio.valor);
}

/** 5.11: al salir del campo el kilometraje se reformatea con punto de miles (`84320` → `84.320`); lo que no es un entero bien escrito se deja como está. */
export { reformatearKm } from "./kilometraje.ts";
