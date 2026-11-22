// Paso 4.3 (lógica): lo que dibuja la flota (docs/diseno-ui.md, 5.10 y 6.2), con el ejemplo del generador (fechaBase 2026-11-18).
import { describe, expect, it } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { formatearFecha } from "../src/lib/dominio/fechas.ts";
import { kmActual } from "../src/lib/dominio/kilometraje.ts";
import { NOMBRES_DOCUMENTO } from "../src/lib/dominio/textos.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { documentoVigente } from "../src/lib/dominio/vencimientos.ts";
import { centroDeAlertas } from "../src/lib/estado/centro-alertas.ts";
import {
  CONSULTA_INICIAL,
  TODOS_LOS_PROYECTOS,
  consultaDeRuta,
  normalizarBusqueda,
  panelDeFlota,
  quitarFiltros,
  vistaDeFlota,
  type ConsultaFlota,
  type FilaFlota,
  type PanelFlota,
} from "../src/lib/estado/flota.ts";
import { conductor, estadoVacio, flotaDePrueba, parte, unidad } from "./ayuda.ts";

const H = "2026-11-18";
const e: Estado = generar(SEMILLA_POR_DEFECTO, H);

function panelDe(estado: Estado, hoy = H): PanelFlota {
  return panelDeFlota(estado, calcularAlertas(estado, hoy), hoy);
}

const panel = panelDe(e);
const patentes = (filas: readonly FilaFlota[]) => filas.map((f) => f.patente);
const ver = (parcial: Partial<ConsultaFlota> = {}, p: PanelFlota = panel) => vistaDeFlota(p, { ...CONSULTA_INICIAL, ...parcial });

function fila(patente: string, p: PanelFlota = panel): FilaFlota {
  const f = p.filas.find((x) => x.patente === patente);
  if (f === undefined) throw new Error(`falta la unidad ${patente}`);
  return f;
}

describe("encabezado y totales (6.2)", () => {
  it("el ejemplo: 23 activas, 19 pueden salir, 2 no pueden salir, 2 fuera de servicio y 1 de baja", () => {
    expect(panel.titulo).toBe("Unidades");
    expect(panel.cantidad).toBe(23);
    expect(panel.resumen).toBe("23 unidades activas · 19 pueden salir · 2 no pueden salir · 2 fuera de servicio · 1 de baja");
    expect(panel.filas).toHaveLength(24);
  });

  it("singular y cero", () => {
    const una = panelDe(flotaDePrueba());
    expect(una.resumen).toBe("2 unidades activas · 2 pueden salir · 0 no pueden salir · 0 fuera de servicio · 0 de baja");
    const solo = panelDe({ ...flotaDePrueba(), unidades: flotaDePrueba().unidades.slice(0, 1) });
    expect(solo.resumen).toBe("1 unidad activa · 1 puede salir · 0 no pueden salir · 0 fuera de servicio · 0 de baja");
  });

  it("los proyectos para el select: «Todos» y cada uno, por nombre", () => {
    expect(panel.proyectos).toEqual([
      { valor: TODOS_LOS_PROYECTOS, etiqueta: "Todos" },
      { valor: "proy-piedra-lunar", etiqueta: "Proyecto Piedra Lunar" },
      { valor: "proy-arroyo-escondido", etiqueta: "Proyecto Arroyo Escondido" },
      { valor: "proy-base", etiqueta: "Base de mantenimiento" },
    ]);
  });

  it("las opciones de orden son las de 5.10, en ese orden", () => {
    expect(panel.ordenes).toEqual([
      { id: "prioridad", etiqueta: "Prioridad" },
      { id: "patente", etiqueta: "Patente" },
      { id: "interno", etiqueta: "Interno" },
      { id: "proximo-vencimiento", etiqueta: "Próximo vencimiento" },
      { id: "ultimo-parte", etiqueta: "Último parte" },
    ]);
  });
});

