// Parte diario (P2, P4, P5, P9 a P11, P13) y advertencias de envío (K6, K7, P9).

import { diasEntre, fechaEnArgentina, parsearFechaCivil } from "./fechas.ts";
import { advertenciasDeKm, type EntradaKm } from "./kilometraje.ts";
import { documentoVigente, faltantesDeConductor, tiposObligatoriosDeUnidad } from "./vencimientos.ts";
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
  { id: "frenos", texto: "Frenos", critico: true },
  { id: "direccion", texto: "Dirección", critico: true },
  { id: "neumaticos", texto: "Neumáticos y rueda de auxilio", critico: true },
  { id: "luces", texto: "Luces y balizas", critico: true },
  { id: "cinturones", texto: "Cinturones de seguridad", critico: true },
  { id: "niveles", texto: "Niveles de aceite y agua", critico: false },
  { id: "matafuego", texto: "Matafuego a bordo", critico: false },
  { id: "botiquin", texto: "Botiquín y kit de emergencia", critico: false },
  { id: "documentacion", texto: "Documentación a bordo", critico: false },
  { id: "cabina", texto: "Orden y limpieza de la cabina", critico: false },
];

export const DIAS_ATRAS_PARTE = 7;
export const LITROS_MAXIMO = 200;
export const DESCRIPCION_MINIMO = 3;
export const DESCRIPCION_MAXIMO = 500;

/** P2: la fecha del parte no puede ser futura ni anterior a hoy - 7. */
export function validarFechaParte(texto: string, hoy: FechaCivil): Resultado<FechaCivil> {
  const fecha = parsearFechaCivil(texto);
  if (fecha === null) return fallo("parte-fecha-invalida", "Escriba una fecha válida.", { campo: "fecha" });
  const d = diasEntre(hoy, fecha);
  if (d > 0) return fallo("parte-fecha-futura", "La fecha no puede ser posterior a hoy.", { campo: "fecha" });
  if (d < -DIAS_ATRAS_PARTE) {
    return fallo("parte-fecha-antigua", "Solo se pueden cargar partes de los últimos 7 días.", { campo: "fecha" });
  }
  return ok(fecha);
}

/** P10: vacío = no cargó (`null`); si no, mayor que 0, hasta 200 y con hasta 1 decimal (coma o punto). */
export function parsearLitros(texto: string): Resultado<number | null> {
  const t = texto.trim();
  if (t === "") return ok(null);
  const m = t.length <= 20 ? /^(\d+)(?:[.,](\d+))?$/.exec(t) : null;
  if (m === null) {
    return fallo("litros-no-numerico", "Escriba los litros con números, por ejemplo 45,5.", { campo: "litrosCargados" });
  }
  const decimales = m[2] ?? "";
  if (decimales.length > 1) {
    return fallo("litros-decimales", "Escriba los litros con un solo decimal, por ejemplo 45,5.", { campo: "litrosCargados" });
  }
  const valor = Number(`${m[1]}.${decimales === "" ? "0" : decimales}`);
  if (valor === 0) {
    return fallo("litros-cero", "Si no cargó combustible, deje el campo vacío.", { campo: "litrosCargados" });
  }
  if (valor > LITROS_MAXIMO) {
    return fallo("litros-excedidos", `Los litros no pueden superar ${LITROS_MAXIMO}.`, { campo: "litrosCargados" });
  }
  return ok(valor);
}

/** Campos que pueden faltar para enviar, con el nombre que usa el formulario. */
export type CampoFaltante = "conductor" | "kmInicio" | "kmFin" | ItemChecklist | "combustible" | "otraNovedad";

function descripcionValida(texto: string): boolean {
  const largo = texto.trim().length;
  return largo >= DESCRIPCION_MINIMO && largo <= DESCRIPCION_MAXIMO;
}

/** P4: lo que falta para poder enviar el parte, en el orden del formulario. Vacío = se puede enviar. */
export function faltantesParaEnviar(parte: Parte): CampoFaltante[] {
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
 * P9: documentos obligatorios vencidos o faltantes a la fecha del parte (los de la unidad y la licencia del conductor).
 * Un documento que vence ese mismo día todavía vale (V2). Si no hay conductor (borrador) no se mira la licencia.
 */
export function documentacionVencidaEn(entrada: EntradaDocumentacion): TipoDocumento[] {
  const { fecha, unidad, proyecto, conductor, documentos } = entrada;
  const problemas: TipoDocumento[] = [];
  for (const tipo of tiposObligatoriosDeUnidad(proyecto)) {
    const vigente = documentoVigente(documentos, { tipo: "unidad", id: unidad.id }, tipo);
    if (vigente === undefined || vigente.vence < fecha) problemas.push(tipo);
  }
  if (conductor !== null) {
    const faltantes = faltantesDeConductor(conductor, documentos);
    const licencia = documentoVigente(documentos, { tipo: "conductor", id: conductor.id }, "licencia");
    if (faltantes.includes("licencia") || (licencia !== undefined && licencia.vence < fecha)) problemas.push("licencia");
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

/** P5: el parte se envió después de su fecha (en hora de Argentina). */
export function enviadoFueraDeTermino(parte: Parte): boolean {
  if (parte.estado !== "enviado" || parte.enviado === null) return false;
  return fechaEnArgentina(parte.enviado) > parte.fecha;
}
