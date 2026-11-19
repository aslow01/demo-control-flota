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
  unidadInexistente: "No se encontró la unidad. Vuelva a la lista e intente de nuevo.",
  conductorInexistente: "No se encontró el conductor. Vuelva a la lista e intente de nuevo.",
  conductorInactivo: "El conductor no está activo.",
  proyectoInexistente: "No se encontró el proyecto. Vuelva a la lista e intente de nuevo.",
  documentoInexistente: "No se encontró el documento. Vuelva a la lista e intente de nuevo.",
  parteInexistente: "No se encontró el parte. Vuelva a la lista e intente de nuevo.",
  novedadInexistente: "No se encontró la novedad. Vuelva a la lista e intente de nuevo.",
  parteEnviadoInmutable: "Un parte enviado no se puede modificar.",
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
  niveles: "Niveles de aceite y agua",
  matafuego: "Matafuego a bordo",
  botiquin: "Botiquín y kit de emergencia",
  documentacion: "Documentación a bordo",
  cabina: "Orden y limpieza de la cabina",
} as const;

/** V12: un obligatorio sin documento. */
export const TEXTO_FALTA_CARGAR = "Falta cargar";

/** Motivos que muestra la aptitud de una unidad (A1). */
export const MOTIVO_APTITUD = {
  baja: (desde: FechaCivil, motivo: string) => `Dada de baja el ${formatearFecha(desde)}: ${motivo}`,
  fueraDeServicio: (desde: FechaCivil, motivo: string) => `Fuera de servicio desde ${formatearFecha(desde)}: ${motivo}`,
  documentoFaltante: (nombre: string) => `${TEXTO_FALTA_CARGAR}: ${nombre}`,
  novedadCritica: (rotulo: string, origen: string) => `Novedad crítica abierta: ${rotulo} (${origen})`,
} as const;

/** Textos de las alertas de operación (sección 7). */
export const TEXTO_ALERTA = {
  usoConDocumentacionVencida: (nombres: string, fecha: FechaCivil) =>
    `Circuló con documentación vencida: ${nombres} (parte del ${formatearFecha(fecha)})`,
  parteSinEnviar: (fecha: FechaCivil, iniciadoPor: string | null) =>
    `Parte del ${formatearFecha(fecha)} sin enviar${iniciadoPor === null ? "" : ` (iniciado por ${iniciadoPor})`}`,
  sinParte: (ayer: FechaCivil) => `Sin parte de ayer (${formatearFecha(ayer)})`,
} as const;

/** Motivo con que una novedad crítica deja la unidad fuera de servicio (A3). */
export const MOTIVO_NOVEDAD_CRITICA = {
  delParte: (fecha: FechaCivil, items: string) => `Novedad crítica en el parte del ${formatearFecha(fecha)}: ${items}`,
  cargada: (fecha: FechaCivil, descripcion: string) => `Novedad crítica cargada el ${formatearFecha(fecha)}: ${descripcion}`,
} as const;

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

export function errParteDuplicado(patente: string, fecha: FechaCivil, estado: "borrador" | "enviado"): string {
  const final = estado === "borrador" ? "Ábralo para continuar." : "Ábralo para verlo.";
  return `Ya hay un parte de ${patente} para el ${formatearFecha(fecha)} (${estado}). ${final}`;
}

