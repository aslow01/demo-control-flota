// Textos del formulario del parte, del inicio del conductor y de la pantalla del parte (docs/diseno-ui.md, 5.12 a 5.15, 6.4 y 6.5; paso 4.5). `redactor-ux` los revisa.

import { diaDeLaSemana, formatearFecha } from "./fechas.ts";
import type { FechaCivil, TipoDocumento } from "./tipos.ts";
import { concordar, formatearKm, type MotivoDeLicencia, NOMBRES_DOCUMENTO, pluralizar, puntoEnFrase, textoFaltantes } from "./textos-base.ts";

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

/**
 * El aviso compacto de dos renglones: el hecho (`titular`, firme) y lo que hay que hacer (`accion`, más chico; vacío si no hay nada que hacer). Lo arma la
 * lógica: la vista no corta ningún texto.
 */
export interface AvisoDeAptitud {
  titular: string;
  accion: string;
}

/**
 * Aviso sobre una unidad que está en servicio pero no puede salir (documentos): «ZK 214 BD no puede salir: Seguro vencido hace 1 día.» y, solo al conductor,
 * «Avise al encargado antes de usarla.».
 */
export function textoUnidadNoPuedeSalir(patente: string, motivos: readonly string[], alConductor: boolean): AvisoDeAptitud {
  return { titular: `${patente} no puede salir: ${motivos.join("; ")}.`, accion: alConductor ? "Avise al encargado antes de usarla." : "" };
}

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
