import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { generar, VERSION_ESQUEMA } from "../src/lib/datos/generador.ts";
import { sinCambios } from "../src/lib/dominio/estado.ts";
import { TEXTO_AVISO, textoDatosDeOtraFecha } from "../src/lib/dominio/textos.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { arrancar, cambiarPerfil, PLAZO_ABRIR_MS, reiniciarDemo, SEMILLA_POR_DEFECTO } from "../src/lib/persistencia/arranque.ts";
import { abrirIndexedDB } from "../src/lib/persistencia/indexeddb.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";
import type { Repositorio } from "../src/lib/persistencia/repositorio.ts";

const HOY = "2026-11-18";

/** Un almacenamiento "que abre bien": devuelve siempre el mismo repositorio. */
function almacenamiento(repo: Repositorio): () => Promise<Repositorio> {
  return async () => repo;
}

async function repoCon(estado: Estado | null): Promise<RepositorioMemoria> {
  const repo = new RepositorioMemoria();
  if (estado !== null) await repo.reemplazarTodo(estado);
  return repo;
}

function cerrar(repo: Repositorio): void {
  (repo as { cerrar?: () => void }).cerrar?.();
}

describe("D4: primera visita", () => {
  it("con la base vacía genera el ejemplo con fechaBase = hoy, sin modificar, y lo guarda", async () => {
    const repo = await repoCon(null);
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo) });
    expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(r.estado.meta.modificada).toBe(false);
    expect(r.estado.meta.fechaBase).toBe(HOY);
    expect(r.avisos).toEqual([]);
    expect(r.enMemoria).toBe(false);
    expect(r.repositorio).toBe(repo);
    expect(await repo.cargar()).toEqual(r.estado);
  });

  it("la semilla se puede elegir", async () => {
    const r = await arrancar({ hoy: HOY, semilla: 7, abrirAlmacenamiento: almacenamiento(await repoCon(null)) });
    expect(r.estado).toEqual(generar(7, HOY));
  });

  it("'Preparando…' solo se avisa si el arranque tarda más del umbral", async () => {
    const lento = async (): Promise<Repositorio> => {
      await new Promise((resolver) => setTimeout(resolver, 60));
      return repoCon(null);
    };
    let avisos = 0;
    await arrancar({ hoy: HOY, abrirAlmacenamiento: lento, umbralPreparandoMs: 10, alTardar: () => avisos++ });
    expect(avisos).toBe(1);

    avisos = 0;
    await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(null)), umbralPreparandoMs: 1000, alTardar: () => avisos++ });
    expect(avisos).toBe(0);
  });

  it("el texto de 'Preparando' es el del diseño", () => {
    expect(TEXTO_AVISO.preparando).toBe("Preparando la flota de ejemplo…");
  });
});

describe("D5: fechas del ejemplo al día", () => {
  it("sin cambios del visitante y fechaBase vieja: se regenera en silencio con fechaBase = hoy y se guarda", async () => {
    const viejo = generar(SEMILLA_POR_DEFECTO, "2026-11-10");
    const repo = await repoCon(viejo);
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo) });
    expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(r.avisos).toEqual([]);
    expect(await repo.cargar()).toEqual(r.estado);
  });

  it("al regenerar se conserva el perfil elegido y la semilla guardada", async () => {
    const viejo = generar(99, "2026-11-10");
    const conductorId = viejo.conductores[0]!.id;
    viejo.meta.perfil = { tipo: "conductor", conductorId };
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(viejo)) });
    expect(r.estado.meta.perfil).toEqual({ tipo: "conductor", conductorId });
    expect(r.estado.meta.semilla).toBe(99);
    expect(r.estado.meta.fechaBase).toBe(HOY);
  });

  it("si el perfil guardado apunta a un conductor que ya no existe, vuelve al encargado", async () => {
    const viejo = generar(SEMILLA_POR_DEFECTO, "2026-11-10");
    viejo.meta.perfil = { tipo: "conductor", conductorId: "c-no-existe" };
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(viejo)) });
    expect(r.estado.meta.perfil).toEqual({ tipo: "encargado" });
  });

  it("con cambios del visitante se conservan los datos y aparece el aviso con la fecha del ejemplo", async () => {
    const viejo = generar(SEMILLA_POR_DEFECTO, "2026-11-10");
    viejo.meta.modificada = true;
    const repo = await repoCon(viejo);
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo) });
    expect(r.estado).toEqual(viejo);
    expect(r.avisos).toEqual([{ tipo: "datos-de-otra-fecha", fechaBase: "2026-11-10" }]);
    expect(textoDatosDeOtraFecha("2026-11-10")).toBe(
      "Los datos de ejemplo son del 10/11/2026. Al reiniciar la demo se actualizan a la fecha de hoy y se borran sus cambios.",
    );
    expect(await repo.cargar()).toEqual(viejo);
  });

  it("si la fechaBase es de hoy (o posterior) no hace nada", async () => {
    const hoy = generar(SEMILLA_POR_DEFECTO, HOY);
    const manana = generar(SEMILLA_POR_DEFECTO, "2026-11-19");
    for (const estado of [hoy, manana]) {
      const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(estado)) });
      expect(r.estado).toEqual(estado);
      expect(r.avisos).toEqual([]);
    }
  });
});

