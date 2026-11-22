import { describe, expect, it } from "vitest";
import { calcularAlertas, nombreCorto, type Alerta } from "../src/lib/dominio/alertas.ts";
import { aptitud } from "../src/lib/dominio/aptitud.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import type { Conductor, Documento, Estado, Unidad } from "../src/lib/dominio/tipos.ts";
import { PROYECTO_BASE, PROYECTO_PIEDRA, conductor, documento, estadoVacio, novedad, parte, unidad } from "./ayuda.ts";

/** Unidad creada hoy: todavía no debe partes (P6), así los demás tests no se mezclan con esa alerta. */
function nueva(parcial: Partial<Unidad> = {}): Unidad {
  return unidad({ creada: `${H}T12:00:00.000Z`, ...parcial });
}

/** Unidad vieja: creada hace meses. */
const vieja = (parcial: Partial<Unidad> = {}): Unidad => unidad(parcial);

const H = "2026-11-18";
const en = (d: number) => sumarDias(H, d);

/** Unidad de Piedra Lunar con todos sus obligatorios lejos de vencer, salvo lo que se cambie. */
function docsUnidad(unidadId: string, vence: Partial<Record<string, string>> = {}, omitir: string[] = []): Documento[] {
  return (["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"] as const)
    .filter((tipo) => !omitir.includes(tipo))
    .map((tipo) => documento({ id: `${unidadId}-${tipo}`, titular: { tipo: "unidad", id: unidadId }, tipo, vence: vence[tipo] ?? en(200) }));
}

function docConductor(c: string, tipo: "licencia" | "habilitacion-manejo", vence: string): Documento {
  return documento({ id: `${c}-${tipo}`, titular: { tipo: "conductor", id: c }, tipo, vence });
}

function base(parcial: Partial<Estado> = {}): Estado {
  const u = nueva();
  return estadoVacio({ unidades: [u], documentos: docsUnidad("u1"), ...parcial });
}

function porTipo(alertas: Alerta[], tipo: string): Alerta[] {
  return alertas.filter((a) => a.tipo === tipo);
}

