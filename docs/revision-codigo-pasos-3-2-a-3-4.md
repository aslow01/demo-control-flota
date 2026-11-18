# Revisión de código: pasos 3.2 a 3.4 (`abc02e0..HEAD`, rama `interfaz-etapa-0`)

Revisor: `revisor-codigo`. Fecha: 18/11/2026. Alcance: tokens y base CSS, componentes del marco, `App.svelte`, diálogos, revisión de textos y
`reiniciar()` desde la fase `error` (`app.svelte.ts`, `indexeddb.ts`, `instancia.ts`). No se editó nada del repositorio.

**Verificado por mi cuenta:** `npm run check` 0 errores y 0 advertencias; `npm test` 675 pasan; `npm run buscar` sin hallazgos; `npm audit` 0
vulnerabilidades; `vite build` a una carpeta temporal sale limpio (`dist` solo tiene `index.html`, un JS y un CSS; la cadena `muestras`
no aparece en el JS). Dos hallazgos (1 y 2) se reprodujeron en Chromium 151 con Playwright contra `npm run dev` en el puerto 5301 (ya apagado).

## Seguridad: sin hallazgos

- Cero `{@html}`, `innerHTML`, `eval`. Ningún `style="..."` en `src/` ni en `index.html` (los dos `style:` de `Muestras.svelte` usan CSSOM, que
  `style-src 'self'` permite, y solo corren en desarrollo). El favicon `data:` entra por `img-src data:`.
- `muestras.html` no es entrada del build y nada de `src/` la importa. El `DOMParser` de `src/muestras/main.ts` parsea `index.html` propio
  (no ejecuta scripts) y solo existe en desarrollo.
- Dependencias con versión exacta, sin sumas nuevas.

## Alta (1)

### 1. `BotonConfirmar` no confirma nunca en pantallas táctiles — `src/componentes/BotonConfirmar.svelte:44-49` (`onpointerleave={restablecer}`)

En un dedo, el navegador dispara `pointerup`, luego `pointerleave` y después `click`. El segundo toque desarma el botón con `pointerleave`
justo antes de que llegue el `click`, que lo vuelve a armar. Resultado: el botón alterna eternamente en «Confirmar: descartar» y `alConfirmar` no corre.
Es el caso de uso principal (parte desde el celular, «Descartar borrador»).

**Reproducción (hecha):** Playwright con `hasTouch`/`isMobile`, `muestras.html`, `.confirmar button`: `tap()`, espera 700 ms, `tap()` →
«Descartes confirmados: 0» y etiqueta todavía «Confirmar: descartar». Con mouse (`click` dos veces) da 1. El registro dice que se probó con
mouse; los eventos táctiles no.

**Arreglo:** que `pointerleave` solo restablezca si `evento.pointerType === "mouse"` (o directamente quitar `pointerleave` y quedarse con
`focusout`, Esc y un tiempo de vencimiento de ~5 s con `setTimeout` cancelado en `$effect`). Agregar una prueba táctil a la lista de la sección 12 de `diseno-ui.md`.

## Media (5)

### 2. Tres Esc seguidos cierran el diálogo y descartan los cambios — `src/componentes/Dialogo.svelte:116-121` (`alCancelar`)

`alCancelar` hace `preventDefault()` en el evento `cancel`. Chrome solo respeta eso unas veces seguidas sin interacción del usuario (close watcher):
la tercera vez cierra el `<dialog>` nativamente y `onclose` → `alCerrarse` pone `abierto = false` sin pasar por «Tiene cambios sin guardar».
Hoy solo afecta al diálogo de muestras (`hayCambios`), pero la Etapa 4 (corregir kilometraje, etc.) lo hereda.

**Reproducción (hecha):** muestras, «Abrir un diálogo con campos», escribir en «Motivo», Esc (aparece «Tiene cambios sin guardar»), Esc (vuelve a
editar), Esc → el diálogo se cierra con el texto sin guardar.

**Arreglo:** manejar Esc en `onkeydown` (`if (evento.key === "Escape") { evento.preventDefault(); …}`): cancelar el `keydown` evita el `cancel`
nativo. Dejar `oncancel` solo como red (si llega con `hayCambios`, reabrir con `showModal()` y mostrar la confirmación).

### 3. Se puede cerrar el diálogo de «Reiniciar demo» mientras reinicia, y el error se pierde — `src/App.svelte:48-67`, `Dialogo.svelte` (sin bloqueo)

