# Diseño de interfaz — Control de flota (18/11/2026)

Especificación visual y de interacción para el maquetador (marcado y CSS) y el programador (TypeScript y estado). Las
reglas de negocio están en `docs/diseno.md` (identificadores T, V, A, P, K, N, U, H, D): este documento **no cambia
ninguna regla**, solo cómo se ve, cómo se ordena y cómo se usa. Textos de interfaz en **español neutro** (se trata al
lector de usted o en forma impersonal; sin voseo). Todo dato es ficticio.

Base: el sistema visual de la Demo 1 (`docs/diseno-ui.md` de su repositorio, secciones 3 y 13.3). Acá se
**repiten los valores** que hacen falta para que nadie tenga que abrir el otro documento.

Si algo de acá no alcanza para implementar sin adivinar, es un defecto de este documento: preguntar antes de inventar.

**Actualización del 19/11/2026.** Matías decidió que el checklist es **previo al uso** (el parte pasa a tener dos pasos:
revisión antes de salir y cierre) y que **la licencia vencida o faltante bloquea** la revisión; además eligió la opción
(b) en las decisiones visuales D1 a D4 de la revisión del paso 5.3. Están aplicados en su lugar (4.2, 5, 5.2, 5.4, 5.7 a
5.10, 5.12 a 5.17, 5.19, 6.1 a 6.5, 7, 8, 9, 10, 12 y 13) y resumidos, con las tareas del maquetador, en la **sección
14**. Las reglas nuevas (P14 a P17, K10, L1 a L7) y la lógica están en `docs/diseno.md`, secciones 6 y 17.

**Actualización del 22/11/2026.** Revisión visual de la etapa 6 (informe de revisión interno (no publicado), con las de
accesibilidad y QA) y decisiones de Matías: resumen de errores agrupado (D1), marca «(persona
ficticia)» (D2), «fuera de plazo» en lugar de «fuera de término», «Enviar de todos modos» / «Cerrar de todos modos» y la
regla nueva **«Cerrar antes»** (estado 5 bis del inicio y pantalla E). Aplicado en 4.1, 4.2, 5.1, 5.4, 5.9, 5.10, 5.11,
5.14 a 5.18, 6.1 a 6.5, 7, 8, 9, 10, 12 y 13; las tareas del maquetador, en orden, en la **sección 14.3**.

**Actualización del 25/11/2026 — interfaz «tipo app» (dirección «Turno»).** Matías aprobó el prototipo «Turno» y el porte lo dejó en el código (rama `interfaz-app`, etapas E0 a E4). Cambia la cara, no las reglas. Quedaron **reescritas** las secciones 2 (rutas), 3 (tokens), 4 (marco) y 10 (lo que no hay que hacer); las demás conservan los nombres anteriores y, donde dicen otra cosa, **manda el código y esta nota**:

| En las secciones 1 y 5 a 14 dice | Hoy es |
| --- | --- |
| Centro de alertas (`#/alertas`) | **Inicio** (`#/inicio`); sus vencimientos tienen pantalla propia, **Vencimientos**, y la operación diaria también, **Operación diaria** (Checklists y Novedades) |
| Flota (`#/flota`) | **Movilidades** (`#/movilidades`) |
| Inicio del conductor | **Hoy**; los partes anteriores, en **Mis partes** |
| «No pueden salir», «Puede salir», «No puede salir» | «No disponibles hoy», «Disponible», «Bloqueada» (por documentos) y «Fuera de servicio» |
| Barra superior, barra de la aplicación con pestañas, selector de perfil en la barra y pie | Lateral oscuro (escritorio), barra superior con «Atrás» y chip de perfil y barra inferior (celular), migas, pantalla «Más» y diálogo «Ver como» |
| Horizonte grande (5.6, variante completa de solo lectura) | Regla interactiva de 0 a 30 días (`HorizonteRegla.svelte`): un solo punto de tabulación, flechas, Inicio y Fin, detalle anunciado; las variantes mediana y mínima no cambiaron |
| Filtros por radios con conteo (5.8) | Pastillas que son enlaces (`FiltrosEnlace.svelte`), con la forma del tono |
| Diálogo centrado | Hoja inferior en el celular (5.17) |
| Componentes `PantallaAlertas`, `BarraApp` y `SelectorPerfil` (citados en las secciones 14.2 y 14.3 y en el registro) | `PantallaInicio`, `PantallaVencimientos` y `PantallaOperacion`; `BarraSuperior`, `BarraInferior` y `Lateral`; `DialogoConductor` («Ver como»). Esos tres nombres ya no existen en el código |
| Orden de la navegación | El mismo en el lateral y en la barra inferior: Inicio, Movilidades, Vencimientos, Operación diaria (y «Más» en la barra inferior) |

Los **textos** de interfaz salen de `src/lib/dominio/textos.ts` y `src/componentes/textos-marco.ts`; la sección 7 es histórica. Lo que sigue vigente tal cual: componentes de formulario, parte diario (5.12 a 5.16, 6.5), reglas de foco, accesibilidad (9) y verificación (12), salvo las rutas.

**Actualización del 26/11/2026 — correcciones de presentación tras la crítica de reclutador.** Cambian estas reglas visuales (donde otra sección diga lo contrario, manda esta lista):

| Pieza | Regla nueva |
| --- | --- |
| «Fuera de servicio» (Inicio, Movilidades, ficha) | Por **novedad crítica**: tono `critico` (rombo), el mismo nivel que un seguro vencido. Por **taller o a mano**: tono `neutro` (grafito, cuadrado). Ya no usa el ámbar de «vence en 7 días o menos». El origen sale de `estado.origen` de la unidad (`origenDeFueraDeServicio`). La pastilla «Fuera de servicio» de Movilidades reúne las dos clases y va en neutro. El color nunca va solo: forma y texto no cambian. |
| Cifras tabulares | Solo en cifras sueltas y columnas; no en oraciones (ver 3.4). |
| Caja «Vencidos o faltantes» de la regla | Desde 44 rem de ancho de la pieza: columna de 10 rem con el rótulo, **una patente o nombre por renglón** (`white-space: nowrap`, nunca partido) y la cifra abajo. Con menos ancho: una línea con « · » entre las piezas, que bajan de renglón sin partirse. |
| Franja de entrada al recorrido (Inicio, bajo el subtítulo) | Franja de una línea sobre `--c-superficie`, borde de 1 px y riel de 4 px en tinta (el color habla de estado, la tinta de acción), texto en 600 y **el único botón primario de la pantalla** («Probar como conductor» con flecha). En el celular el botón ocupa todo el ancho. Se ve entera en la primera pantalla a 1440 × 900 y a 390 × 844. |
| «Agregar unidad» (Movilidades) | Botón secundario junto al `h1`; no domina el encabezado en el celular (6.2). |
| Barra de progreso del parte | Un segmento por punto, gris (`--c-borde`) sin responder, malaquita en orden y cobre con novedad. Sin marca para los puntos críticos (una raya en la mitad de los segmentos parecía un 50 % con 0 de 14). |
| Enlace «Hoy» del parte en el celular y la tableta | No se repite: si el enlace de la página va al mismo destino que el «‹ Hoy» de la barra superior, se oculta por debajo de 64 rem. En escritorio queda (no hay barra). |
| Insignia de Inicio (4.3) | Avisa desde las otras pantallas cuántas unidades no pueden salir; estando en Inicio no se muestra (repetía la cifra grande de al lado). |
| Vista previa al compartir | `index.html` lleva `description`, Open Graph y `twitter:card`; la imagen es `public/og-inicio.png` (1200 × 630, captura de Inicio). Son etiquetas meta: no cargan nada y la CSP no cambia. |

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

## 1. Dirección visual: "Horizonte" (hoy, con la cara de "Turno")

> Desde el 25/11/2026 la dirección vigente es **«Turno»** (ver la nota de arriba y las secciones 3 y 4): paleta mineral sobre papel cálido, tinta como acción, tres tipografías propias y marco con lateral oscuro. El horizonte sigue siendo la pieza firma, ahora como regla interactiva. Lo que sigue es el razonamiento original.

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

Aplicación de una sola página con rutas por *hash* (no necesita configurar el servidor). **Reescrita el 25/11/2026** con el porte a la interfaz «tipo app» (dirección «Turno»); el código es `src/lib/estado/enrutador.ts`.

| Ruta | Pantalla | Perfil |
| --- | --- | --- |
| `#/inicio` (por defecto del encargado; alias `#/alertas`) | Inicio | Encargado |
| `#/movilidades?filtro=…&q=…` (alias `#/flota`) | Movilidades | Encargado |
| `#/vencimientos?filtro=…` | Vencimientos | Encargado |
| `#/operacion/checklists` y `#/operacion/novedades` (`#/operacion` lleva a Checklists) | Operación diaria | Encargado |
| `#/unidad/ZK214BD` (patente normalizada) | Ficha de unidad | Encargado |
| `#/conductor` (por defecto del conductor) | Hoy | Conductor |
| `#/conductor/partes` | Mis partes | Conductor |
| `#/parte/ZK214BD/2026-11-18` (sin fecha: la de hoy) | Parte diario (revisión antes de salir, cierre o lectura, según el estado del parte; 6.5) | Ambos |
| `#/mas` | Más: «Ver como», «Cómo funciona», «Reiniciar demo», volver al portafolio | Ambos |

- Filtros en la dirección. Movilidades: `disponibles`, `no-disponibles`, `bloqueadas`, `fuera`, `baja` (los viejos `pueden-salir`, `no-pueden-salir`, `fuera-de-servicio` y `de-baja` se siguen entendiendo); la búsqueda, `q` (hasta 60 caracteres). Vencimientos: `vencidos`, `proximos`, `7`, `15`, `30`. Un `?` en cualquier otra pantalla es una ruta desconocida.
- **Pantalla no es consulta.** Cambiar de pantalla mueve el foco al `h1` (`tabindex="-1"`, sin anillo: D3 (b), ver «Foco visible» al comienzo de la sección 5), sube la página (sin desplazamiento suave) y actualiza `document.title` = «{Pantalla} · Control de flota (demo)». Cambiar de filtro o escribir en el buscador **no** mueve foco ni desplazamiento; un filtro agrega una entrada al historial y cada letra del buscador, no.
- Ruta desconocida o patente que no existe: estado de error de la pantalla (sección 8), nunca una pantalla en blanco. Un perfil que abre una ruta del otro perfil va a su propio inicio.
- Cambiar de perfil (con «Ver como») lleva a la ruta por defecto del perfil elegido, sin agregar historial.
- «Atrás» (en la barra superior del celular y en las migas de escritorio) es un enlace al **padre** de la pantalla: la ficha vuelve a Movilidades con el filtro y la búsqueda que tenía; el parte, a Operación diaria (encargado) o a Hoy (conductor); Checklists y Novedades, a Operación diaria. En las pantallas de la navegación no hay.
- Un diálogo abierto no sobrevive a un cambio de pantalla: «Atrás» del navegador lo cierra.
- La ficha, el parte, Hoy y Mis partes se bajan al entrar (`import()` dinámico) para que la carga inicial siga bajo el tope de JavaScript (`docs/stack.md`, sección 7); mientras llegan se muestra «Cargando…» (a partir de 300 ms) y, si no llegan, un error con «Recargar».

Orden del DOM (= orden de tabulación): enlace «Ir al contenido» → lateral (escritorio) → barra superior (celular y tableta) → migas y fecha (escritorio) → avisos globales → `main#principal` → barra inferior (celular y tableta). Los diálogos van al final del `body`. «Ir al contenido» no cambia el hash.

---

## 3. Tokens

Propiedades personalizadas en `:root` (`src/estilos/tokens.css`, que es la fuente de los valores; esta sección explica el criterio), bloque oscuro en `@media (prefers-color-scheme: dark)`. Sin selector de tema (sigue al dispositivo). Prefijos: `--c-` color, `--t-` tipografía, `--e-` espaciado, `--r-` radio, `--s-` sombra, `--m-` movimiento. **Reescrita el 25/11/2026** (dirección «Turno»): los nombres de los tokens se mantuvieron respecto de la versión anterior; cambiaron los valores y se sumaron los del marco nuevo.

### 3.1 Color base

Negro cálido sobre papel cálido. **La tinta es la acción** (botón primario, filtro elegido, destino activo): el acento ya no es un color. El color queda reservado al estado.

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--c-escritorio` · `--c-fondo` | `#ECECE7` | `#121110` | Fondo de la página. |
| `--c-superficie` | `#FAFAF7` | `#1B1A18` | Paneles, tablas, diálogos. |
| `--c-superficie-2` | `#E2E3DD` | `#26241F` | Cabecera de tabla, pista del horizonte, hover de fila. |
| `--c-ventana-barra` · `--c-ventana-borde` | `#F1F1EC` · `#C9CAC2` | `#201F1C` · `#3D3A35` | Barras de título y de estado de paneles y diálogos; marco del panel. |
| `--c-texto` · `-2` · `-3` | `#1C1A17` · `#4F4943` · `#625C55` | `#F1EDE6` · `#C9C2B8` · `#A69F95` | Principal, secundario, ayudas y rótulos (nunca menos de 13 px). |
| `--c-borde` · `--c-borde-fuerte` | `#D3D4CD` · `#7A7B74` | `#34322D` · `#827C72` | Separadores; borde de controles. |
| `--c-acento` (= `--c-tinta`) | `#1C1A17` | `#F1EDE6` | Primario, filtro elegido, destino activo. Texto sobre él: `--c-acento-texto`. |
| `--c-enlace` · `--c-foco` | `#2E4A80` | `#AEC1F0` | Enlaces y anillo de foco (azurita). |
| `--c-foco-oscuro` | `#F4EEE4` | `#F1EDE6` | Anillo de foco sobre lo oscuro (lateral, cobre sólido): el azurita no llega a 3:1 ahí. |
| `--c-velo` | `rgb(20 18 16 / .64)` | `rgb(0 0 0 / .65)` | Detrás de los diálogos (`::backdrop`). |

### 3.2 Tonos de estado: minerales

Cada tono tiene texto (`-t`), fondo (`-f`) y franja o marca (`-r`). Nombres de los minerales: malaquita, azurita, azufre, cobre, grafito. **El color nunca va solo**: cada tono lleva además una forma (rombo, triángulo, círculo, aro) y texto.

| Tono de la demo | Mineral (alias de) | Significa | Forma |
| --- | --- | --- | --- |
| `critico` | cobre (`diferencia`) | Vencido, faltante, bloqueada, novedad crítica (también la unidad fuera de servicio **por una novedad crítica**). | rombo |
| `semana` | azufre (`revisar`) | Vence en 7 días o menos; parte sin enviar; novedad abierta. | triángulo |
| `quincena` | azurita (`pendiente`) | Vence en 8 a 15 días: hay que planificar. | círculo |
| `mes` | grafito (`neutro`) | Vence en 16 a 30 días: está en el horizonte. | aro |
| `vigente` | malaquita (`ok`) | Vigente, disponible, parte enviado. | (sin forma) |

Valores claros: cobre `#8C3823` (texto y franja) sobre `#F5E1D9`; azufre `#6A5410` (texto), `#9A7B17` (franja) sobre `#F3E9C4`; azurita `#2E4A80` sobre `#E0E6F1`; grafito `#4F4943` (texto), `#7A7670` (franja) sobre `#E4E3DE`; malaquita `#1C5B47` sobre `#DAEAE2`. Los oscuros están en `tokens.css`.

Tokens propios del marco y las piezas nuevas: `--c-critico-solido` (cobre sólido: fondo de la cifra «No disponibles hoy», de las insignias y de «Con novedad»; claro `#8C3823`, oscuro `#983C27`), `--c-sobre-solido` y `--c-sobre-solido-2` (texto sobre él), `--c-patente-fondo`, `--c-patente-banda`, `--c-hoy` (línea de «Hoy» en la regla) y el grupo del lateral `--c-lat*` (oscuro en claro y en oscuro: es el «turno» de la marca).

### 3.3 Contrastes medidos

Con `npm run contraste` (`scripts/contraste.mjs`, fórmula de luminancia relativa de WCAG 2.x): **240 mediciones, 0 fallan** (25/11/2026), en claro y oscuro: texto contra cada superficie, tonos de estado (texto sobre su fondo, marca sobre la pista), foco contra cada fondo, el lateral y el cobre sólido. Si se cambia un color, se vuelve a correr; el script lee la estructura de `tokens.css` (primer `:root {` y el bloque oscuro con sangría), así que no hay que reordenarla.

### 3.4 Tipografía

Sin fuentes externas (CSP `font-src 'self'`): tres familias variables, solo el subconjunto latino, alojadas en `src/estilos/fuentes/` con su licencia (SIL OFL 1.1) y declaradas en `fuentes.css` con `font-display: swap` y una fuente de reemplazo ajustada para que no salte el diseño.

```
--t-familia: "Schibsted Grotesk", "Schibsted Grotesk Ajustada", "Helvetica Neue", Arial, sans-serif;          /* texto */
--t-familia-titulo: "Bricolage Grotesque", "Bricolage Grotesque Ajustada", "Arial Narrow", "Helvetica Neue", Arial, sans-serif; /* títulos y cifras, a 85 % de ancho */
--t-mono: "Red Hat Mono", "Red Hat Mono Ajustada", ui-monospace, "Cascadia Mono", Consolas, monospace;           /* patentes, números de documento, fechas */
```

| Token | Tamaño | Uso |
| --- | --- | --- |
| `--t-cifra-grande` | `3.5rem` | La cifra cobre de Inicio. |
| `--t-cifra` | `clamp(2.5rem, 1.9rem + 2.6vw, 3.5rem)` | Cifras secundarias. |
| `--t-h1` | `clamp(1.75rem, 1.35rem + 1.8vw, 2.5rem)` | Título de pantalla. |
| `--t-h2` · `--t-h3` | `1.375rem` (650) · `1.125rem` | Secciones y grupos. |
| `--t-cuerpo` | `1rem` | Texto general; en el parte, también los campos (16 px evita el zoom automático de iOS). |
| `--t-tabla` · `--t-chico` · `--t-rotulo` | `0.875rem` · `0.8125rem` · `0.75rem` | Celdas; etiquetas y ayudas; cabeceras y rótulos en mayúsculas (`letter-spacing: .06em`, solo ahí). |
| `--t-patente-chica` · `--t-patente-grande` | `0.875rem` · `1.625rem` | La patente (la grande, en la ficha y el parte). |

