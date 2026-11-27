// Textos del formulario del parte, del inicio del conductor y de la pantalla del parte (docs/diseno-ui.md, 5.12 a 5.15, 6.4 y 6.5; paso 4.5). `redactor-ux` los revisa.

import { formatearFecha } from "./fechas.ts";
import type { FechaCivil } from "./tipos.ts";
import { formatearKm, pluralizar, textoFaltantes } from "./textos-base.ts";

/**
 * Pantalla del parte (diseno-ui.md 5.x y sección 10). Una unidad fuera de servicio por una novedad crítica vuelve cuando el
 * encargado resuelve la novedad y usa «Volver a servicio» (A4, N2): «revisar» no es una acción de la demo.
 */
export const TEXTO_PARTE = {
  /** Nota en tono crítico bajo un punto crítico marcado «Con novedad». */
  puntoCritico:
    "Al enviar la revisión, la unidad queda fuera de servicio y no sale, hasta que el encargado resuelva la novedad y la vuelva a poner en servicio.",
  /** Aviso del panel «Parte enviado» cuando hubo una novedad crítica. */
  enviadoConCritica: "La unidad quedó fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio.",
} as const;

export const TEXTO_FORMULARIO_PARTE = {
  /** P4: lo que falta, con el mensaje que va sobre el campo y en el resumen de arriba (5.15). */
  faltante: {
    conductor: "Elija quién conduce la unidad.",
    kmInicio: "Escriba el kilometraje al iniciar.",
    kmFin: "Escriba el kilometraje al terminar.",
    combustible: "Elija el nivel de combustible.",
    otraNovedad: "Cuente qué pasó en «Otra novedad» (al menos 3 caracteres) o déjela vacía.",
  },
  itemSinResponder: (punto: string) => `Elija una opción para ${punto}.`,
  itemSinDescripcion: (punto: string) => `Cuente qué encontró en ${punto} (al menos 3 caracteres).`,
  /** D1: con más de 3 puntos sin completar, el resumen de errores trae un solo enlace, que lleva al primero. */
  faltanPuntos: (n: number) => `Faltan ${n} puntos de la revisión`,
  /** Título del resumen de errores: todo lo que hay son faltantes (P4), o hay también errores de reglas o de formato. */
  tituloFaltan: (n: number, paso: "revision" | "cierre" = "revision") =>
    `${textoFaltantes(n)} para ${paso === "revision" ? "enviar la revisión" : "cerrar el parte"}`,
  tituloRevise: (n: number, paso: "revision" | "cierre" = "revision") =>
    `Revise ${pluralizar(n, "dato", "datos")} para ${paso === "revision" ? "enviar la revisión" : "cerrar el parte"}`,
  /** C5: la barra de envío con un error de reglas a la vista (el mismo número que el título del resumen). */
  barraRevise: (n: number) => `Revise ${pluralizar(n, "dato", "datos")}`,
  tituloGeneral: "No se pudo enviar la revisión",
  tituloGeneralCierre: "No se pudo cerrar el parte",
  /** El resumen cuando falla «Descartar borrador» (QA B2): no es un envío. */
  tituloNoSePudoDescartar: "No se pudo descartar el borrador",
  /** Barra de envío (5.14). */
  barraLista: "Listo para enviar",
  barraListaCierre: "Listo para cerrar",
  sinRecorrido: "—",
  /** Ayudas de los campos (5.11). */
  ayudaPrimerRegistro: "Es el primer registro de esta unidad.",
  ayudaKmFin: "Lo que marca el tablero al terminar la jornada.",
  ayudaLitros: "Déjelo vacío si no cargó.",
  fueraDePlazo: (fecha: FechaCivil) => `Este parte es del ${formatearFecha(fecha)}: la revisión se enviará fuera de plazo.`,
  borradorDescartado: "Borrador descartado.",
} as const;

