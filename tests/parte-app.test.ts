// Paso 4.5 (lógica): el inicio del conductor (6.4) y el parte diario (6.5) conectados con el estado de la aplicación, la persistencia y la ruta.
// Aceptación del plan: borrador que sobrevive a una recarga; enviar vacío → resumen de errores; K3 con 1 km menos → error; frenos con novedad → la
// unidad aparece en «No pueden salir» del encargado. Con el ejemplo del generador (H = 2026-11-18): ZYN 469 (Int. 01) es de Andrés Echegaray (c-01),
// con su último parte del 17/11 terminado en 120.720 km; ZK 214 BD (Int. 07) es de Tamara Olivera (c-07) y tiene el seguro vencido (C01).
import { describe, expect, it } from "vitest";
import { ENCARGADA, generar } from "../src/lib/datos/generador.ts";
import { valoresDeParte, valoresIniciales, type ValoresParte } from "../src/lib/dominio/formulario-parte.ts";
import { ERRORES } from "../src/lib/dominio/textos.ts";
import type { Estado, Perfil } from "../src/lib/dominio/tipos.ts";
import { EstadoApp, type DependenciasApp } from "../src/lib/estado/app.svelte.ts";
import type { IndicadorDeGuardado } from "../src/lib/estado/autoguardado.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import type { ParteEnEdicion } from "../src/lib/estado/parte.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";

const H = "2026-11-18";
const MEDIODIA = "2026-11-18T15:00:00.000Z"; // 12:00 en Argentina
const C01: Perfil = { tipo: "conductor", conductorId: "c-01" };
const C07: Perfil = { tipo: "conductor", conductorId: "c-07" };

async function iniciada(opciones: { perfil?: Perfil; patente?: string; fecha?: string; repo?: RepositorioMemoria; reloj?: string } = {}) {
  const repo = opciones.repo ?? new RepositorioMemoria();
  let n = 0;
  const ubicacion = ubicacionEnMemoria("#/");
  const deps: DependenciasApp = {
    reloj: crearReloj(() => new Date(Date.parse(opciones.reloj ?? MEDIODIA))),
    abrirAlmacenamiento: async () => repo,
    ubicacion,
    crearAvisoPestanas: () => ({ avisarCambio: () => {}, cerrar: () => {} }),
    nuevoId: () => `nuevo-${++n}`,
  };
  const app = new EstadoApp(deps);
  await app.iniciar();
  if (opciones.perfil !== undefined) await app.cambiarPerfil(opciones.perfil);
  if (opciones.patente !== undefined) app.irA({ tipo: "parte", patente: opciones.patente, fecha: opciones.fecha ?? H });
  return { app, repo };
}

function estadoDe(app: EstadoApp): Estado {
  if (app.estado === null) throw new Error("la aplicación no tiene estado");
  return app.estado;
}

function edicion(app: EstadoApp): ParteEnEdicion {
  const v = app.parteDeLaRuta;
  if (v === null || v.tipo !== "edicion") throw new Error(`no hay un parte para editar (hay ${v?.tipo ?? "nada"})`);
  return v;
}

function idDe(app: EstadoApp, patente: string): string {
  const u = estadoDe(app).unidades.find((x) => x.patente === patente);
  if (u === undefined) throw new Error(`no hay ${patente}`);
  return u.id;
}

/** Un parte completo: todos los puntos en orden, el fin 100 km más que el inicio y el combustible a la mitad. */
function completo(v: ValoresParte, cambios: Partial<ValoresParte> = {}): ValoresParte {
  const copia = structuredClone(v);
  for (const k of Object.keys(copia.checklist) as (keyof ValoresParte["checklist"])[]) {
    if (copia.checklist[k].respuesta === "") copia.checklist[k] = { respuesta: "en-orden", descripcion: "", impideUso: false };
  }
  const inicio = Number(copia.kmInicio.replace(/\./g, ""));
  return { ...copia, kmFin: copia.kmFin === "" ? String(inicio + 100) : copia.kmFin, combustible: copia.combustible === "" ? "medio" : copia.combustible, ...cambios };
}

const eventos = (app: EstadoApp) => estadoDe(app).eventos.map((e) => e.tipo);

