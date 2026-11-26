// Las cuentas de las insignias del marco (barra inferior y lateral). Salen de lo que ya calcula el centro de alertas (`app.centroDeAlertas`), así Inicio
// dice el mismo número que su cifra cobre y Operación diaria, el mismo que sus dos solapas. Es presentación: no decide nada, solo elige qué número mostrar.
import type { CentroDeAlertas } from "../lib/estado/centro-alertas.ts";

export interface CuentasDeNavegacion {
  /** Inicio: «No disponibles hoy» (bloqueadas por documentos más fuera de servicio). */
  noDisponibles: number;
  /** Vencimientos: vencidos o faltantes. */
  vencidos: number;
  /** Operación diaria, solapa Partes: partes sin enviar o sin cerrar y unidades sin parte. */
  partes: number;
  /** Operación diaria, solapa Novedades: críticas y abiertas. */
  novedades: number;
}

export function cuentasDeNavegacion(centro: CentroDeAlertas | null): CuentasDeNavegacion {
  if (centro === null) return { noDisponibles: 0, vencidos: 0, partes: 0, novedades: 0 };
  const [partes, novedades] = centro.operacionDiaria.solapas;
  return {
    noDisponibles: centro.cifras.noDisponibles.valor,
    vencidos: centro.cifras.vencidos.valor,
    partes: partes.cantidad,
    novedades: novedades.cantidad,
  };
}
