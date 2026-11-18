// Lo que tienen en común los formularios de los diálogos (docs/diseno-ui.md, 5.11 y 5.15): cómo se reparten los errores. Sin DOM.

/** Lo que le toca mostrar al diálogo cuando algo salió mal. El texto escrito no se toca: se conserva (5.11). */
export interface ErroresDeFormularioDe<Campo extends string> {
  /** Para `aria-invalid` y el mensaje sobre cada campo. */
  porCampo: Partial<Record<Campo, string>>;
  /** El mismo contenido, en el orden del formulario, para el resumen de arriba (5.15) con un enlace a cada campo. */
  lista: { campo: Campo; mensaje: string }[];
  /** Un error que no es de un campo (guardado, perfil, algo que cambió en otra pestaña): se muestra arriba del formulario. */
  general: string | null;
}

export function armarErrores<Campo extends string>(lista: { campo: Campo; mensaje: string }[], general: string | null): ErroresDeFormularioDe<Campo> {
  const porCampo: Partial<Record<Campo, string>> = {};
  for (const { campo, mensaje } of lista) porCampo[campo] = mensaje;
  return { porCampo, lista, general };
}
