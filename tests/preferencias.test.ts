// Preferencias de apariencia (docs/diseno-ui.md, 15.4.5): tema claro / oscuro / automático y «Sin animaciones». Se guardan en `localStorage` (entrada hostil: cualquiera puede
// escribir ahí), se aplican como `data-modo` y `data-movimiento` en <html> antes de montar la aplicación, y el tema actualiza `theme-color`.
import { describe, expect, it, vi } from "vitest";
import {
  CLAVES_DE_PREFERENCIAS,
  COLOR_DE_LA_BARRA,
  PREFERENCIAS_INICIALES,
  aplicarPreferencias,
  atributosDeLaPiel,
  colorDeLaBarra,
  crearPreferencias,
  leerPreferencias,
  sanearSinAnimaciones,
  sanearTema,
  type Almacen,
  type DocumentoDeLaPiel,
} from "../src/lib/estado/preferencias.ts";

/** Un almacén en memoria (como `localStorage`), con la opción de que falle como en un navegador con el almacenamiento bloqueado. */
function almacen(inicial: Record<string, string> = {}, falla: "leer" | "escribir" | "ambos" | null = null) {
  const datos = new Map(Object.entries(inicial));
  const a: Almacen = {
    getItem(clave) {
      if (falla === "leer" || falla === "ambos") throw new DOMException("bloqueado", "SecurityError");
      return datos.get(clave) ?? null;
    },
    setItem(clave, valor) {
      if (falla === "escribir" || falla === "ambos") throw new DOMException("lleno", "QuotaExceededError");
      datos.set(clave, valor);
    },
  };
  return { a, datos };
}

/** Un documento mínimo: los atributos de <html> y los <meta name="theme-color"> que haya (cada uno con su `media`, o sin). */
function documentoDePrueba(metas: { media: string | null; content: string }[] = []): DocumentoDeLaPiel & { html: Map<string, string>; metas: { media: string | null; content: string }[] } {
  const html = new Map<string, string>();
  const nodos = metas.map((m) => ({
    getAttribute: (nombre: string) => (nombre === "media" ? m.media : nombre === "content" ? m.content : null),
    setAttribute: (nombre: string, valor: string) => {
      if (nombre === "content") m.content = valor;
    },
  }));
  return {
    html,
    metas,
    documentElement: {
      setAttribute: (nombre, valor) => void html.set(nombre, valor),
      removeAttribute: (nombre) => void html.delete(nombre),
    },
    querySelectorAll: (selector: string) => (selector === 'meta[name="theme-color"]' ? nodos : []),
  };
}

describe("sanearTema y sanearSinAnimaciones: lo guardado es una entrada hostil", () => {
  it("solo «claro», «oscuro» y «automatico» son temas; todo lo demás es automático", () => {
    expect(sanearTema("claro")).toBe("claro");
    expect(sanearTema("oscuro")).toBe("oscuro");
    expect(sanearTema("automatico")).toBe("automatico");
    for (const raro of [null, undefined, "", "Oscuro", "dark", "<script>", " claro", 1, true, {}, ["claro"], "automático"]) expect(sanearTema(raro), String(raro)).toBe("automatico");
  });

  it("«Sin animaciones» solo es verdadero con «1»", () => {
    expect(sanearSinAnimaciones("1")).toBe(true);
    for (const raro of [null, undefined, "", "0", "true", "si", 1, true, {}]) expect(sanearSinAnimaciones(raro), String(raro)).toBe(false);
  });
});

describe("leerPreferencias", () => {
  it("sin nada guardado: tema automático y animaciones permitidas", () => {
    expect(PREFERENCIAS_INICIALES).toEqual({ tema: "automatico", sinAnimaciones: false });
    expect(leerPreferencias(almacen().a)).toEqual(PREFERENCIAS_INICIALES);
  });

  it("lee lo guardado", () => {
    const { a } = almacen({ [CLAVES_DE_PREFERENCIAS.tema]: "oscuro", [CLAVES_DE_PREFERENCIAS.sinAnimaciones]: "1" });
    expect(leerPreferencias(a)).toEqual({ tema: "oscuro", sinAnimaciones: true });
  });

  it("sanea valores raros sin tirar nada", () => {
    const { a } = almacen({ [CLAVES_DE_PREFERENCIAS.tema]: "javascript:alert(1)", [CLAVES_DE_PREFERENCIAS.sinAnimaciones]: "quizás" });
    expect(leerPreferencias(a)).toEqual(PREFERENCIAS_INICIALES);
  });

  it("sin almacenamiento (null) o con el almacenamiento bloqueado, usa los valores iniciales y no tira", () => {
    expect(leerPreferencias(null)).toEqual(PREFERENCIAS_INICIALES);
    expect(leerPreferencias(almacen({}, "leer").a)).toEqual(PREFERENCIAS_INICIALES);
  });
});

