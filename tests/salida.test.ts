// La regla de salida de Inicio (docs/diseno-ui.md, 15.6 y 15.7): todo sale de los datos de hoy y la hoja de estilos no calcula nada. Acá se prueba la lógica con la semilla y con
// cada límite de 15.6.7: cero no disponibles, todas, una unidad, flota vacía, altas, primera no disponible sin acción de documento, 23 activas de 24.
import { describe, expect, it } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { aptitud } from "../src/lib/dominio/aptitud.ts";
import type { Documento, Estado, Unidad } from "../src/lib/dominio/tipos.ts";
import { textoDesgloseNoDisponibles, textoDisponibles, textoProtagonistaLector, textoUnidadNoPuedeSalir } from "../src/lib/dominio/textos.ts";
import { centroDeAlertas } from "../src/lib/estado/centro-alertas.ts";
import { calcularSalida, campoDeMedida, cargaDeActivas, escalaDeLaRegla, pasoDeLaEscala, type Salida } from "../src/lib/estado/salida.ts";
import fuenteDeSalida from "../src/lib/estado/salida.ts?raw";
import { PROYECTO_BASE, PROYECTO_PIEDRA, conductor, contexto, documento, ejecutarOk, estadoVacio, flotaDePrueba, novedad, unidad } from "./ayuda.ts";

const H = "2026-11-18";
const EMPRESA = "Logística Andina Demo S.A.";

function salidaDe(estado: Estado, hoy = H): Salida {
  return calcularSalida(estado, centroDeAlertas(estado, calcularAlertas(estado, hoy), hoy, EMPRESA), hoy);
}

/** Una flota de `patentes` unidades (en servicio, con todos sus documentos al día) para armar casos con las manos. */
function flota(patentes: string[]): Estado {
  const base = flotaDePrueba();
  const unidades: Unidad[] = [];
  const documentos: Documento[] = [];
  patentes.forEach((patente, i) => {
    const id = `u-${patente}`;
    unidades.push(unidad({ id, patente, interno: i + 1, proyectoId: PROYECTO_BASE.id }));
    for (const tipo of ["seguro", "revision-tecnica", "matafuego"] as const) {
      documentos.push(documento({ id: `${id}-${tipo}`, titular: { tipo: "unidad", id }, tipo, numero: `DEMO-${patente}-${tipo}`, vence: "2027-06-30" }));
    }
  });
  // Sin partes: «unidad sin parte de ayer» suma alertas de operación, que no cambian la regla (solo los renglones de lectura).
  return { ...base, unidades, documentos, partes: [], conductores: [conductor()] };
}

/** Vence el seguro (o lo que se diga) de la unidad con esa patente: queda «bloqueada» con ese motivo. */
function conSeguroVencido(estado: Estado, patente: string): Estado {
  const id = `u-${patente}`;
  return { ...estado, documentos: estado.documentos.map((d) => (d.id === `${id}-seguro` ? { ...d, vence: "2026-11-10" } : d)) };
}
function fueraDeServicio(estado: Estado, patente: string, origen: "manual" | "novedad-critica" = "manual"): Estado {
  return {
    ...estado,
    unidades: estado.unidades.map((u) =>
      u.id === `u-${patente}` ? { ...u, estado: { tipo: "fuera-de-servicio", desde: "2026-11-12", motivo: "Cambio de embrague en el taller", origen, novedadIds: [] } } : u,
    ),
  };
}
/** Bloqueada, pero sin nada que renovar ni cargar: una novedad crítica de hoy ya resuelta (la unidad no sale hasta mañana). */
function sinSalidaHoy(estado: Estado, patente: string): Estado {
  return { ...estado, novedades: [...estado.novedades, novedad({ id: `n-${patente}`, unidadId: `u-${patente}`, gravedad: "critica", fecha: H, estado: "resuelta" })] };
}
function deBaja(estado: Estado, patente: string): Estado {
  return { ...estado, unidades: estado.unidades.map((u) => (u.id === `u-${patente}` ? { ...u, estado: { tipo: "baja", desde: "2026-11-01", motivo: "Venta de la unidad" } } : u)) };
}

// --- La semilla: 23 activas de 24, 19 disponibles ---------------------------------------------------

