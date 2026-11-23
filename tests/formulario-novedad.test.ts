// Paso 4.4 (lógica): diálogos «Resolver novedad» y «Cargar novedad» (docs/diseno-ui.md, 5.11, 5.15 y 5.17; reglas N1 a N3, A3, A4).
import { describe, expect, it } from "vitest";
import { ejecutar } from "../src/lib/dominio/comandos.ts";
import {
  CAMPOS_CARGAR_NOVEDAD,
  CAMPOS_RESOLVER,
  comandoDeCargarNovedad,
  comandoDeResolver,
  contextoDeCargarNovedad,
  contextoDeResolver,
  erroresDeNegocioResolver,
  validarCargarNovedad,
  validarResolver,
} from "../src/lib/dominio/formulario-novedad.ts";
import type { Estado, Novedad } from "../src/lib/dominio/tipos.ts";
import { contexto, flotaDePrueba, novedad } from "./ayuda.ts";

const H = "2026-11-18";

const frenos: Novedad = novedad({
  id: "n1",
  unidadId: "u1",
  gravedad: "critica",
  fecha: "2026-11-16",
  descripcion: "ruido al frenar",
  origen: { tipo: "parte", parteId: "p-frenos", item: "frenos" },
});

/** u1 quedó fuera de servicio por la novedad crítica de frenos (el caso C11). */
function fueraPorFrenos(): Estado {
  const e = flotaDePrueba();
  return {
    ...e,
    novedades: [frenos],
    unidades: e.unidades.map((u) =>
      u.id === "u1"
        ? { ...u, estado: { tipo: "fuera-de-servicio", desde: "2026-11-16", motivo: "Novedad crítica en frenos, parte del 16/11/2026", origen: "novedad-critica", novedadIds: ["n1"] } }
        : u,
    ),
  };
}

describe("contexto de «Resolver novedad»", () => {
  it("N2: la última crítica de una unidad fuera de servicio por novedad crítica ofrece volver a servicio, marcado", () => {
    expect(contextoDeResolver(fueraPorFrenos(), "n1", H)).toEqual({
      novedadId: "n1",
      unidadId: "u1",
      titulo: "Resolver novedad de ZK 214 BD",
      novedad: {
        rotulo: "Frenos",
        texto: "ruido al frenar",
        origen: "Parte del 16/11/2026, punto Frenos",
        fecha: "16/11/2026",
        gravedad: "critica",
        etiqueta: "Crítica",
      },
      ofreceVolverAServicio: true,
      etiquetaVolverAServicio: "Volver a servicio ahora",
      notaVolverAServicio: "ZK 214 BD está fuera de servicio por esta novedad. Con la casilla marcada, vuelve a servicio al resolverla.",
      avisoDocumentos: null,
      valoresIniciales: { texto: "", volverAServicio: true },
      primario: "Marcar como resuelta",
    });
  });

  it("N2: si queda otra crítica abierta no se ofrece (y no viene marcado)", () => {
    const e = fueraPorFrenos();
    const dos = { ...e, novedades: [...e.novedades, novedad({ id: "n2", unidadId: "u1", gravedad: "critica", fecha: "2026-11-17" })] };
    for (const id of ["n1", "n2"]) {
      const c = contextoDeResolver(dos, id, H);
      expect(c).toMatchObject({ ofreceVolverAServicio: false, notaVolverAServicio: null, avisoDocumentos: null });
      expect(c?.valoresIniciales.volverAServicio).toBe(false);
    }
  });

  it("N2: una unidad en servicio (novedad normal) o fuera de servicio a mano no lo ofrece", () => {
    const e = flotaDePrueba();
    const normal = novedad({ id: "n3", unidadId: "u1" });
    expect(contextoDeResolver({ ...e, novedades: [normal] }, "n3", H)?.ofreceVolverAServicio).toBe(false);
    const aMano = fueraPorFrenos();
    const manual = { ...aMano, unidades: aMano.unidades.map((u) => (u.id === "u1" ? { ...u, estado: { tipo: "fuera-de-servicio" as const, desde: "2026-11-10", motivo: "En taller", origen: "manual" as const, novedadIds: [] } } : u)) };
    expect(contextoDeResolver(manual, "n1", H)?.ofreceVolverAServicio).toBe(false);
  });

  it("A5: si al volver la unidad sigue sin poder salir por documentos, lo avisa junto a la casilla", () => {
    const e = fueraPorFrenos();
    const conSeguroVencido = { ...e, documentos: e.documentos.map((d) => (d.id === "u1-seguro" ? { ...d, vence: "2026-11-17" } : d)) };
    expect(contextoDeResolver(conSeguroVencido, "n1", H)?.avisoDocumentos).toBe("La unidad vuelve a servicio, pero no puede salir hasta renovar: Seguro.");
  });

  it("null si la novedad no existe o ya está resuelta; la de una novedad normal muestra «Abierta»", () => {
    const e = fueraPorFrenos();
    expect(contextoDeResolver(e, "zzz", H)).toBeNull();
    expect(contextoDeResolver({ ...e, novedades: [{ ...frenos, estado: "resuelta" }] }, "n1", H)).toBeNull();
    expect(contextoDeResolver({ ...flotaDePrueba(), novedades: [novedad({ id: "n3" })] }, "n3", H)?.novedad.etiqueta).toBe("Abierta");
  });

  it("una novedad cargada a mano dice su origen y una «otra novedad» del parte, también", () => {
    const e = { ...flotaDePrueba(), novedades: [novedad({ id: "n3", origen: { tipo: "manual" }, fecha: "2026-11-10" }), novedad({ id: "n4", origen: { tipo: "parte", parteId: "p", item: "otra" }, fecha: "2026-11-09" })] };
    expect(contextoDeResolver(e, "n3", H)?.novedad.origen).toBe("Cargada por el encargado");
    expect(contextoDeResolver(e, "n4", H)?.novedad.origen).toBe("Parte del 09/11/2026, otra novedad");
  });

  it("una unidad de baja puede cerrar sus novedades pero no se le ofrece volver a servicio", () => {
    const e = fueraPorFrenos();
    const baja = { ...e, unidades: e.unidades.map((u) => (u.id === "u1" ? { ...u, estado: { tipo: "baja" as const, desde: "2026-11-17", motivo: "Venta" } } : u)) };
    expect(contextoDeResolver(baja, "n1", H)).toMatchObject({ ofreceVolverAServicio: false });
  });
});

