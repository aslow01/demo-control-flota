// Movimiento entre pantallas (prototipo «Turno»; docs/diseno-ui.md, sección 3.6). Es presentación pura: no decide nada de la navegación.
//
//  - `conMovimiento` envuelve la barra de direcciones: cuando el aviso de cambio trae OTRA PANTALLA (no un filtro ni una letra del buscador), el
//    cambio de estado corre dentro de `document.startViewTransition`. La salida dura 110 ms y la entrada, 230 ms (CSS en `base.css`).
//    La patente viaja de la fila de la lista al título de la ficha y vuelve (`view-transition-name` puesto por CSSOM, nunca por atributo `style`: la CSP no lo permite).
//  - Sin `startViewTransition` (otros navegadores) entra una animación CSS equivalente (`main.entra`). Con `prefers-reduced-motion: reduce` o con «Sin animaciones» (`data-movimiento="quieto"`), nada.
//  - `esperarTransicion` dice cuándo termina la transición en curso: la entrada de una vista (`entrada.ts`) la espera antes de soltar su coreografía.
//  - Los cambios que hace la propia aplicación (`app.irA`, perfil, reinicio) ya dibujaron el estado antes de que llegue el aviso: no llevan movimiento.
import { tick } from "svelte";
import { clavePantalla, parsearHash } from "../lib/estado/enrutador.ts";
import type { Ubicacion } from "../lib/estado/ubicacion.ts";

const CLASE_EN_TRANSICION = "con-transicion";
const CLASE_DE_ENTRADA = "entra";
const NOMBRE_DE_LA_PATENTE = "patente-viaja";
/** Lo más que se espera a que llegue el título de una pantalla que se baja al entrar (ficha, parte, conductor) antes de sacar la foto nueva. */
const ESPERA_MAXIMA_MS = 400;

/** «Menos movimiento»: lo pide el sistema (`prefers-reduced-motion: reduce`) o la persona con «Sin animaciones» (`data-movimiento="quieto"` en <html>, lo pone `main.ts`). */
export function quiereMenosMovimiento(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.movimiento === "quieto";
}

/** La transición entre pantallas que está corriendo ahora (`null` si no hay ninguna). La entrada de una vista espera a que termine antes de soltar su coreografía. */
let transicionEnCurso: Promise<void> | null = null;

/** Se cumple cuando no hay ninguna transición entre pantallas en curso (enseguida, si no hay). Una transición saltada o rota cuenta como terminada. */
export function esperarTransicion(): Promise<void> {
  return transicionEnCurso ?? Promise.resolve();
}

/**
 * ¿Es un WebKit que no es Chromium (Safari, o cualquier navegador de iPhone, que por dentro es Safari)? Ahí NO se usa `startViewTransition`: en el WebKit 26.5 de Playwright
 * esta página tira abajo el renderizador al navegar con la transición (QA E5, A1), y no se pudo mirar en un Safari real. Se prefiere la animación CSS de respaldo, que anda en todos lados.
 * El agente de usuario se mira por cómo se dice cada motor: Chrome, Edge y Opera dicen «Chrome/»; los de iPhone dicen «CriOS/», «FxiOS/», «EdgiOS/» o «OPiOS/»; Safari dice
 * «AppleWebKit» sin «Chrome/». Firefox no dice «AppleWebKit». Si el agente no dice nada, el fabricante «Apple» lo delata.
 */
export function esWebKitSinChromium(navegador: { userAgent: string; vendor?: string }): boolean {
  const ua = navegador.userAgent;
  if (/\b(CriOS|FxiOS|EdgiOS|OPiOS)\//.test(ua)) return true;
  if (/\b(Chrome|Chromium)\//.test(ua)) return false;
  return /AppleWebKit/.test(ua) || (navegador.vendor ?? "").startsWith("Apple");
}

function puedeUsarTransiciones(): boolean {
  return "startViewTransition" in document && !esWebKitSinChromium(navigator);
}

function clavePorHash(hash: string): string {
  const ruta = parsearHash(hash);
  return ruta.tipo === "sin-ruta" ? "sin-ruta" : clavePantalla(ruta);
}

function patenteDeHash(hash: string): string | null {
  const ruta = parsearHash(hash);
  return ruta.tipo === "unidad" ? ruta.patente : null;
}

/** El rótulo de esa patente que se ve en pantalla: el de una lista o el del título de la ficha. */
function patenteVisible(patente: string, enElTitulo: boolean): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(enElTitulo ? "main h1 .patente" : "main .patente")) {
    if ((el.textContent ?? "").replace(/\s/g, "") !== patente) continue;
    if (!enElTitulo && el.closest("h1") !== null) continue;
    const caja = el.getBoundingClientRect();
    if (caja.width > 0 && caja.bottom > 0 && caja.top < window.innerHeight) return el;
  }
  return null;
}

function poner(el: HTMLElement | null): void {
  el?.style.setProperty("view-transition-name", NOMBRE_DE_LA_PATENTE);
}
function sacar(el: HTMLElement | null): void {
  el?.style.removeProperty("view-transition-name");
}