/** M3: la corrección de kilometraje no cambiaría nada porque hay un registro posterior. */
export function errKmCorreccionAnterior(registro: "parte" | "correccion", fecha: FechaCivil): string {
  // `fecha` es la del registro (la fecha del parte, o desde cuándo vale la corrección), no el día en que se envió.
  const que = registro === "parte" ? `un parte del ${formatearFecha(fecha)}` : `una corrección del ${formatearFecha(fecha)}`;
  const cual = registro === "parte" ? "de ese parte" : "de esa corrección";
  return `Ya hay ${que}, posterior a la fecha elegida: la corrección no cambiaría el kilometraje actual. Use la fecha ${cual} o una posterior.`;
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

/** D3: la empresa de ejemplo con su CUIT, que siempre se muestra rotulado como ficticio (puede coincidir con uno real). */
export function textoEmpresa(nombre: string, cuit: string): string {
  const digitos = cuit.replace(/[^0-9]/g, "");
  const escrito = digitos.length === 11 ? `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}` : cuit;
  return `${nombre} · CUIT ficticio ${escrito}`;
}

/** A8: el protagonista del centro de alertas. */
export function textoProtagonista(n: number): string {
  if (n === 0) return "Todas las unidades activas pueden salir hoy";
  return n === 1 ? "1 unidad no puede salir hoy" : `${n} unidades no pueden salir hoy`;
}

/** A8: "Disponibles hoy: 19 de 23 unidades activas." */
export function textoDisponibles(disponibles: number, activas: number): string {
  return `Disponibles hoy: ${disponibles} de ${pluralizar(activas, "unidad activa", "unidades activas")}.`;
}

/** 5.6: textos fijos del horizonte (los números van en `textoHorizonte`). */
export const TEXTO_HORIZONTE = {
  /** Caja de vencidos de la variante completa y de la mediana (rótulo compacto). */
  rotuloCajaCompleta: "Vencidos y faltantes",
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
      return `${formatearKm(a.km)} km sin registrar desde el último parte`;
    case "recorrido-largo":
      return `Recorrido del día inusualmente largo: ${formatearKm(a.km)} km`;
    case "documentacion-vencida":
      return (
        `Documentación vencida o faltante: ${a.documentos.map((t) => NOMBRES_DOCUMENTO[t]).join(", ")}. ` +
        "Puede enviar el parte igual: quedará registrado que la unidad circuló con documentación vencida."
      );
  }
}

/** Avisos globales del arranque y de la sincronización entre pestañas (D4, D5, D7, D8, D9). */
export const TEXTO_AVISO = {
  preparando: "Preparando la flota de ejemplo…",
  esquemaActualizado: "La demo se actualizó. Se cargó de nuevo la flota de ejemplo y no se conservaron los datos anteriores.",
  sinAlmacenamiento: "Este navegador no permite guardar datos. Puede usar la demo, pero los cambios se pierden al cerrar o recargar la página.",
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
  puntoCritico: "Al enviar, la unidad queda fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio.",
  /** Aviso del panel «Parte enviado» cuando hubo una novedad crítica. */
  enviadoConCritica: "La unidad quedó fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio.",
} as const;

// ---------------------------------------------------------------------------------------------
// Centro de alertas (docs/diseno-ui.md, 6.1 y 7) y diálogos Renovar y Cargar documento (5.17). `redactor-ux` los revisa.
// ---------------------------------------------------------------------------------------------

/** Rótulos fijos del centro de alertas (los que llevan números se arman con las funciones de abajo). */
export const TEXTO_CENTRO = {
  titulo: "Centro de alertas",
  bajada: "Datos ficticios de una empresa inventada. Todo se guarda en este navegador.",
  protagonista: "No pueden salir hoy",
  operacion: "Operación diaria",
  operacionVacia: "Sin pendientes de operación.",
  /** Barra de estado de «Operación diaria»: el botón-texto cambia la vista a Conductor, y el texto lo dice. */
  conductor: { intro: "Así lo carga el conductor:", accion: "Abrir el parte diario", aclaracion: "(cambia la vista a Conductor)" },
  vencimientos: "Vencimientos",
  vencimientosVacio: "No hay vencimientos en los próximos 30 días.",
  grupoVacio: "No hay documentos en este grupo.",
  detalle: "Operación diaria: detalle",
  /** Etiqueta de las columnas de las listas sin valor (documento faltante). */
  sinFecha: "—",
} as const;

/** Títulos de los grupos de la lista de vencimientos (sin la cantidad) y rótulos cortos de los filtros (sección 7). */
export const TEXTO_GRUPO_VENCIMIENTOS = {
  vencidos: { titulo: "Vencidos y faltantes", filtro: "Vencidos y faltantes" },
  "7": { titulo: "Vencen en 7 días o menos", filtro: "7 días o menos" },
  "15": { titulo: "Vencen entre 8 y 15 días", filtro: "8 a 15 días" },
  "30": { titulo: "Vencen entre 16 y 30 días", filtro: "16 a 30 días" },
} as const;

