// Control del peso del JS de `dist/` (después de `npm run build`). Uso: npm run peso
// Mide con un único método, siempre el mismo: gzip de `node:zlib` en nivel 9 (sobre el archivo tal como lo sirve Pages, sin mapa).
// OJO: no coincide con lo que imprime `vite build` ni con `GZipStream` de .NET (hasta ~1,2 kB de diferencia): la cifra de este script manda.
//   - Carga inicial = el script de entrada y los `modulepreload` locales de `dist/index.html` (el marco y la pantalla de Inicio). Falla (código 1) si pasa TOPE_INICIAL.
//   - Trozos = el resto de `dist/assets/*.js`: una pantalla (o el código de escribir, o el generador de datos) se baja al entrar o al usarla. Cada uno solo avisa si pasa AVISO_TROZO.
//   - Total = todo `dist/assets/*.js` (la inicial y los trozos). Solo avisa si pasa TOPE_TOTAL_AVISO.
// Topes fijados al terminar la etapa 1 del rediseño de la flota («partir por rutas»): el de la carga inicial bajó de 120 kB a 95 kB con lo ganado (docs/registro.md, 27/11/2026).
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

/** Tope de la carga inicial, en bytes con gzip nivel 9 (kB = 1.000 B). Era de 120 kB (docs/stack.md, sección 5); la etapa 1 del rediseño lo bajó a 95 kB. */
export const TOPE_INICIAL = 95_000;
/** Aviso (no falla) de cada trozo que se baja después de la carga inicial: una pantalla que pasa de acá conviene partirla. */
export const AVISO_TROZO = 30_000;
/** Aviso (no falla) del total: lugar para los ocho módulos del rediseño, con sus gráficos. */
export const TOPE_TOTAL_AVISO = 240_000;

/** Tamaño con gzip, siempre nivel 9. */
export function gzipBytes(contenido) {
  return gzipSync(contenido, { level: 9 }).length;
}

/** Rutas (relativas a `dist/`, sin barra inicial) del JS que el HTML carga de entrada: `<script src>` y `<link rel="modulepreload" href>` locales. */
export function jsDeLaCargaInicial(html) {
  const rutas = [];
  for (const etiqueta of html.match(/<(?:script|link)\b[^>]*>/gi) ?? []) {
    const esScript = /^<script\b/i.test(etiqueta);
    if (!esScript && !/\brel=["']modulepreload["']/i.test(etiqueta)) continue;
    const ruta = new RegExp(`\\b${esScript ? "src" : "href"}=["']([^"']+)["']`, "i").exec(etiqueta)?.[1];
    if (ruta === undefined || !ruta.startsWith("/") || ruta.startsWith("//") || !ruta.endsWith(".js")) continue;
    const limpia = ruta.slice(1);
    if (!rutas.includes(limpia)) rutas.push(limpia);
  }
  return rutas;
}

/** `archivos`: todos los JS de `dist/` con su tamaño gzip. `iniciales`: las rutas de `jsDeLaCargaInicial`. `trozos`: los que no son de la carga inicial. */
export function resumirPeso(archivos, iniciales) {
  if (iniciales.length === 0) throw new Error("No se encontró la carga inicial en dist/index.html (¿falta `npm run build`?).");
  let inicial = 0;
  for (const ruta of iniciales) {
    const a = archivos.find((x) => x.ruta === ruta);
    if (a === undefined) throw new Error(`dist/index.html nombra ${ruta} y no está en dist/.`);
    inicial += a.gzip;
  }
  return { inicial, total: archivos.reduce((suma, a) => suma + a.gzip, 0), trozos: archivos.filter((a) => !iniciales.includes(a.ruta)) };
}

/** `ok` es falso solo si la carga inicial pasa el tope; un trozo o el total pasados de aviso agregan un texto y no fallan. */
export function evaluarPeso({ inicial, total, trozos = [] }) {
  const avisos = [];
  for (const t of trozos) if (t.gzip > AVISO_TROZO) avisos.push(`El trozo ${t.ruta} (${t.gzip} B) pasa el aviso de ${AVISO_TROZO} B: conviene partirlo.`);
  if (total > TOPE_TOTAL_AVISO) avisos.push(`El JS total (${total} B) pasa el aviso de ${TOPE_TOTAL_AVISO} B: revisar antes de seguir sumando.`);
  return { ok: inicial <= TOPE_INICIAL, avisos };
}

function main() {
  const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
  const carpeta = join(dist, "assets");
  const archivos = readdirSync(carpeta)
    .filter((n) => n.endsWith(".js"))
    .map((n) => ({ ruta: `assets/${n}`, gzip: gzipBytes(readFileSync(join(carpeta, n))) }));
  const medida = resumirPeso(archivos, jsDeLaCargaInicial(readFileSync(join(dist, "index.html"), "utf8")));
  const { ok, avisos } = evaluarPeso(medida);
  console.log(`JS inicial: ${medida.inicial} B con gzip (tope ${TOPE_INICIAL} B, margen ${TOPE_INICIAL - medida.inicial} B)`);
  const mayor = medida.trozos.reduce((m, t) => (t.gzip > m.gzip ? t : m), { ruta: "(ninguno)", gzip: 0 });
  console.log(`Trozos:     ${medida.trozos.length}, el mayor ${mayor.ruta} con ${mayor.gzip} B (aviso desde ${AVISO_TROZO} B)`);
  console.log(`JS total:   ${medida.total} B con gzip (aviso desde ${TOPE_TOTAL_AVISO} B)`);
  for (const a of avisos) console.warn(`AVISO: ${a}`);
  if (!ok) {
    console.error(`FALLA: la carga inicial (${medida.inicial} B) pasa el tope de ${TOPE_INICIAL} B.`);
    process.exitCode = 1;
  }
}

// `pathToFileURL` arma la misma URL que `import.meta.url` en Windows y en Linux (CI). Armarla a mano con
// "file:///" + ruta deja cuatro barras en Linux: la comparación nunca coincide y el control no corre.
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    console.error(`FALLA: ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  }
}
