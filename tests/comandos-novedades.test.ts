import { describe, expect, it } from "vitest";
import { calcularAlertas } from "../src/lib/dominio/alertas.ts";
import type { Estado, Novedad } from "../src/lib/dominio/tipos.ts";
import { ejecutarError, ejecutarOk, flotaDePrueba, novedad } from "./ayuda.ts";

const H = "2026-11-18";

const nueva = (parcial: Partial<{ unidadId: string; descripcion: string; impideUso: boolean }> = {}) => ({
  tipo: "cargarNovedad" as const,
  unidadId: "u1",
  descripcion: "Ruido en la caja de cambios",
  impideUso: false,
  ...parcial,
});

/** u1 fuera de servicio por una novedad crítica de frenos abierta (como el caso C11). */
function conFrenosCriticos(): Estado {
  const e = flotaDePrueba();
  const n: Novedad = novedad({
    id: "n-frenos",
    unidadId: "u1",
    gravedad: "critica",
    origen: { tipo: "parte", parteId: "p-x", item: "frenos" },
    descripcion: "ruido al frenar en bajada",
    fecha: "2026-11-16",
  });
  return {
    ...e,
    novedades: [n],
    unidades: e.unidades.map((u) =>
      u.id === "u1"
        ? { ...u, estado: { tipo: "fuera-de-servicio" as const, desde: "2026-11-16", motivo: "Novedad crítica en Frenos, parte del 16/11/2026", origen: "novedad-critica" as const, novedadIds: ["n-frenos"] } }
        : u,
    ),
  };
}

describe("cargarNovedad (N3)", () => {
  it("N3, H1: una novedad normal -> un evento y la unidad sigue en servicio", () => {
    const r = ejecutarOk(flotaDePrueba(), nueva());
    expect(r.eventos.map((x) => x.tipo)).toEqual(["novedad-abierta"]);
    expect(r.estado.novedades[0]).toMatchObject({
      unidadId: "u1",
      origen: { tipo: "manual" },
      descripcion: "Ruido en la caja de cambios",
      gravedad: "normal",
      fecha: H,
      estado: "abierta",
      resolucion: null,
    });
    expect(r.estado.unidades[0]?.estado.tipo).toBe("en-servicio");
    expect(r.eventos[0]?.resumen).toBe("Novedad abierta (ZK 214 BD): Ruido en la caja de cambios");
  });

  it("N3, A3: 'Impide usar la unidad' -> novedad crítica y unidad fuera de servicio con origen novedad-critica", () => {
    const r = ejecutarOk(flotaDePrueba(), nueva({ impideUso: true }));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["novedad-abierta", "fuera-de-servicio"]);
    const n = r.estado.novedades[0]!;
    expect(n.gravedad).toBe("critica");
    const u = r.estado.unidades[0]!;
    expect(u.estado).toEqual({
      tipo: "fuera-de-servicio",
      desde: H,
      motivo: "Novedad crítica cargada el 18/11/2026: Ruido en la caja de cambios",
      origen: "novedad-critica",
      novedadIds: [n.id],
    });
    expect(r.eventos[0]?.resumen).toBe("Novedad crítica abierta (ZK 214 BD): Ruido en la caja de cambios");
  });

  it("A3: el motivo se abrevia si la descripción es larga (el motivo tiene tope de 200)", () => {
    const r = ejecutarOk(flotaDePrueba(), nueva({ impideUso: true, descripcion: "x".repeat(500) }));
    const u = r.estado.unidades[0]!;
    expect(u.estado.tipo === "fuera-de-servicio" && u.estado.motivo.length).toBeLessThanOrEqual(200);
  });

  it("A3: una crítica nueva en una unidad ya fuera de servicio por novedad crítica suma su id y no repite el evento de estado", () => {
    const r = ejecutarOk(conFrenosCriticos(), nueva({ impideUso: true }));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["novedad-abierta"]);
    const u = r.estado.unidades[0]!;
    expect(u.estado.tipo === "fuera-de-servicio" && u.estado.novedadIds).toHaveLength(2);
  });

  it("una crítica en una unidad fuera de servicio a mano no cambia el estado (A4 exigirá resolverla)", () => {
    const fuera = ejecutarOk(flotaDePrueba(), { tipo: "ponerFueraDeServicio", unidadId: "u1", motivo: "En taller" }).estado;
    const r = ejecutarOk(fuera, nueva({ impideUso: true }));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["novedad-abierta"]);
    expect(r.estado.unidades[0]?.estado).toEqual(fuera.unidades[0]?.estado);
    expect(ejecutarError(r.estado, { tipo: "volverAServicio", unidadId: "u1" }).codigo).toBe("novedades-criticas-abiertas");
  });

  it("U7: descripción obligatoria (3 a 500), recortada y sin interpretarse como HTML", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, nueva({ descripcion: "   " })).campo).toBe("descripcion");
    expect(ejecutarError(e, nueva({ descripcion: "ab" })).mensaje).toBe("La descripción tiene que tener al menos 3 caracteres.");
    expect(ejecutarError(e, nueva({ descripcion: "x".repeat(501) })).mensaje).toBe("La descripción no puede superar 500 caracteres.");
    expect(ejecutarOk(e, nueva({ descripcion: "x".repeat(500) })).estado.novedades).toHaveLength(1);
    expect(ejecutarOk(e, nueva({ descripcion: "  <b>x</b> y  " })).estado.novedades[0]?.descripcion).toBe("<b>x</b> y");
  });

  it("unidad inexistente o de baja", () => {
    const e = flotaDePrueba();
    expect(ejecutarError(e, nueva({ unidadId: "zzz" })).codigo).toBe("unidad-inexistente");
    const baja = ejecutarOk(e, { tipo: "darDeBaja", unidadId: "u1", motivo: "Venta de la unidad" }).estado;
    expect(ejecutarError(baja, nueva()).codigo).toBe("unidad-de-baja");
  });
});

