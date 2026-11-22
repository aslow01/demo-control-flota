// Paso 4.2 (lógica): lo que dibuja el centro de alertas (docs/diseno-ui.md, 6.1), con el ejemplo del generador.
import { describe, expect, it } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { MAX_PROTAGONISTA, centroDeAlertas, vencimientosVisibles, type CentroDeAlertas } from "../src/lib/estado/centro-alertas.ts";
import { flotaDePrueba, parte } from "./ayuda.ts";

const H = "2026-11-18";
const EMPRESA = "Logística Andina Demo S.A.";
const e: Estado = generar(SEMILLA_POR_DEFECTO, H);

function centroDe(estado: Estado, hoy = H): CentroDeAlertas {
  return centroDeAlertas(estado, calcularAlertas(estado, hoy), hoy, EMPRESA);
}

const c = centroDe(e);

describe("encabezado (6.1)", () => {
  it("dice el día en hora de Argentina, la empresa ficticia y las unidades activas", () => {
    expect(c.encabezado.linea).toBe(`Hoy es miércoles 18/11/2026 (hora de Argentina) · ${EMPRESA} · 23 unidades`);
    expect(c.encabezado.bajada).toBe("Datos ficticios de una empresa inventada. Todo se guarda en este navegador.");
  });

  it("con una sola unidad activa dice «1 unidad»", () => {
    const uno = { ...e, unidades: e.unidades.filter((u) => u.id === e.unidades[0]?.id) };
    expect(centroDe(uno).encabezado.linea.endsWith("· 1 unidad")).toBe(true);
  });
});

describe("protagonista «No pueden salir hoy» con el ejemplo", () => {
  it("son 4 unidades, en tono crítico, con la frase para lectores en un solo texto", () => {
    expect(c.protagonista.cifra).toBe(4);
    expect(c.protagonista.palabra).toBe("unidades");
    expect(c.protagonista.tono).toBe("critico");
    expect(c.protagonista.textoLector).toBe("4 unidades no pueden salir hoy.");
    expect(c.protagonista.disponibles).toBe("Disponibles hoy: 19 de 23 unidades activas.");
    expect(c.protagonista.masEnLaFlota).toBeNull();
  });

  it("lista primero las que no pueden salir (C01, C10) y después las fuera de servicio (C11, C12), cada grupo por patente", () => {
    const items = c.protagonista.items;
    expect(items).toHaveLength(4);
    expect(items.map((i) => i.categoria)).toEqual(["no-puede-salir", "no-puede-salir", "fuera-de-servicio", "fuera-de-servicio"]);
    for (const grupo of ["no-puede-salir", "fuera-de-servicio"] as const) {
      const patentes = items.filter((i) => i.categoria === grupo).map((i) => i.patente);
      expect(patentes).toEqual([...patentes].sort());
    }
    expect(items[0]).toMatchObject({
      patente: "ZK214BD",
      patenteTexto: "ZK 214 BD",
      motivo: "Seguro vencido hace 1 día",
      href: "#/unidad/ZK214BD",
    });
    expect(items[0]?.interno).toMatch(/^Int\. \d{2}$/);
  });

  it("C10 dice que le falta la habilitación; C11 y C12 dicen que están fuera de servicio y por qué", () => {
    const motivos = c.protagonista.items.map((i) => i.motivo);
    expect(motivos).toContain("Falta cargar: Habilitación de ingreso al proyecto");
    expect(motivos.filter((m) => m.startsWith("Desde el"))).toHaveLength(2);
    expect(motivos.some((m) => m.includes("en taller: cambio de embrague"))).toBe(true);
  });

  it("el motivo es el primero; los otros quedan en `motivos`", () => {
    for (const i of c.protagonista.items) {
      expect(i.motivos.length).toBeGreaterThanOrEqual(1);
      expect(i.motivo).toBe(i.motivos[0]);
    }
  });

  it("muestra hasta 6 y ofrece «Ver las N en la flota» con el total", () => {
    const enServicio = e.unidades.filter((u) => u.estado.tipo === "en-servicio").slice(0, 8);
    const ids = new Set(enServicio.map((u) => u.id));
    const muchas: Estado = {
      ...e,
      unidades: e.unidades.map((u) =>
        ids.has(u.id)
          ? { ...u, estado: { tipo: "fuera-de-servicio", desde: "2026-11-10", motivo: "Prueba de tope", origen: "manual", novedadIds: [] } }
          : u,
      ),
    };
    const p = centroDe(muchas).protagonista;
    expect(MAX_PROTAGONISTA).toBe(6);
    expect(p.items).toHaveLength(6);
    expect(p.cifra).toBeGreaterThan(6);
    expect(p.masEnLaFlota).toEqual({ texto: `Ver las ${p.cifra} en la flota`, href: "#/flota?filtro=no-disponibles" });
  });

  it("con 0 es vigente, dice que todas pueden salir y no lista unidades", () => {
    const sana = centroDe(flotaDePrueba());
    expect(sana.protagonista).toMatchObject({
      cifra: 0,
      palabra: "unidades",
      tono: "vigente",
      textoLector: "Todas las unidades activas pueden salir hoy.",
      items: [],
      masEnLaFlota: null,
      disponibles: "Disponibles hoy: 2 de 2 unidades activas.",
    });
  });

  it("con 1 dice «1 unidad» y «1 unidad no puede salir hoy.»", () => {
    const base = flotaDePrueba();
    const una: Estado = {
      ...base,
      unidades: base.unidades.map((u) =>
        u.id === "u1" ? { ...u, estado: { tipo: "fuera-de-servicio", desde: H, motivo: "En taller: prueba", origen: "manual", novedadIds: [] } } : u,
      ),
    };
    const p = centroDe(una).protagonista;
    expect(p.palabra).toBe("unidad");
    expect(p.textoLector).toBe("1 unidad no puede salir hoy.");
  });
});

