import { tick } from "svelte";
import { describe, expect, it } from "vitest";
import type { ValoresDocumento } from "../src/lib/dominio/formulario-documento.ts";
import type { ValoresResolver } from "../src/lib/dominio/formulario-novedad.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import { documentoVigente } from "../src/lib/dominio/vencimientos.ts";
import { EstadoApp } from "../src/lib/estado/app.svelte.ts";
import type { AccionDeConductorSinLicencia, AccionDeDocumento } from "../src/lib/estado/centro-alertas.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";
import { DialogosDeDocumento } from "../src/componentes/dialogos-documento.svelte.ts";

// Este archivo se llama *.svelte.test.ts para que Svelte compile los runes del módulo que se prueba (estado compartido de Renovar / Cargar / Resolver).
// Con el ejemplo del generador (hoy 18/11/2026): ZK 214 BD tiene el seguro vencido, ZZD 563 no tiene la habilitación, ZU 899 QE tiene una novedad crítica abierta.
const NUEVO: ValoresDocumento = { numero: "DEMO-NUEVO-1", emisor: "Aseguradora del Sur Demo", vence: "2027-11-18", emitido: "" };
const RESOLVER: ValoresResolver = { texto: "Se cambiaron las pastillas de freno", volverAServicio: false };

async function iniciada() {
  const ubicacion = ubicacionEnMemoria("#/inicio");
  const app = new EstadoApp({
    reloj: crearReloj(() => new Date("2026-11-18T15:00:00.000Z")),
    abrirAlmacenamiento: async () => new RepositorioMemoria(),
    ubicacion,
    crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
    nuevoId: (() => {
      let n = 0;
      return () => `nuevo-${++n}`;
    })(),
  });
  await app.iniciar();
  const dialogos = new DialogosDeDocumento(app);
  return { app, ubicacion, dialogos };
}

function vencimientos(app: EstadoApp) {
  return app.centroDeAlertas?.vencimientos.grupos.flatMap((g) => g.filas) ?? [];
}

function accionDe(app: EstadoApp, tipo: "renovar" | "cargar"): AccionDeDocumento {
  const fila = vencimientos(app).find((f) => f.accion.tipo === tipo);
  if (fila === undefined) throw new Error(`no hay una fila con ${tipo}`);
  return fila.accion;
}

describe("estado inicial", () => {
  it("todo cerrado, sin contexto y sin mensajes", async () => {
    const { dialogos } = await iniciada();
    expect(dialogos.abierto).toBe(false);
    expect(dialogos.resolverAbierto).toBe(false);
    expect(dialogos.contexto).toBeNull();
    expect(dialogos.contextoResolver).toBeNull();
    for (const origen of ["inicio", "vencimientos", "operacion"] as const) expect(dialogos.mensaje(origen).texto).toBe("");
  });

  it("antes de que termine el arranque no abre nada", async () => {
    const app = new EstadoApp({
      reloj: crearReloj(() => new Date("2026-11-18T15:00:00.000Z")),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion: ubicacionEnMemoria("#/inicio"),
      crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
    });
    const dialogos = new DialogosDeDocumento(app);
    dialogos.abrirResolver("cualquiera");
    expect(dialogos.resolverAbierto).toBe(false);
    expect(dialogos.mensaje("operacion").texto).toBe("");
  });
});