/** Etiqueta de estado de cada tipo de alerta de operación (5.7). */
export const TEXTO_ESTADO_OPERACION = {
  "novedad-critica": "Crítica",
  "uso-con-documentacion-vencida": "Con documentación vencida",
  "parte-sin-enviar": "Sin enviar",
  "sin-parte": "Sin parte",
  "novedad-abierta": "Abierta",
} as const;

/** Título de cada grupo del detalle de operación, sin la cantidad. */
export const TEXTO_GRUPO_OPERACION = {
  "novedad-critica": "Novedades críticas",
  "uso-con-documentacion-vencida": "Circuló con documentación vencida",
  "parte-sin-enviar": "Partes sin enviar",
  "sin-parte": "Sin parte de ayer",
  "novedad-abierta": "Novedades abiertas",
} as const;

/** «Unidades» junto a la cifra del protagonista: «1 unidad», «4 unidades» (con 0, «unidades»). */
export function palabraUnidades(n: number): "unidad" | "unidades" {
  return n === 1 ? "unidad" : "unidades";
}

/** Para lectores de pantalla: la frase completa en un solo texto, con punto final. */
export function textoProtagonistaLector(n: number): string {
  return `${textoProtagonista(n)}.`;
}

/** «Ver las 9 en la flota». */
export function textoVerTodasEnLaFlota(n: number): string {
  return `Ver las ${n} en la flota`;
}

/** Cabecera del panel de operación: «6 pendientes». */
export function textoPendientes(n: number): string {
  return pluralizar(n, "pendiente", "pendientes");
}

/** Cabecera del panel de vencimientos: «próximos 30 días · 11». */
export function textoRotuloVencimientos(n: number): string {
  return `próximos 30 días · ${n}`;
}

/** Región `role="status"` del filtro (5.8): «Mostrando 4 de 11 vencimientos.». */
export function textoMostrando(mostrados: number, total: number): string {
  return `Mostrando ${mostrados} de ${pluralizar(total, "vencimiento", "vencimientos")}.`;
}

/** Título de un grupo con su cantidad: «Vencidos y faltantes (2)». */
export function textoGrupoConCantidad(titulo: string, n: number): string {
  return `${titulo} (${n})`;
}

