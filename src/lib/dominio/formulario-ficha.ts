// Diálogos de la unidad en su ficha (docs/diseno-ui.md, 5.11, 5.15 y 5.17): «Poner fuera de servicio», «Volver a servicio», «Dar de baja»,
// «Corregir kilometraje» y «Cambiar proyecto o conductor». Todo lo que el formulario necesita, sin DOM y sin reglas nuevas: las reglas
// (A4 a A7, K1, K5, M3, U6) siguen en `comandos.ts` y `validacion.ts`; acá se arman los textos y los valores iniciales, se convierte lo que
// escribe la persona en un comando y se reparten los errores por campo, con el mismo patrón que `formulario-documento.ts`.
//
// Los valores del formulario son siempre texto (lo que dan los `input` y los `select`). `conductorId` vacío = «Sin conductor asignado».

import type { Comando } from "./comandos.ts";
// A5 y P19 (los avisos de «Volver a servicio») viven en `formulario-novedad.ts`: «Resolver novedad» también los ofrece y viaja con el marco; esta ficha se baja con su pantalla.
import { avisoDeVueltaSinPoderSalir, vuelveSinSalirHastaManana } from "./formulario-novedad.ts";
import {
  erroresDeNegocioEn,
  errorGeneralEn,
  armarErrores,
  opcionesDeConductor,
  opcionesDeProyecto,
  type ErroresDeFormularioDe,
  type OpcionDeConductor,
  type OpcionDeLista,
} from "./formulario.ts";
import { describirRegistro, kmActual, parsearKm, registrosDeKm } from "./kilometraje.ts";
import { criticasAbiertasDeUnidad, type CriticaAbierta } from "./novedades.ts";
import { formatearPatente } from "./patente.ts";
import { TEXTO_AGREGAR, TEXTO_DIALOGOS_FICHA, errNovedadesCriticasAbiertas, textoUltimoRegistro } from "./textos-base.ts";
import type { ErrorDeNegocio, Estado, FechaCivil, Unidad } from "./tipos.ts";
import { REGLAS, validarFechaNoFutura, validarTexto } from "./validacion.ts";
import { documentoVigente } from "./vencimientos.ts";

// --- Comunes -------------------------------------------------------------------------------------

function buscar(estado: Estado, unidadId: string): Unidad | undefined {
  return estado.unidades.find((u) => u.id === unidadId);
}

/** La unidad existe y no está de baja (casi todos los diálogos). */
function activa(estado: Estado, unidadId: string): Unidad | null {
  const u = buscar(estado, unidadId);
  return u === undefined || u.estado.tipo === "baja" ? null : u;
}

function revisar(lista: { campo: string; mensaje: string }[], campo: string, r: { ok: true } | { ok: false; error: ErrorDeNegocio }): void {
  if (!r.ok) lista.push({ campo, mensaje: r.error.mensaje });
}

/** El aviso del diálogo «Volver a servicio»: A5 (documentos) y P19 (sin salida hasta mañana), juntos si pasan las dos; `null` si no hay nada que avisar. */
export function avisoDeVuelta(estado: Estado, unidad: Unidad, hoy: FechaCivil): string | null {
  const documentos = avisoDeVueltaSinPoderSalir(estado, unidad, hoy);
  if (!vuelveSinSalirHastaManana(estado, unidad, hoy)) return documentos;
  const t = TEXTO_DIALOGOS_FICHA.volver;
  return documentos === null ? t.hastaManana : `${documentos} ${t.ademasHastaManana}`;
}

// --- Poner fuera de servicio ---------------------------------------------------------------------

export type CampoFueraDeServicio = "motivo";
export const CAMPOS_FUERA_DE_SERVICIO: readonly CampoFueraDeServicio[] = ["motivo"];
export interface ValoresFueraDeServicio {
  motivo: string;
}
export type ErroresFueraDeServicio = ErroresDeFormularioDe<CampoFueraDeServicio>;

export interface ContextoFueraDeServicio {
  unidadId: string;
  titulo: string;
  /** «Desde hoy (18/11/2026).»: es texto, no un campo (A6). */
  desde: string;
  valoresIniciales: ValoresFueraDeServicio;
  primario: string;
}

