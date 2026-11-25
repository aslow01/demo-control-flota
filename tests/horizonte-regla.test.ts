// E2-P (3.7): lo que necesita la regla de vencimientos interactiva (forma de cada marca, orden de recorrido, filas y «y N más»), sin DOM.
import { describe, expect, it } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import {
  FILAS_DE_REGLA,
  MAX_POR_DIA_EN_REGLA,
  SEPARACION_MINIMA_EN_DIAS,
  asignarFilas,
  formaDeGrupo,
  formaDeTramo,
  horizonteCompleto,
  recorridoDeRegla,
} from "../src/lib/dominio/horizonte.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { PROYECTO_BASE, documento, estadoVacio, unidad } from "./ayuda.ts";

const H = "2026-11-18";

/** Una unidad por vencimiento (proyecto sin habilitación): el seguro de cada una vence en el día dado y lo demás vale mucho. */
function estadoQueVenceEn(dias: number[]): Estado {
  const unidades = dias.map((_, i) => unidad({ id: `u${i}`, patente: `ZK21${i}BD`, interno: i + 1, proyectoId: PROYECTO_BASE.id, creada: `${H}T12:00:00.000Z` }));
  const documentos = dias.flatMap((d, i) =>
    (["seguro", "revision-tecnica", "matafuego"] as const).map((tipo) =>
      documento({ id: `d${i}-${tipo}`, titular: { tipo: "unidad", id: `u${i}` }, tipo, vence: sumarDias(H, tipo === "seguro" ? d : 400) }),
    ),
  );
  return estadoVacio({ unidades, documentos, proyectos: [PROYECTO_BASE] });
}

const regla = (dias: number[], max = MAX_POR_DIA_EN_REGLA) => recorridoDeRegla(horizonteCompleto(calcularAlertas(estadoQueVenceEn(dias), H), { maxApiladas: max }));

describe("forma de cada marca (rombo, triángulo, círculo, aro)", () => {
  it("cada tramo tiene la suya y los vencidos o faltantes, el rombo", () => {
    expect(formaDeTramo("semana")).toBe("triangulo");
    expect(formaDeTramo("quincena")).toBe("circulo");
    expect(formaDeTramo("mes")).toBe("aro");
    expect(formaDeGrupo("vencidos")).toBe("rombo");
    expect(formaDeGrupo("7")).toBe("triangulo");
    expect(formaDeGrupo("15")).toBe("circulo");
    expect(formaDeGrupo("30")).toBe("aro");
  });

  it("las cuatro formas son distintas (no se distinguen solo por el color)", () => {
    const formas = [formaDeGrupo("vencidos"), formaDeGrupo("7"), formaDeGrupo("15"), formaDeGrupo("30")];
    expect(new Set(formas).size).toBe(4);
  });
});

describe("filas de la regla (dos filas sin pisar etiquetas)", () => {
  it("la primera marca va en la fila 0 y una cercana, en la 1", () => {
    expect(asignarFilas([0, 1])).toEqual([0, 1]);
  });

  it("una marca lejos de la anterior vuelve a la fila 0", () => {
    expect(asignarFilas([0, 1, 5])).toEqual([0, 1, 0]);
  });

  it("la separación mínima es de 2,7 días: a 2,7 cabe en la misma fila y a menos no", () => {
    expect(SEPARACION_MINIMA_EN_DIAS).toBe(2.7);
    expect(asignarFilas([0, 3])).toEqual([0, 0]);
    expect(asignarFilas([0, 2])).toEqual([0, 1]);
  });

  it("si las dos filas están ocupadas, va a la que quedó más lejos (no apila sobre la última)", () => {
    expect(asignarFilas([0, 1, 2])).toEqual([0, 1, 0]);
    expect(asignarFilas([0, 1, 1])).toEqual([0, 1, 0]);
    expect(asignarFilas([0, 0, 1])).toEqual([0, 1, 0]);
  });

  it("sin marcas no hay filas, y siempre se usan solo las filas que hay", () => {
    expect(asignarFilas([])).toEqual([]);
    expect(FILAS_DE_REGLA).toBe(2);
    const filas = asignarFilas([0, 0, 0, 1, 1, 1, 2, 2, 2]);
    for (const f of filas) expect([0, 1]).toContain(f);
  });

  it("no cambia la lista que recibe", () => {
    const dias = [3, 1, 2];
    asignarFilas(dias);
    expect(dias).toEqual([3, 1, 2]);
  });
});

