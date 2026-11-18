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
  cambiarConductor: "Cambiar",
  cerrarAviso: "Cerrar aviso",
  actualizar: "Actualizar",
  recargar: "Recargar la página",
  pantallaEnPreparacion: "Esta pantalla todavía no está hecha.",
} as const;

/** Pie (4.4). La empresa es la de ejemplo; su CUIT no se muestra acá. */
export const TEXTO_PIE = {
  datos: `Demo escrita desde cero con datos ficticios de una empresa inventada (${EMPRESA.nombre}). Los datos se guardan solo en este navegador.`,
  autoria: "Diseño, reglas y verificación: Matías Ariel Ormeño. El código lo escribió una IA bajo su dirección.",
  volverAlPortafolio: "Volver al portafolio",
} as const;