describe("atributosDeLaPiel", () => {
  it("«Automático» es la ausencia de `data-modo`; claro y oscuro lo ponen", () => {
    expect(atributosDeLaPiel({ tema: "automatico", sinAnimaciones: false })).toEqual({ modo: null, movimiento: null });
    expect(atributosDeLaPiel({ tema: "claro", sinAnimaciones: false })).toEqual({ modo: "claro", movimiento: null });
    expect(atributosDeLaPiel({ tema: "oscuro", sinAnimaciones: false })).toEqual({ modo: "oscuro", movimiento: null });
  });

  it("«Sin animaciones» pone `data-movimiento=\"quieto\"`", () => {
    expect(atributosDeLaPiel({ tema: "automatico", sinAnimaciones: true })).toEqual({ modo: null, movimiento: "quieto" });
  });
});

describe("colorDeLaBarra (theme-color)", () => {
  it("los colores son los de la especificación: #F1ECE1 de día y #0A2550 de noche", () => {
    expect(COLOR_DE_LA_BARRA).toEqual({ claro: "#F1ECE1", oscuro: "#0A2550" });
  });

  it("un tema elegido manda sobre el dispositivo y sobre el `media` de la etiqueta", () => {
    expect(colorDeLaBarra("claro", "(prefers-color-scheme: dark)", true)).toBe("#F1ECE1");
    expect(colorDeLaBarra("oscuro", "(prefers-color-scheme: light)", false)).toBe("#0A2550");
    expect(colorDeLaBarra("oscuro", null, false)).toBe("#0A2550");
  });

  it("en automático, cada etiqueta con `media` vuelve a su color (el navegador elige cuál vale)", () => {
    expect(colorDeLaBarra("automatico", "(prefers-color-scheme: dark)", false)).toBe("#0A2550");
    expect(colorDeLaBarra("automatico", "(prefers-color-scheme: light)", true)).toBe("#F1ECE1");
  });

  it("en automático, una etiqueta sin `media` sigue al dispositivo", () => {
    expect(colorDeLaBarra("automatico", null, true)).toBe("#0A2550");
    expect(colorDeLaBarra("automatico", null, false)).toBe("#F1ECE1");
  });
});

describe("aplicarPreferencias", () => {
  const dosMetas = () => [
    { media: "(prefers-color-scheme: light)", content: "#F1ECE1" },
    { media: "(prefers-color-scheme: dark)", content: "#0A2550" },
  ];

  it("oscuro: `data-modo=\"oscuro\"` y las dos etiquetas theme-color en el color de noche", () => {
    const doc = documentoDePrueba(dosMetas());
    aplicarPreferencias({ tema: "oscuro", sinAnimaciones: false }, doc, false);
    expect(doc.html.get("data-modo")).toBe("oscuro");
    expect(doc.html.has("data-movimiento")).toBe(false);
    expect(doc.metas.map((m) => m.content)).toEqual(["#0A2550", "#0A2550"]);
  });

  it("volver a automático saca `data-modo` y devuelve cada etiqueta a su color", () => {
    const doc = documentoDePrueba(dosMetas());
    aplicarPreferencias({ tema: "oscuro", sinAnimaciones: false }, doc, false);
    aplicarPreferencias({ tema: "automatico", sinAnimaciones: false }, doc, false);
    expect(doc.html.has("data-modo")).toBe(false);
    expect(doc.metas.map((m) => m.content)).toEqual(["#F1ECE1", "#0A2550"]);
  });

  it("claro con el dispositivo en oscuro: `data-modo=\"claro\"` y las dos etiquetas de día", () => {
    const doc = documentoDePrueba(dosMetas());
    aplicarPreferencias({ tema: "claro", sinAnimaciones: false }, doc, true);
    expect(doc.html.get("data-modo")).toBe("claro");
    expect(doc.metas.map((m) => m.content)).toEqual(["#F1ECE1", "#F1ECE1"]);
  });

  it("«Sin animaciones» pone y saca `data-movimiento`", () => {
    const doc = documentoDePrueba();
    aplicarPreferencias({ tema: "automatico", sinAnimaciones: true }, doc, false);
    expect(doc.html.get("data-movimiento")).toBe("quieto");
    aplicarPreferencias({ tema: "automatico", sinAnimaciones: false }, doc, false);
    expect(doc.html.has("data-movimiento")).toBe(false);
  });

  it("sin etiquetas theme-color no tira", () => {
    const doc = documentoDePrueba([]);
    expect(() => aplicarPreferencias({ tema: "oscuro", sinAnimaciones: true }, doc, true)).not.toThrow();
  });
});

