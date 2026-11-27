// Cómo se ve cada alerta (tabla 5.7): tono e ícono de la etiqueta de estado. Es presentación: el dominio decide el grupo y la
// gravedad; acá solo se elige qué forma y qué color le tocan. El color nunca va solo: cada estado tiene su ícono.
import type { FilaVencimiento } from "../lib/estado/centro-alertas.ts";
import type { TipoAlertaOperacion } from "../lib/dominio/alertas.ts";
import { textoVencimiento } from "../lib/dominio/textos-base.ts";
import { app } from "../lib/estado/instancia.ts";
import type { NombreIcono, Tono } from "./tipos.ts";

export interface Aspecto {
  tono: Tono;
  icono: NombreIcono;
}

/** El texto de «vence hoy» sale de la misma función que arma los estados, así no hay dos copias que puedan separarse. */
const TEXTO_VENCE_HOY = textoVencimiento(0, "2000-01-01");

export function aspectoDeVencimiento(fila: FilaVencimiento): Aspecto {
  if (fila.tipo === "documento-faltante") return { tono: "critico", icono: "faltante" };
  if (fila.tipo === "documento-vencido") return { tono: "critico", icono: "vencido" };
  if (fila.grupo === "7") return { tono: "semana", icono: fila.estado === TEXTO_VENCE_HOY ? "reloj" : "alerta" };
  if (fila.grupo === "15") return { tono: "quincena", icono: "calendario" };
  return { tono: "mes", icono: "anillo" };
}

const OPERACION: Record<TipoAlertaOperacion, Aspecto> = {
  "novedad-critica": { tono: "critico", icono: "octogono" },
  "parte-sin-enviar": { tono: "semana", icono: "lapiz" },
  "sin-parte": { tono: "semana", icono: "guion" },
  "novedad-abierta": { tono: "semana", icono: "llave" },
};

export function aspectoDeOperacion(tipo: TipoAlertaOperacion): Aspecto {
  return OPERACION[tipo];
}

/** Cómo se ve la aptitud de una unidad (5.7): la etiqueta de la flota y de la ficha. «Fuera de servicio» sin origen conocido es el de taller (ver `aspectoDeAptitud`). */
const APTITUD: Record<"puede-salir" | "no-puede-salir" | "fuera-de-servicio" | "baja", Aspecto> = {
  "puede-salir": { tono: "vigente", icono: "check" },
  "no-puede-salir": { tono: "critico", icono: "vencido" },
  "fuera-de-servicio": { tono: "neutro", icono: "llave" },
  baja: { tono: "neutro", icono: "caja" },
};

/** Por qué una unidad está fuera de servicio (el `origen` de su estado): una novedad crítica o una decisión a mano (taller, etc.). */
export type OrigenFueraDeServicio = "novedad-critica" | "manual";

/**
 * Una unidad fuera de servicio por una novedad crítica (frenos, por ejemplo) es tan grave como una con el seguro vencido: va en tono crítico.
 * La que está en el taller es una situación conocida y en curso: va en neutro (grafito, cuadrado) y ya no se confunde con «vence en 7 días o menos» (ámbar, triángulo).
 */
export function aspectoDeAptitud(categoria: keyof typeof APTITUD, origen: OrigenFueraDeServicio | null = null): Aspecto {
  if (categoria === "fuera-de-servicio" && origen === "novedad-critica") return { tono: "critico", icono: "octogono" };
  return APTITUD[categoria];
}

/** El origen del fuera de servicio de una unidad, leído del estado (las filas de Inicio y de Movilidades no lo traen); `null` si no está fuera de servicio. */
export function origenDeFueraDeServicio(unidadId: string): OrigenFueraDeServicio | null {
  const e = app.estado?.unidades.find((u) => u.id === unidadId)?.estado;
  return e?.tipo === "fuera-de-servicio" ? e.origen : null;
}
