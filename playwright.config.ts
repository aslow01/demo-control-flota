// Pruebas de punta a punta (Playwright + axe): corren contra `dist/` servido por `scripts/servir-dist.mjs`, que manda las mismas cabeceras
// (la CSP real) que va a mandar Cloudflare Pages. `npm run e2e` arma `dist/` antes de correrlas.
// Sin @types/node: se llega a `process` por globalThis (igual que en `vite.config.ts`).
import { defineConfig, devices } from "@playwright/test";

const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

/**
 * El puerto del servidor de las pruebas. 4180 por defecto; `E2E_PUERTO=4290 npm run e2e` si ya está ocupado o si se corren dos copias a la vez (dos worktrees).
 * El servidor nunca se reutiliza (`reuseExistingServer: false`): una prueba tiene que correr contra el `dist/` que se acaba de armar, no contra el de otra carpeta.
 */
const PUERTO = Number(entorno["E2E_PUERTO"] ?? 4180);
if (!Number.isInteger(PUERTO) || PUERTO < 1024 || PUERTO > 65535) throw new Error(`E2E_PUERTO tiene que ser un puerto entre 1024 y 65535 (llegó «${entorno["E2E_PUERTO"] ?? ""}»).`);

const EN_CI = entorno["CI"] === "true";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: true,
  // Con la máquina cargada (o un runner de 2 CPU) una prueba de ruta llega a tardar 15 s: 60 s dejan margen sin esconder un cuelgue real. Las que esperan a propósito (el generador lento) lo piden aparte.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // En CI el informe en HTML y las trazas quedan en `playwright-report/` y `test-results/`, que el flujo sube como artefacto cuando algo falla.
  reporter: EN_CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PUERTO}`,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    // Sin animaciones: el contraste y la posición de lo que se mide no dependen de un cuadro intermedio.
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `node scripts/servir-dist.mjs ${PUERTO}`,
    url: `http://127.0.0.1:${PUERTO}/`,
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