describe("D7: versión de esquema distinta", () => {
  it("reinicia el ejemplo solo y avisa", async () => {
    const viejo = generar(SEMILLA_POR_DEFECTO, HOY);
    viejo.meta.versionEsquema = 0;
    viejo.meta.modificada = true;
    const repo = await repoCon(viejo);
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo) });
    expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(r.estado.meta.versionEsquema).toBe(VERSION_ESQUEMA);
    expect(r.avisos).toEqual([{ tipo: "esquema-actualizado" }]);
    expect(await repo.cargar()).toEqual(r.estado);
    expect(TEXTO_AVISO.esquemaActualizado).toBe("La demo se actualizó. Se cargó de nuevo la flota de ejemplo y no se conservaron los datos anteriores.");
  });

  it("un registro meta dañado (fecha inválida) también reinicia con ese aviso", async () => {
    const roto = generar(SEMILLA_POR_DEFECTO, HOY);
    (roto.meta as { fechaBase: string }).fechaBase = "no es una fecha";
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(roto)) });
    expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(r.avisos).toEqual([{ tipo: "esquema-actualizado" }]);
  });

  it("tiene prioridad sobre D5: no se conserva un esquema viejo aunque haya cambios", async () => {
    const viejo = generar(SEMILLA_POR_DEFECTO, "2026-11-10");
    viejo.meta.versionEsquema = 0;
    viejo.meta.modificada = true;
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(viejo)) });
    expect(r.avisos).toEqual([{ tipo: "esquema-actualizado" }]);
  });
});

describe("D8: sin almacenamiento", () => {
  it("si abrir IndexedDB lanza, arranca en memoria con el aviso fijo", async () => {
    const r = await arrancar({
      hoy: HOY,
      abrirAlmacenamiento: async () => {
        throw new Error("bloqueado");
      },
    });
    expect(r.enMemoria).toBe(true);
    expect(r.repositorio).toBeInstanceOf(RepositorioMemoria);
    expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(r.avisos).toEqual([{ tipo: "sin-almacenamiento" }]);
    expect(TEXTO_AVISO.sinAlmacenamiento).toBe(
      "Este navegador no permite guardar datos. Puede usar la demo, pero los cambios se pierden al cerrar o recargar la página.",
    );
  });

  it("el repositorio en memoria funciona: se puede escribir y leer", async () => {
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: () => Promise.reject(new Error("x")) });
    const unidad = { ...r.estado.unidades[0]!, marca: "Otra" };
    await r.repositorio.escribir({ ...sinCambios(), unidades: [unidad] }, []);
    expect((await r.repositorio.cargar())?.unidades[0]?.marca).toBe("Otra");
  });

  it("si abre pero falla al leer o al guardar, también cae al modo memoria", async () => {
    const queNoLee = new RepositorioMemoria();
    queNoLee.cargar = async () => {
      throw new Error("lectura rota");
    };
    const a = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(queNoLee) });
    expect(a.enMemoria).toBe(true);
    expect(a.avisos).toEqual([{ tipo: "sin-almacenamiento" }]);

    const queNoGuarda = new RepositorioMemoria();
    queNoGuarda.reemplazarTodo = async () => {
      throw new Error("sin cuota");
    };
    const b = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(queNoGuarda) });
    expect(b.enMemoria).toBe(true);
    expect(b.avisos).toEqual([{ tipo: "sin-almacenamiento" }]);
  });

  it("si abre pero falla al leer o al guardar, la conexión abierta se cierra (no queda colgada)", async () => {
    for (const falla of ["cargar", "reemplazarTodo"] as const) {
      const repo: Repositorio = new RepositorioMemoria();
      let cerrada = 0;
      repo.cerrar = () => void cerrada++;
      repo[falla] = async () => {
        throw new Error("rota");
      };
      const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo) });
      expect(r.enMemoria).toBe(true);
      expect(cerrada).toBe(1);
    }
  });

  it("sin IndexedDB real (fábrica que lanza) arranca igual", async () => {
    const fabricaRota = {
      open() {
        throw new Error("IndexedDB bloqueado");
      },
    } as unknown as IDBFactory;
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: () => abrirIndexedDB(fabricaRota) });
    expect(r.enMemoria).toBe(true);
  });

  it("si el almacenamiento falla a mitad del reinicio por D7, el aviso es solo el de D8", async () => {
    const viejo = generar(SEMILLA_POR_DEFECTO, HOY);
    viejo.meta.versionEsquema = 0;
    const repo = await repoCon(viejo);
    repo.reemplazarTodo = async () => {
      throw new Error("sin cuota");
    };
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo) });
    expect(r.enMemoria).toBe(true);
    expect(r.avisos).toEqual([{ tipo: "sin-almacenamiento" }]);
  });
});

