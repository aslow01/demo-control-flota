# Diseño de interfaz — Control de flota (18/11/2026)

Especificación visual y de interacción para el maquetador (marcado y CSS) y el programador (TypeScript y estado). Las
reglas de negocio están en `docs/diseno.md` (identificadores T, V, A, P, K, N, U, H, D): este documento **no cambia
ninguna regla**, solo cómo se ve, cómo se ordena y cómo se usa. Textos de interfaz en **español neutro** (se trata al
lector de usted o en forma impersonal; sin voseo). Todo dato es ficticio.

Base: el sistema visual de la Demo 1 (`D:\demo-lector-facturas\docs\diseno-ui.md`, secciones 3 y 13.3). Acá se
**repiten los valores** que hacen falta para que nadie tenga que abrir el otro documento.

Si algo de acá no alcanza para implementar sin adivinar, es un defecto de este documento: preguntar antes de inventar.

---

## 0. Encuadre

| | |
| --- | --- |
| **Quién la usa** | (a) **Encargado de flota**, en escritorio y a veces en el celular: quiere saber a primera hora qué no puede salir y qué vence. (b) **Conductor**, en el celular, de pie al lado de la camioneta, con poco tiempo, a veces con guantes y con sol. |
| **Quién la evalúa** | Un gerente de logística o administración (10 segundos: "acá nada se escapa") y un líder técnico (reglas de fechas, estados, accesibilidad, que no se rompa). |
| **Qué se entiende en 10 segundos** | "Hoy no pueden salir 4 unidades, y por qué. Esto vence esta semana. El conductor carga el parte desde el celular." |
| **Acción principal por pantalla** | Centro de alertas: abrir la unidad que no puede salir o renovar lo vencido. Flota: encontrar una unidad. Ficha: resolver (renovar, cerrar novedad, volver a servicio). Parte: **enviar el parte**. |
| **Prioridad de lectura del centro de alertas** | 1) cuántas unidades no pueden salir hoy y por qué; 2) pendientes de la operación diaria; 3) qué vence en 7, 15 y 30 días; 4) el detalle. |

---

## 1. Dirección visual: "Horizonte"

Una herramienta de operación sobria, de la misma familia que la Demo 1 (escritorio gris apenas cálido, paneles blancos
con barra de título, un solo acento azul petróleo, color reservado al estado), con **un rasgo propio que sale del
dominio: el tiempo que falta**. La pieza firma es el **horizonte de vencimientos**: una regla de 0 a 30 días con los
documentos marcados como puntos y tres tramos (7, 15, 30), y a la izquierda una caja aparte para lo ya vencido o
faltante. Se repite en tres escalas: grande en el centro de alertas, mediana en la ficha de cada unidad y mínima en la
tabla de la flota. Así la página dice "esto vence pronto" con la posición, no con un cartel rojo.

El segundo rasgo es la **patente como identificador tipográfico**: un rótulo chico, monoespaciado, con borde fino y una
banda superior de 3 px, que es como la gente de flota nombra las unidades. No imita la placa oficial (sin banda azul,
sin escudo, sin leyendas): es un identificador, como el número de pedido en un sistema de ventas.

El tercero es el **parte diario pensado para el pulgar**: una sola columna, botones de 48 px, dos opciones por punto de
revisión ("En orden" / "Con novedad"), una barra inferior con lo que falta y el botón de enviar, y el borrador que se
guarda solo.

Referencias reales (para mirar cómo resuelven, no para copiar):
- **Fleetio, "Renewal Reminders"**: vencimientos agrupados en "vencido" y "por vencer" con umbral; buena separación entre lo urgente y lo planificable.
- **Samsara, inspección previa al viaje del conductor (DVIR)**: punto por punto, defecto con descripción, y el resultado "apto / no apto para operar". De ahí la idea de que una novedad crítica saque la unidad de servicio.
- **Things 3, vista "Upcoming"**: el tiempo como eje de lectura (hoy, esta semana, más adelante) sin colores estridentes.
- **GOV.UK Design System**: resumen de errores al enviar un formulario, mensajes de error junto al campo, botón de enviar que nunca se deshabilita.
- **Linear**: densidad cómoda en listas, foco de teclado visible sin ruido.

### 1.1 Alternativas consideradas

| Dirección | Qué es | Por qué no |
| --- | --- | --- |
| B. "Bitácora" | La pantalla principal es una línea de tiempo de todo lo que pasó (partes, novedades, renovaciones), como un libro de guardia. | Buena para el historial (y se usa ahí), pero el encargado necesita **prioridad**, no cronología: lo urgente quedaría mezclado con lo rutinario. |
| C. "Semáforo de unidades" | Grilla de tarjetas, una por camioneta, en rojo, ámbar o verde, con cifras grandes arriba. | Es el cliché de "tablero de flota": grilla de tarjetas tipo bento, el color como señal principal, no escala a 60 unidades y no dice **qué** vence ni **cuándo**. |

Elegida A porque sirve a los dos lectores: el gerente ve la respuesta en una cifra y una regla; el técnico ve que la
regla codifica exactamente las reglas V1–V8 (bordes incluidos).

### 1.2 Qué hereda de la Demo 1 y qué es propio

| Hereda (igual) | Propio de esta demo |
| --- | --- |
| Tokens de color, tipografía, espaciado, radios, sombras y movimiento (sección 3). | Horizonte de vencimientos (5.6). |
| Anatomía de panel: barra de título que identifica, interior, barra de estado que informa (5.4). Sin plegar. | Patente (5.5). |
| Etiqueta de estado rectangular con ícono de forma distinta y texto (5.7). | Parte diario para el celular: ítem de checklist, selector de combustible, barra de envío (5.12–5.15). |
| Franja de color de 4 px a la izquierda de las filas con estado. | Selector de perfil "Ver como" (5.2). |
| Filtros por radios con conteo; tabla que pasa a tarjetas por ancho de contenedor. | Diálogos modales de acción (5.17). |
| Un solo primario por zona; confirmación en dos pasos para lo destructivo pequeño. | Historial agrupado por día (5.16). |
| Lo que NO se hace (sección 10). | Marca: el horizonte (una línea con tres marcas y un punto). |

### 1.3 Diferencia con lo rechazado en la web del portafolio

No usa ninguna de las siete direcciones rechazadas ni sus piezas: ni mapa, ni hoja de ruta, ni remitos, ni sellos, ni
papel, ni máquina de escribir, ni animaciones de entrada, ni violeta, ni vidrio, ni gradientes, ni bento, ni fila de
tres cifras gigantes. Tampoco camiones ilustrados ni íconos de vehículos en color.

---

## 2. Rutas y estructura de la aplicación

Aplicación de una sola página con rutas por *hash* (no necesita configurar el servidor).

| Ruta | Pantalla | Perfil |
| --- | --- | --- |
| `#/alertas` (por defecto del encargado) | Centro de alertas | Encargado |
| `#/flota` | Flota | Encargado |
| `#/unidad/ZK214BD` | Ficha de unidad (patente normalizada) | Encargado |
| `#/conductor` (por defecto del conductor) | Inicio del conductor | Conductor |
| `#/parte/ZK214BD/2026-11-18` | Parte diario (edición o lectura) | Ambos |

- Al cambiar de ruta: `document.title` = "{Pantalla} · Control de flota (demo)", el foco va al `h1` (`tabindex="-1"`) y
  la página sube al principio (sin desplazamiento suave).
- Ruta desconocida o patente que no existe: estado de error de la pantalla (sección 8), nunca una pantalla en blanco.
- Cambiar de perfil lleva a la ruta por defecto del perfil elegido.

Orden del DOM (= orden de tabulación): enlace "Ir al contenido" → `header` (barra superior, barra de la aplicación,
avisos globales) → `main#principal` → `footer`. Los diálogos van al final del `body`.

---

## 3. Tokens

Propiedades personalizadas en `:root`, bloque oscuro en `@media (prefers-color-scheme: dark)`. Sin selector de tema
(como la Demo 1: sigue al dispositivo). Prefijos: `--c-` color, `--t-` tipografía, `--e-` espaciado, `--r-` radio,
`--s-` sombra, `--m-` movimiento.

### 3.1 Color heredado (valores de la Demo 1)

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--c-escritorio` | `#E9EAE3` | `#0C0E10` | Fondo de `body`. |
| `--c-fondo` | `#F5F5F1` | `#111417` | Zonas internas apenas hundidas. |
| `--c-superficie` | `#FFFFFF` | `#181C20` | Paneles, tablas, diálogos. |
| `--c-superficie-2` | `#EEEEE8` | `#20252A` | Cabecera de tabla, pista del horizonte, hover de fila. |
| `--c-ventana-barra` | `#F6F6F2` | `#1D2226` | Barras de título y de estado de paneles y diálogos. |
| `--c-ventana-borde` | `#CBCCC3` | `#343B42` | Marco de panel. |
| `--c-ventana-control-hover` | `#E7E8E1` | `#2A3036` | Hover de botones de ícono en barras. |
| `--c-texto` | `#1C1F23` | `#E8EBED` | Texto principal, cifras. |
| `--c-texto-2` | `#4D545B` | `#AEB6BD` | Secundario. |
| `--c-texto-3` | `#62686F` | `#8F98A0` | Ayudas, rótulos (nunca menos de 13 px). |
| `--c-borde` | `#DCDDD5` | `#2D3339` | Separadores. |
| `--c-borde-fuerte` | `#7D8288` | `#6E777F` | Borde de controles (campos, botones secundarios, segmentos). |
| `--c-acento` | `#0B6B70` | `#5BC6C0` | Primario, enlaces, foco, tramo de 8 a 15 días. |
| `--c-acento-hover` | `#085459` | `#7DD5D0` | Hover y activo del primario. |
| `--c-acento-texto` | `#FFFFFF` | `#062221` | Texto sobre acento. |
| `--c-acento-suave` | `#E2F0EF` | `#123231` | Fondo de selección suave, hover de patente-enlace. |
| `--c-foco` | `#0B6B70` | `#5BC6C0` | Anillo de foco. |
| `--c-edicion` | `#E8F3F3` | `#14292A` | Fondo de campo con borrador recién guardado (destello). |

Tonos de estado (texto `-t`, fondo `-f`, franja o marca `-r`), mismos valores que la Demo 1:

| Tono base | Claro t / f / r | Oscuro t / f / r |
| --- | --- | --- |
| `ok` | `#1D6A39` / `#E3F1E7` / `#2F8A50` | `#86D6A1` / `#16301F` / `#45B26E` |
| `pendiente` | `#0A5F64` / `#E2F0EF` / `#0B6B70` | `#7DD5D0` / `#123231` / `#5BC6C0` |
| `revisar` | `#774700` / `#FBEED3` / `#B57A06` | `#F1C46E` / `#33280F` / `#D9A030` |
| `diferencia` | `#9E2620` / `#FAE5E2` / `#C4372E` | `#F59B91` / `#3A1B18` / `#E2665B` |
| `neutro` | `#4D545B` / `#ECEDE7` / `#8E949A` | `#AEB6BD` / `#23282D` / `#7A838B` |

### 3.2 Tonos con nombre de esta demo (alias, sin valores nuevos salvo `--c-mes-r`)

