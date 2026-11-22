// Normalización de los textos libres (U7). Todo texto que escribe una persona (descripciones, motivos, números de documento) es entrada externa:
// se le sacan los caracteres de control y los de control bidireccional, que no son texto y sirven para esconder o reordenar lo que se lee (un
// `U+202E` invierte el orden visual del resto de la línea). El largo se cuenta en caracteres (puntos de código), no en unidades UTF-16: un emoji es uno.

/**
 * Caracteres de control que no son texto: los C0 salvo tabulación, salto de línea y retorno de carro (U+0000 a U+0008, U+000B, U+000C, U+000E a U+001F), DEL (U+007F),
 * los C1 (U+0080 a U+009F) y los de control bidireccional (U+202A a U+202E y U+2066 a U+2069).
 */
const NO_ES_TEXTO = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F‪-‮⁦-⁩]/g;

/** El texto sin caracteres de control ni de control bidireccional. No recorta ni toca nada más. */
export function limpiarTexto(texto: string): string {
  return texto.replace(NO_ES_TEXTO, "");
}

/** El texto limpio y sin espacios en los extremos: lo que se guarda. */
export function normalizarTexto(texto: string): string {
  return limpiarTexto(texto).trim();
}

/** El largo en caracteres (puntos de código): `😀` cuenta 1, no 2. */
export function largoEnCaracteres(texto: string): number {
  let n = 0;
  for (const _ of texto) n += 1;
  return n;
}
