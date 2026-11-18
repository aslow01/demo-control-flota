# Revisión de textos de interfaz (redactor-ux), 18/11/2026

Alcance: `src/lib/dominio/textos.ts`, los avisos y errores que arma `src/lib/estado/app.svelte.ts` (D5, D7, D8, D9, reinicio, arranque), `tituloDePagina` de `enrutador.ts` y los mensajes sueltos de `patente.ts`. Contrastado con `docs/diseno.md` (D4 a D11) y `docs/diseno-ui.md` (4.4, 5.15, 5.18, 5.19, 8). No se editó código. Los tests pueden fijar los textos actuales: al aplicar, actualizar también el test que los cite.

Resultado general: no hay voseo ni regionalismos, y no aparece ningún dato real ni nombre de terceros. Los problemas son de precisión (mensajes que dicen algo que no corresponde al contexto), de falta de salida («qué hacer») y un conflicto entre el texto de arranque y el comportamiento real. Marca: **N** = necesario, **O** = opcional.

## 1. Avisos globales y arranque

| Nº | Archivo / clave | Texto actual | Texto propuesto | Motivo | N/O | Estado (18/11/2026) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `textos.ts` `TEXTO_ERROR_ARRANQUE` | «No se pudo iniciar la demo. Recargue la página. Si el problema sigue, reinicie la demo.» | Separar en dos claves: título `No se pudo iniciar la demo` (va en el `h1`) y cuerpo `Recargue la página. Si el problema sigue, borre los datos de este sitio en su navegador y vuelva a abrir la demo.` | La especificación (sección 8) pone el título en un `h1` y el resto aparte: con una sola cadena se repite la frase. Además, ver **decisión A**: «reinicie la demo» no se puede cumplir hoy. | N | Aplicado con variante: el título va en el `h1` y el cuerpo conserva «reinicie la demo», porque la decisión A (opción 1) hace que «Reiniciar demo» funcione desde la pantalla de error (`TEXTO_ERROR_ARRANQUE.titulo` y `.mensaje`). |
| 2 | `textos.ts` `TEXTO_AVISO.cambiosEnOtraPestana` | «Hubo cambios en otra pestaña.» | «Se hicieron cambios en otra pestaña. Esta pantalla sigue mostrando los datos anteriores hasta que actualice.» | Dice qué pasó, pero no qué implica ni qué hacer. Coincide con D9 (no se recarga sola). | N | Aplicado. |
| 3 | Botón del aviso D9 (spec 5.18) | «Actualizar» | «Actualizar datos» | Verbo + objeto; evita confundir con «recargar la página» (que perdería lo escrito). | O | No aplicado: `docs/diseno-ui.md` 5.18 fija el botón como «Actualizar» (opción C). |
| 4 | `textos.ts` `textoDatosDeOtraFecha` (D5) | «Los datos de ejemplo son del 10/11/2026. Reinicie la demo para verlos con las fechas de hoy.» | «Los datos de ejemplo son del 10/11/2026. Al reiniciar la demo se actualizan a la fecha de hoy y se borran sus cambios.» | Falta el costo: reiniciar borra lo que el visitante hizo (spec 5.17: «Se borran los cambios hechos en este navegador»). Es la única razón por la que aparece este aviso. | N | Aplicado. |
| 5 | `textos.ts` `TEXTO_AVISO.esquemaActualizado` (D7) | «La demo se actualizó y se volvió a cargar la flota de ejemplo.» | «La demo se actualizó. Se cargó de nuevo la flota de ejemplo y no se conservaron los datos anteriores.» | Dice con claridad que lo anterior se perdió (D7 reinicia todo y además no arrastra el perfil). | N | Aplicado. |
| 6 | `textos.ts` `TEXTO_AVISO.sinAlmacenamiento` (D8) | «Este navegador no permite guardar datos: puede usar la demo, pero los cambios se pierden al cerrar la pestaña.» | «Este navegador no permite guardar datos. Puede usar la demo, pero los cambios se pierden al cerrar o recargar la página.» | En modo memoria recargar también borra: el texto actual promete menos de lo que pierde. | N | Aplicado. |
| 7 | `textos.ts` `TEXTO_AVISO.preparando` | «Preparando la flota de ejemplo…» | Sin cambio. | Coincide con D4 y 5.19. | — | Sin cambio. |

## 2. Errores de estado y de persistencia (`ERRORES`)

