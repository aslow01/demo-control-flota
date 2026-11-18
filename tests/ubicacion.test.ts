import { describe, expect, it } from "vitest";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";

describe("ubicación en memoria (el doble del navegador para los tests)", () => {
  it("empieza con el hash que se le da", () => {
    expect(ubicacionEnMemoria().leerHash()).toBe("");
    expect(ubicacionEnMemoria("#/flota").leerHash()).toBe("#/flota");
  });

  it("irA cambia el hash y avisa, como un hashchange", () => {
    const u = ubicacionEnMemoria();
    let avisos = 0;
    u.alCambiar(() => avisos++);
    u.irA("#/flota");
    expect(u.leerHash()).toBe("#/flota");
    expect(avisos).toBe(1);
  });

  it("reemplazarHash cambia el hash SIN avisar (replaceState no dispara hashchange)", () => {
    const u = ubicacionEnMemoria("#/unidad/zk214bd");
    let avisos = 0;
    u.alCambiar(() => avisos++);
    u.reemplazarHash("#/unidad/ZK214BD");
    expect(u.leerHash()).toBe("#/unidad/ZK214BD");
    expect(avisos).toBe(0);
  });

  it("dejar de escuchar corta los avisos", () => {
    const u = ubicacionEnMemoria();
    let avisos = 0;
    const dejar = u.alCambiar(() => avisos++);
    dejar();
    u.irA("#/flota");
    expect(avisos).toBe(0);
  });
});
