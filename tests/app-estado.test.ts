import { describe, expect, it } from "vitest";
import { generar } from "../src/lib/datos/generador.ts";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import { ERRORES, ERRORES_PESTANAS, TEXTO_AVISO, TEXTO_ERROR_ARRANQUE } from "../src/lib/dominio/textos.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { EstadoApp, type DependenciasApp } from "../src/lib/estado/app.svelte.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { SEMILLA_POR_DEFECTO } from "../src/lib/persistencia/arranque.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";
import type { AvisoEntrePestanas } from "../src/lib/persistencia/pestanas.ts";
import { checklistEnOrden } from "./ayuda.ts";

const HOY = "2026-11-18";
const MEDIODIA = "2026-11-18T15:00:00.000Z"; // 12:00 en Argentina

/** Todo lo que la aplicación necesita, con dobles: reloj movible, memoria, ubicación y pestañas falsas. */
function armar(extra: Partial<DependenciasApp> = {}) {
  let ms = Date.parse(MEDIODIA);
  const repo = new RepositorioMemoria();
  const ubicacion = ubicacionEnMemoria();
  const pestanas = { avisos: 0, cerrado: false, alRecibir: () => {} };
  let n = 0;
  const deps: DependenciasApp = {
    reloj: crearReloj(() => new Date(ms)),
    abrirAlmacenamiento: async () => repo,
    ubicacion,
    crearAvisoPestanas: (alRecibir): AvisoEntrePestanas => {
      pestanas.alRecibir = alRecibir;
      return {
        avisarCambio: () => void pestanas.avisos++,
        cerrar: () => void (pestanas.cerrado = true),
      };
    },
    nuevoId: () => `nuevo-${++n}`,
    ...extra,
  };
  return { app: new EstadoApp(deps), repo, ubicacion, pestanas, mover: (horas: number) => void (ms += horas * 3_600_000) };
}

async function iniciada(extra: Partial<DependenciasApp> = {}) {
  const t = armar(extra);
  await t.app.iniciar();
  return t;
}

function estadoDe(app: EstadoApp): Estado {
  if (app.estado === null) throw new Error("la aplicación no tiene estado");
  return app.estado;
}

function renovarSeguroDeC01(estado: Estado): Comando {
  const unidad = estado.unidades.find((u) => u.patente === "ZK214BD");
  const doc = estado.documentos.find((d) => d.titular.tipo === "unidad" && d.titular.id === unidad?.id && d.tipo === "seguro");
  if (doc === undefined) throw new Error("falta el seguro de C01");
  return { tipo: "renovarDocumento", documentoId: doc.id, numero: "DEMO-NUEVO", emisor: "", vence: "2027-11-18", emitido: null };
}

describe("arranque del estado de la aplicación", () => {
  it("antes de iniciar no hay datos y la fase es 'arrancando'", () => {
    const { app } = armar();
    expect(app.fase).toBe("arrancando");
    expect(app.estado).toBeNull();
    expect(app.alertas).toBeNull();
    expect(app.perfil).toEqual({ tipo: "encargado" });
  });

  it("después de iniciar tiene el ejemplo de hoy, guardado, y el centro de alertas calculado", async () => {
    const { app, repo } = await iniciada();
    expect(app.fase).toBe("lista");
    expect(app.estado).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(await repo.cargar()).toEqual(app.estado);
    expect(app.hoy).toBe(HOY);
    expect(app.avisos).toEqual([]);
    expect(app.enMemoria).toBe(false);
    expect(app.alertas?.resumen.protagonista).toBe(4);
    expect(app.alertas?.resumen.criticas).toBe(4);
  });

  it("D8: si el almacenamiento falla arranca en memoria y deja el aviso fijo", async () => {
    const { app } = await iniciada({ abrirAlmacenamiento: () => Promise.reject(new Error("bloqueado")) });
    expect(app.fase).toBe("lista");
    expect(app.enMemoria).toBe(true);
    expect(app.avisos).toEqual([{ tipo: "sin-almacenamiento" }]);
  });

  it("D4: 'preparando' se enciende solo si tarda más que el umbral y se apaga al terminar", async () => {
    const lento = async () => {
      await new Promise((r) => setTimeout(r, 60));
      return new RepositorioMemoria();
    };
    const { app } = armar({ abrirAlmacenamiento: lento, umbralPreparandoMs: 10 });
    const arranque = app.iniciar();
    expect(app.preparando).toBe(false);
    await new Promise((r) => setTimeout(r, 30));
    expect(app.preparando).toBe(true);
    await arranque;
    expect(app.preparando).toBe(false);
    expect(TEXTO_AVISO.preparando).toBe("Preparando la flota de ejemplo…");
  });

  it("D8: si abrir el almacenamiento no responde en el plazo, arranca en memoria con el aviso fijo", async () => {
    const { app } = await iniciada({ abrirAlmacenamiento: () => new Promise(() => {}), plazoAbrirMs: 20 });
    expect(app.fase).toBe("lista");
    expect(app.enMemoria).toBe(true);
    expect(app.avisos).toEqual([{ tipo: "sin-almacenamiento" }]);
    expect(app.preparando).toBe(false);
  });

  it("un reloj roto es una falla grave: fase 'error' con mensaje y nada a medias", async () => {
    const { app } = armar({ reloj: crearReloj(() => new Date(Number.NaN)) });
    await app.iniciar();
    expect(app.fase).toBe("error");
    expect(app.errorDeArranque).toBe(TEXTO_ERROR_ARRANQUE.mensaje);
    expect(app.estado).toBeNull();
  });
});