describe("operación diaria con el ejemplo: 6 pendientes", () => {
  it("una fila por tipo con pendientes, en el orden del detalle, con su cifra y su texto", () => {
    expect(c.operacion.total).toBe(6);
    expect(c.operacion.rotuloTotal).toBe("6 pendientes");
    expect(c.operacion.filas.map((f) => [f.tipo, f.cifra, f.texto])).toEqual([
      ["novedad-critica", 1, "1 novedad crítica abierta"],
      ["uso-con-documentacion-vencida", 1, "1 circuló con documentación vencida"],
      ["parte-sin-enviar", 1, "1 parte sin enviar"],
      ["sin-parte", 2, "2 unidades sin parte de ayer"],
      ["novedad-abierta", 1, "1 novedad abierta hace 9 días"],
    ]);
    expect(c.operacion.vacio).toBeNull();
  });

  it("cada fila apunta al grupo del detalle que existe", () => {
    const ids = new Set(c.detalle.grupos.map((g) => g.idGrupo));
    for (const f of c.operacion.filas) expect(ids.has(f.idGrupo), f.tipo).toBe(true);
  });

  it("la barra de estado explica cómo lo carga el conductor", () => {
    expect(c.operacion.barraEstado).toEqual({
      intro: "Así lo carga el conductor:",
      accion: "Abrir el parte diario",
      aclaracion: "(cambia la vista a Conductor)",
    });
  });

  it("con todo en 0: «Sin pendientes de operación.»", () => {
    const sana = centroDe(flotaDePrueba()).operacion;
    expect(sana.total).toBe(0);
    expect(sana.filas).toEqual([]);
    expect(sana.vacio).toBe("Sin pendientes de operación.");
  });

  it("plurales: 2 novedades críticas y 3 abiertas con la antigüedad de la más antigua", () => {
    const base = e;
    const extra = {
      ...base,
      novedades: [
        ...base.novedades,
        { ...base.novedades.find((n) => n.estado === "abierta" && n.gravedad === "critica")!, id: "nueva-critica" },
        { ...base.novedades.find((n) => n.estado === "abierta" && n.gravedad === "normal")!, id: "nueva-1", fecha: "2026-11-16" },
        { ...base.novedades.find((n) => n.estado === "abierta" && n.gravedad === "normal")!, id: "nueva-2", fecha: "2026-11-17" },
      ],
    };
    const filas = centroDe(extra).operacion.filas;
    expect(filas.find((f) => f.tipo === "novedad-critica")?.texto).toBe("2 novedades críticas abiertas");
    expect(filas.find((f) => f.tipo === "novedad-abierta")?.texto).toBe("3 novedades abiertas, la más antigua hace 9 días");
  });
});

