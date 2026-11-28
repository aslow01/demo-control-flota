// Teclado del tablero de llaves de la regla de salida (docs/diseno-ui.md, 15.6.3): una sola parada de Tab, flechas de a una, Inicio y Fin.
// Puro: la vista solo mueve el foco al índice que devuelve y pasa el `tabindex="0"` a esa llave.
import { describe, expect, it } from "vitest";
import { indiceDeEntrada, indiceTrasTecla } from "../src/componentes/teclado-llaves.ts";

describe("indiceTrasTecla: flechas, Inicio y Fin", () => {
  it("la flecha derecha avanza de a una y la izquierda retrocede de a una", () => {
    expect(indiceTrasTecla("ArrowRight", 3, 10)).toBe(4);
    expect(indiceTrasTecla("ArrowLeft", 3, 10)).toBe(2);
  });

  it("no da la vuelta: en los extremos se queda donde está (el cursor separa las que salen de las que no)", () => {
    expect(indiceTrasTecla("ArrowRight", 9, 10)).toBe(9);
    expect(indiceTrasTecla("ArrowLeft", 0, 10)).toBe(0);
  });

  it("Inicio va a la primera y Fin a la última, desde cualquier lugar", () => {
    expect(indiceTrasTecla("Home", 6, 10)).toBe(0);
    expect(indiceTrasTecla("End", 2, 10)).toBe(9);
  });

  it("con una sola llave todas las teclas de navegación dan 0", () => {
    for (const tecla of ["ArrowRight", "ArrowLeft", "Home", "End"]) expect(indiceTrasTecla(tecla, 0, 1), tecla).toBe(0);
  });

  it("las demás teclas no mueven nada (devuelve null para que la vista las deje pasar): Tab, Enter, arriba, abajo, letras", () => {
    for (const tecla of ["Tab", "Enter", " ", "ArrowUp", "ArrowDown", "a", "Escape", "PageDown", ""]) expect(indiceTrasTecla(tecla, 2, 10), tecla).toBeNull();
  });

  it("sin llaves no hay a dónde ir, sea cual sea la tecla", () => {
    for (const tecla of ["ArrowRight", "ArrowLeft", "Home", "End"]) expect(indiceTrasTecla(tecla, 0, 0), tecla).toBeNull();
  });

  it("un índice actual que ya no existe (la lista cambió) cuenta como «ninguno»: la derecha va a la primera y la izquierda a la última", () => {
    expect(indiceTrasTecla("ArrowRight", 12, 5)).toBe(0);
    expect(indiceTrasTecla("ArrowLeft", 12, 5)).toBe(4);
    expect(indiceTrasTecla("ArrowRight", -1, 5)).toBe(0);
    expect(indiceTrasTecla("ArrowLeft", -1, 5)).toBe(4);
  });

  it("entradas absurdas (cantidad o índice no enteros, negativos) no devuelven un índice inventado", () => {
    expect(indiceTrasTecla("ArrowRight", 0, Number.NaN)).toBeNull();
    expect(indiceTrasTecla("ArrowRight", 0, 2.5)).toBeNull();
    expect(indiceTrasTecla("ArrowRight", 0, -3)).toBeNull();
    expect(indiceTrasTecla("ArrowRight", Number.NaN, 5)).toBeNull();
    expect(indiceTrasTecla("ArrowRight", 1.5, 5)).toBeNull();
  });

  it("recorre las 23 llaves de la semilla de punta a punta sin salirse", () => {
    let i = 0;
    for (let paso = 0; paso < 40; paso++) i = indiceTrasTecla("ArrowRight", i, 23) ?? -1;
    expect(i).toBe(22);
    for (let paso = 0; paso < 40; paso++) i = indiceTrasTecla("ArrowLeft", i, 23) ?? -1;
    expect(i).toBe(0);
  });
});

describe("indiceDeEntrada: qué llave tiene el tabindex=0", () => {
  const sale = (...v: boolean[]) => v;

  it("la primera vez es la primera que no sale", () => {
    expect(indiceDeEntrada(sale(true, true, false, false), null)).toBe(2);
  });

  it("si todas salen, la primera llave", () => {
    expect(indiceDeEntrada(sale(true, true, true), null)).toBe(0);
  });

  it("si ninguna sale, la primera llave (que es también la primera que no sale)", () => {
    expect(indiceDeEntrada(sale(false, false), null)).toBe(0);
  });

  it("después, la última enfocada, aunque sea una que sale", () => {
    expect(indiceDeEntrada(sale(true, true, false, false), 1)).toBe(1);
    expect(indiceDeEntrada(sale(true, true, false, false), 3)).toBe(3);
  });

  it("si la última enfocada ya no existe (la lista se achicó), vuelve a la regla de la primera vez", () => {
    expect(indiceDeEntrada(sale(true, false), 7)).toBe(1);
    expect(indiceDeEntrada(sale(true, false), -2)).toBe(1);
    expect(indiceDeEntrada(sale(true, false), 1.5)).toBe(1);
  });

  it("sin llaves no hay parada de tabulación", () => {
    expect(indiceDeEntrada([], null)).toBeNull();
    expect(indiceDeEntrada([], 0)).toBeNull();
  });
});