| Tono de la demo | Alias de | Significa | Dónde |
| --- | --- | --- | --- |
| `critico` | `diferencia` | Vencido, faltante, no puede salir, novedad crítica, circuló con documentación vencida. | Etiquetas, franjas, caja de vencidos, insignia de la pestaña Alertas. |
| `semana` | `revisar` | Vence hoy o en 1 a 7 días; fuera de servicio; parte sin enviar; sin parte de ayer; novedad normal. | Ídem; tramo 0–7 del horizonte. |
| `quincena` | `pendiente` (acento) | Vence en 8 a 15 días: hay que planificar. | Tramo 8–15. |
| `mes` | `neutro` (t y f) + **`--c-mes-r` nuevo** | Vence en 16 a 30 días: está en el horizonte. | Tramo 16–30. |
| `vigente` | `ok` | Vigente, puede salir, parte enviado. | Solo en ficha, flota y parte (no hay alertas "verdes"). |

**Token nuevo `--c-mes-r`:** claro `#737980`, oscuro `#7A838B`. El `neutro-r` claro (`#8E949A`) da 2,63:1 sobre la
pista del horizonte (no llega a 3:1 para una marca que lleva información).

Otros tokens nuevos:

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--c-mes-r` | `#737980` | `#7A838B` | Marcas y tramo de 16–30 días. |
| `--c-patente-fondo` | `#FFFFFF` | `#22282D` | Fondo del rótulo de patente. |
| `--c-patente-banda` | `#4D545B` | `#AEB6BD` | Banda superior de 3 px de la patente (decorativa). |
| `--c-hoy` | `#1C1F23` | `#E8EBED` | Línea de "Hoy" en el horizonte (= `--c-texto`). |
| `--c-velo` | `rgb(12 14 16 / .45)` | `rgb(0 0 0 / .6)` | Fondo detrás de los diálogos modales (`::backdrop`). |

### 3.3 Contrastes medidos

Fórmula de luminancia relativa de WCAG 2.x, script reproducible (`contraste.mjs`, en el *scratchpad* de la sesión del
18/11; copiarlo a `scripts/` cuando se arme el proyecto). Los heredados son los medidos en la Demo 1.

| Par | Claro | Oscuro | Mínimo |
| --- | --- | --- | --- |
| texto · texto-2 · texto-3 / superficie | 16,54 · 7,68 · 5,63 | 14,31 · 8,34 · 5,85 | 4,5 |
| texto · texto-2 · texto-3 / escritorio | 13,66 · 6,34 · 4,65 | 16,15 · 9,42 · 6,60 | 4,5 |
| texto · texto-2 · texto-3 / superficie-2 | 14,20 · 6,59 · 4,84 | 12,90 · 7,52 · 5,27 | 4,5 |
| texto-3 / ventana-barra | 5,20 | 5,47 | 4,5 |
| acento (enlace) / superficie · superficie-2 · escritorio | 6,27 · 5,38 · 5,18 | 8,39 · 7,56 · 9,47 | 4,5 |
| acento-texto / acento (botón primario) | 6,27 | 8,17 | 4,5 |
| borde-fuerte / superficie · superficie-2 (controles) | 3,87 · 3,33 | 3,76 · 3,39 | 3 |
| etiqueta t / f: ok · pendiente · revisar · diferencia · neutro | 5,67 · 6,33 · 6,80 · 6,31 · 6,52 | 8,23 · 8,06 · 8,86 · 7,39 · 7,24 | 4,5 |
| tono t / ventana-barra (conteos en barras de título): ok · pend · rev · dif · neu | 6,11 · 6,84 · 7,22 · 7,04 · 7,09 | 9,28 · 9,40 · 9,82 · 7,62 · 7,81 | 4,5 |
| **marca del horizonte / pista (superficie-2):** vigente · quincena · semana · crítico · mes | 3,70 · 5,38 · 3,14 · 4,58 · **3,78** | 5,77 · 7,56 · 6,64 · 4,62 · **4,01** | 3 (no texto) |
| franja -r / superficie: ok · pend · rev · dif | 4,31 · 6,27 · 3,65 · 5,34 | 6,40 · 8,39 · 7,36 · 5,13 | 3 |
| **patente:** texto / patente-fondo · borde-fuerte / patente-fondo | 16,54 · 3,87 | 12,44 · 3,27 | 4,5 · 3 |
| foco (acento) / fondos de tono -f (anillo sobre etiqueta o segmento elegido) | 5,18 a 5,45 | 6,74 a 7,62 | 3 |
| texto / fondos de tono -f (texto de segmento elegido) | 13,68 a 14,39 | 11,49 a 12,99 | 4,5 |

Regla: **el color nunca va solo**. Cada estado lleva texto y un ícono de forma distinta (5.7); cada tramo del horizonte
tiene su rótulo y su conteo en texto.

### 3.4 Tipografía (heredada + dos usos nuevos)

Sin fuentes externas (CSP `font-src 'self'`).

```
--t-familia: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Roboto, Arial, sans-serif;
--t-familia-titulo: "Segoe UI Variable Display", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Roboto, Arial, sans-serif;
--t-mono: ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

| Token | Tamaño | Alto de línea | Peso | Uso |
| --- | --- | --- | --- | --- |
| `--t-cifra` | `clamp(2.5rem, 1.9rem + 2.6vw, 3.5rem)` | 1 | 700 | Cifra protagonista. `letter-spacing: -0.02em`. |
| `--t-h1` | `clamp(1.75rem, 1.35rem + 1.8vw, 2.5rem)` | 1.15 | 700 | Título de pantalla. |
| `--t-h2` | `1.375rem` | 1.25 | 650 (600 sin fuente variable) | Títulos de sección fuera de panel. |
| `--t-h3` | `1.125rem` | 1.3 | 600 | Grupos dentro de un panel ("Vencidos y faltantes (2)"). |
| `--t-cuerpo` | `1rem` | 1.5 | 400 | Texto general. **En el parte, también los campos (16 px evita el zoom automático de iOS).** |
| `--t-tabla` | `0.875rem` | 1.4 | 400 | Celdas. |
| `--t-chico` | `0.8125rem` | 1.4 | 400/600 | Etiquetas, ayudas, segunda línea. |
| `--t-rotulo` | `0.75rem` | 1.3 | 600 | Cabeceras de tabla y rótulos en mayúsculas, `letter-spacing: 0.06em`. Solo ahí. |
| **`--t-patente`** | `0.8125rem` (chica) · `1.25rem` (grande) | 1 | 600 | `--t-mono`, `letter-spacing: 0.06em`, mayúsculas ya normalizadas, `white-space: nowrap`. |
| **`--t-km`** | hereda el tamaño del contexto | — | 600 en cifras protagonistas, 400 en tablas | `font-variant-numeric: tabular-nums lining-nums`; separador de miles con punto (`84.320 km`). |

Cifras (kilómetros, litros, días, conteos, fechas en tablas): siempre `tabular-nums`. Códigos (patente, número de
póliza, legajo): `--t-mono`. Medida de lectura: párrafos con `max-width: 62ch`.

### 3.5 Espaciado, radios, sombras (heredados)

- Espaciado base 4 px: `--e-1: .25rem; --e-2: .5rem; --e-3: .75rem; --e-4: 1rem; --e-5: 1.5rem; --e-6: 2rem; --e-7: 3rem; --e-8: 4rem;`
- Medianil lateral: 16 px (< 640), 24 px (640–1099), 32 px (≥ 1100). Ancho máximo del contenido: `76rem`. Parte diario:
  columna de `40rem` como máximo, centrada.
- Entre paneles: `--e-5` (≥ 640) / `--e-4` (< 640). Relleno interior de panel: `--e-5` / `--e-4` / `--e-3` según ancho.
- Radios: `--r-1: 4px` (etiquetas, patente) · `--r-2: 6px` (botones, campos, segmentos) · `--r-3: 10px` (paneles) ·
  `--r-4: 14px` (diálogos). **Sin píldoras.**
- Sombras: `--s-ventana` (claro `0 1px 2px rgb(16 24 32 / .06), 0 6px 16px -4px rgb(16 24 32 / .10)`; oscuro
  `inset 0 1px 0 rgb(255 255 255 / .03), 0 8px 20px -6px rgb(0 0 0 / .6)`) en paneles; `--s-flotante` (claro
  `0 8px 24px rgb(16 24 32 / .16), 0 2px 6px rgb(16 24 32 / .08)`; oscuro `0 8px 24px rgb(0 0 0 / .5), 0 0 0 1px #2D3339`)
  en diálogos, menú "Más" y barra de envío.
- Alturas fijas nuevas: `--alto-barra-envio: 4.5rem` (barra inferior del parte); `--alto-tactil: 2.75rem` (44 px,
  mínimo de todo lo que se pulsa); `--alto-segmento: 3rem` (48 px, botones del checklist y del combustible).

### 3.6 Movimiento (heredado)

`--m-rapido: 120ms; --m-medio: 200ms; --m-lento: 320ms; --m-curva: cubic-bezier(.2, .7, .2, 1);`

- Hover y foco: `--m-rapido`. Diálogo: aparece con opacidad en `--m-medio` (escritorio); hoja inferior a < 640 px sube
  en `--m-lento`.
- Campo de km o fila recién actualizados: destello de fondo `--c-edicion` → transparente en 1200 ms, una vez.
- Indicador de guardado: sin animación (cambia el texto).
- `@media (prefers-reduced-motion: reduce)`: transiciones y animaciones a `0.01ms`, sin destello, sin subida de la hoja.
- Prohibido: animar cifras (contadores), animaciones al desplazar, parpadeos, rebotes, marcas del horizonte que "caen".

---

## 4. La página (marco común)

### 4.1 Barra superior (`header`, fondo `--c-escritorio`, 56 px, no fija)

| Ancho | Contenido |
| --- | --- |
| ≥ 56rem | Izquierda: ícono `i-marca` (20 px, trazo `--c-acento`) + "Control de flota" (`--t-cuerpo` 600) + etiqueta "Demo con datos ficticios" (`--t-rotulo`, `--c-texto-2`, borde 1 px `--c-borde-fuerte`, `--r-1`). Derecha: botones-texto "Cómo funciona" y "Reiniciar demo", y el enlace "← Volver al portafolio". |
| 40–56rem | Igual, pero "Cómo funciona" y "Reiniciar demo" pasan al menú "Más" (botón de ícono `i-mas`, 44 × 44); el enlace se acorta a "← Portafolio". |
| < 40rem | Marca + "← Portafolio" + "Más". La etiqueta "Demo con datos ficticios" baja al encabezado de cada pantalla (arriba del `h1`). |

La marca no es un enlace (es la misma aplicación). Favicon: `i-marca` como SVG en `data:` (la CSP permite `img-src data:`).

### 4.2 Barra de la aplicación (fondo `--c-superficie`, borde inferior `--c-borde`, 52 px)

- **Navegación** (`nav aria-label="Secciones"`), pestañas-enlace con `aria-current="page"` en la activa:
  - Encargado: "Alertas" + insignia con la cantidad de alertas críticas (rectángulo `--r-1`, `--c-critico-f` / `-t`,
    `--t-chico` 600; texto accesible "Alertas, 4 críticas"; sin insignia si es 0) · "Flota".
  - Conductor: "Parte de hoy" · (nada más: los partes anteriores están en su inicio).
  - Pestaña activa: texto `--c-texto` 600 + línea inferior de 3 px `--c-acento`. Inactiva: `--c-texto-2`; hover
    `--c-texto` y fondo `--c-superficie-2`. Alto 52 px (área táctil completa).
- **Selector de perfil** a la derecha (5.2). A < 40rem pasa a una fila propia, arriba de la navegación, a todo el ancho.

