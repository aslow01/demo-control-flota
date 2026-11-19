import { describe, expect, it } from "vitest";
import {
  advertenciasDeKm,
  kmActual,
  parsearKm,
  reformatearKm,
  textoRecorrido,
  validarKilometraje,
  validarRecorrido,
} from "../src/lib/dominio/kilometraje.ts";
import { formatearKm } from "../src/lib/dominio/textos.ts";
import type { CorreccionKm } from "../src/lib/dominio/tipos.ts";
import { parte, unidad } from "./ayuda.ts";

const U = unidad({ id: "u1", patente: "ZK214BD" });

function enviado(fecha: string, kmInicio: number, kmFin: number, instante = `${fecha}T18:00:00.000Z`) {
  return parte({ unidadId: "u1", fecha, kmInicio, kmFin, estado: "enviado", enviado: instante });
}

function correccion(desde: string, kmBase: number, instante = `${desde}T20:00:00.000Z`): CorreccionKm {
  return { id: `k-${desde}`, unidadId: "u1", desde, kmBase, motivo: "Cambio de tablero", instante, autor: "Rocío Medina" };
}

describe("K1: parsear kilometraje", () => {
  it("K1: acepta 84320, 84.320 y 84 320", () => {
    expect(parsearKm("84320")).toEqual({ ok: true, valor: 84320 });
    expect(parsearKm("84.320")).toEqual({ ok: true, valor: 84320 });
    expect(parsearKm("84 320")).toEqual({ ok: true, valor: 84320 });
    expect(parsearKm("  84 320 ")).toEqual({ ok: true, valor: 84320 });
    expect(parsearKm("0")).toEqual({ ok: true, valor: 0 });
    expect(parsearKm("1.234.567")).toEqual({ ok: true, valor: 1234567 });
  });

  it("K1: rechaza decimales con el mensaje de la regla", () => {
    for (const t of ["84,3", "84.3", "84,32", "84.320,5", "0,5"]) {
      const r = parsearKm(t);
      expect(r.ok, t).toBe(false);
      if (!r.ok) expect(r.error.mensaje).toBe("Escriba el kilometraje sin decimales.");
    }
  });

  it("K1: rechaza negativos", () => {
    const r = parsearKm("-5");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toBe("El kilometraje no puede ser negativo.");
  });

  it("K1: rechaza más de 2.000.000 y acepta justo 2.000.000", () => {
    const r = parsearKm("2.000.001");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toBe("El kilometraje no puede superar 2.000.000 km.");
    expect(parsearKm("2000000")).toEqual({ ok: true, valor: 2_000_000 });
    expect(parsearKm("99999999999999999999").ok).toBe(false);
  });

  it("K1: rechaza letras, vacío y agrupaciones raras", () => {
    for (const t of ["", "   ", "abc", "84a", "12.34.567", "84  320", "1e5", "0x10", "٣٤"]) {
      expect(parsearKm(t).ok, t).toBe(false);
    }
    const vacio = parsearKm("");
    if (!vacio.ok) expect(vacio.error.mensaje).toBe("Escriba el kilometraje.");
    const letras = parsearKm("abc");
    if (!letras.ok) expect(letras.error.mensaje).toBe("Escriba el kilometraje solo con números.");
  });

  it("K1: un texto enorme no explota", () => {
    expect(parsearKm("9".repeat(100_000)).ok).toBe(false);
  });

  it("formatearKm usa punto como separador de miles", () => {
    expect(formatearKm(84320)).toBe("84.320");
    expect(formatearKm(120)).toBe("120");
    expect(formatearKm(1234567)).toBe("1.234.567");
    expect(formatearKm(0)).toBe("0");
  });
});

describe("K2: kmFin >= kmInicio", () => {
  it("K2: 84.320 -> 84.319 da el error con los dos números", () => {
    const r = validarRecorrido(84320, 84319);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.mensaje).toBe("El kilometraje al terminar (84.319 km) es menor que al iniciar (84.320 km). Revise los dos números.");
      expect(r.error.campo).toBe("kmFin");
    }
  });

  it("K2: igual es válido y se muestra 'Sin uso'", () => {
    const r = validarRecorrido(84320, 84320);
    expect(r).toEqual({ ok: true, valor: 0 });
    expect(textoRecorrido(0)).toBe("Sin uso");
    expect(textoRecorrido(150)).toBe("150 km");
    expect(textoRecorrido(1250)).toBe("1.250 km");
  });
});

