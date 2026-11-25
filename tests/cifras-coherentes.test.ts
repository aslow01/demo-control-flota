// Las cifras de Inicio (centro de alertas) y de Movilidades (flota) cuentan lo mismo, con las mismas palabras: salen de las mismas
// funciones (`resumenDeAptitud` y `contarVencimientos`/`porGrupo`). Cada invariante se prueba con el ejemplo del generador.
import { describe, expect, it } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { resumenDeAptitud } from "../src/lib/dominio/aptitud.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { centroDeAlertas, vencimientosVisibles } from "../src/lib/estado/centro-alertas.ts";
import { CONSULTA_INICIAL, panelDeFlota, vistaDeFlota } from "../src/lib/estado/flota.ts";

const H = "2026-11-18";
const e: Estado = generar(SEMILLA_POR_DEFECTO, H);
const r = calcularAlertas(e, H);
const centro = centroDeAlertas(e, r, H, "Logística Andina Demo S.A.");
const flota = panelDeFlota(e, r, H);
const resumen = resumenDeAptitud(e, H);

describe("unidades que hoy no salen: Inicio y Flota dicen lo mismo", () => {
  it("la cifra de Inicio es la suma de los dos subtotales que da Flota", () => {
    const noPueden = vistaDeFlota(flota, { ...CONSULTA_INICIAL, filtro: "no-pueden-salir" }).total;
    const fuera = vistaDeFlota(flota, { ...CONSULTA_INICIAL, filtro: "fuera-de-servicio" }).total;
    expect(noPueden).toBe(resumen.noPuedenSalir.length);
    expect(fuera).toBe(resumen.fueraDeServicio.length);
    expect(centro.protagonista.cifra).toBe(noPueden + fuera);
    // «Ver las N no disponibles en Movilidades» lleva a un filtro que lista exactamente esas N.
    expect(vistaDeFlota(flota, { ...CONSULTA_INICIAL, filtro: "no-disponibles" }).total).toBe(centro.protagonista.cifra);
  });

  it("Inicio desglosa la cifra con las mismas palabras y números que la línea de resumen de Flota", () => {
    const desglose = centro.protagonista.desglose;
    expect(desglose).not.toBeNull();
    expect(flota.resumen).toContain(desglose);
  });

  it("el lector escucha una sola frase: la cifra y su desglose, sin repetir la línea visual", () => {
    expect(centro.protagonista.textoLector).toBe("4 unidades no disponibles hoy: 2 bloqueadas por documentos, 2 fuera de servicio.");
  });

  it("con una unidad en cada grupo, singular en el desglose y la suma sigue cerrando", () => {
    const [una, otra] = [resumen.noPuedenSalir[0], resumen.fueraDeServicio[0]];
    const quitar = new Set([...resumen.noPuedenSalir.slice(1), ...resumen.fueraDeServicio.slice(1)].map((u) => u.id));
    const dos: Estado = { ...e, unidades: e.unidades.filter((u) => !quitar.has(u.id)) };
    const p = centroDeAlertas(dos, calcularAlertas(dos, H), H, "X").protagonista;
    expect(una).toBeDefined();
    expect(otra).toBeDefined();
    expect(p.cifra).toBe(2);
    expect(p.desglose).toBe("1 bloqueada por documentos · 1 fuera de servicio");
    expect(p.textoLector).toBe("2 unidades no disponibles hoy: 1 bloqueada por documentos, 1 fuera de servicio.");
    const panel = panelDeFlota(dos, calcularAlertas(dos, H), H);
    expect(panel.resumen).toContain(p.desglose);
  });

  it("sin unidades que no salen no hay desglose", () => {
    const sanas: Estado = { ...e, unidades: e.unidades.filter((u) => resumen.noPuedenSalir.every((n) => n.id !== u.id) && resumen.fueraDeServicio.every((n) => n.id !== u.id)) };
    expect(centroDeAlertas(sanas, calcularAlertas(sanas, H), H, "X").protagonista.desglose).toBeNull();
  });
});

describe("vencimientos: «próximos 30 días» no cuenta lo ya vencido", () => {
  const g = r.resumen.porGrupo;
  const v = centro.vencimientos;

  it("el ejemplo tiene vencidos o faltantes y por vencer a la vez (si no, la prueba no prueba nada)", () => {
    expect(g.vencidos).toBeGreaterThan(0);
    expect(g["7"] + g["15"] + g["30"]).toBeGreaterThan(0);
  });

  it("el número del rótulo es solo lo que vence en 30 días o menos", () => {
    expect(v.rotuloCantidad).toBe(`${g["7"] + g["15"] + g["30"]} vencen en 30 días`);
  });

  it("los subtotales de los filtros suman «Todos» y los grupos no se solapan", () => {
    const [todos, ...grupos] = v.filtros;
    expect(grupos.reduce((s, f) => s + f.cantidad, 0)).toBe(todos?.cantidad);
    const ids = v.grupos.flatMap((x) => x.filas.map((f) => f.alertaId));
    expect(new Set(ids).size).toBe(ids.length);
    for (const grupo of v.grupos) {
      for (const f of grupo.filas) expect(f.tipo === "documento-por-vencer").toBe(grupo.id !== "vencidos");
    }
  });

  it("«Todos» muestra los vencidos más los que vencen en 30 días: la cifra de cada filtro es la de sus filas", () => {
    expect(vencimientosVisibles(v, "todos").grupos.reduce((s, x) => s + x.filas.length, 0)).toBe(g.vencidos + g["7"] + g["15"] + g["30"]);
  });
});