describe("alertas de documentos", () => {
  it("QA M-2: la alerta de una revisión técnica vencida dice «Vencida» y la del seguro, «Vencido»", () => {
    const e = base({ documentos: docsUnidad("u1", { "revision-tecnica": en(-1), seguro: en(-1) }) });
    const textos = calcularAlertas(e, H).alertas.map((a) => a.texto).sort();
    expect(textos).toEqual(["Vencida hace 1 día · Revisión técnica", "Vencido hace 1 día · Seguro"]);
  });

  it("V1: documento vencido -> alerta crítica del grupo vencidos con su texto", () => {
    const e = base({ documentos: docsUnidad("u1", { seguro: en(-3) }) });
    const { alertas } = calcularAlertas(e, H);
    expect(alertas).toHaveLength(1);
    expect(alertas[0]).toMatchObject({
      tipo: "documento-vencido",
      categoria: "vencimientos",
      gravedad: "critica",
      grupo: "vencidos",
      texto: "Vencido hace 3 días · Seguro",
      unidadId: "u1",
      documentoId: "u1-seguro",
    });
  });

  it("V12: obligatorio faltante -> alerta crítica 'Falta cargar'", () => {
    const e = base({ documentos: docsUnidad("u1", {}, ["habilitacion-proyecto"]) });
    const { alertas } = calcularAlertas(e, H);
    expect(alertas).toHaveLength(1);
    expect(alertas[0]).toMatchObject({
      tipo: "documento-faltante",
      gravedad: "critica",
      grupo: "vencidos",
      texto: "Falta cargar · Habilitación de ingreso al proyecto",
      documentoId: null,
    });
  });

  it("V13: en la base de mantenimiento no se exige la habilitación", () => {
    const e = base({ unidades: [nueva({ proyectoId: PROYECTO_BASE.id })], documentos: docsUnidad("u1", {}, ["habilitacion-proyecto"]) });
    expect(calcularAlertas(e, H).alertas).toEqual([]);
  });

  describe("M4 (a confirmar): un documento que el proyecto no exige alerta con gravedad baja", () => {
    const enBase = (vence: string) =>
      base({ unidades: [nueva({ proyectoId: PROYECTO_BASE.id })], documentos: docsUnidad("u1", { "habilitacion-proyecto": vence }) });

    it("vencido y cargado en la base de mantenimiento: alerta baja, en el grupo vencidos, que no sube la insignia", () => {
      const e = enBase(en(-3));
      const r = calcularAlertas(e, H);
      expect(r.alertas).toHaveLength(1);
      expect(r.alertas[0]).toMatchObject({
        tipo: "documento-vencido",
        gravedad: "baja",
        grupo: "vencidos",
        texto: "Vencida hace 3 días · Habilitación de ingreso al proyecto",
      });
      expect(r.resumen.criticas).toBe(0);
      expect(r.resumen.porGrupo.vencidos).toBe(1);
    });

    it("es coherente con la aptitud: la unidad puede salir y no hay alertas críticas", () => {
      const e = enBase(en(-3));
      expect(aptitud(e.unidades[0]!, e, H).categoria).toBe("puede-salir");
      expect(calcularAlertas(e, H).resumen.noPuedenSalir).toHaveLength(0);
    });

    it("por vencer en 5 días en la base: también baja (no 'media'); el grupo sigue siendo 7", () => {
      const [a] = calcularAlertas(enBase(en(5)), H).alertas;
      expect(a).toMatchObject({ tipo: "documento-por-vencer", gravedad: "baja", grupo: "7" });
    });

    it("la misma habilitación vencida en un proyecto que sí la exige sigue siendo crítica y cuenta en la insignia", () => {
      const e = base({ documentos: docsUnidad("u1", { "habilitacion-proyecto": en(-3) }) });
      const r = calcularAlertas(e, H);
      expect(r.alertas[0]).toMatchObject({ tipo: "documento-vencido", gravedad: "critica" });
      expect(r.resumen.criticas).toBe(1);
      expect(aptitud(e.unidades[0]!, e, H).categoria).toBe("no-puede-salir");
    });

    it("el seguro vencido en la base sigue siendo crítico (el cambio es solo para lo que el proyecto no exige)", () => {
      const e = base({ unidades: [nueva({ proyectoId: PROYECTO_BASE.id })], documentos: docsUnidad("u1", { seguro: en(-1) }) });
      expect(calcularAlertas(e, H).alertas[0]).toMatchObject({ gravedad: "critica" });
    });

    it("la habilitación de manejo del conductor (V17) sigue alertando como los demás documentos", () => {
      const c: Conductor = conductor({ id: "c1" });
      const e = base({ conductores: [c], documentos: [...docsUnidad("u1"), docConductor("c1", "licencia", en(200)), docConductor("c1", "habilitacion-manejo", en(-2))] });
      expect(calcularAlertas(e, H).alertas.find((a) => a.tipoDocumento === "habilitacion-manejo")).toMatchObject({ gravedad: "critica" });
    });
  });

  it("V2 a V5: por vencer en grupo 7, 15 y 30 con su gravedad", () => {
    const e = base({
      documentos: docsUnidad("u1", {
        seguro: en(0),
        "revision-tecnica": en(8),
        matafuego: en(30),
      }),
    });
    const { alertas } = calcularAlertas(e, H);
    expect(alertas.map((a) => [a.tipo, a.grupo, a.gravedad, a.texto])).toEqual([
      ["documento-por-vencer", "7", "media", "Vence hoy · Seguro"],
      ["documento-por-vencer", "15", "baja", "Vence en 8 días · Revisión técnica"],
      ["documento-por-vencer", "30", "baja", "Vence en 30 días · Carga del matafuego"],
    ]);
  });

  it("V6: a más de 30 días no hay alerta", () => {
    const e = base({ documentos: docsUnidad("u1", { seguro: en(31) }) });
    expect(calcularAlertas(e, H).alertas).toEqual([]);
  });

  it("V9: un documento renovado no alerta por el viejo", () => {
    const viejo = documento({ id: "viejo", titular: { tipo: "unidad", id: "u1" }, tipo: "seguro", vence: "2026-11-10" });
    const nuevo = documento({ id: "nuevo", titular: { tipo: "unidad", id: "u1" }, tipo: "seguro", vence: "2027-11-10", reemplazaA: "viejo" });
    const e = base({ documentos: [...docsUnidad("u1", {}, ["seguro"]), viejo, nuevo] });
    expect(calcularAlertas(e, H).alertas).toEqual([]);
  });

  it("V14: unidad de baja con seguro vencido -> sin alerta", () => {
    const u = nueva({ estado: { tipo: "baja", desde: "2026-10-01", motivo: "Venta" } });
    const e = base({ unidades: [u], documentos: docsUnidad("u1", { seguro: en(-40) }) });
    expect(calcularAlertas(e, H).alertas).toEqual([]);
  });

  it("V14: conductor inactivo con licencia vencida -> sin alerta; activo -> sí", () => {
    const inactivo: Conductor = conductor({ id: "c1", activo: false });
    const activo: Conductor = conductor({ id: "c2", nombre: "Rosa Quiroga", activo: true });
    const e = base({
      conductores: [inactivo, activo],
      documentos: [docConductor("c1", "licencia", en(-5)), docConductor("c2", "licencia", en(-5))],
      unidades: [],
    });
    const { alertas } = calcularAlertas(e, H);
    expect(alertas.map((a) => a.conductorId)).toEqual(["c2"]);
  });

  it("V12: conductor activo sin licencia -> 'Falta cargar'", () => {
    const e = base({ unidades: [], conductores: [conductor({ id: "c1" })], documentos: [] });
    const { alertas } = calcularAlertas(e, H);
    expect(alertas).toHaveLength(1);
    expect(alertas[0]).toMatchObject({ tipo: "documento-faltante", texto: "Falta cargar · Licencia de conducir", conductorId: "c1" });
  });

  it("V15: unidad fuera de servicio con revisión técnica a 5 días -> alerta grupo 7", () => {
    const u = nueva({
      estado: { tipo: "fuera-de-servicio", desde: en(-5), motivo: "En taller: cambio de embrague", origen: "manual", novedadIds: [] },
    });
    const e = base({ unidades: [u], documentos: docsUnidad("u1", { "revision-tecnica": en(5) }) });
    const { alertas } = calcularAlertas(e, H);
    expect(alertas).toHaveLength(1);
    expect(alertas[0]).toMatchObject({ tipo: "documento-por-vencer", grupo: "7", texto: "Vence en 5 días · Revisión técnica" });
  });

  it("V17: habilitación de manejo que falta no alerta; cargada y por vencer en 12 días -> grupo 15", () => {
    const lic = docConductor("c1", "licencia", en(200));
    const sinHab = base({ unidades: [], conductores: [conductor({ id: "c1" })], documentos: [lic] });
    expect(calcularAlertas(sinHab, H).alertas).toEqual([]);
    const conHab = base({ unidades: [], conductores: [conductor({ id: "c1" })], documentos: [lic, docConductor("c1", "habilitacion-manejo", en(12))] });
    const { alertas } = calcularAlertas(conHab, H);
    expect(alertas).toHaveLength(1);
    expect(alertas[0]).toMatchObject({ grupo: "15", texto: "Vence en 12 días · Habilitación de manejo en el proyecto" });
  });
});

