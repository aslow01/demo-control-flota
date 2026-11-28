// M1 de la crítica (22/11/2026): qué conductores del ejemplo sirven para probar cada caso del parte. Lo decide el mismo cálculo que arma el inicio del conductor
// (`inicioDelConductor`), así lo que se sugiere es siempre lo que el visitante va a ver al elegirlo.
import { describe, expect, it, vi } from "vitest";
import { SEMILLA_POR_DEFECTO, generar } from "../src/lib/datos/generador.ts";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import { formatearPatente } from "../src/lib/dominio/patente.ts";
import type { Estado } from "../src/lib/dominio/tipos.ts";
import { conductoresParaProbar, inicioDelConductor } from "../src/lib/estado/conductor.ts";
import { conductorDelRecorrido } from "../src/lib/estado/recorrido.ts";
import { flotaDePrueba } from "./ayuda.ts";

// Armar la pantalla «Hoy» de cada conductor es lento (unos 20 ms cada una, y acá se arman de a decenas): con la máquina cargada una prueba pasa de los 5 s de siempre.
vi.setConfig({ testTimeout: 30_000 });

const H = "2026-11-18";
const e: Estado = generar(SEMILLA_POR_DEFECTO, H);
const alertas = calcularAlertas(e, H);
const sugeridos = conductoresParaProbar(e, alertas, H);
const inicioDe = (conductorId: string) => inicioDelConductor(e, alertas, H, { tipo: "conductor", conductorId });

describe("conductoresParaProbar (M1)", () => {
  it("con el ejemplo sugiere uno por caso, en este orden: unidad apta, documentación vencida, unidad fuera de servicio, sin licencia", () => {
    expect(sugeridos.map((s) => s.caso)).toEqual(["puede-salir", "documentacion-vencida", "fuera-de-servicio", "sin-licencia"]);
  });

  it("cada sugerido es un conductor activo del ejemplo, sin repetirse, con su unidad y el texto «Para probar: …»", () => {
    expect(new Set(sugeridos.map((s) => s.conductorId)).size).toBe(sugeridos.length);
    for (const s of sugeridos) {
      const c = e.conductores.find((x) => x.id === s.conductorId);
      expect(c?.activo, s.caso).toBe(true);
      expect(s.nombre).toBe(c?.nombre);
      expect(s.etiqueta.startsWith("Para probar: "), s.caso).toBe(true);
    }
    expect(sugeridos.map((s) => s.etiqueta)).toEqual([
      "Para probar: unidad apta y sin parte hoy",
      "Para probar: la unidad tiene la documentación vencida",
      "Para probar: unidad fuera de servicio por una novedad crítica",
      "Para probar: sin licencia de conducir vigente",
    ]);
  });

  it("la unidad apta es la de un conductor que, al elegirlo, ve «Empezar la revisión» sin avisos", () => {
    const s = sugeridos.find((x) => x.caso === "puede-salir")!;
    const v = inicioDe(s.conductorId);
    expect(v?.hoyEstado.tipo).toBe("sin-parte");
    expect(v?.avisoAptitud).toBeNull();
    expect(s.patente).toBe(v?.unidad?.patenteTexto);
  });

  it("la documentación vencida es la de ZK 214 BD (C01): el inicio dice que la unidad no puede salir", () => {
    const s = sugeridos.find((x) => x.caso === "documentacion-vencida")!;
    expect(s.patente).toBe("ZK 214 BD");
    expect(inicioDe(s.conductorId)?.hoyEstado.tipo).toBe("no-puede-salir");
  });

  it("la unidad fuera de servicio es la de frenos críticos (C11): ZU 899 QE", () => {
    const s = sugeridos.find((x) => x.caso === "fuera-de-servicio")!;
    expect(s.patente).toBe("ZU 899 QE");
    expect(inicioDe(s.conductorId)?.hoyEstado.tipo).toBe("fuera-de-servicio");
  });

  it("la persona sin licencia es la de C21: la única que figura sin licencia hoy, con su unidad", () => {
    const s = sugeridos.find((x) => x.caso === "sin-licencia")!;
    expect(alertas.resumen.conductoresSinLicencia.map((x) => x.conductorId)).toEqual([s.conductorId]);
    const u = e.unidades.find((x) => x.conductorId === s.conductorId)!;
    expect(s.patente).toBe(formatearPatente(u.patente));
    expect(inicioDe(s.conductorId)?.hoyEstado.tipo).toBe("licencia-no-vigente");
  });

  it("es determinista y no inventa casos: sin conductores no hay sugeridos, y una flota sana sugiere solo la unidad apta", () => {
    expect(conductoresParaProbar(e, alertas, H)).toEqual(sugeridos);
    const vacio: Estado = { ...e, conductores: [] };
    expect(conductoresParaProbar(vacio, calcularAlertas(vacio, H), H)).toEqual([]);
    const sana = flotaDePrueba();
    expect(conductoresParaProbar(sana, calcularAlertas(sana, H), H).map((s) => s.caso)).toEqual(["puede-salir"]);
  });

  it("un conductor inactivo o sin unidad asignada (los de relevo) no se sugiere", () => {
    const sinUnidad = new Set(e.conductores.filter((c) => !e.unidades.some((u) => u.conductorId === c.id)).map((c) => c.id));
    expect(sinUnidad.size).toBe(8);
    for (const s of sugeridos) expect(sinUnidad.has(s.conductorId)).toBe(false);
  });

  it("con dos unidades para la misma persona, la patente de la sugerencia es la que esa persona ve en «Hoy» (la de menor interno), no la primera de la lista", () => {
    // c-07 solo, con su unidad (ZK 214 BD, Int. 07, seguro vencido) primera en la lista y además la de c-01 (ZYN 469, Int. 01, apta): «Hoy» le muestra ZYN 469, que puede salir.
    const u07 = e.unidades.find((u) => u.conductorId === "c-07")!;
    const u01 = e.unidades.find((u) => u.conductorId === "c-01")!;
    const dos: Estado = {
      ...e,
      conductores: e.conductores.filter((c) => c.id === "c-07"),
      unidades: [u07, ...e.unidades.filter((u) => u.id !== u07.id).map((u) => (u.id === u01.id ? { ...u, conductorId: "c-07" } : u))],
    };
    const alertasDeDos = calcularAlertas(dos, H);
    const hoy = inicioDelConductor(dos, alertasDeDos, H, { tipo: "conductor", conductorId: "c-07" });
    expect(hoy?.unidad?.patenteTexto).toBe("ZYN 469");
    expect(conductoresParaProbar(dos, alertasDeDos, H).map((s) => ({ conductorId: s.conductorId, caso: s.caso, patente: s.patente }))).toEqual([
      { conductorId: "c-07", caso: "puede-salir", patente: "ZYN 469" },
    ]);
  });
});

