import { describe, expect, it } from "vitest";
import {
  diaDeLaSemana,
  diasEntre,
  fechaEnArgentina,
  formatearFecha,
  formatearFechaConDia,
  formatearInstante,
  hoyEnArgentina,
  parsearFechaCivil,
  parsearInstante,
  sumarAnios,
  sumarDias,
} from "../src/lib/dominio/fechas.ts";

const H = "2026-11-18";

describe("T1: hoy en Argentina con reloj inyectado", () => {
  it("T1: 02:59:59.999Z todavía es el día anterior", () => {
    expect(hoyEnArgentina(new Date("2026-11-18T02:59:59.999Z"))).toBe("2026-11-17");
  });

  it("T1: 03:00:00.000Z ya es el día nuevo", () => {
    expect(hoyEnArgentina(new Date("2026-11-18T03:00:00.000Z"))).toBe("2026-11-18");
  });

  it("T1: a fin de año cruza el año", () => {
    expect(hoyEnArgentina(new Date("2027-01-01T02:59:59.999Z"))).toBe("2026-12-31");
    expect(hoyEnArgentina(new Date("2027-01-01T03:00:00.000Z"))).toBe("2027-01-01");
  });

  it("T1: acepta también un instante en texto", () => {
    expect(fechaEnArgentina("2026-11-18T02:59:59.999Z")).toBe("2026-11-17");
    expect(fechaEnArgentina("2026-11-18T03:00:00.000Z")).toBe("2026-11-18");
  });

  it("T1: un instante inválido es un error, no una fecha a medias", () => {
    expect(() => fechaEnArgentina("ayer")).toThrow();
    expect(() => hoyEnArgentina(new Date(Number.NaN))).toThrow();
  });
});

describe("T2: los instantes se leen de forma estricta (M2)", () => {
  it("parsearInstante acepta solo ISO 8601 con Z, con o sin milisegundos", () => {
    expect(parsearInstante("2026-11-18T03:00:00.000Z")).toBe(Date.UTC(2026, 10, 18, 3, 0, 0));
    expect(parsearInstante("2026-11-18T03:00:00Z")).toBe(Date.UTC(2026, 10, 18, 3, 0, 0));
    expect(parsearInstante("2026-11-18T03:00:00.123Z")).toBe(Date.UTC(2026, 10, 18, 3, 0, 0, 123));
  });

  it("rechaza instantes sin zona, con offset, sin hora o en otros formatos del motor", () => {
    const malos = [
      "2026-11-18T01:00:00", // sin zona: se leería en hora local del equipo
      "2026-11-18T01:00:00.000",
      "2026-11-18T01:00:00-03:00",
      "2026-11-18T01:00:00+00:00",
      "2026-11-18T01:00Z",
      "2026-11-18",
      "18 Nov 2026 01:00 UTC",
      "2026-11-18 01:00:00Z",
      "2026-11-18T01:00:00z",
      "ayer",
      "",
      " 2026-11-18T01:00:00.000Z",
      "2026-11-18T01:00:00.000Z\n",
    ];
    for (const m of malos) expect(parsearInstante(m), m).toBeNull();
  });

  it("rechaza instantes que no existen (día 30 de febrero, hora 24, minuto 60)", () => {
    expect(parsearInstante("2026-02-30T10:00:00.000Z")).toBeNull();
    expect(parsearInstante("2026-11-31T10:00:00.000Z")).toBeNull();
    expect(parsearInstante("2026-11-18T24:00:00.000Z")).toBeNull();
    expect(parsearInstante("2026-11-18T10:60:00.000Z")).toBeNull();
    expect(parsearInstante("2026-11-18T10:00:60.000Z")).toBeNull();
    expect(parsearInstante("2026-13-01T10:00:00.000Z")).toBeNull();
  });

  it("fechaEnArgentina y formatearInstante lanzan con un instante sin zona (no lo interpretan en hora local)", () => {
    expect(() => fechaEnArgentina("2026-11-18T01:00:00")).toThrow(/Instante inválido/);
    expect(() => formatearInstante("2026-11-18T01:00:00")).toThrow(/Instante inválido/);
    expect(() => fechaEnArgentina("18 Nov 2026 01:00 UTC")).toThrow();
    expect(() => fechaEnArgentina("2026-11-18")).toThrow();
  });
});

