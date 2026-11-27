// Textos de Hoy, Mis partes y el parte diario (presentación; los de la lógica están en `lib/dominio/textos-parte.ts`). Se bajan con esas pantallas, no con el marco.

/** Inicio del conductor (6.4): rótulos de la pantalla que no salen del dominio. Los textos del panel «Hoy», de los pendientes, de la licencia y de los últimos partes vienen de `estado/parte.ts`. */
export const TEXTO_CONDUCTOR_VISTA = {
  pendientes: "Pendientes",
  /** Nombre accesible de «Continuarlo» / «Cargarlo»: empieza por el texto visible y suma la frase del pendiente (con la patente y la fecha). */
  accionPendiente: (accion: string, texto: string) => `${accion}. ${texto}`,
  /** Sin unidad asignada (o en baja): el `select` va solo, hasta que elija una. */
  sinUnidad: "No tiene una unidad asignada. Elija la que va a usar hoy.",
  /** Primera opción del `select` cuando la unidad de hoy no se puede usar (fuera de servicio). */
  elegirOtra: "Elija otra unidad",
  /** Primera opción del `select` cuando todavía no hay unidad (estado 1); «Elija otra unidad» queda para «Usar otra unidad» y la unidad fuera de servicio (C14). */
  elegirUna: "Elija una unidad",
  /** Se anuncia en la barra de estado del panel «Hoy» al elegir una unidad con «Usar otra unidad» (el panel cambia de unidad y de destino sin otro aviso). */
  unidadElegida: (patente: string, interno: string) => `Unidad elegida: ${patente} (${interno}).`,
  confirmarDescartar: "Confirmar descarte",
  /** Aviso de «su unidad vence hoy» (o en 7 días o menos): el titular de la lógica y, entre paréntesis, la fecha de vencimiento. */
  avisoDeUnidad: (titular: string, vence: string) => `${titular} (${vence})`,
  /** Texto oculto delante de cada fila de «Mis últimos partes» (el enlace dice «Parte del 17/11/2026 ZK 214 BD 132 km»). */
  parteDel: "Parte del ",
} as const;

/**
 * Parte diario (6.5): rótulos de los dos pasos (la revisión antes de salir y el cierre de la jornada), de la barra de envío, del diálogo «Antes de enviar» y de la lectura. Los `h1`, el renglón de
 * contexto, los textos de los resultados (C1 a C3), de la lectura y de «No se puede cargar este parte», las ayudas y los errores vienen de `textos.ts`.
 */
export const TEXTO_PARTE_VISTA = {
  conductorLinea: (nombre: string) => `Conductor: ${nombre}`,
  /** Sigue a «Los campos con * son obligatorios.» (arriba de la revisión): los puntos de revisión lo son sin llevar asterisco. En el cierre no hace falta: el combustible lleva el suyo. */
  obligatoriosRevision: "También son obligatorios los puntos de revisión.",
  secciones: {
    revision: { km: "1. Kilometraje al salir", puntos: "2. Revisión de la unidad", otra: "3. Otra novedad (opcional)" },
    cierre: { km: "1. Kilometraje al terminar", combustible: "2. Combustible" },
  },
  kmInicio: "Al iniciar",
  kmFin: "Al terminar",
  recorrido: "Recorrido",
  respondidos: (n: number, total: number) => `Respondidos: ${n} de ${total}`,
  puntoCritico: "Punto crítico",
  enOrden: "En orden",
  conNovedad: "Con novedad",
  queEncontro: "¿Qué encontró?",
  nivelCombustible: "Nivel de combustible al terminar",
  litros: "Combustible cargado en la jornada",
  enviar: "Enviar revisión",
  cerrar: "Cerrar el parte",
  enviando: "Enviando…",
  cerrando: "Cerrando…",
  descartar: "Descartar borrador",
  confirmarDescartar: "Confirmar descarte",
  /** Diálogo «Antes de enviar» (K6, K7): lo que explica cada aviso viene de `textoAdvertencia` (dominio). */
  antesDeEnviar: {
    titulo: "Antes de enviar",
    introRevision: "Antes de enviar la revisión, lea esto.",
    introCierre: "Antes de cerrar el parte, lea esto.",
    enviarDeTodosModos: "Enviar de todos modos",
    cerrarDeTodosModos: "Cerrar de todos modos",
    volver: "Volver al parte",
  },
  enviado: { avisosAceptados: "Avisos aceptados" },
  lectura: {
    revision: "Revisión de la unidad",
    sinConductor: "Sin conductor",
    critica: "crítica",
  },
} as const;
