// Preferencias de apariencia (docs/diseno-ui.md, 15.4.5): el tema (claro, oscuro o automático) y «Sin animaciones». Se guardan en `localStorage`, se saneman al leerlas
// (cualquiera puede escribir ahí) y se aplican en <html> como `data-modo` y `data-movimiento`. Antes del primer pintado los pone `public/arranque.js` (una copia mínima de esta lógica,
// comparada en `tests/arranque-inicial.test.ts`); `main.ts` los vuelve a aplicar con este código antes de montar, y con ellos las etiquetas `theme-color`, que el script no toca. Sin el script
// habría un primer cuadro con el tema
// equivocado. «Automático» es la ausencia de `data-modo`. El tema también actualiza las etiquetas `theme-color`.
// Si el almacenamiento no está disponible (bloqueado, lleno, modo privado) los controles funcionan igual y la preferencia dura lo que dura la sesión; no se muestra ningún error.

export type Tema = "claro" | "oscuro" | "automatico";

export interface Preferencias {
  tema: Tema;
  sinAnimaciones: boolean;
}

export const PREFERENCIAS_INICIALES: Readonly<Preferencias> = { tema: "automatico", sinAnimaciones: false };

/** Dónde se guardan (nombres propios de la demo, para no pisar nada del sitio que la aloja). */
export const CLAVES_DE_PREFERENCIAS = { tema: "flota:tema", sinAnimaciones: "flota:sin-animaciones" } as const;

/** `theme-color` de día y de noche (15.13). */
export const COLOR_DE_LA_BARRA = { claro: "#F1ECE1", oscuro: "#0A2550" } as const;

/** Lo mínimo de `Storage` que se usa: así las pruebas pasan un almacén en memoria. */
export interface Almacen {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

/** Lo mínimo del documento que se toca: los atributos de <html> y las etiquetas `theme-color`. */
export interface DocumentoDeLaPiel {
  documentElement: { setAttribute(nombre: string, valor: string): void; removeAttribute(nombre: string): void };
  querySelectorAll(selector: string): Iterable<{ getAttribute(nombre: string): string | null; setAttribute(nombre: string, valor: string): void }>;
}

export function sanearTema(valor: unknown): Tema {
  return valor === "claro" || valor === "oscuro" ? valor : "automatico";
}

export function sanearSinAnimaciones(valor: unknown): boolean {
  return valor === "1";
}

function leer(almacen: Almacen | null, clave: string): string | null {
  try {
    return almacen?.getItem(clave) ?? null;
  } catch {
    return null;
  }
}

function escribir(almacen: Almacen | null, clave: string, valor: string): void {
  try {
    almacen?.setItem(clave, valor);
  } catch {
    // Sin almacenamiento la preferencia vale solo por esta sesión: no es un error para quien usa la demo.
  }
}

/** Lo guardado, ya saneado. Con `null` o con el almacenamiento bloqueado, los valores iniciales. */
export function leerPreferencias(almacen: Almacen | null): Preferencias {
  return {
    tema: sanearTema(leer(almacen, CLAVES_DE_PREFERENCIAS.tema)),
    sinAnimaciones: sanearSinAnimaciones(leer(almacen, CLAVES_DE_PREFERENCIAS.sinAnimaciones)),
  };
}

/** Los atributos de <html> que le tocan a estas preferencias; `null` es «sin el atributo». */
export function atributosDeLaPiel(p: Preferencias): { modo: "claro" | "oscuro" | null; movimiento: "quieto" | null } {
  return { modo: p.tema === "automatico" ? null : p.tema, movimiento: p.sinAnimaciones ? "quieto" : null };
}

/**
 * El color de una etiqueta `theme-color` según el tema. Un tema elegido manda; en automático cada etiqueta vuelve al suyo (el navegador elige la que vale según su `media`),
 * y una sin `media` sigue al dispositivo.
 */
export function colorDeLaBarra(tema: Tema, media: string | null, dispositivoOscuro: boolean): string {
  if (tema !== "automatico") return COLOR_DE_LA_BARRA[tema];
  if (media !== null && media.includes("dark")) return COLOR_DE_LA_BARRA.oscuro;
  if (media !== null && media.includes("light")) return COLOR_DE_LA_BARRA.claro;
  return dispositivoOscuro ? COLOR_DE_LA_BARRA.oscuro : COLOR_DE_LA_BARRA.claro;
}

/** Pone o saca `data-modo` y `data-movimiento` en <html> y actualiza las etiquetas `theme-color`. */
export function aplicarPreferencias(p: Preferencias, documento: DocumentoDeLaPiel, dispositivoOscuro: boolean): void {
  const { modo, movimiento } = atributosDeLaPiel(p);
  const raiz = documento.documentElement;
  if (modo === null) raiz.removeAttribute("data-modo");
  else raiz.setAttribute("data-modo", modo);
  if (movimiento === null) raiz.removeAttribute("data-movimiento");
  else raiz.setAttribute("data-movimiento", movimiento);
  for (const etiqueta of documento.querySelectorAll('meta[name="theme-color"]')) {
    etiqueta.setAttribute("content", colorDeLaBarra(p.tema, etiqueta.getAttribute("media"), dispositivoOscuro));
  }
}

export interface ControlDePreferencias {
  /** Una copia de las preferencias de ahora. */
  leer(): Preferencias;
  /** Vuelve a poner los atributos de <html> (lo que hace `main.ts` antes de montar). */
  aplicar(): void;
  cambiarTema(tema: Tema): void;
  cambiarSinAnimaciones(valor: boolean): void;
  /** Avisa de cada cambio (dos controles de «Apariencia» a la vez, el del lateral y el de «Más», se mantienen iguales). Devuelve cómo dejar de escuchar. */
  alCambiar(oyente: (p: Preferencias) => void): () => void;
}

export function crearPreferencias(almacen: Almacen | null, documento: DocumentoDeLaPiel, dispositivoOscuro: () => boolean): ControlDePreferencias {
  let actual = leerPreferencias(almacen);
  const oyentes = new Set<(p: Preferencias) => void>();
  const aplicar = (): void => aplicarPreferencias(actual, documento, dispositivoOscuro());
  const cambio = (): void => {
    aplicar();
    for (const oyente of [...oyentes]) oyente({ ...actual });
  };
  return {
    leer: () => ({ ...actual }),
    aplicar,
    cambiarTema(tema) {
      actual = { ...actual, tema: sanearTema(tema) };
      escribir(almacen, CLAVES_DE_PREFERENCIAS.tema, actual.tema);
      cambio();
    },
    cambiarSinAnimaciones(valor) {
      actual = { ...actual, sinAnimaciones: valor === true };
      escribir(almacen, CLAVES_DE_PREFERENCIAS.sinAnimaciones, actual.sinAnimaciones ? "1" : "0");
      cambio();
    },
    alCambiar(oyente) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
  };
}

function almacenDelNavegador(): Almacen | null {
  try {
    return window.localStorage;
  } catch {
    return null; // acceder a `localStorage` ya puede tirar con el almacenamiento bloqueado
  }
}

let delNavegador: ControlDePreferencias | null = null;

/** Las preferencias de la página: una sola, con el `localStorage` y el documento reales. `main.ts` la aplica antes de montar; «Apariencia» la usa para cambiarlas. */
export function preferenciasDelNavegador(): ControlDePreferencias {
  delNavegador ??= crearPreferencias(almacenDelNavegador(), document, () => window.matchMedia("(prefers-color-scheme: dark)").matches);
  return delNavegador;
}