describe("las vistas según la ruta y el perfil", () => {
  it("antes de iniciar no hay parte; fuera de #/parte/… tampoco", async () => {
    const t = new EstadoApp({
      reloj: crearReloj(() => new Date(Date.parse(MEDIODIA))),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion: ubicacionEnMemoria("#/parte/ZYN469/2026-11-18"),
      crearAvisoPestanas: () => ({ avisarCambio: () => {}, cerrar: () => {} }),
    });
    expect(t.parteDeLaRuta).toBeNull();
    expect(t.inicioDelConductor()).toBeNull();
    await t.iniciar();
    expect(t.parteDeLaRuta?.tipo).toBe("edicion");
    const { app } = await iniciada();
    expect(app.parteDeLaRuta).toBeNull(); // #/alertas
  });

  it("perfil Conductor en #/parte/ZYN469/…: el parte nuevo con su kilometraje inicial (P13) y el conductor fijo", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const v = edicion(app);
    expect(v).toMatchObject({ patenteTexto: "ZYN 469", interno: "Int. 01", parteId: null, borrador: null, conductor: { tipo: "fijo", id: "c-01", nombre: "Andrés Echegaray" } });
    expect(v.valoresIniciales).toMatchObject({ conductorId: "c-01", kmInicio: "120.720" });
    expect(v.ayudaKmInicio).toBe("Último registro: 120.720 km (parte del 17/11/2026).");
  });

  it("perfil Encargado: el conductor se elige y arranca con el asignado", async () => {
    const { app } = await iniciada({ patente: "ZYN469" });
    const v = edicion(app);
    expect(v.conductor.tipo).toBe("elegir");
    expect(v.valoresIniciales.conductorId).toBe("c-01");
  });

  it("el inicio del conductor: su unidad, «Empezar el parte» y el aviso de que ZK 214 BD no puede salir (C01)", async () => {
    const { app } = await iniciada({ perfil: C07 });
    const v = app.inicioDelConductor();
    expect(v).toMatchObject({
      unidad: { patenteTexto: "ZK 214 BD", interno: "Int. 07" },
      hoyEstado: { tipo: "sin-parte", primario: { texto: "Empezar el parte", href: "#/parte/ZK214BD/2026-11-18" } },
      avisoAptitud: "ZK 214 BD no puede salir: Seguro vencido hace 1 día. Avise al encargado antes de usarla.",
    });
    expect(app.inicioDelConductor("u-01")?.unidad?.patenteTexto).toBe("ZYN 469");
  });

  it("el perfil Encargado no tiene inicio del conductor", async () => {
    const { app } = await iniciada();
    expect(app.inicioDelConductor()).toBeNull();
  });

  it("C13: el conductor de ZW 749 JE tiene el borrador de ayer entre sus pendientes y la unidad lo avisa en el inicio", async () => {
    const { app } = await iniciada({ perfil: { tipo: "conductor", conductorId: "c-13" } });
    const v = app.inicioDelConductor();
    expect(v?.pendientes).toEqual([
      { clave: "pt-0579", tipo: "borrador", texto: "ZW 749 JE: el parte del 17/11/2026 está empezado y sin enviar.", accion: { texto: "Continuarlo", href: "#/parte/ZW749JE/2026-11-17" } },
    ]);
  });
});