### 4.3 Avisos globales (debajo de la barra de la aplicación, dentro del ancho máximo)

Uno debajo del otro, solo los que aplican (5.18): datos viejos (D5), demo actualizada (D7), modo en memoria (D8),
cambios en otra pestaña (D9) y, si se hace la decisión D4, fecha de consulta simulada.

### 4.4 Pie

Fondo `--c-escritorio`, borde superior `--c-borde`, `--t-chico`, `--c-texto-2`. Dos renglones:
1. "Demo escrita desde cero con datos ficticios de una empresa inventada (Logística Andina Demo S.A.). Los datos se
   guardan solo en este navegador." (el texto final lo pule `redactor-ux`).
2. "Diseño, reglas y verificación: Matías Ariel Ormeño. El código lo escribió una IA bajo su dirección." · enlaces
   "Código fuente" (oculto mientras el repositorio sea privado) · "Volver al portafolio".

**Prohibido** en el pie y en cualquier texto: decir que la demo reproduce el sistema de una empresa, nombrar empleadores
o clientes.

---

## 5. Componentes

Estados comunes: normal, hover (solo dentro de `@media (hover: hover)`), foco visible, activo, deshabilitado y los
propios de cada uno. **Foco visible en todo:** `outline: 2px solid var(--c-foco); outline-offset: 2px;` Nunca
`outline: none` sin reemplazo. En `@media (forced-colors: active)` el foco usa `outline-color: Highlight`.

### 5.1 Botones (heredados de la Demo 1)

| Variante | Normal | Hover | Activo | Deshabilitado | Cargando |
| --- | --- | --- | --- | --- | --- |
| Primario | fondo `--c-acento`, texto `--c-acento-texto`, 600 | `--c-acento-hover` | `translateY(1px)` | no se usa: si no aplica, no se muestra | texto "Guardando…", `aria-disabled="true"` (no `disabled`, para no perder el foco), sin giro |
| Secundario | `--c-superficie`, borde `--c-borde-fuerte`, texto `--c-texto` | `--c-superficie-2` | ídem | texto `--c-texto-3`, borde `--c-borde`, `cursor: not-allowed`, **siempre con explicación visible al lado** | ídem |
| Texto | sin fondo, `--c-acento`, subrayado 1 px, `text-underline-offset: 3px` | subrayado 2 px | — | — | — |
| Peligro | fondo `--c-critico-r`, texto blanco (claro) / `#1A0B0A` (oscuro), 600 | 8 % más oscuro | ídem | — | ídem |
| Ícono | 44 × 44, caja visual 2rem, ícono 18–20 px `--c-texto-2` | fondo `--c-ventana-control-hover`, ícono `--c-texto` | ídem | — | — |

- Tamaños: normal `min-height: 2.75rem`, relleno `0 1rem`; grande (Empezar el parte, Enviar parte) `min-height: 3rem`,
  `0 1.5rem`, `1.0625rem`; en filas de tabla, el mismo alto de 2.75rem.
- **Un solo primario visible por zona.**
- Confirmación en dos pasos (Descartar borrador): primer clic pasa a Peligro con "Confirmar: descartar"; se restablece
  con Esc, al salir del botón o al mover el foco; doble clic en menos de 500 ms se ignora (como la Demo 1).

### 5.2 Selector de perfil ("Ver como")

- `fieldset` con `legend` "Ver como" (visible, `--t-chico` `--c-texto-2`) y dos radios con aspecto de segmentos:
  "Encargado" · "Conductor". Segmento: alto 2.75rem, borde `--c-borde-fuerte`, `--r-2` en los extremos. Elegido: fondo
  `--c-acento-suave`, texto `--c-texto` 600 y línea inferior interior de 3 px `--c-acento` (igual que los filtros de
  5.8: una sola forma de decir "elegido"). No elegido: `--c-superficie`, `--c-texto-2`. Navegación con flechas
  (radios nativos).
- Al elegir "Conductor" sin persona elegida: se abre el diálogo "¿Quién completa el parte?" con la lista de conductores
  activos ficticios (radios, cada uno con su unidad asignada) y "Continuar". Con persona elegida, debajo del selector
  aparece "Conductor: Lucía Ferreyra (ficticia) · Cambiar" (botón-texto).
- Texto de ayuda (en "Cómo funciona" y como `title`-equivalente visible en el diálogo): "Es solo un punto de vista de la
  demo: no hay usuarios ni contraseñas."

### 5.3 Menú "Más"

Patrón *disclosure* (no `role="menu"`): botón `i-mas` con `aria-expanded` y `aria-controls`; lista de botones-texto en
una caja `--c-superficie`, `--s-flotante`, `--r-2`, ancho 15rem, alineada a la derecha. Esc cierra y devuelve el foco
al botón; clic afuera cierra. Ítems de 44 px de alto.

### 5.4 Panel (anatomía de "ventana" de la Demo 1, sin plegar)

```
 ┌─────────────────────────────────────────────────────────────────────┐ ← 1px --c-ventana-borde, --r-3, --s-ventana
 │ [ícono] Título del panel │ dato breve                    [control] │ ← barra de título: min 44px, --c-ventana-barra
 ├─────────────────────────────────────────────────────────────────────┤
 │ (herramientas opcionales: filtros, búsqueda, orden)                 │ ← --c-superficie, min 3.5rem
 ├─────────────────────────────────────────────────────────────────────┤
 │ interior                                                            │ ← --c-superficie; relleno según ancho
 ├─────────────────────────────────────────────────────────────────────┤
 │ barra de estado (role="status"): "Seguro renovado: vence 15/11/2027."│ ← min 2.5rem; mide 0 si está vacía
 └─────────────────────────────────────────────────────────────────────┘
```

- `<section class="panel" aria-labelledby="{id del h2}">`. Título = `h2`, `1rem/1.3`, 600, `--t-familia-titulo`.
- Dato (`.panel-meta`): `--t-chico`, `--c-texto-2`, cifras tabulares, separado del título por un divisor vertical de
  1 px × 1 rem. A < 24rem de contenedor baja a un renglón propio.
- Barra de estado: siempre en el DOM (las regiones `role="status"` tienen que existir antes del texto). Vacía:
  `min-height: 0; padding-block: 0; border-top-color: transparent;` (como Demo 1, 13.2.5). Los mensajes **no
  desaparecen solos**: se reemplazan con la siguiente acción.
- Estado activo (`:focus-within`): borde `--c-borde-fuerte` y línea superior interior de 2 px `--c-acento` en la
  barra de título. Sin hover. El marco nunca cambia de color por el estado de los datos.
- Sin `overflow: hidden` (cortaría anillos de foco).

### 5.5 Patente

```
 ▔▔▔▔▔▔▔▔▔▔▔   ← banda 3px --c-patente-banda
 ZK 214 BD     ← --t-patente, --c-texto sobre --c-patente-fondo
 ▁▁▁▁▁▁▁▁▁▁▁   ← borde 1px --c-borde-fuerte, --r-1
```

| Variante | Medidas |
| --- | --- |
| Chica (tablas, listas) | alto 1.5rem, relleno `0 .375rem`, `0.8125rem`. |
| Grande (encabezado de la ficha, parte) | alto 2.25rem, relleno `0 .625rem`, `1.25rem`. Es el contenido del `h1` de la ficha. |

- No es interactiva por sí sola. Dentro de un enlace (`a.enlace-patente`): hover → borde `--c-acento` y fondo
  `--c-acento-suave` (el texto sigue `--c-texto`: 14,13:1 / 11,49:1); foco → anillo estándar alrededor del rótulo. El
  enlace lleva texto oculto para lectores: "Ficha de " + patente.
- El texto que se lee es la patente con espacios (`ZK 214 BD`); para lectores se agrega `aria-label` solo si hiciera
  falta deletrear (no hace falta: los lectores leen letras y números sueltos).
- Unidad de baja: el rótulo no cambia (sin tachado ni transparencia, que bajarían el contraste); la fila lleva la
  etiqueta "De baja".
- `forced-colors`: borde `CanvasText`, banda con `border-top: 3px solid CanvasText`.

### 5.6 Horizonte de vencimientos (pieza firma)

Visualiza los vencimientos de los próximos 30 días y lo vencido. **Es un resumen gráfico**: la información completa está
en la lista y en los conteos de los filtros.

```
 Variante completa (centro de alertas, ancho del panel):

 ┌ VENCIDOS Y ┐   Hoy            7                15                                30 días
 │ FALTANTES  │   ┃●  ●     ●    ┊    ●           ┊                ●                 ┊
 │     2      │   ┃●                                                                  
 └────────────┘   ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
   caja crítico    pista --c-superficie-2 (alto 3rem) + tramo inferior 4px: semana │ quincena │ mes
```

- **Grilla:** la pista es `display: grid; grid-template-columns: repeat(31, minmax(0, 1fr));` (días 0 a 30). Cada
  marca va en `grid-column: {dia + 1}` usando **la directiva `style:grid-column-start` de Svelte** (asigna por CSSOM y
  no viola la CSP; prohibido el atributo `style` en el marcado). Dentro de cada columna, las marcas se apilan de abajo
  hacia arriba (`display: flex; flex-direction: column-reverse; gap: 2px`).
- **Marca:** círculo de 8 px (`.5rem`) relleno con el `-r` de su tramo (`semana`, `quincena`, `--c-mes-r`), con un aro
  de 2 px `--c-superficie-2` para separar marcas vecinas. Máximo 4 apiladas por día; si hay más, la cuarta es un aro
  hueco de 2 px del mismo color (significa "y más"; el número exacto está en la lista).
- **Tramos:** borde inferior de la pista de 4 px dividido en tres: días 0–7 `--c-semana-r`, 8–15 `--c-quincena-r`,
  16–30 `--c-mes-r`. En `forced-colors`, los tramos se distinguen por estilo de borde: sólido, discontinuo, punteado.
- **Hoy:** línea vertical de 2 px `--c-hoy` en el borde izquierdo de la columna 0, alta como la pista.
- **Marcas de escala:** rótulos "Hoy", "7", "15", "30 días" (`--t-chico`, `--c-texto-3`) alineados al comienzo de
  las columnas 0, 7, 15 y 30, con una línea punteada vertical de 1 px `--c-borde-fuerte` en 7, 15 y 30. A < 24rem de
  ancho de la pista, el rótulo "30 días" pasa a "30".
- **Caja de vencidos y faltantes:** a la izquierda (≥ 30rem de contenedor) o arriba (< 30rem), ancho 7.5rem, fondo
  `--c-critico-f`, borde izquierdo 4 px `--c-critico-r`, texto `--c-critico-t`: rótulo "Vencidos y faltantes"
  (`--t-rotulo`) y cifra (`--t-h2` 700). Con 0: fondo `--c-superficie-2`, texto `--c-texto-2`, cifra "0".
- **Accesibilidad:** el contenedor es `role="img"` con `aria-label` que arma el programador:
  "Vencimientos de los próximos 30 días: 4 en 7 días o menos, 3 entre 8 y 15 días, 2 entre 16 y 30 días. 2 documentos
  vencidos o faltantes." Las marcas no son interactivas (serían blancos de 8 px). Los filtros de abajo son los controles.
- **Vacío:** pista sin marcas y, centrado sobre ella, "Nada vence en los próximos 30 días" (`--t-chico`, `--c-texto-2`).

