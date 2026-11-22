// Parte diario en dos pasos (P2 a P4, P9 a P11, P13, P16; sección 17): revisión antes de salir y cierre; advertencias (K6, K7, P9).

import { diasEntre, parsearFechaCivil, parsearInstante } from "./fechas.ts";
import { KM_MAXIMO, advertenciasDeSalida } from "./kilometraje.ts";
import { largoEnCaracteres, normalizarTexto } from "./texto.ts";
import { formatearPatente } from "./patente.ts";
import { ERRORES, NOMBRES_DOCUMENTO, NOMBRES_ITEM_CHECKLIST, errLitrosExcedidos, errLitrosInvalidos, renglonesDeAvisoAceptado, type ContextoDeDocumentacion, type RenglonDeAviso } from "./textos.ts";
import { estadoDeLicencia, hayDocumentoQueAmpare, inicioDeDocumento, tiposObligatoriosDeUnidad } from "./vencimientos.ts";
import {
  fallo,
  ok,
  type Advertencia,
  type Documento,
  type Estado,
  type FechaCivil,
  type Instante,
  type ItemChecklist,
  type NivelCombustible,
  type Parte,
  type Perfil,
  type Proyecto,
  type Resultado,
  type RespuestaItem,
  type TipoDocumento,
  type Unidad,
} from "./tipos.ts";

export interface ItemInfo {
  id: ItemChecklist;
  texto: string;
  critico: boolean;
}

/** 5.2: los diez ítems del checklist, en este orden. */
export const ITEMS_CHECKLIST: readonly ItemInfo[] = [
  { id: "frenos", texto: NOMBRES_ITEM_CHECKLIST.frenos, critico: true },
  { id: "direccion", texto: NOMBRES_ITEM_CHECKLIST.direccion, critico: true },
  { id: "neumaticos", texto: NOMBRES_ITEM_CHECKLIST.neumaticos, critico: true },
  { id: "luces", texto: NOMBRES_ITEM_CHECKLIST.luces, critico: true },
  { id: "cinturones", texto: NOMBRES_ITEM_CHECKLIST.cinturones, critico: true },
  { id: "niveles", texto: NOMBRES_ITEM_CHECKLIST.niveles, critico: false },
  { id: "matafuego", texto: NOMBRES_ITEM_CHECKLIST.matafuego, critico: false },
  { id: "botiquin", texto: NOMBRES_ITEM_CHECKLIST.botiquin, critico: false },
  { id: "documentacion", texto: NOMBRES_ITEM_CHECKLIST.documentacion, critico: false },
  { id: "cabina", texto: NOMBRES_ITEM_CHECKLIST.cabina, critico: false },
];

export const DIAS_ATRAS_PARTE = 7;
const NIVELES: readonly NivelCombustible[] = ["reserva", "cuarto", "medio", "tres-cuartos", "lleno"];
export const LITROS_MAXIMO = 200;
export const DESCRIPCION_MINIMO = 3;
export const DESCRIPCION_MAXIMO = 500;

/** P2: la fecha del parte no puede ser futura ni anterior a hoy - 7. */
export function validarFechaParte(texto: string, hoy: FechaCivil): Resultado<FechaCivil> {
  const fecha = parsearFechaCivil(texto);
  if (fecha === null) return fallo("parte-fecha-invalida", ERRORES.fechaInvalida, { campo: "fecha" });
  const d = diasEntre(hoy, fecha);
  if (d > 0) return fallo("parte-fecha-futura", ERRORES.fechaFutura, { campo: "fecha" });
  if (d < -DIAS_ATRAS_PARTE) {
    return fallo("parte-fecha-antigua", ERRORES.parteFechaAntigua, { campo: "fecha" });
  }
  return ok(fecha);
}

