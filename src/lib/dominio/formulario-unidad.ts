// Diálogo «Agregar unidad» (docs/diseno-ui.md, 5.11, 5.15 y 5.17): todo lo que el formulario necesita, sin DOM y sin reglas nuevas.
// Las reglas siguen en `comandos.ts` y `validacion.ts` (U1 a U5, U7): acá se arman las opciones de los `select`, se convierte lo que
// escribe la persona en un comando y se reparten los errores por campo, con el mismo patrón que `formulario-documento.ts`.
//
// Los valores del formulario son siempre texto (lo que dan los `input` y los `select`). `conductorId` vacío = «Sin conductor asignado».

import { TIPOS_DE_UNIDAD, esTipoDeUnidad, type Comando } from "./comandos.ts";
import { armarErrores, opcionesDeConductor, opcionesDeProyecto, type ErroresDeFormularioDe, type OpcionDeConductor, type OpcionDeLista } from "./formulario.ts";
import { ERRORES, NOMBRES_TIPO_UNIDAD, TEXTO_AGREGAR } from "./textos.ts";
import type { ErrorDeNegocio, Estado, FechaCivil } from "./tipos.ts";
import { REGLAS, rangoDeAnios, validarAnioDeAlta, validarInternoDeAlta, validarPatenteDeAlta, validarTexto } from "./validacion.ts";

export type CampoUnidad = "patente" | "interno" | "tipo" | "marca" | "modelo" | "anio" | "proyectoId" | "conductorId";

/** En el orden del formulario (5.17) y del resumen de errores. */
export const CAMPOS_UNIDAD: readonly CampoUnidad[] = ["patente", "interno", "tipo", "marca", "modelo", "anio", "proyectoId", "conductorId"];

export interface ValoresUnidad {
  patente: string;
  interno: string;
  /** Uno de los valores de `ContextoAgregarUnidad.tipos`, o vacío si todavía no eligió. */
  tipo: string;
  marca: string;
  modelo: string;
  anio: string;
  /** El id del proyecto, o vacío si todavía no eligió. */
  proyectoId: string;
  /** El id del conductor; vacío = sin conductor asignado. */
  conductorId: string;
}

export type ErroresDeFormularioUnidad = ErroresDeFormularioDe<CampoUnidad>;

export type { OpcionDeConductor, OpcionDeLista };

export interface ContextoAgregarUnidad {
  titulo: string;
  primario: string;
  /** Todos vacíos: no hay nada que se sepa de una unidad que no existe (WCAG 3.3.7 no se aplica). */
  valoresIniciales: ValoresUnidad;
  tipos: OpcionDeLista[];
  proyectos: OpcionDeLista[];
  /** «Sin conductor asignado» (valor vacío) y después los conductores activos. */
  conductores: OpcionDeConductor[];
  /** Los años que acepta el dominio (U4), para la ayuda del campo. */
  anios: { minimo: number; maximo: number };
}

const VALORES_VACIOS: ValoresUnidad = { patente: "", interno: "", tipo: "", marca: "", modelo: "", anio: "", proyectoId: "", conductorId: "" };

/** Lo que muestra el diálogo al abrirse. */
export function contextoDeAgregarUnidad(estado: Estado, hoy: FechaCivil): ContextoAgregarUnidad {
  return {
    titulo: TEXTO_AGREGAR.titulo,
    primario: TEXTO_AGREGAR.primario,
    valoresIniciales: { ...VALORES_VACIOS },
    tipos: TIPOS_DE_UNIDAD.map((t) => ({ valor: t, etiqueta: NOMBRES_TIPO_UNIDAD[t] })),
    proyectos: opcionesDeProyecto(estado),
    conductores: opcionesDeConductor(estado),
    anios: rangoDeAnios(hoy),
  };
}

/** Enteros que escribe una persona: solo dígitos ASCII (nada de `1e2`, `7.5` ni `-3`); `null` si no lo son. */
function entero(texto: string): number | null {
  const t = texto.trim();
  return /^\d{1,9}$/.test(t) ? Number(t) : null;
}

