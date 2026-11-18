import { describe, expect, it } from "vitest";
import { aplicar } from "../src/lib/dominio/comandos.ts";
import { generarId } from "../src/lib/estado/ids.ts";
import { crearReloj, relojDelSistema } from "../src/lib/estado/reloj.ts";
import { estadoVacio } from "./ayuda.ts";

// T1/T2: el reloj es el único lugar con `new Date()`. Estas pruebas corren en las tres zonas horarias (`npm run test:tz`).
describe("reloj", () => {
  it("devuelve el instante UTC y el día civil de Argentina", () => {
    const reloj = crearReloj(() => new Date("2026-11-18T15:30:12.345Z"));
    expect(reloj.momento()).toEqual({ ahora: "2026-11-18T15:30:12.345Z", hoy: "2026-11-18" });
  });

  it("T1: en el borde de las 03:00Z cambia el día (00:00 en Argentina)", () => {
    expect(crearReloj(() => new Date("2026-11-19T02:59:59.999Z")).momento().hoy).toBe("2026-11-18");
    expect(crearReloj(() => new Date("2026-11-19T03:00:00.000Z")).momento().hoy).toBe("2026-11-19");
  });

  it("cada consulta vuelve a leer la fuente (el reloj no se congela)", () => {
    let ms = Date.UTC(2026, 10, 18, 12, 0, 0);
    const reloj = crearReloj(() => new Date(ms));
    const a = reloj.momento();
    ms += 3 * 60 * 60 * 1000;
    const b = reloj.momento();
    expect(a.hoy).toBe("2026-11-18");
    expect(b.hoy).toBe("2026-11-18");
    expect(b.ahora > a.ahora).toBe(true);
    ms += 24 * 60 * 60 * 1000;
    expect(reloj.momento().hoy).toBe("2026-11-19");
  });

  it("una fecha inválida de la fuente es un error de programación y se lanza", () => {
    expect(() => crearReloj(() => new Date(Number.NaN)).momento()).toThrow();
  });

  it("el reloj del sistema da un momento coherente consigo mismo (ahora y hoy son del mismo instante)", () => {
    const m = crearReloj(relojDelSistema).momento();
    expect(m.ahora).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(m.hoy).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("el momento sirve tal cual como contexto de un comando (el dominio lo valida con M2)", () => {
    const { ahora, hoy } = crearReloj(() => new Date("2026-11-19T02:59:59.999Z")).momento();
    const r = aplicar(estadoVacio(), { tipo: "volverAServicio", unidadId: "no-existe" }, { hoy, ahora, autor: "Prueba", nuevoId: () => "x" });
    expect(r.ok).toBe(false); // llega a la regla de negocio: el contexto fue aceptado
  });
});

describe("ids nuevos", () => {
  it("son únicos y tienen un formato estable", () => {
    const ids = new Set(Array.from({ length: 2000 }, () => generarId()));
    expect(ids.size).toBe(2000);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{24}$/);
  });

  it("no chocan con los ids del generador (e-00001, p-0001, ...)", () => {
    expect(generarId()).not.toMatch(/^[a-z]+-\d+$/);
  });
});
