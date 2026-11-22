import { describe, expect, it } from "vitest";
import {
  advertenciasDeRecorrido,
  advertenciasDeSalida,
  describirRegistro,
  kmActual,
  kmDeRegistro,
  parsearKm,
  reformatearKm,
  registrosDeKm,
  textoRecorrido,
  validarKmDeCierre,
  validarKmDeSalida,
  validarRecorrido,
} from "../src/lib/dominio/kilometraje.ts";
import { formatearKm } from "../src/lib/dominio/textos.ts";
import type { CorreccionKm } from "../src/lib/dominio/tipos.ts";
import { parte, unidad } from "./ayuda.ts";

const U = unidad({ id: "u1", patente: "ZK214BD" });

function enviado(fecha: string, kmInicio: number, kmFin: number, instante = `${fecha}T18:00:00.000Z`) {
  return parte({ unidadId: "u1", fecha, kmInicio, kmFin, estado: "enviado", enviado: instante });
}

/** Un parte en uso: la revisión ya se envió (a las 09:00 de su fecha, salvo que se diga otra cosa) y falta el cierre. */
function enSalida(fecha: string, kmInicio: number, revisado = `${fecha}T09:00:00.000Z`) {
  return parte({ unidadId: "u1", fecha, kmInicio, kmFin: null, combustible: null, estado: "en-uso", revisado, enviado: null });
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

  it("QA B9: un número de muchos dígitos dice que supera el máximo (no «solo con números»)", () => {
    for (const t of ["9".repeat(23), "1".repeat(21), "9".repeat(100_000)]) {
      const r = parsearKm(t);
      expect(r.ok, t.slice(0, 5)).toBe(false);
      if (!r.ok) expect(r.error.mensaje).toBe("El kilometraje no puede superar 2.000.000 km.");
    }
    const letras = parsearKm("1".repeat(21) + "a");
    if (!letras.ok) expect(letras.error.mensaje).toBe("Escriba el kilometraje solo con números.");
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

describe("K3: el kilometraje no retrocede (la salida)", () => {
  const partes = [enviado("2026-11-17", 84000, 84320)];

  it("K3: inicio 84.319 con último registro 84.320 -> error con la patente y la fecha", () => {
    const r = validarKmDeSalida({ unidad: U, fecha: "2026-11-18", kmInicio: 84319, partes, correcciones: [] });
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
    expect(validarKmDeSalida({ unidad: U, fecha: "2026-11-18", kmInicio: 84320, partes, correcciones: [] }).ok).toBe(true);
  });

  it("K3: compara con el último registro de fecha ANTERIOR, no con partes posteriores ni del mismo día", () => {
    const todos = [...partes, enviado("2026-11-19", 90000, 90100), enviado("2026-11-18", 1, 2)];
    expect(validarKmDeSalida({ unidad: U, fecha: "2026-11-18", kmInicio: 84320, partes: todos, correcciones: [] }).ok).toBe(true);
  });

  it("K3: sin registros anteriores no hay nada que comparar", () => {
    expect(validarKmDeSalida({ unidad: U, fecha: "2026-11-18", kmInicio: 5, partes: [], correcciones: [] }).ok).toBe(true);
  });

  it("K3, K9: no cuentan los borradores", () => {
    const borrador = parte({ unidadId: "u1", fecha: "2026-11-17", estado: "borrador", kmFin: 99999, enviado: null, revisado: null });
    expect(validarKmDeSalida({ unidad: U, fecha: "2026-11-18", kmInicio: 100, partes: [borrador], correcciones: [] }).ok).toBe(true);
  });

  it("K3, K10: el kmInicio de un parte en uso del día anterior es el último registro", () => {
    const r = validarKmDeSalida({ unidad: U, fecha: "2026-11-18", kmInicio: 84350, partes: [enSalida("2026-11-17", 84400)], correcciones: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toContain("revisión del 17/11/2026");
  });

  it("K3: si el último registro es una corrección, el error lo dice", () => {
    const r = validarKmDeSalida({ unidad: U, fecha: "2026-11-18", kmInicio: 100, partes, correcciones: [correccion("2026-11-17", 120, "2026-11-17T22:00:00.000Z")] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toContain("corrección de kilometraje del 17/11/2026");
  });
});

describe("K4 y K10: partes fuera de orden", () => {
  const partes = [enviado("2026-11-15", 79000, 80000), enviado("2026-11-17", 80500, 81000)];

  it("K4: el cierre del parte del 16 con fin 80.600 supera el inicio del 17 (80.500)", () => {
    const r = validarKmDeCierre({ unidad: U, fecha: "2026-11-16", kmInicio: 80000, kmFin: 80600, partes, correcciones: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.mensaje).toBe("El kilometraje supera el del inicio del parte del 17/11/2026 (80.500 km). Revise el número.");
      expect(r.error.campo).toBe("kmFin");
      expect(r.error.codigo).toBe("km-supera-siguiente");
    }
  });

  it("K4: con fin 80.500 (igual al inicio del siguiente) es válido", () => {
    expect(validarKmDeCierre({ unidad: U, fecha: "2026-11-16", kmInicio: 80000, kmFin: 80500, partes, correcciones: [] }).ok).toBe(true);
  });

  it("K10: el siguiente puede ser un parte en uso: cuenta su kmInicio", () => {
    const conUso = [enviado("2026-11-15", 79000, 80000), enSalida("2026-11-17", 80500)];
    const r = validarKmDeCierre({ unidad: U, fecha: "2026-11-16", kmInicio: 80000, kmFin: 80600, partes: conUso, correcciones: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.codigo).toBe("km-supera-siguiente");
  });

  it("K10: la revisión de una fecha intermedia con inicio mayor que el inicio del siguiente -> km-supera-siguiente en kmInicio", () => {
    const r = validarKmDeSalida({ unidad: U, fecha: "2026-11-16", kmInicio: 80600, partes, correcciones: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe("km-supera-siguiente");
      expect(r.error.campo).toBe("kmInicio");
      expect(r.error.mensaje).toBe("El kilometraje supera el del inicio del parte del 17/11/2026 (80.500 km). Revise el número.");
    }
    expect(validarKmDeSalida({ unidad: U, fecha: "2026-11-16", kmInicio: 80500, partes, correcciones: [] }).ok).toBe(true);
  });

  it("K2: el fin menor que el inicio es error en kmFin", () => {
    const r = validarKmDeCierre({ unidad: U, fecha: "2026-11-18", kmInicio: 84320, kmFin: 84319, partes: [], correcciones: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe("km-fin-menor");
      expect(r.error.mensaje).toBe("El kilometraje al terminar (84.319 km) es menor que al iniciar (84.320 km). Revise los dos números.");
    }
  });

  it("K4: una corrección entre medio corta la comparación (K5)", () => {
    const conHueco = [enviado("2026-11-15", 79000, 80000), enviado("2026-11-18", 80500, 81000)];
    const r = validarKmDeCierre({ unidad: U, fecha: "2026-11-16", kmInicio: 80000, kmFin: 80600, partes: conHueco, correcciones: [correccion("2026-11-17", 50)] });
    expect(r.ok).toBe(true);
  });
});

describe("K5: la corrección fija la base", () => {
  it("K5: corrección a 120 desde H-2 tras 84.320 -> la salida de H-1 con inicio 130 es válida", () => {
    const partes = [enviado("2026-11-15", 84000, 84320)];
    expect(validarKmDeSalida({ unidad: U, fecha: "2026-11-17", kmInicio: 130, partes, correcciones: [correccion("2026-11-16", 120)] }).ok).toBe(true);
  });

  it("K5: pero inicio 100 (menor que la base 120) sigue siendo error", () => {
    const partes = [enviado("2026-11-15", 84000, 84320)];
    expect(validarKmDeSalida({ unidad: U, fecha: "2026-11-17", kmInicio: 100, partes, correcciones: [correccion("2026-11-16", 120)] }).ok).toBe(false);
  });
});

describe("K6 y K7: advertencias", () => {
  it("K6: diferencia 1.001 -> advertencia de salto; 1.000 -> nada", () => {
    expect(advertenciasDeSalida({ kmAnterior: 1000, kmInicio: 2001 })).toEqual([{ tipo: "salto-km", km: 1001 }]);
    expect(advertenciasDeSalida({ kmAnterior: 1000, kmInicio: 2000 })).toEqual([]);
  });

  it("K6: sin registro anterior no hay salto", () => {
    expect(advertenciasDeSalida({ kmAnterior: null, kmInicio: 50000 })).toEqual([]);
  });

  it("K7: recorrido de 1.201 km -> advertencia; 1.200 -> nada", () => {
    expect(advertenciasDeRecorrido({ kmInicio: 0, kmFin: 1201 })).toEqual([{ tipo: "recorrido-largo", km: 1201 }]);
    expect(advertenciasDeRecorrido({ kmInicio: 0, kmFin: 1200 })).toEqual([]);
  });

  it("validarKmDeSalida entrega las advertencias del caso C15 (salto de 1.250 km) y el kilometraje anterior", () => {
    const partes = [enviado("2026-11-13", 40000, 40100)];
    const r = validarKmDeSalida({ unidad: U, fecha: "2026-11-14", kmInicio: 41350, partes, correcciones: [] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toEqual({ kmAnterior: 40100, advertencias: [{ tipo: "salto-km", km: 1250 }] });
  });

  it("K7: validarKmDeCierre entrega la advertencia del recorrido largo", () => {
    const r = validarKmDeCierre({ unidad: U, fecha: "2026-11-14", kmInicio: 1000, kmFin: 2201, partes: [], correcciones: [] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.advertencias).toEqual([{ tipo: "recorrido-largo", km: 1201 }]);
  });
});

describe("K8, K10: un parte en uso es un registro de kilometraje (la salida)", () => {
  it("K8, K10: con un parte en uso, kmActual es su kmInicio", () => {
    const partes = [enviado("2026-11-17", 84000, 84320), enSalida("2026-11-18", 84330)];
    expect(kmActual("u1", partes, [])).toBe(84330);
  });

  it("K10: un parte en uso sin revisado legible (o sin kmInicio) no cuenta", () => {
    const partes = [enviado("2026-11-17", 84000, 84320), enSalida("2026-11-18", 84330, "no es un instante"), parte({ unidadId: "u1", fecha: "2026-11-19", estado: "en-uso", kmInicio: null, revisado: "2026-11-19T09:00:00.000Z", enviado: null })];
    expect(kmActual("u1", partes, [])).toBe(84320);
  });

  it("K9: los datos de cierre de un parte en uso sin cerrar no cambian kmActual", () => {
    const uso = parte({ unidadId: "u1", fecha: "2026-11-18", estado: "en-uso", kmInicio: 84330, kmFin: 84999, revisado: "2026-11-18T09:00:00.000Z", enviado: null });
    expect(kmActual("u1", [uso], [])).toBe(84330);
  });

  it("K8: un parte cerrado sin salida es un registro con recorrido 0", () => {
    const sinSalida = parte({ unidadId: "u1", fecha: "2026-11-18", estado: "enviado", sinSalida: true, kmInicio: 84330, kmFin: 84330 });
    const regs = registrosDeKm("u1", [sinSalida], []);
    expect(regs).toHaveLength(1);
    expect(regs[0]).toMatchObject({ tipo: "parte", kmInicio: 84330, kmFin: 84330 });
  });

  it("K8: a igual fecha y a igual instante, la corrección va después del parte", () => {
    const instante = "2026-11-18T20:00:00.000Z";
    const regs = registrosDeKm("u1", [enviado("2026-11-18", 1, 2, instante)], [correccion("2026-11-18", 50, instante)]);
    expect(regs.map((r) => r.tipo)).toEqual(["parte", "correccion"]);
  });

  it("describirRegistro de una salida dice «revisión del 18/11/2026» y kmDeRegistro es el kmInicio", () => {
    const [r] = registrosDeKm("u1", [enSalida("2026-11-18", 84330)], []);
    expect(r).toBeDefined();
    if (r === undefined) return;
    expect(r.tipo).toBe("salida");
    expect(describirRegistro(r)).toBe("revisión del 18/11/2026");
    expect(kmDeRegistro(r)).toBe(84330);
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
