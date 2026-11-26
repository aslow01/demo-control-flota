# Pantallas y comportamiento de la demo

Detalle de lo que se puede hacer en cada pantalla. El resumen para quien llega por primera vez está en el [README](../README.md); los límites y los bordes de cada regla, en [`limites.md`](limites.md).

«Ver como» (el selector de perfil: en el lateral de escritorio, en el chip de arriba a la derecha del celular y en «Más») cambia la perspectiva entre **Encargado** (perfil de entrada) y **Conductor**. Es una perspectiva, no un control de acceso: no hay cuentas ni contraseñas.

## Navegación

- **Encargado:** barra inferior (celular y tableta) o lateral oscuro (desde 64 rem) con Inicio, Movilidades, Vencimientos y Operación diaria (que se despliega en Partes y Novedades); «Más» en el celular. Las insignias de la navegación repiten las cifras de Inicio (no disponibles hoy, vencidos o faltantes) y de Operación diaria (pendientes); la de Inicio se oculta mientras se está en Inicio, donde la cifra grande ya lo dice.
- **Entrada al recorrido:** mientras haya un conductor con el parte trabado por un seguro vencido, Inicio muestra la franja «Probar como conductor», que abre «Ver como» con ese conductor ya elegido.
- **Conductor:** Hoy, Mis partes y Más.
- «Atrás» (arriba a la izquierda en el celular, en la ficha y el parte) vuelve a la pantalla de origen; en Movilidades conserva el filtro y la búsqueda que tenía. En escritorio, las migas hacen lo mismo.
- Las direcciones usan *hash* (`#/inicio`, `#/movilidades?filtro=bloqueadas&q=zk`, `#/vencimientos?filtro=7`, `#/operacion/partes`, `#/operacion/novedades`, `#/unidad/ZK214BD`, `#/conductor`, `#/conductor/partes`, `#/parte/ZK214BD/2026-11-25`, `#/mas`). Las viejas (`#/alertas`, `#/flota`, `#/operacion/checklists`) se siguen entendiendo y se reescriben a la forma nueva. Cambiar un filtro o escribir en el buscador cambia la dirección sin mover el foco ni el desplazamiento.
- **Movimiento:** entre pantallas hay una transición corta (sale en 110 ms, entra subiendo 10 px en 230 ms); la patente viaja de la fila de la lista al título de su ficha y vuelve; la cifra «No disponibles hoy» de Inicio cuenta de 0 a su valor al abrir la demo y al reiniciarla. Con «reducir movimiento» en el sistema no hay ninguna de las tres. El lector de pantalla recibe siempre el valor final de la cifra, nunca los números intermedios.

## Qué permite cada pantalla

| Pantalla | Perfil | Qué permite |
| --- | --- | --- |
| Inicio | Encargado | Ver cuántas unidades no están disponibles hoy (bloqueadas por documentos o fuera de servicio) y qué conductores no pueden manejar hoy (sin licencia vigente), cuatro cifras con su destino (vencidos o faltantes, vencen en 30 días, partes pendientes, novedad crítica), la regla de vencimientos de 0 a 30 días y un resumen de la operación diaria. Renovar o cargar un documento, incluida una licencia, desde la propia fila o desde un punto de la regla. |
| Movilidades | Encargado | Buscar por patente o número interno, filtrar por estado (disponibles, no disponibles hoy, bloqueadas por documentos, fuera de servicio, de baja) y por proyecto, ordenar y agregar una unidad nueva. Cada fila muestra el último parte («En uso» o «Sin cerrar», según el caso), el próximo vencimiento y marca al conductor sin licencia vigente. |
| Vencimientos | Encargado | Ver todos los documentos vencidos, faltantes o por vencer en la regla de 0 a 30 días y en un panel por grupo, con filtros por tramo (7, 15 y 30 días) y la acción de cada fila: Renovar o Cargar. |
| Operación diaria | Encargado | **Partes:** partes sin enviar, partes sin cerrar y unidades sin parte de ayer. **Novedades:** críticas y abiertas, cada una con «Resolver». |
| Ficha de la unidad | Encargado | Ver documentos, novedades, kilometraje (con las salidas en curso) e historial (la revisión y el cierre de cada parte). Renovar documentos, resolver novedades, poner la unidad fuera de servicio o devolverla a servicio, corregir el kilometraje, cambiar la asignación y dar de baja. En el celular, en solapas; abre en la que explica el bloqueo. |
| Hoy | Conductor | Ver en qué punto está el parte de hoy (sin empezar, borrador, en uso, cerrado o sin salida), los partes sin cerrar, el vencimiento de la propia licencia, el aviso de que un documento de su unidad vence hoy o en los próximos días («La revisión técnica vence hoy») y los últimos partes. Si la licencia o la documentación de la unidad no están vigentes, el aviso de bloqueo reemplaza al botón de empezar la revisión. Elegir otra unidad. |
| Mis partes | Conductor | Los últimos cinco partes cerrados, el más nuevo primero; cada uno abre el parte en lectura. |
| Parte diario, paso 1: revisión antes de salir | Conductor y Encargado | Completar kilometraje de salida, catorce puntos de revisión y, si hace falta, otra novedad; guardado automático de borrador; aviso antes de enviar si hay un salto de kilometraje. Si la unidad tiene la documentación vencida o faltante, la revisión no se puede cargar («No se puede cargar este parte», con el motivo) y el borrador se conserva. Al enviar, la unidad sale de servicio si hay una novedad crítica; si no, queda «En uso». |
| Parte diario, paso 2: cierre de la jornada | Conductor y Encargado | Completar kilometraje final y combustible, con el resumen de la revisión a la vista. Al cerrar, el parte queda en solo lectura. |
| Más | Los dos | «Ver como», «Cómo funciona», «Reiniciar demo» y el enlace de vuelta al portafolio. |

Todo cambio se refleja en las demás pantallas al instante: renovar un documento lo saca de Vencimientos y de Inicio, mejora el estado en Movilidades y actualiza las insignias de la navegación. Una revisión con una novedad crítica en los frenos pone la unidad fuera de servicio, la suma a «No disponibles hoy» y deja el parte cerrado sin salida (recorrido 0). Una revisión sin novedades críticas deja la unidad «En uso» hasta que se cierra el parte. **Reiniciar demo** (en el lateral, en «Más» y en el aviso de datos de otra fecha) borra los cambios y vuelve a cargar la flota de ejemplo con las fechas de hoy.
