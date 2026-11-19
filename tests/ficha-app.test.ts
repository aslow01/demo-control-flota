// Paso 4.4 (lógica): la ficha de unidad y sus diálogos conectados con el estado de la aplicación, la persistencia y la ruta. Aceptación del
// plan: cada comando de la sección 8 se ejecuta por la API del estado y su evento queda primero en el historial; A4 y N2 visibles con C11
// (ZU 899 QE); «cárguelos desde aquí» es cierto al llegar a la ficha de una unidad nueva.
import { describe, expect, it } from "vitest";
import { ERRORES } from "../src/lib/dominio/textos.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { EstadoApp, type DependenciasApp } from "../src/lib/estado/app.svelte.ts";
import type { FichaDeUnidad } from "../src/lib/estado/ficha.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";
import type { ValoresUnidad } from "../src/lib/dominio/formulario-unidad.ts";

const H = "2026-11-18";
const MEDIODIA = "2026-11-18T15:00:00.000Z"; // 12:00 en Argentina

async function iniciada(hash = "#/unidad/ZK214BD", repo = new RepositorioMemoria()) {
  let n = 0;
  const ubicacion = ubicacionEnMemoria(hash);
  const deps: DependenciasApp = {
    reloj: crearReloj(() => new Date(Date.parse(MEDIODIA))),
    abrirAlmacenamiento: async () => repo,
    ubicacion,
    crearAvisoPestanas: () => ({ avisarCambio: () => {}, cerrar: () => {} }),
    nuevoId: () => `nuevo-${++n}`,
  };
  const app = new EstadoApp(deps);
  await app.iniciar();
  return { app, repo, ubicacion };
}

function estadoDe(app: EstadoApp): Estado {
  if (app.estado === null) throw new Error("la aplicación no tiene estado");
  return app.estado;
}

function fichaDe(app: EstadoApp): FichaDeUnidad {
  const f = app.fichaDeUnidad;
  if (f === null || !f.encontrada) throw new Error("no hay ficha de una unidad en esta ruta");
  return f;
}

function idDe(app: EstadoApp, patente: string): string {
  const u = estadoDe(app).unidades.find((x) => x.patente === patente);
  if (u === undefined) throw new Error(`no hay ${patente}`);
  return u.id;
}

const primeros = (app: EstadoApp, n = 1) => fichaDe(app).historial.eventos.slice(0, n).map((e) => e.tipo);

describe("la ficha según la ruta", () => {
  it("antes de iniciar no hay ficha; en #/unidad/ZK214BD, la de esa unidad", async () => {
    const t = new EstadoApp({
      reloj: crearReloj(() => new Date(Date.parse(MEDIODIA))),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion: ubicacionEnMemoria("#/unidad/ZK214BD"),
      crearAvisoPestanas: () => ({ avisarCambio: () => {}, cerrar: () => {} }),
    });
    expect(t.fichaDeUnidad).toBeNull();
    await t.iniciar();
    expect(fichaDe(t)).toMatchObject({ patente: "ZK214BD", patenteTexto: "ZK 214 BD" });
  });

  it("fuera de una ficha no hay ficha; una patente que no existe es «No se encontró la unidad»", async () => {
    expect((await iniciada("#/flota")).app.fichaDeUnidad).toBeNull();
    const { app } = await iniciada("#/unidad/ZZ999ZZ");
    expect(app.fichaDeUnidad).toMatchObject({ encontrada: false, titulo: "No se encontró la unidad", mensaje: "No hay ninguna unidad con la patente ZZ 999 ZZ." });
  });

  it("el conductor no llega a la ficha (la ruta es del encargado)", async () => {
    const { app } = await iniciada();
    await app.cambiarPerfil({ tipo: "conductor", conductorId: "c-07" });
    expect(app.ruta).toEqual({ tipo: "conductor" });
    expect(app.fichaDeUnidad).toBeNull();
  });
});

