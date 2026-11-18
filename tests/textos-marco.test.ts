// «Cómo funciona» (src/componentes/textos-marco.ts) afirma cifras de las reglas: estos tests las comparan con el dominio,
// para que un cambio de umbral, de cantidad de puntos o de criterio no deje el texto diciendo otra cosa.
import { describe, expect, it } from "vitest";
import { TEXTO_COMO_FUNCIONA } from "../src/componentes/textos-marco.ts";
import { ITEMS_CHECKLIST, novedadesDelParte } from "../src/lib/dominio/parte.ts";
import type { Grupo } from "../src/lib/dominio/vencimientos.ts";
import { clasificar } from "../src/lib/dominio/vencimientos.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import type { ItemChecklist } from "../src/lib/dominio/tipos.ts";
import { checklistEnOrden, parte } from "./ayuda.ts";

const HOY = "2026-11-18";

/** Días hasta el vencimiento que el dominio asigna a cada grupo, mirados desde afuera: de -3 a 60 días. */
function diasPorGrupo(): Record<Grupo | "ninguno", number[]> {
  const grupos: Record<Grupo | "ninguno", number[]> = { vencidos: [], "7": [], "15": [], "30": [], ninguno: [] };
  for (let d = -3; d <= 60; d++) grupos[clasificar(sumarDias(HOY, d), HOY).grupo ?? "ninguno"].push(d);
  return grupos;
}

function numerosDe(texto: string): number[] {
  return (texto.match(/\d+/g) ?? []).map(Number);
}

const regla = (prefijo: string): string => {
  const r = TEXTO_COMO_FUNCIONA.reglas.find((x) => x.etiqueta.startsWith(prefijo));
  if (r === undefined) throw new Error(`«Cómo funciona» no tiene la regla «${prefijo}».`);
  return r.etiqueta;
};

describe("«Cómo funciona»: los umbrales de vencimiento son los del dominio", () => {
  const grupos = diasPorGrupo();
  const rango = (g: Grupo): [number, number] => [Math.min(...grupos[g]), Math.max(...grupos[g])];

  it("hasta 7 días (el día del vencimiento incluido)", () => {
    expect(numerosDe(regla("7 días"))).toEqual([rango("7")[1]]);
    expect(rango("7")[0]).toBe(0);
  });

  it("8 a 15 días", () => {
    expect(numerosDe(regla("8 a 15"))).toEqual(rango("15"));
  });

  it("16 a 30 días", () => {
    expect(numerosDe(regla("16 a 30"))).toEqual(rango("30"));
  });

  it("más de 30 días no tiene alerta", () => {
    expect(numerosDe(regla("Más de 30"))).toEqual([rango("30")[1]]);
    expect(Math.min(...grupos.ninguno)).toBe(rango("30")[1] + 1);
  });

  it("los rangos se siguen sin huecos ni solapes", () => {
    expect(rango("15")[0]).toBe(rango("7")[1] + 1);
    expect(rango("30")[0]).toBe(rango("15")[1] + 1);
  });
});

describe("«Cómo funciona»: el parte diario dice lo que hace el dominio", () => {
  it("la cantidad de puntos de revisión es la del checklist", () => {
    expect(TEXTO_COMO_FUNCIONA.parte).toContain(`${ITEMS_CHECKLIST.length} puntos de revisión`);
  });

  it("una novedad en un punto crítico, o que impide usar la unidad, es crítica; en otro punto es normal", () => {
    const conNovedad = (item: ItemChecklist, impideUso: boolean) =>
      novedadesDelParte(
        parte({ checklist: { ...checklistEnOrden(), [item]: { estado: "con-novedad", descripcion: "Descripción de prueba", impideUso } } }),
      );
    const criticos = ITEMS_CHECKLIST.filter((i) => i.critico);
    const comunes = ITEMS_CHECKLIST.filter((i) => !i.critico);
    expect(criticos.length).toBeGreaterThan(0);
    expect(comunes.length).toBeGreaterThan(0);
    for (const i of criticos) expect(conNovedad(i.id, false)[0]?.gravedad).toBe("critica");
    for (const i of comunes) {
      expect(conNovedad(i.id, false)[0]?.gravedad).toBe("normal");
      expect(conNovedad(i.id, true)[0]?.gravedad).toBe("critica");
    }
    expect(TEXTO_COMO_FUNCIONA.parte).toContain("punto crítico");
    expect(TEXTO_COMO_FUNCIONA.parte).toContain("«Impide usar la unidad»");
  });
});
