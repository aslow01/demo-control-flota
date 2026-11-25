// E2-P: las flechas, Inicio y Fin de la regla de vencimientos y de las solapas (un solo punto de tabulación, el resto se recorre con el teclado).
import { describe, expect, it } from "vitest";
import { indiceTrasTecla } from "../src/lib/estado/teclado-lista.ts";

describe("indiceTrasTecla", () => {
  it("derecha avanza y izquierda retrocede", () => {
    expect(indiceTrasTecla("ArrowRight", 2, 5)).toBe(3);
    expect(indiceTrasTecla("ArrowLeft", 2, 5)).toBe(1);
  });

  it("da la vuelta en los extremos", () => {
    expect(indiceTrasTecla("ArrowRight", 4, 5)).toBe(0);
    expect(indiceTrasTecla("ArrowLeft", 0, 5)).toBe(4);
  });

  it("Inicio va al primero y Fin al último, desde cualquier lugar", () => {
    expect(indiceTrasTecla("Home", 3, 5)).toBe(0);
    expect(indiceTrasTecla("End", 1, 5)).toBe(4);
    expect(indiceTrasTecla("Home", 0, 5)).toBe(0);
    expect(indiceTrasTecla("End", 4, 5)).toBe(4);
  });

  it("la regla también recorre con arriba y abajo (el eje es 'ambos'); las solapas no", () => {
    expect(indiceTrasTecla("ArrowDown", 1, 5, "ambos")).toBe(2);
    expect(indiceTrasTecla("ArrowUp", 1, 5, "ambos")).toBe(0);
    expect(indiceTrasTecla("ArrowDown", 1, 5)).toBeNull();
    expect(indiceTrasTecla("ArrowUp", 1, 5, "horizontal")).toBeNull();
  });

  it("con una sola cosa, se queda en ella", () => {
    expect(indiceTrasTecla("ArrowRight", 0, 1)).toBe(0);
    expect(indiceTrasTecla("ArrowLeft", 0, 1)).toBe(0);
    expect(indiceTrasTecla("End", 0, 1)).toBe(0);
  });

  it("sin nada que recorrer, o con otra tecla, no hace nada", () => {
    expect(indiceTrasTecla("ArrowRight", 0, 0)).toBeNull();
    expect(indiceTrasTecla("Home", 0, 0)).toBeNull();
    for (const tecla of ["Enter", " ", "Tab", "a", "PageDown", "Escape", ""]) expect(indiceTrasTecla(tecla, 1, 5, "ambos"), tecla).toBeNull();
  });

  it("un índice actual fuera de rango (la lista cambió) se toma como «ninguno»: derecha va al primero e izquierda al último", () => {
    expect(indiceTrasTecla("ArrowRight", 9, 5)).toBe(0);
    expect(indiceTrasTecla("ArrowLeft", 9, 5)).toBe(4);
    expect(indiceTrasTecla("ArrowRight", -1, 5)).toBe(0);
    expect(indiceTrasTecla("ArrowLeft", -1, 5)).toBe(4);
  });

  it("no inventa índices con cantidades raras", () => {
    expect(indiceTrasTecla("ArrowRight", 0, -2)).toBeNull();
    expect(indiceTrasTecla("ArrowRight", 0, Number.NaN)).toBeNull();
    expect(indiceTrasTecla("ArrowRight", Number.NaN, 5)).toBeNull();
  });
});
