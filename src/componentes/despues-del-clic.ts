// Mostrar algo que mueve la página (el mensaje de error de un campo, que empuja todo lo de abajo) justo cuando el foco sale del campo porque la persona tocó otro
// control haría que el clic caiga afuera del botón: entre que se baja y se suelta el dedo, el botón se corrió. Por eso se espera al clic (QA E5, M2).

/** Cuánto tiempo, desde que se tocó la pantalla, se cuenta que el clic todavía puede estar por llegar. */
const VENTANA_DEL_CLIC_MS = 700;

/** ¿La persona tocó la pantalla hace tan poco que el clic de ese toque puede no haber llegado? `ultimoToque` es la hora del último `pointerdown`. */
export function clicEnCurso(ahora: number, ultimoToque: number): boolean {
  return ahora - ultimoToque <= VENTANA_DEL_CLIC_MS && ahora >= ultimoToque;
}

/** Resuelve cuando llega el próximo clic (ya procesado) o pasado `tope` ms si no llega (se arrastró, se soltó afuera). Siempre saca su oyente. */
export function despuesDelClic(tope: number = VENTANA_DEL_CLIC_MS): Promise<void> {
  return new Promise((listo) => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let terminado = false;
    const terminar = (): void => {
      if (terminado) return;
      terminado = true;
      document.removeEventListener("click", alClic, true);
      clearTimeout(temporizador);
      // Un turno más: el clic termina de procesarse (el botón se marca) antes de que la página se mueva.
      setTimeout(listo, 0);
    };
    const alClic = (): void => terminar();
    document.addEventListener("click", alClic, true);
    temporizador = setTimeout(terminar, tope);
  });
}
