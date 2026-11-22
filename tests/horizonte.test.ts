import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { diasEntre, sumarDias } from "../src/lib/dominio/fechas.ts";
import {
  ESCALA_COMPLETA,
  ESCALA_MEDIANA,
  MAX_APILADAS,
  TRAMOS_PISTA,
  horizonteCompleto,
  horizonteDeUnidad,
  horizonteMinimo,
  tramoDeDia,
  type Horizonte,
} from "../src/lib/dominio/horizonte.ts";
import { textoHorizonte } from "../src/lib/dominio/textos.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { PROYECTO_PIEDRA, documento, estadoVacio, unidad } from "./ayuda.ts";

const H = "2026-11-18";
const e: Estado = generar(SEMILLA_POR_DEFECTO, H);
const resultado = calcularAlertas(e, H);

const columnasConMarcas = (h: Horizonte) => h.columnas.flatMap((c) => c.marcas.map((m) => ({ ...m, columna: c.columna })));

describe("tramos de la pista (5.6)", () => {
  it("0 a 7 semana, 8 a 15 quincena, 16 a 30 mes (todos los bordes)", () => {
    const esperado: Record<number, string> = { 0: "semana", 7: "semana", 8: "quincena", 15: "quincena", 16: "mes", 30: "mes" };
    for (const [dia, tramo] of Object.entries(esperado)) expect(tramoDeDia(Number(dia)), `día ${dia}`).toBe(tramo);
  });

  it("los tres tramos cubren las 31 columnas sin huecos ni solapes (líneas de grilla, fin exclusivo)", () => {
    expect(TRAMOS_PISTA).toEqual([
      { tramo: "semana", desde: 0, hasta: 7, columnaInicio: 1, columnaFin: 9 },
      { tramo: "quincena", desde: 8, hasta: 15, columnaInicio: 9, columnaFin: 17 },
      { tramo: "mes", desde: 16, hasta: 30, columnaInicio: 17, columnaFin: 32 },
    ]);
  });

  it("la escala completa marca Hoy, 7, 15 y 30 al comienzo de su columna; la mediana solo Hoy y 30", () => {
    expect(ESCALA_COMPLETA.map((m) => [m.etiqueta, m.etiquetaCorta, m.dia, m.columna, m.linea])).toEqual([
      ["Hoy", "Hoy", 0, 1, false],
      ["7", "7", 7, 8, true],
      ["15", "15", 15, 16, true],
      ["30 días", "30", 30, 31, true],
    ]);
    expect(ESCALA_MEDIANA.map((m) => m.etiquetaCorta)).toEqual(["Hoy", "30"]);
  });
});

