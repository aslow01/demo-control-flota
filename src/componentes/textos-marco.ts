// Textos del marco de la aplicación (barras, selector de perfil, menú, avisos, pie y estados de arranque), en español neutro.
// Los textos que produce el dominio (avisos del arranque, errores, alertas) siguen en `src/lib/dominio/textos.ts` y se usan desde ahí.
// Esta lista nace en el paso 3.3 y es la que revisa `redactor-ux`. Es solo de presentación: no hay reglas de negocio.

import { EMPRESA } from "../lib/datos/generador.ts";

/** Dónde vive el portafolio (docs: CLAUDE.md del proyecto). El enlace "Volver al portafolio" del marco apunta acá. */
export const URL_PORTAFOLIO = "https://matiasormeno.com.ar/";

export const TEXTO_MARCO = {
  nombreApp: "Control de flota",
  etiquetaDemo: "Demo con datos ficticios",
  saltar: "Ir al contenido",
  comoFunciona: "Cómo funciona",
  reiniciarDemo: "Reiniciar demo",
  volverAlPortafolio: "← Volver al portafolio",
  volverAlPortafolioCorto: "← Portafolio",
  menuMas: "Más",
  navegacionSecciones: "Secciones",
  pestanaAlertas: "Inicio",
  pestanaFlota: "Movilidades",
  pestanaParteDeHoy: "Hoy",
  verComo: "Ver como",
  perfilEncargado: "Encargado",
  perfilConductor: "Conductor",
  /** Junto al selector: «Tamara Olivera (persona ficticia)» (D2); el lector de pantalla antepone «Conductor: ». */
  conductorElegido: (nombre: string) => `${nombre} (persona ficticia)`,
  /** Aviso previo (descripción del grupo "Ver como"): elegir Conductor abre un diálogo (WCAG 3.2.2). */
  ayudaPerfilConductor: "Al elegir «Conductor» se abre una lista para elegir quién completa el parte.",
  /** Nombre accesible del botón «Cambiar» (el texto visible es más corto). */
  cambiarConductor: "Cambiar conductor",
  cambiar: "Cambiar",
  cerrarAviso: "Cerrar aviso",
  actualizar: "Actualizar",
  recargar: "Recargar la página",
  /** Una dirección que no corresponde a ninguna pantalla («Página no encontrada»). */
  paginaNoEncontrada: "No hay ninguna pantalla en esa dirección. Puede que el enlace esté incompleto o desactualizado.",
  irA: (pantalla: string) => `Ir a ${pantalla}`,
  /** Se anuncia a los lectores de pantalla si el arranque llegó a mostrar "Preparando la flota de ejemplo…". */
  listo: "Flota de ejemplo lista.",
} as const;

/** Diálogo base (5.17). */
export const TEXTO_DIALOGO = {
  cancelar: "Cancelar",
  cerrar: "Cerrar",
  tieneCambios: "Tiene cambios sin guardar.",
  descartarCambios: "Descartar cambios",
  seguirEditando: "Seguir editando",
  /** Una línea al inicio de cada formulario con campos obligatorios (3.3.2: el asterisco no se explica solo). */
  obligatorios: "Los campos con * son obligatorios.",
} as const;

/** Diálogo "Reiniciar demo" (5.17). La descripción es la de la especificación; los errores salen de `ERRORES` del dominio. */
export const TEXTO_REINICIO = {
  titulo: "Reiniciar demo",
  descripcion: "Se borran los cambios hechos en este navegador y se vuelve a cargar la flota de ejemplo con las fechas de hoy.",
  confirmar: "Reiniciar demo",
  reiniciando: "Reiniciando…",
  /** Se anuncia a los lectores de pantalla cuando termina (no hay barra de estado de panel en el marco). */
  hecho: "Demo reiniciada. Se cargó la flota de ejemplo con las fechas de hoy.",
} as const;

/** Diálogo "¿Quién completa el parte?" (5.2 y 5.17). */
export const TEXTO_ELEGIR_CONDUCTOR = {
  titulo: "¿Quién completa el parte?",
  ayuda: "Es solo un punto de vista de la demo: no hay usuarios ni contraseñas.",
  leyenda: "Conductores",
  /** M1: separa a los conductores sugeridos para probar de los demás. */
  losDemas: "Los demás conductores",
  unidad: (patente: string) => `Unidad ${patente}`,
  sinUnidad: "Sin unidad asignada",
  continuar: "Ver como este conductor",
  elegir: "Elija quién completa el parte.",
} as const;

