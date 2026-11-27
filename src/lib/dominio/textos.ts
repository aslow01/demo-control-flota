// Fachada: reúne todos los módulos de textos del dominio para quien quiera pedirlos desde un solo lugar (las pruebas).
// La aplicación importa del módulo que corresponde (`textos-base.ts`, `textos-inicio.ts`, `textos-conductor.ts`, …) para que cada pantalla arrastre solo los suyos.

export * from "./textos-base.ts";
export * from "./textos-inicio.ts";
export * from "./textos-flota.ts";
export * from "./textos-ficha.ts";
export * from "./textos-conductor.ts";
export * from "./textos-parte.ts";
