// Paso 4.2 (lógica): el centro de alertas y los diálogos Renovar y Cargar conectados con el estado de la aplicación y la
// persistencia. Aceptación del plan: con el ejemplo (fechaBase 2026-11-18) el protagonista dice «4 unidades», hay 11
// vencimientos en los grupos esperados y 5 pendientes de operación; renovar C01 lo saca de la lista y de «No pueden salir».
import { describe, expect, it } from "vitest";
import { generar } from "../src/lib/datos/generador.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import type { ValoresDocumento } from "../src/lib/dominio/formulario-documento.ts";
import { ERRORES } from "../src/lib/dominio/textos.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { EstadoApp, type DependenciasApp } from "../src/lib/estado/app.svelte.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { SEMILLA_POR_DEFECTO } from "../src/lib/persistencia/arranque.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";

const HOY = "2026-11-18";
const MEDIODIA = "2026-11-18T15:00:00.000Z"; // 12:00 en Argentina
const NUEVO: ValoresDocumento = { numero: "DEMO-NUEVO-1", emisor: "Aseguradora del Sur Demo", vence: "2027-11-18", emitido: "" };

async function iniciada(repo = new RepositorioMemoria()) {
  let n = 0;
  const deps: DependenciasApp = {
    reloj: crearReloj(() => new Date(Date.parse(MEDIODIA))),
    abrirAlmacenamiento: async () => repo,
    ubicacion: ubicacionEnMemoria(),
    crearAvisoPestanas: () => ({ avisarCambio: () => {}, cerrar: () => {} }),
    nuevoId: () => `nuevo-${++n}`,
  };
  const app = new EstadoApp(deps);
  await app.iniciar();
  return { app, repo };
}

function estadoDe(app: EstadoApp): Estado {
  if (app.estado === null) throw new Error("la aplicación no tiene estado");
  return app.estado;
}

function centroDe(app: EstadoApp) {
  if (app.centroDeAlertas === null) throw new Error("el centro de alertas no está calculado");
  return app.centroDeAlertas;
}

/** El seguro vigente de ZK 214 BD (caso C01). */
function seguroDeC01(app: EstadoApp) {
  const e = estadoDe(app);
  const unidad = e.unidades.find((u) => u.patente === "ZK214BD");
  const doc = e.documentos.find((d) => d.titular.tipo === "unidad" && d.titular.id === unidad?.id && d.tipo === "seguro");
  if (doc === undefined) throw new Error("falta el seguro de C01");
  return doc;
}

