// Autoguardado del borrador del parte (docs/diseno.md, P3; docs/diseno-ui.md, 5.15): «se guarda solo 500 ms después de la última tecla y al salir del
// campo». Sin DOM y sin Svelte: el reloj y el guardado se inyectan (en el navegador, `setTimeout` y `app.guardarBorradorDeParte`), así se prueba sin tiempo
// real. Lo que escribe la persona nunca se pisa: el controlador solo mira y guarda; los valores del formulario son de la vista.
//
// - Guarda de a uno (si se escribe mientras se guarda, después se guarda lo último).
// - No escribe lo que ya está guardado.
// - Si falla, lo escrito sigue pendiente (se reintenta con el próximo cambio, al salir del campo o al `vaciar`).
// - El indicador tiene dos textos: `visible` (cambia en cada guardado: la hora) y `anuncio` (para la región `role="status"`: cambia solo al cambiar de
//   estado, no en cada guardado; sección 10 de diseno-ui.md: «no anunciar cada autoguardado»).

import { errorGeneralParte, mismosValores, type ErroresDeParte, type ValoresParte } from "../dominio/formulario-parte.ts";
import { TEXTO_GUARDADO } from "../dominio/textos-parte.ts";

/**
 * Lo que devuelve guardar el borrador. `sinCambios` es el caso de un borrador que todavía no existe y cuyos valores siguen siendo los iniciales (P13/D11):
 * no se escribe nada y no se dice «Guardado». `tipo: "campos"` es un error de formato (P3: no se guarda y se avisa en el campo); `"escritura"`, que falló
 * la escritura (D10: lo escrito sigue en pantalla); `"regla"`, que el dominio rechazó el parte (la unidad pasó a fuera de servicio, la fecha ya no vale…:
 * el mensaje va en `errores.general`).
 */
export type ResultadoDeBorrador =
  | { ok: true; parteId: string | null; hora: string | null; sinCambios: boolean }
  | { ok: false; tipo: "campos"; errores: ErroresDeParte }
  | { ok: false; tipo: "escritura" | "regla"; errores: ErroresDeParte };

export type EstadoDeGuardado = "inicial" | "guardando" | "guardado" | "campos" | "error";

export interface IndicadorDeGuardado {
  estado: EstadoDeGuardado;
  /** «Guardando…», «Guardado en este equipo a las 14:32», «Sin guardar: corrija los campos marcados.» o el error; vacío antes del primer guardado. */
  visible: string;
  /** El texto de la región `role="status"`: solo cambia cuando cambia de estado (primera vez guardado, error, recuperado, campos). */
  anuncio: string;
  /** La hora del último guardado (`14:32`); `null` si no hay. */
  hora: string | null;
}

export interface DependenciasAutoguardado {
  /** Los valores con los que arrancó el formulario: lo que ya está guardado (o lo que se precargó). */
  valores: ValoresParte;
  guardar: (valores: ValoresParte) => Promise<ResultadoDeBorrador>;
  /** Se llama con cada cambio del indicador (un objeto nuevo cada vez). */
  alCambiar: (indicador: IndicadorDeGuardado) => void;
  /** Por defecto, 500 ms (P3). */
  esperaMs?: number;
  /** Por defecto, `setTimeout`. */
  programar?: (accion: () => void, ms: number) => unknown;
  /** Por defecto, `clearTimeout`. */
  cancelar?: (id: unknown) => void;
}

export interface Autoguardado {
  /** El indicador actual (el mismo que se entregó por última vez a `alCambiar`). */
  readonly indicador: IndicadorDeGuardado;
  /** Se llama con cada tecla (`input`): programa el guardado 500 ms después de la última. */
  cambio(valores: ValoresParte): void;
  /** Se llama al salir de un campo (`blur`/`change`): guarda ya, sin esperar. `null` si no había nada que guardar. */
  alSalirDelCampo(valores: ValoresParte): Promise<ResultadoDeBorrador | null>;
  /** Antes de enviar, de descartar o de irse: guarda ya lo pendiente (con `valores`, si se pasan) y espera al guardado en curso. `null` si no había nada. */
  vaciar(valores?: ValoresParte): Promise<ResultadoDeBorrador | null>;
  /** Después de descartar el borrador (o de cambiar de parte): cancela lo pendiente, ignora lo que esté en vuelo y toma `valores` como lo ya guardado. */
  reiniciar(valores: ValoresParte): void;
  /** Al salir de la pantalla: no guarda nada más. */
  cerrar(): void;
}

export const ESPERA_AUTOGUARDADO_MS = 500;

const INDICADOR_INICIAL: IndicadorDeGuardado = { estado: "inicial", visible: "", anuncio: "", hora: null };

