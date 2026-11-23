// Búsqueda de términos prohibidos por HUELLAS: el repositorio no guarda los términos, solo su SHA-256.
// Módulo puro (sin lectura de archivos ni consola): lo usa `buscar-prohibidos.mjs` y lo prueba `tests/prohibidos.test.ts`.
//
// Cómo busca:
//  1. Normaliza el texto: minúsculas y sin acentos (así «É», «e» y «é» son lo mismo).
//  2. Lo parte en palabras (todo lo que no es letra o número separa).
//  3. Un término de UNA palabra se busca como trozo de cada palabra: encuentra «ZorbaluxCentral» o «zorbalux_id»,
//     igual que lo hacía la búsqueda con texto en claro. Una frase de dos o tres palabras se busca como n-grama exacto.
//  4. Cada candidato se pasa por SHA-256 y se compara con la lista de huellas.
//
// Límite honesto: una huella de una palabra corta o muy común se puede adivinar probando un diccionario. Esto evita
// que el repositorio nombre a nadie, no es cifrado. Cada huella lleva la longitud del término para no hashear todos
// los trozos posibles (la longitud no revela las letras).
import { createHash } from "node:crypto";

/** Máximo de palabras de una frase prohibida. */
export const MAX_PALABRAS = 3;

/** Minúsculas y sin marcas diacríticas («ñ» queda como «n»). */
export function normalizar(texto) {
  return texto.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
}

/** Palabras del texto ya normalizadas: lo que no es letra ASCII ni número separa. */
export function tokenizar(texto) {
  return normalizar(texto).split(/[^a-z0-9]+/).filter((t) => t !== "");
}

const sha256 = (texto) => createHash("sha256").update(texto, "utf8").digest("hex");

/** Huella de un término o frase: `{ huella, longitud }` sobre las palabras normalizadas unidas por un espacio. */
export function crearHuella(termino) {
  const palabras = tokenizar(termino);
  if (palabras.length === 0) throw new Error("Un término prohibido necesita al menos una letra o un número.");
  if (palabras.length > MAX_PALABRAS) throw new Error(`Una frase prohibida admite hasta ${MAX_PALABRAS} palabras.`);
  const canonico = palabras.join(" ");
  return { huella: sha256(canonico), longitud: canonico.length };
}

/** Huellas a partir de un archivo de texto con un término por línea (`#` abre un comentario). Lo que no sirve se ignora. */
export function huellasDeLiterales(contenido) {
  const salida = [];
  for (const linea of contenido.split(/\r?\n/)) {
    const termino = linea.trim();
    if (termino === "" || termino.startsWith("#")) continue;
    try {
      salida.push(crearHuella(termino));
    } catch {
      // Una línea sin letras ni números, o con demasiadas palabras: no hay nada que buscar con ella.
    }
  }
  return salida;
}

/** ¿El texto contiene algún término de la lista de huellas (`{ huella, longitud }[]`)? */
export function contieneProhibido(texto, huellas) {
  if (huellas.length === 0) return false;
  const buscadas = new Set(huellas.map((h) => h.huella));
  const longitudes = [...new Set(huellas.map((h) => h.longitud))];
  const palabras = tokenizar(texto);

  // Una palabra: cada trozo de cada palabra con una longitud de la lista.
  for (const palabra of palabras) {
    for (const largo of longitudes) {
      for (let i = 0; i + largo <= palabra.length; i++) {
        if (buscadas.has(sha256(palabra.slice(i, i + largo)))) return true;
      }
    }
  }
  // Frases: n-gramas de 2 a MAX_PALABRAS palabras consecutivas, unidas por un espacio.
  for (let n = 2; n <= MAX_PALABRAS; n++) {
    for (let i = 0; i + n <= palabras.length; i++) {
      const frase = palabras.slice(i, i + n).join(" ");
      if (longitudes.includes(frase.length) && buscadas.has(sha256(frase))) return true;
    }
  }
  return false;
}

// Dominios de correo permitidos: los reservados para ejemplos (RFC 2606) y los de aviso sin respuesta.
const DOMINIOS_EJEMPLO = ["example.com", "example.org", "example.net"];
const TLD_EJEMPLO = ["example", "test", "invalid", "localhost"];
const DOMINIOS_SIN_RESPUESTA = ["users.noreply.github.com"];
const CORREO = /[a-z0-9._%+-]+@((?:[a-z0-9-]+\.)+[a-z]{2,})/gi;

function dominioPermitido(dominio) {
  const d = dominio.toLowerCase();
  if (DOMINIOS_EJEMPLO.some((e) => d === e || d.endsWith(`.${e}`))) return true;
  if (TLD_EJEMPLO.includes(d.slice(d.lastIndexOf(".") + 1))) return true;
  return DOMINIOS_SIN_RESPUESTA.some((e) => d === e || d.endsWith(`.${e}`));
}

/** Correos del texto que no son de un dominio de ejemplo ni una dirección «noreply». No nombra a nadie en particular. */
export function correosNoPermitidos(texto) {
  const salida = [];
  for (const m of texto.matchAll(CORREO)) {
    const correo = m[0];
    const local = correo.slice(0, correo.indexOf("@")).toLowerCase();
    if (/^no-?reply/.test(local) || dominioPermitido(m[1] ?? "")) continue;
    salida.push(correo);
  }
  return salida;
}

/** Una decisión sin confirmar («a confirmar») escrita en el código: no puede quedar en `src/` (el README dice que cada decisión figura con quién y cuándo). */
export function marcaPendienteDeConfirmar(linea) {
  return /\ba confirmar\b/i.test(linea);
}
