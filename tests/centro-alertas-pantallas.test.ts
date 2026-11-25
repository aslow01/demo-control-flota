// E2-P (3.5, 3.6, 3.7): lo que piden las pantallas nuevas Inicio, Vencimientos y Operación diaria, con el ejemplo del generador (semilla por defecto, 18/11/2026).
import { describe, expect, it } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { resumenDeAptitud } from "../src/lib/dominio/aptitud.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import { MAX_POR_DIA_EN_REGLA } from "../src/lib/dominio/horizonte.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { centroDeAlertas, vencimientosVisibles, type CentroDeAlertas } from "../src/lib/estado/centro-alertas.ts";
import { PROYECTO_BASE, documento, estadoVacio, flotaDePrueba, novedad, parte, unidad } from "./ayuda.ts";

const H = "2026-11-18";
const e: Estado = generar(SEMILLA_POR_DEFECTO, H);
const r = calcularAlertas(e, H);
const centroDe = (estado: Estado): CentroDeAlertas => centroDeAlertas(estado, calcularAlertas(estado, H), H, "Logística Andina Demo S.A.");
const c = centroDe(e);

describe("cifras de Inicio (3.5) con el ejemplo", () => {
  const f = c.cifras;

  it("«No disponibles hoy» es la del protagonista: 4, con su desglose, su bajada y las disponibles", () => {
    expect(f.noDisponibles).toMatchObject({
      valor: 4,
      rotulo: "No disponibles hoy",
      tono: "critico",
      forma: null,
      bajada: "2 bloqueadas por documentos · 2 fuera de servicio",
      disponibles: "Disponibles hoy: 19 de 23 unidades activas.",
      href: "#/movilidades?filtro=no-disponibles",
    });
    expect(f.noDisponibles.valor).toBe(c.protagonista.cifra);
    expect(f.noDisponibles.valor).toBe(resumenDeAptitud(e, H).protagonista);
  });

  it("«Vencidos o faltantes»: 3, en tono crítico, con rombo, y lleva a su filtro", () => {
    expect(f.vencidos).toEqual({ valor: 3, rotulo: "Vencidos o faltantes", tono: "critico", forma: "rombo", href: "#/vencimientos?filtro=vencidos" });
  });

  it("«Vencen en 30 días»: 9 (4 + 3 + 2, sin los vencidos), en azufre, con triángulo", () => {
    expect(f.proximos).toEqual({ valor: 9, rotulo: "Vencen en 30 días", tono: "semana", forma: "triangulo", href: "#/vencimientos?filtro=proximos" });
    expect(f.proximos.valor).toBe(r.resumen.porGrupo["7"] + r.resumen.porGrupo["15"] + r.resumen.porGrupo["30"]);
  });

  it("«Partes pendientes»: 3 (1 sin enviar y 2 unidades sin parte), neutra, lleva a Checklists", () => {
    expect(f.partes).toEqual({ valor: 3, rotulo: "Partes pendientes", tono: "neutro", forma: null, href: "#/operacion/checklists" });
    expect(f.partes.valor).toBe(r.resumen.operacion["parte-sin-enviar"] + r.resumen.operacion["sin-parte"]);
  });

  it("«Novedad crítica»: 1, singular, en tono crítico, lleva a Novedades", () => {
    expect(f.novedadCritica).toEqual({ valor: 1, rotulo: "Novedad crítica", tono: "critico", forma: "rombo", href: "#/operacion/novedades" });
  });

  it("las cifras coinciden con las listas a las que llevan", () => {
    expect(f.vencidos.valor).toBe(c.vencimientos.grupos.find((g) => g.id === "vencidos")?.filas.length);
    expect(f.proximos.valor).toBe(c.vencimientos.grupos.filter((g) => g.id !== "vencidos").reduce((n, g) => n + g.filas.length, 0));
    expect(f.partes.valor).toBe(c.operacionDiaria.solapas.find((s) => s.id === "checklists")?.cantidad);
    expect(f.novedadCritica.valor).toBe(c.operacionDiaria.solapas.find((s) => s.id === "novedades")?.grupos.find((g) => g.id === "criticas")?.cantidad);
    expect(f.vencidos.valor + f.proximos.valor).toBe(c.vencimientos.total);
  });
});

