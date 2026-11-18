// Clasificación de vencimientos (V1 a V8) y, más abajo, documento vigente y requisitos (V9 a V17).

import { diasEntre } from "./fechas.ts";
import { textoVencimiento } from "./textos.ts";
import type { FechaCivil } from "./tipos.ts";

export type Grupo = "vencidos" | "7" | "15" | "30";

export interface Clasificacion {
  /** Días desde hoy hasta el vencimiento (negativo si ya venció). */
  d: number;
  estado: "vencido" | "vence-hoy" | "por-vencer" | "vigente";
  /** `null` si está vigente (sin alerta). */
  grupo: Grupo | null;
  texto: string;
}

/** V1 a V8: clasifica un vencimiento respecto de hoy (fecha civil de Argentina). */
export function clasificar(vence: FechaCivil, hoy: FechaCivil): Clasificacion {
  const d = diasEntre(hoy, vence);
  const texto = textoVencimiento(d, vence);
  if (d < 0) return { d, estado: "vencido", grupo: "vencidos", texto };
  if (d === 0) return { d, estado: "vence-hoy", grupo: "7", texto };
  if (d <= 7) return { d, estado: "por-vencer", grupo: "7", texto };
  if (d <= 15) return { d, estado: "por-vencer", grupo: "15", texto };
  if (d <= 30) return { d, estado: "por-vencer", grupo: "30", texto };
  return { d, estado: "vigente", grupo: null, texto };
}
