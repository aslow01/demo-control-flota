// Búsquedas de `docs/stack.md` sección 7. Falla (código 1) si encuentra algo prohibido.
// Uso: npm run buscar  (lo corre también la integración continua).
// Los nombres de terceros NO están escritos en el repositorio: la regla los lee de `scripts/prohibidos.local.json`
// (`{ "palabras": [...] }`, ignorado por git; ver `prohibidos.mjs`). Si ese archivo no existe (integración continua,
// clon ajeno), la regla se omite con un aviso y las demás corren igual; si existe pero está roto, la búsqueda falla.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { ARCHIVO_LOCAL, contieneProhibido, correosNoPermitidos, marcaPendienteDeConfirmar, terminosDeJson } from "./prohibidos.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ignorar = new Set(["node_modules", "dist", ".git", "coverage"]);
const rutaLocal = join(raiz, ...ARCHIVO_LOCAL.split("/"));
let terminos = null; // null: no hay archivo local, la regla de nombres de terceros se omite
if (existsSync(rutaLocal)) {
  try {
    terminos = terminosDeJson(readFileSync(rutaLocal, "utf8"));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

function archivos(dir) {
  const salida = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (ignorar.has(nombre) || ruta === rutaLocal) continue;
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
  ...(terminos === null ? [] : [{ nombre: "nombres de terceros (lista local)", donde: /^(?!node_modules)/, coincide: (linea) => contieneProhibido(linea, terminos), excepto: [] }]),
  { nombre: "correos que no son de ejemplo ni noreply", donde: /^(?!node_modules)/, coincide: (linea) => correosNoPermitidos(linea).length > 0, excepto: [] },
];

if (terminos === null) {
  console.warn(`Aviso: no existe ${ARCHIVO_LOCAL}: la regla de nombres de terceros se omite (las demás reglas corren igual).`);
}
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
