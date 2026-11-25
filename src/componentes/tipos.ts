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
  // Interfaz tipo app (plan del porte, E0-P): nombres que usan las pantallas nuevas. Su dibujo entra al sprite de index.html en E0-M.
  "inicio",
  "partes",
  "atras",
  "abajo",
  "salir",
  "flecha",
] as const;

export type NombreIcono = (typeof ICONOS)[number];

/** Una opción del diálogo "¿Quién completa el parte?". `unidad` es la patente con espacios (`ZK 214 BD`) o `null` si no tiene. */
export interface OpcionConductor {
  id: string;
  nombre: string;
  unidad: string | null;
  /** L1: su licencia ampara hoy. Sigue siendo elegible (es un punto de vista): el diálogo agrega la marca «Sin licencia vigente» en el renglón 2. */
  licenciaVigente: boolean;
  /** M1: si el conductor permite probar un caso, `etiqueta` es la marca «Para probar: …» (la lee el lector de pantalla como parte de la opción); `sinLicencia` evita repetir «Sin licencia vigente». */
  paraProbar?: { etiqueta: string; sinLicencia: boolean } | null;
}

/** La pestaña de la barra de la aplicación que corresponde a la pantalla actual. */
export type SeccionActiva = "alertas" | "flota" | "conductor" | "inicio" | "partes" | null;

/** Una acción del marco que va en la barra superior y, con poco ancho, en el menú "Más". */
export interface ItemMenu {
  id: string;
  texto: string;
  alActivar: () => void;
}

// ---------------------------------------------------------------------------------------------
// Parte previo al uso y licencia que bloquea (docs/diseno.md, sección 17; docs/diseno-ui.md, 5.7 y 14).
// El dominio y el estado entregan los datos ya armados (`lib/estado/parte.ts`, `centro-alertas.ts`, `flota.ts`, `ficha.ts`); la vista los pinta con estos tipos.
// ---------------------------------------------------------------------------------------------

/** Las etiquetas nuevas de la tabla 5.7: el texto, el tono y el ícono. La vista elige cuál según el estado del parte o del conductor. */
export type EtiquetaDeParte = "cerrado" | "borrador" | "en-uso" | "sin-enviar" | "sin-cerrar" | "sin-licencia-vigente";

export const ETIQUETAS_DE_PARTE: Record<EtiquetaDeParte, { texto: string; tono: Tono; icono: NombreIcono }> = {
  cerrado: { texto: "Cerrado", tono: "vigente", icono: "check" },
  borrador: { texto: "Borrador", tono: "neutro", icono: "lapiz" },
  "en-uso": { texto: "En uso", tono: "quincena", icono: "flecha-der" },
  "sin-enviar": { texto: "Sin enviar", tono: "semana", icono: "lapiz" },
  "sin-cerrar": { texto: "Sin cerrar", tono: "semana", icono: "lapiz" },
  "sin-licencia-vigente": { texto: "Sin licencia vigente", tono: "critico", icono: "vencido" },
};

/** Lo que el estado entrega para el parte, el inicio del conductor y el centro de alertas (todo con tipos de `lib/estado`). */
export type {
  EstadoDelDia,
  InicioDelConductor,
  OpcionParaElegirConductor,
  PanelParteEnviado,
  ParteEnCierre,
  ParteEnEdicion,
  ParteEnLectura,
  ParteNoDisponible,
  PendienteDelConductor,
  RevisionEnLectura,
  VistaDeParte,
} from "../lib/estado/parte.ts";
export type { AccionDeConductorSinLicencia, FilaDeConductorSinLicencia } from "../lib/estado/centro-alertas.ts";
export type { PasoDelParte } from "../lib/dominio/formulario-parte.ts";
