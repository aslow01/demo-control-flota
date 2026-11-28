// Bajar un trozo de código con `import()` y, si no llega, decir por qué. Sin DOM ni Svelte: la hora y la lista de recursos del navegador entran por `MedioDeDescarga`.
//
// Un `import()` que falla no dice la causa (el navegador lanza el mismo `TypeError` sin red, con el servidor caído o con una versión nueva ya desplegada que borró el trozo).
// Lo que sí se puede mirar es lo que el navegador anotó de ese pedido (`performance`, la CSP del sitio no deja usar `fetch`): si el servidor contestó que el trozo ya no está (404,
// o 200 con el `index.html` en su lugar), el sitio cambió: hay una versión nueva y hay que recargar. Cualquier otra cosa (sin respuesta, un error del servidor, o el trozo llegó
// bien y lo que no llegó fue algo que necesita) es la red. Si el navegador no da el dato, se queda en «red» (el mensaje de siempre).
// Un trozo con hoja de estilos propia (cada pantalla que se baja al entrar) falla de otra manera si la hoja no llega: la precarga del empaquetador pide primero la hoja y, sin ella,
// rechaza con su propio error antes de pedir el `import()`. Se mira igual (una hoja que ya no está también es una versión nueva), pero de la hoja el navegador puede no dejar ver
// nada: con `X-Content-Type-Options: nosniff` (la cabecera de este sitio) una respuesta que no es CSS se bloquea y queda anotada con estado 0, sea un 404 o el `index.html`
// (medido en Chromium). Por eso, cuando falla la hoja, el trozo se pide una vez más: esa vuelta ya no espera la hoja y, si el trozo tampoco está, el error lo nombra.

export type CausaDeDescarga = "red" | "plazo" | "version-nueva";

export class ErrorDeDescarga extends Error {
  readonly causa: CausaDeDescarga;

  constructor(causa: CausaDeDescarga, opciones?: ErrorOptions) {
    super(`No se pudo descargar un trozo de la demo (${causa}).`, opciones);
    this.name = "ErrorDeDescarga";
    this.causa = causa;
  }
}

/** Lo que el navegador anotó de un pedido (`PerformanceResourceTiming`): su dirección, cuándo empezó, el estado HTTP (0 si no hubo respuesta) y el tipo de contenido (`""` si no lo anota). */
export interface RecursoVisto {
  name: string;
  startTime: number;
  responseStatus: number;
  contentType: string;
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
    performance.getEntriesByType("resource").map((r) => {
      // `responseStatus` y `contentType` faltan en algunos navegadores: sin el dato no se adivina.
      const { responseStatus = 0, contentType = "" } = r as { responseStatus?: number; contentType?: string };
      return { name: r.name, startTime: r.startTime, responseStatus, contentType };
    }),
};

/**
 * El mensaje de un trozo que no se pudo traer. El del `import()`: Chrome, Firefox y Safari (que además no dice la dirección). Y el de la precarga de Vite cuando no llega la hoja de
 * estilos del trozo («Unable to preload CSS for …», con la dirección de la hoja): en ese caso el `import()` ni siquiera se pide.
 */
const ERROR_AL_TRAER_EL_TROZO = /dynamically imported module|importing a module script failed|unable to preload css/i;
const ERROR_DE_LA_HOJA = /unable to preload css/i;
const DIRECCION = /https?:\/\/[^\s'"]+/i;
/** Lo que un despliegue nuevo reemplaza y un trozo necesita para andar: su JavaScript y su hoja de estilos (las imágenes y las fuentes no hacen fallar la descarga). */
const ES_CODIGO_O_ESTILOS = /\.(?:js|css)(?:[?#]|$)/;

/** El servidor contestó que ese archivo ya no está: 404 o, donde no hay página de «no encontrado» (Cloudflare Pages sin `404.html`), 200 con el `index.html` en su lugar. */
function yaNoExiste(r: RecursoVisto): boolean {
  return r.responseStatus === 404 || (r.responseStatus === 200 && r.contentType.startsWith("text/html"));
}

/**
 * Por qué no llegó el trozo. `desde` es el `ahora()` de antes de pedirlo y `recursos` lo anotado hasta ahora. Es «version-nueva» solo si el servidor contestó que un `.js` o un
 * `.css` ya no existe (`yaNoExiste`): el archivo que nombra el error (el trozo o su hoja de estilos), o cualquier otro pedido después de `desde` (el trozo, si el navegador no lo
 * nombra, o algo que el trozo importa). Que el servidor haya contestado otra cosa no alcanza: un 500, o el trozo que llegó bien mientras la red se cortaba al pedir lo que
 * necesita, son «red».
 */
export function causaDelFallo(error: unknown, desde: number, recursos: readonly RecursoVisto[]): "red" | "version-nueva" {
  if (!(error instanceof Error) || !ERROR_AL_TRAER_EL_TROZO.test(error.message)) return "red";
  const direccion = DIRECCION.exec(error.message)?.[0];
  return recursos.some((r) => (r.name === direccion || (r.startTime >= desde && ES_CODIGO_O_ESTILOS.test(r.name))) && yaNoExiste(r)) ? "version-nueva" : "red";
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
 * Pide el trozo. Si lo que falló es su hoja de estilos (la precarga rechazó sin pedir el `import()`), lo pide una vez más solo para saber del trozo: si tampoco llega, el error
 * es el de esa segunda vuelta, que lo nombra; si llega, se rechaza igual con el error de la hoja (una pantalla sin sus estilos no se devuelve).
 */
function pedirSabiendoDelTrozo<T>(cargar: () => Promise<T>): Promise<T> {
  const pedir = (): Promise<T> => Promise.resolve().then(cargar);
  return pedir().catch((error: unknown) => {
    if (!(error instanceof Error) || !ERROR_DE_LA_HOJA.test(error.message)) throw error;
    return pedir().then(() => {
      throw error;
    });
  });
}

/**
 * Corre `cargar` (un `import()`) y devuelve lo que trae. Si falla, rechaza siempre con un `ErrorDeDescarga` que dice la causa. Con `plazoMs`, un pedido que no responde en ese
 * tiempo rechaza con la causa «plazo». No reintenta para que ande: reintentar es de quien llama, con un pedido nuevo (la segunda vuelta de `pedirSabiendoDelTrozo` es solo para
 * decir la causa).
 */
export async function bajar<T>(cargar: () => Promise<T>, opciones: { plazoMs?: number; medio?: MedioDeDescarga } = {}): Promise<T> {
  const medio = opciones.medio ?? MEDIO_DEL_NAVEGADOR;
  const desde = medio.ahora();
  try {
    const pedido = pedirSabiendoDelTrozo(cargar);
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
