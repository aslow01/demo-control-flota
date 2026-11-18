// Búsquedas de `docs/stack.md` sección 7. Falla (código 1) si encuentra algo prohibido.
// Uso: npm run buscar  (lo corre también la integración continua).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ignorar = new Set(["node_modules", "dist", ".git", "coverage"]);

function archivos(dir) {
  const salida = [];
  for (const nombre of readdirSync(dir)) {
    if (ignorar.has(nombre)) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta));
    else salida.push(ruta);
  }
  return salida;
}

const rel = (f) => relative(raiz, f).split(sep).join("/");
const todos = archivos(raiz).map((f) => ({ ruta: rel(f), texto: readFileSync(f, "utf8") }));

// Cada regla: dónde mira, qué patrón prohíbe y qué archivos exceptúa.
const reglas = [
  { nombre: "{@html} (puerta del XSS y de la CSP)", donde: /^src\//, patron: /\{@html/, excepto: [] },
  { nombre: "innerHTML / outerHTML / insertAdjacentHTML con datos", donde: /^src\//, patron: /\b(innerHTML|outerHTML|insertAdjacentHTML)\b/, excepto: [] },
  { nombre: "eval / new Function", donde: /^src\//, patron: /\beval\s*\(|new Function\s*\(/, excepto: [] },
  { nombre: "Math.random en src/lib (todo sale del generador con semilla)", donde: /^src\/lib\//, patron: /Math\.random/, excepto: [] },
  { nombre: "reloj del sistema fuera de estado/reloj.ts (new Date() o Date.now)", donde: /^src\//, patron: /new Date\(\s*\)|Date\.now\s*\(/, excepto: ["src/lib/estado/reloj.ts"] },
  { nombre: "transiciones de Svelte (el movimiento va por CSS)", donde: /^src\/.*\.svelte$/, patron: /\b(transition|in|out|animate):[a-z]/, excepto: [] },
  { nombre: "nombres de terceros o correos personales", donde: /^(?!node_modules)/, patron: /@gmail/i, excepto: ["scripts/buscar-prohibidos.mjs"] },
];

let fallos = 0;
for (const r of reglas) {
  for (const f of todos) {
    if (!r.donde.test(f.ruta) || r.excepto.includes(f.ruta)) continue;
    f.texto.split(/\r?\n/).forEach((linea, i) => {
      if (r.patron.test(linea)) {
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
