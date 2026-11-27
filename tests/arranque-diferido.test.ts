// Etapa 1 (rediseño): el generador de datos pesa unos 33 kB de fuente y quien ya tiene la demo guardada no lo necesita.
// `arranque.ts` lo pide con `import()` solo cuando hay que generar el ejemplo: primera visita, ejemplo de otro día sin
// cambios, formato viejo o dañado, sin almacenamiento y «Reiniciar demo». Quien vuelve el mismo día no lo baja.
import { describe, expect, it } from "vitest";
import { generar } from "../src/lib/datos/generador.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { arrancar, reiniciarDemo, SEMILLA_POR_DEFECTO } from "../src/lib/persistencia/arranque.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";
import type { Repositorio } from "../src/lib/persistencia/repositorio.ts";

const HOY = "2026-11-18";

async function repoCon(estado: Estado | null): Promise<RepositorioMemoria> {
  const repo = new RepositorioMemoria();
  if (estado !== null) await repo.reemplazarTodo(estado);
  return repo;
}

/** Un cargador del generador que cuenta cuántas veces se lo pidió. */
function cargadorContado(): { cargar: () => Promise<{ generar: typeof generar }>; pedidos: () => number } {
  let pedidos = 0;
  return {
    cargar: async () => {
      pedidos++;
      return { generar };
    },
    pedidos: () => pedidos,
  };
}

const almacenamiento =
  (repo: Repositorio): (() => Promise<Repositorio>) =>
  async () =>
    repo;

describe("el generador se baja solo cuando hace falta", () => {
  it("con datos guardados de hoy no se lo pide", async () => {
    const c = cargadorContado();
    const repo = await repoCon(generar(SEMILLA_POR_DEFECTO, HOY));
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), cargarGenerador: c.cargar });
    expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(c.pedidos()).toBe(0);
  });

  it("con datos modificados de otro día (se conservan con un aviso) tampoco", async () => {
    const c = cargadorContado();
    const viejo = generar(SEMILLA_POR_DEFECTO, "2026-11-10");
    viejo.meta.modificada = true;
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(viejo)), cargarGenerador: c.cargar });
    expect(r.avisos).toEqual([{ tipo: "datos-de-otra-fecha", fechaBase: "2026-11-10" }]);
    expect(c.pedidos()).toBe(0);
  });

  it("primera visita: lo pide una vez", async () => {
    const c = cargadorContado();
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(null)), cargarGenerador: c.cargar });
    expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(c.pedidos()).toBe(1);
  });

  it("ejemplo intacto de otro día: lo pide para correrlo a hoy", async () => {
    const c = cargadorContado();
    const repo = await repoCon(generar(SEMILLA_POR_DEFECTO, "2026-11-10"));
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), cargarGenerador: c.cargar });
    expect(r.estado.meta.fechaBase).toBe(HOY);
    expect(c.pedidos()).toBe(1);
  });

  it("formato dañado: lo pide para volver al ejemplo", async () => {
    const c = cargadorContado();
    const roto = generar(SEMILLA_POR_DEFECTO, HOY);
    roto.meta.versionEsquema = 0;
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(roto)), cargarGenerador: c.cargar });
    expect(r.avisos).toEqual([{ tipo: "esquema-actualizado" }]);
    expect(c.pedidos()).toBe(1);
  });

  it("sin almacenamiento: lo pide para armar el ejemplo en memoria", async () => {
    const c = cargadorContado();
    const r = await arrancar({
      hoy: HOY,
      abrirAlmacenamiento: () => Promise.reject(new Error("sin IndexedDB")),
      cargarGenerador: c.cargar,
    });
    expect(r.enMemoria).toBe(true);
    expect(c.pedidos()).toBe(1);
  });

  it("«Reiniciar demo» lo pide y conserva la semilla", async () => {
    const c = cargadorContado();
    const actual = generar(7, HOY);
    const repo = await repoCon(actual);
    const nuevo = await reiniciarDemo(repo, actual, HOY, c.cargar);
    expect(nuevo).toEqual(generar(7, HOY));
    expect(c.pedidos()).toBe(1);
  });

  it("sin cargador propio usa el `import()` real y genera lo mismo", async () => {
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(null)) });
    expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
  });
});