describe("con la semilla (24 unidades, 23 activas)", () => {
  const e = generar(SEMILLA_POR_DEFECTO, H);
  const centro = centroDeAlertas(e, calcularAlertas(e, H), H, EMPRESA);
  const s = calcularSalida(e, centro, H);

  it("23 activas de 24 (una está de baja y no cuenta), 19 disponibles y 4 que no", () => {
    expect(e.unidades).toHaveLength(24);
    expect([s.activas, s.disponibles, s.noDisponibles]).toEqual([23, 19, 4]);
    expect([s.bloqueadas, s.fueraDeServicio]).toEqual([2, 2]);
    expect(s.vacia).toBe(false);
  });

  it("coincide con lo que dice el centro de alertas (la regla y el resto de Inicio no se pueden contradecir)", () => {
    expect(textoDisponibles(s.disponibles, s.activas)).toBe(centro.protagonista.disponibles);
    expect(s.noDisponibles).toBe(centro.protagonista.cifra);
    expect(textoDesgloseNoDisponibles(s.bloqueadas, s.fueraDeServicio)).toBe(centro.protagonista.desglose);
  });

  it("la medida es disponibles sobre activas", () => {
    expect(s.medida).toBeCloseTo(19 / 23, 10);
  });

  it("una llave por unidad activa: primero las 19 que salen y después las 4 que no, en el orden del centro de alertas", () => {
    expect(s.llaves).toHaveLength(23);
    expect(s.llaves.slice(0, 19).every((l) => l.sale)).toBe(true);
    expect(s.llaves.slice(19).every((l) => !l.sale)).toBe(true);
    expect(s.llaves.slice(19).map((l) => l.patente)).toEqual(centro.protagonista.items.map((i) => i.patente));
    const patentesQueSalen = s.llaves.slice(0, 19).map((l) => l.patente);
    expect(patentesQueSalen).toEqual([...patentesQueSalen].sort());
    expect(new Set(s.llaves.map((l) => l.unidadId)).size).toBe(23);
  });

  it("la unidad de baja no tiene llave", () => {
    const baja = e.unidades.find((u) => u.estado.tipo === "baja");
    expect(baja).toBeDefined();
    expect(s.llaves.some((l) => l.unidadId === baja?.id)).toBe(false);
  });

  it("cada llave dice estado, tono, motivo y número de pieza; las que salen no tienen motivo, tono ni número", () => {
    for (const l of s.llaves.filter((x) => x.sale)) {
      expect(l).toMatchObject({ categoria: "puede-salir", etiqueta: "Disponible", tono: null, motivo: null, pieza: null, motivos: [] });
    }
    const piezas = s.llaves.filter((l) => !l.sale);
    expect(piezas.map((l) => l.pieza)).toEqual([1, 2, 3, 4]);
    expect(piezas.map((l) => l.etiqueta)).toEqual(centro.protagonista.items.map((i) => i.etiqueta));
    expect(piezas.map((l) => l.motivo)).toEqual(centro.protagonista.items.map((i) => i.motivo));
    expect(piezas.map((l) => l.motivos)).toEqual(centro.protagonista.items.map((i) => i.motivos));
    expect(piezas[0]).toMatchObject({ patente: "ZK214BD", patenteTexto: "ZK 214 BD", categoria: "no-puede-salir", etiqueta: "Bloqueada", tono: "critico", href: "#/unidad/ZK214BD" });
    expect(piezas[0]?.interno).toMatch(/^Int\. \d{2}$/);
  });

  it("el tono de las fuera de servicio sale de su origen: novedad crítica es crítico; taller o a mano, neutro", () => {
    for (const l of s.llaves.filter((x) => x.categoria === "fuera-de-servicio")) {
      const origen = (e.unidades.find((u) => u.id === l.unidadId)?.estado as { origen: string }).origen;
      expect(l.tono).toBe(origen === "novedad-critica" ? "critico" : "neutro");
    }
    expect(new Set(s.llaves.filter((l) => l.categoria === "fuera-de-servicio").map((l) => l.tono)).size).toBeGreaterThanOrEqual(1);
  });

  it("los motivos no traen punto final (los nombres accesibles lo agregan ellos)", () => {
    for (const l of s.llaves) if (l.motivo !== null) expect(l.motivo.endsWith("."), l.motivo).toBe(false);
  });

  it("párrafo para lectores con el valor final, igual al de la tabla de textos", () => {
    expect(s.textoLector).toBe("Disponibles hoy: 19 de 23 unidades activas. 4 unidades no disponibles hoy: 2 bloqueadas por documentos · 2 fuera de servicio.");
    expect(s.cota).toBe("4 unidades");
  });

  it("los atributos que la hoja de estilos necesita: carga «a» (hasta 24 activas) y campo «ancho» (medida de 0,70 o más)", () => {
    expect(s.carga).toBe("a");
    expect(s.campo).toBe("ancho");
  });

  it("escala de 0 a 23 con la lectura en 19: 0, 5, 10, 15, [19] y 23 (el 20 queda a menos de 0,05 de la lectura)", () => {
    expect(s.escala.map((m) => [m.valor, m.tipo])).toEqual([
      [0, "extremo"],
      [5, "marca"],
      [10, "marca"],
      [15, "marca"],
      [19, "lectura"],
      [23, "extremo"],
    ]);
    expect(s.escala.map((m) => m.x)).toEqual([0, 5 / 23, 10 / 23, 15 / 23, 19 / 23, 1]);
    expect(s.marcasMenores).toBe(true);
  });

  it("tablero corto: las 4 no disponibles, ninguna de más", () => {
    expect(s.corto.chapas.map((l) => l.patente)).toEqual(centro.protagonista.items.map((i) => i.patente));
    expect(s.corto.masNoDisponibles).toBe(0);
  });

  it("los cuatro renglones de lectura, en orden, con las cifras de Inicio y su destino", () => {
    expect(s.renglones.map((r) => r.id)).toEqual(["vencidos", "proximos", "partes", "novedad-critica"]);
    const c = centro.cifras;
    expect(s.renglones.map((r) => [r.valor, r.rotulo, r.href])).toEqual([
      [c.vencidos.valor, c.vencidos.rotulo, c.vencidos.href],
      [c.proximos.valor, c.proximos.rotulo, c.proximos.href],
      [c.partes.valor, c.partes.rotulo, c.partes.href],
      [c.novedadCritica.valor, c.novedadCritica.rotulo, c.novedadCritica.href],
    ]);
    expect(s.renglones.map((r) => r.rotulo)).toEqual(["Vencidos o faltantes", "Vencen en 30 días", "Partes pendientes", expect.stringMatching(/^Novedad(es)? crítica/)]);
  });

  it("un renglón en cero se muestra (el cero es información) y es neutro, sin color de tono", () => {
    const sinNada = salidaDe(flotaDePrueba()); // documentos al día, parte de ayer cargado: ninguna alerta
    expect(sinNada.renglones.map((r) => r.valor)).toEqual([0, 0, 0, 0]);
    for (const r of sinNada.renglones) expect(r.tono).toBe("neutro");
  });

  it("«Acción del día»: la primera pieza (ZK 214 BD, seguro vencido) con su botón «Renovar»", () => {
    expect(s.accion.variante).toBe("con-accion");
    if (s.accion.variante !== "con-accion") return;
    expect(s.accion.pieza).toBe(1);
    expect(s.accion.unidad.patente).toBe("ZK214BD");
    expect(s.accion.frase).toBe("ZK 214 BD no puede salir: Seguro vencido hace 1 día.");
    expect(s.accion.accion).toMatchObject({ tipo: "renovar", etiqueta: "Renovar", nombreAccesible: "Renovar seguro de ZK 214 BD", tipoDocumento: "seguro" });
    // La acción es la misma que ya calcula el centro de alertas para esa fila de Vencimientos, no una copia.
    const fila = centro.vencimientos.grupos.flatMap((g) => g.filas).find((f) => f.accion.nombreAccesible === "Renovar seguro de ZK 214 BD");
    expect(s.accion.accion).toBe(fila?.accion);
  });

  it("la guía de la nota cae en la división de su llave (a la mitad de la división)", () => {
    const accion = s.accion;
    if (accion.variante !== "con-accion") throw new Error("se esperaba la variante con acción");
    const indice = s.llaves.findIndex((l) => l.unidadId === accion.unidad.unidadId);
    expect(indice).toBe(19);
    expect(accion.x).toBeCloseTo((19 + 0.5) / 23, 10);
  });

  it("es determinista y no toca los datos", () => {
    const copia = JSON.stringify(e);
    expect(salidaDe(e)).toEqual(s);
    expect(JSON.stringify(e)).toBe(copia);
  });
});