describe("filas (5.10)", () => {
  it("C01, ZK 214 BD: no puede salir por el seguro, con todo lo que pide la tabla", () => {
    const f = fila("ZK214BD");
    expect(f).toMatchObject({
      unidadId: expect.any(String),
      patenteTexto: "ZK 214 BD",
      interno: "Int. 07",
      href: "#/unidad/ZK214BD",
      nombreAccesible: "Ficha de ZK 214 BD",
      descripcion: "Toyota Hilux 2022 · Camioneta",
      franja: "critico",
      proyecto: "Proyecto Piedra Lunar",
      conductor: "Tamara Olivera",
    });
    expect(f.estado).toEqual({
      categoria: "no-puede-salir",
      etiqueta: "No puede salir",
      motivo: "Seguro vencido hace 1 día",
      motivosMas: null,
      motivos: ["Seguro vencido hace 1 día"],
    });
    expect(f.proximoVencimiento).toMatchObject({ tipo: "vencido", documento: "Seguro", etiqueta: "Vencido hace 1 día", texto: "Vencido hace 1 día · Seguro", horizonte: null });
  });

  it("una unidad que puede salir no lleva franja ni motivo", () => {
    const f = fila("ZYN469");
    expect(f.franja).toBeNull();
    expect(f.estado).toEqual({ categoria: "puede-salir", etiqueta: "Puede salir", motivo: null, motivosMas: null, motivos: [] });
  });

  it("fuera de servicio: franja de semana y el motivo del dominio; de baja: franja neutra y etiqueta «De baja»", () => {
    const taller = fila("ZR536MZ");
    expect(taller.franja).toBe("semana");
    expect(taller.estado).toMatchObject({ categoria: "fuera-de-servicio", etiqueta: "Fuera de servicio", motivo: "Desde el 13/11/2026: en taller: cambio de embrague" });
    const baja = fila("ZUE512");
    expect(baja.franja).toBe("neutro");
    expect(baja.estado).toMatchObject({ categoria: "baja", etiqueta: "De baja", motivo: "Dada de baja el 21/10/2026: Venta de la unidad" });
  });

  it("con más de un motivo, el principal y «y N motivos más»", () => {
    const base = flotaDePrueba();
    const sin: Estado = { ...base, documentos: base.documentos.filter((d) => !(d.titular.id === "u1" && d.tipo !== "seguro")) }; // faltan 3 de u1
    const f = fila("ZK214BD", panelDe(sin));
    expect(f.estado.motivos).toHaveLength(3);
    expect(f.estado.motivo).toBe(f.estado.motivos[0]);
    expect(f.estado.motivosMas).toBe("y 2 motivos más");
    const dos: Estado = { ...base, documentos: base.documentos.filter((d) => !(d.titular.id === "u1" && (d.tipo === "matafuego" || d.tipo === "habilitacion-proyecto"))) };
    expect(fila("ZK214BD", panelDe(dos)).estado.motivosMas).toBe("y 1 motivo más");
  });

  describe("próximo vencimiento", () => {
    it("por vencer: texto corto con el horizonte mínimo (una sola marca, en su día)", () => {
      const hoy = fila("ZYN469").proximoVencimiento; // C02: vence hoy
      expect(hoy).toMatchObject({ tipo: "por-vencer", documento: "Revisión técnica", etiqueta: null, texto: "Revisión técnica · hoy" });
      expect(hoy.horizonte?.variante).toBe("minima");
      expect(hoy.horizonte?.columnas.map((c) => [c.dia, c.marcas.length])).toEqual([[0, 1]]);
      expect(fila("ZI442TU").proximoVencimiento.texto).toBe("Revisión técnica · mañana");
      expect(fila("ZM904EB").proximoVencimiento.texto).toBe("Seguro · en 7 días");
      const treinta = fila("ZS848EA").proximoVencimiento;
      expect(treinta.texto).toBe("Revisión técnica · en 30 días");
      expect(treinta.horizonte?.columnas[0]?.dia).toBe(30);
    });

    it("falta un documento: la etiqueta crítica y el nombre, sin horizonte", () => {
      expect(fila("ZZD563").proximoVencimiento).toMatchObject({
        tipo: "faltante",
        documento: "Habilitación de ingreso al proyecto",
        etiqueta: "Falta cargar",
        texto: "Falta cargar · Habilitación de ingreso al proyecto",
        horizonte: null,
      });
    });

    it("más de 30 días: el nombre y la fecha, sin horizonte (es el vencimiento más cercano entre los vigentes)", () => {
      const f = fila("ZB660EL");
      const u = e.unidades.find((x) => x.patente === "ZB660EL");
      const vigentes = (["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"] as const)
        .flatMap((tipo) => documentoVigente(e.documentos, { tipo: "unidad", id: u?.id ?? "" }, tipo) ?? [])
        .sort((a, b) => (a.vence < b.vence ? -1 : a.vence > b.vence ? 1 : 0));
      const primero = vigentes[0];
      if (primero === undefined) throw new Error("la unidad no tiene documentos");
      expect(f.proximoVencimiento).toMatchObject({
        tipo: "vigente",
        documento: NOMBRES_DOCUMENTO[primero.tipo],
        texto: `${NOMBRES_DOCUMENTO[primero.tipo]} · ${formatearFecha(primero.vence)}`,
        horizonte: null,
      });
    });

    it("una unidad de baja no muestra vencimientos (no alertan, V14)", () => {
      expect(fila("ZUE512").proximoVencimiento).toMatchObject({ tipo: "ninguno", texto: "—", documento: null, etiqueta: null, horizonte: null });
    });

    it("la mínima de cada fila coincide con la del dominio para esa unidad (no hay otra regla)", () => {
      for (const f of panel.filas.filter((x) => x.proximoVencimiento.tipo === "por-vencer")) {
        expect(f.proximoVencimiento.horizonte?.columnas).toHaveLength(1);
        expect(f.proximoVencimiento.horizonte?.vacio).toBe(false);
      }
    });
  });

  describe("kilometraje, último parte y novedades", () => {
    it("el kilometraje es el actual del dominio, con punto de miles", () => {
      for (const f of panel.filas) {
        const km = kmActual(f.unidadId, e.partes, e.correccionesKm);
        expect(f.km.valor).toBe(km);
        expect(f.km.texto).toBe(km === null ? "Sin registros" : `${String(km).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} km`);
      }
    });

    it("sin registros", () => {
      const sinPartes: Estado = { ...flotaDePrueba(), partes: [] };
      expect(fila("ZK214BD", panelDe(sinPartes)).km).toEqual({ valor: null, texto: "Sin registros" });
      // sin ningún parte (ni ayer), la unidad en servicio alerta «Sin parte de ayer» (P6)
    expect(fila("ZK214BD", panelDe(sinPartes)).ultimoParte).toEqual({ fecha: null, texto: "Sin partes", etiqueta: "Sin parte" });
    });

    it("último parte: la fecha del último enviado, y la etiqueta «Sin enviar» o «Sin parte» cuando corresponde", () => {
      for (const f of panel.filas) {
        const enviados = e.partes.filter((p) => p.unidadId === f.unidadId && p.estado === "enviado").map((p) => p.fecha).sort();
        const ultima = enviados.at(-1) ?? null;
        expect(f.ultimoParte.fecha).toBe(ultima);
        expect(f.ultimoParte.texto).toBe(ultima === null ? "Sin partes" : formatearFecha(ultima));
      }
      const alertas = calcularAlertas(e, H).alertas;
      const sinEnviar = alertas.filter((a) => a.tipo === "parte-sin-enviar").map((a) => a.unidadId);
      const sinParte = alertas.filter((a) => a.tipo === "sin-parte").map((a) => a.unidadId);
      expect(sinEnviar).toHaveLength(1);
      expect(sinParte).toHaveLength(2);
      expect(panel.filas.filter((f) => f.ultimoParte.etiqueta === "Sin enviar").map((f) => f.unidadId)).toEqual(sinEnviar);
      expect(panel.filas.filter((f) => f.ultimoParte.etiqueta === "Sin parte").map((f) => f.unidadId).sort()).toEqual([...sinParte].sort());
    });

    it("un borrador no es «último parte»", () => {
      const base = flotaDePrueba();
      const conBorrador: Estado = { ...base, partes: [...base.partes, parte({ id: "b", unidadId: "u1", fecha: H, estado: "borrador", enviado: null, kmFin: null })] };
      expect(fila("ZK214BD", panelDe(conBorrador)).ultimoParte.fecha).toBe("2026-11-17");
    });

    it("novedades: la cantidad de abiertas; si alguna es crítica, «1 (crítica)»", () => {
      const critica = fila("ZU899QE").novedades;
      expect(critica).toEqual({ abiertas: 1, criticas: 1, texto: "1 (crítica)" });
      const normal = panel.filas.filter((f) => f.novedades.abiertas === 1 && f.novedades.criticas === 0);
      expect(normal).toHaveLength(1); // C19
      expect(normal[0]?.novedades.texto).toBe("1");
      expect(fila("ZK214BD").novedades).toEqual({ abiertas: 0, criticas: 0, texto: "0" });
    });

    it("varias abiertas: «3 (1 crítica)», «3 (2 críticas)»; las resueltas no cuentan", () => {
      const n = (id: string, gravedad: "critica" | "normal", estado: "abierta" | "resuelta" = "abierta") => ({
        id, unidadId: "u1", origen: { tipo: "manual" as const }, descripcion: "x", gravedad, fecha: "2026-11-10", estado, resolucion: null,
      });
      const base = flotaDePrueba();
      const a: Estado = { ...base, novedades: [n("1", "critica"), n("2", "normal"), n("3", "normal"), n("4", "critica", "resuelta")] };
      expect(fila("ZK214BD", panelDe(a)).novedades.texto).toBe("3 (1 crítica)");
      const b: Estado = { ...base, novedades: [n("1", "critica"), n("2", "critica"), n("3", "normal")] };
      expect(fila("ZK214BD", panelDe(b)).novedades.texto).toBe("3 (2 críticas)");
    });

    it("sin conductor asignado: conductor null", () => {
      expect(fila("ZW827VD").conductor).toBeNull();
    });
  });
});

