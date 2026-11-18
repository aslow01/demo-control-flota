import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { sinCambios } from "../src/lib/dominio/estado.ts";
import { ErrorDeRepositorio } from "../src/lib/persistencia/repositorio.ts";
import { abrirIndexedDB, borrarIndexedDB, NOMBRE_BASE, RepositorioIndexedDB } from "../src/lib/persistencia/indexeddb.ts";
import { flotaDePrueba, novedad } from "./ayuda.ts";
import { describirContrato } from "./contrato-repositorio.ts";

// Paso 2.4 (decisión S2): el IndexedDB real del adaptador, contra `fake-indexeddb` en Node, con exactamente
// la misma suite de contrato que el repositorio en memoria. Cada prueba usa una fábrica nueva (base limpia).
describirContrato("RepositorioIndexedDB", async () => abrirIndexedDB(new IDBFactory()));

function nombresDeAlmacenes(db: IDBDatabase): string[] {
  return [...db.objectStoreNames].sort();
}

describe("RepositorioIndexedDB: estructura (docs/diseno.md, sección 10)", () => {
  it("crea la base 'control-flota-demo' versión 1 con todos los almacenes", async () => {
    const fabrica = new IDBFactory();
    const repo = await abrirIndexedDB(fabrica);
    repo.cerrar();
    expect(NOMBRE_BASE).toBe("control-flota-demo");
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const r = fabrica.open(NOMBRE_BASE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    expect(db.version).toBe(1);
    expect(nombresDeAlmacenes(db)).toEqual(
      ["conductores", "correccionesKm", "documentos", "eventos", "meta", "novedades", "partes", "proyectos", "unidades"],
    );
    const tx = db.transaction(["unidades", "documentos", "partes", "novedades", "correccionesKm", "eventos"], "readonly");
    expect([...tx.objectStore("unidades").indexNames]).toContain("patente");
    expect(tx.objectStore("unidades").index("patente").unique).toBe(true);
    expect(tx.objectStore("partes").index("unidadFecha").unique).toBe(true);
    expect([...tx.objectStore("partes").indexNames]).toContain("fecha");
    expect([...tx.objectStore("documentos").indexNames].sort()).toEqual(["id", "titular", "vence"]);
    expect([...tx.objectStore("novedades").indexNames].sort()).toEqual(["estado", "id", "unidadId"]);
    expect([...tx.objectStore("correccionesKm").indexNames].sort()).toEqual(["id", "unidadId"]);
    expect([...tx.objectStore("eventos").indexNames].sort()).toEqual(["conductorId", "id", "instante", "unidadId"]);
    db.close();
  });

  it("reabrir la misma base conserva lo guardado (persiste entre aperturas)", async () => {
    const fabrica = new IDBFactory();
    const uno = await abrirIndexedDB(fabrica);
    const base = flotaDePrueba();
    await uno.reemplazarTodo(base);
    uno.cerrar();
    const dos = await abrirIndexedDB(fabrica);
    expect(await dos.cargar()).toEqual(base);
    dos.cerrar();
  });

  it("dos repositorios sobre la misma base ven los cambios del otro", async () => {
    const fabrica = new IDBFactory();
    const a = await abrirIndexedDB(fabrica);
    const b = await abrirIndexedDB(fabrica);
    await a.reemplazarTodo(flotaDePrueba());
    await a.escribir({ ...sinCambios(), novedades: [novedad({ id: "n1" })] }, []);
    expect((await b.cargar())?.novedades.map((n) => n.id)).toEqual(["n1"]);
    a.cerrar();
    b.cerrar();
  });
});

describe("RepositorioIndexedDB: errores (P12, D10)", () => {
  it("un dato que no se puede guardar a mitad de la escritura aborta todo: no queda nada a medias", async () => {
    const repo = await abrirIndexedDB(new IDBFactory());
    await repo.reemplazarTodo(flotaDePrueba());
    const antes = await repo.cargar();
    const inguardable = novedad({ id: "n-roja", descripcion: "ok" }) as unknown as { [k: string]: unknown };
    inguardable["funcion"] = () => 1; // structuredClone no puede serializar una función
    const error = await repo
      .escribir({ ...sinCambios(), novedades: [novedad({ id: "n-ok" }), inguardable as never] }, [])
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorDeRepositorio);
    expect((error as ErrorDeRepositorio).codigo).toBe("escritura-fallida");
    expect(await repo.cargar()).toEqual(antes);
    repo.cerrar();
  });

  it("un reemplazarTodo con un dato inguardable deja lo anterior intacto", async () => {
    const repo = await abrirIndexedDB(new IDBFactory());
    const base = flotaDePrueba();
    await repo.reemplazarTodo(base);
    const roto = flotaDePrueba();
    (roto.unidades[0] as unknown as { [k: string]: unknown })["funcion"] = () => 1;
    await expect(repo.reemplazarTodo(roto)).rejects.toBeInstanceOf(ErrorDeRepositorio);
    expect(await repo.cargar()).toEqual(base);
    repo.cerrar();
  });

  it("usar un repositorio cerrado da un error claro, no un fallo mudo", async () => {
    const repo = await abrirIndexedDB(new IDBFactory());
    repo.cerrar();
    await expect(repo.cargar()).rejects.toBeInstanceOf(ErrorDeRepositorio);
    await expect(repo.escribir(sinCambios(), [])).rejects.toBeInstanceOf(ErrorDeRepositorio);
  });

  it("abrir con una fábrica que lanza rechaza (el arranque lo convierte en modo memoria, D8)", async () => {
    const fabricaRota = {
      open() {
        throw new Error("IndexedDB bloqueado por el navegador");
      },
    } as unknown as IDBFactory;
    await expect(abrirIndexedDB(fabricaRota)).rejects.toThrow();
  });

  it("abrir con una fábrica que da error asíncrono también rechaza", async () => {
    const fabricaMala = {
      open() {
        const pedido: { onerror?: () => void; error: Error } = { error: new Error("sin permiso") };
        setTimeout(() => pedido.onerror?.(), 0);
        return pedido;
      },
    } as unknown as IDBFactory;
    await expect(abrirIndexedDB(fabricaMala)).rejects.toThrow();
  });
});

