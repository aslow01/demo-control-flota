// Los datos del ejemplo de los que dependen las pruebas de punta a punta, en un solo lugar y sin Playwright (también los lee `tests/datos-de-e2e.test.ts`).
// El ejemplo lo arma el generador con una semilla fija: es siempre el mismo. Si el generador cambia y alguno de estos datos deja de existir, esa prueba de vitest falla con un mensaje claro
// (y sin abrir un navegador); acá se corrige el dato y listo.

/** Una unidad del ejemplo que puede salir hoy: sirve para abrir su ficha, su parte y ponerla fuera de servicio. */
export const PATENTE = "ZYN469";
/** La misma patente como la escribe la pantalla (con espacio). */
export const PATENTE_EN_PANTALLA = "ZYN 469";
/** El conductor al que se le pasa el perfil en «Ver como»: el primero de la lista, con una unidad apta para salir. */
export const CONDUCTOR = "Andrés Echegaray";

/** El día de hoy en Argentina, `AAAA-MM-DD`. Se pide en cada prueba (no al cargar el módulo): pasada la medianoche no queda el día de ayer. */
export function hoyEnArgentina(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}