/** P10: vacío = no cargó (`null`); si no, mayor que 0, hasta 200 y con hasta 1 decimal (coma o punto). */
export function parsearLitros(texto: string): Resultado<number | null> {
  const t = texto.trim();
  if (t === "") return ok(null);
  const m = t.length <= 20 ? /^(\d+)(?:[.,](\d+))?$/.exec(t) : null;
  if (m === null) {
    return fallo("litros-no-numerico", ERRORES.litrosNoNumerico, { campo: "litrosCargados" });
  }
  const decimales = m[2] ?? "";
  // `1.000` o `1,000`: quien lo escribe quiso decir mil (con separador de miles), y mil supera el máximo; no es un número con tres decimales.
  if (decimales.length === 3 && /^[1-9]\d{0,2}$/.test(m[1] ?? "")) {
    return fallo("litros-excedidos", errLitrosExcedidos(LITROS_MAXIMO), { campo: "litrosCargados" });
  }
  if (decimales.length > 1) {
    return fallo("litros-decimales", ERRORES.litrosDecimales, { campo: "litrosCargados" });
  }
  const valor = Number(`${m[1]}.${decimales === "" ? "0" : decimales}`);
  if (valor === 0) {
    return fallo("litros-cero", ERRORES.litrosCero, { campo: "litrosCargados" });
  }
  if (valor > LITROS_MAXIMO) {
    return fallo("litros-excedidos", errLitrosExcedidos(LITROS_MAXIMO), { campo: "litrosCargados" });
  }
  return ok(valor);
}

/** P10, ya convertido a número (borrador): más de 0, hasta 200 y con hasta un decimal. */
export function validarLitros(litros: number): Resultado<number> {
  const valido = Number.isFinite(litros) && litros > 0 && litros <= LITROS_MAXIMO && Math.abs(litros * 10 - Math.round(litros * 10)) < 1e-9;
  return valido ? ok(litros) : fallo("litros-invalidos", errLitrosInvalidos(LITROS_MAXIMO), { campo: "litrosCargados" });
}

/** Campos de la revisión antes de salir (paso 1) que pueden faltar, con el nombre que usa el formulario. */
export type CampoDeRevision = "conductor" | "kmInicio" | ItemChecklist | "otraNovedad";
/** Campos del cierre (paso 2) que pueden faltar. */
export type CampoDeCierre = "kmFin" | "combustible";
/** Campos que pueden faltar en alguno de los dos pasos. */
export type CampoFaltante = CampoDeRevision | CampoDeCierre;

function descripcionValida(texto: string): boolean {
  const largo = largoEnCaracteres(normalizarTexto(texto));
  return largo >= DESCRIPCION_MINIMO && largo <= DESCRIPCION_MAXIMO;
}

/** Lo que P4 mira de la revisión: sirve igual para un `Parte` guardado y para los valores de un formulario ya convertidos. */
export type DatosDeRevision = Pick<Parte, "conductorId" | "kmInicio" | "checklist" | "otraNovedad">;
/** Lo que P4 mira del cierre. */
export type DatosDeCierre = Pick<Parte, "kmFin" | "combustible">;

/** P4 (revisión): lo que falta para enviar la revisión antes de salir, en el orden del formulario. Vacío = se puede enviar. */
export function faltantesDeRevision(parte: DatosDeRevision): CampoDeRevision[] {
  const faltan: CampoDeRevision[] = [];
  if (parte.conductorId === null) faltan.push("conductor");
  if (parte.kmInicio === null) faltan.push("kmInicio");
  for (const item of ITEMS_CHECKLIST) {
    const r: RespuestaItem = parte.checklist[item.id];
    if (r.estado === "sin-responder") faltan.push(item.id);
    else if (r.estado === "con-novedad" && !descripcionValida(r.descripcion)) faltan.push(item.id);
  }
  if (parte.otraNovedad !== null && !descripcionValida(parte.otraNovedad.descripcion)) faltan.push("otraNovedad");
  return faltan;
}

