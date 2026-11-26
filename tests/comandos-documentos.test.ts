import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { aptitud } from "../src/lib/dominio/aptitud.ts";
import { documentoVigente } from "../src/lib/dominio/vencimientos.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { contexto, ejecutarError, ejecutarOk, flotaDePrueba } from "./ayuda.ts";

const H = "2026-11-18";

/** La flota de prueba, pero con el seguro de u1 vencido ayer y sin matafuego en u2. */
function conSeguroVencido(): Estado {
  const e = flotaDePrueba();
  return {
    ...e,
    documentos: e.documentos
      .map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17", numero: "DEMO-88-4471" } : d))
      .filter((d) => d.id !== "u2-matafuego"),
  };
}

describe("cargarDocumento", () => {
  const carga = {
    tipo: "cargarDocumento" as const,
    titular: { tipo: "unidad" as const, id: "u2" },
    tipoDocumento: "matafuego" as const,
    numero: "DEMO-MF-100",
    emisor: "Planta de Recarga Demo",
    vence: "2027-05-10",
    emitido: "2026-05-10",
  };

  it("H1: carga el documento faltante con un evento documento-cargado y quita la alerta", () => {
    const e = conSeguroVencido();
    const antes = calcularAlertas(e, H).alertas.filter((a) => a.tipo === "documento-faltante");
    expect(antes).toHaveLength(1);
    const r = ejecutarOk(e, carga);
    expect(r.eventos.map((x) => x.tipo)).toEqual(["documento-cargado"]);
    expect(r.eventos[0]).toMatchObject({ unidadId: "u2", resumen: "Documento cargado (ZKB 482): Carga del matafuego, vence el 10/05/2027" });
    const nuevo = documentoVigente(r.estado.documentos, { tipo: "unidad", id: "u2" }, "matafuego");
    expect(nuevo).toMatchObject({ numero: "DEMO-MF-100", vence: "2027-05-10", emitido: "2026-05-10", reemplazaA: null, cargado: "2026-11-18T15:00:00.000Z" });
    expect(calcularAlertas(r.estado, H).alertas.filter((a) => a.tipo === "documento-faltante")).toHaveLength(0);
  });

  it("el documento de un conductor también se puede cargar", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(e, { ...carga, titular: { tipo: "conductor", id: "c1" }, tipoDocumento: "habilitacion-manejo", numero: "HM-1" });
    expect(r.eventos[0]).toMatchObject({ unidadId: null, conductorId: "c1" });
  });

  it("el tipo tiene que corresponder al titular", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { ...carga, titular: { tipo: "conductor", id: "c1" } }).codigo).toBe("tipo-no-corresponde");
    expect(ejecutarError(e, { ...carga, tipoDocumento: "licencia" }).codigo).toBe("tipo-no-corresponde");
  });

  it("código M4: un tipo que no existe se rechaza con un mensaje claro (no «undefined no corresponde…»)", () => {
    const e = flotaDePrueba();
    const err = ejecutarError(e, { ...carga, tipoDocumento: "inventado" });
    expect(err.codigo).toBe("tipo-documento-invalido");
    expect(err.campo).toBe("tipoDocumento");
    expect(err.mensaje).toBe("Elija el tipo de documento.");
  });

  it("si ya hay uno de ese tipo, se pide renovarlo", () => {
    const e = flotaDePrueba();
    const err = ejecutarError(e, { ...carga, titular: { tipo: "unidad", id: "u1" }, tipoDocumento: "seguro" });
    expect(err.codigo).toBe("documento-existente");
    expect(err.mensaje).toBe("Ya hay cargado un documento «Seguro». Para actualizarlo, use «Renovar».");
  });

  it("V11: el vencimiento va de 2000-01-01 a hoy + 10 años", () => {
    const e = conSeguroVencido();
    expect(ejecutarOk(e, { ...carga, vence: "2036-11-18" }).estado.documentos).toHaveLength(e.documentos.length + 1);
    const err = ejecutarError(e, { ...carga, vence: "2036-11-19" });
    expect(err.mensaje).toBe("La fecha de vencimiento no puede ser posterior al 18/11/2036.");
    expect(err.campo).toBe("vence");
    // antes del 2000 no es una fecha válida para T4 (año de 2000 a 2100)
    expect(ejecutarError(e, { ...carga, vence: "1999-12-31" }).codigo).toBe("fecha-invalida");
    expect(ejecutarOk(e, { ...carga, vence: "2000-01-01", emitido: null }).estado.documentos.length).toBeGreaterThan(0);
  });

  it("QA E5: un año fuera de 2000 a 2100 dice el rango; una fecha imposible o mal escrita sigue diciendo «válida»", () => {
    const e = conSeguroVencido();
    for (const vence of ["9999-12-31", "1999-12-31", "0001-01-01", "2101-01-01"]) {
      const err = ejecutarError(e, { ...carga, vence });
      expect(err.codigo, vence).toBe("fecha-invalida");
      expect(err.mensaje, vence).toBe("Escriba una fecha entre los años 2000 y 2100.");
    }
    for (const vence of ["2027-02-29", "18/11/2027", "", "mañana", "2027-13-01"]) {
      expect(ejecutarError(e, { ...carga, vence }).mensaje, vence).toBe("Escriba una fecha válida.");
    }
  });

  it("T4: fechas inválidas o con otro formato", () => {
    const e = conSeguroVencido();
    for (const vence of ["2027-02-29", "18/11/2027", "", "mañana"]) {
      expect(ejecutarError(e, { ...carga, vence }).codigo, vence).toBe("fecha-invalida");
    }
    expect(ejecutarError(e, { ...carga, emitido: "2026-13-01" }).campo).toBe("emitido");
  });

  it("la emisión no puede ser posterior al vencimiento", () => {
    const e = conSeguroVencido();
    expect(ejecutarError(e, { ...carga, emitido: "2027-06-01" }).mensaje).toBe("La fecha de emisión no puede ser posterior al vencimiento.");
  });

  it("U7: número obligatorio (hasta 40) y emisor opcional (hasta 80), recortados", () => {
    const e = conSeguroVencido();
    expect(ejecutarError(e, { ...carga, numero: "  " }).campo).toBe("numero");
    expect(ejecutarError(e, { ...carga, numero: "x".repeat(41) }).mensaje).toBe("El número no puede superar 40 caracteres.");
    expect(ejecutarError(e, { ...carga, emisor: "x".repeat(81) }).mensaje).toBe("El emisor no puede superar 80 caracteres.");
    const r = ejecutarOk(e, { ...carga, numero: "  <i>1</i>  ", emisor: "" });
    const d = documentoVigente(r.estado.documentos, { tipo: "unidad", id: "u2" }, "matafuego");
    expect(d?.numero).toBe("<i>1</i>");
    expect(d?.emisor).toBe("");
  });

  it("titular inexistente o unidad de baja", () => {
    const e = conSeguroVencido();
    expect(ejecutarError(e, { ...carga, titular: { tipo: "unidad", id: "zzz" } }).codigo).toBe("unidad-inexistente");
    expect(ejecutarError(e, { ...carga, titular: { tipo: "conductor", id: "zzz" }, tipoDocumento: "licencia" }).codigo).toBe("conductor-inexistente");
    const baja = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u2", motivo: "Venta de la unidad" }).estado;
    expect(ejecutarError(baja, carga).codigo).toBe("unidad-de-baja");
  });
});

