import { describe, expect, it } from "vitest";
import {
  ITEMS_CHECKLIST,
  advertenciasDeCierre,
  advertenciasDeRevision,
  conductorParaParte,
  documentacionVencidaEn,
  esBorradorVacio,
  faltantesDeCierre,
  faltantesDeRevision,
  novedadesDelParte,
  nuevoBorrador,
  parsearLitros,
  parteLegible,
  validarFechaParte,
} from "../src/lib/dominio/parte.ts";
import { textoFaltantes } from "../src/lib/dominio/textos.ts";
import type { Documento, Parte, RespuestaItem } from "../src/lib/dominio/tipos.ts";
import { PROYECTO_BASE, PROYECTO_PIEDRA, checklistEnOrden, checklistVacio, documento, parte, unidad } from "./ayuda.ts";

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

  it("QA B9: 1.000 y 1,000 (mil con separador de miles) dicen que superan el máximo, no «un solo decimal»; 0,500 y 12,25 sí hablan de decimales", () => {
    for (const t of ["1.000", "1,000", "12.500", "199,999"]) {
      const r = parsearLitros(t);
      expect(r.ok, t).toBe(false);
      if (!r.ok) expect(r.error.mensaje, t).toBe("Los litros no pueden superar 200.");
    }
    for (const t of ["0,500", "0.125", "12,25", "45,55"]) {
      const r = parsearLitros(t);
      expect(r.ok, t).toBe(false);
      if (!r.ok) expect(r.error.mensaje, t).toBe("Escriba los litros con un solo decimal, por ejemplo 45,5.");
    }
  });

  it("P10: letras, negativos y basura no son litros", () => {
    for (const t of ["abc", "-5", "1e2", "4 5", "5,", ",5", "1.000", "٣"]) {
      expect(parsearLitros(t).ok, t).toBe(false);
    }
  });
});

describe("P4: lo que falta para enviar la revisión, en el orden del formulario", () => {
  it("P4: a la revisión le faltan kmInicio y el ítem luces -> ['kmInicio', 'luces'] (no pide kmFin ni combustible)", () => {
    const p = completo({
      kmInicio: null,
      kmFin: null,
      combustible: null,
      checklist: con(checklistEnOrden(), { luces: { estado: "sin-responder" } }),
    });
    expect(faltantesDeRevision(p)).toEqual(["kmInicio", "luces"]);
    expect(textoFaltantes(2)).toBe("Faltan 2 datos");
    expect(textoFaltantes(1)).toBe("Falta 1 dato");
  });

  it("P4: una revisión completa no tiene faltantes, aunque no haya datos de cierre", () => {
    expect(faltantesDeRevision(completo({ kmFin: null, combustible: null }))).toEqual([]);
  });

  it("P4: un borrador recién empezado falta de todo, en orden", () => {
    const p = completo({ conductorId: null, kmInicio: null, checklist: checklistVacio() });
    expect(faltantesDeRevision(p)).toEqual(["conductor", "kmInicio", ...ITEMS_CHECKLIST.map((i) => i.id)]);
  });

  it("P4: un ítem 'con novedad' necesita descripción de 3 a 500 caracteres (sin contar espacios de los extremos)", () => {
    const conDesc = (descripcion: string): Parte["checklist"] =>
      con(checklistEnOrden(), { frenos: { estado: "con-novedad", descripcion, impideUso: false } });
    expect(faltantesDeRevision(completo({ checklist: conDesc("") }))).toEqual(["frenos"]);
    expect(faltantesDeRevision(completo({ checklist: conDesc("  ab  ") }))).toEqual(["frenos"]);
    expect(faltantesDeRevision(completo({ checklist: conDesc("abc") }))).toEqual([]);
    expect(faltantesDeRevision(completo({ checklist: conDesc(`  ${"x".repeat(500)}  `) }))).toEqual([]);
    expect(faltantesDeRevision(completo({ checklist: conDesc("x".repeat(501)) }))).toEqual(["frenos"]);
  });

  it("P4: 'Otra novedad' marcada sin descripción válida falta; sin marcar no cuenta", () => {
    expect(faltantesDeRevision(completo({ otraNovedad: { descripcion: "", impideUso: false } }))).toEqual(["otraNovedad"]);
    expect(faltantesDeRevision(completo({ otraNovedad: { descripcion: "Vidrio rayado", impideUso: false } }))).toEqual([]);
    expect(faltantesDeRevision(completo({ otraNovedad: null }))).toEqual([]);
  });

  it("P4: 'Otra novedad' va al final del orden", () => {
    const p = completo({ kmInicio: null, otraNovedad: { descripcion: "", impideUso: false } });
    expect(faltantesDeRevision(p)).toEqual(["kmInicio", "otraNovedad"]);
  });
});

