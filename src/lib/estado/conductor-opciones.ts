// Las opciones del diálogo «Ver como» (¿quién completa el parte?), sin DOM y sin reglas nuevas. Es lo único del conductor que viaja con el marco: el marco lo necesita desde el primer
// cuadro para decir de quién es la vista («Tamara Olivera · ZK 214 BD»). Las marcas «Para probar: …» (M1) salen de `estado/conductor.ts`, que arma el inicio de cada conductor y por eso
// se baja recién al abrir el diálogo: `conSugerencias` las suma a las opciones cuando llegan.
// También está acá `unidadDeHoy`: la única manera de decidir cuál es «la unidad» de un conductor. La usan estas opciones, la entrada al recorrido (`recorrido.ts`) y la pantalla «Hoy»
// con sus sugerencias (`conductor.ts`), para que el diálogo, el marco y la pantalla nunca nombren patentes distintas.

import { formatearPatente } from "../dominio/patente.ts";
import type { Estado, FechaCivil, Unidad } from "../dominio/tipos.ts";
import { estadoDeLicencia } from "../dominio/vencimientos.ts";

/** La unidad que el conductor ve en «Hoy»: de las suyas que no están de baja, la de menor interno (a igual interno, la de menor patente). `undefined` si no tiene ninguna. */
export function unidadDeHoy(estado: Estado, conductorId: string): Unidad | undefined {
  let elegida: Unidad | undefined;
  for (const u of estado.unidades) {
    if (u.conductorId !== conductorId || u.estado.tipo === "baja") continue;
    if (elegida === undefined || u.interno < elegida.interno || (u.interno === elegida.interno && u.patente < elegida.patente)) elegida = u;
  }
  return elegida;
}

/** Una opción del diálogo «¿Quién completa el parte?»: todo conductor activo es elegible (es un punto de vista); `licenciaVigente` es la de hoy (L1). */
export interface OpcionParaElegirConductor {
  id: string;
  nombre: string;
  /** La patente con espacios de su unidad (`unidadDeHoy`), o `null`. */
  unidad: string | null;
  licenciaVigente: boolean;
}

export function opcionesParaElegirConductor(estado: Estado, hoy: FechaCivil): OpcionParaElegirConductor[] {
  return estado.conductores
    .filter((c) => c.activo)
    .map((c) => {
      const unidad = unidadDeHoy(estado, c.id);
      return {
        id: c.id,
        nombre: c.nombre,
        unidad: unidad === undefined ? null : formatearPatente(unidad.patente),
        licenciaVigente: estadoDeLicencia(estado.documentos, c.id, hoy).vigente,
      };
    });
}

/** M1: la marca de un conductor que sirve para probar un caso. `etiqueta` es «Para probar: …»; `sinLicencia` evita repetir «Sin licencia vigente» en su renglón. */
export interface MarcaParaProbar {
  etiqueta: string;
  sinLicencia: boolean;
}

/** Las marcas por id de conductor (`leerSugerenciasDeVerComo`, en `estado/conductor.ts`). */
export type SugerenciasDeVerComo = ReadonlyMap<string, MarcaParaProbar>;

/** Una opción como la dibuja el diálogo: con su marca, o `null` si ese conductor no tiene ninguna. */
export type OpcionDeVerComo = OpcionParaElegirConductor & { paraProbar: MarcaParaProbar | null };

/**
 * Cuánto espera «Ver como» a que bajen las sugerencias antes de abrirse sin ellas. Es corto a propósito: las marcas son una ayuda, el diálogo sirve igual sin ellas, y un botón que no
 * responde durante los 15 s del plazo de una pantalla parecería roto.
 */
export const PLAZO_DE_SUGERENCIAS_MS = 2_000;

/** Las opciones con sus marcas «Para probar». Sin sugerencias (`null`: todavía no bajaron, o no bajaron) son las mismas opciones, sin ninguna marca. */
export function conSugerencias(opciones: readonly OpcionParaElegirConductor[], sugerencias: SugerenciasDeVerComo | null): OpcionDeVerComo[] {
  return opciones.map((o) => ({ ...o, paraProbar: sugerencias?.get(o.id) ?? null }));
}