describe("normalizarBusqueda", () => {
  it("minúsculas, sin tildes, sin espacios, guiones ni puntos", () => {
    expect(normalizarBusqueda("ZK 214 BD")).toBe("zk214bd");
    expect(normalizarBusqueda("zk-214-bd")).toBe("zk214bd");
    expect(normalizarBusqueda("  Andrés  Núñez ")).toBe("andresnunez");
    expect(normalizarBusqueda("Int. 07")).toBe("int07");
    expect(normalizarBusqueda("---  ")).toBe("");
  });
});

describe("búsqueda (6.2): «zk214» encuentra ZK 214 BD", () => {
  const buscar = (q: string, parcial: Partial<ConsultaFlota> = {}) => patentes(ver({ busqueda: q, ...parcial }).filas);

  it.each(["zk214", "ZK 214 BD", "zk-214-bd", "  zk214  ", "214bd", "Zk214Bd", "k214"])("«%s» → ZK 214 BD", (q) => {
    expect(buscar(q)).toEqual(["ZK214BD"]);
  });

  it("por patente anterior (AAA 999): «zzd563» y «ZZD 563»", () => {
    expect(buscar("zzd563")).toEqual(["ZZD563"]);
    expect(buscar("ZZD 563")).toEqual(["ZZD563"]);
  });

  it("por modelo y marca, juntando palabras: todas tienen que aparecer", () => {
    expect(buscar("hilux").sort()).toEqual(["ZK214BD", "ZR536MZ"]);
    expect(buscar("toyota hilux 2022")).toEqual(["ZK214BD"]);
    expect(buscar("hilux 2022 amarok")).toEqual([]);
  });

  it("por conductor, ignorando mayúsculas y tildes", () => {
    expect(buscar("tamara")).toEqual(["ZK214BD"]);
    expect(buscar("OLIVERA")).toEqual(["ZK214BD"]);
    expect(buscar("andres echegaray")).toEqual(["ZYN469"]);
    expect(buscar("juarez")).toEqual(["ZM904EB"]);
  });

  it("por número interno: «Int. 07» y «int 07»", () => {
    expect(buscar("Int. 07")).toEqual(["ZK214BD"]);
    expect(buscar("int 07")).toEqual(["ZK214BD"]);
  });

  it("por tipo de unidad", () => {
    expect(buscar("minibus").sort()).toEqual(["ZL821DY", "ZV219IV"]);
  });

  it("sin texto, o con solo espacios y guiones, no filtra", () => {
    expect(buscar("")).toHaveLength(23);
    expect(buscar("   ")).toHaveLength(23);
    expect(buscar("- - -")).toHaveLength(23);
  });

  it("respeta el filtro de estado: una unidad de baja no sale con «Activas» pero sí con «De baja»", () => {
    expect(buscar("zue512")).toEqual([]);
    expect(buscar("zue512", { filtro: "de-baja" })).toEqual(["ZUE512"]);
  });

  it("entrada hostil: texto enorme, símbolos de expresiones regulares, HTML y nombres de propiedades no rompen nada", () => {
    for (const q of ["a".repeat(100_000), "(*[", ".*", "\\", "<img src=x onerror=alert(1)>", "__proto__", "constructor", "\u0000́"]) {
      expect(() => ver({ busqueda: q })).not.toThrow();
    }
    expect(buscar("(*[")).toHaveLength(23); // solo símbolos: no hay nada que buscar
    expect(buscar("<img src=x onerror=alert(1)>")).toEqual([]);
    expect(buscar("__proto__")).toEqual([]);
  });
});

