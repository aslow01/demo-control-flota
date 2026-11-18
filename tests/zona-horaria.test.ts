import { describe, expect, it } from "vitest";

// Comprueba que la matriz de zonas horarias (npm run test:tz) de verdad cambia la zona del proceso.
// Si TZ no está definida (npm test común) no se exige nada.
const ESPERADO: Record<string, number> = {
  UTC: 0,
  "Asia/Tokyo": -540,
  "America/Los_Angeles": 480,
};

describe("T2: zona horaria del proceso", () => {
  it("la zona pedida con TZ es la que está activa (si no, la matriz no probaría nada)", () => {
    // Sin @types/node: se llega a `process` por globalThis.
    const zona = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env["TZ"];
    if (zona === undefined || ESPERADO[zona] === undefined) return;
    // 15 de enero: sin horario de verano en ninguna de las tres zonas
    const offset = new Date(2026, 0, 15, 12, 0, 0).getTimezoneOffset();
    expect(offset).toBe(ESPERADO[zona]);
  });
});
