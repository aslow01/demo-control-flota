// Textos compartidos del dominio (errores de los comandos, resúmenes de eventos, nombres de pantallas, avisos globales). Lo necesitan el marco y los comandos, así que viaja en la carga inicial.
// El resto está partido por pantalla (`textos-inicio.ts`, `textos-flota.ts`, `textos-ficha.ts`, `textos-parte.ts`): cada módulo arrastra solo los suyos. `textos.ts` los reúne para quien quiera todo junto.

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
  /** «Vence» sin escribir (solo el vacío: una fecha mal formada dice `fechaInvalida`). */
  venceVacio: "Escriba la fecha de vencimiento.",
  /** Una fecha bien escrita pero de un año que la demo no acepta (T4: 2000 a 2100). */
  fechaFueraDeAnios: "Escriba una fecha entre los años 2000 y 2100.",
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
  /** El código que sirve para guardar ya no está en el servidor (hay otra versión de la demo): reintentar no sirve hasta recargar, y al recargar se pierde lo escrito. */
  noPudoGuardarPorVersionNueva: "No se pudo guardar porque hay una versión nueva de la demo. Recargue la página para actualizarla; lo escrito en pantalla no se conservará.",
  /** Lo mismo para «Reiniciar demo»: ahí no hay nada escrito que perder. */
  noPudoReiniciarPorVersionNueva: "No se pudo reiniciar la demo porque hay una versión nueva. Recargue la página para actualizarla; se conservaron los datos que tenía.",
} as const;

/** Los títulos del resumen de errores del parte cuando no se pudo enviar. Viven acá y no en `textos-parte.ts` para que `EstadoApp` los use sin arrastrar los demás textos del parte. */
export const TITULOS_DE_ERROR_DEL_PARTE = {
  revision: "No se pudo enviar la revisión",
  cierre: "No se pudo cerrar el parte",
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

/**
 * Cómo se llama cada pantalla (barra, título de la página, migas, «Volver a …»). Lo usa el enrutador desde la etapa E1; hasta entonces `nombreDePantalla` conserva los nombres viejos.
 * `operacion` es la sección («Operación diaria»); sus dos solapas son «Partes» y «Novedades». `conductor` es «Hoy» y `conductorPartes`, «Mis partes».
 */
export const NOMBRES_DE_PANTALLA = {
  inicio: "Inicio",
  movilidades: "Movilidades",
  vencimientos: "Vencimientos",
  operacion: "Operación diaria",
  operacionPartes: "Partes",
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

/** "Último registro: 84.320 km (parte del 17/11/2026)." o "Sin registros". */
export function textoUltimoRegistro(km: number | null, origen: string | null): string {
  if (km === null || origen === null) return "Sin registros";
  return `Último registro: ${formatearKm(km)} km (${origen}).`;
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

/** Documentos de nombre femenino (el resto es masculino): para «renovado» y «renovada». */
const DOCUMENTO_FEMENINO: ReadonlySet<TipoDocumento> = new Set([
  "revision-tecnica",
  "matafuego",
  "habilitacion-proyecto",
  "licencia",
  "habilitacion-manejo",
]);

export function concordar(tipo: TipoDocumento, masculino: string, femenino: string): string {
  return DOCUMENTO_FEMENINO.has(tipo) ? femenino : masculino;
}

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

/** «2 bloqueadas por documentos · 2 fuera de servicio»: lo comparten el resumen de Movilidades y el desglose de Inicio, así no pueden decir distinto. */
export function textoDesgloseNoDisponibles(bloqueadas: number, fuera: number): string {
  return `${bloqueadas} ${bloqueadas === 1 ? "bloqueada" : "bloqueadas"} por documentos · ${fuera} fuera de servicio`;
}

/** «Toyota Hilux 2022 · Camioneta». */
export function textoDescripcionUnidad(marca: string, modelo: string, anio: number, tipo: TipoUnidad): string {
  return `${marca} ${modelo} ${anio} · ${NOMBRES_TIPO_UNIDAD[tipo]}`;
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

/** Nivel de combustible del parte, como se lee en el historial («combustible 3/4»). */
export const NOMBRES_COMBUSTIBLE = { reserva: "reserva", cuarto: "1/4", medio: "1/2", "tres-cuartos": "3/4", lleno: "lleno" } as const;

/** Mensaje de la ficha cuando la unidad no existe: «No hay ninguna unidad con la patente ZZ 999 ZZ.» */
export function textoUnidadNoEncontrada(patenteTexto: string): string {
  return `No hay ninguna unidad con la patente ${patenteTexto}.`;
}

/** Fila del historial de kilometraje: «84.188 → 84.320». */
export function textoRangoKm(kmInicio: number, kmFin: number): string {
  return `${formatearKm(kmInicio)} → ${formatearKm(kmFin)}`;
}

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

/** Lo que dice el historial cuando el parte no cargó combustible (también es `TEXTO_FICHA.historial.sinCarga`). */
export const TEXTO_SIN_CARGA = "Sin carga";

/** Litros del parte en el historial: «45,5 litros»; sin carga, «Sin carga». */
export function textoLitros(litros: number | null): string {
  return litros === null ? TEXTO_SIN_CARGA :`${String(litros).replace(".", ",")} ${litros === 1 ? "litro" : "litros"}`;
}

/** El primer botón de la ficha con un parte anterior en uso (C16): «Cerrar el parte del 17/11/2026». */
export function textoCerrarElParteDel(fecha: FechaCivil): string {
  return `Cerrar el parte del ${formatearFecha(fecha)}`;
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
  /** El trozo ya no existe en el servidor (404, o llega el `index.html` en su lugar): se desplegó otra versión mientras la página estaba abierta. */
  versionNueva: "Hay una versión nueva de la demo. Recargue la página para verla.",
} as const;