describe("documentos desde la ficha", () => {
  it("renovar el seguro vencido de ZK 214 BD (C01): mensaje de la ficha, foco en Documentos, evento primero y la unidad ya puede salir", async () => {
    const { app } = await iniciada();
    expect(fichaDe(app).documentos.filas[0]?.estado.texto).toBe("Vencido hace 1 día");
    const r = await app.renovarDocumento("d-0031", { numero: "DEMO-88-5000", emisor: "Seguros Puna Demo", vence: "2027-11-15", emitido: "" }, "ficha");
    expect(r).toEqual({ ok: true, mensaje: "Seguro de ZK 214 BD renovado: vence el 15/11/2027.", foco: "titulo-de-documentos" });
    const f = fichaDe(app);
    expect(primeros(app)).toEqual(["documento-renovado"]);
    expect(f.documentos.filas[0]).toMatchObject({ documentoId: "nuevo-1", estado: { tipo: "vigente", tono: "vigente" }, rotuloAnteriores: "Anteriores (1)" });
    expect(f.aptitud.categoria).toBe("puede-salir");
    expect(f.documentos.rotuloCantidad).toBe("4");
  });

  it("sin el tercer parámetro sigue siendo el de la alerta (paso 4.2): mensaje con los vencimientos que quedan y foco al panel", async () => {
    const { app } = await iniciada();
    const r = await app.renovarDocumento("d-0031", { numero: "DEMO-88-5000", emisor: "", vence: "2027-11-15", emitido: "" });
    expect(r).toEqual({ ok: true, mensaje: "Seguro de ZK 214 BD renovado. Quedan 10 vencimientos.", foco: "titulo-del-panel" });
  });

  it("cargar la habilitación que falta (C10, ZZD 563): el documento aparece vigente y el evento es el primero", async () => {
    const { app } = await iniciada("#/unidad/ZZD563");
    expect(fichaDe(app).documentos.rotuloCantidad).toBe("4 · 1 faltante");
    const r = await app.cargarDocumento({ tipo: "unidad", id: idDe(app, "ZZD563") }, "habilitacion-proyecto", { numero: "DEMO-HAB-9", emisor: "", vence: "2027-11-18", emitido: "" }, "ficha");
    expect(r).toEqual({ ok: true, mensaje: "Habilitación de ingreso al proyecto de ZZD 563 cargada.", foco: "titulo-de-documentos" });
    expect(primeros(app)).toEqual(["documento-cargado"]);
    expect(fichaDe(app).documentos.rotuloCantidad).toBe("4");
    expect(fichaDe(app).aptitud.categoria).toBe("puede-salir");
  });

  it("«Cargar otro documento» (el `select` Tipo): carga la habilitación de ingreso de una unidad de la base, que no la pide", async () => {
    const { app } = await iniciada();
    const base = estadoDe(app).unidades.find((u) => u.proyectoId === "proy-base" && u.estado.tipo === "en-servicio");
    if (base === undefined) throw new Error("falta una unidad en servicio de la base");
    const r = await app.cargarOtroDocumento(base.id, { tipoDocumento: "habilitacion-proyecto", numero: "DEMO-HAB-7", emisor: "", vence: "2027-11-18", emitido: "" });
    expect(r.ok).toBe(true);
    expect(r.ok && r.foco).toBe("titulo-de-documentos");
    expect(r.ok && r.mensaje).toMatch(/^Habilitación de ingreso al proyecto de .+ cargada\.$/);
    const evento = estadoDe(app).eventos.at(-1);
    expect(evento).toMatchObject({ tipo: "documento-cargado", unidadId: base.id });
  });

  it("«Cargar otro documento» sin elegir el tipo: error en el campo Tipo, junto con los demás, y no se guarda nada", async () => {
    const { app } = await iniciada();
    const antes = estadoDe(app);
    const r = await app.cargarOtroDocumento(idDe(app, "ZK214BD"), { tipoDocumento: "", numero: "", emisor: "", vence: "", emitido: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errores.lista.map((x) => x.campo)).toEqual(["tipoDocumento", "numero", "vence"]);
      expect(r.errores.porCampo.tipoDocumento).toBe("Elija el tipo de documento.");
    }
    expect(app.estado).toBe(antes);
  });

  it("código M4: «Cargar otro documento» con un tipo inventado (no ofrecido) lo dice en el campo Tipo y no guarda nada", async () => {
    const { app } = await iniciada();
    const antes = estadoDe(app);
    const r = await app.cargarOtroDocumento(idDe(app, "ZK214BD"), { tipoDocumento: "inventado", numero: "DEMO-1", emisor: "", vence: "2027-11-18", emitido: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.porCampo.tipoDocumento).toBe("Elija el tipo de documento.");
    expect(app.estado).toBe(antes);
  });

  it("corregir el número y el vencimiento: «Seguro … corregido», evento con antes y después y los datos nuevos en la fila", async () => {
    const { app } = await iniciada();
    const doc = estadoDe(app).documentos.find((d) => d.id === "d-0032");
    if (doc === undefined) throw new Error("falta d-0032");
    const r = await app.corregirDocumento("d-0032", { numero: "DEMO-RT-NUEVO", emisor: doc.emisor, vence: "2027-09-10", emitido: doc.emitido ?? "" });
    expect(r).toEqual({ ok: true, mensaje: "Revisión técnica de ZK 214 BD corregida.", foco: "titulo-de-documentos" });
    const f = fichaDe(app);
    expect(primeros(app)).toEqual(["documento-corregido"]);
    const detalle = f.historial.eventos[0]?.detalle;
    expect(detalle?.tipo === "documento-corregido" && detalle.cambios.map((c) => c.campo)).toEqual(["Número", "Vencimiento"]);
    expect(f.documentos.filas[1]).toMatchObject({ numero: "DEMO-RT-NUEVO", vence: "10/09/2027" });
  });

  it("corregir sin cambiar nada: error general «No hay cambios para guardar.»", async () => {
    const { app } = await iniciada();
    const doc = estadoDe(app).documentos.find((d) => d.id === "d-0032");
    if (doc === undefined) throw new Error("falta d-0032");
    const r = await app.corregirDocumento("d-0032", { numero: doc.numero, emisor: doc.emisor, vence: doc.vence, emitido: doc.emitido ?? "" });
    expect(r).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: "No hay cambios para guardar." } });
  });
});