/** Diálogo "Cómo funciona" (5.17). */
export const TEXTO_COMO_FUNCIONA = {
  titulo: "Cómo funciona",
  queEs: [
    "Control de flota muestra cómo se vigilan los vencimientos de documentos y el parte diario de una flota de vehículos.",
    "La empresa, las personas, las patentes y los documentos son inventados.",
  ],
  tituloReglas: "Qué vence y cuándo",
  reglas: [
    {
      etiqueta: "Vencido o faltante",
      texto:
        "El documento venció o, si es obligatorio, falta cargarlo. Si es de la unidad, la unidad figura como «Bloqueada». Si es la licencia del conductor, no puede enviar la revisión ni salir con ninguna unidad.",
    },
    { etiqueta: "7 días o menos", texto: "Vence hoy o en los próximos 7 días. Hasta el día del vencimiento incluido, la unidad puede salir." },
    { etiqueta: "8 a 15 días", texto: "Hay que planificar la renovación." },
    { etiqueta: "16 a 30 días", texto: "Vence dentro del mes." },
    { etiqueta: "Más de 30 días", texto: "Sin alerta." },
  ],
  tituloParte: "El parte diario",
  parte:
    "Está pensado para usarse desde el celular y tiene dos pasos. Antes de salir, el conductor carga el kilometraje y controla 14 puntos de revisión de la unidad. Una novedad en un punto crítico, o marcada «Impide usar la unidad», deja la unidad fuera de servicio en ese momento, y la unidad no sale hasta que el encargado resuelva la novedad. Al terminar la jornada, cierra el parte con el kilometraje final y el combustible. Sin licencia de conducir vigente, o con la documentación de la unidad vencida, no puede enviar la revisión.",
  tituloDatos: "Dónde se guardan los datos",
  datos:
    "Los datos que usted carga quedan solo en este navegador y no se envían a ningún servidor. «Reiniciar demo» borra esos cambios y vuelve a la flota de ejemplo con las fechas de hoy.",
  tituloVerComo: "«Ver como»",
  verComo:
    "Cambia entre encargado y conductor para probar cada parte de la demo. El conductor solo completa el parte. No hay usuarios ni contraseñas: no protege nada.",
  entendido: "Entendido",
} as const;

/** Pie (4.4). La empresa es la de ejemplo; su CUIT no se muestra acá. */
export const TEXTO_PIE = {
  datos: `Demo escrita desde cero con datos ficticios de una empresa inventada (${EMPRESA.nombre}). Los datos se guardan solo en este navegador.`,
  autoria: "Diseño, reglas y verificación: Matías Ariel Ormeño. El código lo escribió una IA bajo su dirección.",
  volverAlPortafolio: "Volver al portafolio",
} as const;

/** Inicio, antes «Centro de alertas» (6.1): lo que dice la pantalla y no sale del dominio. Los textos de las alertas y de los diálogos vienen de `textos.ts`. */
export const TEXTO_ALERTAS = {
  /** M6: bajo el título, lo que cuenta la insignia de la pestaña «Inicio» (alertas críticas: documentos vencidos o faltantes y novedades críticas abiertas). Con 0 no se muestra. */
  criticas: (n: number) => `${n} ${n === 1 ? "alerta crítica" : "alertas críticas"}: documentos vencidos o faltantes y novedades críticas abiertas.`,
  /** Dato breve del panel del protagonista: «al 18/11/2026». */
  alFecha: (fecha: string) => `al ${fecha}`,
  /** Botón de cada fila de «Operación diaria»; el resto del nombre accesible es el texto de la fila. */
  ver: "Ver",
  verDetalleDe: (texto: string) => ` el detalle: ${texto}`,
  mostrar: "Mostrar",
  columnasVencimientos: { estado: "Estado", documento: "Documento", titular: "Titular", proyecto: "Proyecto", vence: "Vence", accion: "Acción" },
  columnasOperacion: { estado: "Estado", que: "Qué pasó", unidad: "Unidad", fecha: "Fecha", accion: "Acción" },
  /** Etiquetas de las celdas cuando la fila pasa a tarjeta. */
  proyectoDe: "Proyecto",
  venceEl: "Vence",
  /** Texto oculto de las celdas que muestran «—» (un lector de pantalla diría «raya» o nada). */
  sinFecha: "Sin fecha",
  sinProyecto: "Sin proyecto",
  /** L6: «Luis Ferreyra (persona ficticia)» en la fila de un conductor sin licencia vigente (D2), y el rótulo de su unidad. */
  conductorFicticio: (nombre: string) => `${nombre} (persona ficticia)`,
  unidadDelConductor: "Unidad",
  /** Lo que se dice cuando la fila que se quiso abrir ya no está pendiente (se renovó o se cargó mientras tanto). */
  yaNoPendiente: "Ese documento ya no está pendiente. La lista está al día.",
  /** Ídem para una novedad que se resolvió mientras tanto (otra pestaña, o ya resuelta desde la ficha). */
  novedadYaResuelta: "Esa novedad ya no está abierta. La lista está al día.",
} as const;