Con `cargando` el primario queda deshabilitado, pero «Cancelar», la X y Esc siguen cerrando. El reinicio sigue en la cola, y si falla,
`errorAlReiniciar` se completa con el diálogo ya cerrado: nadie ve `noPudoReiniciar`. Si sale bien, la demo se reinicia aunque la persona "canceló".
**Arreglo:** prop `bloqueado` en `Dialogo` (ignora `pedirCierre`/Esc mientras `cargando`), o mostrar el error del reinicio como `Aviso` global si el diálogo ya no está abierto.

### 4. El anuncio «Demo reiniciada» se dice una sola vez — `src/App.svelte:46,60,198`

`anuncio` se asigna siempre al mismo texto y nunca se vacía: en el segundo reinicio el valor no cambia, no hay mutación en la región `role="status"`
y el lector de pantalla calla. **Arreglo:** vaciarlo antes (`anuncio = ""; await tick(); anuncio = …`) o con un `setTimeout` que lo limpie a los pocos segundos.

### 5. Una conexión cerrada por `onversionchange` queda muerta y la otra pestaña no se entera — `indexeddb.ts:149`, `app.svelte.ts:279-290`

`borrarIndexedDB` (y cualquier cambio de versión futuro) cierra la conexión de las demás pestañas (`this.cerrar()`) sin avisar a la app. Esa pestaña
sigue "lista", pero toda escritura devuelve «No se pudo guardar…» y «Actualizar» falla, hasta recargar. Además `reiniciarDesdeError` no llama a
`pestanas?.avisarCambio()` (el `reiniciar()` común sí), ni limpia nada para las otras pestañas. El test «con otra conexión abierta» comprueba
que la conexión se cierra, pero no el efecto en la app.
**Arreglo:** que `RepositorioIndexedDB` reciba un `alCerrarseSola` y `EstadoApp` lo use para mostrar un aviso («Otra pestaña reinició la demo; recargue la página»), y avisar el cambio tras reiniciar desde error.

### 6. `reiniciar()` desde `error` casi nunca puede ayudar y borra datos por una causa que no es el almacenamiento — `app.svelte.ts:263-290`, `tests/app-estado.test.ts` (bloque «decisión A»)

`arrancar()` absorbe cualquier falla de IndexedDB y pasa a memoria (D8). A la fase `error` solo se llega por `reloj.momento()`, `generar` o la
barra de direcciones, es decir, por un fallo que no está en el disco. Borrar la base ahí no arregla nada y descarta datos buenos. Los tests lo disimulan:
los tres «con IndexedDB» provocan el error con el reloj roto *antes* de abrir el almacenamiento, así que nunca hay una base dañada ni una conexión abierta.
Y el caso que sí necesitaría borrar la base (cargar falla → memoria con aviso «sin almacenamiento») no tiene salida: «Reiniciar demo» solo toca la memoria.
**Arreglo:** decidir si el reinicio desde error borra solo cuando el error vino del almacenamiento (guardar la causa en `iniciar`), o si en modo
`enMemoria` «Reiniciar demo» intenta `borrarAlmacenamiento` + reabrir. Documentarlo en `diseno.md`. Anotación: `onblocked` en `borrarIndexedDB` rechaza pero
el pedido de borrado sigue pendiente en el navegador y puede ejecutarse más tarde sin que nadie lo espere; un test con otra conexión que no cierre cubriría ese camino.

## Baja (sugerencias)