| Variante | Dónde | Alto de pista | Rótulos | Caja de vencidos |
| --- | --- | --- | --- | --- |
| Completa | Centro de alertas | 3rem | Sí | Sí, 7.5rem |
| Mediana | Ficha de unidad (solo los documentos de esa unidad, no los del conductor) | 2rem | Solo "Hoy" y "30" | Sí, compacta (rótulo "Vencidos" + cifra en una línea) |
| Mínima | Columna "Próximo vencimiento" de la flota | 0.75rem, ancho 4rem | No | No (lo vencido se dice con la etiqueta) |

La mínima es `aria-hidden="true"`: el texto de la celda lo dice todo ("Revisión técnica · en 6 días").

### 5.7 Etiqueta de estado

Heredada: rectángulo `--r-1`, alto 1.5rem, relleno `0 .5rem`, `--t-chico` 600, ícono 14 px a la izquierda,
`gap: .375rem`, colores `-t` sobre `-f` del tono, atributo `data-tono`.

| Situación | Texto | Tono | Ícono (forma) |
| --- | --- | --- | --- |
| Documento vencido | "Vencido hace N días" / "hace 1 día" | critico | `i-vencido` (círculo con ✕) |
| Documento faltante | "Falta cargar" | critico | `i-faltante` (hoja con borde punteado) |
| Vence hoy | "Vence hoy" | semana | `i-reloj` |
| 1 a 7 días | "Vence mañana" / "Vence en N días" | semana | `i-alerta` (triángulo con !) |
| 8 a 15 días | "Vence en N días" | quincena | `i-calendario` |
| 16 a 30 días | "Vence en N días" | mes | `i-anillo` (círculo vacío) |
| Vigente | "Vigente hasta 12/05/2027" | vigente | `i-check` |
| Documento reemplazado | "Reemplazado el 17/11/2026" | neutro | `i-guion` |
| Puede salir | "Puede salir" | vigente | `i-check` |
| No puede salir | "No puede salir" (+ motivo al lado, en texto) | critico | `i-vencido` |
| Fuera de servicio | "Fuera de servicio" (+ motivo) | semana | `i-llave` |
| De baja | "De baja" | neutro | `i-caja` |
| Novedad crítica | "Crítica" | critico | `i-octogono` |
| Novedad normal | "Abierta" | semana | `i-llave` |
| Novedad resuelta | "Resuelta el 16/11/2026" | neutro | `i-check` |
| Parte enviado | "Enviado" | vigente | `i-check` |
| Parte borrador (de hoy) | "Borrador" | neutro | `i-lapiz` |
| Parte sin enviar (fecha pasada) | "Sin enviar" | semana | `i-lapiz` |
| Sin parte | "Sin parte" | semana | `i-guion` |
| Circuló con documentación vencida | "Con documentación vencida" | critico | `i-vencido` |
| Punto crítico (checklist) | "Punto crítico" | neutro | `i-octogono` |

### 5.8 Filtros por radios con conteo (heredados)

`fieldset` con `legend` "Mostrar"; radios nativos con aspecto de segmentos (alto 2.75rem, borde `--c-borde-fuerte`,
`--r-2`), cada uno con su `span.conteo` (`--t-chico`, cifras tabulares). Elegido: texto `--c-texto` 600, línea inferior
interior 3 px del `-r` del tono del grupo (crítico, semana, quincena, mes; "Todos" en acento). Sin opción con 0: se
muestra igual con "0" (el filtro dice que no hay, eso también informa). Flechas para moverse (radios nativos).
A < 40rem: grilla de 2 columnas que se acomoda (sin desplazamiento horizontal oculto).

Al cambiar: una región `role="status"` dice "Mostrando 4 de 11 vencimientos."

### 5.9 Lista-tabla de alertas

Una sola estructura (`table`) con tres disposiciones por **consulta de contenedor** (`container: lista / inline-size`):

| Contenedor | Disposición |
| --- | --- |
| ≥ 66rem | Tabla completa: Estado · Documento · Titular · Proyecto · Vence · Acción. |
| 40–65.99rem | Compacta: (Estado + Documento) · (Titular + Proyecto) · (Vence + Acción), dos líneas por celda. |
| < 40rem | Tarjetas: la tabla pasa a `display: block` con roles explícitos (`role="table"`, `row`, `cell`, `rowheader`) como en la Demo 1; cada fila es una tarjeta con `data-etiqueta` por celda. |

- Fila: alto mínimo 3.5rem; franja izquierda 4 px del tono de la alerta; hover `--c-superficie-2`. La fila no es un
  enlace entero (tiene un botón adentro): el enlace es la patente.
- **Documento:** línea 1 nombre del documento (`--t-tabla` 600); línea 2 número en `--t-mono` `--c-texto-2`.
- **Titular:** patente-enlace + "Int. 07" + modelo en `--c-texto-2`; si es de un conductor: nombre (enlace a la ficha
  de su unidad asignada, si tiene) + "Licencia" en la línea 2.
- **Vence:** `dd/mm/aaaa` tabular; para faltantes, "—".
- **Acción:** botón secundario chico "Renovar" (o "Cargar" en faltantes) que abre el diálogo (5.17). El nombre
  accesible incluye el objeto: "Renovar seguro de ZK 214 BD" (texto oculto).
- Encabezados de grupo (`tbody` por grupo con una fila de encabezado `th scope="rowgroup" colspan`): "Vencidos y
  faltantes (2)", "Vencen en 7 días o menos (4)", "Vencen entre 8 y 15 días (2)", "Vencen entre 16 y 30 días (3)".
  Grupos vacíos no se muestran (salvo con su filtro elegido: "No hay documentos en este grupo.").

### 5.10 Tabla de la flota

Misma técnica de tres disposiciones. Columnas a ≥ 66rem: Unidad · Estado hoy · Próximo vencimiento · Kilometraje ·
Último parte · Novedades · Proyecto y conductor.

- **Unidad:** patente-enlace + "Int. 07"; línea 2 "Toyota Hilux 2022 · Camioneta".
- **Estado hoy:** etiqueta (Puede salir / No puede salir / Fuera de servicio / De baja) + motivo principal en línea 2
  ("Seguro vencido hace 1 día"; si hay más, "y 1 motivo más").
- **Próximo vencimiento:** horizonte mínimo + "Revisión técnica · en 6 días"; si es > 30 días, "Seguro · 12/05/2027"
  en `--c-texto-2` sin horizonte; si hay vencido o faltante, la etiqueta crítica y el nombre.
- **Kilometraje:** "84.320 km", alineado a la derecha, tabular. Sin registros: "Sin registros".
- **Último parte:** "17/11/2026" + etiqueta chica si corresponde ("Sin enviar", "Sin parte" de ayer).
- **Novedades:** cifra de abiertas; si hay crítica, ícono `i-octogono` `--c-critico-t` y texto "1 (crítica)".
- Franja izquierda **solo** en filas que no pueden salir (crítico), fuera de servicio (semana) o de baja (neutro). Las
  que pueden salir no llevan franja: un muro verde no informa nada.
- **Orden:** un `select` "Ordenar por" (Prioridad, Patente, Interno, Próximo vencimiento, Último parte) en la barra de
  herramientas, válido para las tres disposiciones (en vez de cabeceras con flechas, que en tarjetas no existen).
  Prioridad = no puede salir, fuera de servicio, después próximo vencimiento ascendente, después patente.

### 5.11 Campos de formulario

| Estado | Aspecto |
| --- | --- |
| Normal | Alto 2.75rem (3rem en el parte), fondo `--c-superficie`, borde 1 px `--c-borde-fuerte`, `--r-2`, texto `--t-cuerpo`. Etiqueta arriba (`--t-chico` 600 `--c-texto`), ayuda debajo de la etiqueta (`--t-chico` `--c-texto-2`) asociada con `aria-describedby`. |
| Hover | Borde `--c-texto-2`. |
| Foco | Anillo estándar (2 px `--c-foco`, `offset 2px`). |
| Con dato precargado | Igual que normal (no se marca: es un valor más). La ayuda dice de dónde sale ("Último registro: 84.320 km, parte del 17/11/2026"). |
| Inválido | `aria-invalid="true"`, borde 2 px `--c-critico-r`, mensaje arriba del campo (entre etiqueta y campo, patrón GOV.UK) con `i-vencido` y texto `--c-critico-t` 600, `id` primero en `aria-describedby`. El texto escrito **se conserva**. |
| Solo lectura | Sin caja: el valor como texto `--c-texto` con su etiqueta (parte enviado, datos de la unidad). No se usan campos `disabled` para mostrar datos. |
| Deshabilitado | No se usa. Si un campo no aplica, no se muestra. |

Específicos:
- **Kilometraje:** `input type="text" inputmode="numeric" autocomplete="off"`, ancho 10ch + sufijo "km" fuera del campo.
  Al salir del campo se reformatea con punto de miles (`84320` → `84.320`). No se usa `type="number"` (las flechas y la
  rueda del mouse cambian el valor sin querer; no acepta el punto de miles).
- **Litros:** `inputmode="decimal"`, sufijo "litros".
- **Fechas:** `input type="date"` nativo (en el celular abre el selector del sistema); la ayuda dice el formato
  esperado si el navegador muestra texto ("día/mes/año").
- **Texto largo:** `textarea` de 3 renglones, crece hasta 8; contador "120 de 500" visible solo desde 400 caracteres.

### 5.12 Ítem de checklist (parte)

```
 ┌───────────────────────────────────────────────┐
 │ Frenos                        [⬣ Punto crítico]│  ← legend (--t-cuerpo 600) + etiqueta neutra
 │ ┌───────────────────┐┌──────────────────────┐ │
 │ │ ✓ En orden        ││ ! Con novedad        │ │  ← dos radios como segmentos, alto 3rem, 50 % / 50 %
 │ └───────────────────┘└──────────────────────┘ │
 │ (si "Con novedad")                             │
 │ ¿Qué encontró? *                               │
 │ [ textarea                                   ] │
 │ ⬣ Al enviar, la unidad queda fuera de servicio │  ← nota en tono crítico (solo puntos críticos)
 │   hasta que el encargado la revise.            │
 │ (no crítico) [ ] Impide usar la unidad         │  ← checkbox 24 px con área de 44 px
 └───────────────────────────────────────────────┘
```

- Cada ítem es un `fieldset` con `legend`. Separados por un divisor de 1 px `--c-borde`, relleno vertical `--e-4`.
- Segmento no elegido: `--c-superficie`, borde `--c-borde-fuerte`, texto `--c-texto`, ícono `--c-texto-2`.
- "En orden" elegido: fondo `--c-vigente-f`, borde 2 px `--c-vigente-r`, texto `--c-texto` 600, ícono `i-check`
  `--c-vigente-t`.
- "Con novedad" elegido: fondo `--c-semana-f` y borde `--c-semana-r` (ítem no crítico) o `--c-critico-f` / `-r`
  (ítem crítico); ícono `i-alerta` del `-t`.
- Sin responder después de intentar enviar: borde izquierdo del ítem 4 px `--c-critico-r` y mensaje "Elija una opción
  para Frenos." arriba de los segmentos.
- El campo "¿Qué encontró?" aparece con el radio (sin animación de alto); recibe el foco **solo** si la persona eligió
  con teclado y presiona Tab (no se mueve el foco solo).
- **No hay** botón "Marcar todo en orden" (ver sección 10).
- Encabezado de la sección: "2. Revisión de la unidad" + "Respondidos: 3 de 10" (`--t-chico`, se actualiza; no es
  región viva: lo anuncia la barra de envío al intentar enviar).