describe("autoguardado del borrador (P3) y recarga", () => {
  it("guardar un borrador con lo escrito: queda en el estado y en el repositorio, sin eventos y sin tocar el kilometraje (K9)", async () => {
    const { app, repo } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const v = completo(edicion(app).valoresIniciales, { kmFin: "120.800" });
    v.checklist.frenos = { respuesta: "", descripcion: "", impideUso: false };
    const eventosAntes = eventos(app).length;
    const r = await app.guardarBorradorDeParte(idDe(app, "ZYN469"), H, v);
    expect(r).toEqual({ ok: true, parteId: "nuevo-1", hora: "12:00", sinCambios: false });
    const guardado = (await repo.cargar())?.partes.find((p) => p.id === "nuevo-1");
    expect(guardado).toMatchObject({ estado: "borrador", unidadId: idDe(app, "ZYN469"), fecha: H, conductorId: "c-01", kmInicio: 120720, kmFin: 120800, combustible: "medio" });
    expect(guardado?.checklist.frenos).toEqual({ estado: "sin-responder" });
    expect(eventos(app)).toHaveLength(eventosAntes);
    expect(estadoDe(app).meta.modificada).toBe(true);
    expect(app.alertas?.resumen.noPuedenSalir.some((u) => u.patente === "ZYN469")).toBe(false);
  });

  it("recargar a mitad del parte: el borrador está, con lo escrito, y la vista lo dice (criterio del plan)", async () => {
    const { app, repo } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const v = completo(edicion(app).valoresIniciales, { kmFin: "120.800", litros: "45,5" });
    v.checklist.luces = { respuesta: "con-novedad", descripcion: "Una baliza no enciende", impideUso: false };
    await app.guardarBorradorDeParte(idDe(app, "ZYN469"), H, v);
    app.cerrar();

    // «Recarga»: otra instancia de la aplicación sobre el mismo almacenamiento.
    const otra = await iniciada({ repo, patente: "ZYN469" });
    expect(estadoDe(otra.app).meta.perfil).toEqual(C01); // el perfil también se conserva
    const w = edicion(otra.app);
    expect(w.parteId).toBe("nuevo-1");
    expect(w.valoresIniciales).toEqual(v);
    expect(w.borrador).toEqual({ mensaje: "Borrador recuperado, guardado en este equipo el 18/11/2026 a las 12:00." });
    expect(w.valoresIniciales.checklist.luces).toEqual({ respuesta: "con-novedad", descripcion: "Una baliza no enciende", impideUso: false });
  });

  it("guardar de nuevo actualiza el mismo borrador (no crea otro: P1)", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const uid = idDe(app, "ZYN469");
    const v = edicion(app).valoresIniciales;
    await app.guardarBorradorDeParte(uid, H, { ...v, kmFin: "120.730" });
    const r = await app.guardarBorradorDeParte(uid, H, { ...v, kmFin: "120.790" });
    expect(r).toMatchObject({ ok: true, parteId: "nuevo-1" });
    const borradores = estadoDe(app).partes.filter((p) => p.unidadId === uid && p.fecha === H);
    expect(borradores).toHaveLength(1);
    expect(borradores[0]?.kmFin).toBe(120790);
  });

  it("dos guardados al mismo tiempo (autoguardado y salir del campo) no duplican el borrador", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const uid = idDe(app, "ZYN469");
    const v = edicion(app).valoresIniciales;
    const [a, b] = await Promise.all([app.guardarBorradorDeParte(uid, H, { ...v, kmFin: "120.730" }), app.guardarBorradorDeParte(uid, H, { ...v, kmFin: "120.790" })]);
    expect(a).toMatchObject({ ok: true });
    expect(b).toMatchObject({ ok: true });
    expect(estadoDe(app).partes.filter((p) => p.unidadId === uid && p.fecha === H)).toHaveLength(1);
    expect(estadoDe(app).partes.find((p) => p.unidadId === uid && p.fecha === H)?.kmFin).toBe(120790);
  });

  it("D11: abrir el parte y no escribir nada no guarda un borrador ni marca la demo como modificada", async () => {
    const { app, repo } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const antes = (await repo.cargar())?.partes.length;
    const r = await app.guardarBorradorDeParte(idDe(app, "ZYN469"), H, edicion(app).valoresIniciales);
    expect(r).toEqual({ ok: true, parteId: null, hora: null, sinCambios: true });
    expect((await repo.cargar())?.partes.length).toBe(antes);
    expect(estadoDe(app).meta.modificada).toBe(false);
  });

  it("P3: un kilometraje con letras no se guarda y se avisa en el campo", async () => {
    const { app, repo } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const antes = await repo.cargar();
    const r = await app.guardarBorradorDeParte(idDe(app, "ZYN469"), H, { ...edicion(app).valoresIniciales, kmFin: "12x" });
    expect(r.ok).toBe(false);
    if (r.ok || r.tipo !== "campos") throw new Error("tenía que ser un error de campo");
    expect(r.errores.porCampo.kmFin).toBe(ERRORES.kmNoNumerico);
    expect(await repo.cargar()).toEqual(antes);
  });

  it("D10: si falla la escritura no cambia nada y el error es de escritura", async () => {
    const { app, repo } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const antes = app.estado;
    repo.escribir = () => Promise.reject(new Error("cuota agotada"));
    const r = await app.guardarBorradorDeParte(idDe(app, "ZYN469"), H, { ...edicion(app).valoresIniciales, kmFin: "120.800" });
    expect(r).toMatchObject({ ok: false, tipo: "escritura", errores: { general: ERRORES.noPudoGuardarElParte } });
    expect(app.estado).toBe(antes);
  });

  it("con el perfil Conductor el conductor del borrador es siempre quien lo completa, aunque el formulario traiga otro", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    await app.guardarBorradorDeParte(idDe(app, "ZYN469"), H, { ...edicion(app).valoresIniciales, conductorId: "c-02", kmFin: "120.800" });
    expect(estadoDe(app).partes.find((p) => p.id === "nuevo-1")?.conductorId).toBe("c-01");
  });

  it("con el perfil Encargado se guarda el conductor elegido", async () => {
    const { app } = await iniciada({ patente: "ZYN469" });
    await app.guardarBorradorDeParte(idDe(app, "ZYN469"), H, { ...edicion(app).valoresIniciales, conductorId: "c-02", kmFin: "120.800" });
    expect(estadoDe(app).partes.find((p) => p.id === "nuevo-1")?.conductorId).toBe("c-02");
  });

  it("P8: una unidad fuera de servicio no recibe borradores (ZU 899 QE, C11): error de regla con el mensaje", async () => {
    const { app } = await iniciada({ perfil: { tipo: "conductor", conductorId: "c-11" } });
    const v = valoresIniciales({ conductorId: "c-11", kmInicio: 31074 });
    const r = await app.guardarBorradorDeParte(idDe(app, "ZU899QE"), H, { ...v, kmFin: "31.100" });
    expect(r).toMatchObject({ ok: false, tipo: "regla" });
    if (!r.ok) expect(r.errores.general).toMatch(/^La unidad está fuera de servicio desde el 16\/11\/2026/);
  });

  it("P2: una fecha de hace más de 7 días y una futura: error de regla", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const v = { ...edicion(app).valoresIniciales, kmFin: "120.800" };
    const vieja = await app.guardarBorradorDeParte(idDe(app, "ZYN469"), "2026-09-01", v); // el ejemplo tiene partes de H - 45 en adelante
    expect(vieja).toMatchObject({ ok: false, tipo: "regla" });
    if (!vieja.ok) expect(vieja.errores.general).toBe("Solo se pueden cargar partes de los últimos 7 días.");
    const futura = await app.guardarBorradorDeParte(idDe(app, "ZYN469"), "2026-11-19", v);
    expect(futura).toMatchObject({ ok: false, tipo: "regla" });
    if (!futura.ok) expect(futura.errores.general).toBe("La fecha no puede ser posterior a hoy.");
  });

  it("una unidad que no existe: error de regla", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const r = await app.guardarBorradorDeParte("no-existe", H, { ...edicion(app).valoresIniciales, kmFin: "1" });
    expect(r).toMatchObject({ ok: false, tipo: "regla" });
    if (!r.ok) expect(r.errores.general).toBe(ERRORES.unidadInexistente);
  });

  it("P7: no se guarda un borrador sobre un parte ya enviado", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const uid = idDe(app, "ZYN469");
    await app.enviarParte(uid, H, completo(edicion(app).valoresIniciales));
    const r = await app.guardarBorradorDeParte(uid, H, { ...valoresIniciales({ conductorId: "c-01", kmInicio: 1 }), kmFin: "5" });
    expect(r).toMatchObject({ ok: false, tipo: "regla" });
    if (!r.ok) expect(r.errores.general).toBe(ERRORES.parteEnviadoInmutable);
  });

  it("el autoguardado conectado a la aplicación: tecla, 500 ms y queda guardado (con el indicador)", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const v = edicion(app);
    const indicadores: IndicadorDeGuardado[] = [];
    let accion: (() => void) | null = null;
    const auto = app.autoguardadoDeParte(v, (i) => indicadores.push(i), { programar: (f) => (accion = f), cancelar: () => (accion = null) });
    auto.cambio({ ...v.valoresIniciales, kmFin: "120.800" });
    expect(estadoDe(app).partes.some((p) => p.id === "nuevo-1")).toBe(false);
    (accion as (() => void) | null)?.();
    await auto.vaciar();
    await new Promise((r) => setTimeout(r, 0));
    expect(estadoDe(app).partes.find((p) => p.id === "nuevo-1")?.kmFin).toBe(120800);
    expect(auto.indicador).toMatchObject({ estado: "guardado", visible: "Guardado en este equipo a las 12:00" });
    expect(edicion(app).parteId).toBe("nuevo-1");
  });
});