// --- Límites de 15.6.7 -----------------------------------------------------------------------------

describe("cero no disponibles", () => {
  const s = salidaDe(flotaDePrueba());

  it("todas disponibles: la medida es 1, no hay piezas ni cota, y los lectores oyen la frase de «todas disponibles»", () => {
    expect([s.activas, s.disponibles, s.noDisponibles]).toEqual([2, 2, 0]);
    expect(s.medida).toBe(1);
    expect(s.llaves.every((l) => l.sale)).toBe(true);
    expect(s.cota).toBeNull();
    expect(s.textoLector).toBe("Disponibles hoy: 2 de 2 unidades activas. Ninguna unidad bloqueada ni fuera de servicio.");
  });

  it("el tablero corto no tiene chapas ni «y N más»", () => {
    expect(s.corto).toEqual({ chapas: [], masNoDisponibles: 0 });
  });

  it("la «Acción del día» pasa a «en orden», con la frase que ya existe y sin botones", () => {
    expect(s.accion).toEqual({ variante: "en-orden", frase: textoProtagonistaLector(0) });
  });

  it("la escala termina en la lectura (el extremo derecho)", () => {
    expect(s.escala.map((m) => [m.valor, m.tipo])).toEqual([
      [0, "extremo"],
      [2, "lectura"],
    ]);
  });
});

