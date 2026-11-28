// Control del peso del JS (`scripts/peso-js.mjs`): la lógica pura, separada de la lectura de `dist/`.
import { describe, expect, it } from "vitest";
import {
  AVISO_CSS_INICIAL,
  AVISO_CSS_TOTAL,
  AVISO_TROZO,
  TOPE_CSS_INICIAL,
  TOPE_FUENTES,
  TOPE_INICIAL,
  TOPE_PRIMERA_VISITA,
  TOPE_TOTAL_AVISO,
  cssDeLaCargaInicial,
  esUnaFuente,
  evaluarPeso,
  gzipBytes,
  jsDeLaCargaInicial,
  jsDeLaPrimeraVisita,
  lineaDeAviso,
  resumenEnMarkdown,
  resumirEstilos,
  resumirPeso,
} from "../scripts/peso-js.mjs";

const HTML = `<!doctype html><html><head>
<script type="module" crossorigin src="/assets/index-AAA.js"></script>
<link rel="modulepreload" crossorigin href="/assets/comun-BBB.js">
<link rel="stylesheet" crossorigin href="/assets/index-CCC.css">
<link rel="icon" href="/favicon.svg">
<link rel="modulepreload" href="https://otro.example/externo.js">
</head><body></body></html>`;

describe("jsDeLaCargaInicial", () => {
  it("toma el script de entrada y los modulepreload locales, sin repetir ni traer CSS ni íconos ni externos", () => {
    expect(jsDeLaCargaInicial(HTML)).toEqual(["assets/index-AAA.js", "assets/comun-BBB.js"]);
  });
  it("no repite un archivo nombrado dos veces", () => {
    const dos = HTML + '<link rel="modulepreload" href="/assets/comun-BBB.js">';
    expect(jsDeLaCargaInicial(dos)).toEqual(["assets/index-AAA.js", "assets/comun-BBB.js"]);
  });
  it("sin scripts devuelve lista vacía", () => {
    expect(jsDeLaCargaInicial("<html></html>")).toEqual([]);
  });
});

describe("gzipBytes", () => {
  it("es determinista y comprime texto repetido", () => {
    const texto = new TextEncoder().encode("abc".repeat(1000));
    expect(gzipBytes(texto)).toBe(gzipBytes(texto));
    expect(gzipBytes(texto)).toBeLessThan(100);
  });
});

describe("resumirPeso", () => {
  const archivos = [
    { ruta: "assets/index-AAA.js", gzip: 100 },
    { ruta: "assets/comun-BBB.js", gzip: 20 },
    { ruta: "assets/ficha-DDD.js", gzip: 7 },
  ];
  it("suma la inicial con los archivos del HTML y el total con todos, y deja aparte los trozos que se bajan después", () => {
    expect(resumirPeso(archivos, ["assets/index-AAA.js", "assets/comun-BBB.js"])).toEqual({ inicial: 120, primeraVisita: 120, total: 127, trozos: [{ ruta: "assets/ficha-DDD.js", gzip: 7 }] });
  });
  it("falla si la carga inicial nombra un archivo que no existe", () => {
    expect(() => resumirPeso(archivos, ["assets/falta.js"])).toThrow(/falta\.js/);
  });
  it("falla si no hay carga inicial (build roto)", () => {
    expect(() => resumirPeso(archivos, [])).toThrow(/carga inicial/);
  });
});