describe("V16: orden de la lista de vencimientos", () => {
  it("V16: por grupo; en el grupo, faltantes primero y después el más vencido; luego por patente", () => {
    const u1 = nueva({ id: "u1", patente: "ZK300BD", interno: 1 });
    const u2 = nueva({ id: "u2", patente: "ZK100BD", interno: 2 });
    const u3 = nueva({ id: "u3", patente: "ZK200BD", interno: 3 });
    const e = estadoVacio({
      unidades: [u1, u2, u3],
      documentos: [
        ...docsUnidad("u1", { seguro: en(-1) }),
        ...docsUnidad("u2", { seguro: en(-10) }),
        ...docsUnidad("u3", { matafuego: en(3) }, ["habilitacion-proyecto"]),
      ],
    });
    const textos = calcularAlertas(e, H).alertas.map((a) => `${a.texto} @${a.unidadId}`);
    expect(textos).toEqual([
      "Falta cargar · Habilitación de ingreso al proyecto @u3",
      "Vencido hace 10 días · Seguro @u2",
      "Vencido hace 1 día · Seguro @u1",
      "Vence en 3 días · Carga del matafuego @u3",
    ]);
  });

  it("V16: con el mismo vencimiento desempata la patente", () => {
    const u1 = nueva({ id: "u1", patente: "ZK300BD" });
    const u2 = nueva({ id: "u2", patente: "ZK100BD" });
    const e = estadoVacio({
      unidades: [u1, u2],
      documentos: [...docsUnidad("u1", { seguro: en(5) }), ...docsUnidad("u2", { seguro: en(5) })],
    });
    expect(calcularAlertas(e, H).alertas.map((a) => a.unidadId)).toEqual(["u2", "u1"]);
  });
});

