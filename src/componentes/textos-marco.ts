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
  pestanaAlertas: "Alertas",
  pestanaFlota: "Flota",
  pestanaParteDeHoy: "Parte de hoy",
  verComo: "Ver como",
  perfilEncargado: "Encargado",
  perfilConductor: "Conductor",
  conductorElegido: (nombre: string) => `Conductor: ${nombre} (persona ficticia)`,
  /** Aviso previo (descripción del grupo "Ver como"): elegir Conductor abre un diálogo (WCAG 3.2.2). */
  ayudaPerfilConductor: "Al elegir «Conductor» se abre una lista para elegir quién completa el parte.",
  cambiarConductor: "Cambiar conductor",
  cerrarAviso: "Cerrar aviso",
  actualizar: "Actualizar",
  recargar: "Recargar la página",
  pantallaEnPreparacion: "Esta pantalla todavía no está disponible.",
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
        "El documento venció o, si es obligatorio, falta cargarlo. Si es de la unidad, la unidad figura como «No puede salir». Si es del conductor, no la bloquea: avisa al enviar el parte.",
    },
    { etiqueta: "7 días o menos", texto: "Vence hoy o en los próximos 7 días. Hasta el día del vencimiento incluido, la unidad puede salir." },
    { etiqueta: "8 a 15 días", texto: "Hay que planificar la renovación." },
    { etiqueta: "16 a 30 días", texto: "Vence dentro del mes." },
    { etiqueta: "Más de 30 días", texto: "Sin alerta." },
  ],
  tituloParte: "El parte diario",
  parte:
    "Está pensado para usarse desde el celular: el conductor carga el kilometraje, 10 puntos de revisión y, si cargó, el combustible. Una novedad en un punto crítico, o marcada «Impide usar la unidad», deja la unidad fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio.",
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
