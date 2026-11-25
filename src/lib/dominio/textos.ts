// Textos de la interfaz que produce el dominio (errores, estados, resúmenes, motivos y alertas), en español neutro y en un solo lugar.
// Lo único que queda afuera: los mensajes de un contexto mal armado (error de programación, no de la persona) en comandos.ts.

import { diaDeLaSemana, formatearFecha } from "./fechas.ts";
import type { Advertencia, FechaCivil, TipoDocumento, TipoUnidad } from "./tipos.ts";

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

/**
 * V1 a V6: texto del estado de un vencimiento. `d` = días desde hoy hasta el vencimiento. Con `tipo`, «vencido» concuerda con el documento
 * («Seguro vencido», «Revisión técnica vencida»); sin tipo, masculino.
 */
export function textoVencimiento(d: number, vence: FechaCivil, tipo?: TipoDocumento): string {
  if (d < 0) return `${tipo === undefined ? "Vencido" : concordar(tipo, "Vencido", "Vencida")} hace ${pluralizar(-d, "día", "días")}`;
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
  unidadInexistente: "No se encontró la unidad. Vuelva a la lista e intente de nuevo.",
  conductorInexistente: "No se encontró el conductor. Vuelva a la lista e intente de nuevo.",
  conductorInactivo: "El conductor no está activo.",
  proyectoInexistente: "No se encontró el proyecto. Vuelva a la lista e intente de nuevo.",
  documentoInexistente: "No se encontró el documento. Vuelva a la lista e intente de nuevo.",
  parteInexistente: "No se encontró el parte. Vuelva a la lista e intente de nuevo.",
  novedadInexistente: "No se encontró la novedad. Vuelva a la lista e intente de nuevo.",
  parteEnviadoInmutable: "Un parte enviado no se puede modificar.",
  /** P7: la revisión de un parte en uso ya no cambia. */
  revisionYaEnviada: "La revisión ya se envió: no se puede modificar.",
  /** El cierre o su autoguardado de un parte que todavía es un borrador. */
  parteSinRevision: "Primero envíe la revisión antes de salir.",
  sinCambios: "No hay cambios para guardar.",
  unidadYaFueraDeServicio: "La unidad ya está fuera de servicio.",
  unidadYaEnServicio: "La unidad ya está en servicio.",
  novedadYaResuelta: "La novedad ya está resuelta.",
  documentoNoVigente: "Solo se puede renovar el documento vigente. Si un dato está mal, use «Corregir».",
  emisionPosterior: "La fecha de emisión no puede ser posterior al vencimiento.",
  fechaFutura: "La fecha no puede ser posterior a hoy.",
  advertenciasSinAceptar: "Revise las advertencias y acéptelas para enviar el parte.",
  tipoDeUnidadInvalido: "Elija el tipo de unidad.",
  combustibleInvalido: "Elija el nivel de combustible.",
  checklistInvalido: "Hay respuestas del checklist que no se pueden guardar. Revise cada punto.",
  otraNovedadInvalida: "Revise el texto de «Otra novedad».",
  parteOtraUnidad: "No se puede cambiar la unidad de un parte.",
  fechaInvalida: "Escriba una fecha válida.",
  parteFechaAntigua: "Solo se pueden cargar partes de los últimos 7 días.",
  kmVacio: "Escriba el kilometraje.",
  kmNegativo: "El kilometraje no puede ser negativo.",
  kmNoNumerico: "Escriba el kilometraje solo con números.",
  kmDecimales: "Escriba el kilometraje sin decimales.",
  kmRango: "Escriba un kilometraje entero de 0 a 2.000.000.",
  litrosNoNumerico: "Escriba los litros con números, por ejemplo 45,5.",
  litrosDecimales: "Escriba los litros con un solo decimal, por ejemplo 45,5.",
  litrosCero: "Si no cargó combustible, deje el campo vacío.",
  internoRango: "El número interno tiene que ser un entero de 1 a 999.",
  noPudoGuardar: "No se pudo guardar en este equipo. No se aplicó ningún cambio y lo escrito sigue en pantalla. Intente de nuevo.",
  /** `reiniciar()` con la demo ya cargada: no hay formulario, y lo que había se conserva. */
  noPudoReiniciar: "No se pudo reiniciar la demo. Se conservaron los datos que tenía. Intente de nuevo.",
  noPudoCambiarVista: "No se pudo cambiar la vista. Intente de nuevo.",
  /** `cambiarPerfil` mientras hay cambios de otra pestaña sin actualizar (D9): guardaría el `meta` viejo de esta pestaña sobre el nuevo. */
  /** QA B2: la base se borró o se cambió desde otra pestaña con la demo abierta; la demo sigue en memoria. */
  almacenamientoPerdido:
    "Los datos guardados de la demo ya no están disponibles: se borraron o se cambiaron desde otra pestaña. " +
      "Puede seguir usándola, pero los cambios se pierden al cerrar o recargar la página.",
  cambiosEnOtraPestana: "Hay cambios hechos en otra pestaña. Pulse «Actualizar» en el aviso y vuelva a cambiar la vista.",
  sinPermiso: "Esta acción es solo del encargado. En «Ver como», elija «Encargado».",
  sinDatos: "La demo todavía no terminó de cargar. Espere un momento e intente de nuevo.",
  noPudoActualizar: "No se pudieron leer los cambios de la otra pestaña. Intente de nuevo; si sigue fallando, recargue la página.",
  noPudoGuardarElParte: "No se pudo guardar el parte. Lo escrito sigue en pantalla; no cierre la pestaña e intente de nuevo.",
} as const;

export function errKmExcedido(maximo: number): string {
  return `El kilometraje no puede superar ${formatearKm(maximo)} km.`;
}

export function errKmFinMenor(kmFin: number, kmInicio: number): string {
  return `El kilometraje al terminar (${formatearKm(kmFin)} km) es menor que al iniciar (${formatearKm(kmInicio)} km). Revise los dos números.`;
}

export function errKmRetrocede(patente: string, km: number, registro: string): string {
  return `El último registro de ${patente} es ${formatearKm(km)} km (${registro}). Revise el número. Si se cambió el tablero, hay que informarlo al encargado.`;
}

export function errKmSuperaSiguiente(fecha: FechaCivil, kmInicio: number): string {
  return `El kilometraje supera el del inicio del parte del ${formatearFecha(fecha)} (${formatearKm(kmInicio)} km). Revise el número.`;
}

export function errLitrosInvalidos(maximo: number): string {
  return `Escriba los litros con hasta un decimal, mayores que 0 y hasta ${maximo}.`;
}

export function errLitrosExcedidos(maximo: number): string {
  return `Los litros no pueden superar ${maximo}.`;
}

export function errTextoCorto(nombre: string, minimo: number): string {
  return `${nombre} tiene que tener al menos ${minimo} caracteres.`;
}

export function errTextoLargo(nombre: string, maximo: number): string {
  return `${nombre} no puede superar ${maximo} caracteres.`;
}

export function errVenceFueraDeRango(maxima: FechaCivil): string {
  return `La fecha de vencimiento no puede ser posterior al ${formatearFecha(maxima)}.`;
}

/** Los textos de los campos de texto libre (nombre con artículo y mensajes de vacío o de corto); los límites están en validacion.ts. */
export const TEXTOS_DE_CAMPO = {
  motivoFueraDeServicio: { nombre: "El motivo", vacio: "Escriba el motivo (por ejemplo, «En taller: cambio de embrague»)." },
  motivoBaja: { nombre: "El motivo", vacio: "Escriba el motivo de la baja." },
  motivoKm: { nombre: "El motivo", vacio: "Escriba el motivo de la corrección." },
  novedad: { nombre: "La descripción", vacio: "Escriba qué pasó." },
  resolucion: {
    nombre: "El texto",
    vacio: "Cuente en pocas palabras qué se hizo (al menos 5 caracteres).",
    corto: "Cuente en pocas palabras qué se hizo (al menos 5 caracteres).",
  },
  numeroDocumento: { nombre: "El número", vacio: "Escriba el número del documento." },
  emisor: { nombre: "El emisor", vacio: "" },
  marca: { nombre: "La marca", vacio: "Escriba la marca." },
  modelo: { nombre: "El modelo", vacio: "Escriba el modelo." },
} as const;

/** 5.2: cómo se llama cada ítem del checklist en el formulario. */
export const NOMBRES_ITEM_CHECKLIST = {
  frenos: "Frenos",
  direccion: "Dirección",
  neumaticos: "Neumáticos y rueda de auxilio",
  luces: "Luces y balizas",
  cinturones: "Cinturones de seguridad",
  perticaBaliza: "Pértiga con banderola y baliza",
  alarmaRetroceso: "Alarma de retroceso",
  niveles: "Niveles de aceite y agua",
  matafuego: "Matafuego a bordo",
  botiquin: "Botiquín y kit de emergencia",
  documentacion: "Documentación a bordo",
  cabina: "Orden y limpieza de la cabina",
  calzasAntiderrame: "Calzas y kit antiderrame",
  radio: "Radio de comunicación",
} as const;

