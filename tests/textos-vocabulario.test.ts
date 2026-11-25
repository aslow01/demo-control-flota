// Vocabulario único del porte «tipo app» (E0-R): los nombres de las pantallas y los textos del marco nuevo que todavía no usa ninguna pantalla.
// Estos tests fijan las palabras que decidió Matías (25/11/2026), para que E1 las tome de acá y no las repita en otro lado.
import { describe, expect, it } from "vitest";
import { TEXTO_MAS, TEXTO_NAVEGACION } from "../src/componentes/textos-marco.ts";
import { NOMBRES_DE_PANTALLA, TEXTO_FLOTA, textoDesgloseNoDisponibles, textoProtagonista } from "../src/lib/dominio/textos.ts";

describe("nombres de las pantallas del marco nuevo", () => {
  it("las secciones del encargado y del conductor", () => {
    expect([NOMBRES_DE_PANTALLA.inicio, NOMBRES_DE_PANTALLA.movilidades, NOMBRES_DE_PANTALLA.operacion, NOMBRES_DE_PANTALLA.vencimientos, NOMBRES_DE_PANTALLA.mas]).toEqual([
      "Inicio",
      "Movilidades",
      "Operación diaria",
      "Vencimientos",
      "Más",
    ]);
    expect([NOMBRES_DE_PANTALLA.operacionChecklists, NOMBRES_DE_PANTALLA.operacionNovedades]).toEqual(["Checklists", "Novedades"]);
    expect([NOMBRES_DE_PANTALLA.conductor, NOMBRES_DE_PANTALLA.conductorPartes]).toEqual(["Hoy", "Mis partes"]);
  });

  it("la unidad y el parte llevan su dato", () => {
    expect(NOMBRES_DE_PANTALLA.unidad("ZK 214 BD")).toBe("Unidad ZK 214 BD");
    expect(NOMBRES_DE_PANTALLA.parteDelDia("miércoles 18/11/2026")).toBe("Parte del miércoles 18/11/2026");
  });
});

describe("vocabulario único: «No disponibles hoy» = bloqueadas por documentos + fuera de servicio", () => {
  it("la cifra, el desglose y los filtros dicen las mismas palabras", () => {
    expect(textoProtagonista(4)).toBe("4 unidades no disponibles hoy");
    expect(textoDesgloseNoDisponibles(2, 2)).toBe("2 bloqueadas por documentos · 2 fuera de servicio");
    expect(TEXTO_FLOTA.filtros["no-disponibles"]).toBe("No disponibles hoy");
    expect(TEXTO_FLOTA.filtros["no-pueden-salir"]).toBe("Bloqueadas por documentos");
    expect(TEXTO_FLOTA.filtros["pueden-salir"]).toBe("Disponibles");
    expect(TEXTO_FLOTA.estado).toMatchObject({ "puede-salir": "Disponible", "no-puede-salir": "Bloqueada", "fuera-de-servicio": "Fuera de servicio" });
  });
});

describe("textos del marco nuevo", () => {
  it("«Volver a …», el chip del perfil y las insignias, con singular y plural", () => {
    expect(TEXTO_NAVEGACION.volverA("Movilidades")).toBe("Volver a Movilidades");
    expect(TEXTO_NAVEGACION.chipPerfil("Encargado")).toBe("Ver como: Encargado. Cambiar perfil");
    expect(TEXTO_NAVEGACION.insignias.alertasCriticas(1)).toBe("1 alerta crítica");
    expect(TEXTO_NAVEGACION.insignias.alertasCriticas(4)).toBe("4 alertas críticas");
    expect(TEXTO_NAVEGACION.insignias.vencidosOFaltantes(3)).toBe("3 vencidos o faltantes");
    expect(TEXTO_NAVEGACION.insignias.pendientes(1)).toBe("1 pendiente");
    expect(TEXTO_NAVEGACION.insignias.abiertas(2)).toBe("2 abiertas");
  });

  it("«Más» y «Ver como»", () => {
    expect(TEXTO_MAS.verComo.titulo).toBe("Ver como");
    expect(TEXTO_MAS.verComo.conductorDescripcion("Tamara Olivera", "ZK 214 BD")).toBe("Tamara Olivera (persona ficticia) · unidad ZK 214 BD");
    expect(TEXTO_MAS.laDemo.titulo).toBe("La demo");
  });
});