/** P4 (cierre): lo que falta para cerrar el parte, en el orden del formulario. */
export function faltantesDeCierre(parte: DatosDeCierre): CampoDeCierre[] {
  const faltan: CampoDeCierre[] = [];
  if (parte.kmFin === null) faltan.push("kmFin");
  if (parte.combustible === null) faltan.push("combustible");
  return faltan;
}

export interface NovedadDelParte {
  item: ItemChecklist | "otra";
  descripcion: string;
  gravedad: "critica" | "normal";
}

/** P11: las novedades que abre un parte, en el orden del formulario y con la descripción recortada (U7). */
export function novedadesDelParte(parte: Parte): NovedadDelParte[] {
  const novedades: NovedadDelParte[] = [];
  for (const item of ITEMS_CHECKLIST) {
    const r = parte.checklist[item.id];
    if (r.estado !== "con-novedad") continue;
    novedades.push({
      item: item.id,
      descripcion: normalizarTexto(r.descripcion),
      gravedad: item.critico || r.impideUso ? "critica" : "normal",
    });
  }
  if (parte.otraNovedad !== null) {
    novedades.push({
      item: "otra",
      descripcion: normalizarTexto(parte.otraNovedad.descripcion),
      gravedad: parte.otraNovedad.impideUso ? "critica" : "normal",
    });
  }
  return novedades;
}

/**
 * A1: el parte en uso más antiguo de la unidad con fecha anterior a `fecha` (sin `fecha`, el más antiguo de todos). Mientras exista, no se puede enviar la
 * revisión de una fecha posterior de esa unidad, corregir su kilometraje desde ese día ni darla de baja: primero hay que cerrarlo.
 */
export function partePendienteDeCierre(partes: readonly Parte[], unidadId: string, fecha?: FechaCivil): Parte | undefined {
  let mas: Parte | undefined;
  for (const p of partes) {
    if (p.unidadId !== unidadId || p.estado !== "en-uso" || (fecha !== undefined && p.fecha >= fecha)) continue;
    if (mas === undefined || p.fecha < mas.fecha) mas = p;
  }
  return mas;
}

/**
 * P20: el parte en uso más antiguo de un conductor en una unidad que no es `exceptoUnidadId` (de cualquier fecha), sin contar las unidades de baja (su parte ya no se puede
 * cerrar, A7). Mientras exista, el conductor no puede enviar la revisión de otra unidad: primero cierra el parte anterior.
 */
export function parteEnUsoDelConductor(estado: Pick<Estado, "partes" | "unidades">, conductorId: string, exceptoUnidadId: string): Parte | undefined {
  const deBaja = new Set(estado.unidades.filter((u) => u.estado.tipo === "baja").map((u) => u.id));
  let mas: Parte | undefined;
  for (const p of estado.partes) {
    if (p.conductorId !== conductorId || p.estado !== "en-uso" || p.unidadId === exceptoUnidadId || deBaja.has(p.unidadId)) continue;
    if (mas === undefined || p.fecha < mas.fecha) mas = p;
  }
  return mas;
}

export interface EntradaDocumentacion {
  fecha: FechaCivil;
  unidad: Unidad;
  proyecto: Proyecto;
  documentos: readonly Documento[];
}

/**
 * P9: documentos obligatorios **de la unidad** que no amparaban la fecha del parte: vencidos o faltantes **como estaban ese día** (M1), no según el
 * documento vigente de hoy. Un documento que vence ese mismo día todavía vale (V2). La licencia del conductor ya no entra acá: bloquea la revisión (L1).
 */
export function documentacionVencidaEn(entrada: EntradaDocumentacion): TipoDocumento[] {
  const { fecha, unidad, proyecto, documentos } = entrada;
  return tiposObligatoriosDeUnidad(proyecto).filter((tipo) => !hayDocumentoQueAmpare(documentos, { tipo: "unidad", id: unidad.id }, tipo, fecha));
}