describe("variante completa con el ejemplo del generador (semilla 20261118, 2026-11-18)", () => {
  const h = horizonteCompleto(resultado);

  it("9 marcas, una por vencimiento próximo, en los días 0, 1, 5, 7, 8, 12, 15, 16 y 30", () => {
    expect(h.columnas.map((c) => c.dia)).toEqual([0, 1, 5, 7, 8, 12, 15, 16, 30]);
    expect(columnasConMarcas(h)).toHaveLength(9);
    expect(h.vacio).toBe(false);
  });

  it("la columna de la grilla es día + 1 (1 a 31)", () => {
    for (const c of h.columnas) expect(c.columna).toBe(c.dia + 1);
  });

  it("cada marca cae en el día que dice su alerta y en el día que dice la fecha del documento (comparado con la lista)", () => {
    for (const m of columnasConMarcas(h)) {
      const alerta = resultado.alertas.find((a) => a.id === m.alertaId);
      expect(alerta, m.alertaId).toBeDefined();
      expect(alerta!.tipo).toBe("documento-por-vencer");
      expect(alerta!.d).toBe(m.dia);
      expect(m.columna).toBe(m.dia + 1);
      const doc = e.documentos.find((x) => x.id === alerta!.documentoId);
      expect(doc, m.alertaId).toBeDefined();
      expect(diasEntre(H, doc!.vence), m.alertaId).toBe(m.dia);
      expect(doc!.vence).toBe(sumarDias(H, m.dia));
    }
  });

  it("el tramo y la gravedad de cada marca salen de su alerta (7 días: media; 15 y 30: baja)", () => {
    for (const m of columnasConMarcas(h)) {
      const alerta = resultado.alertas.find((a) => a.id === m.alertaId)!;
      expect(m.tramo).toBe(tramoDeDia(m.dia));
      expect(m.tramo).toBe({ "7": "semana", "15": "quincena", "30": "mes" }[alerta.grupo as "7" | "15" | "30"]);
      expect(m.gravedad).toBe(alerta.gravedad);
    }
  });

  it("todas las alertas por vencer de la lista tienen su marca, y solo esas", () => {
    const porVencer = resultado.alertas.filter((a) => a.tipo === "documento-por-vencer").map((a) => a.id);
    expect(columnasConMarcas(h).map((m) => m.alertaId).sort()).toEqual([...porVencer].sort());
  });

  it("la caja de vencidos y faltantes dice 3", () => {
    expect(h.vencidos).toBe(3);
    expect(h.cajaVencidos).toEqual({ rotulo: "Vencidos y faltantes", cifra: 3, conAlerta: true });
  });

  it("los conteos coinciden con el resumen de alertas", () => {
    expect(h.porGrupo).toEqual(resultado.resumen.porGrupo);
    expect(h.porGrupo).toEqual({ vencidos: 3, "7": 4, "15": 3, "30": 2 });
  });

  it("aria-label exacto de la especificación", () => {
    expect(h.etiquetaAria).toBe(
      "Vencimientos de los próximos 30 días: 4 en 7 días o menos, 3 entre 8 y 15 días, 2 entre 16 y 30 días. 3 documentos vencidos o faltantes.",
    );
    expect(h.etiquetaAria).toBe(textoHorizonte(resultado.resumen.porGrupo));
    expect(h.ocultoAAyudas).toBe(false);
  });

  it("escala con rótulos y sin texto de vacío", () => {
    expect(h.escala).toBe(ESCALA_COMPLETA);
    expect(h.textoVacio).toBeNull();
  });
});

describe("las marcas caen en el día correcto con otras fechas base (también en las tres zonas horarias)", () => {
  for (const base of ["2026-11-18", "2026-12-01", "2027-02-28", "2028-02-29"]) {
    it(`fecha base ${base}`, () => {
      const estado = generar(SEMILLA_POR_DEFECTO, base);
      const r = calcularAlertas(estado, base);
      const h = horizonteCompleto(r);
      expect(h.columnas.map((c) => c.dia)).toEqual([0, 1, 5, 7, 8, 12, 15, 16, 30]);
      for (const m of columnasConMarcas(h)) {
        const doc = estado.documentos.find((x) => x.id === r.alertas.find((a) => a.id === m.alertaId)!.documentoId)!;
        expect(doc.vence).toBe(sumarDias(base, m.dia));
        expect(m.columna).toBe(m.dia + 1);
      }
      expect(h.etiquetaAria).toContain("4 en 7 días o menos, 3 entre 8 y 15 días, 2 entre 16 y 30 días. 3 documentos vencidos o faltantes.");
    });
  }
});