describe("rutas", () => {
  it("sin hash, el encargado cae en Inicio y el hash se corrige", async () => {
    const { app, ubicacion } = await iniciada();
    expect(app.ruta).toEqual({ tipo: "inicio" });
    expect(ubicacion.hash).toBe("#/inicio");
    expect(app.titulo).toBe("Inicio · Control de flota (demo)");
  });

  it("un enlace viejo guardado abre la pantalla equivalente y la dirección se reescribe a la forma nueva", async () => {
    for (const [viejo, nueva, ruta] of [
      ["#/alertas", "#/inicio", { tipo: "inicio" }],
      ["#/flota", "#/movilidades", { tipo: "movilidades" }],
      ["#/flota?filtro=de-baja", "#/movilidades?filtro=baja", { tipo: "movilidades", filtro: "de-baja" }],
      ["#/operacion", "#/operacion/partes", { tipo: "operacion", solapa: "partes" }],
      ["#/operacion/checklists", "#/operacion/partes", { tipo: "operacion", solapa: "partes" }],
    ] as const) {
      const { app, ubicacion } = armar();
      ubicacion.hash = viejo;
      await app.iniciar();
      expect(app.ruta).toEqual(ruta);
      expect(ubicacion.hash).toBe(nueva);
      expect(ubicacion.entradas).toBe(1); // se reemplaza, no se apila
    }
  });

  it("#/parte/PATENTE (sin fecha) abre el parte de hoy y la dirección pasa a llevar la fecha", async () => {
    const { app, ubicacion } = armar();
    ubicacion.hash = "#/parte/zk214bd";
    await app.iniciar();
    expect(app.ruta).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: HOY });
    expect(ubicacion.hash).toBe(`#/parte/ZK214BD/${HOY}`);
  });

  it("las rutas nuevas del encargado y del conductor, cada una en su perfil", async () => {
    const { app, ubicacion } = await iniciada();
    for (const [hash, ruta] of [
      ["#/vencimientos", { tipo: "vencimientos" }],
      ["#/operacion/novedades", { tipo: "operacion", solapa: "novedades" }],
      ["#/mas", { tipo: "mas" }],
    ] as const) {
      ubicacion.irA(hash);
      expect(app.ruta).toEqual(ruta);
    }
    ubicacion.irA("#/conductor/partes"); // del conductor: el encargado no la ve
    expect(app.ruta).toEqual({ tipo: "inicio" });
    expect(ubicacion.hash).toBe("#/inicio");

    await app.cambiarPerfil({ tipo: "conductor", conductorId: estadoDe(app).conductores[0]!.id });
    ubicacion.irA("#/conductor/partes");
    expect(app.ruta).toEqual({ tipo: "mis-partes" });
    expect(app.nombrePantalla).toBe("Mis partes");
    ubicacion.irA("#/mas");
    expect(app.ruta).toEqual({ tipo: "mas" });
    ubicacion.irA("#/vencimientos");
    expect(app.ruta).toEqual({ tipo: "conductor" });
  });

  it("un hash con la patente en minúsculas se muestra y se deja en su forma canónica", async () => {
    const { app, ubicacion } = armar();
    ubicacion.hash = "#/unidad/zk%20214%20bd";
    await app.iniciar();
    expect(app.ruta).toEqual({ tipo: "unidad", patente: "ZK214BD" });
    expect(ubicacion.hash).toBe("#/unidad/ZK214BD");
  });

  it("cambiar el hash cambia la pantalla y avisa a la vista para mover el foco al h1", async () => {
    const { app, ubicacion } = await iniciada();
    const v0 = app.versionDePantalla;
    ubicacion.irA("#/movilidades");
    expect(app.ruta).toEqual({ tipo: "movilidades" });
    expect(app.titulo).toBe("Movilidades · Control de flota (demo)");
    expect(app.nombrePantalla).toBe("Movilidades");
    expect(app.versionDePantalla).toBe(v0 + 1);
    ubicacion.irA("#/unidad/zk214bd");
    expect(app.versionDePantalla).toBe(v0 + 2);
  });

  it("volver a la misma pantalla (por ejemplo, la forma canónica del mismo hash) no mueve el foco otra vez", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/movilidades");
    const v = app.versionDePantalla;
    ubicacion.irA("#/movilidades/");
    expect(app.versionDePantalla).toBe(v);
    ubicacion.irA("#/flota"); // el alias viejo es la misma pantalla
    expect(app.versionDePantalla).toBe(v);
  });

  it("una ruta desconocida se muestra como error y no se reescribe el hash", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/nada-de-nada");
    expect(app.ruta).toEqual({ tipo: "desconocida" });
    expect(ubicacion.hash).toBe("#/nada-de-nada");
    expect(app.titulo).toBe("Página no encontrada · Control de flota (demo)");
  });

  it("el conductor no ve lo del encargado: se lo lleva a su inicio", async () => {
    const { app, ubicacion } = await iniciada();
    const conductorId = estadoDe(app).conductores[0]!.id;
    await app.cambiarPerfil({ tipo: "conductor", conductorId });
    ubicacion.irA("#/movilidades");
    expect(app.ruta).toEqual({ tipo: "conductor" });
    expect(ubicacion.hash).toBe("#/conductor");
  });

  it("después de cerrar, la aplicación deja de escuchar la barra de direcciones", async () => {
    const { app, ubicacion, pestanas } = await iniciada();
    app.cerrar();
    ubicacion.irA("#/movilidades");
    expect(app.ruta).toEqual({ tipo: "inicio" });
    expect(pestanas.cerrado).toBe(true);
  });
});

