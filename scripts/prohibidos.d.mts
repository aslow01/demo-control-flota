// Tipos de `prohibidos.mjs` (para que los tests en TypeScript lo importen con `strict`).
export interface Huella {
  /** SHA-256 hexadecimal del término normalizado. */
  huella: string;
  /** Largo del término normalizado (palabras unidas por un espacio). */
  longitud: number;
}
export const MAX_PALABRAS: number;
export function normalizar(texto: string): string;
export function tokenizar(texto: string): string[];
export function crearHuella(termino: string): Huella;
export function huellasDeLiterales(contenido: string): Huella[];
export function contieneProhibido(texto: string, huellas: readonly Huella[]): boolean;
export function correosNoPermitidos(texto: string): string[];
export function marcaPendienteDeConfirmar(linea: string): boolean;