/** Diálogos «Renovar» y «Cargar documento» (5.11, 5.15 y 5.17). Los títulos y los botones primarios salen de `textos.ts`. */
export const TEXTO_DIALOGO_DOCUMENTO = {
  numero: "Número",
  emisor: "Emisor",
  vence: "Vence",
  emitido: "Emitido",
  ayudaEmisorHeredado: "Viene del documento anterior. Cámbielo si es otro.",
  ayudaOpcional: "Opcional.",
  /** Título del resumen de errores (5.15): «Hay 3 datos para corregir». */
  resumen: (n: number) => (n === 1 ? "Hay 1 dato para corregir" : `Hay ${n} datos para corregir`),
  guardando: "Guardando…",
} as const;

/** Movilidades, antes «Flota» (6.2): rótulos de la pantalla que no salen del dominio. Los filtros, los órdenes, los estados y los textos de cada fila vienen de `textos.ts`. */
export const TEXTO_FLOTA_VISTA = {
  agregarUnidad: "Agregar unidad",
  /** Rótulo del campo de búsqueda (visible con poco ancho; el marcador, más corto, dice qué se puede buscar y no se corta a 360 px). */
  buscar: "Buscar",
  buscarMarcador: "Patente, modelo o conductor",
  proyecto: "Proyecto",
  ordenarPor: "Ordenar por",
  mostrar: "Mostrar",
  quitarFiltros: "Quitar filtros",
  sinConductor: "Sin conductor",
  /** L6: a continuación del nombre del conductor asignado cuya licencia no ampara hoy (en minúscula: sigue al nombre). */
  sinLicencia: "sin licencia vigente",
  /** Texto oculto de la celda que muestra «—» (un lector de pantalla diría «raya» o nada). */
  sinProyecto: "Sin proyecto",
  columnas: {
    unidad: "Unidad",
    estado: "Estado hoy",
    proximo: "Próximo vencimiento",
    km: "Kilometraje",
    /** Lo que se ve en la cabecera de la tabla completa (5.10): «Km»; el nombre completo queda para los lectores y para el rótulo de la tarjeta. */
    kmCorto: "Km",
    parte: "Último parte",
    novedades: "Novedades",
    proyecto: "Proyecto y conductor",
  },
  /** Aviso de «Agregar unidad» cuando la unidad nueva no se ve con los filtros que hay puestos. */
  nuevaOculta: "La unidad nueva no se ve con los filtros actuales.",
} as const;

/** Diálogo «Agregar unidad» (5.11, 5.15 y 5.17). El título, el botón primario, la opción «Sin conductor asignado» y los errores vienen de `textos.ts`. */
export const TEXTO_DIALOGO_UNIDAD = {
  patente: "Patente",
  ayudaPatente: "Formato AA 123 BB o ABC 123.",
  interno: "Interno",
  ayudaInterno: "Un número de 1 a 999.",
  tipo: "Tipo",
  elegirTipo: "Elija el tipo",
  marca: "Marca",
  modelo: "Modelo",
  anio: "Año",
  ayudaAnio: (minimo: number, maximo: number) => `Entre ${minimo} y ${maximo}.`,
  proyecto: "Proyecto",
  elegirProyecto: "Elija el proyecto",
  conductor: "Conductor",
  ayudaConductor: "Opcional.",
  /** Junto a la opción y en la ayuda cuando el conductor elegido ya tiene una unidad. */
  yaTiene: (patente: string) => `Ya tiene asignada la unidad ${patente}.`,
  opcionConUnidad: (nombre: string, patente: string) => `${nombre} (ya tiene ${patente})`,
  guardando: "Guardando…",
} as const;