describe("pantalla y consulta: filtrar o escribir en el buscador no sube la página ni roba el foco (riesgo R3)", () => {
  it("cambiar el filtro o la búsqueda NO sube versionDePantalla; sube versionDeConsulta", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/movilidades");
    const pantalla = app.versionDePantalla;
    const consulta = app.versionDeConsulta;
    ubicacion.irA("#/movilidades?filtro=bloqueadas");
    expect(app.ruta).toEqual({ tipo: "movilidades", filtro: "no-pueden-salir" });
    expect(app.versionDePantalla).toBe(pantalla);
    expect(app.versionDeConsulta).toBe(consulta + 1);
    ubicacion.irA("#/movilidades?filtro=bloqueadas&q=h");
    ubicacion.irA("#/movilidades?filtro=bloqueadas&q=hi");
    expect(app.versionDePantalla).toBe(pantalla);
    expect(app.versionDeConsulta).toBe(consulta + 3);
    ubicacion.irA("#/movilidades"); // quitar los filtros
    expect(app.versionDePantalla).toBe(pantalla);
    expect(app.versionDeConsulta).toBe(consulta + 4);
  });

  it("lo mismo en Vencimientos", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/vencimientos");
    const pantalla = app.versionDePantalla;
    ubicacion.irA("#/vencimientos?filtro=vencidos");
    ubicacion.irA("#/vencimientos?filtro=7");
    expect(app.versionDePantalla).toBe(pantalla);
  });

  it("cambiar de pantalla sí sube versionDePantalla (también la solapa de Operación, la ficha y el parte)", async () => {
    const { app, ubicacion } = await iniciada();
    const v0 = app.versionDePantalla;
    ubicacion.irA("#/operacion/partes");
    ubicacion.irA("#/operacion/novedades");
    ubicacion.irA("#/unidad/ZK214BD");
    ubicacion.irA("#/unidad/ZKB482");
    ubicacion.irA("#/parte/ZK214BD/2026-11-17");
    ubicacion.irA("#/parte/ZK214BD/2026-11-18");
    expect(app.versionDePantalla).toBe(v0 + 6);
  });

  it("filtrar apila una entrada del historial (Atrás deshace el filtro) y tipear no apila una por letra", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/movilidades");
    const entradas = ubicacion.entradas;
    app.irA({ tipo: "movilidades", filtro: "de-baja" });
    expect(ubicacion.hash).toBe("#/movilidades?filtro=baja");
    expect(ubicacion.entradas).toBe(entradas + 1);
    app.ajustarConsulta({ tipo: "movilidades", filtro: "de-baja", q: "h" });
    app.ajustarConsulta({ tipo: "movilidades", filtro: "de-baja", q: "hi" });
    app.ajustarConsulta({ tipo: "movilidades", filtro: "de-baja", q: "hil" });
    expect(ubicacion.hash).toBe("#/movilidades?filtro=baja&q=hil");
    expect(ubicacion.entradas).toBe(entradas + 1);
    expect(app.ruta).toEqual({ tipo: "movilidades", filtro: "de-baja", q: "hil" });
  });

  it("ajustarConsulta no cambia de pantalla ni de versión de pantalla; si la ruta es de otra pantalla, es una navegación común (con su entrada)", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/movilidades");
    const v = app.versionDePantalla;
    app.ajustarConsulta({ tipo: "movilidades", q: "zk" });
    expect(app.versionDePantalla).toBe(v);
    const entradas = ubicacion.entradas;
    app.ajustarConsulta({ tipo: "vencimientos", filtro: "7" });
    expect(ubicacion.hash).toBe("#/vencimientos?filtro=7");
    expect(ubicacion.entradas).toBe(entradas + 1);
    expect(app.versionDePantalla).toBe(v + 1);
  });

  it("una dirección con la búsqueda sin forma canónica se corrige sin mover nada", async () => {
    const { app, ubicacion } = armar();
    ubicacion.hash = "#/flota?q=zk+214&filtro=baja";
    await app.iniciar();
    expect(app.ruta).toEqual({ tipo: "movilidades", filtro: "de-baja", q: "zk 214" });
    expect(ubicacion.hash).toBe("#/movilidades?filtro=baja&q=zk%20214");
  });

  it("al tipear un espacio al final la dirección lo conserva (no se recorta y se vuelve a leer)", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/movilidades");
    app.ajustarConsulta({ tipo: "movilidades", q: "zk " });
    expect(app.ruta).toEqual({ tipo: "movilidades", q: "zk " });
    expect(ubicacion.hash).toBe("#/movilidades?q=zk%20");
  });
});

