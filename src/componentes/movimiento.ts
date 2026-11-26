// Movimiento entre pantallas (prototipo «Turno»; docs/diseno-ui.md, sección 3.6). Es presentación pura: no decide nada de la navegación.
//
//  - `conMovimiento` envuelve la barra de direcciones: cuando el aviso de cambio trae OTRA PANTALLA (no un filtro ni una letra del buscador), el
//    cambio de estado corre dentro de `document.startViewTransition`. La salida dura 110 ms y la entrada, 230 ms (CSS en `base.css`).
//    La patente viaja de la fila de la lista al título de la ficha y vuelve (`view-transition-name` puesto por CSSOM, nunca por atributo `style`: la CSP no lo permite).
//  - Sin `startViewTransition` (otros navegadores) entra una animación CSS equivalente (`main.entra`). Con `prefers-reduced-motion: reduce`, nada.
//  - Los cambios que hace la propia aplicación (`app.irA`, perfil, reinicio) ya dibujaron el estado antes de que llegue el aviso: no llevan movimiento.
import { tick } from "svelte";
import { clavePantalla, parsearHash } from "../lib/estado/enrutador.ts";
import type { Ubicacion } from "../lib/estado/ubicacion.ts";

const CLASE_EN_TRANSICION = "con-transicion";
const CLASE_DE_ENTRADA = "entra";
const NOMBRE_DE_LA_PATENTE = "patente-viaja";
/** Lo más que se espera a que llegue el título de una pantalla que se baja al entrar (ficha, parte, conductor) antes de sacar la foto nueva. */
const ESPERA_MAXIMA_MS = 400;

export function quiereMenosMovimiento(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

/** Para navegadores sin View Transitions: la pantalla nueva entra con la misma subida corta. */
function entradaConCss(aplicar: () => void): void {
  aplicar();
  void tick().then(() => {
    const principal = document.getElementById("principal");
    if (principal === null) return;
    principal.classList.remove(CLASE_DE_ENTRADA);
    void principal.offsetWidth; // reinicia la animación si todavía estaba en curso
    principal.classList.add(CLASE_DE_ENTRADA);
    const alTerminar = (e: AnimationEvent): void => {
      if (e.target !== principal) return;
      principal.classList.remove(CLASE_DE_ENTRADA);
      principal.removeEventListener("animationend", alTerminar);
    };
    principal.addEventListener("animationend", alTerminar);
  });
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
  // Una transición saltada (pestaña oculta, otra que llega encima) rechaza estas promesas: no es un error de la aplicación.
  transicion.ready.catch(() => {});
  transicion.updateCallbackDone.catch(() => {});
  void transicion.finished
    .catch(() => {})
    .finally(() => {
      document.documentElement.classList.remove(CLASE_EN_TRANSICION);
      sacar(viejo);
      sacar(nuevo);
    });
}

// ---------- La cifra cobre de Inicio cuenta de 0 a N (al abrir la demo y al reiniciarla) ----------
// Es solo lo que se ve: el valor final está siempre en el DOM para los lectores de pantalla (`CifraQueCuenta`), y nada de esto se anuncia.
const EVENTO_DE_CUENTA = "cuenta-de-cifras";
const DURACION_DE_LA_CUENTA_MS = 650;
let cuentaPendiente = true;

/** Pide que la cifra vuelva a contar (después de reiniciar la demo). */
export function pedirCuenta(): void {
  cuentaPendiente = true;
  document.dispatchEvent(new Event(EVENTO_DE_CUENTA));
}

/** ¿Toca contar ahora? Lo gasta: cuenta una vez por pedido (la primera, al abrir). Con menos movimiento nunca cuenta. */
export function consumirCuenta(): boolean {
  const toca = cuentaPendiente && !quiereMenosMovimiento();
  cuentaPendiente = false;
  return toca;
}

export function alPedirseLaCuenta(oyente: () => void): () => void {
  document.addEventListener(EVENTO_DE_CUENTA, oyente);
  return () => document.removeEventListener(EVENTO_DE_CUENTA, oyente);
}

/** Cuenta de 0 a `fin` frenando al final (curva cúbica). Devuelve cómo cortarla; `alPaso` recibe cada número y termina siempre en `fin`. */
export function contarHasta(fin: number, alPaso: (n: number) => void, alTerminar: () => void): () => void {
  if (fin <= 0) {
    alPaso(fin);
    alTerminar();
    return () => {};
  }
  const inicio = performance.now();
  let cuadro = 0;
  const paso = (ahora: number): void => {
    const avance = Math.min(1, Math.max(0, (ahora - inicio) / DURACION_DE_LA_CUENTA_MS));
    alPaso(Math.round(fin * (1 - (1 - avance) ** 3)));
    if (avance < 1) cuadro = requestAnimationFrame(paso);
    else alTerminar();
  };
  alPaso(0);
  cuadro = requestAnimationFrame(paso);
  return () => cancelAnimationFrame(cuadro);
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
        // Un diálogo abierto se cierra solo al cambiar de pantalla: no se le agrega una transición encima.
        if (!otraPantalla || quiereMenosMovimiento() || document.querySelector("dialog[open]") !== null) return oyente();
        if (!("startViewTransition" in document)) return entradaConCss(oyente);
        conTransicion(oyente, antes, despues);
      });
    },
  };
}