/** Indicador de guardado (5.15): lo que se ve y lo que se anuncia al lector (solo cuando cambia de estado, no en cada guardado). */
export const TEXTO_GUARDADO = {
  guardando: "Guardando…",
  guardado: (hora: string) => `Guardado en este equipo a las ${hora}`,
  /** P3: un dato con un error de formato no se guarda. */
  conErroresDeCampo: "Sin guardar: corrija los campos marcados.",
  /** Mientras la persona escribe un dato con formato inválido: todavía no hay un campo marcado, así que no se la manda a mirar uno (accesibilidad N1). */
  sinValidar: "Sin guardar: lo escrito todavía no es válido.",
  /** D10 y 5.15: la escritura falló; lo escrito sigue en pantalla. */
  error: "No se pudo guardar en este equipo. Lo escrito sigue en pantalla; no cierre la pestaña.",
  anuncioGuardado: "Borrador guardado en este equipo.",
  anuncioRecuperado: "Borrador guardado de nuevo en este equipo.",
  anuncioConErroresDeCampo: "Hay datos que no se pueden guardar: revise los campos marcados.",
  /** Un borrador que ya existía al abrir el parte (sobrevivió a una recarga). */
  recuperado: (fecha: string, hora: string) => `Borrador recuperado, guardado en este equipo el ${fecha} a las ${hora}.`,
  /** El instante guardado no se puede leer (almacenamiento con la forma rota): no se inventa una hora. */
  recuperadoSinFecha: "Borrador recuperado.",
} as const;

export const TEXTO_PANTALLA_PARTE = {
  noDisponible: "No se puede cargar este parte",
  descartar: "Descartar borrador",
  conductorEtiqueta: "Conductor",
  conductorSinElegir: "Elija quién conduce",
  vueltaConductor: "Hoy",
  vueltaFicha: (patente: string) => `Ficha de ${patente}`,
  impideUso: "Impide usar la unidad",
  otraNovedad: "Otra novedad (opcional)",
  enviado: "Parte cerrado",
  /** Los `h1` de los dos pasos y el renglón de contexto (6.5). */
  tituloRevision: "Revisión antes de salir",
  tituloCierre: "Cierre de la jornada",
  contexto: (diaConFecha: string, paso: 1 | 2) => `Parte del ${diaConFecha} · paso ${paso} de 2`,
  /** Resultados C1 y C2. */
  tituloRevisionEnviada: "Revisión enviada",
  tituloSinSalida: "La unidad no puede salir",
  volverAlInicio: "Volver al inicio",
  /** Lo mismo con el perfil Conductor: su pantalla de entrada se llama «Hoy». */
  volverAHoy: "Volver a Hoy",
  completarCierreAhora: "Completar el cierre ahora",
  completarCierre: "Completar el cierre",
  verLaRevision: "Ver la revisión",
  encargadoLaVe: "El encargado la ve en Inicio.",
  alTerminarVuelva: "Al terminar la jornada, vuelva a este parte para cerrarlo con el kilometraje y el combustible.",
  /** C1 de un parte de un día pasado: la jornada ya terminó (C4 de la revisión visual). */
  faltaCerrarJornadaPasada: "Falta cerrar este parte con el kilometraje y el combustible de esa jornada.",
  /** C2 con el perfil Conductor: «Usar otra unidad» está en «Hoy». */
  siTieneQueSalir: "Si tiene que salir, elija otra unidad en Hoy.",
  /** C2 con el perfil Encargado: «Hoy» no es su pantalla, así que conserva la frase de antes. */
  siTieneQueSalirEncargado: "Si tiene que salir, elija otra unidad desde el inicio.",
  sinLicenciaVigente: "sin licencia vigente",
  sinUsoSinSalida: "Sin uso: la unidad no salió",
  noSeRegistroSinSalida: "No se registró: la unidad no salió",
  sinNovedades: "Sin novedades",
  noCargo: "No cargó",
  fueraDePlazo: "Revisión enviada fuera de plazo.",
  rotulos: {
    alIniciar: "Al iniciar",
    recorrido: "Recorrido",
    combustible: "Combustible",
    litros: "Combustible cargado",
    novedades: "Novedades",
    avisos: "Avisos aceptados",
    revision: "Revisión",
    cierre: "Cierre",
  },
} as const;