describe("T2: no depende de la zona horaria del equipo", () => {
  // Esta suite entera corre con TZ=UTC, Asia/Tokyo y America/Los_Angeles (npm run test:tz).
  it("T2: mismos resultados para instantes cerca de la medianoche de cualquier zona", () => {
    const casos: [string, string][] = [
      ["2026-06-30T14:59:59.999Z", "2026-06-30"], // 23:59 en Tokio, 11:59 en Argentina
      ["2026-07-01T02:59:59.999Z", "2026-06-30"],
      ["2026-07-01T03:00:00.000Z", "2026-07-01"],
      ["2026-03-01T07:59:59.999Z", "2026-03-01"], // 23:59 de Los Ángeles (antes de la medianoche local)
      ["2026-03-01T08:00:00.000Z", "2026-03-01"],
    ];
    for (const [instante, esperado] of casos) {
      expect(fechaEnArgentina(instante)).toBe(esperado);
    }
  });

  it("T2: los formatos de hora siempre son de Argentina", () => {
    expect(formatearInstante("2026-11-18T17:32:00.000Z")).toBe("18/11/2026 14:32");
  });
});

describe("T3: sin desfase fijo de -3 horas", () => {
  it("T3: en enero de 2009 Buenos Aires usaba UTC-2 (horario de verano)", () => {
    expect(hoyEnArgentina(new Date("2009-01-15T02:30:00Z"))).toBe("2009-01-15");
    // con -3 fijo daría el 14; con -2 es 00:30 del 15
    expect(formatearInstante("2009-01-15T02:30:00Z")).toBe("15/01/2009 00:30");
  });
});

describe("T4: fecha civil validada a mano", () => {
  it("T4: acepta fechas válidas, incluido el 29/02 de un año bisiesto", () => {
    expect(parsearFechaCivil("2028-02-29")).toBe("2028-02-29");
    expect(parsearFechaCivil("2026-11-18")).toBe("2026-11-18");
    expect(parsearFechaCivil("2000-01-01")).toBe("2000-01-01");
    expect(parsearFechaCivil("2100-12-31")).toBe("2100-12-31");
  });

  it("T4: rechaza días que no existen", () => {
    expect(parsearFechaCivil("2027-02-29")).toBeNull();
    expect(parsearFechaCivil("2026-11-31")).toBeNull();
    expect(parsearFechaCivil("2026-04-31")).toBeNull();
    expect(parsearFechaCivil("2026-00-10")).toBeNull();
    expect(parsearFechaCivil("2026-13-10")).toBeNull();
    expect(parsearFechaCivil("2026-11-00")).toBeNull();
  });

  it("T4: 1900 y 2100 no son bisiestos (regla de los siglos)", () => {
    expect(parsearFechaCivil("2100-02-29")).toBeNull();
    expect(parsearFechaCivil("2000-02-29")).toBe("2000-02-29");
  });

  it("T4: rechaza formatos que no son AAAA-MM-DD", () => {
    expect(parsearFechaCivil("2026-1-5")).toBeNull();
    expect(parsearFechaCivil("18/11/2026")).toBeNull();
    expect(parsearFechaCivil("2026-11-18T10:00:00Z")).toBeNull();
    expect(parsearFechaCivil(" 2026-11-18")).toBeNull();
    expect(parsearFechaCivil("")).toBeNull();
    expect(parsearFechaCivil("2026-11-18\n")).toBeNull();
    expect(parsearFechaCivil("２０２６-11-18")).toBeNull();
  });

  it("T4: rechaza años fuera de 2000 a 2100", () => {
    expect(parsearFechaCivil("1999-12-31")).toBeNull();
    expect(parsearFechaCivil("2101-01-01")).toBeNull();
    expect(parsearFechaCivil("0026-01-01")).toBeNull();
  });
});