describe("cifras de Inicio en una flota sana: todo en cero", () => {
  const f = centroDe(flotaDePrueba()).cifras;

  it("las cuatro secundarias valen 0, sin tono ni forma, y la principal dice que no hay ninguna", () => {
    for (const x of [f.vencidos, f.proximos, f.partes, f.novedadCritica]) expect(x).toMatchObject({ valor: 0, tono: "neutro", forma: null });
    expect(f.noDisponibles).toMatchObject({ valor: 0, tono: "vigente", forma: null, bajada: "Ninguna unidad bloqueada ni fuera de servicio" });
    expect(f.noDisponibles.disponibles).toBe("Disponibles hoy: 2 de 2 unidades activas.");
  });

  it("«Novedades críticas» va en plural con 0 y con 2", () => {
    expect(f.novedadCritica.rotulo).toBe("Novedades críticas");
    const base = flotaDePrueba();
    const dos: Estado = {
      ...base,
      novedades: [novedad({ id: "n1", unidadId: "u1", gravedad: "critica" }), novedad({ id: "n2", unidadId: "u2", gravedad: "critica" })],
    };
    expect(centroDe(dos).cifras.novedadCritica).toMatchObject({ valor: 2, rotulo: "Novedades críticas", tono: "critico" });
  });
});

describe("cifras de Inicio con una unidad que no existe más o datos raros", () => {
  it("con una flota vacía no hay nada y no se rompe", () => {
    const vacia = centroDe(estadoVacio());
    expect(vacia.cifras.noDisponibles.valor).toBe(0);
    expect(vacia.cifras.noDisponibles.disponibles).toBe("Disponibles hoy: 0 de 0 unidades activas.");
    expect(vacia.operacionDiaria.total).toBe(0);
    expect(vacia.vencimientos.regla.elementos).toEqual([]);
  });

  it("un vencimiento que vence hoy cuenta entre los de 30 días (la unidad todavía puede salir)", () => {
    const u = unidad({ id: "u1", proyectoId: PROYECTO_BASE.id, creada: `${H}T12:00:00.000Z` });
    const docs = (["seguro", "revision-tecnica", "matafuego"] as const).map((tipo) =>
      documento({ id: `d-${tipo}`, titular: { tipo: "unidad", id: "u1" }, tipo, vence: tipo === "seguro" ? H : sumarDias(H, 400) }),
    );
    const f = centroDe(estadoVacio({ unidades: [u], documentos: docs, proyectos: [PROYECTO_BASE] })).cifras;
    expect(f.proximos.valor).toBe(1);
    expect(f.vencidos.valor).toBe(0);
    expect(f.noDisponibles.valor).toBe(0);
  });
});

describe("Operación diaria en dos solapas (3.6) con el ejemplo", () => {
  const op = c.operacionDiaria;
  const checklists = op.solapas[0]!;
  const novedades = op.solapas[1]!;

  it("el total, su rótulo y la línea de contexto con la fecha", () => {
    expect(op.total).toBe(5);
    expect(op.rotuloTotal).toBe("5 pendientes");
    expect(op.contexto).toBe("5 pendientes · al 18/11/2026");
    expect(op.total).toBe(c.operacion.total);
  });

  it("son dos, Checklists y Novedades, en ese orden, cada una con su enlace y su cuenta", () => {
    expect(op.solapas.map((s) => s.id)).toEqual(["checklists", "novedades"]);
    expect(checklists).toMatchObject({ rotulo: "Checklists", cantidad: 3, critica: false, href: "#/operacion/checklists", vacio: null });
    expect(novedades).toMatchObject({ rotulo: "Novedades", cantidad: 2, critica: true, href: "#/operacion/novedades", vacio: null });
    expect(checklists.cantidad + novedades.cantidad).toBe(op.total);
  });

  it("Checklists reparte en sin enviar (borrador), sin cerrar (en uso) y unidades sin parte, y los tres grupos siempre están", () => {
    expect(checklists.grupos.map((g) => [g.id, g.titulo, g.cantidad])).toEqual([
      ["sin-enviar", "Partes sin enviar", 1],
      ["sin-cerrar", "Partes sin cerrar", 0],
      ["sin-parte", "Unidades sin parte de ayer", 2],
    ]);
    expect(checklists.grupos.map((g) => g.tituloConCantidad)).toEqual(["Partes sin enviar (1)", "Partes sin cerrar (0)", "Unidades sin parte de ayer (2)"]);
    expect(checklists.grupos.map((g) => g.filas.length)).toEqual([1, 0, 2]);
    expect(checklists.grupos[1]?.sinFilas).toBe("Ninguno.");
    expect(checklists.grupos[0]?.sinFilas).toBeNull();
  });

  it("Novedades reparte en críticas y abiertas", () => {
    expect(novedades.grupos.map((g) => [g.id, g.titulo, g.cantidad])).toEqual([
      ["criticas", "Novedades críticas", 1],
      ["abiertas", "Novedades abiertas", 1],
    ]);
  });

  it("las filas son las mismas del detalle (alertaId, acción y enlace) y cada alerta de operación está en una sola solapa", () => {
    const delDetalle = new Map(c.detalle.grupos.flatMap((g) => g.filas).map((x) => [x.alertaId, x]));
    const ids = op.solapas.flatMap((s) => s.grupos.flatMap((g) => g.filas.map((x) => x.alertaId)));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual([...delDetalle.keys()].sort());
    for (const s of op.solapas) for (const g of s.grupos) for (const x of g.filas) expect(x).toEqual(delDetalle.get(x.alertaId));
  });

  it("las acciones: abrir el parte sin enviar, ver la ficha de la unidad sin parte, resolver una novedad", () => {
    expect(checklists.grupos[0]?.filas[0]?.accion).toMatchObject({ tipo: "abrir-parte", etiqueta: "Abrir parte" });
    expect(checklists.grupos[2]?.filas.map((x) => x.accion.tipo)).toEqual(["ver-ficha", "ver-ficha"]);
    expect(novedades.grupos.flatMap((g) => g.filas).map((x) => x.accion.tipo)).toEqual(["resolver", "resolver"]);
  });

  it("dentro de cada grupo, el orden es el de las alertas (la más antigua primero)", () => {
    for (const s of op.solapas) {
      for (const g of s.grupos) {
        const fechas = g.filas.map((x) => x.alertaId);
        expect(fechas).toEqual(r.alertas.filter((a) => fechas.includes(a.id)).map((a) => a.id));
      }
    }
  });
});

