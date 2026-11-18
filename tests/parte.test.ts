import { describe, expect, it } from "vitest";
import {
  ITEMS_CHECKLIST,
  advertenciasDeEnvio,
  conductorParaParte,
  documentacionVencidaEn,
  enviadoFueraDeTermino,
  esBorradorVacio,
  faltantesParaEnviar,
  novedadesDelParte,
  nuevoBorrador,
  parsearLitros,
  validarFechaParte,
} from "../src/lib/dominio/parte.ts";
import { textoFaltantes } from "../src/lib/dominio/textos.ts";
import type { Parte, RespuestaItem } from "../src/lib/dominio/tipos.ts";
import { PROYECTO_BASE, PROYECTO_PIEDRA, checklistEnOrden, checklistVacio, conductor, documento, parte, unidad } from "./ayuda.ts";

const H = "2026-11-18";

function completo(extra: Partial<Parte> = {}): Parte {
  return parte({ estado: "borrador", enviado: null, checklist: checklistEnOrden(), ...extra });
}

function con(checklist: Parte["checklist"], cambios: Partial<Parte["checklist"]>): Parte["checklist"] {
  return { ...checklist, ...cambios };
}

describe("ITEMS_CHECKLIST (5.2)", () => {
  it("tiene los diez ítems en orden, cinco críticos", () => {
    expect(ITEMS_CHECKLIST.map((i) => i.id)).toEqual([
      "frenos",
      "direccion",
      "neumaticos",
      "luces",
      "cinturones",
      "niveles",
      "matafuego",
      "botiquin",
      "documentacion",
      "cabina",
    ]);
    expect(ITEMS_CHECKLIST.filter((i) => i.critico).map((i) => i.id)).toEqual([
      "frenos",
      "direccion",
      "neumaticos",
      "luces",
      "cinturones",
    ]);
    expect(ITEMS_CHECKLIST[0]?.texto).toBe("Frenos");
    expect(ITEMS_CHECKLIST[2]?.texto).toBe("Neumáticos y rueda de auxilio");
  });
});

describe("P2: fecha del parte", () => {
  it("P2: hoy y hoy - 7 son válidos", () => {
    expect(validarFechaParte("2026-11-18", H)).toEqual({ ok: true, valor: "2026-11-18" });
    expect(validarFechaParte("2026-11-11", H)).toEqual({ ok: true, valor: "2026-11-11" });
  });

  it("P2: hoy - 8 -> 'Solo se pueden cargar partes de los últimos 7 días.'", () => {
    const r = validarFechaParte("2026-11-10", H);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toBe("Solo se pueden cargar partes de los últimos 7 días.");
  });

  it("P2: mañana -> 'La fecha no puede ser posterior a hoy.'", () => {
    const r = validarFechaParte("2026-11-19", H);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toBe("La fecha no puede ser posterior a hoy.");
  });

  it("P2: una fecha que no existe es error", () => {
    expect(validarFechaParte("2026-02-30", H).ok).toBe(false);
    expect(validarFechaParte("", H).ok).toBe(false);
  });
});

describe("P10: litros cargados", () => {
  it("P10: vacío significa que no cargó (null)", () => {
    expect(parsearLitros("")).toEqual({ ok: true, valor: null });
    expect(parsearLitros("   ")).toEqual({ ok: true, valor: null });
  });

  it("P10: 45,5 y 45.5 valen 45.5; 200 es el máximo", () => {
    expect(parsearLitros("45,5")).toEqual({ ok: true, valor: 45.5 });
    expect(parsearLitros("45.5")).toEqual({ ok: true, valor: 45.5 });
    expect(parsearLitros("200")).toEqual({ ok: true, valor: 200 });
    expect(parsearLitros("0,1")).toEqual({ ok: true, valor: 0.1 });
  });

  it("P10: 0 -> 'Si no cargó combustible, deje el campo vacío.'", () => {
    for (const t of ["0", "0,0", "0.0"]) {
      const r = parsearLitros(t);
      expect(r.ok, t).toBe(false);
      if (!r.ok) expect(r.error.mensaje).toBe("Si no cargó combustible, deje el campo vacío.");
    }
  });

  it("P10: 250 y 200,1 superan el máximo", () => {
    for (const t of ["250", "200,1"]) {
      const r = parsearLitros(t);
      expect(r.ok, t).toBe(false);
      if (!r.ok) expect(r.error.mensaje).toBe("Los litros no pueden superar 200.");
    }
  });

  it("P10: 12,25 tiene demasiados decimales", () => {
    const r = parsearLitros("12,25");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toBe("Escriba los litros con un solo decimal, por ejemplo 45,5.");
  });

  it("P10: letras, negativos y basura no son litros", () => {
    for (const t of ["abc", "-5", "1e2", "4 5", "5,", ",5", "1.000", "٣"]) {
      expect(parsearLitros(t).ok, t).toBe(false);
    }
  });
});