/** V12: un obligatorio sin documento. */
export const TEXTO_FALTA_CARGAR = "Falta cargar";

/** Motivos que muestra la aptitud de una unidad (A1). */
export const MOTIVO_APTITUD = {
  baja: (desde: FechaCivil, motivo: string) => `Dada de baja el ${formatearFecha(desde)}: ${motivo}`,
  /** Va junto a la etiqueta «Fuera de servicio»: solo la fecha y el motivo, sin repetir el estado. */
  fueraDeServicio: (desde: FechaCivil, motivo: string) => `Desde el ${formatearFecha(desde)}: ${minuscula(motivo)}`,
  documentoFaltante: (nombre: string) => `${TEXTO_FALTA_CARGAR}: ${nombre}`,
  novedadCritica: (rotulo: string, origen: string) => `Novedad crítica abierta: ${rotulo} (${origen})`,
  /** P19: hoy hubo una novedad crítica (en la revisión o cargada a mano); aunque se resuelva, la unidad no sale hasta mañana. */
  sinSalidaHoy: "Sin salida hasta mañana (novedad crítica de hoy)",
} as const;

/** Textos de las alertas de operación (sección 7). */
export const TEXTO_ALERTA = {
  parteSinEnviar: (fecha: FechaCivil, iniciadoPor: string | null) =>
    `Parte del ${formatearFecha(fecha)} sin enviar${iniciadoPor === null ? "" : ` (iniciado por ${iniciadoPor})`}`,
  /** P5: el parte salió (la revisión se envió) y falta el cierre. */
  parteSinCerrar: (fecha: FechaCivil, salioCon: string | null) =>
    `Parte del ${formatearFecha(fecha)} sin cerrar${salioCon === null ? "" : ` (salió con ${salioCon})`}`,
  sinParte: (ayer: FechaCivil) => `Sin parte de ayer (${formatearFecha(ayer)})`,
} as const;

/** B2: el nombre de un punto del checklist dentro de una frase va en minúscula («novedad crítica en frenos», no «en Frenos»). */
export function puntoEnFrase(nombre: string): string {
  return nombre.toLowerCase();
}

/** Motivo con que una novedad crítica deja la unidad fuera de servicio (A3). */
export const MOTIVO_NOVEDAD_CRITICA = {
  /**
   * El parte se nombra solo si es de otro día que el «Desde» del motivo (`desde`): «Desde el 20/11/2026: novedad crítica en frenos» no repite la fecha (C3 de
   * la revisión visual).
   */
  delParte: (fecha: FechaCivil, items: string, desde: FechaCivil) => {
    const parte = fecha === desde ? "" : `, parte del ${formatearFecha(fecha)}`;
    return `Novedad crítica en ${puntoEnFrase(items)}${parte}`;
  },
  cargada: (fecha: FechaCivil, descripcion: string) => `Novedad crítica cargada el ${formatearFecha(fecha)}: ${descripcion}`,
} as const;