describe("ruta padre («Atrás» y migas)", () => {
  it("la ficha vuelve a Movilidades con el filtro y la búsqueda con que se salió", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/movilidades?filtro=baja&q=hil");
    expect(app.padre).toBeNull();
    ubicacion.irA("#/unidad/ZK214BD");
    expect(app.padre).toEqual({ tipo: "movilidades", filtro: "de-baja", q: "hil" });
  });

  it("si se llegó a la ficha por otro camino, vuelve a Movilidades sin filtro; y se olvida al pasar por otra pantalla", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/inicio");
    ubicacion.irA("#/unidad/ZK214BD");
    expect(app.padre).toEqual({ tipo: "movilidades" });
    ubicacion.irA("#/movilidades?filtro=baja");
    ubicacion.irA("#/vencimientos");
    ubicacion.irA("#/unidad/ZK214BD");
    expect(app.padre).toEqual({ tipo: "movilidades" });
  });

  it("de ficha a ficha (el filtro no se pierde), y el parte vuelve a Operación diaria", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/movilidades?filtro=baja");
    ubicacion.irA("#/unidad/ZK214BD");
    ubicacion.irA("#/unidad/ZKB482");
    expect(app.padre).toEqual({ tipo: "movilidades", filtro: "de-baja" });
    ubicacion.irA("#/parte/ZK214BD/2026-11-17");
    expect(app.padre).toEqual({ tipo: "operacion", solapa: "partes" });
    ubicacion.irA("#/inicio");
    expect(app.padre).toBeNull();
  });
});

describe("comandos: escribir y recién después aplicar (D10)", () => {
  it("un comando bien hecho se guarda, actualiza el estado y las alertas al mismo tiempo, y avisa a otras pestañas", async () => {
    const { app, repo, pestanas } = await iniciada();
    const antes = estadoDe(app);
    const r = await app.ejecutar(renovarSeguroDeC01(antes));
    expect(r.ok).toBe(true);
    const despues = estadoDe(app);
    expect(despues).not.toBe(antes);
    expect(despues.meta.modificada).toBe(true);
    expect(despues.eventos).toHaveLength(antes.eventos.length + 1);
    expect(await repo.cargar()).toEqual(despues);
    expect(app.alertas?.resumen.protagonista).toBe(3); // C01 deja de ser "no puede salir"
    expect(pestanas.avisos).toBe(1);
  });

  it("los eventos llevan el momento del reloj y el autor del perfil", async () => {
    const { app } = await iniciada();
    await app.ejecutar(renovarSeguroDeC01(estadoDe(app)));
    const evento = estadoDe(app).eventos.at(-1)!;
    expect(evento.instante).toBe(MEDIODIA);
    expect(evento.autor).toBe("Rocío Medina");
    expect(evento.id.startsWith("nuevo-")).toBe(true); // los ids los pide el dominio al generador inyectado
  });

  it("un error de negocio vuelve con su mensaje, sin tocar el estado, el repositorio ni las otras pestañas", async () => {
    const { app, repo, pestanas } = await iniciada();
    const antes = estadoDe(app);
    const guardado = await repo.cargar();
    const r = await app.ejecutar({ tipo: "volverAServicio", unidadId: antes.unidades[0]!.id });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toBe(ERRORES.unidadYaEnServicio);
    expect(app.estado).toBe(antes);
    expect(await repo.cargar()).toEqual(guardado);
    expect(pestanas.avisos).toBe(0);
  });

  it("D10: si falla la escritura no se aplica nada y el mensaje lo dice", async () => {
    const { app, repo, pestanas } = await iniciada();
    const antes = estadoDe(app);
    repo.falla = "eventos";
    const r = await app.ejecutar(renovarSeguroDeC01(antes));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe("escritura-fallida");
      expect(r.error.mensaje).toBe(ERRORES.noPudoGuardar);
    }
    expect(app.estado).toBe(antes);
    expect(app.alertas?.resumen.protagonista).toBe(4);
    expect(pestanas.avisos).toBe(0);
    repo.falla = null;
    expect((await app.ejecutar(renovarSeguroDeC01(antes))).ok).toBe(true); // la falla fue de esa escritura
  });

  it("dos comandos casi a la vez se aplican de a uno, cada uno sobre el resultado del anterior (doble clic)", async () => {
    const { app } = await iniciada();
    const unidad = estadoDe(app).unidades.find((u) => u.estado.tipo === "en-servicio")!;
    const comando: Comando = { tipo: "ponerFueraDeServicio", unidadId: unidad.id, motivo: "Cambio de aceite" };
    const [a, b] = await Promise.all([app.ejecutar(comando), app.ejecutar(comando)]);
    expect([a.ok, b.ok].sort()).toEqual([false, true]);
    expect(estadoDe(app).eventos.filter((e) => e.tipo === "fuera-de-servicio" && e.unidadId === unidad.id && e.autor === "Rocío Medina")).toHaveLength(1);
  });

  it("si un comando lanza una excepción (error de programación) no traba los que vienen después", async () => {
    let falla = false;
    const { app } = await iniciada({ reloj: crearReloj(() => (falla ? new Date(Number.NaN) : new Date(MEDIODIA))) });
    falla = true;
    await expect(app.ejecutar(renovarSeguroDeC01(estadoDe(app)))).rejects.toThrow();
    falla = false;
    expect((await app.ejecutar(renovarSeguroDeC01(estadoDe(app)))).ok).toBe(true);
  });

  it("antes de iniciar, ejecutar devuelve un error claro", async () => {
    const { app } = armar();
    const r = await app.ejecutar({ tipo: "volverAServicio", unidadId: "x" });
    expect(r.ok).toBe(false);
  });
});

