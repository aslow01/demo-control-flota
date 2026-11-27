// Tipos de `correr-peso-js.mjs`.
export function correrPesoJsConDist(
  bytes: number,
  bytesDelGenerador?: number,
  opciones?: { bytesDelTrozo?: number; enActions?: boolean },
): { status: number | null; stdout: string; stderr: string; resumen: string };
