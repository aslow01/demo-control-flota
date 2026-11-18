// Patentes argentinas (U1): Mercosur `AA999AA` y anterior `AAA999`.

import { fallo, type Resultado } from "./tipos.ts";

export type FormatoPatente = "mercosur" | "anterior";

const MERCOSUR = /^[A-Z]{2}\d{3}[A-Z]{2}$/;
const ANTERIOR = /^[A-Z]{3}\d{3}$/;
const LARGO_MAXIMO_ENTRADA = 64;

/** U1: mayúsculas (solo A-Z, sin transformar otros alfabetos), sin espacios ni guiones. */
export function normalizarPatente(texto: string): string {
  return texto.replace(/[\s-]+/g, "").replace(/[a-z]/g, (c) => c.toUpperCase());
}

/** Formato de una patente ya normalizada, o `null` si no es válida. */
export function formatoDePatente(patente: string): FormatoPatente | null {
  if (MERCOSUR.test(patente)) return "mercosur";
  if (ANTERIOR.test(patente)) return "anterior";
  return null;
}

/** Cómo se muestra: `ZK 214 BD` o `ZKB 482`. Si no tiene formato válido, tal cual. */
export function formatearPatente(patente: string): string {
  const formato = formatoDePatente(patente);
  if (formato === "mercosur") return `${patente.slice(0, 2)} ${patente.slice(2, 5)} ${patente.slice(5)}`;
  if (formato === "anterior") return `${patente.slice(0, 3)} ${patente.slice(3)}`;
  return patente;
}

/** Valida lo que escribe una persona y devuelve la patente normalizada. */
export function validarPatente(texto: string): Resultado<string> {
  const normalizada = texto.length > LARGO_MAXIMO_ENTRADA ? "" : normalizarPatente(texto);
  if (formatoDePatente(normalizada) === null) {
    return fallo("patente-formato", "La patente tiene que tener el formato AA 123 BB o ABC 123.", {
      campo: "patente",
    });
  }
  return { ok: true, valor: normalizada };
}
