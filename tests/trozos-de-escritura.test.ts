// Etapa 1 (rediseño): lo que sirve para escribir (los comandos del dominio, la escritura de la ficha y la del parte) es código que se baja
// la primera vez que se escribe, no con el marco. Si el trozo no baja (sin red), la escritura contesta «No se pudo guardar» como cualquier
// otra escritura que falla (D10): no rechaza, no cambia nada y la aplicación sigue andando.
import { describe, expect, it } from "vitest";
import type { Comando } from "../src/lib/dominio/comandos.ts";
import type { ValoresParte } from "../src/lib/dominio/formulario-parte-valores.ts";
import { ERRORES, TEXTO_ERROR_DESCARGA, TITULOS_DE_ERROR_DEL_PARTE } from "../src/lib/dominio/textos.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { ErrorDeDescarga } from "../src/lib/descarga.ts";
import { EstadoApp, type DependenciasApp, type TrozosDeEscritura } from "../src/lib/estado/app.svelte.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";

const MEDIODIA = "2026-11-18T15:00:00.000Z";

async function iniciada(
  trozos: Partial<TrozosDeEscritura>,
  extra: Partial<DependenciasApp> = {},
): Promise<{ app: EstadoApp; repo: RepositorioMemoria; llegaCambioDeOtraPestana: () => void }> {
  const repo = new RepositorioMemoria();
  let avisar: () => void = () => {};
  const deps: DependenciasApp = {
    reloj: crearReloj(() => new Date(MEDIODIA)),
    abrirAlmacenamiento: async () => repo,
    ubicacion: ubicacionEnMemoria(),
    crearAvisoPestanas: (alRecibir) => {
      avisar = alRecibir;
      return { avisarCambio() {}, cerrar() {} };
    },
    trozos,
    ...extra,
  };
  const app = new EstadoApp(deps);
  await app.iniciar();
  return { app, repo, llegaCambioDeOtraPestana: () => avisar() };
}

const sinRed = (): Promise<never> => Promise.reject(new Error("Failed to fetch dynamically imported module"));
/** El trozo ya no existe en el servidor (despliegue nuevo): lo que `bajar` informa cuando el navegador vio la respuesta del servidor. */
const versionNueva = (): Promise<never> => Promise.reject(new ErrorDeDescarga("version-nueva"));

function comandoDeNovedad(estado: Estado): Comando {
  const unidad = estado.unidades.find((u) => u.estado.tipo === "en-servicio");
  if (unidad === undefined) throw new Error("falta una unidad en servicio");
  return { tipo: "ponerFueraDeServicio", unidadId: unidad.id, motivo: "En taller: cambio de embrague" };
}

describe("los comandos del dominio se bajan al escribir", () => {
  it("si el trozo no baja, la escritura falla con «No se pudo guardar» y no cambia nada", async () => {
    const { app, repo } = await iniciada({ comandos: sinRed });
    const antes = app.estado;
    const r = await app.ejecutar(comandoDeNovedad(antes!));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe("escritura-fallida");
      expect(r.error.mensaje).toBe(ERRORES.noPudoGuardar);
    }
    expect(app.estado).toBe(antes);
    expect(await repo.cargar()).toEqual(antes);
  });

  it("la cola sigue andando después de una escritura que no pudo bajar el trozo", async () => {
    let fallar = true;
    const real = () => import("../src/lib/dominio/comandos.ts");
    const { app } = await iniciada({ comandos: () => (fallar ? sinRed() : real()) });
    const comando = comandoDeNovedad(app.estado!);
    expect((await app.ejecutar(comando)).ok).toBe(false);
    fallar = false;
    const r = await app.ejecutar(comando);
    expect(r.ok).toBe(true);
  });

  it("con el trozo disponible escribe igual que siempre", async () => {
    let pedidos = 0;
    const { app } = await iniciada({
      comandos: () => {
        pedidos++;
        return import("../src/lib/dominio/comandos.ts");
      },
    });
    expect(pedidos).toBe(0); // arrancar no baja los comandos
    const r = await app.ejecutar(comandoDeNovedad(app.estado!));
    expect(r.ok).toBe(true);
    expect(pedidos).toBe(1);
  });
});