### 5.13 Selector de combustible

`fieldset` "Nivel de combustible al terminar" con 5 radios como segmentos contiguos: "Reserva", "1/4", "1/2", "3/4",
"Lleno". Alto 3rem; a < 22rem de contenedor el texto de "Reserva" baja a `--t-chico`. Los segmentos **hasta el elegido**
llevan una barra inferior de 6 px `--c-acento` (se lee como un medidor); el elegido además fondo `--c-acento-suave`,
texto 600 e ícono `i-check`. El valor se lee por el radio, no por la barra.

### 5.14 Barra de envío (parte)

- A < 40rem: `position: sticky; bottom: 0;` fondo `--c-ventana-barra`, borde superior `--c-borde`, `--s-flotante`,
  alto `--alto-barra-envio`, relleno `--e-3` + `env(safe-area-inset-bottom)`. A ≥ 40rem: estática al final del
  formulario, sin sombra.
- Izquierda: estado del formulario (`--t-chico` 600): "Faltan 5 datos" (`--c-texto-2`) o "Listo para enviar"
  (`--c-vigente-t` + `i-check`). Derecha: primario grande "Enviar parte".
- **"Enviar parte" nunca se deshabilita**: si falta algo, al pulsarlo aparece el resumen de errores (5.15).
- Para que la barra no tape el campo con foco (WCAG 2.4.11): mientras el formulario está en pantalla,
  `html { scroll-padding-bottom: calc(var(--alto-barra-envio) + 1rem); }`.
- Debajo del formulario (no en la barra): botón-texto "Descartar borrador" con confirmación en dos pasos.

### 5.15 Resumen de errores e indicador de guardado

- **Resumen de errores** (patrón GOV.UK): panel arriba del formulario, borde izquierdo 4 px `--c-critico-r`, fondo
  `--c-superficie`, `role="alert"` **no**: es un `div` con `tabindex="-1"` que recibe el foco al aparecer, con título
  `h2` "Faltan 3 datos para enviar el parte" y una lista de enlaces a cada campo ("Kilometraje al terminar", "Luces y
  balizas: elija una opción", "Nivel de combustible"), en el orden del formulario (P4). Los errores de reglas (K2–K4,
  P2, P8) también van acá, con el texto de la regla.
- **Indicador de guardado** (debajo del encabezado del parte): `i-guardado` + "Guardado en este equipo a las 14:32"
  (`--t-chico`, `--c-texto-2`). Mientras escribe: "Guardando…". Error: "No se pudo guardar en este equipo. Lo escrito
  sigue en pantalla; no cierre la pestaña." (`--c-critico-t`). Es `role="status"`, pero **solo cambia su texto cuando
  cambia de estado** (primera vez guardado, error, recuperado), no en cada guardado: no se le dicta al lector cada 500 ms.

### 5.16 Historial (ficha)

- Filtros (5.8): "Todo", "Partes", "Documentos", "Novedades", "Estado y kilometraje".
- Lista agrupada por día: `h3` "Martes 17/11/2026" (`--t-chico` 600 mayúscula inicial, `--c-texto-2`, divisor arriba).
- Evento: grilla `4rem | 1.25rem | 1fr`: hora (`--t-mono`, `--c-texto-3`, "18:42") · ícono del tipo (18 px) · resumen
  (`--t-tabla`) + autor en línea 2 (`--t-chico`, `--c-texto-3`, "Lucía Ferreyra (ficticia)").
- Parte enviado: el evento es un `details`; `summary` "Parte enviado · 132 km (84.320 → 84.452) · combustible 3/4 ·
  1 novedad"; al abrir: kilometraje, combustible, litros, los puntos con novedad (texto completo), "8 puntos en orden",
  advertencias aceptadas, y el enlace "Ver el parte completo".
- Documento corregido: "Antes / Después" en dos columnas por campo cambiado.
- Primeros 30 eventos; botón "Ver 30 más": al pulsarlo, el foco va al primer evento nuevo.
- Iconos por tipo: `i-parte`, `i-documento`, `i-novedad` (llave), `i-estado` (interruptor), `i-km` (odómetro),
  `i-unidad` (alta y asignación), `i-caja` (baja).

### 5.17 Diálogos modales

- `<dialog>` con `showModal()` (el resto queda inerte de forma nativa), `aria-labelledby` al título.
- ≥ 40rem: centrado, ancho `min(34rem, 100% - 2rem)`, `max-height: 85vh`, `--r-4`, `--s-flotante`; barra de título
  como el panel (título + botón cerrar `i-cerrar` 44 × 44); interior con desplazamiento propio; pie con los botones
  **alineados a la izquierda, primario primero** y después "Cancelar" (botón-texto).
- < 40rem: hoja a pantalla completa (`width: 100%; height: 100dvh; max-height: none; border-radius: 0`), pie fijo
  abajo con el primario a todo el ancho y "Cancelar" debajo.
- `::backdrop`: `--c-velo`.
- Foco al abrir: el primer campo; en confirmaciones destructivas, el botón "Cancelar". Al cerrar: vuelve al botón que
  lo abrió; **si ese botón ya no existe** (la alerta se resolvió y la fila desapareció), va al `h2` del panel
  (`tabindex="-1"`) y la barra de estado dice qué pasó ("Seguro de ZK 214 BD renovado. Quedan 10 vencimientos.").
- Esc = Cancelar. Si hay cambios sin guardar: el pie muestra "Tiene cambios sin guardar." con "Descartar cambios"
  (peligro) y "Seguir editando"; el foco va a "Seguir editando".
- Errores de validación: en el campo (5.11) y, si hay más de uno, un resumen arriba (5.15). El diálogo no se cierra.

Inventario de diálogos (los textos finales los pule `redactor-ux`):

| Diálogo | Contenido | Primario |
| --- | --- | --- |
| Renovar documento | Título "Renovar: Seguro de ZK 214 BD". Línea de contexto: "Vigente: póliza DEMO-88-4471, venció el 17/11/2026 (hace 1 día)." Campos: Número*, Emisor (precargado con el anterior), Vence*, Emitido. Errores V10, V11. | "Guardar renovación" |
| Cargar documento | Igual sin contexto; si viene de "Cargar otro documento", primero un `select` Tipo. | "Guardar documento" |
| Corregir documento | Campos precargados + nota "Use esto para corregir un error de carga. Si el documento se renovó, use Renovar." | "Guardar corrección" |
| Resolver novedad | Texto de la novedad, origen y fecha; campo "¿Qué se hizo?"* (5–500); si aplica N2, casilla marcada "Volver a servicio ahora" con nota. | "Marcar como resuelta" |
| Cargar novedad | Descripción*, casilla "Impide usar la unidad" (con nota de A3). | "Guardar novedad" |
| Poner fuera de servicio | Motivo* (5–200), ejemplo en la ayuda. Desde: hoy (texto, no campo). | "Poner fuera de servicio" |
| Volver a servicio | Si hay novedades críticas abiertas: no hay primario; texto con la lista (A4) y botón "Ver novedades". Si hay documentos vencidos: aviso "La unidad vuelve a servicio, pero no puede salir hasta renovar: Seguro." | "Volver a servicio" |
| Corregir kilometraje | Desde (fecha ≤ hoy)*, Nuevo kilometraje*, Motivo* (10–200). Nota: cuándo usarlo (cambio de tablero, error en un parte enviado). | "Guardar corrección" |
| Cambiar proyecto o conductor | `select` Proyecto, `select` Conductor (con "Sin conductor asignado"). Aviso si el nuevo proyecto exige una habilitación que la unidad no tiene. | "Guardar cambios" |
| Dar de baja | Motivo*, aviso "No se puede deshacer en esta demo. La unidad deja de contar en la flota y en las alertas; su historial se conserva." | Peligro "Dar de baja ZK 214 BD" |
| Agregar unidad | Patente*, Interno*, Tipo*, Marca*, Modelo*, Año*, Proyecto*, Conductor. Al guardar: va a la ficha con el mensaje "Unidad agregada. Le faltan 4 documentos: cárguelos desde aquí." | "Agregar unidad" |
| Antes de enviar (parte) | Lista de advertencias (K6, K7, P9) con su explicación, en tono semana o crítico. | "Enviar igual" (+ "Volver al parte") |
| ¿Quién completa el parte? | Radios con conductores ficticios y su unidad asignada. | "Continuar" |
| Reiniciar demo | "Se borran los cambios hechos en este navegador y se vuelve a cargar la flota de ejemplo con las fechas de hoy." | Peligro "Reiniciar demo" |
| Cómo funciona | Qué es (2 renglones); las reglas de vencimiento con un horizonte mediano de ejemplo; qué hace el parte y qué pasa con una novedad crítica; dónde se guardan los datos; datos ficticios; "Ver como" es solo un punto de vista. | "Entendido" |

### 5.18 Avisos globales

Franja a lo ancho del contenido, `--r-2`, borde izquierdo 4 px del tono, fondo `-f`, texto `-t` (o `--c-texto` si es
largo), ícono 18 px, relleno `--e-3 --e-4`, con su acción a la derecha (o debajo a < 40rem).

| Aviso | Tono | Acción | Se cierra |
| --- | --- | --- | --- |
| Datos de ejemplo de otra fecha (D5) | semana | "Reiniciar demo" | Con "Cerrar aviso" (vuelve en la próxima visita) |
| Demo actualizada (D7) | neutro | — | "Cerrar aviso" |
| Modo en memoria (D8) | semana | — | No (es un hecho mientras dure) |
| Cambios en otra pestaña (D9) | pendiente | "Actualizar" | Al actualizar |
| Fecha de consulta simulada (D4, si se hace) | semana | "Volver a hoy" | Al volver a hoy |

Los avisos son `role="status"` (no `alert`), salvo el de modo en memoria al arrancar, que se anuncia una vez.

### 5.19 Estados vacío y cargando (piezas)

- **Vacío:** dentro del panel, ícono 24 px `--c-texto-3` + frase (`--t-cuerpo`, `--c-texto-2`) + acción si la hay.
  Sin ilustraciones.
- **Cargando el arranque:** nada durante 300 ms; después, en `main`, "Preparando la flota de ejemplo…" + `<progress>`
  sin valor (indeterminado, estilo nativo con `accent-color: var(--c-acento)`). Sin esqueletos con brillo.
- **Guardando:** botón en estado cargando (5.1). IndexedDB tarda milisegundos: el estado aparece solo si pasa 200 ms.

### 5.20 Íconos

Sprite SVG en el `index.html` (`<svg hidden><symbol id="i-…">`), 24 × 24, trazo 1.75, `currentColor`, dibujados a mano
(sin copiar sets con licencia). `aria-hidden="true"` y `focusable="false"` en cada uso. Lista: `i-marca`, `i-vencido`,
`i-faltante`, `i-reloj`, `i-alerta`, `i-calendario`, `i-anillo`, `i-check`, `i-guion`, `i-llave`, `i-caja`,
`i-octogono`, `i-lapiz`, `i-parte`, `i-documento`, `i-novedad`, `i-estado`, `i-km`, `i-combustible`, `i-unidad`,
`i-persona`, `i-guardado`, `i-buscar`, `i-mas`, `i-cerrar`, `i-chevron`, `i-flecha-izq`, `i-flecha-der`, `i-ayuda`,
`i-reiniciar`. `i-marca`: línea horizontal con tres marcas verticales cortas y un punto relleno sobre la primera.

---

## 6. Pantallas