describe("todas no disponibles", () => {
  const e = conSeguroVencido(conSeguroVencido(flota(["ZK100AA", "ZK200BB"]), "ZK100AA"), "ZK200BB");
  const s = salidaDe(e);

  it("la medida es 0, la lectura es «0 de 2» y todas las llaves son piezas numeradas", () => {
    expect([s.activas, s.disponibles, s.noDisponibles, s.medida]).toEqual([2, 0, 2, 0]);
    expect(s.llaves.map((l) => l.pieza)).toEqual([1, 2]);
    expect(s.campo).toBe("angosto"); // mordaza de ancho 0: el título y la cifra salen a la placa (15.6.2)
  });

  it("la escala tiene la lectura en 0", () => {
    expect(s.escala.map((m) => [m.valor, m.tipo])).toEqual([
      [0, "lectura"],
      [2, "extremo"],
    ]);
  });
});

describe("una sola unidad activa", () => {
  it("disponible: escala de 0 a 1 y lectura en 1; la guía de la llave está en el medio de la única división", () => {
    const s = salidaDe(flota(["ZK100AA"]));
    expect([s.activas, s.disponibles, s.medida]).toEqual([1, 1, 1]);
    expect(s.llaves).toHaveLength(1);
    expect(s.escala.map((m) => [m.valor, m.tipo])).toEqual([
      [0, "extremo"],
      [1, "lectura"],
    ]);
    expect(s.textoLector).toBe("Disponibles hoy: 1 de 1 unidad activa. Ninguna unidad bloqueada ni fuera de servicio.");
  });

  it("no disponible: «0 de 1», una pieza, una cota en singular y la guía en el medio", () => {
    const s = salidaDe(conSeguroVencido(flota(["ZK100AA"]), "ZK100AA"));
    expect([s.activas, s.disponibles, s.noDisponibles, s.medida]).toEqual([1, 0, 1, 0]);
    expect(s.cota).toBe("1 unidad");
    expect(s.accion.variante).toBe("con-accion");
    if (s.accion.variante === "con-accion") expect(s.accion.x).toBe(0.5);
  });
});

describe("flota vacía", () => {
  const sinUnidades = salidaDe(estadoVacio());
  const todasDeBaja = salidaDe(deBaja(deBaja(flota(["ZK100AA", "ZK200BB"]), "ZK100AA"), "ZK200BB"));

  it("sin ninguna unidad, o con todas de baja, no hay nada que dividir: no divide por cero", () => {
    for (const s of [sinUnidades, todasDeBaja]) {
      expect([s.activas, s.disponibles, s.noDisponibles, s.medida]).toEqual([0, 0, 0, 0]);
      expect(s.vacia).toBe(true);
      expect(Number.isFinite(s.medida)).toBe(true);
    }
  });

  it("no hay llaves, escala, cota, chapas ni nota; el párrafo para lectores es el del cuadro cero con mensaje", () => {
    for (const s of [sinUnidades, todasDeBaja]) {
      expect(s.llaves).toEqual([]);
      expect(s.escala).toEqual([]);
      expect(s.cota).toBeNull();
      expect(s.corto).toEqual({ chapas: [], masNoDisponibles: 0 });
      expect(s.accion).toEqual({ variante: "vacia" });
      expect(s.textoLector).toBe("No hay unidades activas.");
    }
  });

  it("los cuatro renglones de lectura se siguen mostrando (las alertas son de otras cosas)", () => {
    expect(sinUnidades.renglones).toHaveLength(4);
  });
});