describe("proyecto", () => {
  it("«Todos» no filtra; un proyecto deja solo sus unidades; uno que no existe se trata como «Todos»", () => {
    expect(ver({ proyecto: TODOS_LOS_PROYECTOS }).filas).toHaveLength(23);
    const base = ver({ proyecto: "proy-base" }).filas;
    expect(patentes(base).sort()).toEqual(["ZN473PV", "ZR575YR", "ZS848EA", "ZW827VD"]);
    expect(ver({ proyecto: "no-existe" }).filas).toHaveLength(23);
  });

  it("se combina con la búsqueda y el filtro de estado", () => {
    expect(patentes(ver({ proyecto: "proy-piedra-lunar", busqueda: "hilux" }).filas).sort()).toEqual(["ZK214BD", "ZR536MZ"]);
    expect(patentes(ver({ proyecto: "proy-arroyo-escondido", busqueda: "hilux" }).filas)).toEqual([]);
    expect(patentes(ver({ proyecto: "proy-piedra-lunar", filtro: "no-pueden-salir" }).filas).sort()).toEqual(["ZK214BD", "ZZD563"]);
  });
});

describe("filtros por estado con conteo (5.8, 6.2)", () => {
  it("los cinco de la especificación, con sus cantidades en la flota entera", () => {
    expect(ver().filtros).toEqual([
      { id: "activas", etiqueta: "Activas", cantidad: 23 },
      { id: "pueden-salir", etiqueta: "Pueden salir", cantidad: 19 },
      { id: "no-pueden-salir", etiqueta: "No pueden salir", cantidad: 2 },
      { id: "fuera-de-servicio", etiqueta: "Fuera de servicio", cantidad: 2 },
      { id: "de-baja", etiqueta: "De baja", cantidad: 1 },
    ]);
  });

  it("los conteos no cambian con la búsqueda ni con el proyecto", () => {
    const filtrado = ver({ busqueda: "zk214", proyecto: "proy-base" });
    expect(filtrado.filtros.map((f) => f.cantidad)).toEqual([23, 19, 2, 2, 1]);
  });

  it.each([
    ["activas", 23],
    ["pueden-salir", 19],
    ["no-pueden-salir", 2],
    ["fuera-de-servicio", 2],
    ["de-baja", 1],
    ["no-disponibles", 4],
  ] as const)("«%s» muestra %i unidades", (filtro, cantidad) => {
    expect(ver({ filtro }).filas).toHaveLength(cantidad);
  });

  it("cada filtro deja solo las unidades de su categoría", () => {
    expect(ver({ filtro: "activas" }).filas.every((f) => f.estado.categoria !== "baja")).toBe(true);
    expect(ver({ filtro: "pueden-salir" }).filas.every((f) => f.estado.categoria === "puede-salir")).toBe(true);
    expect(patentes(ver({ filtro: "no-pueden-salir" }).filas).sort()).toEqual(["ZK214BD", "ZZD563"]);
    expect(patentes(ver({ filtro: "fuera-de-servicio" }).filas).sort()).toEqual(["ZR536MZ", "ZU899QE"]);
    expect(patentes(ver({ filtro: "de-baja" }).filas)).toEqual(["ZUE512"]);
  });

  it("«No disponibles» (el de «Ver las N en la flota») son las mismas unidades que el protagonista del centro de alertas", () => {
    const centro = centroDeAlertas(e, calcularAlertas(e, H), H, "Logística Andina Demo S.A.");
    const v = ver({ filtro: "no-disponibles" });
    expect(v.filas).toHaveLength(centro.protagonista.cifra);
    expect(patentes(v.filas).sort()).toEqual(centro.protagonista.items.map((i) => i.patente).sort());
  });

  it("«No disponibles» aparece como sexta opción solo cuando está elegido (viene de la ruta), con su cantidad", () => {
    const v = ver({ filtro: "no-disponibles" });
    expect(v.filtros.map((f) => f.id)).toEqual(["activas", "pueden-salir", "no-pueden-salir", "fuera-de-servicio", "de-baja", "no-disponibles"]);
    expect(v.filtros.at(-1)).toEqual({ id: "no-disponibles", etiqueta: "No disponibles", cantidad: 4 });
    expect(ver({ filtro: "activas" }).filtros).toHaveLength(5);
  });
});