describe("P4: lo que falta para enviar, en el orden del formulario", () => {
  it("P4: falta kmFin, combustible y el ítem luces -> ['kmFin', 'luces', 'combustible']", () => {
    const p = completo({
      kmFin: null,
      combustible: null,
      checklist: con(checklistEnOrden(), { luces: { estado: "sin-responder" } }),
    });
    expect(faltantesParaEnviar(p)).toEqual(["kmFin", "luces", "combustible"]);
    expect(textoFaltantes(3)).toBe("Faltan 3 datos");
    expect(textoFaltantes(1)).toBe("Falta 1 dato");
  });

  it("P4: un parte completo no tiene faltantes", () => {
    expect(faltantesParaEnviar(completo())).toEqual([]);
  });

  it("P4: un borrador recién empezado falta de todo, en orden", () => {
    const p = completo({ conductorId: null, kmInicio: null, kmFin: null, combustible: null, checklist: checklistVacio() });
    expect(faltantesParaEnviar(p)).toEqual([
      "conductor",
      "kmInicio",
      "kmFin",
      ...ITEMS_CHECKLIST.map((i) => i.id),
      "combustible",
    ]);
  });

  it("P4: un ítem 'con novedad' necesita descripción de 3 a 500 caracteres (sin contar espacios de los extremos)", () => {
    const conDesc = (descripcion: string): Parte["checklist"] =>
      con(checklistEnOrden(), { frenos: { estado: "con-novedad", descripcion, impideUso: false } });
    expect(faltantesParaEnviar(completo({ checklist: conDesc("") }))).toEqual(["frenos"]);
    expect(faltantesParaEnviar(completo({ checklist: conDesc("  ab  ") }))).toEqual(["frenos"]);
    expect(faltantesParaEnviar(completo({ checklist: conDesc("abc") }))).toEqual([]);
    expect(faltantesParaEnviar(completo({ checklist: conDesc(`  ${"x".repeat(500)}  `) }))).toEqual([]);
    expect(faltantesParaEnviar(completo({ checklist: conDesc("x".repeat(501)) }))).toEqual(["frenos"]);
  });

  it("P4: 'Otra novedad' marcada sin descripción válida falta; sin marcar no cuenta", () => {
    expect(faltantesParaEnviar(completo({ otraNovedad: { descripcion: "", impideUso: false } }))).toEqual(["otraNovedad"]);
    expect(faltantesParaEnviar(completo({ otraNovedad: { descripcion: "Vidrio rayado", impideUso: false } }))).toEqual([]);
    expect(faltantesParaEnviar(completo({ otraNovedad: null }))).toEqual([]);
  });

  it("P4: 'Otra novedad' va al final del orden", () => {
    const p = completo({ combustible: null, otraNovedad: { descripcion: "", impideUso: false } });
    expect(faltantesParaEnviar(p)).toEqual(["combustible", "otraNovedad"]);
  });
});

describe("P11: novedades que genera un parte", () => {
  it("P11: ítem crítico con novedad -> novedad crítica", () => {
    const p = completo({ checklist: con(checklistEnOrden(), { frenos: { estado: "con-novedad", descripcion: " ruido al frenar ", impideUso: false } }) });
    expect(novedadesDelParte(p)).toEqual([{ item: "frenos", descripcion: "ruido al frenar", gravedad: "critica" }]);
  });

  it("P11: ítem no crítico sin marcar 'impide' -> normal", () => {
    const p = completo({ checklist: con(checklistEnOrden(), { niveles: { estado: "con-novedad", descripcion: "Falta agua", impideUso: false } }) });
    expect(novedadesDelParte(p)).toEqual([{ item: "niveles", descripcion: "Falta agua", gravedad: "normal" }]);
  });

  it("P11: ítem no crítico con 'Impide usar la unidad' -> crítica", () => {
    const p = completo({ checklist: con(checklistEnOrden(), { niveles: { estado: "con-novedad", descripcion: "Pierde aceite", impideUso: true } }) });
    expect(novedadesDelParte(p)[0]?.gravedad).toBe("critica");
  });

  it("P11: 'Otra novedad' sigue la misma regla", () => {
    const a = completo({ otraNovedad: { descripcion: "Vidrio rayado", impideUso: false } });
    expect(novedadesDelParte(a)).toEqual([{ item: "otra", descripcion: "Vidrio rayado", gravedad: "normal" }]);
    const b = completo({ otraNovedad: { descripcion: "Vidrio roto", impideUso: true } });
    expect(novedadesDelParte(b)[0]?.gravedad).toBe("critica");
  });

  it("P11: sin novedades no devuelve nada, y respeta el orden del formulario", () => {
    expect(novedadesDelParte(completo())).toEqual([]);
    const p = completo({
      checklist: con(checklistEnOrden(), {
        cabina: { estado: "con-novedad", descripcion: "Sucia", impideUso: false } satisfies RespuestaItem,
        frenos: { estado: "con-novedad", descripcion: "Pedal blando", impideUso: false } satisfies RespuestaItem,
      }),
      otraNovedad: { descripcion: "Vidrio rayado", impideUso: false },
    });
    expect(novedadesDelParte(p).map((n) => n.item)).toEqual(["frenos", "cabina", "otra"]);
  });
});