describe("P4: lo que falta para cerrar el parte", () => {
  it("P4: un cierre sin nada -> ['kmFin', 'combustible']", () => {
    expect(faltantesDeCierre(completo({ kmFin: null, combustible: null }))).toEqual(["kmFin", "combustible"]);
  });

  it("P4: con el fin y el combustible no falta nada (los litros son opcionales y la revisión no se vuelve a mirar)", () => {
    expect(faltantesDeCierre(completo({ kmFin: 1100, combustible: "medio", litrosCargados: null, checklist: checklistVacio(), kmInicio: null }))).toEqual([]);
  });

  it("P4: un solo faltante", () => {
    expect(faltantesDeCierre(completo({ kmFin: 1100, combustible: null }))).toEqual(["combustible"]);
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

describe("P9: documentación de la unidad vencida a la fecha del parte", () => {
  const U = unidad({ id: "u1", proyectoId: PROYECTO_PIEDRA.id });
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
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, documentos: vigentes })).toEqual([]);
  });

  it("P9: seguro vencido hace 3 días -> ['seguro']", () => {
    const docs = cambiar("seguro", "2026-11-15");
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, documentos: docs })).toEqual(["seguro"]);
  });

  it("P9: el documento que vence ese mismo día todavía vale (C01)", () => {
    const docs = cambiar("seguro", H);
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, documentos: docs })).toEqual([]);
  });

  it("P9: un obligatorio faltante cuenta (habilitación del proyecto)", () => {
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, documentos: sin("habilitacion-proyecto") })).toEqual(["habilitacion-proyecto"]);
  });

  it("P9 + V13: en la base no se exige la habilitación", () => {
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_BASE, documentos: sin("habilitacion-proyecto") })).toEqual([]);
  });

  it("P9, L1: nunca devuelve 'licencia': la licencia del conductor bloquea la revisión y no entra acá (vencida o faltante)", () => {
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, documentos: cambiar("licencia", "2026-11-01") })).toEqual([]);
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, documentos: sin("licencia") })).toEqual([]);
    const todo = vigentes.map((d) => ({ ...d, vence: "2026-01-01" }));
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, documentos: todo })).not.toContain("licencia");
  });

  it("P9: el orden es el de REQUISITOS", () => {
    const docs = cambiar("matafuego", "2026-01-01").map((d) => (d.tipo === "seguro" ? { ...d, vence: "2026-01-01" } : d));
    expect(documentacionVencidaEn({ fecha: H, unidad: U, proyecto: PROYECTO_PIEDRA, documentos: docs })).toEqual(["seguro", "matafuego"]);
  });

  it("P9: se evalúa a la fecha del parte, no a hoy (parte de ayer con seguro que venció ayer)", () => {
    const docs = cambiar("seguro", "2026-11-17");
    expect(documentacionVencidaEn({ fecha: "2026-11-17", unidad: U, proyecto: PROYECTO_PIEDRA, documentos: docs })).toEqual([]);
    expect(documentacionVencidaEn({ fecha: "2026-11-18", unidad: U, proyecto: PROYECTO_PIEDRA, documentos: docs })).toEqual(["seguro"]);
  });

  describe("M1: con el documento como estaba en la fecha del parte (una renovación tardía no borra el hecho)", () => {
    const seguroVencido = (parcial: Partial<Documento>): Documento[] => [
      documento({ id: "s-viejo", tipo: "seguro", vence: "2026-11-15", emitido: "2025-11-15" }),
      ...vigentes.filter((d) => d.tipo !== "seguro"),
      documento({ id: "s-nuevo", tipo: "seguro", vence: "2027-11-15", reemplazaA: "s-viejo", ...parcial }),
    ];
    const en = (fecha: string, docs: Documento[]) => documentacionVencidaEn({ fecha, unidad: U, proyecto: PROYECTO_PIEDRA, documentos: docs });

    it("sin renovación: el seguro venció hace 2 días en la fecha del parte", () => {
      const docs = [documento({ tipo: "seguro", vence: "2026-11-16", emitido: "2025-11-16" }), ...vigentes.filter((d) => d.tipo !== "seguro")];
      expect(en(H, docs)).toEqual(["seguro"]);
    });

    it("renovación cargada hoy, sin fecha de emisión: no cubre un parte de hace 3 días", () => {
      expect(en("2026-11-15", seguroVencido({ emitido: null, cargado: "2026-11-18T15:00:00.000Z" }))).toEqual([]);
      expect(en("2026-11-16", seguroVencido({ emitido: null, cargado: "2026-11-18T15:00:00.000Z" }))).toEqual(["seguro"]);
    });

    it("renovación emitida después de la fecha del parte: no la cubre", () => {
      expect(en("2026-11-16", seguroVencido({ emitido: "2026-11-17" }))).toEqual(["seguro"]);
    });

    it("renovación emitida antes de la fecha del parte (cargada tarde): sí la cubre, porque el vehículo ya tenía seguro", () => {
      expect(en("2026-11-16", seguroVencido({ emitido: "2026-11-15", cargado: "2026-11-18T15:00:00.000Z" }))).toEqual([]);
    });

    it("un documento anterior que cubría la fecha sigue cubriéndola aunque exista una renovación posterior", () => {
      expect(en("2026-11-14", seguroVencido({ emitido: "2026-11-17" }))).toEqual([]);
    });
  });
});

