// Tipos de `peso-js.mjs` (para que los tests en TypeScript lo importen con `strict`).
export const TOPE_INICIAL: number;
export const TOPE_PRIMERA_VISITA: number;
export const AVISO_TROZO: number;
export const TOPE_TOTAL_AVISO: number;
export interface ArchivoJs {
  ruta: string;
  gzip: number;
}
export function gzipBytes(contenido: Uint8Array): number;
export function jsDeLaCargaInicial(html: string): string[];
export function jsDeLaPrimeraVisita(contenidos: readonly { ruta: string; texto: string }[], iniciales: readonly string[]): string[];
export function resumirPeso(
  archivos: readonly ArchivoJs[],
  iniciales: readonly string[],
  extrasPrimeraVisita?: readonly string[],
): { inicial: number; primeraVisita: number; total: number; trozos: ArchivoJs[] };
export function evaluarPeso(medida: { inicial: number; total: number; trozos?: readonly ArchivoJs[]; primeraVisita?: number }): { ok: boolean; avisos: string[] };
