// Suite de contrato del repositorio (docs/diseno.md, sección 10): la corren todas las implementaciones
// (memoria ahora; IndexedDB cuando se apruebe fake-indexeddb, decisión S2) con exactamente las mismas pruebas.

import { describe, expect, it } from "vitest";
import { sinCambios, type Cambios } from "../src/lib/dominio/estado.ts";
import { ErrorDeRepositorio, type Repositorio } from "../src/lib/persistencia/repositorio.ts";
import type { Estado, Evento } from "../src/lib/dominio/tipos.ts";
import { generar } from "../src/lib/datos/generador.ts";
import { checklistEnOrden, flotaDePrueba, novedad, parte } from "./ayuda.ts";

function evento(parcial: Partial<Evento> = {}): Evento {
  return {
    id: "ev-1",
    secuencia: 1,
    instante: "2026-11-18T15:00:00.000Z",
    unidadId: "u1",
    conductorId: null,
    tipo: "novedad-abierta",
    resumen: "Novedad abierta",
    datos: { a: 1 },
    autor: "Rocío Medina",
    ...parcial,
  };
}

function cambios(parcial: Partial<Cambios> = {}): Cambios {
  return { ...sinCambios(), ...parcial };
}

/** Todo lo que guarda un repositorio, para comparar "antes" y "después" de una escritura rechazada. */
async function foto(repo: Repositorio): Promise<Estado | null> {
  return repo.cargar();
}