describe("altas y bajas de unidades", () => {
  it("una unidad dada de alta (sin documentos) entra a la regla como una pieza más: 24 activas, 5 no disponibles", () => {
    const e = generar(SEMILLA_POR_DEFECTO, H);
    const antes = salidaDe(e);
    const r = ejecutarOk(
      e,
      { tipo: "altaUnidad", patente: "zk-300 ba", interno: 30, marca: "Toyota", modelo: "Hilux", anio: 2024, tipoUnidad: "camioneta", proyectoId: e.proyectos[0]?.id ?? "", conductorId: null },
      contexto({ hoy: H }),
    );
    const despues = salidaDe(r.estado);
    expect([despues.activas, despues.disponibles, despues.noDisponibles]).toEqual([antes.activas + 1, antes.disponibles, antes.noDisponibles + 1]);
    expect(despues.llaves).toHaveLength(24);
    expect(despues.llaves.filter((l) => !l.sale).map((l) => l.pieza)).toEqual([1, 2, 3, 4, 5]);
    expect(despues.llaves.some((l) => l.patente === "ZK300BA" && !l.sale)).toBe(true);
    expect(despues.carga).toBe("a"); // 24 todavía entra en el tablero completo de 37,5 rem
  });

  it("una baja saca la llave y baja el total de activas", () => {
    const e = flota(["ZK100AA", "ZK200BB", "ZK300CC"]);
    expect(salidaDe(e).activas).toBe(3);
    const s = salidaDe(deBaja(e, "ZK200BB"));
    expect(s.activas).toBe(2);
    expect(s.llaves.map((l) => l.patente)).toEqual(["ZK100AA", "ZK300CC"]);
  });

  it("resolver una pieza (renovar el documento) la pasa a disponible y corre la medida", () => {
    const e = conSeguroVencido(flota(["ZK100AA", "ZK200BB"]), "ZK100AA");
    const antes = salidaDe(e);
    expect([antes.disponibles, antes.noDisponibles]).toEqual([1, 1]);
    const r = ejecutarOk(e, { tipo: "renovarDocumento", documentoId: "u-ZK100AA-seguro", numero: "DEMO-9", emisor: "", vence: "2027-11-18", emitido: null }, contexto({ hoy: H }));
    const despues = salidaDe(r.estado);
    expect([despues.disponibles, despues.noDisponibles, despues.medida]).toEqual([2, 0, 1]);
    expect(despues.accion.variante).toBe("en-orden");
  });
});