describe("P9: documentación vencida a la fecha del parte", () => {
  const U = unidad({ id: "u1", proyectoId: PROYECTO_PIEDRA.id });
  const C = conductor({ id: "c1" });
  const vigentes = [
    documento({ tipo: "seguro", vence: "2027-01-01" }),
    documento({ tipo: "revision-tecnica", vence: "2027-01-01" }),
    documento({ tipo: "matafuego", vence: "2027-01-01" }),
    documento({ tipo: "habilitacion-proyecto", vence: "2027-01-01" }),
    documento({ titular: { tipo: "conductor", id: "c1" }, tipo: "licencia", vence: "2027-01-01" }),
  ];
  const sin = (tipo: string) => vigentes.filter((d) => d.tipo !== tipo);
  const cambiar = (tipo: string, vence: string) => vigentes.map((d) => (d.tipo === tipo ? { ...d, vence } : d));

  it("P9: todo vigente -> nada", () => {
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: vigentes })).toEqual([]);
  });

  it("P9: seguro vencido hace 3 días -> ['seguro']", () => {
    const docs = cambiar("seguro", "2026-11-15");
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: docs })).toEqual(["seguro"]);
  });

  it("P9: el documento que vence ese mismo día todavía vale (C01)", () => {
    const docs = cambiar("seguro", H);
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: docs })).toEqual([]);
  });

  it("P9: un obligatorio faltante cuenta (habilitación del proyecto)", () => {
    expect(
      documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: sin("habilitacion-proyecto") }),
    ).toEqual(["habilitacion-proyecto"]);
  });

  it("P9 + V13: en la base no se exige la habilitación", () => {
    expect(
      documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_BASE, conductor: C, documentos: sin("habilitacion-proyecto") }),
    ).toEqual([]);
  });

  it("P9: licencia del conductor vencida o faltante cuenta", () => {
    const vencida = cambiar("licencia", "2026-11-01");
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: vencida })).toEqual(["licencia"]);
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: sin("licencia") })).toEqual(["licencia"]);
  });

  it("P9: sin conductor (borrador) no se evalúa la licencia, y el orden es el de REQUISITOS", () => {
    const docs = cambiar("matafuego", "2026-01-01").map((d) => (d.tipo === "seguro" ? { ...d, vence: "2026-01-01" } : d));
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: null, documentos: docs })).toEqual(["seguro", "matafuego"]);
  });

  it("P9/B2: la licencia que vence el mismo día del parte todavía vale; un día antes ya no", () => {
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: cambiar("licencia", H) })).toEqual([]);
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: cambiar("licencia", "2026-11-17") })).toEqual(["licencia"]);
  });

  describe("M1: con el documento como estaba en la fecha del parte (una renovación tardía no borra el hecho)", () => {
    const F = "2026-11-15"; // el parte es de hace 3 días
    const seguroViejo = documento({ id: "seguro-viejo", tipo: "seguro", vence: "2026-11-13", emitido: "2025-11-13", cargado: "2025-11-10T12:00:00.000Z" });
    const resto = vigentes.filter((d) => d.tipo !== "seguro");
    const evaluar = (renovacion: ReturnType<typeof documento> | null, fecha = F) =>
      documentacionVencidaEn({
        fecha,
        unidad: U,
        proyecto: PROYECTO_PIEDRA,
        conductor: C,
        documentos: [...resto, seguroViejo, ...(renovacion === null ? [] : [renovacion])],
      });
    const renovacion = (parcial: Partial<ReturnType<typeof documento>>) =>
      documento({ id: "seguro-nuevo", tipo: "seguro", vence: "2027-11-13", reemplazaA: "seguro-viejo", ...parcial });

    it("sin renovación: el seguro venció hace 2 días en la fecha del parte", () => {
      expect(evaluar(null)).toEqual(["seguro"]);
    });

    it("renovación cargada hoy, sin fecha de emisión: no cubre un parte de hace 3 días", () => {
      expect(evaluar(renovacion({ cargado: "2026-11-18T12:00:00.000Z", emitido: null }))).toEqual(["seguro"]);
    });

    it("renovación emitida después de la fecha del parte: no la cubre", () => {
      expect(evaluar(renovacion({ cargado: "2026-11-18T12:00:00.000Z", emitido: "2026-11-17" }))).toEqual(["seguro"]);
    });

    it("renovación emitida antes de la fecha del parte (cargada tarde): sí la cubre, porque el vehículo ya tenía seguro", () => {
      expect(evaluar(renovacion({ cargado: "2026-11-18T12:00:00.000Z", emitido: "2026-11-14" }))).toEqual([]);
      expect(evaluar(renovacion({ cargado: "2026-11-18T12:00:00.000Z", emitido: F }))).toEqual([]); // el mismo día cubre
    });

    it("renovación cargada antes de la fecha del parte, sin emisión: la cubre", () => {
      expect(evaluar(renovacion({ cargado: "2026-11-14T12:00:00.000Z", emitido: null }))).toEqual([]);
      // 15:00 de Argentina del mismo día (18:00Z): el mismo día civil cubre
      expect(evaluar(renovacion({ cargado: "2026-11-15T18:00:00.000Z", emitido: null }))).toEqual([]);
      // 00:30 de Argentina del día siguiente (03:30Z): ya es otro día civil
      expect(evaluar(renovacion({ cargado: "2026-11-16T03:30:00.000Z", emitido: null }))).toEqual(["seguro"]);
    });

    it("un documento anterior que cubría la fecha sigue cubriéndola aunque exista una renovación posterior", () => {
      // el viejo vence el 20; el parte es del 15; la renovación (cargada hoy) no lo pisa
      const viejo = documento({ id: "seguro-viejo", tipo: "seguro", vence: "2026-11-20", emitido: "2025-11-20", cargado: "2025-11-10T12:00:00.000Z" });
      const nuevo = renovacion({ cargado: "2026-11-18T12:00:00.000Z", emitido: "2026-11-18" });
      const docs = [...resto, viejo, nuevo];
      expect(documentacionVencidaEn({ fecha: F, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: docs })).toEqual([]);
    });

    it("la licencia usa la misma regla", () => {
      const licenciaVieja = documento({ id: "lic-vieja", titular: { tipo: "conductor", id: "c1" }, tipo: "licencia", vence: "2026-11-10", emitido: null, cargado: "2025-01-01T12:00:00.000Z" });
      const licenciaNueva = documento({ id: "lic-nueva", titular: { tipo: "conductor", id: "c1" }, tipo: "licencia", vence: "2031-11-10", emitido: null, cargado: "2026-11-18T12:00:00.000Z", reemplazaA: "lic-vieja" });
      const docs = [...vigentes.filter((d) => d.tipo !== "licencia"), licenciaVieja, licenciaNueva];
      expect(documentacionVencidaEn({ fecha: F, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: docs })).toEqual(["licencia"]);
      expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: docs })).toEqual([]);
    });
  });

  it("P9: se evalúa a la fecha del parte, no a hoy (parte de ayer con seguro que venció ayer)", () => {
    const docs = cambiar("seguro", "2026-11-17");
    expect(documentacionVencidaEn({ fecha: "2026-11-17", unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: docs })).toEqual([]);
    expect(documentacionVencidaEn({ fecha: "2026-11-18", unidad: U, proyecto: PROYECTO_PIEDRA, conductor: C, documentos: docs })).toEqual(["seguro"]);
  });
});