/** Los documentos obligatorios de una unidad, en el orden en que se muestran: los que puede decir un aviso de P9. */
const TIPOS_DE_DOCUMENTO_DE_UNIDAD: readonly TipoDocumento[] = ["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"];

/**
 * C6: cómo estaba cada documento de la unidad el día del parte, para los textos de P9: la fecha en que venció (la más tardía de los documentos que ya valían ese día y ya
 * habían vencido) o `null` si no había ninguno. Como `documentacionVencidaEn`, mira los documentos como estaban ese día (M1): una renovación cargada después no borra el hecho.
 */
export function contextoDeDocumentacion(documentos: readonly Documento[], unidad: Pick<Unidad, "id" | "patente">, fecha: FechaCivil): ContextoDeDocumentacion {
  const venceron: Partial<Record<TipoDocumento, FechaCivil | null>> = {};
  for (const tipo of TIPOS_DE_DOCUMENTO_DE_UNIDAD) {
    let vencio: FechaCivil | null = null;
    for (const d of documentos) {
      if (d.tipo !== tipo || d.titular.tipo !== "unidad" || d.titular.id !== unidad.id) continue;
      if (inicioDeDocumento(d) <= fecha && d.vence < fecha && (vencio === null || d.vence > vencio)) vencio = d.vence;
    }
    venceron[tipo] = vencio;
  }
  return { patente: formatearPatente(unidad.patente), venceron };
}

/**
 * P19: el parte de hoy de la unidad si quedó cerrado sin salida (novedad crítica en la revisión). Ese parte cierra el día de la unidad: aunque el encargado resuelva la novedad y la
 * devuelva a servicio, no sale hasta mañana. Es el ÚNICO lugar que lo decide: la aptitud lo lee (y con ella la ficha, la flota y el centro de alertas), igual que el inicio del
 * conductor y los diálogos de resolver y de volver a servicio. Los registros rotos se ignoran.
 */
export function parteSinSalidaDeHoy(partes: readonly Parte[], unidadId: string, hoy: FechaCivil): Parte | undefined {
  for (const cruda of partes) {
    // Primero lo barato, con el registro como llegó: son cientos de partes y esto corre por cada unidad en cada cálculo.
    if (!esObjeto(cruda) || cruda["unidadId"] !== unidadId || cruda["fecha"] !== hoy) continue;
    const p = parteLegible(cruda);
    if (p !== null && p.estado === "enviado" && p.sinSalida) return p;
  }
  return undefined;
}

/**
 * Los avisos que se aceptaron al enviar un parte, ya en renglones con su tono (C6, M2): un renglón por documento vencido y uno por cada aviso de kilómetros. Los de documentación
 * dicen cómo estaba cada documento de la unidad el día del parte.
 */
export function renglonesDeAvisosAceptados(parte: Pick<Parte, "advertenciasAceptadas" | "fecha">, unidad: Pick<Unidad, "id" | "patente"> | undefined, documentos: readonly Documento[]): RenglonDeAviso[] {
  const contexto = unidad === undefined ? undefined : contextoDeDocumentacion(documentos, unidad, parte.fecha);
  return parte.advertenciasAceptadas.flatMap((a) => renglonesDeAvisoAceptado(a, contexto));
}

/** K6 y P9: lo que hay que aceptar antes de enviar la revisión. */
export function advertenciasDeRevision(entrada: { kmAnterior: number | null; kmInicio: number; documentacionVencida: TipoDocumento[] }): Advertencia[] {
  const advertencias = advertenciasDeSalida(entrada);
  if (entrada.documentacionVencida.length > 0) {
    advertencias.push({ tipo: "documentacion-vencida", documentos: [...entrada.documentacionVencida] });
  }
  return advertencias;
}

/**
 * P13, L1: el conductor del parte. Perfil Conductor: el del perfil, siempre (el bloqueo de la licencia se muestra aparte). Perfil Encargado: el asignado a
 * la unidad solo si su licencia ampara la fecha del parte; si no, `null` («Elija quién conduce»).
 */
