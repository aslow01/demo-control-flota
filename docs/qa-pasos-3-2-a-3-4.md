# QA destructivo: pasos 3.2 a 3.4 (marco, diálogos, reinicio)

Fecha: 18/11/2026. Rama `interfaz-etapa-0`, diff `abc02e0..HEAD` (último commit `4b0d65f`). Revisión de solo lectura: no se tocó
código ni se commiteó. Todo lo generado (build, scripts, capturas) está fuera del repositorio, en el scratchpad
`C:\Users\matia\AppData\Local\Temp\claude\ffcbbd6502dd7960\155075df-f9ed-4064-a995-cf0eb42f2bca\scratchpad\qa\` (scripts `t1.py` a `t41.py`,
capturas en `caps\`).

## Cómo se probó

- Automático: `npm test` 675 de 675 (también `npm run test:tz`), `npm run check` 0 errores, `npm run buscar` sin hallazgos,
  `npm audit` 0 vulnerabilidades, `npm run contraste` 0 fallas (3 justas ya conocidas).
- Build de producción con `npx vite build --outDir <scratchpad>\dist` (no se tocó `dist/`) y servido con una copia de
  `scripts/servir-dist.mjs` apuntando a esa carpeta, con las cabeceras reales de `public/_headers`, en el puerto 4302. Desarrollo en el 5302.
  Los dos se apagaron al terminar.
- Playwright (Python) con Chromium. WebKit solo en una prueba de humo (ver el final). Estados forzados: `Date` inválido para llegar a
  la fase `error`, `indexedDB` parchado (inexistente, `open` que lanza, que da error o que nunca responde), `meta` reescrito en IndexedDB
  para D5, D7 y perfiles corruptos, `BroadcastChannel` para D9, `page.clock` para el cambio de día.
- Consola, violaciones de CSP (`securitypolicyviolation`) y peticiones externas se registraron en cada recorrido del build de producción:
  **cero errores, cero advertencias, cero violaciones, cero conexiones externas.**
- `muestras.html` **no está** en el build (`dist` solo tiene `index.html`, `_headers` y `assets/`; `grep -ri muestras` sin resultados). En el
  servidor de producción `/muestras.html` devuelve la app (fallback a `index.html`). En desarrollo carga sin avisos.

## Resumen

| Severidad | Cantidad |
| --- | --- |
| Bloqueante | 0 |
| Alto | 1 (A1) |
| Medio | 5 (M1 a M5) |
| Bajo | 7 (B1 a B7) |
| Dudoso o decisión de diseño | 7 (D1 a D7) |

---

## Alto

### A1. «Confirmar en dos pasos» no confirma nunca en pantallas táctiles (`BotonConfirmar`)

Archivo: `src/componentes/BotonConfirmar.svelte:30-46` (`alHacerClic` y `onpointerleave={restablecer}`).
Hoy el componente solo se usa en `muestras.html` (todavía no está en ninguna pantalla), pero es el de «Descartar borrador» del parte,
que se completa **desde el celular**: cuando se use, no va a funcionar.

Pasos (se reproduce en `t32.py` y `t33.py`):
1. `npm run dev`, abrir `/muestras.html` con un contexto táctil (`has_touch=True`, `is_mobile=True`, 390 × 844).
2. En «Diálogo y confirmación en dos pasos», tocar «Descartar borrador»: pasa a «Confirmar: descartar» (variante peligro).
3. Esperar 700 ms (más que el filtro de doble clic de 500 ms) y tocar de nuevo.

Esperado: el segundo toque confirma («Descartes confirmados: 1») y el botón vuelve a «Descartar borrador».
Obtenido: «Descartes confirmados: 0» y el botón sigue armado. Con mouse, en cambio, funciona (cuenta 1).

Causa (secuencia de eventos medida con touch): `pointerdown, pointerup, pointerout, pointerleave, touchend, click`. En un toque, `pointerleave`
llega **antes** del `click`, y `restablecer()` desarma el botón justo antes de que el clic lo lea; el segundo toque lo vuelve a armar en vez
de confirmar. Un solo `onpointerleave` rompe el flujo táctil; hay que restablecer solo con `pointerType === "mouse"`, o quitarlo.

---

## Medio

### M1. Si IndexedDB cuelga, el arranque queda en «Preparando la flota de ejemplo…» para siempre y sin salida

Archivos: `src/lib/persistencia/indexeddb.ts` (`abrirIndexedDB`, sin plazo), `src/lib/persistencia/arranque.ts:120` (`arrancar`), `src/App.svelte` (fase `arrancando`).
Pasos (`t10.py`, variante «open-cuelga»): con un script de inicio, `indexedDB.open = () => ({})` (un pedido que nunca dispara `success` ni `error`); abrir la app.
Esperado: pasado un plazo razonable, caer a la memoria (D8) y mostrar el aviso de «no permite guardar datos», o al menos ofrecer «Recargar».
Obtenido: tras 3,5 s sigue «Preparando la flota de ejemplo…» con una barra indeterminada; la barra superior no tiene acciones en esa fase y no hay botón.
No hay temporizador de arranque (solo el de 300 ms que muestra el texto). Es el cuelgue conocido de IndexedDB en algunos Safari y modos privados.
Variante reproducida con IndexedDB real (`t6.py`, `t31.py`): si queda un `deleteDatabase` pendiente por otra conexión, abrir la base queda
esperando detrás del borrado y la pestaña nueva se queda en «Preparando…» hasta que la otra conexión se cierre.

### M2. Cerrar el diálogo «Reiniciar demo» mientras reinicia deja un diálogo trabado y esconde el error

Archivos: `src/App.svelte:53-71` (`confirmarReinicio`), `src/componentes/Dialogo.svelte` (Esc, X y «Cancelar» siempre cierran).
Pasos (`t17.py`, con la base lenta por una transacción larga de otra pestaña):
1. Abrir «Reiniciar demo» y confirmar: el botón pasa a «Reiniciando…» (aria-disabled).
2. Pulsar Esc (o «Cancelar» o la X).
3. Reabrir «Reiniciar demo» antes de que termine.

Esperado: mientras trabaja, el diálogo no se puede cerrar (o se cierra y avisa cuando termina o falla).
Obtenido: el diálogo se cierra con la operación en curso; al reabrirlo muestra «Reiniciando…» deshabilitado y se cierra solo cuando termina.
Si el reinicio fallara con el diálogo ya cerrado, `errorAlReiniciar` se guarda pero nadie lo ve (el diálogo siguiente lo borra al abrir).

### M3. Esc repetido salta la protección de «Tiene cambios sin guardar» (en Chrome)

Archivo: `src/componentes/Dialogo.svelte:128-133` (`alCancelar` con `evento.preventDefault()`).
Latente: ninguna pantalla usa `hayCambios` todavía; se ve en `/muestras.html` (`t34.py`).
Pasos: abrir «Abrir un diálogo con campos», escribir en el campo de texto que alimenta `hayCambios`, pulsar Esc tres veces seguidas sin otra interacción.
Esperado: Esc 1 muestra «Tiene cambios sin guardar» con «Seguir editando» enfocado; Esc 2 vuelve a editar; Esc 3 vuelve a pedir confirmación.
Obtenido: el tercer Esc **cierra el diálogo sin confirmar** (Chrome vuelve no cancelable el evento `cancel` tras varios Esc sin interacción del usuario).
Cuando lleguen los formularios de la Etapa 4, se pierde lo escrito sin aviso. Conviene manejar Esc en `keydown` y no depender de `cancel`, o tratar `close` con cambios.

### M4. «Reiniciar demo» desde la pantalla de error borra la base y deja las otras pestañas muertas, con un mensaje falso

Archivos: `src/lib/estado/app.svelte.ts:279-290` (`reiniciarDesdeError`), `src/lib/persistencia/indexeddb.ts:314-332` (`borrarIndexedDB`).
Probabilidad baja (ver D1), consecuencia seria.
Pasos (`t7.py`): pestaña B normal (demo cargada); pestaña A en fase `error` (forzada); en A, «Reiniciar demo» y confirmar. En B pulsar «Reiniciar demo» y confirmar.
Esperado: B se entera (aviso D9) o sigue funcionando.
Obtenido: B no muestra ningún aviso; su conexión se cerró sola (`onversionchange`) y **toda escritura falla para siempre**: el diálogo dice
«No se pudo reiniciar la demo. Se conservaron los datos que tenía. Intente de nuevo.» (los datos ya no existen y reintentar nunca sirve);
cambiar de perfil dice «No se pudo cambiar la vista. Intente de nuevo.». Solo recargar lo arregla. Además, si el borrado queda bloqueado por una
conexión que no se cierra, el mensaje útil de `borrarIndexedDB` («cierre las demás pestañas») se pierde: la persona ve el genérico «borre los datos de este sitio».

### M5. «Demo reiniciada» se anuncia una sola vez

Archivo: `src/App.svelte:47` y `:62` (`anuncio = TEXTO_REINICIO.hecho`, región `role="status"` al final).
Pasos (`t26.py`): reiniciar tres veces seguidas; contar mutaciones de la región.
Esperado: cada reinicio se anuncia (WCAG 4.1.3).
Obtenido: 1 mutación en total: el segundo y el tercer reinicio asignan el mismo texto, el DOM no cambia y un lector de pantalla no dice nada.
Además la región está fuera del diálogo y se escribe mientras el diálogo modal todavía deja la página inerte; no se pudo verificar con lector real (ver «No probado»).
Arreglo simple: vaciar `anuncio` antes y asignarlo en el siguiente ciclo.

---

## Bajo

### B1. El foco cae a `body` al cerrar un aviso y tras «Actualizar» sin cambio de pantalla
Archivos: `src/componentes/Aviso.svelte` (botón «Cerrar aviso»), `src/App.svelte:150` (`actualizar`).
Pasos (`t20.py`, `t9.py`): D5 o D7 forzados (ver más abajo): enfocar «Cerrar aviso» con Tab y Enter. Para D9: en otra pestaña reiniciar la demo; en esta, enfocar «Actualizar» y Enter.
Esperado: el foco pasa a un lugar sensible (el `h1` o el siguiente control). Obtenido: `document.activeElement === document.body` (el botón se destruye con el aviso); el siguiente Tab empieza desde el principio o desde un lugar arbitrario. Con cambio de pantalla sí va al `h1`.

### B2. Con dos diálogos apilados, cerrar el de arriba suelta el bloqueo de desplazamiento del fondo
Archivo: `src/componentes/Dialogo.svelte:76 y :100` (`classList.remove("dialogo-abierto")` sin contar cuántos hay).
Latente: hoy no hay forma de abrir dos con la interfaz (el fondo es inerte); se llega con `.click()` por script (`t18.py`).
Pasos: abrir «Cómo funciona», ejecutar `.click()` sobre «Reiniciar demo» de la barra, pulsar Esc una vez. Obtenido: queda «Cómo funciona» abierto y `html.dialogo-abierto` ya no está (el fondo vuelve a desplazarse). Servirá cuando un diálogo de acción abra otro («Antes de enviar», etc.).

### B3. El segundo clic de un doble clic atraviesa el diálogo ya cerrado
Pasos (`t4.py`): en 360 px abrir «Reiniciar demo» por el menú «Más» y hacer doble clic (120 ms) en el botón de confirmar.
Obtenido: el primer clic reinicia y cierra; el segundo cae sobre lo que haya debajo (hoy un bloque del pie, sin efecto). Con las pantallas de la Etapa 4 puede caer sobre un botón real. El filtro de doble clic de `BotonConfirmar` (ignora < 500 ms) no cubre los diálogos.

### B4. El perfil guardado no se valida
Archivos: `src/lib/persistencia/arranque.ts:50` (`metaUtilizable` no mira `perfil`), `src/lib/estado/app.svelte.ts` (`perfil`).
Pasos (`t20.py`): reescribir `meta.perfil` en IndexedDB y recargar. (a) `{"tipo":"conductor","conductorId":"no-existe"}`: la barra dice «Conductor: Conductor (persona ficticia)», sin unidad ni salida clara salvo «Cambiar». (b) `{"tipo":"<img src=x onerror=alert(1)>"}`: la app lo trata como conductor (`h1` «Parte diario») con los dos segmentos sin marcar. No hay XSS (todo va como texto; consola y CSP limpias). Solo se llega manipulando la base.

### B5. «Atrás» tras cambiar de perfil parece no hacer nada
Pasos (`t12.py`): en `#/alertas` elegir «Conductor» y un conductor (hash `#/conductor`); pulsar Atrás dos veces. Obtenido: sigue `#/conductor` en las dos (la entrada previa `#/alertas` se reescribe a `#/conductor` por la redirección canónica de `leerUbicacion`, con `replaceState`). El usuario necesita varias pulsaciones para salir de la demo.