describe("perfil", () => {
  it("el conductor solo puede usar los comandos del parte", async () => {
    const { app } = await iniciada();
    const conductor = estadoDe(app).conductores[0]!;
    await app.cambiarPerfil({ tipo: "conductor", conductorId: conductor.id });
    const unidad = estadoDe(app).unidades.find((u) => u.estado.tipo === "en-servicio")!;
    const antes = estadoDe(app);
    const r = await app.ejecutar({ tipo: "ponerFueraDeServicio", unidadId: unidad.id, motivo: "No debería poder" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.codigo).toBe("sin-permiso");
    expect(app.estado).toBe(antes);
    // un comando del parte sí llega al dominio (acá falla por otra razón: el parte no existe)
    const d = await app.ejecutar({ tipo: "descartarBorrador", parteId: "no-existe" });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.error.codigo).not.toBe("sin-permiso");
  });

  it("el conductor firma con su nombre", async () => {
    const { app } = await iniciada();
    const conductor = estadoDe(app).conductores[0]!;
    await app.cambiarPerfil({ tipo: "conductor", conductorId: conductor.id });
    // El comando se rechaza o no según el dominio; lo que se prueba es el autor con el que se arma el contexto.
    expect(app.autor).toBe(conductor.nombre);
    await app.cambiarPerfil({ tipo: "encargado" });
    expect(app.autor).toBe("Rocío Medina");
  });

  it("el encargado puede usar todos los comandos", async () => {
    const { app } = await iniciada();
    expect((await app.ejecutar(renovarSeguroDeC01(estadoDe(app)))).ok).toBe(true);
  });

  it("cambiar de perfil lo guarda, NO marca la demo como modificada y lleva a la pantalla de inicio del perfil", async () => {
    const { app, repo, ubicacion } = await iniciada();
    const conductorId = estadoDe(app).conductores[0]!.id;
    await app.cambiarPerfil({ tipo: "conductor", conductorId });
    expect(app.perfil).toEqual({ tipo: "conductor", conductorId });
    expect(estadoDe(app).meta.modificada).toBe(false);
    expect((await repo.cargar())?.meta.perfil).toEqual({ tipo: "conductor", conductorId });
    expect(ubicacion.hash).toBe("#/conductor");
    expect(app.ruta).toEqual({ tipo: "conductor" });
    await app.cambiarPerfil({ tipo: "encargado" });
    expect(ubicacion.hash).toBe("#/inicio");
  });

  it("QA B5: cambiar de perfil reemplaza la entrada actual del historial en vez de agregar otra (que Atrás reescribiría)", async () => {
    const { app, ubicacion } = await iniciada();
    ubicacion.irA("#/movilidades");
    const entradas = ubicacion.entradas;
    const v0 = app.versionDePantalla;
    await app.cambiarPerfil({ tipo: "conductor", conductorId: estadoDe(app).conductores[0]!.id });
    expect(ubicacion.entradas).toBe(entradas);
    expect(ubicacion.hash).toBe("#/conductor");
    expect(app.ruta).toEqual({ tipo: "conductor" });
    expect(app.versionDePantalla).toBe(v0 + 1); // la vista igual mueve el foco al h1
    await app.cambiarPerfil({ tipo: "encargado" });
    expect(ubicacion.entradas).toBe(entradas);
    expect(ubicacion.hash).toBe("#/inicio");
  });

  it("D11: el primer comando del visitante sí la marca como modificada", async () => {
    const { app } = await iniciada();
    expect(estadoDe(app).meta.modificada).toBe(false);
    await app.ejecutar(renovarSeguroDeC01(estadoDe(app)));
    expect(estadoDe(app).meta.modificada).toBe(true);
  });
});

