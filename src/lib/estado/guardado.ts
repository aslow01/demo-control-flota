// Guardado de un formulario en un diálogo: el aviso «Guardando…» solo si tarda, y pase lo que pase el diálogo se desbloquea.
// Sin esto, un rechazo inesperado (un callback que lanza, un dato dañado) dejaba `guardando` en `true` y el diálogo no se podía cerrar.

/** «Guardando…» recién aparece si el guardado tarda más que esto (5.15). */
export const ESPERA_GUARDANDO_MS = 200;

export interface OpcionesGuardado<R> {
  /** El guardado pasó de la espera: mostrar «Guardando…». */
  alTardar: () => void;
  /** Terminó, bien o mal (o falló): apagar el estado «guardando» y el aviso. */
  alTerminar: () => void;
  /** El guardado lanzó o rechazó: el resultado de error general que se muestra en el diálogo. */
  alFallar: () => R;
  esperaMs?: number;
}

export async function guardarConIndicador<R>(guardar: () => Promise<R>, opciones: OpcionesGuardado<R>): Promise<R> {
  const plazo = setTimeout(opciones.alTardar, opciones.esperaMs ?? ESPERA_GUARDANDO_MS);
  try {
    return await guardar();
  } catch {
    return opciones.alFallar();
  } finally {
    clearTimeout(plazo);
    opciones.alTerminar();
  }
}
