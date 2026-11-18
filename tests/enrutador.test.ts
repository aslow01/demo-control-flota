import { describe, expect, it } from "vitest";
import { aHash, parsearHash, resolverRuta, rutaPorDefecto, tituloDePagina, type Ruta } from "../src/lib/estado/enrutador.ts";
import type { Perfil } from "../src/lib/dominio/tipos.ts";

const ENCARGADO: Perfil = { tipo: "encargado" };
const CONDUCTOR: Perfil = { tipo: "conductor", conductorId: "c-01" };

describe("enrutador: rutas válidas (diseno-ui.md, sección 2)", () => {
  it.each([
    ["#/alertas", { tipo: "alertas" }],
    ["#/flota", { tipo: "flota" }],
    ["#/conductor", { tipo: "conductor" }],
    ["#/unidad/ZK214BD", { tipo: "unidad", patente: "ZK214BD" }],
    ["#/parte/ZK214BD/2026-11-18", { tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" }],
  ] satisfies [string, Ruta][])("%s", (hash, ruta) => {
    expect(parsearHash(hash)).toEqual(ruta);
  });

  it("sin el # inicial y con una barra final también se entiende", () => {
    expect(parsearHash("/flota")).toEqual({ tipo: "flota" });
    expect(parsearHash("#/flota/")).toEqual({ tipo: "flota" });
  });

  it("hash vacío, '#' y '#/' piden la ruta por defecto del perfil", () => {
    for (const h of ["", "#", "#/", "/"]) expect(parsearHash(h)).toEqual({ tipo: "inicio" });
  });

  it("la patente en la ruta se normaliza: minúsculas, espacios y guiones", () => {
    expect(parsearHash("#/unidad/zk214bd")).toEqual({ tipo: "unidad", patente: "ZK214BD" });
    expect(parsearHash("#/unidad/ZK%20214%20BD")).toEqual({ tipo: "unidad", patente: "ZK214BD" });
    expect(parsearHash("#/unidad/zk-214-bd")).toEqual({ tipo: "unidad", patente: "ZK214BD" });
    expect(parsearHash("#/unidad/ZKB482")).toEqual({ tipo: "unidad", patente: "ZKB482" });
    expect(parsearHash("#/parte/zk%20214%20bd/2026-11-18")).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" });
  });
});

describe("enrutador: rutas inválidas (nunca una pantalla en blanco ni una excepción)", () => {
  it.each([
    "#/nada",
    "#/ALERTAS-",
    "#alertas",
    "#/alertas/otra",
    "#/flota/x",
    "#/unidad",
    "#/unidad/",
    "#/unidad/ABC",
    "#/unidad/ZK214BD/mas",
    "#/unidad/%E0%A4%A",
    "#/unidad/<script>alert(1)</script>",
    "#/unidad/ZK214BD?x=1",
    "#/parte",
    "#/parte/ZK214BD",
    "#/parte/ZK214BD/",
    "#/parte/ZK214BD/2026-02-30",
    "#/parte/ZK214BD/2026-13-01",
    "#/parte/ZK214BD/18-11-2026",
    "#/parte/ZK214BD/1999-12-31",
    "#/parte/XX/2026-11-18",
    "#//alertas",
    "#/%2e%2e/alertas",
    "#/__proto__",
    "#/constructor",
    "#/toString",
  ])("%s → desconocida", (hash) => {
    expect(parsearHash(hash)).toEqual({ tipo: "desconocida" });
  });

  it("un hash enorme no se procesa y no se repite en ningún lado", () => {
    const r = parsearHash("#/unidad/" + "A".repeat(100_000));
    expect(r).toEqual({ tipo: "desconocida" });
    expect(JSON.stringify(r)).not.toContain("AAAA");
  });

  it("la ruta desconocida no guarda el texto que escribió la persona", () => {
    expect(parsearHash("#/<img src=x onerror=alert(1)>")).toEqual({ tipo: "desconocida" });
  });
});

describe("enrutador: ida y vuelta", () => {
  const rutas: Ruta[] = [
    { tipo: "alertas" },
    { tipo: "flota" },
    { tipo: "conductor" },
    { tipo: "unidad", patente: "ZK214BD" },
    { tipo: "unidad", patente: "ABC123" },
    { tipo: "parte", patente: "ZKB482", fecha: "2026-02-28" },
  ];

  it.each(rutas.map((r) => [aHash(r), r] as const))("aHash y parsearHash se deshacen: %s", (hash, ruta) => {
    expect(parsearHash(hash)).toEqual(ruta);
    expect(aHash(parsearHash(hash) as Ruta)).toBe(hash);
  });

  it("la forma canónica usa la patente normalizada, sin espacios", () => {
    expect(aHash({ tipo: "unidad", patente: "ZK214BD" })).toBe("#/unidad/ZK214BD");
    expect(aHash({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" })).toBe("#/parte/ZK214BD/2026-11-18");
  });

  it("aHash de una ruta desconocida vuelve al inicio", () => {
    expect(aHash({ tipo: "desconocida" })).toBe("#/");
  });
});

describe("enrutador: ruta por defecto y perfil", () => {
  it("el encargado empieza en alertas y el conductor en su inicio", () => {
    expect(rutaPorDefecto(ENCARGADO)).toEqual({ tipo: "alertas" });
    expect(rutaPorDefecto(CONDUCTOR)).toEqual({ tipo: "conductor" });
  });

  it("sin ruta, cada perfil cae en la suya", () => {
    expect(resolverRuta("", ENCARGADO)).toEqual({ tipo: "alertas" });
    expect(resolverRuta("#/", CONDUCTOR)).toEqual({ tipo: "conductor" });
  });

  it("el encargado puede ver alertas, flota, ficha y parte, pero no el inicio del conductor", () => {
    expect(resolverRuta("#/flota", ENCARGADO)).toEqual({ tipo: "flota" });
    expect(resolverRuta("#/unidad/ZK214BD", ENCARGADO)).toEqual({ tipo: "unidad", patente: "ZK214BD" });
    expect(resolverRuta("#/parte/ZK214BD/2026-11-18", ENCARGADO)).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" });
    expect(resolverRuta("#/conductor", ENCARGADO)).toEqual({ tipo: "alertas" });
  });

  it("el conductor ve su inicio y el parte, y lo del encargado lo lleva a su inicio", () => {
    expect(resolverRuta("#/conductor", CONDUCTOR)).toEqual({ tipo: "conductor" });
    expect(resolverRuta("#/parte/ZK214BD/2026-11-18", CONDUCTOR)).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" });
    for (const h of ["#/alertas", "#/flota", "#/unidad/ZK214BD"]) expect(resolverRuta(h, CONDUCTOR)).toEqual({ tipo: "conductor" });
  });

  it("una ruta desconocida se muestra como error en cualquier perfil (no se esconde con una redirección)", () => {
    expect(resolverRuta("#/nada", ENCARGADO)).toEqual({ tipo: "desconocida" });
    expect(resolverRuta("#/nada", CONDUCTOR)).toEqual({ tipo: "desconocida" });
  });
});

describe("enrutador: título de la página", () => {
  it("'{Pantalla} · Control de flota (demo)'", () => {
    expect(tituloDePagina({ tipo: "alertas" })).toBe("Centro de alertas · Control de flota (demo)");
    expect(tituloDePagina({ tipo: "flota" })).toBe("Flota · Control de flota (demo)");
    expect(tituloDePagina({ tipo: "unidad", patente: "ZK214BD" })).toBe("Unidad ZK 214 BD · Control de flota (demo)");
    expect(tituloDePagina({ tipo: "conductor" })).toBe("Parte diario · Control de flota (demo)");
    expect(tituloDePagina({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" })).toBe(
      "Parte del miércoles 18/11/2026 · Control de flota (demo)",
    );
    expect(tituloDePagina({ tipo: "desconocida" })).toBe("Página no encontrada · Control de flota (demo)");
  });
});