Cifras (kilómetros, litros, días, conteos, fechas en tablas): `tabular-nums` **solo en la cifra suelta o en una columna, nunca en una oración** (26/11/2026: con `tnum` esta fuente ensancha el punto, los dos puntos y la barra, y «Último registro: 59.413 km» se leía «Último registro : 59 . 413 km»); separador de miles con punto (`84.320 km`). Medida de lectura: párrafos con `max-width: 62ch`. **Todo en `rem`** (el texto al 200 % no parte palabras ni ensancha la página; sección 12).

### 3.5 Espaciado, radios, sombras

- Espaciado base 4 px: `--e-1` a `--e-8` (`.25rem` a `4rem`). Medianil lateral `--gutter`: 16 px (< 640), 24 px (640–1099), 32 px (≥ 1100). Ancho máximo del contenido: `82.5rem` (`App.svelte`); parte diario: columna de `40rem`.
- Radios: `--r-1: 4px` (etiquetas, patente) · `--r-2: 8px` (botones, campos, paneles) · `--r-3: 14px` (diálogos). **Píldora (`--r-pildora`) solo** en el chip de perfil, las pastillas de filtro, las insignias con números y el destino activo de la barra inferior.
- Borde de los controles: `--b-control: 1.5px`.
- Sombras: planas. `--s-panel` (una línea), `--s-ventana` y `--s-flotante` (diálogos y menús).
- Alturas fijas: `--alto-tactil: 2.75rem` (44 px, mínimo de todo lo que se pulsa), `--alto-segmento: 3rem` (checklist y combustible), `--alto-barra-envio: 4.5rem`, `--alto-barra: 3.25rem` y `--alto-franja: 1.625rem` (barra superior del celular), `--alto-pestanas: 4rem` (barra inferior), `--ancho-lateral: 16rem`.

### 3.6 Movimiento

`--m-rapido: 120ms; --m-medio: 220ms; --m-lento: 320ms; --m-curva: cubic-bezier(.2, .7, .2, 1);`

- Hover y foco: `--m-rapido`. Diálogo: opacidad en `--m-medio` (escritorio); hoja inferior a menos de 40 rem, que sube.
- **Transición entre pantallas** (25/11/2026; `src/componentes/movimiento.ts` y `src/estilos/base.css`): el contenido sale en 110 ms (opacidad) y el nuevo entra en 230 ms con `--m-curva`, subiendo 10 px. Usa `document.startViewTransition`, y solo cuando cambia la **pantalla** (no un filtro ni una letra del buscador). La **patente viaja** de la fila de la lista al título de la ficha, y vuelve (340 ms): el `view-transition-name` se pone por CSSOM (nunca por atributo `style`: la CSP no lo permite) y se saca al terminar. El nombre de `main` solo existe mientras dura la transición. Si hay un diálogo abierto no hay transición. Sin View Transitions (navegadores que no la tienen) `main` entra con la misma subida por CSS (`main.entra`).
- **Cuenta de la cifra cobre** de Inicio (`CifraQueCuenta.svelte`): de 0 a su valor en 650 ms, curva cúbica que frena al final, **al abrir la demo y al reiniciarla**; ninguna otra cifra se anima. Es solo lo que se ve: el valor final está siempre en un texto aparte para lectores de pantalla y lo visible es `aria-hidden`, así que no se anuncia ningún número intermedio. Un valor que cambia por una acción (renovar un documento) se muestra de una vez.
- El detalle de un punto de la regla de vencimientos entra con la misma curva (220 ms).
- Campo de km o fila recién actualizados: destello de fondo `--c-edicion` → transparente en 1200 ms, una vez. Indicador de guardado: sin animación (cambia el texto).
- **`prefers-reduced-motion: reduce`:** en `base.css` todas las transiciones y animaciones pasan a `0.01ms` y las de la transición entre pantallas, a ninguna; `movimiento.ts` no inicia la transición ni la cuenta (la cifra aparece con su valor).
- El movimiento va por CSS y por View Transitions: las directivas `transition:`, `in:`, `out:` y `animate:` de Svelte las rechaza `npm run buscar`.
- Prohibido: animaciones al desplazar, parpadeos, rebotes, esqueletos con brillo, marcas del horizonte que «caen» o aparecen con movimiento.

---

## 4. La página (marco común)

**Reescrita el 25/11/2026** (marco «Turno»: `App.svelte`, `Lateral`, `BarraSuperior`, `BarraInferior`, `Migas`, `PantallaMas`). Reemplaza a la barra superior, la barra de la aplicación y el pie de la versión anterior.

### 4.1 Escritorio (desde 64 rem): lateral oscuro y barra de migas

- **Lateral** fijo a la izquierda, de `16rem`, oscuro en claro y en oscuro. Arriba: la marca (ícono y «Control de flota») y la etiqueta «Demo con datos ficticios». En el medio, los destinos: encargado, Inicio, Movilidades, Vencimientos y Operación diaria (desplegada en Checklists y Novedades); conductor, Hoy y Mis partes. Con insignias (4.3). Abajo: «Cómo funciona», «Reiniciar demo», «Ver como» (el perfil de ahora, con un control para cambiarlo), «Volver al portafolio», la autoría («Diseño, reglas y verificación: Matías Ariel Ormeño. El código lo escribió una IA bajo su dirección») y «Más».
- El destino de la pantalla actual sale del contenido como una pestaña de fichero (corte en diagonal) y lleva además una marca de 3 px y negrita: en oscuro el recorte solo no alcanza contraste. `aria-current="page"`.
- **Barra de migas** fija arriba del contenido: las migas a la izquierda (el último tramo es la pantalla de ahora, sin enlace; los anteriores, enlaces) y la fecha a la derecha. Las pantallas del lateral llevan un solo tramo.

### 4.2 Celular y tableta (menos de 64 rem): barra superior y barra inferior

- **Barra superior** fija, en dos pisos. Fila: a la izquierda la marca (en las pantallas de la barra inferior) o «‹ Atrás» (en la ficha y el parte); a la derecha, el **chip del perfil**, que abre «Ver como». Al bajar la página, el título de la pantalla ocupa el lugar de la marca. Debajo, la franja «Demo con datos ficticios · día de la semana y fecha», siempre visible.
- **Barra inferior** (`nav aria-label="Secciones"`), de `4rem`, con el área segura del teléfono: encargado, Inicio, Movilidades, Operación, Vencimientos y Más; conductor, Hoy, Mis partes y Más. El destino actual lleva una píldora de tinta y `aria-current` (no solo color). En el parte no hay barra inferior: manda la barra de envío.

### 4.3 Insignias

Las del lateral y la barra inferior salen de las mismas cifras de Inicio y de Operación diaria (`app.centroDeAlertas`), no de un cálculo aparte: Inicio, no disponibles hoy; Vencimientos, vencidos o faltantes; Operación diaria, pendientes (con su desglose en Checklists y Novedades). Las dos primeras son cobre (críticas); las de Operación, grafito. Sin insignia si es 0. El nombre accesible de la insignia dice la cuenta con palabras («4 no disponibles hoy»); `white-space: nowrap` en la insignia y, con el texto al 200 %, la insignia baja de renglón en lugar de ensanchar la página.

### 4.4 Avisos globales

Debajo de las migas (escritorio) o de la barra superior (celular), dentro del ancho máximo, uno debajo del otro y solo los que aplican (5.18): datos viejos (D5), demo actualizada (D7), modo en memoria (D8) y cambios en otra pestaña (D9). La región `role="status"` existe siempre, vacía, para que lo que llega con la página abierta se anuncie.

### 4.5 «Más» y pie

No hay pie propio. La pantalla **Más** (`#/mas`, la ven los dos perfiles) reúne lo que antes colgaba de la barra superior: «Ver como» (el perfil de ahora y cómo cambiarlo), «La demo» («Cómo funciona», «Reiniciar demo», volver al portafolio) y el texto de autoría. En escritorio ese texto está al pie del lateral.

**Prohibido** en cualquier texto: presentar la demo como copia de un sistema existente, nombrar empleadores o clientes.


---

## 5. Componentes

Estados comunes: normal, hover (solo dentro de `@media (hover: hover)`), foco visible, activo, deshabilitado y los
propios de cada uno. **Foco visible en todo:** `outline: 2px solid var(--c-foco); outline-offset: 2px;` Nunca
`outline: none` sin reemplazo. En `@media (forced-colors: active)` el foco usa `outline-color: Highlight`.

**Única excepción (D3 (b), decidida por Matías el 19/11/2026):** `h1[tabindex="-1"]:focus { outline: none; }`. El
título recibe el foco por programa al cambiar de pantalla (2) para que el lector de pantalla anuncie dónde está, pero no
es operable (2.4.7 se aplica a lo que se opera) y el anillo se veía como un doble borde de la patente en la ficha y como
una caja en las pantallas de error. Solo el `h1`: los `h2` que reciben el foco al cerrar un diálogo (5.17) **conservan**
el anillo, porque ahí es la única pista visual de dónde quedó la persona. `auditor-accesibilidad` lo confirma en la
próxima ronda; si lo objeta, se vuelve atrás.

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
- **Botón-texto alineado al borde (C12, 22/11/2026):** relleno horizontal **0** (`padding-inline: 0`), en `Boton.svelte`
  y en `EnlaceAccion.svelte`; el alto de 44 px se conserva con `min-height: 2.75rem` y el texto ya mide más de 44 px de
  ancho. Así "Usar otra unidad" o "Descartar borrador" empiezan en la misma columna que el primario de arriba (hoy, 8 px
  más a la derecha). El anillo de foco (`outline-offset: 2px`) queda afuera del texto y no se corta (ningún contenedor
  lleva `overflow: hidden`, 5.4).
- **Un solo primario visible por zona.**
- Confirmación en dos pasos (Descartar borrador): primer clic pasa a Peligro con "Confirmar: descartar"; se restablece
  con Esc, al salir del botón o al mover el foco; doble clic en menos de 500 ms se ignora (como la Demo 1).

### 5.2 Selector de perfil ("Ver como")

- Grupo (`role="group"` con su rótulo visible "Ver como", `--t-chico` `--c-texto-2`) con **dos botones con
  `aria-pressed`** con aspecto de segmentos: "Encargado" · "Conductor…" (los puntos suspensivos, `aria-hidden`, dicen que
  abre un diálogo; desaparecen cuando el perfil Conductor ya está elegido). Descripción del grupo: "Al elegir
  «Conductor» se abre una lista para elegir quién completa el parte." (WCAG 3.2.2). **No son radios** (S1): con radios,
  las flechas cambiaban de perfil sin querer. Segmento: alto 2.75rem, borde `--c-borde-fuerte`, `--r-2` en los extremos.
  Elegido (`aria-pressed="true"`): fondo `--c-acento-suave`, texto `--c-texto` 600 y línea inferior interior de 3 px
  `--c-acento`. No elegido: `--c-superficie`, `--c-texto-2`. (El fondo `--c-acento-suave` es **solo** de este selector y
  del combustible; los filtros de 5.8 usan otro fondo: S2.)
- Al elegir "Conductor" sin persona elegida: se abre el diálogo "¿Quién completa el parte?" (5.17) y su primario es "Ver
  como este conductor". Con persona elegida, el nombre y "Cambiar" se ven como dice 4.2.
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
- Dato (`.panel-meta`): `--t-chico`, `--c-texto-2`, sin cifras tabulares (es una oración), separado del título por un divisor vertical de
  1 px × 1 rem. A < 24rem de contenedor baja a un renglón propio.
- Barra de estado: siempre en el DOM (las regiones `role="status"` tienen que existir antes del texto). Vacía:
  `min-height: 0; padding-block: 0; border-top-color: transparent;` (como Demo 1, 13.2.5). Los mensajes **no
  desaparecen solos**: se reemplazan con la siguiente acción.
- Estado activo (`:focus-within`): borde `--c-borde-fuerte` y línea superior interior de 2 px `--c-acento` en la
  barra de título. Sin hover. El marco nunca cambia de color por el estado de los datos.
- Sin `overflow: hidden` (cortaría anillos de foco).

**Variante "panel de resultado"** (S6; la usan "Revisión enviada", "La unidad no puede salir", "Parte cerrado" y el parte
en lectura, 6.5): sin barra de título; franja izquierda de 4 px del tono del resultado (`vigente` si salió bien o se
cerró, `critico` si la unidad no puede salir); el título (`h1`
de la pantalla, 600, `--t-h2`) va adentro, **en `--c-texto`**, con el ícono del tono a su izquierda (`i-check`,
`i-alerta` u `i-octogono`, 24 px, en `--tono-t`); interior con el mismo relleno que un panel; las acciones al final,
alineadas a la izquierda, primario primero.

- **Color (S3, C9 de la revisión del 22/11/2026):** el tono va en la franja y en el ícono, **nunca en el título**
  (`.titulo { color: var(--c-texto); }` y `.titulo :global(.icono) { color: var(--tono-t); }`). Franja + ícono + título
  en color es el mismo exceso que D4 sacó del protagonista.
- **Lectura (D):** sin ícono junto al título; la etiqueta "Cerrado" al lado ya dice el estado. Un parte leído días
  después no tiene que parecer un "enviado con éxito".
- **Para lectores (m2 de la auditoría, recomendado):** el `h1` lleva `aria-describedby` hacia la línea del resultado
  ("ZK 214 BD puede salir. Revisión enviada a las 06:52."), así se oye junto al título cuando recibe el foco. No se
  agrega `role="status"`: el foco ya anuncia el cambio.

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
| Puede salir | "Puede salir" — **variante texto, sin fondo** (D1 (b)) | vigente | `i-check` |
| No puede salir | "No puede salir" (+ motivo al lado, en texto) | critico | `i-vencido` |
| Conductor sin licencia vigente (L1) | "Sin licencia vigente" | critico | `i-vencido` |
| Fuera de servicio por una novedad crítica (frenos, por ejemplo) | "Fuera de servicio" (+ motivo) | critico (26/11/2026: igual de grave que un seguro vencido) | rombo (`i-octogono`) |
| Fuera de servicio por taller o decidido a mano | "Fuera de servicio" (+ motivo) | neutro (grafito; 26/11/2026: ya no se confunde con «vence en 7 días o menos») | cuadrado (`i-llave`) |
| De baja | "De baja" | neutro | `i-caja` |
| Novedad crítica | "Crítica" | critico | `i-octogono` |
| Novedad normal | "Abierta" | semana | `i-llave` |
| Novedad resuelta | "Resuelta el 16/11/2026" | neutro | `i-check` |
| Parte cerrado (`enviado`; antes "Enviado") | "Cerrado" | vigente | `i-check` |
| Parte borrador (de hoy: la revisión no se envió) | "Borrador" | neutro | `i-lapiz` |
| Parte en uso (de hoy: revisión enviada, falta el cierre) | "En uso" | quincena | `i-flecha-der` |
| Parte sin enviar (borrador de fecha pasada) | "Sin enviar" | semana | `i-lapiz` |
| Parte sin cerrar (en uso de fecha pasada) | "Sin cerrar" | semana | `i-lapiz` |
| Sin parte | "Sin parte" | semana | `i-guion` |
| Punto crítico (checklist) | "Punto crítico" | neutro | `i-octogono` |

**Variante texto (D1 (b), 19/11/2026), solo para "Puede salir":** mismo alto (1.5rem), mismo relleno (`0 .5rem`, para
que el ícono quede en la misma columna que el de las etiquetas con fondo de las filas vecinas), mismo ícono y peso;
**sin fondo y sin borde**; ícono y texto `--c-vigente-t`. Motivo: 19 de 23 filas de la flota llevaban la etiqueta verde
con fondo y formaban un "muro verde"; las etiquetas con fondo quedan para lo que hay que mirar. Contraste medido (texto
600 de 13 px, mínimo 4,5): sobre `--c-superficie` 6,62 (claro) · 9,91 (oscuro); sobre `--c-superficie-2` (hover de
fila) 5,68 · 8,94; sobre `--c-fondo` 6,06 · 10,69. Vale en todas las pantallas donde aparece "Puede salir" (flota,
ficha, inicio del conductor). "Vigente hasta…" y "Cerrado" no cambian (no fue parte de la decisión).

### 5.8 Filtros por radios con conteo (heredados)

`fieldset` con `legend` "Mostrar"; radios nativos con aspecto de segmentos (alto 2.75rem, borde `--c-borde-fuerte`,
`--r-2`), cada uno con su `span.conteo` (`--t-chico`, cifras tabulares). Elegido: fondo `--c-superficie-2`, texto
`--c-texto` 600 y línea inferior interior 3 px del `-r` del tono del grupo (crítico, semana, quincena, mes; "Todos" en
acento). **Sin** `--c-acento-suave` (S2: combinado con una línea ámbar o roja se leía como dos estados a la vez).
Contraste texto / `--c-superficie-2`: 14,20 (claro) · 12,90 (oscuro). Sin opción con 0: se
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

**Tarjetas (S9, regla de C7):** **sin rótulos visibles** ("PROYECTO", "VENCE"): los `data-etiqueta` quedan como texto
solo para lectores de pantalla. Orden de una tarjeta de vencimiento: etiqueta de estado con la fecha solo si agrega dato
("Vence en 5 días · 24/11/2026"); documento; patente + interno + modelo en **un** renglón (`[ZR 536 MZ] Int. 12 ·
Toyota Hilux`); proyecto en `--t-chico` `--c-texto-2`; botón. En las de operación, sin "Fecha" (la dice el texto).
**Alturas objetivo a 360 px:** ≤ 200 px por tarjeta de alerta con botón; ≤ 190 px por tarjeta de la flota (medido
después de C7: 172, 169 y 189; el 22/11/2026 volvieron a pasarse: 242, 213 y 216, ver tarjetas de la flota en 5.10).

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