describe("alertas de operación", () => {
  it("A3/N5: novedad crítica abierta -> alerta crítica con ítem, descripción y origen", () => {
    const n = novedad({
      gravedad: "critica",
      origen: { tipo: "parte", parteId: "p1", item: "frenos" },
      descripcion: "ruido al frenar en bajada",
      fecha: "2026-11-16",
    });
    const { alertas } = calcularAlertas(base({ novedades: [n] }), H);
    expect(porTipo(alertas, "novedad-critica")[0]).toMatchObject({
      categoria: "operacion",
      gravedad: "critica",
      texto: "Frenos: ruido al frenar en bajada (parte del 16/11/2026)",
      unidadId: "u1",
    });
  });

  it("novedad abierta normal -> 'abierta hace N días', con singular", () => {
    const hace9 = novedad({ id: "n9", gravedad: "normal", descripcion: "Luz de patente quemada", fecha: en(-9), origen: { tipo: "parte", parteId: "p", item: "otra" } });
    const hace1 = novedad({ id: "n1", gravedad: "normal", descripcion: "Espejo flojo", fecha: en(-1), origen: { tipo: "manual" } });
    const hoy = novedad({ id: "n0", gravedad: "normal", descripcion: "Rayón", fecha: H, origen: { tipo: "manual" } });
    const { alertas } = calcularAlertas(base({ novedades: [hace9, hace1, hoy] }), H);
    const textos = porTipo(alertas, "novedad-abierta").map((a) => a.texto);
    expect(textos).toContain("Luz de patente quemada · abierta hace 9 días");
    expect(textos).toContain("Espejo flojo · abierta hace 1 día");
    expect(textos).toContain("Rayón · abierta hoy");
    expect(porTipo(alertas, "novedad-abierta")[0]?.gravedad).toBe("media");
  });

  it("novedad normal de un ítem del checklist lleva el nombre del ítem", () => {
    const n = novedad({ gravedad: "normal", descripcion: "Falta agua", origen: { tipo: "parte", parteId: "p", item: "niveles" }, fecha: en(-2) });
    const { alertas } = calcularAlertas(base({ novedades: [n] }), H);
    expect(porTipo(alertas, "novedad-abierta")[0]?.texto).toBe("Niveles de aceite y agua: Falta agua · abierta hace 2 días");
  });

  it("N4: una novedad resuelta no alerta", () => {
    const n = novedad({ estado: "resuelta", gravedad: "critica" });
    expect(calcularAlertas(base({ novedades: [n] }), H).alertas).toEqual([]);
  });

  it("N5: críticas primero y, dentro de cada gravedad, la más antigua primero", () => {
    const criticaH2 = novedad({ id: "a", gravedad: "critica", fecha: en(-2), descripcion: "A" });
    const normalH9 = novedad({ id: "b", gravedad: "normal", fecha: en(-9), descripcion: "B" });
    const criticaH5 = novedad({ id: "c", gravedad: "critica", fecha: en(-5), descripcion: "C" });
    const { alertas } = calcularAlertas(base({ novedades: [criticaH2, normalH9, criticaH5] }), H);
    expect(alertas.filter((a) => a.categoria === "operacion").map((a) => a.id)).toEqual(["novedad:c", "novedad:a", "novedad:b"]);
  });

  it("A7: las novedades de una unidad de baja no alertan", () => {
    const u = nueva({ estado: { tipo: "baja", desde: "2026-11-01", motivo: "Venta" } });
    const n = novedad({ gravedad: "critica" });
    expect(calcularAlertas(base({ unidades: [u], documentos: [], novedades: [n] }), H).alertas).toEqual([]);
  });

  it("P9: 'Circuló con documentación vencida' dura 30 días desde la fecha del parte", () => {
    const p = parte({ id: "pd", fecha: "2026-11-12", documentacionVencida: ["seguro"], estado: "enviado" });
    const dia = (hoy: string) => porTipo(calcularAlertas(base({ partes: [p] }), hoy).alertas, "uso-con-documentacion-vencida");
    expect(dia("2026-11-12")).toHaveLength(1);
    expect(dia("2026-12-12")).toHaveLength(1); // fecha + 30
    expect(dia("2026-12-13")).toHaveLength(0); // fecha + 31
    expect(dia("2026-11-12")[0]).toMatchObject({
      gravedad: "critica",
      texto: "Circuló con documentación vencida: Seguro (parte del 12/11/2026)",
    });
  });

  it("P9: dos documentos se nombran los dos", () => {
    const p = parte({ fecha: "2026-11-12", documentacionVencida: ["seguro", "revision-tecnica"] });
    const a = porTipo(calcularAlertas(base({ partes: [p] }), H).alertas, "uso-con-documentacion-vencida")[0];
    expect(a?.texto).toBe("Circuló con documentación vencida: Seguro, Revisión técnica (parte del 12/11/2026)");
  });

  it("P5: borrador de ayer -> 'Parte sin enviar' con quién lo empezó; borrador de hoy no alerta", () => {
    const c = conductor({ id: "c1", nombre: "Luis Ferreyra" });
    const ayer = parte({ id: "b1", estado: "borrador", enviado: null, fecha: en(-1), conductorId: "c1" });
    const hoy = parte({ id: "b2", estado: "borrador", enviado: null, fecha: H, conductorId: "c1", unidadId: "u1" });
    const { alertas } = calcularAlertas(base({ partes: [ayer, hoy], conductores: [c], documentos: [...docsUnidad("u1"), docConductor("c1", "licencia", en(200))] }), H);
    const sinEnviar = porTipo(alertas, "parte-sin-enviar");
    expect(sinEnviar).toHaveLength(1);
    expect(sinEnviar[0]).toMatchObject({
      gravedad: "media",
      texto: "Parte del 17/11/2026 sin enviar (iniciado por L. Ferreyra)",
    });
  });

  it("P5: un borrador sin conductor no dice quién lo empezó", () => {
    const ayer = parte({ estado: "borrador", enviado: null, fecha: en(-1), conductorId: null });
    const a = porTipo(calcularAlertas(base({ partes: [ayer] }), H).alertas, "parte-sin-enviar")[0];
    expect(a?.texto).toBe("Parte del 17/11/2026 sin enviar");
  });

  it("P6: unidad en servicio creada antes de ayer y sin parte de ayer -> 'Sin parte de ayer'", () => {
    const { alertas } = calcularAlertas(base({ unidades: [vieja()] }), H);
    expect(porTipo(alertas, "sin-parte")).toHaveLength(1);
    expect(porTipo(alertas, "sin-parte")[0]).toMatchObject({ gravedad: "media", texto: "Sin parte de ayer (17/11/2026)", unidadId: "u1" });
  });

  it("P6: con borrador de ayer solo vale P5 (no se duplica)", () => {
    const ayer = parte({ estado: "borrador", enviado: null, fecha: en(-1) });
    const { alertas } = calcularAlertas(base({ unidades: [vieja()], partes: [ayer] }), H);
    expect(porTipo(alertas, "sin-parte")).toHaveLength(0);
    expect(porTipo(alertas, "parte-sin-enviar")).toHaveLength(1);
  });

  it("P6: con parte enviado de ayer no hay alerta", () => {
    const ayer = parte({ fecha: en(-1) });
    expect(porTipo(calcularAlertas(base({ unidades: [vieja()], partes: [ayer] }), H).alertas, "sin-parte")).toHaveLength(0);
  });

  it("P6: unidad fuera de servicio o de baja -> nada", () => {
    const taller = vieja({ estado: { tipo: "fuera-de-servicio", desde: en(-5), motivo: "En taller", origen: "manual", novedadIds: [] } });
    expect(porTipo(calcularAlertas(base({ unidades: [taller] }), H).alertas, "sin-parte")).toHaveLength(0);
  });

  it("P6: unidad creada ayer o hoy todavía no debe un parte de ayer", () => {
    const ayer = nueva({ creada: `${en(-1)}T12:00:00.000Z` });
    const hoy = nueva({ creada: `${H}T12:00:00.000Z` });
    expect(porTipo(calcularAlertas(base({ unidades: [ayer] }), H).alertas, "sin-parte")).toHaveLength(0);
    expect(porTipo(calcularAlertas(base({ unidades: [hoy] }), H).alertas, "sin-parte")).toHaveLength(0);
    const anteayer = nueva({ creada: `${en(-2)}T12:00:00.000Z` });
    expect(porTipo(calcularAlertas(base({ unidades: [anteayer] }), H).alertas, "sin-parte")).toHaveLength(1);
  });

  it("P6: 'creada antes de ayer' se mide en hora de Argentina (02:59Z del día siguiente todavía es el mismo día)", () => {
    // creada el 2026-11-17 a las 23:30 hora de Argentina = 2026-11-18T02:30Z -> es 'ayer' en Argentina, no antes de ayer
    const u = nueva({ creada: "2026-11-18T02:30:00.000Z" });
    expect(porTipo(calcularAlertas(base({ unidades: [u] }), H).alertas, "sin-parte")).toHaveLength(0);
  });
});

