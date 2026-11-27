// Sirve `dist/` con las cabeceras de `public/_headers` (la misma CSP que va a aplicar Cloudflare Pages).
// Es solo para verificar a mano o con un navegador: sin dependencias, solo escucha en 127.0.0.1.
// Uso: npm run build && node scripts/servir-dist.mjs [puerto]
// Un archivo con extensión que no está en `dist/` da 404; el resto de las rutas devuelve `index.html` (la aplicación usa `#`, no necesita más).
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(raiz, "dist");
const puerto = Number(process.argv[2] ?? 4173);

// `_headers`: un bloque "/*" con líneas "Nombre: valor".
const cabeceras = {};
for (const linea of readFileSync(join(dist, "_headers"), "utf8").split(/\r?\n/)) {
  const m = /^\s+([A-Za-z-]+):\s*(.+)$/.exec(linea);
  if (m) cabeceras[m[1]] = m[2];
}

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

createServer((req, res) => {
  let ruta;
  try {
    ruta = decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/");
  } catch {
    // Una dirección mal codificada (`/%E0%A4%A`) no tiene que tirar abajo el servidor de quien está probando.
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Dirección mal codificada.");
    return;
  }
  let archivo = normalize(join(dist, ruta === "/" ? "index.html" : ruta));
  if (!archivo.startsWith(dist + sep) || !existsSync(archivo) || !statSync(archivo).isFile()) {
    // Un archivo con extensión que no existe (`/assets/viejo-AbC123.js`, una imagen) da 404: así una prueba ve el trozo o la imagen que faltan, en lugar de recibir el `index.html` con 200.
    // Lo demás (`/algo` sin extensión) es una ruta de la aplicación y recibe el `index.html`. Cloudflare Pages sin `404.html` contesta el `index.html` con 200 también para los archivos que
    // faltan: ese caso (un despliegue nuevo que borró el trozo) se prueba aparte con `page.route` en `e2e/trozos.spec.ts`.
    if (extname(ruta) !== "") {
      res.writeHead(404, { ...cabeceras, "Content-Type": "text/plain; charset=utf-8" });
      res.end("No encontrado.");
      return;
    }
    archivo = join(dist, "index.html");
  }
  res.writeHead(200, { ...cabeceras, "Content-Type": tipos[extname(archivo)] ?? "application/octet-stream" });
  res.end(readFileSync(archivo));
}).listen(puerto, "127.0.0.1", () => console.log(`dist/ con cabeceras en http://127.0.0.1:${puerto}/`));