### B6. El cuerpo con desplazamiento del diálogo es una parada de Tab sin nombre
Archivo: `src/componentes/Dialogo.svelte:247` (`.cuerpo`).
Pasos (`t1.py`): abrir «Cómo funciona» y tabular: Cerrar → `DIV` (el cuerpo, que Chrome vuelve enfocable por desbordar) → Entendido. La trampa de Tab propia (`enfocables`) no lo cuenta, así que la vuelta se salta ese `DIV` al envolver. Anuncia solo su texto, sin rol ni nombre; falta `role="region"` con `aria-labelledby` o `tabindex="0"` explícito.

### B7. «Ir al contenido» no hace nada durante el arranque
Archivo: `src/App.svelte` (`saltarAlContenido`).
Mientras la fase es `arrancando` no hay `h1` y `#principal` no tiene `tabindex`: el enlace no mueve el foco (queda en el propio enlace). Efecto mínimo; el arranque dura menos de medio segundo en Chromium.

---

## Dudoso o decisión de diseño

- **D1. La pantalla de error de arranque es casi inalcanzable.** `arrancar` cae a memoria (D8) ante cualquier falla de IndexedDB, así que `fase = "error"` solo ocurre si falla `reloj.momento()` o `generar`. Para probarla hubo que fabricar un `Date` inválido. «Reiniciar demo» desde ahí funciona (probado: con el reloj roto muestra el error junto a «Recargar la página»; con el reloj arreglado reinicia, anuncia y deja el foco en el `h1`), pero el valor práctico es bajo y es el origen de M4.
- **D2. Clic afuera no cierra los diálogos** (nativo `<dialog>`; `docs/diseno-ui.md` 5.17 no lo pide). El clic en el fondo deja el foco en el propio `<dialog>` (en lugar del botón). Si se quería «clic afuera cierra», falta; si no, está bien.
- **D3. Orden de tabulación del selector de perfil**: visualmente arriba de las pestañas a menos de 40 rem, en el DOM después (medido a 360 px: Alertas, Flota y recién «Ver como»). Ya figura en `docs/registro.md` (punto 3).
- **D4. Rutas del marcador**: `#/unidad/AB-123-CD` o `#/parte/ZK214BD/2026-11-18` muestran «Unidad AB 123 CD» aunque la unidad no exista; `#/ALERTAS` y `#/flota?x=1` dan «Página no encontrada» (distingue mayúsculas, no admite parámetros). Las pantallas reales de la Etapa 4 tienen que validar existencia. El hash hostil (`<script>`, `%00`, `#/../`, 201 caracteres, `%E0%A4%A`, `javascript:`) siempre cae en «Página no encontrada» sin repetirse en pantalla (`t11.py`).
- **D5. Todos los commits (46) llevan como autor el correo personal de Matías** (se ve con `git log --format=%ae`). El repositorio hoy es privado (`gh repo view`), pero `buscar-prohibidos.mjs` solo mira archivos, no el historial: al hacerlo público ese correo queda expuesto. Decidir si se reescribe el historial a un correo `noreply` antes de publicar.
- **D6. Último en escribir gana entre pestañas**: `cambiarPerfil` escribe `{...estado.meta, perfil}` del estado en memoria; si otra pestaña reinició, la pestaña desactualizada pisa `meta` (fechaBase, modificada) con valores viejos. Hoy no se puede mostrar en la interfaz (todavía no hay forma de modificar datos); se vuelve real con la Etapa 4.
- **D7. «Volver al portafolio» apunta a `https://matiasormeno.com.ar/`** (`textos-marco.ts:8`). No verifiqué que esté publicado.