/** Pasa a minúscula la primera letra: el motivo va después de «:» y no abre oración. */
function minuscula(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

/** Acorta un texto a `max` caracteres terminando en «…». */
export function abreviar(texto: string, max: number): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

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

/**
 * Corregir el vencimiento de un documento que reemplazó a otro (V9, V10): tiene que seguir siendo posterior al del anterior. No habla de «renovación»: se está
 * corrigiendo, no renovando.
 */
export function errVenceNoPosteriorAlAnterior(anteriorVence: FechaCivil): string {
  return `El vencimiento tiene que ser posterior al del documento anterior (${formatearFecha(anteriorVence)}).`;
}

export function errVenceAntesQueSuRenovacion(venceRenovacion: FechaCivil): string {
  return `El vencimiento tiene que ser anterior al de su renovación (${formatearFecha(venceRenovacion)}).`;
}

export function errDocumentoExistente(nombre: string): string {
  return `Ya hay cargado un documento «${nombre}». Para actualizarlo, use «Renovar».`;
}

export function errTipoDeDocumentoNoCorresponde(nombre: string, titular: "unidad" | "conductor"): string {
  return `${nombre} no corresponde a ${titular === "unidad" ? "una unidad" : "un conductor"}.`;
}

export function errNovedadesCriticasAbiertas(lista: readonly string[]): string {
  return `Antes de volver a servicio, resuelva: ${lista.join(", ")}.`;
}

export function errParteDuplicado(patente: string, fecha: FechaCivil, estado: "borrador" | "en-uso" | "enviado"): string {
  const final = estado === "enviado" ? "Ábralo para verlo." : "Ábralo para continuar.";
  const nombre = estado === "en-uso" ? "en uso" : estado;
  return `Ya hay un parte de ${patente} para el ${formatearFecha(fecha)} (${nombre}). ${final}`;
}

/** L1: el motivo por el que la licencia de un conductor no ampara la fecha de un parte (L5), en tercera persona: el dominio no sabe qué perfil está mirando. */
export type MotivoDeLicencia = { motivo: "faltante" } | { motivo: "vencida"; vence: FechaCivil } | { motivo: "posterior"; desde: FechaCivil };

export function errLicenciaNoVigente(nombre: string, fecha: FechaCivil, estado: MotivoDeLicencia): string {
  if (estado.motivo === "faltante") return `${nombre} no tiene licencia de conducir cargada. Elija otro conductor.`;
  const detalle = estado.motivo === "vencida" ? `venció el ${formatearFecha(estado.vence)}` : `la nueva vale desde el ${formatearFecha(estado.desde)}`;
  return `${nombre} no tiene licencia vigente para el ${formatearFecha(fecha)}: ${detalle}. Elija otro conductor.`;
}

/**
 * P21: la unidad no tiene la documentación en regla a la fecha del parte, así que no puede salir y la revisión no se envía. Un renglón por documento y qué hacer: el conductor avisa al encargado, que es quien renueva; el comando, que no sabe quién mira, le habla al
 * encargado.
 */
export function errDocumentacionDeLaUnidad(documentos: readonly TipoDocumento[], contexto: ContextoDeDocumentacion, alConductor: boolean): string {
  const accion = alConductor ? AVISE_AL_ENCARGADO : "Renueve la documentación antes de enviar la revisión.";
  return `${textoDocumentacionDeLaUnidad(documentos, contexto)} ${accion}`;
}

/** P21, sin la indicación de qué hacer: «El seguro de ZK 214 BD venció el 17/11/2026. La unidad no puede salir.» */
export function textoDocumentacionDeLaUnidad(documentos: readonly TipoDocumento[], contexto: ContextoDeDocumentacion): string {
  return `${renglonesDeDocumentacion(documentos, contexto).join(" ")} La unidad no puede salir.`;
}

/** Lo que se le dice al conductor cuando lo que falta lo resuelve el encargado (P21). */
export const AVISE_AL_ENCARGADO = "Avise al encargado.";

/** M3: la corrección de kilometraje no cambiaría nada porque hay un registro posterior. */
export function errKmCorreccionAnterior(registro: "parte" | "correccion", fecha: FechaCivil): string {
  // `fecha` es la del registro (la fecha del parte, o desde cuándo vale la corrección), no el día en que se envió.
  const que = registro === "parte" ? `un parte del ${formatearFecha(fecha)}` : `una corrección del ${formatearFecha(fecha)}`;
  const cual = registro === "parte" ? "de ese parte" : "de esa corrección";
  return `Ya hay ${que}, posterior a la fecha elegida: la corrección no cambiaría el kilometraje actual. Use la fecha ${cual} o una posterior.`;
}

/**
 * «ZK 214 BD: el parte del martes 17/11/2026 quedó sin cerrar.» Renglón 1 del aviso «Cerrar antes» (inicio y pantalla E) y del error de P18. Un parte de hoy
 * (P20: el conductor lo
 * tiene en otra unidad) no «quedó» sin cerrar, sigue en curso: «ZK 214 BD: el parte de hoy está en uso.». `hoy` es `null` si no se sabe (el parte de P18 es
 * siempre anterior a la revisión).
 */
export function textoParteSinCerrarDeLaUnidad(patente: string, fecha: FechaCivil, hoy: FechaCivil | null): string {
  if (fecha === hoy) return `${patente}: el parte de hoy está en uso.`;
  return `${patente}: el parte del ${diaDeLaSemana(fecha)} ${formatearFecha(fecha)} quedó sin cerrar.`;
}

/** Renglón 2 del aviso «Cerrar antes» en la pantalla E y en el error de P18: «Ciérrelo primero; después se puede empezar la revisión del 18/11/2026.» */
export function textoCerrarAntesDeLaRevision(fechaDeLaRevision: FechaCivil): string {
  return `Ciérrelo primero; después se puede empezar la revisión del ${formatearFecha(fechaDeLaRevision)}.`;
}

/** P18: la unidad tiene un parte en uso de una fecha anterior: hay que cerrarlo antes de empezar la revisión de una fecha posterior. */
export function errParteAnteriorSinCerrar(patente: string, fecha: FechaCivil, fechaDeLaRevision: FechaCivil): string {
  return `${textoParteSinCerrarDeLaUnidad(patente, fecha, null)} ${textoCerrarAntesDeLaRevision(fechaDeLaRevision)}`;
}

/**
 * P20: el conductor tiene un parte en uso en otra unidad: hay que cerrarlo antes de enviar esta revisión. Si el parte es de hoy, «tiene en uso el parte de hoy»
 * (no «sin cerrar»).
 */
export function errConductorConParteSinCerrar(nombre: string, patente: string, fecha: FechaCivil, hoy: FechaCivil): string {
  const sinCerrar = `tiene sin cerrar el parte del ${diaDeLaSemana(fecha)} ${formatearFecha(fecha)} de ${patente}`;
  const parte = fecha === hoy ? `tiene en uso el parte de hoy de ${patente}` : sinCerrar;
  return `${nombre} ${parte}. Ciérrelo primero; después se puede enviar esta revisión.`;
}

/** M1 (revisión de código): no se corrige el kilometraje desde la fecha de un parte en uso; su cierre quedaría imposible. */
export function errKmCorreccionParteEnUso(fecha: FechaCivil): string {
  return `El parte del ${formatearFecha(fecha)} está en uso. Ciérrelo antes de corregir el kilometraje desde esa fecha.`;
}

/** A7: una unidad con un parte en uso no se da de baja (el cierre se rechaza para una unidad de baja y el parte quedaría huérfano). */
export function errUnidadConParteEnUso(patente: string, fecha: FechaCivil): string {
  return `El parte del ${formatearFecha(fecha)} de ${patente} está en uso. Ciérrelo antes de dar de baja la unidad.`;
}

export function errUnidadFueraDeServicio(desde: FechaCivil, motivo: string): string {
  return `La unidad está fuera de servicio desde el ${formatearFecha(desde)} (${motivo}). Pida al encargado que la ponga de nuevo en servicio.`;
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
  revisionEnviada: (patente: string, fecha: FechaCivil, fueraDePlazo: boolean, kmInicio: number, sinSalida: boolean) =>
    `Revisión del ${formatearFecha(fecha)} de ${patente} enviada${fueraDePlazo ? " fuera de plazo" : ""}: ` +
    (sinSalida ? "la unidad no salió por una novedad crítica" : `sale con ${formatearKm(kmInicio)} km`),
  parteCerrado: (patente: string, fecha: FechaCivil, kmInicio: number, kmFin: number) => {
    const recorrido = kmFin - kmInicio;
    const texto = recorrido === 0 ? "sin uso" : `${formatearKm(recorrido)} km`;
    return `Parte del ${formatearFecha(fecha)} de ${patente} cerrado: ${formatearKm(kmInicio)} a ${formatearKm(kmFin)} km (${texto})`;
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

/**
 * Cómo se llama cada pantalla (barra, título de la página, migas, «Volver a …»). Lo usa el enrutador desde la etapa E1; hasta entonces `nombreDePantalla` conserva los nombres viejos.
 * `operacion` es la sección («Operación diaria»); sus dos solapas son «Checklists» y «Novedades». `conductor` es «Hoy» y `conductorPartes`, «Mis partes».
 */
export const NOMBRES_DE_PANTALLA = {
  inicio: "Inicio",
  movilidades: "Movilidades",
  vencimientos: "Vencimientos",
  operacion: "Operación diaria",
  operacionChecklists: "Checklists",
  operacionNovedades: "Novedades",
  conductor: "Hoy",
  conductorPartes: "Mis partes",
  mas: "Más",
  parte: "Parte diario",
  desconocida: "Página no encontrada",
  /** «Unidad ZK 214 BD» (la patente ya formateada). */
  unidad: (patente: string) => `Unidad ${patente}`,
  /** «Parte del miércoles 18/11/2026» (el día ya formateado). */
  parteDelDia: (diaConFecha: string) => `Parte del ${diaConFecha}`,
} as const;

/** D3: la empresa de ejemplo con su CUIT, que siempre se muestra rotulado como ficticio (puede coincidir con uno real). */
export function textoEmpresa(nombre: string, cuit: string): string {
  const digitos = cuit.replace(/[^0-9]/g, "");
  const escrito = digitos.length === 11 ? `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}` : cuit;
  return `${nombre} · CUIT ficticio ${escrito}`;
}

/** A8: la cifra «No disponibles hoy» de Inicio (bloqueadas por documentos + fuera de servicio), dicha en una frase. */
export function textoProtagonista(n: number): string {
  if (n === 0) return "Todas las unidades activas están disponibles hoy";
  return n === 1 ? "1 unidad no disponible hoy" : `${n} unidades no disponibles hoy`;
}

/** A8: "Disponibles hoy: 19 de 23 unidades activas." */
export function textoDisponibles(disponibles: number, activas: number): string {
  return `Disponibles hoy: ${disponibles} de ${pluralizar(activas, "unidad activa", "unidades activas")}.`;
}

/** 5.6: textos fijos del horizonte (los números van en `textoHorizonte`). */
export const TEXTO_HORIZONTE = {
  /** Caja de vencidos de la variante completa y de la mediana (rótulo compacto). */
  rotuloCajaCompleta: "Vencidos o faltantes",
  rotuloCajaMediana: "Vencidos",
  /** Centrado sobre la pista sin marcas. */
  vacio: "Nada vence en los próximos 30 días",
} as const;

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

/** Texto accesible de la insignia de la pestaña "Inicio". */
export function textoInsigniaAlertas(criticas: number): string {
  if (criticas === 0) return "Inicio";
  return `Inicio, ${pluralizar(criticas, "alerta crítica", "alertas críticas")}`;
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

/**
 * Cómo estaba la documentación de la unidad el día del parte (P21): la patente con espacios y, por tipo, la fecha en que venció o `null` si no había ninguna cargada.
 * La arma `contextoDeDocumentacion` (parte.ts) con los documentos y la fecha del parte; así el texto dice lo que pasaba ese día aunque después se haya renovado.
 */
export interface ContextoDeDocumentacion {
  patente: string;
  venceron: Partial<Record<TipoDocumento, FechaCivil | null>>;
}

/** «el seguro», «la revisión técnica», «la carga del matafuego»: el nombre en minúscula con su artículo. */
function conArticulo(tipo: TipoDocumento): string {
  const nombre = NOMBRES_DOCUMENTO[tipo];
  return `${concordar(tipo, "el", "la")} ${nombre.charAt(0).toLowerCase()}${nombre.slice(1)}`;
}

/** Un renglón por documento (C6): «El seguro de ZK 214 BD venció el 17/11/2026.» o «Falta cargar el seguro de ZK 214 BD.». */
function renglonesDeDocumentacion(documentos: readonly TipoDocumento[], contexto: ContextoDeDocumentacion): string[] {
  return documentos.map((tipo) => {
    const vencio = contexto.venceron[tipo] ?? null;
    const que = conArticulo(tipo);
    if (vencio !== null) return `${que.charAt(0).toUpperCase()}${que.slice(1)} de ${contexto.patente} venció el ${formatearFecha(vencio)}.`;
    return `Falta cargar ${que} de ${contexto.patente}.`;
  });
}

/** K6 y K7: cada advertencia de kilómetros que se acepta antes de enviar («Antes de enviar») y que queda en «Avisos aceptados» del parte. */
export function textoAdvertencia(a: Advertencia): string {
  switch (a.tipo) {
    case "salto-km":
      return `${formatearKm(a.km)} km sin registrar desde el último parte`;
    case "recorrido-largo":
      return `Recorrido del día inusualmente largo: ${formatearKm(a.km)} km`;
  }
}

/** Un renglón de «Avisos aceptados» (C3 y lectura de un parte): su texto y el tono con que se pinta. Los avisos de kilómetros son siempre de tono semana. */
export interface RenglonDeAviso {
  tono: "semana";
  texto: string;
}

/** Avisos globales del arranque y de la sincronización entre pestañas (D4, D5, D7, D8, D9). */
export const TEXTO_AVISO = {
  preparando: "Preparando la flota de ejemplo…",
  esquemaActualizado: "La demo se actualizó. Se cargó de nuevo la flota de ejemplo y no se conservaron los datos anteriores.",
  sinAlmacenamiento: "Este navegador no permite guardar datos. Puede usar la demo, pero los cambios se pierden al cerrar o recargar la página.",
  /** QA B2: la base se borró o se cambió desde otra pestaña con la demo abierta; la demo sigue en memoria. */
  almacenamientoPerdido:
    "Los datos guardados de la demo ya no están disponibles: se borraron o se cambiaron desde otra pestaña. " +
      "Puede seguir usándola, pero los cambios se pierden al cerrar o recargar la página.",
  cambiosEnOtraPestana: "Se hicieron cambios en otra pestaña. Esta pantalla sigue mostrando los datos anteriores hasta que actualice.",
} as const;

/** D5: los datos con cambios del visitante se conservan aunque el ejemplo sea de otra fecha. */
export function textoDatosDeOtraFecha(fechaBase: FechaCivil): string {
  return `Los datos de ejemplo son del ${formatearFecha(fechaBase)}. Al reiniciar la demo se actualizan a la fecha de hoy y se borran sus cambios.`;
}

/** diseno-ui.md 5.19: falla grave al iniciar. El título va en el `h1` y el mensaje en el párrafo de abajo (no se repiten). */
export const TEXTO_ERROR_ARRANQUE = {
  titulo: "No se pudo iniciar la demo",
  mensaje: "Recargue la página. Si el problema sigue, pruebe con otro navegador.",
} as const;

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

// ---------------------------------------------------------------------------------------------
// Inicio (antes «Centro de alertas»; docs/diseno-ui.md, 6.1 y 7) y diálogos Renovar y Cargar documento (5.17). `redactor-ux` los revisa.
// ---------------------------------------------------------------------------------------------

/** Rótulos fijos de Inicio (los que llevan números se arman con las funciones de abajo). */
export const TEXTO_CENTRO = {
  titulo: "Inicio",
  bajada: "Datos ficticios de una empresa inventada. Todo se guarda en este navegador.",
  protagonista: "No disponibles hoy",
  operacion: "Operación diaria",
  operacionVacia: "Sin pendientes de operación.",
  /** Barra de estado de «Operación diaria»: el botón-texto cambia la vista a Conductor, y el texto lo dice. */
  conductor: { intro: "Así lo carga el conductor:", accion: "Abrir el parte diario", aclaracion: "(cambia la vista a Conductor)" },
  vencimientos: "Vencimientos",
  vencimientosVacio: "Nada vence en los próximos 30 días.",
  grupoVacio: "No hay documentos en este grupo.",
  detalle: "Operación diaria: detalle",
  /** Etiqueta de las columnas de las listas sin valor (documento faltante). */
  sinFecha: "—",
} as const;

/** Títulos de los grupos de la lista de vencimientos (sin la cantidad) y rótulos cortos de los filtros (sección 7). */
export const TEXTO_GRUPO_VENCIMIENTOS = {
  vencidos: { titulo: "Vencidos o faltantes", filtro: "Vencidos o faltantes" },
  "7": { titulo: "Vencen en 7 días o menos", filtro: "7 días o menos" },
  "15": { titulo: "Vencen entre 8 y 15 días", filtro: "8 a 15 días" },
  "30": { titulo: "Vencen entre 16 y 30 días", filtro: "16 a 30 días" },
} as const;

/** Etiqueta de estado de cada tipo de alerta de operación (5.7). */
export const TEXTO_ESTADO_OPERACION = {
  "novedad-critica": "Crítica",
  "parte-sin-enviar": "Sin enviar",
  "sin-parte": "Sin parte",
  "novedad-abierta": "Abierta",
} as const;

/** «En uso»: la unidad salió hoy y falta el cierre (etiqueta de «Último parte»). */
export const TEXTO_ESTADO_PARTE_EN_USO = "En uso";

/** Etiqueta de estado de un parte incompleto (P5): la revisión no se envió, o se envió y falta el cierre. */
export const TEXTO_ESTADO_PARTE_INCOMPLETO = { borrador: "Sin enviar", "en-uso": "Sin cerrar" } as const;

/** «1 parte sin enviar» · «1 parte sin cerrar» · «3 partes sin enviar o sin cerrar» (fila de «Operación diaria»). */
export function textoFilaPartesIncompletos(borradores: number, enUso: number): string {
  const n = borradores + enUso;
  const partes = n === 1 ? "parte" : "partes";
  if (enUso === 0) return `${n} ${partes} sin enviar`;
  if (borradores === 0) return `${n} ${partes} sin cerrar`;
  return `${n} ${partes} sin enviar o sin cerrar`;
}

/** Título del grupo del detalle: «Partes sin enviar» · «Partes sin cerrar» · «Partes sin enviar o sin cerrar». */
export function tituloGrupoPartesIncompletos(borradores: number, enUso: number): string {
  if (enUso === 0) return "Partes sin enviar";
  if (borradores === 0) return "Partes sin cerrar";
  return "Partes sin enviar o sin cerrar";
}

/** L6: bloque «Conductores que no pueden manejar hoy (N)» del protagonista. */
export const TEXTO_CONDUCTORES_SIN_LICENCIA = {
  titulo: (n: number) => `Conductores que no pueden manejar hoy (${n})`,
  unidad: "Unidad",
  renovar: "Renovar",
  cargar: "Cargar",
  /** M2: la licencia cargada con una emisión futura (un error de tipeo) se corrige; no hay otra salida. */
  corregir: "Corregir",
  /** Nombre accesible del botón: «Renovar licencia de Luis Ferreyra». */
  nombreAccesible: (accion: "Renovar" | "Cargar" | "Corregir", nombre: string) => `${accion} licencia de ${nombre}`,
  /** Para lectores, después de la cifra del protagonista. */
  lector: (n: number) => (n === 1 ? "1 conductor no puede manejar hoy." : `${n} conductores no pueden manejar hoy.`),
  /** Barra de estado al guardar la licencia. */
  licenciaRenovada: (nombre: string) => `Licencia de ${nombre} renovada.`,
  licenciaCargada: (nombre: string) => `Licencia de ${nombre} cargada.`,
} as const;

/** L6: el motivo de una fila, según L5 («Licencia vencida hace 3 días», «Falta cargar la licencia», «Licencia válida desde el 20/11/2026»). */
export function textoMotivoSinLicencia(
  m: { motivo: "faltante" } | { motivo: "vencida"; diasVencida: number } | { motivo: "posterior"; desde: FechaCivil },
): string {
  if (m.motivo === "faltante") return "Falta cargar la licencia";
  if (m.motivo === "vencida") return `Licencia vencida hace ${pluralizar(m.diasVencida, "día", "días")}`;
  return `Licencia válida desde el ${formatearFecha(m.desde)}`;
}

/** Título de cada grupo del detalle de operación, sin la cantidad. */
export const TEXTO_GRUPO_OPERACION = {
  "novedad-critica": "Novedades críticas",
  "parte-sin-enviar": "Partes sin enviar",
  "sin-parte": "Unidades sin parte de ayer",
  "novedad-abierta": "Novedades abiertas",
} as const;

/**
 * R3: textos de las tres pantallas del encargado en la interfaz tipo app (Inicio, Vencimientos y Operación diaria): rótulos de las cifras, leyenda del
 * horizonte, estados vacíos (título + qué va ahí) y líneas de contexto. Vocabulario del prototipo aprobado; las cifras llevan su unidad y su período.
 */
export const TEXTO_INICIO = {
  /** Rótulos de las cuatro cifras secundarias (la principal es `TEXTO_CENTRO.protagonista`). */
  cifraVencidos: "Vencidos o faltantes",
  cifraProximos: "Vencen en 30 días",
  cifraPartes: "Partes pendientes",
  cifraNovedadCritica: (n: number) => (n === 1 ? "Novedad crítica" : "Novedades críticas"),
  /** Bajo la cifra principal cuando vale 0. */
  sinNoDisponibles: "Ninguna unidad bloqueada ni fuera de servicio",
  /** Panel «No disponibles hoy» sin unidades: no afirma nada sobre licencias, que no entran en la cifra. */
  noDisponiblesVacio: { titulo: "Todas las unidades activas están disponibles.", ayuda: "Ninguna está bloqueada por documentos ni fuera de servicio." },
  /** Enlace del panel de vencimientos; el nombre accesible dice a dónde lleva. */
  verTodosVencimientos: { visible: "Ver todos", nombre: "Ver todos los vencimientos" },
  /** Segunda línea del panel «Operación diaria» sin pendientes (la primera es `TEXTO_CENTRO.operacionVacia`). */
  operacionVaciaAyuda: "Aquí aparecerán los partes sin enviar o sin cerrar, las unidades sin parte y las novedades abiertas.",
} as const;

/** Leyenda del horizonte: una forma, su período y cuántos documentos hay. Los rótulos son los de los filtros de Vencimientos. */
export const TEXTO_LEYENDA_HORIZONTE = {
  vencidos: "Vencido o faltante",
  "7": TEXTO_GRUPO_VENCIMIENTOS["7"].filtro,
  "15": TEXTO_GRUPO_VENCIMIENTOS["15"].filtro,
  "30": TEXTO_GRUPO_VENCIMIENTOS["30"].filtro,
  /** Escala bajo la pista: «Hoy · 7 · 15 · 30 días». */
  escala: { hoy: "Hoy", sieteDias: "7", quinceDias: "15", treintaDias: "30 días" },
  /** Nombre accesible de la pista. */
  nombrePista: "Regla de vencimientos, de hoy a 30 días",
  /** Ayuda para quien navega con teclado o lector de pantalla. */
  ayudaTeclado: "Use las flechas para recorrerlos y Enter para ver el detalle.",
  /** Antes de elegir un punto (sin «Toque»: sirve con mouse, teclado y pantalla táctil). */
  ayudaDetalle: "Elija un punto para ver qué vence y de qué unidad.",
} as const;

/**
 * Nombre accesible de un punto de la regla de vencimientos: «ZK 214 BD, seguro: vence en 3 días» (de una unidad) o «licencia de conducir de Bruno Juárez: vence en 12 días»
 * (de un conductor). `estado` es el texto de `clasificar` («Vence en 3 días», «Vence hoy»); aquí solo se pasa a minúscula inicial.
 */
export function textoPuntoDeLaRegla(titular: { patente: string } | { conductor: string }, tipo: TipoDocumento, estado: string): string {
  const documento = NOMBRES_DOCUMENTO[tipo].toLowerCase();
  const que = "patente" in titular ? `${titular.patente}, ${documento}` : `${documento} de ${titular.conductor}`;
  return `${que}: ${estado.charAt(0).toLowerCase()}${estado.slice(1)}`;
}

/**
 * Texto para lector de pantalla del aro hueco de un día con más vencimientos de los que caben: «y 1 vencimiento más ese día», «y 3 vencimientos más ese día».
 * Sin vencimientos de más, vacío.
 */
export function textoYMasDelDia(ocultas: number): string {
  return ocultas <= 0 ? "" : `y ${pluralizar(ocultas, "vencimiento", "vencimientos")} más ese día`;
}

/** Un número de la leyenda dicho completo: «4 documentos, 7 días o menos». */
export function textoLeyendaConCantidad(rotulo: string, n: number): string {
  return `${pluralizar(n, "documento", "documentos")}, ${rotulo.charAt(0).toLowerCase()}${rotulo.slice(1)}`;
}

/** Línea de contexto de Vencimientos: «3 vencidos o faltantes · 9 vencen en 30 días» (los vencidos no se cuentan en los de 30 días). */
export function textoContextoVencimientos(vencidos: number, proximos: number): string {
  return `${pluralizar(vencidos, "vencido o faltante", "vencidos o faltantes")} · ${textoRotuloVencimientos(proximos)}`;
}

/** Línea de contexto de Operación diaria: «6 pendientes · al 25/11/2026». */
export function textoContextoOperacion(pendientes: number, hoy: FechaCivil): string {
  return `${textoPendientes(pendientes)} · al ${formatearFecha(hoy)}`;
}

/** Estados vacíos de Vencimientos y de las dos solapas de Operación: qué pasó y qué va a aparecer ahí. */
export const TEXTO_VACIO_PANTALLAS = {
  vencimientos: { titulo: "Nada vence en los próximos 30 días.", ayuda: "Cuando un documento entre en esa ventana, aparecerá aquí con su fecha." },
  checklists: { titulo: "No hay partes pendientes.", ayuda: "Si un conductor deja un parte sin enviar o sin cerrar, o una unidad queda sin parte, aparecerá aquí." },
  novedades: { titulo: "No hay novedades abiertas.", ayuda: "Las novedades que se cargan en un parte o en una ficha aparecerán aquí hasta que se resuelvan." },
  /** Un grupo sin filas dentro de una lista con otros grupos (por ejemplo, «Partes sin cerrar (0)»). */
  grupoSinFilas: "Ninguno.",
} as const;

/** «Unidades» junto a la cifra del protagonista: «1 unidad», «4 unidades» (con 0, «unidades»). */
export function palabraUnidades(n: number): "unidad" | "unidades" {
  return n === 1 ? "unidad" : "unidades";
}

/** Para lectores de pantalla: la frase completa en un solo texto, con punto final. */
export function textoProtagonistaLector(n: number): string {
  return `${textoProtagonista(n)}.`;
}

/** «Ver las 9 no disponibles en Movilidades». */
export function textoVerTodasEnLaFlota(n: number): string {
  return `Ver las ${n} no disponibles en Movilidades`;
}

/** Cabecera del panel de operación: «6 pendientes». */
export function textoPendientes(n: number): string {
  return pluralizar(n, "pendiente", "pendientes");
}

/** Cabecera del panel de vencimientos: «9 vencen en 30 días» (solo los que vencen en 30 días o menos; los vencidos o faltantes van aparte, con su propia cifra). */
export function textoRotuloVencimientos(n: number): string {
  return `${n} ${n === 1 ? "vence" : "vencen"} en 30 días`;
}

/** Región `role="status"` del filtro (5.8): «Mostrando 4 de 11 vencimientos.». */
export function textoMostrando(mostrados: number, total: number): string {
  return `Mostrando ${mostrados} de ${pluralizar(total, "vencimiento", "vencimientos")}.`;
}

/** Título de un grupo con su cantidad: «Vencidos o faltantes (2)». */
export function textoGrupoConCantidad(titulo: string, n: number): string {
  return `${titulo} (${n})`;
}

/** Fila del panel de operación diaria: «1 novedad crítica abierta», «2 unidades sin parte de ayer». */
export function textoFilaOperacion(tipo: keyof typeof TEXTO_ESTADO_OPERACION, n: number, diasLaMasAntigua: number | null): string {
  const uno = n === 1;
  switch (tipo) {
    case "novedad-critica":
      return `${n} ${uno ? "novedad crítica abierta" : "novedades críticas abiertas"}`;
    case "parte-sin-enviar":
      return `${n} ${uno ? "parte" : "partes"} sin enviar`;
    case "sin-parte":
      return `${n} ${uno ? "unidad" : "unidades"} sin parte de ayer`;
    case "novedad-abierta": {
      const antiguedad = diasLaMasAntigua === null ? "" : ` hace ${pluralizar(diasLaMasAntigua, "día", "días")}`;
      if (uno) return `1 novedad abierta${antiguedad}`;
      return `${n} novedades abiertas${antiguedad === "" ? "" : `, la más antigua${antiguedad}`}`;
    }
  }
}

/** Nombre accesible de los botones de documentos (lista de vencimientos y ficha): «Renovar seguro de ZK 214 BD». */
export function textoAccionDocumento(accion: "Renovar" | "Cargar" | "Corregir", tipo: TipoDocumento, titular: string): string {
  const nombre = NOMBRES_DOCUMENTO[tipo];
  return `${accion} ${nombre.charAt(0).toLowerCase()}${nombre.slice(1)} de ${titular}`;
}

/** Documentos de nombre femenino (el resto es masculino): para «renovado» y «renovada». */
const DOCUMENTO_FEMENINO: ReadonlySet<TipoDocumento> = new Set([
  "revision-tecnica",
  "matafuego",
  "habilitacion-proyecto",
  "licencia",
  "habilitacion-manejo",
]);

function concordar(tipo: TipoDocumento, masculino: string, femenino: string): string {
  return DOCUMENTO_FEMENINO.has(tipo) ? femenino : masculino;
}

/** Barra de estado después de renovar: «Seguro de ZK 214 BD renovado.» */
export function textoDocumentoRenovado(tipo: TipoDocumento, titular: string): string {
  return `${NOMBRES_DOCUMENTO[tipo]} de ${titular} ${concordar(tipo, "renovado", "renovada")}.`;
}

/** Barra de estado después de cargar: «Habilitación de ingreso al proyecto de ZP 088 KC cargada.» */
export function textoDocumentoCargado(tipo: TipoDocumento, titular: string): string {
  return `${NOMBRES_DOCUMENTO[tipo]} de ${titular} ${concordar(tipo, "cargado", "cargada")}.`;
}

/** Diálogo «Renovar documento» (5.17). */
export const TEXTO_RENOVAR = {
  titulo: (nombre: string, titular: string) => `Renovar: ${nombre} de ${titular}`,
  primario: "Guardar renovación",
  /** «Actual: póliza DEMO-88-4471, venció el 17/11/2026 (hace 1 día).» */
  vigente: (numero: string, estado: string, sustantivo: string) => `Actual: ${sustantivo} ${numero}, ${estado}.`,
  vencio: (vence: FechaCivil, dias: number) => `venció el ${formatearFecha(vence)} (hace ${pluralizar(dias, "día", "días")})`,
  venceHoy: (vence: FechaCivil) => `vence hoy (${formatearFecha(vence)})`,
  vence: (vence: FechaCivil, dias: number) => `vence el ${formatearFecha(vence)} (en ${pluralizar(dias, "día", "días")})`,
} as const;

/** Cómo se llama el documento junto a su número en la línea de contexto: la póliza de un seguro; el resto, «número». */
export const SUSTANTIVO_NUMERO_DOCUMENTO: Partial<Record<TipoDocumento, string>> = { seguro: "póliza" };

/** Diálogo «Cargar documento» (5.17). */
export const TEXTO_CARGAR = {
  titulo: (nombre: string, titular: string) => `Cargar: ${nombre} de ${titular}`,
  primario: "Guardar documento",
} as const;

// ---------------------------------------------------------------------------------------------
// Movilidades (antes «Flota»; docs/diseno-ui.md, 5.10 y 6.2) y diálogo «Agregar unidad» (5.17). `redactor-ux` los revisa.
// ---------------------------------------------------------------------------------------------

/** Cómo se llama cada tipo de unidad en la descripción de la fila y en el `select` «Tipo». */
export const NOMBRES_TIPO_UNIDAD: Record<TipoUnidad, string> = {
  camioneta: "Camioneta",
  utilitario: "Utilitario",
  "camion-liviano": "Camión liviano",
  minibus: "Minibús",
};

/** Rótulos fijos de la flota (los que llevan números se arman con las funciones de abajo). */
export const TEXTO_FLOTA = {
  /** Título del panel (el `h1` de la pantalla es «Movilidades»). */
  panel: "Unidades",
  todosLosProyectos: "Todos",
  /**
   * Filtros por estado (5.8), con el vocabulario único: «No disponibles hoy» = «Bloqueadas por documentos» + «Fuera de servicio».
   * «No disponibles hoy» solo aparece cuando viene de «Ver las N no disponibles en Movilidades» (E2-P lo vuelve una pastilla más).
   */
  filtros: {
    activas: "Activas",
    "pueden-salir": "Disponibles",
    "no-pueden-salir": "Bloqueadas por documentos",
    "fuera-de-servicio": "Fuera de servicio",
    "de-baja": "De baja",
    "no-disponibles": "No disponibles hoy",
  },
  ordenes: {
    prioridad: "Prioridad",
    patente: "Patente",
    interno: "Interno",
    "proximo-vencimiento": "Próximo vencimiento",
    "ultimo-parte": "Último parte",
  },
  /** Etiqueta de estado de la fila (5.7). */
  estado: {
    "puede-salir": "Disponible",
    "no-puede-salir": "Bloqueada",
    "fuera-de-servicio": "Fuera de servicio",
    baja: "De baja",
  },
  sinRegistros: "Sin registros",
  sinPartes: "Sin partes",
  /** Próximo vencimiento de una unidad que no alerta (de baja). */
  sinVencimientos: "—",
  sinUnidades: "Todavía no hay unidades.",
} as const;

/**
 * Línea bajo el título: «23 unidades activas · 19 disponibles · 4 no disponibles hoy (2 bloqueadas por documentos · 2 fuera de servicio) · 1 de baja».
 * `noPueden` son las bloqueadas por documentos (el nombre del campo es de la lógica y no cambia en esta etapa).
 */
export function textoResumenFlota(r: { activas: number; pueden: number; noPueden: number; fuera: number; baja: number }): string {
  const noDisponibles = r.noPueden + r.fuera;
  return [
    pluralizar(r.activas, "unidad activa", "unidades activas"),
    `${r.pueden} ${r.pueden === 1 ? "disponible" : "disponibles"}`,
    `${noDisponibles} ${noDisponibles === 1 ? "no disponible" : "no disponibles"} hoy (${textoDesgloseNoDisponibles(r.noPueden, r.fuera)})`,
    `${r.baja} de baja`,
  ].join(" · ");
}

/** «2 bloqueadas por documentos · 2 fuera de servicio»: lo comparten el resumen de Movilidades y el desglose de Inicio, así no pueden decir distinto. */
export function textoDesgloseNoDisponibles(bloqueadas: number, fuera: number): string {
  return `${bloqueadas} ${bloqueadas === 1 ? "bloqueada" : "bloqueadas"} por documentos · ${fuera} fuera de servicio`;
}

/** Segunda línea del estado: «y 1 motivo más», «y 2 motivos más». */
export function textoMotivosMas(n: number): string {
  return `y ${pluralizar(n, "motivo", "motivos")} más`;
}

/** «Toyota Hilux 2022 · Camioneta». */
export function textoDescripcionUnidad(marca: string, modelo: string, anio: number, tipo: TipoUnidad): string {
  return `${marca} ${modelo} ${anio} · ${NOMBRES_TIPO_UNIDAD[tipo]}`;
}

/** Nombre accesible del enlace de la patente: «Ficha de ZK 214 BD». */
export function textoFichaDe(patente: string): string {
  return `Ficha de ${patente}`;
}

/** «Revisión técnica · en 6 días»: la parte de plazo (hoy, mañana, en N días). */
export function textoPlazoCorto(d: number): string {
  if (d === 0) return "hoy";
  if (d === 1) return "mañana";
  return `en ${d} días`;
}

/** Columna «Novedades»: la cifra de abiertas y, si hay críticas, cuántas («1 (crítica)», «3 (2 críticas)»). */
export function textoNovedadesDeUnidad(abiertas: number, criticas: number): string {
  if (criticas === 0) return String(abiertas);
  if (abiertas === 1) return "1 (crítica)";
  return `${abiertas} (${criticas} ${criticas === 1 ? "crítica" : "críticas"})`;
}

/** Barra de estado de la flota: «Mostrando 23 de 23 unidades.» */
export function textoMostrandoUnidades(mostradas: number, total: number): string {
  return `Mostrando ${mostradas} de ${pluralizar(total, "unidad", "unidades")}.`;
}

/** Vacío por filtro: «Ninguna unidad coincide con «zz9» en Proyecto Piedra Lunar.» (la búsqueda ya viene acortada). */
export function textoSinCoincidencias(c: { busqueda: string | null; proyecto: string | null; filtro: string | null }): string {
  const con = c.busqueda === null ? "" : ` con «${c.busqueda}»`;
  const en = c.proyecto === null ? "" : ` en ${c.proyecto}`;
  const filtro = c.filtro === null ? "" : ` (filtro: ${c.filtro})`;
  return `Ninguna unidad coincide${con}${en}${filtro}.`;
}

/** Diálogo «Agregar unidad» (5.17). */
export const TEXTO_AGREGAR = {
  titulo: "Agregar unidad",
  primario: "Agregar unidad",
  /** Primera opción del `select` Conductor: el valor es el texto vacío. */
  sinConductor: "Sin conductor asignado",
  patenteVacia: "Escriba la patente.",
  internoVacio: "Escriba el número interno.",
  anioVacio: "Escriba el año.",
  proyectoVacio: "Elija el proyecto.",
} as const;

/** Mensaje al agregar una unidad (se muestra en su ficha): «Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí.» */
export function textoUnidadAgregada(faltantes: number): string {
  if (faltantes === 0) return "Unidad agregada.";
  return `Unidad agregada. ${textoLeFaltan(faltantes)}: ${faltantes === 1 ? "cárguelo" : "cárguelos"} desde aquí.`;
}

// ---------------------------------------------------------------------------------------------
// Ficha de unidad (docs/diseno-ui.md, 6.3 y 5.16) y sus diálogos (5.17). `redactor-ux` los revisa.
// ---------------------------------------------------------------------------------------------

/** Nivel de combustible del parte, como se lee en el historial («combustible 3/4»). */
export const NOMBRES_COMBUSTIBLE = { reserva: "reserva", cuarto: "1/4", medio: "1/2", "tres-cuartos": "3/4", lleno: "lleno" } as const;

/** Rótulos fijos de la ficha (los que llevan datos se arman con las funciones de abajo). */
export const TEXTO_FICHA = {
  migaFlota: "Movilidades",
  /** Las cuatro solapas de la ficha en el celular (los tres últimos rótulos son los títulos de sus paneles). */
  solapas: { resumen: "Resumen", documentos: "Documentos", novedades: "Novedades", historial: "Historial" },
  /**
   * Texto para lector de pantalla del número de cada solapa; se lee después del nombre («Documentos, 2 vencidos o faltantes»).
   * Sin nada que contar, no hay número a la vista y el texto es vacío.
   */
  insigniaSolapa: {
    documentos: (vencidosOFaltantes: number) => (vencidosOFaltantes <= 0 ? "" : pluralizar(vencidosOFaltantes, "vencido o faltante", "vencidos o faltantes")),
    /** «1 abierta», «2 abiertas, 1 crítica», «3 abiertas, todas críticas». Las críticas son un subconjunto de las abiertas. */
    novedades: (abiertas: number, criticas: number) => {
      if (abiertas <= 0) return "";
      const base = pluralizar(abiertas, "abierta", "abiertas");
      const c = Math.min(Math.max(criticas, 0), abiertas);
      if (c === 0) return base;
      if (c === abiertas) return abiertas === 1 ? `${base}, crítica` : `${base}, todas críticas`;
      return `${base}, ${pluralizar(c, "crítica", "críticas")}`;
    },
  },
  noEncontrada: { titulo: "No se encontró la unidad", enlace: "Ir a Movilidades" },
  acciones: {
    cargarParte: "Cargar parte",
    /** C16: el primer botón según el parte (con el de hoy en uso, cerrado, o con uno anterior sin cerrar). */
    cerrarParte: "Cerrar el parte",
    verParte: "Ver el parte",
    ponerFueraDeServicio: "Poner fuera de servicio",
    volverAServicio: "Volver a servicio",
    masAcciones: "Más acciones",
    corregirKilometraje: "Corregir kilometraje",
    cambiarAsignacion: "Cambiar proyecto o conductor",
    cargarNovedad: "Cargar novedad",
    darDeBaja: "Dar de baja",
  },
  documentos: { titulo: "Documentos", cargarOtro: "Cargar otro documento", renovar: "Renovar", corregir: "Corregir", cargar: "Cargar" },
  novedades: {
    titulo: "Novedades",
    abiertas: "Abiertas",
    resueltas: "Resueltas",
    vacioAbiertas: "Sin novedades abiertas.",
    vacioResueltas: "Sin novedades resueltas.",
    resolver: "Resolver",
    cargar: "Cargar novedad",
    etiquetaCritica: "Crítica",
    etiquetaAbierta: "Abierta",
    etiquetaResuelta: "Resuelta",
    manual: "Cargada por el encargado",
  },
  kilometraje: {
    titulo: "Kilometraje",
    ultimos: "Últimos 10 partes y correcciones",
    vacio: "Todavía no hay partes enviados ni correcciones.",
    sinRegistros: "Sin registros",
  },
  historial: {
    titulo: "Historial",
    filtros: { todo: "Todo", partes: "Partes", documentos: "Documentos", novedades: "Novedades", "estado-km": "Estado y kilometraje" },
    vacio: "Todavía no hay eventos.",
    sinCarga: "Sin carga",
    verParte: "Ver el parte completo",
    antes: "Antes",
    despues: "Después",
    sinValor: "—",
  },
} as const;

/** Mensaje de la ficha cuando la unidad no existe: «No hay ninguna unidad con la patente ZZ 999 ZZ.» */
export function textoUnidadNoEncontrada(patenteTexto: string): string {
  return `No hay ninguna unidad con la patente ${patenteTexto}.`;
}

/** Línea junto a la etiqueta de aptitud: uno o dos motivos tal cual; con más, solo la cantidad (y la lista debajo). */
export function textoLineaAptitud(motivos: readonly string[]): string | null {
  if (motivos.length === 0) return null;
  if (motivos.length <= 2) return motivos.join(" · ");
  return pluralizar(motivos.length, "motivo", "motivos");
}

/** Aviso de la ficha de una unidad de baja. */
export function textoDadaDeBaja(desde: FechaCivil, motivo: string): string {
  return `Dada de baja el ${formatearFecha(desde)}: ${motivo}. Se conserva su historial.`;
}

/** «84.320 km (al 17/11/2026)»: el kilometraje actual con la fecha de su último registro. */
export function textoKmConFecha(km: number, fecha: FechaCivil): string {
  return `${formatearKm(km)} km (al ${formatearFecha(fecha)})`;
}

/** Cabecera del panel de documentos: «4 · 1 vencido · 1 faltante». */
export function textoRotuloDocumentos(total: number, vencidos: number, faltantes: number): string {
  const partes = [String(total)];
  if (vencidos > 0) partes.push(pluralizar(vencidos, "vencido", "vencidos"));
  if (faltantes > 0) partes.push(pluralizar(faltantes, "faltante", "faltantes"));
  return partes.join(" · ");
}

/** «Anteriores (2)». */
export function textoAnteriores(n: number): string {
  return `Anteriores (${n})`;
}

/** Cabecera del panel de novedades: «0 abiertas», «1 abierta». */
export function textoRotuloNovedades(abiertas: number): string {
  return pluralizar(abiertas, "abierta", "abiertas");
}

/**
 * De dónde salió la novedad: «Parte del 16/11/2026, punto Frenos» o «Cargada por el encargado». `item` es el rótulo del punto, o `null` para «Otra novedad».
 */
export function textoOrigenEnFicha(origen: { tipo: "parte"; item: string | null } | { tipo: "manual" }, fecha: FechaCivil): string {
  if (origen.tipo === "manual") return TEXTO_FICHA.novedades.manual;
  return origen.item === null ? `Parte del ${formatearFecha(fecha)}, otra novedad` : `Parte del ${formatearFecha(fecha)}, punto ${origen.item}`;
}

/** Fila del historial de kilometraje: «84.188 → 84.320». */
export function textoRangoKm(kmInicio: number, kmFin: number): string {
  return `${formatearKm(kmInicio)} → ${formatearKm(kmFin)}`;
}

/** Fila de corrección del kilometraje: «Corrección: 120 km». */
export function textoCorreccionKm(km: number): string {
  return `Corrección: ${formatearKm(km)} km`;
}

/** Cantidad de eventos del historial: «128 eventos». */
export function textoEventos(n: number): string {
  return pluralizar(n, "evento", "eventos");
}

/** Región `role="status"` del historial: «Mostrando 30 de 128 eventos.» */
export function textoMostrandoEventos(mostrados: number, total: number): string {
  return `Mostrando ${mostrados} de ${textoEventos(total)}.`;
}

/** Botón del historial: «Ver 30 más». */
export function textoVerMasEventos(n: number): string {
  return `Ver ${n} más`;
}

/** Un parte en uso en la lista de kilometraje de la ficha: «84.452 → en uso». */
export function textoKmEnUso(km: number): string {
  return `${formatearKm(km)} → en uso`;
}

/**
 * Evento «revision-enviada» en el historial: «Revisión antes de salir · 84.320 km · sin novedades» · «… · 1 novedad: Niveles de aceite y agua» ·
 * «… · novedad crítica en frenos: la unidad no salió», y «(fuera de plazo)» al final.
 */
export function textoRevisionEnHistorial(r: { kmInicio: number; normales: readonly string[]; criticas: readonly string[]; fueraDePlazo: boolean }): string {
  const partes = ["Revisión antes de salir", `${formatearKm(r.kmInicio)} km`];
  if (r.criticas.length > 0) partes.push(`novedad crítica en ${r.criticas.map(puntoEnFrase).join(", ")}: la unidad no salió`);
  else if (r.normales.length === 0) partes.push("sin novedades");
  else partes.push(`${pluralizar(r.normales.length, "novedad", "novedades")}: ${r.normales.join(", ")}`);
  return `${partes.join(" · ")}${r.fueraDePlazo ? " (fuera de plazo)" : ""}`;
}

/** Evento «parte-enviado» (el cierre) en el historial: «Parte cerrado · 132 km (84.320 → 84.452) · combustible 3/4». */
export function textoCierreEnHistorial(r: { kmInicio: number; kmFin: number; combustible: string | null }): string {
  const recorrido = r.kmFin - r.kmInicio;
  const uso = recorrido === 0 ? "sin uso" : `${formatearKm(recorrido)} km`;
  const partes = ["Parte cerrado", `${uso} (${textoRangoKm(r.kmInicio, r.kmFin)})`];
  if (r.combustible !== null) partes.push(`combustible ${r.combustible}`);
  return partes.join(" · ");
}

/** Resumen de un parte cerrado en el historial: «Parte cerrado · 132 km (84.320 → 84.452) · combustible 3/4 · 1 novedad». */
export function textoResumenParteEnviado(r: { kmInicio: number; kmFin: number; combustible: string | null; novedades: number }): string {
  const recorrido = r.kmFin - r.kmInicio;
  const uso = recorrido === 0 ? "sin uso" : `${formatearKm(recorrido)} km`;
  const partes = ["Parte cerrado", `${uso} (${textoRangoKm(r.kmInicio, r.kmFin)})`];
  if (r.combustible !== null) partes.push(`combustible ${r.combustible}`);
  partes.push(r.novedades === 0 ? "sin novedades" : pluralizar(r.novedades, "novedad", "novedades"));
  return partes.join(" · ");
}

/** «8 puntos en orden» (parte enviado, al abrir el detalle). */
export function textoPuntosEnOrden(n: number): string {
  return `${pluralizar(n, "punto", "puntos")} en orden`;
}

/** Rótulo de cada campo de un documento corregido («Antes / Después»). */
export const ROTULO_CAMPO_DOCUMENTO_CORREGIDO = { numero: "Número", emisor: "Emisor", vence: "Vencimiento", emitido: "Emisión" } as const;

/** Diálogos de la ficha (5.17). Los rótulos de los campos y sus ayudas son de presentación (`textos-marco.ts`). */
export const TEXTO_DIALOGOS_FICHA = {
  resolver: {
    titulo: (patente: string) => `Resolver novedad de ${patente}`,
    primario: "Marcar como resuelta",
    volverEtiqueta: "Volver a servicio ahora",
    volverNota: (patente: string) => `${patente} está fuera de servicio por esta novedad. Con la casilla marcada, vuelve a servicio al resolverla.`,
    /** P19: hoy hubo una novedad crítica; el diálogo no promete que la unidad vuelve a salir ese día. */
    volverEtiquetaHastaManana: "Volver a servicio (sale desde mañana)",
    volverNotaHastaManana: (patente: string) =>
      `${patente} está fuera de servicio por esta novedad. Con la casilla marcada, queda en servicio, pero no sale hoy: vuelve a salir a partir de mañana.`,
  },
  cargarNovedad: {
    titulo: (patente: string) => `Cargar novedad de ${patente}`,
    primario: "Guardar novedad",
    impideEtiqueta: "Impide usar la unidad",
    impideNota: "Si impide el uso, la unidad queda fuera de servicio hasta que se resuelva la novedad.",
  },
  fueraDeServicio: {
    titulo: (patente: string) => `Poner fuera de servicio: ${patente}`,
    primario: "Poner fuera de servicio",
    desde: (hoy: FechaCivil) => `Desde hoy (${formatearFecha(hoy)}).`,
  },
  volver: {
    titulo: (patente: string) => `Volver a servicio: ${patente}`,
    primario: "Volver a servicio",
    verNovedades: "Ver novedades",
    situacion: (desde: FechaCivil, motivo: string) => `Fuera de servicio desde el ${formatearFecha(desde)}: ${minuscula(motivo)}`,
    /** A5: vuelve, pero la aptitud sigue pendiente de documentos. */
    sinPoderSalir: (aRenovar: readonly string[], aCargar: readonly string[]) => {
      const accion = aRenovar.length > 0 && aCargar.length > 0 ? "renovar o cargar" : aCargar.length > 0 ? "cargar" : "renovar";
      return `La unidad vuelve a servicio, pero no puede salir hasta ${accion}: ${[...aRenovar, ...aCargar].join(", ")}.`;
    },
    /** P19: la unidad vuelve, pero el parte de hoy quedó sin salida. Solo, y sumado a lo de los documentos. */
    hastaManana: "La unidad vuelve a servicio, pero no vuelve a salir hasta mañana: hoy tuvo una novedad crítica.",
    ademasHastaManana: "Además, no vuelve a salir hasta mañana: hoy tuvo una novedad crítica.",
  },
  baja: {
    titulo: (patente: string) => `Dar de baja: ${patente}`,
    primario: (patente: string) => `Dar de baja ${patente}`,
    aviso: "No se puede deshacer en esta demo. La unidad deja de contar en la flota y en las alertas; su historial se conserva.",
  },
  kilometraje: {
    titulo: (patente: string) => `Corregir kilometraje de ${patente}`,
    primario: "Guardar corrección",
    nota: "Úselo si se cambió el tablero o si un parte enviado tiene un error de kilometraje.",
  },
  asignacion: {
    titulo: (patente: string) => `Cambiar proyecto o conductor: ${patente}`,
    primario: "Guardar cambios",
    inactivo: (nombre: string) => `${nombre} (inactivo)`,
    sinHabilitacion: (patente: string, proyecto: string) =>
      `${patente} no tiene cargada la habilitación de ingreso a ${proyecto}: no podrá salir hasta cargarla.`,
  },
  corregirDocumento: {
    titulo: (nombre: string, titular: string) => `Corregir: ${nombre} de ${titular}`,
    primario: "Guardar corrección",
    nota: "Use esto para corregir un error de carga. Si el documento se renovó, use Renovar.",
  },
  cargarOtro: {
    titulo: (titular: string) => `Cargar documento de ${titular}`,
    primario: "Guardar documento",
    tipoVacio: "Elija el tipo de documento.",
  },
} as const;

/** Barra de estado después de corregir un documento: «Seguro de ZK 214 BD corregido.» */
export function textoDocumentoCorregido(tipo: TipoDocumento, titular: string): string {
  return `${NOMBRES_DOCUMENTO[tipo]} de ${titular} ${concordar(tipo, "corregido", "corregida")}.`;
}

/** Barra de estado de la ficha después de renovar: «Seguro de ZK 214 BD renovado: vence el 15/11/2027.» */
export function textoDocumentoRenovadoEnFicha(tipo: TipoDocumento, titular: string, vence: FechaCivil): string {
  return `${NOMBRES_DOCUMENTO[tipo]} de ${titular} ${concordar(tipo, "renovado", "renovada")}: vence el ${formatearFecha(vence)}.`;
}

/**
 * Después de resolver una novedad: «Novedad resuelta: Frenos.», y si la unidad volvió, lo dice. Desde el centro de alertas (donde hay
 * muchas unidades) también nombra la unidad: «Novedad resuelta: Frenos (ZU 899 QE).»
 */
export function textoNovedadResuelta(rotulo: string, patente: string, volvio: boolean, nombraLaUnidad = false, hastaManana = false): string {
  const vuelta = volvio ? ` ${patente} vuelve a servicio${hastaManana ? ", pero no sale hasta mañana" : ""}.` : "";
  return `Novedad resuelta: ${rotulo}${nombraLaUnidad ? ` (${patente})` : ""}.${vuelta}`;
}

/** Después de cargar una novedad a mano. */
export function textoNovedadCargada(patente: string, critica: boolean): string {
  return critica ? `Novedad cargada. ${patente} queda fuera de servicio hasta que se resuelva.` : "Novedad cargada.";
}

export function textoFueraDeServicio(patente: string): string {
  return `${patente} está fuera de servicio.`;
}

/** Después de volver a servicio (A5): si todavía no puede salir, dice por qué. */
export function textoVueltaAServicio(patente: string, motivosPendientes: readonly string[]): string {
  const base = `${patente} vuelve a servicio.`;
  return motivosPendientes.length === 0 ? base : `${base} Todavía no puede salir: ${motivosPendientes.join("; ")}.`;
}

export function textoKmCorregido(patente: string, km: number): string {
  return `Kilometraje de ${patente} corregido: ${formatearKm(km)} km.`;
}

/** Después de cambiar proyecto o conductor; avisa si el proyecto nuevo exige una habilitación que falta (U6). */
export function textoAsignacionCambiada(cambio: { proyecto: boolean; conductor: boolean }, faltaHabilitacion: boolean): string {
  const que = cambio.proyecto && cambio.conductor ? "Proyecto y conductor actualizados." : cambio.proyecto ? "Proyecto actualizado." : "Conductor actualizado.";
  return faltaHabilitacion ? `${que} Falta cargar la habilitación de ingreso al proyecto.` : que;
}

export function textoUnidadDadaDeBaja(patente: string): string {
  return `${patente} dada de baja. Su historial se conserva.`;
}

/** Litros del parte en el historial: «45,5 litros»; sin carga, «Sin carga». */
export function textoLitros(litros: number | null): string {
  return litros === null ? TEXTO_FICHA.historial.sinCarga : `${String(litros).replace(".", ",")} ${litros === 1 ? "litro" : "litros"}`;
}

// ---------------------------------------------------------------------------------------------
// Formulario del parte (docs/diseno-ui.md, 5.12 a 5.15 y 6.5; paso 4.5). `redactor-ux` los revisa.
// ---------------------------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------------------------
// Inicio del conductor y pantalla del parte (docs/diseno-ui.md, 6.4 y 6.5; paso 4.5). `redactor-ux` los revisa.
// ---------------------------------------------------------------------------------------------

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

/** El primer botón de la ficha con un parte anterior en uso (C16): «Cerrar el parte del 17/11/2026». */
export function textoCerrarElParteDel(fecha: FechaCivil): string {
  return `Cerrar el parte del ${formatearFecha(fecha)}`;
}

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
  completarCierreAhora: "Completar el cierre ahora",
  completarCierre: "Completar el cierre",
  verLaRevision: "Ver la revisión",
  encargadoLaVe: "El encargado la ve en Inicio.",
  alTerminarVuelva: "Al terminar la jornada, vuelva a este parte para cerrarlo con el kilometraje y el combustible.",
  /** C1 de un parte de un día pasado: la jornada ya terminó (C4 de la revisión visual). */
  faltaCerrarJornadaPasada: "Falta cerrar este parte con el kilometraje y el combustible de esa jornada.",
  siTieneQueSalir: "Si tiene que salir, elija otra unidad desde el inicio.",
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

/**
 * Línea del panel «Parte enviado»: «ZK 214 BD, 18/11/2026, enviado a las 18:42.»; fuera de plazo, con el día del envío. Sin hora legible: «ZK 214 BD,
 * 16/11/2026, enviado.»
 */
export function textoLineaParteEnviado(patente: string, fecha: FechaCivil, diaDeEnvio: FechaCivil | null, hora: string | null): string {
  if (diaDeEnvio === null || hora === null) return `${patente}, ${formatearFecha(fecha)}, enviado.`;
  if (fecha === diaDeEnvio) return `${patente}, ${formatearFecha(fecha)}, enviado a las ${hora}.`;
  return `${patente}, ${formatearFecha(fecha)}, enviado el ${formatearFecha(diaDeEnvio)} a las ${hora} (fuera de plazo).`;
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

/**
 * Escrituras desde una pestaña que quedó atrás de otra (D12; QA A1, etapa 4). Texto nuevo, a revisar por el redactor: lo ve quien
 * intenta guardar algo mientras el aviso «Se hicieron cambios en otra pestaña» sigue sin atender.
 */
export const ERRORES_PESTANAS = {
  escrituraConCambiosEnOtraPestana: "No se guardó nada porque hay cambios hechos en otra pestaña. Pulse «Actualizar» en el aviso y repita la acción.",
} as const;

/**
 * Cuando una pantalla falla al dibujarse (código M1, etapa 4: datos dañados que el arranque no detectó). Texto nuevo, a revisar por
 * el redactor. Los botones son los del marco («Recargar la página», «Reiniciar demo»).
 */
export const TEXTO_ERROR_PANTALLA = {
  titulo: "No se pudo mostrar esta pantalla",
  mensaje:
    "Los datos guardados en este navegador pueden estar dañados. Recargue la página; si el error sigue, " +
    "use «Reiniciar demo» para volver a la flota de ejemplo.",
} as const;

/** Cuando no se pudo bajar el código de una pantalla que llega diferida (sin conexión o con el sitio caído). El título va en el `h1` y el mensaje, debajo. */
export const TEXTO_ERROR_DESCARGA = {
  titulo: "No se pudo descargar esta pantalla",
  mensaje: "Compruebe la conexión y recargue la página.",
} as const;
