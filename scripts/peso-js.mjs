// Control del peso del JS de `dist/` (después de `npm run build`). Uso: npm run peso
// Mide con un único método, siempre el mismo: gzip de `node:zlib` en nivel 9 (sobre el archivo tal como lo sirve Pages, sin mapa).
// OJO: no coincide con lo que imprime `vite build` ni con `GZipStream` de .NET (hasta ~1,2 kB de diferencia): la cifra de este script manda.
//   - Carga inicial = el script de entrada y los `modulepreload` locales de `dist/index.html` (el marco y la pantalla de Inicio). Falla (código 1) si pasa TOPE_INICIAL.
//   - Trozos = el resto de `dist/assets/*.js`: una pantalla (o el código de escribir, o el generador de datos) se baja al entrar o al usarla. Cada uno solo avisa si pasa AVISO_TROZO.
//   - Primera visita = la carga inicial más lo que una visita sin datos guardados pide enseguida: el generador de datos y lo que este importa de forma estática (`PRIMERA_VISITA`). Es lo que baja
//     un visitante nuevo (un reclutador): falla (código 1) si pasa TOPE_PRIMERA_VISITA. La carga inicial sola es lo que baja quien vuelve el mismo día.
//   - Total = todo `dist/assets/*.js` y los `dist/*.js` de la raíz (la inicial y los trozos). Solo avisa si pasa TOPE_TOTAL_AVISO.
//   - CSS inicial = las hojas de estilo locales de `dist/index.html` (bloquean el primer pintado). Falla (código 1) si pasa TOPE_CSS_INICIAL y avisa desde AVISO_CSS_INICIAL.
//   - CSS total = todas las hojas de `dist/`. Solo avisa si pasa AVISO_CSS_TOTAL.
//   - Fuentes = los archivos de tipografía de `dist/`, por su tamaño en disco (un `.woff2` ya viene comprimido: no se le pasa gzip). Falla (código 1) si pasa TOPE_FUENTES.
//   - En GitHub Actions los avisos salen como anotaciones `::warning::` y la medición se agrega al resumen de la corrida.
// Topes fijados al terminar la etapa 1 del rediseño de la flota («partir por rutas»): el de la carga inicial bajó de 120 kB a 95 kB con lo ganado (docs/registro.md, 27/11/2026).
import { appendFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

/** Tope de la carga inicial, en bytes con gzip nivel 9 (kB = 1.000 B). Era de 120 kB (docs/stack.md, sección 7); la etapa 1 del rediseño lo bajó a 95 kB y la T9 de la etapa 2 lo subió a 97 kB el 28/11/2026 (regla de salida; decisión de Matías). */
export const TOPE_INICIAL = 97_000;
/** Tope de la primera visita (carga inicial + generador de datos), en bytes con gzip nivel 9. La etapa 1 sacó el generador de la carga inicial: sin este tope volvería a crecer sin que nadie lo vea. */
export const TOPE_PRIMERA_VISITA = 102_000;
/** Los trozos de entrada que se piden en una primera visita (sin datos guardados), por su ruta en `dist/`. Si otro trozo pasa a pedirse siempre al arrancar, va acá. */
export const PRIMERA_VISITA = [/^assets\/generador-[^/]+\.js$/];
/** Aviso (no falla) de cada trozo que se baja después de la carga inicial: una pantalla que pasa de acá conviene partirla. */
export const AVISO_TROZO = 30_000;
/** Aviso (no falla) del total. Medido al cerrar la etapa 1: 165.809 B; el aviso queda unos 14 kB (8 %) arriba para que avise antes de que el total se duplique sin que nadie lo note. Se sube con una decisión escrita (docs/stack.md, sección 7), no por costumbre. */
export const TOPE_TOTAL_AVISO = 180_000;
/** Tope del CSS inicial (las hojas de `index.html`), en bytes con gzip nivel 9. Falla: ese CSS bloquea el primer pintado. Medido antes de la etapa 2 del rediseño: 15.101 B. */
export const TOPE_CSS_INICIAL = 26_000;
/** Aviso (no falla) del CSS inicial: quedan 3 kB hasta el tope. */
export const AVISO_CSS_INICIAL = 23_000;
/** Aviso (no falla) del CSS total (el inicial más el de las pantallas que se bajan después). Medido antes de la etapa 2 del rediseño: 31.712 B. */
export const AVISO_CSS_TOTAL = 48_000;
/** Tope de las fuentes, en bytes del archivo. Falla: las tres tipografías de hoy pesan 200.712 B y la decisión es no sumar ninguna. */
export const TOPE_FUENTES = 205_000;

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

/** Rutas (relativas a `dist/`, sin barra inicial) de las hojas de estilo que el HTML carga de entrada: `<link rel="stylesheet" href>` locales. */
export function cssDeLaCargaInicial(html) {
  const rutas = [];
  for (const etiqueta of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/\brel=["']stylesheet["']/i.test(etiqueta)) continue;
    const ruta = /\bhref=["']([^"']+)["']/i.exec(etiqueta)?.[1];
    if (ruta === undefined || !ruta.startsWith("/") || ruta.startsWith("//") || !ruta.endsWith(".css")) continue;
    const limpia = ruta.slice(1);
    if (!rutas.includes(limpia)) rutas.push(limpia);
  }
  return rutas;
}

/** `hojas`: todas las hojas de `dist/` con su tamaño gzip. `iniciales`: las rutas de `cssDeLaCargaInicial`. Sin hojas en el HTML el inicial es 0. */
export function resumirEstilos(hojas, iniciales) {
  let cssInicial = 0;
  for (const ruta of iniciales) {
    const h = hojas.find((x) => x.ruta === ruta);
    if (h === undefined) throw new Error(`dist/index.html nombra ${ruta} y no está en dist/.`);
    cssInicial += h.gzip;
  }
  return { cssInicial, cssTotal: hojas.reduce((suma, h) => suma + h.gzip, 0) };
}

/** `true` si la ruta es de un archivo de tipografía (`.woff2`, `.woff`, `.ttf` u `.otf`). */
export function esUnaFuente(ruta) {
  return /\.(?:woff2?|ttf|otf)$/i.test(ruta);
}

/**
 * Las rutas que se piden de más en una primera visita: los trozos de `PRIMERA_VISITA` y todo lo que importan de forma estática (`import ... from "./x.js"`, no `import("./x.js")`), menos lo que ya está
 * en la carga inicial. `contenidos`: `[{ ruta, texto }]` de todos los JS de `dist/`.
 */
export function jsDeLaPrimeraVisita(contenidos, iniciales) {
  const porRuta = new Map(contenidos.map((c) => [c.ruta, c.texto]));
  const pedidos = [];
  const pendientes = contenidos.map((c) => c.ruta).filter((ruta) => PRIMERA_VISITA.some((patron) => patron.test(ruta)));
  while (pendientes.length > 0) {
    const ruta = pendientes.pop();
    if (iniciales.includes(ruta) || pedidos.includes(ruta)) continue;
    pedidos.push(ruta);
    for (const m of (porRuta.get(ruta) ?? "").matchAll(/(?:\bfrom|\bimport)\s*["']\.\/([^"']+\.js)["']/g)) pendientes.push(`assets/${m[1]}`);
  }
  return pedidos.sort();
}

/**
 * `archivos`: todos los JS de `dist/` con su tamaño gzip. `iniciales`: las rutas de `jsDeLaCargaInicial`. `trozos`: los que no son de la carga inicial. `extrasPrimeraVisita`: las de
 * `jsDeLaPrimeraVisita`; `primeraVisita` es la carga inicial más esos.
 */
export function resumirPeso(archivos, iniciales, extrasPrimeraVisita = []) {
  if (iniciales.length === 0) throw new Error("No se encontró la carga inicial en dist/index.html (¿falta `npm run build`?).");
  let inicial = 0;
  for (const ruta of iniciales) {
    const a = archivos.find((x) => x.ruta === ruta);
    if (a === undefined) throw new Error(`dist/index.html nombra ${ruta} y no está en dist/.`);
    inicial += a.gzip;
  }
  let primeraVisita = inicial;
  for (const ruta of extrasPrimeraVisita) {
    const a = archivos.find((x) => x.ruta === ruta);
    if (a === undefined) throw new Error(`La primera visita nombra ${ruta} y no está en dist/.`);
    primeraVisita += a.gzip;
  }
  return { inicial, primeraVisita, total: archivos.reduce((suma, a) => suma + a.gzip, 0), trozos: archivos.filter((a) => !iniciales.includes(a.ruta)) };
}

/**
 * `ok` es falso solo si la carga inicial, la primera visita, el CSS inicial o las fuentes pasan su tope; un trozo, el total o el CSS pasados de aviso agregan un texto y no fallan.
 * Sin `primeraVisita` se la toma igual a la inicial; sin `cssInicial`, `cssTotal` o `fuentes` (0) esa medida no se evalúa.
 */
export function evaluarPeso({ inicial, total, trozos = [], primeraVisita = inicial, cssInicial = 0, cssTotal = 0, fuentes = 0 }) {
  const avisos = [];
  for (const t of trozos) if (t.gzip > AVISO_TROZO) avisos.push(`El trozo ${t.ruta} (${t.gzip} B) pasa el aviso de ${AVISO_TROZO} B: conviene partirlo.`);
  if (total > TOPE_TOTAL_AVISO) avisos.push(`El JS total (${total} B) pasa el aviso de ${TOPE_TOTAL_AVISO} B: revisar antes de seguir sumando.`);
  if (cssInicial > AVISO_CSS_INICIAL) avisos.push(`El CSS inicial (${cssInicial} B) pasa el aviso de ${AVISO_CSS_INICIAL} B: el tope es de ${TOPE_CSS_INICIAL} B y ese CSS bloquea el primer pintado.`);
  if (cssTotal > AVISO_CSS_TOTAL) avisos.push(`El CSS total (${cssTotal} B) pasa el aviso de ${AVISO_CSS_TOTAL} B: revisar antes de seguir sumando.`);
  return { ok: inicial <= TOPE_INICIAL && primeraVisita <= TOPE_PRIMERA_VISITA && cssInicial <= TOPE_CSS_INICIAL && fuentes <= TOPE_FUENTES, avisos };
}

/** Cómo se muestra un aviso: en GitHub Actions, como anotación `::warning::` (aparece arriba del resumen de la corrida y no queda enterrada en el registro); en local, como texto. */
export function lineaDeAviso(texto, enActions) {
  // Una anotación es una sola línea: los saltos y el `%` se escapan como pide GitHub.
  if (enActions) return `::warning title=Peso del JS::${texto.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A")}`;
  return `AVISO: ${texto}`;
}

/** Tablas en Markdown para el resumen de la corrida (`$GITHUB_STEP_SUMMARY`): la del JS y, si `medida` trae `cssInicial`, la del CSS y las fuentes. */
export function resumenEnMarkdown(medida, avisos) {
  const fila = (nombre, bytes, tope) => `| ${nombre} | ${bytes.toLocaleString("es-AR")} B | ${tope} |`;
  const estilos =
    medida.cssInicial === undefined
      ? []
      : [
          "### Peso del CSS (gzip nivel 9) y de las fuentes",
          "",
          "| Medida | Pesa | Tope |",
          "| --- | ---: | --- |",
          fila("CSS inicial", medida.cssInicial, `${TOPE_CSS_INICIAL.toLocaleString("es-AR")} B (falla); aviso desde ${AVISO_CSS_INICIAL.toLocaleString("es-AR")} B`),
          fila("CSS total", medida.cssTotal ?? 0, `${AVISO_CSS_TOTAL.toLocaleString("es-AR")} B (aviso)`),
          fila("Fuentes", medida.fuentes ?? 0, `${TOPE_FUENTES.toLocaleString("es-AR")} B (falla)`),
          "",
        ];
  return [
    "### Peso del JS (gzip nivel 9)",
    "",
    "| Medida | Pesa | Tope |",
    "| --- | ---: | --- |",
    fila("Carga inicial", medida.inicial, `${TOPE_INICIAL.toLocaleString("es-AR")} B (falla)`),
    fila("Primera visita", medida.primeraVisita, `${TOPE_PRIMERA_VISITA.toLocaleString("es-AR")} B (falla)`),
    fila("Total", medida.total, `${TOPE_TOTAL_AVISO.toLocaleString("es-AR")} B (aviso)`),
    "",
    ...estilos,
    ...(avisos.length === 0 ? ["Sin avisos."] : avisos.map((a) => `- AVISO: ${a}`)),
    "",
  ].join("\n");
}

/** Todos los archivos de `carpeta` y de sus subcarpetas, con la ruta relativa a `carpeta` (con `/`). */
function archivosDe(carpeta, prefijo = "") {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivosDe(join(carpeta, e.name), `${prefijo}${e.name}/`) : [`${prefijo}${e.name}`],
  );
}

function main() {
  const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
  const carpeta = join(dist, "assets");
  // El JS de `dist/assets/` y el clásico de la raíz (`arranque.js`, que viene de `public/` y `index.html` pide antes del primer pintado): los dos pesan en la carga inicial.
  const contenidos = [
    ...readdirSync(carpeta)
      .filter((n) => n.endsWith(".js"))
      .map((n) => ({ ruta: `assets/${n}`, buffer: readFileSync(join(carpeta, n)) })),
    ...readdirSync(dist)
      .filter((n) => n.endsWith(".js"))
      .map((n) => ({ ruta: n, buffer: readFileSync(join(dist, n)) })),
  ];
  const archivos = contenidos.map((c) => ({ ruta: c.ruta, gzip: gzipBytes(c.buffer) }));
  const html = readFileSync(join(dist, "index.html"), "utf8");
  const iniciales = jsDeLaCargaInicial(html);
  const extras = jsDeLaPrimeraVisita(contenidos.map((c) => ({ ruta: c.ruta, texto: c.buffer.toString("utf8") })), iniciales);
  // El CSS y las fuentes se buscan en todo `dist/` (no solo en `assets/`): un archivo dejado en `public/` también viaja.
  const enDist = archivosDe(dist);
  const hojas = enDist.filter((ruta) => ruta.endsWith(".css")).map((ruta) => ({ ruta, gzip: gzipBytes(readFileSync(join(dist, ruta))) }));
  const hojasIniciales = cssDeLaCargaInicial(html);
  const fuentes = enDist.filter(esUnaFuente);
  const medida = {
    ...resumirPeso(archivos, iniciales, extras),
    ...resumirEstilos(hojas, hojasIniciales),
    fuentes: fuentes.reduce((suma, ruta) => suma + statSync(join(dist, ruta)).size, 0),
  };
  const { ok, avisos } = evaluarPeso(medida);
  console.log(`JS inicial: ${medida.inicial} B con gzip (tope ${TOPE_INICIAL} B, margen ${TOPE_INICIAL - medida.inicial} B)`);
  console.log(`Primera visita: ${medida.primeraVisita} B con gzip (la inicial más ${extras.length === 0 ? "nada" : extras.join(", ")}; tope ${TOPE_PRIMERA_VISITA} B, margen ${TOPE_PRIMERA_VISITA - medida.primeraVisita} B)`);
  const mayor = medida.trozos.reduce((m, t) => (t.gzip > m.gzip ? t : m), { ruta: "(ninguno)", gzip: 0 });
  console.log(`Trozos:     ${medida.trozos.length}, el mayor ${mayor.ruta} con ${mayor.gzip} B (aviso desde ${AVISO_TROZO} B)`);
  console.log(`JS total:   ${medida.total} B con gzip (aviso desde ${TOPE_TOTAL_AVISO} B)`);
  console.log(`CSS inicial: ${medida.cssInicial} B con gzip en ${hojasIniciales.length} hojas (tope ${TOPE_CSS_INICIAL} B, margen ${TOPE_CSS_INICIAL - medida.cssInicial} B; aviso desde ${AVISO_CSS_INICIAL} B)`);
  console.log(`CSS total:  ${medida.cssTotal} B con gzip en ${hojas.length} hojas (aviso desde ${AVISO_CSS_TOTAL} B)`);
  console.log(`Fuentes:    ${medida.fuentes} B en ${fuentes.length} archivos (tope ${TOPE_FUENTES} B, margen ${TOPE_FUENTES - medida.fuentes} B)`);
  const enActions = process.env.GITHUB_ACTIONS === "true";
  for (const a of avisos) console.warn(lineaDeAviso(a, enActions));
  const resumen = process.env.GITHUB_STEP_SUMMARY;
  if (enActions && resumen !== undefined && resumen !== "") appendFileSync(resumen, resumenEnMarkdown(medida, avisos));
  if (medida.inicial > TOPE_INICIAL) console.error(`FALLA: la carga inicial (${medida.inicial} B) pasa el tope de ${TOPE_INICIAL} B.`);
  if (medida.primeraVisita > TOPE_PRIMERA_VISITA) console.error(`FALLA: la primera visita (${medida.primeraVisita} B) pasa el tope de ${TOPE_PRIMERA_VISITA} B.`);
  if (medida.cssInicial > TOPE_CSS_INICIAL) console.error(`FALLA: el CSS inicial (${medida.cssInicial} B) pasa el tope de ${TOPE_CSS_INICIAL} B.`);
  if (medida.fuentes > TOPE_FUENTES) console.error(`FALLA: las fuentes (${medida.fuentes} B) pasan el tope de ${TOPE_FUENTES} B.`);
  if (!ok) process.exitCode = 1;
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