describe("el centro de alertas en la aplicación (aceptación del paso 4.2)", () => {
  it("antes de iniciar no hay centro; después, el ejemplo: 4 unidades, 12 vencimientos, 5 pendientes", async () => {
    const t = new EstadoApp({
      reloj: crearReloj(() => new Date(Date.parse(MEDIODIA))),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion: ubicacionEnMemoria(),
      crearAvisoPestanas: () => ({ avisarCambio: () => {}, cerrar: () => {} }),
    });
    expect(t.centroDeAlertas).toBeNull();
    await t.iniciar();
    const c = centroDe(t);
    expect(c.protagonista.cifra).toBe(4);
    expect(c.protagonista.textoLector).toBe("4 unidades no pueden salir hoy.");
    expect(c.vencimientos.total).toBe(12);
    expect(c.vencimientos.grupos.map((g) => g.cantidad)).toEqual([3, 4, 3, 2]);
    expect(c.operacion.total).toBe(5);
    expect(c.encabezado.linea).toContain("Logística Andina Demo S.A.");
    expect(estadoDe(t)).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
  });

  it("renovar C01: sale de «No pueden salir» y de la lista, sin recargar; el mensaje dice cuántos quedan; el foco va al título del panel", async () => {
    const { app } = await iniciada();
    const viejo = seguroDeC01(app);
    expect(centroDe(app).protagonista.items.some((i) => i.patente === "ZK214BD")).toBe(true);
    expect(centroDe(app).vencimientos.grupos.flatMap((g) => g.filas).some((f) => f.alertaId === `doc:${viejo.id}`)).toBe(true);

    const r = await app.renovarDocumento(viejo.id, NUEVO);

    expect(r).toEqual({ ok: true, mensaje: "Seguro de ZK 214 BD renovado. Quedan 11 vencimientos.", foco: "titulo-del-panel" });
    const c = centroDe(app);
    expect(c.protagonista.cifra).toBe(3);
    expect(c.protagonista.textoLector).toBe("3 unidades no pueden salir hoy.");
    expect(c.protagonista.items.some((i) => i.patente === "ZK214BD")).toBe(false);
    expect(c.protagonista.disponibles).toBe("Disponibles hoy: 20 de 23 unidades activas.");
    expect(c.vencimientos.total).toBe(11);
    expect(c.vencimientos.grupos.map((g) => g.cantidad)).toEqual([2, 4, 3, 2]);
    expect(c.vencimientos.grupos.flatMap((g) => g.filas).some((f) => f.alertaId === `doc:${viejo.id}`)).toBe(false);
    expect(app.alertas?.resumen.criticas).toBe(3);
    // la fila que abrió el diálogo ya no existe (su alerta se resolvió): por eso el foco va al título del panel (5.17)
    expect(app.alertas?.alertas.some((a) => a.id === `doc:${viejo.id}`)).toBe(false);
  });

  it("renovar guarda el documento nuevo y el evento en una operación, y marca la demo como modificada", async () => {
    const { app, repo } = await iniciada();
    const viejo = seguroDeC01(app);
    await app.renovarDocumento(viejo.id, NUEVO);

    const guardado = await repo.cargar();
    expect(guardado).toEqual(app.estado);
    const nuevo = guardado?.documentos.find((d) => d.reemplazaA === viejo.id);
    expect(nuevo).toMatchObject({ numero: "DEMO-NUEVO-1", vence: "2027-11-18", tipo: "seguro", emitido: null });
    const evento = guardado?.eventos.at(-1);
    expect(evento).toMatchObject({ tipo: "documento-renovado", autor: "Rocío Medina" });
    expect(evento?.datos).toMatchObject({ documentoAnteriorId: viejo.id, venceAnterior: "2026-11-17", venceNuevo: "2027-11-18" });
    expect(guardado?.meta.modificada).toBe(true);
  });

  it("una renovación que sigue alertando (vence en 20 días) cambia de grupo y el total no baja", async () => {
    const { app } = await iniciada();
    const e = estadoDe(app);
    const hoyVence = e.documentos.find((d) => d.tipo === "revision-tecnica" && d.vence === HOY);
    if (hoyVence === undefined) throw new Error("falta el caso C02");
    const antes = centroDe(app).vencimientos.grupos.map((g) => g.cantidad);
    expect(antes).toEqual([3, 4, 3, 2]);

    const r = await app.renovarDocumento(hoyVence.id, { ...NUEVO, vence: sumarDias(HOY, 20) });

    expect(r.ok && r.mensaje).toMatch(/^Revisión técnica de .+ renovada\. Quedan 12 vencimientos\.$/);
    expect(centroDe(app).vencimientos.grupos.map((g) => g.cantidad)).toEqual([3, 3, 3, 3]);
    expect(r.ok && r.foco).toBe("titulo-del-panel");
  });

  it("cargar la habilitación faltante de C10: la unidad sale de «No pueden salir» y el faltante de la lista", async () => {
    const { app } = await iniciada();
    const falta = centroDe(app).vencimientos.grupos[0]?.filas.find((f) => f.tipo === "documento-faltante");
    if (falta === undefined || falta.titular.tipo !== "unidad") throw new Error("falta el caso C10");
    expect(falta.accion.tipo).toBe("cargar");
    const { patente, patenteTexto } = falta.titular;

    const r = await app.cargarDocumento(falta.accion.titular, falta.accion.tipoDocumento, NUEVO);

    expect(r).toEqual({
      ok: true,
      mensaje: `Habilitación de ingreso al proyecto de ${patenteTexto} cargada. Quedan 11 vencimientos.`,
      foco: "titulo-del-panel",
    });
    const c = centroDe(app);
    expect(c.protagonista.items.some((i) => i.patente === patente)).toBe(false);
    expect(c.protagonista.cifra).toBe(3);
    expect(c.vencimientos.grupos[0]?.cantidad).toBe(2);
    expect(estadoDe(app).eventos.at(-1)?.tipo).toBe("documento-cargado");
  });
});

