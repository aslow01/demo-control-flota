// Paso 4.5 (lógica): un parte guardado con la forma rota (el almacenamiento del navegador se puede editar a mano, o venir de otra versión del código que
// pasó la revisión mínima de D7) no tiene que romper la pantalla: se lee lo que se pueda, lo demás queda como «sin responder» o vacío, y siempre se puede
// descartar o completar el borrador. Los datos del almacenamiento son entrada externa.
import { describe, expect, it } from "vitest";
import { advertenciasLegibles, esBorradorVacio, parteLegible } from "../src/lib/dominio/parte.ts";
import type { Estado, Parte } from "../src/lib/dominio/tipos.ts";
import { valoresDeParte } from "../src/lib/dominio/formulario-parte.ts";
import { inicioDelConductor, panelDeParteEnviado, vistaDeParte } from "../src/lib/estado/parte.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { EstadoApp } from "../src/lib/estado/app.svelte.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";
import { checklistEnOrden, flotaDePrueba, parte } from "./ayuda.ts";

const H = "2026-11-18";

/** Rompe un parte guardado a propósito: lo que llegue de afuera puede tener cualquier forma. */
function roto(cambios: Record<string, unknown>, base: Partial<Parte> = {}): Parte {
  return { ...parte({ estado: "borrador", enviado: null, ...base }), ...cambios } as unknown as Parte;
}

