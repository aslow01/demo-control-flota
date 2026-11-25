# Registro

Los roles que aparecen en este registro («programador», «maquetador», «diseñador», «redactor», «revisor», «QA»,
«auditor») son agentes de IA con instrucciones distintas. Matías es el único humano: decide, prioriza y aprueba.

**Clave de los códigos.** *Hallazgos de una revisión:* letra de gravedad y número, junto al tipo de informe («QA B5», «accesibilidad M1»): **A** alta, **M** media, **B** baja, **m** menor; en una revisión visual, **C** numera los cambios pedidos.
*Decisiones:* **D** de diseño (`docs/diseno.md`, sección 15), **S** de tecnología (`docs/stack.md`, sección 9) y **Q** preguntas a Matías (`docs/diseno.md`, 17.10).
*Reglas y datos:* letra del área y número (T, V, A, P, K, N, U, H, D, L; `docs/diseno.md`, sección 6) y casos de ejemplo C01 a C21 (sección 9.2); el contexto distingue la «D» de una decisión de la «D» de las reglas de datos. Los informes de revisión que los citan son internos y no se publican.

## 18/11/2026 (noche, 6) — Revisiones de 3.2 a 3.4: segunda tanda de lógica (programador)

**Qué se hizo.** Cinco tareas chicas en `src/lib/` y tests, con TDD (cada test nuevo se vio fallar antes del código; el de «Cómo funciona», al romper a propósito
el texto y el umbral). Un commit por tarea, sin push.

| Qué | Cómo quedó |
| --- | --- |
| Listas guardadas dañadas (hueco del QA) | `arrancar` valida la forma mínima de cada lista (arreglo de objetos con `id` y los campos básicos de su tipo) y prueba que `calcularAlertas` no falle; si no, esquema inválido: se regenera el ejemplo con el aviso D7. Tests con fake-indexeddb escribiendo a mano en los almacenes (6 casos, más uno de forma correcta que rompe el cálculo). |
| Revisión 13 | `nombreDePantalla(ruta)` en `enrutador.ts`; `tituloDePagina` lo usa; `EstadoApp.nombrePantalla`; `App.svelte` ya no recorta con una expresión regular. |
| Revisión 12 | `tests/textos-marco.test.ts`: los números de «Cómo funciona» (7, 8 a 15, 16 a 30, más de 30; 10 puntos de revisión; punto crítico e «Impide usar la unidad») se comparan con `clasificar`, `ITEMS_CHECKLIST` y `novedadesDelParte`. El texto visible no cambió. |
| QA B5 | `cambiarPerfil` reemplaza la entrada del historial (`reemplazarHash`) en vez de agregar una. Límite: las entradas anteriores al cambio siguen y se redirigen. `ubicacionEnMemoria` cuenta `entradas`. |
| QA D6 (alternativa barata) | `cambiarPerfil` devuelve `cambios-en-otra-pestana` con `ERRORES.cambiosEnOtraPestana` mientras `hayCambiosEnOtraPestana`. |

**Verificación.** `npm test` 695 (antes 678), `npm run test:tz` (UTC, Tokio, Los Ángeles), `npm run check` 0 errores, `npm run buscar` sin hallazgos y `npm run build` en verde.

**Sin hacer.** Operación atómica «guardar solo el perfil» en el repositorio (D6 completo); humo de interfaz con Playwright. `App.svelte` solo cambió una línea (nombre de la pantalla).
**Para la vista.** `TEXTO_COMO_FUNCIONA.parte` empieza con «Está pensada para usarse desde el celular» después de «El parte diario»: el género no concuerda (no se tocó el texto visible).

## 18/11/2026 (noche, 5) — Revisiones de 3.2 a 3.4: correcciones de la vista (maquetador)

**Qué se hizo.** Todo lo que cae en `src/componentes/`, `src/App.svelte` y `src/estilos/`; sin tocar la lógica. Cada informe de revisión lleva al final su
sección «Estado de las correcciones».

| Qué | Cómo quedó |
| --- | --- |
| `BotonConfirmar` (revisión 1, QA A1) | Con toque confirma: `pointerleave` solo desarma con mouse; también desarma con Esc, al mover el foco y a los 4 s. |
| `Dialogo` (revisión 2, 3, 7; QA M2, M3, B2, B3, B6) | Esc en `keydown` (Esc ×5 con cambios no cierra); `bloqueado` mientras hay una acción en curso (Esc, X y Cancelar); contador de diálogos para el bloqueo del fondo; `focoInicial="titulo"`; cuerpo como región con nombre y enfocable solo si desborda; el segundo clic de un doble clic no atraviesa; en alturas bajas todo el cuadro se desplaza. |
| Avisos (accesibilidad A2, A3, M1, M4) | Región `.avisos` con `role="status"` siempre presente y avisos sin rol propio (`alert` solo para el error de cambiar de vista); «Demo reiniciada» se vacía, se escribe 250 ms después de cerrar el diálogo y se limpia a los 6 s (se anuncia en cada reinicio); «Flota de ejemplo lista.» tras «Preparando…»; foco al aviso siguiente o al `h1` al cerrar un aviso y tras «Actualizar». |
| Selector de perfil (accesibilidad A1, M2; revisión 10) | Dos botones con `aria-pressed` (no radios): la flecha no abre el diálogo; «Conductor…» con descripción previa; a menos de 40 rem va debajo de las pestañas (orden visual = orden de foco). |
| Bajos | `main` con `tabindex="-1"` («Ir al contenido» en el arranque); colores forzados sin sombra; foco al `h1` si el reinicio cambia de pantalla; `scrollbar-gutter: stable` desde 40 rem; `contraste.mjs` robusto y con el borde del secundario sobre los avisos (158 mediciones, 0 fallan, 9 justas). |
| Textos (`textos-marco.ts`) | Los 2 necesarios y los opcionales de la revisión del marco, más «Cambiar conductor», «Ver como este conductor» y «Más de 30 días: Sin alerta.». |

**Verificación.** `npm test` 678, `npm run check` 0 errores, `npm run buscar` sin hallazgos, `npm run build` y el build servido con la CSP real sin violaciones
(touch a 320 y 360, mouse a 1280, claro y oscuro, D8 real). En desarrollo con Playwright: toque y mouse en `BotonConfirmar`, Esc ×5, bloqueo del reinicio, anuncio en 3 reinicios
con `MutationObserver`, doble clic (1 clic llega al documento), pila de diálogos, orden de Tab, foco tras cerrar avisos, «Preparando…» y colores forzados.

**Sin hacer.** Humo de interfaz con Playwright en CI; que `enrutador.ts` exporte el nombre de la pantalla sin sufijo; el «Atrás» tras cambiar de perfil (enrutador); clic afuera para
cerrar diálogos (la especificación no lo pide); prueba con lector de pantalla real, Firefox y Safari.

## 18/11/2026 (noche, 4) — Revisiones de 3.2 a 3.4: correcciones de la lógica (programador)

**Qué se hizo.** Se commitearon los cuatro informes de revisión (código, QA, accesibilidad y textos del marco; luego retirados del repositorio: informes internos, no publicados) y se
aplicó lo que cae en `src/lib/`. Con TDD: cada test nuevo se vio fallar antes del código. Sin tocar `src/componentes/` ni estilos.

| Qué | Cómo quedó |
| --- | --- |
| Reinicio desde la fase `error` (revisión M5/M6, QA M4 y D1) | Se **quitó**: a esa fase solo llega un error de programación o del entorno (reloj, `generar`, barra de direcciones), no los datos guardados (se probó con perfil corrupto, listas ausentes o nulas, elementos basura y `meta` dañado: siempre termina en `lista`, o en el ejemplo con aviso D7, o en memoria con aviso D8). Fuera `deps.borrarAlmacenamiento` y `borrarIndexedDB`; `reiniciar()` sin estado devuelve `sin-datos`. `TEXTO_ERROR_ARRANQUE.mensaje` ya no manda a «reiniciar». |
| Plazo de apertura (QA M1) | `PLAZO_ABRIR_MS` = 8 s, inyectable (`plazoAbrirMs`); vencido, modo memoria con aviso D8; la conexión tardía se cierra. |
| Perfil guardado (QA B4) | Un conductor inexistente o un tipo inválido vuelve al encargado al arrancar. |
| Conexión colgada (revisión 15) | Si abrir anda pero cargar o guardar falla y se cae a memoria, se cierra la conexión. |
| Textos (revisión del marco) | `TEXTO_PARTE.puntoCritico` y `enviadoConCritica`: «…hasta que el encargado resuelva la novedad y la vuelva a poner en servicio». `diseno-ui.md` alineado. P9 no cambia. |
| QA D6 | Anotado en `docs/diseno.md`, no arreglado (pide una operación atómica en el repositorio). |

**API para la vista.** `reiniciar()` en fase `error` devuelve `sin-datos` con `ERRORES.sinDatos`: la pantalla de error solo debe ofrecer
«Recargar la página». Se sacó de `App.svelte` solo el botón «Reiniciar demo» de esa pantalla; quedan sin uso `errorAlReiniciarDesdeError`
y `desdeError` en `App.svelte`. Falta, en `textos-marco.ts`, cambiar `TEXTO_COMO_FUNCIONA.parte` («…hasta que el encargado la revise») y
usar `TEXTO_PARTE` en las pantallas del parte.

**Verificación.** `npm test` 678 (antes 675), `npm run test:tz`, `npm run check`, `npm run buscar` y `npm run build` en verde.

## 18/11/2026 (noche, 3) — Pasos 3.2 a 3.4: sistema visual, marco de la aplicación y diálogos (maquetador)

**Qué se hizo.** Rama `interfaz-etapa-0`, sin tocar el dominio ni el estado.

| Paso | Qué quedó |
| --- | --- |
| 3.2 | `src/estilos/tokens.css` y `base.css` (claro y oscuro), sprite de 30 íconos en `index.html`, componentes `Icono`, `Patente`, `Etiqueta`, `Panel`, `Boton`, `Campo`, `Dato`; página de muestras `muestras.html` (solo `npm run dev`, no entra a `dist/`); `scripts/contraste.mjs` (`npm run contraste`). |
| 3.3 | `App.svelte` con barra superior, barra de la aplicación, selector de perfil, menú «Más», avisos D5/D7/D8/D9 (`Aviso`), pie, arranque y error; `document.title`, foco al `h1` al cambiar de pantalla y reloj cada minuto y al volver a la pestaña. Textos del marco en `src/componentes/textos-marco.ts`. |
| 3.4 | `Dialogo` base (`<dialog>` modal: foco inicial, vuelta del foco, Esc, trampa de Tab, fondo sin desplazamiento, hoja a pantalla completa a menos de 40 rem), `DialogoReiniciar`, `DialogoComoFunciona`, `DialogoConductor`, `BotonConfirmar` (dos pasos y doble clic < 500 ms ignorado, para el parte). «Reiniciar demo» funciona en la barra, el menú, el aviso D5 y la pantalla de error (con «Recargar la página»). |

**Verificación.** `npm test` 675, `npm run check` 0 errores, `npm run buscar` sin hallazgos, `npm run contraste` 0 fallas (3 pares justos
ya conocidos: texto-3/escritorio 4,65 en claro, semana-r/pista 3,14 en claro, borde-fuerte/patente 3,27 en oscuro), build servido con la CSP
real sin violaciones. Navegador (Chromium con Playwright) en claro y oscuro a 360 y 1280 px; teclado, reinicio con datos modificados y
desde el error de arranque (con y sin IndexedDB roto) comprobados.

**Decisiones y pendientes.**

1. Las pantallas siguen siendo un marcador («Esta pantalla todavía no está hecha.»): llegan en la Etapa 4. Cada una trae su `h1` con `tabindex="-1"`.
2. «Cómo funciona» explica las reglas con etiquetas en vez del horizonte mediano de la especificación: el horizonte llega en 4.1.
3. En menos de 40 rem el selector de perfil queda visualmente arriba de la navegación pero después en el DOM (orden de tabulación); a evaluar por `auditor-accesibilidad`.
4. No se probó con lector de pantalla, Firefox ni Safari. Los avisos llevan su `role` (`status` o `alert`); el anuncio real falta verificarlo.
5. Si «Elegir Encargado» falla al guardar, el mensaje (`noPudoCambiarVista`) sale en un aviso cerrable.

## 18/11/2026 (noche, 2) — Revisión de textos aplicada y «Reiniciar demo» desde el error de arranque (trabajo autónomo)

**Qué se hizo.** Se aplicó `docs/revision-textos-2026-11-18.md` (redactor UX) y se resolvió la decisión A con la opción 1.
Con TDD: cada test nuevo o cambiado se vio fallar antes del código.

| Commit | Qué quedó |
| --- | --- |
| `007d673` | Los 26 ítems con cambio de la revisión (N y O) en `textos.ts`; `TEXTO_ERROR_ARRANQUE` pasa a `{ titulo, mensaje }` y `App.svelte` usa `.titulo` en el `h1` (único cambio de la vista; sale `errorArranqueTitulo` de `textos-marco.ts`). Tests viejos actualizados y un bloque «revisión de textos» en `tests/textos.test.ts`. |
| `2e1bd2f` | `app.svelte.ts`: `noPudoReiniciar`, `noPudoCambiarVista`, `noPudoGuardarElParte` (para `guardarBorrador` y `enviarParte`); `reiniciar()` funciona en fase `error` (`borrarAlmacenamiento` inyectable, `borrarIndexedDB` en `indexeddb.ts`, conectado en `instancia.ts`). |

**No aplicado:** el ítem 3 (botón «Actualizar datos»), porque `diseno-ui.md` 5.18 fija «Actualizar». El ítem 1 se aplicó con una variante:
el cuerpo conserva «reinicie la demo» (ahora se puede cumplir). El ítem 15 se verificó contra el código: la fecha es la del parte
(`Parte.fecha`), no la de envío; en la corrección es `desde`.

**API para la vista (botón del paso 3.4).** En fase `error`: `const r = await app.reiniciar()`. Devuelve `ok(null)` y la fase
queda `lista` (la vista se redibuja sola), o `fallo` con `r.error.mensaje` (`noPudoReiniciarDesdeError`) y la fase sigue en `error`:
mostrar ese mensaje junto al botón «Recargar la página». Mientras reinicia la fase pasa por `arrancando`.

**Verificación.** `npm test` 675 tests (antes 655), `npm run check` 0 errores, `npm run buscar` sin hallazgos, `npm run build` verde.

## 18/11/2026 (tarde) — Rama `interfaz-etapa-0`: Etapa 0, pasos 2.4 a 2.6 y 3.1 (trabajo autónomo)

**Qué se hizo.** Etapa 0 (proyecto Svelte 5 con Vite, CSP, CI, medición), persistencia sobre IndexedDB con la misma suite de
contrato, arranque, aviso entre pestañas y el estado reactivo de la aplicación, todo con TDD. Sin pantallas ni estilos
(`App.svelte` sigue siendo un `h1`). Decisiones en `docs/diseno.md` (sección 16, última parte) y `docs/stack.md` (S3 resuelta).

| Paso | Commit | Qué quedó |
| --- | --- | --- |
| 0.1 y 0.2 | `cfd5a95` | Dependencias exactas, `vite.config.ts` con Svelte, `svelte.config.js` (runes en todo), `index.html`, `main.ts`, `App.svelte`. **S3:** TypeScript 6.0.3 (ver abajo). `npm run check` detecta un error de tipo plantado en un `<script lang="ts">`. |
| 0.3 | `db51887` | `public/_headers` con la CSP de `stack.md`, test que la fija (si alguien agrega `unsafe-*` falla), `scripts/servir-dist.mjs` para ver `dist/` con las cabeceras. Verificado en Chrome (abajo). |
| 0.4 | `5845f4c` | `.github/workflows/ci.yml` (check, test, matriz TZ, build, búsquedas, audit) y `scripts/buscar-prohibidos.mjs` (7 reglas, probadas plantando cada una). **Sin probar: no hay remoto.** |
| 0.5 | (en este registro) | Compilación vacía (`App` con un `h1`): **22,86 KB de JS (9,29 KB con gzip)** y sin CSS. Con el componente de prueba de la CSP: 28,81 KB (11,52 KB gzip) y 0,13 KB de CSS. Con todo lo de hoy (dominio, generador, IndexedDB, arranque, estado): **96,37 KB de JS (31,69 KB gzip)**; el tope propuesto es 100 KB gzip. |
| 2.4 | `b4e5d3e` | `persistencia/indexeddb.ts`. La suite de contrato pasa con las dos implementaciones (32 tests: el contrato más estructura, atomicidad, repositorio cerrado, fábrica que lanza). |
| 2.5 | `2d39abf` | `persistencia/arranque.ts`: D4, D5 (dos caminos), D6 (`reiniciarDemo`), D7, D8 y D11 (`cambiarPerfil`). 22 tests. |
| 2.6 | `1924e0b` | `persistencia/pestanas.ts`: D9 con canal inyectable y mensajes validados. 11 tests (uno con el `BroadcastChannel` real de Node). |
| 3.1 | `70789a5`, `85944f7` | `estado/reloj.ts` (único `new Date()`), `ids.ts`, `enrutador.ts` (49 tests), `ubicacion.ts`, `app.svelte.ts` (33 tests y 3 de reactividad con `$effect.root`) e `instancia.ts`. `main.ts` ya arranca la aplicación real. |

**Versiones elegidas** (fecha de publicación; hoy es 18/11/2026; todas con más de 14 días, que es lo que pide `stack.md`).

| Paquete | Versión | Publicada | Scripts de instalación |
| --- | --- | --- | --- |
| `svelte` | 5.57.3 | 26/10/2026 | ninguno (la 5.58.0 salió hoy: descartada) |
| `@sveltejs/vite-plugin-svelte` | 7.3.1 | 23/09/2026 | ninguno |
| `svelte-check` | 4.7.8 | 01/11/2026 | ninguno |
| `fake-indexeddb` | 6.2.7 | 30/10/2026 | ninguno (la 6.2.8 es del 08/11: 10 días, descartada por la regla de 14) |
| `typescript` | 6.0.3 | 16/04/2026 | ninguno (**baja** desde 7.0.2, ver S3) |

Árbol: 94 paquetes en el lockfile (antes, 88: salen los 20 binarios de TypeScript 7 y entran 26 de Svelte y sus herramientas; 20 son de producción, todos del compilador y el *runtime* de Svelte). Solo `fsevents` (opcional, macOS, ya estaba) tiene `hasInstallScript`.
`package-lock.json` versionado; `npm ci --ignore-scripts` limpio y los 655 tests verdes tras borrar `node_modules`.
Dos dependencias indirectas de Svelte salieron ayer (`esrap` 2.4.2 y `vitefu` 1.1.4): se fijaron en 2.4.0 (26/09) y 1.1.3 (01/04)
con `npm install --before=2026-11-11` sobre esas dos entradas del lockfile. **Quedan 3 paquetes ya existentes con menos de 7 días** (de
`vite` y `rolldown`: `@rolldown/pluginutils` 1.1.1, `postcss` 8.5.33 y `@jridgewell/resolve-uri` 3.1.3, del 13/11): no se tocaron porque
venían en el lockfile anterior.

**S3 (TypeScript 7 y `svelte-check`).** No son compatibles: `svelte-check` 4.7.8 declara `typescript ^5 || ^6` (npm lo rechaza con 7.0.2 por
resolución de pares) y, forzándolo con `--legacy-peer-deps`, se detiene con "TypeScript 7 support currently requires both TypeScript 7 and
TypeScript 6 installed in your project, and requires using the --tsgo or --tsgo-experimental-api flag". La Demo 2 queda con TypeScript 6.0.3
(sin alias ni opciones experimentales); `tsc` y los 655 tests no notaron la diferencia. Si Matías prefiere TypeScript 7 en el repo, la
alternativa es `typescript@~6` más `@typescript/native@npm:typescript@7` y `svelte-check --tsgo` (un paquete más y una opción experimental).

**CSP con Svelte (0.3), medido en Chrome** con `dist/` servido con las cabeceras de `_headers` (y un registro de `securitypolicyviolation`):
sin plantar nada, **0 violaciones** y la marca con `style:grid-column-start={3}` cae en la columna 3 (el atributo se asigna por CSSOM);
con un `style="color: red"` estático plantado, **1 violación `style-src-attr`**. El CSS de los componentes salió a `assets/*.css`, sin
`<style>` en línea. Hallazgo: Chrome igual aplicó el estilo plantado (probablemente porque Svelte clona la plantilla y el clon no se bloquea; no se investigó más), así que la
regla "nada de `style` en el marcado" sigue valiendo por Firefox y Safari y se vigila por la CSP, no por mirar si se ve. El componente de
prueba se borró. La consola de la herramienta de navegador no capturó las violaciones de carga: por eso se midió con un oyente propio.
Prueba de punta a punta en Chrome con la compilación real: IndexedDB creada en la versión 1 con 24 unidades, 140 documentos, 1.044
partes y 1.112 eventos (como pide el diseño); recargar no regenera nada; `#/unidad/zk214bd` queda como `#/unidad/ZK214BD`.

**Verificación.**

- `npm test`: 655 tests en 31 archivos, verdes (antes: 490 en 22). `npm run test:tz`: los 655 en `UTC`, `Asia/Tokyo` y `America/Los_Angeles`.
- `npm run typecheck` y `npm run check` (svelte-check sobre 232 archivos y tsc): 0 errores, 0 advertencias. `npm run build`: ok.
- `npm run buscar`: sin hallazgos (sin `{@html}`, sin `Math.random` en `src/lib`, sin reloj fuera de `reloj.ts`, sin transiciones, sin nombres de terceros ni correos personales).
- `npm audit`: **0 vulnerabilidades** al cierre. Durante la instalación aparecieron 7 altas, todas por `picomatch` (GHSA-fc5q-39xc-vjpf, la misma excepción
  anterior, que subió de 5 a 7 porque `svelte-check` y el plugin de Svelte cuelgan de `fdir` y `vite`); después el aviso dejó de alcanzar a la 4.0.7 y
  el CI volvió a `--audit-level=high`. Si reaparece, se documenta con fecha.
- Mutaciones: la CSP con `unsafe-inline` hace fallar el test de cabeceras; cada regla de `buscar` detecta lo plantado.

**Decisiones que no estaban en la especificación** (están en `docs/diseno.md`, sección 16):

1. Los almacenes de IndexedDB llevan clave automática más un índice único `id` (el orden de inserción es el de lectura).
2. `reemplazarTodo` es una sola transacción que también reemplaza el historial; no hace falta `vaciar` antes.
3. Cualquier falla del almacenamiento en el arranque cae al modo memoria (D8); D7 también cubre un `meta` dañado; el perfil se conserva en D5 y D6 pero no en D7.
4. "Preparando…" se pide si todo el arranque pasa de 300 ms.
5. El aviso entre pestañas no lleva datos; se manda tras cada escritura exitosa; en modo memoria no hay canal.
6. El perfil decide la pantalla: el conductor no ve las del encargado (redirección al inicio) y viceversa; una ruta mal escrita es un error de pantalla en cualquier perfil.
7. `EstadoApp` rechaza con `sin-permiso` los comandos del encargado cuando el perfil es conductor (defensa extra, no seguridad).
8. Los ids nuevos salen de `crypto.getRandomValues`; en los tests, `vite.config.ts` compila Svelte en modo cliente para que `$effect` funcione.

**Lo que quedó sin resolver o a confirmar.**

- CI (0.4) sin probar: no hay remoto. Hay que correrlo en el primer *push*.
- Matías confirma S3: TypeScript 6.0.3 en vez de 7.0.2 (o la vía oficial con alias).
- Todavía vacío y de la vista (3.3 y 3.4): `document.title`, el foco al `h1`, refrescar `hoy` (`actualizarReloj` cada minuto y al volver a la pestaña) y los botones
  "Actualizar" y "Reiniciar demo". El estado ya expone lo necesario: `titulo`, `versionDePantalla`, `hayCambiosEnOtraPestana`, `avisos`, `fase`, `errorDeArranque`.
- Al leer un `$derived` fuera de un efecto, Svelte lo recalcula en cada lectura (los tests lo notaron con `app.alertas`): en las pantallas se lee dentro del marcado, que sí lo guarda.
- Si el arranque falla de verdad (fase `error`), el botón "Reiniciar demo" de 5.19 no tiene almacenamiento donde actuar: la vista solo puede pedir recargar.
- Si dos pestañas escriben a la vez, el `secuencia` de los eventos puede repetirse (B9); los ids no.
- `redactor-ux` no revisó los textos nuevos (avisos y errores del estado).
- Los otros pendientes del registro anterior siguen igual (B6, B10, B11 y la revisión de `redactor-ux` sobre `textos.ts`).

## 18/11/2026 (noche) — Correcciones de la revisión del dominio (trabajo autónomo)

**Qué se hizo.** Se corrigieron los 6 hallazgos medios y los bajos triviales de `docs/revision-dominio.md` (revisor-codigo),
con TDD: cada test se vio fallar antes del código. Decisiones completas en `docs/diseno.md`, sección 16. **A confirmar por
Matías: M1, M3 y M4** (están marcadas así en el diseño).

**Actualización.** Matías confirmó M1, M3 y M4 el 18/11/2026 (`docs/diseno.md`, sección 16). Las filas «a confirmar» de abajo se conservan como estaban cuando se escribió esta entrada.

