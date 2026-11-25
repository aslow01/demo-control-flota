import { describe, expect, it } from "vitest";
import {
  LARGO_MAXIMO_BUSQUEDA,
  aHash,
  claveConsulta,
  clavePantalla,
  migasDe,
  nombreDePantalla,
  parsearHash,
  resolverRuta,
  rutaPadre,
  rutaPorDefecto,
  tituloDePagina,
  type Ruta,
} from "../src/lib/estado/enrutador.ts";
import type { Perfil } from "../src/lib/dominio/tipos.ts";

const ENCARGADO: Perfil = { tipo: "encargado" };
const CONDUCTOR: Perfil = { tipo: "conductor", conductorId: "c-01" };
const HOY = "2026-11-25";

describe("enrutador: rutas válidas (docs/diseno-ui.md, sección 2, con las rutas del rediseño)", () => {
  it.each([
    ["#/inicio", { tipo: "inicio" }],
    ["#/movilidades", { tipo: "movilidades" }],
    ["#/vencimientos", { tipo: "vencimientos" }],
    ["#/operacion/checklists", { tipo: "operacion", solapa: "checklists" }],
    ["#/operacion/novedades", { tipo: "operacion", solapa: "novedades" }],
    ["#/conductor", { tipo: "conductor" }],
    ["#/conductor/partes", { tipo: "mis-partes" }],
    ["#/mas", { tipo: "mas" }],
    ["#/unidad/ZK214BD", { tipo: "unidad", patente: "ZK214BD" }],
    ["#/parte/ZK214BD/2026-11-18", { tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" }],
  ] satisfies [string, Ruta][])("%s", (hash, ruta) => {
    expect(parsearHash(hash)).toEqual(ruta);
  });

  it("sin el # inicial y con una barra final también se entiende", () => {
    expect(parsearHash("/movilidades")).toEqual({ tipo: "movilidades" });
    expect(parsearHash("#/movilidades/")).toEqual({ tipo: "movilidades" });
  });

  it("hash vacío, '#' y '#/' piden la ruta por defecto del perfil (no son la pantalla Inicio)", () => {
    for (const h of ["", "#", "#/", "/"]) expect(parsearHash(h)).toEqual({ tipo: "sin-ruta" });
  });

  it("la patente en la ruta se normaliza: minúsculas, espacios y guiones", () => {
    expect(parsearHash("#/unidad/zk214bd")).toEqual({ tipo: "unidad", patente: "ZK214BD" });
    expect(parsearHash("#/unidad/ZK%20214%20BD")).toEqual({ tipo: "unidad", patente: "ZK214BD" });
    expect(parsearHash("#/unidad/zk-214-bd")).toEqual({ tipo: "unidad", patente: "ZK214BD" });
    expect(parsearHash("#/unidad/ZKB482")).toEqual({ tipo: "unidad", patente: "ZKB482" });
    expect(parsearHash("#/parte/zk%20214%20bd/2026-11-18")).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" });
  });
});

describe("enrutador: alias de las rutas viejas (un enlace guardado sigue abriendo la pantalla equivalente)", () => {
  it.each([
    ["#/alertas", { tipo: "inicio" }],
    ["#/flota", { tipo: "movilidades" }],
    ["#/flota/", { tipo: "movilidades" }],
    ["#/flota?filtro=no-disponibles", { tipo: "movilidades", filtro: "no-disponibles" }],
    ["#/flota?filtro=pueden-salir", { tipo: "movilidades", filtro: "pueden-salir" }],
    ["#/operacion", { tipo: "operacion", solapa: "checklists" }],
    ["#/operacion/", { tipo: "operacion", solapa: "checklists" }],
  ] satisfies [string, Ruta][])("%s", (hash, ruta) => {
    expect(parsearHash(hash)).toEqual(ruta);
  });

  it("aHash siempre emite la forma nueva: el alias viejo se reescribe", () => {
    expect(aHash(parsearHash("#/alertas") as Ruta)).toBe("#/inicio");
    expect(aHash(parsearHash("#/flota") as Ruta)).toBe("#/movilidades");
    expect(aHash(parsearHash("#/flota?filtro=de-baja") as Ruta)).toBe("#/movilidades?filtro=baja");
    expect(aHash(parsearHash("#/operacion") as Ruta)).toBe("#/operacion/checklists");
  });
});

describe("enrutador: #/parte/PATENTE sin fecha es el parte de hoy", () => {
  it("con el día de hoy, la ruta lleva la fecha de hoy (y la forma canónica la escribe)", () => {
    const r = parsearHash("#/parte/zk214bd", HOY);
    expect(r).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: HOY });
    expect(aHash(r as Ruta)).toBe("#/parte/ZK214BD/2026-11-25");
    expect(parsearHash("#/parte/ZK214BD/", HOY)).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: HOY });
  });

  it("sin saber qué día es hoy (o con hoy vacío) no se inventa una fecha: ruta desconocida", () => {
    expect(parsearHash("#/parte/ZK214BD")).toEqual({ tipo: "desconocida" });
    expect(parsearHash("#/parte/ZK214BD", "")).toEqual({ tipo: "desconocida" });
  });

  it("con fecha, manda la fecha escrita; una patente inválida sigue siendo desconocida", () => {
    expect(parsearHash("#/parte/ZK214BD/2026-11-18", HOY)).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" });
    expect(parsearHash("#/parte/XX", HOY)).toEqual({ tipo: "desconocida" });
    expect(parsearHash("#/parte", HOY)).toEqual({ tipo: "desconocida" });
  });

  it("resolverRuta usa el día de hoy que recibe", () => {
    expect(resolverRuta("#/parte/ZK214BD", ENCARGADO, HOY)).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: HOY });
    expect(resolverRuta("#/parte/ZK214BD", CONDUCTOR, HOY)).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: HOY });
  });
});

