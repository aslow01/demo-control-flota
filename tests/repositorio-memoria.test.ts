import { describe, expect, it } from "vitest";
import { sinCambios } from "../src/lib/dominio/estado.ts";
import { ErrorDeRepositorio } from "../src/lib/persistencia/repositorio.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";
import { novedad, flotaDePrueba } from "./ayuda.ts";
import { describirContrato } from "./contrato-repositorio.ts";

describirContrato("RepositorioMemoria", async () => new RepositorioMemoria());

describe("RepositorioMemoria: falla inyectada (P12, D10)", () => {
  it("si falla al escribir los eventos, no queda ni el parte ni las novedades y el estado es el de antes", async () => {
    const repo = new RepositorioMemoria({ falla: "eventos" });
    const base = flotaDePrueba();
    await repo.reemplazarTodo(base);
    const antes = await repo.cargar();
    await expect(
      repo.escribir(
        { ...sinCambios(), novedades: [novedad({ id: "n1" })] },
        [{ id: "e1", secuencia: 1, instante: "2026-11-18T15:00:00.000Z", unidadId: "u1", conductorId: null, tipo: "novedad-abierta", resumen: "x", datos: {}, autor: "a" }],
      ),
    ).rejects.toBeInstanceOf(ErrorDeRepositorio);
    expect(await repo.cargar()).toEqual(antes);
  });

  it("la falla es solo de esa escritura: una vez apagada, las siguientes funcionan", async () => {
    const repo = new RepositorioMemoria({ falla: "eventos" });
    await repo.reemplazarTodo(flotaDePrueba());
    await expect(repo.escribir(sinCambios(), [{ id: "e1", secuencia: 1, instante: "2026-11-18T15:00:00.000Z", unidadId: null, conductorId: null, tipo: "novedad-abierta", resumen: "x", datos: {}, autor: "a" }])).rejects.toThrow();
    repo.falla = null;
    await repo.escribir({ ...sinCambios(), novedades: [novedad({ id: "n1" })] }, []);
    expect((await repo.cargar())?.novedades).toHaveLength(1);
  });

  it("el error trae un código y un mensaje claro", async () => {
    const repo = new RepositorioMemoria({ falla: "eventos" });
    await repo.reemplazarTodo(flotaDePrueba());
    const error = await repo.escribir(sinCambios(), []).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorDeRepositorio);
    expect((error as ErrorDeRepositorio).codigo).toBe("escritura-fallida");
    expect((error as ErrorDeRepositorio).message.length).toBeGreaterThan(10);
  });
});