describe("parteLegible: lo que se puede leer de un parte con la forma rota", () => {
  it("un parte sano queda igual", () => {
    const p = parte({ estado: "borrador", enviado: null, litrosCargados: 45.5, otraNovedad: { descripcion: "Luz", impideUso: true } });
    expect(parteLegible(p)).toEqual(p);
  });

  it("sin id, sin unidad, con fecha inválida o con un estado desconocido: no hay nada que leer", () => {
    expect(parteLegible(roto({ id: 5 }))).toBeNull();
    expect(parteLegible(roto({ unidadId: null }))).toBeNull();
    expect(parteLegible(roto({ fecha: "2026-13-45" }))).toBeNull();
    expect(parteLegible(roto({ fecha: 20261118 }))).toBeNull();
    expect(parteLegible(roto({ estado: "archivado" }))).toBeNull();
    expect(parteLegible(null as unknown as Parte)).toBeNull();
  });

  it("el checklist ausente o con basura queda «sin responder»; lo válido se conserva", () => {
    const checklist = { frenos: { estado: "en-orden" }, direccion: 5, neumaticos: { estado: "con-novedad", descripcion: 7, impideUso: "sí" }, luces: { estado: "con-novedad", descripcion: "Una baliza", impideUso: true }, cinturones: null };
    const p = parteLegible(roto({ checklist }));
    expect(p?.checklist.frenos).toEqual({ estado: "en-orden" });
    expect(p?.checklist.direccion).toEqual({ estado: "sin-responder" });
    expect(p?.checklist.neumaticos).toEqual({ estado: "con-novedad", descripcion: "", impideUso: false });
    expect(p?.checklist.luces).toEqual({ estado: "con-novedad", descripcion: "Una baliza", impideUso: true });
    expect(p?.checklist.cinturones).toEqual({ estado: "sin-responder" });
    expect(p?.checklist.cabina).toEqual({ estado: "sin-responder" });
    expect(parteLegible(roto({ checklist: undefined }))?.checklist.frenos).toEqual({ estado: "sin-responder" });
    expect(parteLegible(roto({ checklist: "nada" }))?.checklist.frenos).toEqual({ estado: "sin-responder" });
  });

  it("código B5: un kilometraje final menor que el inicial no se lee (no se dibuja «-20 km»)", () => {
    expect(parteLegible(roto({ kmInicio: 84400, kmFin: 84380 }))).toMatchObject({ kmInicio: 84400, kmFin: null });
    expect(parteLegible(roto({ kmInicio: 84400, kmFin: 84400 }))).toMatchObject({ kmInicio: 84400, kmFin: 84400 });
    expect(parteLegible(roto({ kmInicio: null, kmFin: 100 }))).toMatchObject({ kmInicio: null, kmFin: 100 });
  });

  it("los números fuera de rango, con texto o NaN quedan en null; los kilómetros y los litros válidos se conservan", () => {
    const p = parteLegible(roto({ kmInicio: "abc", kmFin: -5, litrosCargados: 500, combustible: "lleno-de-todo" }));
    expect(p).toMatchObject({ kmInicio: null, kmFin: null, litrosCargados: null, combustible: null });
    expect(parteLegible(roto({ kmInicio: Number.NaN, kmFin: 2_000_001, litrosCargados: 0 }))).toMatchObject({ kmInicio: null, kmFin: null, litrosCargados: null });
    expect(parteLegible(roto({ kmInicio: 84.5 }))?.kmInicio).toBeNull();
    expect(parteLegible(roto({ kmInicio: 84320, kmFin: 84400, litrosCargados: 12.5, combustible: "medio" }))).toMatchObject({ kmInicio: 84320, kmFin: 84400, litrosCargados: 12.5, combustible: "medio" });
  });

  it("otra novedad mal formada es null; el conductor que no es texto es null", () => {
    expect(parteLegible(roto({ otraNovedad: { descripcion: 5, impideUso: false } }))?.otraNovedad).toBeNull();
    expect(parteLegible(roto({ otraNovedad: "x" }))?.otraNovedad).toBeNull();
    expect(parteLegible(roto({ conductorId: 7 }))?.conductorId).toBeNull();
  });

  it("las advertencias y la documentación vencida: solo lo que se reconoce", () => {
    const p = parteLegible(roto({
      advertenciasAceptadas: [{ tipo: "salto-km", km: 1250 }, { tipo: "invento" }, 5, { tipo: "recorrido-largo", km: "mucho" }, { tipo: "documentacion-vencida", documentos: ["seguro", "pasaporte"] }],
      documentacionVencida: ["seguro", 3, "pasaporte"],
    }));
    expect(p?.advertenciasAceptadas).toEqual([{ tipo: "salto-km", km: 1250 }, { tipo: "documentacion-vencida", documentos: ["seguro"] }]);
    expect(p?.documentacionVencida).toEqual(["seguro"]);
    expect(parteLegible(roto({ advertenciasAceptadas: "x", documentacionVencida: null }))).toMatchObject({ advertenciasAceptadas: [], documentacionVencida: [] });
  });

  it("los instantes que no son instantes quedan vacíos (las pantallas no inventan una hora)", () => {
    const p = parteLegible(roto({ creado: "ayer", actualizado: 5, enviado: "mañana" }));
    expect(p).toMatchObject({ creado: "", actualizado: "", enviado: null });
  });

  it("esBorradorVacio no revienta con un borrador roto (descartarlo tiene que andar siempre)", () => {
    expect(esBorradorVacio(roto({ checklist: undefined }), 100)).toBe(false);
    expect(esBorradorVacio(roto({ checklist: { frenos: null } }), 100)).toBe(false);
  });

  it("valoresDeParte de un parte legible no revienta y arranca el formulario con lo que se pudo leer", () => {
    const p = parteLegible(roto({ checklist: { frenos: { estado: "en-orden" } }, kmInicio: "x", kmFin: 90000 }));
    if (p === null) throw new Error("tenía que leerse");
    expect(valoresDeParte(p)).toMatchObject({ kmInicio: "", kmFin: "90.000" });
  });
});

