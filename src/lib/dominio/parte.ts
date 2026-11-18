// Parte diario (P2, P4, P5, P9 a P11, P13) y advertencias de envío (K6, K7, P9).

import { diasEntre, parsearFechaCivil } from "./fechas.ts";
import { advertenciasDeKm, type EntradaKm } from "./kilometraje.ts";
import { ERRORES, NOMBRES_ITEM_CHECKLIST, errLitrosExcedidos, errLitrosInvalidos } from "./textos.ts";
import { hayDocumentoQueAmpare, tiposObligatoriosDeUnidad } from "./vencimientos.ts";
import {
  fallo,
  ok,
  type Advertencia,
  type Conductor,
  type Documento,
  type FechaCivil,
  type Instante,
  type ItemChecklist,
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

/** Campos que pueden faltar para enviar, con el nombre que usa el formulario. */
export type CampoFaltante = "conductor" | "kmInicio" | "kmFin" | ItemChecklist | "combustible" | "otraNovedad";

function descripcionValida(texto: string): boolean {
  const largo = texto.trim().length;
  return largo >= DESCRIPCION_MINIMO && largo <= DESCRIPCION_MAXIMO;
}

/** Lo que P4 mira de un parte: sirve igual para un `Parte` guardado y para los valores de un formulario ya convertidos. */
export type DatosParaEnviar = Pick<Parte, "conductorId" | "kmInicio" | "kmFin" | "checklist" | "combustible" | "otraNovedad">;

/** P4: lo que falta para poder enviar el parte, en el orden del formulario. Vacío = se puede enviar. */
export function faltantesParaEnviar(parte: DatosParaEnviar): CampoFaltante[] {
  const faltan: CampoFaltante[] = [];
  if (parte.conductorId === null) faltan.push("conductor");
  if (parte.kmInicio === null) faltan.push("kmInicio");
  if (parte.kmFin === null) faltan.push("kmFin");
  for (const item of ITEMS_CHECKLIST) {
    const r: RespuestaItem = parte.checklist[item.id];
    if (r.estado === "sin-responder") faltan.push(item.id);
    else if (r.estado === "con-novedad" && !descripcionValida(r.descripcion)) faltan.push(item.id);
  }
  if (parte.combustible === null) faltan.push("combustible");
  if (parte.otraNovedad !== null && !descripcionValida(parte.otraNovedad.descripcion)) faltan.push("otraNovedad");
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
      descripcion: r.descripcion.trim(),
      gravedad: item.critico || r.impideUso ? "critica" : "normal",
    });
  }
  if (parte.otraNovedad !== null) {
    novedades.push({
      item: "otra",
      descripcion: parte.otraNovedad.descripcion.trim(),
      gravedad: parte.otraNovedad.impideUso ? "critica" : "normal",
    });
  }
  return novedades;
}

export interface EntradaDocumentacion {
  fecha: FechaCivil;
  unidad: Unidad;
  proyecto: Proyecto;
  conductor: Conductor | null;
  documentos: readonly Documento[];
}

/**
 * P9: documentos obligatorios que no amparaban la fecha del parte (los de la unidad y la licencia del conductor): vencidos
 * o faltantes **como estaban ese día** (M1), no según el documento vigente de hoy. Un documento que vence ese mismo día
 * todavía vale (V2). Si no hay conductor (borrador) no se mira la licencia.
 */
export function documentacionVencidaEn(entrada: EntradaDocumentacion): TipoDocumento[] {
  const { fecha, unidad, proyecto, conductor, documentos } = entrada;
  const problemas: TipoDocumento[] = [];
  for (const tipo of tiposObligatoriosDeUnidad(proyecto)) {
    if (!hayDocumentoQueAmpare(documentos, { tipo: "unidad", id: unidad.id }, tipo, fecha)) problemas.push(tipo);
  }
  if (conductor !== null && !hayDocumentoQueAmpare(documentos, { tipo: "conductor", id: conductor.id }, "licencia", fecha)) {
    problemas.push("licencia");
  }
  return problemas;
}

export interface EntradaAdvertencias extends EntradaKm {
  documentacionVencida: TipoDocumento[];
}

/** K6, K7 y P9: todo lo que hay que aceptar antes de enviar. */
export function advertenciasDeEnvio(entrada: EntradaAdvertencias): Advertencia[] {
  const advertencias = advertenciasDeKm(entrada);
  if (entrada.documentacionVencida.length > 0) {
    advertencias.push({ tipo: "documentacion-vencida", documentos: [...entrada.documentacionVencida] });
  }
  return advertencias;
}

/** P13: el conductor del parte es el del perfil elegido o, si es el encargado, el asignado a la unidad. */
export function conductorParaParte(perfil: Perfil, unidad: Unidad): string | null {
  return perfil.tipo === "conductor" ? perfil.conductorId : unidad.conductorId;
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
  const sinRespuestas = ITEMS_CHECKLIST.every((i) => parte.checklist[i.id].estado === "sin-responder");
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