describe("orden (5.10)", () => {
  const orden = (o: ConsultaFlota["orden"], parcial: Partial<ConsultaFlota> = {}) => patentes(ver({ orden: o, ...parcial }).filas);

  it("prioridad: no puede salir, fuera de servicio, puede salir y de baja al final; dentro, próximo vencimiento y patente", () => {
    const todas = ver({ orden: "prioridad" }).filas;
    // no pueden salir: primero la que falta un documento, después la vencida
    expect(patentes(todas).slice(0, 4)).toEqual(["ZZD563", "ZK214BD", "ZR536MZ", "ZU899QE"]);
    // puede salir: lo que vence antes, primero
    expect(patentes(todas).slice(4, 10)).toEqual(["ZYN469", "ZI442TU", "ZM904EB", "ZEP235", "ZHO675", "ZW140GW"]);
    const categorias = todas.map((f) => f.estado.categoria);
    expect(categorias.slice(0, 2)).toEqual(["no-puede-salir", "no-puede-salir"]);
    expect(categorias.slice(2, 4)).toEqual(["fuera-de-servicio", "fuera-de-servicio"]);
    expect(categorias.slice(4).every((c) => c === "puede-salir")).toBe(true);
  });

  it("patente: alfabético por patente normalizada", () => {
    const o = orden("patente");
    expect(o).toEqual([...o].sort());
    expect(o[0]).toBe("ZB660EL");
  });

  it("interno: numérico ascendente", () => {
    const filas = ver({ orden: "interno" }).filas;
    expect(filas.map((f) => Number(f.interno.replace("Int. ", "")))).toEqual(Array.from({ length: 23 }, (_, i) => i + 1));
  });

  it("próximo vencimiento: faltantes, vencidos, por vencer (el más cercano primero), vigentes, sin vencimientos", () => {
    const filas = ver({ orden: "proximo-vencimiento", filtro: "activas" }).filas;
    expect(patentes(filas).slice(0, 5)).toEqual(["ZZD563", "ZK214BD", "ZYN469", "ZI442TU", "ZR536MZ"]);
    const tipos = filas.map((f) => f.proximoVencimiento.tipo);
    const rango = { faltante: 0, vencido: 1, "por-vencer": 2, vigente: 3, ninguno: 4 } as const;
    expect(tipos.map((t) => rango[t])).toEqual([...tipos.map((t) => rango[t])].sort((a, b) => a - b));
  });

  it("último parte: el más antiguo primero (quien hace más que no envía), y las que no tienen partes antes de todas", () => {
    const base = flotaDePrueba();
    const sinUnoDeU2: Estado = { ...base, partes: base.partes.filter((p) => p.unidadId !== "u2") };
    expect(patentes(vistaDeFlota(panelDe(sinUnoDeU2), { ...CONSULTA_INICIAL, orden: "ultimo-parte" }).filas)).toEqual(["ZKB482", "ZK214BD"]);
    const fechas = ver({ orden: "ultimo-parte" }).filas.map((f) => f.ultimoParte.fecha ?? "");
    expect(fechas).toEqual([...fechas].sort());
  });

  it("el orden no cambia la cantidad ni modifica el panel (no muta)", () => {
    const antes = JSON.stringify(panel.filas.map((f) => f.patente));
    for (const o of ["prioridad", "patente", "interno", "proximo-vencimiento", "ultimo-parte"] as const) {
      expect(ver({ orden: o }).filas).toHaveLength(23);
    }
    expect(JSON.stringify(panel.filas.map((f) => f.patente))).toBe(antes);
  });

  it("un orden desconocido (valor roto) vuelve a prioridad", () => {
    const roto = vistaDeFlota(panel, { ...CONSULTA_INICIAL, orden: "xx" as ConsultaFlota["orden"] });
    expect(patentes(roto.filas)).toEqual(patentes(ver().filas));
  });
});