export function conductorParaParte(perfil: Perfil, unidad: Unidad, documentos: readonly Documento[], fecha: FechaCivil): string | null {
  if (perfil.tipo === "conductor") return perfil.conductorId;
  if (unidad.conductorId === null) return null;
  return estadoDeLicencia(documentos, unidad.conductorId, fecha).vigente ? unidad.conductorId : null;
}

export interface EntradaBorrador {
  id: string;
  unidad: Unidad;
  fecha: FechaCivil;
  kmActual: number | null;
  conductorId: string | null;
  ahora: Instante;
  autor: string;
}

/** P13: borrador nuevo con el kilometraje inicial y el conductor ya completados. */
export function nuevoBorrador(entrada: EntradaBorrador): Parte {
  const sin: RespuestaItem = { estado: "sin-responder" };
  return {
    id: entrada.id,
    unidadId: entrada.unidad.id,
    fecha: entrada.fecha,
    conductorId: entrada.conductorId,
    estado: "borrador",
    revisado: null,
    sinSalida: false,
    kmInicio: entrada.kmActual,
    kmFin: null,
    combustible: null,
    litrosCargados: null,
    checklist: {
      frenos: sin,
      direccion: sin,
      neumaticos: sin,
      luces: sin,
      cinturones: sin,
      niveles: sin,
      matafuego: sin,
      botiquin: sin,
      documentacion: sin,
      cabina: sin,
    },
    otraNovedad: null,
    advertenciasAceptadas: [],
    documentacionVencida: [],
    creado: entrada.ahora,
    actualizado: entrada.ahora,
    enviado: null,
    autor: entrada.autor,
  };
}

/**
 * D11: un borrador "vacío" es el que se abrió y no se escribió nada (el kilometraje inicial y el conductor vienen
 * completados por P13): guardarlo o descartarlo no cuenta como un cambio del visitante.
 */
export function esBorradorVacio(parte: Parte, kmActualDeLaUnidad: number | null): boolean {
  // `?.`: un borrador con la forma rota (almacenamiento editado a mano) no es «vacío», pero tampoco tiene que impedir descartarlo.
  const sinRespuestas = ITEMS_CHECKLIST.every((i) => (parte.checklist as Partial<Parte["checklist"]> | undefined)?.[i.id]?.estado === "sin-responder");
  const kmInicioPropio = parte.kmInicio !== null && parte.kmInicio !== kmActualDeLaUnidad;
  return (
    sinRespuestas &&
    !kmInicioPropio &&
    parte.kmFin === null &&
    parte.combustible === null &&
    parte.litrosCargados === null &&
    parte.otraNovedad === null
  );
}

// ---------------------------------------------------------------------------------------------
// Lectura tolerante de un parte guardado
// ---------------------------------------------------------------------------------------------

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function kmLegible(valor: unknown): number | null {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 0 && valor <= KM_MAXIMO ? valor : null;
}

function nivelLegible(valor: unknown): NivelCombustible | null {
  return NIVELES.find((n) => n === valor) ?? null;
}

function tipoDeDocumentoLegible(valor: unknown): valor is TipoDocumento {
  return typeof valor === "string" && Object.hasOwn(NOMBRES_DOCUMENTO, valor);
}

function respuestaLegible(valor: unknown): RespuestaItem {
  if (!esObjeto(valor)) return { estado: "sin-responder" };
  if (valor["estado"] === "en-orden") return { estado: "en-orden" };
  if (valor["estado"] === "con-novedad") {
    return {
      estado: "con-novedad",
      descripcion: typeof valor["descripcion"] === "string" ? valor["descripcion"] : "",
      impideUso: valor["impideUso"] === true,
    };
  }
  return { estado: "sin-responder" };
}

