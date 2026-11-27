// Bajar un trozo de código con `import()` y, si no llega, decir por qué. Sin DOM ni Svelte: la hora y la lista de recursos del navegador entran por `MedioDeDescarga`.
//
// Un `import()` que falla no dice la causa (el navegador lanza el mismo `TypeError` sin red, con el servidor caído o con una versión nueva ya desplegada que borró el trozo).
// Lo que sí se puede mirar es lo que el navegador anotó de ese pedido (`performance`, la CSP del sitio no deja usar `fetch`): si el servidor contestó algo (404, o 200 con el
// `index.html` en lugar del trozo) pero el trozo no se pudo cargar, el sitio cambió: hay una versión nueva y hay que recargar. Sin respuesta, es la red. Si el navegador no
// da el dato, se queda en «red» (el mensaje de siempre).

export type CausaDeDescarga = "red" | "plazo" | "version-nueva";

export class ErrorDeDescarga extends Error {
  readonly causa: CausaDeDescarga;

  constructor(causa: CausaDeDescarga, opciones?: ErrorOptions) {
    super(`No se pudo descargar un trozo de la demo (${causa}).`, opciones);
    this.name = "ErrorDeDescarga";
    this.causa = causa;
  }
}

/** Lo que el navegador anotó de un pedido (`PerformanceResourceTiming`): su dirección, cuándo empezó y el estado HTTP (0 si no hubo respuesta). */
export interface RecursoVisto {
  name: string;
  startTime: number;
  responseStatus: number;
}

export interface MedioDeDescarga {
  /** El reloj de los recursos (`performance.now()`). */
  ahora(): number;
  recursos(): readonly RecursoVisto[];
}

/** Cuánto se espera un trozo que no responde antes de darlo por perdido. Un trozo pesa unos kilobytes: pasado esto la conexión no sirve. */
export const PLAZO_DE_DESCARGA_MS = 15_000;

const MEDIO_DEL_NAVEGADOR: MedioDeDescarga = {
  ahora: () => performance.now(),
  recursos: () =>
    performance.getEntriesByType("resource").map((r) => ({
      name: r.name,
      startTime: r.startTime,
      // `responseStatus` falta en los navegadores más viejos: sin el dato no se adivina.
      responseStatus: (r as { responseStatus?: number }).responseStatus ?? 0,
    })),
};

/** El mensaje de un `import()` que no pudo traer el módulo: Chrome, Firefox y Safari (que además no dice la dirección). */
const ERROR_DE_IMPORTACION = /dynamically imported module|importing a module script failed/i;
const DIRECCION = /https?:\/\/[^\s'"]+/i;
const ES_UN_JS = /\.js(?:[?#]|$)/;

/**
 * Por qué no llegó el trozo. `desde` es el `ahora()` de antes de pedirlo y `recursos` lo anotado hasta ahora. Es «version-nueva» solo si el navegador anotó una respuesta
 * del servidor para el trozo y aun así no se pudo cargar: la del que nombra el error o, si el navegador no lo nombra, un `.js` pedido después de `desde` que dio 400 o más.
 */
export function causaDelFallo(error: unknown, desde: number, recursos: readonly RecursoVisto[]): "red" | "version-nueva" {
  if (!(error instanceof Error) || !ERROR_DE_IMPORTACION.test(error.message)) return "red";
  const direccion = DIRECCION.exec(error.message)?.[0];
  if (direccion !== undefined) return recursos.some((r) => r.name === direccion && r.responseStatus > 0) ? "version-nueva" : "red";
  return recursos.some((r) => r.startTime >= desde && ES_UN_JS.test(r.name) && r.responseStatus >= 400) ? "version-nueva" : "red";
}

/** Espera `pedido`, pero no más de `plazoMs`; un resultado o un error que llegan después del plazo se descartan. */
function conPlazo<T>(pedido: Promise<T>, plazoMs: number): Promise<T> {
  return new Promise<T>((resolver, rechazar) => {
    let vencido = false;
    const temporizador = setTimeout(() => {
      vencido = true;
      rechazar(new ErrorDeDescarga("plazo"));
    }, plazoMs);
    pedido.then(
      (valor) => {
        clearTimeout(temporizador);
        if (!vencido) resolver(valor);
      },
      (error: unknown) => {
        clearTimeout(temporizador);
        if (!vencido) rechazar(error);
      },
    );
  });
}

/**
 * Corre `cargar` (un `import()`) y devuelve lo que trae. Si falla, rechaza siempre con un `ErrorDeDescarga` que dice la causa. Con `plazoMs`, un pedido que no responde en ese
 * tiempo rechaza con la causa «plazo». No reintenta: reintentar es de quien llama, con un pedido nuevo.
 */
export async function bajar<T>(cargar: () => Promise<T>, opciones: { plazoMs?: number; medio?: MedioDeDescarga } = {}): Promise<T> {
  const medio = opciones.medio ?? MEDIO_DEL_NAVEGADOR;
  const desde = medio.ahora();
  try {
    const pedido = Promise.resolve().then(cargar);
    return await (opciones.plazoMs === undefined ? pedido : conPlazo(pedido, opciones.plazoMs));
  } catch (error) {
    if (error instanceof ErrorDeDescarga) throw error;
    throw new ErrorDeDescarga(causaDelFallo(error, desde, medio.recursos()), { cause: error });
  }
}

/** El trozo ya no existe en el servidor: hay otra versión de la demo y la salida es recargar. */
export function esVersionNueva(error: unknown): boolean {
  return error instanceof ErrorDeDescarga && error.causa === "version-nueva";
}