describe("resumen", () => {
  it("cuenta por grupo, por tipo de operación y las críticas", () => {
    const u2 = vieja({ id: "u2", patente: "ZK200BD", interno: 2 });
    const e = estadoVacio({
      unidades: [vieja(), u2],
      documentos: [
        ...docsUnidad("u1", { seguro: en(-1), "revision-tecnica": en(2), matafuego: en(9), "habilitacion-proyecto": en(20) }),
        ...docsUnidad("u2", {}, ["habilitacion-proyecto"]),
      ],
      novedades: [novedad({ gravedad: "critica", unidadId: "u1" }), novedad({ id: "n2", gravedad: "normal", unidadId: "u2", fecha: en(-3) })],
    });
    const { resumen } = calcularAlertas(e, H);
    expect(resumen.porGrupo).toEqual({ vencidos: 2, "7": 1, "15": 1, "30": 1 });
    expect(resumen.operacion).toEqual({
      "novedad-critica": 1,
      "uso-con-documentacion-vencida": 0,
      "parte-sin-enviar": 0,
      "sin-parte": 2,
      "novedad-abierta": 1,
    });
    expect(resumen.totalOperacion).toBe(4);
    // críticas: seguro vencido + habilitación faltante + novedad crítica
    expect(resumen.criticas).toBe(3);
  });

  it("incluye la aptitud (A8): activas, disponibles y protagonista", () => {
    const e = base({ documentos: docsUnidad("u1", { seguro: en(-1) }) });
    const { resumen } = calcularAlertas(e, H);
    expect(resumen.activas).toBe(1);
    expect(resumen.disponibles).toBe(0);
    expect(resumen.protagonista).toBe(1);
    expect(resumen.noPuedenSalir.map((u: Unidad) => u.id)).toEqual(["u1"]);
    expect(resumen.fueraDeServicio).toEqual([]);
  });

  it("sin nada para avisar todo da cero", () => {
    const e = base({ partes: [parte({ fecha: en(-1) })] });
    const { alertas, resumen, horizonte } = calcularAlertas(e, H);
    expect(alertas).toEqual([]);
    expect(horizonte).toEqual([]);
    expect(resumen.criticas).toBe(0);
    expect(resumen.totalOperacion).toBe(0);
    expect(resumen.porGrupo).toEqual({ vencidos: 0, "7": 0, "15": 0, "30": 0 });
  });
});