describe("validación y comando de «Resolver novedad»", () => {
  it("el orden del formulario y el texto de N1 (5 a 500)", () => {
    expect(CAMPOS_RESOLVER).toEqual(["texto"]);
    expect(validarResolver({ texto: "", volverAServicio: false })?.porCampo.texto).toBe("Cuente en pocas palabras qué se hizo (al menos 5 caracteres).");
    expect(validarResolver({ texto: "ok", volverAServicio: false })?.porCampo.texto).toBe("Cuente en pocas palabras qué se hizo (al menos 5 caracteres).");
    expect(validarResolver({ texto: "x".repeat(501), volverAServicio: false })?.porCampo.texto).toBe("El texto no puede superar 500 caracteres.");
    expect(validarResolver({ texto: "  12345  ", volverAServicio: false })).toBeNull();
  });

  it("el comando lleva el texto y la casilla; ejecutado con la casilla marcada produce novedad-resuelta y vuelta-a-servicio (N2)", () => {
    const e = fueraPorFrenos();
    const c = comandoDeResolver("n1", { texto: "Se cambiaron las pastillas", volverAServicio: true });
    expect(c).toEqual({ tipo: "resolverNovedad", novedadId: "n1", texto: "Se cambiaron las pastillas", volverAServicio: true });
    const r = ejecutar(e, c, contexto());
    expect(r.ok && r.valor.eventos.map((x) => x.tipo)).toEqual(["novedad-resuelta", "vuelta-a-servicio"]);
  });

  it("los errores del comando se reparten: el texto va al campo y lo demás, general", () => {
    const e = fueraPorFrenos();
    const r = ejecutar(e, comandoDeResolver("n1", { texto: "hola", volverAServicio: false }), contexto());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(erroresDeNegocioResolver(r.error).porCampo.texto).toBeDefined();
    const ya = ejecutar({ ...e, novedades: [{ ...frenos, estado: "resuelta" }] }, comandoDeResolver("n1", { texto: "algo hecho", volverAServicio: false }), contexto());
    if (!ya.ok) expect(erroresDeNegocioResolver(ya.error)).toMatchObject({ lista: [], general: "La novedad ya está resuelta." });
  });
});

describe("«Cargar novedad»", () => {
  it("contexto: título, casilla desmarcada y la nota de A3; null si la unidad no existe o está de baja", () => {
    const e = flotaDePrueba();
    expect(contextoDeCargarNovedad(e, "u1")).toEqual({
      unidadId: "u1",
      titulo: "Cargar novedad de ZK 214 BD",
      valoresIniciales: { descripcion: "", impideUso: false },
      etiquetaImpideUso: "Impide usar la unidad",
      notaImpideUso: "Si impide el uso, la unidad queda fuera de servicio hasta que se resuelva la novedad.",
      primario: "Guardar novedad",
    });
    expect(contextoDeCargarNovedad(e, "zzz")).toBeNull();
    const baja = { ...e, unidades: e.unidades.map((u) => (u.id === "u1" ? { ...u, estado: { tipo: "baja" as const, desde: "2026-11-17", motivo: "Venta" } } : u)) };
    expect(contextoDeCargarNovedad(baja, "u1")).toBeNull();
  });

  it("validación: vacío, corto y largo con los textos del dominio (3 a 500)", () => {
    expect(CAMPOS_CARGAR_NOVEDAD).toEqual(["descripcion"]);
    expect(validarCargarNovedad({ descripcion: "  ", impideUso: false })?.porCampo.descripcion).toBe("Escriba qué pasó.");
    expect(validarCargarNovedad({ descripcion: "ab", impideUso: false })?.porCampo.descripcion).toBe("La descripción tiene que tener al menos 3 caracteres.");
    expect(validarCargarNovedad({ descripcion: "x".repeat(501), impideUso: false })?.porCampo.descripcion).toBe("La descripción no puede superar 500 caracteres.");
    expect(validarCargarNovedad({ descripcion: "<b>x</b> pérdida", impideUso: true })).toBeNull();
  });

  it("el comando: con «Impide usar la unidad» la unidad queda fuera de servicio (N3, A3)", () => {
    const e = flotaDePrueba();
    const r = ejecutar(e, comandoDeCargarNovedad("u1", { descripcion: "Pérdida de aceite", impideUso: true }), contexto());
    expect(r.ok && r.valor.eventos.map((x) => x.tipo)).toEqual(["novedad-abierta", "fuera-de-servicio"]);
  });
});
