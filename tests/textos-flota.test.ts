// Paso 4.3: los textos de la flota y de «Agregar unidad» (español neutro, un solo lugar).
import { describe, expect, it } from "vitest";
import {
  NOMBRES_TIPO_UNIDAD,
  TEXTO_AGREGAR,
  TEXTO_FLOTA,
  textoDescripcionUnidad,
  textoFichaDe,
  textoMostrandoUnidades,
  textoMotivosMas,
  textoNovedadesDeUnidad,
  textoPlazoCorto,
  textoResumenFlota,
  textoSinCoincidencias,
  textoUnidadAgregada,
} from "../src/lib/dominio/textos.ts";

const SIN_VOSEO = /\bvos\b|\bpodés\b|\bsos\b|\bhacé\b|\btenés\b|\bcambiá\b|\belegí\b|\bescribí\b|\bagregá\b|\bbuscá\b/i;

function textos(valor: unknown): string[] {
  if (typeof valor === "string") return [valor];
  if (valor !== null && typeof valor === "object") return Object.values(valor).flatMap(textos);
  return [];
}

describe("textos de la flota", () => {
  it("el resumen: singular y plural de cada cifra", () => {
    expect(textoResumenFlota({ activas: 23, pueden: 19, noPueden: 2, fuera: 2, baja: 1 })).toBe(
      "23 unidades activas · 19 pueden salir · 2 no pueden salir · 2 fuera de servicio · 1 de baja",
    );
    expect(textoResumenFlota({ activas: 1, pueden: 1, noPueden: 1, fuera: 0, baja: 0 })).toBe(
      "1 unidad activa · 1 puede salir · 1 no puede salir · 0 fuera de servicio · 0 de baja",
    );
  });

  it("motivos, descripción, ficha, plazo, novedades y barra de estado", () => {
    expect(textoMotivosMas(1)).toBe("y 1 motivo más");
    expect(textoMotivosMas(3)).toBe("y 3 motivos más");
    expect(textoDescripcionUnidad("Toyota", "Hilux", 2022, "camioneta")).toBe("Toyota Hilux 2022 · Camioneta");
    expect(textoFichaDe("ZK 214 BD")).toBe("Ficha de ZK 214 BD");
    expect([0, 1, 2, 30].map(textoPlazoCorto)).toEqual(["hoy", "mañana", "en 2 días", "en 30 días"]);
    expect([textoNovedadesDeUnidad(0, 0), textoNovedadesDeUnidad(2, 0), textoNovedadesDeUnidad(1, 1), textoNovedadesDeUnidad(3, 1), textoNovedadesDeUnidad(3, 2)]).toEqual([
      "0",
      "2",
      "1 (crítica)",
      "3 (1 crítica)",
      "3 (2 críticas)",
    ]);
    expect(textoMostrandoUnidades(23, 23)).toBe("Mostrando 23 de 23 unidades.");
    expect(textoMostrandoUnidades(1, 1)).toBe("Mostrando 1 de 1 unidad.");
  });

  it("vacío por filtro, con cada parte opcional", () => {
    expect(textoSinCoincidencias({ busqueda: "zz9", proyecto: "Proyecto Piedra Lunar", filtro: null })).toBe("Ninguna unidad coincide con «zz9» en Proyecto Piedra Lunar.");
    expect(textoSinCoincidencias({ busqueda: null, proyecto: null, filtro: "De baja" })).toBe("Ninguna unidad coincide (filtro: De baja).");
  });

  it("los cuatro tipos de unidad tienen nombre", () => {
    expect(Object.values(NOMBRES_TIPO_UNIDAD)).toEqual(["Camioneta", "Utilitario", "Camión liviano", "Minibús"]);
  });

  it("el mensaje de la unidad agregada (se muestra en su ficha)", () => {
    expect(textoUnidadAgregada(4)).toBe("Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí.");
    expect(textoUnidadAgregada(1)).toBe("Unidad agregada. Le falta 1 documento: cárguelo desde aquí.");
    expect(textoUnidadAgregada(0)).toBe("Unidad agregada.");
  });

  it("español neutro: sin voseo en ningún texto fijo", () => {
    for (const t of [...textos(TEXTO_FLOTA), ...textos(TEXTO_AGREGAR)]) expect(t).not.toMatch(SIN_VOSEO);
  });
});