describe("horizonte", () => {
  it("un punto por documento que vence en 0 a 30 días, con su día y su grupo", () => {
    const e = base({
      documentos: docsUnidad("u1", { seguro: en(-2), "revision-tecnica": en(0), matafuego: en(15), "habilitacion-proyecto": en(30) }),
    });
    const { horizonte, alertas } = calcularAlertas(e, H);
    expect(horizonte.map((p) => [p.dia, p.grupo])).toEqual([
      [0, "7"],
      [15, "15"],
      [30, "30"],
    ]);
    // cada punto apunta a una alerta existente
    for (const p of horizonte) expect(alertas.some((a) => a.id === p.alertaId)).toBe(true);
  });

  it("los vencidos y faltantes no son puntos (van en la caja del horizonte)", () => {
    const e = base({ documentos: docsUnidad("u1", { seguro: en(-1) }, ["matafuego"]) });
    expect(calcularAlertas(e, H).horizonte).toEqual([]);
  });

  it("ordena por día y, a igual día, por id de alerta", () => {
    const e = base({ documentos: docsUnidad("u1", { seguro: en(5), "revision-tecnica": en(5), matafuego: en(2) }) });
    const { horizonte } = calcularAlertas(e, H);
    expect(horizonte.map((p) => p.dia)).toEqual([2, 5, 5]);
  });
});

describe("nombreCorto", () => {
  it("inicial y apellido", () => {
    expect(nombreCorto("Luis Ferreyra")).toBe("L. Ferreyra");
    expect(nombreCorto("María José Pérez")).toBe("M. Pérez");
    expect(nombreCorto("Rocío")).toBe("Rocío");
    expect(nombreCorto("  ")).toBe("");
  });
});

