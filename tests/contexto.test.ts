import { describe, expect, it } from "vitest";
import { aplicar, ejecutar, type Comando } from "../src/lib/dominio/comandos.ts";
import { PROYECTO_BASE, contexto, flotaDePrueba } from "./ayuda.ts";

// M2: el contexto (hoy, ahora) viene de afuera. Un valor malo no puede guardarse y envenenar el estado.
const alta: Comando = {
  tipo: "altaUnidad",
  patente: "ZKB999",
  interno: 99,
  marca: "Marca",
  modelo: "Modelo",
  anio: 2021,
  tipoUnidad: "camioneta",
  proyectoId: PROYECTO_BASE.id,
  conductorId: null,
};

describe("M2: el contexto de los comandos se valida", () => {
  it("un contexto coherente (hoy es la fecha de Argentina de ahora) se acepta", () => {
    const r = ejecutar(flotaDePrueba(), alta, contexto({ hoy: "2026-11-18", ahora: "2026-11-18T15:00:00.000Z" }));
    expect(r.ok).toBe(true);
  });

  it("hoy coincide con ahora aun cerca de la medianoche de Argentina (02:59Z es el día anterior)", () => {
    expect(() => aplicar(flotaDePrueba(), alta, contexto({ hoy: "2026-11-17", ahora: "2026-11-18T02:59:59.999Z" }))).not.toThrow();
    expect(() => aplicar(flotaDePrueba(), alta, contexto({ hoy: "2026-11-18", ahora: "2026-11-18T03:00:00.000Z" }))).not.toThrow();
    expect(() => aplicar(flotaDePrueba(), alta, contexto({ hoy: "2026-11-18", ahora: "2026-11-18T02:59:59.999Z" }))).toThrow(/no coincide/);
  });

  it("'ahora' que no es un instante ISO con Z se rechaza con un mensaje claro y no se guarda nada", () => {
    const estado = flotaDePrueba();
    const malos = ["ayer", "", "2026-11-18T01:00:00", "2026-11-18", "18 Nov 2026 01:00 UTC", "2026-11-18T01:00:00-03:00", "2026-02-30T10:00:00.000Z"];
    for (const ahora of malos) {
      expect(() => ejecutar(estado, alta, contexto({ ahora })), ahora).toThrow(/Contexto inválido: 'ahora'/);
    }
    expect(estado.unidades).toHaveLength(2);
  });

  it("'ahora' sin milisegundos se rechaza: los instantes del historial se comparan como texto", () => {
    expect(() => aplicar(flotaDePrueba(), alta, contexto({ ahora: "2026-11-18T15:00:00Z" }))).toThrow(/Contexto inválido: 'ahora'/);
  });

  it("'hoy' que no es una fecha civil válida se rechaza", () => {
    for (const hoy of ["hoy", "", "2026-02-30", "2026-11-18T00:00:00.000Z", "18/11/2026", "1999-12-31"]) {
      expect(() => aplicar(flotaDePrueba(), alta, contexto({ hoy })), hoy).toThrow(/Contexto inválido: 'hoy'/);
    }
  });

  it("'hoy' distinto de la fecha de Argentina de 'ahora' se rechaza (dos fuentes de verdad que no pueden discrepar)", () => {
    expect(() => aplicar(flotaDePrueba(), alta, contexto({ hoy: "2026-11-19", ahora: "2026-11-18T15:00:00.000Z" }))).toThrow(
      /no coincide/,
    );
  });

  it("'autor' y 'nuevoId' son obligatorios", () => {
    expect(() => aplicar(flotaDePrueba(), alta, contexto({ autor: "" }))).toThrow(/Contexto inválido: 'autor'/);
    expect(() => aplicar(flotaDePrueba(), alta, { ...contexto(), nuevoId: undefined as never })).toThrow(/Contexto inválido: 'nuevoId'/);
  });
});