/** Espera a que el estado nuevo esté dibujado, incluido el título de una pantalla que se baja al entrar (si no, la foto nueva saldría vacía). */
async function esperarLaPantalla(): Promise<void> {
  await tick();
  const limite = performance.now() + ESPERA_MAXIMA_MS;
  while (document.querySelector("main h1") === null && performance.now() < limite) {
    await new Promise<void>((listo) => setTimeout(listo, 16));
  }
}

/** Lo más que se espera a que avise `animationend` de la entrada con CSS (dura 230 ms): si nunca llega (pestaña oculta, animación sin efecto), la espera se suelta igual. */
const TOPE_DE_LA_ENTRADA_CON_CSS_MS = 600;
let terminarEntradaConCss: (() => void) | null = null;

/** Para navegadores sin View Transitions: la pantalla nueva entra con la misma subida corta. */
function entradaConCss(aplicar: () => void): void {
  aplicar();
  // Para `esperarTransicion`: la entrada «termina» cuando acaba la animación (o enseguida, si no hay `#principal` donde correrla, o pasado el tope).
  terminarEntradaConCss?.();
  const terminada = new Promise<void>((listo) => {
    terminarEntradaConCss = listo;
    setTimeout(listo, TOPE_DE_LA_ENTRADA_CON_CSS_MS);
  });
  transicionEnCurso = terminada;
  void terminada.then(() => {
    if (transicionEnCurso === terminada) transicionEnCurso = null;
  });
  void tick().then(() => {
    const principal = document.getElementById("principal");
    if (principal === null) return terminarEntradaConCss?.();
    // Un solo oyente para todas las entradas (el mismo, agregarlo otra vez no hace nada): al terminar la animación se saca la clase.
    principal.addEventListener("animationend", alTerminarLaEntrada);
    principal.classList.remove(CLASE_DE_ENTRADA);
    void principal.offsetWidth; // reinicia la animación si todavía estaba en curso
    principal.classList.add(CLASE_DE_ENTRADA);
  });
}
function alTerminarLaEntrada(e: AnimationEvent): void {
  if (e.target !== e.currentTarget || !(e.currentTarget instanceof HTMLElement)) return;
  e.currentTarget.classList.remove(CLASE_DE_ENTRADA);
  terminarEntradaConCss?.();
}

function conTransicion(aplicar: () => void, antes: string, despues: string): void {
  // La patente que viaja: al ir a una ficha, la de la fila que se deja; al volver, la del título que se deja.
  const queViaja = patenteDeHash(despues) ?? patenteDeHash(antes);
  const alIr = patenteDeHash(despues) !== null && patenteDeHash(antes) === null;
  const alVolver = patenteDeHash(antes) !== null && patenteDeHash(despues) === null;
  const viejo = queViaja !== null && (alIr || alVolver) ? patenteVisible(queViaja, alVolver) : null;
  let nuevo: HTMLElement | null = null;
  poner(viejo);

  document.documentElement.classList.add(CLASE_EN_TRANSICION);
  const transicion = document.startViewTransition(async () => {
    aplicar();
    await esperarLaPantalla();
    if (viejo !== null && queViaja !== null) {
      nuevo = patenteVisible(queViaja, alIr);
      poner(nuevo);
    }
  });
  // Una transición saltada (pestaña oculta, otra que llega encima) rechaza `ready`: no es un error de la aplicación. En cambio, si `updateCallbackDone` rechaza es porque
  // falló `aplicar` (el cambio de estado): eso sí se informa, no se traga. `finished` repite ese rechazo, así que acá solo se limpia.
  transicion.ready.catch(() => {});
  transicion.updateCallbackDone.catch((error: unknown) => console.error(error));
  // `terminada` se cumple siempre (también si la transición se salta o se rompe): quien espera no se queda colgado.
  const terminada = transicion.finished.then(
    () => undefined,
    () => undefined,
  );
  transicionEnCurso = terminada;
  const limpiar = (): void => {
    document.documentElement.classList.remove(CLASE_EN_TRANSICION);
    sacar(viejo);
    sacar(nuevo);
    if (transicionEnCurso === terminada) transicionEnCurso = null;
  };
  void transicion.finished.then(limpiar, limpiar);
}

export function conMovimiento(base: Ubicacion): Ubicacion {
  // Lo último que la aplicación leyó es lo que está dibujado: con eso se sabe de qué pantalla se viene.
  let mostrado = base.leerHash();
  return {
    ...base,
    leerHash() {
      mostrado = base.leerHash();
      return mostrado;
    },
    alCambiar(oyente) {
      return base.alCambiar(() => {
        const antes = mostrado;
        const despues = base.leerHash();
        const otraPantalla = clavePorHash(antes) !== clavePorHash(despues);
        // Un diálogo abierto no lleva transición encima (los de `App.svelte` se cierran solos al cambiar de pantalla, los de cada pantalla se van con ella).
        if (!otraPantalla || quiereMenosMovimiento() || document.querySelector("dialog[open]") !== null) return oyente();
        if (!puedeUsarTransiciones()) return entradaConCss(oyente);
        conTransicion(oyente, antes, despues);
      });
    },
  };
}
