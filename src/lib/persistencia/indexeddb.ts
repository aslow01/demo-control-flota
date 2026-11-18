// Repositorio sobre IndexedDB (docs/diseno.md, sección 10). Pasa la misma suite de contrato que `RepositorioMemoria`.
//
// Decisiones de este archivo:
// - Cada almacén de listas usa una clave automática (el orden de inserción es el orden de lectura, igual que en el
//   repositorio en memoria) y un índice único `id`. Reemplazar por `id` es: buscar la clave en ese índice y hacer `put`
//   con esa clave. Así el orden de una lista no depende de cómo se ordenen los ids.
// - Toda escritura va en UNA transacción sobre todos los almacenes: si algo falla (índice único, cuota, un dato que no se
//   puede guardar) la transacción se aborta y no queda nada a medias (P12, D10).
// - Los errores que salen de acá son siempre `ErrorDeRepositorio` con mensaje en español.

import type { Cambios } from "../dominio/estado.ts";
import type { Estado, Evento, Meta } from "../dominio/tipos.ts";
import { ErrorDeRepositorio, type Repositorio } from "./repositorio.ts";

export const NOMBRE_BASE = "control-flota-demo";
const VERSION_BASE = 1;
const CLAVE_META = "estado";

type Lista = "proyectos" | "conductores" | "unidades" | "documentos" | "partes" | "novedades" | "correccionesKm" | "eventos";

interface DefIndice {
  nombre: string;
  ruta: string | string[];
  unico?: boolean;
}

/** Almacenes de listas y sus índices (sección 10). Todos llevan además el índice único `id`. */
const LISTAS: Record<Lista, DefIndice[]> = {
  proyectos: [],
  conductores: [],
  unidades: [{ nombre: "patente", ruta: "patente", unico: true }],
  documentos: [
    { nombre: "titular", ruta: ["titular.tipo", "titular.id"] },
    { nombre: "vence", ruta: "vence" },
  ],
  partes: [
    { nombre: "unidadFecha", ruta: ["unidadId", "fecha"], unico: true },
    { nombre: "fecha", ruta: "fecha" },
  ],
  novedades: [
    { nombre: "unidadId", ruta: "unidadId" },
    { nombre: "estado", ruta: "estado" },
  ],
  correccionesKm: [{ nombre: "unidadId", ruta: "unidadId" }],
  eventos: [
    { nombre: "unidadId", ruta: "unidadId" },
    { nombre: "conductorId", ruta: "conductorId" },
    { nombre: "instante", ruta: "instante" },
  ],
};

const NOMBRES_LISTAS = Object.keys(LISTAS) as Lista[];
const TODOS_LOS_ALMACENES = ["meta", ...NOMBRES_LISTAS];

const MENSAJE_GENERICO = "No se pudo escribir en el almacenamiento. No se aplicó ningún cambio.";

function crearEsquema(db: IDBDatabase): void {
  db.createObjectStore("meta");
  for (const nombre of NOMBRES_LISTAS) {
    const almacen = db.createObjectStore(nombre, { autoIncrement: true });
    almacen.createIndex("id", "id", { unique: true });
    for (const indice of LISTAS[nombre]) almacen.createIndex(indice.nombre, indice.ruta, { unique: indice.unico ?? false });
  }
}

function aErrorDeRepositorio(e: unknown): ErrorDeRepositorio {
  if (e instanceof ErrorDeRepositorio) return e;
  const nombre = e instanceof Error ? e.name : "";
  if (nombre === "QuotaExceededError") {
    return new ErrorDeRepositorio("escritura-fallida", "No hay lugar para guardar más datos en este navegador. No se aplicó ningún cambio.");
  }
  return new ErrorDeRepositorio("escritura-fallida", MENSAJE_GENERICO);
}

/** Una transacción en curso: junta el primer error con su código para devolverlo cuando se aborte. */
class Trabajo {
  readonly tx: IDBTransaction;
  private primerError: ErrorDeRepositorio | null = null;

  constructor(tx: IDBTransaction) {
    this.tx = tx;
  }

  get error(): ErrorDeRepositorio | null {
    return this.primerError;
  }

  /** Falla a mano (un dato que no se puede guardar, una base vacía...): aborta y recuerda el motivo. */
  fallar(e: unknown): void {
    this.primerError ??= aErrorDeRepositorio(e);
    try {
      this.tx.abort();
    } catch {
      // ya estaba terminada
    }
  }

  /** Registra qué error corresponde si este pedido falla (la transacción se aborta sola después). */
  vigilar<T extends IDBRequest>(pedido: T, comoError: () => ErrorDeRepositorio, alExito?: (resultado: T["result"]) => void): T {
    pedido.onerror = () => {
      this.primerError ??= comoError();
    };
    if (alExito !== undefined) pedido.onsuccess = () => alExito(pedido.result);
    return pedido;
  }