describe("Operación diaria: partes sin cerrar y estados vacíos", () => {
  it("un parte en uso de un día anterior va a «sin cerrar», no a «sin enviar»", () => {
    const base = flotaDePrueba();
    const conEnUso: Estado = {
      ...base,
      partes: [
        ...base.partes.filter((p) => p.id !== "p-u1-ayer"),
        parte({ id: "p-u1-ayer", unidadId: "u1", fecha: "2026-11-17", estado: "en-uso", kmFin: null, combustible: null, enviado: null, revisado: "2026-11-17T09:00:00.000Z" }),
      ],
    };
    const g = centroDe(conEnUso).operacionDiaria.solapas[0]!.grupos;
    expect(g.map((x) => [x.id, x.cantidad])).toEqual([
      ["sin-enviar", 0],
      ["sin-cerrar", 1],
      ["sin-parte", 0],
    ]);
    expect(g[1]?.filas[0]?.estado).toBe("Sin cerrar");
  });

  it("una flota sana: las dos solapas vacías, sin grupos y con el vacío de cada una", () => {
    const op = centroDe(flotaDePrueba()).operacionDiaria;
    expect(op.total).toBe(0);
    expect(op.contexto).toBe("0 pendientes · al 18/11/2026");
    for (const s of op.solapas) {
      expect(s.cantidad).toBe(0);
      expect(s.critica).toBe(false);
      expect(s.grupos).toEqual([]);
    }
    expect(op.solapas[0]?.vacio).toEqual({ titulo: "No hay partes pendientes.", ayuda: expect.stringContaining("parte") });
    expect(op.solapas[1]?.vacio).toEqual({ titulo: "No hay novedades abiertas.", ayuda: expect.stringContaining("novedades") });
  });

  it("solo novedades abiertas no críticas: la solapa no es crítica y el grupo de críticas está vacío", () => {
    const base = flotaDePrueba();
    const s = centroDe({ ...base, novedades: [novedad({ id: "n1", unidadId: "u1", fecha: "2026-11-01" })] }).operacionDiaria.solapas[1]!;
    expect(s.cantidad).toBe(1);
    expect(s.critica).toBe(false);
    expect(s.grupos.map((g) => [g.id, g.cantidad])).toEqual([
      ["criticas", 0],
      ["abiertas", 1],
    ]);
    expect(s.grupos[0]?.sinFilas).toBe("Ninguno.");
  });
});

