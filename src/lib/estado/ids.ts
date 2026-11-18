// Ids para lo que crea la persona (unidades, documentos, partes, novedades, eventos). 96 bits al azar del navegador,
// en hexadecimal: no chocan con los ids secuenciales del generador (e-00001, p-0001...) ni entre pestañas.
// `crypto.getRandomValues` existe también fuera de contextos seguros (`randomUUID` no), y no se usa el azar del lenguaje.

export function generarId(): string {
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
