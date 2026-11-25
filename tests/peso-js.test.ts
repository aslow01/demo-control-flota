// Control del peso del JS (`scripts/peso-js.mjs`): la lógica pura, separada de la lectura de `dist/`.
import { describe, expect, it } from "vitest";
import { TOPE_INICIAL, TOPE_TOTAL_AVISO, evaluarPeso, gzipBytes, jsDeLaCargaInicial, resumirPeso } from "../scripts/peso-js.mjs";

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
  it("suma la inicial con los archivos del HTML y el total con todos", () => {
    expect(resumirPeso(archivos, ["assets/index-AAA.js", "assets/comun-BBB.js"])).toEqual({ inicial: 120, total: 127 });
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
  it("los topes son los acordados: 120.000 B iniciales y 136.000 B totales (aviso)", () => {
    expect(TOPE_INICIAL).toBe(120_000);
    expect(TOPE_TOTAL_AVISO).toBe(136_000);
  });
});