describe("recorrido de la regla con el ejemplo del generador", () => {
  const h = horizonteCompleto(calcularAlertas(generar(SEMILLA_POR_DEFECTO, H), H), { maxApiladas: MAX_POR_DIA_EN_REGLA });
  const r = recorridoDeRegla(h);

  it("es una marca por vencimiento próximo, de hoy hacia adelante: días 0, 1, 5, 7, 8, 12, 15, 16 y 30", () => {
    expect(r.map((x) => x.dia)).toEqual([0, 1, 5, 7, 8, 12, 15, 16, 30]);
    expect(r.every((x) => x.tipo === "marca")).toBe(true);
    expect(new Set(r.map((x) => x.alertaId)).size).toBe(9);
  });

  it("cada marca lleva su forma por tramo y la columna es día + 1", () => {
    for (const x of r) {
      expect(x.columna).toBe(x.dia + 1);
      if (x.tipo === "marca") expect(x.forma).toBe(formaDeTramo(x.tramo));
    }
    expect(r[0]).toMatchObject({ tramo: "semana", forma: "triangulo" });
    expect(r[4]).toMatchObject({ dia: 8, tramo: "quincena", forma: "circulo" });
    expect(r[8]).toMatchObject({ dia: 30, tramo: "mes", forma: "aro" });
  });

  it("las filas siguen la regla de 2,7 días", () => {
    expect(r.map((x) => x.fila)).toEqual([0, 1, 0, 1, 0, 0, 0, 1, 0]);
    expect(r.map((x) => x.fila)).toEqual(asignarFilas(r.map((x) => x.dia)));
  });
});

describe("recorrido de la regla con varios el mismo día", () => {
  it("dos el mismo día: dos marcas, una en cada fila", () => {
    const r = regla([5, 5]);
    expect(r.map((x) => [x.tipo, x.dia, x.fila])).toEqual([
      ["marca", 5, 0],
      ["marca", 5, 1],
    ]);
  });

  it("tres el mismo día: una marca y «y 2 más» (la hueca pasa a ser un botón)", () => {
    const r = regla([5, 5, 5]);
    expect(r.map((x) => x.tipo)).toEqual(["marca", "mas"]);
    const mas = r[1];
    expect(mas).toMatchObject({ tipo: "mas", dia: 5, columna: 6, tramo: "semana", mas: 2, fila: 1 });
  });

  it("cinco el mismo día: «y 4 más»", () => {
    const r = regla([12, 12, 12, 12, 12]);
    expect(r.at(-1)).toMatchObject({ tipo: "mas", mas: 4, tramo: "quincena" });
    expect(r).toHaveLength(2);
  });

  it("el «y N más» queda en el orden del recorrido, entre los días vecinos", () => {
    const r = regla([2, 9, 9, 9, 20]);
    expect(r.map((x) => [x.tipo, x.dia])).toEqual([
      ["marca", 2],
      ["marca", 9],
      ["mas", 9],
      ["marca", 20],
    ]);
  });

  it("con el máximo por defecto de la variante completa (4) también se arma el «y N más»", () => {
    const r = regla([3, 3, 3, 3, 3, 3], 4);
    expect(r.map((x) => x.tipo)).toEqual(["marca", "marca", "marca", "mas"]);
    expect(r.at(-1)).toMatchObject({ mas: 3 });
  });

  it("el «y N más» nunca tiene cantidad cero y una marca nunca tiene `mas`", () => {
    for (const x of regla([1, 1, 1, 4, 4])) {
      if (x.tipo === "mas") expect(x.mas).toBeGreaterThan(0);
      else expect("mas" in x).toBe(false);
    }
  });
});

describe("recorrido de una regla vacía", () => {
  it("sin vencimientos próximos no hay nada que recorrer", () => {
    expect(regla([])).toEqual([]);
    expect(regla([200])).toEqual([]);
  });

  it("los vencidos no están en la pista", () => {
    expect(regla([-3, -1])).toEqual([]);
  });
});
