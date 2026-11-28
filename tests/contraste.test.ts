import { describe, expect, it } from "vitest";
import { PARES, PARES_NUEVOS, PARES_VIGENTES, aHex, colorDeToken, leerTokens, luminancia, medirPar, medirTodo, razonDeContraste, resolverToken } from "../scripts/contraste.mjs";
import type { Par } from "../scripts/contraste.mjs";

// Trozos de ejemplo: no se lee el tokens.css real, así este control no depende de la hoja.
const conLightDark = `
:root {
  color-scheme: light dark;
  --c-papel: light-dark(#ffffff, #000000);
  --c-tinta: light-dark(#000000, #ffffff);
  --c-texto: var(--c-tinta);
  --c-gris: light-dark(#777777, #888888); /* comentario } con llave */
  --c-mezcla: light-dark(color-mix(in srgb, #ffffff 50%, #000000), #123456);
}
.objeto { --c-papel: #ff0000; }
`;
const dosBloques = `
:root {
  --c-papel: #ffffff;
  --c-tinta: #000000;
  --c-texto: var(--c-tinta);
  --c-gris: #777777;
  --c-mezcla: color-mix(in srgb, #ffffff 50%, #000000);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-modo="claro"]) {
    --c-papel: #000000;
    --c-tinta: #ffffff;
    --c-gris: #888888;
    --c-mezcla: #123456;
  }
}
:root[data-modo="oscuro"] {
  --c-papel: #000000;
  --c-tinta: #ffffff;
  --c-gris: #888888;
  --c-mezcla: #123456;
}
`;