| Hallazgo | Commit | Resultado |
| --- | --- | --- |
| M5 | `47760e1` | `npm test` corre por defecto con `TZ=Asia/Tokyo` (fijada en `vite.config.ts`); test que lo verifica; `.github/workflows/ci.yml` (Actions no corre hoy en la cuenta: no se forzó). Se incluyó el informe de revisión del dominio (luego retirado del repositorio: informe interno, no publicado). |
| M2, B1, B4 | `8924617` | Contexto validado (lanza error), `parsearInstante` estricto con `Z` obligatoria, `sumarDias` solo con enteros, recorrido de 2000 a 2100. La validación encontró un test con `hoy` y `ahora` incoherentes (se corrigió). |
| M6 | `ca35b1a` | Copias de `checklist`, `otraNovedad` y `titular`; `datos` de los eventos con copia profunda. |
| M1 (a confirmar; **confirmada por Matías el 18/11/2026**) | `eff6eff` | P9 con los documentos como estaban en la fecha del parte; test con C18 en orden inverso. El generador carga y emite documentos antes del primer parte. |
| M3 (a confirmar; **confirmada por Matías el 18/11/2026**) | `38800a9` | Corrección de kilometraje anterior a registros cargados: se rechaza (`km-correccion-anterior`). |
| M4 (a confirmar; **confirmada por Matías el 18/11/2026**) | `7775928` | Habilitación de ingreso que el proyecto no exige: alerta `baja`, fuera de la insignia, coherente con `aptitud`. |
| Bajos | `ef349af` | Tests de B2 (cada uno con su mutación), textos a `textos.ts` (B8), `validarLitros` y `abreviar` únicos, `enviadoFueraDeTermino` eliminada, motivo abreviado en el evento de A3, C10 a las 00:00 de Argentina. |
| Publicabilidad | `3934460` | `CLAUDE.md` sin la referencia al empleador ni a la carpeta de terceros; `textoEmpresa` rotula el CUIT como ficticio; README sin afirmar la serie de patentes. El historial no se reescribió. |

**Verificación.**

- `npm test`: 490 tests en 22 archivos, verdes (antes: 438 en 19).
- `npm run test:tz`: los 490 en `UTC`, `Asia/Tokyo` y `America/Los_Angeles`.
- `npx tsc --noEmit`: sin errores.
- `npm audit --audit-level=critical`: sin críticas (las 5 altas por `picomatch` siguen siendo la excepción documentada).
- Mutaciones repetidas: el uso de la hora local en `hoyEnArgentina` ahora lo detecta `npm test` a secas (3 fallos sin `TZ`);
  las 8 mutaciones nuevas de bordes (500 caracteres, `emitido === vence`, litros 200, `abreviar`, desempate por id, parte antes
  que corrección, `vence >= fecha`, `desde <= fecha`) mueren con al menos un test.
- Contenido del ejemplo: cambió (documentos cargados antes del primer parte, C10 a las 00:00), hash de D1 actualizado en el test.

**Decisiones para Matías.**

1. **M1:** un documento ampara la fecha del parte si vence ese día o después y ya existía (emisión, o carga si no hay emisión,
   ese día o antes). Una renovación tardía sin emisión no borra la advertencia. Costo: si el encargado carga una renovación
   atrasada pero escribe la emisión real, el parte de esos días no advierte.
2. **M3:** se rechaza una corrección de kilometraje con fecha anterior a partes u otras correcciones ya cargadas, en vez de
   aceptarla sin efecto o recalcular todo.
3. **M4:** la alerta de un documento que el proyecto no exige es `baja` (no crítica) y no cuenta en la insignia; no se agregó un
   mecanismo de descarte porque el diseño no lo tiene.
4. Pendientes que no se tocaron por ser de diseño: tipos con marca, uniones discriminadas de eventos y errores (B4), B5, B6, B9, el
   correo del autor en el historial (B11) y la serie de patentes (B10). Están listados al final de la sección 16 del diseño.

## 18/11/2026 — Etapa 1 completa y pasos 2.1 a 2.3 (trabajo autónomo)

**Qué se hizo.** Lógica de dominio en TypeScript puro y sin DOM, con TDD (cada archivo de pruebas se escribió y se vio
fallar antes que el código), datos de ejemplo con semilla y repositorio en memoria con su suite de contrato.

| Paso | Qué quedó | Archivos principales |
| --- | --- | --- |
| Base | `package.json` (typescript 7.0.2, vite 8.3.5, vitest 5.1.0, versiones exactas, sin Svelte), `tsconfig.json` estricto igual al de la Demo 1, scripts `test`, `test:tz`, `typecheck` | `package.json`, `tsconfig.json`, `vite.config.ts`, `scripts/test-tz.mjs` |
| 1.1 | Fechas civiles e instantes, T1 a T7 | `dominio/fechas.ts` |
| 1.2 | Clasificación de vencimientos, V1 a V8 (todos los bordes y la propiedad de −400 a 400) | `dominio/vencimientos.ts` |
| 1.3 | Documento vigente, requisitos, faltantes, orden por urgencia, V9, V12, V13, V16, V17 | `dominio/vencimientos.ts` |
| 1.4 | Patentes, U1 | `dominio/patente.ts` |
| 1.5 | Kilometraje, K1 a K4 y K6 a K9 (K5 se prueba en 1.9) | `dominio/kilometraje.ts` |
| 1.6 | Parte: P2, P4, P5, P9 a P11, P13, D11 (borrador vacío), advertencias K6, K7 y P9 | `dominio/parte.ts` |
| 1.7 | Aptitud, A1, A2, A8, y rótulos de novedades | `dominio/aptitud.ts`, `dominio/novedades.ts` |
| 1.8 | Alertas: los ocho tipos, gravedad, orden (V16, N5), exclusiones (V14, P6), resumen y puntos del horizonte | `dominio/alertas.ts` |
| 1.9 | Los 14 comandos con eventos exactos (H1), A3 a A7, K5, N1 a N3, P1 a P3, P7, P8, V10, V11, U1 a U7, D11, historial (H3, H4) e invariante A3 después de cada comando | `dominio/comandos.ts`, `estado.ts`, `historial.ts`, `validacion.ts` |
| 1.10 | Textos de errores, resúmenes de eventos y textos de estado de las pantallas, con singular y plural | `dominio/textos.ts` |
| 2.1 | `mulberry32`, primeros cinco valores de la semilla 20261118 fijados (calculados aparte con la implementación de referencia) | `datos/azar.ts` |
| 2.2 | Generador con los casos C01 a C20 (un test por caso), coherencia del ejemplo (protagonista 4, 19 de 23, 2/4/3/2, 6 de operación, 4 críticas), D1 con hash fijado, D3; también con otras fechas base | `datos/generador.ts`, `datos/cuit.ts` |
| 2.3 | Interfaz `Repositorio`, `RepositorioMemoria` y suite de contrato reutilizable (índices únicos, transacción única, falla inyectada sin cambios a medias, historial solo de agregado comprobado por `tsc`) | `persistencia/repositorio.ts`, `persistencia/memoria.ts`, `tests/contrato-repositorio.ts` |

**Verificación.**

- `npm test`: 438 tests en 19 archivos, todos verdes (antes: 0, el repositorio solo tenía el diseño).
- `npm run test:tz`: los mismos 438 en las tres zonas (`UTC`, `Asia/Tokyo`, `America/Los_Angeles`). Un test
  (`tests/zona-horaria.test.ts`) comprueba que la zona pedida de verdad está activa, para que la matriz no pruebe nada en falso.
- `npx tsc --noEmit`: sin errores. No hay `npm run build` todavía: no hay aplicación (queda para la Etapa 3, con Svelte).
- Búsqueda en `src/`: ninguna llamada a métodos locales de `Date`, ningún constructor `new Date(...)`, ningún uso del azar del
  sistema ni `toLocale`. El dominio usa `Date.UTC`, `Date.parse` e `Intl.DateTimeFormat` con zona explícita.
- Búsqueda de nombres reales, dominios o correos en todo el repositorio (sin `node_modules`, `dist` ni `.git`): sin resultados.
- Generar la flota completa (24 unidades, 1.044 partes, 1.112 eventos) tarda unos 14 ms en Node, medido como promedio de 20 corridas.
- Mutación de prueba: si `RepositorioMemoria.escribir` confirma antes de validar, fallan 5 tests de la suite de contrato.
- `npm audit`: 5 altas, todas por `picomatch` (ReDoS en extglobs, GHSA-fc5q-39xc-vjpf), sin versión corregida publicada.
  Es la misma excepción de la Demo 1; son herramientas de desarrollo y no entran en el paquete. Volver a mirar cuando salga el parche.

**Decisiones que no estaban en el diseño.** Están todas en `docs/diseno.md`, sección 16. Las que más pesan:
`nuevoId` en el contexto; gravedad `critica`/`media`/`baja`; categorías de aptitud (fuera de servicio se cuenta aparte);
línea de tiempo de kilometraje con desempate por instante cuando una corrección cae el mismo día que un parte; P9 evaluado a la
fecha del parte con el documento vigente de hoy; borradores con el texto sin recortar hasta enviar; definición de "borrador
vacío" para D11; `resolverNovedad` con `volverAServicio` reutilizando A4; guardas de V9 y V10 en `corregirDocumento`;
"24 unidades" = 23 activas + 1 de baja.

**Huecos o contradicciones del diseño encontrados.**

1. "24 unidades (14 + 4 + 3 + 2 + 1 de baja)" suman 24 solo si la de baja se cuenta aparte (23 activas); coincide con "19 de 23".
2. P5 dice que un borrador anterior a hoy "se puede completar y enviar mientras cumpla P2", pero la alerta no desaparece
   cuando el borrador pasa de 7 días: queda hasta que se descarta. P2 también impide guardar cambios en ese borrador.
3. K3 y K5 no dicen qué pasa si la corrección "desde F" cae el mismo día que un parte: se resolvió por instante
   (la corrección cuenta como anterior para el parte de F).
4. P9 no aclara si el documento se mira "como estaba entonces" o "como está hoy": se usa el vigente de hoy (V9).
5. `diseno.md` 5.1 llama "Revisión técnica (VTV/RTO)" al documento y la sección 7 lo escribe "Revisión técnica": se usa el
   corto en las alertas y las siglas se dejan para la interfaz.
6. A8 habla de unidades que "no pueden salir" y de unidades "fuera de servicio" como dos grupos; A1 define "no puede salir"
   para las dos. `aptitud` devuelve las dos categorías por separado.
7. El diseño dice "reloj inyectado `ahora: () => Date`" y el contexto de comandos `{ hoy, ahora, autor }`: el dominio recibe el
   resultado ya calculado (`hoy` y `ahora` como texto) y el reloj (Etapa 3) será el único lugar con `new Date()`.
8. V11 fija el piso del vencimiento en 2000-01-01, pero T4 ya rechaza años anteriores a 2000: el piso no tiene mensaje propio.
9. `stack.md` pide `npm run check` (`svelte-check`) y `npm run build`: todavía no existen porque falta la decisión S1.

**Lo que falta.**

- Paso 2.4 (IndexedDB con la misma suite de contrato), que necesita la decisión S2 (`fake-indexeddb`).
- Pasos 2.5 y 2.6 (arranque D4 a D8 y D11, aviso entre pestañas D9): dependen de 2.4 para las pruebas con la fábrica real, pero
  se pueden empezar contra `RepositorioMemoria`.
- Etapa 0 (Svelte, CSP, CI) y Etapas 3 a 6: esperan las decisiones S1 a S4.
- Revisión de `redactor-ux` sobre `textos.ts` (la de `revisor-codigo` sobre `dominio/` se hizo el 18/11: ver la entrada de arriba).
- Verificar antes de publicar el dato de la serie de patentes (todas empiezan con Z) y que los nombres de proyectos no
  coincidan con proyectos mineros reales.

## 18/11/2026 (noche, 7) — Verificación final y cierre de la tanda

- `verificador` (independiente): 695/695 tests (también en UTC, Tokio y Los Ángeles), check 0, buscar sin hallazgos, contraste 158/0, `npm audit` 0, build sin `muestras.html`. Confirmados con Playwright los altos y medios corregidos (toque, Esc, bloqueo durante el reinicio, anuncio repetido, orden de foco, plazo de 8 s, listas dañadas → D7). Sin regresiones.
- `d85e3a3`: la concordancia de género del parte en "Cómo funciona" quedó corregida ("Está pensado").
- Docs: fila 3.4 de `plan.md` sin "pantalla de error" (se quitó en `8f38ed9`), 158 mediciones, README al día, ruta local quitada del informe de QA.
- **Antes de publicar el repo:** `scripts/buscar-prohibidos.mjs` contiene literalmente los patrones prohibidos (nombra a terceros): moverlos a un archivo no versionado o a una variable de entorno de CI. *(Hecho el 25/11/2026: ver la última entrada.)* Historial nuevo (B11) por el correo de autor.
- Pendiente: humo de interfaz con Playwright en CI (no hay tests de componentes; la vista se verificó a mano); probar Firefox, Safari real y un lector de pantalla; Esc no cierra si el foco quedó en `body` dentro del diálogo (caso forzado, sin impacto práctico); fechas inválidas en datos guardados pasan sin aviso D7 (las pantallas 4.x deben tolerarlas).

## 18/11/2026 (noche, 8) — Paso 4.1 (lógica): Horizonte, tres variantes

**Qué se hizo.** `src/lib/dominio/horizonte.ts` (módulo puro) y `tests/horizonte.test.ts` (29 tests, escritos primero y vistos fallar). Sin
cambios en estilos ni en componentes. `dominio/textos.ts` suma `TEXTO_HORIZONTE` (rótulos de la caja y texto de pista vacía); el `aria-label`
sigue saliendo de `textoHorizonte` (ya existía y coincide letra por letra con 5.6). Las decisiones que la especificación no cubría están en
`diseno.md`, sección 16, última viñeta.

**API para el maquetador** (todo desde `src/lib/dominio/horizonte.ts`):

```ts
horizonteCompleto(r: { alertas: Alerta[] }, op?: { maxApiladas?: number }): Horizonte          // centro de alertas
horizonteDeUnidad(r, unidadId: string, op?): Horizonte                                         // ficha (variante "mediana")
horizonteMinimo(r, unidadId: string, op?): Horizonte                                           // columna de la flota
// `r` es el resultado de calcularAlertas: en un componente, `app.alertas` (es null hasta que termina el arranque).

interface Horizonte {
  variante: "completa" | "mediana" | "minima";
  columnas: { dia: number; columna: number /* día+1, 1..31 */; marcas: MarcaHorizonte[] /* de abajo hacia arriba */;
              total: number; ocultas: number }[];                       // solo los días con marcas, en orden
  vacio: boolean;                                                        // sin marcas
  vencidos: number; porGrupo: Record<"vencidos" | "7" | "15" | "30", number>;
  cajaVencidos: { rotulo: string; cifra: number; conAlerta: boolean } | null;   // null en la mínima; conAlerta=false -> gris con "0"
  escala: readonly { etiqueta; etiquetaCorta; dia; columna; linea: boolean }[];  // rótulos 5.6; [] en la mínima
  textoVacio: string | null;      // "Nada vence en los próximos 30 días" (centrado sobre la pista vacía)
  etiquetaAria: string | null;    // para role="img" aria-label; null en la mínima
  ocultoAAyudas: boolean;         // true en la mínima: aria-hidden="true"
}
interface MarcaHorizonte { alertaId: string; dia: number; tramo: "semana" | "quincena" | "mes"; gravedad: "critica" | "media" | "baja"; hueca: boolean }
// También: TRAMOS_PISTA (semana 1/9, quincena 9/17, mes 17/32: líneas de grilla con fin exclusivo, para el borde inferior), tramoDeDia(dia),
// ESCALA_COMPLETA, ESCALA_MEDIANA, MAX_APILADAS.
```

```svelte
<script lang="ts">
  import { horizonteCompleto } from "../lib/dominio/horizonte.ts";
  let { app } = $props();
  const h = $derived(app.alertas === null ? null : horizonteCompleto(app.alertas));
</script>
{#if h}
  <div class="pista" role="img" aria-label={h.etiquetaAria}>
    {#each h.columnas as c (c.dia)}
      <div class="columna" style:grid-column-start={c.columna}>
        {#each c.marcas as m (m.alertaId)}
          <span class="marca" data-tramo={m.tramo} class:hueca={m.hueca}></span>
        {/each}
      </div>
    {/each}
    {#if h.textoVacio}<span class="vacio">{h.textoVacio}</span>{/if}
  </div>
{/if}
```

El color de la marca sale de `data-tramo` (`--c-semana-r`, `--c-quincena-r`, `--c-mes-r`), no de la gravedad (la gravedad se expone por si
la ficha o el filtro la quieren). Sin `style="…"` en el marcado: solo la directiva `style:grid-column-start`.

**Verificación.** `npm test`: 724 tests (695 + 29), verdes también con `npm run test:tz` (UTC, Asia/Tokyo y America/Los_Angeles); `npm run check`: 0 errores; `npm audit`: 0 vulnerabilidades; `npm run build` y `npm run buscar` sin hallazgos. Pendiente para el maquetador: forced-colors y CSP en el navegador, y el horizonte mediano de «Cómo funciona» (se puede alimentar con `horizonteCompleto` sobre el estado del generador).

## 18/11/2026 (noche, 9) — Paso 4.1 (pantalla): Horizonte, tres variantes (maquetador)

**Qué se hizo.** `src/componentes/Horizonte.svelte` (un solo componente, prop `horizonte`: lo que devuelven `horizonteCompleto`, `horizonteDeUnidad` y `horizonteMinimo`). Sin cambios en la lógica ni en los tokens. La página de muestras (`muestras.html`, solo desarrollo) suma el panel «Horizonte de vencimientos»: la completa con el ejemplo del generador (semilla 20261118, hoy 2026-11-18) y la lista de vencimientos al lado para comparar, la completa vacía, con solo vencidos y con seis el mismo día (aro hueco), la mediana (con y sin marcas), la mínima dentro de una tabla y la completa en un contenedor de 20 rem.

**Decisiones donde la especificación no dice (diferencias a revisar).**
- La mediana crece si hace falta: pista de 2 rem como mínimo, pero 4 marcas apiladas miden 38 px. La mínima no dibuja nada si no hay marca (la celda sigue sin horizonte, 5.9).
- El rótulo «30 días» termina donde termina la pista (no empieza en la columna 30, no cabría); la línea punteada sí queda al comienzo de esa columna.
- Con la caja arriba (menos de 30 rem) la caja es una fila: rótulo a la izquierda y cifra a la derecha. El texto de pista vacía lleva fondo de pista para tapar las líneas punteadas.
- Colores forzados: marcas, línea de «Hoy», líneas punteadas y bordes en `CanvasText`; aro hueco con fondo `Canvas`; tramos sólido, discontinuo y punteado. Sin colores nuevos: `npm run contraste` queda en 158 mediciones, 0 fallan.
- La posición sale de `style:grid-column-start`/`-end` (Svelte lo asigna por CSSOM: el atributo aparece en el DOM, pero la CSP no da violaciones). No hay `style="…"` en el marcado.

**Pendiente.** No se enchufó en ninguna pantalla: la completa va en el centro de alertas (4.2), la mediana en la ficha (4.4) y la mínima en la flota (4.3). El horizonte mediano de «Cómo funciona» (5.17) falta: necesita un texto de epígrafe (`redactor-ux`) y decidir de dónde salen los datos del ejemplo (no hay una unidad con varios vencimientos en el generador: haría falta lógica o un ejemplo fijo).

**Verificación.** Compilación con `muestras.html` como entrada extra (config temporal, borrada) servida con las cabeceras de `public/_headers`; Playwright (Chromium) en claro y oscuro a 360 y 1280 px: 72 comprobaciones, 0 fallas. Marcas = días de la lista (0, 1, 5, 7, 8, 12, 15, 16, 30) y tramo correcto; `aria-label` idéntico a 5.6; mínima `aria-hidden`, 64 x 12 px; caja arriba/izquierda según el ancho; «30 días» pasa a «30» a menos de 24 rem; sin desplazamiento horizontal; consola sin errores ni avisos; `securitypolicyviolation` sin eventos; forced-colors emulado legible. `npm test`: 724 verdes; `npm run check`: 0; `npm run build`: sin `muestras.html`; `npm run buscar`: sin hallazgos. No probado: Firefox, Safari, lector de pantalla real, contraste alto de Windows real.

## 18/11/2026 (noche, 10) — Paso 4.2 (lógica): centro de alertas y diálogos Renovar y Cargar documento

**Qué se hizo.** Tres piezas, todas sin DOM y sin reglas nuevas (reusan `calcularAlertas`, `aptitud`, los comandos y `textos.ts`): `src/lib/estado/centro-alertas.ts`
(lo que dibuja 6.1: protagonista, operación diaria, vencimientos con filtros, detalle), `src/lib/dominio/formulario-documento.ts` (contexto, comando y errores por campo de los
dos diálogos) y dos métodos nuevos más un derivado en `EstadoApp`. `textos.ts` suma los textos (`TEXTO_CENTRO`, `TEXTO_RENOVAR`, `TEXTO_CARGAR` y funciones). 70 tests nuevos, escritos
primero (`tests/centro-alertas.test.ts` 35, `formulario-documento.test.ts` 21, `centro-alertas-app.test.ts` 13, uno en `reactividad.svelte.test.ts`); tres mutaciones comprobaron que los tests detectan el error.
Las decisiones que la especificación no cubría están en `diseno.md`, sección 16, última viñeta (nueve puntos). No se tocaron estilos ni componentes.

**API para el maquetador.**

```ts
// En un componente: `app` es el EstadoApp (estado/instancia.ts). Todo es solo lectura salvo los dos métodos de guardado.
app.centroDeAlertas: CentroDeAlertas | null            // se recalcula con cada comando y al cambiar el día; null hasta que termina el arranque

interface CentroDeAlertas {
  titulo: string;                                       // "Centro de alertas"
  encabezado: { linea: string; bajada: string };        // "Hoy es miércoles 18/11/2026 (hora de Argentina) · Logística Andina Demo S.A. · 23 unidades"
  protagonista: { titulo; cifra: number; palabra: "unidad" | "unidades"; tono: "critico" | "vigente"; textoLector: string;
                  items: { unidadId; patente; patenteTexto; interno: "Int. 07"; categoria: "no-puede-salir" | "fuera-de-servicio";
                           motivo: string; motivos: string[]; href: string }[];          // hasta 6, ya en orden
                  masEnLaFlota: { texto: "Ver las 9 en la flota"; href } | null; disponibles: string };
  operacion: { titulo; total; rotuloTotal: "6 pendientes";
               filas: { tipo; cifra; texto; gravedad; idGrupo: string }[];               // solo tipos con pendientes; idGrupo = id del h3 del detalle
               vacio: string | null;                                                     // "Sin pendientes de operación."
               barraEstado: { intro; accion; aclaracion } };
  vencimientos: { titulo; total; rotuloCantidad: "próximos 30 días · 11"; horizonte: Horizonte;   // el de horizonteCompleto, ya armado
                  filtros: { id: "todos" | "vencidos" | "7" | "15" | "30"; etiqueta; cantidad }[];
                  grupos: { id; tono; titulo; tituloConCantidad; cantidad; filas: FilaVencimiento[] }[];   // los 4, también vacíos
                  textoVacio: string };
  detalle: { titulo; grupos: { tipo; idGrupo; titulo; tituloConCantidad; cantidad; filas: FilaOperacion[] }[] };   // solo con pendientes
}
// FilaVencimiento: { alertaId, tipo, grupo, gravedad, estado, documento, numero | null, titular: TitularDeFila, proyecto | null, vence: "17/11/2026" | "—",
//                    accion: { tipo: "renovar" | "cargar", etiqueta, nombreAccesible, documentoId | null, titular, tipoDocumento } }
// TitularDeFila:  { tipo: "unidad", patente, patenteTexto, interno, descripcion, href } | { tipo: "conductor", nombre, detalle: "Conductor", unidad: { patenteTexto, href } | null }
// FilaOperacion:  { alertaId, gravedad, estado, texto, unidad: { unidadId, patente, patenteTexto, interno, href }, fecha,
//                   accion: { tipo: "resolver", etiqueta, nombreAccesible, novedadId } | { tipo: "abrir-parte" | "ver-ficha", etiqueta, nombreAccesible, href } }

// estado/centro-alertas.ts
vencimientosVisibles(panel: PanelVencimientos, filtro: IdFiltro): { grupos: GrupoVencimientos[]; textoVacio: string | null; anuncio: string }
//   el filtro es estado de la vista ($state "todos"); `anuncio` va al role="status" ("Mostrando 4 de 11 vencimientos.")

// dominio/formulario-documento.ts (para abrir un diálogo con los datos de la fila)
contextoDeRenovar(estado, documentoId, hoy): { documentoId, titulo, contexto, nombreDocumento, titularEtiqueta, valoresIniciales, primario } | null
contextoDeCargar(estado, titular, tipoDocumento): { titular, tipoDocumento, titulo, nombreDocumento, titularEtiqueta, valoresIniciales, primario } | null
//   null = no hay diálogo que abrir (el documento ya no es el vigente / ya existe). valoresIniciales: { numero, emisor, vence, emitido }, todos texto.
CAMPOS_DOCUMENTO = ["numero", "emisor", "vence", "emitido"]     // orden del formulario y del resumen de errores

// Guardar (EstadoApp). Nunca rechazan: devuelven el resultado.
app.renovarDocumento(documentoId: string, valores: ValoresDocumento): Promise<ResultadoGuardadoDocumento>
app.cargarDocumento(titular: Titular, tipoDocumento: TipoDocumento, valores: ValoresDocumento): Promise<ResultadoGuardadoDocumento>
type ResultadoGuardadoDocumento =
  | { ok: true; mensaje: string; foco: "titulo-del-panel" }      // mensaje -> barra de estado del panel: "Seguro de ZK 214 BD renovado. Quedan 10 vencimientos."
  | { ok: false; errores: ErroresDeFormulario };
interface ErroresDeFormulario {
  porCampo: Partial<Record<"numero" | "emisor" | "vence" | "emitido", string>>;   // aria-invalid + mensaje sobre cada campo
  lista: { campo; mensaje }[];                                                    // el mismo contenido en orden de formulario, para el resumen (5.15)
  general: string | null;                                                         // error sin campo (guardado, documento ya reemplazado, sin permiso): arriba del formulario
}
```