Cortes (heredados): `< 40rem` una columna; `40rem – 68.74rem` intermedio; `≥ 68.75rem` escritorio. Las tablas cambian
por **consulta de contenedor**, no por el ancho de la ventana.

### 6.1 Centro de alertas (`#/alertas`)

Jerarquía: 1) protagonista "No pueden salir hoy"; 2) operación diaria; 3) horizonte y vencimientos; 4) detalle de
operación.

**Escritorio, 1280 px**

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ⊢ Control de flota  [DEMO CON DATOS FICTICIOS]        Cómo funciona   Reiniciar demo   ← Volver al portafolio │ 56
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Alertas ▮4] [Flota]                                         Ver como  [Encargado|Conductor]  │ 52
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Centro de alertas (h1)                                                                       │
│ Hoy es miércoles 18/11/2026 (hora de Argentina) · Logística Andina Demo S.A. · 23 unidades    │
│ ┌ ⊘ No pueden salir hoy │ al 18/11/2026 ─────────┐ ┌ ☰ Operación diaria │ 6 pendientes ──────┐ │
│ │▌ 4  unidades                                    │ │ ⬣ 1  novedad crítica abierta     Ver ↓│ │
│ │▌                                                │ │ ✕ 1  circuló con documentación    Ver ↓│ │
│ │▌ [ZK 214 BD] Int. 07  Seguro vencido hace 1 día›│ │      vencida                          │ │
│ │▌ [ZP 088 KC] Int. 12  Falta habilitación      › │ │ ✎ 1  parte sin enviar            Ver ↓│ │
│ │▌ [ZM 772 AF] Int. 03  Fuera de servicio: frenos›│ │ – 2  unidades sin parte de ayer  Ver ↓│ │
│ │▌ [ZT 340 HN] Int. 19  En taller: embrague     › │ │ ⚒ 1  novedad abierta hace 9 días Ver ↓│ │
│ ├─────────────────────────────────────────────────┤ ├────────────────────────────────────────┤ │
│ │ Disponibles hoy: 19 de 23 unidades activas.     │ │ Así lo carga el conductor:             │ │
│ └──────────────── columnas 1–7 ───────────────────┘ │ Abrir el parte diario →  (cols 8–12)   │ │
│                                                      └────────────────────────────────────────┘ │
│ ┌ ◷ Vencimientos │ próximos 30 días · 11 ───────────────────────────────────────────────────┐ │
│ │ ┌VENCIDOS Y┐  Hoy         7               15                              30 días        │ │
│ │ │FALTANTES │  ┃● ●   ●  ● ┊  ●            ┊ ●            ●        ●      ┊              │ │
│ │ │    2     │  ▔▔▔▔▔▔▔▔▔▔▔▔╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄                 │ │
│ │ └──────────┘                                                                             │ │
│ │ Mostrar: [Todos 11] [Vencidos y faltantes 2] [7 días o menos 4] [8 a 15 días 3] [16 a 30 días 2] │
│ │ ── Vencidos y faltantes (2) ─────────────────────────────────────────────────────────────│ │
│ │ ESTADO               DOCUMENTO                 TITULAR                  PROYECTO    VENCE   │ │
│ │▌⊗ Falta cargar       Habilitación de ingreso   [ZP 088 KC] Int. 12      P. Piedra   —   [Cargar]│
│ │▌⊗ Vencido hace 1 día Seguro · DEMO-88-4471     [ZK 214 BD] Int. 07      P. Arroyo 17/11/2026 [Renovar]│
│ │ ── Vencen en 7 días o menos (4) ──                                                         │ │
│ │▌◷ Vence hoy          Revisión técnica · …      [ZM 501 AT] Int. 05      …        18/11/2026 [Renovar]│
│ │ …                                                                                         │ │
│ ├──────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ (barra de estado: mensajes de la última acción)                                           │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ ☰ Operación diaria: detalle ────────────────────────────────────────────────────────────┐ │
│ │ ── Novedades críticas (1) ──                                                              │ │
│ │▌⬣ Crítica  Frenos: ruido al frenar en bajada   [ZM 772 AF]  parte del 16/11/2026 [Resolver]│
│ │ ── Circuló con documentación vencida (1) ── …                                             │ │
│ │ ── Partes sin enviar (1) ── … [Abrir parte]                                               │ │
│ │ ── Sin parte de ayer (2) ── … [Ver ficha]                                                 │ │
│ │ ── Novedades abiertas (1) ── … [Resolver]                                                 │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────┘ │
│ pie                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Protagonista** (panel, columnas 1–7): franja izquierda 4 px del tono (crítico si N > 0; vigente si 0). Cifra
  `--t-cifra` + "unidades" (`--t-h2`) en la misma línea base; para lectores, un solo `p`: "4 unidades no pueden salir
  hoy." Lista de hasta 6 unidades (patente-enlace, interno, primer motivo; `›` es solo visual), ordenada por prioridad;
  si hay más: "Ver las 9 en la flota" (enlace a `#/flota` con el filtro "No pueden salir" + "Fuera de servicio").
  Barra de estado fija: "Disponibles hoy: 19 de 23 unidades activas."
  **Con 0:** franja vigente, `i-check` 24 px, "Todas las unidades activas pueden salir hoy." y "Disponibles hoy: 23 de 23."
- **Operación diaria** (panel, columnas 8–12): una fila por tipo con cifra (tabular, 600) y texto; "Ver" lleva al
  grupo del detalle (desplazamiento suave salvo movimiento reducido; foco al `h3` del grupo). Tipos con 0 no aparecen.
  Con todo en 0: "Sin pendientes de operación." (vigente). Barra de estado: "Así lo carga el conductor: Abrir el parte
  diario →" (botón-texto que cambia el perfil a Conductor; el texto lo dice: "(cambia la vista a Conductor)").
- **Vencimientos** (panel, 12 columnas): horizonte completo, filtros, lista-tabla (5.9). Al renovar desde una fila, la
  fila sale de la lista si deja de alertar (V6) y el foco sigue 5.17.
- **Detalle de operación** (panel, 12 columnas): misma lista-tabla con columnas Estado · Qué pasó · Unidad · Fecha ·
  Acción. Acciones: "Resolver" (novedades), "Abrir parte" (sin enviar), "Ver ficha" (sin parte, documentación vencida).

**Tableta, 768 px:** protagonista y operación diaria **una debajo de la otra** a todo el ancho (la operación diaria en
2 columnas de filas). Horizonte completo con la caja de vencidos a la izquierda. Lista en disposición compacta.

**Teléfono, 360 px**

```
┌──────────────────────────────┐
│ ⊢ Control de flota ←Portafolio ⋯│ 56
│ Ver como [Encargado|Conductor]│ 44 (fila propia)
│ [  Alertas ▮4  ][   Flota   ] │ 52
├──────────────────────────────┤
│ DEMO CON DATOS FICTICIOS     │
│ Centro de alertas            │ h1
│ Hoy es miércoles 18/11/2026  │
│ (hora de Argentina)          │
│┌ No pueden salir hoy ───────┐│
││▌ 4 unidades                ││
││▌ [ZK 214 BD] Int. 07       ││
││▌ Seguro vencido hace 1 día││ el motivo baja a su renglón
││▌ ……                        ││
││ Disponibles: 19 de 23      ││
│└────────────────────────────┘│
│┌ Operación diaria │ 6 ──────┐│
││ ⬣ 1 novedad crítica    Ver ││
││ …                          ││
│└────────────────────────────┘│
│┌ Vencimientos │ 11 ─────────┐│
││ ┌VENCIDOS Y FALTANTES   2 ┐ ││ caja arriba, a lo ancho
││ Hoy    7      15        30  ││
││ ┃●●· ●┊ ● ····┊··●······●┊  ││ ~10 px por día
││ Mostrar:                   ││
││ [Todos 11  ][Vencidos  2  ]││ grilla de 2
││ [7 días  4 ][8 a 15   3  ]││
││ [16 a 30 2 ]               ││
││ Vencidos y faltantes (2)   ││
││┌▌⊗ Falta cargar          ┐ ││ tarjeta
│││▌ Habilitación de ingreso │ ││
│││▌ [ZP 088 KC] Int. 12     │ ││
│││▌ Proyecto Piedra Lunar   │ ││
│││▌ [ Cargar             ]  │ ││ a todo el ancho
││└─────────────────────────┘ ││
│└────────────────────────────┘│
│ … detalle de operación …     │
│ pie                          │
└──────────────────────────────┘
```

- Sin desplazamiento horizontal de la página a ningún ancho (`scrollWidth <= innerWidth`).
- Nada fijo arriba a 360 px (las barras se van con el desplazamiento).

### 6.2 Flota (`#/flota`)

Jerarquía: 1) encontrar la unidad; 2) ver su estado de hoy; 3) agregar.

**Escritorio, 1280 px**

```
│ Flota (h1)                                                         [ Agregar unidad ] (primario) │
│ 23 unidades activas · 19 pueden salir · 2 no pueden salir · 2 fuera de servicio · 1 de baja      │
│ ┌ ▦ Unidades │ 23 ──────────────────────────────────────────────────────────────────────────────┐ │
│ │ [🔍 Buscar por patente, interno, modelo o conductor   ]  Proyecto [Todos ▾]  Ordenar por [Prioridad ▾] │
│ │ Mostrar: [Activas 23] [Pueden salir 19] [No pueden salir 2] [Fuera de servicio 2] [De baja 1] │ │
│ │ UNIDAD             ESTADO HOY            PRÓXIMO VENCIMIENTO         KM        ÚLTIMO PARTE  NOV. PROYECTO · CONDUCTOR │
│ │▌[ZK 214 BD] Int.07 ⊗ No puede salir      ⊗ Seguro vencido           84.320 km  17/11/2026    0   P. Arroyo · L. Ferreyra │
│ │▌Toyota Hilux 2022  Seguro vencido hace 1 día                                                         │
│ │ [ZA 019 RT] Int.01 ✓ Puede salir         ▕──────●▏ Seguro · en 7 días       120.455 km  17/11/2026  0 │
│ │ …                                                                                              │ │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ (barra de estado: "Mostrando 23 de 23 unidades.")                                            │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
```

- "Activas" es el filtro por defecto (sin las de baja). La búsqueda filtra mientras se escribe (sin botón), ignora
  mayúsculas, tildes, espacios y guiones (`zk214` encuentra `ZK 214 BD`); el conteo de la barra de estado se actualiza
  y se anuncia con 500 ms de pausa.
- **Vacío por filtro:** "Ninguna unidad coincide con «zz9» en Proyecto Piedra Lunar." + botón-texto "Quitar filtros".
- **Tableta:** búsqueda a todo el ancho; Proyecto y Ordenar por en una fila; filtros en una fila que se acomoda en dos;
  tabla compacta (Unidad + Estado · Próximo vencimiento + Último parte · Km + Novedades).
- **Teléfono:** "Agregar unidad" pasa debajo del `h1`, a todo el ancho; búsqueda, `select`s y filtros apilados;
  tarjetas: patente-enlace + interno, etiqueta de estado y motivo, próximo vencimiento, "84.320 km · último parte 17/11".

### 6.3 Ficha de unidad (`#/unidad/ZK214BD`)

Jerarquía: 1) qué unidad es y si puede salir (y por qué); 2) documentos; 3) novedades abiertas; 4) historial.

**Escritorio, 1280 px**

