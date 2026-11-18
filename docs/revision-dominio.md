# Revisión del dominio (18/11/2026)

Alcance: `src/lib/dominio`, `src/lib/datos`, `src/lib/persistencia/memoria.ts`, commits `27f8888` a `f492473` (rama `main`).
Revisor: `revisor-codigo`. No se editó el repositorio; las mutaciones se probaron en una copia fuera de él.

## Veredicto

El corazón está bien hecho. `fechas.ts` y `vencimientos.ts` no tienen ningún método local de `Date`, usan `Intl` con zona
explícita y sus tests matan todas las mutaciones de borde que se probaron (0, 1, 7, 8, 15, 16, 30, 31, −1, bisiestos,
2000/2100, la medianoche de Argentina, el UTC−2 de 2009). Un programador senior que abra el repositorio ve disciplina.
Lo que sigue son huecos de reglas y de rigor, no errores en el cálculo central. **Altos: 0. Medios: 6. Bajos: 11.**

## Verificación ejecutada

| Comando | Resultado |
| --- | --- |
| `npm test` | 19 archivos, 438 tests, verdes. |
| `npm run test:tz` | Los mismos 438 en `UTC`, `Asia/Tokyo` y `America/Los_Angeles`. |
| `npx tsc --noEmit` | Sin errores. |
| Búsqueda de `new Date`, `getDate/getHours/...`, `toLocale`, `Math.random`, `Date.now` en `src/` | Sin resultados. |
| `any` en `src/` | Ninguno. Hay 21 líneas con `as` (ver B4). |
| Mutaciones manuales | 114 mutantes en una copia, más uno específico de T2. 100 muertos, 5 equivalentes (no cambian el comportamiento observable) y 9 sobreviven por huecos reales de tests (B1, B2); el de T2 sobrevive con `npm test` (M5). |

Sobre las mutaciones: murieron todos los de `clasificar` (`<=` por `<` en 7, 15 y 30; `d < 0` por `d <= 0`), `parsearFechaCivil`
(2000/2100, mes 12, día 0), `diasEntre`, `sumarAnios` sin el ajuste del 29/02, zona fija UTC−3 (`Etc/GMT+3`), `hourCycle: h24`,
K2/K3/K4/K6/K7 (`>` por `>=`), P2 (±7 días), P9 (`<` por `<=` en el documento de la unidad), V10, V11, A2, A3, A4, P1, P7, P8 y la
secuencia de eventos. Eso es un nivel de pruebas poco común.

---

## Medios

### M1. P9 se evalúa "con el documento vigente de hoy": el resultado depende del orden en que se hacen las cosas

`src/lib/dominio/parte.ts:147-160` (`documentacionVencidaEn`), decisión 4 del registro y sección 16 del diseño.

Se verificó con el propio ejemplo: el generador guarda para el parte de H−6 de la unidad C18 `documentacionVencida: ['revision-tecnica']`,
pero si se vuelve a calcular hoy con `documentacionVencidaEn` da `[]`, porque la renovación (vence en H+358) ya es el documento
vigente. Hoy el valor correcto queda congelado solo porque en C18 el parte se envió **antes** de cargar la renovación. Si el
orden es el inverso (se renueva con retraso y después el conductor envía el borrador de hace 3 días, que P2 todavía permite), el
parte sale sin advertencia ni alerta "Circuló con documentación vencida": una renovación tardía borra el hecho. Es la regla más
sensible del dominio (registra lo que pasó).

Propuesta: evaluar por cobertura a la fecha del parte y no por "vigente de hoy". Un documento cubre la fecha F si `vence >= F` y,
cuando tiene `emitido`, `emitido <= F`. El resto (documento que cubre) se toma entre todos los del titular y el tipo, no solo el de
`vence` más tardío. Si no se quiere ese costo, dejar escrita la limitación en la sección 14 del diseño ("Límites conocidos") y
agregar un test que la fije.

### M2. El contexto no se valida: un `ahora` malo se guarda y después rompe todo el centro de alertas

`src/lib/dominio/comandos.ts:52-59` y `:149-169`; `src/lib/dominio/fechas.ts:39-42`.