describe("apilado y marca hueca (más de 4 por día)", () => {
  function estadoConDocsEn(dias: number[]): Estado {
    const u = unidad({ id: "u1", creada: `${H}T12:00:00.000Z` });
    const tipos = ["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"] as const;
    const docs = tipos.map((tipo, i) =>
      documento({ id: `d-${tipo}`, titular: { tipo: "unidad", id: "u1" }, tipo, vence: sumarDias(H, dias[i] ?? 200) }),
    );
    return estadoVacio({ unidades: [u], documentos: docs, proyectos: [PROYECTO_PIEDRA] });
  }

  it("hasta 4 el mismo día: 4 marcas llenas, sin hueca", () => {
    const h = horizonteCompleto(calcularAlertas(estadoConDocsEn([3, 3, 3, 3]), H));
    expect(h.columnas).toHaveLength(1);
    const c = h.columnas[0]!;
    expect(c.dia).toBe(3);
    expect(c.total).toBe(4);
    expect(c.marcas.map((m) => m.hueca)).toEqual([false, false, false, false]);
    expect(c.ocultas).toBe(0);
  });

  it("más de 4 el mismo día: 3 llenas y la cuarta hueca (significa 'y más'); `ocultas` dice cuántas representa el aro", () => {
    const u = unidad({ id: "u1", creada: `${H}T12:00:00.000Z` });
    const docs = [
      ...["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"].map((tipo) =>
        documento({ id: `u-${tipo}`, titular: { tipo: "unidad", id: "u1" }, tipo: tipo as "seguro", vence: sumarDias(H, 9) }),
      ),
      documento({ id: "c-lic", titular: { tipo: "conductor", id: "c1" }, tipo: "licencia", vence: sumarDias(H, 9) }),
      documento({ id: "c-hab", titular: { tipo: "conductor", id: "c1" }, tipo: "habilitacion-manejo", vence: sumarDias(H, 9) }),
    ];
    const estado = estadoVacio({
      unidades: [u],
      documentos: docs,
      conductores: [{ id: "c1", nombre: "Luis Ferreyra", legajo: "L-0101", activo: true }],
      proyectos: [PROYECTO_PIEDRA],
    });
    const h = horizonteCompleto(calcularAlertas(estado, H));
    const c = h.columnas[0]!;
    expect(c.total).toBe(6);
    expect(c.marcas).toHaveLength(MAX_APILADAS.completa);
    expect(c.marcas.map((m) => m.hueca)).toEqual([false, false, false, true]);
    expect(c.ocultas).toBe(3); // el aro hueco representa a las 3 que no tienen marca llena
    expect(new Set(c.marcas.map((m) => m.tramo))).toEqual(new Set(["quincena"]));
    // El aria-label cuenta las seis, aunque se dibujen cuatro.
    expect(h.porGrupo["15"]).toBe(6);
    expect(h.etiquetaAria).toContain("6 entre 8 y 15 días");
  });

  it("el máximo se puede cambiar (la mediana puede necesitar menos apiladas)", () => {
    const h = horizonteCompleto(calcularAlertas(estadoConDocsEn([3, 3, 3, 3]), H), { maxApiladas: 2 });
    expect(h.columnas[0]!.marcas.map((m) => m.hueca)).toEqual([false, true]);
    expect(h.columnas[0]!.ocultas).toBe(3);
  });
});

describe("pista vacía", () => {
  it("sin nada por vencer: sin columnas, textoVacio y aria-label 'Nada vence…'", () => {
    const u = unidad({ id: "u1", creada: `${H}T12:00:00.000Z` });
    const docs = (["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"] as const).map((tipo) =>
      documento({ id: `d-${tipo}`, titular: { tipo: "unidad", id: "u1" }, tipo, vence: sumarDias(H, 200) }),
    );
    const h = horizonteCompleto(calcularAlertas(estadoVacio({ unidades: [u], documentos: docs, proyectos: [PROYECTO_PIEDRA] }), H));
    expect(h.columnas).toEqual([]);
    expect(h.vacio).toBe(true);
    expect(h.textoVacio).toBe("Nada vence en los próximos 30 días");
    expect(h.etiquetaAria).toBe("Nada vence en los próximos 30 días.");
    expect(h.cajaVencidos).toEqual({ rotulo: "Vencidos y faltantes", cifra: 0, conAlerta: false });
  });

  it("solo vencidos: la pista está vacía pero la caja y el aria-label lo dicen", () => {
    const u = unidad({ id: "u1", creada: `${H}T12:00:00.000Z` });
    const docs = (["seguro", "revision-tecnica", "matafuego", "habilitacion-proyecto"] as const).map((tipo) =>
      documento({ id: `d-${tipo}`, titular: { tipo: "unidad", id: "u1" }, tipo, vence: sumarDias(H, tipo === "seguro" ? -3 : 200) }),
    );
    const h = horizonteCompleto(calcularAlertas(estadoVacio({ unidades: [u], documentos: docs, proyectos: [PROYECTO_PIEDRA] }), H));
    expect(h.vacio).toBe(true);
    expect(h.vencidos).toBe(1);
    expect(h.etiquetaAria).toBe("Nada vence en los próximos 30 días. 1 documento vencido o faltante.");
    expect(h.cajaVencidos?.conAlerta).toBe(true);
  });
});

