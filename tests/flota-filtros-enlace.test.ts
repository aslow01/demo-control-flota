// E2-P (3.8): las pastillas de Movilidades como enlaces (dirección, elegida, tono y forma) y la ruta de una consulta, con el ejemplo del generador.
import { describe, expect, it } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { aHash, parsearHash } from "../src/lib/estado/enrutador.ts";
import { CONSULTA_INICIAL, consultaDeRuta, panelDeFlota, quitarFiltros, rutaDeConsulta, vistaDeFlota, type ConsultaFlota } from "../src/lib/estado/flota.ts";

const H = "2026-11-18";
const e = generar(SEMILLA_POR_DEFECTO, H);
const panel = panelDeFlota(e, calcularAlertas(e, H), H);
const ver = (parcial: Partial<ConsultaFlota> = {}) => vistaDeFlota(panel, { ...CONSULTA_INICIAL, ...parcial });

describe("la ruta de una consulta (el filtro y la búsqueda viajan en la dirección)", () => {
  it("la consulta inicial es Movilidades sin nada más", () => {
    expect(rutaDeConsulta(CONSULTA_INICIAL)).toEqual({ tipo: "movilidades" });
    expect(aHash(rutaDeConsulta(CONSULTA_INICIAL))).toBe("#/movilidades");
  });

  it("un filtro que no es el de por defecto viaja; «activas» no", () => {
    expect(rutaDeConsulta({ ...CONSULTA_INICIAL, filtro: "no-disponibles" })).toEqual({ tipo: "movilidades", filtro: "no-disponibles" });
    expect(rutaDeConsulta({ ...CONSULTA_INICIAL, filtro: "activas" })).toEqual({ tipo: "movilidades" });
  });

  it("lo escrito en el buscador viaja tal cual, con el filtro, y sin buscar no hay `q`", () => {
    expect(rutaDeConsulta({ ...CONSULTA_INICIAL, busqueda: "hil" })).toEqual({ tipo: "movilidades", q: "hil" });
    expect(rutaDeConsulta({ ...CONSULTA_INICIAL, filtro: "de-baja", busqueda: "zk " })).toEqual({ tipo: "movilidades", filtro: "de-baja", q: "zk " });
    expect("q" in rutaDeConsulta(CONSULTA_INICIAL)).toBe(false);
  });

  it("el proyecto y el orden no viajan (son de la vista, no de la dirección)", () => {
    expect(rutaDeConsulta({ ...CONSULTA_INICIAL, proyecto: "proy-base", orden: "patente" })).toEqual({ tipo: "movilidades" });
  });

  it("ida y vuelta con `consultaDeRuta`, para cada filtro", () => {
    for (const filtro of ["activas", "pueden-salir", "no-disponibles", "no-pueden-salir", "fuera-de-servicio", "de-baja"] as const) {
      for (const busqueda of ["", "hilux", "zk 214"]) {
        const c: ConsultaFlota = { ...CONSULTA_INICIAL, filtro, busqueda };
        expect(consultaDeRuta(rutaDeConsulta(c))).toEqual(c);
        const leida = parsearHash(aHash(rutaDeConsulta(c)));
        expect(leida).toEqual(rutaDeConsulta(c));
      }
    }
  });

  it("una búsqueda enorme o con caracteres raros no rompe la dirección", () => {
    const hash = aHash(rutaDeConsulta({ ...CONSULTA_INICIAL, busqueda: "á".repeat(500) + "<b>&?#" }));
    expect(hash.length).toBeLessThanOrEqual(200);
    expect(parsearHash(hash).tipo).toBe("movilidades");
  });

  it("«Quitar filtros» da la ruta pelada de Movilidades", () => {
    const sucia: ConsultaFlota = { filtro: "de-baja", busqueda: "zz9", proyecto: "proy-base", orden: "patente" };
    expect(rutaDeConsulta(quitarFiltros(sucia))).toEqual({ tipo: "movilidades" });
  });
});

describe("pastillas de Movilidades como enlaces", () => {
  it("cada una lleva a la dirección de su filtro (la de «Activas» es la pelada)", () => {
    const hrefs = Object.fromEntries(ver().filtros.map((f) => [f.id, f.href]));
    expect(hrefs).toEqual({
      activas: "#/movilidades",
      "pueden-salir": "#/movilidades?filtro=disponibles",
      "no-disponibles": "#/movilidades?filtro=no-disponibles",
      "no-pueden-salir": "#/movilidades?filtro=bloqueadas",
      "fuera-de-servicio": "#/movilidades?filtro=fuera",
      "de-baja": "#/movilidades?filtro=baja",
    });
  });

  it("cada dirección se lee de vuelta como el filtro de su pastilla", () => {
    for (const f of ver().filtros) {
      const ruta = parsearHash(f.href);
      expect(ruta.tipo).toBe("movilidades");
      expect(consultaDeRuta(ruta as Parameters<typeof consultaDeRuta>[0]).filtro).toBe(f.id);
    }
  });

  it("al cambiar de filtro se conserva lo que se buscó", () => {
    const v = ver({ busqueda: "hilux", filtro: "de-baja" });
    expect(v.filtros.map((f) => f.href)).toEqual([
      "#/movilidades?q=hilux",
      "#/movilidades?filtro=disponibles&q=hilux",
      "#/movilidades?filtro=no-disponibles&q=hilux",
      "#/movilidades?filtro=bloqueadas&q=hilux",
      "#/movilidades?filtro=fuera&q=hilux",
      "#/movilidades?filtro=baja&q=hilux",
    ]);
  });

  it("solo la del filtro elegido está marcada como actual", () => {
    for (const filtro of ["activas", "pueden-salir", "no-disponibles", "no-pueden-salir", "fuera-de-servicio", "de-baja"] as const) {
      expect(ver({ filtro }).filtros.filter((f) => f.actual).map((f) => f.id)).toEqual([filtro]);
    }
  });

  it("el tono y la forma acompañan a lo crítico: no disponibles y bloqueadas en rombo cobre, fuera de servicio en triángulo azufre", () => {
    const por = Object.fromEntries(ver().filtros.map((f) => [f.id, [f.tono, f.forma]]));
    expect(por).toEqual({
      activas: [null, null],
      "pueden-salir": [null, null],
      "no-disponibles": ["critico", "rombo"],
      "no-pueden-salir": ["critico", "rombo"],
      "fuera-de-servicio": ["semana", "triangulo"],
      "de-baja": [null, null],
    });
  });

  it("la dirección de una pastilla nunca repite la búsqueda sin acotarla", () => {
    const v = ver({ busqueda: "x".repeat(1000) });
    for (const f of v.filtros) expect(f.href.length).toBeLessThanOrEqual(200);
  });
});
