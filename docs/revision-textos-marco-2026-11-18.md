# Revisión de textos del marco (redactor-ux), 18/11/2026

Alcance: `src/componentes/textos-marco.ts` completo (`TEXTO_MARCO`, `TEXTO_DIALOGO`, `TEXTO_REINICIO`, `TEXTO_ELEGIR_CONDUCTOR`, `TEXTO_COMO_FUNCIONA`, `TEXTO_PIE`). No se editó código. Marca: **N** = necesario (el texto dice algo falso o impreciso), **O** = opcional.

## Verificación de cada afirmación de «Cómo funciona»

| Afirmación | Fuente | Resultado |
| --- | --- | --- |
| 10 puntos de revisión | `ITEMS_CHECKLIST` (`parte.ts`) y `NOMBRES_ITEM_CHECKLIST` (`textos.ts`): 10 ítems | Verdadero |
| Umbrales: vencido d < 0; vence hoy y 1 a 7 días; 8 a 15; 16 a 30; más de 30 sin alerta | `clasificar` (`vencimientos.ts`) | Verdadero (el grupo «7 días» incluye el día 7) |
| «Vencido o faltante: si es obligatorio para la unidad, la unidad no puede salir» | `aptitud` (A1) mira solo documentos obligatorios de la unidad; un documento que vence hoy no bloquea (A2) | Verdadero para la unidad. Impreciso: el grupo «Vencidos y faltantes» también incluye la licencia del conductor, que no bloquea la unidad (solo advierte al enviar el parte, P9) |
| «Si informa una novedad en un punto crítico, la unidad queda fuera de servicio» | A3, `parte.ts`: son críticos frenos, dirección, neumáticos, luces y cinturones; además cualquier novedad con «Impide usar la unidad» | Verdadero pero incompleto |
| «…hasta que el encargado la revise» | A4/N2: sale de ese estado cuando el encargado resuelve todas las novedades críticas y pulsa «Volver a servicio» (o marca «Volver a servicio ahora» al resolver la última) | Impreciso: «revisar» no es una acción de la demo; hay que resolver la novedad |
| «Completa el parte desde el celular» | La interfaz es responsive, pero nada restringe el dispositivo | Promesa que la demo no cumple (se puede completar en cualquier pantalla) |
| «Solo en este navegador: nada se envía a ningún servidor» | `src/` no tiene `fetch`, XHR ni `sendBeacon`; solo IndexedDB (`indexeddb.ts`); no hay otra URL externa salvo el enlace al portafolio | Verdadero para los datos de la demo. Sin IndexedDB (D8) los datos viven en memoria y se pierden al recargar |
| «Reiniciar demo vuelve a la flota de ejemplo con las fechas de hoy» | `reiniciarDemo` → `ejemploDeHoy(hoy, semilla, perfil)` | Verdadero. Detalle: conserva el punto de vista elegido en «Ver como» |
| «Ver como: no hay usuarios ni contraseñas» | `app.svelte.ts`: el perfil Conductor solo ejecuta comandos del parte (`COMANDOS_DEL_CONDUCTOR`) | Verdadero, pero omite lo útil: cambia qué se puede hacer |

## Propuestas