## Lo que sí anda (para no repetir)

Doble y triple clic en «Continuar» y en «Reiniciar demo»: una sola escritura (contador de transacciones `readwrite`). Esc, X, «Cancelar», «Entendido» cierran y devuelven el foco al disparador (o al `h1` si cambió la pantalla). La trampa de Tab, Shift+Tab y el cambio rápido de perfil (25 secuencias aleatorias de clics, Esc y Continuar por script): estado, base, hash y radios siempre coherentes. D5, D7, D8 (cuatro formas de IndexedDB roto), D9 (2000 mensajes hostiles: un solo aviso, mensajes no válidos ignorados). Reloj: medianoche de Argentina con el diálogo abierto, cambio de día con la pestaña «oculta» (focus y visibilitychange), zona horaria Tokio, reloj atrasado. Atrás y adelante con un diálogo abierto (el diálogo sigue, la página de abajo cambia y el foco vuelve bien). 300 a 1920 px sin desplazamiento horizontal (13 anchos, incluidos los cortes de 639/640 y 895/896), claro y oscuro, 640 × 400 a escala 2 (zoom 200 %) y 320 × 256 a escala 4 (400 %): el diálogo cabe y el pie queda visible. Foco visible en todas las paradas de Tab. Sin `{@html}`, `innerHTML`, `eval` ni `Math.random` en `src`; sin nombres prohibidos en archivos.