describe("enrutador: rutas inválidas (nunca una pantalla en blanco ni una excepción)", () => {
  it.each([
    "#/nada",
    "#/ALERTAS-",
    "#alertas",
    "#alertas/otra",
    "#/inicio/otra",
    "#/alertas/otra",
    "#/flota/x",
    "#/movilidades/x",
    "#/vencimientos/x",
    "#/operacion/otra",
    "#/operacion/checklists/x",
    "#/conductor/otra",
    "#/conductor/partes/x",
    "#/mas/x",
    "#/unidad",
    "#/unidad/",
    "#/unidad/ABC",
    "#/unidad/ZK214BD/mas",
    "#/unidad/%E0%A4%A",
    "#/unidad/<script>alert(1)</script>",
    "#/unidad/ZK214BD?x=1",
    "#/parte",
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
    "#/operacion/__proto__",
  ])("%s → desconocida", (hash) => {
    expect(parsearHash(hash)).toEqual({ tipo: "desconocida" });
  });

  it("un hash enorme no se procesa y no se repite en ningún lado", () => {
    const r = parsearHash("#/unidad/" + "A".repeat(100_000));
    expect(r).toEqual({ tipo: "desconocida" });
    expect(JSON.stringify(r)).not.toContain("AAAA");
    expect(parsearHash("#/movilidades?q=" + "a".repeat(5_000))).toEqual({ tipo: "desconocida" });
  });

  it("la ruta desconocida no guarda el texto que escribió la persona", () => {
    expect(parsearHash("#/<img src=x onerror=alert(1)>")).toEqual({ tipo: "desconocida" });
  });

  it("solo Movilidades y Vencimientos admiten consulta: en las demás pantallas un «?» es una ruta que no se entiende", () => {
    for (const h of [
      "#/inicio?filtro=baja",
      "#/alertas?filtro=de-baja",
      "#/conductor?x=1",
      "#/conductor/partes?x=1",
      "#/operacion/checklists?filtro=vencidos",
      "#/operacion?x=1",
      "#/mas?q=a",
      "#/parte/ZK214BD/2026-11-18?x=1",
    ]) {
      expect(parsearHash(h)).toEqual({ tipo: "desconocida" });
    }
  });
});

