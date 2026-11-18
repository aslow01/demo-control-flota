// El reloj de la aplicación. Es el ÚNICO lugar donde se llama a `new Date()` (lo vigila `npm run buscar`): el dominio
// recibe `hoy` y `ahora` ya calculados, así cada regla se prueba con el momento que haga falta (T1, T2).

import { hoyEnArgentina } from "../dominio/fechas.ts";
import type { FechaCivil, Instante } from "../dominio/tipos.ts";

/** De dónde sale la hora. En los tests, una fuente fija. */
export type FuenteDeTiempo = () => Date;

export const relojDelSistema: FuenteDeTiempo = () => new Date();

/** Un instante y el día civil de Argentina que le corresponde: es lo que pide el contexto de los comandos. */
export interface Momento {
  /** Texto de toISOString (UTC, con milisegundos y Z). */
  ahora: Instante;
  /** Fecha civil en Argentina (UTC−3, T1), no la del equipo. */
  hoy: FechaCivil;
}

export interface Reloj {
  /** Lee la fuente cada vez: ahora y hoy son siempre del mismo instante. */
  momento(): Momento;
}

export function crearReloj(fuente: FuenteDeTiempo = relojDelSistema): Reloj {
  return {
    momento() {
      const fecha = fuente();
      if (!(fecha instanceof Date) || !Number.isFinite(fecha.getTime())) {
        throw new Error("El reloj devolvió una fecha inválida.");
      }
      return { ahora: fecha.toISOString(), hoy: hoyEnArgentina(fecha) };
    },
  };
}