describe("las pantallas con un borrador roto", () => {
  function conBorradorRoto(cambios: Record<string, unknown>): Estado {
    const e = flotaDePrueba();
    e.partes.push(roto(cambios, { id: "pr", unidadId: "u1", fecha: H, conductorId: "c1" }));
    return e;
  }

  it("la pantalla del parte se abre con lo que se pudo leer, y dice que no sabe cuándo se guardó si el instante está roto", () => {
    const e = conBorradorRoto({ checklist: 7, kmInicio: "abc", kmFin: 84400, actualizado: "ayer" });
    const v = vistaDeParte(e, H, { tipo: "conductor", conductorId: "c1" }, "ZK214BD", H);
    expect(v.tipo).toBe("edicion");
    if (v.tipo !== "edicion") return;
    expect(v.parteId).toBe("pr");
    expect(v.valoresIniciales).toMatchObject({ kmInicio: "", kmFin: "84.400" });
    expect(v.valoresIniciales.checklist.frenos.respuesta).toBe("");
    expect(v.borrador).toEqual({ mensaje: "Borrador recuperado." });
  });

  it("un parte con la fecha rota no es de ninguna fecha: se ignora (la pantalla del día se abre como nuevo)", () => {
    const e = flotaDePrueba();
    e.partes.push(roto({ fecha: "no es fecha" }, { id: "pr", unidadId: "u1" }));
    expect(vistaDeParte(e, H, { tipo: "conductor", conductorId: "c1" }, "ZK214BD", H)).toMatchObject({ tipo: "edicion", parteId: null });
  });

  it("el inicio del conductor cuenta lo que falta de un borrador roto sin romperse", () => {
    const e = conBorradorRoto({ checklist: null, combustible: 5, kmFin: null });
    const v = inicioDelConductor(e, calcularAlertas(e, H), H, { tipo: "conductor", conductorId: "c1" });
    expect(v?.hoyEstado).toMatchObject({ tipo: "borrador", texto: "Tiene una revisión empezada: faltan 10 datos." });
  });

  it("el inicio del conductor y los últimos partes ignoran un parte enviado con los kilómetros rotos", () => {
    const e = flotaDePrueba();
    e.partes.push(roto({ kmInicio: "x", kmFin: {} }, { id: "pr", estado: "enviado", enviado: "2026-11-16T21:00:00.000Z", fecha: "2026-11-16", conductorId: "c1" }));
    const v = inicioDelConductor(e, calcularAlertas(e, H), H, { tipo: "conductor", conductorId: "c1" });
    expect(v?.ultimosPartes.filas.map((f) => f.parteId)).not.toContain("pr");
  });

  it("un parte enviado sin kilómetros ni hora legibles se muestra sin inventar nada", () => {
    const e = flotaDePrueba();
    const p = roto({ kmInicio: null, kmFin: null, enviado: "x", revisado: "z", actualizado: "y", checklist: checklistEnOrden() }, { id: "pr", estado: "enviado", unidadId: "u1", fecha: "2026-11-16" });
    e.partes.push(p);
    const panel = panelDeParteEnviado(e, p, { tipo: "conductor", conductorId: "c1" });
    expect(panel.linea).toBe("ZK 214 BD, 16/11/2026: parte cerrado.");
    expect(panel.filas[0]).toEqual({ rotulo: "Recorrido", valor: "—" });
    const v = vistaDeParte(e, H, { tipo: "conductor", conductorId: "c1" }, "ZK214BD", "2026-11-16");
    expect(v.tipo).toBe("lectura");
  });
});