| Clave | Actual | Propuesto | Motivo | N/O |
| --- | --- | --- | --- | --- |
| `TEXTO_COMO_FUNCIONA.reglas[0].texto` | «El documento ya venció o no está cargado. Si es obligatorio para la unidad, la unidad no puede salir.» | «El documento venció o, si es obligatorio, falta cargarlo. Si es de la unidad, la unidad figura como «No puede salir». La licencia vencida del conductor no la bloquea: avisa al enviar el parte.» | Distingue documento de la unidad y del conductor, que es lo que el código hace (A1, P9). Usa el rótulo real «No puede salir». Falta cargar solo aplica a obligatorios (V12). | N |
| `TEXTO_COMO_FUNCIONA.reglas[1].texto` | «Vence hoy o dentro de la semana.» | «Vence hoy o en los próximos 7 días. Hasta el día del vencimiento incluido, la unidad puede salir.» | «Dentro de la semana» es ambiguo; el umbral es 0 a 7 días y A2 (vence hoy no impide salir) es lo que el lector no adivina. | O |
| `TEXTO_COMO_FUNCIONA.reglas[3].texto` | «Está en el horizonte del mes.» | «Vence dentro del mes.» | «Horizonte» es jerga de diseño; el rango es 16 a 30 días. | O |
| `TEXTO_COMO_FUNCIONA.reglas` (fila nueva) | (no existe) | Etiqueta «Más de 30 días»; texto «Todavía no genera alerta.» | Cierra la escala: hoy el lector no sabe qué pasa después del día 30. Es el comportamiento de `clasificar` (`vigente`, sin grupo). | O |
| `TEXTO_COMO_FUNCIONA.parte` | «El conductor completa el parte desde el celular: kilometraje, combustible y 10 puntos de revisión. Si informa una novedad en un punto crítico, la unidad queda fuera de servicio hasta que el encargado la revise.» | «El conductor completa el parte con el kilometraje al iniciar y al terminar, 10 puntos de revisión y, si cargó, el combustible. Una novedad en frenos, dirección, neumáticos, luces o cinturones, o marcada como «Impide usar la unidad», deja la unidad fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio.» | Quita «desde el celular» (la demo no lo exige; si se quiere conservar la idea: «pensado para el celular»). Nombra los 5 puntos críticos (verificable en `ITEMS_CHECKLIST`). Reemplaza «la revise» por las acciones reales (A4/N2). Combustible es opcional (P10). Largo: en 360 px ocupa unas 8 líneas; si se quiere más corto, cortar la lista de puntos críticos. | N |
| `TEXTO_COMO_FUNCIONA.datos` | «Solo en este navegador: nada se envía a ningún servidor. «Reiniciar demo» vuelve a la flota de ejemplo con las fechas de hoy.» | «Los datos que usted carga quedan solo en este navegador y no se envían a ningún servidor. «Reiniciar demo» borra esos cambios y vuelve a la flota de ejemplo con las fechas de hoy.» | Aclara que lo protegido son los datos del visitante (la página sí se descarga de un servidor) y que reiniciar borra, que es lo que el visitante necesita saber antes de pulsar. Coincide con `TEXTO_REINICIO.descripcion`. | O |
| `TEXTO_COMO_FUNCIONA.verComo` | «Es solo un punto de vista de la demo: no hay usuarios ni contraseñas.» | «Cambia entre encargado y conductor para probar cada parte de la demo. El conductor solo completa el parte. No hay usuarios ni contraseñas: no protege nada.» | Dice qué hace el control, no solo qué no es. Verificado: `COMANDOS_DEL_CONDUCTOR` limita al conductor. | O |
| `TEXTO_ELEGIR_CONDUCTOR.ayuda` | «Es solo un punto de vista de la demo: no hay usuarios ni contraseñas.» | Sin cambio (si se acepta el cambio anterior, dejar este corto tal como está). | Coherente con el original; en el diálogo de elección conviene la versión breve. | — |
| `TEXTO_REINICIO.descripcion` | «Se borran los cambios hechos en este navegador y se vuelve a cargar la flota de ejemplo con las fechas de hoy.» | Sin cambio. Opcional agregar «No se puede deshacer.» | Es la de la especificación 5.17 y es exacta. | O |
| `TEXTO_MARCO.cambiarConductor` | «Cambiar» | «Cambiar conductor» | Verbo + objeto; suelto en la barra no dice qué cambia. Si no entra en 360 px, mantener «Cambiar» y poner el nombre completo en `aria-label`. | O |
| `TEXTO_ELEGIR_CONDUCTOR.continuar` | «Continuar» | «Ver como este conductor» | Verbo + objeto; dice qué ocurre al pulsar. Alternativa corta para 360 px: «Elegir conductor». | O |
| `TEXTO_COMO_FUNCIONA.entendido` | «Entendido» | «Cerrar» (o conservar «Entendido») | Es un cierre sin decisión; «Entendido» es aceptable, pero «Cerrar» coincide con `TEXTO_DIALOGO.cerrar`. | O |
| `TEXTO_MARCO.pantallaEnPreparacion` | «Esta pantalla todavía no está hecha.» | «Esta pantalla todavía no está disponible.» | Suena a descuido; además no dice qué hacer. Si queda en la versión publicada: agregar «Vuelva a «Alertas».» Si es solo provisorio, ignorar. | O |

