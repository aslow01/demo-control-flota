// Los valores del formulario del parte y lo que falta cargar (docs/diseno-ui.md, 5.12 a 5.15): lo único de formulario-parte.ts que necesita el inicio del conductor (cuántos puntos le faltan a un borrador). Viaja con el marco; el resto del formulario se baja con el parte.

import { parsearKm } from "./kilometraje.ts";
import { type CampoDeCierre, type CampoDeRevision, type CampoFaltante, faltantesDeCierre, faltantesDeRevision, ITEMS_CHECKLIST, parsearLitros } from "./parte.ts";
import { formatearKm } from "./textos-base.ts";
import type { ItemChecklist, NivelCombustible, Parte, RespuestaItem } from "./tipos.ts";
import { validarTextoDeBorrador } from "./validacion.ts";

/** Un campo del formulario: el conductor, el inicio y el fin del kilometraje, los diez puntos, el combustible, los litros y «Otra novedad». */
export type CampoParte = CampoFaltante | "litrosCargados";

/** Los dos pasos del parte (sección 17): la revisión antes de salir y el cierre de la jornada. */
export type PasoDelParte = "revision" | "cierre";

/** Los campos de la revisión (paso 1), en el orden del formulario (5.12). */
export const CAMPOS_DE_REVISION: readonly CampoDeRevision[] = ["conductor", "kmInicio", ...ITEMS_CHECKLIST.map((i) => i.id), "otraNovedad"];

/** Los campos del cierre (paso 2), en el orden del formulario. */
export const CAMPOS_DE_CIERRE: readonly (CampoDeCierre | "litrosCargados")[] = ["kmFin", "combustible", "litrosCargados"];

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

// --- Valores -------------------------------------------------------------------------------------
export 
function itemVacio(): ValoresItem {
  return { respuesta: "", descripcion: "", impideUso: false };
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

// --- De los valores a los datos (P3) ---------------------------------------------------------------

type Datos = Pick<Parte, "conductorId" | "kmInicio" | "kmFin" | "combustible" | "litrosCargados" | "checklist" | "otraNovedad">;

interface Conversion {
  datos: Datos;
  /** Un error de formato por campo (P3): lo que no se puede guardar. */
  errores: Map<CampoParte, string>;
}

export function convertir(v: ValoresParte, paso: PasoDelParte): Conversion {
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