  /** Busca la clave de cada id en el índice `id` del almacén y llama a `listo` con las claves, en el mismo orden. */
  claves(almacen: Lista, ids: readonly string[], listo: (claves: (IDBValidKey | undefined)[]) => void): void {
    if (ids.length === 0) {
      listo([]);
      return;
    }
    const indice = this.tx.objectStore(almacen).index("id");
    const claves: (IDBValidKey | undefined)[] = new Array<IDBValidKey | undefined>(ids.length).fill(undefined);
    let faltan = ids.length;
    ids.forEach((id, i) => {
      this.vigilar(indice.getKey(id), () => new ErrorDeRepositorio("escritura-fallida", MENSAJE_GENERICO), (clave) => {
        claves[i] = clave as IDBValidKey | undefined;
        faltan -= 1;
        if (faltan === 0) listo(claves);
      });
    });
  }

  /** Reemplaza por `id` (o agrega al final si no existía). `conflicto` es el error si se viola un índice único. */
  reemplazarOAgregar<T extends { id: string }>(almacen: Lista, registros: readonly T[], conflicto: (r: T) => ErrorDeRepositorio, listo: () => void): void {
    this.claves(
      almacen,
      registros.map((r) => r.id),
      (claves) => {
        const objetos = this.tx.objectStore(almacen);
        registros.forEach((r, i) => {
          const clave = claves[i];
          const pedido = clave === undefined ? objetos.add(r) : objetos.put(r, clave);
          this.vigilar(pedido, () => conflicto(r));
        });
        listo();
      },
    );
  }
}

export class RepositorioIndexedDB implements Repositorio {
  private db: IDBDatabase | null;

  constructor(db: IDBDatabase) {
    this.db = db;
    // Si otra pestaña pide actualizar la base, se cierra la conexión para no bloquearla.
    db.onversionchange = () => this.cerrar();
  }

  /** Cierra la conexión. Después, toda operación falla con un error claro. */
  cerrar(): void {
    this.db?.close();
    this.db = null;
  }

  private transaccion<T>(modo: IDBTransactionMode, trabajo: (t: Trabajo) => void, resultado: () => T): Promise<T> {
    return new Promise<T>((resolver, rechazar) => {
      if (this.db === null) {
        rechazar(new ErrorDeRepositorio("escritura-fallida", "La conexión con el almacenamiento está cerrada."));
        return;
      }
      let t: Trabajo;
      try {
        t = new Trabajo(this.db.transaction(TODOS_LOS_ALMACENES, modo));
      } catch (e) {
        rechazar(aErrorDeRepositorio(e));
        return;
      }
      t.tx.oncomplete = () => resolver(resultado());
      t.tx.onabort = () => rechazar(t.error ?? aErrorDeRepositorio(t.tx.error));
      try {
        trabajo(t);
      } catch (e) {
        t.fallar(e);
      }
    });
  }

  async cargar(): Promise<Estado | null> {
    const leido: Record<string, unknown[]> = {};
    let meta: Meta | undefined;
    return this.transaccion(
      "readonly",
      (t) => {
        const falla = () => new ErrorDeRepositorio("escritura-fallida", "No se pudieron leer los datos guardados.");
        t.vigilar(t.tx.objectStore("meta").get(CLAVE_META), falla, (r) => {
          meta = r as Meta | undefined;
        });
        for (const nombre of NOMBRES_LISTAS) {
          t.vigilar(t.tx.objectStore(nombre).getAll(), falla, (r) => {
            leido[nombre] = r as unknown[];
          });
        }
      },
      () => (meta === undefined ? null : ({ meta, ...leido } as unknown as Estado)),
    );
  }

  async reemplazarTodo(estado: Estado): Promise<void> {
    return this.transaccion(
      "readwrite",
      (t) => {
        const conflicto = () => new ErrorDeRepositorio("escritura-fallida", MENSAJE_GENERICO);
        for (const nombre of ["meta", ...NOMBRES_LISTAS]) t.vigilar(t.tx.objectStore(nombre).clear(), conflicto);
        t.vigilar(t.tx.objectStore("meta").put(estado.meta, CLAVE_META), conflicto);
        for (const nombre of NOMBRES_LISTAS) {
          const almacen = t.tx.objectStore(nombre);
          for (const registro of estado[nombre]) t.vigilar(almacen.add(registro), conflicto);
        }
      },
      () => undefined,
    );
  }

  async vaciar(): Promise<void> {
    return this.transaccion(
      "readwrite",
      (t) => {
        for (const nombre of TODOS_LOS_ALMACENES) {
          t.vigilar(t.tx.objectStore(nombre).clear(), () => new ErrorDeRepositorio("escritura-fallida", MENSAJE_GENERICO));
        }
      },
      () => undefined,
    );
  }

  async escribir(cambios: Cambios, eventos: readonly Evento[]): Promise<void> {
    return this.transaccion(
      "readwrite",
      (t) => {
        const metaActual = t.tx.objectStore("meta").get(CLAVE_META);
        t.vigilar(metaActual, () => new ErrorDeRepositorio("escritura-fallida", MENSAJE_GENERICO), (existente) => {
          if (existente === undefined) {
            t.fallar(new ErrorDeRepositorio("escritura-fallida", "La base está vacía: primero hay que cargar los datos (reemplazarTodo)."));
            return;
          }
          this.aplicar(t, cambios, eventos);
        });
      },
      () => undefined,
    );
  }