Se comprobó: `ejecutar(estado, altaUnidad, { ...ctx, ahora: "ayer" })` devuelve `ok`, guarda `unidad.creada = "ayer"`, y desde ahí
`calcularAlertas` lanza `Instante inválido` (alerta P6, `alertas.ts:319`, llama a `fechaEnArgentina(u.creada)`). Un solo valor
malo deja el estado envenenado. Además:

- `Date.parse` acepta cualquier cosa: `fechaEnArgentina("2026-11-18T01:00:00")` (sin `Z`) se interpreta en hora **local** del equipo
  y da `2026-11-18` o `2026-11-17` según la zona (comprobado cambiando `TZ`). Es justo lo que T2 prohíbe, y `Instante` es un
  `string` cualquiera. También acepta `"18 Nov 2026 01:00 UTC"` y `"2026-11-18"` (formatos que dependen del motor).
- `hoy` y `ahora` son dos fuentes de verdad independientes: nada comprueba que `hoy === fechaEnArgentina(ahora)`.

Propuesta: una función `parsearInstante` estricta (`/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/` y `Date.parse` finito) usada en
`partesEnArgentina` para textos, y al entrar a `aplicar` comprobar `ahora` válido y `hoy` igual a `fechaEnArgentina(ahora)`
(si no, error de programación: `throw`). Un test por cada caso.

### M3. Una corrección de kilometraje "desde" una fecha anterior a partes ya enviados no tiene efecto, pero el historial dice que sí

`src/lib/dominio/comandos.ts:466-505` (`corregirKilometraje`) y `src/lib/dominio/kilometraje.ts` (`registrosDeKm` ordena por fecha).

Se comprobó con el ejemplo generado: corregir la unidad 2 a 120 km "desde H−10" (hay partes posteriores) se acepta, genera el
evento "Kilometraje de ... corregido: de 96.165 a 120 km", y `kmActual` sigue en 96.165; K3 y K4 tampoco cambian. La lectura
literal de K8 ("la corrección más reciente **si es posterior**") lo permite, pero el usuario no recibe ningún aviso y la historia
afirma algo que no pasó en los números.

Propuesta (elegir una y anotarla en la sección 16): (a) rechazar con un error claro si `desde` es anterior a la fecha del último
parte enviado ("Hay partes posteriores; use la fecha del último o posterior"); o (b) aceptarla pero que el resumen del evento y la
interfaz digan "no cambia el kilometraje actual: hay partes posteriores". Un test con el caso.

### M4. Alerta crítica de un documento que no se exige, mientras la aptitud dice "Puede salir"

`src/lib/dominio/alertas.ts:118-121` (V17 generalizado, sección 16) contra `src/lib/dominio/aptitud.ts:41-50`.

Se comprobó: una unidad de la Base de mantenimiento con una "Habilitación de ingreso al proyecto" vencida (por ejemplo, venía de
un proyecto que sí la pedía) genera la alerta `critica` "Vencido hace 3 días · Habilitación de ingreso al proyecto" y sube la
insignia de la pestaña de 4 a 5, pero `aptitud` devuelve `puede-salir`. El centro de alertas dice "crítico" de algo que A1 no
considera bloqueante, y el encargado no tiene forma de sacarla (los documentos no se borran; tendría que renovar uno que no hace
falta). La decisión se tomó para generalizar V17 (que habla solo de la habilitación de manejo).

Propuesta: que la alerta de un documento de tipo `si-proyecto-requiere` no se emita si el proyecto actual no lo requiere (V13
dice que "solo se exige si el proyecto la requiere"), o bajarla a `baja` y excluirla de la insignia. Conservar la alerta de la
habilitación de manejo, que sí es V17.

### M5. `npm test` solo no protege la regla T2 en la máquina de Matías, y la matriz de zonas todavía no corre en CI

`package.json` (`"test": "vitest run"`), `tests/zona-horaria.test.ts`, `vite.config.ts`; el paso 0.4 del plan (CI) todavía no existe
(no hay `.github/`).

