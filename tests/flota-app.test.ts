// Paso 4.3 (lógica): la flota y «Agregar unidad» conectadas con el estado de la aplicación, la persistencia y la ruta. Aceptación del
// plan: «zk214» encuentra la unidad; filtros y orden; la alta nueva aparece con sus faltantes (U5), en el centro de alertas y en la flota.
import { describe, expect, it } from "vitest";
import type { ValoresUnidad } from "../src/lib/dominio/formulario-unidad.ts";
import { ERRORES } from "../src/lib/dominio/textos.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { EstadoApp, type DependenciasApp } from "../src/lib/estado/app.svelte.ts";
import { CONSULTA_INICIAL, consultaDeRuta, vistaDeFlota, type PanelFlota } from "../src/lib/estado/flota.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";

const MEDIODIA = "2026-11-18T15:00:00.000Z"; // 12:00 en Argentina
const NUEVA: ValoresUnidad = {
  patente: "zk 999 aa",
  interno: "30",
  tipo: "utilitario",
  marca: "Peugeot",
  modelo: "Partner",
  anio: "2025",
  proyectoId: "proy-piedra-lunar",
  conductorId: "",
};

async function iniciada(repo = new RepositorioMemoria(), hash = "") {
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

function panelDe(app: EstadoApp): PanelFlota {
  if (app.panelDeFlota === null) throw new Error("la flota no está calculada");
  return app.panelDeFlota;
}

function centroDe(app: EstadoApp) {
  if (app.centroDeAlertas === null) throw new Error("el centro de alertas no está calculado");
  return app.centroDeAlertas;
}

const patentes = (p: PanelFlota, parcial: Partial<typeof CONSULTA_INICIAL> = {}) => vistaDeFlota(p, { ...CONSULTA_INICIAL, ...parcial }).filas.map((f) => f.patente);

describe("la flota en la aplicación (aceptación del paso 4.3)", () => {
  it("antes de iniciar no hay flota; después, el ejemplo: 24 unidades, 23 activas", async () => {
    const t = new EstadoApp({
      reloj: crearReloj(() => new Date(Date.parse(MEDIODIA))),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion: ubicacionEnMemoria(),
      crearAvisoPestanas: () => ({ avisarCambio: () => {}, cerrar: () => {} }),
    });
    expect(t.panelDeFlota).toBeNull();
    await t.iniciar();
    const p = panelDe(t);
    expect(p.filas).toHaveLength(24);
    expect(p.cantidad).toBe(23);
    expect(p.resumen).toBe("23 unidades activas · 19 pueden salir · 2 no pueden salir · 2 fuera de servicio · 1 de baja");
  });

  it("la búsqueda «zk214» encuentra ZK 214 BD", async () => {
    const { app } = await iniciada();
    expect(patentes(panelDe(app), { busqueda: "zk214" })).toEqual(["ZK214BD"]);
    expect(vistaDeFlota(panelDe(app), { ...CONSULTA_INICIAL, busqueda: "zk214" }).anuncio).toBe("Mostrando 1 de 23 unidades.");
  });

  it("filtros y orden con los datos de la aplicación", async () => {
    const { app } = await iniciada();
    const p = panelDe(app);
    expect(patentes(p, { filtro: "no-pueden-salir" }).sort()).toEqual(["ZK214BD", "ZZD563"]);
    expect(patentes(p, { filtro: "de-baja" })).toEqual(["ZUE512"]);
    expect(patentes(p, { orden: "interno" }).slice(0, 3)).toEqual(["ZYN469", "ZI442TU", "ZM904EB"]);
    expect(patentes(p).slice(0, 4)).toEqual(["ZZD563", "ZK214BD", "ZR536MZ", "ZU899QE"]);
  });

  it("el panel se recalcula con cada comando: poner fuera de servicio una unidad cambia su fila y los totales, sin recargar", async () => {
    const { app } = await iniciada();
    const u = estadoDe(app).unidades.find((x) => x.patente === "ZYN469");
    if (u === undefined) throw new Error("falta la unidad");
    expect(panelDe(app).filas.find((f) => f.patente === "ZYN469")?.estado.categoria).toBe("puede-salir");
    const r = await app.ejecutar({ tipo: "ponerFueraDeServicio", unidadId: u.id, motivo: "En taller: prueba" });
    expect(r.ok).toBe(true);
    expect(panelDe(app).filas.find((f) => f.patente === "ZYN469")?.estado.categoria).toBe("fuera-de-servicio");
    expect(panelDe(app).resumen).toBe("23 unidades activas · 18 pueden salir · 2 no pueden salir · 3 fuera de servicio · 1 de baja");
  });
});

describe("el filtro viene de la ruta («Ver las N en la flota»)", () => {
  it("#/flota?filtro=no-disponibles abre la flota con ese filtro y la barra de direcciones queda como está", async () => {
    const { app, ubicacion } = await iniciada(new RepositorioMemoria(), "#/flota?filtro=no-disponibles");
    expect(app.ruta).toEqual({ tipo: "flota", filtro: "no-disponibles" });
    expect(ubicacion.hash).toBe("#/flota?filtro=no-disponibles");
    const consulta = consultaDeRuta(app.ruta);
    expect(consulta.filtro).toBe("no-disponibles");
    const v = vistaDeFlota(panelDe(app), consulta);
    expect(v.filas.map((f) => f.patente).sort()).toEqual(centroDe(app).protagonista.items.map((i) => i.patente).sort());
    expect(v.filas).toHaveLength(centroDe(app).protagonista.cifra);
  });

  it("un filtro desconocido en la barra de direcciones se corrige a #/flota (no se repite lo que se escribió)", async () => {
    const { app, ubicacion } = await iniciada(new RepositorioMemoria(), "#/flota?filtro=<b>zz9</b>");
    expect(app.ruta).toEqual({ tipo: "flota" });
    expect(ubicacion.hash).toBe("#/flota");
    expect(consultaDeRuta(app.ruta)).toEqual(CONSULTA_INICIAL);
  });

  it("cambiar de #/flota?filtro=… a #/flota es otra pantalla (la vista vuelve a leer la consulta)", async () => {
    const { app, ubicacion } = await iniciada(new RepositorioMemoria(), "#/flota?filtro=de-baja");
    const antes = app.versionDePantalla;
    ubicacion.irA("#/flota");
    expect(app.ruta).toEqual({ tipo: "flota" });
    expect(app.versionDePantalla).toBe(antes + 1);
  });
});

describe("Agregar unidad: se guarda y aparece con sus faltantes (U5)", () => {
  it("el resultado: mensaje para la ficha, dónde va el foco y adónde ir", async () => {
    const { app } = await iniciada();
    const r = await app.agregarUnidad(NUEVA);
    expect(r).toEqual({
      ok: true,
      mensaje: "Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí.",
      foco: "titulo-de-la-ficha",
      href: "#/unidad/ZK999AA",
      ruta: { tipo: "unidad", patente: "ZK999AA" },
    });
  });

  it("en la base de mantenimiento faltan 3 (no pide habilitación)", async () => {
    const { app } = await iniciada();
    const r = await app.agregarUnidad({ ...NUEVA, proyectoId: "proy-base" });
    expect(r.ok && r.mensaje).toBe("Unidad agregada. Le faltan 3 documentos: cárguelos desde aquí.");
  });

  it("aparece en la flota: «No puede salir», con el primer faltante y «y 3 motivos más»; y se encuentra buscando", async () => {
    const { app } = await iniciada();
    await app.agregarUnidad(NUEVA);
    const p = panelDe(app);
    expect(p.filas).toHaveLength(25);
    expect(p.cantidad).toBe(24);
    const f = p.filas.find((x) => x.patente === "ZK999AA");
    expect(f).toMatchObject({
      patenteTexto: "ZK 999 AA",
      interno: "Int. 30",
      descripcion: "Peugeot Partner 2025 · Utilitario",
      franja: "critico",
      proyecto: "Proyecto Piedra Lunar",
      conductor: null,
      km: { valor: null, texto: "Sin registros" },
    });
    expect(f?.estado).toMatchObject({ categoria: "no-puede-salir", motivo: "Falta cargar: Seguro", motivosMas: "y 3 motivos más" });
    expect(f?.proximoVencimiento).toMatchObject({ tipo: "faltante", etiqueta: "Falta cargar" });
    expect(patentes(p, { busqueda: "zk999" })).toEqual(["ZK999AA"]);
    expect(patentes(p, { filtro: "no-pueden-salir" })).toContain("ZK999AA");
  });

  it("aparece en el centro de alertas: 5 unidades que no pueden salir y 4 faltantes más (2 + 4 = 6 vencidos y faltantes)", async () => {
    const { app } = await iniciada();
    await app.agregarUnidad(NUEVA);
    const c = centroDe(app);
    expect(c.protagonista.cifra).toBe(5);
    expect(c.protagonista.items.some((i) => i.patente === "ZK999AA")).toBe(true);
    expect(c.vencimientos.grupos.map((g) => g.cantidad)).toEqual([6, 4, 3, 2]);
    expect(c.vencimientos.total).toBe(15);
    expect(c.protagonista.disponibles).toBe("Disponibles hoy: 19 de 24 unidades activas.");
  });

  it("se escribe la unidad y el evento en una operación, con el autor, y marca la demo como modificada", async () => {
    const { app, repo } = await iniciada();
    await app.agregarUnidad({ ...NUEVA, conductorId: estadoDe(app).conductores[0]?.id ?? "" });
    const guardado = await repo.cargar();
    expect(guardado).toEqual(app.estado);
    const u = guardado?.unidades.at(-1);
    expect(u).toMatchObject({ patente: "ZK999AA", interno: 30, tipo: "utilitario", estado: { tipo: "en-servicio" } });
    expect(u?.conductorId).toBe(estadoDe(app).conductores[0]?.id);
    expect(guardado?.eventos.at(-1)).toMatchObject({ tipo: "unidad-alta", unidadId: u?.id, autor: "Rocío Medina" });
    expect(guardado?.meta.modificada).toBe(true);
  });
});

describe("Agregar unidad: errores del formulario (no se guarda nada y la persona ve qué corregir)", () => {
  it("campos vacíos: todos los errores juntos, por campo y en orden; el estado y lo guardado no cambian", async () => {
    const { app, repo } = await iniciada();
    const antes = app.estado;
    const guardadoAntes = await repo.cargar();
    const r = await app.agregarUnidad({ patente: "", interno: "", tipo: "", marca: "", modelo: "", anio: "", proyectoId: "", conductorId: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores.lista.map((x) => x.campo)).toEqual(["patente", "interno", "tipo", "marca", "modelo", "anio", "proyectoId"]);
    expect(r.errores.general).toBeNull();
    expect(app.estado).toBe(antes);
    expect(await repo.cargar()).toEqual(guardadoAntes);
  });

  it("U2: patente repetida con el mensaje del dominio, en su campo; U3: interno repetido", async () => {
    const { app } = await iniciada();
    const r = await app.agregarUnidad({ ...NUEVA, patente: "zk-214-bd", interno: "7" });
    expect(r.ok === false && r.errores.porCampo).toEqual({
      patente: "Ya existe una unidad con la patente ZK 214 BD (Int. 07).",
      interno: "Ya existe una unidad con el número interno 7 (ZK 214 BD).",
    });
  });

  it("D10: si el guardado falla, no cambia nada y el error es general (el diálogo no se cierra y lo escrito sigue)", async () => {
    const repo = new RepositorioMemoria();
    const { app } = await iniciada(repo);
    const antes = app.estado;
    repo.escribir = () => Promise.reject(new Error("cuota agotada"));
    const r = await app.agregarUnidad(NUEVA);
    expect(r).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: ERRORES.noPudoGuardar } });
    expect(app.estado).toBe(antes);
    expect(centroDe(app).protagonista.cifra).toBe(4);
  });

  it("el perfil Conductor no puede agregar unidades: error general «sin permiso»", async () => {
    const { app } = await iniciada();
    const conductor = estadoDe(app).conductores[0];
    if (conductor === undefined) throw new Error("no hay conductores");
    expect((await app.cambiarPerfil({ tipo: "conductor", conductorId: conductor.id })).ok).toBe(true);
    const r = await app.agregarUnidad(NUEVA);
    expect(r).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: ERRORES.sinPermiso } });
    expect(estadoDe(app).unidades).toHaveLength(24);
  });

  it("doble envío: el segundo ve que la patente ya existe (en su campo) y no se agrega dos veces", async () => {
    const { app } = await iniciada();
    const [a, b] = await Promise.all([app.agregarUnidad(NUEVA), app.agregarUnidad({ ...NUEVA, interno: "31" })]);
    expect(a.ok).toBe(true);
    expect(b.ok === false && b.errores.porCampo.patente).toBe("Ya existe una unidad con la patente ZK 999 AA (Int. 30).");
    expect(estadoDe(app).unidades.filter((u) => u.patente === "ZK999AA")).toHaveLength(1);
  });

  it("un proyecto o un conductor que ya no existen (cambió en otra pestaña) se marcan en su campo", async () => {
    const { app } = await iniciada();
    const r = await app.agregarUnidad({ ...NUEVA, proyectoId: "no-existe", conductorId: "tampoco" });
    expect(r.ok === false && r.errores.porCampo.proyectoId).toBe("No se encontró el proyecto. Vuelva a la lista e intente de nuevo.");
    expect(estadoDe(app).unidades).toHaveLength(24);
  });

  it("sin datos cargados (todavía arrancando): error general «sin datos»", async () => {
    const t = new EstadoApp({
      reloj: crearReloj(() => new Date(Date.parse(MEDIODIA))),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion: ubicacionEnMemoria(),
    });
    const r = await t.agregarUnidad(NUEVA);
    expect(r).toEqual({ ok: false, errores: { porCampo: {}, lista: [], general: ERRORES.sinDatos } });
  });
});
