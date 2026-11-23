// Búsquedas de `docs/stack.md` sección 7. Falla (código 1) si encuentra algo prohibido.
// Uso: npm run buscar  (lo corre también la integración continua).
// Los nombres de terceros NO están escritos en el repositorio: se buscan por huella (`huellas-prohibidas.mjs`,
// `prohibidos.mjs`). Quien trabaja en local puede sumar términos propios en `.prohibidos.local` (un término por línea,
// ignorado por git); sin ese archivo la búsqueda corre igual con las huellas del repositorio.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { HUELLAS } from "./huellas-prohibidas.mjs";
import { contieneProhibido, correosNoPermitidos, huellasDeLiterales, marcaPendienteDeConfirmar } from "./prohibidos.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ignorar = new Set(["node_modules", "dist", ".git", "coverage"]);
const ARCHIVO_LOCAL = ".prohibidos.local";
const rutaLocal = join(raiz, ARCHIVO_LOCAL);
const huellas = [...HUELLAS, ...(existsSync(rutaLocal) ? huellasDeLiterales(readFileSync(rutaLocal, "utf8")) : [])];

function archivos(dir) {
  const salida = [];
  for (const nombre of readdirSync(dir)) {
    if (ignorar.has(nombre) || (dir === raiz && nombre === ARCHIVO_LOCAL)) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta));
    else salida.push(ruta);
  }
  return salida;
}

const rel = (f) => relative(raiz, f).split(sep).join("/");
const todos = archivos(raiz).map((f) => ({ ruta: rel(f), texto: readFileSync(f, "utf8") }));

// Cada regla: dónde mira, qué prohíbe (un patrón, o una función `coincide` sobre la línea) y qué archivos exceptúa.
const reglas = [
  { nombre: "{@html} (puerta del XSS y de la CSP)", donde: /^src\//, patron: /\{@html/, excepto: [] },
  { nombre: "innerHTML / outerHTML / insertAdjacentHTML con datos", donde: /^src\//, patron: /\b(innerHTML|outerHTML|insertAdjacentHTML)\b/, excepto: [] },
  { nombre: "eval / new Function", donde: /^src\//, patron: /\beval\s*\(|new Function\s*\(/, excepto: [] },
  { nombre: "Math.random en src/lib (todo sale del generador con semilla)", donde: /^src\/lib\//, patron: /Math\.random/, excepto: [] },
  { nombre: "reloj del sistema fuera de estado/reloj.ts (new Date() o Date.now)", donde: /^src\//, patron: /new Date\(\s*\)|Date\.now\s*\(/, excepto: ["src/lib/estado/reloj.ts"] },
  { nombre: "transiciones de Svelte (el movimiento va por CSS)", donde: /^src\/.*\.svelte$/, patron: /\b(transition|in|out|animate):[a-z]/, excepto: [] },
  { nombre: "decisión «a confirmar» en el código (confirmarla y anotar quién y cuándo)", donde: /^src\//, coincide: marcaPendienteDeConfirmar, excepto: [] },
  { nombre: "nombres de terceros (por huella)", donde: /^(?!node_modules)/, coincide: (linea) => contieneProhibido(linea, huellas), excepto: [] },
  { nombre: "correos que no son de ejemplo ni noreply", donde: /^(?!node_modules)/, coincide: (linea) => correosNoPermitidos(linea).length > 0, excepto: [] },
];

let fallos = 0;
for (const r of reglas) {
  for (const f of todos) {
    if (!r.donde.test(f.ruta) || r.excepto.includes(f.ruta)) continue;
    f.texto.split(/\r?\n/).forEach((linea, i) => {
      if (r.coincide ? r.coincide(linea) : r.patron.test(linea)) {
        fallos++;
        console.error(`${f.ruta}:${i + 1}  ${r.nombre}\n    ${linea.trim()}`);
      }
    });
  }
}
if (fallos > 0) {
  console.error(`\n${fallos} hallazgo(s).`);
  process.exit(1);
}
console.log(`Sin hallazgos (${reglas.length} reglas, ${todos.length} archivos).`);
