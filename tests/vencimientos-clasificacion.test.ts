import { describe, expect, it } from "vitest";
import { clasificar } from "../src/lib/dominio/vencimientos.ts";
import { diasEntre, fechaEnArgentina, sumarDias } from "../src/lib/dominio/fechas.ts";

const H = "2026-11-18";
const venceEn = (d: number) => sumarDias(H, d);

describe("V1: vencido", () => {
  it("V1: vence ayer -> vencido hace 1 día (singular)", () => {
    const c = clasificar("2026-11-17", H);
    expect(c.estado).toBe("vencido");
    expect(c.grupo).toBe("vencidos");
    expect(c.d).toBe(-1);
    expect(c.texto).toBe("Vencido hace 1 día");
  });

  it("V1: vence hace 3 días -> plural", () => {
    const c = clasificar("2026-11-15", H);
    expect(c.texto).toBe("Vencido hace 3 días");
    expect(c.grupo).toBe("vencidos");
  });
});

describe("V1: concordancia de género con el documento (QA M-2)", () => {
  it("«Vencida» para la revisión técnica y la licencia, «Vencido» para el seguro; sin tipo, masculino", () => {
    expect(clasificar("2026-11-17", H, "revision-tecnica").texto).toBe("Vencida hace 1 día");
    expect(clasificar("2026-11-15", H, "licencia").texto).toBe("Vencida hace 3 días");
    expect(clasificar("2026-11-17", H, "seguro").texto).toBe("Vencido hace 1 día");
    expect(clasificar("2026-11-17", H).texto).toBe("Vencido hace 1 día");
  });
});

describe("V2: vence hoy", () => {
  it("V2: d = 0 sigue valiendo, grupo 7 y texto 'Vence hoy'", () => {
    const c = clasificar(H, H);
    expect(c.estado).toBe("vence-hoy");
    expect(c.grupo).toBe("7");
    expect(c.d).toBe(0);
    expect(c.texto).toBe("Vence hoy");
  });
});

describe("V3: grupo de 7 días", () => {
  it("V3: d = 1 -> 'Vence mañana'", () => {
    const c = clasificar(venceEn(1), H);
    expect(c.estado).toBe("por-vencer");
    expect(c.grupo).toBe("7");
    expect(c.texto).toBe("Vence mañana");
  });

  it("V3: d = 2 y d = 7 -> 'Vence en N días' en el grupo 7", () => {
    expect(clasificar(venceEn(2), H).texto).toBe("Vence en 2 días");
    const c7 = clasificar(venceEn(7), H);
    expect(c7.grupo).toBe("7");
    expect(c7.texto).toBe("Vence en 7 días");
  });
});

describe("V4: grupo de 15 días", () => {
  it("V4: d = 8 y d = 15 caen en el grupo 15", () => {
    expect(clasificar(venceEn(8), H).grupo).toBe("15");
    expect(clasificar(venceEn(15), H).grupo).toBe("15");
    expect(clasificar(venceEn(8), H).texto).toBe("Vence en 8 días");
  });
});

describe("V5: grupo de 30 días", () => {
  it("V5: d = 16 y d = 30 caen en el grupo 30", () => {
    expect(clasificar(venceEn(16), H).grupo).toBe("30");
    expect(clasificar(venceEn(30), H).grupo).toBe("30");
  });
});

describe("V6: vigente", () => {
  it("V6: d = 31 no tiene alerta y dice hasta cuándo vale", () => {
    const c = clasificar(venceEn(31), H);
    expect(c.estado).toBe("vigente");
    expect(c.grupo).toBeNull();
    expect(c.texto).toBe("Vigente hasta 19/12/2026");
  });
});

describe("V7: los grupos son excluyentes", () => {
  it("V7: para todo d de -400 a 400 hay una sola clasificación coherente", () => {
    for (let d = -400; d <= 400; d++) {
      const c = clasificar(venceEn(d), H);
      expect(c.d).toBe(d);
      const esperado =
        d < 0 ? "vencidos" : d <= 7 ? "7" : d <= 15 ? "15" : d <= 30 ? "30" : null;
      expect(c.grupo).toBe(esperado);
      // el estado concuerda con el grupo
      if (d < 0) expect(c.estado).toBe("vencido");
      else if (d === 0) expect(c.estado).toBe("vence-hoy");
      else if (d <= 30) expect(c.estado).toBe("por-vencer");
      else expect(c.estado).toBe("vigente");
    }
  });

  it("V7: los bordes exactos (-1, 0, 1, 7, 8, 15, 16, 30, 31)", () => {
    const grupos = [-1, 0, 1, 7, 8, 15, 16, 30, 31].map((d) => clasificar(venceEn(d), H).grupo);
    expect(grupos).toEqual(["vencidos", "7", "7", "7", "15", "15", "30", "30", null]);
  });
});

describe("V8: el cambio ocurre a las 00:00 de Argentina", () => {
  it("V8: vence 2026-11-17; 02:59Z todavía es 'Vence hoy', 03:00Z ya es 'Vencido hace 1 día'", () => {
    const antes = clasificar("2026-11-17", fechaEnArgentina("2026-11-18T02:59:00Z"));
    expect(antes.texto).toBe("Vence hoy");
    const despues = clasificar("2026-11-17", fechaEnArgentina("2026-11-18T03:00:00Z"));
    expect(despues.texto).toBe("Vencido hace 1 día");
    expect(despues.d).toBe(diasEntre("2026-11-18", "2026-11-17"));
  });
});