  /** Paso 1: borrar los borradores descartados. Paso 2: reemplazar o agregar. Paso 3: agregar los eventos al final. */
  private aplicar(t: Trabajo, cambios: Cambios, eventos: readonly Evento[]): void {
    const generico = () => new ErrorDeRepositorio("escritura-fallida", MENSAJE_GENERICO);
    t.claves("partes", cambios.partesBorrados, (claves) => {
      const partes = t.tx.objectStore("partes");
      for (const clave of claves) if (clave !== undefined) t.vigilar(partes.delete(clave), generico);
      // Los pedidos se ejecutan en el orden en que se hacen: lo que sigue ya ve los borradores borrados.
      t.reemplazarOAgregar(
        "unidades",
        cambios.unidades,
        (u) => new ErrorDeRepositorio("indice-unico", `Ya existe una unidad con la patente ${u.patente}.`),
        () => undefined,
      );
      t.reemplazarOAgregar("documentos", cambios.documentos, generico, () => undefined);
      t.reemplazarOAgregar(
        "partes",
        cambios.partes,
        (p) => new ErrorDeRepositorio("indice-unico", `Ya hay un parte de la unidad ${p.unidadId} para el ${p.fecha}.`),
        () => undefined,
      );
      t.reemplazarOAgregar("novedades", cambios.novedades, generico, () => undefined);
      t.reemplazarOAgregar("correccionesKm", cambios.correccionesKm, generico, () => undefined);
      const almacenEventos = t.tx.objectStore("eventos");
      for (const e of eventos) {
        t.vigilar(almacenEventos.add(e), () => new ErrorDeRepositorio("evento-repetido", `El evento ${e.id} ya existe: el historial no se modifica.`));
      }
      if (cambios.meta !== null) t.vigilar(t.tx.objectStore("meta").put(cambios.meta, CLAVE_META), generico);
    });
  }
}

/**
 * Abre (y crea la primera vez) la base `control-flota-demo`. Rechaza si IndexedDB no existe, está bloqueado o falla:
 * quien arranca (D8) pasa entonces al repositorio en memoria. Para los tests se le da una fábrica falsa.
 */
export function abrirIndexedDB(fabrica: IDBFactory | undefined = globalThis.indexedDB, nombre: string = NOMBRE_BASE): Promise<RepositorioIndexedDB> {
  return new Promise<RepositorioIndexedDB>((resolver, rechazar) => {
    if (fabrica === undefined) {
      rechazar(new ErrorDeRepositorio("escritura-fallida", "Este navegador no ofrece IndexedDB."));
      return;
    }
    let rechazada = false;
    const fallar = (motivo: string) => {
      rechazada = true;
      rechazar(new ErrorDeRepositorio("escritura-fallida", motivo));
    };
    let pedido: IDBOpenDBRequest;
    try {
      pedido = fabrica.open(nombre, VERSION_BASE);
    } catch {
      fallar("No se pudo abrir el almacenamiento del navegador.");
      return;
    }
    pedido.onupgradeneeded = () => crearEsquema(pedido.result);
    pedido.onsuccess = () => {
      if (rechazada) pedido.result.close(); // el pedido se dio por perdido: no dejar una conexión abierta
      else resolver(new RepositorioIndexedDB(pedido.result));
    };
    pedido.onerror = () => fallar("No se pudo abrir el almacenamiento del navegador.");
    pedido.onblocked = () => fallar("El almacenamiento está bloqueado por otra pestaña. Cierre las demás pestañas de la demo y recargue.");
  });
}

/**
 * Borra la base de la demo (para "Reiniciar demo" cuando ni siquiera se pudo arrancar y no hay estado que reemplazar).
 * Las conexiones abiertas en otras pestañas se cierran solas (`onversionchange` de `RepositorioIndexedDB`). Borrar una base
 * que no existe no es un error. Rechaza con `ErrorDeRepositorio` si IndexedDB no existe, falla o queda bloqueado.
 */
export function borrarIndexedDB(fabrica: IDBFactory | undefined = globalThis.indexedDB, nombre: string = NOMBRE_BASE): Promise<void> {
  return new Promise<void>((resolver, rechazar) => {
    if (fabrica === undefined) {
      rechazar(new ErrorDeRepositorio("escritura-fallida", "Este navegador no ofrece IndexedDB."));
      return;
    }
    let pedido: IDBOpenDBRequest;
    try {
      pedido = fabrica.deleteDatabase(nombre);
    } catch {
      rechazar(new ErrorDeRepositorio("escritura-fallida", "No se pudo borrar el almacenamiento del navegador."));
      return;
    }
    pedido.onsuccess = () => resolver();
    pedido.onerror = () => rechazar(new ErrorDeRepositorio("escritura-fallida", "No se pudo borrar el almacenamiento del navegador."));
    pedido.onblocked = () =>
      rechazar(new ErrorDeRepositorio("escritura-fallida", "El almacenamiento está bloqueado por otra pestaña. Cierre las demás pestañas de la demo y recargue."));
  });
}
