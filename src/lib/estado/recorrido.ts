// La entrada al recorrido de Inicio («Probar como conductor»): a qué conductor elegir para ver cómo un seguro vencido impide cargar el parte. Sin DOM y sin reglas nuevas.
// Lo decide con lo que ya viaja con el marco (los documentos, la licencia y el parte de hoy), sin armar el inicio de cada conductor: así `estado/conductor.ts` no hace falta en el primer
// cuadro. Tiene que decir lo mismo que la pantalla «Hoy» de ese conductor; `tests/recorrido.test.ts` lo compara con lo que esa pantalla dice, sobre el ejemplo y sus variantes.
// Uso: `leerEntradaAlRecorrido(app)` dentro de un `$derived` de Inicio.

import { documentacionQueBloquea, parteLegible } from "../dominio/parte.ts";
import type { Estado, FechaCivil } from "../dominio/tipos.ts";
import { estadoDeLicencia } from "../dominio/vencimientos.ts";
import { unidadDeHoy } from "./conductor-opciones.ts";
import type { LecturaDeApp } from "./lectura.ts";

/**
 * El primer conductor activo cuya pantalla «Hoy» dice que su unidad no puede salir porque el seguro venció (P21), o `null` (no se ofrece el recorrido; por ejemplo, después de renovarlo).
 * Sigue el orden en que «Hoy» decide qué mostrar (docs/diseno.md, 17.5): el parte de hoy ya enviado o en uso, la unidad fuera de servicio y la licencia que no ampara hoy se dicen antes
 * que el documento de la unidad, así que con cualquiera de ellos ese conductor no sirve. Un seguro que falta (no venció) u otro documento que bloquea tampoco: se promete «un seguro vencido».
 */
export function conductorDelRecorrido(estado: Estado, hoy: FechaCivil): { conductorId: string } | null {
  for (const c of estado.conductores) {
    if (!c.activo) continue;
    const unidad = unidadDeHoy(estado, c.id);
    if (unidad === undefined || unidad.estado.tipo !== "en-servicio") continue;
    const proyecto = estado.proyectos.find((p) => p.id === unidad.proyectoId);
    if (proyecto === undefined) continue;
    // Los datos guardados son entrada externa: un parte que no se puede leer no existe (como en «Hoy»).
    const crudo = estado.partes.find((p) => p.unidadId === unidad.id && p.fecha === hoy);
    const delDia = crudo === undefined ? null : parteLegible(crudo);
    if (delDia !== null && delDia.estado !== "borrador") continue;
    if (!estadoDeLicencia(estado.documentos, c.id, hoy).vigente) continue;
    const bloqueo = documentacionQueBloquea({ fecha: hoy, unidad, proyecto, documentos: estado.documentos });
    // «Venció» y no «falta»: el seguro tiene fecha (`null` es un documento que nunca se cargó).
    const vencioElSeguro = bloqueo?.contexto.venceron.seguro;
    if (bloqueo !== null && bloqueo.documentos.includes("seguro") && vencioElSeguro !== undefined && vencioElSeguro !== null) return { conductorId: c.id };
  }
  return null;
}

/** La entrada al recorrido de Inicio con el estado y el día de la aplicación; `null` antes de terminar el arranque o si no hay a quién elegir (el botón no se muestra). */
export function leerEntradaAlRecorrido(app: LecturaDeApp): { conductorId: string } | null {
  return app.estado === null ? null : conductorDelRecorrido(app.estado, app.hoy);
}