describe("novedades: resolver (N1, N2) y cargar (N3)", () => {
  it("C11: la ficha muestra la crítica de frenos con N2 y A4; resolver con «Volver a servicio ahora» deja novedad-resuelta y vuelta-a-servicio", async () => {
    const { app } = await iniciada("#/unidad/ZU899QE");
    const antes = fichaDe(app);
    expect(antes.novedades.abiertas[0]).toMatchObject({ impideVolver: true, ofreceVolverAServicio: true });
    expect(antes.acciones.encabezado[0]?.bloqueo).toBe("Antes de volver a servicio, resuelva: Frenos (parte del 16/11/2026).");

    const r = await app.resolverNovedad("n-003", { texto: "Se cambiaron las pastillas de freno", volverAServicio: true }, "ficha");
    expect(r).toEqual({ ok: true, mensaje: "Novedad resuelta: Frenos. ZU 899 QE vuelve a servicio.", foco: "titulo-de-novedades" });
    const f = fichaDe(app);
    expect(primeros(app, 2)).toEqual(["vuelta-a-servicio", "novedad-resuelta"]);
    expect(f.aptitud.categoria).toBe("puede-salir");
    expect(f.novedades.rotuloCantidad).toBe("0 abiertas");
    expect(f.novedades.resueltas[0]).toMatchObject({ novedadId: "n-003", resolucion: { texto: "Se cambiaron las pastillas de freno", autor: "Rocío Medina" } });
    expect(f.acciones.encabezado.map((a) => a.id)).toEqual(["cargar-parte", "poner-fuera-de-servicio"]);
  });

  it("N2 desmarcado: solo novedad-resuelta y la unidad sigue fuera de servicio, ahora sin bloqueo para volver", async () => {
    const { app } = await iniciada("#/unidad/ZU899QE");
    const r = await app.resolverNovedad("n-003", { texto: "Se cambiaron las pastillas", volverAServicio: false }, "ficha");
    expect(r).toEqual({ ok: true, mensaje: "Novedad resuelta: Frenos.", foco: "titulo-de-novedades" });
    expect(primeros(app)).toEqual(["novedad-resuelta"]);
    const f = fichaDe(app);
    expect(f.aptitud.categoria).toBe("fuera-de-servicio");
    expect(f.acciones.encabezado).toEqual([{ id: "volver-a-servicio", etiqueta: "Volver a servicio", href: null, bloqueo: null }]);
  });

  it("desde el centro de alertas: el mensaje nombra la unidad, el foco va al título del panel y la operación diaria baja un pendiente", async () => {
    const { app } = await iniciada("#/alertas");
    expect(app.centroDeAlertas?.operacion.total).toBe(6);
    const r = await app.resolverNovedad("n-003", { texto: "Se cambiaron las pastillas", volverAServicio: false });
    expect(r).toEqual({ ok: true, mensaje: "Novedad resuelta: Frenos (ZU 899 QE).", foco: "titulo-del-panel" });
    expect(app.centroDeAlertas?.operacion.total).toBe(5);
  });

  it("un texto de menos de 5 caracteres no resuelve nada: error en el campo y el estado no cambia (N1)", async () => {
    const { app } = await iniciada("#/unidad/ZU899QE");
    const antes = estadoDe(app);
    const r = await app.resolverNovedad("n-003", { texto: "ok", volverAServicio: false }, "ficha");
    expect(r).toMatchObject({ ok: false, errores: { porCampo: { texto: "Cuente en pocas palabras qué se hizo (al menos 5 caracteres)." } } });
    expect(app.estado).toBe(antes);
  });

  it("resolver una novedad que ya se resolvió (otra pestaña) es un error general, no un campo", async () => {
    const { app } = await iniciada("#/unidad/ZU899QE");
    await app.resolverNovedad("n-003", { texto: "Se cambiaron las pastillas", volverAServicio: false }, "ficha");
    const r = await app.resolverNovedad("n-003", { texto: "Se cambiaron las pastillas", volverAServicio: false }, "ficha");
    expect(r).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: "La novedad ya está resuelta." } });
  });

  it("cargar una novedad normal: «Novedad cargada.», evento primero, sin cambiar el estado de la unidad", async () => {
    const { app } = await iniciada();
    const r = await app.cargarNovedad(idDe(app, "ZK214BD"), { descripcion: "Luz de giro quemada", impideUso: false });
    expect(r).toEqual({ ok: true, mensaje: "Novedad cargada.", foco: "titulo-de-novedades" });
    expect(primeros(app)).toEqual(["novedad-abierta"]);
    expect(fichaDe(app).novedades.abiertas[0]).toMatchObject({ estado: "Abierta", origen: "Cargada por el encargado", texto: "Luz de giro quemada" });
    expect(fichaDe(app).aptitud.categoria).toBe("no-puede-salir");
  });

  it("cargar una que impide el uso (N3, A3): la unidad queda fuera de servicio y la novedad impide volver", async () => {
    const { app } = await iniciada("#/unidad/ZYN469");
    const r = await app.cargarNovedad(idDe(app, "ZYN469"), { descripcion: "Pérdida de aceite", impideUso: true });
    expect(r).toEqual({ ok: true, mensaje: "Novedad cargada. ZYN 469 queda fuera de servicio hasta que se resuelva.", foco: "titulo-de-novedades" });
    expect(primeros(app, 2)).toEqual(["fuera-de-servicio", "novedad-abierta"]);
    const f = fichaDe(app);
    expect(f.aptitud.categoria).toBe("fuera-de-servicio");
    expect(f.novedades.abiertas[0]).toMatchObject({ gravedad: "critica", estado: "Crítica", impideVolver: true, ofreceVolverAServicio: true });
    expect(app.centroDeAlertas?.protagonista.cifra).toBe(5);
  });

  it("una descripción vacía es un error de su campo", async () => {
    const { app } = await iniciada();
    const r = await app.cargarNovedad(idDe(app, "ZK214BD"), { descripcion: " ", impideUso: false });
    expect(r).toMatchObject({ ok: false, errores: { porCampo: { descripcion: "Escriba qué pasó." } } });
  });
});

