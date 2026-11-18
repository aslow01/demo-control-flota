# Registro

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

**Qué se hizo.** Se commitearon los cuatro informes (`docs/revision-codigo-…`, `qa-…`, `accesibilidad-…`, `revision-textos-marco-…`) y se
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

| Hallazgo | Commit | Resultado |
| --- | --- | --- |
| M5 | `47760e1` | `npm test` corre por defecto con `TZ=Asia/Tokyo` (fijada en `vite.config.ts`); test que lo verifica; `.github/workflows/ci.yml` (Actions no corre hoy en la cuenta: no se forzó). Se incluyó el informe `docs/revision-dominio.md`. |
| M2, B1, B4 | `8924617` | Contexto validado (lanza error), `parsearInstante` estricto con `Z` obligatoria, `sumarDias` solo con enteros, recorrido de 2000 a 2100. La validación encontró un test con `hoy` y `ahora` incoherentes (se corrigió). |
| M6 | `ca35b1a` | Copias de `checklist`, `otraNovedad` y `titular`; `datos` de los eventos con copia profunda. |
| M1 (a confirmar) | `eff6eff` | P9 con los documentos como estaban en la fecha del parte; test con C18 en orden inverso. El generador carga y emite documentos antes del primer parte. |
| M3 (a confirmar) | `38800a9` | Corrección de kilometraje anterior a registros cargados: se rechaza (`km-correccion-anterior`). |
| M4 (a confirmar) | `7775928` | Habilitación de ingreso que el proyecto no exige: alerta `baja`, fuera de la insignia, coherente con `aptitud`. |
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
- **Antes de publicar el repo:** `scripts/buscar-prohibidos.mjs` contiene literalmente los patrones prohibidos (nombra a la empresa): moverlos a un archivo no versionado o a una variable de entorno de CI. Historial nuevo (B11) por el correo de autor.
- Pendiente: humo de interfaz con Playwright en CI (no hay tests de componentes; la vista se verificó a mano); probar Firefox, Safari real y un lector de pantalla; Esc no cierra si el foco quedó en `body` dentro del diálogo (caso forzado, sin impacto práctico); fechas inválidas en datos guardados pasan sin aviso D7 (las pantallas 4.x deben tolerarlas).