Misma técnica de tres disposiciones. Columnas a ≥ 66rem: Unidad · Estado hoy · Próximo vencimiento · Km · Último
parte · Novedades · Proyecto y conductor.

- **Rótulo "Km" (S5, C7 del 22/11/2026):** la cabecera visible dice "Km" y el nombre completo queda para lectores:
  `<th scope="col"><span aria-hidden="true">Km</span><span class="solo-lectores">Kilometraje</span></th>`. En tarjetas,
  el `data-etiqueta` sigue "Kilometraje". Ninguna cabecera se parte dentro de una palabra: `th[scope="col"] {
  overflow-wrap: normal; word-break: normal; hyphens: manual; }` (si una no entra, que se vea en la revisión, no que
  quede "KILOMETRA / JE").

- **Unidad:** patente-enlace + "Int. 07"; línea 2 "Toyota Hilux 2022 · Camioneta".
- **Estado hoy:** etiqueta (Puede salir en su variante texto, 5.7 / No puede salir / Fuera de servicio / De baja) +
  motivo principal en línea 2 ("Seguro vencido hace 1 día"; si hay más, "y 1 motivo más"). Motivo de fuera de servicio por
  novedad crítica: si la fecha del parte es la del "Desde", no se repite: "Desde el 20/11/2026: novedad crítica en
  Frenos."; si es otra, "…, parte del {F}.".
- **Próximo vencimiento:** horizonte mínimo + "Revisión técnica · en 6 días"; si es > 30 días, "Seguro · 12/05/2027"
  en `--c-texto-2` sin horizonte; si hay vencido o faltante, la etiqueta crítica y el nombre.
- **Kilometraje:** "84.320 km", alineado a la derecha, tabular. Sin registros: "Sin registros".
- **Último parte:** "17/11/2026" + etiqueta chica si corresponde ("En uso" si es el de hoy y falta el cierre, "Sin
  enviar", "Sin cerrar", "Sin parte" de ayer). **La fecha es siempre la del parte que nombra la etiqueta** (C2 del
  22/11/2026): con "En uso", la de hoy; con "Sin cerrar" o "Sin enviar", la de ese parte; con "Sin parte", la del
  último enviado. Nunca "21/11/2026 · En uso" de una unidad que salió hoy. El orden "Último parte" del `select` usa la
  misma fecha. (Lo arma `src/lib/estado/flota.ts`.)
- **Novedades:** cifra de abiertas; si hay crítica, ícono `i-octogono` `--c-critico-t` y texto "1 (crítica)".
- **Proyecto y conductor:** si el conductor asignado no tiene licencia vigente hoy (L6), después del nombre, en el mismo
  renglón si entra: ícono `i-vencido` 14 px + "sin licencia vigente" (`--t-chico` 600 `--c-critico-t`; 7,63 / 8,14 sobre
  superficie, 6,55 / 7,34 sobre superficie-2). No cambia la etiqueta de "Estado hoy" (la unidad puede salir con otro
  conductor, A1) ni pone franja.
- **Anchos (S5, reemplaza a los de C9 del 19/11/2026, que no entraban en los 1.102 px del panel a 1280):** desde
  `@container lista (min-width: 66rem)`, `table-layout: fixed` con Unidad `11.5rem` · Estado hoy `12.5rem` · Próximo
  vencimiento `15rem` (4rem son del horizonte) · Km `5.5rem` · Último parte `6.5rem` · Novedades `6rem` · Proyecto y
  conductor el resto (unos 190 px a 1280); `white-space: nowrap` en kilometraje y fechas; horizonte mínimo siempre a la
  izquierda del texto. **Metas a 1280:** ≤ 64 px en las filas que pueden salir; ≤ 68 px si además "Último parte" lleva etiqueta
  (fecha y etiqueta apiladas; medido 65); ≤ 88 px en las que llevan un aviso: motivo en "Estado hoy" (no pueden salir,
  fuera de servicio) o "sin licencia vigente" en "Proyecto y conductor" (medido 77). Relleno horizontal de las celdas de la
  tabla completa: 8 px (desvío aceptado del 22/11/2026). Medido el 22/11/2026: 16 filas de 62, 3 de 65, una de 77; con
  motivo, 62 a 79 salvo ZU 899 QE (96, por un motivo que repetía la fecha: C3 de la etapa 7).
- **Tarjetas (< 40rem; S10, C8 del 22/11/2026):**
  - Renglón 1: patente-enlace y "Int. 17 · Peugeot Partner 2024" en **un solo `span`** con `white-space: nowrap`; si no
    entra junto a la patente, baja entero (nunca un "·" colgado al final del renglón).
  - Renglón 2: etiqueta de estado y motivo.
  - Renglón 3: próximo vencimiento, **solo si su tono no es crítico**. Si es vencido o faltante, no se muestra: ya lo
    dice "No puede salir · Seguro vencido hace 1 día". En la tabla completa y la compacta se queda (son columnas).
  - Renglón 4, km y parte: `display: flex; flex-wrap: wrap; align-items: center; column-gap: var(--e-2);` con tres
    piezas: "59.413 km", "· último parte 21/11/2026" (`white-space: nowrap`) y la etiqueta. Si no entra, baja la
    etiqueta entera; la fecha nunca se separa de "último parte".
  - Kilometraje y último parte son dos celdas: "59.413 km" se alinea arriba (`align-self: start`), en la línea de "·
    último parte 21/11/2026"; si la etiqueta no entra, baja debajo de "· último parte" (no al borde izquierdo de la
    tarjeta).
  - Meta: ≤ 180 px la tarjeta de cuatro renglones (patente con interno y modelo, estado, próximo vencimiento, km y parte;
    medidas ZYN 469 y ZK 214 BD, 172 y 174). Cada dato que suma un renglón (interno y modelo que bajan, próximo
    vencimiento en dos renglones, etiqueta del último parte, novedades) suma unos 20 a 28 px: **≤ 230 px** toda tarjeta
    cuyo texto arma la lógica (medidas ZW 827 VD y ZW 749 JE, 220). Un motivo escrito por una persona no tiene tope.
- Franja izquierda **solo** en filas que no pueden salir (crítico), fuera de servicio (crítico si es por una novedad crítica, neutro si es de taller) o de baja (neutro). Las
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
| Con dato precargado | Igual que normal (no se marca: es un valor más). Vale para el conductor y el emisor; el kilometraje al salir arranca vacío (P13) y su ayuda dice el último registro ("Último registro: 84.320 km (parte del 17/11/2026).") |
| Inválido | `aria-invalid="true"`, borde 2 px `--c-critico-r`, mensaje arriba del campo (entre etiqueta y campo, patrón GOV.UK) con `i-vencido` y texto `--c-critico-t` 600, `id` primero en `aria-describedby`. El texto escrito **se conserva**. |
| Solo lectura | Sin caja: el valor como texto `--c-texto` con su etiqueta (parte enviado, datos de la unidad). No se usan campos `disabled` para mostrar datos. |
| Deshabilitado | No se usa. Si un campo no aplica, no se muestra. |

Específicos:
- **Kilometraje:** `input type="text" inputmode="numeric" autocomplete="off"`, ancho 10ch + sufijo "km" fuera del campo.
  Al salir del campo se reformatea con punto de miles (`84320` → `84.320`). No se usa `type="number"` (las flechas y la
  rueda del mouse cambian el valor sin querer; no acepta el punto de miles).
- **Enter en los campos del parte (B5 de QA, decidido el 22/11/2026):** **no envía**, a propósito. En el paso 1 el
  kilometraje es el primer dato de once: un Enter sin querer (la tecla "Ir" del teclado numérico) abriría el resumen
  de errores con diez faltantes. Para que el teclado del celular no prometa otra cosa: `enterkeyhint="next"` en "Al
  iniciar" y "Al terminar", `enterkeyhint="done"` en litros. El primario sigue siendo `type="button"` (4.5 (2) de
  `diseno.md`). No se agrega código que mueva el foco con Enter.
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
 │ ⬣ Al enviar la revisión, la unidad queda fuera │  ← nota en tono crítico (solo puntos críticos)
 │   de servicio y no sale, hasta que el encargado│
 │   resuelva la novedad y la vuelva a poner en   │
 │   servicio.                                    │
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
- Encabezado de la sección: "2. Revisión de la unidad" + "Respondidos: 3 de 14" (`--t-chico`, se actualiza; no es
  región viva: lo anuncia la barra de envío al intentar enviar).

### 5.13 Selector de combustible

Va en el **cierre** (6.5), no en la revisión. `fieldset` "Nivel de combustible al terminar" con 5 radios como segmentos contiguos: "Reserva", "1/4", "1/2", "3/4",
"Lleno". Alto 3rem; a < 22rem de contenedor el texto de "Reserva" baja a `--t-chico`. Los segmentos **hasta el elegido**
llevan una barra inferior de 6 px `--c-acento` (se lee como un medidor); el elegido además fondo `--c-acento-suave`,
texto 600 e ícono `i-check`. El valor se lee por el radio, no por la barra.

### 5.14 Barra de envío (parte)

- A < 40rem: `position: sticky; bottom: 0;` fondo `--c-ventana-barra`, borde superior `--c-borde`, `--s-flotante`,
  alto `--alto-barra-envio`, relleno `--e-3` + `env(safe-area-inset-bottom)`. A ≥ 40rem: estática al final del
  formulario, sin sombra.
- Izquierda: estado del formulario (`--t-chico` 600): "Faltan 5 datos" (`--c-texto-2`) o "Listo para enviar" /
  "Listo para cerrar" (`--c-vigente-t` + `i-check`). **Después de un intento con errores de reglas** (K2–K4, P2, P8,
  L1; S4, C5 del 22/11/2026): "Revise N datos" (`--c-texto-2`, sin `i-check`; el mismo N que el título del resumen)
  hasta el próximo intento. Nunca "Listo para enviar" con un error en pantalla. El texto lo da `barraDeEnvio(...).texto`
  (`src/lib/dominio/formulario-parte.ts`). Derecha: primario grande **"Enviar revisión"** (paso 1) o **"Cerrar
  el parte"** (paso 2). Es `type="button"` (4.5 (2) de `diseno.md`).
- **El primario nunca se deshabilita**: si falta algo, al pulsarlo aparece el resumen de errores (5.15).
- Para que la barra no tape el campo con foco (WCAG 2.4.11): mientras el formulario está en pantalla,
  `html { scroll-padding-bottom: calc(var(--alto-barra-envio) + 1rem); }`.
- Debajo del formulario (no en la barra), **solo en el paso 1 y si ya hay borrador**: botón-texto "Descartar borrador"
  con confirmación en dos pasos (C16). En el paso 2 no hay descarte: la revisión ya se envió (P7).

### 5.15 Resumen de errores e indicador de guardado

- **Resumen de errores** (patrón GOV.UK): panel arriba del formulario, borde izquierdo 4 px `--c-critico-r`, fondo
  `--c-superficie`, `role="alert"` **no**: es un `div` con `tabindex="-1"` que recibe el foco al aparecer, con título
  `h2` "Faltan 3 datos para enviar la revisión" (paso 1) o "Faltan 2 datos para cerrar el parte" (paso 2) y una lista de
  enlaces a cada campo ("Kilometraje al iniciar", "Luces y balizas: elija una opción"), en el orden del formulario de
  ese paso (P4). Los errores de reglas (K2–K4, P2, P8 y, con el perfil Encargado, L1 en el campo Conductor, primero de la
  lista) también van acá, con el texto de la regla. Títulos completos en la sección 7.