Se comprobó con una mutación que viola T2 (`partesEnArgentina` con `getFullYear/getDate/getHours` locales): con la zona del equipo
(Argentina, UTC−3) y con `TZ=America/Argentina/Buenos_Aires` la suite da **438 de 438 verdes**; con `UTC`, `Asia/Tokyo` y
`America/Los_Angeles` da 9, 11 y 10 fallos. Es decir, la defensa real de T2 es `npm run test:tz`, y quien corra `npm test` en
Argentina (el autor) no se entera. El test `zona-horaria.test.ts` además sale en silencio si `TZ` no está definida.

Propuesta: un `globalSetup` de Vitest que fije `process.env.TZ` a una zona lejana (`Asia/Tokyo`) cuando no venga definida, de modo que
`npm test` ya sea un chequeo de T2; y no dar por cumplido T2 hasta que exista el paso 0.4. Repetir la mutación para comprobarlo.

### M6. Los comandos guardan por referencia objetos del llamador

`src/lib/dominio/comandos.ts:567` (`titular: c.titular`), `:950-951` (`checklist: c.checklist`, `otraNovedad: c.otraNovedad`).

Se comprobó: después de `guardarBorrador`, mutar el `checklist` que se pasó cambia el borrador guardado en el estado resultante
(`guardado.checklist === chk`). La promesa del módulo es "devuelve los cambios sin modificar el estado" y los eventos son
inmutables (H1/H2), pero basta que la interfaz reutilice su objeto de formulario para que el "estado" cambie por la espalda.
Va a pasar en la Etapa 3: con Svelte 5 el formulario es un `$state` (un proxy), y `structuredClone` sobre un proxy falla.

Propuesta: copiar explícitamente al construir el parte (`checklist: { ...c.checklist }` con cada respuesta copiada, `otraNovedad: c.otraNovedad && { ...c.otraNovedad }`,
`titular: { ...c.titular }`) y un test que muta el objeto de entrada y comprueba que el estado no cambia. El mismo criterio para `datos` de
los eventos, que comparten arreglos con el estado (`requeridas`, `origen`).

---

## Bajos

### B1. Tests: ninguna fecha posterior a 2100-02-28 pasa por `fechaDesdeDias`

`src/lib/dominio/fechas.ts:93-104`; `tests/fechas.test.ts` ("sumarDias es la inversa", ±800 días desde 2026).

Las mutaciones que quitan `Math.floor(doe / 36_524)` y `Math.floor(doe / 146_096)` sobreviven: son las correcciones de los
años de siglo, y solo pesan desde 2100-03-01, que `parsearFechaCivil` sí acepta (hasta 2100-12-31). En la práctica no se llega,
pero el diseño dice que T5 se prueba sobre el rango válido. Propuesta: un test que recorra cada día de 2000-01-01 a 2100-12-31 (36.500
iteraciones, milisegundos) y compare `sumarDias` con `Date.UTC`.

### B2. Tests: bordes que no matan ningún mutante

- P9 con la licencia que vence el mismo día del parte (`parte.ts:157`, `<` por `<=` sobrevive; el del documento de la unidad sí está probado).
- Borrador con descripción de exactamente 500 caracteres (`validacion.ts:67`, `>` por `>=`).
- `cargarDocumento` con `emitido === vence` (`comandos.ts:540`, `<` por `<=`; en `corregirDocumento` sí está).
- El tope de 200 caracteres del motivo de A3 (`comandos.ts:747` y `:756`, `abreviar`). Es alcanzable: con todos los ítems con novedad el motivo
  pasa de 200 (comprobado: 277 antes de abreviar).
- Litros del borrador en 200 contra 200,5 (`comandos.ts:874`).
- Desempate final por `id` en `documentoVigente` (`vencimientos.ts:76`, `gana`) y el orden parte-antes-que-corrección con el mismo instante (`kilometraje.ts:83`).

### B3. Duplicación y código muerto