/** Ficha de unidad (6.3): rótulos de la pantalla que no salen del dominio. Los títulos de los paneles, las acciones, los estados y los textos de cada fila vienen de `textos.ts`. */
export const TEXTO_FICHA_VISTA = {
  rutaEtiqueta: "Ruta",
  motivosDe: "Motivos por los que no está disponible",
  datos: { proyecto: "Proyecto", conductor: "Conductor", kilometraje: "Kilometraje", sinConductor: "Sin conductor", sinProyecto: "—" },
  mostrar: "Mostrar",
  /** Se quiso abrir un diálogo de algo que ya cambió (otra pestaña, o la ficha estaba desactualizada). */
  yaCambio: "La unidad cambió desde la última vez que se miró. La ficha está al día.",
  documentos: {
    columnas: { documento: "Documento", numero: "Número", vence: "Vence", estado: "Estado", accion: "Acciones" },
    /** Rótulos de las celdas cuando la fila pasa a tarjeta. */
    numeroDe: "Número",
    venceEl: "Vence",
    sinNumero: "—",
    /** Cada documento reemplazado, dentro de «Anteriores (N)»: «DEMO-88-3320 · Aseguradora Cuyo · venció el 17/11/2025 · cargado el 18/11/2025». */
    anterior: (a: { numero: string; emisor: string | null; vence: string; cargado: string }) =>
      [a.numero, a.emisor, `vencía el ${a.vence}`, `cargado el ${a.cargado}`].filter((t) => t !== null).join(" · "),
    /** El documento ya no es el que se quiso abrir (se renovó o se cargó mientras tanto). */
    yaNoDisponible: "Ese documento ya cambió. La lista está al día.",
    sinDocumentos: "Esta unidad no tiene documentos cargados.",
  },
  novedades: {
    /** Lo que se anuncia al cambiar el filtro: «Novedades abiertas: 1.» */
    anuncio: (etiqueta: string, cantidad: number) => `Novedades ${etiqueta.toLowerCase()}: ${cantidad}.`,
    impideVolver: "Impide volver a servicio hasta que se resuelva.",
    resuelta: (fecha: string, autor: string) => `Resuelta el ${fecha} por ${autor}.`,
    yaResuelta: "Esa novedad ya está resuelta. La lista está al día.",
  },
  kilometraje: {
    columnas: { fecha: "Fecha", registro: "Registro", recorrido: "Recorrido" },
    motivo: (texto: string) => `Motivo: ${texto}`,
    /** Texto oculto de la celda del recorrido de un parte en uso, que muestra «—» (un lector de pantalla diría «raya» o nada). */
    sinRecorrido: "Sin recorrido",
    /** Texto oculto delante de la fecha del enlace al parte: «Parte del 17/11/2026». */
    parteDel: "Parte del ",
  },
  historial: {
    resumenDelDetalle: "Detalle del evento",
    kilometraje: "Kilometraje",
    recorrido: "Recorrido",
    combustible: "Combustible",
    litros: "Litros",
    novedades: "Novedades",
    critica: "crítica",
    fueraDePlazo: "Enviado fuera de plazo.",
    campo: "Campo",
    /** Nombre accesible de «Ver el parte completo» (hay uno por parte enviado): el texto visible, y cuándo se envió. `instante` es `dd/mm/aaaa hh:mm`. */
    verParteEnviado: (visible: string, instante: string) => {
      const [fecha = "", hora = ""] = instante.split(" ");
      return `${visible} enviado el ${fecha} a las ${hora}`;
    },
  },
} as const;

/** Diálogos de la ficha (5.11 y 5.17): rótulos de los campos y ayudas. Los títulos, los primarios, las notas y los errores vienen de `textos.ts`. */
export const TEXTO_DIALOGOS_FICHA_VISTA = {
  guardando: "Guardando…",
  cerrar: "Cerrar",
  resolver: {
    campo: "¿Qué se hizo?",
    ayuda: (min: number, max: number) => `Entre ${min} y ${max} caracteres.`,
    novedad: "Novedad",
  },
  novedad: {
    descripcion: "Descripción",
    ayuda: (min: number, max: number) => `Qué se encontró. Entre ${min} y ${max} caracteres.`,
  },
  fueraDeServicio: {
    motivo: "Motivo",
    ayuda: (min: number, max: number) => `Por ejemplo: «Cambio de embrague en el taller». Entre ${min} y ${max} caracteres.`,
  },
  volver: {
    novedadesAbiertas: "Novedades críticas abiertas",
  },
  baja: {
    motivo: "Motivo",
    ayuda: (min: number, max: number) => `Por ejemplo: «Venta de la unidad». Entre ${min} y ${max} caracteres.`,
  },
  kilometraje: {
    desde: "Desde",
    ayudaDesde: "Desde qué día vale el nuevo kilometraje. No puede ser posterior a hoy.",
    kmBase: "Nuevo kilometraje",
    ayudaKm: "El que marca hoy el tablero. Se acepta 84320, 84.320 o 84 320.",
    motivo: "Motivo",
    ayudaMotivo: (min: number, max: number) => `Por ejemplo: «Se cambió el tablero». Entre ${min} y ${max} caracteres.`,
  },
  asignacion: {
    proyecto: "Proyecto",
    elegirProyecto: "Elija el proyecto",
    conductor: "Conductor",
    ayudaConductor: "Opcional.",
    yaTiene: (patente: string) => `Ya tiene asignada la unidad ${patente}.`,
    opcionConUnidad: (nombre: string, patente: string) => `${nombre} (ya tiene ${patente})`,
  },
  cargarOtro: {
    tipo: "Tipo de documento",
    elegirTipo: "Elija el tipo de documento",
  },
} as const;

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
