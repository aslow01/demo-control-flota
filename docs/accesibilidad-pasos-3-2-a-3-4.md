# Auditoría de accesibilidad (WCAG 2.2 AA) — pasos 3.2 a 3.4 (18/11/2026)

Alcance: componentes, marco de la aplicación (`App.svelte`, `BarraSuperior`, `BarraApp`, `SelectorPerfil`, `MenuMas`, `Pie`), avisos D5/D7/D8/D9, estados de arranque y de error, y los diálogos "Reiniciar demo", "Cómo funciona" y "¿Quién completa el parte?". Rama `interfaz-etapa-0`, servidor de desarrollo en el puerto 5303 (ya apagado).

Método: Chromium con Playwright (árbol de accesibilidad con `aria_snapshot`, observador de mutaciones para ver qué regiones vivas se insertan o cambian, orden real de Tab, medición de cajas, 320/360/640/1280 px, colores forzados, claro y oscuro). **No hay lector de pantalla real**: lo que dice "se anuncia" o "no se anuncia" es razonamiento sobre el comportamiento conocido de NVDA, JAWS y VoiceOver, y se marca como tal. Contraste: `npm run contraste` (148 mediciones, 0 fallan, 3 justas) repetido de forma independiente y, además, medido sobre el DOM renderizado (texto por texto, con el fondo efectivo) en 28 combinaciones de claro/oscuro × 1280/360 × 7 estados: **0 textos por debajo de su mínimo**.

## Resumen

| Severidad | Cantidad |
| --- | --- |
| Alto (falla un criterio AA con uso real afectado) | 3 |
| Medio | 4 |
| Bajo | 6 |

Pasa sin hallazgos: contraste de texto y de componentes (el peor texto medido es 4,65:1 en `--c-texto-3` sobre escritorio, y 5,18:1 el enlace sobre escritorio), objetivos táctiles (todo ≥ 44 px; los `input` de radio de 20 px están dentro de una etiqueta de 58 px), reflujo a 320 px sin desplazamiento horizontal en los 7 estados (incluido 320 × 256, que es 400 % en una pantalla de 1280 × 1024), espaciado de texto 1.4.12, idioma y título de página, un solo `h1`, puntos de referencia, trampa de foco y Esc en los diálogos, devolución del foco al disparador, `prefers-reduced-motion`, colores forzados.

## Hallazgos

### A1. El selector de perfil se ve antes que las pestañas pero se tabula después (Alto)
- **Criterio:** 2.4.3 Orden del foco; 1.3.2 Secuencia con significado.
- **Evidencia:** a 360 px `BarraApp.svelte` pone `.perfil { order: -1 }`. Medido: radio "Encargado" en y = 86, pestañas en y = 117, pero el orden de Tab es Portafolio, Más, Alertas, Flota, **Ver como**, y recién después el contenido. El foco salta hacia abajo y vuelve a subir.
- **Reproducir:** viewport 360 × 740, Tab desde el principio.
- **Arreglo:** ver recomendación 1.

### A2. El aviso D9 (y todo aviso que aparece con la página abierta) se inserta como región nueva (Alto)
- **Criterio:** 4.1.3 Mensajes de estado.
- **Evidencia:** el observador de mutaciones registra, al llegar el mensaje de otra pestaña, `insertado role=status, ancestroVivo=null`: la región nace con su texto ya dentro. No existía una región viva previa. El comportamiento conocido es que NVDA, JAWS y VoiceOver anuncian cambios dentro de una región que ya estaba en el DOM, y que una región `status` creada con su contenido se anuncia de forma inconsistente o no se anuncia (`role="alert"` creado dinámicamente sí suele anunciarse). El único aviso que llega con la página en uso es D9; D5, D7 y D8 están desde la carga y se leen al recorrer la cabecera.
- **Reproducir:** abrir la demo en dos pestañas y en la otra ejecutar `new BroadcastChannel('control-flota').postMessage({tipo:'cambio'})`.
- **Arreglo:** ver recomendación 2.

### A3. "Demo reiniciada" se anuncia mal: no se repite y se escribe con el diálogo todavía abierto (Alto)
- **Criterio:** 4.1.3.
- **Evidencia (medida):** (a) la región `role="status"` oculta existe desde el arranque (bien), pero `anuncio` se asigna siempre con el mismo texto y nunca se vacía: en el segundo reinicio de la sesión **no hay ninguna mutación en el DOM** (log vacío), así que no hay nada que anunciar. (b) En el primer reinicio el texto cambia en el mismo ciclo en que se cierra el diálogo modal, y justo después `alCerrarse` mueve el foco al botón disparador. Con un diálogo modal el resto de la página es inerte (fuera del árbol de accesibilidad) y un cambio de foco inmediato suele cortar o pisar un mensaje cortés; razonamiento, no verificado con lector.
- **Reproducir:** Reiniciar demo dos veces seguidas en la misma carga y mirar el nodo `.solo-lectores[role=status]`.
- **Arreglo:** ver recomendación 2 (mismo mecanismo).