describe("renovarDocumento", () => {
  const renovar = (vence: string) => ({
    tipo: "renovarDocumento" as const,
    documentoId: "u1-seguro",
    numero: "DEMO-88-5000",
    emisor: "Seguros Puna Demo",
    vence,
    emitido: null,
  });

  it("V10: renovar con una fecha igual o anterior se rechaza con la fecha del vigente", () => {
    const e = flotaDePrueba(); // seguro vence 2027-06-30
    const a = ejecutarError(e, renovar("2027-06-29"));
    expect(a.mensaje).toBe("La renovación tiene que vencer después del 30/06/2027.");
    expect(a.campo).toBe("vence");
    expect(ejecutarError(e, renovar("2027-06-30")).codigo).toBe("renovacion-no-posterior");
    expect(ejecutarOk(e, renovar("2027-07-01")).estado.documentos).toHaveLength(e.documentos.length + 1);
  });

  it("V10 (ejemplo del diseño): vigente 25/11/2026, renovar con 20/11 -> error; 26/11 -> acepta", () => {
    const e = flotaDePrueba();
    const e2 = { ...e, documentos: e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-25" } : d)) };
    expect(ejecutarError(e2, renovar("2026-11-20")).mensaje).toBe("La renovación tiene que vencer después del 25/11/2026.");
    expect(ejecutarError(e2, renovar("2026-11-25")).codigo).toBe("renovacion-no-posterior");
    expect(ejecutarOk(e2, renovar("2026-11-26")).estado.documentos.length).toBe(e.documentos.length + 1);
  });

  it("V9, H1: la renovación pasa a ser la vigente, reemplaza al anterior y el evento lleva ambos vencimientos", () => {
    const e = conSeguroVencido();
    const r = ejecutarOk(e, renovar("2027-11-17"));
    const nuevo = documentoVigente(r.estado.documentos, { tipo: "unidad", id: "u1" }, "seguro");
    expect(nuevo).toMatchObject({ numero: "DEMO-88-5000", emisor: "Seguros Puna Demo", reemplazaA: "u1-seguro", vence: "2027-11-17" });
    expect(r.estado.documentos.find((d) => d.id === "u1-seguro")?.vence).toBe("2026-11-17"); // el viejo queda como historial
    expect(r.eventos.map((x) => x.tipo)).toEqual(["documento-renovado"]);
    expect(r.eventos[0]?.datos).toMatchObject({ venceAnterior: "2026-11-17", venceNuevo: "2027-11-17", documentoAnteriorId: "u1-seguro" });
    expect(r.eventos[0]?.resumen).toBe("Renovación de Seguro (ZK 214 BD): vencía el 17/11/2026, ahora vence el 17/11/2027");
  });

  it("la unidad vuelve a poder salir y la alerta desaparece sin recargar nada", () => {
    const e = conSeguroVencido();
    expect(aptitud(e.unidades[0]!, e, H).puedeSalir).toBe(false);
    const r = ejecutarOk(e, renovar("2027-11-17"));
    expect(aptitud(r.estado.unidades[0]!, r.estado, H).puedeSalir).toBe(true);
    expect(calcularAlertas(r.estado, H).alertas.some((a) => a.texto.includes("Seguro"))).toBe(false);
  });

  it("V11: el rango también vale para renovar", () => {
    const err = ejecutarError(flotaDePrueba(), renovar("2036-11-19"));
    expect(err.mensaje).toBe("La fecha de vencimiento no puede ser posterior al 18/11/2036.");
  });

  it("solo se renueva el documento vigente, no uno que ya fue reemplazado", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(e, renovar("2027-07-01"), contexto());
    const err = ejecutarError(r.estado, renovar("2027-08-01"));
    expect(err.codigo).toBe("documento-no-vigente");
  });

  it("documento inexistente, o de una unidad de baja", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { ...renovar("2027-07-01"), documentoId: "zzz" }).codigo).toBe("documento-inexistente");
    const baja = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" }).estado;
    expect(ejecutarError(baja, renovar("2027-07-01")).codigo).toBe("unidad-de-baja");
  });

  it("U7: el número es obligatorio", () => {
    expect(ejecutarError(flotaDePrueba(), { ...renovar("2027-07-01"), numero: "" }).campo).toBe("numero");
  });
});

