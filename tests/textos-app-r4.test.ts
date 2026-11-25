// Textos nuevos del porte «tipo app» (ronda 4): carga y error de una pantalla diferida, etiqueta de la demo en dos mitades, aviso del documento por vencer en
// «Su unidad», «Mis partes», solapas de la ficha y nombres accesibles de la regla de vencimientos.
import { describe, expect, it } from "vitest";
import { TEXTO_MARCO, TEXTO_MAS } from "../src/componentes/textos-marco.ts";
import {
  DIAS_DE_AVISO_AL_CONDUCTOR,
  NOMBRES_DOCUMENTO,
  TEXTO_ERROR_DESCARGA,
  TEXTO_FICHA,
  TEXTO_INICIO_CONDUCTOR,
  textoAvisoDeDocumento,
  textoFraseDelAviso,
  textoPuntoDeLaRegla,
  textoUltimosPartes,
  textoVencimiento,
  textoYMasDelDia,
} from "../src/lib/dominio/textos.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import { clasificar } from "../src/lib/dominio/vencimientos.ts";

describe("marco: carga, error de descarga y etiqueta de la demo", () => {
  it("la carga de una pantalla diferida no habla de la flota de ejemplo", () => {
    expect(TEXTO_MARCO.cargandoPantalla).toBe("Cargando la pantalla…");
  });

  it("el error de descarga dice qué pasó y qué hacer, y no habla de datos dañados", () => {
    expect(TEXTO_ERROR_DESCARGA.titulo).toBe("No se pudo descargar esta pantalla");
    expect(TEXTO_ERROR_DESCARGA.mensaje).toBe("Compruebe la conexión y recargue la página.");
    expect(`${TEXTO_ERROR_DESCARGA.titulo} ${TEXTO_ERROR_DESCARGA.mensaje}`).not.toMatch(/dañad/);
  });

  it("las dos mitades de la etiqueta juntas dicen lo mismo que la entera", () => {
    expect(TEXTO_MARCO.etiquetaDemoMarca).toBe("Demo");
    expect(TEXTO_MARCO.etiquetaDemoDatos).toBe("con datos ficticios");
    expect(`${TEXTO_MARCO.etiquetaDemoMarca} ${TEXTO_MARCO.etiquetaDemoDatos}`).toBe(TEXTO_MARCO.etiquetaDemo);
  });

  it("«Más»: el conductor sin unidad no inventa una patente", () => {
    expect(TEXTO_MAS.verComo.conductorDescripcionSinUnidad("Tamara Olivera")).toBe("Tamara Olivera (persona ficticia) · sin unidad asignada");
  });

  it("las claves que quedaron sin uso ya no están", () => {
    for (const clave of ["pestanaAlertas", "pestanaFlota", "pestanaParteDeHoy", "ayudaPerfilConductor", "cambiarConductor", "cambiar", "volverAlPortafolio", "volverAlPortafolioCorto"]) {
      expect(clave in TEXTO_MARCO).toBe(false);
    }
  });
});

describe("aviso del documento por vencer en «Su unidad»", () => {
  it("hoy, mañana y en N días, con el artículo del documento", () => {
    expect(textoAvisoDeDocumento("revision-tecnica", 0)).toBe("La revisión técnica vence hoy");
    expect(textoAvisoDeDocumento("revision-tecnica", 1)).toBe("La revisión técnica vence mañana");
    expect(textoAvisoDeDocumento("revision-tecnica", 5)).toBe("La revisión técnica vence en 5 días");
    expect(textoAvisoDeDocumento("seguro", 7)).toBe("El seguro vence en 7 días");
  });

  it("sirve para cualquier documento: nombre en minúscula y artículo correcto", () => {
    expect(textoAvisoDeDocumento("matafuego", 2)).toBe("La carga del matafuego vence en 2 días");
    expect(textoAvisoDeDocumento("habilitacion-proyecto", 3)).toBe("La habilitación de ingreso al proyecto vence en 3 días");
    expect(textoAvisoDeDocumento("licencia", 0)).toBe("La licencia de conducir vence hoy");
    expect(textoAvisoDeDocumento("habilitacion-manejo", 4)).toBe("La habilitación de manejo en el proyecto vence en 4 días");
  });

  it("el plazo es el del grupo «7 días o menos» del dominio", () => {
    const hoy = "2026-11-25";
    const hasta = [...Array(31).keys()].filter((d) => clasificar(sumarDias(hoy, d), hoy).grupo === "7").pop();
    expect(DIAS_DE_AVISO_AL_CONDUCTOR).toBe(hasta);
  });

  it("fuera de 0 a 7 días no hay aviso ni frase", () => {
    for (const d of [-1, -30, 8, 30, 1.5, Number.NaN]) {
      expect(textoAvisoDeDocumento("seguro", d)).toBeNull();
      expect(textoFraseDelAviso(d)).toBeNull();
    }
  });

  it("la frase: hoy, mañana y varios días", () => {
    expect(textoFraseDelAviso(0)).toBe("Hoy la unidad puede salir; desde mañana, no, hasta que se renueve.");
    expect(textoFraseDelAviso(1)).toBe("Hoy y mañana la unidad puede salir; desde pasado mañana, no. Avise al encargado para renovar el documento a tiempo.");
    expect(textoFraseDelAviso(2)).toBe("Hasta el día del vencimiento la unidad puede salir. Avise al encargado para renovar el documento a tiempo.");
    expect(textoFraseDelAviso(7)).toBe(textoFraseDelAviso(2));
  });

  it("el aviso dice lo mismo que el estado del dominio (en minúscula y con artículo)", () => {
    for (let d = 0; d <= 7; d++) {
      const aviso = textoAvisoDeDocumento("seguro", d) as string;
      expect(aviso.endsWith(textoVencimiento(d, "2026-11-25").toLowerCase())).toBe(true);
    }
  });
});

