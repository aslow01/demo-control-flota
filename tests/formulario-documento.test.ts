// Paso 4.2 (lógica): diálogos «Renovar documento» y «Cargar documento» (docs/diseno-ui.md, 5.11, 5.15 y 5.17).
import { describe, expect, it } from "vitest";
import { ejecutar } from "../src/lib/dominio/comandos.ts";
import {
  CAMPOS_DOCUMENTO,
  comandoDeCargar,
  comandoDeRenovar,
  contextoDeCargar,
  contextoDeRenovar,
  erroresDeNegocio,
  etiquetaDeTitular,
  validarValores,
  type ValoresDocumento,
} from "../src/lib/dominio/formulario-documento.ts";
import { textoDocumentoCargado, textoDocumentoRenovado } from "../src/lib/dominio/textos.ts";
import { contexto, documento, ejecutarError, flotaDePrueba } from "./ayuda.ts";

const H = "2026-11-18";
const bien: ValoresDocumento = { numero: "DEMO-NUEVO-1", emisor: "Aseguradora del Sur Demo", vence: "2027-11-18", emitido: "" };

/** La flota de prueba con el seguro de u1 vencido ayer (el caso C01). */
function conSeguroVencido() {
  const e = flotaDePrueba();
  return { ...e, documentos: e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17", numero: "DEMO-88-4471", emisor: "Aseguradora del Sur Demo" } : d)) };
}

describe("campos y etiquetas", () => {
  it("el orden del formulario es número, emisor, vence, emitido (el del resumen de errores, P4)", () => {
    expect(CAMPOS_DOCUMENTO).toEqual(["numero", "emisor", "vence", "emitido"]);
  });

  it("la etiqueta de la unidad es su patente formateada; la del conductor, su nombre", () => {
    const e = flotaDePrueba();
    expect(etiquetaDeTitular(e, { tipo: "unidad", id: "u1" })).toBe("ZK 214 BD");
    expect(etiquetaDeTitular(e, { tipo: "conductor", id: "c1" })).toBe("Luis Ferreyra");
  });
});

describe("contexto de «Renovar documento»", () => {
  it("título, línea de contexto, emisor precargado y primario (el ejemplo de 5.17)", () => {
    const c = contextoDeRenovar(conSeguroVencido(), "u1-seguro", H);
    expect(c).toEqual({
      documentoId: "u1-seguro",
      titulo: "Renovar: Seguro de ZK 214 BD",
      contexto: "Actual: póliza DEMO-88-4471, venció el 17/11/2026 (hace 1 día).",
      nombreDocumento: "Seguro",
      titularEtiqueta: "ZK 214 BD",
      valoresIniciales: { numero: "", emisor: "Aseguradora del Sur Demo", vence: "", emitido: "" },
      primario: "Guardar renovación",
    });
  });

  it("vence hoy, mañana-en-adelante y hace varios días", () => {
    const e = flotaDePrueba();
    const con = (vence: string) => ({ ...e, documentos: e.documentos.map((d) => (d.id === "u1-revision-tecnica" ? { ...d, vence } : d)) });
    const texto = (vence: string) => contextoDeRenovar(con(vence), "u1-revision-tecnica", H)?.contexto;
    expect(texto("2026-11-18")).toBe("Actual: número DEMO-u1-revision-tecnica, vence hoy (18/11/2026).");
    expect(texto("2026-11-25")).toBe("Actual: número DEMO-u1-revision-tecnica, vence el 25/11/2026 (en 7 días).");
    expect(texto("2026-11-19")).toBe("Actual: número DEMO-u1-revision-tecnica, vence el 19/11/2026 (en 1 día).");
    expect(texto("2026-11-15")).toBe("Actual: número DEMO-u1-revision-tecnica, venció el 15/11/2026 (hace 3 días).");
  });

  it("de un conductor: el título lleva su nombre", () => {
    const c = contextoDeRenovar(flotaDePrueba(), "c1-licencia", H);
    expect(c?.titulo).toBe("Renovar: Licencia de conducir de Luis Ferreyra");
  });

  it("si el documento no existe o ya fue reemplazado, no hay diálogo (null)", () => {
    const e = flotaDePrueba();
    expect(contextoDeRenovar(e, "no-existe", H)).toBeNull();
    const nuevo = documento({ id: "u1-seguro-nuevo", titular: { tipo: "unidad", id: "u1" }, tipo: "seguro", vence: "2028-01-01", reemplazaA: "u1-seguro" });
    expect(contextoDeRenovar({ ...e, documentos: [...e.documentos, nuevo] }, "u1-seguro", H)).toBeNull();
  });
});

describe("contexto de «Cargar documento»", () => {
  it("título, valores vacíos y primario", () => {
    const e = flotaDePrueba();
    const sin = { ...e, documentos: e.documentos.filter((d) => d.id !== "u1-habilitacion-proyecto") };
    const c = contextoDeCargar(sin, { tipo: "unidad", id: "u1" }, "habilitacion-proyecto");
    expect(c).toEqual({
      titular: { tipo: "unidad", id: "u1" },
      tipoDocumento: "habilitacion-proyecto",
      titulo: "Cargar: Habilitación de ingreso al proyecto de ZK 214 BD",
      nombreDocumento: "Habilitación de ingreso al proyecto",
      titularEtiqueta: "ZK 214 BD",
      valoresIniciales: { numero: "", emisor: "", vence: "", emitido: "" },
      primario: "Guardar documento",
    });
  });

  it("si el titular no existe o ya tiene ese documento vigente, no hay diálogo (se renueva, no se carga)", () => {
    const e = flotaDePrueba();
    expect(contextoDeCargar(e, { tipo: "unidad", id: "u1" }, "seguro")).toBeNull();
    expect(contextoDeCargar(e, { tipo: "unidad", id: "no-existe" }, "seguro")).toBeNull();
  });
});

describe("armado de los comandos", () => {
  it("renovar: recorta, y el emitido vacío pasa a null", () => {
    expect(comandoDeRenovar("d1", { numero: "  X-1 ", emisor: " Emisor ", vence: " 2027-01-01 ", emitido: "  " })).toEqual({
      tipo: "renovarDocumento",
      documentoId: "d1",
      numero: "X-1",
      emisor: "Emisor",
      vence: "2027-01-01",
      emitido: null,
    });
  });

  it("cargar: lleva el titular, el tipo y el emitido si lo escribieron", () => {
    expect(comandoDeCargar({ tipo: "unidad", id: "u1" }, "seguro", { ...bien, emitido: "2026-11-01" })).toEqual({
      tipo: "cargarDocumento",
      titular: { tipo: "unidad", id: "u1" },
      tipoDocumento: "seguro",
      numero: "DEMO-NUEVO-1",
      emisor: "Aseguradora del Sur Demo",
      vence: "2027-11-18",
      emitido: "2026-11-01",
    });
  });

  it("el comando armado es aceptado por el dominio", () => {
    const e = conSeguroVencido();
    const r = ejecutar(e, comandoDeRenovar("u1-seguro", bien), contexto());
    expect(r.ok).toBe(true);
  });
});

describe("validación de todos los campos a la vez (5.15)", () => {
  it("sin errores devuelve null", () => {
    expect(validarValores(bien, H)).toBeNull();
    expect(validarValores({ ...bien, emisor: "", emitido: "2026-11-01" }, H)).toBeNull();
  });

  it("vacío: número y vencimiento juntos, en el orden del formulario, con los mismos mensajes del dominio", () => {
    const err = validarValores({ numero: "", emisor: "", vence: "", emitido: "" }, H);
    expect(err?.lista.map((x) => x.campo)).toEqual(["numero", "vence"]);
    expect(err?.porCampo).toEqual({ numero: "Escriba el número del documento.", vence: "Escriba una fecha válida." });
    expect(err?.general).toBeNull();
  });

  it("emisor de más de 80 caracteres, fecha lejana y emisión inválida", () => {
    const err = validarValores({ numero: "A", emisor: "x".repeat(81), vence: "2040-01-01", emitido: "31/12/2026" }, H);
    expect(err?.lista.map((x) => x.campo)).toEqual(["emisor", "vence", "emitido"]);
    expect(err?.porCampo.emisor).toBe("El emisor no puede superar 80 caracteres.");
    expect(err?.porCampo.vence).toBe("La fecha de vencimiento no puede ser posterior al 18/11/2036.");
    expect(err?.porCampo.emitido).toBe("Escriba una fecha válida.");
  });

  it("dice lo mismo que el dominio cuando el comando se rechaza por un solo campo", () => {
    const e = conSeguroVencido();
    for (const valores of [
      { ...bien, numero: "" },
      { ...bien, vence: "2027-02-30" },
      { ...bien, emisor: "y".repeat(81) },
      { ...bien, emitido: "2026-13-01" },
    ]) {
      const dominio = ejecutarError(e, comandoDeRenovar("u1-seguro", valores));
      const previa = validarValores(valores, H);
      expect(previa?.lista).toEqual([{ campo: dominio.campo, mensaje: dominio.mensaje }]);
    }
  });

  it("no mira lo que depende de dos campos (eso lo dice el comando): emisión posterior al vencimiento pasa la previa", () => {
    expect(validarValores({ ...bien, emitido: "2028-01-01" }, H)).toBeNull();
  });
});

describe("errores de negocio al formulario", () => {
  it("un error con campo del formulario va al campo y al resumen", () => {
    const e = conSeguroVencido();
    const dominio = ejecutarError(e, comandoDeRenovar("u1-seguro", { ...bien, vence: "2026-11-10" }));
    expect(dominio.codigo).toBe("renovacion-no-posterior");
    expect(erroresDeNegocio(dominio)).toEqual({
      porCampo: { vence: "La renovación tiene que vencer después del 17/11/2026." },
      lista: [{ campo: "vence", mensaje: "La renovación tiene que vencer después del 17/11/2026." }],
      general: null,
    });
  });

  it("emisión posterior al vencimiento cae en el campo «emitido»", () => {
    const e = conSeguroVencido();
    const dominio = ejecutarError(e, comandoDeRenovar("u1-seguro", { ...bien, emitido: "2028-01-01" }));
    expect(erroresDeNegocio(dominio).porCampo.emitido).toBe("La fecha de emisión no puede ser posterior al vencimiento.");
  });

  it("un error sin campo (documento no vigente, escritura fallida) queda como error general del diálogo", () => {
    expect(erroresDeNegocio({ codigo: "documento-no-vigente", mensaje: "Mensaje general." })).toEqual({
      porCampo: {},
      lista: [],
      general: "Mensaje general.",
    });
  });

  it("un error con un campo que el diálogo no tiene (tipoDocumento) también es general", () => {
    const err = erroresDeNegocio({ codigo: "documento-existente", mensaje: "Ya hay uno.", campo: "tipoDocumento" });
    expect(err.general).toBe("Ya hay uno.");
    expect(err.lista).toEqual([]);
  });
});

describe("textos de lo que se hizo (barra de estado de 5.17)", () => {
  it("concuerdan en género con el documento", () => {
    expect(textoDocumentoRenovado("seguro", "ZK 214 BD")).toBe("Seguro de ZK 214 BD renovado.");
    expect(textoDocumentoRenovado("revision-tecnica", "ZK 214 BD")).toBe("Revisión técnica de ZK 214 BD renovada.");
    expect(textoDocumentoRenovado("licencia", "Luis Ferreyra")).toBe("Licencia de conducir de Luis Ferreyra renovada.");
    expect(textoDocumentoCargado("habilitacion-proyecto", "ZP 088 KC")).toBe("Habilitación de ingreso al proyecto de ZP 088 KC cargada.");
    expect(textoDocumentoCargado("seguro", "ZP 088 KC")).toBe("Seguro de ZP 088 KC cargado.");
  });
});
