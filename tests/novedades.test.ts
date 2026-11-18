// Paso 4.4 (lógica): consultas de novedades que comparten el comando «volver a servicio» (A4) y el diálogo.
import { describe, expect, it } from "vitest";
import { criticasAbiertasDeUnidad } from "../src/lib/dominio/novedades.ts";
import { novedad } from "./ayuda.ts";

describe("criticasAbiertasDeUnidad (A4)", () => {
  it("lista solo las críticas abiertas de esa unidad, de la más antigua a la más nueva, con su rótulo y su origen", () => {
    const lista = criticasAbiertasDeUnidad(
      [
        novedad({ id: "n-reciente", gravedad: "critica", fecha: "2026-11-16", origen: { tipo: "parte", parteId: "p1", item: "frenos" } }),
        novedad({ id: "n-vieja", gravedad: "critica", fecha: "2026-11-10", origen: { tipo: "manual" }, descripcion: "Pérdida de aceite" }),
        novedad({ id: "n-normal", gravedad: "normal" }),
        novedad({ id: "n-resuelta", gravedad: "critica", estado: "resuelta" }),
        novedad({ id: "n-otra-unidad", gravedad: "critica", unidadId: "u2" }),
      ],
      "u1",
    );
    expect(lista).toEqual([
      { novedadId: "n-vieja", rotulo: "Pérdida de aceite", origen: "cargada el 10/11/2026", texto: "Pérdida de aceite (cargada el 10/11/2026)" },
      { novedadId: "n-reciente", rotulo: "Frenos", origen: "parte del 16/11/2026", texto: "Frenos (parte del 16/11/2026)" },
    ]);
  });
});
