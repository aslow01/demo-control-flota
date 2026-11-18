// Cómo se ve cada alerta (tabla 5.7): tono e ícono de la etiqueta de estado. Es presentación: el dominio decide el grupo y la
// gravedad; acá solo se elige qué forma y qué color le tocan. El color nunca va solo: cada estado tiene su ícono.
import type { FilaVencimiento } from "../lib/estado/centro-alertas.ts";
import type { TipoAlertaOperacion } from "../lib/dominio/alertas.ts";
import { textoVencimiento } from "../lib/dominio/textos.ts";
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
  "uso-con-documentacion-vencida": { tono: "critico", icono: "vencido" },
  "parte-sin-enviar": { tono: "semana", icono: "lapiz" },
  "sin-parte": { tono: "semana", icono: "guion" },
  "novedad-abierta": { tono: "semana", icono: "llave" },
};

export function aspectoDeOperacion(tipo: TipoAlertaOperacion): Aspecto {
  return OPERACION[tipo];
}

/** Cómo se ve la aptitud de una unidad (5.7): la etiqueta de la flota y de la ficha. */
const APTITUD: Record<"puede-salir" | "no-puede-salir" | "fuera-de-servicio" | "baja", Aspecto> = {
  "puede-salir": { tono: "vigente", icono: "check" },
  "no-puede-salir": { tono: "critico", icono: "vencido" },
  "fuera-de-servicio": { tono: "semana", icono: "llave" },
  baja: { tono: "neutro", icono: "caja" },
};

export function aspectoDeAptitud(categoria: keyof typeof APTITUD): Aspecto {
  return APTITUD[categoria];
}