describe("código B9: un guardado pendiente no cambia de dueño si cambia el perfil", () => {
  it("el formulario del Encargado se destruye al pasar a Conductor y guarda lo pendiente: queda con el conductor y el autor del Encargado", async () => {
    const { app } = await iniciada({ patente: "ZYN469" });
    const v = edicion(app);
    const auto = app.autoguardadoDeParte(v, () => {});
    const valores = { ...v.valoresIniciales, conductorId: "c-02", kmFin: "120.800" };
    auto.cambio(valores);
    await app.cambiarPerfil(C07); // el `{#key}` de la pantalla destruye el formulario, que guarda lo pendiente ya con el perfil nuevo
    await auto.vaciar(valores);
    const guardado = estadoDe(app).partes.find((p) => p.unidadId === idDe(app, "ZYN469") && p.fecha === H);
    expect(guardado).toMatchObject({ estado: "borrador", conductorId: "c-02", kmFin: 120800 });
    expect(guardado?.autor).toBe(ENCARGADA);
  });

  it("al revés: el formulario del Conductor guarda como ese conductor aunque ya se haya pasado a Encargado", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const v = edicion(app);
    const auto = app.autoguardadoDeParte(v, () => {});
    const valores = { ...v.valoresIniciales, kmFin: "120.800" };
    auto.cambio(valores);
    await app.cambiarPerfil({ tipo: "encargado" });
    await auto.vaciar(valores);
    const guardado = estadoDe(app).partes.find((p) => p.unidadId === idDe(app, "ZYN469") && p.fecha === H);
    expect(guardado).toMatchObject({ estado: "borrador", conductorId: "c-01", kmFin: 120800, autor: estadoDe(app).conductores.find((c) => c.id === "c-01")?.nombre });
  });
});

describe("código B8: guardar dos veces lo mismo no escribe dos veces", () => {
  it("el formulario guarda («vaciar») y después envía: el borrador se escribe una sola vez y el envío, una", async () => {
    const { app, repo } = await iniciada({ perfil: C01, patente: "ZYN469" });
    let escrituras = 0;
    const escribir = repo.escribir.bind(repo);
    repo.escribir = async (...args: Parameters<typeof escribir>) => {
      escrituras += 1;
      return escribir(...args);
    };
    const v = edicion(app);
    const auto = app.autoguardadoDeParte(v, () => {});
    const valores = completo(v.valoresIniciales);
    await auto.vaciar(valores);
    expect(escrituras).toBe(1);
    const r = await app.enviarParte(idDe(app, "ZYN469"), H, valores);
    expect(r.tipo).toBe("enviado");
    expect(escrituras).toBe(2);
  });

  it("guardar el mismo borrador por segunda vez devuelve la misma hora y no cambia `actualizado`", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const v = edicion(app);
    const uid = idDe(app, "ZYN469");
    const valores = { ...v.valoresIniciales, kmFin: "120.800" };
    const a = await app.guardarBorradorDeParte(uid, H, valores);
    const antes = estadoDe(app).partes.find((p) => p.id === "nuevo-1");
    const b = await app.guardarBorradorDeParte(uid, H, valores);
    expect(a).toMatchObject({ ok: true, hora: "12:00" });
    expect(b).toMatchObject({ ok: true, parteId: "nuevo-1", hora: "12:00" });
    expect(estadoDe(app).partes.find((p) => p.id === "nuevo-1")).toBe(antes);
  });

  it("si algo cambió, sí se escribe", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469", reloj: MEDIODIA });
    const v = edicion(app);
    const uid = idDe(app, "ZYN469");
    await app.guardarBorradorDeParte(uid, H, { ...v.valoresIniciales, kmFin: "120.800" });
    const antes = estadoDe(app).partes.find((p) => p.id === "nuevo-1");
    await app.guardarBorradorDeParte(uid, H, { ...v.valoresIniciales, kmFin: "120.900" });
    expect(estadoDe(app).partes.find((p) => p.id === "nuevo-1")?.kmFin).toBe(120900);
    expect(estadoDe(app).partes.find((p) => p.id === "nuevo-1")).not.toBe(antes);
  });
});