describe("vencimientos con el ejemplo: 12 en los grupos esperados", () => {
  const v = c.vencimientos;

  it("total 12 y rótulo del panel", () => {
    expect(v.total).toBe(12);
    expect(v.rotuloCantidad).toBe("próximos 30 días · 12");
  });

  it("grupos: 3 vencidos y faltantes, 4 en 7 días o menos, 3 entre 8 y 15, 2 entre 16 y 30", () => {
    expect(v.grupos.map((g) => [g.id, g.cantidad, g.filas.length, g.tituloConCantidad])).toEqual([
      ["vencidos", 3, 3, "Vencidos y faltantes (3)"],
      ["7", 4, 4, "Vencen en 7 días o menos (4)"],
      ["15", 3, 3, "Vencen entre 8 y 15 días (3)"],
      ["30", 2, 2, "Vencen entre 16 y 30 días (2)"],
    ]);
  });

  it("filtros con conteo: Todos 12, Vencidos y faltantes 3, 7 días o menos 4, 8 a 15 días 3, 16 a 30 días 2", () => {
    expect(v.filtros.map((f) => [f.id, f.etiqueta, f.cantidad])).toEqual([
      ["todos", "Todos", 12],
      ["vencidos", "Vencidos y faltantes", 3],
      ["7", "7 días o menos", 4],
      ["15", "8 a 15 días", 3],
      ["30", "16 a 30 días", 2],
    ]);
  });

  it("el horizonte sale de las mismas alertas que la lista (9 marcas, 3 vencidos en la caja)", () => {
    expect(v.horizonte.variante).toBe("completa");
    expect(v.horizonte.vencidos).toBe(3);
    expect(v.horizonte.columnas.flatMap((col) => col.marcas)).toHaveLength(9);
  });

  it("el grupo de vencidos: faltante primero (C10), después la licencia vencida de C21 (hace 3 días) y por último el seguro vencido de C01 (hace 1 día)", () => {
    const [falta, licencia, vencido] = v.grupos[0]!.filas;
    expect(licencia).toMatchObject({ tipo: "documento-vencido", estado: "Vencida hace 3 días", documento: "Licencia de conducir", gravedad: "critica" });
    expect(licencia?.titular.tipo).toBe("conductor");
    expect(falta).toMatchObject({
      tipo: "documento-faltante",
      estado: "Falta cargar",
      documento: "Habilitación de ingreso al proyecto",
      numero: null,
      vence: "—",
      sinVencimiento: true,
      gravedad: "critica",
    });
    expect(falta?.accion).toMatchObject({
      tipo: "cargar",
      etiqueta: "Cargar",
      documentoId: null,
      tipoDocumento: "habilitacion-proyecto",
    });
    expect(vencido).toMatchObject({
      tipo: "documento-vencido",
      estado: "Vencido hace 1 día",
      documento: "Seguro",
      vence: "17/11/2026",
      sinVencimiento: false,
      gravedad: "critica",
      proyecto: "Proyecto Piedra Lunar",
    });
    expect(vencido?.titular).toMatchObject({ tipo: "unidad", patenteTexto: "ZK 214 BD", href: "#/unidad/ZK214BD" });
    expect(vencido?.accion).toMatchObject({ tipo: "renovar", etiqueta: "Renovar", nombreAccesible: "Renovar seguro de ZK 214 BD" });
    expect(vencido?.numero).toMatch(/^DEMO-/);
  });

  it("el nombre accesible de «Cargar» nombra la unidad con su patente formateada", () => {
    const falta = v.grupos[0]!.filas[0]!;
    if (falta.titular.tipo !== "unidad") throw new Error("se esperaba una unidad");
    expect(falta.accion.nombreAccesible).toBe(`Cargar habilitación de ingreso al proyecto de ${falta.titular.patenteTexto}`);
  });

  it("las filas siguen el orden de V16 (el mismo de las alertas) y su alertaId es el de la alerta", () => {
    const r = calcularAlertas(e, H);
    const ids = v.grupos.flatMap((g) => g.filas.map((f) => f.alertaId));
    expect(ids).toEqual(r.alertas.filter((a) => a.categoria === "vencimientos").map((a) => a.id));
  });

  it("la licencia de un conductor lleva su nombre, «Conductor» y la unidad asignada si tiene", () => {
    const fila = v.grupos.flatMap((g) => g.filas).find((f) => f.titular.tipo === "conductor");
    expect(fila).toBeDefined();
    if (fila?.titular.tipo !== "conductor") throw new Error("se esperaba un conductor");
    expect(fila.documento).toBe("Licencia de conducir");
    expect(fila.titular.detalle).toBe("Conductor");
    expect(fila.accion.tipo).toBe("renovar");
    expect(fila.accion.nombreAccesible).toBe(`Renovar licencia de conducir de ${fila.titular.nombre}`);
  });

  it("sin vencimientos: texto de lista vacía y todos los grupos vacíos", () => {
    const sana = centroDe(flotaDePrueba()).vencimientos;
    expect(sana.total).toBe(0);
    expect(sana.textoVacio).toBe("No hay vencimientos en los próximos 30 días.");
    expect(sana.grupos.every((g) => g.filas.length === 0)).toBe(true);
  });
});

