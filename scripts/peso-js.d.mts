// Tipos de `peso-js.mjs` (para que los tests en TypeScript lo importen con `strict`).
export const TOPE_INICIAL: number;
export const TOPE_PRIMERA_VISITA: number;
/** Los trozos de entrada que se piden en una primera visita, por su ruta en `dist/` (sin barra inicial). */
export const PRIMERA_VISITA: readonly RegExp[];
export const AVISO_TROZO: number;
export const TOPE_TOTAL_AVISO: number;
export const TOPE_CSS_INICIAL: number;
export const AVISO_CSS_INICIAL: number;
export const AVISO_CSS_TOTAL: number;
export const TOPE_FUENTES: number;
export interface ArchivoJs {
  ruta: string;
  gzip: number;
}
/** Una hoja de estilos de `dist/` con su tamaño gzip. */
export interface HojaDeEstilos {
  ruta: string;
  gzip: number;
}
/** Lo que se mide además del JS: todo opcional, así el control sigue sirviendo sin CSS ni fuentes. */
export interface MedidaDeEstilos {
  cssInicial?: number;
  cssTotal?: number;
  fuentes?: number;
}
export function gzipBytes(contenido: Uint8Array): number;
export function jsDeLaCargaInicial(html: string): string[];
export function cssDeLaCargaInicial(html: string): string[];
export function resumirEstilos(hojas: readonly HojaDeEstilos[], iniciales: readonly string[]): { cssInicial: number; cssTotal: number };
export function esUnaFuente(ruta: string): boolean;
export function jsDeLaPrimeraVisita(contenidos: readonly { ruta: string; texto: string }[], iniciales: readonly string[]): string[];
export function resumirPeso(
  archivos: readonly ArchivoJs[],
  iniciales: readonly string[],
  extrasPrimeraVisita?: readonly string[],
): { inicial: number; primeraVisita: number; total: number; trozos: ArchivoJs[] };
export function lineaDeAviso(texto: string, enActions: boolean): string;
export function resumenEnMarkdown(medida: { inicial: number; primeraVisita: number; total: number } & MedidaDeEstilos, avisos: readonly string[]): string;
export function evaluarPeso(medida: { inicial: number; total: number; trozos?: readonly ArchivoJs[]; primeraVisita?: number } & MedidaDeEstilos): { ok: boolean; avisos: string[] };
