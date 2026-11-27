// Código M1 y QA M-1 (paso 4.5): un parte guardado con la forma rota no puede tumbar la aplicación. El arranque lee todos los partes con `parteLegible`
// y deja una sola vía de lectura: las alertas, la flota, el centro de alertas y la ficha ya ven partes bien formados.
import { describe, expect, it } from "vitest";
import { generar, SEMILLA_POR_DEFECTO } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import type { Estado, Parte } from "../src/lib/dominio/tipos.ts";
import { EstadoApp } from "../src/lib/estado/app.svelte.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { arrancar } from "../src/lib/persistencia/arranque.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";
import { leerFicha } from "../src/lib/estado/ficha.ts";

const HOY = "2026-11-18";
const MEDIODIA = "2026-11-18T15:00:00.000Z";

type Dañar = (p: Record<string, unknown>) => void;

async function repoConParteRoto(dañar: Dañar, quePartes: (p: Parte) => boolean = (p) => p.estado === "enviado"): Promise<{ repo: RepositorioMemoria; parte: Parte }> {
  const estado = generar(SEMILLA_POR_DEFECTO, HOY);
  const parte = estado.partes.find(quePartes);
  if (parte === undefined) throw new Error("el ejemplo no tiene ese parte");
  dañar(parte as unknown as Record<string, unknown>);
  const repo = new RepositorioMemoria();
  await repo.reemplazarTodo(estado);
  return { repo, parte };
}

const rotos: [string, Dañar][] = [
  ["sin advertenciasAceptadas", (p) => delete p["advertenciasAceptadas"]],
  ["con advertenciasAceptadas con basura", (p) => (p["advertenciasAceptadas"] = [null, "x", { tipo: "salto-km" }])],
  ["con el checklist vacío", (p) => (p["checklist"] = {})],
  ["con puntos del checklist nulos o de otro tipo", (p) => Object.assign(p["checklist"] as object, { frenos: null, luces: "x", cabina: { estado: "con-novedad" } })],
  ["sin otraNovedad", (p) => delete p["otraNovedad"]],
  ["con otraNovedad de otro tipo", (p) => (p["otraNovedad"] = "x")],
  ["con km de texto", (p) => Object.assign(p, { kmInicio: "abc", kmFin: "xyz" })],
  ["sin kmInicio", (p) => delete p["kmInicio"]],
];

describe("D7 y código M1: el arranque normaliza los partes con `parteLegible`", () => {
  for (const [nombre, dañar] of rotos) {
    it(`parte ${nombre}: sin aviso de esquema, las alertas se calculan y el parte queda con la forma completa`, async () => {
      const { repo, parte } = await repoConParteRoto(dañar);
      const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: async () => repo });
      expect(r.avisos).toEqual([]);
      expect(() => calcularAlertas(r.estado, HOY)).not.toThrow();
      const leido = r.estado.partes.find((p) => p.id === parte.id);
      expect(leido).toBeDefined();
      expect(Array.isArray(leido?.advertenciasAceptadas)).toBe(true);
      expect(Object.keys(leido?.checklist ?? {})).toHaveLength(14);
      expect(leido?.kmInicio === null || typeof leido?.kmInicio === "number").toBe(true);
    });
  }

  it("un parte intacto queda igual (el ejemplo completo no cambia)", async () => {
    const estado = generar(SEMILLA_POR_DEFECTO, HOY);
    const repo = new RepositorioMemoria();
    await repo.reemplazarTodo(estado);
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: async () => repo });
    expect(r.estado.partes).toEqual(estado.partes);
  });

  it("un borrador roto sigue siendo un borrador, con lo que se pueda leer", async () => {
    const { repo, parte } = await repoConParteRoto((p) => (p["checklist"] = {}), (p) => p.estado === "borrador");
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: async () => repo });
    const leido = r.estado.partes.find((p) => p.id === parte.id);
    expect(leido?.estado).toBe("borrador");
    expect(leido?.checklist.frenos).toEqual({ estado: "sin-responder" });
  });

  it("un registro que no se puede leer como parte (estado inventado, fecha imposible) cuenta como otro formato: se regenera el ejemplo y se avisa", async () => {
    for (const dañar of [(p: Record<string, unknown>) => (p["estado"] = "raro"), (p: Record<string, unknown>) => (p["fecha"] = "2026-13-45")]) {
      const { repo } = await repoConParteRoto(dañar);
      const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: async () => repo });
      expect(r.avisos).toEqual([{ tipo: "esquema-actualizado" }]);
      expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    }
  });
});

async function iniciarApp(repo: RepositorioMemoria, hash: string): Promise<EstadoApp> {
  const app = new EstadoApp({
    reloj: crearReloj(() => new Date(Date.parse(MEDIODIA))),
    abrirAlmacenamiento: async () => repo,
    ubicacion: ubicacionEnMemoria(hash),
    crearAvisoPestanas: () => ({ avisarCambio: () => {}, cerrar: () => {} }),
  });
  await app.iniciar();
  return app;
}

describe("QA M-1: con un parte roto, la ficha y el resto de las pantallas se dibujan", () => {
  for (const [nombre, dañar] of rotos) {
    it(`parte ${nombre}: ficha de la unidad, flota, centro de alertas y alertas sin errores`, async () => {
      const { repo, parte } = await repoConParteRoto(dañar);
      const estado = (await repo.cargar()) as Estado;
      const unidad = estado.unidades.find((u) => u.id === parte.unidadId);
      const app = await iniciarApp(repo, `#/unidad/${unidad?.patente}`);
      expect(app.fase).toBe("lista");
      expect(() => leerFicha(app)).not.toThrow();
      expect(leerFicha(app)?.encontrada).toBe(true);
      expect(app.alertas).not.toBeNull();
    });
  }
});

describe("«Actualizar» (otra pestaña escribió): lo leído también se normaliza", () => {
  it("un parte roto que llega por `actualizar` se lee completo", async () => {
    const repo = new RepositorioMemoria();
    await repo.reemplazarTodo(generar(SEMILLA_POR_DEFECTO, HOY));
    const app = await iniciarApp(repo, "#/inicio");
    const roto = (await repo.cargar()) as Estado;
    const p = roto.partes.find((x) => x.estado === "enviado")!;
    delete (p as unknown as Record<string, unknown>)["advertenciasAceptadas"];
    await repo.reemplazarTodo(roto);
    const r = await app.actualizar();
    expect(r.ok).toBe(true);
    expect(app.estado?.partes.find((x) => x.id === p.id)?.advertenciasAceptadas).toEqual([]);
    expect(app.alertas).not.toBeNull();
  });

  it("si llega un registro que no es un parte, `actualizar` falla con el mensaje de lectura y no toca lo que se ve", async () => {
    const repo = new RepositorioMemoria();
    await repo.reemplazarTodo(generar(SEMILLA_POR_DEFECTO, HOY));
    const app = await iniciarApp(repo, "#/inicio");
    const antes = app.estado;
    const roto = (await repo.cargar()) as Estado;
    (roto.partes[0] as unknown as Record<string, unknown>)["estado"] = "raro";
    await repo.reemplazarTodo(roto);
    const r = await app.actualizar();
    expect(r.ok).toBe(false);
    expect(app.estado).toBe(antes);
  });
});