describe("estado de la unidad: fuera de servicio (A6), volver (A4, A5) y baja (A7)", () => {
  it("poner fuera de servicio a mano: mensaje, evento primero, ficha y centro de alertas al día", async () => {
    const { app } = await iniciada("#/unidad/ZYN469");
    const r = await app.ponerFueraDeServicio(idDe(app, "ZYN469"), { motivo: "En taller: cambio de embrague" });
    expect(r).toEqual({ ok: true, mensaje: "ZYN 469 está fuera de servicio.", foco: "titulo-de-la-ficha" });
    expect(primeros(app)).toEqual(["fuera-de-servicio"]);
    const f = fichaDe(app);
    expect(f.aptitud).toMatchObject({ categoria: "fuera-de-servicio", etiqueta: "Fuera de servicio" });
    expect(f.estadoOperativo).toMatchObject({ tipo: "fuera-de-servicio", origen: "manual", desde: "18/11/2026" });
    expect(f.acciones.encabezado.map((a) => a.id)).toEqual(["volver-a-servicio"]);
    expect(app.centroDeAlertas?.protagonista.cifra).toBe(5);
  });

  it("el motivo es obligatorio (A6) y una unidad ya fuera de servicio no se vuelve a poner", async () => {
    const { app } = await iniciada("#/unidad/ZR536MZ");
    expect(await app.ponerFueraDeServicio(idDe(app, "ZR536MZ"), { motivo: "" })).toMatchObject({
      ok: false,
      errores: { porCampo: { motivo: "Escriba el motivo (por ejemplo, «En taller: cambio de embrague»)." } },
    });
    expect(await app.ponerFueraDeServicio(idDe(app, "ZR536MZ"), { motivo: "Otro motivo cualquiera" })).toEqual({
      ok: false,
      errores: { porCampo: {}, lista: [], general: "La unidad ya está fuera de servicio." },
    });
  });

  it("A4: volver a servicio con la crítica abierta se rechaza nombrándola; el estado no cambia", async () => {
    const { app } = await iniciada("#/unidad/ZU899QE");
    const antes = estadoDe(app);
    const r = await app.volverAServicio(idDe(app, "ZU899QE"));
    expect(r).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: "Antes de volver a servicio, resuelva: Frenos (parte del 16/11/2026)." } });
    expect(app.estado).toBe(antes);
  });

  it("volver a servicio una unidad en taller (C12): mensaje, evento primero y ya puede salir", async () => {
    const { app } = await iniciada("#/unidad/ZR536MZ");
    const r = await app.volverAServicio(idDe(app, "ZR536MZ"));
    expect(r).toEqual({ ok: true, mensaje: "ZR 536 MZ vuelve a servicio.", foco: "titulo-de-la-ficha" });
    expect(primeros(app)).toEqual(["vuelta-a-servicio"]);
    expect(fichaDe(app).aptitud.categoria).toBe("puede-salir");
  });

  it("A5: con el seguro vencido vuelve a servicio igual, y el mensaje y la ficha dicen que todavía no puede salir", async () => {
    const { app } = await iniciada();
    await app.ponerFueraDeServicio(idDe(app, "ZK214BD"), { motivo: "En taller: revisión general" });
    const r = await app.volverAServicio(idDe(app, "ZK214BD"));
    expect(r).toEqual({ ok: true, mensaje: "ZK 214 BD vuelve a servicio. Todavía no puede salir: Seguro vencido hace 1 día.", foco: "titulo-de-la-ficha" });
    expect(fichaDe(app).aptitud.categoria).toBe("no-puede-salir");
  });

  it("dar de baja (A7): mensaje, aviso en la ficha, sin acciones, fuera de las alertas y con el historial intacto", async () => {
    const { app } = await iniciada();
    const eventosAntes = fichaDe(app).historial.total;
    const r = await app.darDeBaja(idDe(app, "ZK214BD"), { motivo: "Venta de la unidad" });
    expect(r).toEqual({ ok: true, mensaje: "ZK 214 BD dada de baja. Su historial se conserva.", foco: "titulo-de-la-ficha" });
    const f = fichaDe(app);
    expect(primeros(app)).toEqual(["unidad-baja"]);
    expect(f.historial.total).toBe(eventosAntes + 1);
    expect(f.aviso).toBe("Dada de baja el 18/11/2026: Venta de la unidad. Se conserva su historial.");
    expect(f.acciones).toEqual({ encabezado: [], masAcciones: [] });
    expect(f.documentos.filas.flatMap((x) => x.acciones)).toEqual([]);
    expect(app.centroDeAlertas?.protagonista.cifra).toBe(3);
    expect(app.panelDeFlota?.cantidad).toBe(22);
  });

  it("dar de baja sin motivo no baja nada", async () => {
    const { app } = await iniciada();
    expect(await app.darDeBaja(idDe(app, "ZK214BD"), { motivo: "" })).toMatchObject({ ok: false, errores: { porCampo: { motivo: "Escriba el motivo de la baja." } } });
    expect(fichaDe(app).aptitud.categoria).toBe("no-puede-salir");
  });
});