describe("crearPreferencias", () => {
  it("al aplicar usa lo guardado, sin escribir nada", () => {
    const { a, datos } = almacen({ [CLAVES_DE_PREFERENCIAS.tema]: "oscuro", [CLAVES_DE_PREFERENCIAS.sinAnimaciones]: "1" });
    const doc = documentoDePrueba();
    const p = crearPreferencias(a, doc, () => false);
    p.aplicar();
    expect(doc.html.get("data-modo")).toBe("oscuro");
    expect(doc.html.get("data-movimiento")).toBe("quieto");
    expect(p.leer()).toEqual({ tema: "oscuro", sinAnimaciones: true });
    expect(datos.size).toBe(2);
  });

  it("cambiar el tema lo guarda, lo aplica y avisa a quien escucha", () => {
    const { a, datos } = almacen();
    const doc = documentoDePrueba();
    const p = crearPreferencias(a, doc, () => false);
    const vistos: unknown[] = [];
    p.alCambiar((x) => vistos.push(x));
    p.cambiarTema("claro");
    expect(datos.get(CLAVES_DE_PREFERENCIAS.tema)).toBe("claro");
    expect(doc.html.get("data-modo")).toBe("claro");
    expect(vistos).toEqual([{ tema: "claro", sinAnimaciones: false }]);
  });

  it("cambiar «Sin animaciones» lo guarda como «1» o «0»", () => {
    const { a, datos } = almacen();
    const p = crearPreferencias(a, documentoDePrueba(), () => false);
    p.cambiarSinAnimaciones(true);
    expect(datos.get(CLAVES_DE_PREFERENCIAS.sinAnimaciones)).toBe("1");
    p.cambiarSinAnimaciones(false);
    expect(datos.get(CLAVES_DE_PREFERENCIAS.sinAnimaciones)).toBe("0");
  });

  it("un tema que no existe (lo que llegue de un control) se vuelve «automatico»", () => {
    const { a, datos } = almacen();
    const doc = documentoDePrueba();
    const p = crearPreferencias(a, doc, () => false);
    p.cambiarTema("oscuro");
    p.cambiarTema("rosa" as never);
    expect(p.leer().tema).toBe("automatico");
    expect(datos.get(CLAVES_DE_PREFERENCIAS.tema)).toBe("automatico");
    expect(doc.html.has("data-modo")).toBe(false);
  });

  it("se puede dejar de escuchar", () => {
    const p = crearPreferencias(almacen().a, documentoDePrueba(), () => false);
    const oyente = vi.fn();
    const dejar = p.alCambiar(oyente);
    dejar();
    p.cambiarTema("oscuro");
    expect(oyente).not.toHaveBeenCalled();
  });

  it("con el almacenamiento bloqueado al escribir, las preferencias duran la sesión y no se muestra ningún error", () => {
    const doc = documentoDePrueba();
    const p = crearPreferencias(almacen({}, "escribir").a, doc, () => false);
    expect(() => p.cambiarTema("oscuro")).not.toThrow();
    expect(() => p.cambiarSinAnimaciones(true)).not.toThrow();
    expect(p.leer()).toEqual({ tema: "oscuro", sinAnimaciones: true });
    expect(doc.html.get("data-modo")).toBe("oscuro");
    expect(doc.html.get("data-movimiento")).toBe("quieto");
  });

  it("sin almacenamiento (null) funciona igual en memoria", () => {
    const p = crearPreferencias(null, documentoDePrueba(), () => false);
    p.cambiarTema("claro");
    expect(p.leer().tema).toBe("claro");
  });

  it("`leer` devuelve una copia: modificarla no cambia las preferencias", () => {
    const p = crearPreferencias(almacen().a, documentoDePrueba(), () => false);
    const copia = p.leer();
    copia.tema = "oscuro";
    expect(p.leer().tema).toBe("automatico");
  });
});