```svelte
<script lang="ts">
  import { app } from "../lib/estado/instancia.ts";
  import { vencimientosVisibles, type IdFiltro } from "../lib/estado/centro-alertas.ts";
  import { contextoDeRenovar } from "../lib/dominio/formulario-documento.ts";

  const c = $derived(app.centroDeAlertas);
  let filtro = $state<IdFiltro>("todos");
  const v = $derived(c === null ? null : vencimientosVisibles(c.vencimientos, filtro));
  let estadoBarra = $state("");                       // barra de estado del panel
  let abierto = $state.raw<ReturnType<typeof contextoDeRenovar>>(null);
  let valores = $state({ numero: "", emisor: "", vence: "", emitido: "" });
  let errores = $state.raw<{ porCampo: Record<string, string>; lista: { campo: string; mensaje: string }[]; general: string | null } | null>(null);
  let titulo: HTMLElement;                            // h2 del panel, tabindex="-1"

  function abrirRenovar(documentoId: string) {
    if (app.estado === null) return;
    abierto = contextoDeRenovar(app.estado, documentoId, app.hoy);
    if (abierto) { valores = { ...abierto.valoresIniciales }; errores = null; }
  }
  async function guardar() {
    if (abierto === null) return;
    const r = await app.renovarDocumento(abierto.documentoId, valores);
    if (!r.ok) { errores = r.errores; return; }      // el diálogo no se cierra y el texto escrito se conserva
    abierto = null;                                    // cerrar el <dialog>
    estadoBarra = r.mensaje;
    titulo.focus();                                    // r.foco === "titulo-del-panel"
  }
</script>
{#if c}
  <p>{c.protagonista.textoLector}</p>
  {#each c.protagonista.items as u (u.unidadId)}<a href={u.href}>{u.patenteTexto}</a> {u.interno} {u.motivo}{/each}
  {#if v}{#each v.grupos as g (g.id)}{#each g.filas as f (f.alertaId)}
    <button onclick={() => f.accion.documentoId && abrirRenovar(f.accion.documentoId)}>{f.accion.etiqueta}</button>
  {/each}{/each}{/if}
{/if}
```

**Cosas para tener en cuenta al maquetar.**
- La clave de `each` de las filas es `alertaId`. Al renovar, la fila vieja desaparece (aunque el documento nuevo siga alertando, tiene otro `alertaId`): por eso el foco va al `h2` del panel. Al **cancelar**, el foco vuelve al botón que abrió el diálogo (eso lo resuelve la vista).
- `Cargar` (faltantes) no trae `documentoId`: se abre con `contextoDeCargar(app.estado, f.accion.titular, f.accion.tipoDocumento)` y se guarda con `app.cargarDocumento(f.accion.titular, f.accion.tipoDocumento, valores)`.
- El texto oculto del botón es `accion.nombreAccesible` («Renovar seguro de ZK 214 BD»).
- «Resolver» (novedades) es del paso 4.4: hasta entonces la fila puede enlazar a `unidad.href`. «Abrir el parte diario» (barra de estado de operación) cambia el perfil a Conductor: usar el diálogo «¿Quién completa el parte?» que ya existe (3.4).
- «Ver las N en la flota» enlaza a `#/flota` sin filtro (el filtro es del paso 4.3).
- Con el perfil Conductor las alertas no se muestran (no ve esa pantalla); si se llegara a guardar igual, el error general dice «Esta acción es solo del encargado…».
- El guardado puede tardar o fallar (D10): mientras espera conviene deshabilitar el botón primario («Guardando…»); con error general el diálogo sigue abierto y el texto escrito sigue en los campos.
- Todo el texto sale de `textos.ts`; no hay `{@html}` ni nada que interprete lo que se escribió.

**Verificación.** Aceptación del plan con el ejemplo del generador (fechaBase 2026-11-18): protagonista «4 unidades», vencimientos 2 + 4 + 3 + 2 = 11, 6 pendientes de operación; renovar C01 deja
3 unidades en «No pueden salir», 10 vencimientos y 3 críticas, sin recargar, con el cambio guardado (documento nuevo y evento `documento-renovado` en una escritura). `npm test`: 794 tests
(724 + 70), verdes también con `npm run test:tz` (UTC, Asia/Tokyo y America/Los_Angeles); `npm run check`: 0 errores; `npm audit`: 0 vulnerabilidades; `npm run build` y `npm run buscar` sin hallazgos.
Pendiente: la pantalla (maquetador), «Resolver» y el filtro de la flota (4.3 y 4.4).

## 18/11/2026 (noche, 11) — Paso 4.2 (pantalla): centro de alertas y diálogos Renovar y Cargar (maquetador)

**Qué se hizo.** `src/componentes/PantallaAlertas.svelte` (las cuatro zonas de 6.1 con el Horizonte completo) y `DialogoDocumento.svelte` (Renovar y Cargar sobre el `Dialogo` base). Piezas nuevas reutilizables:
`ListaTabla.svelte` (5.9: una `table`, tres disposiciones por consulta de contenedor propia, roles explícitos en `lista-roles.ts`), `FiltrosConteo.svelte` (5.8), `ResumenErrores.svelte` (5.15), `EnlaceAccion.svelte`
(enlace con aspecto de botón secundario) y `alertas-aspecto.ts` (tono e ícono por alerta, 5.7). `Panel.svelte` suma `contenidoEstado` (barra de estado con un control adentro, sin `role="status"`). `App.svelte` monta la pantalla en `#/alertas`
y le pasa `pedirConductor` (el diálogo «¿Quién completa el parte?» ya existente). Los textos de presentación están en `textos-marco.ts` (`TEXTO_ALERTAS`, `TEXTO_DIALOGO_DOCUMENTO`) para que los revise `redactor-ux`. Sin cambios en la lógica ni en los tokens.

**Decisiones donde la especificación no dice (diferencias a revisar).**
- No se muestra `encabezado.bajada` (el rótulo «Demo con datos ficticios» y el pie ya lo dicen; 6.1 no la dibuja).
- Cada unidad del protagonista es un solo enlace de fila completa (patente, interno, motivo y `›`) en vez de solo la patente: el `›` sugiere que la fila se toca. Su nombre empieza con «Ficha de ZK 214 BD».
- El título de cada grupo de la lista es un `span` con `role="heading"` `aria-level="3"` y `tabindex="-1"` dentro de la celda de encabezado (un `h3` no puede ir dentro de `th`); es el destino de «Ver».
- «Ver» usa un chevron girado 90° (no hay flecha hacia abajo en el sprite de 5.20). Los íconos de los paneles son `vencido`, `parte`, `calendario` y `novedad`.
- «Resolver» es un enlace a la ficha de la unidad (el diálogo es del 4.4); «Abrir el parte diario» abre el diálogo de conductor y, si se cancela, el foco vuelve a ese botón.
- Emisor no lleva asterisco: el dominio lo acepta vacío (`REGLAS.emisor.min = 0`). El resumen de errores aparece con 2 o más errores (con 1, el foco va al campo); título «Hay N datos para corregir»; sus enlaces no cambian el hash.
- Filtros: cajas sueltas con `--r-2` (no segmentos pegados), con la leyenda «Mostrar» al costado desde 40 rem y arriba por debajo. El anuncio del filtro va en una región `role="status"` aparte y solo cambia al elegir un filtro; los mensajes de guardado van a la barra de estado del panel.
- Si la fila que se abre ya no está pendiente (`contextoDeRenovar`/`contextoDeCargar` devuelven `null`) la barra de estado dice «Ese documento ya no está pendiente. La lista está al día.».
- Colores forzados: franjas en `CanvasText`, filtro elegido en `Highlight`, líneas y marcas como en el Horizonte.

**Verificación.** `npm run build` servido con las cabeceras de `public/_headers` y `npm run dev` (la app real), Chromium con Playwright, 73 comprobaciones en cada uno, 0 fallas: protagonista «4 unidades» (texto de lectores «4 unidades no pueden salir hoy.»), grupos 2 + 4 + 3 + 2 = 11, «6 pendientes» (5 filas y 6 en el detalle), `aria-label` del horizonte;
filtros por clic y con flechas con anuncio «Mostrando 4 de 11 vencimientos.»; «Ver» deja el foco en el título del grupo; Renovar C01 (ZK 214 BD): foco en el primer campo, Esc con el foco de vuelta en el botón, vacío → resumen con 2 errores y foco ahí, 1 error → foco al campo y texto conservado, Esc con cambios pide confirmar,
guardar con Enter → foco en el `h2` «Vencimientos», barra «Seguro de ZK 214 BD renovado. Quedan 10 vencimientos.», 10 filas, protagonista «3 unidades», pestaña «3 críticas»; Cargar la habilitación de ZZD 563 con su mensaje y foco; recorrido completo con Tab (orden lógico, Tab no sale del diálogo); claro y oscuro a 360, 768 y 1280 px sin desborde
horizontal (también el diálogo con errores, con el pie a la vista); consola sin errores ni avisos; sin `securitypolicyviolation`. `npm run check`: 0; `npm test`: 794 verdes; `npm run contraste`: 158 mediciones, 0 fallan; `npm run buscar` y `npm audit`: sin hallazgos. Capturas `alertas-*` en el directorio de trabajo temporal.
No probado: Firefox y Safari, lector de pantalla real, contraste alto de Windows real (solo `forced-colors` emulado), pantalla táctil real.

## 18/11/2026 (noche, 12) — Paso 4.3 (lógica): flota y diálogo Agregar unidad

**Qué se hizo.** Tres piezas, sin DOM y sin reglas nuevas (reusan `calcularAlertas`, `aptitud`, `kmActual`, `horizonteMinimo` y el comando `altaUnidad`): `src/lib/estado/flota.ts` (filas de 5.10, búsqueda, filtros y
orden de 6.2), `src/lib/dominio/formulario-unidad.ts` (contexto, validación por campo, comando y errores del diálogo; con `dominio/formulario.ts`, que ahora comparte con `formulario-documento.ts` el tipo genérico de errores) y dos
cosas nuevas en `EstadoApp` (`panelDeFlota` y `agregarUnidad`). El enrutador entiende `#/flota?filtro=…` y el enlace «Ver las N en la flota» del 4.2 ya lo usa (se ajustó en `centro-alertas.ts`, no en la vista). En el dominio solo se movió
código: las comprobaciones de patente, interno y año del alta pasaron de `comandos.ts` a `validacion.ts` para que el formulario diga todos los errores juntos con el mismo código. `textos.ts` suma los textos (`TEXTO_FLOTA`, `TEXTO_AGREGAR`,
`NOMBRES_TIPO_UNIDAD` y funciones). 125 tests nuevos, escritos primero (`flota.test.ts` 68, `formulario-unidad.test.ts` 20, `flota-app.test.ts` 19, `textos-flota.test.ts` 6, doce en `enrutador.test.ts`, uno ajustado en `centro-alertas.test.ts`); cinco
mutaciones (sin quitar tildes, orden de prioridad, total del anuncio, filtro de proyecto, «todas las palabras» → «alguna») comprobaron que los tests detectan el error. Las decisiones que la especificación no cubría están en `diseno.md`, sección 16, última viñeta
(doce puntos). No se tocaron estilos ni componentes.

**API para el maquetador.**

```ts
// estado/flota.ts — la consulta es estado de la vista ($state); el panel viene de la aplicación.
app.panelDeFlota: PanelFlota | null          // se recalcula con cada comando y al cambiar el día; null hasta que termina el arranque
interface PanelFlota {
  titulo: string;                            // "Unidades" (título del panel; el h1 es app.nombrePantalla = "Flota")
  cantidad: number;                          // 23 (activas) -> "Unidades │ 23"
  resumen: string;                           // "23 unidades activas · 19 pueden salir · 2 no pueden salir · 2 fuera de servicio · 1 de baja"
  filas: FilaFlota[];                        // todas, también las de baja; el orden lo pone vistaDeFlota
  proyectos: { valor: string; etiqueta: string }[];             // [{ valor: "todos", etiqueta: "Todos" }, { valor: "proy-…", etiqueta: "Proyecto Piedra Lunar" }, …]
  ordenes: { id: OrdenFlota; etiqueta: string }[];              // Prioridad, Patente, Interno, Próximo vencimiento, Último parte
}
interface FilaFlota {
  unidadId; patente: "ZK214BD"; patenteTexto: "ZK 214 BD"; interno: "Int. 07"; internoNumero: 7; proyectoId: string;
  href: "#/unidad/ZK214BD"; nombreAccesible: "Ficha de ZK 214 BD"; descripcion: "Toyota Hilux 2022 · Camioneta";
  estado: { categoria: "puede-salir" | "no-puede-salir" | "fuera-de-servicio" | "baja"; etiqueta: "No puede salir";
            motivo: "Seguro vencido hace 1 día" | null; motivosMas: "y 1 motivo más" | null; motivos: string[] };
  franja: "critico" | "semana" | "neutro" | null;               // null si puede salir (sin franja)
  proximoVencimiento: { tipo: "faltante" | "vencido" | "por-vencer" | "vigente" | "ninguno"; documento: string | null; etiqueta: string | null;
                        texto: "Revisión técnica · en 6 días" | "Seguro · 12/05/2027" | "Vencido hace 1 día · Seguro" | "Falta cargar · …" | "—";
                        dias: number | null; horizonte: Horizonte | null };   // horizonte (variante minima) solo en "por-vencer"
  km: { valor: number | null; texto: "84.320 km" | "Sin registros" };
  ultimoParte: { fecha: FechaCivil | null; texto: "17/11/2026" | "Sin partes"; etiqueta: "Sin enviar" | "Sin parte" | null };
  novedades: { abiertas: number; criticas: number; texto: "0" | "1 (crítica)" | "3 (2 críticas)" };   // criticas > 0 -> ícono i-octogono
  proyecto: string | null; conductor: string | null;            // nombres completos (el recorte "P. Arroyo" es de la vista)
  claveDeBusqueda: string;                                      // interna, no se muestra
}
interface ConsultaFlota { filtro: IdFiltroFlota; busqueda: string; proyecto: string /* "todos" o id */; orden: OrdenFlota }
type IdFiltroFlota = "activas" | "pueden-salir" | "no-pueden-salir" | "fuera-de-servicio" | "de-baja" | "no-disponibles";
CONSULTA_INICIAL                                              // { filtro: "activas", busqueda: "", proyecto: "todos", orden: "prioridad" }
consultaDeRuta(ruta: Ruta): ConsultaFlota                     // el filtro de #/flota?filtro=… ; sin filtro, CONSULTA_INICIAL
quitarFiltros(c: ConsultaFlota): ConsultaFlota                // "Quitar filtros": todo menos el orden
vistaDeFlota(panel: PanelFlota, c: ConsultaFlota): VistaFlota
interface VistaFlota {
  filtros: { id: IdFiltroFlota; etiqueta: string; cantidad: number }[];   // 5 radios (23, 19, 2, 2, 1); con filtro "no-disponibles" elegido, una sexta opción "No disponibles" (4)
  filas: FilaFlota[];                        // ya filtradas y ordenadas
  mostradas: number; total: number;          // total = las del filtro de estado elegido (sin búsqueda ni proyecto)
  anuncio: string;                           // "Mostrando 1 de 23 unidades." -> region role="status" (la vista pone los 500 ms de pausa al escribir)
  vacio: { tipo: "sin-unidades"; texto } | { tipo: "por-filtro"; texto: "Ninguna unidad coincide con «zz9» en Proyecto Piedra Lunar."; conQuitarFiltros: boolean } | null;
  hayFiltros: boolean;
}
normalizarBusqueda("ZK 214 BD") === "zk214bd"                 // por si la vista quiere resaltar o contar

// dominio/formulario-unidad.ts
contextoDeAgregarUnidad(estado, hoy): { titulo: "Agregar unidad"; primario: "Agregar unidad"; valoresIniciales: ValoresUnidad /* todos "" */;
  tipos: { valor: TipoUnidad; etiqueta }[]; proyectos: { valor: id; etiqueta }[];
  conductores: { valor: id | ""; etiqueta; asignadoA: "ZK 214 BD" | null }[] /* primero "Sin conductor asignado" con valor "" */; anios: { minimo: 1980; maximo: 2027 } }
interface ValoresUnidad { patente; interno; tipo; marca; modelo; anio; proyectoId; conductorId }          // todo texto, como lo dan los input y los select
CAMPOS_UNIDAD = ["patente", "interno", "tipo", "marca", "modelo", "anio", "proyectoId", "conductorId"]    // orden del formulario y del resumen de errores

// Guardar (EstadoApp). Nunca rechaza: devuelve el resultado.
app.agregarUnidad(valores: ValoresUnidad): Promise<ResultadoAgregarUnidad>
type ResultadoAgregarUnidad =
  | { ok: true; mensaje: string; foco: "titulo-de-la-ficha"; href: string; ruta: Ruta }   // "Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí." · "#/unidad/ZK999AA"
  | { ok: false; errores: ErroresDeFormularioUnidad };   // { porCampo, lista, general }: el mismo molde que los diálogos de documento, con CampoUnidad en vez de CampoDocumento
```

```svelte
<script lang="ts">
  import { app } from "../lib/estado/instancia.ts";
  import { consultaDeRuta, vistaDeFlota, type ConsultaFlota } from "../lib/estado/flota.ts";
  import { contextoDeAgregarUnidad, type ValoresUnidad } from "../lib/dominio/formulario-unidad.ts";

  const panel = $derived(app.panelDeFlota);
  let consulta = $state<ConsultaFlota>(consultaDeRuta(app.ruta));
  // Al llegar a la flota por otro enlace (p. ej. «Ver las 9 en la flota» estando ya en #/flota), volver a leer la ruta:
  $effect(() => { app.versionDePantalla; consulta = consultaDeRuta(app.ruta); });
  const v = $derived(panel === null ? null : vistaDeFlota(panel, consulta));

  let abierto = $state.raw<ReturnType<typeof contextoDeAgregarUnidad> | null>(null);
  let valores = $state<ValoresUnidad>({ patente: "", interno: "", tipo: "", marca: "", modelo: "", anio: "", proyectoId: "", conductorId: "" });
  let errores = $state.raw<{ porCampo: Record<string, string>; lista: { campo: string; mensaje: string }[]; general: string | null } | null>(null);

  function abrirAgregar() {
    if (app.estado === null) return;
    abierto = contextoDeAgregarUnidad(app.estado, app.hoy);
    valores = { ...abierto.valoresIniciales }; errores = null;
  }
  async function guardar() {
    const r = await app.agregarUnidad(valores);
    if (!r.ok) { errores = r.errores; return; }   // el diálogo no se cierra y lo escrito se conserva
    abierto = null;                                  // cerrar el <dialog>
    app.irA(r.ruta);                                 // a la ficha (4.4); el cambio de pantalla ya mueve el foco al h1. Hasta que exista: mostrar r.mensaje en la barra de estado del panel
  }
</script>
{#if v}
  <input bind:value={consulta.busqueda} />
  {#each v.filtros as f (f.id)}<label><input type="radio" bind:group={consulta.filtro} value={f.id} /> {f.etiqueta} {f.cantidad}</label>{/each}
  {#each v.filas as f (f.unidadId)}<a href={f.href}>{f.patenteTexto}</a> {f.estado.etiqueta} {f.estado.motivo} {f.proximoVencimiento.texto}{/each}
  {#if v.vacio}<p>{v.vacio.texto}</p>{/if}
{/if}
```

**Cosas para tener en cuenta al maquetar.**
- La clave de `each` de las filas es `unidadId`. El enlace de la patente lleva `nombreAccesible` («Ficha de ZK 214 BD») como texto oculto.
- Los radios de estado son `v.filtros` (cinco; la sexta, «No disponibles», solo existe si la consulta ya la trae de la ruta). Los conteos no cambian al escribir: lo que cambia es `v.anuncio` (con 500 ms de pausa, en un `role="status"`).
- El filtro no escribe el hash: la consulta es estado de la vista y arranca en `consultaDeRuta(app.ruta)`. Si se llega a `#/flota` desde otro enlace sin salir de la pantalla, `app.versionDePantalla` sube y hay que volver a leerla.
- «Quitar filtros» (solo si `v.vacio.conQuitarFiltros`): `consulta = quitarFiltros(consulta)`. Sin ninguna unidad (`vacio.tipo === "sin-unidades"`): «Todavía no hay unidades.» con el botón «Agregar unidad».
- Las unidades de baja salen con `franja: "neutro"`, etiqueta «De baja» y «—» como próximo vencimiento. La mínima (`proximoVencimiento.horizonte`) viene armada, con una sola marca; el texto es el de la celda.
- La ficha de la unidad es del paso 4.4: `app.irA(r.ruta)` llega a la ruta `#/unidad/…`, que hoy no tiene pantalla. Hasta entonces conviene quedarse en la flota y mostrar `r.mensaje` en la barra de estado (el texto dice «desde aquí», que es la ficha).
- Interno y año son `input type="text"` con `inputmode="numeric"` (como el kilometraje): el dominio acepta solo dígitos y dice el rango. La ayuda del año sale de `contexto.anios`.
- «Conductor»: `asignadoA` sirve para avisar «ya tiene la unidad ZK 214 BD» junto a la opción; no se impide.
- Con el perfil Conductor la flota no se muestra (ruta del encargado); si se llegara a guardar igual, el error general dice «Esta acción es solo del encargado…».
- Todo el texto sale de `textos.ts` (flota y diálogo); las etiquetas de los campos del formulario («Patente», «Interno»…) y sus ayudas son de presentación (`textos-marco.ts`).

**Verificación.** Aceptación del plan con el ejemplo del generador (fechaBase 2026-11-18): «zk214» encuentra ZK 214 BD (y «Mostrando 1 de 23 unidades.»); filtros 23 / 19 / 2 / 2 / 1; «No disponibles» da las mismas 4 unidades que el protagonista del centro de alertas;
orden de prioridad ZZD 563, ZK 214 BD, ZR 536 MZ, ZU 899 QE, … ; una alta nueva (ZK 999 AA en Piedra Lunar) aparece en la flota como «No puede salir» con «Falta cargar: Seguro» y «y 3 motivos más», sube el protagonista de 4 a 5, los vencidos y faltantes de 2 a 6 y el total a 15,
con el mensaje «Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí.» (3 en la base de mantenimiento); se guarda la unidad y su evento en una escritura; los errores salen juntos y por campo, sin guardar nada. `npm test`: 919 tests (794 + 125), verdes también con `npm run test:tz`
(UTC, Asia/Tokyo y America/Los_Angeles); `npm run check`: 0 errores; `npm audit`: 0 vulnerabilidades; `npm run build` y `npm run buscar` sin hallazgos.
Pendiente: la pantalla (maquetador), la ficha y el diálogo de cargar documento «otro» (4.4).

## 18/11/2026 (noche, 13) — Paso 4.3 (pantalla): flota y diálogo Agregar unidad (maquetador)

**Qué se hizo.** `src/componentes/PantallaFlota.svelte` (6.2: encabezado con «Agregar unidad» y el resumen, panel «Unidades │ 23» con búsqueda, Proyecto, Ordenar por y filtros con conteo, tabla de 5.10 con el Horizonte mínimo en «Próximo vencimiento», vacío por filtro con «Quitar filtros» y vacío sin unidades) y `DialogoUnidad.svelte` (Patente, Interno, Tipo, Marca, Modelo, Año, Proyecto y Conductor sobre el `Dialogo` base, con resumen de errores). Reusa `Panel`, `FiltrosConteo`, `Etiqueta`, `Patente`, `Horizonte`, `ResumenErrores`, `Campo` y `ListaTabla`. Cambios en piezas existentes: `ListaTabla` suma la variante `flota` (un solo grupo sin fila de título, franja solo en algunas filas con `tonoDeFila` que puede devolver `undefined`, kilometraje a la derecha, compacta de tres columnas y tarjeta); `Campo` suma `modoEntrada` (`inputmode` del interno y el año), `mayusculas` (patente) y `corto`; `App.svelte` monta la pantalla en `#/flota`. Textos de presentación en `textos-marco.ts` (`TEXTO_FLOTA_VISTA`, `TEXTO_DIALOGO_UNIDAD`) para `redactor-ux`. Sin cambios en la lógica ni en los tokens; sin `style="..."`.

**Decisión del hilo principal (ambigüedad 8).** Al agregar bien nos quedamos en la flota: el mensaje de `app.agregarUnidad` va a la barra de estado del panel y el foco va al enlace de la fila nueva (o al `h2` «Unidades» si los filtros la esconden; entonces el mensaje suma «La unidad nueva no se ve con los filtros actuales.»). No se navega a `r.href`: se enchufa en el 4.4, cuando exista la ficha. Mientras tanto el mensaje dice «cárguelos desde aquí» sin que «aquí» exista.