- **Puntos de la revisión agrupados (D1, decidido por Matías el 22/11/2026):** si faltan **más de 3** puntos de la
  revisión (sección 2 del paso 1), el resumen lleva **un solo enlace** "Faltan 14 puntos de la revisión", en el lugar
  del primero de ellos (orden del formulario), que lleva al **primer punto sin responder** (foco en su primer radio).
  Con **3 o menos**, un enlace por punto ("Frenos: elija una opción"). En los dos casos, cada punto conserva su borde y
  su mensaje junto a los botones (5.12), y el título sigue contando todos los datos ("Faltan 11 datos para enviar la
  revisión"). Motivo: diez enlaces de 44 px ocupaban unos 560 px a 360 y tapaban el formulario que había que llenar.
  Solo se agrupan los puntos de la revisión; kilometraje, conductor y errores de reglas van siempre de a uno.
- **Indicador de guardado** (debajo del encabezado del parte): `i-guardado` + "Guardado en este equipo a las 14:32"
  (`--t-chico`, `--c-texto-2`). Mientras escribe: "Guardando…". Error: "No se pudo guardar en este equipo. Lo escrito
  sigue en pantalla; no cierre la pestaña." (`--c-critico-t`). Es `role="status"`, pero **solo cambia su texto cuando
  cambia de estado** (primera vez guardado, error, recuperado), no en cada guardado: no se le dicta al lector cada 500 ms.

### 5.16 Historial (ficha)

- Filtros (5.8): "Todo", "Partes", "Documentos", "Novedades", "Estado y kilometraje".
- Lista agrupada por día: `h3` "Martes 17/11/2026" (`--t-chico` 600 mayúscula inicial, `--c-texto-2`, divisor arriba).
- Evento: grilla `4rem | 1.25rem | 1fr` con `align-items: first baseline`: hora (`--t-mono`, `--c-texto-3`, "18:42") ·
  ícono del tipo (18 px) · resumen (`--t-tabla`) + autor (`--t-chico`, `--c-texto-3`, "{Nombre} (persona ficticia)"): desde
  40rem a la derecha del resumen; con menos ancho, en el renglón de la hora (C4, implementado). El `summary` de un
  `details` no agrega relleno vertical propio y su flecha queda en línea con el **primer** renglón del resumen.
  Relleno vertical del evento `--e-2`. **Meta (S8):** ≤ 64 px por evento cerrado a 1280 (medido: 60) y ≤ 100 px a 360
  (medido: 97).
- **Revisión enviada** (evento `revision-enviada`, ícono `i-parte`): una línea, sin `details`: "Revisión antes de salir
  · 84.320 km · sin novedades" / "· 1 novedad: Niveles de aceite y agua" / "· novedad crítica en frenos: la unidad no
  salió". Fuera de plazo: "(fuera de plazo)" al final.
- **Parte cerrado** (evento `parte-enviado`): es un `details`; `summary` "Parte cerrado · 132 km (84.320 → 84.452) ·
  combustible 3/4"; al abrir: kilometraje, combustible, litros, los puntos con novedad (texto completo), "8 puntos en
  orden", advertencias aceptadas (de la revisión y del cierre), y el enlace "Ver el parte completo".
- Documento corregido: "Antes / Después" en dos columnas por campo cambiado.
- **Cuántos eventos (D2 (b), 19/11/2026):** de entrada, **10 a < 40rem** y **30 desde 40rem**; el botón suma la misma
  cantidad ("Ver 10 más" / "Ver 30 más"; si quedan menos, "Ver 4 más"). El ancho se mide con `matchMedia("(min-width:
  40rem)")` **al abrir la ficha**; si después cambia el ancho de la ventana, no se ocultan eventos que ya se ven. Al
  pulsar el botón, el foco va al primer evento nuevo. Con la revisión y el cierre como eventos separados, 10 eventos son
  unos 4 o 5 días de partes.
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
| Renovar documento | Título "Renovar: Seguro de ZK 214 BD". Línea de contexto: "Actual: póliza DEMO-88-4471, venció el 17/11/2026 (hace 1 día)." Campos: Número*, Emisor (precargado con el anterior), Vence*, Emitido. Errores V10, V11. | "Guardar renovación" |
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
| Antes de enviar (parte) | Frase de entrada, que no depende de cuántos avisos haya: revisión "Antes de enviar la revisión, lea esto."; cierre "Antes de cerrar el parte, lea esto." Debajo, lista de advertencias con su explicación, en tono semana o crítico: en la **revisión**, K6; en el **cierre**, K7. La documentación de la unidad ya no es una advertencia: bloquea la revisión (P21). Nunca hay una advertencia por la licencia ni por la documentación de la unidad: las dos bloquean (L1 y P21). Foco inicial en "Volver al parte". | Revisión: "Enviar de todos modos"; cierre: "Cerrar de todos modos" (+ "Volver al parte", botón-texto) |
| ¿Quién completa el parte? | Radios con conductores ficticios: nombre en el renglón 1; en el 2, "Unidad ZK 214 BD" (`--c-texto-2`) y, si no tiene licencia vigente hoy, `i-vencido` + "Sin licencia vigente" (`--t-chico` 600 `--c-critico-t`), separados con `gap`. Sigue siendo elegible (es un punto de vista): así el visitante encuentra el caso del bloqueo. **Conductores sugeridos (M1, 22/11/2026):** los que devuelve `conductoresParaProbar` (hasta cuatro: unidad apta y sin parte hoy, documentación de la unidad vencida, unidad fuera de servicio por una novedad crítica, sin licencia vigente) van **primero**, en su propia lista; cada uno lleva un **renglón 3** con su marca ("Para probar: unidad apta y sin parte hoy", `TEXTO_CONDUCTOR_PARA_PROBAR`) en `--t-chico` 600 `--c-pendiente-t`. La marca es parte del `label` del radio, así que el lector de pantalla la dice junto al nombre y la unidad. Una línea "Los demás conductores" (`--t-chico` 600, borde superior `--c-borde-fuerte`) los separa del resto; si no hay sugeridos, no aparece. En el sugerido sin licencia no se repite `i-vencido` + "Sin licencia vigente" (la marca ya lo dice). Es un solo grupo de radios (un `fieldset`, dos `ul`); el foco inicial va al conductor elegido o, si no hay, al primer sugerido. Con 320 px y el texto al 200 % la marca baja de renglón; no se corta ninguna palabra. | "Ver como este conductor" (S1) |
| Reiniciar demo | "Se borran los cambios hechos en este navegador y se vuelve a cargar la flota de ejemplo con las fechas de hoy." | Peligro "Reiniciar demo" |
| Cómo funciona | Qué es (2 renglones); las reglas de vencimiento con **una etiqueta de ejemplo por tramo** ("Vencido o faltante", "7 días o menos", …, "Más de 30 días") en lugar de un horizonte sin datos (S5); qué hace el parte (revisión antes de salir y cierre), qué pasa con una novedad crítica y con la licencia vencida; dónde se guardan los datos; datos ficticios; "Ver como" es solo un punto de vista. Textos en la sección 7. | "Entendido" |

**Botones de "Antes de enviar" (decidido el 22/11/2026, propuesta de `redactor-ux`):** "Enviar de todos modos" /
"Cerrar de todos modos" reemplazan a "Enviar igual" / "Cerrar igual". "Igual" con el sentido de "de todos modos" es
coloquial y no se entiende igual en todos los países; la demo pide español neutro. Ancho medido sobre el peor caso: a
< 40rem el primario va a todo el ancho de la hoja (360 − 2 × 16 = 328 px) y el texto, en `1.0625rem` 600, ocupa unos
195 px: entra en un renglón con más de 100 px de sobra. Desde 40rem el pie lleva primario + "Volver al parte" en una
fila dentro de los 34rem del diálogo (unos 230 + 130 px): también entra. Con el texto al 200 %, el primario puede ir en
dos renglones (`white-space: normal`, alto mínimo sin cambios), nunca cortado.

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

**Aviso compacto de dos renglones (C10 del 22/11/2026):** el mismo componente (`Aviso.svelte`) admite una prop
`accion` (texto opcional). Con `accion`, el aviso tiene renglón 1 `span.aviso-titular` (`--t-cuerpo` 600) y renglón 2
`span.aviso-accion` (`--t-chico`). Lo usan el aviso "no puede salir" de la unidad (inicio, estados 6 y 7, y paso 1), el
bloqueo por licencia (estado 5) y "Cerrar antes" (estado 5 bis y pantalla E). La lógica entrega
el aviso ya partido en `{ titular, accion }` y la vista no corta ninguna cadena: `Aviso.svelte` recibe `texto` y `accion`
tal cual.

### 5.19 Estados vacío y cargando (piezas)

- **Vacío (S3, patrón aceptado):** dentro del panel, una caja con borde punteado de 1 px `--c-borde-fuerte`, `--r-2`,
  relleno `--e-4`, con ícono `i-guion` 24 px `--c-texto-3` + frase (`--t-cuerpo`, `--c-texto-2`). La acción, si la hay,
  va **afuera** de la caja, debajo. Igual en flota, novedades y kilometraje. Sin ilustraciones.
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

**M6 (22/11/2026): el número de la insignia se explica en la pantalla.** Bajo la línea de fecha y empresa, un segundo
párrafo (`.linea`, `--c-texto-2`) dice lo que cuenta la insignia de la pestaña: "4 alertas críticas: documentos vencidos o
faltantes y novedades críticas abiertas." (con 1: "1 alerta crítica: …"; con 0 no se muestra). Sale de
`app.alertas.resumen.criticas`, el mismo número de la insignia. Son los 3 de "Vencidos y faltantes" más la novedad crítica
abierta de "Operación diaria"; no son las "4 unidades" del protagonista (cuentan unidades, no alertas, y coinciden por azar
en el ejemplo).

**B7 (22/11/2026): sin hueco bajo «Operación diaria».** La grilla de los dos paneles superiores lleva `align-items:
start`: cada tarjeta mide lo que necesita su contenido y la de «Operación diaria» ya no se estira a la altura de «No
pueden salir hoy».

**Escritorio, 1280 px**

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ⊢ Control de flota  [DEMO CON DATOS FICTICIOS]        Cómo funciona   Reiniciar demo   ← Volver al portafolio │ 56
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Alertas ▮4 críticas] [Flota]                                         Ver como  [Encargado|Conductor]  │ 52
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Centro de alertas (h1)                                                                       │
│ Hoy es miércoles 18/11/2026 (hora de Argentina) · Logística Andina Demo S.A. · 23 unidades    │
│ 4 alertas críticas: documentos vencidos o faltantes y novedades críticas abiertas.           │
│ ┌ ⊘ No pueden salir hoy │ al 18/11/2026 ─────────┐ ┌ ☰ Operación diaria │ 5 pendientes ──────┐ │
│ │▌ 4  unidades                                    │ │ ⬣ 1  novedad crítica abierta     Ver ↓│ │
│ │▌                                                │ │                                        │ │
│ │▌ [ZK 214 BD] Int. 07  Seguro vencido hace 1 día›│ │                                        │ │
│ │▌ [ZP 088 KC] Int. 12  Falta habilitación      › │ │ ✎ 1  parte sin enviar            Ver ↓│ │
│ │▌ [ZM 772 AF] Int. 03  Fuera de servicio: frenos›│ │ – 2  unidades sin parte de ayer  Ver ↓│ │
│ │▌ [ZT 340 HN] Int. 19  En taller: embrague     › │ │ ⚒ 1  novedad abierta hace 9 días Ver ↓│ │
│ │▌ ─────────────────────────────────────────────  │ │                                        │ │
│ │▌ Conductores que no pueden manejar hoy (1)      │ │                                        │ │
│ │▌ ⊗ {Nombre} (persona ficticia) · Licencia       │ │                                        │ │
│ │▌   vencida hace 3 días · Unidad [ZB 123 CD]     │ │                                        │ │
│ │▌                                    [Renovar]   │ │                                        │ │
│ ├─────────────────────────────────────────────────┤ ├────────────────────────────────────────┤ │
│ │ Disponibles hoy: 19 de 23 unidades activas.     │ │ Así lo carga el conductor:             │ │
│ └──────────────── columnas 1–7 ───────────────────┘ │ Abrir el parte diario →  (cols 8–12)   │ │
│                                                      └────────────────────────────────────────┘ │
│ ┌ ◷ Vencimientos │ próximos 30 días · 9 ────────────────────────────────────────────────────┐ │
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
│ │ ── Partes sin enviar (1) ── … [Abrir parte]                                               │ │
│ │ ── Sin parte de ayer (2) ── … [Ver ficha]                                                 │ │
│ │ ── Novedades abiertas (1) ── … [Resolver]                                                 │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────┘ │
│ pie                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Protagonista** (panel, columnas 1–7): franja izquierda 4 px del tono (crítico si N > 0; vigente si 0). Cifra
  `--t-cifra` + "unidades" (`--t-h2`) en la misma línea base; debajo, el desglose «2 no pueden salir · 2 fuera de
  servicio» (visual, `aria-hidden`); para lectores, un solo `p`: "4 unidades no pueden salir hoy: 2 no pueden salir, 2
  fuera de servicio." Lista de hasta 6 unidades (patente-enlace, interno, primer motivo; `›` es solo visual), ordenada por prioridad;
  si hay más: "Ver las 9 en la flota" (enlace a `#/flota` con el filtro "No pueden salir" + "Fuera de servicio").
  Barra de estado fija: "Disponibles hoy: 19 de 23 unidades activas."
  **Con 0:** franja vigente, `i-check` 24 px, "Todas las unidades activas pueden salir hoy." y "Disponibles hoy: 23 de 23."
- **Color de los motivos (D4 (b), 19/11/2026):** el motivo de cada unidad va en **`--c-texto`** (16,54 claro · 14,31
  oscuro sobre superficie), no en `--c-critico-t`; el `›` en `--c-texto-3`. El rojo queda en la franja y en la cifra.
  Así "Fuera de servicio" por taller (tono neutro desde el 26/11/2026; antes, semana) deja de verse igual de grave que
  "Seguro vencido", y cuatro renglones se leen mejor.
- **Conductores que no pueden manejar hoy (L6, 19/11/2026):** solo si hay al menos uno, dentro del mismo panel, debajo
  de la lista de unidades: divisor de 1 px `--c-borde`, `h3` "Conductores que no pueden manejar hoy (1)" (`--t-h3`) y
  una fila por conductor: `i-vencido` 18 px `--c-critico-t` · nombre "{Nombre} (persona ficticia)" (`--t-tabla` 600
  `--c-texto`) · motivo en `--c-texto` ("Licencia vencida hace 3 días", "Falta cargar la licencia" o "Licencia válida
  desde el 20/11/2026") · "Unidad" + patente-enlace chica (si tiene unidad asignada) · botón secundario "Renovar" (o
  "Cargar" si falta), que abre **el mismo diálogo** de la fila de su licencia en Vencimientos (mismo `alertaId`), con
  nombre accesible "Renovar licencia de {Nombre}". Al guardar, el foco sigue 5.17 (al `h2` del panel protagonista, con
  la barra de estado "Licencia de {Nombre} renovada."). La cifra **no cambia** (cuenta unidades, A8). Para lectores, el
  `p` de la cifra suma la segunda frase: "4 unidades no pueden salir hoy. 1 conductor no puede manejar hoy." A < 40rem,
  la fila se apila: icono + nombre; motivo; unidad; botón (ancho propio, no a todo el ancho). Sin conductores: nada (ni
  el divisor ni un "0").
- **Operación diaria** (panel, columnas 8–12): una fila por tipo con cifra (tabular, 600) y texto; "Ver" lleva al
  grupo del detalle (desplazamiento suave salvo movimiento reducido; foco al `h3` del grupo). Tipos con 0 no aparecen.
  La fila de partes incompletos dice "1 parte sin enviar", "1 parte sin cerrar" o "2 partes sin enviar o sin cerrar"
  según sean borradores, partes en uso de días anteriores o ambos (P5); el grupo del detalle lleva el mismo nombre y
  cada fila su etiqueta ("Sin enviar" o "Sin cerrar") y la acción "Abrir parte".
  Con todo en 0: "Sin pendientes de operación." (vigente). Barra de estado: "Así lo carga el conductor: Abrir el parte
  diario →" (botón-texto que cambia el perfil a Conductor) con la aclaración "(cambia la vista a Conductor)" pegada al
  enlace, en el mismo renglón cuando entra, en `--t-chico` `--c-texto-2` (C13).
- **Vencimientos** (panel, 12 columnas): horizonte completo, filtros, lista-tabla (5.9). Al renovar desde una fila, la
  fila sale de la lista si deja de alertar (V6) y el foco sigue 5.17.
- **Detalle de operación** (panel, 12 columnas): misma lista-tabla con columnas Estado · Qué pasó · Unidad · Fecha ·
  Acción. Acciones: "Resolver" (novedades), "Abrir parte" (sin enviar), "Ver ficha" (sin parte de ayer).

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
││▌ Seguro vencido hace 1 día││ el motivo baja a su renglón (--c-texto, D4)
││▌ ……                        ││
││▌ ───────────────────────── ││
││▌ Conductores que no pueden ││ h3 (solo si hay)
││▌ manejar hoy (1)           ││
││▌ ⊗ {Nombre} (persona       ││
││▌   ficticia)               ││
││▌ Licencia vencida hace 3 d.││ (el texto real no se abrevia: se parte)
││▌ Unidad [ZB 123 CD]        ││
││▌ [ Renovar ]               ││
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
- Con el ejemplo del 19/11/2026 (caso C21 de `diseno.md`) los números cambian: insignia "Alertas 5", "Vencimientos ·
  12", "Vencidos y faltantes (3)"; el protagonista sigue en 4 unidades y suma 1 conductor. Los dibujos conservan los
  números anteriores. (Con el ejemplo vigente tras P21: insignia «4 críticas», 5 pendientes de operación.)

### 6.2 Flota (`#/flota`)

Jerarquía: 1) encontrar la unidad; 2) ver su estado de hoy; 3) agregar.

**Escritorio, 1280 px**

```
│ Flota (h1)                                                       [ Agregar unidad ] (secundario) │
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
- **Teléfono:** "Agregar unidad" (botón **secundario** en todos los tamaños desde el 26/11/2026) va junto al `h1` y baja debajo solo si no entra; búsqueda, `select`s y filtros apilados;
  tarjetas como en 5.10 (S10): patente-enlace + "Int. 07 · Toyota Hilux 2022" sin cortar, etiqueta de estado y motivo,
  próximo vencimiento (solo si no es crítico), "84.320 km · último parte 17/11/2026 [etiqueta]".

### 6.3 Ficha de unidad (`#/unidad/ZK214BD`)

Jerarquía: 1) qué unidad es y si puede salir (y por qué); 2) documentos; 3) novedades abiertas; 4) historial.

**Escritorio, 1280 px**

```
│ Flota / ZK 214 BD                                                       (migas: nav aria-label="Ruta") │
│ [ZK 214 BD] (h1, patente grande)   ⊗ No puede salir · Seguro vencido hace 1 día                 │
│ Interno 07 · Toyota Hilux 2022 · Camioneta                                                      │
│ Proyecto Arroyo Escondido · Conductor: Lucía Ferreyra (persona ficticia) · 84.320 km (17/11)    │
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
│ │            Lucía Ferreyra (persona ficticia)                │                                          │
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
- **Texto del primer botón según el parte (C16 del 22/11/2026, lo decide `ficha.ts`):** sin parte de hoy o con
  borrador → "Cargar parte"; con el parte de hoy **en uso** → "Cerrar el parte" (mismo enlace, que abre B); con un
  parte **anterior** en uso (regla "Cerrar antes") → "Cerrar el parte del {F}", que lleva a ese parte; con el parte de
  hoy cerrado → "Ver el parte" (lectura D). Siempre secundario.
- **Línea de datos y conductor:** "Conductor: {Nombre} (persona ficticia)"; si no tiene licencia vigente hoy (L6), a
  continuación la etiqueta chica "Sin licencia vigente" (5.7, crítico). La etiqueta de aptitud de la unidad no cambia
  por eso (A1). "Puede salir" usa la variante texto (D1).
- **Documentos (S4, implementado):** horizonte mediano de la unidad; tabla Documento · Número · Vence · Estado ·
  Acciones, **sin columna Emisor** (el emisor va en la segunda línea del número, `--t-chico` `--c-texto-2`) y, en la
  disposición compacta, **sin cabeceras visibles** (quedan para lectores). Faltantes como filas con "Falta cargar" y
  botón "Cargar". "Anteriores (N)": `details` con los reemplazados, **en una celda propia, última de la fila y a todo el
  ancho del panel**, con la sangría de la primera columna (C6): el nombre y la etiqueta de estado quedan siempre juntos.
  La grilla de escritorio lleva `align-items: start`: cada panel mide lo que tiene (C5).
- **Novedades:** filtro Abiertas/Resueltas; cada novedad: etiqueta, texto, origen ("Parte del 16/11/2026, punto
  Frenos" o "Cargada por el encargado"), fecha y "Resolver".
- **Kilometraje:** lista de los 10 últimos partes (cerrados y en uso) y correcciones (fecha, inicio → fin, recorrido);
  un parte en uso dice "84.452 → en uso" y recorrido "—" (C16: hoy la celda queda vacía; tiene que decir "—", alineado
  como los demás recorridos); uno sin salida, "84.320 → 84.320 · Sin uso"; los saltos
  aceptados con `i-alerta` tono semana; las correcciones con `i-km`.
- **Historial:** 5.16 (10 eventos de entrada a < 40rem, 30 desde 40rem).
- **Tableta:** una columna: encabezado, Documentos, Novedades, Historial, Kilometraje.
- **Teléfono:** igual que tableta; acciones del encabezado apiladas a todo el ancho; documentos en tarjetas; el
  historial con la hora encima del resumen.
- **Error:** patente inexistente → `h1` "No se encontró la unidad", "No hay ninguna unidad con la patente ZZ 999 ZZ."
  y enlace "Ir a la flota".

### 6.4 Inicio del conductor (`#/conductor`)

Reescrita el 19/11/2026 (parte previo al uso y licencia que bloquea). Jerarquía: 1) qué tiene que hacer hoy con su
unidad (revisarla antes de salir, cerrar el parte o nada); 2) lo que quedó pendiente; 3) su licencia; 4) sus últimos
partes.

```
┌──────────────────────────────┐ 360 px (a ≥ 40rem, la misma columna de 40rem centrada)
│ barras (perfil: Conductor)   │
│ {Nombre} (persona ficticia)  │
│ Cambiar                      │ renglón propio a < 48rem (4.2)
├──────────────────────────────┤
│ Parte diario (h1)            │
│ ┌ Hoy, miércoles 18/11/2026 ┐│ panel
│ │ [ZK 214 BD] Int. 07 ·      ││
│ │ Toyota Hilux 2022          ││
│ │ Último registro: 84.320 km ││
│ │ (parte del 17/11/2026).    ││
│ │ Antes de salir, revise la  ││ --t-chico --c-texto-2
│ │ unidad y envíe la revisión.││
│ │ [  Empezar la revisión   ] ││ primario grande, ancho completo
│ │ Usar otra unidad           ││ botón-texto → select de unidades en servicio
│ └────────────────────────────┘│
│ ┌ Pendientes ───────────────┐│ solo si hay
│ │ ZR 536 MZ: el parte del    ││
│ │ 16/11/2026 está empezado y ││
│ │ sin enviar. [Continuarlo]  ││
│ └────────────────────────────┘│
│ ┌ Su licencia ──────────────┐│ solo si vence en 30 días o menos (y no bloquea)
│ │ △ Vence en 12 días         ││
│ │   (30/11/2026)             ││
│ └────────────────────────────┘│
│ ┌ Mis últimos partes ───────┐│
│ │ 17/11/2026 ZK 214 BD 132 km││ enlaces al parte en lectura (solo cerrados)
│ └────────────────────────────┘│
└──────────────────────────────┘
```

