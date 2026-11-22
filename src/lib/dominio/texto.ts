// Normalización de los textos libres (U7). Todo texto que escribe una persona (descripciones, motivos, números de documento) es entrada externa:
// se le sacan los caracteres de control y los invisibles o de formato, que no son texto y sirven para esconder o reordenar lo que se lee (un
// `U+202E` invierte el orden visual del resto de la línea; un `U+200B` hace que dos textos iguales no lo parezcan). El largo se cuenta en caracteres
// (puntos de código), no en unidades UTF-16: un emoji es uno.

/**
 * Lo que no es texto, por categoría Unicode: los de control (`Cc`: C0, DEL y C1) y los de formato (`Cf`: U+00AD, U+061C, U+200B a U+200F, los bidireccionales
 * U+202A a U+202E y U+2066 a U+2069, U+2060, U+FEFF, U+FFF9 a U+FFFB…). Se dejan pasar la tabulación, el salto de línea y el retorno de carro (un área de texto
 * los admite) y la unión de ancho cero U+200D, que forma los emojis compuestos.
 */
const NO_ES_TEXTO = /(?![\t\n\r‍])[\p{Cc}\p{Cf}]/gu;

/** El texto sin caracteres de control ni invisibles o de formato (salvo `\t`, `\n`, `\r` y U+200D). No recorta ni toca nada más. */
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