**Decisiones donde la especificación no dice (diferencias a revisar).**
- La barra de estado del panel es a la vez el conteo visible («Mostrando 23 de 23 unidades.») y la región viva: al escribir se actualiza con 500 ms de pausa; al elegir filtro, proyecto u orden, al instante; un mensaje de guardado ocupa su lugar hasta la acción siguiente (no hay región oculta aparte, a diferencia de 6.1).
- La búsqueda es `type="search"` con la etiqueta «Buscar unidad» solo para lectores y el texto del marcador de 6.2 visible; sin el botón de borrar nativo. A 360 px el marcador se corta con puntos suspensivos.
- Proyecto y Ordenar por son `select` propios (rótulo arriba por debajo de 64 rem de panel, al costado en escritorio), no el `Campo` (que lleva el rótulo siempre arriba).
- Proyecto y conductor: en dos líneas y con el nombre completo («Proyecto Piedra Lunar» / «Lucía Ferreyra»), sin el recorte «P. Arroyo» del esquema; sin conductor dice «Sin conductor».
- Compacta (40–65,99 rem): (Unidad + Estado) · (Próximo vencimiento + Último parte) · (Km + Novedades) y una tercera línea al pie con proyecto y conductor, que la especificación no ubica.
- Tarjeta (< 40 rem): unidad, estado, próximo vencimiento, una fila con Kilometraje · Último parte · Novedades y el proyecto, todos con su rótulo (la especificación muestra «84.320 km · último parte 17/11» sin rótulos).
- El meta «23» del panel baja a su renglón a 360 px (comportamiento de `Panel` por debajo de 24 rem de contenedor).
- Opciones del conductor con unidad: «Nombre (ya tiene ZK 214 BD)» y la ayuda lo repite; no se impide.
- Al abrir el diálogo, Interno y Año son `inputmode="numeric"` con 10 caracteres de ancho; dos columnas desde 40 rem, una columna como hoja en teléfono.

**Verificación.** Playwright (Chromium) contra `npm run build` servido con las cabeceras de `public/_headers` y contra `npm run dev`: 90 comprobaciones en cada uno, 0 fallas: 23 filas, resumen y filtros 23 / 19 / 2 / 2 / 1; «zk214» encuentra ZK 214 BD con el anuncio «Mostrando 1 de 23 unidades.» recién pasada la pausa; cada filtro con su conteo y su anuncio, flechas entre radios, orden por patente e interno, proyecto, vacío «Ninguna unidad coincide con «zz9» en Proyecto Piedra Lunar.» y «Quitar filtros» con el foco en la búsqueda; elegir un radio no cambia el hash; `#/flota?filtro=no-disponibles` muestra las 4 (ZZD 563, ZK 214 BD, ZR 536 MZ, ZU 899 QE) con la opción «No disponibles 4», y se relee estando ya en la flota; con 7 no disponibles, «Ver las 7 en la flota» del centro de alertas lleva a esas 7; vacío → resumen con 7 datos y foco ahí; un error (patente repetida) → foco al campo con el texto conservado y sin resumen; Esc pide confirmar y un segundo Esc sigue editando; alta de ZK 999 AA → diálogo cerrado, foco en su fila, barra «Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí.», 24 filas, «No puede salir» con «Falta cargar: Seguro y 3 motivos más» y «Sin registros», filtros 24 / 19 / 3 / 2 / 1 y el protagonista del centro de alertas en 5; unidad nueva oculta por «De baja» → foco al título y mensaje; recorrido con Tab (Agregar unidad, búsqueda, Proyecto, Ordenar por, filtros, primera patente...); objetivos táctiles ≥ 44 px; claro y oscuro a 360, 768 y 1280 px sin desborde horizontal (tampoco con el diálogo de errores abierto, con el pie a la vista); consola sin errores ni avisos y sin `securitypolicyviolation`; colores forzados emulados legibles. `npm run check`: 0; `npm test`: 919 verdes; `npm run contraste`: 158 mediciones, 0 fallan; `npm run buscar`: sin hallazgos. Capturas `flota-*` en el directorio de trabajo temporal.
No probado: Firefox y Safari, lector de pantalla real, contraste alto de Windows real, pantalla táctil real, `npm run test:tz` (no cambió lógica).

## 18/11/2026 (noche, 14) — Paso 4.4 (lógica): ficha de unidad y diálogos (resolver novedad, fuera de servicio, volver, kilometraje, asignación, baja, corregir documento, cargar novedad, cargar otro documento)

**Qué se hizo.** Cinco piezas, sin DOM y sin reglas nuevas (reusan `calcularAlertas`, `aptitud`, `kmActual`, `horizonteDeUnidad`, `historialDeUnidad` y los comandos): `src/lib/estado/ficha.ts` (lo que dibuja 6.3 y 5.16, más `vistaDeHistorial`),
`src/lib/dominio/formulario-novedad.ts` (resolver y cargar novedad), `formulario-ficha.ts` (fuera de servicio, volver a servicio, dar de baja, corregir kilometraje, cambiar proyecto o conductor), `formulario-documento.ts` (suma «Corregir documento» y el `select` Tipo de «Cargar otro documento», pendiente del 4.2)
y, en `EstadoApp`, `fichaDeUnidad`, `mensajeDeLlegada` y un método por comando. Retoques al dominio para no duplicar: `criticasAbiertasDeUnidad` (el error de A4 y el diálogo salen del mismo texto), `validarFechaNoFutura`, `Motivo.documento` y `ofreceVolverAServicio` (N2). `formulario.ts` ahora también arma las opciones de proyecto y conductor
(`opcionesDeProyecto`, `opcionesDeConductor`) y reparte errores (`erroresDeNegocioEn`, `errorGeneralEn`); `textos.ts` suma `TEXTO_FICHA`, `TEXTO_DIALOGOS_FICHA` y las funciones de texto. **`agregarUnidad` ahora navega a la ficha** (`#/unidad/…`) y deja el mensaje en `app.mensajeDeLlegada`.
141 tests nuevos, escritos primero (`ficha.test.ts` 45, `ficha-app.test.ts` 37, `formulario-novedad.test.ts` 13, `formulario-ficha.test.ts` 22, `formulario-documento-ficha.test.ts` 11, `textos-ficha.test.ts` 10, `novedades.test.ts` 1, uno en `aptitud.test.ts` y uno en `reactividad.svelte.test.ts`); siete mutaciones comprobaron que detectan el error
(N2 sin «última crítica», orden N5, navegación tras el alta, aviso de A5, texto de «Ver más», mensaje de A5; la de `impideVolver` sobrevivía y por eso hay un test con una unidad de baja). Las decisiones que la especificación no cubría están en `diseno.md`, sección 16, última viñeta (trece puntos). No se tocaron estilos ni componentes.

**API para el maquetador.**

```ts
// estado/ficha.ts — `app.fichaDeUnidad` se recalcula con cada comando y al cambiar el día. null fuera de #/unidad/… o antes de terminar el arranque.
app.fichaDeUnidad: FichaDeUnidad | FichaNoEncontrada | null
app.mensajeDeLlegada: string | null         // «Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí.» solo al llegar desde «Agregar unidad»; se va al salir de esa ficha. La barra de estado de la ficha arranca con él.
FichaNoEncontrada = { encontrada: false; titulo: "No se encontró la unidad" /* h1 */; mensaje: "No hay ninguna unidad con la patente ZZ 999 ZZ."; patenteTexto; enlace: { texto: "Ir a la flota"; href: "#/flota" } }
FichaDeUnidad = {
  encontrada: true; unidadId; patente: "ZK214BD"; patenteTexto: "ZK 214 BD"; interno: "Int. 07"; internoNumero: 7; descripcion: "Toyota Hilux 2022 · Camioneta";
  migas: { texto: "Flota"; href: "#/flota" } | { texto: "ZK 214 BD"; href: null };
  aptitud: { categoria: "puede-salir"|"no-puede-salir"|"fuera-de-servicio"|"baja"; etiqueta; motivos: string[]; linea: string | null /* «Seguro vencido hace 1 día» o «3 motivos»; null si puede salir o está de baja */; mostrarLista: boolean /* más de 2 motivos */ };
  datos: { proyecto: string | null; conductor: string | null; km: { valor: number | null; texto: "84.320 km" | "Sin registros"; fecha: "17/11/2026" | null; textoConFecha: "84.320 km (al 17/11/2026)" } };
  aviso: string | null;                      // solo de baja: «Dada de baja el 21/10/2026: Venta. Se conserva su historial.»
  estadoOperativo: { tipo: "en-servicio"|"fuera-de-servicio"|"baja"; desde: "16/11/2026" | null; motivo | null; origen: "manual"|"novedad-critica" | null; novedadesQueImpiden: { novedadId; rotulo; origen; texto: "Frenos (parte del 16/11/2026)" }[] /* A4 */ };
  puedeEditar: boolean;                      // false con el perfil Conductor: no hay ninguna acción
  acciones: { encabezado: AccionDeFicha[]; masAcciones: AccionDeFicha[] };
  // AccionDeFicha = { id: "cargar-parte"|"poner-fuera-de-servicio"|"volver-a-servicio"|"corregir-kilometraje"|"cambiar-asignacion"|"cargar-novedad"|"dar-de-baja"; etiqueta; href: string | null /* solo cargar-parte */; bloqueo: string | null /* solo volver-a-servicio con críticas abiertas (A4) */ }
  documentos: { titulo; rotuloCantidad: "4 · 1 vencido · 1 faltante"; horizonte: Horizonte /* mediana */; cargarOtro: { etiqueta } | null;
    filas: { clave: TipoDocumento; tipo; nombre; documentoId: string | null; numero | null; emisor | null; emitido | null; vence: "17/11/2026" | "—";
             estado: { tipo: "faltante"|"vencido"|"por-vencer"|"vigente"; texto: "Vencido hace 1 día"|"Vigente hasta 02/09/2027"|"Falta cargar"; tono: "critico"|"semana"|"quincena"|"mes"|"vigente" };
             anteriores: { documentoId; numero; emisor | null; vence; cargado }[]; rotuloAnteriores: "Anteriores (1)" | null;
             acciones: { tipo: "renovar"|"corregir"|"cargar"; etiqueta; nombreAccesible: "Renovar seguro de ZK 214 BD"; documentoId: string | null; tipoDocumento }[] }[] };
  novedades: { titulo; rotuloCantidad: "0 abiertas"; filtros: { id: "abiertas"|"resueltas"; etiqueta; cantidad }[]; abiertas: FilaNovedad[]; resueltas: FilaNovedad[]; vacioAbiertas; vacioResueltas; cargar: { etiqueta } | null };
  // FilaNovedad = { novedadId; gravedad; estado: "Crítica"|"Abierta"|"Resuelta"; texto; origen: "Parte del 16/11/2026, punto Frenos"; fecha; impideVolver: boolean /* A4 */; ofreceVolverAServicio: boolean /* N2 */;
  //                 resolucion: { texto; fecha: "24/10/2026 11:42"; autor } | null; accion: { tipo: "resolver"; etiqueta; nombreAccesible: "Resolver novedad de ZU 899 QE: Frenos"; novedadId } | null }
  kilometraje: { titulo; rotuloKm: "84.320 km"; subtitulo; vacio: string | null; corregir: { etiqueta } | null;
                 filas /* hasta 10, la más nueva primero */: { clave; tipo: "parte"|"correccion"; fecha; texto: "84.188 → 84.320"|"Corrección: 120 km"; recorrido: "132 km"|"Sin uso"|null; advertencias: string[] /* K6, K7 aceptadas */; motivo: string | null; href: string | null /* al parte */ }[] };
  historial: { titulo; rotuloCantidad: "128 eventos"; total; filtros: { id: "todo"|"partes"|"documentos"|"novedades"|"estado-km"; etiqueta; cantidad }[]; eventos: FilaEvento[] };
  // FilaEvento = { eventoId; secuencia; tipo; icono: "parte"|"documento"|"novedad"|"estado"|"km"|"unidad"|"caja"; categoria; instante: "17/11/2026 18:42"; hora: "18:42"; dia: "2026-11-17"; tituloDia: "Martes 17/11/2026"; resumen; autor;
  //                detalle: DetalleDeParte | { tipo: "documento-corregido"; cambios: { campo: "Vencimiento"; antes; despues }[] } | null }
  // DetalleDeParte = { tipo: "parte"; resumenCorto: "Parte enviado · 132 km (84.320 → 84.452) · combustible 3/4 · 1 novedad"; kmInicio; kmFin; recorrido; combustible | null; litros: "45,5 litros"|"Sin carga"; novedades: { rotulo; texto; critica }[]; puntosEnOrden: "8 puntos en orden" | null; advertencias: string[]; fueraDeTermino; href: "#/parte/ZK214BD/2026-11-17" }
}
vistaDeHistorial(ficha.historial, filtro: IdFiltroHistorial, limite: number): { grupos: { dia; titulo; eventos: FilaEvento[] }[]; mostrados; total; hayMas; botonVerMas: "Ver 30 más" | null; anuncio: "Mostrando 30 de 128 eventos."; ids: string[]; vacio: string | null }
PASO_HISTORIAL = 30                         // filtro y límite son estado de la vista; «Ver 30 más»: límite += 30 y el foco al evento ids[límiteAnterior]

// Contextos de los diálogos (todos reciben `app.estado` y devuelven null si no hay diálogo que abrir; `hoy` = app.hoy). Los valores del formulario son siempre texto.
contextoDeResolver(estado, novedadId, hoy)           // dominio/formulario-novedad.ts · también desde el centro de alertas (accion.novedadId de la fila «Resolver»)
  → { novedadId; unidadId; titulo: "Resolver novedad de ZK 214 BD"; novedad: { rotulo; texto; origen; fecha; gravedad; etiqueta }; ofreceVolverAServicio; etiquetaVolverAServicio: "Volver a servicio ahora"; notaVolverAServicio | null; avisoDocumentos | null /* A5 */; valoresIniciales: { texto: ""; volverAServicio: boolean /* marcada si se ofrece */ }; primario: "Marcar como resuelta" }
contextoDeCargarNovedad(estado, unidadId)            // { unidadId; titulo; valoresIniciales: { descripcion: ""; impideUso: false }; etiquetaImpideUso; notaImpideUso; primario: "Guardar novedad" }
contextoDeFueraDeServicio(estado, unidadId, hoy)     // dominio/formulario-ficha.ts · { unidadId; titulo; desde: "Desde hoy (18/11/2026)."; valoresIniciales: { motivo }; primario }
contextoDeVolverAServicio(estado, unidadId, hoy)     // { unidadId; titulo; situacion; bloqueo: { texto /* A4 */; novedades; verNovedades: "Ver novedades" } | null; aviso /* A5 */ | null; primario: string | null /* null si hay bloqueo */ }
contextoDeBaja(estado, unidadId)                     // { unidadId; titulo; aviso; valoresIniciales: { motivo }; primario: "Dar de baja ZK 214 BD"; peligro: true }
contextoDeKilometraje(estado, unidadId, hoy)         // { unidadId; titulo; ultimoRegistro: "Último registro: 84.320 km (parte del 17/11/2026)."; nota; valoresIniciales: { desde: hoy; kmBase: ""; motivo: "" }; desdeMaxima: hoy; primario }
contextoDeAsignacion(estado, unidadId)               // { unidadId; titulo; valoresIniciales: { proyectoId; conductorId }; proyectos: {valor; etiqueta}[]; conductores: { valor; etiqueta; asignadoA }[]; primario } + avisoDeAsignacion(estado, unidadId, valores): string | null (U6, al cambiar el select)
contextoDeCorregir(estado, documentoId)              // dominio/formulario-documento.ts · { documentoId; titulo: "Corregir: Seguro de ZK 214 BD"; nota; nombreDocumento; titularEtiqueta; valoresIniciales: { numero; emisor; vence; emitido }; primario }
contextoDeCargarOtro(estado, unidadId)               // { unidadId; titulo: "Cargar documento de ZK 214 BD"; titularEtiqueta; tipos: { valor: TipoDocumento; etiqueta }[]; valoresIniciales: { tipoDocumento: ""; numero; emisor; vence; emitido }; primario }
CAMPOS_RESOLVER, CAMPOS_CARGAR_NOVEDAD, CAMPOS_FUERA_DE_SERVICIO, CAMPOS_BAJA, CAMPOS_KILOMETRAJE = ["desde","kmBase","motivo"], CAMPOS_ASIGNACION, CAMPOS_CARGAR_OTRO = ["tipoDocumento","numero","emisor","vence","emitido"]   // orden del formulario y del resumen

// Guardar (EstadoApp). Nunca rechazan: devuelven el resultado. Revisan todos los campos juntos antes de ejecutar.
type ResultadoGuardado<Campo> = { ok: true; mensaje: string; foco: FocoTrasGuardar } | { ok: false; errores: { porCampo; lista: { campo; mensaje }[]; general: string | null } }
type FocoTrasGuardar = "titulo-del-panel" /* centro de alertas */ | "titulo-de-la-ficha" /* h1 */ | "titulo-de-documentos" | "titulo-de-novedades" | "titulo-de-kilometraje"
app.resolverNovedad(novedadId, { texto, volverAServicio }, donde: "centro" | "ficha" = "centro")
app.cargarNovedad(unidadId, { descripcion, impideUso })
app.ponerFueraDeServicio(unidadId, { motivo })
app.volverAServicio(unidadId)                         // sin campos: solo error general (A4)
app.darDeBaja(unidadId, { motivo })
app.corregirKilometraje(unidadId, { desde, kmBase, motivo })
app.cambiarAsignacion(unidadId, { proyectoId, conductorId })   // conductorId "" = sin conductor
app.corregirDocumento(documentoId, { numero, emisor, vence, emitido })          // ResultadoGuardadoDocumento, foco "titulo-de-documentos"
app.cargarOtroDocumento(unidadId, { tipoDocumento, numero, emisor, vence, emitido })
app.renovarDocumento(documentoId, valores, donde = "centro") / app.cargarDocumento(titular, tipo, valores, donde = "centro")   // desde la ficha pasar "ficha": mensaje sin «Quedan N vencimientos», foco "titulo-de-documentos"
app.agregarUnidad(valores)                            // ahora navega solo a la ficha; `ruta` y `href` siguen en el resultado
```

```svelte
<script lang="ts">
  import { app } from "../lib/estado/instancia.ts";
  import { vistaDeHistorial, PASO_HISTORIAL, type IdFiltroHistorial } from "../lib/estado/ficha.ts";
  import { contextoDeResolver } from "../lib/dominio/formulario-novedad.ts";

  const f = $derived(app.fichaDeUnidad);                       // FichaDeUnidad | FichaNoEncontrada | null
  let estadoBarra = $state(app.mensajeDeLlegada ?? "");        // barra de estado de la ficha
  let filtro = $state<IdFiltroHistorial>("todo");
  let limite = $state(PASO_HISTORIAL);
  const h = $derived(f?.encontrada ? vistaDeHistorial(f.historial, filtro, limite) : null);
  let abierto = $state.raw<ReturnType<typeof contextoDeResolver>>(null);
  let valores = $state({ texto: "", volverAServicio: false });
  let errores = $state.raw<{ porCampo: Record<string, string>; lista: { campo: string; mensaje: string }[]; general: string | null } | null>(null);

  function abrirResolver(novedadId: string) {
    if (app.estado === null) return;
    abierto = contextoDeResolver(app.estado, novedadId, app.hoy);
    if (abierto) { valores = { ...abierto.valoresIniciales }; errores = null; }
  }
  async function guardar() {
    const r = await app.resolverNovedad(abierto!.novedadId, valores, "ficha");
    if (!r.ok) { errores = r.errores; return; }                // el diálogo no se cierra y el texto escrito se conserva
    abierto = null; estadoBarra = r.mensaje;                   // r.foco === "titulo-de-novedades"
  }
</script>
{#if f?.encontrada}
  <h1 tabindex="-1">{f.patenteTexto}</h1> <p>{f.aptitud.etiqueta} {f.aptitud.linea}</p>
  {#each f.novedades.abiertas as n (n.novedadId)}{n.texto} {#if n.accion}<button onclick={() => abrirResolver(n.accion!.novedadId)}>{n.accion.etiqueta}</button>{/if}{/each}
{:else if f}<h1 tabindex="-1">{f.titulo}</h1> <p>{f.mensaje}</p> <a href={f.enlace.href}>{f.enlace.texto}</a>{/if}
```

**Cosas para tener en cuenta al maquetar.**
- `agregarUnidad` ya navega: `PantallaFlota` hoy se queda con la barra de estado y el foco en la fila nueva; hay que quitarlo (el cambio de pantalla ya mueve el foco al `h1` de la ficha). Hasta que exista la pantalla de la ficha, el alta llega al marcador de `App.svelte`.
- «Resolver» del centro de alertas: `fila.accion.novedadId` + `contextoDeResolver(app.estado, id, app.hoy)` + `app.resolverNovedad(id, valores)` (sin tercer parámetro). Foco `titulo-del-panel`; el mensaje nombra la unidad. Hoy la fila enlaza a la ficha: pasa a abrir el diálogo.
- El `select` Tipo de «Cargar otro documento» es el primer campo de `contextoDeCargarOtro(...).tipos`; viene vacío y hay que elegir. Los errores del dominio sobre el tipo (ya cargado en otra pestaña) vuelven en ese campo.
- «Volver a servicio»: con `contexto.bloqueo` no hay botón primario; «Ver novedades» cierra el diálogo y lleva el foco al título de Novedades (lo resuelve la vista). Con `aviso` (A5) se muestra como aviso en tono semana.
- N2: la casilla «Volver a servicio ahora» solo existe si `ofreceVolverAServicio` y viene marcada (`valoresIniciales.volverAServicio`); con la nota `notaVolverAServicio` y, si hay, `avisoDocumentos`.
- Los selects de proyecto y conductor del diálogo de asignación usan `asignadoA` como en «Agregar unidad»; `avisoDeAsignacion` se vuelve a llamar al cambiar el proyecto.
- Barra de estado de la ficha: arranca con `app.mensajeDeLlegada`; cada guardado la reemplaza con `r.mensaje`. La del encabezado (fuera de servicio, volver, baja, asignación) y las de los paneles pueden ser una sola región viva de la ficha.
- Sin `{@html}`: todo texto (novedades, motivos, números de documento) se muestra literal.

**Verificación.** Aceptación del plan con el ejemplo del generador (fechaBase 2026-11-18) y la API del estado: cada comando (resolver, cargar novedad, fuera de servicio, volver, dar de baja, corregir kilometraje, cambiar asignación, corregir documento, cargar otro documento, renovar y cargar desde la ficha) deja su evento primero en el historial (`primeros(app)`);
C11 (ZU 899 QE): A4 («Antes de volver a servicio, resuelva: Frenos (parte del 16/11/2026).», como bloqueo de la acción y como error del comando) y N2 (resolver con la casilla da `novedad-resuelta` + `vuelta-a-servicio`, sin ella solo la primera); A5 con el seguro vencido de ZK 214 BD; U6 (la unidad de la base pasa a Piedra Lunar y suben los faltantes de 2 a 3);
baja de ZK 214 BD (sale de «No pueden salir» y de las unidades activas, conserva el historial y no ofrece acciones); «cárguelos desde aquí» es cierto (la ficha de una alta nueva lista los 4 faltantes con «Cargar»; cargar uno baja la cuenta). Con el perfil Conductor ninguno se ejecuta; si la escritura falla (D10) no cambia nada.
`npm test`: 1060 tests (919 + 141), verdes también con `npm run test:tz` (UTC, Asia/Tokyo y America/Los_Angeles); `npm run check`: 0 errores; `npm run buscar` sin hallazgos.
Pendiente: la pantalla de la ficha y los diálogos (maquetador); el centro de alertas pasa a abrir «Resolver»; `PantallaFlota` deja de quedarse en la flota tras el alta.

## 18/11/2026 (noche, 15) — Paso 4.4 (pantalla): ficha de unidad y diálogos (maquetador)

**Qué se hizo.** `src/componentes/PantallaFicha.svelte` en `#/unidad/…` (enchufada en `App.svelte` con `{#key app.versionDePantalla}`), partida en `FichaEncabezado` (migas, patente grande como `h1`, aptitud y motivos, datos, acciones y «Más acciones»), `FichaDocumentos` (Horizonte mediano y tabla), `FichaNovedades`, `FichaKilometraje` y `FichaHistorial`. Los diálogos: una base `DialogoFormulario` (valores, resumen de errores 5.15, error general, «Guardando…» a los 200 ms, cierre al guardar) y un componente por diálogo
(`DialogoResolver`, `DialogoNovedad`, `DialogoFueraDeServicio`, `DialogoVolver`, `DialogoBaja`, `DialogoKilometraje`, `DialogoAsignacion`, `DialogoCargarOtro`); Renovar, Cargar y **Corregir documento** usan `DialogoDocumento` (suma `ayudaEmisor`; la nota va como línea de contexto). Piezas nuevas: `Casilla`, `Detalles` (`details` con resumen de 44 px), variante `documentos` de `ListaTabla`; `Campo` suma `maxFecha`, `MenuMas` el botón con texto,
`alertas-aspecto.ts` suma `aspectoDeAptitud` (lo usan flota y ficha). «Resolver» del centro de alertas abre `DialogoResolver` (mensaje en la barra del detalle). `PantallaFlota` ya no se queda tras el alta: `app.agregarUnidad` navega y el foco cae en el `h1` de la ficha, que muestra el mensaje de llegada. Textos de presentación en `textos-marco.ts` (`TEXTO_FICHA_VISTA`, `TEXTO_DIALOGOS_FICHA_VISTA`) para `redactor-ux`. Sin cambios en la lógica ni en los tokens; sin `style="…"`.

