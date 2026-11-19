// Búsqueda de términos prohibidos por huellas (`scripts/prohibidos.mjs`). Los términos de estos tests son inventados:
// el repositorio público no puede traer los reales ni siquiera en las pruebas.
import { describe, expect, it } from "vitest";
import {
  correosNoPermitidos,
  crearHuella,
  contieneProhibido,
  huellasDeLiterales,
  normalizar,
  tokenizar,
} from "../scripts/prohibidos.mjs";
import { HUELLAS } from "../scripts/huellas-prohibidas.mjs";

const huellas = [crearHuella("Zorbalux"), crearHuella("Quéntaro Brisa Norte")];

describe("normalizar", () => {
  it("pasa a minúsculas y quita acentos y diéresis", () => {
    expect(normalizar("ZORBALUX")).toBe("zorbalux");
    expect(normalizar("Quéntaro Pingüino")).toBe("quentaro pinguino");
  });
  it("trata la eñe como la ene (las dos formas dan lo mismo)", () => {
    expect(normalizar("Ñandú")).toBe(normalizar("Nandu"));
  });
  it("es idempotente y entiende texto ya descompuesto (NFD)", () => {
    expect(normalizar("é")).toBe("e");
    expect(normalizar(normalizar("É"))).toBe("e");
  });
});

describe("tokenizar", () => {
  it("parte por todo lo que no es letra ni número y normaliza", () => {
    expect(tokenizar("Quéntaro-Brisa_Norte, 2026!")).toEqual(["quentaro", "brisa", "norte", "2026"]);
  });
  it("no devuelve vacíos", () => {
    expect(tokenizar("  ...  ")).toEqual([]);
    expect(tokenizar("")).toEqual([]);
  });
});

describe("crearHuella", () => {
  it("es SHA-256 en hexadecimal del término normalizado, con su longitud", () => {
    const h = crearHuella("Zorbalux");
    expect(h.huella).toMatch(/^[0-9a-f]{64}$/);
    expect(h.longitud).toBe(8);
  });
  it("da lo mismo con otra mayúscula, otro acento o otros separadores", () => {
    expect(crearHuella("QUÉNTARO  brisa-norte")).toEqual(crearHuella("quentaro brisa norte"));
  });
  it("rechaza un término vacío", () => {
    expect(() => crearHuella("  --  ")).toThrow();
  });
  it("rechaza una frase de más de tres palabras (la búsqueda mira n-gramas de uno a tres)", () => {
    expect(() => crearHuella("uno dos tres cuatro")).toThrow();
  });
});

describe("contieneProhibido", () => {
  it("detecta un término en otra mayúscula", () => {
    expect(contieneProhibido("Usé ZORBALUX ayer", huellas)).toBe(true);
    expect(contieneProhibido("usé zorbalux ayer", huellas)).toBe(true);
  });
  it("detecta un término con acento o diéresis agregados", () => {
    expect(contieneProhibido("Zórbalux", huellas)).toBe(true);
  });
  it("detecta el término pegado a otras palabras o en un identificador", () => {
    expect(contieneProhibido("class ZorbaluxCentral {}", huellas)).toBe(true);
    expect(contieneProhibido("const zorbalux_id = 1", huellas)).toBe(true);
    expect(contieneProhibido("https://zorbalux.example.com/x", huellas)).toBe(true);
  });
  it("detecta una frase partida en un n-grama, con otros separadores y en otra mayúscula", () => {
    expect(contieneProhibido("empresa Quentaro Brisa Norte S.A.", huellas)).toBe(true);
    expect(contieneProhibido("QUÉNTARO-BRISA_NORTE", huellas)).toBe(true);
    expect(contieneProhibido("quentaro   brisa\tnorte", huellas)).toBe(true);
  });
  it("una frase incompleta o desordenada no cuenta", () => {
    expect(contieneProhibido("Quéntaro Brisa", huellas)).toBe(false);
    expect(contieneProhibido("Norte Brisa Quéntaro", huellas)).toBe(false);
  });
  it("una frase con otra palabra en el medio no cuenta", () => {
    expect(contieneProhibido("Quéntaro del Brisa Norte", huellas)).toBe(false);
  });
  it("no da falsos positivos con texto común del proyecto", () => {
    const texto = [
      "export function clasificar(documento: Documento): Clasificacion {",
      "Control de flota: documentos con vencimiento, parte diario y centro de alertas.",
      "Zona horaria de Argentina, Brisa de ejemplo, Norte y Sur.",
      "zorba lux, zorb alux, zorbalu",
    ].join("\n");
    expect(contieneProhibido(texto, huellas)).toBe(false);
  });
  it("sin huellas no encuentra nada", () => {
    expect(contieneProhibido("Zorbalux", [])).toBe(false);
  });
  it("texto vacío no encuentra nada", () => {
    expect(contieneProhibido("", huellas)).toBe(false);
  });
  it("detecta una frase de dos palabras aunque haya huellas de otras longitudes", () => {
    const dos = [crearHuella("Ab"), crearHuella("Mar Plata")];
    expect(contieneProhibido("viaje a mar-plata", dos)).toBe(true);
    expect(contieneProhibido("viaje a mar del plata", dos)).toBe(false);
  });
});