describe("conductorDelRecorrido (entrada al recorrido en Inicio) frente a las sugerencias del diálogo", () => {
  it("con el ejemplo es el conductor cuyo inicio dice que la unidad no puede salir por un documento vencido, sin nombrarlo en el código", () => {
    const c = conductorDelRecorrido(e, H);
    expect(c).not.toBeNull();
    expect(inicioDe(c!.conductorId)?.hoyEstado.tipo).toBe("no-puede-salir");
    expect(c).toEqual({ conductorId: sugeridos.find((s) => s.caso === "documentacion-vencida")!.conductorId });
  });

  it("si se renueva lo que vencía no hay ninguno: la franja no se muestra", () => {
    const renovada: Estado = { ...e, documentos: e.documentos.map((d) => (d.vence < H ? { ...d, vence: "2027-12-31" } : d)) };
    expect(conductorDelRecorrido(renovada, H)).toBeNull();
  });

  it("la franja promete un seguro VENCIDO: un seguro que falta, o un bloqueo por otro documento (la habilitación de c-10), no la muestra", () => {
    const sinSeguros: Estado = { ...e, documentos: e.documentos.filter((d) => d.tipo !== "seguro") };
    expect(conductoresParaProbar(sinSeguros, calcularAlertas(sinSeguros, H), H).some((s) => s.caso === "documentacion-vencida")).toBe(true);
    expect(conductorDelRecorrido(sinSeguros, H)).toBeNull();
  });

  it("una flota sana y una sin conductores tampoco tienen ninguno", () => {
    const sana = flotaDePrueba();
    expect(conductorDelRecorrido(sana, H)).toBeNull();
    const vacio: Estado = { ...e, conductores: [] };
    expect(conductorDelRecorrido(vacio, H)).toBeNull();
  });
});