**Decisiones donde la especificación no dice (diferencias a revisar).** Quince puntos en `diseno.md`, sección 16, última viñeta. Los que más pesan: un solo mensaje a la vez en el lugar que cambió; el emisor va bajo el número (no hay columna); «Volver a servicio» no muestra el bloqueo junto al botón (lo explica el diálogo, que abre con el foco en el título); «Dar de baja» abre con el foco en el motivo;
si ya no hay diálogo que abrir, la barra de estado del lugar dice que la lista está al día; el panel «Detalle de la operación» queda mientras haya un mensaje.

**Huecos y deuda.**
- `DetalleDeParte.kmInicio` y `kmFin` vienen con « km» y el resto de los kilómetros no (la vista no agrega la unidad); `AccionDeFicha.bloqueo` no se usa; `DialogoDocumento.alGuardar` recibe solo el mensaje (la ficha sabe que el foco es Documentos).
- Los enlaces al parte («Cargar parte», la fecha del kilometraje, «Ver el parte completo») llevan al marcador hasta el paso 4.5.
- `DialogoDocumento` y `DialogoUnidad` no se pasaron a `DialogoFormulario` (funcionan y están verificados; migrarlos es solo limpieza).
- Los scripts de Playwright viven en el directorio temporal, no en el repositorio (como en 4.2 y 4.3).
- No probado: Firefox y Safari, lector de pantalla real, contraste alto de Windows real (solo `forced-colors` emulado), pantalla táctil real, `npm run test:tz` (no cambió lógica). No hay entradas nuevas en `muestras.html`.

**Verificación.** `npm test`: 1060 verdes (sin tests nuevos: es presentación); `npm run check`: 0 errores y 0 avisos; `npm run contraste`: 158 mediciones, 0 fallan; `npm run buscar`: sin hallazgos. Playwright (Chromium) contra `npm run dev` y contra `npm run build` servido con las cabeceras de `public/_headers`, en cada uno 44 + 30 + 47 + 44 comprobaciones, 0 fallas:
ficha de ZK 214 BD (h1, migas con `aria-current`, aptitud y motivo, datos, acciones, 4 filas con nombres accesibles, Horizonte mediano `role="img"`, 30 de 50 eventos, parte abierto, «Ver 20 más» con el foco en el evento 31, filtros que anuncian y no tocan el hash); recorrido de cada diálogo con teclado y errores (renovar, corregir con Esc con y sin cambios, cargar, cargar otro con el `select` Tipo vacío,
resolver con y sin la casilla N2 sobre C11, volver con A4 y con A5, cargar novedad crítica, fuera de servicio, corregir kilometraje con resumen de 2 datos, asignación con el aviso U6 que aparece y se va, baja con el foco, el aviso y el botón de peligro, ficha de baja sin acciones); foco tras guardar en el título que dice 5.17 y el mensaje en su barra; «Resolver» del centro de alertas; alta desde la flota →
ficha con el foco en el `h1`, el mensaje de llegada y los faltantes con «Cargar»; patente inexistente; todos los diálogos abiertos con errores a 360 y 1280 px, claro y oscuro: dentro de la pantalla, pie a la vista, sin desborde horizontal (tampoco la página a 320, 360, 768 y 1280); objetivos táctiles ≥ 44 px; consola sin errores ni avisos y sin `securitypolicyviolation`. Se mantienen las 50 comprobaciones de la flota de 4.3 anteriores al alta y las del centro de alertas de 4.2.
## 18/11/2026 (noche, 15 · rama `logica-4-5`) — Paso 4.5 (lógica): inicio del conductor (6.4) y parte diario (6.5), con autoguardado y «Parte enviado»

**Qué se hizo.** Cinco piezas nuevas, sin DOM y sin reglas nuevas (reusan `guardarBorrador`, `enviarParte`, `descartarBorrador`, `aptitud`, `kilometraje` y `calcularAlertas`): `src/lib/dominio/formulario-parte.ts` (el formulario: valores en texto, conversión a comando, faltantes P4, resumen de errores, recorrido, formato del km),
`src/lib/estado/parte.ts` (`inicioDelConductor`, `vistaDeParte`, `panelDeParteEnviado`: todo lo que dibujan 6.4 y 6.5), `src/lib/estado/autoguardado.ts` (el autoguardado de 500 ms con indicador, sin DOM y con reloj inyectado) y, en `EstadoApp`, `parteDeLaRuta`, `inicioDelConductor`, `guardarBorradorDeParte`, `enviarParte`, `descartarBorradorDeParte` y `autoguardadoDeParte`.
Retoques mínimos: `formatearHora` (fechas), `parteLegible` y un `?.` en `esBorradorVacio` (dominio/parte), `faltantesParaEnviar` acepta los datos de un formulario (`DatosParaEnviar`) y `EstadoApp.ejecutar` delega en `ejecutarAhora` (misma lógica, sin la cola). Textos nuevos al final de `textos.ts` (a revisar por `redactor-ux`).
174 tests nuevos, escritos primero (`formulario-parte.test.ts` 37, `parte-vista.test.ts` 46, `autoguardado.test.ts` 25, `parte-app.test.ts` 47, `parte-corrupto.test.ts` 18, uno en `fechas.test.ts`); las mutaciones a mano que sobrevivieron al primer intento (último registro anterior a la fecha, anuncio que no se repite, reintento tras un error, volver al valor guardado mientras se guarda) quedaron con su test.
Las decisiones que la especificación no cubría están en `diseno.md`, sección 16, última viñeta («Paso 4.5», once puntos). No se tocaron estilos ni componentes.

**API para el maquetador.**

```ts
// estado/app.svelte.ts
app.parteDeLaRuta: VistaDeParte | null              // en #/parte/…; null en otra ruta o antes de terminar el arranque. Se recalcula con cada cambio (cada autoguardado también)
app.inicioDelConductor(unidadElegidaId: string | null = null): InicioDelConductor | null   // #/conductor; null con el perfil Encargado. Se llama dentro de un $derived: app.inicioDelConductor(elegida)
app.autoguardadoDeParte(vista: ParteEnEdicion, alCambiar: (i: IndicadorDeGuardado) => void, opciones?): Autoguardado
app.guardarBorradorDeParte(unidadId, fecha, valores: ValoresParte): Promise<ResultadoDeBorrador>   // lo llama el autoguardado; nunca rechaza
app.enviarParte(unidadId, fecha, valores: ValoresParte, aceptadas: Advertencia["tipo"][] = []): Promise<ResultadoDeEnvio>   // nunca rechaza
app.descartarBorradorDeParte(parteId): Promise<{ ok: boolean; mensaje: string }>   // «Borrador descartado.»

// estado/parte.ts (puras, por si la vista necesita armar algo a mano)
inicioDelConductor(estado, alertas, hoy, perfil, unidadElegidaId?): InicioDelConductor | null
vistaDeParte(estado, hoy, perfil, patente, fecha): VistaDeParte
panelDeParteEnviado(estado, parte, perfil): PanelParteEnviado

// ---- Inicio del conductor (6.4)
InicioDelConductor = {
  titulo: "Parte diario" /* h1 */; conductor: { id; nombre }; hoy: { titulo: "Hoy, miércoles 18/11/2026" };
  unidad: { unidadId; patente: "ZK214BD"; patenteTexto: "ZK 214 BD"; interno: "Int. 07"; descripcion: "Toyota Hilux 2022 · Camioneta"; ultimoRegistro: "Último registro: 84.320 km (parte del 17/11/2026)." | "Sin registros" } | null;
  hoyEstado: { tipo: "sin-parte"; primario: { texto: "Empezar el parte"; href } }
           | { tipo: "borrador"; texto: "Tiene un parte empezado: faltan 5 datos."; primario: { texto: "Continuar el parte"; href }; descartar: { texto: "Descartar borrador"; parteId } }
           | { tipo: "enviado"; etiqueta: "Enviado a las 18:42"; enlace: { texto: "Ver el parte"; href } }
           | { tipo: "fuera-de-servicio"; aviso: "ZK 214 BD está fuera de servicio desde el 13/11/2026 (En taller: cambio de embrague). No hace falta parte." }
           | { tipo: "sin-unidad" };
  avisoAptitud: string | null;                       // «ZK 214 BD no puede salir: Seguro vencido hace 1 día. Avise al encargado antes de usarla.» (tono crítico, arriba del botón; el botón sigue disponible)
  elegirUnidad: { modo: "otra" | "elegir"; etiqueta: "Usar otra unidad" | "Elija la unidad"; opciones: { valor: unidadId; etiqueta: "ZK 214 BD (Int. 07)"; href: "#/parte/ZK214BD/2026-11-18" }[] };   // solo unidades en servicio; el `select` es estado de la vista y se pasa a inicioDelConductor(elegida)
  pendientes: { clave; tipo: "borrador" | "sin-parte"; texto; accion: { texto: "Continuarlo" | "Cargarlo"; href } }[];   // el panel solo si hay
  licencia: { titulo: "Su licencia"; texto: "Vence en 12 días (30/11/2026)"; tono: "critico" | "semana" | "quincena" | "mes" } | null;   // el panel solo si hay
  ultimosPartes: { titulo: "Mis últimos partes"; filas: { parteId; fecha: "17/11/2026"; fechaCorta: "17/11"; patenteTexto; recorrido: "132 km" | "Sin uso"; href; nombreAccesible }[]; vacio: "Todavía no envió partes." | null };
}

// ---- Parte (6.5): la vista según el caso
VistaDeParte = ParteNoEncontrada | ParteNoDisponible | ParteEnLectura | ParteEnEdicion
ParteNoEncontrada  = { tipo: "no-encontrada"; titulo /* h1 */; mensaje; enlace: { texto: "Ir a Parte diario"; href } }
ParteNoDisponible  = { tipo: "no-disponible"; titulo: "No se puede cargar este parte"; mensaje /* la regla P2/P8/baja */; borrador: { parteId; descartar: "Descartar borrador" } | null; enlace }
ParteEnLectura     = { tipo: "lectura"; titulo: "Parte del miércoles 18/11/2026"; unidadId; patente; patenteTexto; interno; descripcion; conductor: string | null; panel: PanelParteEnviado;
                       puntosEnOrden: "9 puntos en orden: Dirección, …" | null; novedades: { rotulo; texto; critica }[]; vuelta: { texto; href } }
ParteEnEdicion     = { tipo: "edicion"; titulo /* h1 */; unidadId; patente; patenteTexto; interno; descripcion; fecha; fechaTexto: "18/11/2026"; esHoy;
                       avisoFueraDeTermino: string | null; avisoAptitud: string | null;
                       parteId: string | null /* null hasta el primer guardado */; borrador: { guardadoEl: "18/11/2026 14:32" | null; hora: "14:32" | null; mensaje: "Borrador recuperado, guardado en este equipo el 18/11/2026 a las 14:32." } | null;
                       conductor: { tipo: "fijo"; id; nombre } /* Conductor */ | { tipo: "elegir"; etiqueta: "Conductor"; opciones: { valor; etiqueta; asignadoA }[] } /* Encargado; la primera es «Elija quién conduce» con valor "" */;
                       valoresIniciales: ValoresParte;           // para ARRANCAR el formulario; no se vuelve a leer
                       ayudaKmInicio; ayudaKmFin: "Complételo al final del día."; ayudaLitros: "Deje vacío si no cargó.";
                       puntos: { id; texto; critico; notaCritica: string | null }[]   // los 10, en orden; la nota solo en los críticos (5.12)
                       etiquetaImpideUso: "Impide usar la unidad"; etiquetaOtraNovedad: "Otra novedad (opcional)";
                       combustible: { valor: NivelCombustible; etiqueta: "Reserva" | "1/4" | "1/2" | "3/4" | "Lleno" }[];
                       vuelta: { texto: "Parte diario" | "Ficha de ZK 214 BD"; href } }
PanelParteEnviado  = { titulo: "Parte enviado"; linea: "ZK 214 BD, 18/11/2026, enviado a las 18:42."; filas: { rotulo; valor }[] /* Recorrido, Combustible, Combustible cargado, Novedades */;
                       avisoCritica: string | null; advertencias: string[]; fueraDeTermino: "Enviado fuera de término." | null; volverAlInicio: { texto: "Volver al inicio"; href } }

// ---- El formulario (dominio/formulario-parte.ts): TODO es texto
ValoresParte = { conductorId: ""|id; kmInicio: "84.320"; kmFin; checklist: Record<ItemChecklist, { respuesta: "" | "en-orden" | "con-novedad"; descripcion; impideUso: boolean }>;
                 combustible: "" | NivelCombustible; litros: "45,5"; otraNovedad: { descripcion; impideUso } }
CAMPOS_PARTE                                   // el orden del formulario y del resumen: conductor, kmInicio, kmFin, los 10 puntos, combustible, litrosCargados, otraNovedad
recorridoDe(kmInicio, kmFin): string           // para el <output>: «132 km», «Sin uso», «—»
reformatearKm(texto): string                   // al salir del campo: «84320» → «84.320»
respondidos(valores): number                   // «Respondidos: 3 de 10»
textoBarraDeEnvio(valores): string             // «Faltan 5 datos» | «Falta 1 dato» | «Listo para enviar»
validarParaEnviar(valores): ErroresDeParte | null
ErroresDeParte = { titulo: "Faltan 3 datos para enviar el parte" | "Revise 1 dato para enviar el parte" | "No se pudo enviar el parte"; porCampo: Partial<Record<CampoParte, string>>; lista: { campo: CampoParte; mensaje }[] /* en el orden del formulario */; general: string | null }

// ---- Autoguardado (estado/autoguardado.ts)
Autoguardado = { indicador: IndicadorDeGuardado;
                 cambio(valores): void                      // en cada `input`: guarda 500 ms después de la última tecla
                 alSalirDelCampo(valores): Promise<ResultadoDeBorrador | null>   // en `blur`: guarda ya; null si no había nada
                 vaciar(valores?): Promise<ResultadoDeBorrador | null>           // antes de irse de la pantalla
                 reiniciar(valores): void                   // después de descartar el borrador: nueva base (los valoresIniciales de la vista nueva)
                 cerrar(): void }                           // al desmontar la pantalla
IndicadorDeGuardado = { estado: "inicial" | "guardando" | "guardado" | "campos" | "error"; visible: string /* «Guardado en este equipo a las 14:32», «Guardando…» */; anuncio: string /* el texto del role="status": cambia solo al cambiar de estado */; hora: string | null }
ResultadoDeBorrador = { ok: true; parteId: string | null; hora: string | null; sinCambios: boolean } | { ok: false; tipo: "campos" | "escritura" | "regla"; errores: ErroresDeParte }   // con "campos": mostrar errores.porCampo al salir de cada campo

// ---- Enviar
ResultadoDeEnvio =
  | { tipo: "enviado"; yaEnviado: boolean; panel: PanelParteEnviado; foco: "titulo-del-parte-enviado" }
  | { tipo: "errores"; errores: ErroresDeParte; foco: "resumen-de-errores"; primerCampo: CampoParte | null }
  | { tipo: "advertencias"; advertencias: { tipo; texto; tono: "critico" | "semana" }[]; aceptables: Advertencia["tipo"][]; foco: "dialogo-antes-de-enviar" }   // «Antes de enviar»; «Enviar igual» → app.enviarParte(…, aceptables)
```

```svelte
<script lang="ts">
  import { app } from "../lib/estado/instancia.ts";
  import { recorridoDe, reformatearKm, textoBarraDeEnvio, type ValoresParte } from "../lib/dominio/formulario-parte.ts";
  import type { ParteEnEdicion, PanelParteEnviado } from "../lib/estado/parte.ts";
  import type { IndicadorDeGuardado } from "../lib/estado/autoguardado.ts";

  const vista = $derived(app.parteDeLaRuta);                       // VistaDeParte | null
  // La pantalla de edición vive dentro de {#key vista.unidadId + vista.fecha + app.perfil.tipo}: así se re-inicia al cambiar de parte o de perfil.
  // Dentro: const e: ParteEnEdicion = …; let valores = $state<ValoresParte>(structuredClone(e.valoresIniciales));
  let indicador = $state<IndicadorDeGuardado>({ estado: "inicial", visible: "", anuncio: "", hora: null });
  const auto = app.autoguardadoDeParte(e, (i) => (indicador = i));  // onDestroy(auto.cerrar)
  // <input oninput={() => auto.cambio($state.snapshot(valores))} onblur={() => { valores.kmFin = reformatearKm(valores.kmFin); void auto.alSalirDelCampo($state.snapshot(valores)); }}>
  async function enviar(aceptadas = []) {
    const r = await app.enviarParte(e.unidadId, e.fecha, $state.snapshot(valores), aceptadas);
    if (r.tipo === "errores") { resumen = r.errores; /* foco al resumen */ }
    else if (r.tipo === "advertencias") { /* abrir «Antes de enviar» con r.advertencias; «Enviar igual» → enviar(r.aceptables) */ }
    else { panel = r.panel; /* foco al h1 «Parte enviado» */ }
  }
</script>
```

**Cosas para tener en cuenta al maquetar.**
- `valoresIniciales` es para arrancar: cada autoguardado cambia el estado de la aplicación y `app.parteDeLaRuta` se recalcula (cambia `parteId` y `borrador`), pero la vista no tiene que volver a copiar los valores (pisaría lo que se está escribiendo). Hay que pasar a `autoguardadoDeParte` la vista con la que arrancó el formulario y pasarle a `cambio`/`alSalirDelCampo` una copia (`$state.snapshot`), no el proxy.
- Después de enviar, `app.parteDeLaRuta` pasa a `lectura` por sí solo: la pantalla tiene que mostrar el `panel` del resultado (con el `h1` «Parte enviado» y el foco) y no cambiar de pantalla hasta que la persona elija «Volver al inicio». Al volver a abrir el parte, `lectura.panel` trae los mismos datos.
- «Descartar borrador» (dos pasos, `BotonConfirmar`): `app.descartarBorradorDeParte(parteId)`; después `auto.reiniciar(nuevaVista.valoresIniciales)` y reiniciar los valores del formulario con los de la vista nueva. El mismo botón del inicio del conductor y de `no-disponible`.
- El indicador visible muestra `indicador.visible`; el `role="status"` muestra SOLO `indicador.anuncio`. Con `estado: "inicial"` y un borrador recuperado, mostrar `vista.borrador.mensaje`. Con `estado: "campos"`, `errores.porCampo` del último `alSalirDelCampo` va sobre cada campo.
- «Enviar parte» nunca se deshabilita (5.14): `enviarParte` devuelve el resumen. La barra dice `textoBarraDeEnvio(valores)`; «Respondidos: n de 10», `respondidos(valores)`; el `<output>`, `recorridoDe(valores.kmInicio, valores.kmFin)`.
- Con el perfil Conductor el campo Conductor es texto fijo (`conductor.tipo === "fijo"`); con el Encargado, un `select` (la primera opción, vacía, es «Elija quién conduce»).
- Sin `{@html}`: todo texto (descripciones de novedades, motivos) se muestra literal.
- Rutas: `#/parte/ZK214BD/2026-11-18` (los dos perfiles); `#/conductor` (solo Conductor). «Cargar parte» de la ficha ya apunta al de hoy; «Abrir parte» y «Continuarlo» al de su fecha.

**Verificación.** Aceptación del plan con el ejemplo del generador (fechaBase 2026-11-18) y la API del estado: borrador que sobrevive a una recarga (otra instancia de la aplicación sobre el mismo almacenamiento recupera lo escrito, el conductor y la hora); enviar vacío → resumen de errores de 12 datos en el orden del formulario con el foco en el resumen y nada escrito; K3 con 1 km menos (ZYN 469: 120.719 contra 120.720) → error en «Al iniciar», el borrador queda y no hay evento;
frenos con novedad → eventos `parte-enviado`, `novedad-abierta`, `fuera-de-servicio`, la unidad pasa de 4 a 5 en el protagonista del encargado («fuera de servicio»), sube en uno la fila de novedades críticas de operación, el Horizonte queda igual y la ficha dice «fuera de servicio». Además: doble envío, parte ya enviado, parte de otra fecha (C13 «fuera de término» y adiós a la alerta P5), unidad inexistente, fuera de servicio y de baja, conductor sin unidad asignada, salto absurdo, P12 (falla del envío, el borrador no cambia), D10 (falla del guardado) y partes con la forma rota.
`npm test`: 1234 tests (1060 + 174), verdes también con `npm run test:tz` (UTC, Asia/Tokyo y America/Los_Angeles); `npm run check`: 0 errores; `npm run buscar`: sin hallazgos.
Pendiente: las pantallas (maquetador): inicio del conductor (6.4), parte (6.5) con el diálogo «Antes de enviar», el panel «Parte enviado» y el parte en lectura; revisión de los textos nuevos por `redactor-ux`.

## 18/11/2026 (noche, 16 · rama `interfaz-etapa-0`) — Correcciones de lógica de la revisión de la Etapa 4

**Qué se hizo.** Los hallazgos de lógica de los informes de QA y de código de la Etapa 4, con el test que falla primero. Lo de presentación (QA M1, accesibilidad, código M2 y M7) queda para el maquetador.

| Hallazgo | Arreglo |
| --- | --- |
| QA A1 (alta): una pestaña desactualizada pisa lo hecho en otra | `EstadoApp.ejecutarAhora` rechaza todo comando con `cambios-en-otra-pestana` mientras el aviso D9 siga sin atender (texto nuevo `ERRORES_PESTANAS`). 5 tests con dos pestañas sobre el mismo almacenamiento (baja que no se deshace, renovación que no se duplica, formularios, «Actualizar» y «Reiniciar demo» siguen). |
| QA M2: `84.5` en un `Campo` km pasaba a 845 | `reformatearKm` (kilometraje.ts, basada en `parsearKm`) solo reformatea un entero bien escrito; `Campo.svelte` la usa y `formulario-parte.ts` la reexporta (había una copia). 4 tests (decimales, `1.2.3`, `1.000.00`, `12 3`, espacios no separables). |
| QA M3 y código M1(a): datos con el tipo roto dejaban la pantalla en blanco | El arranque (D7) valida el tipo de todos los campos que leen las pantallas (unidades, conductores, proyectos, documentos, novedades, correcciones, eventos). 30 tests de casos dañados que regeneran el ejemplo con el aviso, más uno que confirma que un parte con checklist incompleto sigue leyéndose con `parteLegible`. |
| Código M1(b): sin red de seguridad | `<svelte:boundary>` en `main` de `App.svelte` con pantalla de error (recargar / reiniciar demo); reintenta al cambiar de pantalla. Sin test automático (no hay DOM en vitest): ver «Sin verificar». |
| Código M3: un guardado que falla deja el diálogo bloqueado | `guardarConIndicador` (estado/guardado.ts, 5 tests) con `try/catch/finally`; los tres diálogos de formulario lo usan. |
| Código M4: casts que mienten | `Comando.altaUnidad.tipoUnidad` y `cargarDocumento.tipoDocumento` son `string` y el dominio los estrecha con `esTipoDeUnidad` / `esTipoDocumento`; `cargarOtroDocumento` estrecha antes de armar el comando. 2 tests. Quedan los casts de `DialogoFormulario` (genérico, aceptable según el informe) y `a.grupo as Grupo` (el informe lo deja «a futuro»). |

**Decisiones propias** (también en `diseno.md`, sección 16, última viñeta): pestaña desactualizada = solo lectura para todos los comandos (incluye el autoguardado del parte); los partes quedan fuera de la validación estricta del arranque porque `parteLegible` los tolera a propósito; la pantalla de error del boundary usa los botones del marco.

**Textos nuevos** (al final de `src/lib/dominio/textos.ts`, para que el redactor los revise): `ERRORES_PESTANAS.escrituraConCambiosEnOtraPestana` y `TEXTO_ERROR_PANTALLA` (`titulo`, `mensaje`).

**Para el maquetador.** `DialogoDocumento` y `DialogoUnidad` siguen duplicando a `DialogoFormulario` (código M2): los tres ya usan `guardarConIndicador`, así que al unificarlos queda un solo lugar. El `<svelte:boundary>` de `App.svelte` envuelve el `{#if}` de `main` sin reindentarlo (para no tocar de más el archivo); la pantalla de error reusa las clases `.encabezado`, `.parrafo` y `.acciones-error`. Vale revisar cómo se ve (360 px y claro/oscuro).

**Verificación.** `npm test`: 1275 tests (1234 antes), también con `npm run test:tz`; `npm run check`: 0 errores; `npm run build` y `npm run buscar`: sin hallazgos.
**Sin verificar.** El boundary no se probó en un navegador (no hay forma sencilla de forzar un error de dibujo, y el arranque ahora regenera los datos dañados que lo provocaban antes); que «Reiniciar demo» repare datos dañados (QA M3) ya no hace falta, porque el arranque los regenera.

## 18/11/2026 (noche, 17 · rama `interfaz-etapa-0`) — Paso 4.5 (pantallas): inicio del conductor y parte diario; correcciones de presentación de la revisión de la Etapa 4 (maquetador)