describe("reiniciar la demo (D6)", () => {
  it("vuelve al ejemplo, conserva el perfil, avisa a las otras pestañas y vuelve al inicio", async () => {
    const { app, repo, pestanas, ubicacion } = await iniciada();
    await app.ejecutar(renovarSeguroDeC01(estadoDe(app)));
    ubicacion.irA("#/movilidades");
    const avisosAntes = pestanas.avisos;
    const r = await app.reiniciar();
    expect(r.ok).toBe(true);
    expect(estadoDe(app)).toEqual(generar(SEMILLA_POR_DEFECTO, HOY));
    expect(await repo.cargar()).toEqual(app.estado);
    expect(app.alertas?.resumen.protagonista).toBe(4);
    expect(pestanas.avisos).toBe(avisosAntes + 1);
    expect(ubicacion.hash).toBe("#/inicio");
  });

  it("conserva el perfil elegido", async () => {
    const { app } = await iniciada();
    const conductorId = estadoDe(app).conductores[2]!.id;
    await app.cambiarPerfil({ tipo: "conductor", conductorId });
    await app.reiniciar();
    expect(app.perfil).toEqual({ tipo: "conductor", conductorId });
    expect(app.ruta).toEqual({ tipo: "conductor" });
  });

  it("si la escritura falla, queda lo de antes y el error se informa", async () => {
    const { app, repo } = await iniciada();
    await app.ejecutar(renovarSeguroDeC01(estadoDe(app)));
    const antes = estadoDe(app);
    repo.reemplazarTodo = async () => {
      throw new Error("sin cuota");
    };
    const r = await app.reiniciar();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe("escritura-fallida");
      expect(r.error.mensaje).toBe(ERRORES.noPudoReiniciar);
    }
    expect(app.estado).toBe(antes);
  });

  it("al reiniciar desaparece el aviso de datos de otra fecha", async () => {
    const viejo = generar(SEMILLA_POR_DEFECTO, "2026-11-10");
    viejo.meta.modificada = true;
    const repo = new RepositorioMemoria();
    await repo.reemplazarTodo(viejo);
    const { app } = await iniciada({ abrirAlmacenamiento: async () => repo });
    expect(app.avisos).toEqual([{ tipo: "datos-de-otra-fecha", fechaBase: "2026-11-10" }]);
    await app.reiniciar();
    expect(app.avisos).toEqual([]);
  });

  it("en modo memoria el aviso fijo se queda", async () => {
    const { app } = await iniciada({ abrirAlmacenamiento: () => Promise.reject(new Error("x")) });
    await app.reiniciar();
    expect(app.avisos).toEqual([{ tipo: "sin-almacenamiento" }]);
  });
});

describe("D9: cambios en otra pestaña", () => {
  it("el aviso se enciende, los datos de esta pestaña no cambian hasta 'Actualizar', y entonces se leen del almacenamiento", async () => {
    const { app, repo, pestanas } = await iniciada();
    const otra = new EstadoApp({
      reloj: crearReloj(() => new Date(MEDIODIA)),
      abrirAlmacenamiento: async () => repo,
      ubicacion: ubicacionEnMemoria(),
      crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
    });
    await otra.iniciar();
    await otra.ejecutar(renovarSeguroDeC01(estadoDe(otra)));

    const antes = estadoDe(app);
    expect(app.hayCambiosEnOtraPestana).toBe(false);
    pestanas.alRecibir();
    expect(app.hayCambiosEnOtraPestana).toBe(true);
    expect(app.estado).toBe(antes);
    expect(app.alertas?.resumen.protagonista).toBe(4);

    const r = await app.actualizar();
    expect(r.ok).toBe(true);
    expect(app.hayCambiosEnOtraPestana).toBe(false);
    expect(estadoDe(app)).toEqual(await repo.cargar());
    expect(app.alertas?.resumen.protagonista).toBe(3);
  });

  it("QA D6: mientras hay cambios de otra pestaña sin actualizar, no se puede cambiar de perfil; con 'Actualizar' sí", async () => {
    const { app, repo, ubicacion, pestanas } = await iniciada();
    const conductorId = estadoDe(app).conductores[0]!.id;
    const guardado = await repo.cargar();
    pestanas.alRecibir();

    const r = await app.cambiarPerfil({ tipo: "conductor", conductorId });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe("cambios-en-otra-pestana");
      expect(r.error.mensaje).toBe(ERRORES.cambiosEnOtraPestana);
    }
    expect(app.perfil).toEqual({ tipo: "encargado" });
    expect(ubicacion.hash).toBe("#/inicio");
    expect(await repo.cargar()).toEqual(guardado); // no se escribió nada (no pisa el meta de la otra pestaña)
    expect(pestanas.avisos).toBe(0);

    await app.actualizar();
    const despues = await app.cambiarPerfil({ tipo: "conductor", conductorId });
    expect(despues.ok).toBe(true);
    expect(app.perfil).toEqual({ tipo: "conductor", conductorId });
  });

  it("QA E5 M5: cada intento de escribir que se frena por los cambios de otra pestaña sube un contador, para que la pantalla lleve la vista al aviso", async () => {
    const { app, pestanas } = await iniciada();
    expect(app.bloqueosPorOtraPestana).toBe(0);
    const conductorId = estadoDe(app).conductores[0]!.id;
    await app.cambiarPerfil({ tipo: "conductor", conductorId }); // sin cambios de otra pestaña: no es un bloqueo
    await app.cambiarPerfil({ tipo: "encargado" });
    expect(app.bloqueosPorOtraPestana).toBe(0);
    pestanas.alRecibir();
    await app.cambiarPerfil({ tipo: "conductor", conductorId });
    expect(app.bloqueosPorOtraPestana).toBe(1);
    const r = await app.ejecutar(renovarSeguroDeC01(estadoDe(app)));
    expect(r.ok).toBe(false);
    expect(app.bloqueosPorOtraPestana).toBe(2);
    // Enviar el parte guarda primero el borrador (que no cuenta solo): la pantalla pide ver el aviso a mano.
    app.pedirVerElAviso();
    expect(app.bloqueosPorOtraPestana).toBe(3);
    await app.actualizar();
    app.pedirVerElAviso(); // ya no hay cambios de otra pestaña: no cuenta
    expect(app.bloqueosPorOtraPestana).toBe(3);
    pestanas.alRecibir();
    // El autoguardado del parte corre solo mientras se escribe: frenarlo no tiene que mover la vista.
    const unidad = estadoDe(app).unidades[0]!;
    const borrador: Comando = {
      tipo: "guardarBorrador",
      parteId: null,
      unidadId: unidad.id,
      fecha: HOY,
      conductorId: null,
      kmInicio: null,
      kmFin: null,
      combustible: null,
      litrosCargados: null,
      checklist: checklistEnOrden(),
      otraNovedad: { descripcion: "", impideUso: false },
    };
    const frenado = await app.ejecutar(borrador);
    expect(frenado.ok).toBe(false);
    expect(app.bloqueosPorOtraPestana).toBe(3);
  });

  it("si 'Actualizar' no puede leer, el aviso sigue y el error se informa", async () => {
    const { app, repo, pestanas } = await iniciada();
    pestanas.alRecibir();
    repo.cargar = async () => {
      throw new Error("lectura rota");
    };
    const r = await app.actualizar();
    expect(r.ok).toBe(false);
    expect(app.hayCambiosEnOtraPestana).toBe(true);
  });
});