```
│ Flota / ZK 214 BD                                                       (migas: nav aria-label="Ruta") │
│ [ZK 214 BD] (h1, patente grande)   ⊗ No puede salir · Seguro vencido hace 1 día                 │
│ Interno 07 · Toyota Hilux 2022 · Camioneta                                                      │
│ Proyecto Arroyo Escondido · Conductor: Lucía Ferreyra (ficticia) · 84.320 km (al 17/11/2026)    │
│ [Cargar parte]  [Poner fuera de servicio]  [Más acciones ▾]                                      │
│ ┌ ▤ Documentos │ 4 · 1 vencido ───────────────────────────┐ ┌ ⚒ Novedades │ 0 abiertas ────────┐ │
│ │ ┌Vencidos 1┐ Hoy ┃·························┊···· 30        │ │ [Abiertas 0] [Resueltas 4]          │ │
│ │ DOCUMENTO          NÚMERO       VENCE       ESTADO         │ │ Sin novedades abiertas.             │ │
│ │▌Seguro             DEMO-88-4471 17/11/2026  ⊗ Vencido hace 1 día[Renovar] [Corregir]          │ │
│ │ ▸ Anteriores (2)                                           │ │ [Cargar novedad]                    │ │
│ │ Revisión técnica   DEMO-RT-5521 03/02/2027  ✓ Vigente hasta 03/02/2027 [Renovar] [Corregir]   │ │
│ │ Carga del matafuego …          12/03/2027  ✓ Vigente hasta … │ ├─────────────────────────────────────┤ │
│ │ Habilitación de ingreso …      02/01/2027  ✓ Vigente        │ │ (estado)                            │ │
│ │ [Cargar otro documento]                                     │ └──────────── columnas 9–12 ─────────┘ │
│ ├────────────────────────────────────────────────────────────┤ ┌ ◔ Kilometraje │ 84.320 km ─────────┐ │
│ │ (estado: "Seguro renovado: vence 15/11/2027.")             │ │ Últimos 10 partes:                   │ │
│ └──────────────── columnas 1–8 ─────────────────────────────┘ │ 17/11  84.188 → 84.320   132 km      │ │
│ ┌ ⟲ Historial │ 128 eventos ──────────────────────────────────┐ │ 16/11  84.050 → 84.188   138 km      │ │
│ │ Mostrar: [Todo] [Partes] [Documentos] [Novedades] [Estado y km] │ ⚠ 14/11 salto de 1.250 km aceptado   │ │
│ │ MARTES 17/11/2026                                           │ │ ⟲ 29/10 corrección: 120 km (tablero) │ │
│ │ 18:42  ▤  ▸ Parte enviado · 132 km · combustible 3/4 …      │ └──────────────────────────────────────┘ │
│ │            Lucía Ferreyra (ficticia)                        │                                          │
│ │ …                                    [Ver 30 más]           │                                          │
│ └─────────────────────────────────────────────────────────────┘                                          │
```

- **Encabezado** (sobre el escritorio, sin panel): migas; `h1` con la patente grande; etiqueta de aptitud con todos los
  motivos (si son más de 2: "No puede salir · 3 motivos" y la lista debajo); línea de datos (`dl` en fila, separadores
  con divisor de 1 px, no con "·" en el marcado); acciones.
- **Acciones del encabezado** (secundarios, sin primario): "Cargar parte" (si está en servicio) · "Poner fuera de
  servicio" o "Volver a servicio" (según estado) · "Más acciones" (5.3): "Corregir kilometraje", "Cambiar proyecto o
  conductor", "Cargar novedad", "Dar de baja". Unidad de baja: ninguna acción; aviso neutro "Dada de baja el
  18/11/2026: {motivo}. Se conserva su historial."
- **Documentos:** horizonte mediano de la unidad; tabla Documento · Número · Emisor (oculto < 66rem) · Vence · Estado ·
  Acciones. Faltantes como filas con "Falta cargar" y botón "Cargar". "Anteriores (N)": `details` con los reemplazados.
- **Novedades:** filtro Abiertas/Resueltas; cada novedad: etiqueta, texto, origen ("Parte del 16/11/2026, punto
  Frenos" o "Cargada por el encargado"), fecha y "Resolver".
- **Kilometraje:** lista de los 10 últimos partes enviados y correcciones (fecha, inicio → fin, recorrido); los saltos
  aceptados con `i-alerta` tono semana; las correcciones con `i-km`.
- **Tableta:** una columna: encabezado, Documentos, Novedades, Historial, Kilometraje.
- **Teléfono:** igual que tableta; acciones del encabezado apiladas a todo el ancho; documentos en tarjetas; el
  historial con la hora encima del resumen.
- **Error:** patente inexistente → `h1` "No se encontró la unidad", "No hay ninguna unidad con la patente ZZ 999 ZZ."
  y enlace "Ir a la flota".

### 6.4 Inicio del conductor (`#/conductor`)

```
┌──────────────────────────────┐ 360 px (a ≥ 40rem, la misma columna de 40rem centrada)
│ barras (perfil: Conductor)   │
│ Conductor: Lucía Ferreyra    │
│ (ficticia) · Cambiar         │
├──────────────────────────────┤
│ Parte diario (h1)            │
│ ┌ Hoy, miércoles 18/11/2026 ┐│ panel
│ │ [ZK 214 BD] Int. 07        ││
│ │ Toyota Hilux 2022          ││
│ │ Último registro: 84.320 km ││
│ │ (17/11/2026)               ││
│ │ [   Empezar el parte     ] ││ primario grande, ancho completo
│ │ Usar otra unidad           ││ botón-texto → select de unidades en servicio
│ └────────────────────────────┘│
│ ┌ Pendientes ───────────────┐│ solo si hay
│ │ △ Ayer (17/11) no se envió ││
│ │   el parte. [Cargarlo]     ││
│ └────────────────────────────┘│
│ ┌ Su licencia ──────────────┐│
│ │ △ Vence en 12 días         ││
│ │   (30/11/2026)             ││
│ └────────────────────────────┘│
│ ┌ Mis últimos partes ───────┐│
│ │ 17/11 ZK 214 BD 132 km ✓   ││ enlaces al parte en lectura
│ │ …                          ││
│ └────────────────────────────┘│
└──────────────────────────────┘
```

Estados del panel "Hoy": sin parte → "Empezar el parte"; borrador → "Tiene un parte empezado: faltan 5 datos." +
"Continuar el parte" (primario) + "Descartar borrador"; enviado → etiqueta "Enviado a las 18:42" + "Ver el parte";
unidad fuera de servicio → aviso semana "ZK 214 BD está fuera de servicio desde el 13/11/2026 (En taller: cambio de
embrague). No hace falta parte." + "Usar otra unidad"; sin unidad asignada → `select` "Elija la unidad" (solo en
servicio) + "Empezar el parte"; unidad en servicio que **no puede salir** (documento vencido o faltante) → aviso crítico
arriba del botón: "ZK 214 BD no puede salir: Seguro vencido hace 1 día. Avise al encargado antes de usarla." y el botón
sigue disponible (P9: si igual se usa, el parte lo registra). En el ejemplo, Lucía Ferreyra tiene asignada justamente
ZK 214 BD (caso C01): quien cambia a la vista de conductor ve en el acto cómo se cruzan las dos vistas.

### 6.5 Parte diario (`#/parte/ZK214BD/2026-11-18`)

Jerarquía: 1) de qué unidad y qué día es; 2) lo que falta; 3) enviar.

**Teléfono, 360 px (pantalla principal de esta vista)**

```
┌──────────────────────────────┐
│ ← Parte diario               │ enlace de vuelta
│ Parte del miércoles 18/11/2026│ h1
│ [ZK 214 BD] Toyota Hilux 2022│
│ Conductor: Lucía Ferreyra    │
│ ⎙ Guardado en este equipo    │ indicador (5.15)
│   a las 14:32                │
│ (resumen de errores, si hay) │
│ ─ 1. Kilometraje ─────────── │ legend
│ Al iniciar                   │
│ Último registro: 84.320 km   │ ayuda
│ [ 84.320            ] km     │
│ Al terminar                  │
│ Complételo al final del día. │
│ [                   ] km     │
│ Recorrido: —                 │ <output>
│ ─ 2. Revisión de la unidad ─ │
│   Respondidos: 3 de 10       │
│ Frenos        [⬣ Punto crítico]│
│ [✓ En orden ][! Con novedad] │ 48 px
│ ─────────────────────────────│
│ Dirección     [⬣ Punto crítico]│
│ …                            │
│ ─ 3. Combustible ─────────── │
│ Nivel al terminar            │
│ [Reserva][1/4][1/2][3/4][Lleno]│
│ Combustible cargado hoy      │
│ Deje vacío si no cargó.      │
│ [        ] litros            │
│ ─ 4. Otra novedad (opcional)─│
│ [ textarea                 ] │
│ [ ] Impide usar la unidad    │
│ Descartar borrador           │ botón-texto
├──────────────────────────────┤
│ Faltan 5 datos [Enviar parte]│ barra fija (5.14)
└──────────────────────────────┘
```

- **Tableta y escritorio:** misma columna de 40rem centrada; kilometraje en dos columnas (inicio | fin) cuando el
  contenedor pasa 30rem; barra de envío estática al final.
- **Encargado** abriendo el parte desde la ficha: igual, con un `select` "Conductor" (activos; por defecto el asignado)
  en la sección 1.
- **Recorrido:** `<output for="km-inicio km-fin">` se actualiza al salir de cada campo: "132 km", "Sin uso" (0) o "—".
  Si K2 falla, el error va en "Al terminar".
- **Enviar:**
  1. Faltan datos o falla una regla → resumen de errores arriba con el foco (5.15); errores en cada campo.
  2. Completo y con advertencias (K6, K7, P9) → diálogo "Antes de enviar".
  3. Completo sin advertencias, o advertencias aceptadas → se envía (botón en estado cargando) y la vista pasa a
     **"Parte enviado"**: panel con franja vigente, `h1` "Parte enviado" (recibe el foco), "ZK 214 BD, 18/11/2026,
     enviado a las 18:42.", `dl` con Recorrido "132 km (84.320 → 84.452)", Combustible "3/4", "Cargó 45,5 litros",
     Novedades "1 crítica: Frenos" y, si hubo crítica, aviso semana "La unidad quedó fuera de servicio hasta que el
     encargado la revise." Acciones: "Volver al inicio" (primario) · "Imprimir o guardar en PDF" (P2, botón-texto).
  4. Error al guardar (P12, D10) → mensaje en el resumen de errores, todo lo escrito sigue.
- **Parte en lectura** (enviado, o fecha fuera de P2): los mismos bloques como `dl`, sin campos; los puntos "En orden"
  se agrupan en una línea ("8 puntos en orden: …") y los que tienen novedad se muestran con su texto.
- **Ruta inválida:** fecha mal escrita → "La fecha de la dirección no es válida." + "Ir a Parte de hoy"; fecha
  futura o anterior a 7 días sin parte → texto de la regla P2 + el mismo enlace.

### 6.6 Hoja de impresión del parte (P2)

`@media print`: sin barras, sin pie, sin botones; encabezado con "Logística Andina Demo S.A. (ficticia) · Parte
diario"; tabla del checklist con columnas Punto · Resultado · Detalle; espacio para firma del conductor; pie con
"Generado en la demo de control de flota — datos ficticios". Colores a negro sobre blanco (`print-color-adjust:
exact` solo en las etiquetas).

---

## 7. Textos clave (español neutro, los pule `redactor-ux`)