describe("la escritura de la ficha se baja al guardar desde ella", () => {
  it("si el trozo no baja, el diálogo recibe un error general y no se escribe nada", async () => {
    const { app } = await iniciada({ ficha: sinRed });
    const unidad = app.estado!.unidades.find((u) => u.estado.tipo === "en-servicio")!;
    const antes = app.estado;
    const r = await app.ponerFueraDeServicio(unidad.id, { motivo: "En taller: cambio de embrague" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.general).toBe(ERRORES.noPudoGuardar);
    expect(app.estado).toBe(antes);
  });

  it("con el trozo disponible guarda", async () => {
    const { app } = await iniciada({});
    const unidad = app.estado!.unidades.find((u) => u.estado.tipo === "en-servicio")!;
    const r = await app.ponerFueraDeServicio(unidad.id, { motivo: "En taller: cambio de embrague" });
    expect(r.ok).toBe(true);
  });
});

describe("la escritura del parte se baja al escribir un parte", () => {
  it("descartar un borrador sin poder bajar el trozo contesta con el error y no rechaza", async () => {
    const { app } = await iniciada({ parte: sinRed });
    const r = await app.descartarBorradorDeParte("no-importa");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensaje).toBe(ERRORES.noPudoGuardar);
  });

  // Las cuatro escrituras del parte contestan como las de la ficha: «No se pudo guardar» y lo escrito sigue en pantalla. Nunca rechazan.
  const VALORES = {} as unknown as ValoresParte;
  const unidadDe = (app: EstadoApp): string => app.estado!.unidades.find((u) => u.estado.tipo === "en-servicio")!.id;

  it("guardar el borrador sin poder bajar el trozo: error de escritura con «No se pudo guardar el parte», sin rechazar", async () => {
    const { app } = await iniciada({ parte: sinRed });
    const r = await app.guardarBorradorDeParte(unidadDe(app), "2026-11-18", VALORES);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.tipo).toBe("escritura");
      expect(r.errores.general).toBe(ERRORES.noPudoGuardarElParte);
      expect(r.errores.titulo).toBe(TITULOS_DE_ERROR_DEL_PARTE.revision);
    }
  });

  it("guardar el cierre sin poder bajar el trozo: lo mismo, con el título del cierre", async () => {
    const { app } = await iniciada({ parte: sinRed });
    const r = await app.guardarCierreDeParte(unidadDe(app), "2026-11-18", VALORES);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.tipo).toBe("escritura");
      expect(r.errores.general).toBe(ERRORES.noPudoGuardarElParte);
      expect(r.errores.titulo).toBe(TITULOS_DE_ERROR_DEL_PARTE.cierre);
    }
  });

  it("enviar la revisión sin poder bajar el trozo: resumen de errores con el foco, sin rechazar", async () => {
    const { app } = await iniciada({ parte: sinRed });
    const r = await app.enviarRevisionDeParte(unidadDe(app), "2026-11-18", VALORES);
    expect(r).toMatchObject({ tipo: "errores", foco: "resumen-de-errores", primerCampo: null });
    if (r.tipo === "errores") {
      expect(r.errores.general).toBe(ERRORES.noPudoGuardarElParte);
      expect(r.errores.titulo).toBe(TITULOS_DE_ERROR_DEL_PARTE.revision);
    }
  });

  it("enviar el cierre sin poder bajar el trozo: lo mismo, con el título del cierre", async () => {
    const { app } = await iniciada({ parte: sinRed });
    const r = await app.enviarCierreDeParte(unidadDe(app), "2026-11-18", VALORES);
    expect(r).toMatchObject({ tipo: "errores", foco: "resumen-de-errores", primerCampo: null });
    if (r.tipo === "errores") {
      expect(r.errores.general).toBe(ERRORES.noPudoGuardarElParte);
      expect(r.errores.titulo).toBe(TITULOS_DE_ERROR_DEL_PARTE.cierre);
    }
  });

  it("la cola sigue andando después de un parte que no pudo bajar el trozo", async () => {
    const { app } = await iniciada({ parte: sinRed });
    await app.guardarBorradorDeParte(unidadDe(app), "2026-11-18", VALORES);
    await app.enviarRevisionDeParte(unidadDe(app), "2026-11-18", VALORES);
    expect((await app.ejecutar(comandoDeNovedad(app.estado!))).ok).toBe(true);
  });
});

