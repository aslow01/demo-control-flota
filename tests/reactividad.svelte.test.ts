import { tick } from "svelte";
import { describe, expect, it } from "vitest";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import { EstadoApp } from "../src/lib/estado/app.svelte.ts";
import { aHash } from "../src/lib/estado/enrutador.ts";
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
    ubicacion.irA("#/movilidades");
    await tick();
    limpiar();
    expect(vistas).toEqual(["inicio|Inicio · Control de flota (demo)", "movilidades|Movilidades · Control de flota (demo)"]);
  });

  it("R3: el efecto que mueve el foco y sube la página (lee versionDePantalla) NO corre con un filtro ni con cada letra del buscador; el que relee la consulta sí", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/movilidades");
    let focoYScroll = 0;
    const consultas: string[] = [];
    const limpiar = $effect.root(() => {
      $effect(() => {
        void app.versionDePantalla; // lo que lee App.svelte para llevar el foco al h1
        focoYScroll++;
      });
      $effect(() => {
        void app.versionDeConsulta; // lo que lee la pantalla de Movilidades para releer su filtro y búsqueda
        consultas.push(aHash(app.ruta));
      });
    });
    await tick();
    expect([focoYScroll, consultas]).toEqual([1, ["#/movilidades"]]);

    app.irA({ tipo: "movilidades", filtro: "no-pueden-salir" });
    await tick();
    for (const q of ["h", "hi", "hil"]) {
      app.ajustarConsulta({ tipo: "movilidades", filtro: "no-pueden-salir", q });
      await tick(); // una letra por vez, como el teclado
    }
    expect(focoYScroll).toBe(1);
    expect(consultas).toEqual(["#/movilidades", "#/movilidades?filtro=bloqueadas", "#/movilidades?filtro=bloqueadas&q=h", "#/movilidades?filtro=bloqueadas&q=hi", "#/movilidades?filtro=bloqueadas&q=hil"]);

    ubicacion.irA("#/vencimientos"); // otra pantalla: ahora sí
    await tick();
    limpiar();
    expect(focoYScroll).toBe(2);
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
  it("renovar un documento vuelve a correr los efectos que leen el centro de alertas (el protagonista baja de 4 a 3 sin recargar)", async () => {
    const { app } = await iniciada();
    const seguro = app.estado?.documentos.find((d) => d.tipo === "seguro" && d.vence === "2026-11-17");
    if (seguro === undefined) throw new Error("falta el caso C01");
    const vistas: string[] = [];
    const limpiar = $effect.root(() => {
      $effect(() => {
        const c = app.centroDeAlertas;
        if (c !== null) vistas.push(`${c.protagonista.cifra}|${c.vencimientos.total}`);
      });
    });
    await tick();
    const r = await app.renovarDocumento(seguro.id, { numero: "DEMO-NUEVO-1", emisor: "", vence: "2027-11-18", emitido: "" });
    await tick();
    limpiar();
    expect(r.ok).toBe(true);
    expect(vistas).toEqual(["4|12", "3|11"]);
  });
  it("la ficha se recalcula sola con cada comando y el mensaje de llegada se va al salir de ella (paso 4.4)", async () => {
    const ubicacion = ubicacionEnMemoria("#/movilidades");
    const app = new EstadoApp({
      reloj: crearReloj(() => new Date("2026-11-18T15:00:00.000Z")),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion,
      crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
    });
    await app.iniciar();
    const vistas: string[] = [];
    const limpiar = $effect.root(() => {
      $effect(() => {
        const f = app.fichaDeUnidad;
        if (f !== null && f.encontrada) vistas.push(`${f.patente}|${f.aptitud.categoria}|${f.historial.total}|${app.mensajeDeLlegada ?? "-"}`);
      });
    });
    await tick();
    expect(vistas).toEqual([]);
    const r = await app.agregarUnidad({ patente: "zk 999 aa", interno: "30", tipo: "utilitario", marca: "Peugeot", modelo: "Partner", anio: "2025", proyectoId: "proy-base", conductorId: "" });
    await tick();
    expect(r.ok).toBe(true);
    await app.ponerFueraDeServicio(app.estado!.unidades.find((u) => u.patente === "ZK999AA")!.id, { motivo: "En taller: cambio de embrague" });
    await tick();
    ubicacion.irA("#/movilidades");
    await tick();
    limpiar();
    const mensaje = "Unidad agregada. Le faltan 3 documentos: cárguelos desde aquí.";
    expect(vistas).toEqual([`ZK999AA|no-puede-salir|1|${mensaje}`, `ZK999AA|fuera-de-servicio|2|${mensaje}`]);
    expect(app.mensajeDeLlegada).toBeNull();
  });
});