describe("errores del formulario: no se guarda nada y la persona ve qué corregir", () => {
  it("campos vacíos: todos los errores juntos, por campo y en orden; el estado y lo guardado no cambian", async () => {
    const { app, repo } = await iniciada();
    const antes = app.estado;
    const guardadoAntes = await repo.cargar();
    const r = await app.renovarDocumento(seguroDeC01(app).id, { numero: "", emisor: "", vence: "", emitido: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores.lista.map((x) => x.campo)).toEqual(["numero", "vence"]);
    expect(r.errores.porCampo.numero).toBe("Escriba el número del documento.");
    expect(r.errores.general).toBeNull();
    expect(app.estado).toBe(antes);
    expect(await repo.cargar()).toEqual(guardadoAntes);
  });

  it("V10: un vencimiento que no es posterior al vigente se marca en «vence» con el mensaje del dominio", async () => {
    const { app } = await iniciada();
    const r = await app.renovarDocumento(seguroDeC01(app).id, { ...NUEVO, vence: "2026-11-17" });
    expect(r).toEqual({
      ok: false,
      errores: {
        porCampo: { vence: "La renovación tiene que vencer después del 17/11/2026." },
        lista: [{ campo: "vence", mensaje: "La renovación tiene que vencer después del 17/11/2026." }],
        general: null,
      },
    });
  });

  it("emisión posterior al vencimiento (la regla de dos campos la dice el comando)", async () => {
    const { app } = await iniciada();
    const r = await app.renovarDocumento(seguroDeC01(app).id, { ...NUEVO, emitido: "2028-01-01" });
    expect(r.ok === false && r.errores.porCampo.emitido).toBe("La fecha de emisión no puede ser posterior al vencimiento.");
  });

  it("D10: si el guardado falla, no cambia nada y el error es general (el diálogo no se cierra)", async () => {
    const repo = new RepositorioMemoria();
    const { app } = await iniciada(repo);
    const antes = app.estado;
    repo.escribir = () => Promise.reject(new Error("cuota agotada"));
    const r = await app.renovarDocumento(seguroDeC01(app).id, NUEVO);
    expect(r).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: ERRORES.noPudoGuardar } });
    expect(app.estado).toBe(antes);
    expect(centroDe(app).protagonista.cifra).toBe(4);
  });

  it("el perfil Conductor no puede cargar ni renovar: error general «sin permiso»", async () => {
    const { app } = await iniciada();
    const conductor = estadoDe(app).conductores[0];
    if (conductor === undefined) throw new Error("no hay conductores");
    const cambio = await app.cambiarPerfil({ tipo: "conductor", conductorId: conductor.id });
    expect(cambio.ok).toBe(true);
    const r = await app.renovarDocumento(seguroDeC01(app).id, NUEVO);
    expect(r).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: ERRORES.sinPermiso } });
  });

  it("doble envío: el segundo ve que el documento ya no es el vigente (error general) y no se renueva dos veces", async () => {
    const { app } = await iniciada();
    const id = seguroDeC01(app).id;
    const [a, b] = await Promise.all([app.renovarDocumento(id, NUEVO), app.renovarDocumento(id, { ...NUEVO, numero: "DEMO-NUEVO-2" })]);
    expect(a.ok).toBe(true);
    expect(b).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: ERRORES.documentoNoVigente } });
    expect(estadoDe(app).documentos.filter((d) => d.reemplazaA === id)).toHaveLength(1);
  });

  it("cargar un documento que ya existe: error general (el tipo no es un campo del diálogo)", async () => {
    const { app } = await iniciada();
    const doc = seguroDeC01(app);
    const r = await app.cargarDocumento(doc.titular, "seguro", NUEVO);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores.lista).toEqual([]);
    expect(r.errores.general).toBe("Ya hay cargado un documento «Seguro». Para actualizarlo, use «Renovar».");
  });

  it("sin datos cargados (todavía arrancando): error general «sin datos»", async () => {
    const t = new EstadoApp({
      reloj: crearReloj(() => new Date(Date.parse(MEDIODIA))),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion: ubicacionEnMemoria(),
    });
    const r = await t.renovarDocumento("x", NUEVO);
    expect(r).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: ERRORES.sinDatos } });
  });
});