**Panel "Hoy": estados, en el orden en que se deciden** (`diseno.md` 17.5; el primero que aplica gana). El bloque de la
unidad (patente, interno, modelo, último registro) se ve en todos menos en el 1.

| # | Situación | Qué se ve | Primario | Otros |
| --- | --- | --- | --- | --- |
| 1 | Sin unidad asignada (o de baja) | `select` (solo unidades en servicio) con la primera opción "Elija una unidad" (C14: "Elija otra unidad" queda solo para "Usar otra unidad" y para la unidad fuera de servicio) | "Empezar la revisión", cuando elige una | — |
| 2 | El parte de hoy está **cerrado** | Etiqueta "Cerrado a las 18:42" (vigente, `i-check`). **Sin salida:** en su lugar, aviso crítico compacto "Revisión de las 06:52: novedad crítica en frenos. La unidad no salió." | — | "Ver el parte" (secundario); "Usar otra unidad" |
| 3 | El parte de hoy está **en uso** | Etiqueta "En uso desde las 06:52" (quincena, `i-flecha-der`) + "Al terminar la jornada, cierre el parte con el kilometraje y el combustible." (`--t-chico` `--c-texto-2`) | "Cerrar el parte" | "Usar otra unidad" |
| 4 | Unidad fuera de servicio (sin parte de hoy o con borrador) | Aviso semana "ZK 214 BD está fuera de servicio desde el 13/11/2026 (En taller: cambio de embrague). No hace falta parte." | — | "Usar otra unidad" |
| 5 | **Su licencia no ampara hoy (L1)** | Aviso crítico de bloqueo (abajo) | — (ninguno) | Si hay borrador: "Tiene una revisión empezada: se conserva." + "Descartar borrador" (botón-texto, dos pasos). **No** se ofrece "Usar otra unidad" (no cambia nada) |
| 5 bis | **Su unidad tiene un parte anterior sin cerrar ("Cerrar antes", 22/11/2026)** (sin parte de hoy o con borrador) | Aviso semana "Cerrar antes" (abajo) | "Cerrar el parte anterior" → el cierre (B) de ese parte | Si hay borrador de hoy: "Tiene una revisión empezada: se conserva." + "Descartar borrador" (botón-texto, dos pasos); "Usar otra unidad" (otra unidad no está trabada) |
| 6 | Borrador de hoy | "Tiene una revisión empezada: faltan 5 datos." (o "… y está lista para enviar.") | "Continuar la revisión" | "Descartar borrador" (botón-texto, dos pasos); "Usar otra unidad" |
| 7 | Sin parte de hoy | "Antes de salir, revise la unidad y envíe la revisión." (`p.nota-estado`, `--t-chico` `--c-texto-2`, **arriba del primario**; C3: hoy la lógica lo trae en `hoyEstado.texto` y la vista no lo muestra) | "Empezar la revisión" | "Usar otra unidad" |

Se llama "5 bis" y no 6 para no renumerar los estados 6 y 7, que ya se citan así en el código, en las revisiones y en
el resto de este documento.

- **Aviso de bloqueo por licencia (estado 5):** caja con borde izquierdo de 4 px `--c-critico-r`, fondo `--c-critico-f`,
  `--r-2`, relleno `--e-3`, ícono `i-vencido` 18 px `--c-critico-t`. Renglón 1 en `--t-cuerpo` 600 `--c-texto`: "No
  puede manejar hoy: su licencia de conducir venció el 15/11/2026." (variantes en la sección 7). Renglón 2 en `--t-chico`
  `--c-texto`: "Avise al encargado: cuando cargue una licencia vigente, podrá empezar la revisión." Contraste del texto
  sobre `--c-critico-f`: 13,68 (claro) · 12,99 (oscuro). No es `role="alert"`: al llegar a la pantalla el foco va al
  `h1` y el aviso es lo primero que se lee dentro del panel. Si el encargado renueva la licencia en otra pestaña, el
  aviso D9 avisa; al actualizar, el panel pasa al estado 6 o 7.
- **Aviso "Cerrar antes" (estado 5 bis, regla del 22/11/2026: mientras una unidad tenga un parte anterior sin cerrar, no
  se empieza la revisión de una fecha posterior):** misma anatomía que el de la licencia (aviso compacto de 5.18, caja con
  borde izquierdo de 4 px, `--r-2`, relleno `--e-3`, ícono 18 px, dos renglones en `--c-texto`), pero en **tono
  semana**: no es una prohibición sobre la persona sino una tarea pendiente que se resuelve en el acto, y el ámbar es el
  mismo de la etiqueta "Sin cerrar" (5.7). Borde `--c-semana-r`, fondo `--c-semana-f`, ícono `i-lapiz` en
  `--c-semana-t`. Renglón 1 (`--t-cuerpo` 600): "{P}: el parte del {dia F} quedó sin cerrar." Renglón 2 (`--t-chico`):
  "Ciérrelo primero; después podrá empezar la revisión de hoy." **A diferencia del bloqueo por licencia, hay primario**,
  debajo de la caja: "Cerrar el parte anterior" (grande, ancho completo a < 40rem), enlace con aspecto de botón a
  `#/parte/{P}/{F anterior}`, que muestra B con el foco en su `h1`. Nombre accesible: el texto visible basta (el
  renglón 1 está justo arriba y es lo que lee el lector antes). Si hay más de un parte anterior sin cerrar (solo con
  datos viejos), el aviso nombra **el más antiguo**. No es `role="alert"` (igual que el de la licencia). Contraste
  medido (`scripts/contraste.mjs`, alias `revisar`): texto / semana-f 14,39 (claro) · 12,08 (oscuro); ícono semana-t /
  semana-f 6,80 · 8,86; borde semana-r / superficie 3,65 · 7,36.

  ```
  ┌ Hoy, domingo 22/11/2026 ───┐ 360 px
  │ [ZK 214 BD] Int. 07 ·      │
  │ Toyota Hilux 2022          │
  │ Último registro: 59.413 km │
  │ (parte del 21/11/2026).    │
  │ ▌✎ ZK 214 BD: el parte del │ caja semana; renglón 1 en 600
  │ ▌  sábado 21/11/2026 quedó │
  │ ▌  sin cerrar.             │
  │ ▌  Ciérrelo primero;       │ renglón 2 en --t-chico
  │ ▌  después podrá empezar la│
  │ ▌  revisión de hoy.        │
  │ [ Cerrar el parte anterior]│ primario grande
  │ Usar otra unidad           │ botón-texto
  └────────────────────────────┘
  ```

  Al volver del cierre (C3 → "Volver al inicio"), el panel pasa al estado 7 (o 6 si había borrador). En este estado,
  "Pendientes" **no repite** ese mismo parte (como "Su licencia" en el estado 5); los demás pendientes siguen.
- **Estado "no puede salir" por la documentación de la unidad (P21, 22/11/2026; estado `no-puede-salir` de la lógica):** el
  conductor cuya unidad tiene un documento obligatorio vencido o faltante **no puede empezar la revisión**: no hay primario
  (igual que el bloqueo por licencia, estado 5). Aviso compacto de 5.18 en tono crítico, con el texto de la regla: "El seguro
  de ZK 214 BD venció el 21/11/2026. La unidad no puede salir. Avise al encargado." Sigue "Usar otra unidad" (otra unidad no está
  trabada) y "Mis últimos partes". Si abre la ruta del parte, ve la pantalla E con el mismo texto. Ya no existe el aviso con
  primario "Avise al encargado antes de usarla" (P9, reemplazada por P21).
- **Pendientes** (ordenados por fecha): borrador de un día anterior ("ZK 214 BD: el parte del 17/11/2026 está empezado y
  sin enviar." + "Continuarlo"); día sin parte ("ZK 214 BD: no se envió el parte de ayer (17/11/2026)." + "Cargarlo");
  **parte en uso de un día anterior** ("ZK 214 BD: el parte del 17/11/2026 quedó sin cerrar." + "Cerrarlo"). El nombre
  accesible del botón empieza con su texto visible: "Cerrarlo. ZK 214 BD: el parte del 17/11/2026 quedó sin cerrar."
  (2.5.3). Un pendiente de un día en que el conductor no tenía licencia lleva igual a su parte, que muestra el bloqueo.
- **Su licencia:** como antes (solo si vence en 30 días o menos, está vencida o falta), **salvo en el estado 5**, donde
  no se muestra (el aviso del panel "Hoy" ya lo dice).
- **Mis últimos partes:** los cinco **cerrados** más nuevos; uno sin salida dice "Sin uso" en lugar del recorrido.
  **Fila (`.fila-parte`) con texto agrandado (1.4.4, M1 de la auditoría del 22/11/2026):** hoy, a 360 px con el texto
  al 200 %, el recorrido queda encima de la patente. La fila pasa a `display: grid; grid-template-columns: auto auto
  1fr; grid-template-areas: "fecha patente recorrido"; column-gap: var(--e-3); align-items: center;` y, con la lista
  como contenedor (`container: partes / inline-size` en el `ul`) y `@container partes (max-width: 17rem)`, a
  `grid-template-columns: auto 1fr; grid-template-areas: "fecha patente" "recorrido recorrido";` con `row-gap:
  var(--e-1)`. El umbral está en `rem` a propósito: en una consulta de contenedor el `rem` sigue al tamaño de letra de la
  raíz, así que a 360 px con texto normal (lista de unos 296 px, más que 17rem = 272 px) la fila queda en un renglón, y
  con texto al 200 % (17rem = 544 px) se apila. `white-space: nowrap`
  solo en la patente; fecha y recorrido pueden partirse. Meta: sin superposición a 360 px con `html { font-size: 200%
  }` y fila de 44 px o más (es un enlace).
- En el ejemplo: con la conductora asignada a ZK 214 BD se ve el estado 7 con el aviso de la unidad (caso C01); con el
  conductor del caso C21 se ve el estado 5. Quien cambia de vista ve en el acto cómo se cruzan las dos vistas.

### 6.5 Parte diario (`#/parte/ZK214BD/2026-11-18`)

Reescrita el 19/11/2026. El parte tiene **dos pasos** (`diseno.md` 17.2): la **revisión antes de salir** (kilometraje
inicial, los 14 puntos y "Otra novedad") y el **cierre** (kilometraje final y combustible). Jerarquía: 1) qué paso es,
de qué unidad y qué día; 2) lo que falta; 3) enviar la revisión o cerrar.

**Qué se muestra en la ruta** (la decide el estado: `diseno.md` 17.5):

| Estado del parte de esa unidad y fecha | Perfil Conductor | Perfil Encargado |
| --- | --- | --- |
| Sin parte o borrador | **A. Revisión** (paso 1). Si su licencia no ampara la fecha del parte (L1) → **E** con el texto de la licencia. | **A**, con el `select` Conductor. |
| En uso | **B. Cierre** (paso 2). | **B**. |
| Cerrado (incluido sin salida) | **D. Lectura**. | **D**. |
| Sin parte o borrador, y la unidad fuera de servicio o de baja, o la fecha fuera de P2 | **E** con el texto de la regla. | **E**. |
| En uso y la unidad de baja | **E** (A7), sin descarte. | **E**. |
| Sin parte o borrador, y la unidad tiene un parte **anterior** en uso (regla "Cerrar antes", 22/11/2026) | **E "Cerrar antes"** (abajo), con primario hacia ese parte. Si además su licencia no ampara la fecha, gana L1. | **E "Cerrar antes"**. |
| Recién enviado | **C1** "Revisión enviada" · **C2** "La unidad no puede salir" · **C3** "Parte cerrado". | Igual. |

**Encabezado de A y B** (de arriba abajo, sin panel):

1. Enlace de vuelta y rótulo de la demo en un renglón (C1): "← Parte diario" (Conductor) o "← Ficha de ZK 214 BD"
   (Encargado).
2. `h1` del paso: **"Revisión antes de salir"** (A) o **"Cierre de la jornada"** (B), `--t-h1` (22 px a < 30rem, C1). Es
   también el título de la pestaña del navegador.
3. Renglón de contexto, `--t-chico` 600 `--c-texto-2`: "Parte del miércoles 18/11/2026 · paso 1 de 2" (o "· paso 2 de
   2"). Un texto, no un indicador gráfico de pasos: en el teléfono no hay lugar y una oración se lee igual con lector de
   pantalla.
4. Patente **grande** (5.5; S7 del 22/11/2026: así quedó implementada y es lo que pide 5.5 para el parte; "chica" era
   una contradicción de este documento) + "Int. 07 · Toyota Hilux 2022" a su derecha (sin el tipo). A < 30rem, interno
   y modelo **apilados** a la derecha de la patente, en dos renglones `--t-chico`; desde 30rem, en uno.
5. Solo en A: aviso compacto "no puede salir" de la unidad, si corresponde (como en 6.4).
6. Indicador de guardado (5.15).

Meta verificable (perfil Conductor, 360 × 780, demo recién cargada): el borde superior de la etiqueta "Al iniciar" (A)
y de "Al terminar" (B) queda en `y ≤ 600` px, y el borde inferior de su campo, al menos 16 px por encima del borde
superior de la barra de envío. Medido el 22/11/2026: A 590 / 683 / 707; B 585 / 677 / 707. Con el perfil Encargado
el primer campo es "Conductor" y "Al iniciar" queda debajo de la barra: es lo esperado. El `h1` del paso es más corto que el
anterior ("Parte del miércoles 18/11/2026" ocupaba dos renglones a 360 px), así que el renglón de contexto no suma altura.

**A. Revisión antes de salir — teléfono, 360 px (pantalla principal de esta vista)**

```
┌──────────────────────────────┐
│ ← Parte diario [DEMO CON …]  │
│ Revisión antes de salir      │ h1
│ Parte del miércoles          │ --t-chico 600 --c-texto-2
│ 18/11/2026 · paso 1 de 2     │
│ [ZK 214 BD] Int. 07          │ patente grande (S7)
│             Toyota Hilux 2022│ interno y modelo apilados a < 30rem
│ ⎙ Guardado en este equipo    │ indicador (5.15)
│   a las 06:41                │
│ Los campos con * son …       │
│ (resumen de errores, si hay) │
│ ─ 1. Kilometraje al salir ── │ h2
│ Al iniciar *                 │
│ Último registro: 84.320 km   │ ayuda
│ (parte del 17/11/2026).      │
│ [ 84.320            ] km     │
│ ─ 2. Revisión de la unidad ─ │ h2
│   Respondidos: 3 de 14       │
│ Frenos                       │
│ [⬣ Punto crítico]            │ debajo del nombre a < 40rem (C12)
│ [✓ En orden ][! Con novedad] │ 48 px
│ ─────────────────────────────│
│ …                            │
│ ─ 3. Otra novedad (opcional)─│ h2
│ [ textarea                 ] │
│ [ ] Impide usar la unidad    │
│ Descartar borrador           │ botón-texto (solo si ya hay borrador)
├──────────────────────────────┤
│ Faltan 11 datos  [  Enviar   │ barra fija (5.14)
│                   revisión ] │
└──────────────────────────────┘
```

- Secciones con `h2` (4.5 (1) de `diseno.md`): "1. Kilometraje al salir" (solo "Al iniciar"), "2. Revisión de la
  unidad" (5.12) y "3. Otra novedad (opcional)". **No** hay "Al terminar", recorrido ni combustible en este paso.
- Nota de los puntos críticos con "Con novedad" (5.12): "Al enviar la revisión, la unidad queda fuera de servicio y no
  sale, hasta que el encargado resuelva la novedad y la vuelva a poner en servicio."
- **Perfil Encargado:** primer campo de la sección 1, `select` "Conductor *" (activos), cada opción "{Nombre} · {patente
  asignada}" y, si su licencia no ampara la fecha del parte, **"{Nombre} (sin licencia vigente) · {patente}"** (S6, C13
  del 22/11/2026: el dato va antes que la patente; a 360 el campo mide 294 px y cortaba "(sin licencia" justo en la
  palabra que explica el error; si algo se corta, que sea la patente). El asignado se
  precarga solo si su licencia ampara la fecha (P13); si no, "Elija quién conduce". Si se elige uno sin licencia, el
  error llega al pulsar "Enviar revisión": mensaje sobre el campo (5.11, inválido) y primero en el resumen, con el texto
  de L1 en tercera persona (sección 7). No se valida al elegir (los errores aparecen al enviar, como el resto).
- Barra: "Faltan N datos" / "Listo para enviar" / "Revise N datos" (tras un intento con errores de reglas, 5.14) +
  **"Enviar revisión"**.
- Resumen de errores con los puntos agrupados si faltan más de 3 (D1, 5.15).

**B. Cierre de la jornada — teléfono, 360 px**

```
┌──────────────────────────────┐
│ ← Parte diario [DEMO CON …]  │
│ Cierre de la jornada         │ h1
│ Parte del miércoles          │
│ 18/11/2026 · paso 2 de 2     │
│ [ZK 214 BD] Int. 07          │
│             Toyota Hilux 2022│
│ ⎙ Guardado en este equipo …  │
│ Los campos con * son         │ nota corta (desvío 3)
│ obligatorios.                │
│ ┌──────────────────────────┐ │ resumen de la revisión: caja --c-fondo,
│ │ Revisión enviada a las   │ │ borde 1 px --c-borde, --r-2, relleno --e-3
│ │ 06:52 · Al iniciar:      │ │
│ │ 84.320 km · Sin novedades│ │
│ │ ▸ Ver la revisión        │ │ details: los 14 puntos en lectura
│ └──────────────────────────┘ │
│ (resumen de errores, si hay) │
│ ─ 1. Kilometraje al terminar │ h2
│ Al terminar *                │
│ Lo que marca el tablero al   │ ayuda
│ terminar la jornada.         │
│ [                   ] km     │
│ Recorrido: —                 │ <output>
│ ─ 2. Combustible ─────────── │ h2
│ Nivel de combustible al      │ legend (5.13)
│ terminar *                   │
│ [Reserva][1/4][1/2][3/4][Lleno]│
│ Combustible cargado en la    │
│ jornada                      │
│ Déjelo vacío si no cargó.    │
│ [        ] litros            │
├──────────────────────────────┤
│ Faltan 2 datos   [ Cerrar el │ barra fija (5.14)
│                    parte   ] │
└──────────────────────────────┘
```