describe("color y razón de contraste (fórmula WCAG 2.x)", () => {
  it("negro sobre blanco da 21 y blanco sobre blanco da 1", () => {
    expect(razonDeContraste([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(razonDeContraste([255, 255, 255], [255, 255, 255])).toBeCloseTo(1, 5);
  });
  it("no depende del orden y coincide con valores conocidos (#777 sobre blanco: 4,48)", () => {
    const gris = colorDeToken({ g: "#777777" }, "g");
    expect(razonDeContraste(gris, [255, 255, 255])).toBeCloseTo(4.478, 2);
    expect(razonDeContraste([255, 255, 255], gris)).toBeCloseTo(4.478, 2);
  });
  it("luminancia del rojo puro y hex de vuelta", () => {
    expect(luminancia([255, 0, 0])).toBeCloseTo(0.2126, 4);
    expect(aHex([18, 52, 86])).toBe("#123456");
  });
  it("acepta #rgb y rechaza lo que no entiende con un mensaje claro", () => {
    expect(colorDeToken({ a: "#fff" }, "a")).toEqual([255, 255, 255]);
    expect(() => colorDeToken({ a: "rebeccapurple" }, "a")).toThrow(/Color no soportado: rebeccapurple/);
  });
});

describe("leerTokens", () => {
  it("lee light-dark(a, b) y anida paréntesis (color-mix) sin partir mal la coma", () => {
    const t = leerTokens(conLightDark);
    expect(t.claro["c-papel"]).toBe("#ffffff");
    expect(t.oscuro["c-papel"]).toBe("#000000");
    expect(t.claro["c-mezcla"]).toBe("color-mix(in srgb, #ffffff 50%, #000000)");
    expect(t.oscuro["c-mezcla"]).toBe("#123456");
  });
  it("lee el formato de dos bloques (claro, y oscuro en la media query y en [data-modo=oscuro])", () => {
    const t = leerTokens(dosBloques);
    expect(t.claro["c-papel"]).toBe("#ffffff");
    expect(t.oscuro["c-papel"]).toBe("#000000");
    expect(t.oscuro["c-texto"]).toBe("var(--c-tinta)");
  });
  it("los dos formatos dan las mismas mediciones", () => {
    const pares: Par[] = [
      { grupo: "t", a: "c-texto", b: "c-papel", minimo: 4.5 },
      { grupo: "t", a: "c-gris", b: "c-papel", minimo: 3 },
      { grupo: "t", a: "c-mezcla", b: "c-papel", minimo: 3 },
    ];
    expect(medirTodo(dosBloques, pares).filas.map((f) => [f.claro?.razon, f.oscuro?.razon])).toEqual(
      medirTodo(conLightDark, pares).filas.map((f) => [f.claro?.razon, f.oscuro?.razon]),
    );
  });
  it("ignora los bloques que no son :root (por ejemplo .objeto) y los fines de línea CRLF", () => {
    const t = leerTokens(conLightDark.replaceAll("\n", "\r\n"));
    expect(t.claro["c-papel"]).toBe("#ffffff");
  });
  it("sin ningún bloque :root avisa con un mensaje claro", () => {
    expect(() => leerTokens(".a { color: red; }")).toThrow(/:root/);
  });
});

describe("resolverToken", () => {
  const t = { a: "var(--b)", b: "var(--c)", c: "#112233", x: "var(--y)", y: "var(--x)", mezcla: "color-mix(in srgb, var(--c) 92%, #000000)" };
  it("sigue los alias en cadena", () => expect(resolverToken(t, "a")).toBe("#112233"));
  it("token faltante: mensaje con el nombre", () => expect(() => resolverToken(t, "nada")).toThrow("Falta el token --nada"));
  it("alias hacia un token que no existe: nombra el que falta", () => expect(() => resolverToken({ a: "var(--z)" }, "a")).toThrow("Falta el token --z"));
  it("alias circular: lo dice", () => expect(() => resolverToken(t, "x")).toThrow(/circular/));
  it("color-mix en sRGB con alias adentro se calcula", () => {
    expect(colorDeToken(t, "mezcla").map(Math.round)).toEqual([16, 31, 47]);
  });
});

describe("medirPar", () => {
  const t = { f: "#ffffff", g: "#777777", n: "#000000", j: "#757575" };
  it("par que pasa con holgura", () => expect(medirPar(t, { grupo: "t", a: "n", b: "f", minimo: 4.5 }).estado).toBe("ok"));
  it("par que falla (#777 sobre blanco, mínimo 4,5)", () => {
    const m = medirPar(t, { grupo: "t", a: "g", b: "f", minimo: 4.5 });
    expect(m.estado).toBe("falla");
    expect(m.razon).toBeCloseTo(4.478, 2);
  });
  it("par justo: menos de 0,3 por encima del mínimo", () => {
    const m = medirPar(t, { grupo: "t", a: "j", b: "f", minimo: 4.5 });
    expect(m.razon).toBeGreaterThanOrEqual(4.5);
    expect(m.estado).toBe("justo");
  });
  it("token faltante: estado error con mensaje, sin cortar", () => {
    const m = medirPar(t, { grupo: "t", a: "nada", b: "f", minimo: 3 });
    expect(m).toMatchObject({ estado: "error", razon: null, error: "Falta el token --nada" });
  });
});

describe("medirTodo", () => {
  it("cuenta mediciones, fallos, justos y errores; `solo` deja el otro modo en null", () => {
    const r = medirTodo(conLightDark, [
      { grupo: "a", a: "c-tinta", b: "c-papel", minimo: 4.5 },
      { grupo: "a", a: "c-gris", b: "c-papel", minimo: 4.5 },
      { grupo: "b", a: "c-tinta", b: "c-papel", minimo: 3, solo: "oscuro" },
      { grupo: "c", a: "c-no-existe", b: "c-papel", minimo: 3 },
    ]);
    expect(r.filas[2]?.claro).toBeNull();
    expect(r.filas[2]?.oscuro?.estado).toBe("ok");
    expect(r.mediciones).toBe(2 + 2 + 1 + 2);
    expect(r.fallos).toBe(1); // #777 sobre blanco; #888 sobre negro da 5,3
    expect(r.errores).toBe(2);
  });
});

describe("tabla de pares", () => {
  it("los nuevos son los 124 de la sección 15.3.3 de docs/diseno-ui.md", () => expect(PARES_NUEVOS).toHaveLength(124));
  it("conserva los nombres viejos (--c-texto, --c-acento, …) y suma los nuevos", () => {
    const nombres = new Set(PARES.flatMap((p) => [p.a, p.b]));
    for (const n of ["c-texto", "c-superficie", "c-acento", "c-ok-t", "c-lat-tx"]) expect(nombres.has(n)).toBe(true);
    for (const n of ["c-tinta", "c-papel", "c-sobre-pleno", "c-pleno", "obj-hoja", "obj-contorno"]) expect(nombres.has(n)).toBe(true);
    expect(PARES).toEqual([...PARES_VIGENTES, ...PARES_NUEVOS]);
  });
  it("mínimos válidos (3 o 4,5), grupo no vacío y los vigentes sin repetirse ni repetir a los nuevos", () => {
    // Los nuevos copian la tabla de la doc, que repite a propósito `tinta-3 / papel-2` (texto y deshabilitado): ahí no se exige.
    const vistos = new Set<string>(PARES_NUEVOS.map((p) => `${p.a}|${p.b}|${p.minimo}|${p.solo ?? ""}`));
    for (const p of PARES) {
      expect([3, 4.5]).toContain(p.minimo);
      expect(p.grupo).not.toBe("");
      if (PARES_NUEVOS.includes(p)) continue;
      const clave = `${p.a}|${p.b}|${p.minimo}|${p.solo ?? ""}`;
      expect(vistos.has(clave), clave).toBe(false);
      vistos.add(clave);
    }
  });
  it("son 231 mediciones (los pares con `solo` miden un modo: 124 x 2 menos 17)", () => {
    expect(PARES_NUEVOS.reduce((suma, p) => suma + (p.solo === undefined ? 2 : 1), 0)).toBe(231);
  });
  it("incluye objetos de noche y texto sobre el pleno", () => {
    expect(PARES_NUEVOS.some((p) => /Objeto contra el plano/.test(p.grupo))).toBe(true);
    expect(PARES_NUEVOS.some((p) => p.a === "c-sobre-pleno" && p.b === "c-pleno")).toBe(true);
    expect(PARES_NUEVOS.some((p) => p.solo === "oscuro" && p.a === "obj-contorno")).toBe(true);
  });
});
