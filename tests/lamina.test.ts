import { describe, expect, it } from "vitest";
import { type Ruta } from "../src/lib/estado/enrutador.ts";
import { codigoDeLamina, padreDeLamina } from "../src/componentes/lamina.ts";

// El encabezado de lámina del escritorio (docs/diseno-ui.md, 15.4.3 y 15.9): el código de cada pantalla y, en la ficha y el parte, el enlace al padre.

const RUTAS: [Ruta, string][] = [
  [{ tipo: "inicio" }, "FL-01"],
  [{ tipo: "movilidades" }, "FL-02"],
  [{ tipo: "vencimientos" }, "FL-03"],
  [{ tipo: "operacion", solapa: "partes" }, "FL-04"],
  [{ tipo: "operacion", solapa: "novedades" }, "FL-04"],
  [{ tipo: "unidad", patente: "ZK214BD" }, "FL-05"],
  [{ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" }, "FL-06"],
  [{ tipo: "conductor" }, "FL-07"],
  [{ tipo: "mis-partes" }, "FL-08"],
  [{ tipo: "mas" }, "FL-09"],
];

describe("codigoDeLamina", () => {
  it.each(RUTAS)("%j es %s", (ruta, codigo) => {
    expect(codigoDeLamina(ruta)).toBe(codigo);
  });

  it("una dirección que no es ninguna pantalla no tiene código", () => {
    expect(codigoDeLamina({ tipo: "desconocida" })).toBeNull();
  });

  it("los códigos de las nueve pantallas son distintos", () => {
    expect(new Set(RUTAS.map(([, c]) => c)).size).toBe(9);
  });
});

describe("padreDeLamina", () => {
  it("la ficha y el parte llevan el enlace al padre (el padre que calcula la aplicación) con «Volver a …»", () => {
    expect(padreDeLamina({ tipo: "movilidades", filtro: "no-disponibles" })).toEqual({
      href: "#/movilidades?filtro=no-disponibles",
      texto: "Movilidades",
      nombreAccesible: "Volver a Movilidades",
    });
  });

  it("en Operación diaria el texto es el corto («Operación»), como el de la navegación, y el nombre accesible nombra la pantalla entera", () => {
    const p = padreDeLamina({ tipo: "operacion", solapa: "partes" });
    expect(p.href).toBe("#/operacion/partes");
    expect(p.texto).toBe("Operación");
    expect(p.nombreAccesible).toBe("Volver a Operación diaria");
  });

  it("«Hoy» vuelve a «Hoy»", () => {
    const p = padreDeLamina({ tipo: "conductor" });
    expect(p.texto).toBe("Hoy");
    expect(p.nombreAccesible).toBe("Volver a Hoy");
  });
});