describe("D8: un almacenamiento que no responde", () => {
  const nunca = (): Promise<Repositorio> => new Promise<Repositorio>(() => {});

  it("el plazo por defecto es de unos 8 segundos", () => {
    expect(PLAZO_ABRIR_MS).toBe(8000);
  });

  it("si abrir no responde en el plazo, arranca en memoria con el aviso fijo", async () => {
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: nunca, plazoAbrirMs: 20 });
    expect(r.enMemoria).toBe(true);
    expect(r.repositorio).toBeInstanceOf(RepositorioMemoria);
    expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(r.avisos).toEqual([{ tipo: "sin-almacenamiento" }]);
  });

  it("si la conexión llega tarde (después del plazo) se cierra: no queda una conexión colgada", async () => {
    let cerrada = 0;
    const tardio = async (): Promise<Repositorio> => {
      await new Promise((resolver) => setTimeout(resolver, 60));
      const repo: Repositorio = await repoCon(null);
      repo.cerrar = () => void cerrada++;
      return repo;
    };
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: tardio, plazoAbrirMs: 10 });
    expect(r.enMemoria).toBe(true);
    await new Promise((resolver) => setTimeout(resolver, 120));
    expect(cerrada).toBe(1);
  });

  it("si abre a tiempo no pasa nada y el plazo no queda corriendo", async () => {
    const repo: Repositorio = await repoCon(null);
    let cerrada = 0;
    repo.cerrar = () => void cerrada++;
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), plazoAbrirMs: 20 });
    await new Promise((resolver) => setTimeout(resolver, 60));
    expect(r.enMemoria).toBe(false);
    expect(r.repositorio).toBe(repo);
    expect(cerrada).toBe(0);
  });
});