describe("regla de vencimientos interactiva (3.7) con el ejemplo", () => {
  const regla = c.vencimientos.regla;
  const filas = new Map(c.vencimientos.grupos.flatMap((g) => g.filas).map((x) => [x.alertaId, x]));

  it("una marca por vencimiento próximo, de hoy hacia adelante, cada una con su detalle completo", () => {
    expect(regla.elementos).toHaveLength(9);
    expect(regla.elementos.map((x) => x.dia)).toEqual([0, 1, 5, 7, 8, 12, 15, 16, 30]);
    for (const x of regla.elementos) {
      expect(x.tipo).toBe("marca");
      if (x.tipo !== "marca") continue;
      expect(x.vencimiento).toBe(filas.get(x.alertaId));
      expect(x.vencimiento.accion.tipo).toBe("renovar");
    }
  });

  it("la etiqueta corta es la patente de la unidad o el nombre abreviado del conductor", () => {
    for (const x of regla.elementos) {
      if (x.tipo !== "marca") continue;
      const t = x.vencimiento.titular;
      expect(x.etiquetaCorta).toBe(t.tipo === "unidad" ? t.patenteTexto : x.etiquetaCorta);
      if (t.tipo === "conductor") {
        const [nombre, ...apellido] = t.nombre.split(" ");
        expect(x.etiquetaCorta).toBe(`${nombre?.charAt(0)}. ${apellido.join(" ")}`);
      }
    }
    expect(regla.elementos.some((x) => x.tipo === "marca" && x.vencimiento.titular.tipo === "conductor")).toBe(true);
  });

  it("«Ver ficha» lleva a la unidad; el conductor lleva a la de su unidad, y si no tiene, a ninguna", () => {
    for (const x of regla.elementos) {
      if (x.tipo !== "marca") continue;
      const t = x.vencimiento.titular;
      expect(x.fichaHref).toBe(t.tipo === "unidad" ? t.href : (t.unidad?.href ?? null));
      if (x.fichaHref !== null) expect(x.fichaHref).toMatch(/^#\/unidad\/[A-Z0-9]+$/);
    }
  });

  it("la caja de vencidos: la cantidad, quiénes (sin repetir) y el enlace a su filtro", () => {
    expect(regla.vencidos.cantidad).toBe(3);
    expect(regla.vencidos.href).toBe("#/vencimientos?filtro=vencidos");
    expect(regla.vencidos.quienes.length).toBeGreaterThan(0);
    expect(new Set(regla.vencidos.quienes).size).toBe(regla.vencidos.quienes.length);
    const de = c.vencimientos.grupos
      .find((g) => g.id === "vencidos")!
      .filas.map((x) => (x.titular.tipo === "unidad" ? x.titular.patenteTexto : x.titular.nombre));
    expect(regla.vencidos.quienes.length).toBeLessThanOrEqual(de.length);
  });

  it("la leyenda: cuatro formas con la cantidad de cada grupo", () => {
    expect(regla.leyenda.map((x) => [x.grupo, x.forma, x.cantidad])).toEqual([
      ["vencidos", "rombo", 3],
      ["7", "triangulo", 4],
      ["15", "circulo", 3],
      ["30", "aro", 2],
    ]);
    expect(regla.leyenda.map((x) => x.rotulo)).toEqual(["Vencido o faltante", "7 días o menos", "8 a 15 días", "16 a 30 días"]);
    expect(regla.leyenda[1]?.textoLector).toBe("4 documentos, 7 días o menos");
    expect(regla.leyenda[0]?.textoLector).toBe("3 documentos, vencido o faltante");
  });

  it("el nombre de la pista para lectores es el del horizonte y la regla no está vacía", () => {
    expect(regla.etiquetaAria).toBe(c.vencimientos.horizonte.etiquetaAria);
    expect(regla.vacio).toBeNull();
  });
});

describe("regla de vencimientos: varios el mismo día y vacía", () => {
  const aMismoDia = (n: number, dia: number): Estado => {
    const unidades = Array.from({ length: n }, (_, i) => unidad({ id: `u${i}`, patente: `ZK21${i}BD`, interno: i + 1, proyectoId: PROYECTO_BASE.id, creada: `${H}T12:00:00.000Z` }));
    const documentos = unidades.flatMap((u) =>
      (["seguro", "revision-tecnica", "matafuego"] as const).map((tipo) =>
        documento({ id: `${u.id}-${tipo}`, titular: { tipo: "unidad", id: u.id }, tipo, vence: sumarDias(H, tipo === "seguro" ? dia : 400) }),
      ),
    );
    return estadoVacio({ unidades, documentos, proyectos: [PROYECTO_BASE] });
  };

  it("tres el mismo día (con 2 por día): una marca y «y 2 más» que lleva a la lista de ese tramo", () => {
    expect(MAX_POR_DIA_EN_REGLA).toBe(2);
    const { elementos } = centroDe(aMismoDia(3, 5)).vencimientos.regla;
    expect(elementos.map((x) => x.tipo)).toEqual(["marca", "mas"]);
    expect(elementos[1]).toMatchObject({ tipo: "mas", mas: 2, dia: 5, href: "#/vencimientos?filtro=7" });
  });

  it("el «y N más» lleva al filtro del tramo del día: 7, 15 o 30 días", () => {
    const hrefDe = (dia: number) => {
      const m = centroDe(aMismoDia(3, dia)).vencimientos.regla.elementos.find((x) => x.tipo === "mas");
      return m?.tipo === "mas" ? m.href : null;
    };
    expect(hrefDe(0)).toBe("#/vencimientos?filtro=7");
    expect(hrefDe(7)).toBe("#/vencimientos?filtro=7");
    expect(hrefDe(8)).toBe("#/vencimientos?filtro=15");
    expect(hrefDe(15)).toBe("#/vencimientos?filtro=15");
    expect(hrefDe(16)).toBe("#/vencimientos?filtro=30");
    expect(hrefDe(30)).toBe("#/vencimientos?filtro=30");
  });

  it("los documentos de «y N más» siguen en la lista y en la cuenta de la leyenda", () => {
    const v = centroDe(aMismoDia(5, 9)).vencimientos;
    expect(v.regla.leyenda.find((x) => x.grupo === "15")?.cantidad).toBe(5);
    expect(v.total).toBe(5);
  });

  it("sin vencimientos próximos: sin elementos y con el texto de vacío", () => {
    const v = centroDe(aMismoDia(2, 200)).vencimientos;
    expect(v.regla.elementos).toEqual([]);
    expect(v.regla.vacio).toBe("Nada vence en los próximos 30 días");
  });
});

describe("Vencimientos como pantalla: filtros por enlace (3.5 y 3.7)", () => {
  const v = c.vencimientos;

  it("seis filtros en el orden del prototipo, cada uno con su enlace, su cuenta, su tono y su forma", () => {
    expect(v.filtrosEnlace.map((x) => [x.id, x.etiqueta, x.cantidad, x.href])).toEqual([
      ["todos", "Todos", 12, "#/vencimientos"],
      ["vencidos", "Vencidos o faltantes", 3, "#/vencimientos?filtro=vencidos"],
      ["proximos", "Vencen en 30 días", 9, "#/vencimientos?filtro=proximos"],
      ["7", "7 días o menos", 4, "#/vencimientos?filtro=7"],
      ["15", "8 a 15 días", 3, "#/vencimientos?filtro=15"],
      ["30", "16 a 30 días", 2, "#/vencimientos?filtro=30"],
    ]);
    expect(v.filtrosEnlace.map((x) => x.forma)).toEqual([null, "rombo", null, "triangulo", "circulo", "aro"]);
    expect(v.filtrosEnlace.map((x) => x.tono)).toEqual([null, "critico", null, "semana", "quincena", "mes"]);
  });

  it("la línea de contexto no cuenta los vencidos entre los de 30 días", () => {
    expect(v.contexto).toBe("3 vencidos o faltantes · 9 vencen en 30 días");
  });

  it("el filtro «proximos» muestra los tres grupos de 30 días y deja afuera los vencidos", () => {
    const vis = vencimientosVisibles(v, "proximos");
    expect(vis.grupos.map((g) => g.id)).toEqual(["7", "15", "30"]);
    expect(vis.textoVacio).toBeNull();
    expect(vis.anuncio).toBe("Mostrando 9 de 12 vencimientos.");
  });

  it("los demás filtros siguen como estaban, y «proximos» sin nada da el vacío del grupo", () => {
    expect(vencimientosVisibles(v, "todos").grupos.map((g) => g.id)).toEqual(["vencidos", "7", "15", "30"]);
    expect(vencimientosVisibles(v, "vencidos").anuncio).toBe("Mostrando 3 de 12 vencimientos.");
    const sinProximos = centroDe(flotaDePrueba()).vencimientos;
    expect(vencimientosVisibles(sinProximos, "proximos")).toMatchObject({ grupos: [], textoVacio: "No hay documentos en este grupo.", anuncio: "Mostrando 0 de 0 vencimientos." });
  });

  it("el filtro viejo de dos valores sigue funcionando para la pantalla actual", () => {
    expect(v.filtros.map((x) => x.id)).toEqual(["todos", "vencidos", "7", "15", "30"]);
  });
});