describe("la aplicación con un borrador roto en el almacenamiento", () => {
  async function iniciada(estado: Estado) {
    const repo = new RepositorioMemoria();
    await repo.reemplazarTodo(estado);
    let n = 0;
    const app = new EstadoApp({
      reloj: crearReloj(() => new Date(Date.parse("2026-11-18T15:00:00.000Z"))),
      abrirAlmacenamiento: async () => repo,
      ubicacion: ubicacionEnMemoria("#/parte/ZK214BD/2026-11-18"),
      crearAvisoPestanas: () => ({ avisarCambio: () => {}, cerrar: () => {} }),
      nuevoId: () => `nuevo-${++n}`,
    });
    await app.iniciar();
    return app;
  }

  function estado(cambios: Record<string, unknown>): Estado {
    const e = flotaDePrueba();
    e.meta.perfil = { tipo: "conductor", conductorId: "c1" };
    e.partes.push(roto(cambios, { id: "pr", unidadId: "u1", fecha: H, conductorId: "c1" }));
    return e;
  }

  it("D7: un borrador cuyo checklist ni siquiera es un objeto es «otro formato»: se vuelve al ejemplo con el aviso, no se rompe nada", async () => {
    const app = await iniciada(estado({ checklist: "basura" }));
    expect(app.avisos.map((a) => a.tipo)).toEqual(["esquema-actualizado"]);
    expect(app.estado?.partes.some((p) => p.id === "pr")).toBe(false);
    expect(app.parteDeLaRuta?.tipo).toBe("no-disponible") // la unidad de la ruta es la C01: con el seguro vencido no se puede cargar (P21);
  });

  it("se puede descartar", async () => {
    const app = await iniciada(estado({ checklist: { frenos: 7, direccion: null } }));
    expect(app.parteDeLaRuta?.tipo).toBe("edicion");
    expect(await app.descartarBorradorDeParte("pr")).toEqual({ ok: true, mensaje: "Borrador descartado." });
    expect(app.estado?.partes.some((p) => p.id === "pr")).toBe(false);
  });

  it("se puede completar y enviar: lo que se manda desde el formulario reemplaza lo roto", async () => {
    const app = await iniciada(estado({ checklist: { frenos: "basura", luces: { estado: 3 } }, kmInicio: "x", combustible: 9 }));
    const v = app.parteDeLaRuta;
    if (v?.tipo !== "edicion") throw new Error("tenía que abrirse para editar");
    const valores = structuredClone(v.valoresIniciales);
    for (const k of Object.keys(valores.checklist) as (keyof typeof valores.checklist)[]) valores.checklist[k] = { respuesta: "en-orden", descripcion: "", impideUso: false };
    const r = await app.enviarRevisionDeParte(v.unidadId, H, { ...valores, kmInicio: "84.320", kmFin: "84.400", combustible: "medio" });
    expect(r.tipo).toBe("enviado");
    const enviado = app.estado?.partes.find((p) => p.id === "pr");
    expect(enviado).toMatchObject({ estado: "en-uso", kmInicio: 84320, kmFin: 84400, combustible: "medio" });
    expect(parteLegible(enviado as Parte)).toEqual(enviado);
  });

  it("guardar sobre el borrador roto lo deja con la forma sana", async () => {
    const app = await iniciada(estado({ checklist: { frenos: "basura" }, kmInicio: "x" }));
    const v = app.parteDeLaRuta;
    if (v?.tipo !== "edicion") throw new Error("tenía que abrirse para editar");
    const r = await app.guardarBorradorDeParte(v.unidadId, H, { ...v.valoresIniciales, kmInicio: "84.320", kmFin: "84.400" });
    expect(r).toMatchObject({ ok: true, parteId: "pr" });
    const guardado = app.estado?.partes.find((p) => p.id === "pr");
    expect(parteLegible(guardado as Parte)).toEqual(guardado);
    expect(guardado).toMatchObject({ kmInicio: 84320, kmFin: 84400 });
  });
});

describe("advertenciasLegibles (código B4: sin casts sobre el detalle de un error)", () => {
  it("devuelve las advertencias bien formadas y descarta el resto; un valor que no es una lista da una lista vacía", () => {
    expect(advertenciasLegibles([{ tipo: "salto-km", km: 900 }, null, "x", { tipo: "recorrido-largo" }, { tipo: "documentacion-vencida", documentos: ["seguro", "nada"] }])).toEqual([
      { tipo: "salto-km", km: 900 },
      { tipo: "documentacion-vencida", documentos: ["seguro"] },
    ]);
    expect(advertenciasLegibles(undefined)).toEqual([]);
    expect(advertenciasLegibles({ tipo: "salto-km", km: 1 })).toEqual([]);
  });
});