describe("el día cambia con el reloj (T1)", () => {
  it("al pasar la medianoche de Argentina, actualizarReloj mueve 'hoy' y recalcula las alertas", async () => {
    const { app, mover } = await iniciada();
    const antes = app.alertas;
    mover(5); // 17:00 en Argentina: mismo día
    app.actualizarReloj();
    expect(app.hoy).toBe(HOY);
    expect(app.alertas).toEqual(antes);
    mover(8); // 01:00 del día siguiente en Argentina
    app.actualizarReloj();
    expect(app.hoy).toBe("2026-11-19");
    expect(app.alertas).not.toEqual(antes);
  });
});

describe("avisos", () => {
  it("descartarAviso quita solo el de ese tipo", async () => {
    const { app } = await iniciada({ abrirAlmacenamiento: () => Promise.reject(new Error("x")) });
    app.descartarAviso("esquema-actualizado");
    expect(app.avisos).toEqual([{ tipo: "sin-almacenamiento" }]);
    app.descartarAviso("sin-almacenamiento");
    expect(app.avisos).toEqual([]);
  });
});

describe("mensaje de cada escritura que falla", () => {
  function borradorLibre(estado: Estado): Comando {
    for (const unidad of estado.unidades.filter((u) => u.estado.tipo === "en-servicio")) {
      for (let atras = 0; atras < 7; atras++) {
        const fecha = sumarDias(HOY, -atras);
        if (estado.partes.some((p) => p.unidadId === unidad.id && p.fecha === fecha)) continue;
        return {
          tipo: "guardarBorrador", parteId: null, unidadId: unidad.id, fecha, conductorId: null, kmInicio: null, kmFin: null,
          combustible: null, litrosCargados: null, checklist: checklistEnOrden(), otraNovedad: null,
        };
      }
    }
    throw new Error("no hay una unidad libre para el borrador de prueba");
  }

  it("guardar un borrador que no se pudo escribir dice 'No se pudo guardar el parte' (P12)", async () => {
    const { app, repo } = await iniciada();
    const antes = estadoDe(app);
    const comando = borradorLibre(antes);
    repo.falla = "eventos";
    const r = await app.ejecutar(comando);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe("escritura-fallida");
      expect(r.error.mensaje).toBe(ERRORES.noPudoGuardarElParte);
    }
    expect(app.estado).toBe(antes);
  });

  it("cambiar de perfil que no se pudo escribir dice 'No se pudo cambiar la vista'", async () => {
    const { app, repo } = await iniciada();
    const antes = estadoDe(app);
    repo.escribir = async () => {
      throw new Error("sin cuota");
    };
    const r = await app.cambiarPerfil({ tipo: "conductor", conductorId: antes.conductores[0]!.id });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe("escritura-fallida");
      expect(r.error.mensaje).toBe(ERRORES.noPudoCambiarVista);
    }
    expect(app.estado).toBe(antes);
    expect(app.perfil).toEqual({ tipo: "encargado" });
  });
});

