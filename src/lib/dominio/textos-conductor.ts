// Textos del inicio del conductor (Hoy, Mis partes y «Ver como»; docs/diseno-ui.md, 6.4; paso 4.5) y los avisos de por qué una unidad no puede salir. Viajan con el marco porque Inicio y «Ver como»
// arman el inicio del conductor. `redactor-ux` los revisa.

import { diaDeLaSemana, formatearFecha } from "./fechas.ts";
import type { FechaCivil, TipoDocumento } from "./tipos.ts";
import { concordar, type MotivoDeLicencia, NOMBRES_DOCUMENTO, pluralizar, puntoEnFrase, textoFaltantes } from "./textos-base.ts";

export const TEXTO_INICIO_CONDUCTOR = {
  /** Estado 7 del panel «Hoy» (6.4). */
  antesDeSalir: "Antes de salir, revise la unidad y envíe la revisión.",
  empezar: "Empezar la revisión",
  continuar: "Continuar la revisión",
  descartar: "Descartar borrador",
  verParte: "Ver el parte",
  enviado: "Cerrado",
  /** Estado 3: el parte está en uso. */
  alTerminar: "Al terminar la jornada, cierre el parte con el kilometraje y el combustible.",
  cerrar: "Cerrar el parte",
  usarOtra: "Usar otra unidad",
  elegirUnidad: "Elija la unidad",
  continuarPendiente: "Continuarlo",
  cargarPendiente: "Cargarlo",
  cerrarPendiente: "Cerrarlo",
  /** Estado 5: la licencia no ampara hoy (L1, segunda persona). */
  licenciaAvise: "Avise al encargado: cuando cargue una licencia vigente, podrá empezar la revisión.",
  revisionConservada: "Tiene una revisión empezada: se conserva.",
  /** P19: un parte sin salida (novedad crítica en la revisión) cierra el día de esa unidad, aunque se resuelva la novedad. */
  sinSalidaHastaManana: "Aunque el encargado resuelva la novedad hoy, la unidad no vuelve a salir hasta mañana.",
  licenciaTitulo: "Su licencia",
  ultimosTitulo: "Mis últimos partes",
  ultimosVacio: "Todavía no cerró partes. Los últimos cinco aparecerán aquí.",
  /** Enlace de «Mis últimos partes» a la pantalla «Mis partes»; el nombre accesible dice a dónde lleva (hay otro «Ver todos» en la página). */
  verTodosPartes: { visible: "Ver todos", nombre: "Ver todos mis partes" },
} as const;