- **Resumen de la revisión:** no es un panel ni un campo: es lo que ya se envió y no cambia (P7). Una línea `--t-chico`
  `--c-texto` ("Revisión enviada a las 06:52 · Al iniciar: 84.320 km · Sin novedades" o "· 1 novedad: Niveles de aceite y
  agua"; con el perfil Encargado agrega "· Conductor: {Nombre}") y un `details` "Ver la revisión" con los puntos como en
  la lectura (D). Sin hora legible: "Revisión enviada · …" (no se inventa).
- Sin "Descartar borrador" (P7). Sin `select` de conductor (lo fijó la revisión).
- **Nota de obligatorios** (desvío 3 del maquetador, aceptado el 22/11/2026): en el paso 2, solo "Los campos con * son
  obligatorios." (la frase de los puntos no aplica: no hay puntos). A < 32rem de contenedor, el relleno de sección es
  más chico, como quedó implementado.
- **"Al iniciar" solo desde 30rem (S8):** en el teléfono no se repite, porque ya está en el resumen de la revisión.
- **Tableta y escritorio:** a ≥ 30rem de contenedor, "Al iniciar" (como texto: "84.320 km") y "Al terminar" (campo) en
  dos columnas; el recorrido debajo de las dos. **Alineación (C11 del 22/11/2026):** el rótulo de "Al iniciar" usa el
  estilo de la etiqueta de campo (5.11: `--t-chico` 600 `--c-texto`), no el de `Dato`; la fila `.km` lleva `align-items:
  end`, y el valor de "Al iniciar" `min-height: 3rem; display: flex; align-items: center;`, así queda en la misma línea
  que el texto escrito en "Al terminar" (hoy, 10 px más arriba, a la altura de la ayuda). "Recorrido": rótulo
  `--t-chico` `--c-texto-2` y valor 600 `--c-texto` en `--t-cuerpo` (hoy todo en 600 compite con el `h2`).
- Barra: "Faltan N datos" / "Listo para cerrar" / "Revise N datos" + **"Cerrar el parte"**.

**C. Resultados** (estado de la pantalla después de enviar; variante "panel de resultado" de 5.4; el `h1` recibe el foco
y da el título de la pestaña):

- **C1 · "Revisión enviada"** (franja vigente, `i-check`). Línea: "ZK 214 BD puede salir. Revisión enviada a las
  06:52." (fuera de plazo: "Revisión del 17/11/2026 enviada el 18/11/2026 a las 08:10 (fuera de plazo)."). `dl`: "Al
  iniciar" "84.320 km" · "Novedades" "Sin novedades" (o "1 normal: Niveles de aceite y agua", con la nota "El encargado
  la ve en el centro de alertas.") · "Avisos aceptados" (si hubo, en pasado). Párrafo `--c-texto-2`: "Al terminar la
  jornada, vuelva a este parte para cerrarlo con el kilometraje y el combustible." (parte de un día pasado: "Falta cerrar este
  parte con el kilometraje y el combustible de esa jornada.") Acciones: **parte de hoy** →
  "Volver al inicio" (primario) + "Completar el cierre ahora" (botón-texto); **parte de un día pasado** → "Completar el
  cierre" (primario) + "Volver al inicio" (botón-texto). "Completar el cierre" muestra B en la misma ruta, con el foco en
  su `h1`.
  - **Eliminado el 22/11/2026 (P21):** la variante "con documentación vencida aceptada" (franja semana, "Sale con
    documentación vencida: quedó registrado.") ya no existe: una revisión de una unidad con documentación vencida no se
    envía, así que C1 siempre dice "puede salir" y siempre es de franja vigente.
  - **"Avisos aceptados"** (C3 y D; C6): solo los de kilómetros (K6 y K7), un renglón por aviso, en tono semana: "132 km
    sin registrar desde el último parte" · "Recorrido del día inusualmente largo: 640 km". Los renglones por documento
    vencido ("Se envió de todos modos: quedó registrado.") se eliminaron con P21.
- **C2 · "La unidad no puede salir"** (franja crítica, `i-octogono`). Línea: "Revisión enviada a las 06:52 con una
  novedad crítica: Frenos." (con dos: "con 2 novedades críticas: Frenos, Dirección."). Aviso semana (5.18, sin acción):
  "ZK 214 BD quedó fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio. El parte
  quedó cerrado sin uso." Párrafo: "Si tiene que salir, elija otra unidad en Hoy." Primario: "Volver a Hoy". (Desde el
  26/11/2026, con el perfil Conductor en todos los paneles C1 a C3 el botón dice "Volver a Hoy", el nombre de su pantalla
  de entrada; con el perfil Encargado siguen "Volver al inicio" y, en C2, "…elija otra unidad desde el inicio.")
- **C3 · "Parte cerrado"** (franja vigente, `i-check`). Línea: "ZK 214 BD, 18/11/2026: revisión a las 06:52, cierre a las
  18:42." `dl`: Recorrido "132 km (84.320 → 84.452)" · Combustible "3/4" · Combustible cargado "Cargó 45,5 litros" / "No
  cargó" · Novedades · Avisos aceptados (de la revisión y del cierre). Primario: "Volver al inicio". "Imprimir o guardar
  en PDF" (botón-texto) recién con el paso 6.1 (un botón que no hace nada no se muestra).

**D. Lectura** (parte cerrado, en cualquier fecha y estado de la unidad): variante "panel de resultado" con franja
vigente; `h1` "Parte del miércoles 18/11/2026" (en `--c-texto`, **sin ícono**: S3) + etiqueta "Cerrado"; `dl` con Revisión "06:52", Cierre "18:42", y los
mismos datos de C3; los puntos "En orden" agrupados en una línea ("8 puntos en orden: …") y los que tienen novedad, con
su texto. **Sin salida:** Recorrido "Sin uso: la unidad no salió"; Combustible "No se registró: la unidad no salió"; sin
la fila "Combustible cargado"; sin la fila "Cierre".

**E. "No se puede cargar este parte"** (como 4.5 (6) de `diseno.md`): `h1` "No se puede cargar este parte", el texto de
la regla (P8, P2, A7, **L1** o **P21**), "Descartar borrador" (botón-texto, dos pasos) si hay borrador, y el enlace "Ir a Parte
diario" (Conductor) o "Ir a Centro de alertas" (Encargado). Texto de L1 para el conductor, en segunda persona:
"Para el 18/11/2026 no tiene licencia de conducir vigente (venció el 15/11/2026). Sin licencia vigente no se puede
enviar la revisión ni salir con la unidad." **P21:** "El seguro de ZK 214 BD venció el 21/11/2026. La unidad no puede salir.
Avise al encargado." (conductor) o "… Renueve la documentación antes de enviar la revisión." (encargado); gana L1 si la
licencia también bloquea. Si la fecha es hoy y hay borrador, además: "El borrador se conserva: cuando
el encargado cargue una licencia vigente, podrá enviarlo."

**E "Cerrar antes"** (regla del 22/11/2026: la unidad tiene un parte anterior en uso y se abre una fecha posterior sin
parte o con borrador; los dos perfiles). Misma pantalla E, con el aviso de 6.4 (estado 5 bis) en lugar del párrafo de la
regla:

```
┌──────────────────────────────┐ 360 px
│ ← Parte diario [DEMO CON …]  │
│ No se puede cargar este      │ h1 (igual que toda E)
│ parte                        │
│ ▌✎ ZK 214 BD: el parte del   │ aviso compacto, tono semana (6.4)
│ ▌  sábado 21/11/2026 quedó   │
│ ▌  sin cerrar.               │
│ ▌  Ciérrelo primero; después │
│ ▌  se puede empezar la       │
│ ▌  revisión del 22/11/2026.  │
│ [ Cerrar el parte anterior ] │ primario grande → #/parte/ZK214BD/2026-11-21 (B)
│ Descartar borrador           │ botón-texto, dos pasos, solo si hay borrador
│ Ir a Parte diario            │ botón-texto (Encargado: "Ir a Centro de alertas")
└──────────────────────────────┘
```

- Renglón 2 impersonal ("se puede", no "podrá"): sirve igual para el conductor y para el encargado, y nombra la fecha
  que se quiso abrir. Si hay borrador: "Tiene una revisión empezada para el {F}: se conserva." debajo de la caja.
- A ≥ 40rem, misma columna de 40rem; el primario no ocupa todo el ancho.
- Esta E **sí** tiene primario (las otras no): la regla tiene un remedio inmediato y es de la misma persona.
- Foco al `h1` al llegar. Al cerrar el parte anterior (C3 → "Volver al inicio" o volver con el navegador) la fecha
  posterior ya se puede abrir.

**Enviar (A y B):**

1. Faltan datos o falla una regla → resumen de errores arriba con el foco (5.15); errores en cada campo.
2. Completo y con advertencias → diálogo "Antes de enviar" (5.17): en A, K6; en B, K7. Primario "Enviar de todos
   modos" o "Cerrar de todos modos".
3. Completo sin advertencias, o aceptadas → se envía (primario en estado cargando, "Enviando…" o "Cerrando…", si pasa
   de 200 ms) y la pantalla pasa a C1, C2 o C3.
4. Error al guardar (P12, D10) → mensaje en el resumen de errores; todo lo escrito sigue.

- **Recorrido** (B): `<output for="km-fin">` se actualiza al salir del campo: "132 km", "Sin uso" (0) o "—". Si K2
  falla, el error va en "Al terminar".
- **Dirección mal escrita:** una fecha que no se puede leer lleva a "Página no encontrada" (4.5 (6) de `diseno.md`), con
  "Ir a Parte diario" (Conductor) o "Ir a Centro de alertas" (Encargado). Una fecha futura o anterior a 7 días, sin
  parte → E con el texto de P2 y el mismo enlace.

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
| Parte, punto crítico | "Al enviar la revisión, la unidad queda fuera de servicio y no sale, hasta que el encargado resuelva la novedad y la vuelva a poner en servicio." |
| Parte, documentación vencida (P21, error y pantalla E) | "El seguro de ZK 214 BD venció el 21/11/2026. La unidad no puede salir. Avise al encargado." (conductor) · "… Renueve la documentación antes de enviar la revisión." (encargado). Ya no hay diálogo con "Puede enviar la revisión de todos modos". |
| Reinicio | "Se borran los cambios hechos en este navegador y se vuelve a cargar la flota de ejemplo con las fechas de hoy." |

Fechas siempre `dd/mm/aaaa`; con día de la semana en encabezados. Kilómetros con punto de miles y "km". Nunca "ud." ni
"vos"; nunca "¡Ups!".

**Parte previo al uso y licencia (19/11/2026).** Textos exactos para `textos.ts` (dominio y estado) y `textos-marco.ts`
(presentación); `redactor-ux` los revisa antes de maquetar, sin cambiar lo que dicen. `{F}` = fecha del parte
`dd/mm/aaaa`; `{dia F}` = con día de la semana; `{P}` = patente con espacios; `{Nombre}` = nombre del conductor ficticio.

| Dónde | Texto |
| --- | --- |
| `h1` del paso 1 / del paso 2 | "Revisión antes de salir" / "Cierre de la jornada" |
| Renglón de contexto | "Parte del {dia F} · paso 1 de 2" / "· paso 2 de 2" |
| Secciones del paso 1 | "1. Kilometraje al salir", "2. Revisión de la unidad", "3. Otra novedad (opcional)" |
| Secciones del paso 2 | "1. Kilometraje al terminar", "2. Combustible" |
| Ayuda de "Al terminar" | "Lo que marca el tablero al terminar la jornada." (reemplaza "Complételo al final del día.") |
| Litros (etiqueta / ayuda) | "Combustible cargado en la jornada" / "Déjelo vacío si no cargó." |
| Barra de envío | "Enviar revisión" · "Cerrar el parte" · "Listo para enviar" · "Listo para cerrar" · "Faltan N datos" · "Revise N datos" (tras un intento con errores de reglas, 5.14) |
| Primario cargando | "Enviando…" · "Cerrando…" |
| Resumen de errores (títulos) | "Faltan N datos para enviar la revisión" · "Revise N datos para enviar la revisión" · "No se pudo enviar la revisión" · "Faltan N datos para cerrar el parte" · "Revise N datos para cerrar el parte" · "No se pudo cerrar el parte" |
| Resumen de errores, puntos agrupados (D1, más de 3 sin responder) | "Faltan {N} puntos de la revisión" (enlace al primero sin responder). Con 3 o menos: "{Punto}: elija una opción" por punto |
| Faltante de "Al iniciar" / "Al terminar" | "Escriba el kilometraje al iniciar." / "Escriba el kilometraje al terminar." (sin cambios) |
| Resumen de la revisión (paso 2) | "Revisión enviada a las 06:52 · Al iniciar: 84.320 km · Sin novedades" · "· 1 novedad: Niveles de aceite y agua" · "· Conductor: {Nombre}" (perfil Encargado) · "Ver la revisión" |
| C1 | `h1` "Revisión enviada" · "{P} puede salir. Revisión enviada a las 06:52." · fuera de plazo: "Revisión del {F} enviada el 18/11/2026 a las 08:10 (fuera de plazo)." · "El encargado la ve en el centro de alertas." · "Al terminar la jornada, vuelva a este parte para cerrarlo con el kilometraje y el combustible." (parte de un día pasado: "Falta cerrar este parte con el kilometraje y el combustible de esa jornada.") · "Volver al inicio" · "Completar el cierre ahora" · "Completar el cierre" |
| C2 | `h1` "La unidad no puede salir" · "Revisión enviada a las 06:52 con una novedad crítica: Frenos." · "… con 2 novedades críticas: Frenos, Dirección." · "{P} quedó fuera de servicio hasta que el encargado resuelva la novedad y la vuelva a poner en servicio. El parte quedó cerrado sin uso." · "Si tiene que salir, elija otra unidad en Hoy." (Encargado: "…desde el inicio.") |
| C3 | `h1` "Parte cerrado" · "{P}, {F}: revisión a las 06:52, cierre a las 18:42." |
| Lectura, sin salida | "Sin uso: la unidad no salió" (recorrido) · "No se registró: la unidad no salió" (combustible) |
| Diálogo "Antes de enviar" | Frase de entrada: "Antes de enviar la revisión, lea esto." (revisión) · "Antes de cerrar el parte, lea esto." (cierre). Primario "Enviar de todos modos" (revisión) · "Cerrar de todos modos" (cierre) · "Volver al parte" |
| "Avisos aceptados" (C3, D; solo kilómetros) | "132 km sin registrar desde el último parte" · "Recorrido del día inusualmente largo: 640 km" |
| Inicio, sin unidad (estado 1) | Primera opción del `select`: "Elija una unidad" ("Elija otra unidad" solo con "Usar otra unidad" o la unidad fuera de servicio) |
| Inicio, "Cerrar antes" (estado 5 bis) | Renglón 1: "{P}: el parte del {dia F} quedó sin cerrar." · Renglón 2: "Ciérrelo primero; después podrá empezar la revisión de hoy." · primario "Cerrar el parte anterior" · con borrador: "Tiene una revisión empezada: se conserva." |
| Parte, pantalla E "Cerrar antes" (los dos perfiles) | `h1` "No se puede cargar este parte" · Renglón 1: "{P}: el parte del {dia F} quedó sin cerrar." · Renglón 2: "Ciérrelo primero; después se puede empezar la revisión del {F2}." · primario "Cerrar el parte anterior" · con borrador: "Tiene una revisión empezada para el {F2}: se conserva." · Ficha: "Cerrar el parte del {F}" |
| Inicio, panel "Hoy" | "Antes de salir, revise la unidad y envíe la revisión." · "Empezar la revisión" · "Tiene una revisión empezada: faltan N datos." · "Tiene una revisión empezada y está lista para enviar." · "Continuar la revisión" · "En uso desde las 06:52" · "Al terminar la jornada, cierre el parte con el kilometraje y el combustible." · "Cerrar el parte" · "Cerrado a las 18:42" · "Ver el parte" · "Revisión de las 06:52: novedad crítica en frenos. La unidad no salió." |
| Inicio, bloqueo (L1, segunda persona) | Renglón 1: vencida "No puede manejar hoy: su licencia de conducir venció el 15/11/2026." · faltante "No puede manejar hoy: no tiene una licencia de conducir cargada." · posterior "No puede manejar hoy: su licencia nueva vale desde el 20/11/2026." Renglón 2: "Avise al encargado: cuando cargue una licencia vigente, podrá empezar la revisión." Con borrador: "Tiene una revisión empezada: se conserva." |
| Pendientes | "{P}: el parte del {F} quedó sin cerrar." · "Cerrarlo" (los de borrador y sin parte, sin cambios) |
| Parte, pantalla E por licencia (segunda persona) | "Para el {F} no tiene licencia de conducir vigente ({detalle}). Sin licencia vigente no se puede enviar la revisión ni salir con la unidad." con {detalle} = "venció el 15/11/2026" · "no hay ninguna cargada" · "la nueva vale desde el 20/11/2026". Si la fecha es hoy y hay borrador: "El borrador se conserva: cuando el encargado cargue una licencia vigente, podrá enviarlo." |
| Error de dominio L1 (tercera persona; campo Conductor del encargado) | vencida "{Nombre} no tiene licencia vigente para el {F}: venció el 15/11/2026. Elija otro conductor." · faltante "{Nombre} no tiene licencia de conducir cargada. Elija otro conductor." · posterior "{Nombre} no tiene licencia vigente para el {F}: la nueva vale desde el 20/11/2026. Elija otro conductor." |
| Otros errores de dominio nuevos | `revision-ya-enviada`: "La revisión ya se envió: no se puede modificar." · `parte-sin-revision`: "Primero envíe la revisión antes de salir." |
| Opción del `select` Conductor | "{Nombre} · {P}" · sin licencia: "{Nombre} (sin licencia vigente) · {P}" (S6, C13) |
| Marca de nombres inventados (D2, toda la demo) | "{Nombre} (persona ficticia)": barra del perfil, autor en el historial, ficha, protagonista. Las empresas siguen "(ficticia)" |
| Marca de conductor (flota, ficha, diálogo "¿Quién completa el parte?") | "Sin licencia vigente" (etiqueta en la ficha y en el diálogo; en la flota, en minúscula a continuación del nombre: "sin licencia vigente") |
| Protagonista, conductores | `h3` "Conductores que no pueden manejar hoy (N)" · motivo "Licencia vencida hace 3 días" / "hace 1 día" · "Falta cargar la licencia" · "Licencia válida desde el 20/11/2026" · "Unidad" · "Renovar" / "Cargar" · nombre accesible "Renovar licencia de {Nombre}" · para lectores, después de la cifra: "1 conductor no puede manejar hoy." / "2 conductores no pueden manejar hoy." · barra de estado al guardar: "Licencia de {Nombre} renovada." / "cargada." |
| Operación diaria (fila y grupo) | "1 parte sin enviar" · "1 parte sin cerrar" · "N partes sin enviar o sin cerrar" · grupo "Partes sin enviar (N)" · "Partes sin cerrar (N)" · "Partes sin enviar o sin cerrar (N)" |
| Alerta de parte en uso de un día anterior | "Parte del {F} sin cerrar (salió con L. Ferreyra)" |
| Historial | "Revisión antes de salir · 84.320 km · sin novedades" · "· 1 novedad: {punto}" · "· novedad crítica en {punto}: la unidad no salió" · "(fuera de plazo)" · "Parte cerrado · 132 km (84.320 → 84.452) · combustible 3/4" · "Ver 10 más" / "Ver 30 más" |
| Ficha, kilometraje | "84.452 → en uso" · "Sin uso" |
| Cómo funciona, regla "Vencido o faltante" | "El documento venció o, si es obligatorio, falta cargarlo. Si es de la unidad, la unidad figura como «No puede salir». Si es la licencia del conductor, no puede enviar la revisión ni salir con ninguna unidad." |
| Cómo funciona, "El parte diario" | "Está pensado para usarse desde el celular y tiene dos pasos. Antes de salir, el conductor carga el kilometraje y controla 14 puntos de revisión de la unidad. Una novedad en un punto crítico, o marcada «Impide usar la unidad», deja la unidad fuera de servicio en ese momento, y la unidad no sale hasta que el encargado resuelva la novedad. Al terminar la jornada, cierra el parte con el kilometraje final y el combustible. Sin licencia de conducir vigente no puede enviar la revisión." |

---

## 8. Estados por pantalla

| Pantalla | Cargando | Vacío | Sin datos | Error |
| --- | --- | --- | --- | --- |
| Toda la app | Arranque (5.19) | — | — | IndexedDB falla → modo en memoria (aviso D8). Falla grave al iniciar → `h1` "No se pudo iniciar la demo", "Recargue la página. Si el problema sigue, pruebe con otro navegador." + botón "Recargar la página" (sin "Reiniciar demo": no arregla nada desde ahí). |
| Centro de alertas | — (los datos ya están en memoria) | Protagonista en 0 (vigente); Operación "Sin pendientes de operación."; Horizonte "Nada vence en los próximos 30 días"; lista "No hay vencimientos en los próximos 30 días." | — | Error al guardar desde un diálogo: en el diálogo (no se cierra). |
| Flota | — | Por filtro: "Ninguna unidad coincide…" + "Quitar filtros". Sin unidades (no debería pasar): "Todavía no hay unidades." + "Agregar unidad". | — | — |
| Ficha | — | Novedades: "Sin novedades abiertas." Kilometraje: "Todavía no hay partes de esta unidad." Documentos: solo faltantes (filas "Falta cargar"). | Historial con solo "Alta de la unidad". | Patente inexistente (6.3). Unidad de baja: aviso neutro, sin acciones. |
| Inicio del conductor | — | "Mis últimos partes": "Todavía no envió partes." | Sin unidad asignada: `select`. | Unidad fuera de servicio: aviso (6.4, estado 4). **Licencia sin vigencia: aviso de bloqueo, sin primario (6.4, estado 5).** Parte anterior sin cerrar: aviso "Cerrar antes" con primario (6.4, estado 5 bis). |
| Parte | Envío: "Enviando…" (revisión) o "Cerrando…" (cierre) | — | Unidad sin km previo: ayuda "Es el primer registro de esta unidad." | Reglas (resumen de errores); guardado (indicador en error); pantalla E (P8, P2, A7, "Cerrar antes" y, con el perfil Conductor, L1); dirección mal escrita (6.5). |

---

## 9. Accesibilidad (WCAG 2.2 AA como piso)

- **Puntos de referencia:** `header`, `nav` (Secciones; Ruta en la ficha), `main`, `footer`. Un `h1` por pantalla; `h2`
  por panel; `h3` por grupo.
- **Teclado:** todo se opera con teclado; orden de tabulación = orden visual; radios con flechas; Esc cierra diálogos y
  el menú "Más". Enlace "Ir al contenido" visible al recibir foco.
- **Foco visible y no tapado (2.4.7, 2.4.11):** anillo de 2 px en todo lo operable (el `h1` que recibe el foco por
  programa no lo dibuja: D3 (b), sección 5); `scroll-padding-top` no hace falta (nada fijo arriba);
  `scroll-padding-bottom` con la barra de envío (5.14).
- **Tamaño de objetivos (2.5.8):** mínimo 44 × 44 en todo lo que se pulsa (la norma pide 24; se usa 44 por el uso con
  guantes); 48 en el checklist y el combustible.
- **Entrada redundante (3.3.7):** el parte precarga conductor y unidad (P13); el emisor de un documento renovado se
  precarga. El km de inicio **no** se precarga (26/11/2026): es una lectura nueva del tablero, no un dato ya ingresado
  en el mismo proceso; el campo arranca vacío y su ayuda dice el último registro.
- **Ayuda consistente (3.2.6):** "Cómo funciona" siempre en el mismo lugar (barra superior o menú "Más").
- **Errores (3.3.1, 3.3.3):** texto que dice qué pasó y cómo arreglarlo; asociado al campo; resumen con enlaces; nunca
  desaparece solo.
- **Estado (4.1.3):** regiones `role="status"` para resultados de filtros, mensajes de paneles y guardado (con la regla
  de no repetir de 5.15).
- **Contraste (1.4.3, 1.4.11):** tabla 3.3. Se vuelve a medir lo maquetado.
- **Uso del color (1.4.1):** etiqueta = color + ícono de forma distinta + texto; horizonte con conteos en texto.
- **Reflujo y texto (1.4.10, 1.4.12):** a 320 px de ancho y con zoom de 400 %, sin desplazamiento horizontal (salvo
  ninguna tabla: pasan a tarjetas). Espaciado de texto aumentado sin cortes.
- **Texto agrandado (1.4.4; auditoría del 22/11/2026):** a 360 px con el texto al 200 % (`html { font-size: 200% }`,
  que es lo que hace el ajuste de letra del navegador) no hay superposiciones ni desplazamiento horizontal. Dos
  correcciones: **M1** "Mis últimos partes" pasa a dos renglones (6.4) y **m1** la cabecera común se acomoda en varias
  líneas con la etiqueta de la demo partible (4.1). Una pantalla que hoy cumple 1.4.10 no puede romperse con el texto
  grande.
- **Resultado con su línea (4.1.3, m2, recomendado):** `aria-describedby` del `h1` del panel de resultado hacia su
  línea (5.4).
- **Lectores de pantalla:** tablas con `th` y `scope`; en tarjetas, roles explícitos; la patente-enlace dice "Ficha de
  ZK 214 BD"; el horizonte es `role="img"` con su resumen; la cifra protagonista es una frase.
- **Modo de colores forzados:** foco, tramos del horizonte y bordes de patente con colores del sistema (5.5, 5.6).
- **Movimiento:** `prefers-reduced-motion` respetado (3.6).
- **Idioma:** `<html lang="es">`.

---

## 10. Lo que NO hay que hacer

- Grilla de tarjetas por unidad tipo semáforo, "bento", más de una cifra protagonista por pantalla (Inicio tiene una, la cobre, y cuatro secundarias que llevan a su lista), medidores circulares, mapas,
  camiones ilustrados, íconos de vehículos en color, emojis.
- Imitar la patente oficial (banda azul, escudo, leyendas) o cualquier marca de organismo o empresa real.
- Gradientes, vidrio esmerilado, violeta, brillos, sombras grandes, mayúsculas fuera de rótulos y cabeceras. Píldoras solo donde dice 3.5 (chip de perfil, pastillas de filtro, insignias, destino activo de la barra inferior).
- Fondos de color por fila (la franja alcanza); franja verde en las filas que están bien.
- **Botón "Marcar todo en orden" en el checklist**: fomenta completar sin mirar, que es justo el problema del papel.
- Deshabilitar "Enviar parte" mientras falten datos; mensajes de error que desaparecen solos; avisos tipo *toast* (lo que pasó se dice en la barra de estado del panel o en la región `role="status"`).
- Anunciar cada autoguardado al lector de pantalla.
- Animar cifras **salvo la cobre de Inicio al abrir y al reiniciar** (3.6), animaciones al desplazar, esqueletos con brillo, marcas del horizonte que aparecen con movimiento, transiciones de Svelte (`transition:`, `in:`, `out:`, `animate:`), movimiento sin `prefers-reduced-motion`, y anunciar a un lector de pantalla los números intermedios de una cuenta.
- `min-width` en tablas o desplazamiento horizontal de la página a cualquier ancho.
- Información solo en `title` o solo al pasar el mouse (la regla de vencimientos muestra la patente o el nombre junto al punto solo donde entra, pero lo mismo está en el nombre accesible del punto, en el detalle al elegirlo y en la leyenda; no hay *tooltips*).
- Atributo `style` en el marcado, `{@html}`, fuentes, íconos o scripts de un CDN.
- Calcular "hoy" con la hora del equipo o con un desfase fijo.
- Presentar la demo como copia de un sistema existente, nombrar empleadores o clientes, usar nombres de proyectos
  mineros reales.
- Botones visibles que no hacen nada o que no aplican (si no aplica, no se muestra).
- **Parte (19/11/2026):** mostrarle al conductor sin licencia vigente el formulario de la revisión (llenaría catorce puntos
  para nada); ofrecer "Enviar de todos modos" o cualquier advertencia aceptable por la licencia (L1 bloquea); deshabilitar el
  botón en lugar de explicar el bloqueo; pedir kilometraje final o combustible en la revisión, o checklist en el cierre;
  ofrecer "Descartar" en un parte en uso; dibujar un indicador de pasos gráfico (alcanza con "paso 1 de 2"); contar a
  los conductores en la cifra del protagonista (cuenta unidades); poner franja o etiqueta "Bloqueada" en una unidad
  porque su conductor no tiene licencia (puede salir con otro).
- Etiqueta con fondo para "Disponible" (D1: variante texto) y motivos del protagonista en rojo (D4: `--c-texto`).
- **Etapa 6 (22/11/2026):** título del panel de resultado en el color del tono (va en `--c-texto`, 5.4); "puede salir"
  en C1 cuando se aceptó documentación vencida (eliminado por P21); una fecha en "Último parte" que no es la del parte que nombra la
  etiqueta; cabeceras de tabla partidas dentro de una palabra; diez enlaces de puntos sin responder en el resumen
  (D1: se agrupan); "(ficticia)" o "(ficticio)" sueltos junto a un nombre (D2: "(persona ficticia)"); "fuera de
  término"; "Enviar igual"; el aviso "Cerrar antes" en rojo o sin primario (es una tarea, no un bloqueo); empezar la
  revisión de una fecha con un parte anterior de la misma unidad sin cerrar; que Enter en un campo del parte envíe.

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
  Esc → perfil Conductor → revisión: enviar vacía (resumen con foco) → completar → advertencia → "Enviar de todos modos" →
  "Revisión enviada" → "Completar el cierre ahora" → cierre vacío (resumen) → completar → "Cerrar el parte" → "Parte
  cerrado". Otra vuelta con "Frenos: con novedad" → "La unidad no puede salir" → inicio con la unidad fuera de servicio.
  Otra con el conductor del caso C21 → estado 5 del inicio (sin primario) → su parte por dirección → pantalla E → como
  encargado, "Renovar" desde el protagonista → volver al conductor → estado 7.
- Celular real (o emulado con táctil): la revisión y el cierre con el pulgar; la barra de envío no tapa campos; el
  teclado numérico aparece en km y litros; recargar la página a mitad de la revisión y a mitad del cierre y encontrar lo
  escrito.
- Recorrido "Cerrar antes": con el perfil Conductor y un parte anterior en uso → inicio en el estado 5 bis → "Cerrar el
  parte anterior" → cierre → C3 → "Volver al inicio" → estado 7. Con el perfil Encargado, abrir la fecha posterior por
  dirección → E "Cerrar antes" → primario → B.
- Metas medidas a 360 × 780: "Al iniciar" (paso 1) y "Al terminar" (paso 2) con `top ≤ 600` px y el campo 16 px por encima
  de la barra (6.5); evento cerrado del historial ≤ 100 px; tarjetas de alerta ≤ 200 px (5.9) y de la flota ≤ 180 / 230 px
  (5.10). A 1280: filas de la flota ≤ 64 / 68 / 88 px (5.10).
- Zoom 200 % y 400 %; **texto al 200 % a 360 px** (`html { font-size: 200% }`: sin desplazamiento horizontal ni
  superposiciones, 4.1 y 6.4 "Mis últimos partes"); espaciado de texto aumentado; `prefers-reduced-motion`; colores
  forzados (Windows, contraste alto).
  Con el texto al 200 % a 360 px no alcanza con `scrollWidth`: ningún bloque de texto de más de 6 caracteres puede
  medir menos de 3em de ancho (eso es una palabra partida letra por letra) ni salir de su panel. Regla de disposición:
  toda fila con una columna fija en `rem` (horizonte mínimo, rótulo, botón con ícono) pasa a una sola columna con
  `@container (max-width: 17rem)`, el mismo corte de "Mis últimos partes" y de las tarjetas.
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

Decididas por Matías el 19/11/2026 (revisión visual del paso 5.3, informe de revisión interno (no publicado)), todas con la opción (b):

| # | Pregunta | Decisión | Dónde quedó |
| --- | --- | --- | --- |
| D1 | "Puede salir": ¿etiqueta verde o texto? | Texto con `i-check` en `--c-vigente-t`, sin fondo. | 5.7, 5.10, 6.3 |
| D2 | ¿Cuántos eventos muestra el historial de entrada? | 10 a < 40rem y 30 desde 40rem. | 5.16, 6.3 |
| D3 | ¿Anillo de foco en el `h1` después de navegar? | Sin anillo en `h1[tabindex="-1"]` (con el visto bueno pendiente de `auditor-accesibilidad`). | 2, 5, 9 |
| D4 | Motivos del protagonista en rojo | Motivo en `--c-texto`; el rojo queda en la franja y en la cifra. | 6.1 |

Decididas el 22/11/2026 (revisión de la etapa 6, informe de revisión interno (no publicado)):

| # | Pregunta | Decisión | Dónde quedó |
| --- | --- | --- | --- |
| D1 | ¿Un enlace por punto sin responder en el resumen de errores? | Matías: agrupar con más de 3 ("Faltan 14 puntos de la revisión", lleva al primero); uno por punto con 3 o menos. | 5.15, 6.5, 7 |
| D2 | Marca de los nombres inventados | Matías: "(persona ficticia)" en toda la demo. | 4.2, 5.16, 6.1, 6.3, 6.4, 7 |
| — | "fuera de término" | Matías: "fuera de plazo" en todos los textos. | 5.16, 6.5, 7 |
| — | Regla "Cerrar antes" | Matías (la lógica la implementa el programador). Vista: estado 5 bis del inicio y E "Cerrar antes", tono semana, con primario. | 6.3, 6.4, 6.5, 7, 8, 12 |
| — | Desvíos 1, 3 y 4 del maquetador | Matías, como los juzgó `disenador-ui`: "controla 14 puntos de revisión", nota corta en el paso 2, frase de "Antes de enviar" que no depende del número de avisos. | 5.17, 6.5, 7 |
| — | "Enviar igual" / "Cerrar igual" | `disenador-ui`, sobre la propuesta de `redactor-ux`: "Enviar de todos modos" / "Cerrar de todos modos" (entran a 360 px). | 5.17, 6.5, 7 |
| — | Enter en los campos del parte (B5 de QA) | `disenador-ui`: no envía; `enterkeyhint` para el teclado del celular. | 5.11 |

---

## 14. Cambios del 19/11/2026 y del 22/11/2026 — vista: resumen y tareas del maquetador

> Es el historial de dos tandas de trabajo anteriores al porte «tipo app». Los componentes que nombra `PantallaAlertas`, `BarraApp` y `SelectorPerfil` hoy son los del mapa de la nota del 25/11/2026 (al principio de este documento); las líneas y las medidas de las tareas son las de entonces.

### 14.1 Qué cambió y dónde está

| Tema | Secciones | Lo esencial |
| --- | --- | --- |
| Parte en dos pasos (revisión antes de salir y cierre) | 1, 5.12 a 5.15, 5.17, 6.4, 6.5, 7, 8 | Pantallas A (revisión), B (cierre), C1 a C3 (resultados), D (lectura), E (no disponible). El `h1` dice el paso; un renglón dice "paso 1 de 2". |
| Licencia que bloquea | 5.7, 5.17, 6.1, 6.3, 6.4 (estado 5), 6.5 (E y `select` del encargado), 7, 10 | El conductor sin licencia vigente ve un aviso sin primario; el encargado lo ve en el protagonista con "Renovar". |
| D1 "Puede salir" sin fondo | 5.7, 5.10, 6.3 | Variante texto de la etiqueta. |
| D2 historial 10 / 30 | 5.16, 6.3 | `matchMedia` al abrir la ficha; "Ver 10 más". |
| D3 sin anillo en el `h1` | 2, 5, 9 | Solo `h1[tabindex="-1"]`. |
| D4 motivos en `--c-texto` | 6.1 | Rojo solo en franja y cifra. |
| S1 selector "Ver como" | 4.2, 5.2, 5.17 | Botones con `aria-pressed`, debajo de la navegación a < 40rem, "Ver como este conductor". Ya implementado: solo documentación. |
| S2 filtros | 5.8, 5.2 | Fondo `--c-superficie-2` + línea del tono. Ya implementado. |
| S3 vacío | 5.19 | Caja punteada con `i-guion`; acción afuera. Ya implementado. |
| S4 documentos | 6.3 | Sin columna Emisor; sin cabeceras en compacta. Ya implementado. |
| S5 Cómo funciona | 5.17, 7 | Una etiqueta de ejemplo por tramo. Ya implementado; cambian los textos del parte y de la licencia. |
| S6 panel de resultado | 5.4, 6.5 | Variante sin barra de título. Ya implementado para "Parte enviado"; se suma a C1, C2 y C3. |
| S7 "Parte diario" | 4.2, 6.5 | La pestaña ya dice "Parte diario" en el código (`textos-marco.ts`). |
| S8 historial | 5.16 | Metas de alto + cantidad de D2. |
| S9 tarjetas | 5.9 | Sin rótulos visibles; alturas objetivo. Ya implementado. |

### 14.2 Tareas del maquetador (en orden; después de que el programador entregue los tipos de `src/componentes/tipos.ts`)

1. **D1, D3, D4** (no dependen del programador): variante texto de "Puede salir" en `Etiqueta.svelte` (prop de variante) y
   su uso en la flota, la ficha y el inicio; `h1[tabindex="-1"]:focus { outline: none; }` en `src/estilos/base.css`;
   motivos del protagonista en `--c-texto` y `›` en `--c-texto-3` en `PantallaAlertas.svelte`. Sumar los pares nuevos a
   `scripts/contraste.mjs` (vigente-t sobre superficie, superficie-2 y fondo; texto sobre crítico-f) y correr
   `npm run contraste`.
2. **D2** en `FichaHistorial.svelte` (y quien lo monte, `PantallaFicha.svelte`): leer `matchMedia("(min-width: 40rem)")`
   una vez al abrir la ficha y pasar el paso (10 o 30); texto del botón según el paso; foco al primer evento nuevo.
   Evento `revision-enviada` en una línea, sin `details`.
3. **Etiquetas nuevas** en `Etiqueta.svelte`: "Cerrado", "En uso" (`i-flecha-der`, quincena), "Sin cerrar", "Sin licencia
   vigente". Verificar que `i-flecha-der` del sprite (`index.html`) se lea a 14 px; si no, ajustarlo.
4. **Inicio del conductor** (`PantallaConductor.svelte`): los 7 estados del panel "Hoy" (tabla de 6.4) con sus textos, el
   aviso de bloqueo (caja crítica de dos renglones), el pendiente "Cerrarlo" y "Su licencia" oculto en el estado 5.
5. **Parte, paso 1** (`ParteFormulario.svelte`, o partirlo en `ParteRevision.svelte` y `ParteCierre.svelte` si queda más
   simple): encabezado nuevo (`h1` del paso + renglón de contexto), sección 1 solo con "Al iniciar", sección 3 "Otra
   novedad", barra "Enviar revisión", sufijo del `select` Conductor del encargado. Medir "Al iniciar" a 360 × 780.
6. **Parte, paso 2**: resumen de la revisión (caja `--c-fondo` con `details` "Ver la revisión"), "Al terminar" con
   recorrido, combustible (`SelectorCombustible.svelte`, sin cambios de forma) y litros con la etiqueta nueva, barra
   "Cerrar el parte", sin "Descartar". Dos columnas desde 30rem de contenedor. Medir "Al terminar" a 360 × 780.
7. **Resultados** (`ParteEnviado.svelte` como panel de resultado de 5.4, o un componente por resultado): C1 con las dos
   variantes de acciones (hoy / día pasado), C2 con franja crítica y aviso semana, C3, y la lectura D con las filas
   Revisión y Cierre y el caso sin salida. Foco al `h1` en cada uno.
8. **Pantalla E** (`PantallaParte.svelte`): el texto de L1 en segunda persona y "Descartar borrador" si hay borrador.
9. **Diálogos**: "Antes de enviar" con "Enviar igual" / "Cerrar igual" (`DialogoAntesDeEnviar.svelte`); "¿Quién completa
   el parte?" con la marca "Sin licencia vigente" en el renglón 2 (`DialogoConductor.svelte`).
10. **Centro de alertas** (`PantallaAlertas.svelte`): bloque "Conductores que no pueden manejar hoy" dentro del
    protagonista (1280 y 360), con "Renovar" que abre el diálogo de la fila de la licencia y deja el foco en el `h2` del
    panel al guardar; frase para lectores después de la cifra; textos de la fila y del grupo de partes incompletos.
11. **Flota y ficha** (`PantallaFlota.svelte`, `ListaTabla.svelte` si hace falta, `FichaEncabezado.svelte`,
    `FichaKilometraje.svelte`): "sin licencia vigente" junto al conductor; "En uso" y "Sin cerrar" en "Último parte";
    "84.452 → en uso" y "Sin uso" en el kilometraje.
12. **Textos de presentación** (`src/componentes/textos-marco.ts`): `TEXTO_COMO_FUNCIONA.parte` y la regla "Vencido o
    faltante" (sección 7). Los demás textos de la sección 7 viven en `src/lib/dominio/textos.ts` (programador).
13. **Muestras** (`src/muestras/Muestras.svelte`): las etiquetas nuevas, la variante texto y el aviso de bloqueo, en claro
    y oscuro.
14. **Verificación** (sección 12): recorridos nuevos con teclado, 320/360/768/1280 en claro y oscuro, consola y CSP con
    `npm run build` + `npm run servir`, `npm run check`, `npm run contraste`, `npm run buscar`. Después: `qa-destructor`,
    `auditor-accesibilidad` (que confirme D3) y `disenador-ui` contra este documento.

### 14.3 Correcciones de la etapa 6: tareas del maquetador (22/11/2026)

Salen de la revisión visual (C1 a C16), de la auditoría de accesibilidad (M1, m1, m2) y de lo de presentación del QA
(B1, B2, B5), todos en informes de revisión internos (no publicados), y de las decisiones de Matías del 22/11. Donde algo de 14.2 contradiga esta lista,
manda esta. Marcas: **[solo M]** se hace ya; **[espera P]** necesita un dato o un texto que entrega el programador en
`src/lib/` (hasta entonces se maqueta con el dato simulado en `Muestras.svelte` y se conecta después). Los textos que
arma `src/lib/dominio/textos.ts` los cambia el programador; si al conectar difieren de la sección 7, **mandan los de la
sección 7**: el maquetador los ajusta y lo anota en `docs/registro.md`.

**Bloque 1: no dependen de la lógica [solo M]**

1. **Textos de presentación** (`src/componentes/textos-marco.ts`; D2, desvíos 1 y 4, "fuera de plazo", botones):
   - `conductorElegido` y `conductorFicticio`: `` `${nombre} (persona ficticia)` ``; en `Muestras.svelte`, "Lucía
     Ferreyra (persona ficticia)". Actualizar los comentarios que citan "(ficticia)" (`BarraApp`, `ParteEncabezado`,
     `SelectorPerfil`).
   - `TEXTO_COMO_FUNCIONA.parte`: "… carga el kilometraje y controla 14 puntos de revisión de la unidad. …" (el resto
     igual, sección 7).
   - `antesDeEnviar.introRevision`: "Antes de enviar la revisión, lea esto."; `introCierre`: "Antes de cerrar el
     parte, lea esto."; `enviarIgual`: "Enviar de todos modos"; `cerrarIgual`: "Cerrar de todos modos" (se pueden
     renombrar las claves a `enviarDeTodosModos` / `cerrarDeTodosModos`, y los tests que las citen).
   - `historial.fueraDeTermino` (línea ~243): "Enviado fuera de plazo." (la clave, si se renombra, `fueraDePlazo`).
   - Nueva `elegirUna: "Elija una unidad"` (tarea 9).