describe("enrutador: ida y vuelta", () => {
  const rutas: Ruta[] = [
    { tipo: "inicio" },
    { tipo: "movilidades" },
    { tipo: "vencimientos" },
    { tipo: "operacion", solapa: "checklists" },
    { tipo: "operacion", solapa: "novedades" },
    { tipo: "conductor" },
    { tipo: "mis-partes" },
    { tipo: "mas" },
    { tipo: "unidad", patente: "ZK214BD" },
    { tipo: "unidad", patente: "ABC123" },
    { tipo: "parte", patente: "ZKB482", fecha: "2026-02-28" },
  ];

  it.each(rutas.map((r) => [aHash(r), r] as const))("aHash y parsearHash se deshacen: %s", (hash, ruta) => {
    expect(parsearHash(hash)).toEqual(ruta);
    expect(aHash(parsearHash(hash) as Ruta)).toBe(hash);
  });

  it("la forma canónica de cada pantalla", () => {
    expect(rutas.map(aHash)).toEqual([
      "#/inicio",
      "#/movilidades",
      "#/vencimientos",
      "#/operacion/checklists",
      "#/operacion/novedades",
      "#/conductor",
      "#/conductor/partes",
      "#/mas",
      "#/unidad/ZK214BD",
      "#/unidad/ABC123",
      "#/parte/ZKB482/2026-02-28",
    ]);
  });

  it("aHash de una ruta desconocida vuelve al inicio", () => {
    expect(aHash({ tipo: "desconocida" })).toBe("#/");
  });
});