describe("advertencias de envío (K6, K7, P9)", () => {
  it("junta las de kilometraje y la de documentación, en ese orden", () => {
    const a = advertenciasDeEnvio({ kmAnterior: 0, kmInicio: 1250, kmFin: 2600, documentacionVencida: ["seguro"] });
    expect(a).toEqual([
      { tipo: "salto-km", km: 1250 },
      { tipo: "recorrido-largo", km: 1350 },
      { tipo: "documentacion-vencida", documentos: ["seguro"] },
    ]);
  });

  it("sin nada para avisar no devuelve nada", () => {
    expect(advertenciasDeEnvio({ kmAnterior: 100, kmInicio: 100, kmFin: 200, documentacionVencida: [] })).toEqual([]);
  });
});

describe("P13: borrador nuevo", () => {
  it("P13: kmInicio sale del kilometraje actual y el conductor del perfil o del asignado", () => {
    const u = unidad({ id: "u1", conductorId: "c-asignado" });
    const p = nuevoBorrador({ id: "pt-nuevo", unidad: u, fecha: H, kmActual: 84320, conductorId: "c-asignado", ahora: "2026-11-18T12:00:00.000Z", autor: "Luis Ferreyra" });
    expect(p.kmInicio).toBe(84320);
    expect(p.conductorId).toBe("c-asignado");
    expect(p.estado).toBe("borrador");
    expect(p.kmFin).toBeNull();
    expect(p.combustible).toBeNull();
    expect(p.enviado).toBeNull();
    expect(p.creado).toBe("2026-11-18T12:00:00.000Z");
    expect(Object.values(p.checklist).every((r) => r.estado === "sin-responder")).toBe(true);
    expect(Object.keys(p.checklist)).toHaveLength(10);
  });

  it("P13: sin registros de kilometraje, kmInicio queda vacío", () => {
    const p = nuevoBorrador({ id: "x", unidad: unidad(), fecha: H, kmActual: null, conductorId: null, ahora: "2026-11-18T12:00:00.000Z", autor: "" });
    expect(p.kmInicio).toBeNull();
    expect(p.conductorId).toBeNull();
  });

  it("P13: perfil conductor manda sobre el asignado; el encargado usa el asignado", () => {
    const u = unidad({ conductorId: "c-asignado" });
    expect(conductorParaParte({ tipo: "conductor", conductorId: "c-otro" }, u)).toBe("c-otro");
    expect(conductorParaParte({ tipo: "encargado" }, u)).toBe("c-asignado");
    expect(conductorParaParte({ tipo: "encargado" }, unidad({ conductorId: null }))).toBeNull();
  });
});

