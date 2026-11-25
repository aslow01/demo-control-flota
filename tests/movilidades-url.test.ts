// E2-P (3.2 y 3.8) de punta a punta: el filtro y la búsqueda de Movilidades viajan en la dirección, una letra no apila historial, un filtro sí, no se mueve el
// foco ni el desplazamiento (`versionDePantalla`), y al volver de una ficha se conserva todo. Con el ejemplo del generador (hoy 18/11/2026).
import { describe, expect, it } from "vitest";
import { EstadoApp } from "../src/lib/estado/app.svelte.ts";
import { CONSULTA_INICIAL, consultaDeRuta, rutaDeConsulta, vistaDeFlota, type ConsultaFlota } from "../src/lib/estado/flota.ts";
import { aHash, parsearHash } from "../src/lib/estado/enrutador.ts";
import { crearReloj } from "../src/lib/estado/reloj.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { RepositorioMemoria } from "../src/lib/persistencia/memoria.ts";

async function iniciada(hash = "#/movilidades") {
  const ubicacion = ubicacionEnMemoria(hash);
  const app = new EstadoApp({
    reloj: crearReloj(() => new Date("2026-11-18T15:00:00.000Z")),
    abrirAlmacenamiento: async () => new RepositorioMemoria(),
    ubicacion,
    crearAvisoPestanas: () => ({ avisarCambio() {}, cerrar() {} }),
  });
  await app.iniciar();
  return { app, ubicacion };
}

/** Hace lo que el navegador al seguir un enlace: va a la dirección de la pastilla. */
function irAHref(app: EstadoApp, href: string): void {
  const ruta = parsearHash(href);
  if (ruta.tipo === "sin-ruta") throw new Error(`${href} no es una ruta`);
  app.irA(ruta);
}

const vista = (app: EstadoApp, c: ConsultaFlota) => {
  if (app.panelDeFlota === null) throw new Error("falta la flota");
  return vistaDeFlota(app.panelDeFlota, c);
};

describe("Movilidades en la dirección", () => {
  it("elegir una pastilla agrega una entrada al historial, deja el foco donde está y cambia lo que se ve", async () => {
    const { app, ubicacion } = await iniciada();
    const pantalla = app.versionDePantalla;
    const entradas = ubicacion.entradas;
    const bloqueadas = vista(app, CONSULTA_INICIAL).filtros.find((f) => f.id === "no-pueden-salir");
    irAHref(app, bloqueadas?.href ?? "");
    expect(ubicacion.hash).toBe("#/movilidades?filtro=bloqueadas");
    expect(ubicacion.entradas).toBe(entradas + 1);
    expect(app.versionDePantalla).toBe(pantalla);
    expect(vista(app, consultaDeRuta(app.ruta)).filas.map((f) => f.patente).sort()).toEqual(["ZK214BD", "ZZD563"]);
  });

  it("cada letra del buscador reescribe la dirección sin agregar entradas y sin mover el foco", async () => {
    const { app, ubicacion } = await iniciada("#/movilidades?filtro=disponibles");
    const pantalla = app.versionDePantalla;
    const entradas = ubicacion.entradas;
    let consulta = consultaDeRuta(app.ruta);
    for (const letra of "hilux") {
      consulta = { ...consulta, busqueda: consulta.busqueda + letra };
      app.ajustarConsulta(rutaDeConsulta(consulta));
    }
    expect(ubicacion.hash).toBe("#/movilidades?filtro=disponibles&q=hilux");
    expect(ubicacion.entradas).toBe(entradas);
    expect(app.versionDePantalla).toBe(pantalla);
    expect(consultaDeRuta(app.ruta)).toMatchObject({ filtro: "pueden-salir", busqueda: "hilux" });
  });

  it("cambiar de pastilla con una búsqueda escrita la conserva", async () => {
    const { app, ubicacion } = await iniciada("#/movilidades?q=zk");
    const fuera = vista(app, consultaDeRuta(app.ruta)).filtros.find((f) => f.id === "fuera-de-servicio");
    expect(fuera?.href).toBe("#/movilidades?filtro=fuera&q=zk");
    irAHref(app, fuera?.href ?? "");
    expect(consultaDeRuta(app.ruta)).toMatchObject({ filtro: "fuera-de-servicio", busqueda: "zk" });
    expect(ubicacion.hash).toBe("#/movilidades?filtro=fuera&q=zk");
  });

  it("ir a la ficha y volver con «Atrás» de la aplicación deja la lista como estaba (filtro y búsqueda)", async () => {
    const { app } = await iniciada("#/movilidades?filtro=bloqueadas&q=zk");
    const ficha = vista(app, consultaDeRuta(app.ruta)).filas[0];
    expect(ficha?.patente).toBe("ZK214BD");
    app.irA({ tipo: "unidad", patente: ficha?.patente ?? "" });
    expect(app.ruta.tipo).toBe("unidad");
    expect(app.padre).toEqual({ tipo: "movilidades", filtro: "no-pueden-salir", q: "zk" });
    expect(aHash(app.padre ?? { tipo: "inicio" })).toBe("#/movilidades?filtro=bloqueadas&q=zk");
  });

  it("al llegar a otra pantalla que no es una ficha se olvida y Movilidades empieza limpia", async () => {
    const { app } = await iniciada("#/movilidades?filtro=bloqueadas&q=zk");
    app.irA({ tipo: "inicio" });
    app.irA({ tipo: "unidad", patente: "ZK214BD" });
    expect(app.padre).toEqual({ tipo: "movilidades" });
  });

  it("una dirección con un filtro viejo (`no-pueden-salir`) se reescribe al vocabulario nuevo", async () => {
    const { app, ubicacion } = await iniciada("#/flota?filtro=no-pueden-salir&q=zk");
    expect(ubicacion.hash).toBe("#/movilidades?filtro=bloqueadas&q=zk");
    expect(consultaDeRuta(app.ruta)).toMatchObject({ filtro: "no-pueden-salir", busqueda: "zk" });
  });

  it("los números de las pastillas son los de la flota entera, con cualquier búsqueda", async () => {
    const { app } = await iniciada("#/movilidades?q=hilux");
    if (app.panelDeFlota === null) throw new Error("falta la flota");
    const sin = vistaDeFlota(app.panelDeFlota, CONSULTA_INICIAL).filtros.map((f) => f.cantidad);
    const con = vista(app, consultaDeRuta(app.ruta)).filtros.map((f) => f.cantidad);
    expect(con).toEqual(sin);

  });
});
