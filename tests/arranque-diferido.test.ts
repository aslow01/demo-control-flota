// Etapa 1 (rediseño): el generador de datos pesa unos 33 kB de fuente y quien ya tiene la demo guardada no lo necesita.
// `arranque.ts` lo pide con `import()` solo cuando hay que generar el ejemplo: primera visita, ejemplo de otro día sin
// cambios, formato viejo o dañado, sin almacenamiento y «Reiniciar demo». Quien vuelve el mismo día no lo baja.
import { describe, expect, it } from "vitest";
import { generar } from "../src/lib/datos/generador.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { ErrorDeDescarga, PLAZO_DE_DESCARGA_MS } from "../src/lib/descarga.ts";
import { SEMILLA_POR_DEFECTO } from "../src/lib/datos/constantes.ts";
import { arrancar, reiniciarDemo } from "../src/lib/persistencia/arranque.ts";
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

// Un generador que no baja, que se cuelga o que tarda no es un problema del almacenamiento: no se lo confunde con «este navegador no permite guardar datos», no se lo
// reintenta (un pedido colgado se repite colgado) y su demora no gasta el plazo del almacenamiento.
const PLAZO_ALMACENAMIENTO_MS = 20;
const SIN_RED = (): Error => new TypeError("Failed to fetch dynamically imported module");

/** Un cargador que cuenta los pedidos y se comporta como diga `respuesta` (la primera vez, la segunda…). */
function cargadorQue(respuesta: (pedido: number) => Promise<{ generar: typeof generar }>): { cargar: () => Promise<{ generar: typeof generar }>; pedidos: () => number } {
  let pedidos = 0;
  return {
    cargar: () => respuesta(++pedidos),
    pedidos: () => pedidos,
  };
}

const llegaDespues = (ms: number): Promise<{ generar: typeof generar }> => new Promise((resolver) => setTimeout(() => resolver({ generar }), ms));