| Nº | Clave | Texto actual | Texto propuesto | Motivo | N/O | Estado (18/11/2026) |
| --- | --- | --- | --- | --- | --- | --- |
| 8 | `noPudoGuardar` | «No se pudo guardar. No se aplicó ningún cambio y lo que escribió sigue en el formulario.» | «No se pudo guardar en este equipo. No se aplicó ningún cambio y lo escrito sigue en pantalla. Intente de nuevo.» | Agrega la causa (coincide con 5.15) y la acción. | N | Aplicado. |
| 9 | `noPudoGuardar` usado por `reiniciar()` y `cambiarPerfil()` (`app.svelte.ts`) | (el mismo de arriba) | Dos claves nuevas: `noPudoReiniciar` = «No se pudo reiniciar la demo. Se conservaron los datos que tenía. Intente de nuevo.»; `noPudoCambiarVista` = «No se pudo cambiar la vista. Intente de nuevo.» | Esos dos casos no tienen formulario: «lo que escribió sigue en el formulario» es falso ahí. Requiere tocar `app.svelte.ts` (decisión del programador, no de redacción). | N | Aplicado: `noPudoReiniciar` (reiniciar con la demo cargada) y `noPudoCambiarVista` (`cambiarPerfil`). |
| 10 | `noPudoGuardarElParte` | «No se pudo guardar el parte. Sus datos siguen en este equipo; intente de nuevo.» | «No se pudo guardar el parte. Lo escrito sigue en pantalla; no cierre la pestaña e intente de nuevo.» | «Siguen en este equipo» se lee como «quedaron guardados», justo lo contrario. 5.15 pide «no cierre la pestaña». Hoy la clave no se usa en ningún lado (solo está definida). | N | Aplicado y conectado: `ejecutar` lo usa si falla la escritura de `guardarBorrador` o `enviarParte`. |
| 11 | `sinPermiso` | «Esta acción es solo del encargado. Cambie de perfil para hacerla.» | «Esta acción es solo del encargado. En «Ver como», elija «Encargado».» | La interfaz llama al control «Ver como» (spec 4.5), no «perfil». | O | Aplicado. |
| 12 | `sinDatos` | «La demo todavía no terminó de cargar.» | «La demo todavía no terminó de cargar. Espere un momento e intente de nuevo.» | Falta la acción. | O | Aplicado. |
| 13 | `noPudoActualizar` | «No se pudieron leer los cambios de la otra pestaña. Intente de nuevo.» | «No se pudieron leer los cambios de la otra pestaña. Intente de nuevo; si sigue fallando, recargue la página.» | Da una salida cuando el reintento falla. Ojo: recargar pierde lo que esté escrito. | O | Aplicado. |

## 3. Errores de reglas (`ERRORES`, funciones `err*`)

| Nº | Clave | Texto actual | Texto propuesto | Motivo | N/O | Estado (18/11/2026) |
| --- | --- | --- | --- | --- | --- | --- |
| 14 | `errKmSuperaSiguiente` | «Supera el kilometraje con que empezó el parte del 17/11/2026 (84.500).» | «El kilometraje supera el del inicio del parte del 17/11/2026 (84.500 km). Revise el número.» | Sin sujeto, sin unidad (km) y sin acción. | N | Aplicado. |
| 15 | `errKmCorreccionAnterior` | «Ya hay un parte enviado el 17/11/2026, posterior a la fecha elegida…» / «una corrección de kilometraje del …» | «Ya hay un parte del 17/11/2026, posterior a la fecha elegida: la corrección no cambiaría el kilometraje actual. Use la fecha de ese parte o una posterior.» (para corrección: «una corrección del 17/11/2026») | «Enviado el» se lee como día de envío; el dato es la fecha del parte. Verificar contra el código antes de aplicar. | N | Aplicado. Verificado: la fecha citada es `Parte.fecha` (día del parte), no el día de envío; en la corrección es `desde`. Quedó «un parte del…» y «una corrección del…». |
| 16 | `errKmFinMenor` | «El kilometraje al terminar (84.100) es menor que al iniciar (84.200).» | «El kilometraje al terminar (84.100 km) es menor que al iniciar (84.200 km). Revise los dos números.» | Unidad y acción. | O | Aplicado. |
| 17 | `errKmExcedido` | «El kilometraje no puede superar 2.000.000.» | «El kilometraje no puede superar 2.000.000 km.» | Unidad. | O | Aplicado. |
| 18 | `errLitrosInvalidos` | «Escriba los litros con hasta un decimal, de más de 0 a 120.» | «Escriba los litros con hasta un decimal, mayores que 0 y hasta 120.» | «De más de 0 a 120» es torpe. (Reemplazar 120 por el valor de `maximo`.) | O | Aplicado. |
| 19 | `documentoNoVigente` | «Solo se puede renovar el documento vigente.» | «Solo se puede renovar el documento vigente. Si un dato está mal, use «Corregir».» | Da la salida. Existe el diálogo «Corregir documento» (5.17). | O | Aplicado. |
| 20 | `errDocumentoExistente` | «Ya hay un documento de Carga del matafuego cargado. Use «Renovar».» | «Ya hay cargado un documento «Carga del matafuego». Para actualizarlo, use «Renovar».» | «Documento de … cargado» se repite y suena mal con nombres largos. | O | Aplicado. |
| 21 | `advertenciasSinAceptar` | «Hay advertencias que tiene que aceptar antes de enviar el parte.» | «Revise las advertencias y acéptelas para enviar el parte.» | Más corto (360 px) y empieza por la acción. | O | Aplicado. |
| 22 | `checklistInvalido` | «El checklist del parte no es válido.» | «Hay respuestas del checklist que no se pueden guardar. Revise cada punto.» | No dice qué hacer. Si solo ocurre por un error de programación, queda como está. | O | Aplicado (solo se dispara por un error de programación). |
| 23 | `otraNovedadInvalida` | «La otra novedad no es válida.» | «Revise el texto de «Otra novedad».» | Igual que la anterior; confirmar en qué caso se dispara (`comandos.ts:926`). | O | Aplicado (solo se dispara por un error de programación). |
| 24 | `errUnidadFueraDeServicio` | «…Pida al encargado que la vuelva a servicio.» | «…Pida al encargado que la ponga de nuevo en servicio.» | «Vuelva a servicio» como verbo transitivo es forzado; el botón sí se llama «Volver a servicio». | O | Aplicado. |
| 25 | `unidadInexistente`, `conductorInexistente`, `proyectoInexistente`, `documentoInexistente`, `parteInexistente`, `novedadInexistente` | «No se encontró …» | Sin cambio, salvo agregar a todas: «Vuelva a la lista e intente de nuevo.» | Solo ocurren con datos viejos (otra pestaña). Mejora menor. | O | Aplicado en los seis mensajes. |