/** Fila del panel de operación diaria: «1 novedad crítica abierta», «2 unidades sin parte de ayer». */
export function textoFilaOperacion(tipo: keyof typeof TEXTO_ESTADO_OPERACION, n: number, diasLaMasAntigua: number | null): string {
  const uno = n === 1;
  switch (tipo) {
    case "novedad-critica":
      return `${n} ${uno ? "novedad crítica abierta" : "novedades críticas abiertas"}`;
    case "uso-con-documentacion-vencida":
      return `${n} ${uno ? "circuló" : "circularon"} con documentación vencida`;
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
  /** «Vigente: póliza DEMO-88-4471, venció el 17/11/2026 (hace 1 día).» */
  vigente: (numero: string, estado: string, sustantivo: string) => `Vigente: ${sustantivo} ${numero}, ${estado}.`,
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
// Flota (docs/diseno-ui.md, 5.10 y 6.2) y diálogo «Agregar unidad» (5.17). `redactor-ux` los revisa.
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
  /** Título del panel (el `h1` de la pantalla es «Flota»). */
  panel: "Unidades",
  todosLosProyectos: "Todos",
  /** Filtros por estado (5.8). «No disponibles» solo aparece cuando viene de «Ver las N en la flota». */
  filtros: {
    activas: "Activas",
    "pueden-salir": "Pueden salir",
    "no-pueden-salir": "No pueden salir",
    "fuera-de-servicio": "Fuera de servicio",
    "de-baja": "De baja",
    "no-disponibles": "No disponibles",
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
    "puede-salir": "Puede salir",
    "no-puede-salir": "No puede salir",
    "fuera-de-servicio": "Fuera de servicio",
    baja: "De baja",
  },
  sinRegistros: "Sin registros",
  sinPartes: "Sin partes",
  /** Próximo vencimiento de una unidad que no alerta (de baja). */
  sinVencimientos: "—",
  sinUnidades: "Todavía no hay unidades.",
} as const;

/** Línea bajo el título: «23 unidades activas · 19 pueden salir · 2 no pueden salir · 2 fuera de servicio · 1 de baja». */
export function textoResumenFlota(r: { activas: number; pueden: number; noPueden: number; fuera: number; baja: number }): string {
  return [
    pluralizar(r.activas, "unidad activa", "unidades activas"),
    `${r.pueden} ${r.pueden === 1 ? "puede" : "pueden"} salir`,
    `${r.noPueden} ${r.noPueden === 1 ? "no puede" : "no pueden"} salir`,
    `${r.fuera} fuera de servicio`,
    `${r.baja} de baja`,
  ].join(" · ");
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
  migaFlota: "Flota",
  noEncontrada: { titulo: "No se encontró la unidad", enlace: "Ir a la flota" },
  acciones: {
    cargarParte: "Cargar parte",
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

/** De dónde salió la novedad: «Parte del 16/11/2026, punto Frenos» o «Cargada por el encargado». `item` es el rótulo del punto, o `null` para «Otra novedad». */
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

/** Resumen de un parte enviado en el historial: «Parte enviado · 132 km (84.320 → 84.452) · combustible 3/4 · 1 novedad». */
export function textoResumenParteEnviado(r: { kmInicio: number; kmFin: number; combustible: string | null; novedades: number }): string {
  const recorrido = r.kmFin - r.kmInicio;
  const uso = recorrido === 0 ? "sin uso" : `${formatearKm(recorrido)} km`;
  const partes = ["Parte enviado", `${uso} (${textoRangoKm(r.kmInicio, r.kmFin)})`];
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
    situacion: (desde: FechaCivil, motivo: string) => `Fuera de servicio desde ${formatearFecha(desde)}: ${motivo}`,
    /** A5: vuelve, pero la aptitud sigue pendiente de documentos. */
    sinPoderSalir: (aRenovar: readonly string[], aCargar: readonly string[]) => {
      const accion = aRenovar.length > 0 && aCargar.length > 0 ? "renovar o cargar" : aCargar.length > 0 ? "cargar" : "renovar";
      return `La unidad vuelve a servicio, pero no puede salir hasta ${accion}: ${[...aRenovar, ...aCargar].join(", ")}.`;
    },
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
export function textoNovedadResuelta(rotulo: string, patente: string, volvio: boolean, nombraLaUnidad = false): string {
  return `Novedad resuelta: ${rotulo}${nombraLaUnidad ? ` (${patente})` : ""}.${volvio ? ` ${patente} vuelve a servicio.` : ""}`;
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
  /** Título del resumen de errores: todo lo que hay son faltantes (P4), o hay también errores de reglas o de formato. */
  tituloFaltan: (n: number) => `${textoFaltantes(n)} para enviar el parte`,
  tituloRevise: (n: number) => `Revise ${pluralizar(n, "dato", "datos")} para enviar el parte`,
  tituloGeneral: "No se pudo enviar el parte",
  /** Barra de envío (5.14). */
  barraLista: "Listo para enviar",
  sinRecorrido: "—",
  /** Ayudas de los campos (5.11). */
  ayudaPrimerRegistro: "Es el primer registro de esta unidad.",
  ayudaKmFin: "Complételo al final del día.",
  ayudaLitros: "Déjelo vacío si no cargó.",
  fueraDeTermino: (fecha: FechaCivil) => `Este parte es del ${formatearFecha(fecha)}: se va a enviar fuera de término.`,
  borradorDescartado: "Borrador descartado.",
} as const;

/** Indicador de guardado (5.15): lo que se ve y lo que se anuncia al lector (solo cuando cambia de estado, no en cada guardado). */
export const TEXTO_GUARDADO = {
  guardando: "Guardando…",
  guardado: (hora: string) => `Guardado en este equipo a las ${hora}`,
  /** P3: un dato con un error de formato no se guarda. */
  conErroresDeCampo: "Sin guardar: corrija los campos marcados.",
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
  empezar: "Empezar el parte",
  continuar: "Continuar el parte",
  descartar: "Descartar borrador",
  verParte: "Ver el parte",
  enviado: "Enviado",
  usarOtra: "Usar otra unidad",
  elegirUnidad: "Elija la unidad",
  continuarPendiente: "Continuarlo",
  cargarPendiente: "Cargarlo",
  licenciaTitulo: "Su licencia",
  ultimosTitulo: "Mis últimos partes",
  ultimosVacio: "Todavía no envió partes. Los últimos cinco aparecerán aquí.",
} as const;

/** «Hoy, miércoles 18/11/2026». */
export function textoHoyDelConductor(hoy: FechaCivil): string {
  return `Hoy, ${diaDeLaSemana(hoy)} ${formatearFecha(hoy)}`;
}

/** «Tiene un parte empezado: faltan 5 datos.» */
export function textoBorradorDelConductor(faltan: number): string {
  if (faltan === 0) return "Tiene un parte empezado y está listo para enviar.";
  return `Tiene un parte empezado: ${textoFaltantes(faltan).toLowerCase()}.`;
}

/** «Enviado a las 18:42». */
export function textoEnviadoALas(hora: string): string {
  return `Enviado a las ${hora}`;
}

/** Unidad fuera de servicio, vista del conductor: no tiene que hacer parte. */
export function textoSinParteFueraDeServicio(patente: string, desde: FechaCivil, motivo: string): string {
  return `${patente} está fuera de servicio desde el ${formatearFecha(desde)} (${motivo}). No hace falta parte.`;
}

/** Aviso sobre una unidad que está en servicio pero no puede salir (documentos): «Seguro vencido hace 1 día; …». */
export function textoUnidadNoPuedeSalir(patente: string, motivos: readonly string[], alConductor: boolean): string {
  const base = `${patente} no puede salir: ${motivos.join("; ")}.`;
  return alConductor ? `${base} Avise al encargado antes de usarla.` : base;
}

export function textoPendienteBorrador(fecha: FechaCivil, patente: string): string {
  return `${patente}: el parte del ${formatearFecha(fecha)} está empezado y sin enviar.`;
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

/** Fila de «Mis últimos partes»: nombre accesible del enlace. */
export function textoParteReciente(fecha: FechaCivil, patente: string, recorrido: string): string {
  return `Parte del ${formatearFecha(fecha)} de ${patente}, ${recorrido}`;
}

export const TEXTO_PANTALLA_PARTE = {
  noDisponible: "No se puede cargar este parte",
  descartar: "Descartar borrador",
  conductorEtiqueta: "Conductor",
  conductorSinElegir: "Elija quién conduce",
  vueltaConductor: "Parte diario",
  vueltaFicha: (patente: string) => `Ficha de ${patente}`,
  impideUso: "Impide usar la unidad",
  otraNovedad: "Otra novedad (opcional)",
  enviado: "Parte enviado",
  volverAlInicio: "Volver al inicio",
  sinNovedades: "Sin novedades",
  noCargo: "No cargó",
  fueraDeTermino: "Enviado fuera de término.",
  rotulos: { recorrido: "Recorrido", combustible: "Combustible", litros: "Combustible cargado", novedades: "Novedades" },
} as const;

/** Línea del panel «Parte enviado»: «ZK 214 BD, 18/11/2026, enviado a las 18:42.»; fuera de término, con el día del envío. Sin hora legible: «ZK 214 BD, 16/11/2026, enviado.» */
export function textoLineaParteEnviado(patente: string, fecha: FechaCivil, diaDeEnvio: FechaCivil | null, hora: string | null): string {
  if (diaDeEnvio === null || hora === null) return `${patente}, ${formatearFecha(fecha)}, enviado.`;
  if (fecha === diaDeEnvio) return `${patente}, ${formatearFecha(fecha)}, enviado a las ${hora}.`;
  return `${patente}, ${formatearFecha(fecha)}, enviado el ${formatearFecha(diaDeEnvio)} a las ${hora} (fuera de término).`;
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
 * Escrituras desde una pestaña que quedó atrás de otra (QA A1, etapa 4). Texto nuevo, a revisar por el redactor: lo ve quien
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
  mensaje: "Los datos guardados en este navegador pueden estar dañados. Recargue la página; si el error sigue, use «Reiniciar demo» para volver a la flota de ejemplo.",
} as const;