function advertenciaLegible(valor: unknown): Advertencia | null {
  if (!esObjeto(valor)) return null;
  const km = valor["km"];
  if ((valor["tipo"] === "salto-km" || valor["tipo"] === "recorrido-largo") && typeof km === "number" && Number.isFinite(km)) {
    return { tipo: valor["tipo"], km };
  }
  if (valor["tipo"] === "documentacion-vencida" && Array.isArray(valor["documentos"])) {
    return { tipo: "documentacion-vencida", documentos: valor["documentos"].filter(tipoDeDocumentoLegible) };
  }
  return null;
}

/** Las advertencias que se pueden leer de un valor de afuera (el detalle de un error, un parte guardado); lo que no es una advertencia se descarta. */
export function advertenciasLegibles(valor: unknown): Advertencia[] {
  return Array.isArray(valor) ? valor.map(advertenciaLegible).filter((a): a is Advertencia => a !== null) : [];
}

function instanteLegible(valor: unknown): string | null {
  return typeof valor === "string" && parsearInstante(valor) !== null ? valor : null;
}

/**
 * Lo que se puede leer de un parte guardado. Los datos del almacenamiento son entrada externa (se pueden editar desde las herramientas del navegador, o
 * venir de otra versión del código que pasó la revisión mínima de D7): las pantallas del parte pasan todo por acá y nunca ven un campo con la forma rota.
 * Lo que no se puede leer queda vacío (`null`, «sin responder», lista vacía; un instante ilegible queda `""`): no se inventa nada. `null` si no hay ni
 * identificador, unidad, fecha o estado: ese registro no es un parte.
 */
export function parteLegible(crudo: unknown): Parte | null {
  if (!esObjeto(crudo)) return null;
  const { id, unidadId, fecha, estado } = crudo;
  if (typeof id !== "string" || id === "" || typeof unidadId !== "string" || typeof fecha !== "string" || parsearFechaCivil(fecha) === null) return null;
  if (estado !== "borrador" && estado !== "en-uso" && estado !== "enviado") return null;

  const lista = esObjeto(crudo["checklist"]) ? crudo["checklist"] : {};
  const checklist = {} as Parte["checklist"];
  for (const item of ITEMS_CHECKLIST) checklist[item.id] = respuestaLegible(lista[item.id]);

  const otra = crudo["otraNovedad"];
  const litros = crudo["litrosCargados"];
  const combustible = crudo["combustible"];
  const kmInicio = kmLegible(crudo["kmInicio"]);
  const kmFin = kmLegible(crudo["kmFin"]);
  return {
    id,
    unidadId,
    fecha,
    conductorId: typeof crudo["conductorId"] === "string" ? crudo["conductorId"] : null,
    estado,
    // Un parte en uso sin `revisado` legible se sigue leyendo como en uso: no se inventa la hora.
    revisado: instanteLegible(crudo["revisado"]),
    sinSalida: crudo["sinSalida"] === true,
    kmInicio,
    // Un recorrido negativo no existe (K3): si el final es menor que el inicial no se lee, para no dibujar «-20 km».
    kmFin: kmFin !== null && kmInicio !== null && kmFin < kmInicio ? null : kmFin,
    combustible: nivelLegible(combustible),
    litrosCargados: typeof litros === "number" && validarLitros(litros).ok ? litros : null,
    checklist,
    otraNovedad:
      esObjeto(otra) && typeof otra["descripcion"] === "string" ? { descripcion: otra["descripcion"], impideUso: otra["impideUso"] === true } : null,
    advertenciasAceptadas: advertenciasLegibles(crudo["advertenciasAceptadas"]),
    documentacionVencida: Array.isArray(crudo["documentacionVencida"]) ? crudo["documentacionVencida"].filter(tipoDeDocumentoLegible) : [],
    creado: instanteLegible(crudo["creado"]) ?? "",
    actualizado: instanteLegible(crudo["actualizado"]) ?? "",
    enviado: instanteLegible(crudo["enviado"]),
    autor: typeof crudo["autor"] === "string" ? crudo["autor"] : "",
  };
}
