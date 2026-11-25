// Tipos de `peso-js.mjs` (para que los tests en TypeScript lo importen con `strict`).
export const TOPE_INICIAL: number;
export const TOPE_TOTAL_AVISO: number;
export function gzipBytes(contenido: Uint8Array): number;
export function jsDeLaCargaInicial(html: string): string[];
export function resumirPeso(archivos: readonly { ruta: string; gzip: number }[], iniciales: readonly string[]): { inicial: number; total: number };
export function evaluarPeso(medida: { inicial: number; total: number }): { ok: boolean; avisos: string[] };