2. **Botón-texto alineado** (C12, 5.1): `Boton.svelte` y `EnlaceAccion.svelte`, variante `texto`: `padding-inline: 0`
   con `min-height: 2.75rem`. Medir que "Usar otra unidad" empiece en la misma `x` que el primario y que el anillo de
   foco no se corte.
3. **Aviso compacto** (C10, 5.18): `Aviso.svelte` con prop `accion` (renglón 1 `span.aviso-titular` 600; renglón 2
   `span.aviso-accion` `--t-chico`). Sin cortar cadenas en la vista (el aviso llega como `{ titular, accion }`) y usar el aviso compacto en
   `PantallaConductor.svelte` (líneas ~91–93, aviso "no puede salir" de los estados 6 y 7).
4. **Inicio, estado 7** (C3, 6.4): `PantallaConductor.svelte`, rama `sin-parte` (~95): `<p class="nota-estado">
   {inicio.hoyEstado.texto}</p>` antes de `div.accion-principal`.
5. **"Descartar borrador" como botón-texto** (C4, 6.4 y 6.5 E): `variante="texto"` en `BotonConfirmar` de
   `PantallaConductor.svelte` (~102 y ~130) y de `PantallaParte.svelte` (~125).
6. **Panel de resultado** (C9 y m2, 5.4): `ParteEnviado.svelte`: `.titulo { color: var(--c-texto); }` y
   `.titulo :global(.icono) { color: var(--tono-t); }`; en la lectura D, sin ícono junto al título; `aria-describedby`
   del `h1` al `id` de la línea del resultado.
