import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { generar, VERSION_ESQUEMA } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { sinCambios } from "../src/lib/dominio/estado.ts";
import { TEXTO_AVISO, textoDatosDeOtraFecha } from "../src/lib/dominio/textos.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { SEMILLA_POR_DEFECTO } from "../src/lib/datos/constantes.ts";
import { arrancar, cambiarPerfil, PLAZO_ABRIR_MS, reiniciarDemo } from "../src/lib/persistencia/arranque.ts";
import { abrirIndexedDB, NOMBRE_BASE } from "../src/lib/persistencia/indexeddb.ts";
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

  it("D7, sección 17: datos guardados con la versión 1 (partes de un solo paso) se regeneran con el aviso: no se migran partes viejos", async () => {
    const viejo = generar(SEMILLA_POR_DEFECTO, HOY);
    viejo.meta.versionEsquema = 1;
    const repo = await repoCon(viejo);
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo) });
    expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(r.estado.meta.versionEsquema).toBe(VERSION_ESQUEMA);
    expect(r.avisos).toEqual([{ tipo: "esquema-actualizado" }]);
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

  it("QA E5: si abre pero leer o escribir no termina en el plazo (WebKit con una escritura grande), arranca en memoria y cierra esa conexión", async () => {
    for (const cuelga of ["cargar", "reemplazarTodo"] as const) {
      const repo: Repositorio = await repoCon(null);
      let cerrada = 0;
      repo.cerrar = () => void cerrada++;
      if (cuelga === "cargar") repo.cargar = () => new Promise<never>(() => {});
      else repo.reemplazarTodo = () => new Promise<never>(() => {});
      const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(repo), plazoAbrirMs: 20 });
      expect(r.enMemoria, cuelga).toBe(true);
      expect(r.repositorio, cuelga).toBeInstanceOf(RepositorioMemoria);
      expect(r.avisos, cuelga).toEqual([{ tipo: "sin-almacenamiento" }]);
      expect(cerrada, cuelga).toBe(1);
    }
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

/** Escribe a mano en un almacén de la base (la interfaz nunca lo hace): simula datos dañados o editados desde las herramientas del navegador. */
async function escribirCrudo(fabrica: IDBFactory, almacen: string, valores: unknown[]): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolver, rechazar) => {
    const pedido = fabrica.open(NOMBRE_BASE);
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rechazar(pedido.error);
  });
  await new Promise<void>((resolver, rechazar) => {
    const tx = db.transaction(almacen, "readwrite");
    tx.objectStore(almacen).clear();
    for (const valor of valores) tx.objectStore(almacen).add(valor);
    tx.oncomplete = () => resolver();
    tx.onerror = () => rechazar(tx.error);
  });
  db.close();
}

describe("D7: elementos dañados en las listas guardadas cuentan como otro formato", () => {
  const casos: [string, string, unknown[]][] = [
    ["unidades con un número y un nulo", "unidades", [1, null]],
    ["conductores con un texto", "conductores", ["x"]],
    ["documentos sin titular", "documentos", [{ id: "d1", tipo: "seguro", vence: "2026-12-01" }]],
    ["partes sin checklist", "partes", [{ id: "p1", unidadId: "u1", fecha: "2026-11-18", estado: "borrador" }]],
    ["partes con un estado que no existe", "partes", [{ id: "p1", unidadId: "u1", fecha: "2026-11-18", estado: "revisado", checklist: {} }]],
    ["novedades con la unidad de otro tipo", "novedades", [{ id: "n1", unidadId: 5 }]],
    ["eventos con un arreglo adentro", "eventos", [[]]],
  ];

  for (const [nombre, almacen, valores] of casos) {
    it(`${nombre}: se regenera el ejemplo y se avisa (D7)`, async () => {
      const fabrica = new IDBFactory();
      const primero = await arrancar({ hoy: HOY, abrirAlmacenamiento: () => abrirIndexedDB(fabrica) });
      cerrar(primero.repositorio);
      await escribirCrudo(fabrica, almacen, valores);

      const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: () => abrirIndexedDB(fabrica) });
      expect(r.enMemoria).toBe(false);
      expect(r.avisos).toEqual([{ tipo: "esquema-actualizado" }]);
      expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
      expect(() => calcularAlertas(r.estado, HOY)).not.toThrow();
      // y quedó guardado el ejemplo: la próxima vez ya no hay aviso
      cerrar(r.repositorio);
      const otra = await arrancar({ hoy: HOY, abrirAlmacenamiento: () => abrirIndexedDB(fabrica) });
      expect(otra.avisos).toEqual([]);
      cerrar(otra.repositorio);
    });
  }

  it("un dato con la forma correcta pero que hace fallar el cálculo de alertas también se regenera", async () => {
    const estado = generar(SEMILLA_POR_DEFECTO, HOY);
    const unidad0 = estado.unidades[0]!;
    (unidad0 as { estado: unknown }).estado = { tipo: "inventado" };
    (estado.documentos[0] as { vence: unknown }).vence = "no es una fecha";
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(estado)) });
    expect(r.avisos).toEqual([{ tipo: "esquema-actualizado" }]);
    expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
  });
});

