// Teclado del tablero de llaves de la regla de salida (docs/diseno-ui.md, 15.6.3). El tablero es UNA sola parada de Tab: solo una llave lleva `tabindex="0"` y las
// flechas, Inicio y Fin mueven el foco entre las demás. Puro: la vista mueve el foco al índice que devuelve y le pasa el `tabindex="0"`.
// A diferencia de `estado/teclado-lista.ts`, NO da la vuelta en los extremos: el tablero es una escala con las que salen a la izquierda y las que no a la derecha del cursor.

/**
 * El índice al que va el foco después de `tecla`, o `null` si esa tecla no es de navegación (que la vista la deje pasar: Tab, Enter, letras). En un extremo devuelve el
 * mismo índice (no se mueve, pero la tecla se usó). Un `actual` que ya no existe (la lista cambió) cuenta como «ninguno»: la derecha va a la primera y la izquierda a la última.
 */
export function indiceTrasTecla(tecla: string, actual: number, cantidad: number): number | null {
  if (!Number.isInteger(cantidad) || cantidad < 1 || !Number.isInteger(actual)) return null;
  const ultimo = cantidad - 1;
  const hayActual = actual >= 0 && actual <= ultimo;
  if (tecla === "Home") return 0;
  if (tecla === "End") return ultimo;
  if (tecla === "ArrowRight") return hayActual ? Math.min(actual + 1, ultimo) : 0;
  if (tecla === "ArrowLeft") return hayActual ? Math.max(actual - 1, 0) : ultimo;
  return null;
}

/**
 * Qué llave lleva el `tabindex="0"`: la última enfocada o, la primera vez (o si esa ya no existe), la primera que no sale; si todas salen, la primera llave. `null` sin llaves.
 * `sales[i]` es `true` si la llave `i` pertenece a una unidad que sale hoy.
 */
export function indiceDeEntrada(sales: readonly boolean[], ultimaEnfocada: number | null): number | null {
  if (sales.length === 0) return null;
  if (ultimaEnfocada !== null && Number.isInteger(ultimaEnfocada) && ultimaEnfocada >= 0 && ultimaEnfocada < sales.length) return ultimaEnfocada;
  const primeraQueNoSale = sales.findIndex((sale) => !sale);
  return primeraQueNoSale === -1 ? 0 : primeraQueNoSale;
}