describe("el trozo ya no existe (hay una versión nueva): el error lo dice y manda a recargar", () => {
  it("los textos hablan de la versión nueva y de recargar", () => {
    for (const texto of [ERRORES.noPudoGuardarPorVersionNueva, ERRORES.noPudoReiniciarPorVersionNueva, TEXTO_ERROR_DESCARGA.versionNueva]) {
      expect(texto).toMatch(/versión nueva/);
      expect(texto).toMatch(/[Rr]ecargue/);
      expect(texto).not.toMatch(/Intente de nuevo|Compruebe la conexión/);
    }
  });

  it("un comando: «No se pudo guardar» por versión nueva, sin cambiar nada", async () => {
    const { app } = await iniciada({ comandos: versionNueva });
    const antes = app.estado;
    const r = await app.ejecutar(comandoDeNovedad(antes!));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe("escritura-fallida");
      expect(r.error.mensaje).toBe(ERRORES.noPudoGuardarPorVersionNueva);
    }
    expect(app.estado).toBe(antes);
  });

  it("la ficha: el error general del diálogo", async () => {
    const { app } = await iniciada({ ficha: versionNueva });
    const unidad = app.estado!.unidades.find((u) => u.estado.tipo === "en-servicio")!;
    const r = await app.ponerFueraDeServicio(unidad.id, { motivo: "En taller: cambio de embrague" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.general).toBe(ERRORES.noPudoGuardarPorVersionNueva);
  });

  it("el parte: las cinco escrituras", async () => {
    const { app } = await iniciada({ parte: versionNueva });
    const unidadId = app.estado!.unidades.find((u) => u.estado.tipo === "en-servicio")!.id;
    const valores = {} as unknown as ValoresParte;
    const descartar = await app.descartarBorradorDeParte("no-importa");
    expect(descartar).toMatchObject({ ok: false, mensaje: ERRORES.noPudoGuardarPorVersionNueva });
    const borrador = await app.guardarBorradorDeParte(unidadId, "2026-11-18", valores);
    const cierre = await app.guardarCierreDeParte(unidadId, "2026-11-18", valores);
    expect(!borrador.ok && borrador.errores.general).toBe(ERRORES.noPudoGuardarPorVersionNueva);
    expect(!cierre.ok && cierre.errores.general).toBe(ERRORES.noPudoGuardarPorVersionNueva);
    for (const r of [await app.enviarRevisionDeParte(unidadId, "2026-11-18", valores), await app.enviarCierreDeParte(unidadId, "2026-11-18", valores)]) {
      expect(r.tipo === "errores" && r.errores.general).toBe(ERRORES.noPudoGuardarPorVersionNueva);
    }
  });
});

describe("un trozo de escritura que no responde no deja la cola trabada", () => {
  it("vencido el plazo, la escritura contesta «No se pudo guardar» y la siguiente anda", async () => {
    let colgado = true;
    const real = () => import("../src/lib/dominio/comandos.ts");
    const { app } = await iniciada({ comandos: () => (colgado ? new Promise<never>(() => {}) : real()) }, { plazoDescargaMs: 30 });
    const comando = comandoDeNovedad(app.estado!);
    const r = await app.ejecutar(comando);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toBe(ERRORES.noPudoGuardar);
    colgado = false;
    expect((await app.ejecutar(comando)).ok).toBe(true);
  });
});

describe("D12: los cambios de otra pestaña se miran después de esperar el trozo de comandos", () => {
  it("si el aviso llega mientras baja el trozo, no se escribe nada y se frena como cualquier escritura con cambios en otra pestaña", async () => {
    let soltar: () => void = () => {};
    const real = () => import("../src/lib/dominio/comandos.ts");
    const { app, repo, llegaCambioDeOtraPestana } = await iniciada({
      comandos: () => new Promise((resolver) => (soltar = () => resolver(real()))),
    });
    const antes = app.estado;
    const pendiente = app.ejecutar(comandoDeNovedad(antes!));
    await new Promise((resolver) => setTimeout(resolver, 10));
    expect(app.hayCambiosEnOtraPestana).toBe(false);
    llegaCambioDeOtraPestana();
    soltar();
    const r = await pendiente;
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.codigo).toBe("cambios-en-otra-pestana");
    expect(app.estado).toBe(antes);
    expect(await repo.cargar()).toEqual(antes);
    expect(app.bloqueosPorOtraPestana).toBe(1);
  });

  it("si el aviso ya estaba antes, se frena sin esperar el trozo (y cuenta un solo bloqueo)", async () => {
    let pedidos = 0;
    const { app, llegaCambioDeOtraPestana } = await iniciada({
      comandos: () => {
        pedidos++;
        return import("../src/lib/dominio/comandos.ts");
      },
    });
    llegaCambioDeOtraPestana();
    const r = await app.ejecutar(comandoDeNovedad(app.estado!));
    expect(!r.ok && r.error.codigo).toBe("cambios-en-otra-pestana");
    expect(pedidos).toBe(0);
    expect(app.bloqueosPorOtraPestana).toBe(1);
  });

  it("el autoguardado frenado a mitad de la espera tampoco cuenta como un bloqueo que lleve la vista al aviso", async () => {
    let soltar: () => void = () => {};
    const real = () => import("../src/lib/dominio/comandos.ts");
    const { app, llegaCambioDeOtraPestana } = await iniciada({ comandos: () => new Promise((resolver) => (soltar = () => resolver(real()))) });
    const pendiente = app.ejecutar({ tipo: "guardarBorrador" } as unknown as Comando);
    await new Promise((resolver) => setTimeout(resolver, 10));
    llegaCambioDeOtraPestana();
    soltar();
    await pendiente;
    expect(app.bloqueosPorOtraPestana).toBe(0);
  });
});

