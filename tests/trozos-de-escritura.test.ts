// Etapa 1 (rediseño): lo que sirve para escribir (los comandos del dominio, la escritura de la ficha y la del parte) es código que se baja
// la primera vez que se escribe, no con el marco. Si el trozo no baja (sin red), la escritura contesta «No se pudo guardar» como cualquier
// otra escritura que falla (D10): no rechaza, no cambia nada y la aplicación sigue andando.
import { describe, expect, it } from "vitest";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import { ERRORES } from "../src/lib/dominio/textos.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { EstadoApp, type DependenciasApp, type TrozosDeEscritura } from "../src/lib/estado/app.svelte.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";

const MEDIODIA = "2026-11-18T15:00:00.000Z";

async function iniciada(trozos: Partial<TrozosDeEscritura>): Promise<{ app: EstadoApp; repo: RepositorioMemoria }> {
  const repo = new RepositorioMemoria();
  const deps: DependenciasApp = {
    reloj: crearReloj(() => new Date(MEDIODIA)),
    abrirAlmacenamiento: async () => repo,
    ubicacion: ubicacionEnMemoria(),
    crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
    trozos,
  };
  const app = new EstadoApp(deps);
  await app.iniciar();
  return { app, repo };
}

const sinRed = (): Promise<never> => Promise.reject(new Error("Failed to fetch dynamically imported module"));

function comandoDeNovedad(estado: Estado): Comando {
  const unidad = estado.unidades.find((u) => u.estado.tipo === "en-servicio");
  if (unidad === undefined) throw new Error("falta una unidad en servicio");
  return { tipo: "ponerFueraDeServicio", unidadId: unidad.id, motivo: "En taller: cambio de embrague" };
}

describe("los comandos del dominio se bajan al escribir", () => {
  it("si el trozo no baja, la escritura falla con «No se pudo guardar» y no cambia nada", async () => {
    const { app, repo } = await iniciada({ comandos: sinRed });
    const antes = app.estado;
    const r = await app.ejecutar(comandoDeNovedad(antes!));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe("escritura-fallida");
      expect(r.error.mensaje).toBe(ERRORES.noPudoGuardar);
    }
    expect(app.estado).toBe(antes);
    expect(await repo.cargar()).toEqual(antes);
  });

  it("la cola sigue andando después de una escritura que no pudo bajar el trozo", async () => {
    let fallar = true;
    const real = () => import("../src/lib/dominio/comandos.ts");
    const { app } = await iniciada({ comandos: () => (fallar ? sinRed() : real()) });
    const comando = comandoDeNovedad(app.estado!);
    expect((await app.ejecutar(comando)).ok).toBe(false);
    fallar = false;
    const r = await app.ejecutar(comando);
    expect(r.ok).toBe(true);
  });

  it("con el trozo disponible escribe igual que siempre", async () => {
    let pedidos = 0;
    const { app } = await iniciada({
      comandos: () => {
        pedidos++;
        return import("../src/lib/dominio/comandos.ts");
      },
    });
    expect(pedidos).toBe(0); // arrancar no baja los comandos
    const r = await app.ejecutar(comandoDeNovedad(app.estado!));
    expect(r.ok).toBe(true);
    expect(pedidos).toBe(1);
  });
});

describe("la escritura de la ficha se baja al guardar desde ella", () => {
  it("si el trozo no baja, el diálogo recibe un error general y no se escribe nada", async () => {
    const { app } = await iniciada({ ficha: sinRed });
    const unidad = app.estado!.unidades.find((u) => u.estado.tipo === "en-servicio")!;
    const antes = app.estado;
    const r = await app.ponerFueraDeServicio(unidad.id, { motivo: "En taller: cambio de embrague" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.general).toBe(ERRORES.noPudoGuardar);
    expect(app.estado).toBe(antes);
  });

  it("con el trozo disponible guarda", async () => {
    const { app } = await iniciada({});
    const unidad = app.estado!.unidades.find((u) => u.estado.tipo === "en-servicio")!;
    const r = await app.ponerFueraDeServicio(unidad.id, { motivo: "En taller: cambio de embrague" });
    expect(r.ok).toBe(true);
  });
});

describe("la escritura del parte se baja al escribir un parte", () => {
  it("descartar un borrador sin poder bajar el trozo contesta con el error y no rechaza", async () => {
    const { app } = await iniciada({ parte: sinRed });
    const r = await app.descartarBorradorDeParte("no-importa");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensaje).toBe(ERRORES.noPudoGuardar);
  });
});