describe("evaluarPeso", () => {
  it("con la inicial en el tope pasa, sin aviso", () => {
    expect(evaluarPeso({ inicial: TOPE_INICIAL, total: TOPE_TOTAL_AVISO })).toEqual({ ok: true, avisos: [] });
  });
  it("con la inicial un byte arriba del tope falla", () => {
    const r = evaluarPeso({ inicial: TOPE_INICIAL + 1, total: 0 });
    expect(r.ok).toBe(false);
    expect(r.avisos).toEqual([]);
  });
  it("con el total arriba del tope de aviso pasa pero avisa", () => {
    const r = evaluarPeso({ inicial: 1, total: TOPE_TOTAL_AVISO + 1 });
    expect(r.ok).toBe(true);
    expect(r.avisos).toHaveLength(1);
  });
  it("un trozo de módulo en el aviso no avisa; un byte arriba avisa y nombra el trozo, sin hacer fallar", () => {
    const igual = evaluarPeso({ inicial: 1, total: 1, trozos: [{ ruta: "assets/PantallaFicha-AAA.js", gzip: AVISO_TROZO }] });
    expect(igual).toEqual({ ok: true, avisos: [] });
    const arriba = evaluarPeso({ inicial: 1, total: 1, trozos: [{ ruta: "assets/PantallaFicha-AAA.js", gzip: AVISO_TROZO + 1 }, { ruta: "assets/chico-BBB.js", gzip: 10 }] });
    expect(arriba.ok).toBe(true);
    expect(arriba.avisos).toHaveLength(1);
    expect(arriba.avisos[0]).toContain("PantallaFicha-AAA.js");
  });
  it("los topes son los de la etapa 2 del rediseño (subidos el 28/11/2026 por la regla de salida de la T9, decisión de Matías; la etapa 1 los había fijado en 95.000 y 100.000 B): 97.000 B iniciales, 102.000 B en la primera visita, aviso de 30.000 B por trozo y de 180.000 B en el total", () => {
    expect(TOPE_INICIAL).toBe(97_000);
    expect(TOPE_PRIMERA_VISITA).toBe(102_000);
    expect(AVISO_TROZO).toBe(30_000);
    expect(TOPE_TOTAL_AVISO).toBe(180_000);
  });
  it("el aviso del total está cerca de lo que mide hoy (175.367 B): menos de 20 kB de margen, para que avise de verdad", () => {
    expect(TOPE_TOTAL_AVISO - 175_367).toBeGreaterThan(0);
    expect(TOPE_TOTAL_AVISO - 175_367).toBeLessThan(20_000);
  });
});

describe("lineaDeAviso", () => {
  it("en local es texto plano con «AVISO:»", () => {
    expect(lineaDeAviso("el total crece", false)).toBe("AVISO: el total crece");
  });
  it("en GitHub Actions es una anotación de una sola línea, con los saltos y el % escapados", () => {
    expect(lineaDeAviso("sube 5 %\nrevisar", true)).toBe("::warning title=Peso del JS::sube 5 %25%0Arevisar");
  });
});

describe("resumenEnMarkdown", () => {
  it("arma una tabla con las tres medidas y sus topes, y lista los avisos", () => {
    const md = resumenEnMarkdown({ inicial: 93_886, primeraVisita: 99_276, total: 175_367 }, ["un aviso"]);
    expect(md).toContain("| Carga inicial |");
    expect(md).toContain("| Primera visita |");
    expect(md).toContain("| Total |");
    expect(md).toContain("- AVISO: un aviso");
  });
});

describe("la primera visita (la carga inicial más el generador de datos)", () => {
  const contenidos = [
    { ruta: "assets/index-AAA.js", texto: 'import{a}from"./comun-BBB.js";' },
    { ruta: "assets/comun-BBB.js", texto: "export{x as a}" },
    { ruta: "assets/generador-GGG.js", texto: 'import{a as b}from"./comun-BBB.js";import{t as c}from"./datos-HHH.js";const d=()=>import("./PantallaFicha-FFF.js");' },
    { ruta: "assets/datos-HHH.js", texto: 'import"./mas-III.js";export{y as t}' },
    { ruta: "assets/mas-III.js", texto: "console.log(1)" },
    { ruta: "assets/PantallaFicha-FFF.js", texto: 'import{a}from"./comun-BBB.js";' },
  ];
  const iniciales = ["assets/index-AAA.js", "assets/comun-BBB.js"];

  it("suma el generador y lo que importa de forma estática, sin lo que ya está en la carga inicial ni lo que pide con import()", () => {
    expect(jsDeLaPrimeraVisita(contenidos, iniciales)).toEqual(["assets/datos-HHH.js", "assets/generador-GGG.js", "assets/mas-III.js"]);
  });

  it("sin generador no pide nada de más", () => {
    expect(jsDeLaPrimeraVisita(contenidos.filter((c) => !c.ruta.includes("generador")), iniciales)).toEqual([]);
  });

  it("un import estático circular no cuelga la medición", () => {
    const circular = [
      { ruta: "assets/generador-GGG.js", texto: 'import{a}from"./otro-OOO.js";' },
      { ruta: "assets/otro-OOO.js", texto: 'import{b}from"./generador-GGG.js";' },
    ];
    expect(jsDeLaPrimeraVisita(circular, [])).toEqual(["assets/generador-GGG.js", "assets/otro-OOO.js"]);
  });

  const archivos = [
    { ruta: "assets/index-AAA.js", gzip: 100 },
    { ruta: "assets/generador-GGG.js", gzip: 30 },
  ];

  it("resumirPeso la mide: inicial más los trozos de la primera visita; sin ellos es igual a la inicial", () => {
    expect(resumirPeso(archivos, ["assets/index-AAA.js"], ["assets/generador-GGG.js"]).primeraVisita).toBe(130);
    expect(resumirPeso(archivos, ["assets/index-AAA.js"]).primeraVisita).toBe(100);
  });

  it("resumirPeso falla si la primera visita nombra un archivo que no existe", () => {
    expect(() => resumirPeso(archivos, ["assets/index-AAA.js"], ["assets/falta.js"])).toThrow(/falta\.js/);
  });

  it("con la primera visita en el tope pasa; un byte arriba falla aunque la inicial esté bien", () => {
    expect(evaluarPeso({ inicial: 90_000, primeraVisita: TOPE_PRIMERA_VISITA, total: 1 }).ok).toBe(true);
    expect(evaluarPeso({ inicial: 90_000, primeraVisita: TOPE_PRIMERA_VISITA + 1, total: 1 }).ok).toBe(false);
  });

  it("la carga inicial tiene su tope de 97.000 B (subido el 28/11/2026 por la regla de salida de la T9)", () => {
    expect(evaluarPeso({ inicial: TOPE_INICIAL + 1, primeraVisita: TOPE_INICIAL + 1, total: 1 }).ok).toBe(false);
  });
});