7. **Flota a 1280** (C7 y B2 de QA, 5.10): cabecera `<span aria-hidden="true">Km</span><span class="solo-lectores">
   Kilometraje</span>` (en `PantallaFlota.svelte` o `ListaTabla.svelte`, donde se arme el `th`); `th[scope="col"] {
   overflow-wrap: normal; word-break: normal; hyphens: manual; }`; anchos en `@container lista (min-width: 66rem)`:
   Unidad `11.5rem` · Estado hoy `12.5rem` · Próximo vencimiento `15rem` · Km `5.5rem` · Último parte `6.5rem` ·
   Novedades `6rem` · el resto. Medir: filas ≤ 64 px (pueden salir) y ≤ 88 px (con motivo); ninguna cabecera partida
   dentro de una palabra.
8. **Tarjetas de la flota a 360** (C8, 5.10): `PantallaFlota.svelte`: "Int. N · Modelo" en un `span` con `nowrap`;
   sin "Próximo vencimiento" cuando su tono es crítico (solo en tarjetas); renglón de km y parte con `flex-wrap` y
   "· último parte {F}" en `nowrap`. Medir ≤ 190 px en ZK 214 BD, ZW 827 VD y ZW 749 JE.
9. **Inicio, estado 1** (C14, 6.4): `PantallaConductor.svelte` línea ~142: con `inicio.unidad === null`, la primera
   opción es `T.elegirUna` ("Elija una unidad"); `T.elegirOtra` solo con la unidad fuera de servicio o desde "Usar otra
   unidad".
10. **Paso 2, "Al iniciar" y recorrido** (C11 y S8, 6.5 B): `ParteFormulario.svelte`: rótulo de "Al iniciar" con el
    estilo de etiqueta de campo (`--t-chico` 600 `--c-texto`), `.km { align-items: end; }`, valor de "Al iniciar" con
    `min-height: 3rem; display: flex; align-items: center;`, y "Al iniciar" solo desde 30rem de contenedor;
    `.recorrido`: rótulo `--t-chico` `--c-texto-2`, valor 600 `--c-texto`.
11. **Encabezado del parte** (S7, 6.5): `ParteEncabezado.svelte`: patente grande (ya está); a < 30rem, "Int. 07" y el
    modelo apilados a su derecha en `--t-chico`. Volver a medir "Al iniciar" y "Al terminar" por encima de 600 px a
    360 × 780.
12. **Enter en el parte** (B5 de QA, 5.11): `enterkeyhint="next"` en "Al iniciar" y "Al terminar", `enterkeyhint="done"`
    en litros (`ParteFormulario.svelte`, o `Campo.svelte` por prop). Sin código que envíe ni mueva el foco con Enter.
13. **Texto al 200 %, "Mis últimos partes"** (M1 de accesibilidad, 6.4): `PantallaConductor.svelte`, `.fila-parte` en
    grilla con áreas, `container: partes / inline-size` en el `ul` y `@container partes (max-width: 17rem)` para pasar a
    dos renglones; `nowrap` solo en la patente. Medir a 360 px con `html { font-size: 200% }`: sin superposición, y en
    un renglón con el texto normal.
14. **Texto al 200 %, cabecera común** (m1 de accesibilidad, 4.1): `BarraSuperior.svelte` (y `BarraApp.svelte` si hace
    falta): `min-height` en lugar de alto fijo, `flex-wrap: wrap`, ícono `flex: none`; `EtiquetaDemo.svelte`:
    `white-space: normal; max-width: 100%`. Revisar el botón de `BarraEnvio.svelte` a 320 px. Meta: `scrollWidth` ≤ 360
    en todas las pantallas con el texto al 200 %.
15. **Aviso "Cerrar antes", solo la pieza** (6.4 estado 5 bis y 6.5 E): en `Muestras.svelte`, el aviso semana con
    `i-lapiz` y sus dos renglones, y debajo el primario "Cerrar el parte anterior", en claro y oscuro, a 360 y 1280.
    Sumar a `scripts/contraste.mjs` el par texto / semana-f con el nombre "Aviso Cerrar antes" (el valor ya está medido
    por el alias `revisar`: 14,39 · 12,08).

**Bloque 2: dependen de la lógica [espera P]**

16. **[Eliminado por P21, 22/11/2026] C1 con documentación vencida aceptada** (C1 y S1; 5.4, 6.5). Esperaba `PanelParteEnviado.conAvisos` y la línea
    nueva de `textos.ts`. En `ParteEnviado.svelte`, con `conAvisos`: `data-tono="semana"` e ícono `i-alerta`; el título
    sigue "Revisión enviada".
17. **"Avisos aceptados"** (C6, 6.5). [Desde P21, solo kilómetros, en tono semana.] Esperaba los textos por documento de `textos.ts` (~379–395). Ícono `i-vencido` en
    `--c-critico-t`, sin fondo, un renglón por documento, en C1, C3 y D.
18. **Barra "Revise N datos"** (C5, 5.14). Espera `barraDeEnvio(...).texto` con los errores del último intento.
    `BarraEnvio.svelte` muestra ese estado en `--c-texto-2`, sin `i-check`.
19. **Resumen de errores agrupado** (D1, 5.15). Espera el armado del resumen (un elemento de grupo con su destino: el
    primer punto sin responder). `ResumenErrores.svelte` lo pinta como un enlace más, que lleva el foco al primer radio
    de ese punto. Probar con 10, 4, 3 y 1 puntos sin responder.
20. **Inicio, estado 5 bis "Cerrar antes"** (6.4). Espera el estado nuevo de `inicio` (tipo, patente, fecha y ruta del
    parte anterior) y sus textos. `PantallaConductor.svelte`: rama nueva con el aviso de la tarea 15, el primario
    `EnlaceAccion` "Cerrar el parte anterior", "Tiene una revisión empezada: se conserva." + "Descartar borrador" si hay
    borrador, y "Usar otra unidad"; "Pendientes" sin ese mismo parte. Textos: sección 7 (mandan sobre los del
    programador).
21. **Pantalla E "Cerrar antes"** (6.5). Espera el motivo nuevo de la pantalla E y la ruta del parte anterior.
    `PantallaParte.svelte`: el aviso en lugar del párrafo de la regla, el primario hacia el parte anterior, "Descartar
    borrador" si hay, y el enlace de vuelta como botón-texto. Foco al `h1`.
22. **Ficha: primer botón del encabezado** (C16, 6.3). Espera la acción de `ficha.ts`. `FichaEncabezado.svelte` muestra
    el texto que llega ("Cargar parte" / "Cerrar el parte" / "Cerrar el parte del {F}" / "Ver el parte").
23. **Ficha, kilometraje en uso** (C16, 6.3). `FichaKilometraje.svelte`: recorrido "—" en la fila en uso, alineado como
    los demás. [solo M si el dato "en uso" ya llega a la fila; si no, espera P]
24. **Lo que corrige solo el programador, para mirar en la vista:** fecha de "Último parte" en la flota (C2,
    `flota.ts`); opción del `select` "{Nombre} (sin licencia vigente) · {P}" (C13 y B1 de QA); nota del punto crítico
    (C15); "fuera de plazo" en `textos.ts` (líneas ~289, ~893, ~1065, ~1222, ~1230). La vista no cambia: se comprueba a
    360 px (la opción se lee hasta "vigente)" o se corta solo en la patente).

**Bloque 3: cierre**

25. **Verificación** (sección 12): `npm run check`, `npm test`, `npm run contraste`, `npm run buscar`, `npm run build` +
    `npm run servir`; 320/360/768/1280 en claro y oscuro; texto al 200 % a 360; los recorridos de la sección 12, con el
    nuevo de "Cerrar antes". Anotar en `docs/registro.md` cada medida (alto de filas y tarjetas, "Al iniciar" y "Al
    terminar", `scrollWidth`). Después: `qa-destructor`, `auditor-accesibilidad` y `disenador-ui` contra este documento,
    y `critico-reclutador`.