describe("«Mis partes»", () => {
  it("«Ver todos» dice a dónde lleva", () => {
    expect(TEXTO_INICIO_CONDUCTOR.verTodosPartes).toEqual({ visible: "Ver todos", nombre: "Ver todos mis partes" });
  });

  it("la línea de contexto: cero, uno, cinco y más de diez", () => {
    expect(textoUltimosPartes(0)).toBe("Sin partes cerrados");
    expect(textoUltimosPartes(1)).toBe("el último");
    expect(textoUltimosPartes(2)).toBe("los últimos dos");
    expect(textoUltimosPartes(5)).toBe("los últimos cinco");
    expect(textoUltimosPartes(10)).toBe("los últimos diez");
    expect(textoUltimosPartes(12)).toBe("los últimos 12");
  });
});

describe("ficha: solapas", () => {
  it("los rótulos, y los tres últimos son los títulos de sus paneles", () => {
    expect(TEXTO_FICHA.solapas.resumen).toBe("Resumen");
    expect(TEXTO_FICHA.solapas.documentos).toBe(TEXTO_FICHA.documentos.titulo);
    expect(TEXTO_FICHA.solapas.novedades).toBe(TEXTO_FICHA.novedades.titulo);
    expect(TEXTO_FICHA.solapas.historial).toBe(TEXTO_FICHA.historial.titulo);
  });

  it("documentos: cero, uno y varios", () => {
    expect(TEXTO_FICHA.insigniaSolapa.documentos(0)).toBe("");
    expect(TEXTO_FICHA.insigniaSolapa.documentos(1)).toBe("1 vencido o faltante");
    expect(TEXTO_FICHA.insigniaSolapa.documentos(3)).toBe("3 vencidos o faltantes");
  });

  it("novedades: cero, una, varias, con y sin críticas", () => {
    const n = TEXTO_FICHA.insigniaSolapa.novedades;
    expect(n(0, 0)).toBe("");
    expect(n(1, 0)).toBe("1 abierta");
    expect(n(1, 1)).toBe("1 abierta, crítica");
    expect(n(3, 0)).toBe("3 abiertas");
    expect(n(3, 1)).toBe("3 abiertas, 1 crítica");
    expect(n(3, 2)).toBe("3 abiertas, 2 críticas");
    expect(n(3, 3)).toBe("3 abiertas, todas críticas");
    expect(n(2, 5)).toBe("2 abiertas, todas críticas");
    expect(n(2, -1)).toBe("2 abiertas");
  });
});

describe("regla de vencimientos", () => {
  it("el nombre accesible de un punto de una unidad", () => {
    expect(textoPuntoDeLaRegla({ patente: "ZK 214 BD" }, "seguro", "Vence en 3 días")).toBe("ZK 214 BD, seguro: vence en 3 días");
    expect(textoPuntoDeLaRegla({ patente: "ZR 536 MZ" }, "revision-tecnica", "Vence hoy")).toBe("ZR 536 MZ, revisión técnica: vence hoy");
    expect(textoPuntoDeLaRegla({ patente: "ZEP 235" }, "matafuego", "Vence mañana")).toBe("ZEP 235, carga del matafuego: vence mañana");
  });

  it("el de una persona, con su licencia", () => {
    expect(textoPuntoDeLaRegla({ conductor: "Bruno Juárez" }, "licencia", "Vence en 12 días")).toBe("licencia de conducir de Bruno Juárez: vence en 12 días");
  });

  it("coincide con el estado que da el dominio para cada tipo de documento", () => {
    for (const tipo of Object.keys(NOMBRES_DOCUMENTO) as (keyof typeof NOMBRES_DOCUMENTO)[]) {
      for (const d of [0, 1, 2, 30]) {
        const estado = clasificar(sumarDias("2026-11-25", d), "2026-11-25", tipo).texto;
        const dicho = textoPuntoDeLaRegla({ patente: "ZK 214 BD" }, tipo, estado);
        expect(dicho).toBe(`ZK 214 BD, ${NOMBRES_DOCUMENTO[tipo].toLowerCase()}: ${estado.toLowerCase()}`);
      }
    }
  });

  it("«y N más»: cero, uno y varios", () => {
    expect(textoYMasDelDia(0)).toBe("");
    expect(textoYMasDelDia(1)).toBe("y 1 vencimiento más ese día");
    expect(textoYMasDelDia(3)).toBe("y 3 vencimientos más ese día");
  });
});