describe("kilometraje (K5) y asignación (U6)", () => {
  it("corregir el kilometraje: mensaje, evento primero, km nuevo en el encabezado y la corrección primera en el panel", async () => {
    const { app } = await iniciada();
    const r = await app.corregirKilometraje(idDe(app, "ZK214BD"), { desde: H, kmBase: "120", motivo: "Cambio de tablero por avería" });
    expect(r).toEqual({ ok: true, mensaje: "Kilometraje de ZK 214 BD corregido: 120 km.", foco: "titulo-de-kilometraje" });
    const f = fichaDe(app);
    expect(primeros(app)).toEqual(["km-corregido"]);
    expect(f.datos.km).toMatchObject({ valor: 120, texto: "120 km", fecha: "18/11/2026" });
    expect(f.kilometraje.filas[0]).toMatchObject({ tipo: "correccion", texto: "Corrección: 120 km" });
  });

  it("los errores de la corrección salen juntos y por campo; M3 (ya hay un parte posterior) cae en la fecha", async () => {
    const { app } = await iniciada();
    const antes = estadoDe(app);
    const juntos = await app.corregirKilometraje(idDe(app, "ZK214BD"), { desde: "mañana", kmBase: "x", motivo: "corto" });
    expect(juntos.ok === false && juntos.errores.lista.map((x) => x.campo)).toEqual(["desde", "kmBase", "motivo"]);
    const m3 = await app.corregirKilometraje(idDe(app, "ZK214BD"), { desde: "2026-11-10", kmBase: "120", motivo: "Cambio de tablero por avería" });
    expect(m3.ok === false && m3.errores.porCampo.desde).toMatch(/^Ya hay un parte del 17\/11\/2026/);
    expect(app.estado).toBe(antes);
  });

  it("cambiar proyecto: la unidad de la base pasa a Piedra Lunar sin habilitación y aparece el faltante en el acto (U6)", async () => {
    const { app } = await iniciada();
    const base = estadoDe(app).unidades.find((u) => u.proyectoId === "proy-base" && u.estado.tipo === "en-servicio");
    if (base === undefined) throw new Error("falta una unidad en servicio de la base");
    expect(app.centroDeAlertas?.vencimientos.grupos[0]?.cantidad).toBe(2);
    const r = await app.cambiarAsignacion(base.id, { proyectoId: "proy-piedra-lunar", conductorId: base.conductorId ?? "" });
    expect(r).toEqual({ ok: true, mensaje: "Proyecto actualizado. Falta cargar la habilitación de ingreso al proyecto.", foco: "titulo-de-la-ficha" });
    expect(app.centroDeAlertas?.vencimientos.grupos[0]?.cantidad).toBe(3);
    expect(estadoDe(app).eventos.at(-1)).toMatchObject({ tipo: "asignacion-cambiada", unidadId: base.id });
  });

  it("cambiar solo el conductor, y quitarlo; sin cambios es un error general", async () => {
    const { app } = await iniciada();
    const u = estadoDe(app).unidades.find((x) => x.patente === "ZK214BD");
    if (u === undefined) throw new Error("falta ZK214BD");
    const otro = estadoDe(app).conductores.find((c) => c.activo && c.id !== u.conductorId);
    if (otro === undefined) throw new Error("falta otro conductor");
    expect(await app.cambiarAsignacion(u.id, { proyectoId: u.proyectoId, conductorId: otro.id })).toEqual({ ok: true, mensaje: "Conductor actualizado.", foco: "titulo-de-la-ficha" });
    expect(fichaDe(app).datos.conductor).toBe(otro.nombre);
    expect(primeros(app)).toEqual(["asignacion-cambiada"]);
    await app.cambiarAsignacion(u.id, { proyectoId: u.proyectoId, conductorId: "" });
    expect(fichaDe(app).datos.conductor).toBeNull();
    expect(await app.cambiarAsignacion(u.id, { proyectoId: u.proyectoId, conductorId: "" })).toEqual({
      ok: false,
      errores: { porCampo: {}, lista: [], general: "No hay cambios para guardar." },
    });
  });

  it("no elegir proyecto es un error de su campo", async () => {
    const { app } = await iniciada();
    expect(await app.cambiarAsignacion(idDe(app, "ZK214BD"), { proyectoId: "", conductorId: "" })).toMatchObject({
      ok: false,
      errores: { porCampo: { proyectoId: "Elija el proyecto." } },
    });
  });
});

