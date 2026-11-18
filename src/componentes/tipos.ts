// Tipos de presentación compartidos por los componentes (docs/diseno-ui.md, sección 11).
// Solo lo que hace falta para pintar: nada de reglas de negocio. El mapeo "estado del dominio -> tono, ícono y texto"
// de la tabla 5.7 lo arma la pantalla que usa el componente (paso 3.3 en adelante), no el componente.

/** Tonos de estado de la sección 3.2. El color nunca va solo: cada uso lleva texto y un ícono de forma distinta. */
export type Tono = "critico" | "semana" | "quincena" | "mes" | "vigente" | "neutro";

/** Íconos del sprite de `index.html` (5.20). `i-marca` se usa solo en la barra superior. */
export const ICONOS = [
  "marca",
  "vencido",
  "faltante",
  "reloj",
  "alerta",
  "calendario",
  "anillo",
  "check",
  "guion",
  "llave",
  "caja",
  "octogono",
  "lapiz",
  "parte",
  "documento",
  "novedad",
  "estado",
  "km",
  "combustible",
  "unidad",
  "persona",
  "guardado",
  "buscar",
  "mas",
  "cerrar",
  "chevron",
  "flecha-izq",
  "flecha-der",
  "ayuda",
  "reiniciar",
] as const;

export type NombreIcono = (typeof ICONOS)[number];