// Etapa 2 del rediseño: el CSS y las fuentes también se miden. El CSS inicial bloquea el primer pintado (tope que falla); las fuentes protegen la decisión de no sumar tipografías.
describe("el CSS y las fuentes", () => {
  const HTML_CON_HOJAS = `<!doctype html><html><head>
<script type="module" crossorigin src="/assets/index-AAA.js"></script>
<link rel="modulepreload" crossorigin href="/assets/comun-BBB.js">
<link rel="stylesheet" crossorigin href="/assets/index-CCC.css">
<link crossorigin href="/assets/Boton-DDD.css" rel="stylesheet">
<link rel="stylesheet" href="/assets/index-CCC.css">
<link rel="stylesheet" href="https://otro.example/externo.css">
<link rel="stylesheet" href="//otro.example/sin-protocolo.css">
<link rel="icon" href="/favicon.svg">
<link rel="preload" as="style" href="/assets/precarga-EEE.css">
</head><body></body></html>`;

  describe("cssDeLaCargaInicial", () => {
    it("toma las hojas de estilo locales del HTML, sin repetir y sin traer JS, íconos, precargas ni externas", () => {
      expect(cssDeLaCargaInicial(HTML_CON_HOJAS)).toEqual(["assets/index-CCC.css", "assets/Boton-DDD.css"]);
    });
    it("sin hojas devuelve lista vacía", () => {
      expect(cssDeLaCargaInicial("<html></html>")).toEqual([]);
      expect(cssDeLaCargaInicial(HTML)).toEqual(["assets/index-CCC.css"]);
    });
  });

  describe("resumirEstilos", () => {
    const hojas = [
      { ruta: "assets/index-CCC.css", gzip: 1000 },
      { ruta: "assets/Boton-DDD.css", gzip: 200 },
      { ruta: "assets/PantallaFicha-FFF.css", gzip: 30 },
    ];
    it("suma el CSS inicial con las hojas del HTML y el total con todas", () => {
      expect(resumirEstilos(hojas, ["assets/index-CCC.css", "assets/Boton-DDD.css"])).toEqual({ cssInicial: 1200, cssTotal: 1230 });
    });
    it("sin hojas en el HTML el inicial es 0 (no falla: una página sin CSS no pesa)", () => {
      expect(resumirEstilos(hojas, [])).toEqual({ cssInicial: 0, cssTotal: 1230 });
      expect(resumirEstilos([], [])).toEqual({ cssInicial: 0, cssTotal: 0 });
    });
    it("falla si el HTML nombra una hoja que no está en dist/", () => {
      expect(() => resumirEstilos(hojas, ["assets/falta.css"])).toThrow(/falta\.css/);
    });
  });

  describe("esUnaFuente", () => {
    it("reconoce los archivos de tipografía por su extensión, en cualquier carpeta y sin mirar mayúsculas", () => {
      for (const ruta of ["assets/bricolage-AAA.woff2", "assets/vieja.woff", "fuentes/otra.TTF", "x.otf"]) expect(esUnaFuente(ruta), ruta).toBe(true);
      for (const ruta of ["assets/index-AAA.js", "assets/index-CCC.css", "og-inicio.png", "assets/woff2-notas.txt"]) expect(esUnaFuente(ruta), ruta).toBe(false);
    });
  });

  describe("evaluarPeso con CSS y fuentes", () => {
    const bien = { inicial: 1, total: 1 };
    it("los topes son los de la etapa 2 del rediseño: CSS inicial 26.000 B (aviso desde 23.000 B), aviso del CSS total a 48.000 B y fuentes 205.000 B", () => {
      expect(TOPE_CSS_INICIAL).toBe(26_000);
      expect(AVISO_CSS_INICIAL).toBe(23_000);
      expect(AVISO_CSS_TOTAL).toBe(48_000);
      expect(TOPE_FUENTES).toBe(205_000);
    });
    it("sin esas medidas se evalúa como antes", () => {
      expect(evaluarPeso(bien)).toEqual({ ok: true, avisos: [] });
    });
    it("el CSS inicial en su aviso no avisa; un byte arriba avisa y no falla", () => {
      expect(evaluarPeso({ ...bien, cssInicial: AVISO_CSS_INICIAL })).toEqual({ ok: true, avisos: [] });
      const r = evaluarPeso({ ...bien, cssInicial: AVISO_CSS_INICIAL + 1 });
      expect(r.ok).toBe(true);
      expect(r.avisos).toHaveLength(1);
      expect(r.avisos[0]).toContain("CSS inicial");
    });
    it("el CSS inicial en su tope pasa (con aviso); un byte arriba falla", () => {
      expect(evaluarPeso({ ...bien, cssInicial: TOPE_CSS_INICIAL }).ok).toBe(true);
      expect(evaluarPeso({ ...bien, cssInicial: TOPE_CSS_INICIAL + 1 }).ok).toBe(false);
    });
    it("el CSS total arriba de su aviso avisa y nunca falla", () => {
      expect(evaluarPeso({ ...bien, cssTotal: AVISO_CSS_TOTAL })).toEqual({ ok: true, avisos: [] });
      const r = evaluarPeso({ ...bien, cssTotal: AVISO_CSS_TOTAL * 3 });
      expect(r.ok).toBe(true);
      expect(r.avisos).toHaveLength(1);
      expect(r.avisos[0]).toContain("CSS total");
    });
    it("las fuentes en su tope pasan; un byte arriba fallan, sin aviso previo", () => {
      expect(evaluarPeso({ ...bien, fuentes: TOPE_FUENTES })).toEqual({ ok: true, avisos: [] });
      expect(evaluarPeso({ ...bien, fuentes: TOPE_FUENTES + 1 }).ok).toBe(false);
    });
    it("lo medido el 27/11/2026 (15.101 B iniciales, 31.712 B en total y 200.712 B de fuentes) pasa sin avisos", () => {
      expect(evaluarPeso({ ...bien, cssInicial: 15_101, cssTotal: 31_712, fuentes: 200_712 })).toEqual({ ok: true, avisos: [] });
    });
    it("un tope de JS pasado sigue fallando aunque el CSS y las fuentes estén bien", () => {
      expect(evaluarPeso({ inicial: TOPE_INICIAL + 1, total: 1, cssInicial: 1, cssTotal: 1, fuentes: 1 }).ok).toBe(false);
    });
  });

  describe("resumenEnMarkdown con CSS y fuentes", () => {
    it("agrega una tabla con el CSS inicial, el CSS total y las fuentes; sin esas medidas no la agrega", () => {
      const sin = resumenEnMarkdown({ inicial: 1, primeraVisita: 1, total: 1 }, []);
      expect(sin).not.toContain("CSS inicial");
      const con = resumenEnMarkdown({ inicial: 1, primeraVisita: 1, total: 1, cssInicial: 15_101, cssTotal: 31_712, fuentes: 200_712 }, []);
      expect(con).toContain("| CSS inicial |");
      expect(con).toContain("| CSS total |");
      expect(con).toContain("| Fuentes |");
      expect(con).toContain("15.101 B");
      expect(con).toContain("Sin avisos.");
    });
  });
});