describe("cuántas se muestran y qué se anuncia (barra de estado)", () => {
  it("«Mostrando 23 de 23 unidades.» al empezar", () => {
    const v = ver();
    expect(v.mostradas).toBe(23);
    expect(v.total).toBe(23);
    expect(v.anuncio).toBe("Mostrando 23 de 23 unidades.");
    expect(v.vacio).toBeNull();
    expect(v.hayFiltros).toBe(false);
  });

  it("con búsqueda: lo que coincide sobre las del filtro de estado elegido", () => {
    expect(ver({ busqueda: "zk214" }).anuncio).toBe("Mostrando 1 de 23 unidades.");
    expect(ver({ filtro: "pueden-salir", busqueda: "hilux" }).anuncio).toBe("Mostrando 0 de 19 unidades.");
    expect(ver({ filtro: "de-baja" }).anuncio).toBe("Mostrando 1 de 1 unidad.");
    expect(ver({ busqueda: "zk214" }).hayFiltros).toBe(true);
  });
});

describe("vacío por filtro (8)", () => {
  it("el texto de la especificación: búsqueda y proyecto", () => {
    const v = ver({ busqueda: "zz9", proyecto: "proy-piedra-lunar" });
    expect(v.filas).toEqual([]);
    expect(v.vacio).toEqual({ tipo: "por-filtro", texto: "Ninguna unidad coincide con «zz9» en Proyecto Piedra Lunar.", conQuitarFiltros: true });
  });

  it("solo búsqueda, solo proyecto, y con filtro de estado", () => {
    expect(ver({ busqueda: "zz9" }).vacio).toMatchObject({ texto: "Ninguna unidad coincide con «zz9»." });
    expect(ver({ proyecto: "proy-base", busqueda: "hilux" }).vacio).toMatchObject({ texto: "Ninguna unidad coincide con «hilux» en Base de mantenimiento." });
    expect(ver({ filtro: "de-baja", busqueda: "zz9" }).vacio).toMatchObject({ texto: "Ninguna unidad coincide con «zz9» (filtro: De baja)." });
    expect(ver({ filtro: "de-baja", proyecto: "proy-piedra-lunar" }).vacio).toMatchObject({
      texto: "Ninguna unidad coincide en Proyecto Piedra Lunar (filtro: De baja).",
    });
  });

  it("lo escrito se muestra tal cual (es texto), sin espacios de más y acortado si es largo", () => {
    expect(ver({ busqueda: "  <b>x</b>   y  " }).vacio).toMatchObject({ texto: "Ninguna unidad coincide con «<b>x</b> y»." });
    const largo = ver({ busqueda: "a".repeat(500) });
    expect(largo.vacio?.tipo).toBe("por-filtro");
    expect(largo.vacio?.texto.length).toBeLessThan(80);
  });

  it("sin ninguna unidad: «Todavía no hay unidades.» y se ofrece agregar, no quitar filtros", () => {
    const vacia = panelDe(estadoVacio());
    const v = vistaDeFlota(vacia, CONSULTA_INICIAL);
    expect(v.vacio).toEqual({ tipo: "sin-unidades", texto: "Todavía no hay unidades." });
    expect(v.anuncio).toBe("Mostrando 0 de 0 unidades.");
  });

  it("«Quitar filtros» vuelve a todo (menos el orden); se ofrece solo si hay algún filtro puesto", () => {
    const consulta: ConsultaFlota = { filtro: "de-baja", busqueda: "zz9", proyecto: "proy-base", orden: "patente" };
    expect(quitarFiltros(consulta)).toEqual({ ...CONSULTA_INICIAL, orden: "patente" });
    expect(ver(quitarFiltros(consulta)).filas).toHaveLength(23);
    const todasDeBaja: Estado = { ...flotaDePrueba(), unidades: [unidad({ id: "u9", patente: "ZAA001", estado: { tipo: "baja", desde: "2026-11-01", motivo: "Venta" } })] };
    const v = vistaDeFlota(panelDe(todasDeBaja), CONSULTA_INICIAL);
    expect(v.vacio).toMatchObject({ tipo: "por-filtro", conQuitarFiltros: false });
  });
});