### M1. Al cerrar o accionar un aviso, el foco cae a `body` (Medio)
- **Criterio:** 2.4.3 (el foco no se conserva); en la práctica una persona de teclado vuelve al principio de la página.
- **Evidencia:** "Cerrar aviso" (D5 o D7) → `document.activeElement` = `BODY`. "Actualizar" (D9) → `BODY`. (Reiniciar desde el aviso sí va al `h1`, porque lo resuelve `destinoDelFoco`.)
- **Arreglo:** al cerrar un aviso, mandar el foco al siguiente aviso, o al `h1` de la pantalla si era el último. Al "Actualizar", al `h1` o a la pestaña actual. Mismo patrón que ya existe (`irAlTitulo`).

### M2. Elegir "Conductor" abre un diálogo sin advertirlo (Medio)
- **Criterio:** 3.2.2 Al introducir datos.
- **Evidencia:** los radios de "Ver como" abren el diálogo "¿Quién completa el parte?" apenas cambian, también con la flecha derecha del teclado (medido: ArrowRight desde "Encargado" abre el diálogo). "Encargado" cambia toda la vista al instante. Ninguna ayuda visible ni descripción accesible lo anticipa. Si se cancela, el radio vuelve a "Encargado" mientras el foco queda en "Conductor".
- **Arreglo:** el criterio se cumple si la persona está advertida antes. Agregar a la leyenda una descripción asociada (`aria-describedby`) tipo "Al elegir Conductor se abre una lista para elegir quién". Alternativa más fuerte: dos botones con `aria-pressed` en lugar de radios, de modo que cambiar sea activar, no moverse con flechas.

### M3. "Cómo funciona": el foco inicial queda en un botón al final de una hoja larga (Medio)
- Es el punto 3, abajo. No es una falla de criterio por sí sola; se pone en Medio por la experiencia con lector (nadie oye el contenido).

### M4. "Preparando…" no avisa cuando termina (Medio, límite con Bajo)
- **Criterio:** 4.1.3 (por analogía con "carga completada").
- **Evidencia:** la región `status` existe desde el principio y el `<progress>` aparece a los 300 ms (bien). Cuando la fase pasa a `lista` el contenido simplemente reemplaza el estado y no hay mensaje de "listo", ni se mueve el foco (decisión deliberada: la primera pantalla no roba el foco).
- **Arreglo:** vaciar la región y escribir "Flota de ejemplo lista." solo si `preparando` llegó a mostrarse.

### B1. El enlace "Ir al contenido" no hace nada durante el arranque (Bajo)
- **Criterio:** 2.4.1 Evitar bloques.
- **Evidencia:** con el arranque lento (simulado con 1,5 s de demora de IndexedDB), Tab + Enter en el enlace deja el foco en el propio enlace: no hay `h1` y `main#principal` no tiene `tabindex`. Ventana de pocos cientos de ms en uso normal.
- **Arreglo:** `<main id="principal" tabindex="-1">`.

### B2. "Cómo funciona" en Safari: hoja desplazable sin nada enfocable dentro (Bajo)
- **Criterio:** 2.1.1 Teclado.
- **Evidencia:** `.cuerpo` tiene `overflow-y: auto` y ningún enlace ni control dentro. En Chromium (medido: Shift+Tab desde "Entendido" llega al propio `.cuerpo`) y Firefox los contenedores desplazables son enfocables solos; Safari no (comportamiento conocido, no verificado acá). A 360 px el contenido mide 818 px contra 524 visibles.
- **Arreglo:** lo resuelve la recomendación 3 (foco inicial en el título más `tabindex="0"` y `role="region"` con nombre en `.cuerpo`).

### B3. `anuncio` queda como texto huérfano fuera de los puntos de referencia (Bajo)
- **Criterio:** 1.3.1 (informativo).
- **Evidencia:** el `div.solo-lectores[role=status]` va al final del `body`, fuera de `main` y `footer`. Si se queda con "Demo reiniciada…" para siempre, quien lee con flechas lo encuentra como texto suelto.
- **Arreglo:** vaciarlo unos segundos después de anunciar (ver recomendación 2).

### B4. Diálogos en altura muy baja (Bajo)
- **Criterio:** 1.4.10 Reflujo (usabilidad).
- **Evidencia:** a 320 × 256 el pie ocupa 121 px de 256 y el cuerpo visible del diálogo de conductores queda en 88 px. Se puede desplazar y operar; es incómodo.
- **Arreglo:** `@media (max-height: 30rem) { .pie { position: static } }` dentro del cuerpo, o pasar el pie dentro del área desplazable en esa altura.