describe("T5: días de calendario entre fechas", () => {
  it("T5: cruces de año y de mes", () => {
    expect(diasEntre("2026-12-31", "2027-01-01")).toBe(1);
    expect(diasEntre("2028-02-28", "2028-03-01")).toBe(2);
    expect(diasEntre("2027-02-28", "2027-03-01")).toBe(1);
  });

  it("T5: mismo día es 0 y hacia atrás es negativo", () => {
    expect(diasEntre(H, H)).toBe(0);
    expect(diasEntre("2026-11-18", "2026-11-11")).toBe(-7);
  });

  it("T5: un año común tiene 365 días y uno bisiesto 366", () => {
    expect(diasEntre("2026-01-01", "2027-01-01")).toBe(365);
    expect(diasEntre("2028-01-01", "2029-01-01")).toBe(366);
  });

  it("T5: sumarDias es la inversa de diasEntre (propiedad sobre varios años)", () => {
    for (let n = -800; n <= 800; n += 7) {
      const f = sumarDias("2026-11-18", n);
      expect(parsearFechaCivil(f)).toBe(f);
      expect(diasEntre("2026-11-18", f)).toBe(n);
    }
  });

  it("T5/B1: sumarDias coincide con Date.UTC en cada día de 2000-01-01 a 2100-12-31 (incluye 2100, que no es bisiesto)", () => {
    const inicio = Date.UTC(2000, 0, 1) / 86_400_000;
    const fin = Date.UTC(2100, 11, 31) / 86_400_000;
    for (let dias = inicio; dias <= fin; dias++) {
      const d = new Date(dias * 86_400_000);
      const esperado = `${String(d.getUTCFullYear()).padStart(4, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      if (sumarDias("2000-01-01", dias - inicio) !== esperado) throw new Error(`sumarDias falla en ${esperado}`);
    }
    expect(sumarDias("2100-02-28", 1)).toBe("2100-03-01");
    expect(sumarDias("2100-03-01", -1)).toBe("2100-02-28");
    expect(sumarDias("2100-12-31", 0)).toBe("2100-12-31");
  });

  it("B4: sumarDias exige un número entero de días", () => {
    expect(() => sumarDias("2026-11-18", Number.NaN)).toThrow(/entero/);
    expect(() => sumarDias("2026-11-18", 1.5)).toThrow(/entero/);
    expect(() => sumarDias("2026-11-18", Infinity)).toThrow(/entero/);
  });

  it("T5: sumarDias cruza meses y años", () => {
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(sumarDias("2026-03-01", -1)).toBe("2026-02-28");
    expect(sumarDias("2028-03-01", -1)).toBe("2028-02-29");
    expect(sumarDias("2026-11-18", 0)).toBe("2026-11-18");
  });
});

describe("T6: formatos para mostrar", () => {
  it("T6: instante en hora de Argentina", () => {
    expect(formatearInstante("2026-11-18T17:32:00Z")).toBe("18/11/2026 14:32");
    expect(formatearInstante("2026-11-18T02:59:00Z")).toBe("17/11/2026 23:59");
    expect(formatearInstante("2026-11-18T03:00:00Z")).toBe("18/11/2026 00:00");
  });

  it("T6: fecha civil con y sin día de la semana", () => {
    expect(formatearFecha("2026-11-18")).toBe("18/11/2026");
    expect(formatearFecha("2026-01-05")).toBe("05/01/2026");
    expect(formatearFechaConDia("2026-11-18")).toBe("miércoles 18/11/2026");
  });

  it("T6: día de la semana de fechas conocidas", () => {
    expect(diaDeLaSemana("2026-11-18")).toBe("miércoles");
    expect(diaDeLaSemana("2026-11-22")).toBe("domingo");
    expect(diaDeLaSemana("2026-11-23")).toBe("lunes");
    expect(diaDeLaSemana("2000-01-01")).toBe("sábado");
    expect(diaDeLaSemana("2028-02-29")).toBe("martes");
  });
});

describe("T7: sumar años", () => {
  it("T7: el 29/02 pasa a 28/02 en años no bisiestos", () => {
    expect(sumarAnios("2028-02-29", 1)).toBe("2029-02-28");
  });

  it("T7: entre años bisiestos conserva el 29/02", () => {
    expect(sumarAnios("2028-02-29", 4)).toBe("2032-02-29");
  });

  it("T7: caso común y restar años", () => {
    expect(sumarAnios("2026-11-18", 10)).toBe("2036-11-18");
    expect(sumarAnios("2026-11-18", -1)).toBe("2025-11-18");
  });
});