export function describirContrato(nombre: string, crear: () => Promise<Repositorio>): void {
  describe(`contrato del repositorio: ${nombre}`, () => {
    async function conFlota(): Promise<{ repo: Repositorio; base: Estado }> {
      const repo = await crear();
      const base = flotaDePrueba();
      await repo.reemplazarTodo(base);
      return { repo, base };
    }

    it("una base vacía devuelve null (primera visita, D4)", async () => {
      const repo = await crear();
      expect(await repo.cargar()).toBeNull();
    });

    it("reemplazarTodo y cargar devuelven exactamente lo mismo", async () => {
      const { repo, base } = await conFlota();
      expect(await repo.cargar()).toEqual(base);
    });

    it("el ejemplo completo del generador (más de mil eventos) hace el viaje de ida y vuelta", async () => {
      const repo = await crear();
      const ejemplo = generar(20261118, "2026-11-18");
      await repo.reemplazarTodo(ejemplo);
      expect(await repo.cargar()).toEqual(ejemplo);
    });

    it("escribir sobre una base vacía se rechaza (primero se carga el ejemplo)", async () => {
      const repo = await crear();
      await expect(repo.escribir(cambios(), [evento()])).rejects.toBeInstanceOf(ErrorDeRepositorio);
      expect(await repo.cargar()).toBeNull();
    });

    it("reemplazarTodo reemplaza, no mezcla: lo anterior desaparece", async () => {
      const { repo } = await conFlota();
      const otro = { ...flotaDePrueba(), unidades: [], documentos: [], partes: [] };
      await repo.reemplazarTodo(otro);
      const leido = await repo.cargar();
      expect(leido?.unidades).toEqual([]);
      expect(leido?.partes).toEqual([]);
    });

    it("lo guardado es una copia: cambiar el objeto original después no cambia lo guardado", async () => {
      const repo = await crear();
      const base = flotaDePrueba();
      await repo.reemplazarTodo(base);
      base.unidades[0]!.interno = 999;
      expect((await repo.cargar())?.unidades[0]?.interno).toBe(7);
    });

    it("lo leído es una copia: cambiarlo no cambia lo guardado", async () => {
      const { repo } = await conFlota();
      const leido = await repo.cargar();
      leido!.unidades[0]!.interno = 999;
      leido!.eventos.push(evento());
      const otra = await repo.cargar();
      expect(otra?.unidades[0]?.interno).toBe(7);
      expect(otra?.eventos).toEqual([]);
    });

    it("H1/P12: escribir guarda cambios y eventos juntos, y los eventos quedan al final y en orden", async () => {
      const { repo, base } = await conFlota();
      const unidadFuera = { ...base.unidades[0]!, estado: { tipo: "fuera-de-servicio" as const, desde: "2026-11-18", motivo: "En taller", origen: "manual" as const, novedadIds: [] } };
      const n = novedad({ id: "n-nueva", unidadId: "u1" });
      await repo.escribir(
        cambios({ unidades: [unidadFuera], novedades: [n] }),
        [evento({ id: "e1", secuencia: 1 }), evento({ id: "e2", secuencia: 2, tipo: "fuera-de-servicio" })],
      );
      const leido = (await repo.cargar())!;
      expect(leido.unidades[0]?.estado.tipo).toBe("fuera-de-servicio");
      expect(leido.unidades).toHaveLength(2);
      expect(leido.novedades).toEqual([n]);
      expect(leido.eventos.map((x) => x.id)).toEqual(["e1", "e2"]);
    });

    it("escribir con un id existente reemplaza ese registro (no lo duplica) y no toca los demás", async () => {
      const { repo, base } = await conFlota();
      const cambiado = { ...base.documentos[0]!, numero: "DEMO-CAMBIADO" };
      await repo.escribir(cambios({ documentos: [cambiado] }), []);
      const leido = (await repo.cargar())!;
      expect(leido.documentos).toHaveLength(base.documentos.length);
      expect(leido.documentos.find((d) => d.id === cambiado.id)?.numero).toBe("DEMO-CAMBIADO");
      expect(leido.unidades).toEqual(base.unidades);
    });

    it("las correcciones de kilometraje y los partes se guardan y se actualizan", async () => {
      const { repo } = await conFlota();
      const p = parte({ id: "borrador-1", unidadId: "u1", fecha: "2026-11-18", estado: "borrador", enviado: null, kmFin: null, checklist: checklistEnOrden() });
      await repo.escribir(
        cambios({
          partes: [p],
          correccionesKm: [{ id: "k1", unidadId: "u1", desde: "2026-11-18", kmBase: 120, motivo: "Cambio de tablero", instante: "2026-11-18T15:00:00.000Z", autor: "Rocío Medina" }],
        }),
        [],
      );
      await repo.escribir(cambios({ partes: [{ ...p, kmFin: 84400 }] }), []);
      const leido = (await repo.cargar())!;
      expect(leido.partes.filter((x) => x.id === "borrador-1")).toHaveLength(1);
      expect(leido.partes.find((x) => x.id === "borrador-1")?.kmFin).toBe(84400);
      expect(leido.correccionesKm).toHaveLength(1);
    });

    it("descartar un borrador lo borra y no toca los partes enviados", async () => {
      const { repo } = await conFlota();
      const p = parte({ id: "borrador-1", unidadId: "u1", fecha: "2026-11-18", estado: "borrador", enviado: null });
      await repo.escribir(cambios({ partes: [p] }), []);
      await repo.escribir(cambios({ partesBorrados: ["borrador-1"] }), []);
      const leido = (await repo.cargar())!;
      expect(leido.partes.map((x) => x.id)).toEqual(["p-u1-ayer", "p-u2-ayer"]);
    });

    it("cambios.meta reemplaza el registro de meta", async () => {
      const { repo, base } = await conFlota();
      await repo.escribir(cambios({ meta: { ...base.meta, modificada: true } }), []);
      expect((await repo.cargar())?.meta.modificada).toBe(true);
    });

    it("P1: el índice único [unidadId, fecha] rechaza un segundo parte de la misma unidad y fecha", async () => {
      const { repo, base } = await conFlota();
      const repetido = parte({ id: "otro-parte", unidadId: "u1", fecha: "2026-11-17", estado: "borrador", enviado: null });
      const antes = await foto(repo);
      const error = await repo.escribir(cambios({ partes: [repetido] }), []).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ErrorDeRepositorio);
      expect((error as ErrorDeRepositorio).codigo).toBe("indice-unico");
      expect(await foto(repo)).toEqual(antes);
      expect(base.partes).toHaveLength(2);
    });

    it("P1: reescribir el mismo parte (mismo id, misma unidad y fecha) no viola el índice", async () => {
      const { repo, base } = await conFlota();
      await repo.escribir(cambios({ partes: [{ ...base.partes[0]!, autor: "Otra persona" }] }), []);
      expect((await repo.cargar())?.partes.find((p) => p.id === "p-u1-ayer")?.autor).toBe("Otra persona");
    });

    it("el índice único de patente rechaza una unidad con la patente de otra", async () => {
      const { repo, base } = await conFlota();
      const clon = { ...base.unidades[0]!, id: "u-clon", interno: 50 };
      const error = await repo.escribir(cambios({ unidades: [clon] }), []).catch((e: unknown) => e);
      expect((error as ErrorDeRepositorio).codigo).toBe("indice-unico");
      expect((await repo.cargar())?.unidades).toHaveLength(2);
    });

    it("P12/D10: si una escritura falla a mitad, no queda nada a medias (ni cambios ni eventos)", async () => {
      const { repo, base } = await conFlota();
      const antes = await foto(repo);
      const unidadFuera = { ...base.unidades[0]!, estado: { tipo: "fuera-de-servicio" as const, desde: "2026-11-18", motivo: "En taller", origen: "manual" as const, novedadIds: [] } };
      const repetido = parte({ id: "otro-parte", unidadId: "u1", fecha: "2026-11-17", estado: "borrador", enviado: null });
      await expect(
        repo.escribir(
          cambios({ unidades: [unidadFuera], novedades: [novedad({ id: "n-x" })], partes: [repetido] }),
          [evento({ id: "e-x", secuencia: 1 })],
        ),
      ).rejects.toBeInstanceOf(ErrorDeRepositorio);
      expect(await foto(repo)).toEqual(antes);
    });

    it("H2: los eventos no se pisan: un id repetido se rechaza y no se escribe nada de lo demás", async () => {
      const { repo, base } = await conFlota();
      await repo.escribir(cambios(), [evento({ id: "e1", secuencia: 1, resumen: "Original" })]);
      const antes = await foto(repo);
      const unidadFuera = { ...base.unidades[0]!, estado: { tipo: "baja" as const, desde: "2026-11-18", motivo: "Venta" } };
      const error = await repo
        .escribir(cambios({ unidades: [unidadFuera] }), [evento({ id: "e2", secuencia: 2 }), evento({ id: "e1", secuencia: 3, resumen: "Pisado" })])
        .catch((e: unknown) => e);
      expect((error as ErrorDeRepositorio).codigo).toBe("evento-repetido");
      expect(await foto(repo)).toEqual(antes);
      expect((await repo.cargar())?.eventos[0]?.resumen).toBe("Original");
    });

    it("H2: el repositorio no ofrece editar ni borrar eventos (lo comprueba tsc)", async () => {
      const repo = await crear();
      // @ts-expect-error no existe actualizarEvento
      expect(repo.actualizarEvento).toBeUndefined();
      // @ts-expect-error no existe borrarEvento
      expect(repo.borrarEvento).toBeUndefined();
      // @ts-expect-error los eventos no viajan dentro de los cambios: van aparte y solo se agregan
      const malos: Cambios = { ...sinCambios(), eventos: [] };
      expect(malos).toBeDefined();
    });

    it("D6/H2: solo 'vaciar' (reiniciar la demo) borra todo, también los eventos", async () => {
      const { repo } = await conFlota();
      await repo.escribir(cambios(), [evento()]);
      await repo.vaciar();
      expect(await repo.cargar()).toBeNull();
    });

    it("después de vaciar se puede volver a cargar un estado", async () => {
      const { repo, base } = await conFlota();
      await repo.vaciar();
      await repo.reemplazarTodo(base);
      expect(await repo.cargar()).toEqual(base);
    });

    it("dos escrituras seguidas se acumulan en orden", async () => {
      const { repo } = await conFlota();
      await repo.escribir(cambios(), [evento({ id: "a", secuencia: 1 })]);
      await repo.escribir(cambios(), [evento({ id: "b", secuencia: 2 }), evento({ id: "c", secuencia: 3 })]);
      expect((await repo.cargar())?.eventos.map((x) => x.id)).toEqual(["a", "b", "c"]);
    });

    it("una escritura vacía es válida y no cambia nada", async () => {
      const { repo, base } = await conFlota();
      await repo.escribir(cambios(), []);
      expect(await repo.cargar()).toEqual(base);
    });

    it("los textos raros (comillas, HTML, emoji) se guardan literales", async () => {
      const { repo } = await conFlota();
      const raro = novedad({ id: "n-raro", descripcion: "<img src=x onerror=alert(1)> \"comillas\" 'simples' 🚚 \u0000" });
      await repo.escribir(cambios({ novedades: [raro] }), []);
      expect((await repo.cargar())?.novedades[0]?.descripcion).toBe(raro.descripcion);
    });
  });
}