/** `null` si la unidad no existe, está de baja o ya está fuera de servicio (no hay diálogo que abrir). */
export function contextoDeFueraDeServicio(estado: Estado, unidadId: string, hoy: FechaCivil): ContextoFueraDeServicio | null {
  const u = activa(estado, unidadId);
  if (u === null || u.estado.tipo === "fuera-de-servicio") return null;
  return {
    unidadId: u.id,
    titulo: TEXTO_DIALOGOS_FICHA.fueraDeServicio.titulo(formatearPatente(u.patente)),
    desde: TEXTO_DIALOGOS_FICHA.fueraDeServicio.desde(hoy),
    valoresIniciales: { motivo: "" },
    primario: TEXTO_DIALOGOS_FICHA.fueraDeServicio.primario,
  };
}

export function comandoDeFueraDeServicio(unidadId: string, v: ValoresFueraDeServicio): Comando {
  return { tipo: "ponerFueraDeServicio", unidadId, motivo: v.motivo };
}

export function validarFueraDeServicio(v: ValoresFueraDeServicio): ErroresFueraDeServicio | null {
  const lista: { campo: CampoFueraDeServicio; mensaje: string }[] = [];
  revisar(lista, "motivo", validarTexto(v.motivo, REGLAS.motivoFueraDeServicio));
  return lista.length === 0 ? null : armarErrores(lista, null);
}

export function erroresDeNegocioFueraDeServicio(error: ErrorDeNegocio): ErroresFueraDeServicio {
  return erroresDeNegocioEn(error, CAMPOS_FUERA_DE_SERVICIO);
}

export function errorGeneralFueraDeServicio(mensaje: string): ErroresFueraDeServicio {
  return errorGeneralEn(mensaje);
}

// --- Volver a servicio ---------------------------------------------------------------------------

export interface ContextoVolverAServicio {
  unidadId: string;
  titulo: string;
  /** «Fuera de servicio desde 16/11/2026: …». */
  situacion: string;
  /** A4: hay críticas abiertas, no hay primario; `texto` es el mismo que da el comando al intentarlo. */
  bloqueo: { texto: string; novedades: CriticaAbierta[]; verNovedades: string } | null;
  /** A5: la unidad vuelve, pero sigue sin poder salir hasta ponerse al día con documentos. */
  aviso: string | null;
  /** `null` mientras haya bloqueo (no hay botón primario). */
  primario: string | null;
}

/** `null` si la unidad no existe, está de baja o ya está en servicio. No hay campos: el diálogo solo confirma. */
export function contextoDeVolverAServicio(estado: Estado, unidadId: string, hoy: FechaCivil): ContextoVolverAServicio | null {
  const u = activa(estado, unidadId);
  if (u === null || u.estado.tipo !== "fuera-de-servicio") return null;
  const criticas = criticasAbiertasDeUnidad(estado.novedades, u.id);
  const t = TEXTO_DIALOGOS_FICHA.volver;
  const bloqueo =
    criticas.length === 0 ? null : { texto: errNovedadesCriticasAbiertas(criticas.map((n) => n.texto)), novedades: criticas, verNovedades: t.verNovedades };
  return {
    unidadId: u.id,
    titulo: t.titulo(formatearPatente(u.patente)),
    situacion: t.situacion(u.estado.desde, u.estado.motivo),
    bloqueo,
    aviso: bloqueo === null ? avisoDeVuelta(estado, u, hoy) : null,
    primario: bloqueo === null ? t.primario : null,
  };
}

export function comandoDeVolverAServicio(unidadId: string): Comando {
  return { tipo: "volverAServicio", unidadId };
}

// --- Dar de baja ---------------------------------------------------------------------------------

export type CampoBaja = "motivo";
export const CAMPOS_BAJA: readonly CampoBaja[] = ["motivo"];
export interface ValoresBaja {
  motivo: string;
}
export type ErroresBaja = ErroresDeFormularioDe<CampoBaja>;

export interface ContextoBaja {
  unidadId: string;
  titulo: string;
  /** «No se puede deshacer en esta demo…» */
  aviso: string;
  valoresIniciales: ValoresBaja;
  /** «Dar de baja ZK 214 BD». */
  primario: string;
  /** El botón primario es de peligro (5.1). */
  peligro: true;
}