/** C1: «ZK 214 BD puede salir. Revisión enviada a las 06:52.»; fuera de plazo: «Revisión del 17/11/2026 enviada el 18/11/2026 a las 08:10 (fuera de plazo).» */
export function textoLineaRevisionEnviada(patente: string, fecha: FechaCivil, diaDeEnvio: FechaCivil | null, hora: string | null): string {
  if (diaDeEnvio === null || hora === null) return `${patente} puede salir. Revisión enviada.`;
  if (fecha === diaDeEnvio) return `${patente} puede salir. Revisión enviada a las ${hora}.`;
  return `Revisión del ${formatearFecha(fecha)} enviada el ${formatearFecha(diaDeEnvio)} a las ${hora} (fuera de plazo).`;
}

/** C2: «Revisión enviada a las 06:52 con una novedad crítica: Frenos.» / «… con 2 novedades críticas: Frenos, Dirección.» */
export function textoLineaSinSalida(hora: string | null, puntos: readonly string[]): string {
  const cuando = hora === null ? "Revisión enviada" : `Revisión enviada a las ${hora}`;
  const que = puntos.length === 1 ? "una novedad crítica" : `${puntos.length} novedades críticas`;
  return `${cuando} con ${que}: ${puntos.join(", ")}.`;
}

/** C2: lo que pasó con la unidad. */
export function textoUnidadQuedoFueraDeServicio(patente: string): string {
  return `${patente} quedó fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio. El parte quedó cerrado sin uso.`;
}

/** C3: «ZK 214 BD, 18/11/2026: revisión a las 06:52, cierre a las 18:42.» Sin hora legible no se inventa: se omite. */
export function textoLineaParteCerrado(patente: string, fecha: FechaCivil, horaRevision: string | null, horaCierre: string | null): string {
  const partes: string[] = [];
  if (horaRevision !== null) partes.push(`revisión a las ${horaRevision}`);
  if (horaCierre !== null) partes.push(`cierre a las ${horaCierre}`);
  return partes.length === 0 ? `${patente}, ${formatearFecha(fecha)}: parte cerrado.` : `${patente}, ${formatearFecha(fecha)}: ${partes.join(", ")}.`;
}

/** Resumen del paso 2: «Revisión enviada a las 06:52 · Al iniciar: 84.320 km · Sin novedades». */
export function textoResumenDeLaRevision(hora: string | null, kmInicio: number | null, novedades: readonly string[], conductor: string | null): string {
  const partes = [hora === null ? "Revisión enviada" : `Revisión enviada a las ${hora}`];
  partes.push(kmInicio === null ? "Al iniciar: —" : `Al iniciar: ${formatearKm(kmInicio)} km`);
  partes.push(novedades.length === 0 ? TEXTO_PANTALLA_PARTE.sinNovedades : `${pluralizar(novedades.length, "novedad", "novedades")}: ${novedades.join(", ")}`);
  if (conductor !== null) partes.push(`Conductor: ${conductor}`);
  return partes.join(" · ");
}

/** Novedades de un parte enviado: «Sin novedades», «1 crítica: Frenos», «2 críticas: Frenos, Dirección; 1 normal: Otra novedad». */
export function textoNovedadesDelParte(criticas: readonly string[], normales: readonly string[]): string {
  const partes: string[] = [];
  if (criticas.length > 0) partes.push(`${pluralizar(criticas.length, "crítica", "críticas")}: ${criticas.join(", ")}`);
  if (normales.length > 0) partes.push(`${pluralizar(normales.length, "normal", "normales")}: ${normales.join(", ")}`);
  return partes.length === 0 ? TEXTO_PANTALLA_PARTE.sinNovedades : partes.join("; ");
}

/** «9 puntos en orden: Dirección, Neumáticos…» (parte en lectura). */
export function textoPuntosEnOrdenConNombres(nombres: readonly string[]): string {
  return `${pluralizar(nombres.length, "punto", "puntos")} en orden: ${nombres.join(", ")}`;
}