describe("advertencias de la revisión (K6, P9) y del cierre (K7)", () => {
  it("la revisión junta la de kilometraje y la de documentación, en ese orden", () => {
    const a = advertenciasDeRevision({ kmAnterior: 0, kmInicio: 1250, documentacionVencida: ["seguro"] });
    expect(a).toEqual([{ tipo: "salto-km", km: 1250 }, { tipo: "documentacion-vencida", documentos: ["seguro"] }]);
  });

  it("la revisión sin nada para avisar no devuelve nada", () => {
    expect(advertenciasDeRevision({ kmAnterior: 100, kmInicio: 100, documentacionVencida: [] })).toEqual([]);
  });

  it("el cierre avisa solo del recorrido largo (K7)", () => {
    expect(advertenciasDeCierre({ kmInicio: 0, kmFin: 1201 })).toEqual([{ tipo: "recorrido-largo", km: 1201 }]);
    expect(advertenciasDeCierre({ kmInicio: 0, kmFin: 1200 })).toEqual([]);
  });
});

describe("P13: borrador nuevo", () => {
  it("P13: kmInicio sale del kilometraje actual y el conductor del perfil o del asignado", () => {
    const u = unidad({ id: "u1", conductorId: "c-asignado" });
    const p = nuevoBorrador({ id: "pt-nuevo", unidad: u, fecha: H, kmActual: 84320, conductorId: "c-asignado", ahora: "2026-11-18T12:00:00.000Z", autor: "Luis Ferreyra" });
    expect(p.kmInicio).toBe(84320);
    expect(p.conductorId).toBe("c-asignado");
    expect(p.estado).toBe("borrador");
    expect(p.revisado).toBeNull();
    expect(p.sinSalida).toBe(false);
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
});

describe("P13, L1: conductorParaParte", () => {
  const U = unidad({ id: "u1", conductorId: "c-asignado" });
  const licencia = (id: string, vence: string): Documento => documento({ titular: { tipo: "conductor", id }, tipo: "licencia", vence, emitido: "2020-01-01" });

  it("perfil Conductor: siempre el del perfil, tenga o no licencia (el bloqueo se muestra aparte)", () => {
    expect(conductorParaParte({ tipo: "conductor", conductorId: "c-otro" }, U, [], H)).toBe("c-otro");
    expect(conductorParaParte({ tipo: "conductor", conductorId: "c-otro" }, U, [licencia("c-otro", "2026-11-01")], H)).toBe("c-otro");
  });

  it("perfil Encargado: el asignado solo si su licencia ampara la fecha", () => {
    expect(conductorParaParte({ tipo: "encargado" }, U, [licencia("c-asignado", "2027-01-01")], H)).toBe("c-asignado");
    expect(conductorParaParte({ tipo: "encargado" }, U, [licencia("c-asignado", H)], H)).toBe("c-asignado");
  });

  it("perfil Encargado: el asignado con licencia vencida (o sin ninguna) no se precarga", () => {
    expect(conductorParaParte({ tipo: "encargado" }, U, [licencia("c-asignado", "2026-11-17")], H)).toBeNull();
    expect(conductorParaParte({ tipo: "encargado" }, U, [], H)).toBeNull();
  });

  it("perfil Encargado: sin conductor asignado -> null", () => {
    expect(conductorParaParte({ tipo: "encargado" }, unidad({ conductorId: null }), [], H)).toBeNull();
  });
});

describe("parteLegible: los estados nuevos (P7, P16)", () => {
  const crudo = (extra: Record<string, unknown> = {}): unknown => ({ ...parte({ estado: "en-uso", enviado: null }), ...extra });

  it("un parte en uso se lee, con su revisado y sinSalida en false", () => {
    const p = parteLegible(crudo({ revisado: "2026-11-18T09:10:00.000Z" }));
    expect(p).toMatchObject({ estado: "en-uso", revisado: "2026-11-18T09:10:00.000Z", sinSalida: false });
  });

  it("un estado desconocido no es un parte", () => {
    expect(parteLegible(crudo({ estado: "revisado" }))).toBeNull();
    expect(parteLegible(crudo({ estado: "pendiente" }))).toBeNull();
  });

  it("un revisado ilegible queda null, y el parte en uso se sigue leyendo como en uso (no se inventa la hora)", () => {
    for (const malo of ["ayer", 12, null, undefined, ""]) {
      const p = parteLegible(crudo({ revisado: malo }));
      expect(p?.estado).toBe("en-uso");
      expect(p?.revisado).toBeNull();
    }
  });

  it("sinSalida solo vale con true: «sí» o 1 es false", () => {
    expect(parteLegible(crudo({ estado: "enviado", sinSalida: true }))?.sinSalida).toBe(true);
    expect(parteLegible(crudo({ sinSalida: "sí" }))?.sinSalida).toBe(false);
    expect(parteLegible(crudo({ sinSalida: 1 }))?.sinSalida).toBe(false);
    expect(parteLegible(crudo({ sinSalida: undefined }))?.sinSalida).toBe(false);
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