- Litros: `comandos.ts:872-878` repite la regla de `parsearLitros` (`parte.ts`) con un `200` literal (existe `LITROS_MAXIMO`) y un mensaje propio. Extraer `validarLitros(n)`.
- `enviadoFueraDeTermino` (`parte.ts`) solo se usa en tests; `enviarParte` calcula lo mismo con `diasEntre(enviado.fecha, ctx.hoy) > 0` (`comandos.ts:1054`) y la función con `fechaEnArgentina(parte.enviado)`: dos definiciones de "fuera de término". Dejar una.
- `parte.ts:155-157`: `faltantes.includes("licencia")` es redundante con `licencia === undefined`; `faltantesDeConductor` no hace falta ahí.
- `checklist` vacío escrito tres veces (`parte.ts:nuevoBorrador`, `tests/ayuda.ts:checklistVacio`, `generador.ts`), y `reemplazarOAgregar` dos veces (`estado.ts:24` con `Map`, `memoria.ts:13` con `findIndex`).
- El generador reescribe a mano los eventos que producen los comandos (`parte-enviado`, `novedad-abierta`, `documento-renovado`...). Si cambia un resumen en `textos.ts`, lo cubre; si cambia un `datos`, se desincroniza sin que ningún test lo note. Un test que compare la forma de `datos` de un evento generado con el de uno producido por `ejecutar` lo resolvería.
- `etiquetaDeTitular` y `nombreDeConductor` (`comandos.ts:251-263`) tienen rutas "desconocido" inalcanzables después de `verificarTitular`; `cargarDocumento` tiene un `nombre ?? "El documento"` imposible (`:555`).

### B4. Tipos flojos

- `FechaCivil` e `Instante` son `string`: pasan `diasEntre("2026-02-30", "2026-03-01")` (da −1, sin error), `sumarDias(f, NaN)` (devuelve `"0NaN-NaN-NaN"`) y `sumarDias(f, 1.5)` (`"2026-11-19.5"`). Mínimo: `Number.isInteger(dias)` en `sumarDias`; mejor, un tipo con marca (`string & { readonly __fecha: unique symbol }`) que solo producen `parsearFechaCivil` y `sumarDias`.
- Aserciones evitables: `alertas.ts:160, 200, 343, 352, 356` (`grupo as Grupo`, `d as number`: el tipo `AlertaDeVencimiento` podría llevar `grupo: Grupo` y `d: number | null` sin cast); `comandos.ts:996-997` (`kmInicio as number`: que `faltantesParaEnviar` devuelva un tipo que ya tenga los números); `generador.ts:243, 358, 467, 472, 664, 665` (`as Rol`, `as Conductor`, `as Proyecto`).
- `Evento.datos: Record<string, unknown>` y `ErrorDeNegocio.codigo: string` obligan a la interfaz a adivinar. Una unión discriminada por `tipo` (evento) y una unión de códigos (error) darían chequeo de tipos a la Etapa 3.

### B5. `cambiarAsignacion` rechaza un cambio solo de proyecto si el conductor asignado (sin cambiar) quedó inactivo

`comandos.ts:337`. Se comprobó: devuelve `conductor-inactivo` aunque el conductor no se toque. Propuesta: validar "activo" solo si `c.conductorId !== u.conductorId`.

### B6. Datos incoherentes se ignoran en silencio

`aptitud.ts:41` y `alertas.ts:185`: una unidad cuyo `proyectoId` no existe sale como "Puede salir" y sin alertas de documentos. Los comandos lo impiden, pero el estado viene de IndexedDB. Propuesta: lanzar un error o sumar un motivo "Proyecto inexistente".

### B7. Generador: dos desajustes con lo que dicen los comentarios y el diseño

- `generador.ts:667`: el evento de C10 está en `en(H, 4, 0)` (04:00Z = 01:00 de Argentina). La sección 16 dice que así "nunca es posterior a ahora", pero entre las 00:00 y las 01:00 de Argentina del día H el evento está en el futuro. Con `en(H, 3, 0)` (00:00 de Argentina) la afirmación es cierta.
- `comandos.ts:757`: `datos.motivo` del evento de A3 guarda el motivo sin abreviar (277 caracteres en el peor caso) mientras el estado lo abrevia a 200. Guardar el abreviado.

### B8. Textos fuera de `textos.ts` y un comentario desactualizado

El registro dice que el paso 1.10 dejó los textos "en un solo lugar", pero hay literales en `kilometraje.ts`, `parte.ts` (`validarFechaParte`, `parsearLitros`), `validacion.ts`, `vencimientos.ts` ("Falta cargar"), `aptitud.ts` y `comandos.ts:876`. Además `textos.ts:1` sigue diciendo "(se completa en el paso 1.10)". O se mueven, o se corrige la afirmación del registro; esto importa porque `redactor-ux` va a revisar `textos.ts` y se perdería la mitad.