export function contextoDeBaja(estado: Estado, unidadId: string): ContextoBaja | null {
  const u = activa(estado, unidadId);
  if (u === null) return null;
  const patente = formatearPatente(u.patente);
  return {
    unidadId: u.id,
    titulo: TEXTO_DIALOGOS_FICHA.baja.titulo(patente),
    aviso: TEXTO_DIALOGOS_FICHA.baja.aviso,
    valoresIniciales: { motivo: "" },
    primario: TEXTO_DIALOGOS_FICHA.baja.primario(patente),
    peligro: true,
  };
}

export function comandoDeBaja(unidadId: string, v: ValoresBaja): Comando {
  return { tipo: "darDeBaja", unidadId, motivo: v.motivo };
}

export function validarBaja(v: ValoresBaja): ErroresBaja | null {
  const lista: { campo: CampoBaja; mensaje: string }[] = [];
  revisar(lista, "motivo", validarTexto(v.motivo, REGLAS.motivoBaja));
  return lista.length === 0 ? null : armarErrores(lista, null);
}

export function erroresDeNegocioBaja(error: ErrorDeNegocio): ErroresBaja {
  return erroresDeNegocioEn(error, CAMPOS_BAJA);
}

export function errorGeneralBaja(mensaje: string): ErroresBaja {
  return errorGeneralEn(mensaje);
}

// --- Corregir kilometraje ------------------------------------------------------------------------

export type CampoKilometraje = "desde" | "kmBase" | "motivo";
/** En el orden del formulario (5.17) y del resumen de errores. */
export const CAMPOS_KILOMETRAJE: readonly CampoKilometraje[] = ["desde", "kmBase", "motivo"];
export interface ValoresKilometraje {
  /** 'AAAA-MM-DD'. */
  desde: string;
  /** Lo que escribió la persona: acepta `84320`, `84.320` y `84 320` (K1). */
  kmBase: string;
  motivo: string;
}
export type ErroresKilometraje = ErroresDeFormularioDe<CampoKilometraje>;

export interface ContextoKilometraje {
  unidadId: string;
  titulo: string;
  /** «Último registro: 84.320 km (parte del 17/11/2026).» o «Sin registros». */
  ultimoRegistro: string;
  nota: string;
  /** La fecha es hoy (el caso más común); lo demás, vacío. */
  valoresIniciales: ValoresKilometraje;
  /** Tope del campo de fecha (`max` del `input type="date"`): no puede ser posterior a hoy. */
  desdeMaxima: FechaCivil;
  primario: string;
}

export function contextoDeKilometraje(estado: Estado, unidadId: string, hoy: FechaCivil): ContextoKilometraje | null {
  const u = activa(estado, unidadId);
  if (u === null) return null;
  const registros = registrosDeKm(u.id, estado.partes, estado.correccionesKm);
  const ultimo = registros[registros.length - 1];
  const km = kmActual(u.id, estado.partes, estado.correccionesKm);
  return {
    unidadId: u.id,
    titulo: TEXTO_DIALOGOS_FICHA.kilometraje.titulo(formatearPatente(u.patente)),
    ultimoRegistro: textoUltimoRegistro(km, ultimo === undefined ? null : describirRegistro(ultimo)),
    nota: TEXTO_DIALOGOS_FICHA.kilometraje.nota,
    valoresIniciales: { desde: hoy, kmBase: "", motivo: "" },
    desdeMaxima: hoy,
    primario: TEXTO_DIALOGOS_FICHA.kilometraje.primario,
  };
}

/** El kilometraje se convierte acá; si no se puede, va `NaN` y el dominio lo rechaza con su mensaje (la validación previa ya avisó). */
export function comandoDeKilometraje(unidadId: string, v: ValoresKilometraje): Comando {
  const km = parsearKm(v.kmBase);
  return { tipo: "corregirKilometraje", unidadId, desde: v.desde.trim(), kmBase: km.ok ? km.valor : Number.NaN, motivo: v.motivo };
}

/**
 * Revisa los tres campos a la vez con los mismos validadores del dominio (5.15). Lo que depende de los registros de la unidad (M3: ya hay un
 * parte posterior a la fecha) lo dice el comando al ejecutarse, en el campo de la fecha.
 */
