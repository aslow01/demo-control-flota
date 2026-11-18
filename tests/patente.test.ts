import { describe, expect, it } from "vitest";
import {
  formatearPatente,
  formatoDePatente,
  normalizarPatente,
  validarPatente,
} from "../src/lib/dominio/patente.ts";

describe("U1: normalizar", () => {
  it("U1: pasa a mayúsculas y saca espacios y guiones", () => {
    expect(normalizarPatente("zk-214 bd")).toBe("ZK214BD");
    expect(normalizarPatente("  zkb 482 ")).toBe("ZKB482");
    expect(normalizarPatente("ZK 214\tBD")).toBe("ZK214BD");
  });

  it("U1: no inventa nada con textos que no son patentes", () => {
    expect(normalizarPatente("")).toBe("");
    expect(normalizarPatente("--")).toBe("");
  });
});

describe("U1: formato", () => {
  it("U1: reconoce Mercosur (AA999AA) y anterior (AAA999)", () => {
    expect(formatoDePatente("ZK214BD")).toBe("mercosur");
    expect(formatoDePatente("ZKB482")).toBe("anterior");
  });

  it("U1: rechaza otros formatos", () => {
    expect(formatoDePatente("A123BCD")).toBeNull();
    expect(formatoDePatente("ZK214B")).toBeNull();
    expect(formatoDePatente("ZK2144BD")).toBeNull();
    expect(formatoDePatente("ZKB4822")).toBeNull();
    expect(formatoDePatente("zk214bd")).toBeNull(); // se espera ya normalizada
    expect(formatoDePatente("ÑK214BD")).toBeNull();
    expect(formatoDePatente("")).toBeNull();
  });

  it("U1: se muestra con espacios", () => {
    expect(formatearPatente("ZK214BD")).toBe("ZK 214 BD");
    expect(formatearPatente("ZKB482")).toBe("ZKB 482");
  });

  it("U1: si no tiene formato válido se muestra tal cual", () => {
    expect(formatearPatente("XYZ")).toBe("XYZ");
  });
});

describe("U1: validar lo que escribe una persona", () => {
  it("U1: 'zk-214 bd' es válida y queda normalizada", () => {
    const r = validarPatente("zk-214 bd");
    expect(r).toEqual({ ok: true, valor: "ZK214BD" });
  });

  it("U1: 'zkb482' es válida y se ve 'ZKB 482'", () => {
    const r = validarPatente("zkb482");
    expect(r.ok).toBe(true);
    if (r.ok) expect(formatearPatente(r.valor)).toBe("ZKB 482");
  });

  it("U1: 'A123BCD' da el error con el formato esperado", () => {
    const r = validarPatente("A123BCD");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.mensaje).toBe("La patente tiene que tener el formato AA 123 BB o ABC 123.");
      expect(r.error.codigo).toBe("patente-formato");
      expect(r.error.campo).toBe("patente");
    }
  });

  it("U1: vacía y textos larguísimos también son error (sin explotar)", () => {
    expect(validarPatente("").ok).toBe(false);
    expect(validarPatente("A".repeat(100_000)).ok).toBe(false);
  });
});