describe("variante mediana (ficha de una unidad: solo sus documentos)", () => {
  // Una unidad del ejemplo con al menos un vencimiento próximo, y su cuenta a mano desde los documentos.
  const conPuntos = new Set(
    resultado.alertas.filter((a) => a.tipo === "documento-por-vencer" && a.unidadId !== null).map((a) => a.unidadId as string),
  );

  it("hay unidades con marcas en el ejemplo", () => {
    expect(conPuntos.size).toBeGreaterThan(0);
  });

  it("para cada unidad las marcas son exactamente las alertas por vencer de esa unidad, en su día", () => {
    for (const u of e.unidades) {
      const h = horizonteDeUnidad(resultado, u.id);
      const esperadas = resultado.alertas.filter((a) => a.categoria === "vencimientos" && a.tipo === "documento-por-vencer" && a.unidadId === u.id);
      expect(
        columnasConMarcas(h)
          .map((m) => m.alertaId)
          .sort(),
        u.patente,
      ).toEqual(esperadas.map((a) => a.id).sort());
      for (const m of columnasConMarcas(h)) expect(m.dia).toBe(resultado.alertas.find((a) => a.id === m.alertaId)!.d);
      expect(h.vencidos, u.patente).toBe(
        resultado.alertas.filter((a) => a.categoria === "vencimientos" && a.grupo === "vencidos" && a.unidadId === u.id).length,
      );
    }
  });

  it("no incluye los documentos del conductor", () => {
    const deConductor = resultado.alertas.filter((a) => a.categoria === "vencimientos" && a.conductorId !== null);
    expect(deConductor.length).toBeGreaterThan(0);
    for (const u of e.unidades) {
      const ids = new Set(columnasConMarcas(horizonteDeUnidad(resultado, u.id)).map((m) => m.alertaId));
      for (const a of deConductor) expect(ids.has(a.id), `${u.patente} ${a.id}`).toBe(false);
    }
  });

  it("la suma de las marcas de todas las unidades más las de los conductores es la del horizonte completo", () => {
    const deUnidades = e.unidades.reduce((n, u) => n + columnasConMarcas(horizonteDeUnidad(resultado, u.id)).length, 0);
    const deConductores = resultado.alertas.filter((a) => a.tipo === "documento-por-vencer" && a.conductorId !== null).length;
    expect(deUnidades + deConductores).toBe(columnasConMarcas(horizonteCompleto(resultado)).length);
  });

  it("caja compacta 'Vencidos', escala solo Hoy y 30, y aria-label con los números de la unidad", () => {
    const id = [...conPuntos][0]!;
    const h = horizonteDeUnidad(resultado, id);
    expect(h.variante).toBe("mediana");
    expect(h.cajaVencidos?.rotulo).toBe("Vencidos");
    expect(h.escala).toBe(ESCALA_MEDIANA);
    expect(h.etiquetaAria).toBe(textoHorizonte(h.porGrupo));
    expect(h.ocultoAAyudas).toBe(false);
  });

  it("una unidad que no existe da una pista vacía, no un error", () => {
    const h = horizonteDeUnidad(resultado, "no-existe");
    expect(h.vacio).toBe(true);
    expect(h.vencidos).toBe(0);
  });
});

describe("variante mínima (columna 'Próximo vencimiento' de la flota)", () => {
  it("una sola marca por unidad: la del vencimiento más próximo", () => {
    for (const u of e.unidades) {
      const completa = horizonteDeUnidad(resultado, u.id);
      const h = horizonteMinimo(resultado, u.id);
      const marcas = columnasConMarcas(h);
      const mas = columnasConMarcas(completa);
      if (mas.length === 0) {
        expect(marcas, u.patente).toEqual([]);
        expect(h.vacio).toBe(true);
        continue;
      }
      expect(marcas, u.patente).toHaveLength(1);
      const dias = mas.map((m) => m.dia);
      expect(marcas[0]!.dia).toBe(Math.min(...dias));
      expect(marcas[0]!.columna).toBe(marcas[0]!.dia + 1);
      expect(marcas[0]!.hueca).toBe(false);
    }
  });

  it("sin caja, sin rótulos, sin texto de vacío y oculta a las ayudas técnicas (aria-hidden)", () => {
    const h = horizonteMinimo(resultado, e.unidades[0]!.id);
    expect(h.variante).toBe("minima");
    expect(h.cajaVencidos).toBeNull();
    expect(h.escala).toEqual([]);
    expect(h.textoVacio).toBeNull();
    expect(h.etiquetaAria).toBeNull();
    expect(h.ocultoAAyudas).toBe(true);
  });
});
