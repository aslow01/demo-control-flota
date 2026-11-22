// Mide los contrastes de la paleta (docs/diseno-ui.md 3.3) leyendo los valores reales de src/estilos/tokens.css,
// en claro y en oscuro. Fórmula de luminancia relativa de WCAG 2.x. Sale con código 1 si algún par no llega a su mínimo.
// Uso: npm run contraste   (con `-- --todo` muestra también los pares que pasan con holgura; por defecto lista todos igual).
// Un par "justo" (menos de 0,3 por encima del mínimo) se marca con "~" para mirarlo antes de tocar la paleta.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
// Con fin de línea CRLF (checkout de Windows) no se encontraban los cortes de bloque: se normaliza.
const css = readFileSync(join(raiz, "src", "estilos", "tokens.css"), "utf8").replaceAll("\r\n", "\n");

// ---------- Lectura de tokens ----------
// Primer bloque `:root { ... }` = claro; bloque `:root` dentro de `@media (prefers-color-scheme: dark)` = oscuro (pisa al claro).
function declaraciones(bloque) {
  const salida = {};
  for (const m of bloque.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) salida[m[1]] = m[2].trim();
  return salida;
}
const abre = css.indexOf(":root {");
const cierraClaro = css.indexOf("\n}\n", abre);
const claro = declaraciones(css.slice(abre, cierraClaro));
const mediaOscuro = css.indexOf("prefers-color-scheme: dark");
const abreOscuro = css.indexOf(":root {", mediaOscuro);
const cierraOscuro = css.indexOf("\n  }\n", abreOscuro);
if ([abre, cierraClaro, mediaOscuro, abreOscuro, cierraOscuro].some((i) => i < 0)) {
  console.error("No se encontraron los bloques `:root` (claro y oscuro) en src/estilos/tokens.css: ¿cambió la estructura o la sangría del archivo?");
  process.exit(2);
}
const oscuro = { ...claro, ...declaraciones(css.slice(abreOscuro, cierraOscuro)) };

function resolver(tokens, nombre, profundidad = 0) {
  const valor = tokens[nombre];
  if (valor === undefined) throw new Error(`Falta el token --${nombre}`);
  const alias = /^var\(--([a-z0-9-]+)\)$/.exec(valor);
  if (alias !== null) {
    if (profundidad > 8) throw new Error(`Alias circular en --${nombre}`);
    return resolver(tokens, alias[1], profundidad + 1);
  }
  return valor;
}

function rgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (m === null) throw new Error(`Color no soportado: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function aHex([r, g, b]) {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}
function luminancia(color) {
  const [r, g, b] = color.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function razon(a, b) {
  const [clara, oscura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (clara + 0.05) / (oscura + 0.05);
}

/** Color de un token (en hex). `peligro-hover` es color-mix(... 92 % del rojo + 8 % de negro): se calcula acá. */
function color(tokens, nombre) {
  if (nombre === "c-peligro-hover") return rgb(resolver(tokens, "c-critico-r")).map((c) => c * 0.92);
  return rgb(resolver(tokens, nombre));
}

// ---------- Pares ----------
const tonos = ["ok", "pendiente", "revisar", "diferencia", "neutro"];
const fondosTexto = ["superficie", "escritorio", "superficie-2", "fondo"];
const pares = []; // { grupo, texto, fondo, minimo }
const par = (grupo, a, b, minimo) => pares.push({ grupo, a: `c-${a}`, b: `c-${b}`, minimo });

for (const f of fondosTexto) for (const t of ["texto", "texto-2", "texto-3"]) par("Texto", t, f, 4.5);
par("Texto", "texto", "ventana-barra", 4.5);
par("Texto", "texto-2", "ventana-barra", 4.5);
par("Texto", "texto-3", "ventana-barra", 4.5);
par("Texto", "texto", "acento-suave", 4.5);

for (const f of ["superficie", "superficie-2", "escritorio", "ventana-barra", "patente-fondo"]) par("Acento (enlace, texto)", "acento", f, 4.5);
par("Botón primario", "acento-texto", "acento", 4.5);
par("Botón primario (hover)", "acento-texto", "acento-hover", 4.5);
par("Botón peligro", "peligro-texto", "critico-r", 4.5);
par("Botón peligro (hover)", "peligro-texto", "peligro-hover", 4.5);
par("Botón secundario deshabilitado", "texto-3", "superficie", 4.5);
par("Texto de botón de texto sobre barra", "acento", "ventana-barra", 4.5);

for (const f of ["superficie", "superficie-2", "patente-fondo"]) par("Bordes de controles (1.4.11)", "borde-fuerte", f, 3);
for (const t of tonos) par("Borde del botón secundario sobre los avisos (3:1)", "borde-fuerte", `${t}-f`, 3);
par("Línea elegida del acento", "acento", "superficie", 3);
par("Línea elegida del acento", "acento", "acento-suave", 3);

for (const t of tonos) par("Etiqueta (texto / fondo)", `${t}-t`, `${t}-f`, 4.5);
for (const t of tonos) par("Tono / barra de título (conteos)", `${t}-t`, "ventana-barra", 4.5);
for (const t of tonos) par("Tono / superficie (mensajes)", `${t}-t`, "superficie", 4.5);
par("Error en campo (texto crítico / superficie)", "critico-t", "superficie", 4.5);
par("Error en campo (texto crítico / fondo crítico)", "critico-t", "critico-f", 4.5);
for (const t of ["vigente", "semana", "quincena", "mes", "critico"]) par("Marca del horizonte / pista (3:1)", t === "vigente" ? "ok-r" : `${t}-r`, "superficie-2", 3);
for (const t of ["ok", "pendiente", "revisar", "diferencia"]) par("Franja / superficie (3:1)", `${t}-r`, "superficie", 3);
par("Borde de campo inválido / superficie (3:1)", "critico-r", "superficie", 3);
par("Línea de hoy / pista", "hoy", "superficie-2", 3);

par("Patente: texto / fondo", "texto", "patente-fondo", 4.5);
par("Patente: banda (decorativa) / fondo", "patente-banda", "patente-fondo", 3);

for (const t of tonos) par("Foco (acento) sobre fondos de tono (3:1)", "foco", `${t}-f`, 3);
for (const t of tonos) par("Texto / fondos de tono (segmento elegido)", "texto", `${t}-f`, 4.5);
// D1 (variante texto de «Puede salir», sin fondo): texto 600 de 13 px sobre los tres fondos donde aparece.
for (const f of ["superficie", "superficie-2", "fondo"]) par("Puede salir (variante texto, D1)", "vigente-t", f, 4.5);
// D4 (motivos del protagonista en texto normal) y el texto sobre el fondo crítico del aviso de bloqueo.
par("Texto / fondo crítico (D4, avisos)", "texto", "critico-f", 4.5);
// 14.3, tarea 15: el aviso «Cerrar antes» (estado 5 bis y pantalla E, tono semana): dos renglones en --c-texto sobre el fondo semana (alias «revisar»), con su ícono i-lapiz.
par("Aviso Cerrar antes (texto / fondo semana)", "texto", "semana-f", 4.5);
par("Aviso Cerrar antes (ícono i-lapiz / fondo semana)", "semana-t", "semana-f", 4.5);
// Parte en dos pasos y licencia (19/11/2026): «sin licencia vigente» (flota, 5.10) sobre la fila con el cursor encima, el indicador de guardado con error sobre la página,
// y el renglón de contexto («Parte del … · paso 1 de 2») y el resumen de la revisión sobre el color de la página.
par("Sin licencia vigente (texto crítico / fila con hover)", "critico-t", "superficie-2", 4.5);
par("Indicador de guardado con error / fondo", "critico-t", "fondo", 4.5);
par("Renglón de contexto del parte (texto secundario / fondo)", "texto-2", "fondo", 4.5);
par("Resumen de la revisión (texto / fondo)", "texto", "fondo", 4.5);
// B8 (etapa 7): `neutro-r` marca la selección del filtro «De baja» (sobre acento-suave) y la franja de las filas de baja con el cursor encima (sobre superficie-2): 3:1.
par("Marca de «De baja» (neutro-r / acento-suave, B8)", "neutro-r", "acento-suave", 3);
par("Franja de baja con el cursor (neutro-r / superficie-2, B8)", "neutro-r", "superficie-2", 3);
par("Foco / superficie", "foco", "superficie", 3);
par("Foco / escritorio", "foco", "escritorio", 3);

// ---------- Salida ----------
let fallos = 0;
let justos = 0;
let grupoActual = "";
const fmt = (n) => n.toFixed(2).replace(".", ",");
console.log("Contraste de la paleta (claro | oscuro). Marca: x falla, ~ justo (< 0,3 sobre el mínimo).\n");
for (const p of pares) {
  if (p.grupo !== grupoActual) {
    grupoActual = p.grupo;
    console.log(`\n${grupoActual}`);
  }
  const celdas = [claro, oscuro].map((tokens) => {
    const a = color(tokens, p.a);
    const b = color(tokens, p.b);
    const r = razon(a, b);
    const marca = r < p.minimo ? "x" : r < p.minimo + 0.3 ? "~" : " ";
    if (marca === "x") fallos++;
    if (marca === "~") justos++;
    return `${marca}${fmt(r).padStart(5)}`;
  });
  const nombre = `${p.a.slice(2)} / ${p.b.slice(2)}`;
  console.log(`  ${nombre.padEnd(40)} ${celdas[0]}  |  ${celdas[1]}   (mínimo ${p.minimo})`);
}
console.log(`\n${pares.length * 2} mediciones: ${fallos} fallan, ${justos} justas.`);
// Valores calculados que conviene ver: el rojo del botón de peligro con el cursor encima.
console.log(`peligro-hover: claro ${aHex(color(claro, "c-peligro-hover"))}, oscuro ${aHex(color(oscuro, "c-peligro-hover"))}`);
process.exit(fallos > 0 ? 1 : 0);