describe("B4: el perfil guardado se valida al arrancar", () => {
  const arrancarCon = async (perfil: unknown, cambios: Partial<Estado["meta"]> = {}) => {
    const estado = generar(SEMILLA_POR_DEFECTO, HOY);
    Object.assign(estado.meta, cambios);
    (estado.meta as { perfil: unknown }).perfil = perfil;
    return arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(estado)) });
  };

  it("un conductor que no existe vuelve al encargado, sin aviso", async () => {
    const r = await arrancarCon({ tipo: "conductor", conductorId: "c-no-existe" });
    expect(r.estado.meta.perfil).toEqual({ tipo: "encargado" });
    expect(r.avisos).toEqual([]);
  });

  it("un tipo inválido, o un perfil que no es un objeto, vuelve al encargado", async () => {
    for (const roto of [{ tipo: "<img src=x onerror=alert(1)>" }, { tipo: "conductor" }, { tipo: 5 }, "x", 7, null, undefined, []]) {
      const r = await arrancarCon(roto);
      expect(r.estado.meta.perfil).toEqual({ tipo: "encargado" });
    }
  });

  it("también cuando hay cambios del visitante en un ejemplo de otra fecha (D5, segundo camino)", async () => {
    const r = await arrancarCon({ tipo: "conductor", conductorId: "c-no-existe" }, { fechaBase: "2026-11-10", modificada: true });
    expect(r.estado.meta.perfil).toEqual({ tipo: "encargado" });
    expect(r.estado.meta.modificada).toBe(true);
    expect(r.avisos).toEqual([{ tipo: "datos-de-otra-fecha", fechaBase: "2026-11-10" }]);
  });

  it("un perfil válido no se toca (conductor existente y encargado)", async () => {
    const estado = generar(SEMILLA_POR_DEFECTO, HOY);
    const conductorId = estado.conductores[0]!.id;
    const a = await arrancarCon({ tipo: "conductor", conductorId });
    expect(a.estado.meta.perfil).toEqual({ tipo: "conductor", conductorId });
    const b = await arrancarCon({ tipo: "encargado" });
    expect(b.estado.meta.perfil).toEqual({ tipo: "encargado" });
  });
});

describe("arranque con IndexedDB (falso) de punta a punta", () => {
  it("primera visita guarda; la segunda carga lo mismo sin regenerar", async () => {
    const fabrica = new IDBFactory();
    const uno = await arrancar({ hoy: HOY, abrirAlmacenamiento: () => abrirIndexedDB(fabrica) });
    expect(uno.enMemoria).toBe(false);
    cerrar(uno.repositorio);
    const dos = await arrancar({ hoy: HOY, abrirAlmacenamiento: () => abrirIndexedDB(fabrica) });
    expect(dos.estado).toEqual(uno.estado);
    expect(dos.avisos).toEqual([]);
    cerrar(dos.repositorio);
  });
});

describe("D6: reiniciar la demo", () => {
  it("vuelve al ejemplo de hoy, sin modificar, conservando el perfil", async () => {
    const actual = generar(SEMILLA_POR_DEFECTO, "2026-11-10");
    const conductorId = actual.conductores[1]!.id;
    actual.meta.perfil = { tipo: "conductor", conductorId };
    actual.meta.modificada = true;
    actual.eventos = actual.eventos.slice(0, 3);
    actual.novedades = [];
    const repo = await repoCon(actual);
    const nuevo = await reiniciarDemo(repo, actual, HOY);
    const primeraVisita = generar(SEMILLA_POR_DEFECTO, HOY);
    expect(nuevo).toEqual({ ...primeraVisita, meta: { ...primeraVisita.meta, perfil: { tipo: "conductor", conductorId } } });
    expect(nuevo.meta.modificada).toBe(false);
    expect(await repo.cargar()).toEqual(nuevo);
  });

  it("es una sola escritura: si falla, queda lo de antes", async () => {
    const actual = generar(SEMILLA_POR_DEFECTO, "2026-11-10");
    actual.meta.modificada = true;
    const repo = await repoCon(actual);
    repo.reemplazarTodo = async () => {
      throw new Error("sin cuota");
    };
    await expect(reiniciarDemo(repo, actual, HOY)).rejects.toThrow();
    expect(await repo.cargar()).toEqual(actual);
  });
});

describe("D11: cambiar de perfil no marca la demo como modificada", () => {
  it("guarda el perfil en meta y deja `modificada` como estaba", async () => {
    const base = generar(SEMILLA_POR_DEFECTO, HOY);
    const repo = await repoCon(base);
    const conductorId = base.conductores[0]!.id;
    const nuevo = await cambiarPerfil(repo, base, { tipo: "conductor", conductorId });
    expect(nuevo.meta.perfil).toEqual({ tipo: "conductor", conductorId });
    expect(nuevo.meta.modificada).toBe(false);
    expect((await repo.cargar())?.meta).toEqual(nuevo.meta);
    expect(base.meta.perfil).toEqual({ tipo: "encargado" }); // el estado de antes no se tocó
  });

  it("rechaza un conductor que no existe", async () => {
    const base = generar(SEMILLA_POR_DEFECTO, HOY);
    const repo = await repoCon(base);
    await expect(cambiarPerfil(repo, base, { tipo: "conductor", conductorId: "c-no-existe" })).rejects.toThrow();
  });
});