| Dónde | Texto |
| --- | --- |
| Bajada del centro de alertas (bajo la fecha) | "Datos ficticios de una empresa inventada. Todo se guarda en este navegador." + "Cómo funciona" |
| Protagonista | "4 unidades no pueden salir hoy" / "Todas las unidades activas pueden salir hoy." |
| Grupos | "Vencidos y faltantes", "Vencen en 7 días o menos", "Vencen entre 8 y 15 días", "Vencen entre 16 y 30 días" |
| Filtro (cortos) | "Todos", "Vencidos y faltantes", "7 días o menos", "8 a 15 días", "16 a 30 días" |
| Hoy | "Hoy es miércoles 18/11/2026 (hora de Argentina)" |
| Parte, ayuda de km | "Último registro: 84.320 km (parte del 17/11/2026)." |
| Parte, punto crítico | "Al enviar, la unidad queda fuera de servicio hasta que el encargado la revise." |
| Parte, documentación vencida (diálogo) | "El seguro de ZK 214 BD venció el 17/11/2026. Puede enviar el parte igual: quedará registrado que la unidad circuló con documentación vencida." |
| Reinicio | "Se borran los cambios hechos en este navegador y se vuelve a cargar la flota de ejemplo con las fechas de hoy." |

Fechas siempre `dd/mm/aaaa`; con día de la semana en encabezados. Kilómetros con punto de miles y "km". Nunca "ud." ni
"vos"; nunca "¡Ups!".

---

## 8. Estados por pantalla

| Pantalla | Cargando | Vacío | Sin datos | Error |
| --- | --- | --- | --- | --- |
| Toda la app | Arranque (5.19) | — | — | IndexedDB falla → modo en memoria (aviso D8). Falla grave al iniciar → `h1` "No se pudo iniciar la demo", "Recargue la página. Si el problema sigue, pruebe con otro navegador." + botón "Recargar la página" (sin "Reiniciar demo": no arregla nada desde ahí). |
| Centro de alertas | — (los datos ya están en memoria) | Protagonista en 0 (vigente); Operación "Sin pendientes de operación."; Horizonte "Nada vence en los próximos 30 días"; lista "No hay vencimientos en los próximos 30 días." | — | Error al guardar desde un diálogo: en el diálogo (no se cierra). |
| Flota | — | Por filtro: "Ninguna unidad coincide…" + "Quitar filtros". Sin unidades (no debería pasar): "Todavía no hay unidades." + "Agregar unidad". | — | — |
| Ficha | — | Novedades: "Sin novedades abiertas." Kilometraje: "Todavía no hay partes de esta unidad." Documentos: solo faltantes (filas "Falta cargar"). | Historial con solo "Alta de la unidad". | Patente inexistente (6.3). Unidad de baja: aviso neutro, sin acciones. |
| Inicio del conductor | — | "Mis últimos partes": "Todavía no envió partes." | Sin unidad asignada: `select`. | Unidad fuera de servicio: aviso (6.4). |
| Parte | Envío: botón "Enviando…" | — | Unidad sin km previo: ayuda "Es el primer registro de esta unidad." | Reglas (resumen de errores); guardado (indicador en error); ruta inválida (6.5). |

---

## 9. Accesibilidad (WCAG 2.2 AA como piso)

- **Puntos de referencia:** `header`, `nav` (Secciones; Ruta en la ficha), `main`, `footer`. Un `h1` por pantalla; `h2`
  por panel; `h3` por grupo.
- **Teclado:** todo se opera con teclado; orden de tabulación = orden visual; radios con flechas; Esc cierra diálogos y
  el menú "Más". Enlace "Ir al contenido" visible al recibir foco.
- **Foco visible y no tapado (2.4.7, 2.4.11):** anillo de 2 px; `scroll-padding-top` no hace falta (nada fijo arriba);
  `scroll-padding-bottom` con la barra de envío (5.14).
- **Tamaño de objetivos (2.5.8):** mínimo 44 × 44 en todo lo que se pulsa (la norma pide 24; se usa 44 por el uso con
  guantes); 48 en el checklist y el combustible.
- **Entrada redundante (3.3.7):** el parte precarga km de inicio, conductor y unidad (P13); el emisor de un documento
  renovado se precarga.
- **Ayuda consistente (3.2.6):** "Cómo funciona" siempre en el mismo lugar (barra superior o menú "Más").
- **Errores (3.3.1, 3.3.3):** texto que dice qué pasó y cómo arreglarlo; asociado al campo; resumen con enlaces; nunca
  desaparece solo.
- **Estado (4.1.3):** regiones `role="status"` para resultados de filtros, mensajes de paneles y guardado (con la regla
  de no repetir de 5.15).
- **Contraste (1.4.3, 1.4.11):** tabla 3.3. Se vuelve a medir lo maquetado.
- **Uso del color (1.4.1):** etiqueta = color + ícono de forma distinta + texto; horizonte con conteos en texto.
- **Reflujo y texto (1.4.10, 1.4.12):** a 320 px de ancho y con zoom de 400 %, sin desplazamiento horizontal (salvo
  ninguna tabla: pasan a tarjetas). Espaciado de texto aumentado sin cortes.
- **Lectores de pantalla:** tablas con `th` y `scope`; en tarjetas, roles explícitos; la patente-enlace dice "Ficha de
  ZK 214 BD"; el horizonte es `role="img"` con su resumen; la cifra protagonista es una frase.
- **Modo de colores forzados:** foco, tramos del horizonte y bordes de patente con colores del sistema (5.5, 5.6).
- **Movimiento:** `prefers-reduced-motion` respetado (3.6).
- **Idioma:** `<html lang="es">`.

---

## 10. Lo que NO hay que hacer

- Grilla de tarjetas por unidad tipo semáforo, "bento", fila de tres cifras gigantes, medidores circulares, mapas,
  camiones ilustrados, íconos de vehículos en color, emojis.
- Imitar la patente oficial (banda azul, escudo, leyendas) o cualquier marca de organismo o empresa real.
- Gradientes, vidrio esmerilado, violeta, brillos, sombras grandes, píldoras, mayúsculas fuera de rótulos y cabeceras.
- Fondos de color por fila (la franja alcanza); franja verde en las filas que están bien.
- **Botón "Marcar todo en orden" en el checklist**: fomenta completar sin mirar, que es justo el problema del papel.
- Deshabilitar "Enviar parte" mientras falten datos; mensajes de error que desaparecen solos; avisos tipo *toast*.
- Anunciar cada autoguardado al lector de pantalla.
- Animar cifras, animaciones al desplazar, esqueletos con brillo, marcas del horizonte que aparecen con movimiento.
- `min-width` en tablas o desplazamiento horizontal de la página a cualquier ancho.
- Información solo en `title` o solo al pasar el mouse (el horizonte no tiene *tooltips*).
- Atributo `style` en el marcado, `{@html}`, fuentes, íconos o scripts de un CDN.
- Calcular "hoy" con la hora del equipo o con un desfase fijo.
- Decir que la demo reproduce el sistema de una empresa, nombrar empleadores o clientes, usar nombres de proyectos
  mineros reales.
- Botones visibles que no hacen nada o que no aplican (si no aplica, no se muestra).

---

## 11. Reparto de trabajo (para que programador y maquetador no se pisen)

| Quién | Archivos | Qué hace |
| --- | --- | --- |
| Programador | `src/lib/**/*.ts` | Dominio, generador, persistencia, estado (ver `diseno.md`, sección 12). |
| Programador | `src/rutas/*.svelte` (contenedores) | Leen el estado, llaman comandos, arman los textos con `textos.ts`, manejan el foco y las rutas. Sin estilos propios (solo clases de diseño). |
| Maquetador | `src/componentes/*.svelte` (presentación) | Marcado y `<style>` de cada pieza de la sección 5; reciben datos por `props` y avisan con *callbacks*; no leen el estado global ni llaman comandos. |
| Maquetador | `src/estilos/tokens.css`, `base.css`, `impresion.css` | Tokens, reglas globales, impresión. |
| Maquetador | `index.html` | Sprite de íconos, favicon, raíz de la aplicación. |
| Ambos (acuerdo previo) | `src/componentes/tipos.ts` | Tipos de las `props` de cada componente. Lo escribe el programador primero; el maquetador pide cambios. |

Orden sugerido: (1) programador, dominio con TDD; maquetador en paralelo, tokens, base y componentes sueltos con datos
de ejemplo (`Patente`, `Etiqueta`, `Panel`, `Horizonte`); (2) pantallas: alertas → flota → ficha → parte; (3) pasada
a 360/768/1280, claro y oscuro; (4) `qa-destructor` + `revisor-codigo` + `auditor-accesibilidad` en paralelo →
correcciones → `disenador-ui` revisa contra este documento → `critico-reclutador` → Matías.

## 12. Verificación (para cerrar la maquetación)

- 320, 360, 768, 1024 y 1280 px, claro y oscuro, con el ejemplo completo: sin desplazamiento horizontal.
- Recorrido solo con teclado: alertas → filtro "7 días o menos" (flechas) → "Renovar" → diálogo (error V10, corregir,
  guardar) → el foco cae donde dice 5.17 → flota → buscar "zk214" → ficha → "Más acciones" → "Corregir kilometraje" →
  Esc → perfil Conductor → parte: enviar vacío (resumen con foco) → completar → advertencia → enviar → "Parte enviado".
- Celular real (o emulado con táctil): el parte completo con el pulgar; la barra de envío no tapa campos; el teclado
  numérico aparece en km y litros; recargar la página a mitad del parte y encontrar el borrador.
- Zoom 200 % y 400 %; espaciado de texto aumentado; `prefers-reduced-motion`; colores forzados (Windows, contraste alto).
- Contraste de lo maquetado medido otra vez (los valores de 3.3 son de la paleta).
- Consola sin errores ni violaciones de CSP con la compilación de producción servida con `public/_headers`.
- IndexedDB bloqueado (ventana privada de un navegador que lo bloquee, o simulado): la demo funciona con el aviso D8.
- Dos pestañas: cambiar algo en una y ver el aviso D9 en la otra.
- Lector de pantalla (NVDA + Chrome): protagonista como frase, horizonte con su resumen, tabla en tarjetas a 360 px con
  encabezados, resumen de errores con enlaces que llevan al campo.

## 13. Decisiones abiertas de interfaz (para Matías)

| # | Pregunta | Opciones | Recomendación |
| --- | --- | --- | --- |
| UI1 | Dirección visual | A "Horizonte" · B "Bitácora" · C "Semáforo" | A (sección 1). |
| UI2 | Rótulo de patente | Con banda superior neutra (propuesto) · texto monoespaciado sin caja | Con caja y banda: se reconoce de un vistazo y no imita la placa oficial. |
| UI3 | Perfil al entrar | Siempre Encargado · Conductor en el celular | Siempre Encargado: el centro de alertas lleva el mensaje de 10 segundos; el atajo "Abrir el parte diario" está a la vista. |
| UI4 | Orden de la flota | `select` "Ordenar por" (propuesto) · cabeceras con flechas | `select`: un solo control que sirve también en tarjetas. |
| UI5 | Franja en filas que están bien | Sin franja (propuesto) · franja verde | Sin franja: el color queda para lo que hay que mirar. |
| UI6 | Invitación de primera visita (como el globo de la Demo 1) | Ninguna (propuesto) · globo | Ninguna: la bajada con "Cómo funciona" alcanza y la pantalla ya responde sola. |
