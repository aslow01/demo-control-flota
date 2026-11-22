import { describe, expect, it } from "vitest";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import type { Documento, FechaCivil } from "../src/lib/dominio/tipos.ts";
import { estadoDeLicencia, hayDocumentoQueAmpare } from "../src/lib/dominio/vencimientos.ts";
import { documento } from "./ayuda.ts";

const H = "2026-11-18";

function licencia(parcial: Partial<Documento> = {}): Documento {
  return documento({ titular: { tipo: "conductor", id: "c1" }, tipo: "licencia", emitido: "2020-01-01", ...parcial });
}

describe("estadoDeLicencia (L1, L2, L5)", () => {
  it("L5: sin licencias cargadas -> faltante", () => {
    expect(estadoDeLicencia([], "c1", H)).toEqual({ vigente: false, motivo: "faltante" });
  });

  it("L5: la licencia de otro conductor, o un documento de otro tipo, no cuenta", () => {
    const docs = [licencia({ titular: { tipo: "conductor", id: "c2" } }), licencia({ tipo: "habilitacion-manejo" })];
    expect(estadoDeLicencia(docs, "c1", H)).toEqual({ vigente: false, motivo: "faltante" });
  });

  it("L5: única licencia que vence H - 3, fecha H -> vencida con su vencimiento", () => {
    const docs = [licencia({ vence: sumarDias(H, -3) })];
    expect(estadoDeLicencia(docs, "c1", H)).toEqual({ vigente: false, motivo: "vencida", vence: "2026-11-15" });
  });

  it("L2: vence el mismo día de la fecha -> vigente (todo el día)", () => {
    expect(estadoDeLicencia([licencia({ vence: H })], "c1", H)).toEqual({ vigente: true, vence: H });
  });

  it("L5: vieja vencida + renovación con emisión H + 2 -> posterior desde H + 2; con fecha H + 2 -> vigente", () => {
    const docs = [licencia({ id: "vieja", vence: sumarDias(H, -3) }), licencia({ id: "nueva", vence: "2031-01-01", emitido: sumarDias(H, 2), reemplazaA: "vieja" })];
    expect(estadoDeLicencia(docs, "c1", H)).toEqual({ vigente: false, motivo: "posterior", desde: "2026-11-20" });
    expect(estadoDeLicencia(docs, "c1", sumarDias(H, 2))).toEqual({ vigente: true, vence: "2031-01-01" });
  });

  it("L4, M1: renovación sin emisión cargada hoy -> vigente para H y posterior para H - 1", () => {
    const docs = [
      licencia({ id: "vieja", vence: sumarDias(H, -3) }),
      licencia({ id: "nueva", vence: "2031-01-01", emitido: null, cargado: "2026-11-18T15:00:00.000Z", reemplazaA: "vieja" }),
    ];
    expect(estadoDeLicencia(docs, "c1", H)).toEqual({ vigente: true, vence: "2031-01-01" });
    expect(estadoDeLicencia(docs, "c1", sumarDias(H, -1))).toEqual({ vigente: false, motivo: "posterior", desde: H });
  });

  it("M1: una carga a las 02:59:59.999Z del 18 cuenta como 17 (Argentina) y ampara el 17, no el 16", () => {
    const docs = [licencia({ emitido: null, cargado: "2026-11-18T02:59:59.999Z", vence: "2031-01-01" })];
    expect(estadoDeLicencia(docs, "c1", "2026-11-17")).toEqual({ vigente: true, vence: "2031-01-01" });
    expect(estadoDeLicencia(docs, "c1", "2026-11-16")).toEqual({ vigente: false, motivo: "posterior", desde: "2026-11-17" });
  });

  it("L5: dos licencias, una vencida y una vigente -> vigente con el vencimiento más tardío de las que amparan", () => {
    const docs = [licencia({ id: "a", vence: sumarDias(H, -10) }), licencia({ id: "b", vence: sumarDias(H, 100) }), licencia({ id: "c", vence: sumarDias(H, 50) })];
    expect(estadoDeLicencia(docs, "c1", H)).toEqual({ vigente: true, vence: sumarDias(H, 100) });
  });

  it("L5: vencida con varias licencias vencidas -> el vencimiento es el de la más tardía", () => {
    const docs = [licencia({ id: "a", vence: sumarDias(H, -10) }), licencia({ id: "b", vence: sumarDias(H, -4) })];
    expect(estadoDeLicencia(docs, "c1", H)).toEqual({ vigente: false, motivo: "vencida", vence: sumarDias(H, -4) });
  });

  it("L5: posterior toma el menor de los inicios entre las que vencen en la fecha o después", () => {
    const docs = [licencia({ id: "a", vence: "2030-01-01", emitido: sumarDias(H, 9) }), licencia({ id: "b", vence: "2031-01-01", emitido: sumarDias(H, 3) })];
    expect(estadoDeLicencia(docs, "c1", H)).toEqual({ vigente: false, motivo: "posterior", desde: sumarDias(H, 3) });
  });

  it("L1: invariante con hayDocumentoQueAmpare en una tabla de combinaciones", () => {
    const vences: FechaCivil[] = [sumarDias(H, -3), H, sumarDias(H, 5)];
    const emisiones: (FechaCivil | null)[] = [sumarDias(H, -30), H, sumarDias(H, 2), null];
    const cargas = ["2026-11-10T12:00:00.000Z", "2026-11-18T15:00:00.000Z"];
    const fechas = [sumarDias(H, -4), H, sumarDias(H, 2)];
    let casos = 0;
    for (const vence of vences) {
      for (const emitido of emisiones) {
        for (const cargado of cargas) {
          const docs = [licencia({ vence, emitido, cargado })];
          for (const f of fechas) {
            const e = estadoDeLicencia(docs, "c1", f);
            expect(e.vigente, `vence ${vence} emitido ${emitido} cargado ${cargado} fecha ${f}`).toBe(hayDocumentoQueAmpare(docs, { tipo: "conductor", id: "c1" }, "licencia", f));
            casos += 1;
          }
        }
      }
    }
    expect(casos).toBeGreaterThanOrEqual(20);
  });
});