describe("corregirDocumento", () => {
  it("H1: corrige un campo y el evento guarda el antes y el después de lo que cambió", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(e, { tipo: "corregirDocumento", documentoId: "u1-seguro", numero: "DEMO-CORREGIDO" });
    expect(r.estado.documentos.find((d) => d.id === "u1-seguro")?.numero).toBe("DEMO-CORREGIDO");
    expect(r.eventos.map((x) => x.tipo)).toEqual(["documento-corregido"]);
    expect(r.eventos[0]?.datos).toMatchObject({
      cambios: { numero: { antes: "DEMO-u1-seguro", despues: "DEMO-CORREGIDO" } },
    });
    expect(r.eventos[0]?.resumen).toBe("Corrección de Seguro (ZK 214 BD): número");
  });

  it("corrige varios campos a la vez y lo dice en el resumen", () => {
    const e = flotaDePrueba();
    const r = ejecutarOk(e, { tipo: "corregirDocumento", documentoId: "u1-seguro", vence: "2027-07-15", emisor: "Otra Aseguradora Demo", emitido: "2026-07-15" });
    expect(r.eventos[0]?.resumen).toBe("Corrección de Seguro (ZK 214 BD): emisor, vencimiento, fecha de emisión");
    expect(Object.keys((r.eventos[0]?.datos as { cambios: object }).cambios)).toEqual(["emisor", "vence", "emitido"]);
  });

  it("si nada cambia no hay evento: se rechaza", () => {
    const e = flotaDePrueba();
    const err = ejecutarError(e, { tipo: "corregirDocumento", documentoId: "u1-seguro", numero: "DEMO-u1-seguro" });
    expect(err.codigo).toBe("sin-cambios");
    expect(ejecutarError(e, { tipo: "corregirDocumento", documentoId: "u1-seguro" }).codigo).toBe("sin-cambios");
  });

  it("V11 y T4 valen para el vencimiento corregido", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { tipo: "corregirDocumento", documentoId: "u1-seguro", vence: "2036-11-19" }).codigo).toBe("vence-fuera-de-rango");
    expect(ejecutarError(e, { tipo: "corregirDocumento", documentoId: "u1-seguro", vence: "2027-02-30" }).codigo).toBe("fecha-invalida");
  });

  it("V9/V10: corregir no puede dar vuelta el orden entre un documento y su renovación", () => {
    const e = flotaDePrueba(); // seguro vence 2027-06-30
    const r = ejecutarOk(e, { tipo: "renovarDocumento", documentoId: "u1-seguro", numero: "N2", emisor: "", vence: "2028-06-30", emitido: null }).estado;
    const renovado = r.documentos.find((d) => d.reemplazaA === "u1-seguro")!;
    // la renovación no puede pasar a vencer antes que el original
    const alReves = ejecutarError(r, { tipo: "corregirDocumento", documentoId: renovado.id, vence: "2027-06-30" });
    expect(alReves.codigo).toBe("renovacion-no-posterior");
    // QA B6: corregir no renueva nada; el mensaje dice lo que la regla controla
    expect(alReves.mensaje).toBe("El vencimiento tiene que ser posterior al del documento anterior (30/06/2027).");
    expect(alReves.campo).toBe("vence");
    // y el original no puede pasar a vencer después que su renovación
    expect(ejecutarError(r, { tipo: "corregirDocumento", documentoId: "u1-seguro", vence: "2028-06-30" }).codigo).toBe("vence-posterior-a-renovacion");
    expect(ejecutarOk(r, { tipo: "corregirDocumento", documentoId: "u1-seguro", vence: "2028-06-29" }).estado.documentos.length).toBe(r.documentos.length);
  });

  it("la emisión no puede quedar después del vencimiento", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { tipo: "corregirDocumento", documentoId: "u1-seguro", emitido: "2027-07-01" }).codigo).toBe("emision-posterior");
    expect(ejecutarOk(e, { tipo: "corregirDocumento", documentoId: "u1-seguro", emitido: "2027-06-30" }).estado.documentos.length).toBe(e.documentos.length);
  });

  it("documento inexistente o de una unidad de baja", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, { tipo: "corregirDocumento", documentoId: "zzz", numero: "X" }).codigo).toBe("documento-inexistente");
    const baja = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" }).estado;
    expect(ejecutarError(baja, { tipo: "corregirDocumento", documentoId: "u1-seguro", numero: "X" }).codigo).toBe("unidad-de-baja");
  });
});