describe("«Acción del día» según la primera pieza", () => {
  it("primera no disponible SIN acción de documento: toma la primera pieza que sí la tiene, y su número es el de esa pieza (no el 1)", () => {
    // ZK100AA queda bloqueada por una novedad crítica ya resuelta (nada que renovar); ZK200BB por su seguro vencido.
    const e = conSeguroVencido(sinSalidaHoy(flota(["ZK100AA", "ZK200BB"]), "ZK100AA"), "ZK200BB");
    const s = salidaDe(e);
    expect(s.llaves.filter((l) => !l.sale).map((l) => [l.patente, l.pieza])).toEqual([
      ["ZK100AA", 1],
      ["ZK200BB", 2],
    ]);
    expect(s.accion.variante).toBe("con-accion");
    if (s.accion.variante !== "con-accion") return;
    expect(s.accion.pieza).toBe(2);
    expect(s.accion.unidad.patente).toBe("ZK200BB");
    expect(s.accion.frase).toBe("ZK 200 BB no puede salir: Seguro vencido hace 8 días.");
    expect(s.accion.accion.nombreAccesible).toBe("Renovar seguro de ZK 200 BB");
    expect(s.accion.x).toBeCloseTo((s.llaves.findIndex((l) => l.patente === "ZK200BB") + 0.5) / 2, 10);
  });

  it("ninguna pieza con acción de documento (todas por novedad o fuera de servicio): «Ver ficha» de la primera, con su frase", () => {
    const e = fueraDeServicio(sinSalidaHoy(flota(["ZK100AA", "ZK200BB", "ZK300CC"]), "ZK100AA"), "ZK200BB", "novedad-critica");
    const s = salidaDe(e);
    expect(s.accion.variante).toBe("sin-accion");
    if (s.accion.variante !== "sin-accion") return;
    expect(s.accion.pieza).toBe(1);
    expect(s.accion.unidad.patente).toBe("ZK100AA");
    expect(s.accion.unidad.href).toBe("#/unidad/ZK100AA");
    expect(s.accion.frase).toBe(textoUnidadNoPuedeSalir("ZK 100 AA", s.llaves.find((l) => l.patente === "ZK100AA")?.motivos ?? [], false).titular);
  });

  it("una fuera de servicio nunca ofrece «Renovar», aunque tenga un documento vencido: renovarlo no la vuelve disponible", () => {
    const e = conSeguroVencido(fueraDeServicio(flota(["ZK100AA"]), "ZK100AA"), "ZK100AA");
    const s = salidaDe(e);
    expect(s.noDisponibles).toBe(1);
    expect(s.accion.variante).toBe("sin-accion");
  });

  it("bloqueada por un documento que falta: el botón es «Cargar»", () => {
    const e = flota(["ZK100AA"]);
    const sinMatafuego = { ...e, documentos: e.documentos.filter((d) => d.tipo !== "matafuego") };
    const s = salidaDe(sinMatafuego);
    expect(s.accion.variante).toBe("con-accion");
    if (s.accion.variante !== "con-accion") return;
    expect(s.accion.accion).toMatchObject({ tipo: "cargar", etiqueta: "Cargar", tipoDocumento: "matafuego", documentoId: null });
    expect(s.accion.frase).toContain("Falta cargar");
  });

  it("con varios documentos en falta, el botón es el del primer motivo (el que dice la frase al principio)", () => {
    const e = conSeguroVencido(flota(["ZK100AA"]), "ZK100AA");
    const sinMatafuego = { ...e, documentos: e.documentos.filter((d) => d.tipo !== "matafuego") };
    const s = salidaDe(sinMatafuego);
    const l = s.llaves[0];
    expect(l?.motivos.length).toBe(2);
    if (s.accion.variante !== "con-accion") throw new Error("se esperaba la variante con acción");
    const primero = aptitud(e.unidades[0] as Unidad, sinMatafuego, H).motivos.find((m) => m.documento !== undefined);
    expect(s.accion.accion.tipoDocumento).toBe(primero?.documento);
    expect(s.accion.frase).toBe(`ZK 100 AA no puede salir: ${l?.motivos.join("; ")}.`);
  });
});

