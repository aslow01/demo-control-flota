// Interfaz del repositorio (docs/diseno.md, sección 10). Dos implementaciones con la misma suite de contrato:
// `RepositorioMemoria` (tests y modo D8) y, más adelante, `RepositorioIndexedDB`.

import type { Cambios } from "../dominio/estado.ts";
import type { Estado, Evento } from "../dominio/tipos.ts";

export type CodigoErrorRepositorio =
  /** Un índice único se violaría (patente repetida, o un segundo parte de la misma unidad y fecha: P1). */
  | "indice-unico"
  /** Se intentó escribir un evento con un id que ya existe: el historial solo se agrega (H2). */
  | "evento-repetido"
  /** La escritura falló (cuota, transacción abortada...): no se aplicó nada (D10). */
  | "escritura-fallida"
  /** La conexión con la base está cerrada (se borró o se actualizó desde otra pestaña, o el navegador la cerró): ningún reintento puede funcionar sobre este repositorio. */
  | "conexion-cerrada";

export class ErrorDeRepositorio extends Error {
  readonly codigo: CodigoErrorRepositorio;

  constructor(codigo: CodigoErrorRepositorio, mensaje: string) {
    super(mensaje);
    this.name = "ErrorDeRepositorio";
    this.codigo = codigo;
  }
}

export interface Repositorio {
  /** Todo lo guardado, o `null` si la base está vacía (primera visita, D4). Siempre una copia. */
  cargar(): Promise<Estado | null>;
  /** Reemplaza todo el contenido en una sola transacción (arranque y "Reiniciar demo"). */
  reemplazarTodo(estado: Estado): Promise<void>;
  /**
   * Escribe los cambios de un comando y sus eventos en UNA transacción (P12, D10): o se aplica todo o no se aplica nada.
   * Los eventos solo se agregan al final del historial: no existe forma de editar ni de borrar uno (H2).
   */
  escribir(cambios: Cambios, eventos: readonly Evento[]): Promise<void>;
  /** Vacía todo, también el historial. Es lo único que borra eventos (D6). */
  vaciar(): Promise<void>;
  /** Libera la conexión (IndexedDB). La memoria no la necesita. */
  cerrar?(): void;
}