describe("K8 y K9: kilometraje actual", () => {
  it("K8: sin datos es null ('Sin registros')", () => {
    expect(kmActual("u1", [], [])).toBeNull();
  });

  it("K8: es el kmFin del último parte enviado por fecha", () => {
    const partes = [enviado("2026-11-15", 80000, 80100), enviado("2026-11-17", 84000, 84320), enviado("2026-11-16", 80100, 84000)];
    expect(kmActual("u1", partes, [])).toBe(84320);
  });

  it("K8: a igual fecha desempata por instante de envío", () => {
    const a = enviado("2026-11-17", 100, 200, "2026-11-17T12:00:00.000Z");
    const b = enviado("2026-11-17", 200, 300, "2026-11-17T20:00:00.000Z");
    expect(kmActual("u1", [b, a], [])).toBe(300);
  });

  it("K8: una corrección posterior al último parte manda", () => {
    const partes = [enviado("2026-11-17", 84000, 84320)];
    expect(kmActual("u1", partes, [correccion("2026-11-18", 120)])).toBe(120);
  });

  it("K8: una corrección anterior al último parte no lo pisa", () => {
    const partes = [enviado("2026-11-17", 130, 400)];
    expect(kmActual("u1", partes, [correccion("2026-11-16", 120)])).toBe(400);
  });

  it("K8: solo cuenta la unidad pedida", () => {
    const otra = parte({ unidadId: "u2", fecha: "2026-11-17", kmFin: 5, estado: "enviado" });
    expect(kmActual("u1", [otra], [])).toBeNull();
  });

  it("K9: los borradores no cuentan", () => {
    const partes = [
      enviado("2026-11-17", 84000, 84320),
      parte({ unidadId: "u1", fecha: "2026-11-18", estado: "borrador", kmInicio: 84320, kmFin: 99999, enviado: null }),
    ];
    expect(kmActual("u1", partes, [])).toBe(84320);
  });
});