## Sin cambio (revisado)

- Sin voseo ni regionalismos en todo el archivo; el lector recibe formas de usted o impersonales («Elija», «Tiene cambios sin guardar»).
- `TEXTO_MARCO`: `nombreApp`, `etiquetaDemo`, `saltar`, `comoFunciona`, `reiniciarDemo`, `volverAlPortafolio` (y su versión corta), `menuMas`, pestañas, `verComo`, perfiles, `conductorElegido` («persona ficticia» es correcto), `cerrarAviso`, `actualizar` (fijado por 5.18), `recargar`.
- `TEXTO_DIALOGO`: `cancelar`, `cerrar`, `descartarCambios`, `seguirEditando` son verbo + objeto o verbo claro. `tieneCambios` es breve y suficiente.
- `TEXTO_REINICIO`: `titulo`, `confirmar`, `reiniciando`, `hecho` (dice qué pasó para lectores de pantalla). La descripción es exacta (ver arriba).
- `TEXTO_ELEGIR_CONDUCTOR`: `titulo`, `leyenda`, `unidad`, `sinUnidad`, `elegir` (error con la acción incluida).
- `TEXTO_COMO_FUNCIONA`: `titulo`, `queEs`, `tituloReglas`, `tituloParte`, `tituloDatos`, `tituloVerComo`, `reglas[2]` («Hay que planificar la renovación» es correcto para 8 a 15 días).
- `TEXTO_PIE`: `datos` y `autoria` respetan la regla del portafolio (qué hizo Matías, qué escribió la IA; empresa inventada). Condición: `EMPRESA.nombre` debe seguir siendo ficticio y no coincidir con ninguna real. Confirmar al publicar.

## Coherencia con `textos.ts`

- Rótulos que coinciden: «No puede salir», «Vencidos y faltantes», «7 días o menos», «8 a 15 días», «16 a 30 días» (`textoHorizonte`, `TEXTO_ALERTA`), «Volver a servicio», «Ver como», «Reiniciar demo».
- Diferencia a resolver: «Cómo funciona» dice «hasta que el encargado la revise» y `docs/diseno-ui.md` (líneas 528 y 994) usa la misma frase en el aviso del parte con punto crítico. Si se acepta la corrección de `parte`, conviene corregir también ese aviso (`textos.ts` o el componente del parte) a «hasta que el encargado resuelva la novedad y la vuelva a poner en servicio».

## Decisiones del dueño

1. **«Desde el celular»**: ¿se quiere conservar como intención de diseño («pensado para el celular») o quitarlo? Hoy la demo funciona en cualquier pantalla.
2. **Licencia del conductor**: el texto propuesto explica que no bloquea la unidad (P9, decisión de diseño existente). Si se prefiere que la licencia vencida sí bloquee la unidad, cambiaría la regla, no el texto.
3. **Largo del diálogo en 360 px**: la propuesta de `parte` suma texto. Si se prefiere brevedad, cortar los cinco puntos críticos y dejar «un punto crítico o «Impide usar la unidad»».
4. **Aviso del parte con punto crítico**: aplicar la misma corrección de «la revise» (ver Coherencia).

## Resumen de cantidad

12 filas con cambio propuesto: 2 necesarias (`reglas[0]`, `parte`) y 10 opcionales.

## Estado de las correcciones (maquetador, 18/11/2026)

Aplicados en `src/componentes/textos-marco.ts`: los 2 **N** (`reglas[0]`: distingue documento de la unidad y del conductor; `parte`: resolver la novedad y volver a poner
en servicio) y los **O**: `reglas[1]` (7 días, A2), `reglas[3]` («Vence dentro del mes.»), fila nueva «Más de 30 días: Sin alerta.», `datos` («Los datos que usted carga…»),
`verComo`, «Cambiar» → «Cambiar conductor», «Continuar» → «Ver como este conductor», `pantallaEnPreparacion` («…no está disponible.»). Decisiones del dueño: `parte` dice
«Está pensada para usarse desde el celular» y no lo afirma como hecho; «Entendido» se conserva. No se aplicó el «No se puede deshacer.» opcional de la descripción
del reinicio. Textos nuevos: `ayudaPerfilConductor` y `listo`.