describe("filtro de la lista (5.8 y 5.9)", () => {
  const v = c.vencimientos;

  it("«Todos» muestra los grupos con filas y anuncia «Mostrando 12 de 12 vencimientos.»", () => {
    const r = vencimientosVisibles(v, "todos");
    expect(r.grupos.map((g) => g.id)).toEqual(["vencidos", "7", "15", "30"]);
    expect(r.anuncio).toBe("Mostrando 12 de 12 vencimientos.");
    expect(r.textoVacio).toBeNull();
  });

  it("un grupo concreto muestra solo ese y anuncia «Mostrando 4 de 12 vencimientos.»", () => {
    const r = vencimientosVisibles(v, "7");
    expect(r.grupos.map((g) => g.id)).toEqual(["7"]);
    expect(r.anuncio).toBe("Mostrando 4 de 12 vencimientos.");
  });

  it("un grupo vacío elegido se muestra con «No hay documentos en este grupo.»", () => {
    const base = flotaDePrueba();
    const solo30 = { ...base, documentos: base.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-12-10" } : d)) };
    const vv = centroDe(solo30).vencimientos;
    expect(vv.total).toBe(1);
    const r = vencimientosVisibles(vv, "vencidos");
    expect(r.grupos).toHaveLength(1);
    expect(r.grupos[0]?.filas).toEqual([]);
    expect(r.textoVacio).toBe("No hay documentos en este grupo.");
    expect(r.anuncio).toBe("Mostrando 0 de 1 vencimiento.");
  });

  it("«Todos» sin ningún vencimiento: lista vacía con el texto general", () => {
    const sana = centroDe(flotaDePrueba()).vencimientos;
    const r = vencimientosVisibles(sana, "todos");
    expect(r.grupos).toEqual([]);
    expect(r.textoVacio).toBe("No hay vencimientos en los próximos 30 días.");
  });
});

describe("detalle de operación (6.1)", () => {
  const d = c.detalle;

  it("un grupo por tipo con pendientes, con su título y cantidad", () => {
    expect(d.grupos.map((g) => [g.tipo, g.cantidad, g.tituloConCantidad])).toEqual([
      ["novedad-critica", 1, "Novedades críticas (1)"],
      ["uso-con-documentacion-vencida", 1, "Circuló con documentación vencida (1)"],
      ["parte-sin-enviar", 1, "Partes sin enviar (1)"],
      ["sin-parte", 2, "Sin parte de ayer (2)"],
      ["novedad-abierta", 1, "Novedades abiertas (1)"],
    ]);
  });

  it("la novedad crítica: estado «Crítica», acción «Resolver» y la novedad a resolver", () => {
    const fila = d.grupos[0]!.filas[0]!;
    expect(fila.estado).toBe("Crítica");
    expect(fila.gravedad).toBe("critica");
    expect(fila.accion).toMatchObject({ tipo: "resolver", etiqueta: "Resolver" });
    const novedad = e.novedades.find((n) => n.estado === "abierta" && n.gravedad === "critica");
    expect(fila.accion).toMatchObject({ novedadId: novedad?.id });
    expect(fila.accion.nombreAccesible.startsWith(`Resolver novedad de ${fila.unidad.patenteTexto}: Frenos`)).toBe(true);
    expect(fila.unidad.href).toMatch(/^#\/unidad\//);
  });

  it("parte sin enviar: «Sin enviar» y «Abrir parte» a la ruta del parte de esa fecha", () => {
    const fila = d.grupos.find((g) => g.tipo === "parte-sin-enviar")!.filas[0]!;
    expect(fila.estado).toBe("Sin enviar");
    expect(fila.accion).toMatchObject({ tipo: "abrir-parte", etiqueta: "Abrir parte" });
    expect(fila.accion.tipo === "abrir-parte" && fila.accion.href).toBe(`#/parte/${fila.unidad.patente}/2026-11-17`);
    expect(fila.fecha).toBe("17/11/2026");
  });

  it("sin parte de ayer: «Sin parte» y «Ver ficha» de la unidad", () => {
    const filas = d.grupos.find((g) => g.tipo === "sin-parte")!.filas;
    expect(filas).toHaveLength(2);
    for (const f of filas) {
      expect(f.estado).toBe("Sin parte");
      expect(f.accion).toMatchObject({ tipo: "ver-ficha", etiqueta: "Ver ficha", href: f.unidad.href });
    }
  });

  it("circuló con documentación vencida: «Con documentación vencida» y «Ver ficha»", () => {
    const fila = d.grupos.find((g) => g.tipo === "uso-con-documentacion-vencida")!.filas[0]!;
    expect(fila.estado).toBe("Con documentación vencida");
    expect(fila.accion.tipo).toBe("ver-ficha");
    expect(fila.texto).toMatch(/^Circuló con documentación vencida: Revisión técnica \(parte del \d{2}\/\d{2}\/\d{4}\)$/);
  });

  it("novedad abierta: «Abierta» y «Resolver»", () => {
    const fila = d.grupos.find((g) => g.tipo === "novedad-abierta")!.filas[0]!;
    expect(fila.estado).toBe("Abierta");
    expect(fila.gravedad).toBe("media");
    expect(fila.accion.tipo).toBe("resolver");
  });

  it("sin pendientes no hay grupos", () => {
    expect(centroDe(flotaDePrueba()).detalle.grupos).toEqual([]);
  });

  it("un parte sin enviar de un conductor que ya no está igual se muestra (sin nombre)", () => {
    const base = flotaDePrueba();
    const raro: Estado = { ...base, partes: [...base.partes, parte({ id: "borrador", unidadId: "u1", fecha: "2026-11-16", estado: "borrador", conductorId: "no-existe", enviado: null })] };
    const fila = centroDe(raro).detalle.grupos.find((g) => g.tipo === "parte-sin-enviar")?.filas[0];
    expect(fila?.texto).toBe("Parte del 16/11/2026 sin enviar");
  });
});