export function crearAutoguardado(deps: DependenciasAutoguardado): Autoguardado {
  const espera = deps.esperaMs ?? ESPERA_AUTOGUARDADO_MS;
  const programar = deps.programar ?? ((f: () => void, ms: number) => setTimeout(f, ms));
  const cancelar = deps.cancelar ?? ((id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>));

  let base = deps.valores; // lo que ya está guardado
  let pendiente: ValoresParte | null = null; // lo que hay que guardar
  let temporizador: unknown = null;
  let enCurso: Promise<ResultadoDeBorrador | null> | null = null;
  let repetir = false;
  let pedidoExplicito = false; // lo pidió una acción de la persona (salir del campo, enviar, irse), no el plazo de 500 ms
  let generacion = 0; // sube con `reiniciar` y `cerrar`: un resultado de una generación vieja se ignora
  let cerrado = false;

  // El estado «estable» (sin contar «guardando»): a lo que vuelve el indicador si no hubo nada que guardar.
  let estable: IndicadorDeGuardado = INDICADOR_INICIAL;
  let indicador: IndicadorDeGuardado = INDICADOR_INICIAL;

  function mostrar(i: IndicadorDeGuardado): void {
    indicador = i;
    deps.alCambiar(i);
  }

  function fijar(i: IndicadorDeGuardado): void {
    estable = i;
    mostrar(i);
  }

  function limpiarTemporizador(): void {
    if (temporizador !== null) cancelar(temporizador);
    temporizador = null;
  }

  function resultadoOk(r: Extract<ResultadoDeBorrador, { ok: true }>): void {
    if (r.hora === null) {
      mostrar(estable); // no se escribió nada: sigue el indicador de antes
      return;
    }
    const anuncio = estable.estado === "guardado" ? estable.anuncio : estable.estado === "error" ? TEXTO_GUARDADO.anuncioRecuperado : TEXTO_GUARDADO.anuncioGuardado;
    fijar({ estado: "guardado", visible: TEXTO_GUARDADO.guardado(r.hora), anuncio, hora: r.hora });
  }

  /**
   * `explicito`: el guardado lo pidió una acción de la persona (salir del campo, enviar, irse): la vista marca el campo con el error y recién ahí el indicador
   * dice «corrija los campos marcados» y lo anuncia. Mientras escribe (el plazo de 500 ms) no hay campo marcado: no se anuncia nada ni se manda a mirar uno (N1).
   */
  function resultadoError(r: Extract<ResultadoDeBorrador, { ok: false }>, explicito: boolean): void {
    if (r.tipo === "campos") {
      if (!explicito) {
        fijar({ estado: "campos", visible: TEXTO_GUARDADO.sinValidar, anuncio: "", hora: null });
        return;
      }
      const anuncio = estable.estado === "campos" && estable.anuncio !== "" ? estable.anuncio : TEXTO_GUARDADO.anuncioConErroresDeCampo;
      fijar({ estado: "campos", visible: TEXTO_GUARDADO.conErroresDeCampo, anuncio, hora: null });
      return;
    }
    // Un error de escritura (el texto de 5.15) o de regla (el mensaje del dominio): se muestra y no se pierde lo escrito.
    const texto = r.tipo === "regla" ? (r.errores.general ?? TEXTO_GUARDADO.error) : TEXTO_GUARDADO.error;
    fijar({ estado: "error", visible: texto, anuncio: texto, hora: null });
  }

  function ejecutar(explicito: boolean): Promise<ResultadoDeBorrador | null> {
    limpiarTemporizador();
    if (explicito) pedidoExplicito = true;
    if (enCurso !== null) {
      repetir = true; // el que está en curso, al terminar, guarda lo último que haya
      return enCurso;
    }
    const miGeneracion = generacion;
    const trabajo = (async (): Promise<ResultadoDeBorrador | null> => {
      let ultimo: ResultadoDeBorrador | null = null;
      do {
        repetir = false;
        const valores = pendiente;
        if (valores === null) break;
        if (mismosValores(valores, base)) {
          pendiente = null;
          mostrar(estable);
          break;
        }
        pendiente = null;
        mostrar({ ...estable, estado: "guardando", visible: TEXTO_GUARDADO.guardando });
        let r: ResultadoDeBorrador;
        try {
          r = await deps.guardar(valores);
        } catch {
          // Un guardado que rechaza (un dato inesperado, un fallo del almacenamiento) es un error de escritura más: sin esto el indicador quedaba en «Guardando…».
          r = { ok: false, tipo: "escritura", errores: errorGeneralParte(TEXTO_GUARDADO.error) };
        }
        if (miGeneracion !== generacion) return null; // se descartó o se cerró mientras se guardaba
        const explicito = pedidoExplicito;
        pedidoExplicito = false;
        ultimo = r;
        if (r.ok) {
          base = valores;
          resultadoOk(r);
          if (pendiente !== null && !mismosValores(pendiente, base)) repetir = true;
        } else {
          pendiente ??= valores; // lo que falló sigue pendiente
          resultadoError(r, explicito);
          break;
        }
      } while (repetir);
      pedidoExplicito = false;
      return ultimo;
    })();
    enCurso = trabajo;
    void trabajo.finally(() => {
      if (enCurso === trabajo) enCurso = null;
    });
    return trabajo;
  }

  return {
    get indicador() {
      return indicador;
    },
    cambio(valores) {
      if (cerrado) return;
      // Con un guardado en curso, `base` todavía es la de antes: volver a ese valor es un cambio y hay que guardarlo después.
      if (enCurso === null && pendiente === null && mismosValores(valores, base)) return;
      pendiente = valores;
      mostrar({ ...estable, estado: "guardando", visible: TEXTO_GUARDADO.guardando });
      limpiarTemporizador();
      temporizador = programar(() => {
        temporizador = null;
        void ejecutar(false);
      }, espera);
    },
    alSalirDelCampo(valores) {
      if (cerrado) return Promise.resolve(null);
      if (enCurso === null && pendiente === null && mismosValores(valores, base)) return Promise.resolve(null);
      pendiente = valores;
      return ejecutar(true);
    },
    async vaciar(valores) {
      if (cerrado) return null;
      if (valores !== undefined && (enCurso !== null || pendiente !== null || !mismosValores(valores, base))) pendiente = valores;
      if (pendiente === null) return enCurso;
      return ejecutar(true);
    },
    reiniciar(valores) {
      generacion += 1;
      limpiarTemporizador();
      base = valores;
      pendiente = null;
      enCurso = null;
      repetir = false;
      pedidoExplicito = false;
      cerrado = false;
      fijar(INDICADOR_INICIAL);
    },
    cerrar() {
      generacion += 1;
      limpiarTemporizador();
      pendiente = null;
      cerrado = true;
    },
  };
}
