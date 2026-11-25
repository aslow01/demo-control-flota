// QA B2 de la etapa 7: si otra pestaña (o el usuario, con «borrar datos del sitio») borra la base mientras la demo está abierta, la conexión se cierra. Antes cada reintento fallaba con
// «No se pudo guardar el parte… intente de nuevo» y la única salida era recargar, perdiendo lo escrito. Ahora el repositorio lo dice con un código propio y la aplicación sigue con
// lo que tiene en memoria, avisándolo: el reintento funciona y no se pierde nada.
import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { sinCambios } from "../src/lib/dominio/estado.ts";
import { TEXTO_AVISO } from "../src/lib/dominio/textos.ts";
import { EstadoApp } from "../src/lib/estado/app.svelte.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { abrirIndexedDB, NOMBRE_BASE } from "../src/lib/persistencia/indexeddb.ts";
import { ErrorDeRepositorio } from "../src/lib/persistencia/repositorio.ts";
import { flotaDePrueba, novedad } from "./ayuda.ts";

const MEDIODIA = "2026-11-18T15:00:00.000Z";

/** Borra la base desde «otra pestaña»: dispara `versionchange` en la conexión de esta. */
function borrarBase(fabrica: IDBFactory): Promise<void> {
  return new Promise((resolver, rechazar) => {
    const pedido = fabrica.deleteDatabase(NOMBRE_BASE);
    pedido.onsuccess = () => resolver();
    pedido.onerror = () => rechazar(pedido.error);
  });
}

describe("RepositorioIndexedDB: la base se borró con la conexión abierta", () => {
  it("toda operación rechaza con el código «conexion-cerrada», no con un error de escritura genérico", async () => {
    const fabrica = new IDBFactory();
    const repo = await abrirIndexedDB(fabrica);
    await repo.reemplazarTodo(flotaDePrueba());
    await borrarBase(fabrica);
    for (const operacion of [
      () => repo.escribir({ ...sinCambios(), novedades: [novedad({ id: "n1" })] }, []),
      () => repo.cargar(),
      () => repo.reemplazarTodo(flotaDePrueba()),
      () => repo.vaciar(),
    ]) {
      const error = await operacion().then(
        () => null,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(ErrorDeRepositorio);
      expect((error as ErrorDeRepositorio).codigo).toBe("conexion-cerrada");
    }
  });
});

describe("la aplicación con la base borrada a mitad de un parte", () => {
  async function iniciada() {
    const fabrica = new IDBFactory();
    const app = new EstadoApp({
      reloj: crearReloj(() => new Date(Date.parse(MEDIODIA))),
      abrirAlmacenamiento: () => abrirIndexedDB(fabrica),
      ubicacion: ubicacionEnMemoria("#/inicio"),
      crearAvisoPestanas: () => ({ avisarCambio: () => {}, cerrar: () => {} }),
      nuevoId: (() => {
        let n = 0;
        return () => `nuevo-${++n}`;
      })(),
    });
    await app.iniciar();
    return { app, fabrica };
  }

  it("el reintento funciona: la escritura se hace sobre la memoria y lo hecho queda en el estado", async () => {
    const { app, fabrica } = await iniciada();
    expect(app.enMemoria).toBe(false);
    await borrarBase(fabrica);
    const unidad = app.estado!.unidades.find((u) => u.estado.tipo === "en-servicio")!;
    const antes = app.estado!.novedades.length;

    const r = await app.ejecutar({ tipo: "cargarNovedad", unidadId: unidad.id, descripcion: "Pierde aceite por el cárter", impideUso: false });

    expect(r.ok).toBe(true);
    expect(app.estado!.novedades).toHaveLength(antes + 1);
    expect(app.enMemoria).toBe(true);
    expect(app.avisos).toContainEqual({ tipo: "almacenamiento-perdido" });
    // y los que siguen también andan, sin volver a avisar
    const otra = await app.ejecutar({ tipo: "cargarNovedad", unidadId: unidad.id, descripcion: "Una luz quemada", impideUso: false });
    expect(otra.ok).toBe(true);
    expect(app.avisos.filter((a) => a.tipo === "almacenamiento-perdido")).toHaveLength(1);
  });

  it("también cambiar de vista y «Reiniciar demo» siguen andando", async () => {
    const { app, fabrica } = await iniciada();
    await borrarBase(fabrica);
    expect((await app.cambiarPerfil({ tipo: "encargado" })).ok).toBe(true);
    expect((await app.reiniciar()).ok).toBe(true);
    expect(app.enMemoria).toBe(true);
    // al reiniciar se limpian los avisos de datos, pero el de que no se guarda se queda
    expect(app.avisos).toContainEqual({ tipo: "almacenamiento-perdido" });
  });

  it("el aviso dice qué pasó y qué esperar, sin culpar al navegador", () => {
    expect(TEXTO_AVISO.almacenamientoPerdido).toBe(
      "Los datos guardados de la demo ya no están disponibles: se borraron o se cambiaron desde otra pestaña. Puede seguir usándola, pero los cambios se pierden al cerrar o recargar la página.",
    );
  });
});