/** El comando del dominio con lo que escribió la persona. Lo que no se pueda convertir lo rechaza el dominio igual (no lanza). */
export function comandoDeAgregarUnidad(v: ValoresUnidad): Comando {
  return {
    tipo: "altaUnidad",
    patente: v.patente.trim(),
    interno: entero(v.interno) ?? Number.NaN,
    marca: v.marca,
    modelo: v.modelo,
    anio: entero(v.anio) ?? Number.NaN,
    // Si no es uno de los cuatro, el dominio lo rechaza con `tipoUnidad`: la validación previa ya avisó antes de llegar acá.
    tipoUnidad: v.tipo,
    proyectoId: v.proyectoId,
    conductorId: v.conductorId === "" ? null : v.conductorId,
  };
}

/**
 * Revisa todos los campos a la vez con los mismos validadores del dominio, para decir cuántas cosas hay que corregir en una sola
 * pasada (5.15). Lo que depende de otro dato (que el proyecto o el conductor existan) lo dice el comando al ejecutarse; acá solo
 * se avisa lo que no se eligió. Devuelve `null` si no encontró nada.
 */
export function validarValoresUnidad(v: ValoresUnidad, estado: Estado, hoy: FechaCivil): ErroresDeFormularioUnidad | null {
  const lista: { campo: CampoUnidad; mensaje: string }[] = [];
  const agregar = (campo: CampoUnidad, r: { ok: true } | { ok: false; error: ErrorDeNegocio }) => {
    if (!r.ok) lista.push({ campo, mensaje: r.error.mensaje });
  };
  const vacio = (campo: CampoUnidad, mensaje: string) => lista.push({ campo, mensaje });

  if (v.patente.trim() === "") vacio("patente", TEXTO_AGREGAR.patenteVacia);
  else agregar("patente", validarPatenteDeAlta(estado.unidades, v.patente));

  if (v.interno.trim() === "") vacio("interno", TEXTO_AGREGAR.internoVacio);
  else agregar("interno", validarInternoDeAlta(estado.unidades, entero(v.interno) ?? Number.NaN));

  if (!esTipoDeUnidad(v.tipo)) vacio("tipo", ERRORES.tipoDeUnidadInvalido);
  agregar("marca", validarTexto(v.marca, REGLAS.marca));
  agregar("modelo", validarTexto(v.modelo, REGLAS.modelo));

  if (v.anio.trim() === "") vacio("anio", TEXTO_AGREGAR.anioVacio);
  else agregar("anio", validarAnioDeAlta(entero(v.anio) ?? Number.NaN, hoy));

  if (v.proyectoId === "") vacio("proyectoId", TEXTO_AGREGAR.proyectoVacio);
  return lista.length === 0 ? null : armarErrores(lista, null);
}

/** Los campos del dominio que no se llaman igual que los del formulario. */
const CAMPO_DEL_FORMULARIO: Record<string, CampoUnidad> = {
  patente: "patente",
  interno: "interno",
  tipoUnidad: "tipo",
  marca: "marca",
  modelo: "modelo",
  anio: "anio",
  proyectoId: "proyectoId",
  conductorId: "conductorId",
};

/** Un error de negocio del comando, repartido para el formulario: al campo si es uno del diálogo; si no, general. */
export function erroresDeNegocioUnidad(error: ErrorDeNegocio): ErroresDeFormularioUnidad {
  const campo = error.campo !== undefined && Object.hasOwn(CAMPO_DEL_FORMULARIO, error.campo) ? CAMPO_DEL_FORMULARIO[error.campo] : undefined;
  return campo === undefined ? armarErrores([], error.mensaje) : armarErrores([{ campo, mensaje: error.mensaje }], null);
}

/** Solo un error general (sin datos, sin permiso, guardado fallido). */
export function errorGeneralUnidad(mensaje: string): ErroresDeFormularioUnidad {
  return armarErrores([], mensaje);
}