describe("el arranque con el generador de datos", () => {
  const generador = () => import("../src/lib/datos/generador.ts");

  it("sin poder bajarlo: la demo no queda «Preparando…»: error de arranque que manda a recargar, sin «sin almacenamiento»", async () => {
    const repo = new RepositorioMemoria();
    const app = new EstadoApp({
      reloj: crearReloj(() => new Date(MEDIODIA)),
      abrirAlmacenamiento: async () => repo,
      ubicacion: ubicacionEnMemoria(),
      crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
      cargarGenerador: sinRed,
    });
    await app.iniciar();
    expect(app.fase).toBe("error");
    expect(app.errorDeArranque).toBe(TEXTO_ERROR_DESCARGA.mensaje);
    expect(app.preparando).toBe(false);
    expect(app.enMemoria).toBe(false);
    expect(app.avisos).toEqual([]);
  });

  it("colgado: vencido su plazo, el mismo error de arranque", async () => {
    const app = new EstadoApp({
      reloj: crearReloj(() => new Date(MEDIODIA)),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion: ubicacionEnMemoria(),
      crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
      cargarGenerador: () => new Promise<never>(() => {}),
      plazoDescargaMs: 30,
    });
    await app.iniciar();
    expect(app.fase).toBe("error");
    expect(app.errorDeArranque).toBe(TEXTO_ERROR_DESCARGA.mensaje);
  });

  it("el generador ya no existe (versión nueva): el error de arranque lo dice", async () => {
    const app = new EstadoApp({
      reloj: crearReloj(() => new Date(MEDIODIA)),
      abrirAlmacenamiento: async () => new RepositorioMemoria(),
      ubicacion: ubicacionEnMemoria(),
      crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
      cargarGenerador: versionNueva,
    });
    await app.iniciar();
    expect(app.fase).toBe("error");
    expect(app.errorDeArranque).toBe(TEXTO_ERROR_DESCARGA.versionNueva);
  });

  it("llega tarde (más que el plazo del almacenamiento) pero llega: la demo arranca y guarda", async () => {
    const repo = new RepositorioMemoria();
    const app = new EstadoApp({
      reloj: crearReloj(() => new Date(MEDIODIA)),
      abrirAlmacenamiento: async () => repo,
      ubicacion: ubicacionEnMemoria(),
      crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
      plazoAbrirMs: 20,
      cargarGenerador: async () => {
        await new Promise((resolver) => setTimeout(resolver, 120));
        return generador();
      },
    });
    await app.iniciar();
    expect(app.fase).toBe("lista");
    expect(app.enMemoria).toBe(false);
    expect(app.avisos).toEqual([]);
    expect(await repo.cargar()).toEqual(app.estado);
  });

  it("«Reiniciar demo» con el generador caído: «No se pudo reiniciar», con los datos de antes", async () => {
    let caido = false;
    const { app, repo } = await iniciada({}, { cargarGenerador: () => (caido ? sinRed() : generador()) });
    const antes = app.estado;
    caido = true;
    const r = await app.reiniciar();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.mensaje).toBe(ERRORES.noPudoReiniciar);
    expect(app.estado).toBe(antes);
    expect(await repo.cargar()).toEqual(antes);
  });

  it("«Reiniciar demo» con el generador ya inexistente: el mensaje manda a recargar", async () => {
    let caido = false;
    const { app } = await iniciada({}, { cargarGenerador: () => (caido ? versionNueva() : generador()) });
    caido = true;
    const r = await app.reiniciar();
    expect(!r.ok && r.error.mensaje).toBe(ERRORES.noPudoReiniciarPorVersionNueva);
  });

  it("«Reiniciar demo» con el generador colgado no deja la cola trabada", async () => {
    let colgado = false;
    const { app } = await iniciada({}, { cargarGenerador: () => (colgado ? new Promise<never>(() => {}) : generador()), plazoDescargaMs: 30 });
    colgado = true;
    expect((await app.reiniciar()).ok).toBe(false);
    colgado = false;
    expect((await app.reiniciar()).ok).toBe(true);
  });
});