describe("el generador que no baja no se confunde con un almacenamiento que no anda", () => {
  it("primera visita con el generador caído: rechaza con el error de descarga, lo pide una sola vez y no toca lo guardado", async () => {
    const repo: Repositorio = await repoCon(null);
    let cerrada = 0;
    repo.cerrar = () => void cerrada++;
    const c = cargadorQue(() => Promise.reject(SIN_RED()));
    await expect(arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), cargarGenerador: c.cargar })).rejects.toBeInstanceOf(ErrorDeDescarga);
    expect(c.pedidos()).toBe(1);
    expect(await repo.cargar()).toBeNull();
    expect(cerrada).toBe(1);
  });

  it("si el generador falla una vez no se lo vuelve a pedir, aunque la segunda hubiera bajado", async () => {
    const c = cargadorQue((n) => (n === 1 ? Promise.reject(SIN_RED()) : Promise.resolve({ generar })));
    const resultado = arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(null)), cargarGenerador: c.cargar });
    await expect(resultado).rejects.toMatchObject({ causa: "red" });
    expect(c.pedidos()).toBe(1);
  });

  it("con el generador colgado, vencido su plazo, rechaza con la causa «plazo» (no queda esperando para siempre)", async () => {
    const c = cargadorQue(() => new Promise<never>(() => {}));
    const resultado = arrancar({
      hoy: HOY,
      abrirAlmacenamiento: almacenamiento(await repoCon(null)),
      cargarGenerador: c.cargar,
      plazoGeneradorMs: 40,
      plazoAbrirMs: PLAZO_ALMACENAMIENTO_MS,
    });
    await expect(resultado).rejects.toMatchObject({ causa: "plazo" });
    expect(c.pedidos()).toBe(1);
  });

  it("un generador lento que llega antes de su plazo: la demo arranca con almacenamiento y guarda (su demora no gasta el plazo del almacenamiento)", async () => {
    const repo = await repoCon(null);
    const c = cargadorQue(() => llegaDespues(5 * PLAZO_ALMACENAMIENTO_MS));
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), cargarGenerador: c.cargar, plazoAbrirMs: PLAZO_ALMACENAMIENTO_MS, plazoGeneradorMs: 2000 });
    expect(r.enMemoria).toBe(false);
    expect(r.avisos).toEqual([]);
    expect(r.repositorio).toBe(repo);
    expect(await repo.cargar()).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(c.pedidos()).toBe(1);
  });

  it("el plazo del almacenamiento sigue siendo uno solo para leer y escribir: una escritura que se cuelga después de un generador lento cae a la memoria", async () => {
    const repo = await repoCon(null);
    repo.reemplazarTodo = () => new Promise<never>(() => {});
    const c = cargadorQue(() => llegaDespues(3 * PLAZO_ALMACENAMIENTO_MS));
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), cargarGenerador: c.cargar, plazoAbrirMs: PLAZO_ALMACENAMIENTO_MS, plazoGeneradorMs: 2000 });
    expect(r.enMemoria).toBe(true);
    expect(r.avisos).toEqual([{ tipo: "sin-almacenamiento" }]);
    expect(c.pedidos(), "el generador ya estaba bajado: no se lo pide de nuevo para la memoria").toBe(1);
  });

  it("si el almacenamiento falla después de bajar el generador, la memoria usa el mismo (un solo pedido)", async () => {
    const repo = await repoCon(null);
    repo.reemplazarTodo = async () => {
      throw new Error("sin cuota");
    };
    const c = cargadorContado();
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), cargarGenerador: c.cargar });
    expect(r.enMemoria).toBe(true);
    expect(c.pedidos()).toBe(1);
  });

  it("sin almacenamiento y con el generador caído: también rechaza con el error de descarga", async () => {
    const c = cargadorQue(() => Promise.reject(SIN_RED()));
    const resultado = arrancar({ hoy: HOY, abrirAlmacenamiento: () => Promise.reject(new Error("sin IndexedDB")), cargarGenerador: c.cargar });
    await expect(resultado).rejects.toBeInstanceOf(ErrorDeDescarga);
    expect(c.pedidos()).toBe(1);
  });

  it("formato viejo o dañado con el generador caído: no hay con qué seguir y rechaza (sin tocar lo guardado)", async () => {
    const roto = generar(SEMILLA_POR_DEFECTO, HOY);
    roto.meta.versionEsquema = 0;
    const repo = await repoCon(roto);
    const c = cargadorQue(() => Promise.reject(SIN_RED()));
    await expect(arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), cargarGenerador: c.cargar })).rejects.toBeInstanceOf(ErrorDeDescarga);
    expect((await repo.cargar())?.meta.versionEsquema).toBe(0);
  });

  it("datos guardados de otro día sin modificar y el generador caído: arranca con lo guardado y avisa que son de otra fecha (no pierde el acceso)", async () => {
    const viejo = generar(SEMILLA_POR_DEFECTO, "2026-11-10");
    const repo = await repoCon(viejo);
    const c = cargadorQue(() => Promise.reject(SIN_RED()));
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), cargarGenerador: c.cargar });
    expect(r.enMemoria).toBe(false);
    expect(r.repositorio).toBe(repo);
    expect(r.estado.meta.fechaBase).toBe("2026-11-10");
    expect(r.estado.meta.modificada).toBe(false);
    expect(r.avisos).toEqual([{ tipo: "datos-de-otra-fecha", fechaBase: "2026-11-10" }]);
    expect(c.pedidos()).toBe(1);
    expect((await repo.cargar())?.meta.fechaBase, "no se escribió nada").toBe("2026-11-10");
  });

  it("lo mismo con el generador colgado: espera su plazo y arranca con lo guardado", async () => {
    const repo = await repoCon(generar(SEMILLA_POR_DEFECTO, "2026-11-10"));
    const c = cargadorQue(() => new Promise<never>(() => {}));
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), cargarGenerador: c.cargar, plazoGeneradorMs: 40, plazoAbrirMs: 1000 });
    expect(r.avisos).toEqual([{ tipo: "datos-de-otra-fecha", fechaBase: "2026-11-10" }]);
  });

  it("datos de otro día sin modificar con el generador que llega tarde pero llega: se corre a hoy y se guarda", async () => {
    const repo = await repoCon(generar(SEMILLA_POR_DEFECTO, "2026-11-10"));
    const c = cargadorQue(() => llegaDespues(5 * PLAZO_ALMACENAMIENTO_MS));
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), cargarGenerador: c.cargar, plazoAbrirMs: PLAZO_ALMACENAMIENTO_MS, plazoGeneradorMs: 2000 });
    expect(r.avisos).toEqual([]);
    expect((await repo.cargar())?.meta.fechaBase).toBe(HOY);
  });

  it("un error del almacenamiento mientras se corre el ejemplo a hoy sigue siendo «sin almacenamiento» (no se confunde con la descarga)", async () => {
    const repo = await repoCon(generar(SEMILLA_POR_DEFECTO, "2026-11-10"));
    repo.reemplazarTodo = async () => {
      throw new Error("sin cuota");
    };
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), cargarGenerador: cargadorContado().cargar });
    expect(r.enMemoria).toBe(true);
    expect(r.avisos).toEqual([{ tipo: "sin-almacenamiento" }]);
  });

  it("«Reiniciar demo» con el generador caído rechaza con el error de descarga y deja todo como estaba", async () => {
    const actual = generar(7, HOY);
    const repo = await repoCon(actual);
    const c = cargadorQue(() => Promise.reject(SIN_RED()));
    await expect(reiniciarDemo(repo, actual, HOY, c.cargar)).rejects.toBeInstanceOf(ErrorDeDescarga);
    expect(await repo.cargar()).toEqual(actual);
  });

  it("«Reiniciar demo» con el generador colgado no espera para siempre", async () => {
    const actual = generar(7, HOY);
    const repo = await repoCon(actual);
    const c = cargadorQue(() => new Promise<never>(() => {}));
    await expect(reiniciarDemo(repo, actual, HOY, c.cargar, 30)).rejects.toMatchObject({ causa: "plazo" });
    expect(await repo.cargar()).toEqual(actual);
  });

  it("el plazo de una descarga (el generador, un trozo de escritura) por defecto es de 15 segundos", () => {
    expect(PLAZO_DE_DESCARGA_MS).toBe(15_000);
  });
});
