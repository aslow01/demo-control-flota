// Ayuda de `tests/peso-js-proceso.test.ts`: usa módulos de Node, que el proyecto no tipa (no hay @types/node).
// Arma `<tmp>/scripts/peso-js.mjs` y `<tmp>/dist/` con un JS inicial casi incompresible de `bytes` bytes (y, si se pide, un generador de datos de `bytesDelGenerador` bytes y un trozo de `bytesDelTrozo`
// bytes), ejecuta el script como proceso (el script busca `dist/` al lado de su carpeta `scripts/`) y borra lo temporal.
// `enActions` simula GitHub Actions (`GITHUB_ACTIONS` y `GITHUB_STEP_SUMMARY`); sin él, las dos variables van vacías aunque esta prueba corra dentro de Actions.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function correrPesoJsConDist(bytes, bytesDelGenerador = 0, { bytesDelTrozo = 0, enActions = false } = {}) {
  const original = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "scripts", "peso-js.mjs");
  const raiz = mkdtempSync(join(tmpdir(), "peso-js-proceso-"));
  try {
    mkdirSync(join(raiz, "scripts"));
    mkdirSync(join(raiz, "dist", "assets"), { recursive: true });
    copyFileSync(original, join(raiz, "scripts", "peso-js.mjs"));
    writeFileSync(join(raiz, "dist", "index.html"), '<!doctype html><script type="module" src="/assets/index-PRUEBA.js"></script>');
    writeFileSync(join(raiz, "dist", "assets", "index-PRUEBA.js"), randomBytes(bytes));
    if (bytesDelGenerador > 0) writeFileSync(join(raiz, "dist", "assets", "generador-PRUEBA.js"), randomBytes(bytesDelGenerador));
    if (bytesDelTrozo > 0) writeFileSync(join(raiz, "dist", "assets", "PantallaPrueba-PRUEBA.js"), randomBytes(bytesDelTrozo));
    const archivoDeResumen = join(raiz, "resumen.md");
    const env = { ...process.env, GITHUB_ACTIONS: enActions ? "true" : "", GITHUB_STEP_SUMMARY: enActions ? archivoDeResumen : "" };
    const r = spawnSync(process.execPath, [join(raiz, "scripts", "peso-js.mjs")], { encoding: "utf8", env });
    return { status: r.status, stdout: r.stdout, stderr: r.stderr, resumen: existsSync(archivoDeResumen) ? readFileSync(archivoDeResumen, "utf8") : "" };
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
}
