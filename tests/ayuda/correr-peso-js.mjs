// Ayuda de `tests/peso-js-proceso.test.ts`: usa módulos de Node, que el proyecto no tipa (no hay @types/node).
// Arma `<tmp>/scripts/peso-js.mjs` y `<tmp>/dist/` con un JS inicial casi incompresible de `bytes` bytes, ejecuta el script
// como proceso (el script busca `dist/` al lado de su carpeta `scripts/`) y borra lo temporal.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function correrPesoJsConDist(bytes) {
  const original = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "scripts", "peso-js.mjs");
  const raiz = mkdtempSync(join(tmpdir(), "peso-js-proceso-"));
  try {
    mkdirSync(join(raiz, "scripts"));
    mkdirSync(join(raiz, "dist", "assets"), { recursive: true });
    copyFileSync(original, join(raiz, "scripts", "peso-js.mjs"));
    writeFileSync(join(raiz, "dist", "index.html"), '<!doctype html><script type="module" src="/assets/index-PRUEBA.js"></script>');
    writeFileSync(join(raiz, "dist", "assets", "index-PRUEBA.js"), randomBytes(bytes));
    const r = spawnSync(process.execPath, [join(raiz, "scripts", "peso-js.mjs")], { encoding: "utf8" });
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
}