export function validarKilometraje(v: ValoresKilometraje, hoy: FechaCivil): ErroresKilometraje | null {
  const lista: { campo: CampoKilometraje; mensaje: string }[] = [];
  revisar(lista, "desde", validarFechaNoFutura(v.desde.trim(), hoy, "desde"));
  const km = parsearKm(v.kmBase);
  if (!km.ok) lista.push({ campo: "kmBase", mensaje: km.error.mensaje });
  revisar(lista, "motivo", validarTexto(v.motivo, REGLAS.motivoKm));
  return lista.length === 0 ? null : armarErrores(lista, null);
}

export function erroresDeNegocioKilometraje(error: ErrorDeNegocio): ErroresKilometraje {
  return erroresDeNegocioEn(error, CAMPOS_KILOMETRAJE);
}

export function errorGeneralKilometraje(mensaje: string): ErroresKilometraje {
  return errorGeneralEn(mensaje);
}

// --- Cambiar proyecto o conductor ----------------------------------------------------------------

export type CampoAsignacion = "proyectoId" | "conductorId";
export const CAMPOS_ASIGNACION: readonly CampoAsignacion[] = ["proyectoId", "conductorId"];
export interface ValoresAsignacion {
  proyectoId: string;
  /** Vacío = sin conductor asignado. */
  conductorId: string;
}
export type ErroresAsignacion = ErroresDeFormularioDe<CampoAsignacion>;

export interface ContextoAsignacion {
  unidadId: string;
  titulo: string;
  /** Los de hoy: el diálogo abre con lo que la unidad ya tiene. */
  valoresIniciales: ValoresAsignacion;
  proyectos: OpcionDeLista[];
  conductores: OpcionDeConductor[];
  primario: string;
}

export function contextoDeAsignacion(estado: Estado, unidadId: string): ContextoAsignacion | null {
  const u = activa(estado, unidadId);
  if (u === null) return null;
  return {
    unidadId: u.id,
    titulo: TEXTO_DIALOGOS_FICHA.asignacion.titulo(formatearPatente(u.patente)),
    valoresIniciales: { proyectoId: u.proyectoId, conductorId: u.conductorId ?? "" },
    proyectos: opcionesDeProyecto(estado),
    conductores: opcionesDeConductor(estado, { excluirUnidadId: u.id, conservarId: u.conductorId }),
    primario: TEXTO_DIALOGOS_FICHA.asignacion.primario,
  };
}

/**
 * U6: si el proyecto elegido exige la habilitación de ingreso y la unidad no la tiene, la unidad va a quedar sin poder salir: se avisa antes
 * de guardar (la vista lo llama al cambiar el `select`). No bloquea: el cambio es válido.
 */
export function avisoDeAsignacion(estado: Estado, unidadId: string, v: ValoresAsignacion): string | null {
  const u = buscar(estado, unidadId);
  const proyecto = estado.proyectos.find((p) => p.id === v.proyectoId);
  if (u === undefined || proyecto === undefined || !proyecto.requiereHabilitacion) return null;
  if (documentoVigente(estado.documentos, { tipo: "unidad", id: u.id }, "habilitacion-proyecto") !== undefined) return null;
  return TEXTO_DIALOGOS_FICHA.asignacion.sinHabilitacion(formatearPatente(u.patente), proyecto.nombre);
}

export function comandoDeAsignacion(unidadId: string, v: ValoresAsignacion): Comando {
  return { tipo: "cambiarAsignacion", unidadId, proyectoId: v.proyectoId, conductorId: v.conductorId === "" ? null : v.conductorId };
}

/** Solo hay que haber elegido el proyecto; que exista, que el conductor esté activo y que haya algo que cambiar lo dice el comando. */
export function validarAsignacion(v: ValoresAsignacion): ErroresAsignacion | null {
  if (v.proyectoId === "") return armarErrores<CampoAsignacion>([{ campo: "proyectoId", mensaje: TEXTO_AGREGAR.proyectoVacio }], null);
  return null;
}

export function erroresDeNegocioAsignacion(error: ErrorDeNegocio): ErroresAsignacion {
  return erroresDeNegocioEn(error, CAMPOS_ASIGNACION);
}

export function errorGeneralAsignacion(mensaje: string): ErroresAsignacion {
  return errorGeneralEn(mensaje);
}