describe("resolverNovedad (N1, N2, N4)", () => {
  const resolver = (parcial: Partial<{ novedadId: string; texto: string; volverAServicio: boolean }> = {}) => ({
    tipo: "resolverNovedad" as const,
    novedadId: "n-frenos",
    texto: "Se cambiaron las pastillas",
    volverAServicio: false,
    ...parcial,
  });

  it("N1: el texto tiene que tener de 5 a 500 caracteres", () => {
    const e = conFrenosCriticos();
    const err = ejecutarError(e, resolver({ texto: "ok" }));
    expect(err.mensaje).toBe("Cuente en pocas palabras qué se hizo (al menos 5 caracteres).");
    expect(err.campo).toBe("texto");
    expect(ejecutarError(e, resolver({ texto: "x".repeat(501) })).mensaje).toBe("El texto no puede superar 500 caracteres.");
    expect(ejecutarOk(e, resolver({ texto: "  12345  " })).estado.novedades[0]?.resolucion?.texto).toBe("12345");
  });

  it("N4: la novedad resuelta no se borra: queda 'resuelta' con su resolución", () => {
    const r = ejecutarOk(conFrenosCriticos(), resolver(), undefined);
    expect(r.estado.novedades).toHaveLength(1);
    expect(r.estado.novedades[0]).toMatchObject({
      estado: "resuelta",
      resolucion: { texto: "Se cambiaron las pastillas", instante: "2026-11-18T15:00:00.000Z", autor: "Rocío Medina" },
    });
  });

  it("N2 (desmarcado), H1: resolver la última crítica deja la unidad fuera de servicio y produce solo novedad-resuelta", () => {
    const r = ejecutarOk(conFrenosCriticos(), resolver({ volverAServicio: false }));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["novedad-resuelta"]);
    expect(r.estado.unidades[0]?.estado.tipo).toBe("fuera-de-servicio");
    expect(r.eventos[0]?.resumen).toBe("Novedad resuelta (ZK 214 BD): Frenos. Se cambiaron las pastillas");
  });

  it("N2 (marcado), H1: resolver y volver a servicio en la misma operación -> novedad-resuelta + vuelta-a-servicio", () => {
    const r = ejecutarOk(conFrenosCriticos(), resolver({ volverAServicio: true }));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["novedad-resuelta", "vuelta-a-servicio"]);
    expect(r.estado.unidades[0]?.estado).toEqual({ tipo: "en-servicio" });
    expect(r.cambios.unidades.map((u) => u.id)).toEqual(["u1"]);
    expect(calcularAlertas(r.estado, H).alertas.some((a) => a.tipo === "novedad-critica")).toBe(false);
  });

  it("A4 dentro de N2: si quedan otras críticas abiertas, no se vuelve a servicio y no se resuelve nada", () => {
    const e = conFrenosCriticos();
    const otra = novedad({ id: "n-dir", unidadId: "u1", gravedad: "critica", origen: { tipo: "parte", parteId: "p-x", item: "direccion" }, fecha: "2026-11-17" });
    const dos: Estado = { ...e, novedades: [...e.novedades, otra] };
    const err = ejecutarError(dos, resolver({ volverAServicio: true }));
    expect(err.mensaje).toBe("Antes de volver a servicio, resuelva: Dirección (parte del 17/11/2026).");
    // sin marcar, sí se puede resolver una de las dos
    const r = ejecutarOk(dos, resolver({ volverAServicio: false }));
    expect(r.estado.unidades[0]?.estado.tipo).toBe("fuera-de-servicio");
    expect(r.estado.novedades.filter((n) => n.estado === "abierta")).toHaveLength(1);
  });

  it("resolver una novedad normal de una unidad en servicio", () => {
    const e = flotaDePrueba();
    const n = novedad({ id: "n-normal", unidadId: "u1", gravedad: "normal" });
    const r = ejecutarOk({ ...e, novedades: [n] }, resolver({ novedadId: "n-normal" }));
    expect(r.eventos.map((x) => x.tipo)).toEqual(["novedad-resuelta"]);
    expect(r.estado.unidades[0]?.estado.tipo).toBe("en-servicio");
  });

  it("pedir volver a servicio con la unidad ya en servicio es un error (la opción no aplica)", () => {
    const e = flotaDePrueba();
    const n = novedad({ id: "n-normal", unidadId: "u1", gravedad: "normal" });
    expect(ejecutarError({ ...e, novedades: [n] }, resolver({ novedadId: "n-normal", volverAServicio: true })).codigo).toBe("ya-en-servicio");
  });

  it("una novedad ya resuelta o inexistente", () => {
    const r = ejecutarOk(conFrenosCriticos(), resolver());
    expect(ejecutarError(r.estado, resolver()).codigo).toBe("novedad-ya-resuelta");
    expect(ejecutarError(conFrenosCriticos(), resolver({ novedadId: "zzz" })).codigo).toBe("novedad-inexistente");
  });
});