describe("enviar el parte (P4, P12, K2, K3)", () => {
  it("enviar vacío: resumen de errores con los 12 datos que faltan, en el orden del formulario, con el foco en el resumen; no se guarda nada", async () => {
    const { app, repo } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const antes = await repo.cargar();
    const r = await app.enviarParte(idDe(app, "ZYN469"), H, edicion(app).valoresIniciales);
    expect(r.tipo).toBe("errores");
    if (r.tipo !== "errores") return;
    expect(r.foco).toBe("resumen-de-errores");
    expect(r.errores.titulo).toBe("Faltan 12 datos para enviar el parte");
    expect(r.errores.lista.map((e) => e.campo)).toEqual(["kmFin", "frenos", "direccion", "neumaticos", "luces", "cinturones", "niveles", "matafuego", "botiquin", "documentacion", "cabina", "combustible"]);
    expect(r.primerCampo).toBe("kmFin");
    expect(await repo.cargar()).toEqual(antes);
  });

  it("enviar con faltantes igual guarda lo escrito como borrador (no se pierde lo de los últimos 500 ms)", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const v = { ...edicion(app).valoresIniciales, kmFin: "120.800" };
    const r = await app.enviarParte(idDe(app, "ZYN469"), H, v);
    expect(r.tipo).toBe("errores");
    const p = estadoDe(app).partes.find((x) => x.id === "nuevo-1");
    expect(p).toMatchObject({ estado: "borrador", kmFin: 120800 });
    expect(r.tipo === "errores" && r.errores.titulo).toBe("Faltan 11 datos para enviar el parte");
  });

  it("enviar completo: el parte queda enviado con su panel, sus eventos y el kilometraje nuevo; la vista pasa a lectura", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const uid = idDe(app, "ZYN469");
    const r = await app.enviarParte(uid, H, completo(edicion(app).valoresIniciales, { litros: "45,5" }));
    expect(r.tipo).toBe("enviado");
    if (r.tipo !== "enviado") return;
    expect(r).toMatchObject({ yaEnviado: false, foco: "titulo-del-parte-enviado" });
    expect(r.panel).toMatchObject({
      titulo: "Parte enviado",
      linea: "ZYN 469, 18/11/2026, enviado a las 12:00.",
      filas: [
        { rotulo: "Recorrido", valor: "100 km (120.720 → 120.820)" },
        { rotulo: "Combustible", valor: "1/2" },
        { rotulo: "Combustible cargado", valor: "Cargó 45,5 litros" },
        { rotulo: "Novedades", valor: "Sin novedades" },
      ],
      avisoCritica: null,
    });
    expect(eventos(app).at(-1)).toBe("parte-enviado");
    expect(estadoDe(app).partes.find((p) => p.unidadId === uid && p.fecha === H)).toMatchObject({ estado: "enviado", autor: "Andrés Echegaray", conductorId: "c-01" });
    expect(app.parteDeLaRuta?.tipo).toBe("lectura");
    expect(app.inicioDelConductor()?.hoyEstado).toEqual({ tipo: "enviado", etiqueta: "Enviado a las 12:00", enlace: { texto: "Ver el parte", href: "#/parte/ZYN469/2026-11-18" } });
    expect(app.inicioDelConductor()?.ultimosPartes.filas[0]).toMatchObject({ fecha: "18/11/2026", recorrido: "100 km" });
  });

  it("K3: con 1 km menos que el último registro, error en «Al iniciar», el envío se bloquea y el borrador queda", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const uid = idDe(app, "ZYN469");
    const eventosAntes = eventos(app).length;
    const r = await app.enviarParte(uid, H, completo(edicion(app).valoresIniciales, { kmInicio: "120.719", kmFin: "120.800" }));
    expect(r.tipo).toBe("errores");
    if (r.tipo !== "errores") return;
    expect(r.errores.porCampo.kmInicio).toBe("El último registro de ZYN 469 es 120.720 km (parte del 17/11/2026). Revise el número. Si se cambió el tablero, hay que informarlo al encargado.");
    expect(r.errores.titulo).toBe("Revise 1 dato para enviar el parte");
    expect(r.primerCampo).toBe("kmInicio");
    const p = estadoDe(app).partes.find((x) => x.unidadId === uid && x.fecha === H);
    expect(p).toMatchObject({ estado: "borrador", kmInicio: 120719, kmFin: 120800 });
    expect(eventos(app)).toHaveLength(eventosAntes); // no se envió: ni parte ni novedades ni cambio de estado
  });

  it("K3: con el mismo kilometraje que el último registro se puede enviar (K3 pide ≥)", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const r = await app.enviarParte(idDe(app, "ZYN469"), H, completo(edicion(app).valoresIniciales, { kmInicio: "120.720", kmFin: "120.720" }));
    expect(r.tipo === "enviado" && r.panel.filas[0]?.valor).toBe("Sin uso (120.720 → 120.720)");
  });

  it("K2: el fin menor que el inicio, error en «Al terminar»", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const r = await app.enviarParte(idDe(app, "ZYN469"), H, completo(edicion(app).valoresIniciales, { kmFin: "120.700" }));
    expect(r.tipo === "errores" && r.errores.porCampo.kmFin).toBe("El kilometraje al terminar (120.700 km) es menor que al iniciar (120.720 km). Revise los dos números.");
  });

  it("un kilometraje con letras al enviar: error de formato en el campo, junto con los faltantes", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const r = await app.enviarParte(idDe(app, "ZYN469"), H, completo(edicion(app).valoresIniciales, { kmFin: "12x", combustible: "" }));
    expect(r.tipo === "errores" && r.errores.lista.map((e) => e.campo)).toEqual(["kmFin", "combustible"]);
  });

  it("frenos con novedad: se envía, la unidad queda fuera de servicio y aparece en «No pueden salir» del encargado (criterio del plan)", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const uid = idDe(app, "ZYN469");
    const v = completo(edicion(app).valoresIniciales);
    v.checklist.frenos = { respuesta: "con-novedad", descripcion: "Pedal blando y ruido al frenar", impideUso: false };
    await app.cambiarPerfil({ tipo: "encargado" });
    const horizonteAntes = JSON.stringify(app.centroDeAlertas?.vencimientos.horizonte);
    const criticasAntes = app.centroDeAlertas?.operacion.filas.find((f) => f.tipo === "novedad-critica")?.cifra ?? 0;
    await app.cambiarPerfil(C01);
    const r = await app.enviarParte(uid, H, v);
    expect(r.tipo).toBe("enviado");
    if (r.tipo !== "enviado") return;
    expect(r.panel.filas.find((f) => f.rotulo === "Novedades")?.valor).toBe("1 crítica: Frenos");
    expect(r.panel.avisoCritica).toBe("La unidad quedó fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio.");
    expect(eventos(app).slice(-3)).toEqual(["parte-enviado", "novedad-abierta", "fuera-de-servicio"]);

    // El encargado lo ve en el centro de alertas, sin recargar.
    await app.cambiarPerfil({ tipo: "encargado" });
    const protagonista = app.centroDeAlertas?.protagonista;
    expect(protagonista?.cifra).toBe(5); // eran 4 (C01, C10, C11, C12)
    expect(protagonista?.items.find((i) => i.patente === "ZYN469")).toMatchObject({ categoria: "fuera-de-servicio", patenteTexto: "ZYN 469" });
    expect(app.alertas?.resumen.fueraDeServicio.map((u) => u.patente)).toContain("ZYN469");
    expect(app.alertas?.alertas.some((a) => a.tipo === "novedad-critica" && a.unidadId === uid)).toBe(true);
    expect(app.centroDeAlertas?.operacion.filas.find((f) => f.tipo === "novedad-critica")?.cifra).toBe(criticasAntes + 1);
    // El parte no toca los vencimientos: el Horizonte queda igual.
    expect(JSON.stringify(app.centroDeAlertas?.vencimientos.horizonte)).toBe(horizonteAntes);
    // Y es la pantalla de la unidad la que dice por qué.
    app.irA({ tipo: "unidad", patente: "ZYN469" });
    expect(app.fichaDeUnidad && app.fichaDeUnidad.encontrada && app.fichaDeUnidad.aptitud.categoria).toBe("fuera-de-servicio");
  });

  it("un punto no crítico con «Impide usar la unidad» también deja la unidad fuera de servicio (P11)", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const v = completo(edicion(app).valoresIniciales);
    v.checklist.cabina = { respuesta: "con-novedad", descripcion: "Vidrio roto", impideUso: true };
    const r = await app.enviarParte(idDe(app, "ZYN469"), H, v);
    expect(r.tipo === "enviado" && r.panel.avisoCritica).not.toBeNull();
    expect(app.alertas?.resumen.fueraDeServicio.map((u) => u.patente)).toContain("ZYN469");
  });

  it("una novedad normal no cambia el estado de la unidad ni suma a «No pueden salir»", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const v = completo(edicion(app).valoresIniciales);
    v.checklist.cabina = { respuesta: "con-novedad", descripcion: "Sucia", impideUso: false };
    const r = await app.enviarParte(idDe(app, "ZYN469"), H, v);
    expect(r.tipo === "enviado" && r.panel.avisoCritica).toBeNull();
    expect(app.alertas?.resumen.protagonista).toBe(4);
    expect(eventos(app).slice(-2)).toEqual(["parte-enviado", "novedad-abierta"]);
  });

  it("un salto absurdo (de 120.720 a 1.500.000 km) no es un error: pide aceptar la advertencia y, aceptada, queda registrado como kilometraje actual", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const uid = idDe(app, "ZYN469");
    const v = completo(edicion(app).valoresIniciales, { kmInicio: "1.500.000", kmFin: "1.500.100" });
    const r = await app.enviarParte(uid, H, v);
    expect(r.tipo === "advertencias" && r.advertencias[0]?.texto).toBe("1.379.280 km sin registrar desde el último parte");
    expect((await app.enviarParte(uid, H, v, ["salto-km"])).tipo).toBe("enviado");
    expect(app.inicioDelConductor()?.unidad?.ultimoRegistro).toBe("Último registro: 1.500.100 km (parte del 18/11/2026).");
  });

  it("más de 2.000.000 km es un error de formato, no una advertencia", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const r = await app.enviarParte(idDe(app, "ZYN469"), H, completo(edicion(app).valoresIniciales, { kmInicio: "2.000.001", kmFin: "2.000.100" }));
    expect(r.tipo === "errores" && r.errores.porCampo.kmInicio).toBe("El kilometraje no puede superar 2.000.000 km.");
  });

  it("encargado y una unidad sin conductor asignado (ZW 827 VD): hay que elegir quién conduce; con uno elegido, se envía a su nombre", async () => {
    const { app } = await iniciada({ patente: "ZW827VD" });
    const uid = idDe(app, "ZW827VD");
    const v = edicion(app);
    expect(v.valoresIniciales.conductorId).toBe("");
    const sin = await app.enviarParte(uid, H, completo(v.valoresIniciales));
    expect(sin.tipo === "errores" && sin.errores.lista[0]).toEqual({ campo: "conductor", mensaje: "Elija quién conduce la unidad." });
    expect(sin.tipo === "errores" && sin.primerCampo).toBe("conductor");
    const con = await app.enviarParte(uid, H, completo(v.valoresIniciales, { conductorId: "c-02" }));
    expect(con.tipo).toBe("enviado");
    expect(estadoDe(app).partes.find((p) => p.unidadId === uid && p.fecha === H)).toMatchObject({ conductorId: "c-02", autor: "Rocío Medina", estado: "enviado" });
  });

  it("K6: un salto de más de 1.000 km pide aceptar la advertencia; el borrador queda y al aceptar se envía", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const uid = idDe(app, "ZYN469");
    const v = completo(edicion(app).valoresIniciales, { kmInicio: "121.800", kmFin: "121.900" });
    const r = await app.enviarParte(uid, H, v);
    expect(r.tipo).toBe("advertencias");
    if (r.tipo !== "advertencias") return;
    expect(r.foco).toBe("dialogo-antes-de-enviar");
    expect(r.advertencias).toEqual([{ tipo: "salto-km", texto: "1.080 km sin registrar desde el último parte", tono: "semana" }]);
    expect(r.aceptables).toEqual(["salto-km"]);
    expect(estadoDe(app).partes.find((p) => p.unidadId === uid && p.fecha === H)?.estado).toBe("borrador");

    const e = await app.enviarParte(uid, H, v, r.aceptables);
    expect(e.tipo).toBe("enviado");
    expect(e.tipo === "enviado" && e.panel.advertencias).toEqual(["1.080 km sin registrar desde el último parte"]);
  });

  it("aceptar solo una de varias advertencias no alcanza: vuelve a pedir la que falta", async () => {
    const { app } = await iniciada({ perfil: C07, patente: "ZK214BD" });
    const uid = idDe(app, "ZK214BD");
    // ZK 214 BD tiene el seguro vencido (P9) y se carga un recorrido de 1.300 km (K7).
    const v = completo(edicion(app).valoresIniciales, { kmFin: "164.427" });
    const primera = await app.enviarParte(uid, H, v);
    expect(primera.tipo === "advertencias" && primera.aceptables).toEqual(["recorrido-largo", "documentacion-vencida"]);
    expect(primera.tipo === "advertencias" && primera.advertencias.map((a) => a.tono)).toEqual(["semana", "critico"]);
    const segunda = await app.enviarParte(uid, H, v, ["recorrido-largo"]);
    expect(segunda.tipo === "advertencias" && segunda.aceptables).toEqual(["documentacion-vencida"]);
    const tercera = await app.enviarParte(uid, H, v, ["recorrido-largo", "documentacion-vencida"]);
    expect(tercera.tipo).toBe("enviado");
    expect(estadoDe(app).partes.find((p) => p.unidadId === uid && p.fecha === H)?.documentacionVencida).toEqual(["seguro"]);
    // P9: la alerta «Circuló con documentación vencida» aparece.
    expect(app.alertas?.alertas.some((a) => a.tipo === "uso-con-documentacion-vencida" && a.unidadId === uid)).toBe(true);
  });

  it("doble envío (doble clic): se envía una sola vez y la segunda respuesta es el mismo parte, marcado como ya enviado", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const uid = idDe(app, "ZYN469");
    const v = completo(edicion(app).valoresIniciales);
    const enviadosAntes = eventos(app).filter((t) => t === "parte-enviado").length;
    const [a, b] = await Promise.all([app.enviarParte(uid, H, v), app.enviarParte(uid, H, v)]);
    expect(a).toMatchObject({ tipo: "enviado", yaEnviado: false });
    expect(b).toMatchObject({ tipo: "enviado", yaEnviado: true });
    expect(eventos(app).filter((t) => t === "parte-enviado")).toHaveLength(enviadosAntes + 1);
    expect(estadoDe(app).partes.filter((p) => p.unidadId === uid && p.fecha === H)).toHaveLength(1);
  });

  it("enviar un parte que ya estaba enviado (otra pestaña, recarga): no cambia nada y devuelve el panel", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const uid = idDe(app, "ZYN469");
    await app.enviarParte(uid, H, completo(edicion(app).valoresIniciales));
    const antes = app.estado;
    const r = await app.enviarParte(uid, H, completo(valoresIniciales({ conductorId: "c-01", kmInicio: 5 })));
    expect(r).toMatchObject({ tipo: "enviado", yaEnviado: true });
    expect(app.estado).toBe(antes);
  });

  it("P12: si falla la escritura del envío no queda nada a medias: el parte sigue siendo un borrador igual al anterior y el mensaje lo dice", async () => {
    const { app, repo } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const uid = idDe(app, "ZYN469");
    const v = completo(edicion(app).valoresIniciales);
    v.checklist.frenos = { respuesta: "con-novedad", descripcion: "Ruido", impideUso: false };
    await app.guardarBorradorDeParte(uid, H, v);
    const borrador = estadoDe(app).partes.find((p) => p.id === "nuevo-1");
    // El envío escribe eventos y el borrador no: falla solo el envío.
    const escribir = repo.escribir.bind(repo);
    repo.escribir = (cambios, evs) => (evs.length > 0 ? Promise.reject(new Error("transacción abortada")) : escribir(cambios, evs));
    const r = await app.enviarParte(uid, H, v);
    expect(r.tipo).toBe("errores");
    if (r.tipo !== "errores") return;
    expect(r.errores.general).toBe(ERRORES.noPudoGuardarElParte);
    expect(r.errores.titulo).toBe("No se pudo enviar el parte");
    expect(estadoDe(app).partes.find((p) => p.id === "nuevo-1")).toEqual(borrador);
    expect(estadoDe(app).novedades.some((n) => n.origen.tipo === "parte" && n.origen.parteId === "nuevo-1")).toBe(false);
    expect(estadoDe(app).unidades.find((u) => u.id === uid)?.estado.tipo).toBe("en-servicio");
    const guardado = await repo.cargar();
    expect(guardado?.partes.find((p) => p.id === "nuevo-1")).toEqual(borrador);
    // Con el almacenamiento de vuelta, el mismo envío sale bien.
    repo.escribir = escribir;
    expect((await app.enviarParte(uid, H, v)).tipo).toBe("enviado");
  });

  it("P8: una unidad fuera de servicio no se envía: error general con el mensaje de la regla", async () => {
    const { app } = await iniciada({ perfil: { tipo: "conductor", conductorId: "c-11" } });
    const r = await app.enviarParte(idDe(app, "ZU899QE"), H, completo(valoresIniciales({ conductorId: "c-11", kmInicio: 31074 })));
    expect(r.tipo).toBe("errores");
    if (r.tipo === "errores") {
      expect(r.errores.titulo).toBe("No se pudo enviar el parte");
      expect(r.errores.general).toMatch(/^La unidad está fuera de servicio desde el 16\/11\/2026/);
    }
  });

  it("una unidad que no existe: error general", async () => {
    const { app } = await iniciada({ perfil: C01 });
    const r = await app.enviarParte("no-existe", H, completo(valoresIniciales({ conductorId: "c-01", kmInicio: 5 })));
    expect(r.tipo === "errores" && r.errores.general).toBe(ERRORES.unidadInexistente);
  });

  it("un parte de otra fecha: C13, el borrador de ayer de ZW 749 JE se completa y se envía «fuera de término» y desaparece la alerta «Parte sin enviar» (P5)", async () => {
    const { app } = await iniciada({ perfil: { tipo: "conductor", conductorId: "c-13" }, patente: "ZW749JE", fecha: "2026-11-17" });
    const uid = idDe(app, "ZW749JE");
    expect(app.alertas?.alertas.some((a) => a.tipo === "parte-sin-enviar" && a.unidadId === uid)).toBe(true);
    const v = edicion(app);
    expect(v).toMatchObject({ parteId: "pt-0579", avisoFueraDeTermino: "Este parte es del 17/11/2026: se va a enviar fuera de término." });
    const r = await app.enviarParte(uid, "2026-11-17", completo(v.valoresIniciales));
    expect(r.tipo).toBe("enviado");
    if (r.tipo !== "enviado") return;
    expect(r.panel.linea).toBe("ZW 749 JE, 17/11/2026, enviado el 18/11/2026 a las 12:00 (fuera de término).");
    expect(r.panel.fueraDeTermino).toBe("Enviado fuera de término.");
    expect(app.alertas?.alertas.some((a) => a.tipo === "parte-sin-enviar" && a.unidadId === uid)).toBe(false);
    expect(estadoDe(app).eventos.at(-1)?.resumen).toContain("fuera de término");
  });
});

