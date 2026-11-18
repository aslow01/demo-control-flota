import { tick } from "svelte";
import { describe, expect, it } from "vitest";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import { EstadoApp } from "../src/lib/estado/app.svelte.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";

// Este archivo se llama *.svelte.test.ts para que Svelte compile los runes (`$effect.root`): prueba la reactividad
// de verdad, la que van a usar las pantallas: un efecto que lee el estado se vuelve a correr cuando cambia.
describe("reactividad del estado de la aplicación", () => {
  async function iniciada() {
    const ubicacion = ubicacionEnMemoria();
    const app = new EstadoApp({
      reloj: crearReloj(() => new Date("2026-11-18T15:00:00.000Z")),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion,
      crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
    });
    await app.iniciar();
    return { app, ubicacion };
  }

  it("cambiar el hash vuelve a correr los efectos que leen la ruta y el título", async () => {
    const { app, ubicacion } = await iniciada();
    const vistas: string[] = [];
    const limpiar = $effect.root(() => {
      $effect(() => {
        vistas.push(`${app.ruta.tipo}|${app.titulo}`);
      });
    });
    await tick();
    ubicacion.irA("#/flota");
    await tick();
    limpiar();
    expect(vistas).toEqual(["alertas|Centro de alertas · Control de flota (demo)", "flota|Flota · Control de flota (demo)"]);
  });

  it("un comando actualiza al mismo tiempo las alertas y el estado que ven los efectos (y no se recalcula por gusto)", async () => {
    const { app } = await iniciada();
    const protagonistas: (number | undefined)[] = [];
    let corridas = 0;
    const limpiar = $effect.root(() => {
      $effect(() => {
        corridas++;
        protagonistas.push(app.alertas?.resumen.protagonista);
      });
    });
    await tick();
    const estado = app.estado!;
    const unidad = estado.unidades.find((u) => u.patente === "ZK214BD")!;
    const doc = estado.documentos.find((d) => d.titular.id === unidad.id && d.tipo === "seguro")!;
    const comando: Comando = { tipo: "renovarDocumento", documentoId: doc.id, numero: "DEMO-NUEVO", emisor: "", vence: "2027-11-18", emitido: null };
    await app.ejecutar(comando);
    await tick();
    limpiar();
    expect(protagonistas).toEqual([4, 3]);
    expect(corridas).toBe(2);
  });

  it("el estado grande no se vuelve proxy: lo que se le pasa al repositorio se puede clonar", async () => {
    const { app } = await iniciada();
    expect(() => structuredClone(app.estado)).not.toThrow();
  });
});