describe("K3: el kilometraje no retrocede", () => {
  const partes = [enviado("2026-11-17", 84000, 84320)];

  it("K3: inicio 84.319 con último registro 84.320 -> error con la patente y la fecha", () => {
    const r = validarKilometraje({ unidad: U, fecha: "2026-11-18", kmInicio: 84319, kmFin: 84400, partes, correcciones: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.mensaje).toBe(
        "El último registro de ZK 214 BD es 84.320 km (parte del 17/11/2026). Revise el número. Si se cambió el tablero, hay que informarlo al encargado.",
      );
      expect(r.error.campo).toBe("kmInicio");
      expect(r.error.codigo).toBe("km-retrocede");
    }
  });

  it("K3: inicio igual al último fin es válido", () => {
    const r = validarKilometraje({ unidad: U, fecha: "2026-11-18", kmInicio: 84320, kmFin: 84400, partes, correcciones: [] });
    expect(r.ok).toBe(true);
  });

  it("K3: compara con el último parte de fecha ANTERIOR, no con partes posteriores ni del mismo día", () => {
    const todos = [...partes, enviado("2026-11-19", 90000, 90100), enviado("2026-11-18", 1, 2)];
    const r = validarKilometraje({ unidad: U, fecha: "2026-11-18", kmInicio: 84320, kmFin: 84400, partes: todos, correcciones: [] });
    // un parte del mismo día no cuenta como anterior (P1 impide que exista), y el del 19 solo limita el fin (K4)
    expect(r.ok).toBe(true);
  });

  it("K3: sin registros anteriores no hay nada que comparar", () => {
    const r = validarKilometraje({ unidad: U, fecha: "2026-11-18", kmInicio: 5, kmFin: 10, partes: [], correcciones: [] });
    expect(r.ok).toBe(true);
  });

  it("K3: no cuentan los borradores", () => {
    const borrador = parte({ unidadId: "u1", fecha: "2026-11-17", estado: "borrador", kmFin: 99999, enviado: null });
    const r = validarKilometraje({ unidad: U, fecha: "2026-11-18", kmInicio: 100, kmFin: 200, partes: [borrador], correcciones: [] });
    expect(r.ok).toBe(true);
  });

  it("K3: si el último registro es una corrección, el error lo dice", () => {
    const r = validarKilometraje({
      unidad: U,
      fecha: "2026-11-18",
      kmInicio: 100,
      kmFin: 200,
      partes,
      correcciones: [correccion("2026-11-17", 120, "2026-11-17T22:00:00.000Z")],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toContain("corrección de kilometraje del 17/11/2026");
  });
});

describe("K4: partes fuera de orden", () => {
  const partes = [enviado("2026-11-15", 79000, 80000), enviado("2026-11-17", 80500, 81000)];

  it("K4: el parte del 16 con fin 80.600 supera el inicio del 17 (80.500)", () => {
    const r = validarKilometraje({ unidad: U, fecha: "2026-11-16", kmInicio: 80000, kmFin: 80600, partes, correcciones: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.mensaje).toBe("El kilometraje supera el del inicio del parte del 17/11/2026 (80.500 km). Revise el número.");
      expect(r.error.campo).toBe("kmFin");
      expect(r.error.codigo).toBe("km-supera-siguiente");
    }
  });

  it("K4: con fin 80.500 (igual al inicio del siguiente) es válido", () => {
    const r = validarKilometraje({ unidad: U, fecha: "2026-11-16", kmInicio: 80000, kmFin: 80500, partes, correcciones: [] });
    expect(r.ok).toBe(true);
  });

  it("K4: una corrección entre medio corta la comparación (K5)", () => {
    const conHueco = [enviado("2026-11-15", 79000, 80000), enviado("2026-11-18", 80500, 81000)];
    const r = validarKilometraje({
      unidad: U,
      fecha: "2026-11-16",
      kmInicio: 80000,
      kmFin: 80600,
      partes: conHueco,
      correcciones: [correccion("2026-11-17", 50)],
    });
    expect(r.ok).toBe(true);
  });
});

describe("K5: la corrección fija la base", () => {
  it("K5: corrección a 120 desde H-2 tras 84.320 -> el parte de H-1 con inicio 130 es válido", () => {
    const partes = [enviado("2026-11-15", 84000, 84320)];
    const r = validarKilometraje({
      unidad: U,
      fecha: "2026-11-17",
      kmInicio: 130,
      kmFin: 200,
      partes,
      correcciones: [correccion("2026-11-16", 120)],
    });
    expect(r.ok).toBe(true);
  });

  it("K5: pero inicio 100 (menor que la base 120) sigue siendo error", () => {
    const partes = [enviado("2026-11-15", 84000, 84320)];
    const r = validarKilometraje({
      unidad: U,
      fecha: "2026-11-17",
      kmInicio: 100,
      kmFin: 200,
      partes,
      correcciones: [correccion("2026-11-16", 120)],
    });
    expect(r.ok).toBe(false);
  });
});

describe("K6 y K7: advertencias", () => {
  it("K6: diferencia 1.001 -> advertencia de salto; 1.000 -> nada", () => {
    expect(advertenciasDeKm({ kmAnterior: 1000, kmInicio: 2001, kmFin: 2100 })).toEqual([{ tipo: "salto-km", km: 1001 }]);
    expect(advertenciasDeKm({ kmAnterior: 1000, kmInicio: 2000, kmFin: 2100 })).toEqual([]);
  });

  it("K6: sin registro anterior no hay salto", () => {
    expect(advertenciasDeKm({ kmAnterior: null, kmInicio: 50000, kmFin: 50100 })).toEqual([]);
  });

  it("K7: recorrido de 1.201 km -> advertencia; 1.200 -> nada", () => {
    expect(advertenciasDeKm({ kmAnterior: 0, kmInicio: 0, kmFin: 1201 })).toEqual([{ tipo: "recorrido-largo", km: 1201 }]);
    expect(advertenciasDeKm({ kmAnterior: 0, kmInicio: 0, kmFin: 1200 })).toEqual([]);
  });

  it("K6 + K7 juntas, salto primero", () => {
    const a = advertenciasDeKm({ kmAnterior: 0, kmInicio: 1250, kmFin: 2600 });
    expect(a.map((x) => x.tipo)).toEqual(["salto-km", "recorrido-largo"]);
  });

  it("validarKilometraje entrega las advertencias del caso C15 (salto de 1.250 km)", () => {
    const partes = [enviado("2026-11-13", 40000, 40100)];
    const r = validarKilometraje({ unidad: U, fecha: "2026-11-14", kmInicio: 41350, kmFin: 41500, partes, correcciones: [] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.advertencias).toEqual([{ tipo: "salto-km", km: 1250 }]);
  });
});

describe("M2 (QA etapa 4): reformatear el km al salir del campo no cambia lo que se escribió", () => {
  it("solo dígitos o miles bien escritos se reformatean con punto de miles", () => {
    expect(reformatearKm("84320")).toBe("84.320");
    expect(reformatearKm("845")).toBe("845");
    expect(reformatearKm("84.320")).toBe("84.320");
    expect(reformatearKm("84 320")).toBe("84.320");
    expect(reformatearKm("1.234.567")).toBe("1.234.567");
    expect(reformatearKm("  84320 ")).toBe("84.320");
    expect(reformatearKm("0")).toBe("0");
  });

  it("un texto con decimales o mal agrupado queda igual, para que la validación lo vea", () => {
    for (const texto of ["84.5", "84.32", "1.2.3", "1.000.00", "12 3", "84,5", "84.320,5", "abc", "-5", "", "1234567890123456"]) {
      expect(reformatearKm(texto)).toBe(texto);
    }
  });

  it("lo que queda sin tocar lo rechaza parsearKm: no se convierte en otro kilometraje", () => {
    expect(parsearKm(reformatearKm("84.5")).ok).toBe(false);
    expect(parsearKm(reformatearKm("1.2.3")).ok).toBe(false);
  });
});

describe("M2: espacios no separables", () => {
  it("un espacio no separable (lo que a veces pega el teclado) cuenta como espacio", () => {
    expect(reformatearKm("84 320")).toBe("84.320");
    expect(reformatearKm("84 320")).toBe("84.320");
  });
});