describe("las unidades de dos proyectos distintos", () => {
  it("cada unidad se mide con lo que exige su proyecto", () => {
    const ub = nueva({ id: "ub", patente: "ZK111BD", proyectoId: PROYECTO_BASE.id });
    const up = nueva({ id: "up", patente: "ZK112BD", proyectoId: PROYECTO_PIEDRA.id });
    const e = estadoVacio({ unidades: [ub, up], documentos: [...docsUnidad("ub", {}, ["habilitacion-proyecto"]), ...docsUnidad("up", {}, ["habilitacion-proyecto"])] });
    const { alertas } = calcularAlertas(e, H);
    const faltantes = porTipo(alertas, "documento-faltante");
    expect(faltantes.map((a) => a.unidadId)).toEqual(["up"]);
  });
});

describe("partes en uso (P5, P6, P17)", () => {
  const luis = conductor({ id: "c1", nombre: "Luis Ferreyra" });
  const estadoCon = (partes: ReturnType<typeof parte>[], extra: Partial<Estado> = {}): Estado =>
    base({ unidades: [vieja()], partes, conductores: [luis], documentos: [...docsUnidad("u1"), docConductor("c1", "licencia", en(200))], ...extra });
  const enUso = (fecha: string, extra: Partial<ReturnType<typeof parte>> = {}) =>
    parte({ id: `uso-${fecha}`, estado: "en-uso", enviado: null, revisado: `${fecha}T09:00:00.000Z`, kmFin: null, combustible: null, fecha, conductorId: "c1", ...extra });

  it("P5: un parte en uso de H - 1 -> alerta «sin cerrar» con quién salió; el borrador sigue diciendo «sin enviar»", () => {
    const { alertas } = calcularAlertas(estadoCon([enUso(en(-1))]), H);
    const a = porTipo(alertas, "parte-sin-enviar");
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ gravedad: "media", texto: "Parte del 17/11/2026 sin cerrar (salió con L. Ferreyra)", etapaParte: "en-uso", unidadId: "u1", conductorId: "c1" });
    const borrador = parte({ id: "b", estado: "borrador", enviado: null, revisado: null, fecha: en(-1), conductorId: "c1" });
    expect(porTipo(calcularAlertas(estadoCon([borrador]), H).alertas, "parte-sin-enviar")[0]).toMatchObject({ etapaParte: "borrador", texto: "Parte del 17/11/2026 sin enviar (iniciado por L. Ferreyra)" });
  });

  it("P5: un parte en uso de hoy no alerta (el cierre llega a la noche)", () => {
    expect(porTipo(calcularAlertas(estadoCon([enUso(H)]), H).alertas, "parte-sin-enviar")).toHaveLength(0);
  });

  it("P5, P15: un parte en uso de hace más de 7 días alerta mientras exista", () => {
    expect(porTipo(calcularAlertas(estadoCon([enUso(en(-10))]), H).alertas, "parte-sin-enviar")).toHaveLength(1);
  });

  it("P5: un parte en uso de una unidad de baja no alerta", () => {
    const baja = vieja({ estado: { tipo: "baja", desde: "2026-11-01", motivo: "Venta" } });
    expect(porTipo(calcularAlertas(estadoCon([enUso(en(-1))], { unidades: [baja] }), H).alertas, "parte-sin-enviar")).toHaveLength(0);
  });

  it("P6: una unidad con parte en uso de ayer no tiene alerta «sin parte» (solo P5)", () => {
    const { alertas } = calcularAlertas(estadoCon([enUso(en(-1))]), H);
    expect(porTipo(alertas, "sin-parte")).toHaveLength(0);
  });

  it("P17: un parte en uso con documentación vencida alerta desde que se envía la revisión", () => {
    const p = enUso(H, { documentacionVencida: ["seguro"] });
    const a = porTipo(calcularAlertas(estadoCon([p]), H).alertas, "uso-con-documentacion-vencida");
    expect(a).toHaveLength(1);
    expect(a[0]?.gravedad).toBe("critica");
  });

  it("P17: un parte sin salida con documentacionVencida (dato viejo) no alerta", () => {
    const p = parte({ id: "ss", fecha: en(-2), sinSalida: true, documentacionVencida: ["seguro"], conductorId: "c1" });
    expect(porTipo(calcularAlertas(estadoCon([p]), H).alertas, "uso-con-documentacion-vencida")).toHaveLength(0);
  });
});