describe("consulta desde la ruta («Ver las N en la flota»)", () => {
  it("la ruta con filtro empieza con ese filtro; sin filtro, la consulta inicial", () => {
    expect(consultaDeRuta({ tipo: "flota", filtro: "no-disponibles" })).toEqual({ ...CONSULTA_INICIAL, filtro: "no-disponibles" });
    expect(consultaDeRuta({ tipo: "flota" })).toEqual(CONSULTA_INICIAL);
    expect(consultaDeRuta({ tipo: "alertas" })).toEqual(CONSULTA_INICIAL);
  });

  it("la consulta inicial: activas, sin búsqueda, todos los proyectos, por prioridad", () => {
    expect(CONSULTA_INICIAL).toEqual({ filtro: "activas", busqueda: "", proyecto: "todos", orden: "prioridad" });
  });
});

describe("la flota con un estado armado a mano", () => {
  it("una unidad nueva, sin documentos, sale «No puede salir» con sus faltantes (U5)", () => {
    const base = flotaDePrueba();
    const nueva = unidad({ id: "u3", patente: "ZAA001", interno: 30, proyectoId: "p-piedra", conductorId: null });
    const p = panelDe({ ...base, unidades: [...base.unidades, nueva] });
    const f = fila("ZAA001", p);
    expect(f.estado.categoria).toBe("no-puede-salir");
    expect(f.estado.motivos).toEqual([
      "Falta cargar: Seguro",
      "Falta cargar: Revisión técnica",
      "Falta cargar: Carga del matafuego",
      "Falta cargar: Habilitación de ingreso al proyecto",
    ]);
    expect(f.estado.motivosMas).toBe("y 3 motivos más");
    expect(f.proximoVencimiento.tipo).toBe("faltante");
    expect(f.km).toEqual({ valor: null, texto: "Sin registros" });
    expect(f.novedades.texto).toBe("0");
  });

  it("un conductor inactivo asignado se muestra igual por su nombre", () => {
    const base = flotaDePrueba();
    const inactivo: Estado = { ...base, conductores: [conductor({ id: "c1", nombre: "Luis Ferreyra", activo: false }), ...base.conductores.slice(1)] };
    expect(fila("ZK214BD", panelDe(inactivo)).conductor).toBe("Luis Ferreyra");
  });

  it("documentos más allá de 30 días en una unidad sana: «Seguro · fecha»", () => {
    const f = fila("ZK214BD", panelDe(flotaDePrueba()));
    expect(f.proximoVencimiento.tipo).toBe("vigente");
    expect(f.proximoVencimiento.texto).toMatch(/^[A-Za-zÁÉÍÓÚáéíóúñ ]+ · \d{2}\/\d{2}\/\d{4}$/);
  });
});