### B9. Secuencia de eventos y validaciones contra estado viejo entre pestañas

`comandos.ts:156-159`: `secuencia = max(estado.eventos) + 1`. Con dos pestañas (D9) cada una calcula el mismo número, y `RepositorioMemoria.escribir` solo rechaza ids repetidos, no secuencias repetidas (H3 queda ambiguo). Lo mismo vale para las validaciones que solo ve el dominio (U3 interno, V10, A3). D9 lo mitiga con el aviso, pero conviene que el repositorio rechace `secuencia` repetida con el código `evento-repetido` (y que IndexedDB lo haga con un índice único) para que el conflicto sea un error y no un historial mal ordenado.

### B10. Datos ficticios: dos cosas por confirmar antes de publicar

- CUIT de la empresa: `30-99000003-0`. Tiene dígito verificador válido (D3 lo exige), así que podría coincidir con un contribuyente real. Lo único que lo protege es que la interfaz y el README lo rotulen siempre "ficticio"; comprobarlo en la Etapa 3.
- Patentes: todas empiezan con `Z` (verificado: las 24). El formato anterior `Z??999` y la serie Mercosur `Z?` son suposiciones del diseño; el registro ya las deja "a verificar". No pude confirmar desde acá qué series se emitieron. Mientras tanto no afirmar en el README que la serie "no se emitió" sin fuente.
- Lo demás está bien: la generación es determinista (sin `Math.random` ni `Date`, probada con hash fijo, con corrimiento de 7 días y con otras fechas base), las personas se combinan de listas inventadas y los números de póliza llevan `DEMO-`.

### B11. Publicabilidad (para cuando se haga público)

- Los 17 commits tienen como autor un correo personal (de Gmail). Antes de publicar, decidir si va un correo `noreply` de GitHub y reescribir el historial ahora, que es corto y barato.
- `CLAUDE.md` y `docs/registro.md` van a quedar públicos: mencionan "una empresa de terceros" y la carpeta `material-de-terceros/`. No hay nombres de la empresa ni de sus clientes (búsqueda hecha en todo el repositorio), pero conviene que Matías decida si quiere esa frase a la vista.
- Licencia todavía pendiente (README). `npm audit` tiene 5 altas por `picomatch` documentadas como excepción en el registro: coherente, pero el criterio de "sin altas" del `CLAUDE.md` del portafolio dice otra cosa; dejar la excepción en el README de publicación.

---

## Las 9 contradicciones que resolvió el programador

| # | Resolución | Juicio |
| --- | --- | --- |
| 1 | 24 = 23 activas + 1 de baja | Bien. Es la única que cierra con "19 de 23". |
| 2 | La alerta P5 dura mientras exista el borrador, aunque ya no se pueda enviar | Bien, con salida (descartar). |
| 3 | K3/K5 el mismo día: la corrección "desde F" cuenta para el parte de F, desempate por instante | Bien, pero abre el hueco M3 para fechas anteriores. |
| 4 | P9 con el documento vigente de hoy | **Mala** en el orden inverso (M1). |
| 5 | "Revisión técnica" en alertas, siglas en la interfaz | Bien. |
| 6 | `aptitud` con cuatro categorías | Bien. |
| 7 | `hoy` y `ahora` como texto en el contexto | Bien como idea, pero falta validarlos (M2). |
| 8 | El piso de V11 lo cubre T4 | Bien; el mensaje "Escriba una fecha válida" para 1999 es aceptable. |
| 9 | `check`/`build` no existen sin Svelte | Bien: no se inventó nada. |

De las decisiones de la sección 16 que no estaban entre las 9, la que más preocupa es la generalización de V17 (M4).

## Qué se haría primero

1. M2 (validar el contexto): es barato, previene el peor fallo (centro de alertas caído) y cierra una fuga de T2.
2. M5 (que `npm test` fije una zona lejana) y el paso 0.4 del plan.
3. M1, M3 y M4: decidir la regla con Matías y escribirla en la sección 16 antes de la Etapa 3, que es cuando el comportamiento se vuelve visible.
4. M6, B1 y B2 en una tanda de tests de endurecimiento.