describe("enrutador: ruta por defecto y perfil", () => {
  it("el encargado empieza en Inicio y el conductor en Hoy", () => {
    expect(rutaPorDefecto(ENCARGADO)).toEqual({ tipo: "inicio" });
    expect(rutaPorDefecto(CONDUCTOR)).toEqual({ tipo: "conductor" });
  });

  it("sin ruta, cada perfil cae en la suya", () => {
    expect(resolverRuta("", ENCARGADO)).toEqual({ tipo: "inicio" });
    expect(resolverRuta("#/", CONDUCTOR)).toEqual({ tipo: "conductor" });
  });

  it("el encargado ve Inicio, Movilidades, ficha, Vencimientos, Operación, parte y Más; no lo del conductor", () => {
    expect(resolverRuta("#/movilidades", ENCARGADO)).toEqual({ tipo: "movilidades" });
    expect(resolverRuta("#/vencimientos", ENCARGADO)).toEqual({ tipo: "vencimientos" });
    expect(resolverRuta("#/operacion/novedades", ENCARGADO)).toEqual({ tipo: "operacion", solapa: "novedades" });
    expect(resolverRuta("#/unidad/ZK214BD", ENCARGADO)).toEqual({ tipo: "unidad", patente: "ZK214BD" });
    expect(resolverRuta("#/parte/ZK214BD/2026-11-18", ENCARGADO)).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" });
    expect(resolverRuta("#/mas", ENCARGADO)).toEqual({ tipo: "mas" });
    expect(resolverRuta("#/conductor", ENCARGADO)).toEqual({ tipo: "inicio" });
    expect(resolverRuta("#/conductor/partes", ENCARGADO)).toEqual({ tipo: "inicio" });
  });

  it("el conductor ve Hoy, Mis partes, el parte y Más; lo del encargado lo lleva a Hoy (no cambia de perfil por la dirección)", () => {
    expect(resolverRuta("#/conductor", CONDUCTOR)).toEqual({ tipo: "conductor" });
    expect(resolverRuta("#/conductor/partes", CONDUCTOR)).toEqual({ tipo: "mis-partes" });
    expect(resolverRuta("#/parte/ZK214BD/2026-11-18", CONDUCTOR)).toEqual({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" });
    expect(resolverRuta("#/mas", CONDUCTOR)).toEqual({ tipo: "mas" });
    for (const h of ["#/inicio", "#/alertas", "#/flota", "#/movilidades", "#/vencimientos", "#/operacion/checklists", "#/operacion", "#/unidad/ZK214BD"]) {
      expect(resolverRuta(h, CONDUCTOR)).toEqual({ tipo: "conductor" });
    }
  });

  it("una ruta desconocida se muestra como error en cualquier perfil (no se esconde con una redirección)", () => {
    expect(resolverRuta("#/nada", ENCARGADO)).toEqual({ tipo: "desconocida" });
    expect(resolverRuta("#/nada", CONDUCTOR)).toEqual({ tipo: "desconocida" });
  });
});

describe("enrutador: nombre y título de la pantalla (NOMBRES_DE_PANTALLA)", () => {
  it("el nombre de cada pantalla sale de NOMBRES_DE_PANTALLA", () => {
    const nombres: [Ruta, string][] = [
      [{ tipo: "inicio" }, "Inicio"],
      [{ tipo: "movilidades" }, "Movilidades"],
      [{ tipo: "vencimientos" }, "Vencimientos"],
      [{ tipo: "operacion", solapa: "checklists" }, "Operación diaria"],
      [{ tipo: "operacion", solapa: "novedades" }, "Operación diaria"],
      [{ tipo: "conductor" }, "Hoy"],
      [{ tipo: "mis-partes" }, "Mis partes"],
      [{ tipo: "mas" }, "Más"],
      [{ tipo: "unidad", patente: "ZK214BD" }, "Unidad ZK 214 BD"],
      [{ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" }, "Parte del miércoles 18/11/2026"],
      [{ tipo: "desconocida" }, "Página no encontrada"],
    ];
    for (const [ruta, nombre] of nombres) {
      expect(nombreDePantalla(ruta)).toBe(nombre);
      expect(nombreDePantalla(ruta)).not.toContain("Control de flota");
    }
  });

  it("'{Pantalla} · Control de flota (demo)'; en Operación el título dice la solapa", () => {
    expect(tituloDePagina({ tipo: "inicio" })).toBe("Inicio · Control de flota (demo)");
    expect(tituloDePagina({ tipo: "movilidades" })).toBe("Movilidades · Control de flota (demo)");
    expect(tituloDePagina({ tipo: "operacion", solapa: "checklists" })).toBe("Checklists · Control de flota (demo)");
    expect(tituloDePagina({ tipo: "operacion", solapa: "novedades" })).toBe("Novedades · Control de flota (demo)");
    expect(tituloDePagina({ tipo: "conductor" })).toBe("Hoy · Control de flota (demo)");
    expect(tituloDePagina({ tipo: "unidad", patente: "ZK214BD" })).toBe("Unidad ZK 214 BD · Control de flota (demo)");
    expect(tituloDePagina({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" })).toBe("Parte del miércoles 18/11/2026 · Control de flota (demo)");
    expect(tituloDePagina({ tipo: "desconocida" })).toBe("Página no encontrada · Control de flota (demo)");
  });
});

describe("enrutador: filtro de Movilidades en la ruta (?filtro=)", () => {
  it.each([
    ["#/movilidades?filtro=no-disponibles", { tipo: "movilidades", filtro: "no-disponibles" }],
    ["#/movilidades?filtro=disponibles", { tipo: "movilidades", filtro: "pueden-salir" }],
    ["#/movilidades?filtro=bloqueadas", { tipo: "movilidades", filtro: "no-pueden-salir" }],
    ["#/movilidades?filtro=fuera", { tipo: "movilidades", filtro: "fuera-de-servicio" }],
    ["#/movilidades?filtro=baja", { tipo: "movilidades", filtro: "de-baja" }],
    ["#/movilidades/?filtro=baja", { tipo: "movilidades", filtro: "de-baja" }],
  ] satisfies [string, Ruta][])("%s", (hash, ruta) => {
    expect(parsearHash(hash)).toEqual(ruta);
  });

  it("los valores de las rutas viejas también se entienden (enlaces guardados)", () => {
    expect(parsearHash("#/flota?filtro=pueden-salir")).toEqual({ tipo: "movilidades", filtro: "pueden-salir" });
    expect(parsearHash("#/movilidades?filtro=no-pueden-salir")).toEqual({ tipo: "movilidades", filtro: "no-pueden-salir" });
    expect(parsearHash("#/flota?filtro=fuera-de-servicio")).toEqual({ tipo: "movilidades", filtro: "fuera-de-servicio" });
    expect(parsearHash("#/flota?filtro=de-baja")).toEqual({ tipo: "movilidades", filtro: "de-baja" });
  });

  it("«activas» es el filtro por defecto: no viaja en la ruta", () => {
    expect(parsearHash("#/movilidades?filtro=activas")).toEqual({ tipo: "movilidades" });
    expect(parsearHash("#/flota?filtro=activas")).toEqual({ tipo: "movilidades" });
  });

  it("un filtro desconocido, vacío o roto se ignora: es Movilidades sin filtro, nunca una excepción ni un eco del texto", () => {
    for (const h of [
      "#/movilidades?filtro=zz9",
      "#/movilidades?filtro=",
      "#/movilidades?",
      "#/movilidades?x=1",
      "#/movilidades?filtro=%E0%A4%A",
      "#/movilidades?filtro=__proto__",
      "#/movilidades?filtro=<script>",
      "#/movilidades?filtro=vencidos",
    ]) {
      expect(parsearHash(h)).toEqual({ tipo: "movilidades" });
    }
    expect(parsearHash("#/movilidades?filtro=baja&filtro=disponibles")).toEqual({ tipo: "movilidades", filtro: "de-baja" });
  });

  it("aHash: forma canónica con el vocabulario nuevo; ida y vuelta de cada filtro", () => {
    expect(aHash({ tipo: "movilidades" })).toBe("#/movilidades");
    expect(aHash({ tipo: "movilidades", filtro: "no-disponibles" })).toBe("#/movilidades?filtro=no-disponibles");
    expect(aHash({ tipo: "movilidades", filtro: "pueden-salir" })).toBe("#/movilidades?filtro=disponibles");
    expect(aHash({ tipo: "movilidades", filtro: "no-pueden-salir" })).toBe("#/movilidades?filtro=bloqueadas");
    expect(aHash({ tipo: "movilidades", filtro: "fuera-de-servicio" })).toBe("#/movilidades?filtro=fuera");
    expect(aHash({ tipo: "movilidades", filtro: "de-baja" })).toBe("#/movilidades?filtro=baja");
    for (const filtro of ["pueden-salir", "no-pueden-salir", "fuera-de-servicio", "de-baja", "no-disponibles"] as const) {
      expect(parsearHash(aHash({ tipo: "movilidades", filtro }))).toEqual({ tipo: "movilidades", filtro });
    }
  });

  it("el encargado la ve con su filtro; el conductor, no (se lo lleva a su inicio)", () => {
    expect(resolverRuta("#/movilidades?filtro=no-disponibles", ENCARGADO)).toEqual({ tipo: "movilidades", filtro: "no-disponibles" });
    expect(resolverRuta("#/movilidades?filtro=no-disponibles", CONDUCTOR)).toEqual({ tipo: "conductor" });
  });

  it("el nombre y el título de la pantalla no cambian con el filtro", () => {
    expect(nombreDePantalla({ tipo: "movilidades", filtro: "de-baja", q: "hilux" })).toBe("Movilidades");
    expect(tituloDePagina({ tipo: "movilidades", filtro: "de-baja" })).toBe("Movilidades · Control de flota (demo)");
  });
});

describe("enrutador: búsqueda de Movilidades en la ruta (&q=)", () => {
  it("se lee sola o junto al filtro, y vuelve igual", () => {
    expect(parsearHash("#/movilidades?q=hilux")).toEqual({ tipo: "movilidades", q: "hilux" });
    expect(parsearHash("#/movilidades?filtro=baja&q=hilux")).toEqual({ tipo: "movilidades", filtro: "de-baja", q: "hilux" });
    expect(parsearHash("#/flota?q=hilux")).toEqual({ tipo: "movilidades", q: "hilux" });
    expect(aHash({ tipo: "movilidades", q: "hilux" })).toBe("#/movilidades?q=hilux");
    expect(aHash({ tipo: "movilidades", filtro: "de-baja", q: "hilux" })).toBe("#/movilidades?filtro=baja&q=hilux");
  });

  it("un q vacío no viaja", () => {
    expect(parsearHash("#/movilidades?q=")).toEqual({ tipo: "movilidades" });
    expect(aHash({ tipo: "movilidades", q: "" })).toBe("#/movilidades");
    expect(aHash({ tipo: "movilidades", filtro: "de-baja", q: "" })).toBe("#/movilidades?filtro=baja");
  });

  it("lo escrito se codifica: espacios, tildes, & y = no rompen la dirección, y ida y vuelta devuelve el mismo texto", () => {
    for (const q of ["zk 214", "camión", "a&b=c", "100%", "a+b", "ñandú ñ", "x y "]) {
      const hash = aHash({ tipo: "movilidades", q });
      expect(hash).toMatch(/^#\/movilidades\?q=[A-Za-z0-9%._~!*'()-]+$/);
      expect(parsearHash(hash)).toEqual({ tipo: "movilidades", q });
    }
  });

  it("no se recorta con trim: una letra tipeada con un espacio al final no se pierde (la dirección sigue lo que se escribe)", () => {
    expect(aHash({ tipo: "movilidades", q: "zk " })).toBe("#/movilidades?q=zk%20");
    expect(parsearHash("#/movilidades?q=zk%20")).toEqual({ tipo: "movilidades", q: "zk " });
  });

  it("el + de una dirección escrita a mano es un espacio; los caracteres de control y los rotos se descartan", () => {
    expect(parsearHash("#/movilidades?q=zk+214")).toEqual({ tipo: "movilidades", q: "zk 214" });
    expect(parsearHash("#/movilidades?q=a%00b%0Ac%7Fd")).toEqual({ tipo: "movilidades", q: "abcd" });
    expect(parsearHash("#/movilidades?q=%E0%A4%A")).toEqual({ tipo: "movilidades", q: "%A" });
  });

  it("se acota: más de LARGO_MAXIMO_BUSQUEDA caracteres se cortan, y la dirección nunca pasa del límite del hash", () => {
    const larga = "a".repeat(LARGO_MAXIMO_BUSQUEDA + 20);
    const r = parsearHash(`#/movilidades?q=${larga}`);
    expect(r).toEqual({ tipo: "movilidades", q: "a".repeat(LARGO_MAXIMO_BUSQUEDA) });
    // con caracteres que se codifican largo (4 bytes cada uno) también entra: aHash corta hasta que la dirección sea válida
    const hash = aHash({ tipo: "movilidades", filtro: "no-pueden-salir", q: "😀".repeat(LARGO_MAXIMO_BUSQUEDA) });
    expect(hash.length).toBeLessThanOrEqual(200);
    expect(parsearHash(hash).tipo).toBe("movilidades");
  });

  it("lo que viaja en q no es nunca una ruta: HTML y rutas escritas ahí son texto", () => {
    expect(parsearHash("#/movilidades?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E")).toEqual({ tipo: "movilidades", q: "<script>alert(1)</script>" });
    expect(parsearHash("#/movilidades?q=__proto__")).toEqual({ tipo: "movilidades", q: "__proto__" });
    expect(Object.keys(parsearHash("#/movilidades?q=x&__proto__=1")).sort()).toEqual(["q", "tipo"]);
  });

  it("solo Movilidades tiene búsqueda: en Vencimientos, q sin filtro es una pantalla sin consulta", () => {
    expect(parsearHash("#/vencimientos?q=a")).toEqual({ tipo: "vencimientos" });
  });
});

describe("enrutador: filtro de Vencimientos en la ruta (?filtro=)", () => {
  it.each([
    ["#/vencimientos?filtro=vencidos", { tipo: "vencimientos", filtro: "vencidos" }],
    ["#/vencimientos?filtro=proximos", { tipo: "vencimientos", filtro: "proximos" }],
    ["#/vencimientos?filtro=7", { tipo: "vencimientos", filtro: "7" }],
    ["#/vencimientos?filtro=15", { tipo: "vencimientos", filtro: "15" }],
    ["#/vencimientos?filtro=30", { tipo: "vencimientos", filtro: "30" }],
  ] satisfies [string, Ruta][])("%s", (hash, ruta) => {
    expect(parsearHash(hash)).toEqual(ruta);
    expect(aHash(ruta)).toBe(hash);
  });

  it("«todos» es el de por defecto y no viaja; uno desconocido se ignora", () => {
    expect(parsearHash("#/vencimientos?filtro=todos")).toEqual({ tipo: "vencimientos" });
    for (const h of ["#/vencimientos?filtro=zz", "#/vencimientos?filtro=", "#/vencimientos?", "#/vencimientos?filtro=baja", "#/vencimientos?filtro=%E0%A4%A", "#/vencimientos?filtro=45"]) {
      expect(parsearHash(h)).toEqual({ tipo: "vencimientos" });
    }
  });

  it("el conductor no la ve", () => {
    expect(resolverRuta("#/vencimientos?filtro=vencidos", CONDUCTOR)).toEqual({ tipo: "conductor" });
  });
});

describe("enrutador: «pantalla» y «consulta» son cosas distintas (riesgo R3: filtrar o escribir no mueve el foco ni sube la página)", () => {
  it("clavePantalla: la misma pantalla con otro filtro o búsqueda es la misma", () => {
    expect(clavePantalla({ tipo: "movilidades" })).toBe(clavePantalla({ tipo: "movilidades", filtro: "de-baja", q: "hilux" }));
    expect(clavePantalla({ tipo: "vencimientos" })).toBe(clavePantalla({ tipo: "vencimientos", filtro: "7" }));
  });

  it("clavePantalla: otra pantalla, otra patente, otra fecha u otra solapa es otra pantalla", () => {
    const claves = [
      { tipo: "inicio" },
      { tipo: "movilidades" },
      { tipo: "vencimientos" },
      { tipo: "operacion", solapa: "checklists" },
      { tipo: "operacion", solapa: "novedades" },
      { tipo: "conductor" },
      { tipo: "mis-partes" },
      { tipo: "mas" },
      { tipo: "unidad", patente: "ZK214BD" },
      { tipo: "unidad", patente: "ABC123" },
      { tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" },
      { tipo: "parte", patente: "ZK214BD", fecha: "2026-11-19" },
      { tipo: "parte", patente: "ABC123", fecha: "2026-11-18" },
      { tipo: "desconocida" },
    ] satisfies Ruta[];
    expect(new Set(claves.map(clavePantalla)).size).toBe(claves.length);
  });

  it("claveConsulta: cambia con el filtro y con q; las pantallas sin consulta no tienen", () => {
    expect(claveConsulta({ tipo: "movilidades" })).toBe(claveConsulta({ tipo: "movilidades", q: "" }));
    expect(claveConsulta({ tipo: "movilidades", filtro: "de-baja" })).not.toBe(claveConsulta({ tipo: "movilidades" }));
    expect(claveConsulta({ tipo: "movilidades", q: "a" })).not.toBe(claveConsulta({ tipo: "movilidades", q: "ab" }));
    expect(claveConsulta({ tipo: "movilidades", filtro: "de-baja" })).not.toBe(claveConsulta({ tipo: "movilidades", q: "de-baja" }));
    expect(claveConsulta({ tipo: "vencimientos", filtro: "7" })).not.toBe(claveConsulta({ tipo: "vencimientos" }));
    expect(claveConsulta({ tipo: "inicio" })).toBe("");
    expect(claveConsulta({ tipo: "unidad", patente: "ZK214BD" })).toBe("");
  });
});

describe("enrutador: ruta padre (para «Atrás» y las migas)", () => {
  it("la ficha vuelve a Movilidades", () => {
    expect(rutaPadre({ tipo: "unidad", patente: "ZK214BD" }, ENCARGADO)).toEqual({ tipo: "movilidades" });
  });

  it("el parte vuelve a Operación diaria (encargado) o a Hoy (conductor)", () => {
    const parte: Ruta = { tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" };
    expect(rutaPadre(parte, ENCARGADO)).toEqual({ tipo: "operacion", solapa: "checklists" });
    expect(rutaPadre(parte, CONDUCTOR)).toEqual({ tipo: "conductor" });
  });

  it("las pantallas raíz (las de la barra) no tienen padre", () => {
    const raices: Ruta[] = [
      { tipo: "inicio" },
      { tipo: "movilidades" },
      { tipo: "vencimientos" },
      { tipo: "operacion", solapa: "novedades" },
      { tipo: "conductor" },
      { tipo: "mis-partes" },
      { tipo: "mas" },
      { tipo: "desconocida" },
    ];
    for (const r of raices) expect(rutaPadre(r, ENCARGADO)).toBeNull();
  });

  it("el padre es una ruta que ese perfil puede ver (nunca una redirección escondida)", () => {
    const parte: Ruta = { tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" };
    for (const [ruta, perfil] of [
      [{ tipo: "unidad", patente: "ZK214BD" }, ENCARGADO],
      [parte, ENCARGADO],
      [parte, CONDUCTOR],
    ] satisfies [Ruta, Perfil][]) {
      const padre = rutaPadre(ruta, perfil);
      expect(padre).not.toBeNull();
      if (padre !== null) expect(resolverRuta(aHash(padre), perfil)).toEqual(padre);
    }
  });

  it("migas: la ficha, el parte y las solapas de Operación; el último tramo no lleva enlace", () => {
    expect(migasDe({ tipo: "unidad", patente: "ZK214BD" }, ENCARGADO)).toEqual([
      { nombre: "Movilidades", ruta: { tipo: "movilidades" } },
      { nombre: "Unidad ZK 214 BD", ruta: null },
    ]);
    expect(migasDe({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" }, ENCARGADO)).toEqual([
      { nombre: "Operación diaria", ruta: { tipo: "operacion", solapa: "checklists" } },
      { nombre: "Parte diario", ruta: null },
    ]);
    expect(migasDe({ tipo: "parte", patente: "ZK214BD", fecha: "2026-11-18" }, CONDUCTOR)).toEqual([
      { nombre: "Hoy", ruta: { tipo: "conductor" } },
      { nombre: "Parte diario", ruta: null },
    ]);
    expect(migasDe({ tipo: "operacion", solapa: "novedades" }, ENCARGADO)).toEqual([
      { nombre: "Operación diaria", ruta: { tipo: "operacion", solapa: "checklists" } },
      { nombre: "Novedades", ruta: null },
    ]);
  });

  it("las pantallas raíz no llevan migas", () => {
    for (const r of [{ tipo: "inicio" }, { tipo: "movilidades" }, { tipo: "vencimientos" }, { tipo: "conductor" }, { tipo: "mas" }] satisfies Ruta[]) {
      expect(migasDe(r, ENCARGADO)).toEqual([]);
    }
  });
});
