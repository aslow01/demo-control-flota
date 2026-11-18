import { describe, expect, it } from "vitest";
import {
  ERRORES,
  RESUMEN_EVENTO,
  errNovedadesCriticasAbiertas,
  errParteDuplicado,
  errUnidadFueraDeServicio,
  formatearKm,
  pluralizar,
  textoAdvertencia,
  textoDisponibles,
  textoFaltantes,
  textoHoy,
  textoHorizonte,
  textoInsigniaAlertas,
  textoLeFaltan,
  textoProtagonista,
  textoQuedanVencimientos,
  textoUltimoRegistro,
  textoVencimiento,
} from "../src/lib/dominio/textos.ts";

describe("pluralizar", () => {
  it("singular solo con 1; cero y el resto van en plural", () => {
    expect(pluralizar(1, "día", "días")).toBe("1 día");
    expect(pluralizar(0, "día", "días")).toBe("0 días");
    expect(pluralizar(2, "día", "días")).toBe("2 días");
    expect(pluralizar(30, "unidad", "unidades")).toBe("30 unidades");
  });
});

describe("formatearKm", () => {
  it("punto de miles", () => {
    expect(formatearKm(999)).toBe("999");
    expect(formatearKm(1000)).toBe("1.000");
    expect(formatearKm(84320)).toBe("84.320");
    expect(formatearKm(2000000)).toBe("2.000.000");
  });
});

describe("textoVencimiento (V1 a V6)", () => {
  it("cada borde con su texto, en singular y plural", () => {
    expect(textoVencimiento(-1, "2026-11-17")).toBe("Vencido hace 1 día");
    expect(textoVencimiento(-2, "2026-11-16")).toBe("Vencido hace 2 días");
    expect(textoVencimiento(0, "2026-11-18")).toBe("Vence hoy");
    expect(textoVencimiento(1, "2026-11-19")).toBe("Vence mañana");
    expect(textoVencimiento(7, "2026-11-25")).toBe("Vence en 7 días");
    expect(textoVencimiento(30, "2026-12-18")).toBe("Vence en 30 días");
    expect(textoVencimiento(31, "2026-12-19")).toBe("Vigente hasta 19/12/2026");
  });
});

describe("protagonista y disponibles (A8)", () => {
  it("'N unidades no pueden salir hoy', con singular y con cero", () => {
    expect(textoProtagonista(4)).toBe("4 unidades no pueden salir hoy");
    expect(textoProtagonista(1)).toBe("1 unidad no puede salir hoy");
    expect(textoProtagonista(0)).toBe("Todas las unidades activas pueden salir hoy");
  });

  it("'Disponibles hoy: 19 de 23 unidades activas.'", () => {
    expect(textoDisponibles(19, 23)).toBe("Disponibles hoy: 19 de 23 unidades activas.");
    expect(textoDisponibles(1, 1)).toBe("Disponibles hoy: 1 de 1 unidad activa.");
    expect(textoDisponibles(0, 0)).toBe("Disponibles hoy: 0 de 0 unidades activas.");
  });
});

describe("horizonte: resumen para lectores de pantalla", () => {
  it("arma la frase del diseño (5.6)", () => {
    expect(textoHorizonte({ vencidos: 2, "7": 4, "15": 3, "30": 2 })).toBe(
      "Vencimientos de los próximos 30 días: 4 en 7 días o menos, 3 entre 8 y 15 días, 2 entre 16 y 30 días. 2 documentos vencidos o faltantes.",
    );
  });

  it("singulares y ceros", () => {
    expect(textoHorizonte({ vencidos: 1, "7": 1, "15": 0, "30": 1 })).toBe(
      "Vencimientos de los próximos 30 días: 1 en 7 días o menos, 0 entre 8 y 15 días, 1 entre 16 y 30 días. 1 documento vencido o faltante.",
    );
  });

  it("sin nada: 'Nada vence en los próximos 30 días'", () => {
    expect(textoHorizonte({ vencidos: 0, "7": 0, "15": 0, "30": 0 })).toBe("Nada vence en los próximos 30 días.");
  });

  it("si solo hay vencidos lo dice", () => {
    expect(textoHorizonte({ vencidos: 3, "7": 0, "15": 0, "30": 0 })).toBe(
      "Nada vence en los próximos 30 días. 3 documentos vencidos o faltantes.",
    );
  });
});

