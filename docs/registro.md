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
- *Correcciones (informes `docs/revisiones/demo2-etapa4-*.md` del portafolio, fuera del repo).* QA M1; accesibilidad M1 a M4 y B1 a B7; código M2 y M7; el `<svelte:boundary>` de `App.svelte` reindentado y probado a mano (ver abajo). Detalle en `diseno.md`, sección 16, últimas dos viñetas.

**Decisiones.** Quince puntos en `diseno.md`, sección 16 («Paso 4.5 … pantallas»). Las que más pesan: «Enviar parte» es `type="button"` (Enter en un campo no envía); el error de un campo del envío queda hasta que se lo toca; «Parte enviado» es estado de la pantalla y «Imprimir» no está (6.1); las secciones son `section` con `h2` y no `legend`; sin unidad, «Empezar el parte» aparece al elegir una.

**Para la lógica (no se tocó).** (1) Con la unidad fuera de servicio por el parte de hoy, el panel «Hoy» no muestra «Enviado a las…» ni «Ver el parte» (`hoyEstado` mira primero la unidad). (2) `ResultadoGuardadoDocumento` (`app.svelte.ts`) quedó sin uso: puede ser `ResultadoGuardado<CampoDocumento>`. (3) QA B1, B3, B4 y D1 a D6 siguen abiertos (son de lógica o de contenido). (4) El error K3 le dice a quien carga «avise al encargado» también cuando lo ve el encargado.

**Sin hacer.** Accesibilidad B8 (token `--c-neutro-r`: `#737980` y los pares `tono-r / acento-suave` en `contraste.mjs`; los tokens quedaron intactos a pedido).

## 18/11/2026 (noche, 18 · rama `logica-4-5c`) — Correcciones de lógica de la revisión del paso 4.5 (programador)

**Qué se hizo.** La lógica que marcaron los informes de código, QA y accesibilidad del 4.5 (`docs/revisiones/demo2-etapa45-*.md` del portafolio, fuera del repo), con el test que falla primero. Un commit por tema, sin push. Rama aparte (`git worktree` en `D:\demo-control-flota-logica`, desde `interfaz-etapa-0`) para no pisar al maquetador.

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

**Verificación.** `npm test`: 1322 tests (1275 antes), también con `npm run test:tz`; `npm run check`: 0 errores y 0 avisos; `npm run build` y `npm run buscar`: sin hallazgos; sin nombres de terceros ni «@gmail» fuera de la regla de `buscar`.
