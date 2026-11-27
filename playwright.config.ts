// Pruebas de punta a punta (Playwright + axe): corren contra `dist/` servido por `scripts/servir-dist.mjs`, que manda las mismas cabeceras
// (la CSP real) que va a mandar Cloudflare Pages. `npm run e2e` arma `dist/` antes de correrlas.
import { defineConfig, devices } from "@playwright/test";

const PUERTO = 4180;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: true,
  reporter: [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
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
