// Paso 4.4 (lógica): los textos de la ficha y de sus diálogos, con singular y plural (docs/diseno-ui.md, 5.16, 5.17 y 6.3).
import { describe, expect, it } from "vitest";
import {
  textoAsignacionCambiada,
  textoDadaDeBaja,
  textoDocumentoCorregido,
  textoDocumentoRenovadoEnFicha,
  textoEventos,
  textoKmConFecha,
  textoLineaAptitud,
  textoLitros,
  textoMostrandoEventos,
  textoNovedadCargada,
  textoNovedadResuelta,
  textoOrigenEnFicha,
  textoPuntosEnOrden,
  textoResumenParteEnviado,
  textoRotuloDocumentos,
  textoRotuloNovedades,
  textoVerMasEventos,
  textoVueltaAServicio,
} from "../src/lib/dominio/textos.ts";

describe("encabezado de la ficha", () => {
  it("la línea de aptitud: uno o dos motivos tal cual; más de dos, solo la cantidad; ninguno, nada", () => {
    expect(textoLineaAptitud([])).toBeNull();
    expect(textoLineaAptitud(["Seguro vencido hace 1 día"])).toBe("Seguro vencido hace 1 día");
    expect(textoLineaAptitud(["Seguro vencido hace 1 día", "Falta cargar: Matafuego"])).toBe("Seguro vencido hace 1 día · Falta cargar: Matafuego");
    expect(textoLineaAptitud(["a", "b", "c"])).toBe("3 motivos");
  });

  it("baja y kilometraje con su fecha", () => {
    expect(textoDadaDeBaja("2026-11-18", "Venta de la unidad")).toBe("Dada de baja el 18/11/2026: Venta de la unidad. Se conserva su historial.");
    expect(textoKmConFecha(84320, "2026-11-17")).toBe("84.320 km (al 17/11/2026)");
  });
});

describe("paneles", () => {
  it("cabecera de documentos: solo suma lo que hay", () => {
    expect(textoRotuloDocumentos(4, 0, 0)).toBe("4");
    expect(textoRotuloDocumentos(4, 1, 0)).toBe("4 · 1 vencido");
    expect(textoRotuloDocumentos(4, 2, 1)).toBe("4 · 2 vencidos · 1 faltante");
    expect(textoRotuloDocumentos(4, 0, 4)).toBe("4 · 4 faltantes");
  });

  it("cabecera de novedades y cantidad de eventos", () => {
    expect(textoRotuloNovedades(0)).toBe("0 abiertas");
    expect(textoRotuloNovedades(1)).toBe("1 abierta");
    expect(textoRotuloNovedades(3)).toBe("3 abiertas");
    expect(textoEventos(1)).toBe("1 evento");
    expect(textoEventos(128)).toBe("128 eventos");
    expect(textoMostrandoEventos(30, 128)).toBe("Mostrando 30 de 128 eventos.");
    expect(textoVerMasEventos(30)).toBe("Ver 30 más");
  });

  it("origen de la novedad: punto del parte, otra novedad o carga a mano", () => {
    expect(textoOrigenEnFicha({ tipo: "parte", item: "Frenos" }, "2026-11-16")).toBe("Parte del 16/11/2026, punto Frenos");
    expect(textoOrigenEnFicha({ tipo: "parte", item: null }, "2026-11-16")).toBe("Parte del 16/11/2026, otra novedad");
    expect(textoOrigenEnFicha({ tipo: "manual" }, "2026-11-16")).toBe("Cargada por el encargado");
  });
});

describe("historial", () => {
  it("el resumen del parte enviado: recorrido, combustible y novedades (con singular y «sin uso»)", () => {
    const base = { kmInicio: 84320, kmFin: 84452, combustible: "3/4", novedades: 1 };
    expect(textoResumenParteEnviado(base)).toBe("Parte cerrado · 132 km (84.320 → 84.452) · combustible 3/4 · 1 novedad");
    expect(textoResumenParteEnviado({ ...base, novedades: 0 })).toBe("Parte cerrado · 132 km (84.320 → 84.452) · combustible 3/4 · sin novedades");
    expect(textoResumenParteEnviado({ ...base, novedades: 2, combustible: null })).toBe("Parte cerrado · 132 km (84.320 → 84.452) · 2 novedades");
    expect(textoResumenParteEnviado({ ...base, kmFin: 84320 })).toBe("Parte cerrado · sin uso (84.320 → 84.320) · combustible 3/4 · 1 novedad");
  });

  it("litros con coma decimal, o «Sin carga»; puntos en orden", () => {
    expect(textoLitros(45.5)).toBe("45,5 litros");
    expect(textoLitros(1)).toBe("1 litro");
    expect(textoLitros(null)).toBe("Sin carga");
    expect(textoPuntosEnOrden(1)).toBe("1 punto en orden");
    expect(textoPuntosEnOrden(8)).toBe("8 puntos en orden");
  });
});

describe("mensajes de la barra de estado", () => {
  it("documentos", () => {
    expect(textoDocumentoRenovadoEnFicha("seguro", "ZK 214 BD", "2027-11-15")).toBe("Seguro de ZK 214 BD renovado: vence el 15/11/2027.");
    expect(textoDocumentoRenovadoEnFicha("revision-tecnica", "ZK 214 BD", "2027-11-15")).toBe("Revisión técnica de ZK 214 BD renovada: vence el 15/11/2027.");
    expect(textoDocumentoCorregido("seguro", "ZK 214 BD")).toBe("Seguro de ZK 214 BD corregido.");
    expect(textoDocumentoCorregido("licencia", "Luis Ferreyra")).toBe("Licencia de conducir de Luis Ferreyra corregida.");
  });

  it("novedades y estado de la unidad", () => {
    expect(textoNovedadResuelta("Frenos", "ZU 899 QE", false)).toBe("Novedad resuelta: Frenos.");
    expect(textoNovedadResuelta("Frenos", "ZU 899 QE", true)).toBe("Novedad resuelta: Frenos. ZU 899 QE vuelve a servicio.");
    expect(textoNovedadResuelta("Frenos", "ZU 899 QE", false, true)).toBe("Novedad resuelta: Frenos (ZU 899 QE).");
    expect(textoNovedadCargada("ZK 214 BD", false)).toBe("Novedad cargada.");
    expect(textoNovedadCargada("ZK 214 BD", true)).toBe("Novedad cargada. ZK 214 BD queda fuera de servicio hasta que se resuelva.");
    expect(textoVueltaAServicio("ZK 214 BD", [])).toBe("ZK 214 BD vuelve a servicio.");
    expect(textoVueltaAServicio("ZK 214 BD", ["Seguro vencido hace 1 día", "Falta cargar: Matafuego"])).toBe(
      "ZK 214 BD vuelve a servicio. Todavía no puede salir: Seguro vencido hace 1 día; Falta cargar: Matafuego.",
    );
  });

  it("asignación: qué cambió y, si corresponde, que falta la habilitación (U6)", () => {
    expect(textoAsignacionCambiada({ proyecto: false, conductor: true }, false)).toBe("Conductor actualizado.");
    expect(textoAsignacionCambiada({ proyecto: true, conductor: false }, false)).toBe("Proyecto actualizado.");
    expect(textoAsignacionCambiada({ proyecto: true, conductor: true }, false)).toBe("Proyecto y conductor actualizados.");
    expect(textoAsignacionCambiada({ proyecto: true, conductor: false }, true)).toBe("Proyecto actualizado. Falta cargar la habilitación de ingreso al proyecto.");
  });
});