**Qué se hizo.**
- *Pantallas del 4.5.* `PantallaConductor` (6.4: panel «Hoy» con sus cinco estados, `select` «Usar otra unidad» / «Elija la unidad», «Pendientes», «Su licencia», «Mis últimos partes»), `PantallaParte` (6.5) con `ParteFormulario` (kilometraje, conductor en el perfil Encargado, diez puntos con `ItemRevision`, `SelectorCombustible`, litros, «Otra novedad», indicador de guardado, resumen de errores, barra de envío, «Descartar borrador»), `DialogoAntesDeEnviar`, `ParteEnviado` (el panel de «Parte enviado» y, con otro título, el parte en lectura), «No se puede cargar este parte» y «No se encontró la unidad». Enchufadas en `App.svelte` (`#/conductor`, `#/parte/…`); la dirección desconocida muestra «Página no encontrada» con su camino de vuelta. Piezas tocadas: `EnlaceAccion` (variante primaria y grande, nombre accesible), `ResumenErrores` (texto general y enlaces de 44 px), `Panel`. Textos de presentación en `textos-marco.ts` (`TEXTO_CONDUCTOR_VISTA`, `TEXTO_PARTE_VISTA`) para `redactor-ux`.
- *Correcciones (informe de revisión interno (no publicado) de la etapa 4).* QA M1; accesibilidad M1 a M4 y B1 a B7; código M2 y M7; el `<svelte:boundary>` de `App.svelte` reindentado y probado a mano (ver abajo). Detalle en `diseno.md`, sección 16, últimas dos viñetas.

**Decisiones.** Quince puntos en `diseno.md`, sección 16 («Paso 4.5 … pantallas»). Las que más pesan: «Enviar parte» es `type="button"` (Enter en un campo no envía); el error de un campo del envío queda hasta que se lo toca; «Parte enviado» es estado de la pantalla y «Imprimir» no está (6.1); las secciones son `section` con `h2` y no `legend`; sin unidad, «Empezar el parte» aparece al elegir una.

**Para la lógica (no se tocó).** (1) Con la unidad fuera de servicio por el parte de hoy, el panel «Hoy» no muestra «Enviado a las…» ni «Ver el parte» (`hoyEstado` mira primero la unidad). (2) `ResultadoGuardadoDocumento` (`app.svelte.ts`) quedó sin uso: puede ser `ResultadoGuardado<CampoDocumento>`. (3) QA B1, B3, B4 y D1 a D6 siguen abiertos (son de lógica o de contenido). (4) El error K3 le dice a quien carga «avise al encargado» también cuando lo ve el encargado.

**Sin hacer.** Accesibilidad B8 (token `--c-neutro-r`: `#737980` y los pares `tono-r / acento-suave` en `contraste.mjs`; los tokens quedaron intactos a pedido).

## 19/11/2026 (18 · rama `interfaz-etapa-0`) — Correcciones de presentación de la revisión del paso 4.5 (maquetador)

**Qué se hizo.** Los hallazgos de presentación de los tres informes de la revisión del 4.5 (informe de revisión interno (no publicado)). N1 es de lógica y no se tocó.

| Hallazgo | Arreglo |
| --- | --- |
| Accesibilidad N2, QA B3: título de pestaña en «No se puede cargar este parte», «No se encontró la unidad» y «Parte enviado» | `PantallaParte` informa su título con `bind:titulo` y `App.svelte` lo suma al sufijo; sin título propio, el de la ruta. Verificado en los siete estados. |
| N3: el resumen de errores saltaba de `h1` a `h3` | `ResumenErrores` recibe `nivel`: `h2` en las pantallas, `h3` en los diálogos (su título ya es `h2`). axe: 0 violaciones en el parte con errores (antes 4 combinaciones con `heading-order`). |
| N4: el parte no decía qué es obligatorio | Línea «Los campos con * son obligatorios.» (`TEXTO_DIALOGO.obligatorios`) y una frase nueva para los diez puntos y el combustible. |
| N7: radios sin responder sin estado inválido | Los diez `fieldset` de los puntos y el del combustible son `role="radiogroup"` con `aria-required` y, sin responder tras enviar, `aria-invalid` (en el radio no se admite: `svelte-check` y ARIA 1.2 lo marcan). |
| N5: «Confirmar descarte» se desarmaba a los 4 s | Sin límite de tiempo (coincide con `diseno-ui.md` 5.1, que no lo pedía). Se desarma con Esc, al mover el foco, al salir con el mouse y al tocar o hacer clic en otro lado (nuevo: el táctil no tenía otra forma). |
| N6: elegir otra unidad cambiaba el panel «Hoy» sin avisar | Se anuncia «Unidad elegida: ZI 442 TU (Int. 02).» en la barra de estado del panel (la elección repetida también se anuncia). |
| I2: 28 «Ver el parte completo» con el mismo nombre | `aria-label` «Ver el parte completo enviado el 17/11/2026 a las 18:24» (empieza por el texto visible). Los 28 nombres son distintos. |
| QA B4: «Frenos(crítica):» | Se arma el rótulo con la palabra y el paréntesis en una sola cadena. |
| QA B5: el primer clic en «Usar otra unidad» se perdía | `Dialogo.svelte` absorbía todo clic de los 350 ms siguientes a cerrar; ahora solo el que cae a menos de 12 px del toque que cerró (o abrió) el diálogo. 5 de 5 clics inmediatos funcionan (0 de 5 antes); el doble clic sigue absorbido. |
| QA B6: «Avisos aceptados» copiaba la invitación del diálogo | `textoAdvertenciaAceptada` (en pasado: «Se envió igual: quedó registrado que…»), usada por el panel, el parte en lectura y el historial. **Toca `src/lib`** (ver abajo). |
| QA B8: un nombre de conductor sin espacios ensanchaba la página | La barra «Ver como» parte el nombre: con 2.000 caracteres, de 14.844 px a 360 px de ancho de página. Era la barra y no el parte. |
| Código B6: `select` en blanco con la unidad de hoy fuera de servicio | Confirmado en el navegador (`selectedIndex` −1); la unidad de hoy parte como elegida solo si está entre las opciones. |
| Código B7: se comparaba el texto «—» como bandera | **Toca `src/lib`**: `sinVencimiento` y `sinFecha` en las filas del centro de alertas; la vista ya no compara texto. |
| Zoom 200 % y 400 % (el QA no pudo medirlo) | Sin desborde horizontal en los once escenarios del parte, claro y oscuro, a 640 × 360 y 320 × 180 px. A 400 % la barra de envío (73 px de 180) tapaba el 18 % de «Otra novedad» con foco: con menos de 30 rem de alto ya no se pega (el mismo criterio que el diálogo). |

**Toca `src/lib` (mínimo, avisado).** `dominio/textos.ts` (`textoAdvertenciaAceptada`), `estado/parte.ts` y `estado/ficha.ts` (la usan en lugar de `textoAdvertencia`), `estado/centro-alertas.ts` (dos campos booleanos nuevos; los textos de siempre no cambian). Tests: uno nuevo en `textos.test.ts`, uno actualizado en `parte-vista.test.ts` y dos aserciones en `centro-alertas.test.ts`. Pueden pisarse con la rama de la lógica solo en esas líneas.

**Textos nuevos (para `redactor-ux`).** `TEXTO_PARTE_VISTA.obligatoriosRevision` («Los puntos de revisión y el nivel de combustible también.»); `TEXTO_CONDUCTOR_VISTA.unidadElegida` («Unidad elegida: ZI 442 TU (Int. 02).»); `TEXTO_FICHA_VISTA.historial.verParteEnviado` («Ver el parte completo enviado el 17/11/2026 a las 18:24»); `textoAdvertenciaAceptada` en `textos.ts` («Se envió igual: quedó registrado que la unidad circuló con documentación vencida.»).

**Verificación.** `npm test`: 1276 tests (1275 antes), verdes; `npm run check`: 0 errores y 0 avisos; `npm run contraste`: 158 mediciones, 0 fallan, 9 justas (igual que antes; no se tocaron tokens); `npm run buscar`: sin hallazgos (7 reglas, 187 archivos); `npm run build` sin errores y `_headers` igual al de `public/`. Playwright (Chromium) contra `npm run dev` y contra el build servido con `public/_headers`: 24 pantallas y estados (inicio del conductor con sus cinco estados y «Usar otra unidad», parte vacío, con errores, con 1 error, con borrador, «Antes de enviar», «Parte enviado», lectura, «No se puede cargar», «No se encontró la unidad», 404, perfil Encargado, alertas, flota, ficha, historial abierto y un diálogo con resumen de errores) × 320, 360, 768 y 1280 px × claro y oscuro = 192 combinaciones en cada uno, **0 con problemas**: sin desborde horizontal, todo lo pulsable de 44 px o más (la casilla se mide por su `label`), 0 mensajes de consola, 0 violaciones de CSP, axe-core (WCAG 2.0 a 2.2 A y AA y buenas prácticas) con 0 violaciones. Además, script por hallazgo (antes y después contra un `worktree` del commit anterior para B5, B6 y B8). Zoom: 200 % (640 × 360) y 400 % (320 × 180 y 320 × 240), once escenarios del parte: sin desborde; foco de las 35 y 47 paradas del parte sin quedar tapado por la barra de envío (con 320 × 180 antes tapaba el 18 % de «Otra novedad»). **No se probó:** lector de pantalla real, Firefox, Safari, pantalla táctil real; el desarmado de «Confirmar descarte» con un toque real (se probó con un clic del mouse fuera del botón).

**Sin hacer.** N1 (lógica). Accesibilidad B8 (token `--c-neutro-r`). Código M1 a M4 y B1 a B5, B8 y B9 (lógica, pruebas y README). QA M-1, M-2, B1, B2, B7, B9 y D1 a D5 (lógica o contenido).
## 18/11/2026 (noche, 18 · rama `logica-4-5c`) — Correcciones de lógica de la revisión del paso 4.5 (programador)

**Qué se hizo.** La lógica que marcaron los informes de código, QA y accesibilidad del 4.5 (informe de revisión interno (no publicado)), con el test que falla primero. Un commit por tema, sin push. Rama aparte (un `git worktree` aparte, creado desde `interfaz-etapa-0`) para no pisar al maquetador.

| Hallazgo | Arreglo |
| --- | --- |
| Código M1, QA M-1 (partes crudos tumban la app o la ficha) | `arrancar` y `actualizar()` leen todos los partes con `parteLegible` (`partesLegibles`, arranque.ts). Un registro que no es un parte (estado o fecha imposibles) cuenta como otro formato (D7). 25 tests nuevos (`tests/partes-rotos.test.ts`). |
| Código M2 (`guardar` que rechaza cuelga el indicador) | `ejecutar` del autoguardado atrapa el rechazo: error de escritura, indicador en «error», lo escrito sigue pendiente. 3 tests. |
| Accesibilidad N1, QA B7 («revise los campos marcados» sin campo marcado) | Mientras se escribe, el indicador dice «Sin guardar: lo que escribió todavía no es válido.» y no anuncia; al salir del campo, enviar o irse (acción explícita) dice «corrija los campos marcados» y anuncia. Solo lógica: la vista no cambió. 4 tests. |
| Código B9 (cambiar de perfil con un guardado en cola) | `autoguardadoDeParte` toma el perfil al abrir; `guardarBorradorDeParte`, `ejecutarAhora` y el ensayo reciben el perfil (conductor y autor). 2 tests. |
| Código B8 (doble guardado) | Un borrador igual (salvo `actualizado`) no se escribe. 3 tests. |
| QA M-2 («Revisión técnica vencido») | `textoVencimiento`, `clasificar` y `evaluarObligatorio` concuerdan con el documento. 5 tests (los 6 tipos). |
| QA B2 (descartar desde pestaña vieja) | `descartarBorradorDeParte` devuelve `errores` con el título «No se pudo descartar el borrador». 1 línea de vista. 1 test. |
| QA B9 (mensajes de formato) | Km de más de 20 dígitos: «no puede superar 2.000.000 km»; litros `1.000`/`1,000`: «no pueden superar 200». 2 tests. |
| Código B5 | `parteLegible` deja `kmFin = null` si es menor que `kmInicio`. 1 test. |
| Código B4 | `nivelLegible` y `advertenciasLegibles` reemplazan dos casts. 1 test. |
| Código B1 | Se borran los campos que ninguna pantalla leía (`fechaCorta`, `nombreAccesible`, `conductor` del inicio, `fechaTexto`, `esHoy`, `borrador.guardadoEl`/`.hora`) y `textoParteReciente`. |
| Código B2, B3 | `ResultadoGuardadoDocumento` → `ResultadoGuardado<CampoDocumento>`; el comentario de `documentoVigente` vuelve a su función. |

**Decisiones propias** (en `diseno.md`, sección 16, última viñeta, y sección 14): un parte ilegible regenera el ejemplo con el aviso D7 en vez de descartarse en silencio; «Avise al encargado» no se tocó (el de aptitud ya no le llega al encargado y el de la licencia solo está en el inicio del conductor); la pérdida al recargar dentro de los 500 ms queda como límite conocido.

**No hecho.** QA B1 (escribir y recargar en menos de 500 ms pierde el texto): se probó agregar `pagehide` (vacía el autoguardado) y no alcanza, porque guardar en IndexedDB son tres idas y vueltas (leer `meta`, buscar la clave, escribir) y una recarga real no las espera; con `pagehide` simulado sí guarda. Arreglarlo es cambiar el repositorio (otra tarea) o sumar otro almacenamiento síncrono; quedó como límite conocido y se revirtió la línea de vista. Código B4 tercer cast (`ParteFormulario.svelte`, `$state.snapshot(valores) as ValoresParte`), B6 y B7: de vista. M3 y M4 del informe de código (pruebas de pantalla, README y licencia): fuera de esta tanda. QA B3 y B4, accesibilidad N2 a N7 y D1 a D5: de vista o de contenido.

**Vista tocada.** Una línea en `ParteFormulario.svelte` (`erroresEnvio = r.errores;` en `descartar`, antes `errorGeneralParte(r.mensaje)`; la importación sigue en uso).

**Verificación.** `npm test`: 1322 tests (1275 antes), también con `npm run test:tz`; `npm run check`: 0 errores y 0 avisos; `npm run build` y `npm run buscar`: sin hallazgos; sin nombres prohibidos fuera de la regla de `buscar`.

## 19/11/2026 (rama `interfaz-etapa-0`) — La búsqueda de prohibidos ya no nombra a nadie (programador)

*Reemplazado el 25/11/2026: las huellas se quitaron del repositorio; los términos viven en un archivo local no versionado (última entrada de este registro). Lo que sigue es el registro de entonces.*

**Qué se hizo.** `scripts/buscar-prohibidos.mjs` traía escritos en claro los nombres de terceros y el patrón de correos personales que busca: un repositorio público no puede contenerlos. Se rediseñó para comparar **huellas** (SHA-256 del término normalizado) y se borraron los literales.

| Pieza | Qué es |
| --- | --- |
| `scripts/prohibidos.mjs` (+ `.d.mts`) | Módulo puro: `normalizar` (minúsculas, sin acentos), `tokenizar`, `crearHuella`, `contieneProhibido` (una palabra como trozo de cada palabra, frases de 2 a 3 palabras como n-grama exacto), `correosNoPermitidos` (regla genérica: cualquier correo que no sea de dominio de ejemplo ni `noreply`) y `huellasDeLiterales`. |
| `scripts/huellas-prohibidas.mjs` (+ `.d.mts`) | Las huellas (hoy dos nombres de terceros). Los correos personales no llevan huella: los cubre la regla genérica. |
| `scripts/buscar-prohibidos.mjs` | Dos reglas en lugar de una (nombres por huella, correos genéricos), sin excepción para sí mismo (ahora se revisa también). Lee `.prohibidos.local` si existe. |
| `.gitignore` / `.prohibidos.local` | Archivo local opcional con términos extra (uno por línea, `#` comenta); ignorado por git y salteado por la búsqueda. |
| `tests/prohibidos.test.ts` | 31 tests, todos con términos inventados: normalizador, tokenizado, huellas, detección (otra mayúscula, acento, pegado a otra palabra o identificador, n-grama con otros separadores, frase incompleta o desordenada, falsos positivos), carga local y correos. Los ejemplos de correo arman la arroba aparte para no activar la propia búsqueda. |

**Decisiones propias** (documentadas en `docs/diseno.md`, sección 16, última viñeta, y en `docs/stack.md`, sección 7): un término de una palabra se busca como trozo de palabra (igual que la búsqueda en claro, que encontraba el nombre dentro de un identificador); cada huella guarda la longitud del término para no hashear todos los trozos; se mira línea por línea; la regla de correos es genérica y permite `example.com/.org/.net`, los TLD reservados y `noreply`. Límite: es una huella, no cifrado; una palabra corta se adivina con un diccionario.

**Verificación.** `npm test`: 1354 tests (31 nuevos), `npm run check`: 0 errores y 0 avisos, `npm run build` y `npm run buscar` (8 reglas) sin hallazgos. Comparación con el script anterior (`git show HEAD:`, en un archivo temporal fuera del repo) sobre el árbol actual: ninguno de los dos encuentra nada. Con un archivo plantado temporalmente (términos en minúscula, mayúscula, dentro de un identificador, en una URL y un correo de proveedor personal) el nuevo encontró todo lo que encontró el anterior y además un término con acento y un correo de otro proveedor; con `.prohibidos.local` encontró también el término local. Archivo plantado y archivo local borrados.

## 19/11/2026 (rama `interfaz-etapa-0`) — Correcciones de la revisión visual del paso 5.3 (maquetador)

**Qué se hizo.** C1, C2, C4 a C13, C16, C18 y el cambio de código de S2 del informe de revisión interno (no publicado) de diseño de la etapa 5. Solo `src/componentes/`, un símbolo de `index.html` y cuatro textos de `textos-marco.ts`; sin tocar la lógica, los tokens ni las dependencias. Un commit por hallazgo (o grupo). Medido contra el build servido con `public/_headers`, antes y después.

| Hallazgo | Cómo quedó | Antes → después |
| --- | --- | --- |
| C1 (alta) | Parte, perfil Conductor: sin el renglón «Conductor: …», patente con interno y modelo (sin el tipo) juntos, aviso con el hecho en 600 y la acción en letra chica, «← Parte diario» y el rótulo de la demo en un renglón, `h1` de 22 px a menos de 30 rem de ancho. Confirmado: es lo que tapaba el primer campo a 360 px. | «Al iniciar» a 360 × 780: 776 → 590 px (a 1280: 600 → 474) |
| C2 | «Tamara Olivera (ficticia)» y «Cambiar» a continuación del selector; una sola fila desde 48 rem, renglón propio debajo antes. | Barra del conductor a 1280: 109 → 61 px; a 360: 182 → 158 px |
| C4 | Grilla hora · ícono · resumen · autor (autor a la derecha desde 40 rem; con poco ancho, en el renglón de la hora); flecha del `details` en el primer renglón del resumen. | Evento cerrado: 82 → 60 px (1280), 119 → 97 px (360); ficha ZK 214 BD 5.602 → 4.936 px (1280) y 8.367 → 7.933 px (360) |
| C5 | `align-items: start` en la grilla de escritorio de la ficha. | Sin el hueco bajo Documentos |
| C6 | «Anteriores (N)» pasó a una celda propia, última de la fila y a todo el ancho. | Estado a 54 px del borde de la fila en todas (antes 54 y 80); a 360: 41 (antes 85) |
| C7 | Tarjetas sin rótulos visibles; estado y fecha en un renglón («Vence en 5 días · 24/11/2026»); patente, interno y modelo en un renglón; proyecto en letra chica; flota con «km · último parte …» en un renglón y las novedades solo si hay. Los `data-etiqueta` siguen (los rótulos eran decorativos para los lectores). | Alertas 307 → 172 px, operación 244 → 169 px, flota 290 → 189 px (medianas a 360) |
| C8 | El enlace de la patente (44 px de blanco táctil) ya no ocupa lugar: `margin-block` de −10 px. | Fila de vencimientos a 1280: 82 → 62 px |
| C9 | `table-layout: fixed` con anchos por columna desde 66 rem; horizonte mínimo siempre a la izquierda (columna de 4 rem); sin el tipo en la segunda línea de la unidad. | Fila de la flota a 1280: 99 → 62 px (mediana); página 2.952 → 2.294 px |
| C10 | «Buscar» visible (solo para lectores en escritorio), marcador «Patente, modelo o conductor», Proyecto y Ordenar por en una fila. | Primer resultado a 360 unos 60 px más arriba |
| C11, C12 | Segmento con menos relleno y `flex-wrap`; «Punto crítico» debajo del nombre a menos de 40 rem y a la derecha desde 40 rem. | «Con novedad»: 2 renglones → 1 a 360; etiqueta siempre en el mismo lugar |
| C13 | Intro, enlace y aclaración en un solo grupo (`inline-flex`, `column-gap` de 4 px). | — |
| C16 | `BotonConfirmar` con `variante="texto"` (armado sigue pasando a Peligro). | — |
| C18 | `i-octogono`: octógono de 19 × 19, `stroke-linejoin: miter`. Se probó la versión alineada a la grilla de 16 px y se descartó (líneas más finas y borrosas). | A 14 y 16 px se lee más como octógono, sin llegar a lados rectos largos |
| S2 | El filtro elegido: fondo `--c-superficie-2` + línea de 3 px del tono. `contraste.mjs` ya medía ese par. | — |

**Textos tocados** (solo los necesarios para C2 y C10; el redactor trabaja en el resto): `TEXTO_MARCO.conductorElegido` → «{nombre} (ficticia)» (el lector de pantalla antepone «Conductor: »), `TEXTO_MARCO.cambiar` nuevo («Cambiar»; «Cambiar conductor» queda como nombre accesible), `TEXTO_FLOTA_VISTA.buscar` → «Buscar» y `buscarMarcador` → «Patente, modelo o conductor» (con «interno» el marcador se cortaba a 360 px).

**No hecho / decisiones propias.** D1 a D4 (decide Matías) y C3, C14, C15, C17 (redactor). La parte de C1 que dice «línea de la barra en un solo renglón» queda en dos renglones a menos de 48 rem (selector y, debajo, el nombre con «Cambiar»: el botón mide 44 px). El nombre del conductor va a la derecha del selector y no a la izquierda (C2 pedía la izquierda): con la izquierda el orden visual no coincidiría con el orden de foco. Se pasaron a la vista dos cosas que conviene que el programador entregue ya partidas: el aviso «… no puede salir: … Avise al encargado antes de usarla.» (hoy se parte en la última frase) y la descripción de la unidad sin el tipo (hoy se recorta en « · »).

**Verificación.** `npm test` 1354, `npm run check` 0 errores y 0 avisos, `npm run contraste` 158 mediciones (0 fallan, 9 justas, igual que antes), `npm run buscar` sin hallazgos, `npm run build`. Playwright (Chromium) contra el build servido con `public/_headers`: 21 pantallas y estados (alertas con y sin filtro, «Cómo funciona», flota completa, vacía y filtrada, ficha de ZK 214 BD con historial y «Anteriores» abiertos, ficha de ZU 899 QE, unidad inexistente, ruta desconocida, parte del encargado, inicio del conductor, «¿Quién completa el parte?», parte vacío, con errores, con novedad crítica, con borrador, «Antes de enviar», «Parte enviado» y en lectura) × 320, 360, 768 y 1280 × claro y oscuro = 168 combinaciones, **0 con problemas**: sin desborde horizontal, todo lo pulsable de 44 px o más, 0 mensajes de consola, 0 violaciones de CSP, axe-core (WCAG 2.0 a 2.2 A y AA y buenas prácticas) con 0 violaciones. Un barrido anterior encontró un desborde de 14 px a 320 en la tarjeta de operación (estado largo + fecha); se corrigió pasando esa fila a `flex-wrap`. **No se probó:** lector de pantalla real, Firefox, Safari, pantalla táctil real.

## 19/11/2026 (rama `interfaz-etapa-0`) — Especificación: parte previo al uso, licencia que bloquea y decisiones D1 a D4 (disenador-ui)

**Qué se hizo.** Solo documentación; no se tocó código. Matías decidió el 19/11/2026: (1) el checklist del parte es
**previo al uso**; (2) la **licencia vencida o faltante bloquea** la revisión; (3) opción (b) en D1 a D4 de la revisión
visual del paso 5.3. Se escribió la especificación para que `programador` y `maquetador` la implementen sin adivinar.

| Documento | Qué cambió |
| --- | --- |
| `docs/diseno.md` | Usuarios, glosario y modelo (`Parte.estado` con `en-uso`, `revisado`, `sinSalida`); reglas P3 a P9, P12 y P13 reescritas, P14 a P17 nuevas; K8, K9 y K10; sección 6.10 nueva (L1 a L7, licencia); alertas (sección 7), comandos (sección 8: `enviarRevision`, `guardarCierre`, `enviarCierre`), casos C11 y C21 y números esperados del ejemplo (9.2); límites (14); notas en la sección 16 (P9 y 4.5 (3), (6), (7), (9)); **sección 17 nueva**: contrato de los comandos, funciones, estado, casos borde, 60 tests a escribir, tareas del programador y preguntas Q1 a Q5. |
| `docs/diseno-ui.md` | 6.4 y 6.5 reescritas (inicio con 7 estados en orden; parte en pantallas A revisión, B cierre, C1 a C3 resultados, D lectura, E no disponible); bloque «Conductores que no pueden manejar hoy» en el protagonista (6.1); etiquetas nuevas (5.7); textos exactos (sección 7); D1 a D4 aplicados (5, 5.7, 5.16, 6.1) y registrados (13); S1 a S9 escritos en su sección (4.2, 5.2, 5.4, 5.8, 5.9, 5.10, 5.16, 5.17, 5.19, 6.3); **sección 14 nueva** con el resumen y las tareas del maquetador. |