describe("P5: enviado fuera de término", () => {
  it("P5: enviado el mismo día (hora de Argentina) no es fuera de término", () => {
    expect(enviadoFueraDeTermino(parte({ fecha: "2026-11-17", enviado: "2026-11-18T02:59:00.000Z" }))).toBe(false);
  });

  it("P5: enviado al día siguiente sí lo es (a partir de las 00:00 de Argentina)", () => {
    expect(enviadoFueraDeTermino(parte({ fecha: "2026-11-17", enviado: "2026-11-18T03:00:00.000Z" }))).toBe(true);
  });

  it("P5: un borrador no está fuera de término", () => {
    expect(enviadoFueraDeTermino(parte({ estado: "borrador", enviado: null }))).toBe(false);
  });
});

describe("D11: borrador vacío", () => {
  const vacio = (): Parte => parte({ estado: "borrador", enviado: null, kmInicio: 84320, kmFin: null, combustible: null, litrosCargados: null, checklist: checklistVacio(), otraNovedad: null });

  it("D11: con solo el kilometraje inicial que puso el sistema (P13) está vacío", () => {
    expect(esBorradorVacio(vacio(), 84320)).toBe(true);
    expect(esBorradorVacio({ ...vacio(), kmInicio: null }, null)).toBe(true);
  });

  it("D11: si la persona cambió el kilometraje inicial ya no está vacío", () => {
    expect(esBorradorVacio({ ...vacio(), kmInicio: 84500 }, 84320)).toBe(false);
  });

  it("D11: cualquier otro dato lo vuelve no vacío", () => {
    expect(esBorradorVacio({ ...vacio(), kmFin: 84400 }, 84320)).toBe(false);
    expect(esBorradorVacio({ ...vacio(), combustible: "lleno" }, 84320)).toBe(false);
    expect(esBorradorVacio({ ...vacio(), litrosCargados: 10 }, 84320)).toBe(false);
    expect(esBorradorVacio({ ...vacio(), otraNovedad: { descripcion: "", impideUso: false } }, 84320)).toBe(false);
    expect(esBorradorVacio({ ...vacio(), checklist: { ...checklistVacio(), cabina: { estado: "en-orden" } } }, 84320)).toBe(false);
  });
});