describe("conductor sin licencia y último parte en uso (L1, 17.5)", () => {
  it("conductorSinLicencia: solo la unidad del conductor de C21 (la unidad puede salir con otro conductor)", () => {
    const filas = panelDe(e).filas.filter((f) => f.conductorSinLicencia);
    expect(filas).toHaveLength(1);
    expect(filas[0]?.estado.categoria).toBe("puede-salir");
  });

  it("una unidad sin conductor o con licencia vigente no lo lleva", () => {
    const base = flotaDePrueba();
    expect(panelDe(base).filas.every((f) => !f.conductorSinLicencia)).toBe(true);
    const vencida = { ...base, documentos: base.documentos.map((d) => (d.id === "c1-licencia" ? { ...d, vence: "2026-11-15" } : d)) };
    expect(panelDe(vencida).filas.find((f) => f.patente === "ZK214BD")?.conductorSinLicencia).toBe(true);
    expect(panelDe(vencida).filas.find((f) => f.patente === "ZKB482")?.conductorSinLicencia).toBe(false);
  });

  it("«Último parte»: «En uso» si salió hoy, «Sin cerrar» si el parte en uso es de un día anterior y «Sin enviar» si es un borrador", () => {
    const base = flotaDePrueba();
    const uso = (fecha: string) => parte({ id: `x${fecha}`, unidadId: "u1", fecha, estado: "en-uso", kmInicio: 84400, kmFin: null, combustible: null, enviado: null });
    const fila = (partes: ReturnType<typeof parte>[]) => panelDe({ ...base, partes: [...base.partes, ...partes] }).filas.find((f) => f.patente === "ZK214BD")!;
    expect(fila([uso(H)]).ultimoParte.etiqueta).toBe("En uso");
    expect(fila([uso("2026-11-16")]).ultimoParte.etiqueta).toBe("Sin cerrar");
    expect(fila([parte({ id: "b", unidadId: "u1", fecha: "2026-11-16", estado: "borrador", revisado: null, enviado: null })]).ultimoParte.etiqueta).toBe("Sin enviar");
    // el último parte cerrado sigue siendo el de la fecha de la lista
    expect(fila([uso(H)]).ultimoParte.fecha).toBe("2026-11-17");
  });
});
