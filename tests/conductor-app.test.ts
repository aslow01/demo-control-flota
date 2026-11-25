// E2-P (3.10) conectado con la aplicación: Mis partes y el aviso de vencimiento del conductor, con el ejemplo del generador (hoy 18/11/2026).
// ZYN 469 es de Andrés Echegaray (c-01) y su revisión técnica vence hoy; ZI 442 TU es de c-02 y la suya vence mañana.
import { describe, expect, it } from "vitest";
import type { Perfil } from "../src/lib/dominio/tipos.ts";
import { EstadoApp } from "../src/lib/estado/app.svelte.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";

const C01: Perfil = { tipo: "conductor", conductorId: "c-01" };
const C02: Perfil = { tipo: "conductor", conductorId: "c-02" };

async function iniciada(perfil?: Perfil, hash = "#/") {
  const ubicacion = ubicacionEnMemoria(hash);
  const app = new EstadoApp({
    reloj: crearReloj(() => new Date("2026-11-18T15:00:00.000Z")),
    abrirAlmacenamiento: async () => new RepositorioMemoria(),
    ubicacion,
    crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
  });
  await app.iniciar();
  if (perfil !== undefined) await app.cambiarPerfil(perfil);
  return { app, ubicacion };
}

describe("Mis partes en la aplicación", () => {
  it("antes de iniciar no hay nada", () => {
    const app = new EstadoApp({
      reloj: crearReloj(() => new Date("2026-11-18T15:00:00.000Z")),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion: ubicacionEnMemoria(),
    });
    expect(app.misPartes()).toBeNull();
  });

  it("el encargado no tiene Mis partes; `#/conductor/partes` lo lleva a Inicio", async () => {
    const { app } = await iniciada(undefined, "#/conductor/partes");
    expect(app.misPartes()).toBeNull();
    expect(app.ruta).toEqual({ tipo: "inicio" });
  });

  it("el conductor ve sus últimos partes cerrados en `#/conductor/partes`, los mismos que en Hoy", async () => {
    const { app, ubicacion } = await iniciada(C01);
    ubicacion.irA("#/conductor/partes");
    expect(app.ruta).toEqual({ tipo: "mis-partes" });
    expect(app.nombrePantalla).toBe("Mis partes");
    expect(app.padre).toBeNull();
    const v = app.misPartes();
    expect(v?.titulo).toBe("Mis partes");
    expect(v?.conductor).toBe("Andrés Echegaray");
    expect(v?.filas.length).toBeGreaterThan(0);
    expect(v?.filas.length).toBeLessThanOrEqual(5);
    expect(v?.filas).toEqual(app.inicioDelConductor()?.ultimosPartes.filas);
    for (const f of v?.filas ?? []) expect(f.href).toMatch(/^#\/parte\/[A-Z0-9]+\/\d{4}-\d{2}-\d{2}$/);
  });

  it("«Ver todos» de Hoy lleva a esa pantalla", async () => {
    const { app, ubicacion } = await iniciada(C01);
    const href = app.inicioDelConductor()?.ultimosPartes.verTodos?.href ?? "";
    ubicacion.irA(href);
    expect(app.ruta.tipo).toBe("mis-partes");
  });

  it("cambiar de conductor cambia la lista", async () => {
    const { app } = await iniciada(C01);
    const a = app.misPartes()?.filas.map((f) => f.parteId);
    await app.cambiarPerfil(C02);
    const b = app.misPartes();
    expect(b?.conductor).not.toBe("Andrés Echegaray");
    expect(b?.filas.map((f) => f.parteId)).not.toEqual(a);
  });
});

describe("el aviso de que algo de su unidad vence, en la aplicación", () => {
  it("Andrés: «Revisión técnica» vence hoy, y puede empezar la revisión", async () => {
    const { app } = await iniciada(C01);
    const v = app.inicioDelConductor();
    expect(v?.hoyEstado.tipo).toBe("sin-parte");
    expect(v?.avisoDeUnidad).toEqual({ tipoDocumento: "revision-tecnica", documento: "Revisión técnica", dias: 0, venceHoy: true, vence: "18/11/2026", estado: "Vence hoy" });
  });

  it("c-02: la suya vence mañana", async () => {
    const { app } = await iniciada(C02);
    expect(app.inicioDelConductor()?.avisoDeUnidad).toMatchObject({ documento: "Revisión técnica", dias: 1, venceHoy: false, estado: "Vence mañana" });
  });

  it("el aviso se va cuando el parte de hoy ya no se puede empezar (unidad fuera de servicio)", async () => {
    const { app } = await iniciada({ tipo: "conductor", conductorId: "c-12" });
    expect(app.inicioDelConductor()?.hoyEstado.tipo).toBe("fuera-de-servicio");
    expect(app.inicioDelConductor()?.avisoDeUnidad).toBeNull();
  });
});
