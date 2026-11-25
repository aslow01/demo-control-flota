// Teclado de una lista con un solo punto de tabulación (la regla de vencimientos, las solapas de la ficha): las flechas, Inicio y Fin
// dicen a qué elemento va el foco. Puro: la vista solo mueve el foco al índice que devuelve (y cambia su `tabindex`).

/** `horizontal`: solo izquierda y derecha (solapas). `ambos`: también arriba y abajo (la regla). */
export type EjesDeLista = "horizontal" | "ambos";

/**
 * El índice al que va el foco después de `tecla`, o `null` si esa tecla no mueve nada (que la vista la deje pasar). Da la vuelta en los extremos. Un índice
 * actual que ya no existe (la lista cambió) cuenta como «ninguno»: la derecha va al primero y la izquierda al último.
 */
export function indiceTrasTecla(tecla: string, actual: number, cantidad: number, ejes: EjesDeLista = "horizontal"): number | null {
  if (!Number.isInteger(cantidad) || cantidad < 1 || !Number.isInteger(actual)) return null;
  const ultimo = cantidad - 1;
  const hayActual = actual >= 0 && actual <= ultimo;
  const avanza = tecla === "ArrowRight" || (ejes === "ambos" && tecla === "ArrowDown");
  const retrocede = tecla === "ArrowLeft" || (ejes === "ambos" && tecla === "ArrowUp");
  if (tecla === "Home") return 0;
  if (tecla === "End") return ultimo;
  if (avanza) return hayActual ? (actual + 1) % cantidad : 0;
  if (retrocede) return hayActual ? (actual + ultimo) % cantidad : ultimo;
  return null;
}
