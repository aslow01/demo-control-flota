// Tipos de `correr-peso-js.mjs`.
export function correrPesoJsConDist(
  bytes: number,
  bytesDelGenerador?: number,
  opciones?: { bytesDelTrozo?: number; enActions?: boolean; bytesDeCssInicial?: number; bytesDeCssDiferido?: number; bytesDeFuentes?: number },
): { status: number | null; stdout: string; stderr: string; resumen: string };