describe("descartar el borrador", () => {
  it("descartar un borrador: se borra sin dejar eventos, la vista vuelve a un parte nuevo y se va la alerta de «Parte sin enviar» (C13)", async () => {
    const { app } = await iniciada({ perfil: { tipo: "conductor", conductorId: "c-13" }, patente: "ZW749JE", fecha: "2026-11-17" });
    const antes = eventos(app).length;
    const r = await app.descartarBorradorDeParte("pt-0579");
    expect(r).toEqual({ ok: true, mensaje: "Borrador descartado." });
    expect(estadoDe(app).partes.some((p) => p.id === "pt-0579")).toBe(false);
    expect(eventos(app)).toHaveLength(antes);
    expect(app.alertas?.alertas.some((a) => a.tipo === "parte-sin-enviar")).toBe(false);
    expect(edicion(app)).toMatchObject({ parteId: null, borrador: null });
  });

  it("no se descarta un parte enviado (P7) ni uno que no existe", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    await app.enviarParte(idDe(app, "ZYN469"), H, completo(edicion(app).valoresIniciales));
    const enviado = estadoDe(app).partes.find((p) => p.unidadId === idDe(app, "ZYN469") && p.fecha === H);
    expect(await app.descartarBorradorDeParte(enviado?.id ?? "")).toMatchObject({ ok: false, mensaje: ERRORES.parteEnviadoInmutable });
    expect(await app.descartarBorradorDeParte("no-existe")).toMatchObject({ ok: false, mensaje: ERRORES.parteInexistente });
  });

  it("QA B2: si el descarte falla, el resumen se titula «No se pudo descartar el borrador» (no «No se pudo enviar el parte») y trae el mismo mensaje", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469" });
    const r = await app.descartarBorradorDeParte("no-existe");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores).toMatchObject({ titulo: "No se pudo descartar el borrador", general: ERRORES.parteInexistente, lista: [] });
  });

  it("si falla la escritura, el borrador sigue y el mensaje lo dice", async () => {
    const { app, repo } = await iniciada({ perfil: { tipo: "conductor", conductorId: "c-13" }, patente: "ZW749JE", fecha: "2026-11-17" });
    repo.escribir = () => Promise.reject(new Error("cuota agotada"));
    expect(await app.descartarBorradorDeParte("pt-0579")).toMatchObject({ ok: false, mensaje: ERRORES.noPudoGuardar });
    expect(estadoDe(app).partes.some((p) => p.id === "pt-0579")).toBe(true);
  });

  it("un borrador de hace más de 7 días ya no se puede enviar: solo se descarta (P5, P2)", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469", fecha: "2026-09-01" });
    // Se simula un borrador viejo escribiendo directo en el estado de la demo (la aplicación no deja crearlo).
    const estado = estadoDe(app);
    const viejo = { ...estado.partes.find((p) => p.estado === "borrador")!, id: "viejo", unidadId: idDe(app, "ZYN469"), fecha: "2026-09-01" };
    const repo = new RepositorioMemoria();
    await repo.reemplazarTodo({ ...estado, partes: [...estado.partes, viejo] });
    const otra = await iniciada({ repo, patente: "ZYN469", fecha: "2026-09-01" });
    expect(otra.app.parteDeLaRuta).toMatchObject({ tipo: "no-disponible", mensaje: "Solo se pueden cargar partes de los últimos 7 días.", borrador: { parteId: "viejo" } });
    expect(await otra.app.descartarBorradorDeParte("viejo")).toEqual({ ok: true, mensaje: "Borrador descartado." });
    expect(otra.app.parteDeLaRuta).toMatchObject({ tipo: "no-disponible", borrador: null });
  });
});

describe("el ejemplo completo: ningún otro caso se rompe", () => {
  it("el parte de ayer ya enviado de una unidad se ve en lectura, con la hora y el recorrido", async () => {
    const { app } = await iniciada({ perfil: C01, patente: "ZYN469", fecha: "2026-11-17" });
    const v = app.parteDeLaRuta;
    expect(v?.tipo).toBe("lectura");
    if (v?.tipo !== "lectura") return;
    expect(v.titulo).toBe("Parte del martes 17/11/2026");
    expect(v.panel.filas[0]?.rotulo).toBe("Recorrido");
    expect(v.vuelta).toEqual({ texto: "Parte diario", href: "#/conductor" });
  });

  it("los datos del generador y valoresDeParte son coherentes: un borrador del ejemplo (C13) se abre con lo que tiene", async () => {
    const e = generar(20261118, H);
    const borrador = e.partes.find((p) => p.id === "pt-0579");
    if (borrador === undefined) throw new Error("falta C13");
    const { app } = await iniciada({ perfil: { tipo: "conductor", conductorId: "c-13" }, patente: "ZW749JE", fecha: "2026-11-17" });
    expect(edicion(app).valoresIniciales).toEqual({ ...valoresDeParte(borrador), conductorId: "c-13" });
  });
});