describe("Renovar", () => {
  it("abre con el contexto del documento (título, qué hay ahora y botón)", async () => {
    const { app, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    expect(dialogos.abierto).toBe(true);
    expect(dialogos.resolverAbierto).toBe(false);
    expect(dialogos.contexto?.titulo).toMatch(/^Renovar: /);
    expect(dialogos.contexto?.contexto).toBeDefined();
    expect(dialogos.contexto?.valoresIniciales.numero).toBe("");
  });

  it("guardar renueva el documento de verdad y el mensaje va a la barra del origen, con «Quedan N vencimientos»", async () => {
    const { app, dialogos } = await iniciada();
    const accion = accionDe(app, "renovar");
    dialogos.abrirRenovar(accion, "vencimientos");
    const r = await dialogos.guardar(NUEVO);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.mensaje).toMatch(/renovad[oa]\. Quedan \d+ vencimientos\.$/);
    expect(dialogos.mensaje("vencimientos").texto).toBe("");
    dialogos.alGuardar(r);
    expect(dialogos.mensaje("vencimientos").texto).toBe(r.mensaje);
    expect(dialogos.mensaje("inicio").texto).toBe("");
    expect(dialogos.mensaje("operacion").texto).toBe("");
    expect(vencimientos(app).some((f) => f.alertaId === `doc:${accion.documentoId}`)).toBe(false);
  });

  it("el mismo diálogo sirve para el origen Inicio (el horizonte de Inicio y las filas de conductores)", async () => {
    const { app, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "inicio");
    const r = await dialogos.guardar(NUEVO);
    if (!r.ok) throw new Error("tenía que guardar");
    dialogos.alGuardar(r);
    expect(dialogos.mensaje("inicio").texto).toBe(r.mensaje);
    expect(dialogos.mensaje("vencimientos").texto).toBe("");
  });

  it("un guardado con errores no cierra el diálogo, devuelve los errores y no deja ningún mensaje", async () => {
    const { app, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    const r = await dialogos.guardar({ numero: "", emisor: "", vence: "", emitido: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores.lista.map((x) => x.campo)).toEqual(["numero", "vence"]);
    expect(dialogos.abierto).toBe(true);
    expect(dialogos.mensaje("vencimientos").texto).toBe("");
  });

  it("si el documento ya se renovó mientras tanto, no abre y lo dice en el origen", async () => {
    const { app, dialogos } = await iniciada();
    const accion = accionDe(app, "renovar");
    expect((await app.renovarDocumento(accion.documentoId ?? "", NUEVO)).ok).toBe(true);
    dialogos.abrirRenovar(accion, "vencimientos");
    expect(dialogos.abierto).toBe(false);
    expect(dialogos.mensaje("vencimientos").texto).toBe("Ese documento ya no está pendiente. La lista está al día.");
  });

  it("guardar sin un diálogo abierto no escribe nada: devuelve un error general", async () => {
    const { app, dialogos } = await iniciada();
    const antes = app.estado;
    const r = await dialogos.guardar(NUEVO);
    expect(r.ok).toBe(false);
    expect(app.estado).toBe(antes);
  });
});

describe("Cargar", () => {
  it("un obligatorio que falta se carga: abre con el contexto de cargar y guarda", async () => {
    const { app, dialogos } = await iniciada();
    const accion = accionDe(app, "cargar");
    dialogos.abrirRenovar(accion, "vencimientos");
    expect(dialogos.abierto).toBe(true);
    expect(dialogos.contexto?.titulo).toMatch(/^Cargar: /);
    expect(dialogos.contexto?.contexto).toBeUndefined();
    const r = await dialogos.guardar(NUEVO);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mensaje).toMatch(/cargad[oa]\. Quedan \d+ vencimientos\.$/);
  });

  it("si ya se cargó mientras tanto, no abre", async () => {
    const { app, dialogos } = await iniciada();
    const accion = accionDe(app, "cargar");
    expect((await app.cargarDocumento(accion.titular, accion.tipoDocumento, NUEVO)).ok).toBe(true);
    dialogos.abrirRenovar(accion, "vencimientos");
    expect(dialogos.abierto).toBe(false);
    expect(dialogos.mensaje("vencimientos").texto).toBe("Ese documento ya no está pendiente. La lista está al día.");
  });
});

describe("conductores sin licencia (Renovar, Cargar y Corregir desde Inicio)", () => {
  /** Un estado donde Luis tiene una licencia vencida (como el conductor sin licencia del ejemplo). */
  it("el ejemplo trae un conductor sin licencia con su acción completa", async () => {
    const { app } = await iniciada();
    const conductores = app.centroDeAlertas?.protagonista.conductores ?? [];
    expect(conductores.length).toBeGreaterThan(0);
    expect(conductores[0]?.accion.tipo).not.toBeUndefined();
  });

  it("abrirLicencia guarda y dice «Licencia de {Nombre} renovada.» (o cargada) en vez del mensaje general", async () => {
    const { app, dialogos } = await iniciada();
    const fila = (app.centroDeAlertas?.protagonista.conductores ?? [])[0];
    if (fila === undefined) throw new Error("falta un conductor sin licencia");
    dialogos.abrirLicencia(fila);
    expect(dialogos.abierto).toBe(true);
    const r = await dialogos.guardar(NUEVO);
    if (!r.ok) throw new Error(`tenía que guardar: ${JSON.stringify(r.errores)}`);
    dialogos.alGuardar(r);
    const hecho = fila.accion.tipo === "renovar" ? "renovada" : fila.accion.tipo === "cargar" ? "cargada" : null;
    if (hecho !== null) expect(dialogos.mensaje("inicio").texto).toBe(`Licencia de ${fila.nombre} ${hecho}.`);
    expect(dialogos.mensaje("vencimientos").texto).toBe("");
  });

  it("«Corregir» (la licencia con una emisión futura) abre el diálogo de corregir y guarda con corregirDocumento", async () => {
    const { app, dialogos } = await iniciada();
    const conductorId = app.estado?.conductores[0]?.id ?? "";
    const licencia = documentoVigente(app.estado?.documentos ?? [], { tipo: "conductor", id: conductorId }, "licencia");
    if (licencia === undefined) throw new Error("falta una licencia");
    const accion: AccionDeConductorSinLicencia = {
      tipo: "corregir",
      etiqueta: "Corregir",
      nombreAccesible: "Corregir licencia",
      documentoId: licencia.id,
      titular: licencia.titular,
      tipoDocumento: "licencia",
    };
    dialogos.abrirRenovar(accion, "inicio");
    expect(dialogos.abierto).toBe(true);
    expect(dialogos.contexto?.titulo).toMatch(/^Corregir/);
    const r = await dialogos.guardar({ numero: licencia.numero, emisor: licencia.emisor, vence: sumarDias("2026-11-18", 400), emitido: "" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      dialogos.alGuardar(r);
      expect(dialogos.mensaje("inicio").texto).toBe(r.mensaje);
    }
  });

  it("una acción de corregir sin documento no abre y lo dice", async () => {
    const { dialogos } = await iniciada();
    dialogos.abrirRenovar({ tipo: "corregir", etiqueta: "Corregir", nombreAccesible: "x", documentoId: null, titular: { tipo: "conductor", id: "c-01" }, tipoDocumento: "licencia" }, "inicio");
    expect(dialogos.abierto).toBe(false);
    expect(dialogos.mensaje("inicio").texto).toBe("Ese documento ya no está pendiente. La lista está al día.");
  });
});

describe("Resolver", () => {
  function novedadAbierta(app: EstadoApp): string {
    const fila = app.centroDeAlertas?.operacionDiaria.solapas[1].grupos.flatMap((g) => g.filas)[0];
    if (fila?.accion.tipo !== "resolver") throw new Error("falta una novedad para resolver");
    return fila.accion.novedadId;
  }

  it("abre con el contexto de la novedad y cierra el otro diálogo", async () => {
    const { app, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    dialogos.abrirResolver(novedadAbierta(app));
    expect(dialogos.resolverAbierto).toBe(true);
    expect(dialogos.abierto).toBe(false);
    expect(dialogos.contextoResolver?.titulo).toMatch(/^Resolver novedad de /);
  });

  it("y al revés: abrir Renovar cierra Resolver (nunca hay dos diálogos a la vez)", async () => {
    const { app, dialogos } = await iniciada();
    dialogos.abrirResolver(novedadAbierta(app));
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    expect(dialogos.abierto).toBe(true);
    expect(dialogos.resolverAbierto).toBe(false);
  });

  it("guardar resuelve la novedad de verdad y el mensaje va a la barra de Operación", async () => {
    const { app, dialogos } = await iniciada();
    const id = novedadAbierta(app);
    dialogos.abrirResolver(id);
    const r = await dialogos.guardarResolver(RESOLVER);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    dialogos.alResolver(r);
    expect(dialogos.mensaje("operacion").texto).toBe(r.mensaje);
    expect(app.estado?.novedades.find((n) => n.id === id)?.estado).toBe("resuelta");
  });

  it("un guardado con errores no cierra el diálogo", async () => {
    const { app, dialogos } = await iniciada();
    dialogos.abrirResolver(novedadAbierta(app));
    const r = await dialogos.guardarResolver({ texto: "", volverAServicio: false });
    expect(r.ok).toBe(false);
    expect(dialogos.resolverAbierto).toBe(true);
  });

  it("una novedad que ya no está abierta no abre el diálogo y lo dice", async () => {
    const { app, dialogos } = await iniciada();
    const id = novedadAbierta(app);
    expect((await app.resolverNovedad(id, RESOLVER)).ok).toBe(true);
    dialogos.abrirResolver(id);
    expect(dialogos.resolverAbierto).toBe(false);
    expect(dialogos.mensaje("operacion").texto).toBe("Esa novedad ya no está abierta. La lista está al día.");
    dialogos.abrirResolver("no-existe");
    expect(dialogos.resolverAbierto).toBe(false);
  });
});

describe("mensajes", () => {
  it("el mismo texto dos veces seguidas es un objeto nuevo: la región vuelve a anunciarlo", async () => {
    const { app, dialogos } = await iniciada();
    const accion = accionDe(app, "renovar");
    dialogos.abrirRenovar(accion, "vencimientos");
    dialogos.alGuardar({ mensaje: "Seguro renovado." });
    const primero = dialogos.mensaje("vencimientos");
    dialogos.alGuardar({ mensaje: "Seguro renovado." });
    const segundo = dialogos.mensaje("vencimientos");
    expect(segundo.texto).toBe(primero.texto);
    expect(segundo).not.toBe(primero);
  });

  it("sin mensajes, el objeto es siempre el mismo (no se anuncia nada por gusto)", async () => {
    const { dialogos } = await iniciada();
    expect(dialogos.mensaje("inicio")).toBe(dialogos.mensaje("inicio"));
    expect(dialogos.mensaje("inicio")).toBe(dialogos.mensaje("operacion"));
  });

  it("se olvidan al llegar a otra pantalla: no vuelven al volver", async () => {
    const { app, ubicacion, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    dialogos.alGuardar({ mensaje: "Seguro renovado." });
    expect(dialogos.mensaje("vencimientos").texto).toBe("Seguro renovado.");
    ubicacion.irA("#/movilidades");
    expect(dialogos.mensaje("vencimientos").texto).toBe("");
    ubicacion.irA("#/inicio");
    expect(dialogos.mensaje("vencimientos").texto).toBe("");
  });

  it("cambiar el filtro o escribir en el buscador de la misma pantalla no los borra", async () => {
    const { app, ubicacion, dialogos } = await iniciada();
    ubicacion.irA("#/vencimientos");
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    dialogos.alGuardar({ mensaje: "Seguro renovado." });
    ubicacion.irA("#/vencimientos?filtro=7");
    expect(dialogos.mensaje("vencimientos").texto).toBe("Seguro renovado.");
  });
});

describe("un diálogo no sobrevive a un cambio de pantalla (QA M1 del prototipo)", () => {
  it("con «Atrás» o un enlace a otra pantalla, Renovar y Resolver quedan cerrados", async () => {
    const { app, ubicacion, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    expect(dialogos.abierto).toBe(true);
    ubicacion.irA("#/movilidades");
    expect(dialogos.abierto).toBe(false);
    ubicacion.irA("#/inicio");
    expect(dialogos.abierto).toBe(false);

    const id = app.centroDeAlertas?.operacionDiaria.solapas[1].grupos.flatMap((g) => g.filas)[0]?.accion;
    if (id?.tipo !== "resolver") throw new Error("falta una novedad");
    dialogos.abrirResolver(id.novedadId);
    expect(dialogos.resolverAbierto).toBe(true);
    ubicacion.irA("#/operacion/novedades");
    expect(dialogos.resolverAbierto).toBe(false);
  });

  it("un efecto que lee `abierto` se vuelve a correr al cambiar de pantalla (la vista cierra el diálogo)", async () => {
    const { app, ubicacion, dialogos } = await iniciada();
    const vistas: boolean[] = [];
    const limpiar = $effect.root(() => {
      $effect(() => {
        vistas.push(dialogos.abierto);
      });
    });
    await tick();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "inicio");
    await tick();
    ubicacion.irA("#/vencimientos");
    await tick();
    limpiar();
    expect(vistas).toEqual([false, true, false]);
  });

  it("el mismo cambio de pantalla no reabre uno que se cerró a mano ni deja abierto el siguiente", async () => {
    const { app, ubicacion, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    dialogos.abierto = false;
    expect(dialogos.abierto).toBe(false);
    ubicacion.irA("#/movilidades");
    ubicacion.irA("#/inicio");
    expect(dialogos.abierto).toBe(false);
  });

  it("se puede abrir de nuevo en la pantalla nueva", async () => {
    const { app, ubicacion, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    ubicacion.irA("#/vencimientos");
    expect(dialogos.abierto).toBe(false);
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    expect(dialogos.abierto).toBe(true);
  });
});

describe("a dónde va el foco", () => {
  it("al cerrar sin guardar no hay destino: el foco vuelve al botón que abrió el diálogo", async () => {
    const { app, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "inicio");
    expect(dialogos.destinoDelFoco(null)).toBeNull();
  });

  it("después de guardar va al título del origen: la fila que abrió el diálogo puede haber desaparecido", async () => {
    const { app, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "inicio");
    expect(dialogos.destinoDelFoco({ foco: "titulo-del-panel" })).toBe("inicio");
    dialogos.abrirRenovar(accionDe(app, "cargar"), "vencimientos");
    expect(dialogos.destinoDelFoco({ foco: "titulo-del-panel" })).toBe("vencimientos");
    const novedad = app.centroDeAlertas?.operacionDiaria.solapas[1].grupos.flatMap((g) => g.filas)[0]?.accion;
    if (novedad?.tipo !== "resolver") throw new Error("falta una novedad");
    dialogos.abrirResolver(novedad.novedadId);
    expect(dialogos.destinoDelFoco({ foco: "titulo-del-panel" })).toBe("operacion");
  });

  it("el destino sigue disponible después de que el diálogo se cierra (el foco se pide al cerrar)", async () => {
    const { app, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    dialogos.cerrar();
    expect(dialogos.abierto).toBe(false);
    expect(dialogos.destinoDelFoco({ foco: "titulo-del-panel" })).toBe("vencimientos");
  });
});

describe("cerrar", () => {
  it("cierra los dos diálogos", async () => {
    const { app, dialogos } = await iniciada();
    dialogos.abrirRenovar(accionDe(app, "renovar"), "vencimientos");
    dialogos.cerrar();
    expect(dialogos.abierto).toBe(false);
    dialogos.abrirResolver(app.centroDeAlertas?.operacionDiaria.solapas[1].grupos.flatMap((g) => g.filas).flatMap((f) => (f.accion.tipo === "resolver" ? [f.accion.novedadId] : []))[0] ?? "");
    dialogos.cerrar();
    expect(dialogos.resolverAbierto).toBe(false);
  });
});