## No probado o no concluyente

- **WebKit (Playwright en Windows):** la app **tardó 36 s en arrancar** (una transacción de unos 2.400 registros; un banco de pruebas mínimo ya se colgaba con 100 registros por almacén). Es el WebKit de Windows de Playwright, con IndexedDB muy lenta; no es concluyente sobre Safari real, pero conviene medir el primer arranque en un iPhone y recordar que M1 (sin plazo) lo agrava. En Chromium el primer arranque tarda unos 470 ms y un reinicio unos 360 ms.
- Firefox (no está instalado), Safari real, celulares reales (el toque se emuló con Playwright; el comportamiento de `pointerleave` de A1 es el estándar de Chromium y debería ser igual en Android).
- Lector de pantalla (NVDA, VoiceOver): no se verificó qué se anuncia, ni si una región `role="status"` cambiada dentro de un árbol inerte (M5) se lee.
- Modo de contraste alto de Windows y `prefers-reduced-motion`.
- Cuota de almacenamiento llena de verdad (solo se simuló con excepciones).
- Las cabeceras de Cloudflare Pages reales (se usó la copia local de `servir-dist.mjs`).
- `BotonConfirmar` y `hayCambios` solo en `/muestras.html`; los flujos con datos modificados llegan con la Etapa 4.

## Estado de las correcciones de la vista (maquetador, 18/11/2026)

Corregido: **A1** (toque), **M2** (bloqueo mientras reinicia), **M3** (Esc ×5), **M5** (anuncio repetible, comprobado con un `MutationObserver`: 3 anuncios en 3
reinicios), **B1** (foco tras cerrar un aviso y tras «Actualizar»), **B2** (contador de diálogos apilados), **B3** (el segundo clic de un doble clic ya no atraviesa:
1 clic llega al documento), **B6** (cuerpo del diálogo como región con nombre, enfocable solo si desborda), **B7** («Ir al contenido» durante el arranque
lleva el foco a `main`), **D3** (orden visual igual al de foco a 360 px).

Sin hacer: **M1, M4, B4, D1, D6** (lógica y arranque: los resolvió el programador o están anotados), **B5** (el «Atrás» tras cambiar de perfil es del enrutador:
`replaceState` en `leerUbicacion`), **D2** (clic afuera no cierra: se deja como está, `diseno-ui.md` 5.17 no lo pide), **D4, D5, D7** (no son de la vista).