7. **Comentario invertido** — `Dialogo.svelte:24`: dice que el foco vuelve primero al disparador y después a `focoDestino()`; el código (`:109`) da prioridad a `focoDestino()`. `Panel.svelte:7` dice que el diálogo le devuelve el foco al `h2` del panel; el diálogo solo conoce `main h1`. O se implementa o se borra (y con él el `tabindex="-1"` del `h2`).
8. **Foco tras reiniciar con cambio de pantalla** — `App.svelte:57`: `irAlTitulo = desdeError`. Si el reinicio desde la lista cambia de ruta (`irA(rutaPorDefecto)`), el `$effect` quiere enfocar el `h1` mientras el modal sigue abierto (elemento inerte: no pasa nada) y el foco vuelve al disparador. Usar `irAlTitulo = true` cuando cambie `app.versionDePantalla`.
9. **Error de «Elegir Encargado» pegado** — `App.svelte:123-126`: `errorAlCambiarVista` solo se limpia al volver a elegir Encargado; un cambio exitoso por el diálogo de conductor deja el aviso crítico viejo.
10. **Parpadeo del selector** — `SelectorPerfil.svelte:38-46`: `sincronizar()` devuelve el radio al valor viejo de inmediato y recién salta al nuevo cuando termina la escritura. Marcar el radio de forma optimista o mostrar `cargando`.
11. **`DialogoConductor`**: el `$effect` de `:36` depende de `elegidoInicial`; cuando `cambiarPerfil` cambia el perfil con el diálogo aún abierto, reinicia `elegido` y `sinElegir`. Usar `untrack(() => elegidoInicial)`. `continuar()` busca `dialog[open] [data-foco-inicial]` en el documento entero (`:47`): mejor un `bind:this` del contenedor.
12. **Textos con reglas duplicadas** — `textos-marco.ts:73-90`: «10 puntos de revisión», 7/15/30 días y «punto crítico» están escritos a mano; un test que compare con `ITEMS_CHECKLIST.length` y los umbrales evita que se desfasen.
13. **`nombreDeLaPantalla`** — `App.svelte:154`: `titulo.replace(/ · .*$/, "")` depende del sufijo; que `enrutador.ts` exporte el nombre sin sufijo.
14. **`html.dialogo-abierto { overflow: hidden }`** (`base.css:112`) quita la barra y corre el diseño en escritorio; sumar `scrollbar-gutter: stable` en `html`.
15. **Conexión sin cerrar** — `arranque.ts:109-113`: si `cargar()` falla tras abrir IndexedDB y se cae a memoria, el repositorio abierto no se cierra (se cierra solo ante un `versionchange`, pero queda colgado).
16. **Sin pruebas de interfaz**: ~2400 líneas de componentes y el foco/trampa de Tab/Esc de `Dialogo` se verifican solo a mano, y por eso pasaron 1 y 2. Un humo con Playwright (touch y teclado) en CI, aunque sea manual, o un caso en la lista de `diseno-ui.md` sección 12.
17. **`scripts/contraste.mjs`** recorta el CSS con `indexOf("\n  }\n")`: se rompe si cambia la indentación de `tokens.css`; fallar con un mensaje claro si no encuentra los bloques.
18. Nombre `reiniciar` para el booleano del diálogo en `App.svelte:35` choca en la lectura con `app.reiniciar()`; `diálogoReiniciarAbierto` o similar.

## Estado de las correcciones de la vista (maquetador, 18/11/2026)

Corregido: **1** (`BotonConfirmar` solo desarma con `pointerleave` de mouse, vence a los 4 s; probado con toque y con mouse), **2** (Esc en `keydown`;
Esc ×5 con cambios no cierra; red de seguridad si el navegador cierra solo), **3** (`bloqueado`: sin Esc, X ni Cancelar mientras reinicia),
**4** (el anuncio se vacía, se escribe 250 ms después de cerrar y se limpia a los 6 s; se anuncia en el 1.º, 2.º y 3.º reinicio),
**7** (comentarios de `Dialogo` y `Panel`), **8** (foco al `h1` si el reinicio cambió de pantalla), **9** (el error de «Encargado» se limpia al
elegir conductor), **10** (el selector ya no parpadea: son botones sin estado propio), **11** (`untrack` y `bind:this`), **14** (`scrollbar-gutter`
en 40 rem o más), **17** (`contraste.mjs` falla con mensaje claro), **18** (nombres de los booleanos de diálogo). También B2 del QA
(contador de diálogos apilados).

Queda para el programador o sin hacer: **5** y **6** (los resolvió la lógica: se quitó el reinicio desde `error`), **12** (test que compare los textos con
las reglas), **13** (`enrutador.ts` debería exportar el nombre sin sufijo), **15** (hecho en la lógica), **16** (humo de interfaz con Playwright en CI: no se
agregó; las comprobaciones de touch y teclado se hicieron a mano con scripts fuera del repositorio).

## Estado de las correcciones de la lógica, segunda tanda (programador, 18/11/2026)

Corregido: **12** (`tests/textos-marco.test.ts` compara con el dominio los umbrales de 7, 15 y 30 días, la cantidad de puntos de revisión y el criterio de punto
crítico; no hizo falta armar el texto desde constantes: el test lee los números del texto y los contrasta con `clasificar` y `ITEMS_CHECKLIST`; se vio fallar
cambiando el texto y el umbral), **13** (`nombreDePantalla` en `enrutador.ts`, `app.nombrePantalla` y `App.svelte` sin la expresión regular). Siguen sin hacer: **16**
(humo de interfaz con Playwright en CI).