### B5. Colores forzados: el segmento elegido conserva la sombra interior (Bajo, estético)
- **Evidencia (captura con `forced-colors: active`):** `.segmento:has(input:checked)` usa `forced-color-adjust: none` con `Highlight`/`HighlightText` (legible), pero la línea inferior de `box-shadow` sigue en el color del acento sobre `Highlight`. No afecta la legibilidad.
- **Arreglo:** `box-shadow: none` dentro de ese bloque `@media (forced-colors: active)`.

### B6. Cobertura del script de contraste (Bajo, informativo)
- `npm run contraste` no mide el borde del botón secundario sobre los fondos de aviso. Medido acá: `--c-borde-fuerte` sobre `-f` de tono: 3,37 / 3,31 / 3,29 en claro y 3,18 / 3,02 / 3,26 en oscuro (mínimo 3). Pasan, la de oscuro sobre quincena (D9) por apenas 0,02. Conviene sumar esos tres pares al script antes de tocar la paleta.

## Los seis puntos que dejó abiertos el maquetador

**1. Orden visual del selector de perfil (A1).** Recomendación: **quitar `order: -1` y dejar el selector debajo de las pestañas en menos de 40 rem**, con `border-top` en lugar de `border-bottom`. Mantiene el DOM igual (pestañas y después "Ver como"), una sola línea de CSS y el orden de foco coincide con lo que se ve. Invertir el DOM exigiría el desorden contrario en pantallas anchas.

**2. Anuncios (A2, A3).**
- D5, D7 y D8 llegan con la carga: se leen al recorrer la cabecera y no necesitan anuncio. Con `role="status"` creado ya con texto el anuncio no es fiable (razonamiento).
- Solución para D9: un contenedor `.avisos` **siempre presente** (`role="status"`, vacío cuando no hay avisos, sin relleno propio) y los avisos adentro **sin** rol propio. Se conserva `rol="alert"` solo en errores que aparecen tras una acción (`errorAlCambiarVista`), que insertados dinámicamente sí se anuncian.
- "Demo reiniciada" en la región oculta: sirve por estar siempre presente, pero hay que (a) escribir el texto **después** de cerrar el diálogo y restaurar el foco (por ejemplo `setTimeout` de 250 ms dentro de `alCerrarse`), (b) vaciarlo antes y a los pocos segundos para que el segundo reinicio también cambie el DOM, y (c) idealmente dejarlo dentro de un punto de referencia. Verificar con NVDA o VoiceOver antes de publicar, porque acá no hubo lector.

**3. Foco inicial de "Cómo funciona".** Recomendación: **el título**, no "Entendido". Agregar `focoInicial="titulo"` a `Dialogo` (el `h2` con `tabindex="-1"`), de modo que el lector diga el nombre del diálogo y siga leyendo desde el principio, y hacer que `.cuerpo` sea enfocable con `tabindex="0"` y `role="region"` con `aria-labelledby` al título (cubre Safari). "Entendido" sigue siendo el primer control al tabular. Los diálogos con campos o destructivos mantienen su foco actual (campo o "Cancelar").

**4. Objetivos táctiles 2.5.8.** Cumple con holgura: todo lo operable mide ≥ 44 × 44 (pestañas 52–60 de alto, segmentos 44, botones 44, "Más" 44 × 44, ítems del menú 44, opciones del diálogo de conductores 58 de alto con el `input` de 20 px dentro). Un cambio opcional: subir los `input` de radio a 24 px para que el control mismo no quede por debajo del mínimo de 24 si algún día se separa de su etiqueta.

**5. Zoom 200 % y 400 % / reflujo.** Cumple. A 640 px (200 %), 320 px (400 %) y 320 × 256 no hay desplazamiento horizontal en el estado normal, con D5 + D9, con el error de arranque, con los tres diálogos y con el espaciado de texto de 1.4.12 inyectado. Único detalle: B4 (alturas muy bajas).

**6. Colores forzados.** Cumple en lo esencial: foco con `Highlight`, pestaña activa subrayada, segmento elegido en `Highlight`/`HighlightText`, bordes transparentes que se vuelven visibles (insignia, etiquetas, avisos, botones), diálogo con borde y fondo del sistema, íconos con `currentColor`. Solo B5, estético.

## Archivos relevantes
- `D:\demo-control-flota\src\App.svelte` (avisos, `anuncio`, `destinoDelFoco`, enlace "Ir al contenido")
- `D:\demo-control-flota\src\componentes\BarraApp.svelte` (`order: -1`)
- `D:\demo-control-flota\src\componentes\SelectorPerfil.svelte` (cambio de contexto al elegir)
- `D:\demo-control-flota\src\componentes\Aviso.svelte` (`role` propio)
- `D:\demo-control-flota\src\componentes\Dialogo.svelte` (foco inicial, `.cuerpo`)
- `D:\demo-control-flota\src\componentes\DialogoComoFunciona.svelte`
