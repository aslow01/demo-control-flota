// El veredicto de la llave de Hoy (docs/diseno-ui.md, 15.8; decisión DE3 del 28/11/2026: solo donde hay algo que decidir). Sale del estado del día que ya decide `conductor.ts` y no lee nada más:
// la regla de «puede salir» no se repite acá. Sin DOM. Lo usa `PantallaConductor.svelte` (se baja con esa pantalla, no con el marco).
//  - `sale`: la unidad puede salir o ya salió. En «En uso» y «Cerrado» el pie lleva la etiqueta que ya existe («En uso desde las 06:52»): «Puede salir» sería falso.
//  - `no-sale`: bloqueada por documentos, fuera de servicio, cerrada sin salida o conductor sin licencia vigente (el texto cambia: habla de quien maneja, no de la unidad).
//  - `tarea`: «Cerrar antes». No es un bloqueo: no lleva rojo.
//  - `null`: sin unidad asignada. No hay llave, solo el `select`.

import { TEXTO_VEREDICTO } from "../dominio/textos-conductor.ts";
import type { EstadoDelDia } from "./conductor.ts";

export interface VeredictoDeHoy {
  tipo: "sale" | "no-sale" | "tarea";
  texto: string;
}

/**
 * `unidadBloqueada` es `inicio.avisoAptitud !== null`: en «Sin parte» y «Borrador» el botón sigue y arriba va el aviso de «no puede salir» (P9), así que el veredicto no puede decir «sale»
 * cuando ese aviso está. En «En uso» no se mira: la unidad ya salió. En «Cerrado», «hasta mañana» (P19) cuenta igual que «sin salida»: la unidad no vuelve a salir hoy.
 */
export function veredictoDelDia(estado: EstadoDelDia, unidadBloqueada = false): VeredictoDeHoy | null {
  switch (estado.tipo) {
    case "sin-parte":
    case "borrador":
      return unidadBloqueada ? { tipo: "no-sale", texto: TEXTO_VEREDICTO.noSale } : { tipo: "sale", texto: TEXTO_VEREDICTO.sale };
    case "en-uso":
      return { tipo: "sale", texto: estado.etiqueta };
    case "enviado":
      return estado.sinSalida === null && estado.hastaManana === null ? { tipo: "sale", texto: estado.etiqueta } : { tipo: "no-sale", texto: TEXTO_VEREDICTO.noSale };
    case "fuera-de-servicio":
    case "no-puede-salir":
      return { tipo: "no-sale", texto: TEXTO_VEREDICTO.noSale };
    case "licencia-no-vigente":
      return { tipo: "no-sale", texto: TEXTO_VEREDICTO.sinLicencia };
    case "cierre-pendiente":
      return { tipo: "tarea", texto: TEXTO_VEREDICTO.cierrePendiente };
    case "sin-unidad":
      return null;
  }
}