describe("D7 (QA M3 y código M1, etapa 4): campos con el tipo roto que las pantallas leen también cuentan como otro formato", () => {
  type Dano = (e: Estado) => void;
  const poner = (objeto: unknown, campo: string, valor: unknown): void => {
    (objeto as Record<string, unknown>)[campo] = valor;
  };

  const casos: [string, Dano][] = [
    ["unidad con marca nula", (e) => poner(e.unidades[0], "marca", null)],
    ["unidad con modelo numérico", (e) => poner(e.unidades[0], "modelo", 5)],
    ["unidad con tipo desconocido", (e) => poner(e.unidades[0], "tipo", "avioneta")],
    ["unidad con interno de texto", (e) => poner(e.unidades[0], "interno", "7")],
    ["unidad con año que no es un número", (e) => poner(e.unidades[0], "anio", null)],
    ["unidad con conductor de otro tipo", (e) => poner(e.unidades[0], "conductorId", 3)],
    ["unidad de baja sin motivo", (e) => poner(e.unidades[0], "estado", { tipo: "baja", desde: HOY })],
    ["unidad fuera de servicio sin lista de novedades", (e) => poner(e.unidades[0], "estado", { tipo: "fuera-de-servicio", desde: HOY, motivo: "x", origen: "manual" })],
    ["conductor sin legajo", (e) => poner(e.conductores[0], "legajo", undefined)],
    ["conductor con 'activo' de texto", (e) => poner(e.conductores[0], "activo", "si")],
    ["proyecto sin nombre", (e) => poner(e.proyectos[0], "nombre", null)],
    ["documento con emisor nulo", (e) => poner(e.documentos[0], "emisor", null)],
    ["documento con número que no es texto", (e) => poner(e.documentos[0], "numero", 12)],
    ["novedad sin origen", (e) => poner(e.novedades[0], "origen", undefined)],
    ["novedad con origen de otro tipo", (e) => poner(e.novedades[0], "origen", { tipo: "inventado" })],
    ["novedad sin descripción", (e) => poner(e.novedades[0], "descripcion", null)],
    ["novedad resuelta sin texto de resolución", (e) => poner(e.novedades.find((n) => n.estado === "resuelta"), "resolucion", {})],
    ["corrección de km sin motivo", (e) => poner(e.correccionesKm[0], "motivo", undefined)],
    ["evento con tipo desconocido", (e) => poner(e.eventos[0], "tipo", "inventado")],
    ["evento parte-enviado sin datos", (e) => poner(e.eventos.find((v) => v.tipo === "parte-enviado"), "datos", undefined)],
    ["evento con unidad de otro tipo", (e) => poner(e.eventos[0], "unidadId", 4)],
    ["evento sin autor", (e) => poner(e.eventos[0], "autor", undefined)],
    ["evento con secuencia de texto", (e) => poner(e.eventos[0], "secuencia", "1")],
  ];

  for (const [nombre, dañar] of casos) {
    it(`${nombre}: se regenera el ejemplo y se avisa`, async () => {
      const estado = generar(SEMILLA_POR_DEFECTO, HOY);
      dañar(estado);
      const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(estado)) });
      expect(r.avisos).toEqual([{ tipo: "esquema-actualizado" }]);
      expect(r.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    });
  }

  it("un parte con el checklist incompleto no cuenta como otro formato: el parte se lee con `parteLegible` (4.5) y se puede descartar", async () => {
    const estado = generar(SEMILLA_POR_DEFECTO, HOY);
    const p = estado.partes.find((x) => x.estado === "enviado")!;
    (p as { checklist: unknown }).checklist = {};
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(estado)) });
    expect(r.avisos).toEqual([]);
    expect(r.estado.partes.find((x) => x.id === p.id)).toBeDefined();
  });

  it("el ejemplo intacto, y con cambios del visitante, sigue siendo utilizable (sin aviso de esquema)", async () => {
    const estado = generar(SEMILLA_POR_DEFECTO, "2026-11-10");
    estado.meta.modificada = true;
    const r = await arrancar({ hoy: HOY, abrirAlmacenamiento: almacenamiento(await repoCon(estado)) });
    expect(r.avisos).toEqual([{ tipo: "datos-de-otra-fecha", fechaBase: "2026-11-10" }]);
    expect(r.estado.eventos).toEqual(estado.eventos);
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