describe("RepositorioIndexedDB: clase exportada", () => {
  it("abrirIndexedDB devuelve un RepositorioIndexedDB", async () => {
    const repo = await abrirIndexedDB(new IDBFactory());
    expect(repo).toBeInstanceOf(RepositorioIndexedDB);
    repo.cerrar();
  });
});

describe("borrarIndexedDB (reiniciar sin estado previo)", () => {
  it("borra la base: al reabrir, está vacía", async () => {
    const fabrica = new IDBFactory();
    const uno = await abrirIndexedDB(fabrica);
    await uno.reemplazarTodo(flotaDePrueba());
    uno.cerrar();
    await borrarIndexedDB(fabrica);
    const dos = await abrirIndexedDB(fabrica);
    expect(await dos.cargar()).toBeNull();
    dos.cerrar();
  });

  it("con otra conexión abierta (otra pestaña), esa se cierra sola y el borrado sigue", async () => {
    const fabrica = new IDBFactory();
    const abierta = await abrirIndexedDB(fabrica);
    await abierta.reemplazarTodo(flotaDePrueba());
    await borrarIndexedDB(fabrica);
    await expect(abierta.cargar()).rejects.toBeInstanceOf(ErrorDeRepositorio); // su conexión se cerró
    const nueva = await abrirIndexedDB(fabrica);
    expect(await nueva.cargar()).toBeNull();
    nueva.cerrar();
  });

  it("borrar una base que no existe no es un error", async () => {
    await expect(borrarIndexedDB(new IDBFactory())).resolves.toBeUndefined();
  });

  it("sin IndexedDB rechaza con un ErrorDeRepositorio claro", async () => {
    await expect(borrarIndexedDB(undefined)).rejects.toBeInstanceOf(ErrorDeRepositorio);
  });
});