describe("conductores que no pueden manejar hoy (L6, L7)", () => {
  const conLicencia = (id: string, nombre: string, vence: string | null, extra: Partial<Conductor> = {}) => ({
    c: conductor({ id, nombre, ...extra }),
    docs: vence === null ? [] : [docConductor(id, "licencia", vence)],
  });

  it("L6, L7: la licencia vencida de un conductor activo entra en la lista con su motivo y el id de su alerta de vencimiento", () => {
    const a = conLicencia("c1", "Luis Ferreyra", en(-3));
    const { alertas, resumen } = calcularAlertas(base({ conductores: [a.c], documentos: [...docsUnidad("u1"), ...a.docs] }), H);
    expect(resumen.conductoresSinLicencia).toEqual([
      { conductorId: "c1", nombre: "Luis Ferreyra", motivo: { vigente: false, motivo: "vencida", vence: en(-3) }, alertaId: "doc:c1-licencia" },
    ]);
    const alerta = alertas.find((x) => x.id === "doc:c1-licencia");
    expect(alerta).toMatchObject({ gravedad: "critica", texto: "Vencida hace 3 días · Licencia de conducir" });
  });

  it("L6: sin licencia cargada el motivo es faltante y la alerta es la de «Falta cargar»", () => {
    const a = conLicencia("c1", "Luis Ferreyra", null);
    const { resumen } = calcularAlertas(base({ conductores: [a.c] }), H);
    expect(resumen.conductoresSinLicencia).toEqual([{ conductorId: "c1", nombre: "Luis Ferreyra", motivo: { vigente: false, motivo: "faltante" }, alertaId: "falta:conductor:c1:licencia" }]);
  });

  it("L6: una licencia nueva que empieza a valer después es «posterior»; sin alerta de vencimiento el alertaId es null", () => {
    const c = conductor({ id: "c1", nombre: "Luis Ferreyra" });
    const vieja = documento({ id: "v", titular: { tipo: "conductor", id: "c1" }, tipo: "licencia", vence: en(-3), emitido: "2020-01-01" });
    const nueva = documento({ id: "n", titular: { tipo: "conductor", id: "c1" }, tipo: "licencia", vence: en(900), emitido: en(2), reemplazaA: "v" });
    const { resumen } = calcularAlertas(base({ conductores: [c], documentos: [...docsUnidad("u1"), vieja, nueva] }), H);
    expect(resumen.conductoresSinLicencia).toEqual([{ conductorId: "c1", nombre: "Luis Ferreyra", motivo: { vigente: false, motivo: "posterior", desde: en(2) }, alertaId: null }]);
  });

  it("L6: un conductor inactivo con licencia vencida no cuenta, y uno con licencia vigente tampoco", () => {
    const inactivo = conLicencia("c1", "Luis Ferreyra", en(-3), { activo: false });
    const vigente = conLicencia("c2", "Rosa Quiroga", en(40));
    const { resumen } = calcularAlertas(base({ conductores: [inactivo.c, vigente.c], documentos: [...docsUnidad("u1"), ...inactivo.docs, ...vigente.docs] }), H);
    expect(resumen.conductoresSinLicencia).toEqual([]);
  });

  it("L6: ordenados por nombre", () => {
    const z = conLicencia("c1", "Zoe Paz", en(-1));
    const a = conLicencia("c2", "Ana Soto", en(-1));
    const { resumen } = calcularAlertas(base({ conductores: [z.c, a.c], documentos: [...docsUnidad("u1"), ...z.docs, ...a.docs] }), H);
    expect(resumen.conductoresSinLicencia.map((x) => x.nombre)).toEqual(["Ana Soto", "Zoe Paz"]);
  });

  it("L6: no cambia el protagonista ni la aptitud de la unidad asignada (A1 es de la unidad)", () => {
    const a = conLicencia("c1", "Luis Ferreyra", en(-3));
    const e = base({ unidades: [nueva({ conductorId: "c1" })], conductores: [a.c], documentos: [...docsUnidad("u1"), ...a.docs] });
    const { resumen } = calcularAlertas(e, H);
    expect(resumen.protagonista).toBe(0);
    expect(resumen.disponibles).toBe(1);
    expect(resumen.conductoresSinLicencia).toHaveLength(1);
  });
});
