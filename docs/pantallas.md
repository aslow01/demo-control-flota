# Pantallas y comportamiento de la demo

Detalle de lo que se puede hacer en cada pantalla. El resumen para quien llega por primera vez está en el [README](../README.md); los límites y los bordes de cada regla, en [`limites.md`](limites.md).

La barra «Ver como» cambia la perspectiva entre **Encargado** (perfil de entrada) y **Conductor**. Es una perspectiva, no un control de acceso: no hay cuentas ni contraseñas.

| Pantalla | Perfil | Qué permite |
| --- | --- | --- |
| Centro de alertas | Encargado | Ver cuántas unidades no pueden salir hoy y qué conductores no pueden manejar hoy (sin licencia vigente), los vencimientos agrupados en 7, 15 y 30 días y los pendientes de operación (partes sin enviar o sin cerrar, unidades sin parte de ayer). Renovar o cargar un documento, incluida una licencia, desde la propia alerta. |
| Flota | Encargado | Buscar por patente o número interno, filtrar por estado y proyecto, ordenar y agregar una unidad nueva. Cada fila muestra el último parte («En uso» o «Sin cerrar», según el caso) y marca al conductor sin licencia vigente. |
| Ficha de la unidad | Encargado | Ver documentos, novedades, kilometraje (con las salidas en curso) e historial (la revisión y el cierre de cada parte). Renovar documentos, resolver novedades, poner la unidad fuera de servicio o devolverla a servicio, corregir el kilometraje, cambiar la asignación y dar de baja. |
| Inicio del conductor | Conductor | Ver en qué punto está el parte de hoy (sin empezar, borrador, en uso, cerrado o sin salida), los partes sin cerrar, el vencimiento de la propia licencia y los últimos partes. Si la licencia no está vigente, el aviso de bloqueo reemplaza al botón de empezar la revisión. Elegir otra unidad. |
| Parte diario, paso 1: revisión antes de salir | Conductor y Encargado | Completar kilometraje de salida, diez puntos de revisión y, si hace falta, otra novedad; guardado automático de borrador; aviso antes de enviar si falta documentación de la unidad o hay un salto de kilometraje. Al enviar, la unidad sale de servicio si hay una novedad crítica; si no, queda «En uso». <!-- revisar A1/M2: «diez puntos» pasa a 14 y el aviso por documentación de la unidad pasa a bloqueo --> |
| Parte diario, paso 2: cierre de la jornada | Conductor y Encargado | Completar kilometraje final y combustible, con el resumen de la revisión a la vista. Al cerrar, el parte queda en solo lectura. |

Todo cambio se refleja en las demás pantallas al instante: renovar un documento lo saca de las alertas, mejora el estado en la flota y actualiza la insignia de la pestaña «Alertas». Una revisión con una novedad crítica en los frenos pone la unidad fuera de servicio, la suma a «No pueden salir» y deja el parte cerrado sin salida (recorrido 0). Una revisión sin novedades críticas deja la unidad «En uso» hasta que se cierra el parte. El botón **Reiniciar demo** (en la barra de la aplicación y en el menú «Más») borra los cambios y vuelve a cargar la flota de ejemplo con las fechas de hoy.