**Decisiones propias (a confirmar si no convencen):** dos envíos sobre el mismo registro de parte (no dos registros: P1
sigue); una novedad crítica en la revisión cierra el parte «sin salida» (recorrido 0, sin combustible); el cierre no
tiene límite de fecha ni mira la licencia; K3 y K4 cuentan el `kmInicio` de un parte en uso; la licencia se evalúa a la
fecha del parte con el criterio de M1 y bloquea también partes de días pasados; el error de licencia va antes que los
faltantes; `versionEsquema` pasa a 2 (D7 regenera el ejemplo); caso nuevo C21 (conductor con licencia vencida en H − 3)
para que el bloqueo se vea, que cambia los números del ejemplo (3 vencidos y faltantes, 12 vencimientos, 5 críticas).

**Preguntas para Matías** (sección 17.10 de `diseno.md`): Q1 novedad durante el uso en el cierre; Q2 si la documentación
de la unidad también bloquea; Q3 habilitación de manejo obligatoria; Q4 aceptar los números nuevos del ejemplo; Q5
bloqueo de partes de días pasados.

**Pendiente fuera de esta tanda:** el README todavía lista como límites «checklist de fin de jornada» y «licencia vencida
no impide salir» y cita los números viejos del ejemplo: se actualiza cuando el código esté hecho (`redactor-ux`).
Contrastes nuevos medidos con la fórmula de WCAG (variante texto de «Puede salir»: 6,62 y 9,91 sobre superficie);
falta sumarlos a `scripts/contraste.mjs` (tarea 1 del maquetador).

**Verificación.** `npm run buscar` sin hallazgos.

## 22/11/2026 (rama `interfaz-etapa-0`) — Parte previo al uso y licencia que bloquea: lógica de la sección 17 (programador)

**Qué se hizo.** Toda la lógica de `docs/diseno.md`, sección 17, con TDD (cada comportamiento se vio fallar antes del código). Un commit por tema, sin push.

| Capa | Qué cambió |
| --- | --- |
| Dominio | `Parte.estado` con `en-uso`, `revisado` y `sinSalida`; `estadoDeLicencia` (L1, L2, L5); kilometraje con salidas (`validarKmDeSalida`, `validarKmDeCierre`; se borra `validarKilometraje`); `faltantesDeRevision` y `faltantesDeCierre`; `documentacionVencidaEn` sin licencia; `conductorParaParte` con licencia; comandos `enviarRevision`, `guardarCierre` y `enviarCierre` (se borra `enviarParte`); rechazos `revision-ya-enviada`, `parte-sin-revision` y `licencia-no-vigente`; alertas P5, P17 y `conductoresSinLicencia` (L6). |
| Datos | Generador con revisión (06:00 a 07:29) y cierre (18:00 a 19:29) en cada parte pasado y sus dos eventos; C11 sin salida; caso C21; `versionEsquema` 2 (D7 regenera con aviso). Cambió el hash de D1 a propósito: `f8b3d6ad` → `43e7d988`. |
| Estado | Inicio del conductor con los siete estados, pendientes «sin cerrar»; pantalla del parte por modos (revisión, cierre, lectura, no disponible); `EstadoApp.enviarRevisionDeParte`, `guardarCierreDeParte`, `enviarCierreDeParte`, `autoguardadoDeCierre` y `opcionesDeConductor`; centro de alertas (conductores sin licencia, filas y grupos de partes incompletos), flota (`conductorSinLicencia`, «En uso» y «Sin cerrar») y ficha (`conductorSinLicencia`, salidas en el kilometraje, historial de la revisión y paso 10 o 30). |
| Vista (mínimo para compilar) | `ParteFormulario.svelte` (nombre del método), `PantallaParte.svelte` (la rama de error ya no incluye el cierre), `App.svelte` (las opciones del diálogo de conductor salen de `app.opcionesDeConductor()`) y `Muestras.svelte` (`etapaParte: null` en una alerta de ejemplo). `src/componentes/tipos.ts` suma `ETIQUETAS_DE_PARTE`, `OpcionConductor.licenciaVigente` y reexporta los tipos del estado. |

**Decisiones propias.** En `docs/diseno.md`, sección 17.11: datos de cierre de un borrador viejo, la unidad de C21 (Int. 16) y el relevo, `Alerta.etapaParte`, resúmenes de eventos, un solo
panel de resultado con `variante`, orden de errores del envío en la aplicación, `avisoAptitud` solo en borrador y sin parte, `PASO_HISTORIAL` como alias del paso ancho.
Preguntas: Q1 no, Q2 no, Q3 fuera de esta tanda, Q4 sí, Q5 bloquear.

**Verificación.** `npm test` 1489 (1354 antes), también con `npm run test:tz` (UTC, Tokio y Los Ángeles); `npm run check` 0 errores y 0 avisos; `npm run buscar` sin hallazgos;
`npm run build` y JS de 111,7 KB gzip (tope 120). **Sin verificar:** nada en el navegador (la vista todavía no tiene los dos pasos: con el formulario viejo, «Enviar» manda la revisión y los
campos del cierre se ven pero no se piden); `npm audit` no se corrió (sin dependencias nuevas).

**Para el maquetador.** La vista consume los tipos de `src/componentes/tipos.ts` (reexportan `lib/estado/parte.ts`, `centro-alertas.ts` y `formulario-parte.ts`). Lo nuevo: `VistaDeParte` con
`ParteEnEdicion` (paso 1), `ParteEnCierre` (paso 2), `ParteEnLectura`, `ParteNoDisponible` (con `nota`); `PanelParteEnviado.variante`; `EstadoDelDia` con `en-uso` y `licencia-no-vigente`;
`FilaDeConductorSinLicencia` en `protagonista.conductores`; `FilaFlota.conductorSinLicencia` y `ultimoParte.etiqueta` con «Sin cerrar» y «En uso».

## 22/11/2026 (rama `interfaz-etapa-0`) — Parte en dos pasos y licencia que bloquea: la vista (maquetador)

**Qué se hizo.** Las tareas 0 y 3 a 14 de `docs/diseno-ui.md` 14.2, sobre la lógica ya hecha. Sin tocar `src/lib/` ni los tests, salvo el alias `PASO_HISTORIAL` (tarea 0).

| Tarea | Qué quedó |
| --- | --- |
| 0 · Historial | `FichaHistorial.svelte` pasa el paso (10 o 30, leído una vez con `matchMedia`) a `vistaDeHistorial` y usa `botonVerMas`. Se retira el alias `PASO_HISTORIAL` de `ficha.ts` y de `tests/ficha.test.ts`. El evento `revision-enviada` ya salía en una línea, sin `details`. |
| 3 · Etiquetas | `EtiquetaParte.svelte` (texto, tono e ícono de `ETIQUETAS_DE_PARTE`; `texto` opcional para «Cerrado a las 18:42»). `i-flecha-der` se lee bien a 14 px: no hizo falta tocar el sprite. |
| 4 · Inicio del conductor | Siete estados del panel «Hoy»; aviso de bloqueo (estado 5) sin primario ni «Usar otra unidad»; sin salida como aviso crítico compacto; «Cerrar el parte» y pendiente «Cerrarlo». |
| 5 y 6 · Pasos 1 y 2 | `ParteFormulario.svelte` sirve a los dos pasos (`vista.tipo`), con `ParteEncabezado.svelte` (vuelta, `h1`, «paso N de 2», unidad, avisos, guardado) y `BarraEnvio.svelte`. Paso 2: resumen de la revisión con `details` (`RevisionLeida.svelte`), «Al iniciar» como texto desde 30rem, combustible con asterisco, sin «Descartar». |
| 7 y 8 · Resultados, lectura y E | `ParteEnviado.svelte` es el panel de resultado (franja vigente o crítica, ícono, acciones); C1 con las dos variantes de acciones, C2, C3 y la lectura D (etiqueta «Cerrado», filas Revisión y Cierre, caso sin salida). E con la nota del borrador conservado. «Completar el cierre» suelta el resultado y muestra el paso 2 con el foco en su `h1`. `EnlaceAccion` suma la variante `texto` y `alActivar`. |
| 9 · Diálogos | «Antes de enviar» con `paso` («Enviar igual» / «Cerrar igual», «Cerrando…»); «¿Quién completa el parte?» con `i-vencido` + «Sin licencia vigente» en el renglón 2. |
| 10 · Centro de alertas | Bloque «Conductores que no pueden manejar hoy (N)» dentro del protagonista, con «Renovar» o «Cargar» que abre el diálogo de la fila de la licencia; al guardar, el foco va al `h2` del protagonista y su barra dice «Licencia de … renovada.». Frase para lectores después de la cifra. |
| 11 · Flota y ficha | «sin licencia vigente» junto al conductor (flota) y etiqueta «Sin licencia vigente» (ficha); «En uso» y «Sin cerrar» en «Último parte». El kilometraje de la ficha ya traía «→ en uso» y «Sin uso» de la lógica. |
| 12 y 13 | `textos-marco.ts`: regla «Vencido o faltante», «El parte diario», rótulos de los pasos, barra y diálogo. `Muestras.svelte`: etiquetas nuevas (desde `ETIQUETAS_DE_PARTE`), variante texto y avisos de bloqueo. `scripts/contraste.mjs`: 4 pares nuevos (174 mediciones, 0 fallan). |

**Desvíos respecto de la especificación.**
- «El parte diario» de `TEXTO_COMO_FUNCIONA.parte` dice «completa 10 puntos de revisión de la unidad» y no «revisa 10 puntos de la unidad»: `tests/textos-marco.test.ts` exige la frase «N puntos de revisión» y no se tocan los tests.
- El nombre en el bloque de conductores del protagonista dice «(ficticia)» y no «(ficticio)» (6.1): es la marca del resto de la demo (barra, ficha, historial) y vale para cualquier nombre.
- En el paso 2 la nota de obligatorios queda en «Los campos con * son obligatorios.» y el nivel de combustible lleva su asterisco (la frase extra costaba un renglón y la meta de 600 px no se cumplía). En el paso 1 la nota sigue con «También son obligatorios los puntos de revisión.»
- El mensaje de la barra del protagonista al renovar es el de `TEXTO_CONDUCTORES_SIN_LICENCIA` («Licencia de {Nombre} renovada.»), no el general del diálogo.
- Textos de mi cosecha, para `redactor-ux`: la frase de arriba de «Antes de enviar» en cada paso («La revisión está completa…», «El parte está completo… cerrarlo»). Opción del `select` Conductor: «Nombre · patente (sin licencia vigente)» (a 360 px la opción elegida se corta en el campo; la lista la muestra entera).
- Paso 2 en el teléfono: «Al iniciar» no se repite como campo ni como texto (ya está en el resumen); se ve desde 30rem.

**Lo que la lógica no daba.** Nada que haya bloqueado. `PantallaAlertas` busca la fila de la licencia en `centro.vencimientos.grupos` por `alertaId` (la lógica da el id, no el `AccionDeDocumento`).

**Verificación.** `npm test` 1489 (también `test:tz`); `npm run check` 0 errores y 0 avisos; `npm run contraste` 174 mediciones, 0 fallan; `npm run buscar` sin hallazgos; `npm run build` JS 114,7 KB gzip (tope 120).
Navegador (Playwright, compilación servida con `npm run servir`): recorrido completo del conductor con teclado (revisión vacía con foco en el resumen, enlace al campo, diez puntos con Espacio, diálogo, C1, cierre, C3, vuelta al inicio); C2 con Frenos, inicio sin salida y lectura; caso C21 (inicio, pantalla E, «Renovar» como encargado con el foco en el `h2` y vuelta al estado 7); encargado con el `select` (L1 al enviar, borrador recuperado tras recargar, «En uso» en flota, «→ en uso» y revisión en la ficha). 320, 360, 768 y 1280 px, claro y oscuro: sin desborde, nada pulsable de menos de 44 px, sin mensajes en la consola ni violaciones de CSP. «Al iniciar» a 360 × 780: 590 px (con el aviso de la unidad); «Al terminar»: 585 px. Evento cerrado del historial a 360: 88 px.
**Sin verificar:** axe-core (no está instalado y no se suman dependencias); lector de pantalla; colores forzados; zoom 200 % y 400 %; celular real; IndexedDB bloqueado; dos pestañas. Queda a `qa-destructor`, `auditor-accesibilidad` (D3) y `disenador-ui`.

## 22/11/2026 (rama `interfaz-etapa-0`) — Correcciones de la revisión de la etapa 6: lógica (programador)

**Qué se hizo.** La parte de lógica de las cuatro revisiones (código, QA, diseño y accesibilidad) y de las decisiones de Matías del 22/11, con TDD y un commit por tema (sin push). Reglas nuevas en `docs/diseno.md`: P18 (cerrar antes), P19 (sin salida, hasta mañana), P20 (un conductor, un parte en uso) y la sección 17.12.

| Hallazgo | Qué quedó |
| --- | --- |
| A1 (código) y decisión «Cerrar antes» | `enviarRevision` rechaza con `parte-anterior-sin-cerrar` si la unidad tiene un parte en uso de una fecha anterior (después de L1, antes de los faltantes). Inicio del conductor: estado `cierre-pendiente` (5 bis). Pantalla del parte: `ParteNoDisponible.cerrarAntes`. Ficha: «Cerrar el parte del {F}». |
| M1 (código) y baja (QA) | `corregirKilometraje` rechaza desde la fecha de un parte en uso; `darDeBaja` rechaza con un parte en uso. |
| P20 (QA, dudoso) | Mismo código y mismo aviso: el conductor con un parte en uso en otra unidad no envía la revisión de una nueva. |
| M1 (QA) → P19 | «Hasta mañana»: ficha con «Ver el parte» e inicio con `hastaManana`. |
| M2 (QA), B2 (código) | La fila de «Conductores que no pueden manejar hoy» trae siempre la acción completa; con una emisión futura, «Corregir». No se rechaza la emisión futura (la especificación la permite). |
| B1, B3, B5 (código) | Test que fija el `kmFin` menor; sin casts y sin `advertenciasDeCierre`; `opcionesDeConductor` con `licencia: { fecha, documentos }`. B4: no. B7: no tocar (límite del README). |
| B3 (QA), B4 (QA) y seguridad | Tope de 500 en caracteres (puntos de código) y `limpiarTexto` (`texto.ts`) por categoría Unicode `Cc` y `Cf`, salvo `\t`, `\n`, `\r` y U+200D. Se aplica a novedades, motivos, borradores y a la revisión enviada. |
| D1, C5, C1, C2, C6, C13, C15, C16 (diseño) | Resumen agrupado (`agruparResumen`), barra «Revise N datos» (`barraDeEnvio`), `conDocumentacionVencida` y línea de C1, fecha de «Último parte» del parte que nombra la etiqueta, un renglón por documento (`contextoDeDocumentacion`), `textoDeOpcion`, nota del punto crítico, primer botón de la ficha. |
| D2, «fuera de plazo» | Nada en `src/lib/` para D2 (la marca está en `textos-marco.ts` y las vistas). «Fuera de término» pasó a «fuera de plazo» en textos, tests y especificación (identificadores `fueraDeTermino` sin cambios: están en los eventos guardados). |

**Ajustes mínimos en la vista** (para que compile y no quede una pantalla rota; el maquetador los rehace): `PantallaConductor.svelte` (rama `cierre-pendiente`, con los dos renglones en un párrafo) y `PantallaAlertas.svelte` (`abrirLicencia` usa la acción de la fila y `abrirDialogo` suma el diálogo de corregir).

**Lo que queda para el maquetador.** Estado 5 bis y pantalla E «Cerrar antes» con sus dos renglones y el primario; `hastaManana` en el inicio; `conDocumentacionVencida` en `ParteEnviado.svelte`; `agruparResumen` y `barraDeEnvio` en `ParteFormulario.svelte`; `textoDeOpcion` en el `select`; recorrido «—» en la fila «en uso» del kilometraje de la ficha (`recorrido` viene `null`); «Corregir» en el bloque de conductores; `textos-marco.ts` (D2 y «fuera de plazo» de la línea 243).

**Verificación.** `npm test` 1555 (1489 al empezar), también con `npm run test:tz`; `npm run check` 0 errores y 0 avisos; `npm run buscar` sin hallazgos; `npm run build` JS 116,6 KB gzip (tope 120). **Sin verificar:** nada en el navegador.

## 22/11/2026 (rama `interfaz-etapa-0`) — Correcciones de la revisión de la etapa 6: la vista (maquetador)

**Qué se hizo.** Las 25 tareas de `docs/diseno-ui.md` 14.3 y la lista «Para el maquetador» de la entrada del programador, sin tocar `src/lib/` ni los tests. Nada quedó esperando a la lógica: todo lo de [espera P] ya estaba entregado y se conectó.

| Tareas | Qué quedó |
| --- | --- |
| 1 · Textos | `textos-marco.ts`: «(persona ficticia)» en la barra y en el protagonista y «Lucía Ferreyra (persona ficticia)» en `Muestras`; «controla 10 puntos de revisión»; «Antes de enviar la revisión, lea esto.» / «Antes de cerrar el parte, lea esto.»; claves renombradas `enviarDeTodosModos` / `cerrarDeTodosModos` («Enviar de todos modos» / «Cerrar de todos modos») y `fueraDePlazo` («Enviado fuera de plazo.»); `elegirUna` («Elija una unidad»). Se borra `opcionConductor` (lo reemplaza `textoDeOpcion` de la lógica). |
| 2 · Botón-texto | `Boton` y `EnlaceAccion`: `padding-inline: 0`. «Usar otra unidad» y «Descartar borrador» empiezan en la misma `x` que el primario (29 px a 360). |
| 3 · Aviso compacto | `Aviso.svelte`: prop `accion` (texto) con `aviso-titular` y `aviso-accion`, y `partirAviso(cadena)` en su `<script module>`: el corte en la última «. » vive solo ahí. El fragmento que antes se llamaba `accion` (el botón de la derecha, usado por `App.svelte`) pasó a `boton`. |
| 4, 5, 9, 13, 20 · Inicio del conductor | Nota del estado 7; descartar como botón-texto; «Elija una unidad» solo sin unidad; estado 5 con el aviso compacto; **estado 5 bis «Cerrar antes»** (aviso semana con `i-lapiz`, primario «Cerrar el parte anterior», «Tiene una revisión empezada: se conserva.» + descartar, «Usar otra unidad»; «Pendientes» no repite ese mismo parte); `hastaManana` como nota debajo del aviso del parte sin salida; «Mis últimos partes» en grilla con áreas y `container: partes`. |
| 6, 16, 17 · Panel de resultado | Título en `--c-texto` con el ícono del tono; `aria-describedby` hacia la línea; la lectura (D) sin ícono; `conDocumentacionVencida` → franja semana con `i-alerta`; «Avisos aceptados» con `i-vencido` en `--c-critico-t`. |
| 7, 8 · Flota | Cabecera `Km` con «Kilometraje» para lectores (`corto` en las columnas de `ListaTabla`); `th` sin partir palabras; anchos de la 5.10; tarjetas con «Int. N · Modelo» en un grupo sin cortes, sin «Próximo vencimiento» si es crítico y «· último parte {F}» sin separarse. |
| 10 · Protagonista | La fila de conductores siempre trae su acción (se quitó el `{#if k.accion !== null}`); «Renovar», «Cargar» o «Corregir». |
| 11 · Ficha | `FichaEncabezado` ya mostraba la etiqueta que llega; `FichaKilometraje` pone «—» (con «Sin recorrido» para lectores) en la fila en uso. |
| 10 (paso 2), 12, 18, 19, 24 · Parte | «Al iniciar» con el estilo de etiqueta de campo, `.km` con `align-items: end`, valor de 3 rem; «Recorrido» con rótulo discreto y valor firme; `enterkeyhint` (`teclaEnter` en `Campo`: «next» en los km, «done» en litros); barra con `barraDeEnvio` («Revise N datos», sin tilde); resumen con `agruparResumen` (se vuelve a agrupar lo vigente); opción del `select` con `textoDeOpcion`. |
| 14 · Texto al 200 % | `BarraSuperior` (`flex-wrap`, nombre que se parte, `row-gap`), `EtiquetaDemo`, `BarraEnvio` (el botón baja de renglón), y lo que el barrido encontró: `SelectorPerfil` (segmentos que pasan a otra fila), pestañas de `BarraApp`, `Etiqueta` (ya no es `nowrap`), `FiltrosConteo` (una columna cuando el rem crece), tarjetas de la flota y «Mis últimos partes». |
| 15 · Muestras y contraste | `Muestras.svelte`: avisos compactos (bloqueo, «Cerrar antes» con su primario, «no puede salir» con `partirAviso`, de un renglón). `contraste.mjs`: «Aviso Cerrar antes» texto / semana-f 14,39 · 12,08 (y el ícono semana-t / semana-f 6,80 · 8,86). |
| 21 · Pantalla E | «Cerrar antes» con el aviso semana en lugar del párrafo, el primario hacia el parte anterior, descartar y el enlace de vuelta como botones-texto; el resto de las E conserva su enlace secundario. |
| 22, 23 | Ver 11 (el texto del primer botón lo da `ficha.ts`) y la fila «en uso». |
| M2 de la etapa 4 (código) | Ya estaba hecho: `DialogoDocumento` y `DialogoUnidad` solo ponen sus campos sobre `DialogoFormulario`. No hizo falta tocar nada. |
| 25 | Esta verificación. |

**Desvíos respecto de la especificación.**
- «Mis últimos partes», con el texto al 200 % a 360 px (lista de unos 9 rem): la fecha y la patente (que no se parte) no entran juntas, así que a 12 rem o menos la fila pasa a tres renglones (fecha, patente, recorrido) en lugar de los dos de la 6.4. A 17 rem o menos sigue como dice la especificación.
- Flota a 1280: se achicó el relleno horizontal de las celdas a 8 px (era 12) para que «Proyecto Arroyo Escondido» y «Revisión técnica · en 5 días» no sumen un renglón; con los anchos de la 5.10 solos, 11 filas pasaban de su meta.
- Tarjetas de la flota: el «·» entre el interno y el modelo va en `::after` del interno, dentro del grupo `nowrap`, y un modelo larguísimo se corta con puntos suspensivos (no ensancha la página).
- `Aviso.svelte`: `accion` es texto, como pide la 5.18; el fragmento de botón que se llamaba así ahora es `boton`.
- Una fila «Avisos aceptados» por advertencia y no por documento: la lógica entrega un texto por advertencia (con un renglón por documento unidos por un espacio). Ver lo que queda para el programador.

**Verificación.** `npm run check` 0 errores y 0 avisos; `npm test` 1555 (también `npm run test:tz`: UTC, Tokio y Los Ángeles, 1555 cada una); `npm run contraste` 178 mediciones, 0 fallan, 9 justas (igual que antes); `npm run buscar` sin hallazgos (8 reglas, 194 archivos); `npm run build` JS 117,03 KB gzip (tope 120; 116,6 al empezar).
Navegador (Playwright con Chromium 151, compilación servida con `node scripts/servir-dist.mjs 4710`, que se apagó al terminar): barrido de 90 combinaciones (9 pantallas y estados × 320, 360, 768 y 1280 px más 360 con `html { font-size: 200% }` × claro y oscuro): `scrollWidth` igual al ancho en todas (incluido el 200 %: 360), nada pulsable de menos de 44 px de alto, 0 mensajes en la consola ni violaciones de CSP. Pantallas: alertas, flota, ficha de ZK 214 BD y de ZW 827 VD, parte (paso 1), inicio de Tamara (estado 7), de Ivana (estado 5) y de Renata (borrador), y el parte de Ivana (E). Recorridos de punta a punta a 360 y en claro: revisión vacía → resumen «Faltan 10 puntos de la revisión» (un solo enlace) → 7 puntos → «Revise»/«Faltan 3 datos» con tres enlaces; revisión de un día pasado como encargado (fuera de plazo) → C1 → inicio con «Cerrar antes» (estado 5 bis) → pantalla E con el primario → cierre; revisión de ZK 214 BD con el seguro vencido → «Antes de enviar» → C1 con documentación vencida (franja semana, `i-alerta`, «Avisos aceptados» con `i-vencido`) → cierre → C3; «Renovar licencia de Ivana» desde el protagonista. «Cerrar antes» también en oscuro a 360 y 1280.
Medidas: «Al iniciar» (paso 1) a 360 × 780: 590 px; «Al terminar» (paso 2): 585 px (meta: por encima de 600). Fila de «Mis últimos partes»: 44 px a 360, 181 px con el texto al 200 %. Flota a 1280 (23 filas): las que pueden salir miden 65 px salvo ZPA 505 (77: su «sin licencia vigente» baja de renglón); las que llevan motivo, hasta 96 px (ZU 899 QE, cuyo motivo de cuatro renglones sale de la lógica) y el resto de 88 o menos. Ninguna cabecera partida dentro de una palabra. Tarjetas a 360: mediana 192 px, ZK 214 BD 174, ZW 827 VD y ZW 749 JE 220 (meta 190), ZU 899 QE 252 (el máximo).
**Sin verificar:** lector de pantalla (NVDA), Firefox, Safari, pantalla táctil real, zoom del navegador al 400 %, IndexedDB bloqueado, dos pestañas, colores forzados; el diálogo «Corregir» de una licencia con emisión futura (no hay un conductor así en el ejemplo; se probó «Renovar»); el recorrido de «Descartar borrador» de «Cerrar antes» con un borrador de hoy.