describe("la fase 'error' no tiene reinicio (los datos guardados no llevan a ella)", () => {
  it("reiniciar() sin estado cargado dice que la demo no cargó, no escribe nada y la fase sigue en 'error'", async () => {
    const { app, repo } = armar({ reloj: crearReloj(() => new Date(Number.NaN)) });
    await app.iniciar();
    expect(app.fase).toBe("error");
    const r = await app.reiniciar();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.codigo).toBe("sin-datos");
    expect(await repo.cargar()).toBeNull();
    expect(app.fase).toBe("error");
    expect(app.estado).toBeNull();
  });

  it("reiniciar() antes de iniciar sigue diciendo que la demo no cargó", async () => {
    const { app } = armar();
    const r = await app.reiniciar();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.codigo).toBe("sin-datos");
  });
});

describe("A1 (QA etapa 4): una pestaña desactualizada no escribe", () => {
  /** Dos pestañas sobre el mismo almacenamiento: `a` hace lo suyo y `b` es la que quedó vieja. */
  async function dosPestanas() {
    const repo = new RepositorioMemoria();
    const a = await iniciada({ abrirAlmacenamiento: async () => repo });
    const b = await iniciada({ abrirAlmacenamiento: async () => repo });
    return { repo, a, b };
  }
  const unidadC01 = (app: EstadoApp) => estadoDe(app).unidades.find((u) => u.patente === "ZK214BD")!;

  it("con cambios de otra pestaña sin actualizar, un comando se rechaza y no se escribe nada ni se avisa", async () => {
    const { repo, a, b } = await dosPestanas();
    const baja = await a.app.ejecutar({ tipo: "darDeBaja", unidadId: unidadC01(a.app).id, motivo: "Baja por venta de la unidad" });
    expect(baja.ok).toBe(true);
    b.pestanas.alRecibir();
    const guardado = await repo.cargar();
    const antes = estadoDe(b.app);
    const avisos = b.pestanas.avisos;

    const r = await b.app.ejecutar({ tipo: "ponerFueraDeServicio", unidadId: unidadC01(b.app).id, motivo: "Fuera por taller prolongado" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe("cambios-en-otra-pestana");
      expect(r.error.mensaje).toBe(ERRORES_PESTANAS.escrituraConCambiosEnOtraPestana);
    }
    expect(await repo.cargar()).toEqual(guardado); // la baja de la otra pestaña sigue en pie
    expect(estadoDe(b.app)).toBe(antes);
    expect(b.pestanas.avisos).toBe(avisos);
    const final = (await repo.cargar())!.unidades.find((u) => u.patente === "ZK214BD")!;
    expect(final.estado.tipo).toBe("baja");
  });

  it("tampoco se duplica una renovación hecha desde una pestaña vieja", async () => {
    const { repo, a, b } = await dosPestanas();
    await a.app.ejecutar(renovarSeguroDeC01(estadoDe(a.app)));
    b.pestanas.alRecibir();
    const r = await b.app.ejecutar(renovarSeguroDeC01(estadoDe(b.app)));
    expect(r.ok).toBe(false);
    const comando = renovarSeguroDeC01(estadoDe(b.app));
    const vigenteId = comando.tipo === "renovarDocumento" ? comando.documentoId : "";
    const renovaciones = (await repo.cargar())!.documentos.filter((d) => d.reemplazaA === vigenteId);
    expect(renovaciones).toHaveLength(1); // la de la otra pestaña, no una segunda
  });

  it("los guardados del parte (borrador y envío) y los métodos de formulario también se rechazan", async () => {
    const { repo, b } = await dosPestanas();
    b.pestanas.alRecibir();
    const guardado = await repo.cargar();
    const e = await b.app.descartarBorradorDeParte("no-importa");
    expect(e.ok).toBe(false);
    const alta = await b.app.agregarUnidad({
      patente: "AB123CD", interno: "88", marca: "Marca", modelo: "Modelo", anio: "2022", tipo: "camioneta", proyectoId: estadoDe(b.app).proyectos[0]!.id, conductorId: "",
    });
    expect(alta.ok).toBe(false);
    expect(await repo.cargar()).toEqual(guardado);
  });

  it("después de 'Actualizar' vuelve a poder escribir", async () => {
    const { repo, a, b } = await dosPestanas();
    await a.app.ejecutar({ tipo: "darDeBaja", unidadId: unidadC01(a.app).id, motivo: "Baja por venta de la unidad" });
    b.pestanas.alRecibir();
    expect((await b.app.actualizar()).ok).toBe(true);
    const r = await b.app.ejecutar({ tipo: "cargarNovedad", unidadId: estadoDe(b.app).unidades[1]!.id, descripcion: "Ruido en la caja", impideUso: false });
    expect(r.ok).toBe(true);
    expect((await repo.cargar())!.novedades.some((n) => n.descripcion === "Ruido en la caja")).toBe(true);
  });

  it("'Reiniciar demo' sigue andando con el aviso encendido (reemplaza todo y lo apaga)", async () => {
    const { b } = await dosPestanas();
    b.pestanas.alRecibir();
    expect((await b.app.reiniciar()).ok).toBe(true);
    expect(b.app.hayCambiosEnOtraPestana).toBe(false);
  });
});
