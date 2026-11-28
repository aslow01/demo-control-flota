// Tipos de `contraste.mjs` (para que los tests en TypeScript lo importen con `strict`).
export type Modo = "claro" | "oscuro";
/** Valores crudos de cada modo, por nombre de token sin los dos guiones (`c-papel`). */
export interface Tokens {
  claro: Record<string, string>;
  oscuro: Record<string, string>;
}
export type Rgb = [number, number, number];
/** Un par a medir: `a` (texto o marca) sobre `b` (fondo), nombres sin `--`. `solo` limita el par a un modo (el otro no se usa). */
export interface Par {
  grupo: string;
  a: string;
  b: string;
  minimo: number;
  solo?: Modo;
}
export type Estado = "ok" | "justo" | "falla" | "error";
export interface Medicion {
  /** Razón de contraste; `null` si hubo error. */
  razon: number | null;
  estado: Estado;
  /** Mensaje cuando `estado` es `error` (token faltante, color no soportado). */
  error?: string;
}
export interface Fila {
  par: Par;
  /** `null` si el par no se usa en ese modo. */
  claro: Medicion | null;
  oscuro: Medicion | null;
}
export interface Resultado {
  filas: Fila[];
  mediciones: number;
  fallos: number;
  justos: number;
  errores: number;
}
export const MARGEN_JUSTO: number;
export const PARES_VIGENTES: readonly Par[];
export const PARES_NUEVOS: readonly Par[];
export const PARES: readonly Par[];
export function leerTokens(css: string): Tokens;
export function resolverToken(tokens: Record<string, string>, nombre: string): string;
export function colorDeToken(tokens: Record<string, string>, nombre: string): Rgb;
export function luminancia(color: Rgb): number;
export function razonDeContraste(a: Rgb, b: Rgb): number;
export function medirPar(tokens: Record<string, string>, par: Par): Medicion;
export function medirTodo(css: string, pares?: readonly Par[]): Resultado;
export function aHex(color: Rgb): string;