describe("permiso y guardado", () => {
  it("con el perfil Conductor ninguno de los comandos de la ficha se ejecuta (sección 8)", async () => {
    const { app } = await iniciada();
    await app.cambiarPerfil({ tipo: "conductor", conductorId: "c-07" });
    const antes = estadoDe(app);
    const sinPermiso = { ok: false, errores: { porCampo: {}, lista: [], general: ERRORES.sinPermiso } };
    const id = idDe(app, "ZK214BD");
    expect(await app.ponerFueraDeServicio(id, { motivo: "En taller: revisión" })).toEqual(sinPermiso);
    expect(await app.darDeBaja(id, { motivo: "Venta de la unidad" })).toEqual(sinPermiso);
    expect(await app.cargarNovedad(id, { descripcion: "Algo roto", impideUso: false })).toEqual(sinPermiso);
    expect(await app.resolverNovedad("n-003", { texto: "Se arregló", volverAServicio: false }, "ficha")).toEqual(sinPermiso);
    expect(app.estado).toBe(antes);
  });

  it("si no se puede escribir (D10) no cambia nada y el error es general: «No se pudo guardar en este equipo…»", async () => {
    const repo = new RepositorioMemoria();
    const { app } = await iniciada("#/unidad/ZYN469", repo);
    repo.escribir = () => Promise.reject(new Error("cuota agotada"));
    const antes = estadoDe(app);
    const r = await app.ponerFueraDeServicio(idDe(app, "ZYN469"), { motivo: "En taller: cambio de embrague" });
    expect(r).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: ERRORES.noPudoGuardar } });
    expect(app.estado).toBe(antes);
  });

  it("antes de terminar el arranque, todos devuelven «todavía no terminó de cargar»", async () => {
    const t = new EstadoApp({
      reloj: crearReloj(() => new Date(Date.parse(MEDIODIA))),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion: ubicacionEnMemoria(),
    });
    const r = await t.ponerFueraDeServicio("u-07", { motivo: "En taller: cambio de embrague" });
    expect(r).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: ERRORES.sinDatos } });
  });
});