describe("huellasDeLiterales (archivo local)", () => {
  it("ignora líneas en blanco y comentarios, y crea una huella por término", () => {
    const hs = huellasDeLiterales("# términos extra\n\nZorbalux\n  Quéntaro Brisa Norte  \n#otro\n");
    expect(hs).toEqual(huellas);
  });
  it("acepta saltos de línea de Windows", () => {
    expect(huellasDeLiterales("Zorbalux\r\nQuéntaro Brisa Norte\r\n")).toEqual(huellas);
  });
  it("una línea que no tiene letras ni números se ignora en lugar de romper", () => {
    expect(huellasDeLiterales("---\nZorbalux\n")).toEqual([crearHuella("Zorbalux")]);
  });
  it("sin contenido da una lista vacía", () => {
    expect(huellasDeLiterales("")).toEqual([]);
  });
});

// La arroba va aparte para que estos ejemplos no sean, ellos mismos, correos que `npm run buscar` rechace.
const A = "@";

describe("correosNoPermitidos", () => {
  it("marca un correo de un proveedor cualquiera", () => {
    expect(correosNoPermitidos(`escribir a persona.inventada${A}proveedor-ficticio.com`)).toEqual([`persona.inventada${A}proveedor-ficticio.com`]);
  });
  it("marca el correo aunque esté en otra mayúscula y rodeado de signos", () => {
    expect(correosNoPermitidos(`<Alguien${A}Proveedor-Ficticio.COM>,`)).toHaveLength(1);
  });
  it("permite los dominios de ejemplo reservados y sus subdominios", () => {
    expect(correosNoPermitidos("a@example.com b@example.org c@example.net d@mail.example.com e@algo.test f@x.invalid")).toEqual([]);
  });
  it("permite las direcciones noreply", () => {
    expect(correosNoPermitidos("noreply@proveedor-ficticio.com no-reply@otro-ficticio.org 12345+nombre@users.noreply.github.com")).toEqual([]);
  });
  it("no confunde con correos las versiones, los paquetes con alcance ni las rutas", () => {
    const texto = ['"vite@8.3.5"', "svelte@5.57.3", "npm i pkg@latest", "node_modules/@sveltejs/vite-plugin-svelte", "@media (min-width: 30rem)"].join("\n");
    expect(correosNoPermitidos(texto)).toEqual([]);
  });
  it("devuelve todos los correos de una línea", () => {
    expect(correosNoPermitidos(`a${A}uno-ficticio.com y b${A}dos-ficticio.com`)).toHaveLength(2);
  });
});

describe("HUELLAS del repositorio", () => {
  it("tiene entradas bien formadas", () => {
    expect(HUELLAS.length).toBeGreaterThan(0);
    for (const h of HUELLAS) {
      expect(h.huella).toMatch(/^[0-9a-f]{64}$/);
      expect(Number.isInteger(h.longitud) && h.longitud > 0).toBe(true);
    }
  });
  it("no repite huellas", () => {
    expect(new Set(HUELLAS.map((h) => h.huella)).size).toBe(HUELLAS.length);
  });
});
