// Lo que tienen en común los formularios de los diálogos (docs/diseno-ui.md, 5.11 y 5.15): cómo se reparten los errores y cómo se
// arman las opciones de los `select` de proyecto y conductor. Sin DOM.

import { formatearPatente } from "./patente.ts";
import { TEXTO_AGREGAR, TEXTO_DIALOGOS_FICHA } from "./textos.ts";
import type { ErrorDeNegocio, Estado } from "./tipos.ts";

/** Lo que le toca mostrar al diálogo cuando algo salió mal. El texto escrito no se toca: se conserva (5.11). */
export interface ErroresDeFormularioDe<Campo extends string> {
  /** Para `aria-invalid` y el mensaje sobre cada campo. */
  porCampo: Partial<Record<Campo, string>>;
  /** El mismo contenido, en el orden del formulario, para el resumen de arriba (5.15) con un enlace a cada campo. */
  lista: { campo: Campo; mensaje: string }[];
  /** Un error que no es de un campo (guardado, perfil, algo que cambió en otra pestaña): se muestra arriba del formulario. */
  general: string | null;
}

export function armarErrores<Campo extends string>(lista: { campo: Campo; mensaje: string }[], general: string | null): ErroresDeFormularioDe<Campo> {
  const porCampo: Partial<Record<Campo, string>> = {};
  for (const { campo, mensaje } of lista) porCampo[campo] = mensaje;
  return { porCampo, lista, general };
}

/** Un error de negocio del comando, repartido para el formulario: al campo si es uno de `campos`; si no, general. */
export function erroresDeNegocioEn<Campo extends string>(error: ErrorDeNegocio, campos: readonly Campo[]): ErroresDeFormularioDe<Campo> {
  const campo = campos.find((c) => c === error.campo);
  return campo === undefined ? armarErrores<Campo>([], error.mensaje) : armarErrores([{ campo, mensaje: error.mensaje }], null);
}

/** Solo un error general (sin datos, sin permiso, guardado fallido, algo que cambió en otra pestaña). */
export function errorGeneralEn<Campo extends string>(mensaje: string): ErroresDeFormularioDe<Campo> {
  return armarErrores<Campo>([], mensaje);
}

export interface OpcionDeLista {
  valor: string;
  etiqueta: string;
}

export interface OpcionDeConductor extends OpcionDeLista {
  /** `ZK 214 BD` si ya tiene una unidad asignada (puede asignarse igual; el dominio no lo impide): para avisarlo junto a la opción. */
  asignadoA: string | null;
}

export function opcionesDeProyecto(estado: Pick<Estado, "proyectos">): OpcionDeLista[] {
  return estado.proyectos.map((p) => ({ valor: p.id, etiqueta: p.nombre }));
}

/**
 * «Sin conductor asignado» (valor vacío) y después los conductores activos, cada uno con la unidad que ya tiene (`asignadoA`).
 * `excluirUnidadId`: la unidad que se está editando no cuenta como «ya tiene una unidad». `conservarId`: el conductor que la unidad
 * tiene hoy, aunque haya quedado inactivo (si no, el `select` no podría mostrar el valor actual; al guardar el dominio lo rechaza).
 */
export function opcionesDeConductor(
  estado: Pick<Estado, "conductores" | "unidades">,
  opciones: { excluirUnidadId?: string; conservarId?: string | null } = {},
): OpcionDeConductor[] {
  const asignada = (conductorId: string): string | null => {
    const u = estado.unidades.find((x) => x.conductorId === conductorId && x.estado.tipo !== "baja" && x.id !== opciones.excluirUnidadId);
    return u === undefined ? null : formatearPatente(u.patente);
  };
  const lista: OpcionDeConductor[] = [{ valor: "", etiqueta: TEXTO_AGREGAR.sinConductor, asignadoA: null }];
  for (const c of estado.conductores) {
    if (c.activo) lista.push({ valor: c.id, etiqueta: c.nombre, asignadoA: asignada(c.id) });
    else if (c.id === opciones.conservarId) lista.push({ valor: c.id, etiqueta: TEXTO_DIALOGOS_FICHA.asignacion.inactivo(c.nombre), asignadoA: asignada(c.id) });
  }
  return lista;
}