describe("Agregar unidad lleva a la ficha, y ahí se pueden cargar los documentos (4.3 → 4.4)", () => {
  const NUEVA: ValoresUnidad = { patente: "zk 999 aa", interno: "30", tipo: "utilitario", marca: "Peugeot", modelo: "Partner", anio: "2025", proyectoId: "proy-piedra-lunar", conductorId: "" };

  it("al guardar bien navega a #/unidad/ZK999AA y la ficha ya está ahí, con el mensaje de llegada", async () => {
    const { app, ubicacion } = await iniciada("#/flota");
    expect(app.mensajeDeLlegada).toBeNull();
    const r = await app.agregarUnidad(NUEVA);
    expect(r).toMatchObject({ ok: true, href: "#/unidad/ZK999AA", foco: "titulo-de-la-ficha" });
    expect(ubicacion.hash).toBe("#/unidad/ZK999AA");
    expect(app.ruta).toEqual({ tipo: "unidad", patente: "ZK999AA" });
    expect(fichaDe(app)).toMatchObject({ patenteTexto: "ZK 999 AA", interno: "Int. 30" });
    expect(app.mensajeDeLlegada).toBe("Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí.");
    expect(primeros(app)).toEqual(["unidad-alta"]);
  });

  it("«cárguelos desde aquí» es cierto: la ficha lista los 4 faltantes, cada uno con su botón Cargar", async () => {
    const { app } = await iniciada("#/flota");
    await app.agregarUnidad(NUEVA);
    const f = fichaDe(app);
    const faltantes = f.documentos.filas.filter((x) => x.estado.tipo === "faltante");
    expect(faltantes.map((x) => x.tipo)).toEqual(["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"]);
    expect(faltantes.every((x) => x.acciones.length === 1 && x.acciones[0]?.tipo === "cargar")).toBe(true);
    expect(f.documentos.rotuloCantidad).toBe("4 · 4 faltantes");
    expect(f.aptitud).toMatchObject({ categoria: "no-puede-salir", linea: "4 motivos", mostrarLista: true });
    // Y cargar uno desde ahí funciona.
    const r = await app.cargarDocumento({ tipo: "unidad", id: f.unidadId }, "seguro", { numero: "DEMO-S-1", emisor: "", vence: "2027-11-18", emitido: "" }, "ficha");
    expect(r.ok).toBe(true);
    expect(fichaDe(app).documentos.rotuloCantidad).toBe("4 · 3 faltantes");
  });

  it("en la base de mantenimiento faltan 3, y el mensaje lo dice (coincide con lo que muestra la ficha)", async () => {
    const { app } = await iniciada("#/flota");
    const r = await app.agregarUnidad({ ...NUEVA, proyectoId: "proy-base" });
    expect(r.ok && r.mensaje).toBe("Unidad agregada. Le faltan 3 documentos: cárguelos desde aquí.");
    expect(fichaDe(app).documentos.filas.filter((x) => x.estado.tipo === "faltante")).toHaveLength(3);
  });

  it("el mensaje de llegada se va al salir de esa ficha; si no se guardó, no navega", async () => {
    const { app, ubicacion } = await iniciada("#/flota");
    const mal = await app.agregarUnidad({ ...NUEVA, patente: "" });
    expect(mal.ok).toBe(false);
    expect(ubicacion.hash).toBe("#/flota");
    await app.agregarUnidad(NUEVA);
    ubicacion.irA("#/flota");
    expect(app.mensajeDeLlegada).toBeNull();
    ubicacion.irA("#/unidad/ZK999AA");
    expect(app.mensajeDeLlegada).toBeNull();
  });
});
