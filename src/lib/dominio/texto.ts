// Normalización de los textos libres (U7). Todo texto que escribe una persona (descripciones, motivos, números de documento) es entrada externa:
// se le sacan los caracteres de control y los invisibles o de formato, que no son texto y sirven para esconder o reordenar lo que se lee (un
// `U+202E` invierte el orden visual del resto de la línea; un `U+200B` hace que dos textos iguales no lo parezcan). El largo se cuenta en caracteres
// (puntos de código), no en unidades UTF-16: un emoji es uno.

/**
 * Lo que no es texto, por categoría Unicode: los de control (`Cc`: C0, DEL y C1) y los de formato (`Cf`: U+00AD, U+061C, U+200B a U+200F, los bidireccionales
 * U+202A a U+202E y U+2066 a U+2069, U+2060, U+FEFF, U+FFF9 a U+FFFB…). Se dejan pasar la tabulación, el salto de línea y el retorno de carro (un área de texto
 * los admite) y la unión de ancho cero U+200D, que forma los emojis compuestos.
 */
const NO_ES_TEXTO = /(?![\t\n\r\u200D])[\p{Cc}\p{Cf}]/gu;

/** El texto sin caracteres de control ni invisibles o de formato (salvo `\t`, `\n`, `\r` y U+200D). No recorta ni toca nada más. */
export function limpiarTexto(texto: string): string {
  return texto.replace(NO_ES_TEXTO, "");
}

/**
 * Los caracteres que ocupan lugar pero no se ven y no son `Cc` ni `Cf`: el braille en blanco (U+2800) y los rellenos de hangul (U+115F, U+1160, U+3164,
 * U+FFA0). Se cuentan
 * como `\p{L}` o `\p{S}`, así que hay que sacarlos aparte para saber si lo que queda tiene algo.
 */
const RELLENOS = /[\u2800\u115F\u1160\u3164\uFFA0]/g;

/**
 * Algo que se ve: una letra, un número, un signo de puntuación o un símbolo (un emoji es un símbolo). La unión de ancho cero, los selectores de variación y los
 * rellenos no.
 */
const ALGO_VISIBLE = /[\p{L}\p{N}\p{P}\p{S}]/u;

/** B3: ¿el texto tiene algo que se vea? Un texto de puros espacios, rellenos, uniones de ancho cero o selectores de variación no es una descripción. */
export function tieneContenido(texto: string): boolean {
  return ALGO_VISIBLE.test(texto.replace(RELLENOS, ""));
}

/** El texto limpio y sin espacios en los extremos: lo que se guarda. Si no tiene nada que se vea (B3), queda vacío. */
export function normalizarTexto(texto: string): string {
  const limpio = limpiarTexto(texto).trim();
  return tieneContenido(limpio) ? limpio : "";
}

/**
 * B2: el largo que cuenta la regla del tope de 500 (`validarTextoDeBorrador`): caracteres (puntos de código) del texto sin los de control ni los invisibles,
 * sin recortar.
 * Es lo que muestra el contador del área de texto, así «501 de 500» y el rechazo dicen lo mismo.
 */
export function largoDeTexto(texto: string): number {
  return largoEnCaracteres(limpiarTexto(texto));
}

/** El largo en caracteres (puntos de código): `😀` cuenta 1, no 2. */
export function largoEnCaracteres(texto: string): number {
  let n = 0;
  for (const _ of texto) n += 1;
  return n;
}