describe("tablero corto: hasta ocho posiciones", () => {
  const patentes = Array.from({ length: 12 }, (_, i) => `ZK${String(100 + i)}AA`);
  const conNoDisponibles = (n: number) => patentes.slice(0, n).reduce((e, p) => conSeguroVencido(e, p), flota(patentes));

  it("hasta 8 no disponibles: todas, sin «y N más»", () => {
    for (const n of [1, 7, 8]) {
      const s = salidaDe(conNoDisponibles(n));
      expect(s.corto.chapas, `n=${n}`).toHaveLength(n);
      expect(s.corto.masNoDisponibles).toBe(0);
    }
  });

  it("con 9 o más: siete chapas y la octava posición es «y N más» (N = las que no entran, 2 o más)", () => {
    const s9 = salidaDe(conNoDisponibles(9));
    expect(s9.corto.chapas).toHaveLength(7);
    expect(s9.corto.masNoDisponibles).toBe(2);
    const s12 = salidaDe(conNoDisponibles(12));
    expect(s12.corto.chapas).toHaveLength(7);
    expect(s12.corto.masNoDisponibles).toBe(5);
    expect(s12.corto.chapas.map((l) => l.pieza)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("el tablero completo conserva todas las piezas aunque el corto muestre menos", () => {
    const s = salidaDe(conNoDisponibles(12));
    expect(s.llaves.filter((l) => !l.sale)).toHaveLength(12);
  });
});

// --- Funciones puras de la hoja de estilos -------------------------------------------------------------

describe("cargaDeActivas: cuándo entra el tablero completo (15.6.3)", () => {
  it("a hasta 24, b de 25 a 30, c de 31 a 46, d desde 47", () => {
    expect([0, 1, 24].map(cargaDeActivas)).toEqual(["a", "a", "a"]);
    expect([25, 30].map(cargaDeActivas)).toEqual(["b", "b"]);
    expect([31, 46].map(cargaDeActivas)).toEqual(["c", "c"]);
    expect([47, 500].map(cargaDeActivas)).toEqual(["d", "d"]);
  });
});

describe("campoDeMedida: dónde van los renglones de lectura (15.6.8)", () => {
  it("ancho desde 0,70; medio de 0,45 a 0,70; angosto por debajo", () => {
    expect([1, 0.7].map(campoDeMedida)).toEqual(["ancho", "ancho"]);
    expect([0.6999, 0.45].map(campoDeMedida)).toEqual(["medio", "medio"]);
    expect([0.4499, 0.1, 0].map(campoDeMedida)).toEqual(["angosto", "angosto", "angosto"]);
  });
});

describe("escala: paso y números omitidos", () => {
  it("el paso es de 5 hasta 60 activas y después sube para no llenar la escala de números", () => {
    expect([1, 23, 60].map(pasoDeLaEscala)).toEqual([5, 5, 5]);
    expect([61, 100].map(pasoDeLaEscala)).toEqual([10, 10]);
    expect([101, 200].map(pasoDeLaEscala)).toEqual([20, 20]);
  });

  it("con más de 60 activas se dejan las marcas mayores y se sacan las menores", () => {
    const e = flota(Array.from({ length: 61 }, (_, i) => `ZK${String(100 + i)}AA`));
    expect(salidaDe(e).marcasMenores).toBe(false);
    expect(salidaDe(flota(Array.from({ length: 60 }, (_, i) => `ZK${String(100 + i)}AA`))).marcasMenores).toBe(true);
  });

  it("se omite todo número que quede a menos de 0,05 de la lectura o del final; la lectura y los extremos nunca", () => {
    // 100 activas (paso 10), lectura en 52: el 50 queda a 0,02 de la lectura y se omite.
    expect(escalaDeLaRegla(52, 100).map((m) => m.valor)).toEqual([0, 10, 20, 30, 40, 52, 60, 70, 80, 90, 100]);
    // 61 activas (paso 10): el 60 queda a 0,016 del final y se omite; el 30 coincide con la lectura y no se repite.
    expect(escalaDeLaRegla(30, 61).map((m) => [m.valor, m.tipo])).toEqual([
      [0, "extremo"],
      [10, "marca"],
      [20, "marca"],
      [30, "lectura"],
      [40, "marca"],
      [50, "marca"],
      [61, "extremo"],
    ]);
    expect(escalaDeLaRegla(0, 3).map((m) => [m.valor, m.tipo])).toEqual([
      [0, "lectura"],
      [3, "extremo"],
    ]);
    expect(escalaDeLaRegla(3, 3).map((m) => [m.valor, m.tipo])).toEqual([
      [0, "extremo"],
      [3, "lectura"],
    ]);
  });

  it("sin activas no hay escala", () => {
    expect(escalaDeLaRegla(0, 0)).toEqual([]);
  });
});

describe("el tipo de proyecto no cambia la regla", () => {
  it("una unidad de un proyecto sin habilitación y otra de uno con habilitación se cuentan igual", () => {
    expect(PROYECTO_BASE.requiereHabilitacion).toBe(false);
    expect(PROYECTO_PIEDRA.requiereHabilitacion).toBe(true);
    const s = salidaDe(flotaDePrueba());
    expect(s.activas).toBe(2);
  });
});

describe("peso: la regla viaja en la carga inicial", () => {
  it("salida.ts no importa los textos del conductor (arrastrarían a la carga inicial todo lo que solo usa la pantalla Hoy)", () => {
    expect(fuenteDeSalida).not.toMatch(/from "[^"]*textos-conductor/);
  });
});