## 4. Advertencias y alertas

| Nº | Clave | Texto actual | Texto propuesto | Motivo | N/O | Estado (18/11/2026) |
| --- | --- | --- | --- | --- | --- | --- |
| 26 | `textoAdvertencia` `salto-km` | «1.250 km sin registrar» | «1.250 km sin registrar desde el último parte» | Se acepta con casilla; la frase sola no dice respecto de qué. Coincide con el ejemplo de K6 en el historial, que puede quedar igual. | O | Aplicado. |
| 27 | `textoAdvertencia` `recorrido-largo` | «Recorrido del día de 1.300 km» | «Recorrido del día inusualmente largo: 1.300 km» | Explica por qué es una advertencia. | O | Aplicado. |
| 28 | `TEXTO_ALERTA.parteSinEnviar` | «… (empezado por Lucía Ferreyra)» | «… (iniciado por Lucía Ferreyra)» | Más natural. | O | Aplicado. |

## 5. Lo que revisé y dejo igual

Sin voseo, claros y consistentes con la especificación: `textoVencimiento`, `textoFaltantes`, `textoProtagonista`, `textoDisponibles`, `textoHorizonte`, `textoHoy` («(hora de Argentina)»), `textoLeFaltan`, `textoQuedanVencimientos`, `textoInsigniaAlertas`, `textoEmpresa` (siempre rotula «CUIT ficticio»), `MOTIVO_APTITUD`, `RESUMEN_EVENTO`, `NOMBRES_*`, `TEXTO_FALTA_CARGAR`, `TEXTOS_DE_CAMPO` (con ejemplo ficticio), los mensajes de kilometraje y litros (`kmNoNumerico`, `kmRango`, `litrosCero`, `errKmRetrocede`), `tituloDePagina` y el mensaje de patente de `patente.ts`. La advertencia de documentación vencida («Puede enviar el parte igual: quedará registrado…») es honesta y se conserva. La clave `emisor.vacio` es una cadena vacía a propósito (el emisor es opcional): confirmar que ninguna pantalla la muestre.

## Decisiones del dueño

- **A. «Reiniciar demo» desde la pantalla de error de arranque.** La especificación (sección 8) pide «reinicie la demo» con botón «Reiniciar demo» ante una falla grave al iniciar. Pero `reiniciar()` devuelve `sin-datos` («La demo todavía no terminó de cargar») cuando no hay estado, que es exactamente el caso de la fase `error`. Hoy ese botón no funcionaría. Opciones: (1) que `reiniciar()` funcione sin estado previo, abriendo y regenerando; o (2) quitar la mención y el botón y dejar solo «Recargue la página» (la redacción propuesta en el ítem 1 ya evita prometerlo). Hasta decidir, el ítem 1 debe aplicarse como está.
- **B. Ítems 9 y 10** necesitan claves nuevas o conectar `noPudoGuardarElParte`: toca código, no solo texto.
- **C.** Si en el ítem 3 se prefiere conservar «Actualizar» (spec 5.18), no hay otro impacto.

## Estado de la aplicación (18/11/2026)

- **A (resuelta, opción 1):** `reiniciar()` funciona también en la fase `error`: borra la base de IndexedDB (`borrarIndexedDB`) y vuelve a arrancar. Por eso el texto de arranque conserva «reinicie la demo» y no hace falta la variante «borre los datos de este sitio» (esa frase quedó solo en `noPudoReiniciarDesdeError`, para cuando el reinicio también falla).
- **B (hecha):** claves nuevas `noPudoReiniciar`, `noPudoReiniciarDesdeError` y `noPudoCambiarVista`, y `noPudoGuardarElParte` conectada.
- **C (resuelta):** el botón del aviso D9 sigue siendo «Actualizar» (ítem 3, no aplicado).
- Los tests que fijaban los textos viejos se actualizaron y se agregó un bloque «revisión de textos» en `tests/textos.test.ts`.
