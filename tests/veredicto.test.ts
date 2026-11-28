import { describe, expect, it } from "vitest";
import type { EstadoDelDia } from "../src/lib/estado/conductor.ts";
import { veredictoDelDia } from "../src/lib/estado/veredicto.ts";
import { TEXTO_VEREDICTO } from "../src/lib/dominio/textos-conductor.ts";

// El veredicto de la llave de Hoy (docs/diseno-ui.md, 15.8, con la decisión DE3 del 28/11/2026): solo dice algo donde hay algo que decidir. Sale de `hoyEstado`, sin leer nada más.

const ENLACE = { texto: "Empezar la revisión", href: "#/parte/ZYN469/2026-11-18" };
const BORRADOR = { texto: "Tiene una revisión empezada.", descartar: { texto: "Descartar borrador", parteId: "p1" } };

const ESTADOS: Record<EstadoDelDia["tipo"], EstadoDelDia> = {
  "sin-parte": { tipo: "sin-parte", texto: "Antes de salir…", primario: ENLACE },
  borrador: { tipo: "borrador", texto: "Tiene una revisión empezada.", primario: ENLACE, descartar: BORRADOR.descartar },
  "en-uso": { tipo: "en-uso", etiqueta: "En uso desde las 06:52", texto: "Al terminar la jornada…", primario: ENLACE },
  enviado: { tipo: "enviado", etiqueta: "Cerrado a las 18:42", sinSalida: null, hastaManana: null, enlace: ENLACE },
  "fuera-de-servicio": { tipo: "fuera-de-servicio", aviso: "La unidad está fuera de servicio." },
  "licencia-no-vigente": { tipo: "licencia-no-vigente", renglon1: "No puede manejar hoy: …", renglon2: "Avise al encargado.", borrador: null },
  "no-puede-salir": { tipo: "no-puede-salir", renglon1: "ZK 214 BD no puede salir: …", renglon2: "Avise al encargado.", borrador: null },
  "cierre-pendiente": { tipo: "cierre-pendiente", renglon1: "El parte quedó sin cerrar.", renglon2: "Ciérrelo primero.", primario: ENLACE, borrador: null },
  "sin-unidad": { tipo: "sin-unidad" },
};

describe("veredictoDelDia", () => {
  it("sin parte y con borrador: «Puede salir», con la marca de que sale", () => {
    for (const tipo of ["sin-parte", "borrador"] as const) {
      expect(veredictoDelDia(ESTADOS[tipo]), tipo).toEqual({ tipo: "sale", texto: TEXTO_VEREDICTO.sale });
    }
  });

  it("en uso y cerrado: el pie lleva la etiqueta que ya existe (decir «Puede salir» sería falso: ya salió o ya volvió)", () => {
    expect(veredictoDelDia(ESTADOS["en-uso"])).toEqual({ tipo: "sale", texto: "En uso desde las 06:52" });
    expect(veredictoDelDia(ESTADOS.enviado)).toEqual({ tipo: "sale", texto: "Cerrado a las 18:42" });
  });

  it("cerrado sin salida (novedad crítica en la revisión): «No puede salir hoy»", () => {
    const sinSalida: EstadoDelDia = { tipo: "enviado", etiqueta: "Cerrado a las 07:10", sinSalida: "Revisión de las 06:52: novedad crítica en frenos. La unidad no salió.", hastaManana: "No vuelve a salir hoy.", enlace: ENLACE };
    expect(veredictoDelDia(sinSalida)).toEqual({ tipo: "no-sale", texto: TEXTO_VEREDICTO.noSale });
  });

  it("cerrado con salida, pero con la marca «hasta mañana» (la unidad no vuelve a salir hoy): «No puede salir hoy», no «sale»", () => {
    const conMarca: EstadoDelDia = { tipo: "enviado", etiqueta: "Cerrado a las 18:42", sinSalida: null, hastaManana: "No vuelve a salir hoy.", enlace: ENLACE };
    expect(veredictoDelDia(conMarca)).toEqual({ tipo: "no-sale", texto: TEXTO_VEREDICTO.noSale });
  });

  it("sin parte o con borrador pero con la aptitud de la unidad bloqueada (el aviso de «no puede salir» arriba del botón): «No puede salir hoy»", () => {
    for (const tipo of ["sin-parte", "borrador"] as const) {
      expect(veredictoDelDia(ESTADOS[tipo], true), tipo).toEqual({ tipo: "no-sale", texto: TEXTO_VEREDICTO.noSale });
      expect(veredictoDelDia(ESTADOS[tipo], false), tipo).toEqual({ tipo: "sale", texto: TEXTO_VEREDICTO.sale });
    }
  });

  it("el aviso de aptitud no cambia los demás estados (en uso: la unidad ya salió)", () => {
    expect(veredictoDelDia(ESTADOS["en-uso"], true)).toEqual({ tipo: "sale", texto: "En uso desde las 06:52" });
    expect(veredictoDelDia(ESTADOS["cierre-pendiente"], true)).toEqual({ tipo: "tarea", texto: TEXTO_VEREDICTO.cierrePendiente });
  });

  it("unidad fuera de servicio o bloqueada por documentos: «No puede salir hoy»", () => {
    expect(veredictoDelDia(ESTADOS["fuera-de-servicio"])).toEqual({ tipo: "no-sale", texto: TEXTO_VEREDICTO.noSale });
    expect(veredictoDelDia(ESTADOS["no-puede-salir"])).toEqual({ tipo: "no-sale", texto: TEXTO_VEREDICTO.noSale });
  });

  it("licencia sin vigencia: habla del conductor, no de la unidad", () => {
    expect(veredictoDelDia(ESTADOS["licencia-no-vigente"])).toEqual({ tipo: "no-sale", texto: TEXTO_VEREDICTO.sinLicencia });
  });

  it("«Cerrar antes»: es una tarea, no un bloqueo", () => {
    expect(veredictoDelDia(ESTADOS["cierre-pendiente"])).toEqual({ tipo: "tarea", texto: TEXTO_VEREDICTO.cierrePendiente });
  });

  it("sin unidad asignada: no hay veredicto (tampoco llave)", () => {
    expect(veredictoDelDia(ESTADOS["sin-unidad"])).toBeNull();
  });

  it("cubre los nueve estados del día: ninguno queda sin decidir", () => {
    for (const estado of Object.values(ESTADOS)) {
      const v = veredictoDelDia(estado);
      if (estado.tipo !== "sin-unidad") expect(v?.texto, estado.tipo).toBeTruthy();
    }
  });
});
