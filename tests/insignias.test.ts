// Las cuentas de las insignias del marco salen del centro de alertas: Inicio dice lo mismo que su cifra cobre y Operación diaria, lo mismo que sus solapas.
import { describe, expect, it } from "vitest";
import { cuentasDeNavegacion } from "../src/componentes/insignias.ts";
import { EstadoApp } from "../src/lib/estado/app.svelte.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";

async function iniciada(): Promise<EstadoApp> {
  const app = new EstadoApp({
    reloj: crearReloj(() => new Date("2026-11-18T15:00:00.000Z")),
    abrirAlmacenamiento: async () => new RepositorioMemoria(),
    ubicacion: ubicacionEnMemoria("#/"),
    crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
  });
  await app.iniciar();
  return app;
}

describe("cuentas de las insignias del marco", () => {
  it("sin datos cargados no hay ninguna cuenta", () => {
    expect(cuentasDeNavegacion(null)).toEqual({ noDisponibles: 0, rotuloNoDisponibles: "", vencidos: 0, checklists: 0, novedades: 0 });
  });

  it("salen de las cifras de Inicio y de las solapas de Operación diaria, no de otro cálculo", async () => {
    const app = await iniciada();
    const centro = app.centroDeAlertas;
    expect(centro).not.toBeNull();
    if (centro === null) return;
    const c = cuentasDeNavegacion(centro);
    expect(c.noDisponibles).toBe(centro.cifras.noDisponibles.valor);
    expect(c.rotuloNoDisponibles).toBe(centro.cifras.noDisponibles.rotulo);
    expect(c.vencidos).toBe(centro.cifras.vencidos.valor);
    expect(c.checklists).toBe(centro.operacionDiaria.solapas[0].cantidad);
    expect(c.novedades).toBe(centro.operacionDiaria.solapas[1].cantidad);
    // Operación diaria suma las dos solapas: es el mismo total que la insignia de «Operación».
    expect(c.checklists + c.novedades).toBe(centro.operacionDiaria.total);
  });

  it("con la flota de ejemplo hay algo que contar en cada insignia", async () => {
    const c = cuentasDeNavegacion((await iniciada()).centroDeAlertas);
    expect(c.noDisponibles).toBeGreaterThan(0);
    expect(c.vencidos).toBeGreaterThan(0);
    expect(c.checklists + c.novedades).toBeGreaterThan(0);
  });
});