describe("otros textos de la interfaz", () => {
  it("hoy con día de la semana (T6)", () => {
    expect(textoHoy("2026-11-18")).toBe("Hoy es miércoles 18/11/2026 (hora de Argentina)");
  });

  it("último registro de kilometraje", () => {
    expect(textoUltimoRegistro(84320, "parte del 17/11/2026")).toBe("Último registro: 84.320 km (parte del 17/11/2026).");
    expect(textoUltimoRegistro(null, null)).toBe("Sin registros");
  });

  it("insignia de la pestaña de alertas", () => {
    expect(textoInsigniaAlertas(4)).toBe("Alertas, 4 críticas");
    expect(textoInsigniaAlertas(1)).toBe("Alertas, 1 crítica");
    expect(textoInsigniaAlertas(0)).toBe("Alertas");
  });

  it("'Quedan N vencimientos' (barra de estado después de renovar)", () => {
    expect(textoQuedanVencimientos(10)).toBe("Quedan 10 vencimientos.");
    expect(textoQuedanVencimientos(1)).toBe("Queda 1 vencimiento.");
    expect(textoQuedanVencimientos(0)).toBe("No quedan vencimientos.");
  });

  it("unidad nueva: 'Le faltan N documentos'", () => {
    expect(textoLeFaltan(4)).toBe("Le faltan 4 documentos");
    expect(textoLeFaltan(1)).toBe("Le falta 1 documento");
    expect(textoLeFaltan(0)).toBe("No le falta ningún documento");
  });

  it("P4: faltan datos", () => {
    expect(textoFaltantes(1)).toBe("Falta 1 dato");
    expect(textoFaltantes(3)).toBe("Faltan 3 datos");
  });
});

describe("advertencias antes de enviar (K6, K7, P9)", () => {
  it("K6: salto de kilometraje", () => {
    expect(textoAdvertencia({ tipo: "salto-km", km: 1250 })).toBe("1.250 km sin registrar");
  });

  it("K7: recorrido largo", () => {
    expect(textoAdvertencia({ tipo: "recorrido-largo", km: 1350 })).toBe("Recorrido del día de 1.350 km");
  });

  it("P9: documentación vencida, con los nombres", () => {
    expect(textoAdvertencia({ tipo: "documentacion-vencida", documentos: ["seguro", "licencia"] })).toBe(
      "Documentación vencida o faltante: Seguro, Licencia de conducir. Puede enviar el parte igual: quedará registrado que la unidad circuló con documentación vencida.",
    );
  });
});

describe("errores y resúmenes que arman otros textos", () => {
  it("A4, P1, P8", () => {
    expect(errNovedadesCriticasAbiertas(["Frenos (parte del 16/11/2026)"])).toBe("Antes de volver a servicio, resuelva: Frenos (parte del 16/11/2026).");
    expect(errParteDuplicado("ZK 214 BD", "2026-11-18", "borrador")).toBe("Ya hay un parte de ZK 214 BD para el 18/11/2026 (borrador). Ábralo para continuar.");
    expect(errUnidadFueraDeServicio("2026-11-13", "En taller: cambio de embrague")).toBe(
      "La unidad está fuera de servicio desde el 13/11/2026 (En taller: cambio de embrague). Pida al encargado que la vuelva a servicio.",
    );
  });

  it("P12: el mensaje de guardado fallido promete que los datos siguen", () => {
    expect(ERRORES.noPudoGuardarElParte).toBe("No se pudo guardar el parte. Sus datos siguen en este equipo; intente de nuevo.");
  });

  it("los resúmenes del historial están en español neutro y sin voseo", () => {
    const muestras = [
      RESUMEN_EVENTO.unidadAlta("ZK 214 BD", 7),
      RESUMEN_EVENTO.fueraDeServicio("ZK 214 BD", "En taller"),
      RESUMEN_EVENTO.vueltaAServicio("ZK 214 BD"),
      RESUMEN_EVENTO.kmCorregido("ZK 214 BD", null, 120, "2026-11-18"),
      RESUMEN_EVENTO.unidadBaja("ZK 214 BD", "Venta"),
    ];
    for (const m of muestras) expect(m).not.toMatch(/\bvos\b|\bpodés\b|\bsos\b|\bhacé\b/i);
    expect(muestras[3]).toBe("Kilometraje de ZK 214 BD fijado en 120 km desde el 18/11/2026");
  });

  it("ningún texto de ERRORES termina sin punto final ni queda vacío", () => {
    for (const [clave, texto] of Object.entries(ERRORES)) {
      expect(texto.length, clave).toBeGreaterThan(5);
      expect(texto.endsWith("."), clave).toBe(true);
    }
  });
});