**Lo que queda para el programador o para revisar.**
- `PanelParteEnviado.advertencias` sería mejor como lista de renglones (uno por documento): hoy es un texto por advertencia y la vista no lo parte (cortarlo por el punto sería frágil). Cuando llegue, la vista ya tiene el ícono `i-vencido` por renglón.
- Las tarjetas de la flota de ZW 827 VD y ZW 749 JE (220 px, meta 190) no bajan más sin cambiar un texto o una regla de la especificación: el modelo baja entero junto al interno y la etiqueta «Sin parte» / «Sin enviar» no entra en el renglón de km y fecha. Decide `disenador-ui`.
- Filas de la flota con «sin licencia vigente» (ZPA 505) y motivos de cuatro renglones (ZU 899 QE) pasan de la meta de 64 y 88 px; el segundo depende del largo del texto del motivo.
- `DialogoAntesDeEnviar` conserva la propiedad `alEnviarIgual` (nombre interno; el texto visible ya dice «de todos modos»).
- Lo pedido a `qa-destructor`, `auditor-accesibilidad` (confirmar D3 y el 200 %), `disenador-ui` y `critico-reclutador` sigue sin hacerse.

## Etapa 7: correcciones de lógica (programador, 22/11/2026)

Rama `correcciones-logica-e7` (sale de `3fbe7d7`), TDD. Los informes de las cuatro revisiones de la etapa 7 son internos (no publicados).

| Hallazgo | Qué se hizo |
| --- | --- |
| Código M2 y B7 | `PanelParteEnviado.advertencias` pasa a `{ tono, texto }[]` (un renglón por documento, la cola una sola vez); `avisoAptitud` pasa a `{ titular, accion }`; `partirAviso` se elimina. `ParteEnviado.svelte` recorre la lista con el ícono según el tono (`data-tono` en el `li` y el ícono con `--tono-t`). |
| Código B1, B2, B3 | Los invisibles de `texto.ts` y `tests/texto.test.ts` van como `\u…`; el contador usa `largoDeTexto`; `normalizarTexto` deja vacío lo que no tiene nada visible. De paso, `tests/textos.test.ts` tenía retrocesos (U+0008) escritos tal cual en lugar de `\b` en la prueba del voseo: ahora usa lookarounds Unicode. |
| Código B4, B5, B6, B8, B9 | `alAceptarAvisos`; «fuera de plazo» en nombres y comentarios (la clave guardada `datos.fueraDeTermino` queda); `ErroresDeParte.resumen` eliminado; comentario de `PantallaAlertas`; sin `Math.max` en los comandos. |
| Diseño C3, C4 | Motivo sin la fecha repetida (cambia el ejemplo: el hash de `tests/generador.test.ts` pasó a `df80c262`); texto de C1 de un día pasado. |
| QA D1 y D2 | P19 en todas las vistas y ampliada a toda crítica (decisión de Matías del 22/11): `unidadSinSalidaHoy` (`dominio/parte.ts`) la decide y `aptitud` la lee; diálogos de resolver y volver a servicio no prometen que sale ese día. |
| QA B1, B6, B5 | «El parte de hoy está en uso»; texto de corregir un vencimiento; opción del select de conductor sin patente si no tiene licencia. |
| QA B2 | Conexión perdida: memoria con aviso y reintento que funciona (verificado en Chromium real: borrar la base y cambiar de vista). |
| QA B8 | No reproducible: el plazo de 8 s ya existía; el QA esperó 1,5 s. Verificado en Chromium real. Sin cambios de código. |
| a11y m3 | El error del kilometraje de salida aparece junto con los puntos sin responder. |

**Para el maquetador.** Toqué solo marcado mínimo en `ParteEnviado.svelte` (lista con `data-tono`; el ícono de `.icono-aviso` pasó de `--c-critico-t` a `--tono-t`), renombres en `ParteEncabezado`, `ParteFormulario`, `DialogoAntesDeEnviar` y `FichaHistorial` (`fueraDePlazo`, `alAceptarAvisos`), `Aviso.svelte` (se quitó el `<script module>` de `partirAviso`), `PantallaConductor`/`ParteEncabezado` (el aviso llega partido), `Campo.svelte` (contador) y `App.svelte` (una rama para el aviso `almacenamiento-perdido`). Si su rama toca esos archivos, esperar conflictos triviales. `DetalleDeParte.advertencias` de la ficha sigue siendo `string[]` (ahora un renglón por documento); si se quiere ícono por tono en el historial, hay que pedir el cambio de tipo.

**Para el redactor.** Textos nuevos o cambiados: motivo de aptitud «Sin salida hasta mañana (novedad crítica de hoy)»; resolver «Volver a servicio (sale desde mañana)» y su nota; diálogo de volver («…no vuelve a salir hasta mañana: hoy tuvo una novedad crítica.»); barra «…vuelve a servicio, pero no sale hasta mañana.»; «ZK 214 BD: el parte de hoy está en uso.»; «tiene en uso el parte de hoy de…»; «El vencimiento tiene que ser posterior al del documento anterior (…)»; «{Nombre} (sin licencia)»; aviso «Los datos guardados de la demo ya no están disponibles…»; «Falta cerrar este parte con el kilometraje y el combustible de esa jornada.».
## 22/11/2026 (rama `correcciones-vista-e7`) — Correcciones de vista de la etapa 7 (maquetador)

**Qué se hizo.** La parte de vista de `demo2-etapa7-diseno.md`, `-accesibilidad.md` y `-qa.md`, sin tocar `src/lib/`, `textos.ts`, los tests, `README.md` ni `docs/stack.md`, ni el bloque «Avisos aceptados» de `ParteEnviado.svelte` (lo hace el programador en `correcciones-logica-e7`).

| Hallazgo | Qué quedó |
| --- | --- |
| S1 a S8 | Pegados en `docs/diseno-ui.md` (commit aparte): metas de 6.5 y 12, 5.10 (anchos, tarjetas, renglón de km), regla del texto al 200 % (12), `neutro-r` (3.1 y 3.2), C1 de un día pasado (6.5 y 7) y motivo de fuera de servicio. |
| C1 · texto al 200 % | Regla única: una fila con una columna fija en `rem` pasa a una columna con `@container (max-width: 17rem)`. Alertas («Ver» baja a su renglón, protagonista con menos relleno y chevron en la línea de la patente), flota (horizonte arriba, texto debajo; selectores a todo el ancho), documentos de la ficha (una columna), kilometraje de la ficha (dos renglones por fila, con roles explícitos), historial de la ficha, inicio (patente chica), resumen y lectura de la revisión (ícono y texto en renglones), resultados, diálogos, avisos, `Panel` (relleno del interior y de las barras), `Detalles`. Un segundo escalón (`max-width: 8.5rem` o `10.5rem`) baja otro poco el relleno a 320 px. |
| C2 | Tarjetas de la flota: el kilometraje y el último parte con `align-self: start` (misma línea). Con el texto al 200 % el «·» de «· último parte» no se dibuja (quedaría suelto). |
| C5 | «en N días» con espacio duro en la vista (`unirCifra` en `PantallaFlota`); redundante y sin conflicto con el cambio de `textos.ts` del programador. |
| C6 | `.km` con `align-items: stretch` y «Al iniciar» en columna `space-between`: rótulos a la misma `y` (229 = 229 a 768) y valor en la línea del campo (297,4 = 297,4). |
| C7, C8, C9 | «·» con `gap: 0.25em` (tarjeta y encabezado del parte); `outline-offset: 0.25rem` en el botón-texto y el enlace-texto; patente chica en el inicio con el texto al 200 %. |
| B8 | `--c-neutro-r` claro `#737980`; dos pares nuevos en `contraste.mjs` (3,76 y 3,78 claro; 3,57 y 4,01 oscuro). |
| m1 | Sin desborde a 320 px con el texto al 200 % en todas las pantallas del barrido (antes 7 a 12 px): patente chica, `overflow-wrap: anywhere` en `.nombre` y `.error`, botones con menos relleno. |
| m2 | `forced-colors`: los botones-texto y enlaces-texto con `padding-inline: var(--e-2)`. Sin ver con los colores reales de Windows. |
| m4 | `Aviso` con `idTexto`; el `h1` del estado 5 bis y de la pantalla E «Cerrar antes» con `aria-describedby` hacia el aviso (medido: el texto de los dos renglones). No se tocó el estado 5 (licencia): no estaba en el pedido. |
| B3 | `ParteFormulario`: Enter en un campo con `enterkeyhint="next"` pasa al control siguiente (al radio elegido del grupo, si hay); con `"done"` lleva el foco a «Cerrar el parte» / «Enviar revisión» sin activarlo. Enter nunca envía. Medido: km del paso 1 → radio de Frenos; kmFin → radio de combustible; litros → «Cerrar el parte». |
| B4 | Combustible en una columna con el selector de 17 rem o menos (48 px de alto, ancho completo; el medidor pasa a barra izquierda); sin desborde a 320 px en alertas, parte con errores e inicio «hasta mañana». El km de 3 rem cortado no se reprodujo (texto de 90 px en un campo con 153 px útiles). |
| B5 | El `select` termina en «…» y no en un «·» suelto. **No resuelto del todo:** «Ivana Aguirre (sin licencia vigente) · ZPA 505» mide 310 px y el campo deja 248; hace falta acortar el texto de la opción (`textoDeOpcion`, del programador o de `redactor-ux`: «(sin licencia)» da ~253, igual no entra a 16 px). |

**Desvíos y límites.**
- A 320 px con el texto al 200 % (la pantalla mide 10 rem) quedan dos casos donde una palabra es más ancha que el lugar posible: la etiqueta «Circuló con documentación vencida» en la tarjeta del detalle de operación de alertas (la etiqueta necesita ~255 px y la tarjeta da 222) y nada más (la medición final dio solo ese caso). A 360 px con el texto al 200 % no quedan palabras partidas.
- Tarjetas de la flota a 360 px (23): 172 a 174 las de cuatro renglones; ZW 827 VD 220 → 200 y ZR 575 YR 192 → 172 con C2; ZU 899 QE 252 (motivo con la fecha repetida, del programador) y ZWA 746 231 (1 px sobre 230, texto que arma la lógica). Filas a 1280: 62, 65, 77, 78, 79 y ZU 899 QE 96 (igual que antes de esta tanda).
- «Al iniciar» del paso 1 con Andrés a 360 × 780: etiqueta en 498, campo hasta 591, barra en 707.

**Verificación.** `npm run check` 0 errores y 0 avisos; `npm test` 57 archivos y 1555 pruebas; `npm run contraste` 182 mediciones, 0 fallan, 9 justas; `npm run buscar` sin hallazgos (8 reglas, 194 archivos); `npm run build` en verde, JS 404,98 kB y **117,66 kB gzip** (tope 120), CSS 15,51 kB gzip.
Navegador (Playwright con Chromium, compilación servida con `node scripts/servir-dist.mjs 4722`, es decir con la CSP de `_headers`; el servidor se apagó al terminar): **432 combinaciones** = 36 pantallas y estados (alertas, flota, ficha, 7 inicios, paso 1 vacío y con errores de 10, 3, 1 y mezcla, diálogo, C1 con y sin avisos, C2, inicio en uso, cierre vacío y con errores, C3, lectura D, E de licencia y de fuera de servicio, cuatro de «Cerrar antes», C1 de un día pasado) × claro y oscuro × 320, 360, 768 y 1280 px, más 320 y 360 con el texto al 200 %. En cada una se midió: desborde de la página (`scrollWidth`) y de cualquier elemento fuera de un contenedor con desplazamiento; **palabras partidas** (cada palabra de 4 caracteres o más, con un `Range` por carácter: se marca si el corte cae donde el navegador no corta solo, es decir fuera de un «-» o un «/»); nada pulsable de menos de 44 px (los radios por su etiqueta completa; los enlaces en línea no cuentan); consola. Resultado: 0 desbordes, 0 controles de menos de 44 px, 0 mensajes de consola ni violaciones de CSP, 0 palabras partidas salvo 2 combinaciones (alertas a 320 px con el texto al 200 %, claro y oscuro: «documentación» en una etiqueta). Antes de la tanda, el mismo barrido a 360 y 320 con el texto al 200 % daba 70 de 144 combinaciones con problemas.
Medidas puntuales: C6 (768 px) rótulos en 229 y 229, valor en 297,4 y 297,4; C2 km y «· último parte» en la misma `y` en las tres tarjetas con etiqueta; B3 y m4 como en la tabla; contraste de B8 3,76 y 3,78 (claro). Capturas de revisión (alertas, flota, ficha a 360 px con el texto al 200 %, foco del botón-texto) no se conservan en el repositorio.
**Sin verificar:** Firefox, Safari y WebKit; lector de pantalla; colores forzados reales de Windows (solo su emulación y solo en claro; ni siquiera se miró una captura de m2: se confía en la regla); teclado táctil real para B3 (se probó Enter con teclado físico); zoom real del navegador al 200 % (se usó el texto al 200 %); el 200 % en oscuro con colores forzados.

## 22/11/2026 (rama `critica-logica`) — Crítica de reclutador de la Demo 2, parte de lógica (programador, IA)

**Qué se hizo.** La parte de lógica de `demo2-etapa7-critica.md` (sección 5) más tres decisiones de Matías del mismo día: A1 (la documentación vencida de la unidad bloquea la revisión), M2 (cuatro puntos de minería) y M7 (queda como límite). Detalle y decisiones en `docs/diseno.md` §17.13.

| Punto | Qué quedó |
| --- | --- |
| A1 | Regla **P21**: sin documentación de la unidad en regla a la fecha del parte (M1) la revisión no se envía (`documentacion-de-la-unidad-vencida`), después de L1 y antes de P18, P20 y los faltantes. Pantalla del parte (`no-disponible`) e inicio del conductor (`no-puede-salir`) lo dicen con el motivo. «Circuló con documentación vencida» queda solo para leer partes viejos; C18 ya no circula con papeles vencidos. Versión de esquema 3. |
| M2 | `ITEMS_CHECKLIST` pasa de 10 a 14: pértiga con banderola y baliza y alarma de retroceso (críticos), calzas y kit antiderrame y radio (no críticos). |
| M3 | 8 conductores de relevo (24 en total) conducen por turnos las unidades sin conductor asignado; nadie tiene dos partes el mismo día (test). |
| A3 | «Cerrar antes» es P18 en el código; la regla de pestañas es D12; M1, M3 y M4 sin «a confirmar»; `npm run buscar` falla con «a confirmar» en `src/` (caso plantado en `tests/prohibidos.test.ts`). |
| M4 | Medición real en `docs/stack.md`: 411 kB de JS, 119,5 kB con gzip (tope 120, sin subirlo). |
| B1, B2, B3 | «Actual: …» en la renovación; punto del checklist en minúscula dentro de la frase; sin líneas de más de 160 caracteres en `src/lib/dominio`. |
| A4 (lógica) | `npm run contraste`: 182 mediciones, 0 fallan, 9 justas. `npm run build` sin errores. |

**Para el redactor.** Textos nuevos: `errDocumentacionDeLaUnidad` («El seguro de ZK 214 BD venció el 17/11/2026. La unidad no puede salir. Renueve la documentación antes de enviar la revisión.» / «Avise al encargado.»), la nota «El borrador se conserva: cuando se renueve la documentación, podrá enviarlo.», los cuatro nombres de punto y, en «Cómo funciona», 14 puntos y la mención de la documentación. Cambian el README (24 conductores, 4 alertas críticas, 5 pendientes de operación, la asimetría de «Límites conocidos») y la captura `docs/img/parte-revision-360.png`.

## 22/11/2026 (rama `critica-logica`, segunda tanda) — Código muerto de P9 borrado y M1 (lógica) (programador, IA)

**Qué se hizo.** Con P21 y el esquema 3 ya no se puede producir ni leer una revisión enviada con documentación de la unidad vencida, así que se borró todo lo que existía para eso (el diseño lo anota en §17.13). Los avisos de kilómetros (K6 y K7) siguen igual.

| Qué | Detalle |
| --- | --- |
| Borrado | Tipo de alerta `uso-con-documentacion-vencida` (cálculo, textos, ícono, grupo del centro de alertas); campo `Parte.documentacionVencida`; advertencia `documentacion-vencida` y su texto; tono crítico de los avisos aceptados (ahora siempre semana); `conDocumentacionVencida` y la línea «Sale con documentación vencida» del panel de la revisión enviada; `tonoDeAdvertencia`, `renglonesDeAvisoAceptado`, `estadoDeDocumentos`; `conDocumentacionVencidaAceptada` de `tests/ayuda.ts` y los tests que solo existían para eso. |
| Se conserva | `documentacionVencidaEn`, `documentacionQueBloquea`, `contextoDeDocumentacion` y los renglones por documento: los usa P21 (error del comando, pantalla del parte, inicio del conductor). |
| Vistas | Mínimo para que compile: `ParteEnviado` y `DialogoAntesDeEnviar` ya no eligen el ícono por tono (siempre `alerta`); `ParteEnviado` ya no tiene tono «semana». |
| M1 | `conductoresParaProbar(estado, alertas, hoy)` en `estado/parte.ts`, con `tests/conductores-para-probar.test.ts` (8 pruebas). La vista y el botón «Completar con un ejemplo» quedan para después. |
| JS | 411,17 kB → 408,28 kB (gzip 119,47 → 118,78 kB): el margen contra el tope de 120 pasa de 0,53 a 1,22 kB. |

**Para el redactor.** Texto nuevo `TEXTO_CONDUCTOR_PARA_PROBAR` (cuatro marcas «Para probar: …»). Texto que desaparece: «Puede enviar la revisión de todos modos: quedará registrado que la unidad salió con documentación vencida.» y «Sale con documentación vencida: quedó registrado.». `docs/diseno-ui.md` todavía describe la alerta «Circuló…» (líneas 506, 887) y el aviso de aptitud con primario (1184-1186, 1431): lo ve el diseñador.

## 22/11/2026 (rama `critica-textos`) — Últimos cambios de vista antes de publicar: M1, M6, B7 y capturas (maquetador, IA)

**Qué se hizo.** Tres cambios de vista, la especificación al día con P21 y las capturas del README con el ejemplo vigente (24 conductores, 4 alertas críticas, 5 pendientes de operación, checklist de 14 puntos, bloqueo por documentación de la unidad).

| Qué | Detalle |
| --- | --- |
| M1 (vista) | «¿Quién completa el parte?» pone **primero** a los conductores de `conductoresParaProbar` en su propia lista (el orden es el de la lógica: unidad apta, documentación vencida, fuera de servicio, sin licencia), cada uno con un renglón 3 «Para probar: …» (`TEXTO_CONDUCTOR_PARA_PROBAR`) dentro del `label` del radio: el lector de pantalla lo dice con el nombre y la unidad. Una línea «Los demás conductores» (texto nuevo, `TEXTO_ELEGIR_CONDUCTOR.losDemas`) los separa del resto; sin sugeridos no aparece. Es un solo grupo de radios: las flechas pasan de una lista a la otra. El foco inicial va al elegido o, si no hay, al primer sugerido. En el sugerido sin licencia no se repite «Sin licencia vigente». Se eligió «primero y separados» y no solo una marca: con 24 conductores, quien entra a probar encuentra los cuatro casos sin recorrer la lista. Pegamento mínimo: `app.opcionesDeConductor()` suma `paraProbar` a cada opción (no toca `estado/parte.ts`). |
| M6 | Lo que cuenta la insignia es `resumen.criticas`: documentos vencidos o faltantes (de gravedad crítica) más novedades críticas abiertas, hoy 3 + 1 = 4. Esos dos números no están sumados en ningún lado, y los «4 unidades» del protagonista cuentan otra cosa (coinciden por azar). Cambios: la insignia dice «4 críticas» (antes solo «4»; coincide con el nombre accesible «Alertas, 4 críticas») y el centro de alertas lleva bajo la fecha «4 alertas críticas: documentos vencidos o faltantes y novedades críticas abiertas.» (texto nuevo `TEXTO_ALERTAS.criticas`; con 0 no se muestra). Con el texto al 200 % la insignia baja debajo de «Alertas» en lugar de ensanchar la página (`flex-wrap` en la pestaña, `nowrap` en la insignia). |
| B7 | `.principales` con `align-items: start`: «Operación diaria» mide lo que necesita (a 1280 px ya no queda el hueco de unos 100 px). |
| `diseno-ui.md` | Sin la alerta «Circuló con documentación vencida» (tono, etiqueta, esquema del centro, acciones del detalle), sin la variante C1 «con documentación vencida aceptada» ni sus textos, «Avisos aceptados» solo de kilómetros, diálogo «Antes de enviar» sin P9, y el aviso de aptitud con primario reemplazado por el estado `no-puede-salir` de P21 (sin primario; pantalla E con el texto de la regla). Suma M1, M6 y B7. Los números de línea que decía el registro anterior (506, 887, 1184-1186, 1431) eran los de ese momento; había más referencias (163, 397, 777, 928, 1369-1376, 1463, 1487-1492, 1591, 1815-1817) y se cambiaron todas. |
| Contraste | Dos pares nuevos en `scripts/contraste.mjs`: `pendiente-t` sobre `acento-suave` y sobre `superficie-2` (la marca «Para probar»). 186 mediciones, 0 fallan. |
| Barrido | 38 pantallas y estados (alertas, flota, ficha, el diálogo de conductores, inicio del conductor en sus casos, el parte con errores, los tres paneles de resultado, el cierre, «Cerrar antes» y las pantallas E) × claro y oscuro × 320, 360, 768 y 1280 px y 320 y 360 con el texto al 200 %: 456 combinaciones, 0 con desborde de página, palabras partidas ni controles de menos de 44 px; consola sin errores ni avisos (CSP real, puerto 4724). Se actualizaron los guiones al ejemplo nuevo (14 puntos; Tamara Olivera pasa a ser el caso del bloqueo). Comprobado a mano con Playwright: nombre de cada radio («Andrés Echegaray | Unidad ZYN 469 | Para probar: …»), foco inicial en el primer sugerido, flechas que cruzan de una lista a la otra, y el elegido se conserva al reabrir. No se probó con un lector de pantalla real. |
| Capturas | `docs/img/centro-de-alertas.png`, `parte-revision-360.png` y la nueva `parte-bloqueado-360.png`, rehechas con el servidor del `dist/` con la CSP real. |
| JS | 408,28 kB → 411,01 kB (gzip 118,78 → 119,62 kB): el margen contra el tope de 120 es de 0,38 kB. Casi todo es `conductoresParaProbar` y su texto, que hasta ahora no entraban al paquete porque nadie los usaba. No queda lugar para más texto o más lógica sin sacar algo. |

**Pendiente que quedó anotado.** `diseno-ui.md` sigue diciendo «10 puntos» de revisión en varios lugares (710, 1213, 1317, 1511, 1583, 1672, 1759); el checklist tiene 14. No era parte de este pedido; lo ve `redactor-ux` junto con el README. El README sigue describiendo «6 pendientes», «Faltan 10 datos» y el aviso por seguro vencido de las capturas viejas.

## 25/11/2026 (rama `interfaz-etapa-0`) — La lista de nombres de terceros sale del repositorio (programador)

**Qué se hizo.** `scripts/huellas-prohibidas.mjs` versionaba el SHA-256 sin sal de dos términos y su longitud; en un repositorio público eso se revierte probando candidatos. Se borró el archivo y el mecanismo de huellas.

| Pieza | Qué es |
| --- | --- |
| `scripts/prohibidos.local.json` | Archivo local **no versionado** (`.gitignore`): `{ "palabras": ["término", ...] }`. Cada entrada es un término o una frase. La búsqueda no lo revisa a sí mismo. |
| `scripts/prohibidos.mjs` (+ `.d.mts`) | `terminosDeJson` reemplaza a `crearHuella` y `huellasDeLiterales`; `contieneProhibido` compara palabras normalizadas, sin hashes. Un JSON roto lanza error. |
| `scripts/buscar-prohibidos.mjs` | Si el archivo existe, corre la regla de nombres de terceros (9 reglas); si no existe, la omite con un aviso y corren las otras 8. Con el archivo roto, falla. |
| `scripts/ensayo-buscar.mjs` | `correrBuscarCon(texto, archivoLocal?)` escribe el archivo local en la raíz temporal del ensayo. |
| `tests/prohibidos.test.ts` | Sin los tests de huellas; con 7 ensayos de `buscar` (con el archivo: detecta un término y una frase plantados, pasa limpio, no se revisa a sí mismo; sin el archivo: avisa y no falla, las otras reglas siguen; archivo roto: falla). 1613 tests. |
| `.gitignore` | `scripts/prohibidos.local.json` y `.env*`. |

**Verificación.** `npm test` y `npm run test:tz`: 1613 pruebas; `npm run check`: 0 errores y 0 avisos; `npm run build`: JS sin cambios (119,62 kB con gzip); `npm run buscar` con el archivo (9 reglas) y sin él (8 reglas y aviso); un término plantado en `src/` se detecta con el archivo y se ignora, con aviso, sin él.
