// Textos de estados y errores, en español neutro, en un solo lugar (se completa en el paso 1.10).

import { diaDeLaSemana, formatearFecha } from "./fechas.ts";
import type { Advertencia, FechaCivil, TipoDocumento } from "./tipos.ts";

/** Nombre en pantalla de cada tipo de documento (5.1). */
export const NOMBRES_DOCUMENTO: Record<TipoDocumento, string> = {
  seguro: "Seguro",
  "revision-tecnica": "Revisión técnica",
  matafuego: "Carga del matafuego",
  "habilitacion-proyecto": "Habilitación de ingreso al proyecto",
  licencia: "Licencia de conducir",
  "habilitacion-manejo": "Habilitación de manejo en el proyecto",
};

/** `1 día`, `3 días`. */
export function pluralizar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** V1 a V6: texto del estado de un vencimiento. `d` = días desde hoy hasta el vencimiento. */
export function textoVencimiento(d: number, vence: FechaCivil): string {
  if (d < 0) return `Vencido hace ${pluralizar(-d, "día", "días")}`;
  if (d === 0) return "Vence hoy";
  if (d === 1) return "Vence mañana";
  if (d <= 30) return `Vence en ${d} días`;
  return `Vigente hasta ${formatearFecha(vence)}`;
}

/** Separa los miles con punto: 84320 -> `84.320`. */
export function formatearKm(km: number): string {
  return String(km).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** P4: `Falta 1 dato`, `Faltan 3 datos`. */
export function textoFaltantes(n: number): string {
  return n === 1 ? "Falta 1 dato" : `Faltan ${n} datos`;
}

// ---------------------------------------------------------------------------------------------
// Errores de los comandos (sección 8). Los recibe la interfaz tal cual; no se arman en otro lado.
// ---------------------------------------------------------------------------------------------

export const ERRORES = {
  unidadInexistente: "No se encontró la unidad.",
  conductorInexistente: "No se encontró el conductor.",
  conductorInactivo: "El conductor no está activo.",
  proyectoInexistente: "No se encontró el proyecto.",
  documentoInexistente: "No se encontró el documento.",
  parteInexistente: "No se encontró el parte.",
  novedadInexistente: "No se encontró la novedad.",
  parteEnviadoInmutable: "Un parte enviado no se puede modificar.",
  sinCambios: "No hay cambios para guardar.",
  unidadYaFueraDeServicio: "La unidad ya está fuera de servicio.",
  unidadYaEnServicio: "La unidad ya está en servicio.",
  novedadYaResuelta: "La novedad ya está resuelta.",
  documentoNoVigente: "Solo se puede renovar el documento vigente.",
  emisionPosterior: "La fecha de emisión no puede ser posterior al vencimiento.",
  fechaFutura: "La fecha no puede ser posterior a hoy.",
  advertenciasSinAceptar: "Hay advertencias que tiene que aceptar antes de enviar el parte.",
  tipoDeUnidadInvalido: "Elija el tipo de unidad.",
  combustibleInvalido: "Elija el nivel de combustible.",
  checklistInvalido: "El checklist del parte no es válido.",
  otraNovedadInvalida: "La otra novedad no es válida.",
  parteOtraUnidad: "No se puede cambiar la unidad de un parte.",
  noPudoGuardarElParte: "No se pudo guardar el parte. Sus datos siguen en este equipo; intente de nuevo.",
} as const;

/** `ZK 214 BD` con su número interno: `Int. 07`. */
export function textoInterno(interno: number): string {
  return `Int. ${String(interno).padStart(2, "0")}`;
}

export function errUnidadDeBaja(patente: string, desde: FechaCivil): string {
  return `La unidad ${patente} está dada de baja desde el ${formatearFecha(desde)}.`;
}

export function errPatenteRepetida(patente: string, interno: number): string {
  return `Ya existe una unidad con la patente ${patente} (${textoInterno(interno)}).`;
}

export function errInternoRepetido(interno: number, patente: string): string {
  return `Ya existe una unidad con el número interno ${interno} (${patente}).`;
}

export function errAnioFueraDeRango(minimo: number, maximo: number): string {
  return `El año tiene que estar entre ${minimo} y ${maximo}.`;
}

export function errRenovacionNoPosterior(vigenteVence: FechaCivil): string {
  return `La renovación tiene que vencer después del ${formatearFecha(vigenteVence)}.`;
}

export function errVenceAntesQueSuRenovacion(venceRenovacion: FechaCivil): string {
  return `El vencimiento tiene que ser anterior al de su renovación (${formatearFecha(venceRenovacion)}).`;
}

export function errDocumentoExistente(nombre: string): string {
  return `Ya hay un documento de ${nombre} cargado. Use «Renovar».`;
}

export function errTipoDeDocumentoNoCorresponde(nombre: string, titular: "unidad" | "conductor"): string {
  return `${nombre} no corresponde a ${titular === "unidad" ? "una unidad" : "un conductor"}.`;
}

export function errNovedadesCriticasAbiertas(lista: readonly string[]): string {
  return `Antes de volver a servicio, resuelva: ${lista.join(", ")}.`;
}

export function errParteDuplicado(patente: string, fecha: FechaCivil, estado: "borrador" | "enviado"): string {
  const final = estado === "borrador" ? "Ábralo para continuar." : "Ábralo para verlo.";
  return `Ya hay un parte de ${patente} para el ${formatearFecha(fecha)} (${estado}). ${final}`;
}

/** M3: la corrección de kilometraje no cambiaría nada porque hay un registro posterior. */
export function errKmCorreccionAnterior(registro: "parte" | "correccion", fecha: FechaCivil): string {
  const que = registro === "parte" ? `un parte enviado el ${formatearFecha(fecha)}` : `una corrección de kilometraje del ${formatearFecha(fecha)}`;
  const cual = registro === "parte" ? "de ese parte" : "de esa corrección";
  return `Ya hay ${que}, posterior a la fecha elegida: la corrección no cambiaría el kilometraje actual. Use la fecha ${cual} o una posterior.`;
}

export function errUnidadFueraDeServicio(desde: FechaCivil, motivo: string): string {
  return `La unidad está fuera de servicio desde el ${formatearFecha(desde)} (${motivo}). Pida al encargado que la vuelva a servicio.`;
}

// ---------------------------------------------------------------------------------------------
// Resúmenes de los eventos del historial.
// ---------------------------------------------------------------------------------------------

export const RESUMEN_EVENTO = {
  unidadAlta: (patente: string, interno: number) => `Alta de la unidad ${patente} (${textoInterno(interno)})`,
  cambioDeProyecto: (patente: string, de: string, a: string) => `Cambio de proyecto de ${patente}: de ${de} a ${a}`,
  cambioDeConductor: (patente: string, de: string, a: string) => `Cambio de conductor de ${patente}: de ${de} a ${a}`,
  cambioDeProyectoYConductor: (patente: string, proyecto: string, conductor: string) =>
    `Cambio de proyecto y de conductor de ${patente}: proyecto ${proyecto}; conductor ${conductor}`,
  documentoCargado: (titular: string, nombre: string, vence: FechaCivil) =>
    `Documento cargado (${titular}): ${nombre}, vence el ${formatearFecha(vence)}`,
  documentoRenovado: (nombre: string, titular: string, anterior: FechaCivil, nuevo: FechaCivil) =>
    `Renovación de ${nombre} (${titular}): vencía el ${formatearFecha(anterior)}, ahora vence el ${formatearFecha(nuevo)}`,
  documentoCorregido: (nombre: string, titular: string, campos: readonly string[]) =>
    `Corrección de ${nombre} (${titular}): ${campos.join(", ")}`,
  parteEnviado: (patente: string, fecha: FechaCivil, fueraDeTermino: boolean, kmInicio: number, kmFin: number) => {
    const recorrido = kmFin - kmInicio;
    const texto = recorrido === 0 ? "sin uso" : `${formatearKm(recorrido)} km`;
    return `Parte del ${formatearFecha(fecha)} de ${patente} enviado${fueraDeTermino ? " fuera de término" : ""}: ${formatearKm(kmInicio)} a ${formatearKm(kmFin)} km (${texto})`;
  },
  novedadAbierta: (patente: string, critica: boolean, detalle: string) =>
    `Novedad ${critica ? "crítica " : ""}abierta (${patente}): ${detalle}`,
  novedadResuelta: (patente: string, rotulo: string, texto: string) => `Novedad resuelta (${patente}): ${rotulo}. ${texto}`,
  fueraDeServicio: (patente: string, motivo: string) => `${patente} fuera de servicio: ${motivo}`,
  vueltaAServicio: (patente: string) => `${patente} vuelve a servicio`,
  kmCorregido: (patente: string, anterior: number | null, base: number, desde: FechaCivil) =>
    anterior === null
      ? `Kilometraje de ${patente} fijado en ${formatearKm(base)} km desde el ${formatearFecha(desde)}`
      : `Kilometraje de ${patente} corregido: de ${formatearKm(anterior)} a ${formatearKm(base)} km desde el ${formatearFecha(desde)}`,
  unidadBaja: (patente: string, motivo: string) => `${patente} dada de baja: ${motivo}`,
} as const;

// ---------------------------------------------------------------------------------------------
// Textos de estado de las pantallas (docs/diseno-ui.md, secciones 5.6, 6.1 y 7).
// ---------------------------------------------------------------------------------------------

/** A8: el protagonista del centro de alertas. */
export function textoProtagonista(n: number): string {
  if (n === 0) return "Todas las unidades activas pueden salir hoy";
  return n === 1 ? "1 unidad no puede salir hoy" : `${n} unidades no pueden salir hoy`;
}

/** A8: "Disponibles hoy: 19 de 23 unidades activas." */
export function textoDisponibles(disponibles: number, activas: number): string {
  return `Disponibles hoy: ${disponibles} de ${pluralizar(activas, "unidad activa", "unidades activas")}.`;
}

/** 5.6: resumen del horizonte para lectores de pantalla. */
export function textoHorizonte(porGrupo: { vencidos: number; "7": number; "15": number; "30": number }): string {
  const vencidos =
    porGrupo.vencidos === 0 ? "" : ` ${pluralizar(porGrupo.vencidos, "documento vencido o faltante", "documentos vencidos o faltantes")}.`;
  const enHorizonte = porGrupo["7"] + porGrupo["15"] + porGrupo["30"];
  if (enHorizonte === 0) return `Nada vence en los próximos 30 días.${vencidos}`;
  return (
    `Vencimientos de los próximos 30 días: ${porGrupo["7"]} en 7 días o menos, ${porGrupo["15"]} entre 8 y 15 días, ` +
    `${porGrupo["30"]} entre 16 y 30 días.${vencidos}`
  );
}

/** T6: "Hoy es miércoles 18/11/2026 (hora de Argentina)". */
export function textoHoy(hoy: FechaCivil): string {
  return `Hoy es ${diaDeLaSemana(hoy)} ${formatearFecha(hoy)} (hora de Argentina)`;
}

/** "Último registro: 84.320 km (parte del 17/11/2026)." o "Sin registros". */
export function textoUltimoRegistro(km: number | null, origen: string | null): string {
  if (km === null || origen === null) return "Sin registros";
  return `Último registro: ${formatearKm(km)} km (${origen}).`;
}

/** Texto accesible de la insignia de la pestaña "Alertas". */
export function textoInsigniaAlertas(criticas: number): string {
  if (criticas === 0) return "Alertas";
  return `Alertas, ${pluralizar(criticas, "crítica", "críticas")}`;
}

/** Barra de estado después de renovar: "Quedan 10 vencimientos." */
export function textoQuedanVencimientos(n: number): string {
  if (n === 0) return "No quedan vencimientos.";
  return n === 1 ? "Queda 1 vencimiento." : `Quedan ${n} vencimientos.`;
}

/** Unidad recién agregada: "Le faltan 4 documentos". */
export function textoLeFaltan(n: number): string {
  if (n === 0) return "No le falta ningún documento";
  return n === 1 ? "Le falta 1 documento" : `Le faltan ${n} documentos`;
}

/** K6, K7 y P9: cada advertencia que se acepta antes de enviar el parte. */
export function textoAdvertencia(a: Advertencia): string {
  switch (a.tipo) {
    case "salto-km":
      return `${formatearKm(a.km)} km sin registrar`;
    case "recorrido-largo":
      return `Recorrido del día de ${formatearKm(a.km)} km`;
    case "documentacion-vencida":
      return (
        `Documentación vencida o faltante: ${a.documentos.map((t) => NOMBRES_DOCUMENTO[t]).join(", ")}. ` +
        "Puede enviar el parte igual: quedará registrado que la unidad circuló con documentación vencida."
      );
  }
}