const NUMEROS_EN_LETRAS = ["cero", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"] as const;

/**
 * Línea de contexto de «Mis partes», a continuación del nombre: «los últimos cinco» (con 5), «el último» (con 1), «los últimos 12» (de 11 en adelante).
 * Con 0 no hay nada que contar: devuelve «Sin partes cerrados».
 */
export function textoUltimosPartes(n: number): string {
  if (n <= 0) return "Sin partes cerrados";
  if (n === 1) return "el último";
  return `los últimos ${n <= 10 ? NUMEROS_EN_LETRAS[n] : n}`;
}

/** Documentos de nombre femenino, con el artículo que les toca (el resto es masculino). */
function articuloYNombreDeDocumento(tipo: TipoDocumento): string {
  const nombre = NOMBRES_DOCUMENTO[tipo];
  return `${concordar(tipo, "El", "La")} ${nombre.charAt(0).toLowerCase()}${nombre.slice(1)}`;
}

/** Hasta cuántos días antes del vencimiento se avisa al conductor (el mismo plazo que el grupo «7 días o menos»). */
export const DIAS_DE_AVISO_AL_CONDUCTOR = 7;

/**
 * Título del aviso al conductor en «Su unidad»: «La revisión técnica vence hoy», «El seguro vence mañana», «La revisión técnica vence en 5 días».
 * Sirve para cualquier documento. Fuera de 0 a 7 días no hay aviso (`null`): un documento vencido lo dice el bloqueo, no este aviso.
 */
export function textoAvisoDeDocumento(tipo: TipoDocumento, dias: number): string | null {
  if (!Number.isInteger(dias) || dias < 0 || dias > DIAS_DE_AVISO_AL_CONDUCTOR) return null;
  const cuando = dias === 0 ? "hoy" : dias === 1 ? "mañana" : `en ${dias} días`;
  return `${articuloYNombreDeDocumento(tipo)} vence ${cuando}`;
}

/**
 * La frase que acompaña al aviso: hasta el día del vencimiento incluido la unidad puede salir. Mismo rango que `textoAvisoDeDocumento`; fuera de él, `null`.
 */
export function textoFraseDelAviso(dias: number): string | null {
  if (!Number.isInteger(dias) || dias < 0 || dias > DIAS_DE_AVISO_AL_CONDUCTOR) return null;
  if (dias === 0) return "Hoy la unidad puede salir; desde mañana, no, hasta que se renueve.";
  if (dias === 1) return "Hoy y mañana la unidad puede salir; desde pasado mañana, no. Avise al encargado para renovar el documento a tiempo.";
  return "Hasta el día del vencimiento la unidad puede salir. Avise al encargado para renovar el documento a tiempo.";
}

/** Aviso «Cerrar antes» (estado 5 bis del inicio y pantalla E): el primario y el renglón 2 del inicio. */
export const TEXTO_CERRAR_ANTES = {
  primario: "Cerrar el parte anterior",
  inicioRenglon2: "Ciérrelo primero; después podrá empezar la revisión de hoy.",
  /** Pantalla E con un borrador de esa fecha: «Tiene una revisión empezada para el 18/11/2026: se conserva.» */
  borradorEnPantalla: (fechaDelBorrador: FechaCivil) => `Tiene una revisión empezada para el ${formatearFecha(fechaDelBorrador)}: se conserva.`,
} as const;

/**
 * La opción del `select` Conductor del encargado en el parte (C13, QA B5): el dato primero y la patente al final, porque en el celular lo que se corta es el
 * final.
 * «Tamara Olivera · ZK 214 BD»; sin unidad asignada, solo el nombre. Sin licencia vigente: «Ivana Aguirre (sin licencia)», sin la patente, para que entre en el
 * campo a 360 px
 * (unos 240 px, 30 caracteres); a quien no tiene licencia no se le puede asignar el parte (L1), así que la patente ahí no ayuda a elegir, y el motivo lo
 * explica el error al elegirla.
 */
export function textoOpcionDeConductor(nombre: string, patente: string | null, sinLicencia: boolean): string {
  if (sinLicencia) return `${nombre} (sin licencia)`;
  return patente === null ? nombre : `${nombre} · ${patente}`;
}

/** «Hoy, miércoles 18/11/2026». */
export function textoHoyDelConductor(hoy: FechaCivil): string {
  return `Hoy, ${diaDeLaSemana(hoy)} ${formatearFecha(hoy)}`;
}

/** «Tiene una revisión empezada: faltan 5 datos.» */
export function textoBorradorDelConductor(faltan: number): string {
  if (faltan === 0) return "Tiene una revisión empezada y está lista para enviar.";
  return `Tiene una revisión empezada: ${textoFaltantes(faltan).toLowerCase()}.`;
}

/** «Cerrado a las 18:42». */
export function textoEnviadoALas(hora: string): string {
  return `Cerrado a las ${hora}`;
}

/** «En uso desde las 06:52». */
export function textoEnUsoDesde(hora: string): string {
  return `En uso desde las ${hora}`;
}

/** Parte cerrado sin salida (P16), en el inicio del conductor: «Revisión de las 06:52: novedad crítica en frenos. La unidad no salió.» */
export function textoSinSalidaDelConductor(hora: string | null, puntos: readonly string[]): string {
  const cuando = hora === null ? "Revisión" : `Revisión de las ${hora}`;
  const donde = puntos.length === 0 ? "novedad crítica" : `novedad crítica en ${puntos.map(puntoEnFrase).join(", ")}`;
  return `${cuando}: ${donde}. La unidad no salió.`;
}

/**
 * M1: la marca de un conductor sugerido en «¿Quién completa el parte?», según el caso que permite probar. Texto nuevo, a revisar por el redactor: lo ve quien elige a quién hacerle el
 * parte en la demo.
 */
export const TEXTO_CONDUCTOR_PARA_PROBAR = {
  "puede-salir": "Para probar: unidad apta y sin parte hoy",
  "documentacion-vencida": "Para probar: la unidad tiene la documentación vencida",
  "fuera-de-servicio": "Para probar: unidad fuera de servicio por una novedad crítica",
  "sin-licencia": "Para probar: sin licencia de conducir vigente",
} as const;

/** Estado 5 del panel «Hoy», renglón 1 (L1, segunda persona). */
export function textoNoPuedeManejarHoy(l: MotivoDeLicencia): string {
  if (l.motivo === "faltante") return "No puede manejar hoy: no tiene una licencia de conducir cargada.";
  if (l.motivo === "vencida") return `No puede manejar hoy: su licencia de conducir venció el ${formatearFecha(l.vence)}.`;
  return `No puede manejar hoy: su licencia nueva vale desde el ${formatearFecha(l.desde)}.`;
}

/** Pantalla «No se puede cargar este parte» por la licencia (L1, segunda persona). */
export function textoLicenciaDelConductorNoAmpara(fecha: FechaCivil, l: MotivoDeLicencia): string {
  const detalle =
    l.motivo === "faltante"
      ? "no hay ninguna cargada"
      : l.motivo === "vencida"
        ? `venció el ${formatearFecha(l.vence)}`
        : `la nueva vale desde el ${formatearFecha(l.desde)}`;
  const consecuencia = "Sin licencia vigente no se puede enviar la revisión ni salir con la unidad.";
  return `Para el ${formatearFecha(fecha)} no tiene licencia de conducir vigente (${detalle}). ${consecuencia}`;
}

export const TEXTO_BORRADOR_CONSERVADO = "El borrador se conserva: cuando el encargado cargue una licencia vigente, podrá enviarlo.";

/** P21: lo mismo cuando lo que falta es la documentación de la unidad. */
export const TEXTO_BORRADOR_CONSERVADO_POR_DOCUMENTACION = "El borrador se conserva: cuando se renueve la documentación, podrá enviarlo.";

/** Unidad fuera de servicio, vista del conductor: no tiene que hacer parte. */
export function textoSinParteFueraDeServicio(patente: string, desde: FechaCivil, motivo: string): string {
  return `${patente} está fuera de servicio desde el ${formatearFecha(desde)} (${motivo}). No hace falta parte.`;
}

// `AvisoDeAptitud` y `textoUnidadNoPuedeSalir` viven en `textos-base.ts`: la regla de salida de Inicio (carga inicial) arma con ellos la frase de la «Acción del día» y no puede arrastrar
// todo este módulo, que es de la pantalla Hoy. Se vuelven a exportar acá para quien ya los importaba de este módulo.
export { type AvisoDeAptitud, textoUnidadNoPuedeSalir } from "./textos-base.ts";

export function textoPendienteBorrador(fecha: FechaCivil, patente: string): string {
  return `${patente}: el parte del ${formatearFecha(fecha)} está empezado y sin enviar.`;
}

/** Pendiente de un parte en uso de un día anterior (P5). */
export function textoPendienteSinCerrar(fecha: FechaCivil, patente: string): string {
  return `${patente}: el parte del ${formatearFecha(fecha)} quedó sin cerrar.`;
}

export function textoPendienteSinParte(ayer: FechaCivil, patente: string): string {
  return `${patente}: no se envió el parte de ayer (${formatearFecha(ayer)}).`;
}

/** Su licencia, desde el punto de vista del conductor. `d` = días hasta el vencimiento; `null` si falta. */
export function textoSuLicencia(d: number | null, vence: FechaCivil | null): string {
  if (d === null || vence === null) return "Falta cargar su licencia. Avise al encargado.";
  const fecha = formatearFecha(vence);
  if (d < 0) return `Vencida hace ${pluralizar(-d, "día", "días")} (${fecha}). Avise al encargado.`;
  if (d === 0) return `Vence hoy (${fecha})`;
  if (d === 1) return `Vence mañana (${fecha})`;
  return `Vence en ${d} días (${fecha})`;
}

/**
 * Veredicto de la llave de Hoy (etapa 2, 15.8; decisión DE3, 28/11/2026: solo donde hay algo que decidir). En «En uso» y «Cerrado» el pie de la llave lleva la etiqueta de estado que ya
 * existe («En uso desde las 06:52», `TEXTO_INICIO_CONDUCTOR.enviado`): decir «Puede salir» ahí sería falso (la unidad ya salió o ya volvió).
 */
export const TEXTO_VEREDICTO = {
  sale: "Puede salir",
  /** Los tres casos de la unidad: bloqueada por documentos, fuera de servicio y cerrada sin salida. */
  noSale: "No puede salir hoy",
  /** Habla del conductor: el aviso que sigue ya empieza con «No puede manejar hoy: …» y no puede repetirse. */
  sinLicencia: "Sin licencia vigente",
  /** «Cerrar antes»: no es un bloqueo, es una tarea. */
  cierrePendiente: "Cierre pendiente",
} as const;
