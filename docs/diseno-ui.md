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
| Centro de alertas (`#/alertas`) | **Inicio** (`#/inicio`); sus vencimientos tienen pantalla propia, **Vencimientos**, y la operación diaria también, **Operación diaria** (Partes y Novedades) |
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


**Actualización del 27/11/2026 — rediseño, etapa 2: «Pie de rey».** Matías eligió la dirección visual «Pie de rey» para la demo. La especificación para llevarla a producción es la **sección 15**, que **manda sobre las secciones 1, 3, 4 y 10** donde digan otra cosa y sobre el aspecto (colores, tipografía, radios, sombras y medidas) descrito en las secciones 5, 6 y 14. Siguen vigentes sin cambios las rutas (2), el comportamiento de cada pieza (5 y 6), los estados (8), la accesibilidad (9) y la verificación (12). No cambia ninguna regla de negocio.

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
- **Una herramienta de gestión densa**: densidad cómoda en listas, foco de teclado visible sin ruido.

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
| `#/operacion/partes` y `#/operacion/novedades` (`#/operacion` y la dirección vieja `#/operacion/checklists` llevan a Partes) | Operación diaria | Encargado |
| `#/unidad/ZK214BD` (patente normalizada) | Ficha de unidad | Encargado |
| `#/conductor` (por defecto del conductor) | Hoy | Conductor |
| `#/conductor/partes` | Mis partes | Conductor |
| `#/parte/ZK214BD/2026-11-18` (sin fecha: la de hoy) | Parte diario (revisión antes de salir, cierre o lectura, según el estado del parte; 6.5) | Ambos |
| `#/mas` | Más: «Ver como», «Cómo funciona», «Reiniciar demo», volver al portafolio | Ambos |

- Filtros en la dirección. Movilidades: `disponibles`, `no-disponibles`, `bloqueadas`, `fuera`, `baja` (los viejos `pueden-salir`, `no-pueden-salir`, `fuera-de-servicio` y `de-baja` se siguen entendiendo); la búsqueda, `q` (hasta 60 caracteres). Vencimientos: `vencidos`, `proximos`, `7`, `15`, `30`. Un `?` en cualquier otra pantalla es una ruta desconocida.
- **Pantalla no es consulta.** Cambiar de pantalla mueve el foco al `h1` (`tabindex="-1"`, sin anillo: D3 (b), ver «Foco visible» al comienzo de la sección 5), sube la página (sin desplazamiento suave) y actualiza `document.title` = «{Pantalla} · Control de flota (demo)». Cambiar de filtro o escribir en el buscador **no** mueve foco ni desplazamiento; un filtro agrega una entrada al historial y cada letra del buscador, no.
- Ruta desconocida o patente que no existe: estado de error de la pantalla (sección 8), nunca una pantalla en blanco. Un perfil que abre una ruta del otro perfil va a su propio inicio.
- Cambiar de perfil (con «Ver como») lleva a la ruta por defecto del perfil elegido, sin agregar historial.
- «Atrás» (en la barra superior del celular y en las migas de escritorio) es un enlace al **padre** de la pantalla: la ficha vuelve a Movilidades con el filtro y la búsqueda que tenía; el parte, a Operación diaria (encargado) o a Hoy (conductor); Partes y Novedades, a Operación diaria. En las pantallas de la navegación no hay.
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

- **Lateral** fijo a la izquierda, de `16rem`, oscuro en claro y en oscuro. Arriba: la marca (ícono y «Control de flota») y la etiqueta «Demo con datos ficticios». En el medio, los destinos: encargado, Inicio, Movilidades, Vencimientos y Operación diaria (un solo destino: Partes y Novedades se eligen con las solapas de la pantalla, no en el lateral; decisión del 26/11/2026); conductor, Hoy y Mis partes. Con insignias (4.3). Abajo: «Cómo funciona», «Reiniciar demo», «Ver como» (el perfil de ahora, con un control para cambiarlo), «Volver al portafolio», la autoría («Concebido, diseñado y dirigido por Matías Ariel Ormeño; desarrollado con IA.») y «Más».
- El destino de la pantalla actual sale del contenido como una pestaña de fichero (corte en diagonal) y lleva además una marca de 3 px y negrita: en oscuro el recorte solo no alcanza contraste. `aria-current="page"`.
- **Barra de migas** fija arriba del contenido: las migas a la izquierda (el último tramo es la pantalla de ahora, sin enlace; los anteriores, enlaces) y la fecha a la derecha. Las pantallas del lateral llevan un solo tramo.

### 4.2 Celular y tableta (menos de 64 rem): barra superior y barra inferior

- **Barra superior** fija, en dos pisos. Fila: a la izquierda la marca (en las pantallas de la barra inferior) o «‹ Atrás» (en la ficha y el parte); a la derecha, el **chip del perfil**, que abre «Ver como». Al bajar la página, el título de la pantalla ocupa el lugar de la marca. Debajo, la franja «Demo con datos ficticios · día de la semana y fecha», siempre visible.
- **Barra inferior** (`nav aria-label="Secciones"`), de `4rem`, con el área segura del teléfono: encargado, Inicio, Movilidades, Operación, Vencimientos y Más; conductor, Hoy, Mis partes y Más. El destino actual lleva una píldora de tinta y `aria-current` (no solo color). En el parte no hay barra inferior: manda la barra de envío.

### 4.3 Insignias

Las del lateral y la barra inferior salen de las mismas cifras de Inicio y de Operación diaria (`app.centroDeAlertas`), no de un cálculo aparte: Inicio, no disponibles hoy; Vencimientos, vencidos o faltantes; Operación diaria, pendientes (el total de las dos solapas, Partes y Novedades, que llevan su propia cuenta). Las dos primeras son cobre (críticas); las de Operación, grafito. Sin insignia si es 0. El nombre accesible de la insignia dice la cuenta con palabras («4 no disponibles hoy»); `white-space: nowrap` en la insignia y, con el texto al 200 %, la insignia baja de renglón en lugar de ensanchar la página.

### 4.4 Avisos globales

Debajo de las migas (escritorio) o de la barra superior (celular), dentro del ancho máximo, uno debajo del otro y solo los que aplican (5.18): datos viejos (D5), demo actualizada (D7), modo en memoria (D8) y cambios en otra pestaña (D9). La región `role="status"` existe siempre, vacía, para que lo que llega con la página abierta se anuncie.

### 4.5 «Más» y pie

No hay pie propio. La pantalla **Más** (`#/mas`, la ven los dos perfiles) reúne lo que antes colgaba de la barra superior: «Ver como» (el perfil de ahora y cómo cambiarlo), «La demo» («Cómo funciona», «Reiniciar demo», volver al portafolio) y el texto de autoría. En escritorio ese texto está al pie del lateral; en el celular y la tableta, además, va una vez al final de Inicio (discreta, sin duplicarse con el lateral, que desde 64 rem lo reemplaza).

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

---

## 15. «Pie de rey»: rediseño, etapa 2 — marco y sistema (27/11/2026)

Matías eligió la dirección visual **«Pie de rey»** para la demo, mirando un prototipo navegable (no versionado). Esta
sección es la especificación para llevarla a producción. Es un **cambio de piel y de composición**: no agrega módulos ni
funciones, y no cambia ninguna regla de negocio ni la estructura de datos de las pantallas.

**Precedencia.** Esta sección **manda sobre las secciones 1, 3, 4 y 10** donde digan otra cosa, y sobre el aspecto
(colores, tipografía, radios, sombras, medidas) descrito en las secciones 5, 6 y 14. **Siguen vigentes sin cambios** el
comportamiento de las secciones 2 (rutas), 5 y 6 (qué hace cada pieza, foco, textos y estados del parte), 8, 9 y 12.
Donde un comportamiento cambia, esta sección lo dice de forma explícita.

**Encuadre.**

| | |
| --- | --- |
| Quién la usa | El encargado de flota (escritorio y celular) y el conductor (celular, de pie junto a la unidad). |
| Quién la evalúa | Un gerente de logística o administración y un líder técnico. |
| Qué se entiende en tres segundos | En Inicio: **cuántas unidades pueden salir hoy, cuántas no y cuál es la acción que destraba la primera**. En Hoy: **si el conductor puede salir con su unidad**. |
| Acción principal | Inicio: la «Acción del día». Hoy: «Empezar la revisión» (o lo que el estado del día pida). Las demás pantallas conservan la suya (sección 0). |

**Criterio que decide los empates: claridad en tres segundos y sin ruido.**

1. Cada pantalla tiene **una** pieza que manda y se lee primero. Si dos piezas compiten, la segunda baja de tamaño, de
   color o de lugar.
2. **Se mueve una pieza por vez.** Nunca toda la pantalla ni todos los colores a la vez; nunca dos gestos que empiezan
   en el mismo cuadro (15.10).
3. **Un solo campo de color pleno por pantalla** (15.2). El rojo y el ámbar solo dicen estado.
4. Poca información por pantalla: lo que no ayuda a decidir en ese momento baja de la primera pantalla o se va.
5. Toda marca de dibujo técnico (cota, globo, escala, cursor) **dice un dato**. La que no se puede leer como dato, se saca.
6. Ante la duda entre un adorno y un texto legible, gana el texto.

Con este criterio se revisa el boceto estático (Inicio y Hoy) antes de construir, y cada tanda de maquetación.

---

### 15.1 Conciliación: qué sale de cada dirección

La **estructura** (módulos, perfiles, rutas, sin dinero, qué llega en cada etapa) sale del plan de producto de la demo;
la **piel** sale de «Pie de rey». Donde chocan, manda «Pie de rey».

#### 15.1.1 Los choques y cómo se resuelven

| # | Tema | Lo que decían las secciones 1, 3, 4 y 10 | «Pie de rey» | Resolución |
| --- | --- | --- | --- | --- |
| 1 | **Color** | Papel gris cálido; la tinta es la acción; el color solo es estado; minerales (cobre, azufre, azurita, grafito, malaquita). | Papel cálido y tinta, **un azul cobalto** en un campo pleno por pantalla; de noche, cianotipo. | Manda «Pie de rey». La tinta **sigue siendo la acción** (botón primario). El cobalto es **la medida**, nunca un estado. La azurita deja de ser un tono: «quincena» pasa a tinta y «mes» a contorno (15.3.1). Rojo y ámbar quedan para crítico y atención. |
| 2 | **Bricolage Grotesque** | Títulos y cifras a 85 % de ancho. (El plan de producto previo la retiraba.) | Cartel a 75–78 % para la cifra monumental, el veredicto y los títulos. | Se queda, a **75 %** en cifras y veredicto y **78 %** en títulos. Ninguna tipografía nueva: son los mismos tres archivos. |
| 3 | **Cifra** | Una cifra protagonista (cobre, 56 px) y cuatro secundarias en tarjetas iguales. | Una cifra **monumental** (hasta 200 px) dentro de la mordaza; prohibidas las tarjetas de indicador iguales en fila. | La cifra de Inicio pasa a ser **«disponibles hoy» sobre activas**, monumental y en tambores. Las cuatro secundarias pasan a **renglones de lectura** (15.6.4). Sigue habiendo una sola cifra protagonista por pantalla. |
| 4 | **Movimiento** | Solo la transición entre pantallas y la cuenta de la cifra cobre; prohibidas las animaciones de entrada. | Movimiento mecánico: mordaza que se cierra, tambores, piezas que caen, sellos. | Se admite **una coreografía de entrada por vista y por sesión**, de menos de 1.050 ms, con una pieza por vez (15.10). La cuenta vieja de la cifra se retira. Se suma el control «Sin animaciones». |
| 5 | **Textura** | Superficies planas; prohibidos papel, sellos, gradientes. | Grano de imprenta, rejilla en el campo pleno, precinto rayado, cuadrícula y exposición de noche. | Textura **solo en la página, en el campo pleno y en la zona roja**. Las zonas de lectura (tablas, listas, formularios, diálogos) van en hoja lisa. **Ningún texto sobre trama** (15.2, regla 8). |
| 6 | **Patente** | Rótulo con banda neutra; prohibido imitar la placa oficial (banda azul, escudo, leyendas). | Chapa con franja cobalto; en el tamaño grande, franja alta con una leyenda de país. | La chapa lleva la **franja cobalto** (es el color de la casa, no el de la placa oficial) y **ninguna leyenda, escudo ni bandera**. La prohibición de imitar la placa oficial sigue vigente. Es un desvío a propósito respecto del prototipo. |

#### 15.1.2 Módulos, rutas y etapas del rediseño

El rediseño se hace por etapas. Para no confundirlas con las etapas de `docs/plan.md` (que son las de la construcción
original), acá se nombran siempre **«rediseño, etapa N»**.

| Rediseño, etapa | Qué trae | Estado |
| --- | --- | --- |
| 1 | Carga por pantalla (`import()` por ruta) y pruebas de punta a punta. Invisible. | Hecha |
| **2** | **Marco y sistema «Pie de rey»** (esta sección): tokens, tipografía, texturas, marco, componentes base, regla de salida en Inicio, veredicto en Hoy, las nueve pantallas actuales con la piel nueva. | En curso |
| 3 | Datos e Inicio completo: historia de 120 días; registrador de 30 días dentro de la mordaza; lecturas como instrumentos; lista de piezas con cajetín; registro de salida; agenda. **Escena completa «Renovar seguro»** (la llave vuela en arco, nota de revisión, resaltado cruzado entre llave y renglón) y exposición del cianotipo al cambiar de tema. | Pendiente |
| 4 | Unidades: «Movilidades» pasa a llamarse «Unidades»; tabla densa con regla mini; cajón de la unidad por dirección; ficha con pestañas. Buscador global con la tecla `/` y cambio de densidad compacta / cómoda. | Pendiente |
| 5 | Vencimientos y partes: regla de plazos; exportar CSV e `.ics`; partes diarios; «Todo en orden» con deshacer; regla de tres casillas del conductor; unidad bloqueada a pantalla completa. | Pendiente |
| 6 | Conductores (tabla y ficha). | Pendiente |
| 7 a 9 | Mantenimiento, combustible y reportes. Se deciden viendo andar las anteriores. | Sin decidir |

- **Módulos de esta etapa: los que existen.** Encargado: Inicio, Movilidades, Vencimientos, Operación diaria (Partes y
  Novedades), ficha de unidad y parte. Conductor: Hoy, Mis partes y parte. Los dos: Más. El lateral y la barra inferior
  muestran **solo pantallas que existen**: ningún destino «próximamente».
- **Rutas: las de la sección 2, sin cambios.** No se renombra ninguna ni se agrega ninguna.
- **Perfiles:** Encargado y Conductor, con «Ver como» (5.2). Sin usuarios ni contraseñas.
- **Sin dinero.** Combustible y kilometraje se muestran en litros, kilómetros y días; no hay precios ni costos.
- Lo que el prototipo muestra y esta etapa **no** trae queda en la tabla de arriba con su etapa. Nada de eso se dibuja
  a medias ni se deja como botón que no hace nada.

---

### 15.2 Dirección y reglas de producción

**«Pie de rey».** El pie de rey es el calibre del taller: una regla graduada, una mordaza que se cierra sobre lo que se
mide y un cursor que marca la lectura. Cada pantalla principal mide **una** cosa de la operación. De día es un plano en
papel: papel cálido, tinta negra, filetes finos y un único campo azul cobalto. De noche es el cianotipo del mismo
plano: papel azul de Prusia con su cuadrícula, tinta clara, y el campo medido en crema con la cifra en cobalto. Lo que
se toca (chapa, llave) es un **objeto** de papel claro, de día y de noche.

Referencias reales, para mirar cómo resuelven y no para copiar: los planos de conjunto del dibujo técnico normalizado
(lista de piezas, globos numerados, cotas); los calibres con escala principal y cursor; los odómetros mecánicos de
tambor; los tableros de llaves de una base de flota; los cianotipos de planos; la densidad de una herramienta de gestión
moderna; las cifras tabulares y el monoespaciado para identificadores de las herramientas para desarrolladores; el
*bullet graph* (gráfico de bala) como ejemplo de gráfico que reemplaza a un medidor. Sin nombres de marca: el repositorio
es público (decisión DE1 de Matías, 28/11/2026).

**Reglas de producción.** Valen para todo archivo de `src/`.

1. **Un campo pleno por pantalla.** `--c-pleno` cubre un campo grande: la mordaza de la regla (Inicio). Fuera de ahí
   aparece solo en detalles: destino activo del menú, filtro elegido, el botón que destraba y el anillo de foco. En las
   pantallas sin regla no hay campo pleno grande.
2. **El pleno nunca es estado.** El estado se dice con **forma + palabra + color** (15.3.1). Nunca con el color solo.
3. **Precinto** (rayado a −45°) para lo que no puede salir, está vencido o falta. No depende del color: es una trama.
4. **Una cifra monumental por pantalla**, en la letra de cartel. En Hoy, que no tiene cifra, la monumental es el
   **veredicto**. Las demás cifras miden 44 px o menos; las de tabla van en monoespaciada.
5. **Esquinas rectas.** Radio 0 en fichas, paneles y diálogos; 2 px en controles; 3 px en la chapa. Lo redondo queda
   para piezas físicas (el cuerpo de la llave, el agujero, los globos).
6. **Filetes, no sombras.** Las hojas se separan con un filete de 1 px y se encabezan con uno de 1,5 px en tinta.
   Sombra solo en lo que se levanta del papel (diálogo, menú, rótulo de cota, chapa con el cursor encima) y la
   **sombra dura de 2 px** de los botones.
7. **Nada de cifras fijas.** Ninguna hoja de estilo ni componente lleva escrito un número de unidades, una fracción,
   una fecha ni una patente. Todo sale de los datos: la cantidad de divisiones de la escala, la medida de la mordaza y
   la cantidad de llaves llegan por propiedades (`style:--act`, `style:--medida`) y el diseño funciona con cualquier
   valor (15.6.7). El prototipo tenía valores escritos a mano; no se copian.
8. **Ningún texto sobre trama.** El texto nunca va sobre el rayado, el grano con rejilla ni la cuadrícula. Va en una
   **placa lisa**: un rectángulo de color liso (sin grano ni rejilla detrás), y el contraste se mide contra la placa.
   Excepción única: la cifra monumental, que es texto grande y supera 3:1 con holgura.
9. **Texto de 12 px como mínimo** (`0.75rem`), también el monoespaciado. El prototipo tenía un rótulo de 11 px: no se
   copia. Las ayudas y los párrafos, 13 px o más.
10. **Objetivos de 24 × 24 px como piso** (WCAG 2.5.8) en todo lo que se pulsa. Medidas de trabajo: 36 px en controles
    de escritorio y 28 px en acciones de renglón; por debajo de 64 rem, **44 px** en el marco y en todo el recorrido
    del conductor (48 px en el checklist y el combustible, como hoy) y **40 px** en las acciones de renglón de las
    pantallas del encargado, incluida la «Acción del día».
11. **Nada de `prefers-color-scheme` en componentes.** El modo se resuelve en `tokens.css` (y, para las texturas por
    modo, también ahí). Un componente que necesita otro color en oscuro usa un token; si no existe, se agrega el token
    con su par medido. Tampoco `rgb()` ni hexadecimales sueltos en los `<style>` de los componentes.
12. **Sin atributo `style`.** Los valores dinámicos van por `style:--x` (que Svelte aplica por CSSOM) y la hoja de
    estilos los lee. Sin `{@html}`. Sin directivas `transition:`, `in:`, `out:` ni `animate:` de Svelte.
13. **Solo se animan `transform`, `opacity` y `clip-path`**, salvo la medida de la mordaza en la escena (15.7), que es
    una transición de `flex-basis` de una sola pieza. Nada se mueve más de 5 segundos sin que la persona lo pida
    (excepción: el indicador de «cargando», que dura lo que dura la espera).
14. **Sin desenfoque de fondo por debajo de 64 rem.** La barra de escritorio es la única pieza con desenfoque (6 px).
15. **Todo en `rem`**, salvo filetes, bordes y radios, que van en `px`. Las medidas en px de esta sección son a 16 px
    de base.
16. **Español neutro** en todo texto de interfaz; cifras con coma decimal y punto de miles (`es-AR`).
17. Todo se comprueba sobre la compilación de producción (`dist`) servida con la CSP real, no sobre `npm run dev`.

---

### 15.3 Tokens

Fuente de los valores: `src/estilos/tokens.css`. Se **conservan los nombres `--c-*`** que ya usan los componentes
(15.3.4) y cambian de valor; se agregan los grupos nuevos. Prefijos: `--c-` color · `--obj-` color de objeto · `--tx-`
textura · `--t-` tipografía · `--e-` espaciado · `--r-` radio · `--b-` borde · `--s-` sombra · `--m-` movimiento.

#### 15.3.1 Color

| Token | Claro (papel) | Oscuro (plano nocturno) | Uso |
| --- | --- | --- | --- |
| `--c-papel` | `#F1ECE1` | `#0A2550` | Fondo de página (con grano; de noche, además, cuadrícula y exposición). |
| `--c-papel-2` | `#E7E0D1` | `#13366C` | Fila con el cursor encima, zonas, botón deshabilitado. |
| `--c-hoja` | `#FBF8F1` | `#0C2857` | Hojas lisas: fichas, tablas, formularios, diálogos. De noche casi no se separa del papel: es un solo plano. |
| `--c-tinta` | `#17140F` | `#EDF3FA` | Texto principal, filetes fuertes, **acción primaria**. |
| `--c-tinta-2` | `#4B4539` | `#BFD1E6` | Texto secundario. |
| `--c-tinta-3` | `#675F50` | `#9AB5D3` | Rótulos, ejes, ayudas; marca de «mes» y de neutro. |
| `--c-tinta-hover` | `#36322C` | `#CDD6E2` | Botón primario con el cursor encima. |
| `--c-tinta-borde` | `#17140F` | `#6F8FB8` | Borde y sombra dura del botón primario. De día es la propia tinta (el botón no cambia); de noche es un azul medio, distinto del relleno claro, para que el botón se lea como botón y no como un campo vacío. Decorativo como canto; el par está en 15.3.3. |
| `--c-sobre-tinta` | `#F1ECE1` | `#0A2550` | Texto sobre tinta. |
| `--c-control` | `#857D6E` | `#7F9EC2` | Borde de campos, casillas y filtros (3:1). |
| `--c-filete` | tinta al 14 % | tinta al 14 % | Separadores (`color-mix(in srgb, var(--c-tinta) 14%, transparent)`). Decorativo: no se mide. |
| `--c-filete-medio` | tinta al 30 % | tinta al 30 % | Contorno de fichas, reglas de sección. Decorativo: no se mide. |
| `--c-pleno` | `#1F3FD1` | `#F1ECE1` | **El** campo: la mordaza. De noche es papel expuesto (crema). |
| `--c-pleno-hover` | `#1733B0` | `#E4DCCB` | Pleno con el cursor encima. |
| `--c-pleno-borde` | `#0F1F70` | `#A39A86` | Canto (sombra dura) del botón pleno. Decorativo. |
| `--c-sobre-pleno` | `#FFFFFF` | `#1F3FD1` | Cifra y texto sobre el pleno. De noche, cobalto sobre crema. |
| `--c-sobre-pleno-2` | `#E4E9FC` | `#3B4A86` | Rótulos de 12 px sobre el pleno. |
| `--c-pleno-suave` | `#DEE3F8` | `#1A417D` | Fila elegida, campo recién editado. |
| `--c-pleno-texto` | `#1C39BF` | `#A9C7FF` | Enlaces, anillo de foco, sello «Datos ficticios». |
| `--c-pleno-trama` | blanco al 12 % | cobalto (`#1F3FD1`) al 15 % | Rejilla dentro del pleno. Decorativa. |
| `--c-crit` | `#B02D18` | `#FF9E85` | Crítico: texto. |
| `--c-crit-relleno` | `#BE3219` | `#D24027` | Crítico: relleno **con texto blanco encima** (zona roja, placa roja, insignia). |
| `--c-crit-marca` | `#BE3219` | `#E2543A` | Crítico: franja, precinto como marca, rombo, borde de campo inválido. **Nunca lleva texto encima.** |
| `--c-crit-fondo` | `#F7DED6` | `#3A2240` | Crítico: fondo de etiqueta y de aviso. |
| `--c-aten` | `#855600` | `#F5C463` | Atención: texto. |
| `--c-aten-relleno` | `#A86F08` | `#E0A53A` | Atención: franja, trama, triángulo. |
| `--c-aten-fondo` | `#F5E5C2` | `#3A3324` | Atención: fondo. |
| `--c-ok` | `#1D6842` | `#8BE0B4` | En orden: texto y marca. Se usa poco: lo normal no se pinta. |
| `--c-ok-fondo` | `#DCEADF` | `#123F43` | En orden: fondo. |
| `--c-sobre-solido` | `#FFFFFF` | `#FFFFFF` | Texto sobre `--c-crit-relleno`. |
| `--c-foco-oscuro` | `#FFFFFF` | `#FFFFFF` | Anillo de foco sobre el lateral, la barra inferior y la zona roja. **Nunca** sobre el destino actual ni sobre un control apretado del lateral: su fondo es claro (15.5). |
| `--c-lat` | `#17140F` | `#051735` | Lateral y barra inferior. |
| `--c-lat-tx` · `--c-lat-tx-2` | `#EEE8DC` · `#ADA594` | `#E6EEF7` · `#95B0CE` | Texto del lateral; secciones, autoría y destinos sin elegir. |
| `--c-lat-borde` · `--c-lat-hover` | `--c-lat-tx` al 14 % · al 8 % | igual | Filetes y cursor encima en el lateral. Decorativos. |
| `--c-velo` | `rgb(23 20 15 / 0.46)` | `rgb(2 10 22 / 0.6)` | Detrás de los diálogos. |

Cuatro valores **difieren del prototipo a propósito**, por medición:

- `--c-sobre-pleno-2` (`#E4E9FC` / `#3B4A86`) y la rejilla al 12 % son los valores corregidos del prototipo que no
  habían llegado a su hoja de sistema.
- `--c-pleno-suave` de noche baja de `#1B4583` a `#1A417D`: con el valor original, el texto terciario sobre una fila
  elegida daba 4,46:1; con el nuevo da 4,73:1.
- `--c-crit-marca` es nuevo. De noche, el rojo de relleno (`#D24027`) contra la fila con el cursor encima daba
  2,54:1; como relleno tiene que quedarse (el blanco encima da 4,66:1), la **marca** sobre fondos oscuros usa un rojo
  más claro (`#E2543A`: 3,14:1 sobre `--c-papel-2`, el peor fondo de la tabla). De día los dos son el mismo color.
  Sobre ese rojo más claro el blanco da 3,77:1: por eso **nunca lleva texto encima**.
- `--c-tinta-borde` es nuevo (revisión del boceto de Inicio y Hoy, 27/11/2026). De noche el botón primario tenía
  relleno, borde y sombra del mismo color (`#EDF3FA`) y se leía como un campo vacío, no como un botón. El borde y la
  sombra dura pasan a `#6F8FB8`: 4,52:1 contra el papel, 4,32:1 contra la hoja y 3,55:1 contra `--c-papel-2`, y 2,99:1
  contra el propio relleno, así que la sombra de 3 px se ve. De día vale la tinta: no cambia nada.
- **Sobre una fila elegida** (`--c-pleno-suave`) la marca crítica de noche da 2,65:1. Regla: en una fila elegida la
  forma del tono se pinta con el color de **texto** del tono (`-t`: 5,00:1 o más) y el precinto de la fila se
  reemplaza por la barra de 4 px en `--c-pleno`; el estado lo sigue diciendo la etiqueta.

**Tonos de estado.** Se conservan los seis nombres (`critico`, `semana`, `quincena`, `mes`, `vigente`, `neutro`), sus
alias minerales y la regla «el color nunca va solo». Cambian los valores:

| Tono (`data-tono`) | Significa (sin cambios) | Forma | Texto `-t` | Fondo `-f` | Marca `-r` |
| --- | --- | --- | --- | --- | --- |
| `critico` (alias `diferencia`) | Vencido, faltante, bloqueada, novedad crítica. | rombo | `--c-crit` | `--c-crit-fondo` | `--c-crit-marca` |
| `semana` (alias `revisar`) | Vence en 7 días o menos; parte sin enviar; novedad abierta. | triángulo | `--c-aten` | `--c-aten-fondo` | `--c-aten-relleno` |
| `quincena` (alias `pendiente`) | Vence en 8 a 15 días; «En uso». | círculo lleno | `--c-tinta` | `--c-papel-2` | `--c-tinta` |
| `mes` | Vence en 16 a 30 días. | aro | `--c-tinta-2` | `--c-papel-2` | `--c-tinta-3` |
| `vigente` (alias `ok`) | Vigente, disponible, parte cerrado. | sin forma o marca de verificación | `--c-ok` | `--c-ok-fondo` | `--c-ok` |
| `neutro` | Borrador, de baja, fuera de servicio por taller o a mano. | cuadrado | `--c-tinta-2` | `--c-papel-2` | `--c-tinta-3` |

«Quincena» y «mes» comparten fondo: se distinguen por la forma (círculo lleno contra aro) y por la palabra. El azul ya
no es un tono, porque el azul es la medida. Que «quincena» deje de ser azul cambia el aspecto del horizonte que ya
conocía: decisión DE4 de Matías (28/11/2026), tinta sin azul.

#### 15.3.2 Objetos: claros de día y de noche

Un **objeto** (`.objeto`) es lo que se toca y representa una cosa física: la chapa (`.patente`), la llave, el rótulo de
cota y la llave del conductor en Hoy. De noche **no se oscurece**: sigue siendo papel claro con tinta negra y los
colores de día, sobre el plano azul.

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--obj-hoja` | `#FBF8F1` | `#EDE7DA` | Papel del objeto. De noche baja un punto para no encandilar. |
| `--obj-papel` | `#F1ECE1` | `#E2DACA` | Agujero de la llave, zona secundaria. |
| `--obj-papel-2` | `#E7E0D1` | `#D9D0BD` | Zona sin cubrir dentro de un objeto. |
| `--obj-sombra` | `rgb(23 20 15 / 0.22)` | `rgb(0 0 0 / 0.28)` | Sombra de 1 px del objeto. |
| `--obj-contorno` | `#17140F` | `#EDE7DA` | Contorno de los objetos cuyo cuerpo **no** es papel: llave y chapa críticas, llave disponible con el cursor encima (15.6.3). De día es tinta; de noche, papel claro. Los objetos de papel siguen con contorno `--obj-tinta`. |
| `--obj-tinta` · `--obj-tinta-2` · `--obj-tinta-3` | `#17140F` · `#4B4539` · `#675F50` | los mismos | Texto dentro del objeto. |
| `--obj-control` | `#857D6E` | el mismo | Borde de control dentro del objeto. |
| `--obj-franja` | `#1F3FD1` | el mismo | Franja cobalto de la chapa y de la llave. Dentro de un objeto es también «el pleno». |
| `--obj-sobre-franja` | `#FFFFFF` | el mismo | Texto sobre la franja usada como fondo (llave disponible con el cursor encima). |
| `--obj-pleno-suave` | `#DEE3F8` | el mismo | Fila elegida o campo recién editado dentro de un objeto. |
| `--obj-enlace` | `#1C39BF` | el mismo | Enlace y foco dentro del objeto. |
| `--obj-crit` · `--obj-crit-relleno` · `--obj-crit-fondo` | `#B02D18` · `#BE3219` · `#F7DED6` | los mismos | Crítico dentro del objeto: texto, relleno y marca, fondo de etiqueta. |
| `--obj-aten` · `--obj-aten-relleno` · `--obj-aten-fondo` | `#855600` · `#A86F08` · `#F5E5C2` | los mismos | Atención dentro del objeto. |
| `--obj-ok` · `--obj-ok-fondo` | `#1D6842` · `#DCEADF` | los mismos | En orden dentro del objeto: texto y fondo de etiqueta. |

**Decisión técnica (tomada).** Se mantiene `build.target: "es2022"`. Con ese destino, `light-dark()` no llega al
navegador como tal: se compila a variables que se resuelven en `:root`, así que un `color-scheme: light` puesto en un
descendiente **no** vuelve a resolver los tokens. Por eso los objetos no dependen de `color-scheme`:

- Los `--obj-*` se declaran en `:root`. Cambian con el modo solo `--obj-hoja`, `--obj-papel`, `--obj-papel-2`,
  `--obj-sombra` y `--obj-contorno`.
- `.objeto` **vuelve a declarar** los tokens generales que usa lo de adentro, apuntándolos a los `--obj-*`. Dentro de
  un objeto todo color vale lo que vale de día. La lista es **cerrada**:

  | Tokens generales | Dentro de `.objeto` valen |
  | --- | --- |
  | `--c-hoja`, `--c-superficie` | `--obj-hoja` |
  | `--c-papel` | `--obj-papel` |
  | `--c-papel-2`, `--c-superficie-2` | `--obj-papel-2` |
  | `--c-tinta`, `--c-tinta-2`, `--c-tinta-3` y `--c-texto`, `--c-texto-2`, `--c-texto-3` | `--obj-tinta`, `--obj-tinta-2`, `--obj-tinta-3` |
  | `--c-sobre-tinta` | `--obj-hoja` |
  | `--c-control`, `--c-borde-fuerte` | `--obj-control` |
  | `--c-filete`, `--c-borde` | `--obj-tinta` al 14 % (`color-mix`, como en 15.3.1) |
  | `--c-filete-medio`, `--c-ventana-borde` | `--obj-tinta` al 30 % |
  | `--c-pleno` | `--obj-franja` |
  | `--c-sobre-pleno` | `--obj-sobre-franja` |
  | `--c-pleno-suave` | `--obj-pleno-suave` |
  | `--c-pleno-texto`, `--c-enlace`, `--c-foco` | `--obj-enlace` |
  | `--c-crit`, `--c-crit-relleno`, `--c-crit-marca`, `--c-crit-fondo` | `--obj-crit`, `--obj-crit-relleno`, `--obj-crit-relleno`, `--obj-crit-fondo` |
  | `--c-aten`, `--c-aten-relleno`, `--c-aten-fondo` | `--obj-aten`, `--obj-aten-relleno`, `--obj-aten-fondo` |
  | `--c-ok`, `--c-ok-fondo` | `--obj-ok`, `--obj-ok-fondo` |
  | Los alias de tono (`--c-critico-*`, `--c-diferencia-*`, `--c-semana-*`, `--c-revisar-*`, `--c-vigente-*`, `--c-ok-t` / `-f` / `-r`, `--c-quincena-*`, `--c-pendiente-*`, `--c-mes-*`, `--c-neutro-*`) | Se vuelven a declarar con la misma fórmula de 15.3.4. |

  Así una etiqueta o un ícono dentro de un objeto se resuelve en claro sin repetir colores en cada componente.
- **Por qué hay que repetir también los filetes y los alias.** Un token declarado en `:root` con otro token adentro
  (`color-mix(… var(--c-tinta) …)`, `var(--c-crit-fondo)`) queda resuelto en `:root`: cambiar `--c-tinta` más abajo no
  lo vuelve a calcular. Sin repetirlos, de noche y dentro de un objeto daban: etiqueta crítica sobre su fondo 2,18:1;
  etiqueta en orden 1,71:1; texto sobre la fila elegida 1,83:1; filete 1,02:1 (no se veía); y el fondo pleno, crema
  sobre crema, 1,05:1.
- **Un token que no está en la lista no se usa dentro de un objeto** (por ejemplo `--c-tinta-hover`,
  `--c-pleno-hover`, `--c-sobre-pleno-2`, los del lateral). Si hace falta, se suma a la lista y a 15.3.3 antes de
  usarlo.
- **`.objeto` va en el cuerpo dibujado, nunca en el elemento que recibe el foco.** El enlace o el botón que envuelve
  al objeto queda afuera y su anillo usa el `--c-foco` de la página (7,47:1 o más contra el plano). Si `.objeto`
  estuviera en el propio enlace, el anillo tomaría `--obj-enlace` y de noche daría 1,71:1 contra el plano. Los dos
  casos de esta etapa: `a.enlace-patente` queda afuera y `.patente` es el objeto; el enlace que ocupa la división del
  tablero queda afuera y el cuerpo de la llave es el objeto. Un control que está **dentro** de un objeto sí usa
  `--obj-enlace` en su anillo, que se mide contra `--obj-hoja`.
- **Sobre `--obj-papel-2` solo va texto en `--obj-tinta` o `--obj-tinta-2`.** De noche no alcanzan 4,5:1
  `--obj-tinta-3` (4,12), `--obj-aten` (4,12), `--obj-crit` (4,24) ni `--obj-ok` (4,41). Como marca (3:1) sí sirven.
- `.objeto` lleva además `color-scheme: light` para los controles nativos de adentro, si los hubiera.

**Selector de tema.** El modo sigue la preferencia del dispositivo, salvo que la persona elija uno (15.4.5).
`main.ts` pone `data-modo="claro"` o `data-modo="oscuro"` en `<html>` antes de montar la aplicación; «Automático» es
la ausencia del atributo. `tokens.css` declara `color-scheme: light dark` en `:root`, `color-scheme: light` en
`:root[data-modo="claro"]` y `color-scheme: dark` en `:root[data-modo="oscuro"]`.

**Qué se comprueba antes de escribir el resto** (primer paso de la tanda de tokens, sobre `dist`): con tres tokens de
prueba, el color calculado en tres casos: (1) sistema en oscuro sin `data-modo`; (2) `data-modo="oscuro"` con el
sistema en claro; (3) un `.objeto` de noche. Si la versión compilada no responde a `data-modo`, se usa el **formato de
dos bloques**: `:root { … }` con los valores claros y los oscuros repetidos en `@media (prefers-color-scheme: dark) {
:root:not([data-modo="claro"]) { … } }` y en `:root[data-modo="oscuro"] { … }`. El control de contraste lee los dos
formatos. La especificación no cambia: cambia solo cómo se escribe `tokens.css`.

**Navegadores.** La piel nueva no puede subir el piso de navegadores de la demo. Lo que usa de forma nativa son las
consultas de contenedor con unidades `cqi` y `color-mix()`, que la demo ya usaba. `light-dark()` no se exige (se
compila o se reemplaza por los dos bloques). Las transiciones de vista y `text-wrap: balance` son mejora progresiva:
sin ellas todo funciona y se ve completo. No se usa `:has()`. El soporte exacto se documenta en `docs/stack.md` según
lo que resulte compilado.

#### 15.3.3 Pares de contraste (insumo del control de contraste)

Medidos con la fórmula de luminancia relativa de WCAG 2.x sobre los valores de 15.3.1 y 15.3.2: **124 pares, 231
mediciones, 0 fallan, 12 justas** (27/11/2026, con los 22 pares que sumó la revisión de accesibilidad y los 3 del
borde del primario de noche). «~» marca un
par justo: menos de 0,3 por encima de su mínimo; no se toca ninguno de esos colores sin volver a medir. «—» significa
que el par no se usa en ese modo (o que en ese modo la pieza se recorta por otro par, que está en la tabla). Esta
tabla es la que `scripts/contraste.mjs` tiene que reproducir leyendo `tokens.css`; un par nuevo se agrega acá y al
script antes de usarlo.

| Grupo | Par (texto o marca / fondo) | Claro | Oscuro | Mínimo | Dónde se usa |
| --- | --- | --- | --- | --- | --- |
| Texto | `--c-tinta` / `--c-papel` | 15,59 | 13,49 | 4,5 | Texto, secundario y rótulos sobre la página, la hoja y la fila con el cursor |
| Texto | `--c-tinta` / `--c-hoja` | 17,32 | 12,91 | 4,5 | Texto, secundario y rótulos sobre la página, la hoja y la fila con el cursor |
| Texto | `--c-tinta` / `--c-papel-2` | 13,98 | 10,61 | 4,5 | Texto, secundario y rótulos sobre la página, la hoja y la fila con el cursor |
| Texto | `--c-tinta-2` / `--c-papel` | 8,07 | 9,67 | 4,5 | Texto, secundario y rótulos sobre la página, la hoja y la fila con el cursor |
| Texto | `--c-tinta-2` / `--c-hoja` | 8,96 | 9,25 | 4,5 | Texto, secundario y rótulos sobre la página, la hoja y la fila con el cursor |
| Texto | `--c-tinta-2` / `--c-papel-2` | 7,23 | 7,61 | 4,5 | Texto, secundario y rótulos sobre la página, la hoja y la fila con el cursor |
| Texto | `--c-tinta-3` / `--c-papel` | 5,35 | 7,12 | 4,5 | Texto, secundario y rótulos sobre la página, la hoja y la fila con el cursor |
| Texto | `--c-tinta-3` / `--c-hoja` | 5,95 | 6,81 | 4,5 | Texto, secundario y rótulos sobre la página, la hoja y la fila con el cursor |
| Texto | `--c-tinta-3` / `--c-papel-2` | 4,80 ~ | 5,60 | 4,5 | Texto, secundario y rótulos sobre la página, la hoja y la fila con el cursor |
| Texto en fila elegida | `--c-tinta` / `--c-pleno-suave` | 14,39 | 8,97 | 4,5 | Fila elegida, campo recién editado |
| Texto en fila elegida | `--c-tinta-2` / `--c-pleno-suave` | 7,44 | 6,43 | 4,5 | Fila elegida, campo recién editado |
| Texto en fila elegida | `--c-tinta-3` / `--c-pleno-suave` | 4,94 | 4,73 ~ | 4,5 | Fila elegida, campo recién editado |
| Enlace | `--c-pleno-texto` / `--c-papel` | 7,47 | 8,83 | 4,5 | Enlaces, sello «Datos ficticios», marca «Para probar» |
| Enlace | `--c-pleno-texto` / `--c-hoja` | 8,29 | 8,44 | 4,5 | Enlaces, sello «Datos ficticios», marca «Para probar» |
| Enlace | `--c-pleno-texto` / `--c-papel-2` | 6,70 | 6,94 | 4,5 | Enlaces, sello «Datos ficticios», marca «Para probar» |
| Enlace | `--c-pleno-texto` / `--c-pleno-suave` | 6,89 | 5,87 | 4,5 | Enlaces, sello «Datos ficticios», marca «Para probar» |
| Foco (3:1) | `--c-pleno-texto` / `--c-papel` | 7,47 | 8,83 | 3 | Anillo de foco sobre cada fondo |
| Foco (3:1) | `--c-pleno-texto` / `--c-hoja` | 8,29 | 8,44 | 3 | Anillo de foco sobre cada fondo |
| Foco (3:1) | `--c-pleno-texto` / `--c-papel-2` | 6,70 | 6,94 | 3 | Anillo de foco sobre cada fondo |
| Foco (3:1) | `--c-pleno-texto` / `--c-pleno-suave` | 6,89 | 5,87 | 3 | Anillo de foco sobre cada fondo |
| Foco (3:1) | `--c-pleno-texto` / `--c-crit-fondo` | 6,86 | 8,30 | 3 | Anillo de foco sobre cada fondo |
| Foco (3:1) | `--c-pleno-texto` / `--c-aten-fondo` | 7,07 | 7,33 | 3 | Anillo de foco sobre cada fondo |
| Foco (3:1) | `--c-pleno-texto` / `--c-ok-fondo` | 7,07 | 6,77 | 3 | Anillo de foco sobre cada fondo |
| Foco sobre lo oscuro (3:1) | `--c-foco-oscuro` / `--c-lat` | 18,37 | 17,79 | 3 | Anillo en el lateral y en la barra inferior |
| Foco sobre lo oscuro (3:1) | `--c-foco-oscuro` / `--c-crit-relleno` | 5,74 | 4,66 | 3 | Anillo sobre la zona roja y la placa roja |
| Foco sobre el pleno (3:1) | `--c-sobre-pleno` / `--c-pleno` | 7,81 | 6,63 | 3 | Anillo **por dentro** de lo que tiene el pleno de fondo: destino actual del lateral y de la barra inferior, renglones de lectura dentro de la mordaza. También el canto de la mordaza. No es el anillo del botón pleno, que va por fuera (15.5) |
| Canto (3:1) | `--c-sobre-pleno` / `--c-crit-relleno` | 5,74 | — | 3 | De día, el canto de la mordaza contra la zona roja (cobalto contra rojo da 1,36: sin canto claro no se separan) |
| Campos (3:1) | `--c-pleno` / `--c-crit-relleno` | — | 3,96 | 3 | De noche, la mordaza crema contra la zona roja: se separan solas |
| Tinta como acción | `--c-sobre-tinta` / `--c-tinta` | 15,59 | 13,49 | 4,5 | Botón primario, índice de ficha, lectura de la escala |
| Tinta como acción | `--c-sobre-tinta` / `--c-tinta-hover` | 10,81 | 10,27 | 4,5 | Botón primario con el cursor encima |
| Canto del primario (3:1) | `--c-tinta-borde` / `--c-papel` | 15,59 | 4,52 | 3 | Borde y sombra dura del botón primario sobre la página |
| Canto del primario (3:1) | `--c-tinta-borde` / `--c-hoja` | 17,32 | 4,32 | 3 | Lo mismo sobre una hoja (diálogo, aviso, ficha) |
| Canto del primario (3:1) | `--c-tinta-borde` / `--c-papel-2` | 13,98 | 3,55 | 3 | Lo mismo sobre una zona o una fila con el cursor encima |
| Tinta como marca (3:1) | `--c-tinta` / `--c-papel` | 15,59 | 13,49 | 3 | Borde de botón, filete de 1,5 px, solapa elegida, cursor de la regla, línea de hoy, círculo de quincena |
| Tinta como marca (3:1) | `--c-tinta` / `--c-hoja` | 17,32 | 12,91 | 3 | Borde de botón, filete de 1,5 px, solapa elegida, cursor de la regla, línea de hoy, círculo de quincena |
| Tinta como marca (3:1) | `--c-tinta` / `--c-papel-2` | 13,98 | 10,61 | 3 | Borde de botón, filete de 1,5 px, solapa elegida, cursor de la regla, línea de hoy, círculo de quincena |
| Tinta como marca (3:1) | `--c-tinta` / `--c-pleno-suave` | 14,39 | 8,97 | 3 | Borde de botón, filete de 1,5 px, solapa elegida, cursor de la regla, línea de hoy, círculo de quincena |
| Control (3:1) | `--c-control` / `--c-papel` | 3,46 | 5,43 | 3 | Borde de campos, casillas y segmentado |
| Control (3:1) | `--c-control` / `--c-hoja` | 3,84 | 5,20 | 3 | Borde de campos, casillas y segmentado |
| Control (3:1) | `--c-control` / `--c-papel-2` | 3,10 ~ | 4,27 | 3 | Borde de un control en una fila con el cursor encima; borde del botón y del campo deshabilitados |
| Control (3:1) | `--c-control` / `--c-pleno-suave` | 3,19 ~ | 3,61 | 3 | Radios de «Ver como» en la fila elegida |
| Control (3:1) | `--c-control` / `--c-crit-fondo` | 3,18 ~ | 5,11 | 3 | Borde de un control dentro de una caja de fondo crítico |
| Deshabilitado | `--c-tinta-3` / `--c-papel-2` | 4,80 ~ | 5,60 | 4,5 | Texto del botón y del campo deshabilitados |
| Pleno | `--c-sobre-pleno` / `--c-pleno` | 7,81 | 6,63 | 4,5 | Cifra monumental, botón pleno, destino activo, segmento elegido |
| Pleno | `--c-sobre-pleno-2` / `--c-pleno` | 6,45 | 7,10 | 4,5 | Rótulos de la mordaza (12 px) |
| Pleno | `--c-sobre-pleno` / `--c-pleno-hover` | 9,83 | 5,72 | 4,5 | Botón pleno y renglón de lectura con el cursor encima |
| Pleno | `--c-sobre-pleno-2` / `--c-pleno-hover` | 8,12 | 6,14 | 4,5 | Rótulo de un renglón de lectura con el cursor encima |
| Pleno como campo (3:1) | `--c-pleno` / `--c-papel` | 6,63 | 12,79 | 3 | La mordaza y el destino activo que sobresale del lateral |
| Pleno como campo (3:1) | `--c-pleno` / `--c-hoja` | 7,36 | 12,24 | 3 | La mordaza y el destino activo que sobresale del lateral |
| Crítico (texto) | `--c-crit` / `--c-papel` | 5,51 | 7,52 | 4,5 | Mensajes, etiqueta, error de campo, cota de la zona roja |
| Crítico (texto) | `--c-crit` / `--c-hoja` | 6,12 | 7,19 | 4,5 | Mensajes, etiqueta, error de campo, cota de la zona roja |
| Crítico (texto) | `--c-crit` / `--c-papel-2` | 4,94 | 5,92 | 4,5 | Mensajes, etiqueta, error de campo, cota de la zona roja |
| Crítico (texto) | `--c-crit` / `--c-crit-fondo` | 5,06 | 7,07 | 4,5 | Mensajes, etiqueta, error de campo, cota de la zona roja |
| Crítico (texto) | `--c-crit` / `--c-pleno-suave` | 5,09 | 5,00 | 4,5 | Mensajes, etiqueta, error de campo, cota de la zona roja |
| Crítico (texto) | `--c-tinta` / `--c-crit-fondo` | 14,32 | 12,68 | 4,5 | Texto de un aviso crítico |
| Crítico (texto) | `--c-tinta-2` / `--c-crit-fondo` | 7,41 | 9,09 | 4,5 | Texto de un aviso crítico |
| Crítico (relleno) | `--c-sobre-solido` / `--c-crit-relleno` | 5,74 | 4,66 ~ | 4,5 | Sello de la zona roja, placa roja, insignia, «Con novedad» elegido |
| Crítico (marca, 3:1) | `--c-crit-marca` / `--c-papel` | 4,87 | 3,99 | 3 | Franja, precinto como marca, rombo del horizonte, borde de campo inválido |
| Crítico (marca, 3:1) | `--c-crit-marca` / `--c-hoja` | 5,41 | 3,82 | 3 | Franja, precinto como marca, rombo del horizonte, borde de campo inválido |
| Crítico (marca, 3:1) | `--c-crit-marca` / `--c-papel-2` | 4,37 | 3,14 ~ | 3 | Franja, precinto como marca, rombo del horizonte, borde de campo inválido |
| Crítico (marca, 3:1) | `--c-crit-marca` / `--c-crit-fondo` | 4,47 | 3,75 | 3 | Franja, precinto como marca, rombo del horizonte, borde de campo inválido |
| Crítico (campo, 3:1) | `--c-crit-relleno` / `--c-hoja` | 5,41 | 3,09 ~ | 3 | La zona roja contra la caja de la regla y contra la página |
| Crítico (campo, 3:1) | `--c-crit-relleno` / `--c-papel` | 4,87 | 3,23 ~ | 3 | La zona roja contra la caja de la regla y contra la página |
| Atención (texto) | `--c-aten` / `--c-papel` | 5,36 | 9,30 | 4,5 | Etiqueta y aviso de tarea |
| Atención (texto) | `--c-aten` / `--c-hoja` | 5,95 | 8,90 | 4,5 | Etiqueta y aviso de tarea |
| Atención (texto) | `--c-aten` / `--c-papel-2` | 4,80 | 7,31 | 4,5 | Etiqueta y aviso de tarea |
| Atención (texto) | `--c-aten` / `--c-aten-fondo` | 5,07 | 7,72 | 4,5 | Etiqueta y aviso de tarea |
| Atención (texto) | `--c-aten` / `--c-pleno-suave` | 4,94 | 6,18 | 4,5 | Etiqueta y aviso de tarea |
| Atención (texto) | `--c-tinta` / `--c-aten-fondo` | 14,75 | 11,20 | 4,5 | Texto de un aviso de atención |
| Atención (texto) | `--c-tinta-2` / `--c-aten-fondo` | 7,63 | 8,03 | 4,5 | Texto de un aviso de atención |
| Atención (marca, 3:1) | `--c-aten-relleno` / `--c-papel` | 3,61 | 6,90 | 3 | Franja, trama, triángulo del horizonte |
| Atención (marca, 3:1) | `--c-aten-relleno` / `--c-hoja` | 4,01 | 6,60 | 3 | Franja, trama, triángulo del horizonte |
| Atención (marca, 3:1) | `--c-aten-relleno` / `--c-papel-2` | 3,23 ~ | 5,43 | 3 | Franja, trama, triángulo del horizonte |
| Atención (marca, 3:1) | `--c-aten-relleno` / `--c-aten-fondo` | 3,41 | 5,73 | 3 | Franja, trama, triángulo del horizonte |
| En orden (texto) | `--c-ok` / `--c-papel` | 5,73 | 9,63 | 4,5 | «Disponible», parte cerrado |
| En orden (texto) | `--c-ok` / `--c-hoja` | 6,36 | 9,21 | 4,5 | «Disponible», parte cerrado |
| En orden (texto) | `--c-ok` / `--c-papel-2` | 5,14 | 7,57 | 4,5 | «Disponible», parte cerrado |
| En orden (texto) | `--c-ok` / `--c-ok-fondo` | 5,43 | 7,38 | 4,5 | «Disponible», parte cerrado |
| En orden (texto) | `--c-ok` / `--c-pleno-suave` | 5,29 | 6,40 | 4,5 | «Disponible», parte cerrado |
| En orden (texto) | `--c-tinta` / `--c-ok-fondo` | 14,76 | 10,34 | 4,5 | Texto de un aviso en orden |
| En orden (texto) | `--c-tinta-2` / `--c-ok-fondo` | 7,64 | 7,41 | 4,5 | Texto de un aviso en orden |
| Mes y neutro (marca, 3:1) | `--c-tinta-3` / `--c-hoja` | 5,95 | 6,81 | 3 | Aro del horizonte, franja de «Fuera de servicio» por taller y de baja |
| Mes y neutro (marca, 3:1) | `--c-tinta-3` / `--c-papel-2` | 4,80 | 5,60 | 3 | Aro del horizonte, franja de «Fuera de servicio» por taller y de baja |
| Mes y neutro (marca, 3:1) | `--c-tinta-3` / `--c-pleno-suave` | 4,94 | 4,73 | 3 | Aro del horizonte, franja de «Fuera de servicio» por taller y de baja |
| Lateral | `--c-lat-tx` / `--c-lat` | 15,05 | 15,20 | 4,5 | Destinos del lateral |
| Lateral | `--c-lat-tx-2` / `--c-lat` | 7,51 | 7,95 | 4,5 | Secciones, autoría, destinos sin elegir de la barra inferior |
| Objeto | `--obj-tinta` / `--obj-hoja` | 17,32 | 14,91 | 4,5 | Patente de la chapa y de la llave, veredicto «Puede salir» |
| Objeto | `--obj-tinta` / `--obj-papel` | 15,59 | 13,22 | 4,5 | Texto sobre el papel del objeto |
| Objeto | `--obj-tinta` / `--obj-papel-2` | 13,98 | 11,99 | 4,5 | Texto sobre la zona sin cubrir de un objeto (solo tinta y tinta-2: 15.3.2) |
| Objeto | `--obj-tinta-2` / `--obj-hoja` | 8,96 | 7,71 | 4,5 | Rótulo de cota, modelo de la unidad |
| Objeto | `--obj-tinta-2` / `--obj-papel-2` | 7,23 | 6,20 | 4,5 | Texto secundario sobre la zona sin cubrir de un objeto |
| Objeto | `--obj-tinta-3` / `--obj-hoja` | 5,95 | 5,12 | 4,5 | Texto terciario dentro de un objeto |
| Objeto | `--obj-tinta-3` / `--obj-papel` | 5,35 | 4,54 ~ | 4,5 | Texto terciario sobre el papel secundario del objeto |
| Objeto | `--obj-tinta` / `--obj-pleno-suave` | 14,39 | 14,39 | 4,5 | Texto en una fila elegida dentro de un objeto |
| Objeto | `--obj-tinta-2` / `--obj-pleno-suave` | 7,44 | 7,44 | 4,5 | Texto secundario en una fila elegida dentro de un objeto |
| Objeto | `--obj-sobre-franja` / `--obj-franja` | 7,81 | 7,81 | 4,5 | Patente de la llave disponible con el cursor encima o con el foco |
| Objeto | `--obj-crit` / `--obj-crit-fondo` | 5,06 | 5,06 | 4,5 | Etiqueta crítica con fondo dentro de un objeto |
| Objeto | `--obj-ok` / `--obj-ok-fondo` | 5,43 | 5,43 | 4,5 | Etiqueta en orden con fondo dentro de un objeto |
| Objeto | `--obj-enlace` / `--obj-hoja` | 8,29 | 7,14 | 4,5 | Enlace dentro de un objeto |
| Objeto | `--obj-crit` / `--obj-hoja` | 6,12 | 5,27 | 4,5 | Veredicto «No puede salir hoy», estado crítico del rótulo de cota |
| Objeto | `--obj-aten` / `--obj-hoja` | 5,95 | 5,12 | 4,5 | Patente de la llave bloqueada, en su placa lisa |
| Objeto | `--obj-aten` / `--obj-aten-fondo` | 5,07 | 5,07 | 4,5 | Estado de atención dentro de un objeto |
| Objeto | `--obj-ok` / `--obj-hoja` | 6,36 | 5,48 | 4,5 | Estado en orden del rótulo de cota |
| Objeto | `--c-sobre-solido` / `--obj-crit-relleno` | 5,74 | 5,74 | 4,5 | Patente de la llave fuera de servicio, en su placa roja |
| Objeto (marca, 3:1) | `--obj-franja` / `--obj-hoja` | 7,36 | 6,34 | 3 | Franja cobalto de la chapa |
| Objeto (marca, 3:1) | `--obj-control` / `--obj-hoja` | 3,84 | 3,31 | 3 | Borde de control dentro de un objeto |
| Objeto (marca, 3:1) | `--obj-crit-relleno` / `--obj-hoja` | 5,41 | 4,66 | 3 | Precinto del veredicto bloqueado |
| Objeto (marca, 3:1) | `--obj-aten-relleno` / `--obj-hoja` | 4,01 | 3,45 | 3 | Trama de la llave bloqueada |
| Objeto (marca, 3:1) | `--obj-tinta-3` / `--obj-papel-2` | 4,80 | 4,12 | 3 | Precinto de la llave fuera de servicio por taller o a mano |
| Objeto (marca, 3:1) | `--obj-contorno` / `--obj-crit-relleno` | — | 4,66 | 3 | De noche, el contorno claro contra el cuerpo rojo de la llave y de la chapa críticas |
| Objeto (marca, 3:1) | `--obj-contorno` / `--obj-franja` | — | 6,34 | 3 | De noche, el contorno claro contra el cuerpo cobalto de la llave disponible con el cursor encima |
| Objeto contra el plano (3:1) | `--obj-tinta` / `--c-papel` | 15,59 | — | 3 | De día el objeto se recorta por su contorno de tinta |
| Objeto contra el plano (3:1) | `--obj-tinta` / `--c-hoja` | 17,32 | — | 3 | De día, la chapa dentro de una tabla |
| Objeto contra el plano (3:1) | `--obj-hoja` / `--c-papel` | — | 12,23 | 3 | De noche el objeto se recorta por su papel claro |
| Objeto contra el plano (3:1) | `--obj-hoja` / `--c-hoja` | — | 11,70 | 3 | De noche, la chapa dentro de una tabla |
| Objeto contra el plano (3:1) | `--obj-hoja` / `--c-papel-2` | — | 9,62 | 3 | De noche, la chapa en una fila con el cursor encima |
| Objeto contra el plano (3:1) | `--obj-hoja` / `--c-pleno-suave` | — | 8,13 | 3 | De noche, la chapa en una fila elegida |
| Objeto contra el plano (3:1) | `--obj-crit-relleno` / `--c-papel` | 4,87 | — | 3 | De día, la llave y la chapa críticas se recortan por su cuerpo rojo |
| Objeto contra el plano (3:1) | `--obj-crit-relleno` / `--c-hoja` | 5,41 | — | 3 | De día, la llave y la chapa críticas se recortan por su cuerpo rojo |
| Objeto contra el plano (3:1) | `--obj-crit-relleno` / `--c-papel-2` | 4,37 | — | 3 | De día, la llave y la chapa críticas se recortan por su cuerpo rojo |
| Objeto contra el plano (3:1) | `--obj-franja` / `--c-papel` | 6,63 | — | 3 | De día, la llave disponible con el cursor encima se recorta por su cuerpo cobalto |
| Objeto contra el plano (3:1) | `--obj-contorno` / `--c-papel` | — | 12,23 | 3 | De noche, un objeto de cuerpo lleno se recorta por su contorno claro |
| Objeto contra el plano (3:1) | `--obj-contorno` / `--c-hoja` | — | 11,70 | 3 | De noche, un objeto de cuerpo lleno se recorta por su contorno claro |
| Objeto contra el plano (3:1) | `--obj-contorno` / `--c-papel-2` | — | 9,62 | 3 | De noche, un objeto de cuerpo lleno se recorta por su contorno claro |

**Objetos de cuerpo lleno, de noche.** La regla «el objeto se recorta 3:1 contra el plano» se cumple con el papel
claro solo si el cuerpo es papel. De noche el rojo de la llave crítica da 2,63:1 contra `--c-papel`, 2,51 contra
`--c-hoja` y 2,07 contra `--c-papel-2`; el cobalto de la llave disponible con el cursor encima, 1,93, 1,85 y 1,52; y
el contorno de tinta, 1,22. Por eso esas piezas llevan el contorno `--obj-contorno` (15.3.2), que de noche es papel
claro.

Lo que esta tabla **no** cubre y se mide sobre lo maquetado, en imagen: el texto de 12 px sobre el pleno con la rejilla
detrás (por eso va en placa lisa: 15.2, regla 8), los píxeles de grano bajo la cifra monumental (texto grande: mínimo
3:1) y el filete de las fichas de noche (decorativo). El par cobalto sobre tinta del lateral (el destino activo contra
el fondo del lateral, de día) da 2,35:1 y **no se usa como señal**: el destino activo se reconoce por la marca clara
de 3 px, por el texto y porque sobresale sobre la página (15.4.2).

#### 15.3.4 Correspondencia de los nombres `--c-*` actuales

Los nombres actuales (496 usos en 52 archivos) son la interfaz: **se quedan** y pasan a ser alias de los tokens
nuevos. Una pantalla todavía sin vestir sigue andando con la paleta nueva.

| Nombre actual | Pasa a valer | Nota |
| --- | --- | --- |
| `--c-escritorio`, `--c-fondo` | `--c-papel` | |
| `--c-superficie` | `--c-hoja` | |
| `--c-superficie-2`, `--c-ventana-control-hover` | `--c-papel-2` | |
| `--c-ventana-barra` | `--c-papel` | Cabecera y pie de diálogo; barra de estado de la ficha. |
| `--c-ventana-borde` | `--c-filete-medio` | |
| `--c-texto`, `--c-texto-2`, `--c-texto-3` | `--c-tinta`, `--c-tinta-2`, `--c-tinta-3` | |
| `--c-borde` | `--c-filete` | |
| `--c-borde-fuerte` | `--c-control` | |
| `--c-acento`, `--c-tinta` | `--c-tinta` | `--c-tinta` pasa a ser el valor de base y `--c-acento` su alias. |
| `--c-acento-hover`, `--c-tinta-hover` | `--c-tinta-hover` | |
| `--c-acento-texto`, `--c-sobre-tinta` | `--c-sobre-tinta` | |
| `--c-acento-suave`, `--c-edicion` | `--c-pleno-suave` | |
| `--c-enlace`, `--c-foco` | `--c-pleno-texto` | |
| `--c-ok-t` / `-f` / `-r` | `--c-ok` / `--c-ok-fondo` / `--c-ok` | |
| `--c-revisar-t` / `-f` / `-r` | `--c-aten` / `--c-aten-fondo` / `--c-aten-relleno` | |
| `--c-diferencia-t` / `-f` / `-r` | `--c-crit` / `--c-crit-fondo` / `--c-crit-marca` | |
| `--c-pendiente-t` / `-f` / `-r` | `--c-tinta` / `--c-papel-2` / `--c-tinta` | La azurita deja de ser un tono. |
| `--c-neutro-t` / `-f` / `-r` | `--c-tinta-2` / `--c-papel-2` / `--c-tinta-3` | |
| `--c-critico-*`, `--c-semana-*`, `--c-quincena-*`, `--c-mes-*`, `--c-vigente-*` | sin cambios | Siguen siendo alias de los cinco grupos de arriba. |
| `--c-critico-solido` | `--c-crit-relleno` | |
| `--c-sobre-solido`, `--c-sobre-solido-2`, `--c-peligro-texto` | `#FFFFFF` | El texto chico sobre el rojo también es blanco: es el único que alcanza 4,5:1. |
| `--c-peligro-hover` | `--c-crit-fondo` | El botón de peligro pasa a ser de contorno (15.5.1). |
| `--c-foco-oscuro` | `#FFFFFF` | |
| `--c-patente-fondo` | `--obj-hoja` | |
| `--c-patente-banda` | `--obj-franja` | |
| `--c-hoy` | `--c-tinta` | |
| `--c-lat`, `--c-lat-tx`, `--c-lat-tx-2`, `--c-lat-hover`, `--c-lat-borde` | valores de 15.3.1 | |
| `--c-lat-activo` / `--c-lat-activo-tx` | `--c-pleno` / `--c-sobre-pleno` | |
| `--c-velo` | valor de 15.3.1 | |

Regla que nace de esta tabla: **ningún texto va sobre `--c-critico-r`** (es marca). El relleno con texto es
`--c-critico-solido`. Hoy `Boton.svelte` pinta el botón de peligro con `--c-critico-r` de fondo: al vestirlo pasa a
contorno. Los tokens que queden sin ningún uso al cerrar la maquetación se borran.

#### 15.3.5 Tipografía

Las mismas tres familias alojadas, los mismos tres archivos y las mismas declaraciones `@font-face` (`font-display:
swap` con la fuente de reemplazo «Ajustada»). **No cambia ninguna métrica**: si alguna cambiara, se vuelve a medir la
«Ajustada».

| Rol | Familia | Ancho | Pesos |
| --- | --- | --- | --- |
| **Cartel**: cifra monumental, veredicto, cifras de lectura, `h1`, título de diálogo, marca | Bricolage Grotesque (`--t-familia-titulo`) | 75 % en cifras y veredicto (`--t-ancho-cifra`), 78 % en títulos (`--t-ancho-titulo`) | 760 en títulos, 780 en cifras |
| **Texto**: interfaz, párrafos, botones, títulos de ficha | Schibsted Grotesk (`--t-familia`) | — | 400, 600, 650 |
| **Técnica**: patentes, códigos de lámina, rótulos, cifras de tabla, ejes, cotas | Red Hat Mono (`--t-mono`) | — | **500 y 600** (el archivo se declara con ese rango: no pedir 700) |

| Token | Valor | Uso |
| --- | --- | --- |
| `--t-monumental` | por contenedor: `clamp(3.5rem, 22cqi, 12.5rem)` con la regla de 37,5 rem o más y `clamp(3.5rem, 38cqi, 7.5rem)` por debajo (15.6.2) | La cifra de la mordaza. Se dimensiona por el ancho del campo (la mordaza), no de la ventana. Interlínea 0,74. |
| `--t-veredicto` | `3.75rem` (60 px); `2.875rem` (46 px) si ocupa dos renglones | El veredicto de Hoy. Interlínea 0,86. |
| `--t-cifra-grande` | `5.5rem` (88 px) | El número del sello de la zona roja; baja por contenedor hasta `2.75rem`. |
| `--t-cifra` | `2.75rem` (44 px); `2rem` por debajo de 45 rem | Cifras de lectura fuera de la mordaza. |
| `--t-h1` | `clamp(2rem, 1.6rem + 1.6vw, 2.75rem)` | Título de pantalla, cartel a 78 %, peso 760, interlínea 1. Se conserva el tope `min(var(--t-h1), 14vw)`. |
| `--t-h2` | `1.5rem` | Título de sección suelta (parte, estado vacío), cartel a 78 %, peso 760. |
| `--t-h2-ficha` | `1rem` | Título de ficha (`Panel`), en la letra de texto, peso 650. |
| `--t-h3` | `1rem` | Grupo, en la letra de texto, peso 650. |
| `--t-cuerpo` | `0.875rem` desde 64 rem; `0.9375rem` por debajo | Texto general. Los campos de formulario por debajo de 64 rem siguen en `1rem` (16 px evita el zoom automático de iOS). |
| `--t-tabla` · `--t-chico` | `0.8125rem` | Celdas; ayudas y notas. |
| `--t-rotulo` | `0.75rem` | Rótulos en técnica, mayúsculas, `letter-spacing: 0.06em`, peso 500. Mínimo absoluto. |
| `--t-patente-chica` · `--t-patente-grande` · `--t-patente-llave` | `0.8125rem` · `1.625rem` · `2.125rem` (`1.75rem` por debajo de 22,5 rem) | Chapa en tablas; en el título de la ficha y del parte; en la llave de Hoy. |

- `h1` usa cartel; `h2` y `h3` dejan de heredar el cartel por defecto: `base.css` les pone la letra de texto, y las
  secciones sueltas piden el cartel con `--t-h2`.
- Cifras tabulares solo en cifras sueltas y columnas, nunca dentro de una oración (regla de 3.4, sin cambios). Las
  cifras de tabla van en técnica.
- Medida de lectura de los párrafos: `max-width: 62ch` (sin cambios).
- **La coreografía no espera a las letras para mostrar texto**: con `swap` el texto se ve siempre. Lo que espera es
  el movimiento (15.10).

#### 15.3.6 Espacio, formas, sombras y texturas

- **Espaciado:** se conserva la escala `--e-1` a `--e-8` (`0.25rem` a `4rem`) y `--gutter` (16, 24 y 32 px).
- **Radios:** `--r-0: 0` (fichas, paneles, diálogos, caja de la regla) · `--r-1: 2px` y `--r-2: 2px` (controles) ·
  `--r-chapa: 3px` · `--r-redondo: 999px` (solo piezas físicas: globo, agujero, punto). `--r-3`, `--r-4` y
  `--r-pildora` pasan a `0`, `0` y `2px`: ya no hay píldoras. Quien necesite un círculo usa `--r-redondo`.
- **Bordes:** `--b-filete: 1px` · `--b-control: 1.5px` (sin cambios) · `--b-fuerte: 1.5px` (cabeza de ficha, botón) ·
  `--b-caja: 2px` (caja de la regla, llave de Hoy, diálogo).
- **Sombras:** `--s-panel: none` (las fichas no llevan sombra) · `--s-dura: 0 2px 0` (botones; el color lo pone el
  botón) · `--s-pieza: 0 1px 0 var(--obj-sombra)` (objetos) · `--s-flotante: 0 10px 18px -10px rgb(0 0 0 / 0.5), 0 2px
  0 var(--c-filete-medio)` (menú, rótulo de cota, chapa con el cursor encima) · `--s-ventana: 0 18px 30px -16px rgb(0 0
  0 / 0.55)` (diálogo).
- **Alturas y anchos fijos** (se cambian junto con `scroll-padding`):

  | Token | Valor | Antes |
  | --- | --- | --- |
  | `--ancho-lateral` | `14.75rem` (236 px) | `16rem` |
  | `--alto-lamina` (nuevo) | `3.5rem` (56 px): barra de escritorio | — |
  | `--alto-barra` | `3.375rem` (54 px): barra superior por debajo de 64 rem | `3.25rem` |
  | `--alto-franja` | `0`: la franja desaparece; el token queda hasta que nadie lo use | `1.625rem` |
  | `--alto-pestanas` | `3.875rem` (62 px): barra inferior | `4rem` |
  | `--alto-control` (nuevo) | `2.25rem` (36 px) desde 64 rem; `2.75rem` por debajo | — |
  | `--alto-tactil`, `--alto-segmento`, `--alto-barra-envio` | sin cambios (44, 48 y 72 px) | |

  `scroll-padding-top`: alto de la barra visible más 12 px. `scroll-padding-bottom`: por debajo de 64 rem, alto de la
  barra inferior más el área segura más 16 px (en el parte, el de la barra de envío, como hoy).
- **Texturas** (`src/estilos/texturas/`, SVG propios, cada uno de menos de 4 kB para que la compilación los incruste
  como `data:`; la CSP ya permite `img-src 'self' data:`; **ningún pedido nuevo**):

  | Archivo | Dónde | Cómo |
  | --- | --- | --- |
  | `grano-claro.svg` | Página (de día), campo pleno, zona roja | Mosaico de 160 a 200 px. Ruido al 12–16 %. |
  | `grano-oscuro.svg` | Página (de noche) | Igual. |
  | `exposicion.svg` | Página (de noche) | Manchas grandes y suaves al 13 %, mosaico de 720 px. |
  | `registro.svg` | Una marca de registro en la esquina superior derecha de la mordaza, solo con el tablero completo | Máscara pintada con `--c-sobre-pleno`, opacidad 0,55, `aria-hidden`. |

  De noche la página suma la **cuadrícula del plano**: líneas de 1 px cada 48 px (tinta al 7 %) y cada 12 px (al
  2,8 %), con gradientes. Las pilas de fondo por modo son tokens (`--tx-pagina`, `--tx-pleno`, `--tx-roja`) declarados
  en `tokens.css`, que es el único archivo que distingue el modo. Sin `background-attachment: fixed`. Las hojas
  (`--c-hoja`) tapan la textura: detrás de un texto de lectura nunca hay grano ni cuadrícula.
- **Precinto:** `repeating-linear-gradient(-45deg, <color> 0 1.5px, transparent 1.5px 7px)`. En la zona roja, sobre el
  relleno: `rgb(0 0 0 / 0.2)` de 2 px cada 9 px.

#### 15.3.7 Movimiento

| Token | Valor | Uso |
| --- | --- | --- |
| `--m-curva` | `cubic-bezier(0.16, 0.9, 0.12, 1)` | «Tope»: arranca rápido y frena contra el tope. Mordaza, tambores, diálogo. La curva de la casa. |
| `--m-curva-resorte` (nuevo) | `cubic-bezier(0.34, 1.5, 0.6, 1)` | Encaje con rebote corto: llave que cae, sello que se estampa. |
| `--m-curva-carro` (nuevo) | `cubic-bezier(0.65, 0, 0.35, 1)` | Va y vuelve: cursor de calibre del botón. |
| `--m-rapido` · `--m-medio` · `--m-lento` · `--m-largo` (nuevo) | `90ms` · `160ms` · `320ms` · `640ms` | Clic · cursor encima y foco · diálogo y disclosure · mordaza. |

`prefers-reduced-motion: reduce` y `:root[data-movimiento="quieto"]` valen lo mismo: `base.css` apaga **todas** las
animaciones y transiciones (`animation: none; transition: none`), también las de las transiciones de vista, y el
JavaScript no inicia ninguna (`quiereMenosMovimiento()` consulta las dos cosas). Todo aparece completo y en su estado
final. La coreografía está en 15.10.

**Colores forzados** (`forced-colors: active`): foco con `Highlight`; bordes de fichas, chapa, llave y caja de la regla
con `CanvasText`; la mordaza con `Highlight` de fondo y `HighlightText` de texto; la zona roja con borde `CanvasText` y
el precinto dibujado con `CanvasText`; las texturas de página se quitan. Ningún dato depende de un color de autor.

---

### 15.4 Marco

Un solo corte, el de siempre: **64 rem**. Desde ahí, lateral y barra de escritorio; por debajo, barra superior y barra
inferior. No hay lateral como panel con velo. Orden del DOM y de tabulación: el de la sección 2, sin cambios.

#### 15.4.1 Escritorio (desde 64 rem)

```
┌─────────────────┬──────────────────────────────────────────────────────────────────────┐
│ ▣ Control       │ FL-05   ‹ Movilidades                 ◆ DATOS FICTICIOS   viernes 27/11/2026 │ 56 px, fija
│   de flota      ├──────────────────────────────────────────────────────────────────────┤
│                 │ (avisos globales, si hay)                                             │
│   Inicio      ④ │                                                                      │
│ FLOTA           │  Título de la pantalla (h1)                                          │
│ ▌Movilidades ▒▒▒▒▶ el destino activo sobresale sobre la página                          │
│   Vencimientos③ │                                                                      │
│ OPERACIÓN       │  contenido (ancho máximo: --ancho-max)                               │
│   Operación   ⑤ │                                                                      │
│ ─────────────── │                                                                      │
│ Cómo funciona   │                                                                      │
│ Reiniciar demo  │                                                                      │
│ Ver como        │                                                                      │
│ Encargado     ⌄ │                                                                      │
│ APARIENCIA      │                                                                      │
│ [Claro|Oscuro|Automático]                                                              │
│ [ Sin animaciones ]                                                                    │
│ ← Volver al portafolio                                                                 │
│ autoría · Más → │                                                                      │
└─────────────────┴──────────────────────────────────────────────────────────────────────┘
  236 px, fijo, alto de la ventana; regla graduada en el canto derecho
```

**El segundo rótulo del lateral es «Operación»** (decisión DE2 de Matías, 28/11/2026): el dibujo, 15.4.2 y la fila 25
de 15.14 dicen lo mismo.

#### 15.4.2 Lateral

- Fondo `--c-lat` (tinta de día, Prusia profundo de noche), texto `--c-lat-tx`. Ancho `--ancho-lateral`. En el canto
  derecho, una **regla graduada** dibujada con gradientes (marca cada 8 px, mayor cada 40 px, en `--c-lat-borde`):
  decorativa, `pointer-events: none`.
- **Marca:** ícono de la casa (15.13) y «Control de flota» en cartel a 78 %, 20 px. Ya no lleva debajo la etiqueta de
  la demo: el aviso de datos ficticios es el sello de la barra.
- **Destinos:** los de hoy y en el mismo orden. Encargado: Inicio; rótulo «Flota»; Movilidades; Vencimientos; rótulo
  «Operación»; Operación diaria. Conductor: Hoy; Mis partes (sin rótulos). Los rótulos de sección son presentación
  (`aria-hidden="true"`, en técnica de 12 px, `--c-lat-tx-2`): la lista sigue siendo una sola lista de enlaces.
- **Ítem:** 36 px de alto, ícono de 17 px, texto de 14 px y peso 500, insignia a la derecha.

  | Estado | Aspecto |
  | --- | --- |
  | Normal | Texto `--c-lat-tx`. |
  | Cursor encima | Fondo `--c-lat-hover` y marca de 3 px a la izquierda en `--c-lat-tx`. |
  | Foco | Anillo de 3 px en `--c-foco-oscuro`, por dentro (`outline-offset: -3px`). |
  | Activo (pulsado) | Fondo `--c-lat-tx` al 14 %. |
  | **Actual** (`aria-current="page"`) | Fondo `--c-pleno`, texto `--c-sobre-pleno` en peso 650, marca de 3 px a la izquierda en `--c-sobre-pleno`, y el ítem **sobresale del lateral sobre la página** `min(1.375rem, var(--gutter) - 0.625rem)`, como la mordaza de un calibre. |
  | **Foco sobre el actual** | Anillo de 3 px en **`--c-sobre-pleno`**, por dentro (7,81:1 de día y 6,63 de noche contra `--c-pleno`). No `--c-foco-oscuro`: de noche el pleno es crema y el blanco da 1,18:1. |
  | Actual en ventanas bajas (menos de 47,5 rem de alto) | No sobresale; el lateral desplaza por dentro. |

- **Insignias:** las de 4.3 (mismas cifras, mismos nombres accesibles). Cuadradas, técnica de 12 px, mínimo 22 px de
  ancho. Críticas: `--c-crit-relleno` con `--c-sobre-solido`. Las demás: borde `--c-lat-borde` y texto `--c-lat-tx`.
  Sobre el ítem actual, la insignia no crítica usa borde y texto `--c-sobre-pleno`.
- **Pie del lateral**, separado por un filete, de arriba abajo: «Cómo funciona» (botón, **siempre visible**),
  «Reiniciar demo», el botón de perfil «Ver como» (dos renglones: rótulo y perfil, con flecha; es **el único** botón
  visible cuyo nombre accesible empieza con «Ver como»), el control «Apariencia» (15.4.5), «Volver al portafolio», la
  autoría y el enlace «Más».

#### 15.4.3 Barra de escritorio: encabezado de lámina

Reemplaza a las migas. 56 px, fija arriba del contenido, fondo `--c-papel` al 92 % con desenfoque de 6 px y filete
inferior `--c-filete-medio`.

- **Izquierda:** el **código de lámina** (`FL-01` a `FL-09`, tabla de 15.9) en técnica de 12 px, `--c-tinta-3`. Va
  **fuera del `h1`**: es un elemento de la barra. En la **ficha** y en el **parte**, a continuación, el **enlace al
  padre**: «‹ Movilidades», «‹ Operación diaria» u «‹ Hoy», según 2 (es la única vuelta atrás en escritorio). Enlace de
  14 px y peso 600 en `--c-pleno-texto`, con 36 px de alto de objetivo; conserva su `nav` con nombre («Ruta») y el
  nombre accesible «Volver a …». En las pantallas del menú no hay enlace: ya no se repite el nombre de la pantalla ni
  el de la solapa.
- **Derecha:** el **sello «Datos ficticios»** y la fecha («viernes 27/11/2026», técnica de 12 px, `--c-tinta-2`).
- **Sello:** 26 px de alto, técnica de 12 px en mayúsculas con `letter-spacing: 0.08em`, color `--c-pleno-texto`, borde
  de 1,5 px y un segundo filete de 1 px separado 2 px (doble borde, como un sello de goma), girado −1,5°. No es un
  control. Su texto visible es corto; el nombre completo va en texto para lectores (15.14).

#### 15.4.4 Celular y tableta (menos de 64 rem)

```
Pantallas del menú                         Ficha y parte
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│ ▣ Control de flota  ◆DATOS FICT. ●Encarg.⌄│  │ ‹  Unidad ZYN 469          ●Encargado ⌄│ 54 px
├──────────────────────────────────────┤  ├──────────────────────────────────────┤
│ FL-01                 viernes 27/11/2026 │  │ FL-05               ◆ DATOS FICTICIOS │ renglón de lámina
│ Inicio                               │  │ [ZYN 469]                            │
```

- **Barra superior:** 54 px, fija, fondo `--c-papel` **opaco** (sin desenfoque), filete inferior. Un solo piso: la
  franja «Demo con datos ficticios · fecha» desaparece.
  - **Pantallas del menú:** marca (ícono y nombre) · sello · **chip de perfil**. Al bajar la página, el título de la
    pantalla ocupa el lugar de la marca (como hoy).
  - **Ficha y parte:** «‹ Atrás» (44 × 44, con su nombre accesible «Volver a …») · título (cartel de 18 px, una línea,
    con elipsis; sigue siendo `aria-hidden` porque el `h1` lo dice) · chip de perfil. **El sello no entra** y baja al
    renglón de lámina.
  - **Qué cede, en orden, cuando falta ancho:** (1) por debajo de 30 rem, la marca queda en su ícono; (2) por debajo
    de 23,75 rem, el sello aprieta su espaciado (`letter-spacing: 0.04em`, relleno de 6 px); (3) por debajo de
    22,5 rem (el caso de 320 px), el sello baja al renglón de lámina, como en la ficha y el parte; (4) el chip de
    perfil nunca se parte ni se oculta: si el nombre del perfil es largo («Conductor · Tamara»), se corta con elipsis
    dentro del chip. A 360 px entran el ícono de la marca, el sello apretado y el chip (unos 338 px de 360, por
    cuenta de anchos; se mide en el boceto).
- **Chip de perfil:** 44 px de alto, borde de 1,5 px en tinta, radio 2 px, punto de 8 px y flecha. Es el único botón
  visible que empieza con «Ver como» por debajo de 64 rem y abre el diálogo «Ver como» en un clic. Estados: los del
  botón secundario (15.5.1).
- **Renglón de lámina:** primer elemento dentro de `main`, antes del `h1`. Código de lámina a la izquierda y, a la
  derecha, la fecha (pantallas del menú) o el sello (ficha y parte, y cualquier pantalla por debajo de 22,5 rem: ahí
  la fecha no se muestra). Técnica de 12 px. Solo se muestra por debajo de 64 rem (en escritorio esa información está
  en la barra): es el mismo dato en dos lugares, y solo uno se dibuja.
- **Barra inferior** (`nav` «Secciones»): 62 px más el área segura, fondo `--c-lat`, filete superior de 2 px en
  tinta. Los mismos destinos y el mismo orden que hoy. Cada destino ocupa su columna entera (objetivo de 62 px de
  alto), con ícono de 20 px y nombre de 12 px y peso 600.

  | Estado | Aspecto |
  | --- | --- |
  | Normal | Texto e ícono `--c-lat-tx-2`. |
  | Foco | Anillo de 3 px en `--c-foco-oscuro`, por dentro. |
  | Pulsado | Fondo `--c-lat-tx` al 14 %. |
  | **Actual** (`aria-current="page"`) | Fondo `--c-pleno`, texto `--c-sobre-pleno`. |
  | **Foco sobre el actual** | Anillo de 3 px en **`--c-sobre-pleno`**, por dentro (7,81:1 y 6,63). Nunca `--c-foco-oscuro` sobre el pleno (1,18:1 de noche). |

  Insignia arriba a la derecha del ícono, como en el lateral. En el parte no hay barra inferior: manda la barra de
  envío (sin cambios).

  **Columnas y nombres (revisión del boceto, 27/11/2026).**
  - **Columnas iguales**, repartidas por partes iguales (`repeat(N, 1fr)`) y sin relleno lateral dentro de la
    columna. Con cinco destinos (encargado) mide 78 px a 390, 72 a 360 y 64 a 320; con tres (conductor), un tercio.
    El ancho **no se reparte según el largo del nombre**: así el pulgar encuentra cada destino siempre en el mismo
    lugar y ninguno baja de los 44 px que pide la regla 10 de 15.2 (con columnas proporcionales, «Más» medía 43,4 px
    a 360 y 35,4 a 320).
  - **Nombres en la letra de cartel angosta**: Bricolage Grotesque a 78 % de ancho (`--t-ancho-titulo`), 12 px y peso
    600. Medidos con la fuente real, «Vencimientos» (el más largo) mide 62,6 px (60,4 a 75 %); con la letra de texto
    medía 77,8 px y no entraba en 72. A 72 px sobra; a 64 px (320) queda 1,4 px de aire, sin relleno. **No se abrevia
    ningún nombre ni se baja de 12 px.** Si sobre lo maquetado desborda a 320 px, se avisa al diseño.
  - **Verificación:** el control de medidas del boceto y el de producción suman el piso de **44 px** de lado a lado
    a todo lo pulsable del marco por debajo de 64 rem (hoy solo avisan por debajo de 24 px).

#### 15.4.5 Control «Apariencia»

Un grupo con título «Apariencia» que **no** empieza con «Ver como». Vive solo en la pantalla «Más» (todos los anchos):
salió del pie del lateral por el segundo recorte del presupuesto de peso (decisión DE7 de Matías, 28/11/2026), y el
lateral no lo lleva.

- **Tema:** tres opciones excluyentes, «Claro», «Oscuro» y «Automático». Son `input type="radio"` nativos dentro de un
  `fieldset` con su `legend`, dibujados como un **segmentado** (15.5.8): las flechas mueven entre opciones sin código
  propio. «Automático» es la opción por defecto y sigue al dispositivo.
- **«Sin animaciones»:** un botón con `aria-pressed`. Apretado: fondo `--c-tinta` y texto `--c-sobre-tinta` (en el
  lateral, fondo `--c-lat-tx` y texto `--c-lat`), con una marca cuadrada llena antes del texto; sin apretar, la marca
  es un cuadrado vacío. La marca hace que el estado no dependa del color.
- En el lateral todo mide 36 px de alto; en «Más», 44 px.
- Las dos preferencias se guardan en el equipo (`localStorage`) y se aplican antes de montar la aplicación
  (`data-modo` y `data-movimiento` en `<html>`). Al cambiar el tema se actualiza también `theme-color`. El cambio de
  tema es **instantáneo** en esta etapa (la exposición animada llega en la etapa 3 del rediseño).
- Estados de cada control: normal, cursor encima (`--c-papel-2`, o `--c-lat-hover` en el lateral), foco (anillo),
  pulsado, elegido. En el lateral el anillo de estos controles es `--c-foco-oscuro` y va **por fuera**, con 2 px de
  separación, sobre `--c-lat` (18,37:1 y 17,79): elegido o apretado, el control tiene fondo claro, y por dentro el
  blanco daría 1,2:1. No tienen estado deshabilitado, de error ni de carga. Si `localStorage` no está disponible, los
  controles funcionan igual y la preferencia dura lo que dura la sesión; no se muestra un error.

#### 15.4.6 Arranque: el cuadro cero

Mientras la aplicación arranca (`fase === "arrancando"`) se muestra el **cuadro cero de la regla**: la caja del calibre
vacía, sin ningún dato falso.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │  caja de la regla: borde de 2 px en tinta,
│   Preparando la flota de ejemplo…                            │  fondo --c-hoja, mismo alto que la regla real
│   ▰▰▰▰▱▱▱▱▱▱ (progress nativo)                               │  (15.6.2), sin mordaza, sin cifra, sin llaves
│                                                              │
└──────────────────────────────────────────────────────────────┘
├──────────────────────────────────────────────────────────────┤  escala sin marcas ni números (solo la línea)
```

- Arriba de la caja se reserva el alto del encabezado de la pantalla (renglón de lámina, título y línea) como espacio
  vacío: cuando llegan los datos, la regla aparece **en el mismo lugar y con el mismo tamaño**, sin salto de diseño.
  No hay bloques grises ni brillo de carga.
- Se conserva tal cual lo que fijan las pruebas: el contenedor `role="status"`, el texto «Preparando la flota de
  ejemplo…» y el `progress` con `aria-labelledby`, que aparecen recién cuando la espera supera el umbral actual. Antes
  del umbral se ve la caja vacía.
- `progress`: nativo e indeterminado, `accent-color: var(--c-tinta)`, ancho `min(100%, 20rem)`.
- El cuadro cero es el mismo para cualquier ruta de entrada.

**«Cargando la pantalla…»** (una pantalla que se baja al entrar, desde los 300 ms): el mismo `role="status"` con su
texto y su `progress`, en un renglón sobre `--c-hoja` con filete superior de 1,5 px en tinta. Sin caja de regla.

**Error de arranque** (`fase === "error"`): `h1` «No se pudo iniciar la demo» en cartel; debajo, una ficha con precinto
crítico de 6 px en el borde izquierdo, el párrafo del error y el botón primario «Recargar la página». Sin «Reiniciar
demo». No se dibuja la caja de la regla (no hay nada que medir).

**Error de descarga, «Hay una versión nueva», ruta desconocida y datos dañados:** el mismo esquema (título, párrafo,
botón), sin precinto cuando no es un error (versión nueva, ruta desconocida). Los textos son los actuales.

#### 15.4.7 Avisos globales

Debajo de la barra, dentro del ancho del contenido, con el componente `Aviso` (15.5.6). La región `role="status"`
sigue existiendo siempre, vacía. Almacenamiento no disponible y almacenamiento perdido: tono `semana`. Datos de otra
fecha: `semana`, con «Cerrar aviso». Demo actualizada: `neutro`, con cierre. Cambios en otra pestaña: `quincena`, con
«Actualizar» y, si falla, su mensaje de error dentro del aviso.

---

### 15.5 Componentes base

Cada pieza conserva su `<script>`, sus `props`, su marcado accesible y su comportamiento (secciones 5 y 14). Lo que
sigue es su **piel**. Estados comunes a todo lo operable: normal, cursor encima (solo en `@media (hover: hover)`),
**foco visible**, pulsado y deshabilitado. La excepción del `h1` (sin anillo) sigue igual. Densidad compacta, única.

**El anillo de foco.** Siempre de 3 px. Regla que decide el color: **un anillo por fuera se mide contra lo que rodea
a la pieza; un anillo por dentro, contra el fondo de la propia pieza.**

| Caso | Anillo | Contra qué se mide (15.3.3) |
| --- | --- | --- |
| **General**: todo lo que está sobre la página, una hoja, una fila o un fondo de tono. Incluye el **botón de aspecto pleno** y el segmento elegido. | `--c-foco`, **por fuera**, con 2 px de separación. | El fondo que rodea a la pieza: 5,87:1 o más en todos. |
| Sobre lo oscuro: ítems del lateral y de la barra inferior (sin elegir), sello de la zona roja, opción roja del checklist. | `--c-foco-oscuro`, **por dentro**. | `--c-lat` (18,37 y 17,79) o `--c-crit-relleno` (5,74 y 4,66). |
| Pieza cuyo fondo es el pleno y que no admite anillo por fuera: destino actual del lateral y de la barra inferior, renglones de lectura dentro de la mordaza. | `--c-sobre-pleno`, **por dentro**. | `--c-pleno` (7,81 y 6,63). |
| Dentro de un objeto (15.3.2). | `--obj-enlace` (lo que vale `--c-foco` ahí adentro), por fuera con 2 px. | `--obj-hoja` (8,29 y 7,14). |

Lo que **no** se hace: `--c-sobre-pleno` por fuera (sobre la hoja da 1,06:1 de día y 1,85 de noche) ni
`--c-foco-oscuro` sobre un fondo claro (sobre el pleno da 1,18:1 de noche).

#### 15.5.1 `Boton`, `EnlaceAccion` y `BotonConfirmar`

Anatomía: alto `--alto-control` (36 px; 44 por debajo de 64 rem), relleno horizontal de 14 px, borde de 1,5 px, radio
2 px, texto de 14 px y peso 600, **sombra dura de 2 px hacia abajo** en el color de su borde. Tamaño `chico`: 28 px en
escritorio y 40 por debajo de 64 rem (44 en el recorrido del conductor). Tamaño `grande`: 52 px, texto de 16 px,
sombra de 3 px. El botón lee cuatro
propiedades (`--b-fondo`, `--b-texto`, `--b-borde`, `--b-fondo-hover`): así un contenedor puede darle el aspecto
«pleno» sin tocar su `<script>`.

| Variante | Fondo · texto · borde | Cursor encima |
| --- | --- | --- |
| `primario` | `--c-tinta` · `--c-sobre-tinta` · `--c-tinta-borde` | `--c-tinta-hover` |
| `secundario` | `--c-hoja` · `--c-tinta` · `--c-tinta` | `--c-papel-2` |
| `texto` | transparente · `--c-pleno-texto`, subrayado · sin borde ni sombra | subrayado de 2 px |
| `peligro` | `--c-hoja` · `--c-crit` · `--c-crit` | `--c-crit-fondo` |
| `icono` | transparente · `--c-tinta` · sin borde ni sombra; caja de 36 px (44 por debajo de 64 rem) | `--c-papel-2` |
| aspecto **pleno** (lo da el contenedor; solo la acción que destraba) | `--c-pleno` · `--c-sobre-pleno` · `--c-pleno-borde` | `--c-pleno-hover` |

**El primario de noche.** Relleno `--c-tinta` (claro, `#EDF3FA`), texto `--c-sobre-tinta`, y borde y sombra dura en
`--c-tinta-borde` (`#6F8FB8`), **no en el color del relleno**: sin esa diferencia el botón era un bloque plano que se
leía como un campo vacío (en Hoy, a 100 px de la llave en crema). Con el cursor encima cambia el relleno a
`--c-tinta-hover`; el borde no cambia. De día el borde sigue siendo la tinta. Pares en 15.3.3. **Descartada:** darle a
«Empezar la revisión» el aspecto pleno. El pleno es la acción que destraba una pieza (regla 1 de 15.2), y Hoy no tiene
regla; además, de noche el pleno es crema, casi igual a la llave (`--obj-hoja`), y dejaría dos piezas iguales
compitiendo.

| Estado | Aspecto |
| --- | --- |
| Cursor encima | Además del fondo, en primario, secundario y pleno una línea de 1,5 px (el **cursor de calibre**) cruza el botón de izquierda a derecha en 520 ms con `--m-curva-carro`, a opacidad 0,35, una sola vez por entrada del puntero. |
| Foco | Anillo general: `--c-foco`, por fuera, con 2 px de separación. **También en el aspecto pleno** (8,29:1 de día y 8,44 de noche sobre la hoja de la nota): el contenedor no cambia el anillo, así los dos botones de la «Acción del día» muestran el foco igual. |
| Pulsado | Baja 2 px y pierde la sombra (`--m-rapido`). |
| Deshabilitado (`disabled` o `aria-disabled="true"` sin carga) | Fondo `--c-papel-2`, texto `--c-tinta-3`, borde `--c-control`, sin sombra, `cursor: not-allowed`. |
| Cargando (`cargando`: hoy pone `aria-disabled="true"` y el texto «Guardando…») | Igual que el normal de su variante, sin sombra y con `cursor: progress`. El texto lo dice todo; no se agrega un giro (el botón no expone un atributo propio de carga y no se toca su `<script>`). |
| Error | No tiene: el error vive junto al campo o en el diálogo. |

`EnlaceAccion` es un enlace con el mismo aspecto y los mismos estados. `BotonConfirmar` (dos pasos) usa `texto` en el
primer paso y `peligro` en el segundo; su tiempo y su foco no cambian.

#### 15.5.2 `Patente`: la chapa

Es un **objeto** (`.objeto`). **Conserva la clase `.patente`** (la usa el movimiento entre pantallas) y
`a.enlace-patente`.

- Papel `--obj-hoja`, texto `--obj-tinta` en técnica y peso 600, borde de 1,5 px en `--obj-tinta`, radio 3 px, sombra
  `--s-pieza`, y una **franja de 3 px** en `--obj-franja` arriba. Sin leyenda, escudo ni bandera.
- `chica` (tablas, listas): 13 px, relleno `0.375rem 0.375rem 0.1875rem`, `white-space: nowrap`.
- `grande` (título de la ficha y del parte): `--t-patente-grande`, borde de 2 px, franja de 8 px.
- En la llave de Hoy: `--t-patente-llave`, franja de 12 px (15.8).
- Enlace: cursor encima, sube 1 px y toma `--s-flotante`; pulsado, baja 1 px y pierde la sombra; foco, anillo en
  `--c-foco` (el anillo está fuera del objeto, sobre el plano). Para que eso se cumpla, **`.objeto` va en `.patente`
  y no en `a.enlace-patente`** (15.3.2). Deshabilitado, error, vacío y cargando: no tiene.
- De noche su color calculado de fondo es `rgb(237, 231, 218)`: una prueba lo fija.

#### 15.5.3 `Etiqueta`, `EtiquetaParte` y `Forma`

- **`Forma`**: 10 px, en el color de marca del tono (`-r`). Rombo, triángulo, círculo lleno, aro (trazo de 1,5 px) y
  cuadrado (8 px). Sin estados.
- **`Etiqueta`** con fondo: 22 px de alto, técnica de 12 px en mayúsculas (`letter-spacing: 0.04em`, peso 600), forma o
  ícono antes de la palabra, texto `-t`, fondo `-f`, borde de 1 px (`-t` al 40 %), esquinas rectas. No es un control.
- **`Etiqueta` `variante="texto"`** («Disponible», «Bloqueada» en una fila): sin fondo ni borde; forma y palabra en
  `-t`, peso 600, en la letra de texto de 13 px y sin mayúsculas forzadas.
- **`EtiquetaParte`**: una `Etiqueta` con el ícono y el tono de `ETIQUETAS_DE_PARTE` (sin cambios).

#### 15.5.4 `Panel`: la ficha

- Hoja `--c-hoja`, contorno de 1 px `--c-filete-medio`, **cabeza de 1,5 px en tinta**, radio 0, sin sombra.
- **Barra de título:** mínimo 44 px; ícono de 16 px en tinta; `h2` en la letra de texto (`--t-h2-ficha`, peso 650);
  `meta` en técnica de 12 px, `--c-tinta-3`; `controles` a la derecha. Filete inferior `--c-filete`. El `h2` conserva
  su `id`, su `tabindex="-1"` y su anillo cuando recibe el foco.
- **Interior:** relleno de 16 px (`sinRelleno`: 0).
- **Barra de estado** (`role="status"`): fondo `--c-papel`, filete superior, texto de 13 px. Vacía mide 0, como hoy.
- Estados: normal; con mensaje; vacío (lo dibuja el contenido: 15.5.12). No tiene cursor encima, pulsado ni
  deshabilitado.

#### 15.5.5 `ListaTabla`: la tabla densa

Conserva `data-variante` y `data-col`, sus roles y su paso a tarjetas por ancho de contenedor.

- **Encabezado:** técnica de 12 px en mayúsculas, `--c-tinta-3`, sobre `--c-hoja`, con filete inferior de 1,5 px en
  tinta. Las palabras no se parten.
- **Fila:** mínimo 46 px en escritorio; filete inferior `--c-filete`; cifras a la derecha en técnica.

  | Estado | Aspecto |
  | --- | --- |
  | Cursor encima | Fondo `--c-papel-2`. |
  | Foco en un control de la fila | Anillo en el control. |
  | Con tono (`data-tono`) | **Precinto de 6 px** en el borde izquierdo con el color de marca del tono (reemplaza la franja lisa de 4 px). Las filas en orden no llevan nada. |
  | Elegida | Fondo `--c-pleno-suave` y barra de 4 px en `--c-pleno` a la izquierda, que reemplaza al precinto; las formas de tono pasan a su color de texto (15.3.1). |
  | Recién actualizada | Destello de `--c-pleno-suave` a transparente en 1.200 ms, una vez (regla de 3.6). |
  | Vacía | Pieza de vacío (15.5.12) en lugar de las filas. |
  | Cargando | No tiene: los datos ya están en memoria. |

- **En tarjetas** (contenedor angosto): cada fila es una hoja con cabeza de 1,5 px en tinta, la chapa y el estado en
  el primer renglón, y los rótulos de columna en técnica de 12 px.

#### 15.5.6 `Aviso`

Borde de 1,5 px en el color de texto del tono, fondo `-f`, ícono de 20 px en el color del tono, texto en `--c-tinta`
(el titular en peso 600) y segundo renglón en `--c-tinta-2` de 13 px. Tono `neutro`: fondo `--c-hoja` y borde en tinta.
Con botón de cierre («Cerrar aviso», ícono, 36 o 44 px) o con una acción a la derecha (debajo, a menos de 40 rem). Sus
roles y el manejo del foco al cerrarse no cambian. Estados: normal y los del botón que contenga.

#### 15.5.7 `Campo` y `Casilla`

- **`Campo`:** rótulo de 13 px y peso 600 arriba; control de `--alto-control` (48 px con `grande` y en el parte), fondo
  `--c-hoja`, borde de 1,5 px `--c-control`, radio 2 px; ayuda de 13 px en `--c-tinta-3`; sufijo de unidad («km»)
  junto al control.

  | Estado | Aspecto |
  | --- | --- |
  | Cursor encima | Borde `--c-tinta-2`. |
  | Foco | Anillo; el borde pasa a tinta. |
  | Con valor recién guardado | Destello `--c-pleno-suave`, una vez. |
  | Error (`aria-invalid="true"`) | Borde `--c-crit-marca` y barra interior de 3 px a la izquierda en el mismo color; mensaje de 13 px y peso 600 en `--c-crit`, con rombo, unido por `aria-describedby`. No desaparece solo. |
  | Deshabilitado | Fondo `--c-papel-2`, texto `--c-tinta-3`. |
  | Vacío | Marcador de posición en `--c-tinta-3`. |
  | `select` | Igual; flecha nativa. |

- **`Casilla`:** caja de 20 px con borde de 1,5 px `--c-control` y radio 2 px; marcada, fondo `--c-tinta` con marca de verificación
  `--c-sobre-tinta`; el rótulo es parte del objetivo (44 px de alto). Cursor encima: borde en tinta. Foco: anillo.
  Deshabilitada: `--c-papel-2`.

#### 15.5.8 `FiltrosConteo` y `FiltrosEnlace`: el segmentado

Cajas rectas (radio 2 px) de `--alto-control`, con 6 px entre sí, que bajan de renglón sin partirse. Texto de 13 px y
peso 600; conteo en técnica de 12 px; la forma del tono antes del texto, cuando la tienen.

| Estado | Aspecto |
| --- | --- |
| Normal | Fondo `--c-hoja`, borde de 1,5 px `--c-control`, texto `--c-tinta-2`, conteo `--c-tinta-3`, forma en el color del tono. |
| Cursor encima | Borde y texto en tinta, fondo `--c-papel-2`. |
| Foco | Anillo general, por fuera; el mismo en el elegido y en los demás (15.5). |
| **Elegido** (`aria-current="page"` en los enlaces; `:checked` en los radios) | Fondo `--c-pleno`, texto y forma `--c-sobre-pleno`, conteo `--c-sobre-pleno-2`, borde `--c-pleno`. |
| Con conteo en cero | Igual que el normal; el cero se muestra. |

`FiltrosEnlace` sigue llevando a la vista el filtro elegido al cargar; `FiltrosConteo` sigue siendo un grupo de radios.

#### 15.5.9 `Detalles`, `Dato`, `MenuMas`

- **`Detalles`:** resumen de `--alto-control` con flecha que gira 90° en `--m-medio`, texto de 13 px y peso 600 en
  `--c-pleno-texto`; contenido con filete izquierdo de 1 px. Estados: cerrado, abierto, cursor encima (subrayado),
  foco.
- **`Dato`:** rótulo en técnica de 12 px, mayúsculas, `--c-tinta-3`; valor de 14 px y peso 600. Sin estados.
- **`MenuMas`** («Más acciones»): botón secundario con `aria-expanded`; lista sobre `--c-hoja` con borde de 1,5 px en
  tinta, sombra `--s-flotante` y esquinas rectas; cada opción mide `--alto-control` (44 px por debajo de 64 rem).
  Opción con el cursor encima: `--c-papel-2`. Esc y la salida del foco lo cierran, como hoy.

#### 15.5.10 Piezas del parte: `ItemRevision`, `SelectorCombustible`, `BarraEnvio`, `ResumenErrores`

- **`ItemRevision`:** nombre del punto en 15 px y peso 600; «Punto crítico» con rombo, en técnica de 12 px y
  `--c-crit`; dos opciones de 48 px, lado a lado.

  | Estado | «En orden» | «Con novedad» |
  | --- | --- | --- |
  | Sin elegir | Fondo `--c-hoja`, borde de 1,5 px en tinta, sombra dura. | Igual. |
  | Elegida | Fondo `--c-tinta`, texto `--c-sobre-tinta`, marca de verificación antes del texto. | Fondo `--c-crit-relleno`, texto `--c-sobre-solido`, rombo antes del texto. |
  | Foco | Anillo (sobre la opción roja, `--c-foco-oscuro` por dentro). | |
  | Error (sin responder tras intentar enviar) | Precinto crítico de 6 px en el borde izquierdo del ítem y su mensaje, como en `Campo`. | |

  Con «Con novedad», el detalle se despliega debajo (sin cambios de comportamiento).
- **Barra de progreso del parte** (en `ParteFormulario`): un **segmento cuadrado por punto**, con borde de 1 px en
  tinta. Sin responder: vacío. En orden: lleno en `--c-ok`. Con novedad: lleno en `--c-crit-marca`. Sin marca aparte
  para los puntos críticos (regla del 26/11/2026).
- **`SelectorCombustible`:** cinco segmentos de 48 px con borde de tinta; se llenan en tinta hasta el elegido
  (`data-lleno`), y el elegido lleva además su texto en peso 650 y una marca de 3 px abajo. Sigue siendo un grupo de
  radios. Foco: anillo. Error: como en `Campo`.
- **`BarraEnvio`** (conserva la clase `.barra-envio`): fija abajo, fondo `--c-papel` opaco, filete superior de 1,5 px
  en tinta; a la izquierda, lo que falta («Faltan N datos», 14 px y peso 600); a la derecha, el primario `grande`.
  Estados del texto: faltan datos, listo, revise datos (en `--c-crit`, con rombo). Enviando: el primario en carga.
  El botón **nunca se deshabilita** por datos faltantes.
- **`ResumenErrores`:** caja con fondo `--c-crit-fondo`, borde de 1,5 px `--c-crit` y precinto de 6 px a la izquierda;
  título en la letra de texto de 16 px y peso 650, en `--c-tinta`; enlaces en `--c-enlace`, subrayados, de 24 px de
  alto como mínimo. Recibe el foco al aparecer, como hoy.
- **Indicador de guardado:** texto de 13 px con ícono; guardado en `--c-tinta-2`, error en `--c-crit`. Sin animación.

#### 15.5.11 `Dialogo`: modal centrado (diseño nuevo)

El sistema de origen no traía un diálogo modal; este es su diseño. **No cambian** el elemento `<dialog>` con
`showModal()`, el manejo del foco, Esc, la trampa de foco, el aviso de cambios sin guardar, la clase `.pie`, los
atributos `data-foco-inicial`, `data-foco-cancelar` y `data-seguir-editando`, ni la clase `dialogo-abierto` en
`<html>`.

```
              velo (--c-velo)
     ┌────────────────────────────────────────────┐
     │ Renovar seguro de ZK 214 BD             ✕  │  cabecera: --c-papel, filete inferior de 1,5 px en tinta
     ├────────────────────────────────────────────┤
     │ Los campos con * son obligatorios.         │
     │ Número*   [______________]                 │  cuerpo: --c-hoja, relleno de 16 px,
     │ Emisor    [______________]                 │  desplazamiento propio si no entra
     │ Vence*    [__/__/____]                     │
     ├────────────────────────────────────────────┤
     │ [ Guardar ]  Cancelar                      │  .pie: --c-papel, filete superior de 1,5 px en tinta
     └────────────────────────────────────────────┘
```

- **Caja:** fondo `--c-hoja`, borde de 2 px en tinta, radio 0, sombra `--s-ventana`.
- **Desde 40 rem:** centrado, ancho `min(34rem, 100% - 2rem)`, alto máximo 85 % de la ventana.
- **Menos de 40 rem:** se conserva la **hoja inferior** (pegada abajo, a todo el ancho, hasta el 92 % del alto), ahora
  con esquinas rectas y borde solo arriba. Es el comportamiento probado y el más cómodo para el pulgar; el cajón
  lateral llega con la etapa 4 del rediseño.
- **Cabecera:** mínimo 56 px; título (`h2`) en cartel a 78 %, 22 px y peso 760; botón de cierre de ícono (44 × 44).
- **Pie:** el primario primero y «Cancelar» (botón de texto) después, a la izquierda; a menos de 40 rem, el primario a
  todo el ancho y «Cancelar» debajo.
- **Entrada:** desde 40 rem, opacidad de 0 a 1 y escala de 0,98 a 1 en `--m-medio` con `--m-curva`; a menos de 40 rem,
  sube 24 px en `--m-lento`. Con movimiento reducido o «Sin animaciones», aparece de una vez.

| Estado del diálogo | Aspecto |
| --- | --- |
| Abierto | Como arriba; el fondo no se desplaza. |
| Cuerpo que desborda | El cuerpo es una región enfocable con su anillo **por dentro**. |
| Con cambios sin guardar, al cancelar | El pie cambia a «Tiene cambios sin guardar.» con «Descartar cambios» (peligro) y «Seguir editando» (secundario). |
| Guardando (`bloqueado`) | El primario en carga; el cierre y «Cancelar» con aspecto deshabilitado. |
| Error al guardar | El error se dice dentro del cuerpo (resumen o campo); el diálogo no se cierra. |
| Informativo | Un solo botón que cierra («Entendido»). |

**Los quince diálogos.** Todos usan la base de arriba; ninguno cambia de contenido ni de foco inicial.

| # | Componente | Qué es | Primario | Particularidad de la piel |
| --- | --- | --- | --- | --- |
| 1 | `DialogoFormulario` | Base de los formularios: campos, resumen de errores, «Guardando…». | Guardar | Resumen de errores de 15.5.10 arriba de los campos. |
| 2 | `DialogoDocumento` | Renovar, cargar o corregir un documento o una licencia. | Guardar | Es el que abre la «Acción del día». |
| 3 | `DialogoCargarOtro` | Cargar otro documento (con `select` de tipo). | Guardar | — |
| 4 | `DialogoUnidad` | Agregar unidad. | Guardar | Formulario largo: el cuerpo desplaza. |
| 5 | `DialogoAsignacion` | Cambiar proyecto o conductor. | Guardar | Aviso de tono `semana` dentro del cuerpo. |
| 6 | `DialogoKilometraje` | Corregir kilometraje. | Guardar | Nota del último registro en `--c-tinta-2`. |
| 7 | `DialogoNovedad` | Cargar novedad. | Guardar | Casilla «Impide usar la unidad» con su nota. |
| 8 | `DialogoResolver` | Resolver novedad. | Guardar | Lo que se resuelve, arriba, en una caja con filete y su etiqueta. |
| 9 | `DialogoFueraDeServicio` | Poner fuera de servicio. | Poner fuera de servicio | «Desde hoy (…)» como texto, no como campo. |
| 10 | `DialogoVolver` | Volver a servicio. Foco inicial en el título. | Volver a servicio (o «Ver novedades») | Aviso crítico o de atención dentro del cuerpo. |
| 11 | `DialogoBaja` | Dar de baja. | Dar de baja (peligro) | Aviso crítico con precinto: no se deshace. |
| 12 | `DialogoReiniciar` | Reiniciar demo. Foco inicial en «Cancelar». | Reiniciar demo (peligro) | Si falla, el error va dentro del cuerpo. |
| 13 | `DialogoConductor` | «Ver como». | Aplicar | Radios de perfil como segmentado; lista de conductores en filas de 52 px con radio; fila elegida en `--c-pleno-suave` con barra de 4 px en `--c-pleno`; «Sin licencia vigente» con rombo en `--c-crit`; marca «Para probar» en `--c-pleno-texto`. |
| 14 | `DialogoComoFunciona` | Solo informa. Foco inicial en el título. | Entendido | Subtítulos en la letra de texto; las reglas se muestran con las mismas etiquetas de la aplicación. |
| 15 | `DialogoAntesDeEnviar` | Avisos antes de enviar o de cerrar. Foco inicial en «Volver al parte». | Enviar de todos modos / Cerrar de todos modos | Cada aviso con su ícono y su tono, en filas separadas por filete. |

`DialogosDeDocumento` no dibuja nada propio.

#### 15.5.12 Estados vacío y cargando (piezas)

- **Vacío:** caja con borde de 1 px punteado en `--c-control` sobre `--c-hoja`; la frase que dice por qué está vacío en letra de texto (`--t-cuerpo`, `--c-texto-2`), no en cartel (T17: un vacío no puede ser lo más fuerte de una pantalla tranquila; la cifra de cartel es una por pantalla) y, si existe, la acción que sigue. Sin ilustración. La marca de tres rayas actual
  se retira.
- **Cargando:** no hay esqueletos ni brillo. Solo existen el cuadro cero (15.4.6), «Cargando la pantalla…» y los
  botones en carga.

---

### 15.6 La regla de salida (pieza firma de Inicio)

Mide **cuántas unidades activas pueden salir hoy**. Reemplaza a la cifra cobre y a las cuatro tarjetas. Todo sale de
los datos de hoy (una función de estado nueva, `salida.ts`): la regla no lleva ningún valor escrito.

#### 15.6.1 Anatomía

```
                                                                    ├─ desglose ──────┤        cota de la zona roja
┌──────────────────────────────────────────────────────────────────┬────────────────┐
│ DISPONIBLES HOY                          ◆  3  Vencidos o faltantes  › ┃▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│
│                                          ▲  9  Vencen en 30 días     › ┃▒┌────────────┐▒│
│ ██  ████                                 ■  3  Partes pendientes     › ┃▒│ 4          │▒│  caja de la regla
│  █  █  █                                 ◆  1  Novedad crítica       › ┃▒│ No dispon. │▒│
│  █  ████  /23                                                          ┃▒│ hoy        │▒│
│                                                                        ┃▒│ 2 bloq. …  │▒│
└────────────────────────────────────────────────────────────────────────▼─┴────────────┴─┘
0····|····5····|····10···|····15···|···[19]··|···23                                         escala y cursor
══╤══╤══╤══╤══╤══╤══╤══╤══╤══╤══╤══╤══╤══╤══╤══╤══╤══╤══╤═══╤══╤══╤══╤══                    riel
  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯  ▯    ▨  ▨  ▧  ▧                     llaves
                                                             ①  ②  ③  ④                     globos
┌─────────────────────────────────────────────────────────────┴─────────────────────────────┐
│ ① ACCIÓN DEL DÍA  ZK 214 BD no puede salir: Seguro vencido…  [ Renovar ] [ Probar como conductor → ] │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Pieza | Qué dice | Cómo se dibuja |
| --- | --- | --- |
| **Caja** | El total: las unidades activas. | Ancho completo, borde de 2 px en tinta, fondo `--c-hoja`. Es un contenedor de tamaño (`container: regla / inline-size`). |
| **Mordaza** | Las disponibles. | Campo `--c-pleno` de ancho `--medida × 100 %`, con grano y rejilla de 48 px (`--c-pleno-trama`), y un **canto de 3 px en `--c-sobre-pleno`** en su borde derecho: blanco de día (7,81:1 contra el cobalto y 5,74 contra el rojo) y cobalto de noche (6,63 contra la crema). De día el canto es lo que separa la mordaza de la zona roja, porque cobalto contra rojo da 1,36:1; de noche los dos campos se separan solos (3,96). Es también un contenedor (`container: mordaza / inline-size`). |
| **Título** (`h2`, `tabindex="-1"`) | «Disponibles hoy». | Es el único epígrafe de la cifra: dice qué se mide, y el `h1` de la pantalla es «Inicio». Rótulo en técnica, mayúsculas, peso 600, `--c-sobre-pleno` (7,81:1 y 6,63:1), **14 px desde 37,5 rem de regla y 13 px por debajo** (celular), **en placa lisa** (rectángulo `--c-pleno` sin grano ni rejilla, relleno `0.125rem 0.375rem`). Ancho del texto medido con la fuente real (Red Hat Mono 600, mayúsculas, `letter-spacing: 0.06em`): 138,6 px a 14 px y 128,7 px a 13 px, más 12 px de relleno. Es el destino del foco al resolver (15.7). |
| **Cifra monumental** | Disponibles sobre activas: «19 /23». | Tambores de odómetro en cartel a 75 %, peso 780, `--t-monumental`, color `--c-sobre-pleno`. El «/23» en cartel al 32 % del tamaño, `--c-sobre-pleno-2`. Los tambores son `aria-hidden`: el valor está siempre en el texto para lectores. |
| **Zona roja** | Las no disponibles. | El resto de la caja: `--c-crit-relleno` con grano y precinto. |
| **Sello** | Cuántas no salen y por qué. | Placa lisa `--c-crit-relleno` con borde de 1,5 px `--c-sobre-solido` y un segundo filete, girada −1,5°: el número en cartel (`--t-cifra-grande`) y «No disponibles hoy» (13 px, peso 600). El desglose ya no va en el sello (T17, segunda vuelta de T16): se ve igual con cualquier ancho en la cota (tablero completo) o en el rótulo del tablero corto. Es un **enlace** al filtro «No disponibles hoy» de Movilidades. |
| **Cota** | La medida de la zona roja. | Línea con topes sobre la zona roja y su rótulo, **el desglose** («2 bloqueadas por documentos · 2 fuera de servicio») en técnica de 12 px, `--c-crit`, sobre el color de la página. Va siempre alineado al borde derecho de la regla, sobre la línea, así que no cambia con el ancho de la zona (T17: antes decía «4 unidades», que repetía el número del sello). Solo con el tablero completo. |
| **Cursor** | La lectura. | Línea de 2 px en tinta con cabeza triangular, en `--medida`. Se dibuja **fuera de la caja**: la cabeza, arriba, y la línea desde el borde inferior de la caja hasta el pie de las llaves, donde separa las que salen de las que no. **Dentro de la caja su tramo es el canto** de la mordaza (una línea de tinta ahí daría 2,35:1 contra el cobalto). |
| **Escala** | De 0 a las activas. | Marcas con **gradientes** (ningún nodo por marca): menor cada unidad, mayor cada 5; números en técnica de 12 px; la lectura, en un recuadro de tinta con texto `--c-sobre-tinta`. `aria-hidden`. |
| **Llaves** | Cada unidad activa, en el orden de la escala. | 15.6.3. |
| **Renglones de lectura** | Las cuatro cifras de hoy. | 15.6.4. |
| **Acción del día** | Lo que destraba la primera pieza. | 15.7. |

**Lectura para lectores de pantalla.** La regla lleva un párrafo, visible solo para lectores, con la conclusión
completa («Disponibles hoy: 19 de 23 unidades activas.» y el desglose de las que no). Está en el DOM desde el primer
cuadro con el **valor final**. Tambores, escala, cursor, cota, ganchos y marca de registro son `aria-hidden`.

**Estados del sello** (el único control dentro de la caja, además de los renglones): cursor encima, fondo `--c-hoja`
y texto `--c-crit`; foco, anillo de 3 px en `--c-foco-oscuro` por dentro de la placa y un filete de tinta por fuera;
pulsado, baja 1 px. Su tamaño responde al ancho de la zona roja (`container: zona / inline-size`): con 7 rem o más,
número y nombre; con menos, **solo el número** (el nombre pasa al rótulo del tablero corto, 15.6.3; el desglose nunca está en el sello). El objetivo nunca mide menos de 44 × 44 px: si la zona roja mide menos de
2,75 rem, el sello **sale de ella** y se ancla a la esquina inferior derecha de la caja (15.6.7, «Zona roja más
angosta que el sello»).

#### 15.6.2 Medidas por ancho de la regla

Los cortes de la regla son **de contenedor**, no de ventana (la regla no sabe si hay lateral).

| Ancho de la regla | Alto de la caja | Cifra (15.3.5) | Tablero de llaves | Renglones de lectura |
| --- | --- | --- | --- | --- |
| 60 rem o más (ventana de unos 1.260 px en adelante) | 252 px | 22 % del ancho de la mordaza, hasta 200 px | Completo (si la cantidad lo permite, 15.6.3) | **Dentro** de la mordaza, si el campo es ancho (15.6.4) |
| De 37,5 a 60 rem (tableta; escritorio angosto) | 196 px | 22 % del ancho de la mordaza, hasta 200 px | Completo (si la cantidad lo permite) | Debajo, en lista de dos columnas |
| Menos de 37,5 rem (celular) | 128 px | 38 % del ancho de la mordaza, hasta 120 px | **Corto** | Debajo, en lista de una columna |

- La cifra se dimensiona por el ancho de **la mordaza** (unidades `cqi`), así nunca la desborda.
- **Mordaza angosta.** Si la mordaza mide menos de 10,25 rem (9,75 con la regla de menos de 37,5 rem;
  `@container mordaza (max-width: 10.25rem)`: pocas o ninguna
  disponible), el título y la cifra salen de ella y se dibujan en una **placa lisa** de `--c-hoja`, con borde de 1,5 px
  y texto en tinta, anclada justo a la derecha del canto, sobre la zona roja. La mordaza conserva su ancho real: la
  medida no se falsea. Los cortes salen del título: su placa (150,6 px a 14 px; 140,7 px a 13 px) más el margen de la
  caja y el relleno de 12 px de cada lado, con el mismo criterio que el corte anterior de 9 rem para el título de
  12 px. Es una cuenta; se confirma en el boceto y sobre lo maquetado (15.15).
- Con el campo angosto o medio, la marca de registro no se dibuja.

#### 15.6.3 El tablero de llaves

Una **llave por unidad activa**, en el orden de la escala: primero las disponibles y, a la derecha del cursor, las no
disponibles. Las llaves están **colgadas desde el primer cuadro** (15.10).

**Tablero completo.**

- Cada llave ocupa una división de la escala (`100 % / activas`). El **enlace ocupa toda la división** (es el objetivo:
  24 px de ancho o más, por la tabla de más abajo); el cuerpo dibujado mide `min(100% - 6px, 2.625rem)` de ancho y
  108 px de alto (92 px por debajo de 60 rem). Cuelga de un riel de 3 px en tinta por un gancho de 2 px.
- El tablero y la escala miden lo mismo que la regla, de borde a borde, **sin relleno lateral**: las divisiones se
  cuentan sobre el ancho completo.
- La llave es un **objeto**: cuerpo `--obj-hoja` con borde de 1,5 px en `--obj-tinta`, radio `3px 3px 10px 10px`,
  agujero redondo de 7 px, franja de 3 px en `--obj-franja` y la patente **en vertical**, en técnica de 12 px y peso
  600. `.objeto` va en el **cuerpo**, no en el enlace de la división (15.3.2).

  | Llave | Aspecto |
  | --- | --- |
  | Disponible | Lisa y derecha. |
  | No disponible, tono `critico` (bloqueada por documentos; fuera de servicio por novedad crítica) | Cuerpo `--obj-crit-relleno` con precinto oscuro y **contorno de 1,5 px en `--obj-contorno`** (de noche es papel claro: 12,23:1 contra el plano y 4,66 contra el rojo; el rojo solo daría 2,63); patente en **placa lisa roja** con texto blanco y borde blanco de 1 px; cuelga torcida (+4° o −3°, alternando). |
  | No disponible, tono `neutro` (fuera de servicio por taller o a mano) | Cuerpo `--obj-papel-2` con precinto en `--obj-tinta-3`; patente en placa lisa `--obj-hoja` con texto en tinta; cuelga torcida. |
  | Cursor encima o foco | Se endereza, sube 3 px, toma `--s-flotante` y muestra el **rótulo de cota**. La disponible, además, pasa a fondo **`--obj-franja`** con texto **`--obj-sobre-franja`** (7,81:1) y contorno `--obj-contorno`. No se usa `--c-pleno` de la página: de noche es crema y contra el papel de la llave da 1,05:1. |
  | Foco | Anillo de 3 px en `--c-foco`, separado 4 px, en el **enlace de la división** (está fuera del objeto: 7,47:1 de día y 8,83 de noche contra la página). |
  | Pulsada | Baja 1 px. |

  El ámbar no se usa en las llaves: «vence pronto» no es un motivo para no salir.
- **Globos.** Debajo de cada llave no disponible, un globo de 20 px con su **número de pieza** (1, 2, 3…), en técnica
  de **12 px** y peso 600, en el color de texto de su tono (vale para los tres lugares donde aparece el globo). Es el
  mismo número del renglón de «No disponibles hoy» (15.6.5) y de la «Acción del día». Son
  texto dentro de un círculo dibujado con CSS (no caracteres especiales), `aria-hidden`: el número va en el nombre
  accesible de la llave.
- **Rótulo de cota: uno solo, compartido.** Es un objeto con borde de 1,5 px y sombra `--s-flotante`, de 14,25 rem de
  ancho, que se ubica debajo de la llave señalada (posición por `style:--x`) con una guía vertical de 14 px. Dice, en
  horizontal: la patente (técnica de 18 px), el interno, y el estado con forma y palabra más el motivo. En las
  primeras y últimas divisiones se alinea al borde para no salirse. Es `aria-hidden`: lo mismo está en el nombre
  accesible de la llave. Se mantiene mientras el puntero esté sobre la llave **o sobre el propio rótulo**, y
  **Escape lo oculta** sin mover el foco (WCAG 1.4.13). Sin puntero fino (táctil) no aparece al tocar: un toque abre
  la ficha. Con foco de teclado aparece siempre, haya o no puntero fino.
- **Teclado (tablero completo):** el tablero es **una sola parada de tabulación**. Tab entra en la última llave
  enfocada o, la primera vez, en la **primera no disponible** (si no hay, en la primera llave). Flecha derecha e
  izquierda mueven de a una; Inicio y Fin van a la primera y a la última; Enter abre la ficha (es un enlace); otro
  Tab sale. En el tablero completo todas las llaves están a la vista: las flechas las recorren todas.
- **Ayuda de teclado, a la vista.** Quien usa el teclado y ve la pantalla tiene que enterarse de las flechas. Cuando
  el foco entra a una llave por teclado (`:focus-visible`), el rótulo de cota suma un **último renglón**, separado por
  un filete: la frase de ayuda (15.14, fila 9), en 12 px y `--obj-tinta-2`, en dos renglones como máximo. Con el
  puntero ese renglón no se muestra (la lógica marca el rótulo con `data-origen="teclado"`, 15.6.8). No ocupa lugar
  nuevo ni mueve nada. La misma frase llega a los lectores de pantalla una sola vez, por `aria-describedby`.
- **Nombre accesible** de cada llave: patente, estado, motivo si no sale, número de pieza si lo tiene, y que lleva a
  la ficha (15.14). La lista tiene nombre propio.

**Tablero corto.** Es la forma del tablero cuando la llave no llegaría a 24 px de ancho. Resuelve el pedido de
**patentes en horizontal** en el celular: 23 chapas horizontales no entran colgadas en 360 px, y las 19 que salen no
ayudan a decidir nada en tres segundos.

```
0··············[19]····23        escala: solo 0, la lectura y el total
══╤═╤═╤═╤═╤═╤═╤═╤═╤═╤═╤═╤═╤═╤═╤═╤═╤═╤═╤══╤═╤═╤═╤══   riel con un gancho por unidad activa (dibujado, sin texto)
NO DISPONIBLES HOY · 2 bloqueadas por documentos · 2 fuera de servicio
─┬──────────┬──────────┬──────────┬──────────
 ▨ZK 214 BD  ▨ZZD 563   ▧ZU 899 QE  ▧ZR 536 MZ      las que no salen, colgadas, con la patente en horizontal
```

- **Riel con ganchos:** un gancho de 2 × 8 px por unidad activa, dibujado con un gradiente que se repite cada `100 % /
  activas`. Es `aria-hidden` y no se pulsa: muestra la cantidad, no las unidades.
- **Es una lista aparte, solo con las no disponibles** (hasta ocho posiciones). La lista de llaves del tablero
  completo y esta **nunca se ven a la vez**: la consulta de contenedor muestra una y oculta la otra con `display:
  none`, que la saca también del orden de tabulación y del árbol de accesibilidad. En el DOM, la lista corta va
  después de la completa. Las disponibles no tienen chapa en el tablero corto: la cantidad la dicen la cifra y el
  párrafo para lectores; el listado está en Movilidades.
- **Rótulo de la fila:** «No disponibles hoy» en técnica de 12 px, `--c-crit`, seguido del desglose en 12 px,
  `--c-tinta-2`, partido solo en el «·» (cada mitad en una sola línea: nunca queda «servicio» solo en un renglón).
- **Las no disponibles** cuelgan de su propio riel de 3 px, cada una por un gancho de 2 × 8 px, como **chapas
  horizontales**: patente en técnica de 12 px y peso 600, en placa lisa (roja o de papel, según el tono), con borde
  de precinto y un giro de ±2°. La chapa roja lleva además, por fuera, el **contorno de 1,5 px en `--obj-contorno`**,
  como la llave crítica. Objetivo de 40 px de alto. Bajan de renglón (cada renglón con su riel) sin partirse.
  A 360 px entran cuatro por renglón; a 320, tres.
- **Tope:** se muestran hasta **ocho**. Si hay más, la octava posición es un enlace con forma de chapa que dice «y N
  más» y lleva al filtro «No disponibles hoy» de Movilidades.
- **Teclado (tablero corto): sin parada única.** Cada chapa y el enlace «y N más» son enlaces comunes, cada uno con
  su parada de Tab (**ocho como máximo**), en el orden en que se ven. No hay flechas ni ayuda. Foco: anillo general en
  el enlace, fuera de la chapa.
- Sin globos, sin cota y sin rótulo de cota.

**Por qué dos listas y no una con las disponibles ocultas.** La forma del tablero la decide la hoja de estilos por
el ancho del contenedor, sin que el código lo sepa. Con una sola lista y la parada itinerante, si la última llave
enfocada fue una disponible y la regla pasa a corta (girar el teléfono, achicar la ventana), el `tabindex="0"` queda
en un elemento oculto y las chapas quedan sin parada de Tab. Con dos listas, la parada del tablero completo se oculta
y vuelve junto con su lista, y las chapas del corto no dependen de ella. La lista corta sale de los mismos datos y
tiene ocho nodos como máximo. Si el presupuesto de peso no la admite, la alternativa es una sola lista en la que la
lógica vuelve a calcular la parada cuando cambia el ancho del contenedor.

**Condición que se prueba, se construya como se construya:** con el foco en una llave disponible, se achica la regla
hasta el tablero corto, y con Tab se llega a cada chapa visible y a «y N más»; al volver al tablero completo, Tab
entra en una llave visible. En ninguna de las dos formas queda un `tabindex="0"` en un elemento oculto habiendo
llaves a la vista.

**Cuándo se usa cada uno.** La regla recibe la cantidad de activas en tramos (`data-carga`) y la hoja de estilos la
cruza con el ancho del contenedor. Así el tablero completo solo aparece cuando cada llave mide 24 px o más.

| `data-carga` | Unidades activas | Tablero completo desde |
| --- | --- | --- |
| `a` | hasta 24 | 37,5 rem de regla |
| `b` | 25 a 30 | 47,5 rem |
| `c` | 31 a 46 | 70,5 rem |
| `d` | 47 o más | nunca: siempre corto |

En el peor caso de cada tramo la división mide 25,0 px (`a`: 600 px entre 24), 25,3 px (`b`: 760 entre 30) y 24,5 px
(`c`: 1.128 entre 46). La holgura total sobre los 24 px es de 24, 40 y 24 px: por eso el tablero **no lleva relleno
lateral** (más de 12 px por lado en `a` o en `c` dejaría el objetivo por debajo de 24 px). Si alguna vez hace falta
un relleno, se suben los cortes en la misma medida.

#### 15.6.4 Los renglones de lectura (en lugar del registrador)

El registrador de 30 días llega en la etapa 3 del rediseño. Su lugar lo ocupan **las cuatro cifras de hoy** que ya
calcula Inicio (vencidos o faltantes, vencen en 30 días, partes pendientes, novedad crítica), como **renglones**, no
como tarjetas.

- Cada renglón es un **enlace** a su lista (los destinos de hoy): forma del tono · cifra en cartel a 75 % · rótulo ·
  flecha. Una sola lista con nombre.
- **Dentro de la mordaza** (las tres condiciones: regla de 60 rem o más; campo ancho, `data-campo="ancho"`, que es
  una medida de 0,70 o más; y menos de 47 unidades activas, `data-carga` distinto de `d`):
  columna de `min(22rem, 40%)` alineada contra el canto, centrada en alto, sobre una **placa lisa** `--c-pleno` (sin
  grano ni rejilla). Renglones de 36 px con filete de 1 px en `--c-sobre-pleno-2`; cifra de 28 px y forma en
  `--c-sobre-pleno`; rótulo de 14 px en `--c-sobre-pleno`. **Sin color de tono**: sobre el pleno el estado lo dicen la
  forma y la palabra. Cursor encima: fondo `--c-pleno-hover`. Foco: anillo `--c-sobre-pleno` por dentro.
- **Fuera de la mordaza** (cualquier otro caso): debajo de la «Acción del día», en una hoja con cabeza de 1,5 px en
  tinta; dos columnas desde 37,5 rem de regla y una por debajo. Renglones de 44 px con filete; cifra de `--t-cifra` a
  2 rem en tinta; forma en el color de marca de su tono; rótulo de 14 px. Cursor encima: `--c-papel-2` y la cifra en
  `--c-pleno-texto`.
- Una cifra en cero se muestra (el cero es información) con su forma en `--c-tinta-3`.
- Los renglones **no se mueven** en la entrada: están en su lugar desde el primer cuadro.

#### 15.6.5 «No disponibles hoy»: la lista de piezas

El panel actual, con la misma información, pasa a leerse como la **lista de piezas** del plano.

- Ficha (15.5.4) con su título y su desglose de hoy.
- Cada renglón: **globo con el número de pieza** · chapa en horizontal · interno · etiqueta de estado (variante texto,
  con forma) · motivo · flecha. El renglón entero sigue siendo el enlace a la ficha. Precinto de 6 px a la izquierda
  con la marca de su tono. Mínimo 54 px.
- El número es el mismo del globo de la llave: esa es toda la relación entre las dos piezas en esta etapa (el
  resaltado cruzado llega en la etapa 3 del rediseño).
- «Conductores que no pueden manejar hoy», el enlace «Ver las N no disponibles en Movilidades» y el estado vacío no
  cambian de contenido.

#### 15.6.6 Convivencia con el horizonte

Inicio tiene dos reglas y **un solo campo pleno**: el de la regla de salida. El **horizonte de vencimientos queda en
papel y tinta**:

- Pista sobre `--c-hoja`. Tramo de 0 a 7 días, `--c-aten-fondo`; de 8 a 15, `--c-papel-2`; de 16 a 30, sin fondo (solo
  contorno de 1 px).
- Marcas: triángulo en `--c-aten-relleno`, círculo lleno en tinta, aro en `--c-tinta-3`. Línea de «Hoy» en tinta.
- Caja «Vencidos o faltantes»: fondo `--c-crit-fondo`, precinto de 6 px a la izquierda, cifra en cartel en `--c-crit`.
- Los rótulos de patente de la regla (`[data-rotulo]`) **conservan su familia, tamaño, peso, relleno y ancho de
  borde**: el código los mide para acomodarlos. Solo cambian de color (son objetos).
- El horizonte va **debajo** de la regla de salida y nunca a su lado en la primera pantalla: primero la medida de hoy,
  después lo que viene.

#### 15.6.7 Límites

Cada límite tiene su prueba en la lógica y se provoca con altas y bajas.

| Caso | Qué se ve |
| --- | --- |
| **Cero no disponibles** | La mordaza ocupa toda la caja; no hay zona roja, sello, cota ni globos; el cursor queda en el extremo; todas las llaves derechas (o, en el tablero corto, solo el riel con ganchos y ningún rótulo de fila). La «Acción del día» pasa a su variante «en orden» (15.7). Renglones dentro de la mordaza, si entra. |
| **Zona roja más angosta que el sello** (menos de 2,75 rem; por ejemplo, **una sola no disponible** de 23 a 360 px: la zona mide unos 14 px) | La zona conserva su ancho real (la medida no se falsea) y el sello **sale de ella**: placa lisa de 44 × 44 px como mínimo, sin giro, con solo el número (cartel de 28 px), **anclada a la esquina inferior derecha de la caja**, por dentro del borde; crece hacia la izquierda, sobre la mordaza. Conserva su borde de 1,5 px en `--c-sobre-solido`, que de día es lo que la recorta sobre el cobalto (7,81:1); de noche la recorta su propio rojo sobre la crema (3,96). Tapa los 44 px de abajo del canto; el resto del canto y el cursor siguen marcando la lectura. No pisa el título ni la cifra (a la izquierda), la marca de registro (arriba a la derecha) ni los renglones de lectura (centrados en alto: con la caja de 252 px quedan 10 px libres, medidos en el boceto a
1280 px; la cuenta daba 8). Nombre y desglose van en el rótulo del tablero corto; con el tablero completo, en la cota, cuyo rótulo se alinea al borde derecho de la regla cuando no entra entre los topes. Foco y cursor encima: los del sello (15.6.1). A este estado se llega resolviendo piezas con la «Acción del día». Se dibujó y se midió en el boceto (`inicio-una.html`, 27/11/2026): con la zona roja de 14,1 px (a 360 px) y de 42,4 px (a 1280 px) el sello sale de ella, mide 44 × 44, queda dentro de la caja y no pisa el título, la cifra ni los renglones. |
| **Todas no disponibles** | La mordaza mide 0: título y cifra («0 /N») salen a la placa lisa sobre la zona roja (15.6.2). Toda la caja es zona roja; todas las llaves torcidas. |
| **Una sola unidad activa** | Escala de 0 a 1, una llave centrada en su división. Cifra «1 /1» o «0 /1». |
| **Flota vacía** (ninguna unidad activa) | El cuadro cero (15.4.6) con un mensaje en lugar del progreso: no hay mordaza, cifra, escala numerada ni llaves. El `h2` sigue presente. La regla lleva `data-vacia` y no divide por cero. |
| **Más unidades de las que entran** | Tablero corto según la tabla de 15.6.3. Con más de 60 activas, la escala deja las marcas menores y conserva las mayores. |
| **Primera no disponible sin acción de documento** | La «Acción del día» toma la **primera pieza que sí tiene** acción de documento y su guía sale de esa pieza (no necesariamente la 1). Si ninguna la tiene, ofrece «Ver ficha» de la primera (15.7). |
| **Muchas no disponibles en el celular** | Hasta ocho chapas colgadas y «y N más». |
| **Cifras de tres dígitos** | La cifra baja de tamaño con el ancho de la mordaza; el «/N» nunca baja de 16 px. |
| **Texto al 200 % a 360 px** | La cifra respeta su mínimo de 3,5 rem; las chapas colgadas pasan a una por renglón; sin desplazamiento horizontal. |

#### 15.6.8 Lo que la lógica le entrega a la hoja de estilos

Para que la hoja de estilos no calcule nada ni lleve números escritos, el componente de la regla expone esto (nombres
propuestos; si el programador necesita otros, se cambian acá antes de maquetar):

| Dónde | Qué | Para qué |
| --- | --- | --- |
| Regla | `style:--medida` (de 0 a 1) | Ancho de la mordaza, posición del cursor y de la lectura. |
| Regla | `style:--act` (entero) | Divisiones de la escala, ganchos y columnas del tablero. |
| Regla | `data-campo="ancho"`, `"medio"` o `"angosto"` (medida de 0,70 o más; de 0,45 a 0,70; menor) | Renglones dentro o fuera de la mordaza; marca de registro. |
| Regla | `data-carga="a"`, `"b"`, `"c"` o `"d"` (15.6.3) | Tablero completo o corto. |
| Regla | `data-vacia` | Flota vacía. |
| Vista | `data-entrada` y `data-pausa` (15.10) | Coreografía. |
| Tambor | `style:--d` (dígito) y `style:--desde` (dígito anterior) | Posición de la tira. `--desde` vale lo mismo que `--d` en la entrada (la cifra marca el valor final desde el cuadro 0, 15.10) y vale el dígito anterior solo cuando una acción cambió el dato (15.7): giran únicamente los dígitos que cambian. |
| Llave | `data-sale="si"` o `"no"`, `data-tono` (en las que no salen) y `style:--i` (posición) y `style:--j` (orden entre las que no salen) | Aspecto, giro y escalón de la caída. |
| Chapa del tablero corto (lista aparte, 15.6.3) | `data-tono` y `style:--j` | Aspecto, giro y escalón de la caída. Sin `tabindex`: son enlaces comunes. |
| Número de la escala | `style:--x` (de 0 a 1) | Posición. La lógica omite los que quedarían a menos de 0,05 de la lectura o del final. |
| Rótulo de cota | `style:--x` y `data-lado` | Posición bajo la llave señalada. |
| Rótulo de cota | `data-origen="teclado"` cuando lo muestra el foco de teclado | Renglón de ayuda de las flechas. |
| «Acción del día» | `style:--x` | Posición de la guía. |

---

### 15.7 La «Acción del día»

La acción principal de Inicio. Es una **nota de plano**: hoja `--c-hoja`, borde de 1,5 px en tinta, sombra
`--s-pieza`, a todo el ancho de la regla, 12 px debajo del tablero de llaves. Va **siempre en el flujo** (no
flotante): así no depende de dónde caiga la pieza ni de cuántas haya.

**Contenido, de izquierda a derecha:** globo con el número de la pieza · rótulo «Acción del día» (técnica de 12 px) ·
la frase del motivo (14 px, peso 600; es el texto que ya existe para el aviso de la unidad) · **botón de la acción**
con aspecto **pleno** · segundo botón **«Probar como conductor»** (secundario, con flecha).

- El botón de la acción usa la acción de documento que Inicio ya calcula («Renovar» o «Cargar», con su nombre
  accesible completo) y **abre el diálogo de siempre** (15.5.11, fila 2).
- **«Probar como conductor»** (decisión tomada: la franja de arriba se muda acá) aparece solo cuando existe el
  recorrido que hoy muestra la franja. Conserva **su texto y su comportamiento**: abre «Ver como» con Conductor y ese
  conductor ya elegidos, y lleva `aria-haspopup="dialog"`. La frase de invitación de la franja pasa a ser la
  descripción del botón y **se ve en todos los anchos** (revisión del boceto, 27/11/2026): 13 px, `--c-tinta-2`,
  hasta dos renglones (tres entre 26 y 56 rem), **debajo del propio botón «Probar como conductor»**, con su borde
  izquierdo alineado con el del botón y hasta el borde derecho de la nota. En el celular es el gancho que explica para
  qué sirve el botón; en la fila de 56 rem o más, alineada con el botón y no con «Renovar», deja de parecer una
  descripción de los dos. Sigue referida por `aria-describedby`.
- **Guía:** con el tablero completo, una línea vertical de 1,5 px y 12 px de alto une el borde superior de la nota con
  el globo de su pieza (posición por `style:--x`). Con el tablero corto no hay guía ni globo: la frase nombra la
  patente.
- **Sigue siendo el único botón pleno de la pantalla** y no hay otro primario en Inicio.

| Ancho de la nota | Disposición | Alto de los botones |
| --- | --- | --- |
| 56 rem o más | Una fila: globo, rótulo, frase, botones a la derecha; la frase de invitación, debajo de «Probar como conductor». | 36 px |
| De 26 a 56 rem | Dos filas: rótulo y frase; debajo, los dos botones lado a lado y, bajo «Probar como conductor», su frase de invitación. | 40 px |
| Menos de 26 rem (celular) | Rótulo; frase (hasta dos renglones); botón de la acción a todo el ancho; debajo, «Probar como conductor» a todo el ancho y, bajo él, su frase de invitación (13 px, hasta dos renglones). | **40 px** cada uno |

**Primera pantalla del celular.** A 390 × 844 y a 360 × 800 la nota queda **entera por encima de la barra
inferior**, con sus dos botones. Cuenta de alturas a 390 px de ancho, **hecha con las medidas de esta sección (no es
una medición)**: barra 54 · renglón de lámina 24 · título 38 · línea de contexto 36 (dos renglones) · caja de la regla
128 · escala 26 · tablero corto 80 (riel con ganchos, rótulo y un renglón de chapas) · nota 174 · separaciones 48:
unos **610 px** de los 782 disponibles. A 360 × 800, con la línea de contexto en tres renglones y el rótulo de la fila
en dos, unos 645 de 738. A 360 × 640 **no** se garantiza. El boceto lo mide con los textos reales y una prueba de punta
a punta lo comprueba en los dos primeros tamaños.

**Medido en el boceto (27/11/2026) y con la frase de «Probar como conductor» a la vista.** Sin la frase, la nota
medía 182,2 px (no 174) y entraba entera: «Renovar» en 533,9–573,9 y «Probar como conductor» en 583,9–623,9 (40 px
cada uno), contra una barra inferior que empieza en 782 px a 390 × 844 y en 738 px a 360 × 800: holgura de 145,1 y
de 101,1 px. La frase de 13 px en dos renglones suma unos 38 px (dos renglones de 18,2 px más la separación; cuenta,
no medición): la holgura baja a unos 107 y 63 px. Se vuelve a medir con los textos finales en esos dos tamaños. A
320 × 640 no entra (−111,9 px en el boceto, sin la frase) y no se garantiza. Si a 360 × 800 la holgura medida queda
por debajo de 24 px, se avisa al diseño antes de resolverlo: la frase no se recorta ni baja de 13 px.

| Variante | Cuándo | Qué muestra |
| --- | --- | --- |
| **Con acción de documento** | La pieza elegida tiene un documento para renovar o cargar. | Lo de arriba. |
| **Sin acción de documento** | Ninguna pieza no disponible tiene acción de documento (por ejemplo, todas fuera de servicio por novedad). | La frase de la primera pieza y, en lugar del botón pleno, el enlace con aspecto de botón secundario «Ver ficha». Sin «Probar como conductor» si no hay recorrido. |
| **En orden** | No hay ninguna no disponible. | La frase «todas disponibles» que ya existe, con un círculo vacío en `--c-ok` antes del texto. **Sin botones.** La nota se queda (no desaparece) para que la pantalla no salte. |
| **Flota vacía** | Ninguna unidad activa. | No se muestra la nota: el mensaje y su enlace van dentro del cuadro cero. |

Estados de los botones: los de 15.5.1. Guardando: el diálogo, no la nota. Error: dentro del diálogo, que no se cierra.

**Al resolver** (versión mínima de la escena; la completa llega en la etapa 3 del rediseño). Cuando el diálogo guarda
y una unidad pasa a estar disponible, **la regla no se rearma: se mueve en su lugar**, una pieza por vez.

| t (ms) | Qué pasa |
| --- | --- |
| 0 | Se cierra el diálogo. El **foco va al título de la regla** (el `h2` «Disponibles hoy», que muestra su anillo). Una región `role="status"` anuncia el resultado: el mensaje que el diálogo ya produce y la medida nueva (15.14). Los textos para lectores ya dicen el valor final. La llave resuelta aparece derecha, lisa y en su lugar nuevo entre las disponibles; si el presupuesto de peso lo permite, llega ahí con la transición de vista que ya existe para la patente; si no, de una vez. |
| 0–640 | **La mordaza corre** hasta la medida nueva (transición de `flex-basis` con `--m-curva`); el cursor y el recuadro de la lectura la acompañan con la misma duración y la misma curva: es un solo gesto. Los tambores **giran un paso**, solo los dígitos que cambian. |
| 640–900 | **El sello de la zona roja se vuelve a estampar** con el número nuevo (escala de 1,35 a 1 con `--m-curva-resorte`, 260 ms). Si ya no queda ninguna no disponible, la zona roja no existe y no hay sello. |
| 900 | Todo quieto. La «Acción del día» muestra la acción siguiente o su variante «en orden». |

- El mensaje del resultado se ve también en pantalla: un renglón de estado dentro de la nota, debajo de los botones
  (13 px, `--c-tinta-2`), que es la misma región `role="status"`. No hay avisos emergentes.
- Con movimiento reducido o «Sin animaciones», todo cambia de una vez en el instante 0; foco y anuncio, iguales.
- Los otros dos orígenes del diálogo (la lista de piezas y el horizonte) siguen llevando el foco y el mensaje a su
  panel, como hoy; la regla se mueve igual, porque la medida cambió.
- Un valor que cambia por una acción **no** vuelve a correr la coreografía de entrada.

---

### 15.8 Hoy del conductor: veredicto y llave

Hoy no tiene cifra: su pieza monumental es el **veredicto**. El `h1` sigue siendo «Hoy» y los ocho estados del día
(6.4) no cambian de reglas, de textos ni de acciones. Cambia cómo se presentan la unidad y la respuesta a «¿puedo
salir?».

```
┌──────────────────────────────────────┐
│ ▣  ◆ DATOS FICTICIOS   ● Conductor ⌄ │ 54 px
├──────────────────────────────────────┤
│ FL-07              viernes 27/11/2026 │
│ Hoy                                  │
│ ▪ Hoy, viernes 27/11/2026            │  ficha (Panel), con su título de siempre
│            ━━━┳━━━                   │  gancho
│   ┌───────────○───────────┐          │  llave: objeto, borde de 2 px,
│   │  ┌─────────────────┐  │          │  radio 6 px arriba y 22 px abajo
│   │  │▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀│  │          │
│   │  │    ZYN 469      │  │          │  chapa: --t-patente-llave, franja de 12 px
│   │  └─────────────────┘  │          │
│   │ Int. 01 · Chevrolet S10 2015     │
│   │ Último registro: 141.711 km …    │
│   ├───────────────────────┤          │  filete de 1,5 px
│   │  ○  Puede salir       │          │  veredicto: cartel a 75 %, 60 px
│   └───────────────────────┘          │
│ (aviso de tarea, si lo hay)          │
│ Antes de salir, revise la unidad…    │
│ [      Empezar la revisión       ]   │  primario grande, 52 px
│ [ Usar otra unidad ]                 │
├──────────────────────────────────────┤
│   Hoy        Mis partes        Más   │ 62 px
└──────────────────────────────────────┘
```

- **La llave** va dentro de la ficha «Hoy», en lugar del bloque actual de patente, interno y descripción. Es un
  **objeto** (`.objeto`): papel `--obj-hoja`, borde de 2 px en `--obj-tinta`, sombra `0 16px 26px -14px rgb(0 0 0 /
  0.55)`, agujero de 12 px y gancho de 3 px en tinta. Ancho `min(100%, 24rem)`, centrada.
- **La chapa** de adentro es la `Patente` de siempre con el tamaño de la llave. No es un enlace (el conductor no tiene
  ficha).
- **Interno, descripción y último registro:** 13 px, `--obj-tinta-2`, centrados.
- **El veredicto** ocupa el pie de la llave, a todo su ancho, separado por un filete de 1,5 px: marca de 42 px y texto
  en cartel a 75 %, peso 780, `--t-veredicto`, con `text-wrap: balance`. Es un párrafo, no un título, y **no** es una
  región viva: se lee en el orden normal, antes de los avisos y del botón.
- **Fuera de la llave**, debajo y sin cambios: el aviso que corresponda (15.5.6), la frase de lo que hay que hacer, el
  primario (grande, 52 px) y «Usar otra unidad».

| Veredicto | Marca | Color | Pie de la llave |
| --- | --- | --- | --- |
| **Sale** | Círculo con marca de verificación | `--obj-tinta` | Liso. |
| **No sale** | Rombo con signo de admiración | `--obj-crit` | Franja de **precinto** de 10 px en `--obj-crit-relleno`; el borde de la llave pasa a `--obj-crit-relleno`. El texto va a 46 px (suele ocupar dos renglones). |
| **Tarea** | Triángulo | `--obj-tinta` | Liso. |
| **Sin veredicto** | — | — | No hay llave: solo el `select` de unidad. |

| Estado del día (6.4) | Veredicto | Qué más cambia |
| --- | --- | --- |
| Sin parte (puede empezar) | Sale | Primario «Empezar la revisión». |
| Borrador | Sale | Primario «Continuar la revisión». |
| En uso | Sale (texto propio: 15.14) | Etiqueta «En uso desde …» y primario «Cerrar el parte». |
| Cerrado | Sale (texto propio) | Etiqueta de cerrado y enlace «Ver el parte». |
| Cerrado sin salida (novedad crítica en la revisión) | **No sale** | Aviso crítico de siempre. |
| **Unidad fuera de servicio** | **No sale** | Aviso de siempre; «Usar otra unidad». |
| **Unidad bloqueada por documentos** | **No sale** | Aviso crítico de siempre, sin primario. |
| **Licencia sin vigencia** | **No sale** (texto propio: habla del conductor, no de la unidad) | Aviso de bloqueo, sin primario y sin «Usar otra unidad». |
| **«Cerrar antes»** | Tarea | Aviso de tono `semana` y primario «Cerrar el parte anterior». No es un bloqueo: no lleva rojo. |
| **Sin unidad asignada** | Sin veredicto | Solo el `select` «Elija una unidad». Al elegir una, aparece su llave. |

**Veredictos (decisión DE3 de Matías, 28/11/2026): solo donde hay algo que decidir.** «Puede salir», «No puede salir hoy»,
«Sin licencia vigente» y «Cierre pendiente» son veredictos. En «En uso» y con el parte cerrado el pie de la llave lleva la
etiqueta de estado que ya existe («En uso desde las 06:52»), sin texto nuevo: decir «Puede salir» sería falso. Lo
resuelve `estado/veredicto.ts`.

- La **variante bloqueada** (los cuatro «No sale») es la segunda pantalla que se dibuja en el boceto previo.
- En el celular, la llave con su veredicto y el primario entran en la primera pantalla a 390 × 844 cuando no hay aviso
  de tarea. Con aviso, entra la llave entera y el primario puede quedar debajo: el aviso manda.
- **Desde 64 rem** se conservan las dos columnas actuales; la llave no crece más allá de 24 rem.
- Al elegir otra unidad, la llave cambia de una vez (sin animación) y la barra de estado de la ficha lo dice, como
  hoy.
- Entrada: 15.10.

---

### 15.9 Pantallas y estados

Las nueve pantallas conservan su estructura de datos, sus rutas, su `h1` y sus acciones. Por pantalla: código de
lámina, jerarquía, grilla y comportamiento a 360, 768 y 1280 px.

| Lámina | Pantalla | Ruta |
| --- | --- | --- |
| FL-01 | Inicio | `#/inicio` |
| FL-02 | Movilidades | `#/movilidades` |
| FL-03 | Vencimientos | `#/vencimientos` |
| FL-04 | Operación diaria | `#/operacion/…` |
| FL-05 | Ficha de unidad | `#/unidad/…` |
| FL-06 | Parte diario | `#/parte/…` |
| FL-07 | Hoy | `#/conductor` |
| FL-08 | Mis partes | `#/conductor/partes` |
| FL-09 | Más | `#/mas` |

#### 15.9.1 Inicio (FL-01)

Jerarquía: (1) regla de salida, (2) «Acción del día», (3) renglones de lectura si van fuera, (4) «No disponibles hoy»,
(5) horizonte de vencimientos, (6) operación diaria, (7) autoría (solo por debajo de 64 rem). La franja «Probar como
conductor» de arriba **ya no existe**.

| Ancho | Disposición |
| --- | --- |
| **1280** (regla de unos 61 rem) | Encabezado; regla con el tablero completo y los renglones dentro de la mordaza; nota en una fila; debajo, dos columnas: «No disponibles hoy» a la izquierda y, a la derecha, Vencimientos sobre Operación diaria. La regla y la nota entran sin bajar. |
| **768** (regla de 45 rem) | Caja de 196 px; tablero completo (hasta 24 activas); nota en dos filas; renglones en lista de dos columnas; los tres paneles en una columna. |
| **360** | Caja de 128 px; tablero corto; nota apilada con botones de 40 px; renglones en una columna; paneles en una columna. La nota entra entera en la primera pantalla (15.7). |

Encabezado: `h1` «Inicio» y la línea de contexto actual (texto sin cambios), en `--c-tinta-2` y 13 px.

#### 15.9.2 Movilidades (FL-02)

Jerarquía: título con «Agregar unidad» (secundario, a la derecha), línea de resumen, y una ficha con buscador,
proyecto, orden, filtros (segmentado) y la tabla densa.

| Ancho | Disposición |
| --- | --- |
| **1280** | Tabla de siete columnas; fila de 46 px como mínimo; chapa en la primera columna; estado como etiqueta de texto con forma; próximo vencimiento con el horizonte mínimo en papel y tinta; kilómetros en técnica, a la derecha. Fila no disponible con precinto a la izquierda. |
| **768** | La tabla pasa a tarjetas cuando su contenedor no alcanza (corte actual); filtros en dos renglones. |
| **360** | Tarjetas; buscador a todo el ancho; proyecto y orden apilados; «Agregar unidad» debajo del título, sin dominar. |

Estados: sin resultados por filtro o búsqueda → pieza de vacío con «Quitar filtros»; sin unidades → vacío con «Agregar
unidad»; fila de baja → tono `neutro`, texto en `--c-tinta-2`, sin acciones.

#### 15.9.3 Vencimientos (FL-03)

Jerarquía: título y resumen; ficha con el horizonte completo (papel y tinta, 15.6.6); filtros (segmentado); grupos por
tramo, cada uno una ficha con su forma en el título y filas con acción.

| Ancho | Disposición |
| --- | --- |
| **1280** | Horizonte a todo el ancho con la caja «Vencidos o faltantes» a la izquierda; grupos uno debajo del otro; en cada fila, etiqueta, documento, titular y fechas a la izquierda y «Renovar» o «Cargar» (secundario, 36 px) a la derecha. |
| **768** | Igual, con la caja de vencidos arriba de la pista. |
| **360** | Filas apiladas con el botón debajo, a todo el ancho y de 40 px; los rótulos de la pista no se pisan (lo resuelve el código que ya existe). |

Estados: «Nada vence en los próximos 30 días» en la pista; grupo vacío no se muestra; lista vacía → pieza de vacío.
Mensaje tras guardar: en la barra de estado de la ficha de la lista.

#### 15.9.4 Operación diaria (FL-04)

Jerarquía: título; **solapas** Partes y Novedades (son enlaces: 36 px en escritorio y 44 por debajo, conteo en
técnica; la elegida, texto en tinta y **barra inferior de 3 px en tinta**, no en pleno); grupos de la solapa en
fichas; pie de la solapa.

| Ancho | Disposición |
| --- | --- |
| **1280** | Una columna de fichas; filas con estado, qué pasó, unidad (chapa), fecha y acción. |
| **768** | Igual. |
| **360** | Filas en tarjetas; la acción debajo, de 40 px. |

Estados: solapa sin pendientes → pieza de vacío con su título y su ayuda; grupo sin filas → su frase.

#### 15.9.5 Ficha de unidad (FL-05)

Jerarquía: enlace al padre (en la barra); `h1` con la **chapa grande**; línea de interno y modelo; estado de hoy
(aviso del tono que corresponda; «Disponible» sin fondo); datos (proyecto, conductor, kilometraje) con `Dato`;
acciones; fichas Documentos, Novedades, Kilometraje e Historial.

| Ancho | Disposición |
| --- | --- |
| **1280** | Encabezado con las acciones a la derecha en columna; Documentos a la izquierda (dos tercios) y Novedades sobre Kilometraje a la derecha; Historial a todo el ancho. |
| **768** | Acciones en una fila debajo del encabezado; las fichas en una columna. |
| **360** | Acciones a todo el ancho, de 44 px; documentos en tarjetas con sus botones debajo; historial con la hora arriba de cada evento. |

Estados: unidad de baja → aviso `neutro` y ninguna acción; sin novedades, sin partes, documentos faltantes («Falta
cargar» con rombo) → como hoy, con la pieza de vacío nueva; patente inexistente → título, párrafo y enlace, sin
precinto. El horizonte mediano de Documentos, en papel y tinta.

#### 15.9.6 Parte diario (FL-06)

Columna única de `--ancho-parte`. Jerarquía: enlace al padre; `h1` con el paso; renglón de contexto; chapa grande e
interno; secciones numeradas (`h2` en cartel, `--t-h2`); barra de envío.

| Ancho | Disposición |
| --- | --- |
| **1280** | La misma columna de 40 rem, centrada; la barra de envío con el ancho de la columna. |
| **768** | Igual. |
| **360** | Campos de 48 px y 16 px de letra; opciones del checklist lado a lado; la barra de envío no tapa el campo enfocado. |

| Estado | Piel |
| --- | --- |
| Revisión (paso 1) y cierre (paso 2) | Formulario sobre `--c-hoja`, secciones separadas por filete de 1,5 px en tinta. |
| Con errores | `ResumenErrores` arriba (15.5.10), campos e ítems en error. |
| **Bloqueado por documento o por licencia** (pantalla E) | `h1` de siempre; ficha con precinto crítico de 6 px a la izquierda, el motivo y, si aplica, su acción. Sin formulario. |
| «Cerrar antes» (pantalla E) | Aviso de tono `semana` con primario. Sin rojo. |
| Enviado (C1), no puede salir (C2), cerrado (C3) | `h1` en `--c-tinta` (nunca en el color del tono); línea de resultado; acciones. C2 lleva precinto crítico. |
| Lectura (D) | Datos con `Dato` en una hoja; la revisión leída punto por punto con su forma. |
| Enviando o cerrando | El primario en carga; el formulario no se bloquea a la vista. |
| Dirección mal escrita | Título, párrafo y enlace. |

#### 15.9.7 Hoy (FL-07)

15.8. A **1280**, dos columnas (la ficha «Hoy» con la llave, y a la derecha Pendientes, Su licencia y Mis últimos
partes). A **768** y **360**, una columna con «Hoy» primero.

#### 15.9.8 Mis partes (FL-08)

Lista de partes en una ficha: fecha (enlace), chapa, recorrido en técnica a la derecha y su etiqueta de parte. A
**360**, dos renglones por parte. Vacío: «Todavía no envió partes.» en la pieza de vacío.

#### 15.9.9 Más (FL-09)

Tres fichas en una columna de 40 rem: «Ver como» (perfil de ahora y «Cambiar perfil», que **no** empieza con «Ver
como»), **«Apariencia»** (15.4.5) y «La demo» («Cómo funciona», «Reiniciar demo», volver al portafolio). Al pie, la
autoría. Igual a los tres anchos; por debajo de 64 rem los controles miden 44 px.

#### 15.9.10 Tabla de estados (lista de control)

Es la tabla de la sección 8 con la fila de la regla y los estados del marco. Cada celda dice dónde está especificada
su piel.

| Pantalla | Cargando | Vacío | Sin datos | Error |
| --- | --- | --- | --- | --- |
| **Toda la aplicación** | Arranque: cuadro cero (15.4.6). Pantalla que se baja: «Cargando la pantalla…» (15.4.6). | — | — | Error de arranque; error de descarga; «Hay una versión nueva»; ruta desconocida; datos dañados (15.4.6). Almacenamiento no disponible o perdido, datos de otra fecha, cambios en otra pestaña (15.4.7). |
| **Regla de salida** | Cuadro cero. | Flota vacía (15.6.7). | Una sola unidad; cifras de tres dígitos (15.6.7). | Cero no disponibles; todas no disponibles; más unidades de las que entran; primera pieza sin acción de documento (15.6.7 y 15.7). |
| **Inicio** | — | «No disponibles hoy» vacío; operación sin pendientes; horizonte sin vencimientos (15.5.12, 15.6.6). | — | Error al guardar: dentro del diálogo (15.5.11). |
| **Movilidades** | — | Sin resultados; sin unidades (15.9.2). | — | — |
| **Vencimientos** | — | Nada vence; lista vacía (15.9.3). | — | Error al guardar: dentro del diálogo. |
| **Operación diaria** | — | Solapa sin pendientes (15.9.4). | — | — |
| **Ficha** | — | Sin novedades; sin partes; solo documentos faltantes (15.9.5). | Historial con un solo evento. | Patente inexistente; unidad de baja (15.9.5). |
| **Hoy** | — | «Mis últimos partes» vacío. | Sin unidad asignada (15.8). | Unidad fuera de servicio; unidad bloqueada; licencia sin vigencia; «Cerrar antes» (15.8). |
| **Mis partes** | — | Sin partes (15.9.8). | — | — |
| **Parte** | Enviando; cerrando (15.9.6). | — | Primer registro de la unidad (ayuda del campo). | Resumen de errores; guardado con error; bloqueado por documento o licencia; «Cerrar antes»; dirección mal escrita (15.9.6). |
| **Más** | — | — | — | — |

Transversales, en todas: claro y oscuro; `forced-colors` (15.3.7); movimiento reducido y «Sin animaciones» (15.10);
320 y 360 px sin desplazamiento horizontal; texto al 200 % a 360 px (regla de la sección 12).

---

### 15.10 Coreografía

**Regla general: se mueve una pieza por vez.** La entrada corre **una vez por vista y por sesión**, termina antes de
**1.050 ms** y después queda fija. «Reiniciar demo» la vuelve a pedir.

**Estados de entrada.** El contenedor de la vista lleva `data-entrada`:

| Valor | Cuándo | Qué hace |
| --- | --- | --- |
| `completa` | Primera vez que se ve esa vista en la sesión. | Corre la coreografía de la tabla. |
| `breve` | Al volver a una vista ya vista. | Solo la transición entre pantallas que ya existe (sale en 110 ms; entra en 230 ms subiendo 10 px). |
| `fija` | A los 1.500 ms de empezar. | Ya no aplica ninguna regla de animación: el estado final no depende del relleno de la animación. |
| `quieta` | Movimiento reducido o «Sin animaciones». | Todo completo y en su estado final desde el primer cuadro. |

**Pausa en el primer cuadro.** Con `completa`, las animaciones están puestas pero **en pausa** (`data-pausa`) hasta
que se cumplan las dos condiciones: (a) las letras cargaron **o** pasaron 450 ms; (b) terminó la transición entre
pantallas, si hubo una. El primer cuadro **está diseñado para leerse** y no muestra ningún dato falso.

**Entrada de Inicio** (`completa`):

| t (ms) | Pieza | Qué pasa |
| --- | --- | --- |
| 0 | **Todo en su lugar** | Título, caja, escala, **las llaves colgadas y derechas**, renglones de lectura, «Acción del día» (ya se puede pulsar), lista de piezas, horizonte y operación. **La cifra dice el valor final desde el cuadro 0** («19 /23»): los tambores ya están en su dígito y no cuentan. El campo pleno ocupa toda la caja, con una tapa de color pleno sobre la zona roja; el cursor está en el extremo, y el recuadro de la lectura y la cota todavía no se dibujan (aparecen cuando el cursor llega, abajo). Nada del primer cuadro dice una cifra falsa: la cifra, el párrafo para lectores, los globos y los renglones de «No disponibles hoy» cuentan lo mismo. |
| 120–660 | **La mordaza** | Se cierra hasta la medida frenando contra el tope (`--m-curva`). Es un solo gesto de dos partes que duran y frenan igual: la tapa que descubre la zona roja y el canto con el cursor, que viaja del extremo a la lectura. **La cifra no se mueve.** En los últimos 120 ms del gesto (540–660), cuando el cursor llega, el recuadro de la lectura y la cota de la zona roja aparecen con un fundido (`opacity`): son el remate del mismo gesto, no empiezan uno nuevo. |
| 660–880 | **Las llaves que no salen** | Caen 6 px y quedan torcidas (`--m-curva-resorte`, 160 ms cada una, escalonadas 20 ms; el escalón se achica para que el conjunto termine a los 880 ms aunque sean muchas). **Las que salen no se mueven nunca.** |
| 880–1.040 | **El sello** | Se estampa el número de la zona roja (escala de 1,35 a 1, `--m-curva-resorte`). |
| 1.500 | | `fija`. |

- **Solo con `transform`, `opacity` y `clip-path`.** La mordaza real tiene su ancho final desde el cuadro 0. Lo que se
  mueve es una **tapa** de color pleno puesta sobre la zona roja, que se achica con `scaleX` desde la izquierda, y el
  canto con el cursor, que se trasladan con `translateX` en unidades de contenedor. Los tambores **no se mueven**
  en la entrada: están en su dígito final desde el cuadro 0 (`style:--d`; `style:--desde` vale lo mismo). Todo en CSS: el JavaScript solo pone
  `data-entrada` y `data-pausa`.
- Con el tablero corto, las chapas colgadas hacen la misma caída (una por vez, mismo tiempo total).
- Con cero no disponibles no hay nada que cerrar: la entrada no mueve nada.
- **Primer recorte de peso previsto** (los tambores pasan a ser la cifra fija con su aspecto, sin contar): con el
  cambio de arriba la entrada **ya no cuenta**, se decida lo que se decida. Lo que queda por decidir es si, al
  resolver, los dígitos que cambian lo hacen de una vez (decisión DE7 de Matías, 28/11/2026: el odómetro es una cifra fija
  con aspecto de tambor). El resto de la tabla no cambia.
- Si hay una tarea de más de 50 ms durante la entrada en un celular lento, se simplifica la coreografía del celular
  (se quita la caída de las chapas) antes que cualquier otra cosa.

**Entrada de Hoy** (`completa`):

| t (ms) | Pieza | Qué pasa |
| --- | --- | --- |
| 0 | Todo en su lugar | Título, ficha, la llave con su chapa y sus datos, aviso, botón. El veredicto está escrito (para lectores, desde el cuadro 0) y a la vista en su lugar, con opacidad 0. |
| 80–520 | **La llave** | Se balancea una vez desde su gancho (de +4° a −3° a 0°, `--m-curva-resorte`). |
| 520–900 | **El veredicto** | Se estampa (escala de 1,18 a 1 y giro de −2,5° a 0°, `--m-curva`). |
| 1.500 | | `fija`. |

**Las demás pantallas** no tienen coreografía propia: usan la transición entre pantallas que ya existe, incluido el
viaje de la patente entre la lista y la ficha.

**Estado final accesible.** Desde el cuadro 0 el DOM dice los valores finales: el párrafo de la regla, los nombres de
las llaves, el veredicto. Lo que se anima es `aria-hidden` o es solo una transformación visual. **No se anuncia ningún
valor intermedio** y ninguna región viva cambia durante la entrada. Una instantánea del árbol de accesibilidad a t = 0
y a 1,5 s da lo mismo.

**Movimiento reducido y «Sin animaciones».** `data-entrada="quieta"`: sin coreografía, sin transición entre
pantallas, sin cursor de calibre, sin destellos; la escena de 15.7 cambia de una vez. Con «Sin animaciones» activo,
`document.getAnimations()` queda vacío al navegar.

**Microinteracciones** (todas de menos de 600 ms y de una sola pieza): cursor de calibre del botón (15.5.1); llave que
se endereza y sube (15.6.3); chapa que sube 1 px; flecha de `Detalles` que gira; destello de la fila actualizada.

---

### 15.11 Contratos que no se tocan

Los fijan las pruebas de punta a punta, el código que elige elementos por clase o atributo, o las dos cosas. Vestir
una pieza **no** los cambia. Las 24 pruebas de punta a punta actuales tienen que seguir pasando **sin modificarse**.

**Estructura y títulos**

- `main#principal` con `tabindex="-1"`, y dentro **un `h1`** con `tabindex="-1"` y **el texto exacto** de hoy: «Inicio»,
  «Movilidades», «Vencimientos», «Operación diaria», «Hoy», «Mis partes», «Más»; en la ficha, la patente (dentro de un
  elemento `.patente`); en el parte, el nombre del paso; en los errores, sus títulos actuales. **El código de lámina va
  fuera del `h1`**, y nada más se le agrega adentro.
- Los `id` que el código busca: `principal`, `app`, `texto-cargando`, `texto-preparando`, `titulo-no-disponibles`,
  `titulo-vencimientos`, `titulo-operacion`, `lista-vencimientos`, los de las solapas y los de las fichas de la
  unidad.
- Dos títulos que el código busca **por posición**, no por `id`: el primer `h2` dentro de `#lista-vencimientos`
  (destino del foco después de guardar en Vencimientos; `PantallaVencimientos.svelte`) y el **primer `h2` del
  diálogo** (destino del foco inicial cuando se pide en el título; `Dialogo.svelte`). Al vestir no se pone otro `h2`
  delante de ninguno de los dos.

**Marco**

- **Un único botón visible** cuyo nombre accesible coincide con `/^Ver como Encargado/` (sin los dos puntos, para que el texto visible «Ver como Encargado» del lateral sea parte del nombre: 2.5.3), a 1280 y a 360 px, que
  **abre el diálogo «Ver como» en un clic** (sin menú intermedio). El diálogo se llama «Ver como», tiene radios cuyo
  nombre empieza con «Conductor» y con el nombre del conductor, y un botón «Aplicar». **Ningún nombre accesible nuevo
  empieza con «Ver como».**
- **«Cómo funciona»** es un botón visible en el marco a 1280 px.
- En la navegación, los enlaces «Más», «Vencimientos» y «Movilidades» conservan esos nombres.
- La región `role="status"` de «Cargando la pantalla…» contiene un `progress`. La de arranque contiene el texto
  «Preparando la flota de ejemplo…» y su `progress`. El botón de los errores se llama «Recargar la página».
- La región `role="status"` de los avisos globales existe siempre.

**Clases que usa el código**

| Clase o selector | Quién lo usa |
| --- | --- |
| `.patente` (y `main h1 .patente`) | El viaje de la patente entre pantallas. |
| `.barra-envio` (y su `button`) | El foco del parte. |
| `.pie` dentro del diálogo | El foco inicial del diálogo. |
| `dialogo-abierto` en `<html>` | El bloqueo del desplazamiento del fondo. |
| `con-transicion` en `<html>` y `entra` en `main` | La transición entre pantallas. |
| `svg.sprite` | El sprite de íconos. |
| `.boton`, `.enlace-accion` | Estilos de contexto de otras piezas. |
| `.icono`, `.forma`, `.panel`, `.aviso`, `.etiqueta`, `.dato`, `.enlace-patente` | Otros componentes las alcanzan con `:global(…)` para acomodar la pieza en su contexto. Si una cambia de nombre, hay que cambiar a quien la usa en el mismo cambio. |
| `.menu` (de `MenuMas`), `.item` (de `ItemRevision`), `.panel .controles`, `.barra .meta` (de `Panel`), `.fecha-parte` y `.apilado` (celdas de la tabla) | Igual que la fila anterior: también se alcanzan con `:global(…)`. |

**Atributos `data-*` que lee el JavaScript:** `data-foco-inicial`, `data-foco-cancelar`, `data-foco-lista`,
`data-seguir-editando`, `data-resumen-parte`, y en la regla de vencimientos `data-punto`, `data-rotulo` y `data-fila`.
También el atributo **`enterkeyhint`** de los campos del parte (el formulario lo lee para decidir qué hace Enter:
pasar al control siguiente o llevar el foco al botón de envío), `dialog[open]` (frena la transición entre pantallas),
`[aria-current="page"]` en los filtros de enlace y `button[aria-controls]` en «Más acciones». Los `data-*` de
presentación que ya existen (`data-tono`, `data-variante`, `data-col`, `data-tamano`, `data-forma`, `data-lleno`,
`data-resp`, `data-critico`, `data-etiqueta`, `data-sin-valor`, `data-tramo`, `data-borde`, `data-grande`) conservan
nombre y valores.

**Nombres accesibles que usan las pruebas:** botón «Poner fuera de servicio»; diálogo «Poner fuera de servicio:
{patente}»; campo «Motivo»; enlace «Empezar la revisión»; campo «Al iniciar»; botones «Descartar borrador» y
«Confirmar descarte»; los textos de estado «{patente} está fuera de servicio.» y «Borrador guardado en este equipo.»;
el texto «Fuera de servicio».

**Nombres de los trozos que interceptan las pruebas:** `assets/PantallaMas-*.js`, `assets/PantallaVencimientos-*.js`
y `assets/generador-*.js`. Salen del nombre del archivo de origen: `PantallaMas.svelte`, `PantallaVencimientos.svelte`
y `src/lib/datos/generador.ts` no se renombran, y cada uno sigue saliendo en un trozo propio.

**Lo que cada pantalla tiene que seguir cumpliendo:** sin errores ni avisos de consola; sin violaciones de la CSP;
sin pedidos a otros orígenes; axe sin hallazgos a 1280 y a 360 px; sin desborde horizontal a 360 px; **29 pedidos (hoy 31, ver más abajo) como
máximo** en la primera visita y ninguna fuente nueva. Es el número de antes de la etapa 2: al partir el trozo del
conductor la primera visita hizo 30 pedidos (decisión DE6 de Matías, 28/11/2026: aceptar 30) y con `public/arranque.js`,
que pone el tema guardado antes del primer pintado (T16), hace 31; la prueba de la primera visita acepta 31.

**Textos:** ningún texto existente cambia. En particular, los dos textos del recorrido («Probar como conductor» y su
frase) quedan iguales aunque cambien de lugar.

**Reparto:** el maquetador toca solo `<style>` y marcado de presentación; el programador, solo `<script>`, `.ts` y
pruebas. Un contrato que haga falta cambiar se pide antes, no se cambia al vestir.

---

### 15.12 Lo que NO hay que hacer

Además de la sección 10, que sigue vigente salvo en lo que 15.1.1 resuelve:

- Un segundo campo pleno grande en la misma pantalla, o el pleno para decir un estado.
- Tarjetas de indicador iguales en fila; donas; medidores; cifra grande con etiqueta chica y línea de color, repetida.
- Más de una cifra monumental por pantalla, o una cifra monumental en la letra de texto.
- Un primer cuadro en blanco, o una cifra que arranca en un número que no es dato (ni un cero inventado).
- Una cifra que cuenta desde el total en la entrada: el cuadro 0 diría «23 /23» con cuatro llaves rojas a la vista.
- El título de la regla («Disponibles hoy») por debajo de 14 px en escritorio y de 13 px en el celular.
- Repartir el ancho de la barra inferior según el largo de los nombres, abreviar un nombre o bajarlo de 12 px.
- Un botón primario de noche con borde y sombra del color de su relleno (se lee como un campo vacío).
- Mover las llaves que salen. Mover dos piezas a la vez. Animar el título, los paneles o las listas en la entrada.
- Texto sobre la trama; texto de menos de 12 px; monoespaciado en peso 700.
- Cifras, fracciones, fechas o patentes escritas en una hoja de estilos o en un componente.
- Un oscuro genérico: el plano nocturno es el cianotipo (papel de Prusia, cuadrícula, campo crema con cifra cobalto).
- Objetos que se oscurecen de noche (chapa, llave, rótulo de cota).
- `.objeto` en el enlace o el botón que recibe el foco; un token que no está en la lista de 15.3.2 dentro de un
  objeto; texto en `--obj-tinta-3` o en un color de tono sobre `--obj-papel-2`.
- El anillo `--c-sobre-pleno` por fuera de una pieza, o `--c-foco-oscuro` sobre un fondo claro (el pleno de noche, un
  control apretado del lateral).
- Un `tabindex="0"` en una llave oculta; ocultar llaves de una lista con parada itinerante.
- Leyendas de país, escudos o banderas en la chapa. Imitar la placa oficial.
- Radios grandes, píldoras, sombras difusas en fichas, vidrio esmerilado (salvo la barra de escritorio), degradados de
  color, brillos.
- Marcas de plano que no dicen nada: cotas sin medida, globos sin número que remita a algo, escalas sin lectura.
- Ámbar en una llave, o rojo en «Cerrar antes» (es una tarea).
- Contar una cifra desde cero cuando cambia un dato (giran solo los dígitos que cambian), o rearmar la regla para
  mostrar un cambio.
- `prefers-color-scheme`, `rgb()` o hexadecimales sueltos en un componente; atributo `style`; `light-dark()` dentro de
  `.objeto` esperando que se resuelva en claro.
- Desenfoque de fondo por debajo de 64 rem; `background-attachment: fixed`; texturas detrás de texto de lectura.
- Un destino del menú que todavía no existe, o un botón que no hace nada.
- Un nombre accesible nuevo que empiece con «Ver como».
- Dibujar a medias algo de las etapas 3 a 9 del rediseño (registrador, lecturas como instrumentos, cajón, buscador,
  densidad, regla de tres casillas).
- Presentar la demo como copia de un sistema existente o nombrar empresas, personas o proyectos reales.

---

### 15.13 Íconos nuevos para el sprite

Mismo estilo que los actuales: `viewBox` de 24, trazo de 1,75 px con `currentColor` (o relleno, en los del menú), sin
color propio. Se agregan a `ICONOS` y al sprite de `index.html`.

| Nombre | Dibujo | Dónde |
| --- | --- | --- |
| `marca` (se **redibuja**; mismo nombre) | Un calibre: regla horizontal con mordaza fija y mordaza móvil. | Lateral, barra superior, favicon. |
| `tema-claro` | Círculo con ocho rayos cortos. | Control «Apariencia». |
| `tema-oscuro` | Media luna. | Control «Apariencia». |
| `tema-auto` | Círculo partido en vertical, una mitad llena. | Control «Apariencia». |
| `quieto` | Dos barras verticales (pausa) dentro de un cuadrado. | «Sin animaciones». |
| `rombo-alerta` | Rombo con signo de admiración. | Veredicto «No sale». |
| `circulo-check` | Círculo con marca de verificación. | Veredicto «Sale». |

Las formas de estado (rombo, triángulo, círculo, aro, cuadrado), los globos, los ganchos y las marcas de la escala
**no son íconos**: se dibujan con CSS. El favicon es `marca` en cobalto sobre papel; `theme-color` es `#F1ECE1` de día
y `#0A2550` de noche.

---

### 15.14 Textos (para `redactor-ux`)

Regla: español neutro, sin voseo, al lector de usted o en forma impersonal. **No cambia ningún texto existente.**
La columna «Texto final» es la que se implementa. Donde «Origen» nombra una función o una constante, el texto sale
de ahí y no se escribe de nuevo; donde dice **nuevo**, la cadena se agrega tal cual (los archivos `.ts` los toca el
programador, no esta tabla). `{P}` es la patente con formato; `{n}`, `{d}` y `{a}`, números.

| # | Dónde | Texto final | Origen | Notas |
| --- | --- | --- | --- | --- |
| 1 | Regla: título (`h2`) | Disponibles hoy | **Nuevo.** | 15 caracteres. Con el título de 14 px el tope es **15** (el corte de la mordaza angosta de 15.6.2 está calculado para eso): un texto más largo obliga a subir ese corte. Es rótulo y destino del foco. |
| 2 | Regla: párrafo para lectores, con no disponibles | Disponibles hoy: 19 de 23 unidades activas. 4 unidades no disponibles hoy: 2 bloqueadas por documentos · 2 fuera de servicio. | `textoDisponibles(d, a)`, un espacio, `textoProtagonista(n)`, «: », `textoDesgloseNoDisponibles(b, f)` y punto. | Solo el «: » y el punto son nuevos. Valor final desde el primer cuadro. |
| 2b | Regla: párrafo para lectores, sin no disponibles | Disponibles hoy: 23 de 23 unidades activas. Ninguna unidad bloqueada ni fuera de servicio. | `textoDisponibles(d, a)`, un espacio, `TEXTO_INICIO.sinNoDisponibles` y punto. | Con la flota vacía no se usa esta frase («0 de 0»): va la fila 21. |
| 3 | Regla: cota de la zona roja (tablero completo) | 2 bloqueadas por documentos · 2 fuera de servicio | `textoDesgloseNoDisponibles(b, f)`. | T17: antes era «4 unidades» (`salida.cota`, que ya no se muestra); el número está en el sello. |
| 4 | Sello de la zona roja: nombre visible | No disponibles hoy | `TEXTO_CENTRO.protagonista`. | T17: el desglose salió del sello (va en la cota o en el rótulo del tablero corto). El nombre accesible sigue llevando el desglose (fila 5). |
| 5 | Sello de la zona roja: nombre accesible del enlace (`aria-label`) | 4 no disponibles hoy: ver en Movilidades · 1 no disponible hoy: ver en Movilidades | `TEXTO_NAVEGACION.insignias.noDisponibles(n)` y, **nuevo**, «: ver en Movilidades». | **Desvío de la propuesta**, ver «Decisiones» más abajo. El desglose va como descripción (`aria-describedby`), no en el nombre. |
| 6 | Tablero completo: nombre de la lista | Unidades activas | **Nuevo.** | No empieza con «Ver como». Sin la palabra «llaves»: quien no ve el dibujo recibe una lista de unidades. |
| 6b | Tablero corto: nombre de la lista | No disponibles hoy | `TEXTO_CENTRO.protagonista` (por `aria-labelledby` al rótulo de la fila). | La lista corta solo trae las que no salen. |
| 7 | Llave disponible: nombre accesible | ZT 301 KA, disponible. Ver ficha. | `{P}`, coma, `TEXTO_FLOTA.estado["puede-salir"]` en minúscula, punto, `TEXTO_ALERTAS.verFicha` y punto. | Patente primero: es lo que se ve en la llave. |
| 8 | Llave no disponible: nombre accesible | ZK 214 BD, bloqueada. Seguro vencido hace 1 día. Número 1. Ver ficha. | `{P}`, la etiqueta de estado en minúscula, el motivo de la lista (`motivo`, que no trae punto), **nuevo** «Número {n}.» y `TEXTO_ALERTAS.verFicha`. | Patente primero. El número es el del globo. «Número» y no «Pieza»: ver «Decisiones». |
| 8b | Chapa del tablero corto: nombre accesible | ZK 214 BD, bloqueada. Seguro vencido hace 1 día. Ver ficha. | Como la fila 8, sin el número. | El tablero corto no tiene globos. |
| 9 | Tablero completo: ayuda de teclado (a la vista en el rótulo de cota y, una vez, para lectores) | Use las flechas para recorrer las unidades. | **Nuevo.** | 43 caracteres (tope: unos 60). La misma frase en los dos lugares. No va en el tablero corto. |
| 10 | Tablero corto: enlace «y N más», visible | y 3 más | `TEXTO_ALERTAS.yMas(n)`. | — |
| 11 | Tablero corto: enlace «y N más», resto del nombre accesible (solo lectores) | no disponibles hoy: ver en Movilidades | `TEXTO_ALERTAS.yMas(n)` y, **nuevo**, « no disponibles hoy: ver en Movilidades». | Se lee «y 3 más no disponibles hoy: ver en Movilidades». Siempre en plural: el enlace aparece con más de ocho, así que `{n}` vale 2 o más. |
| 12 | Renglones de lectura: nombre de la lista | Resumen de hoy | **Nuevo.** | Sin metáfora («lecturas» no dice qué hay). |
| 13 | Renglones de lectura: cada renglón | 3 Vencidos o faltantes · 9 Vencen en 30 días · 3 Partes pendientes · 1 Novedad crítica | Cifra y rótulo de `TEXTO_INICIO` (`cifraVencidos`, `cifraProximos`, `cifraPartes`, `cifraNovedadCritica(n)`). | Sin cambios. |
| 14 | Acción del día: rótulo | Acción del día | **Nuevo.** | 14 caracteres (tope: 16). |
| 15 | Acción del día: frase | ZK 214 BD no puede salir: Seguro vencido hace 1 día. | `textoUnidadNoPuedeSalir(P, motivos, false).titular`. | Sin cambios. |
| 16 | Acción del día: botón de la acción | Renovar · Cargar | `etiqueta` y `nombreAccesible` de la acción de documento («Renovar seguro de ZK 214 BD»). | Sin cambios. |
| 17 | Acción del día: segundo botón y su descripción | Probar como conductor · Pruebe la demo: vea cómo un seguro vencido impide cargar el parte. | `TEXTO_INICIO.recorrido.boton` y `TEXTO_INICIO.recorrido.texto`. | **No cambian** (los fijan las pruebas). La frase pasa a ser la descripción del botón y se ve en todos los anchos, debajo de él (15.7). |
| 18 | Acción del día, sin acción de documento | Ver ficha (para lectores: «Ver ficha de ZK 214 BD») | `TEXTO_ALERTAS.verFicha` y `TEXTO_ALERTAS.verFichaDe(P)`. | Sin cambios. |
| 19 | Acción del día, en orden | Todas las unidades activas están disponibles hoy. | `textoProtagonistaLector(0)`. | Con punto final, como las demás frases de la nota. |
| 20 | Anuncio al resolver (`role="status"`, también a la vista en la nota) | Seguro de ZK 214 BD renovado. Disponibles hoy: 20 de 23 unidades activas. | El mensaje que ya da el diálogo (`textoDocumentoRenovado`, `textoDocumentoCargado`), un espacio y `textoDisponibles(d, a)`. | Ninguna cadena nueva. Dice la medida aunque no haya cambiado (la unidad puede seguir bloqueada por otro documento): así nunca afirma de más. |
| 21 | Regla, flota vacía: mensaje | No hay unidades activas. | **Nuevo.** | No se reutiliza «Todavía no hay unidades.»: con todas las unidades de baja sería falso. |
| 21b | Regla, flota vacía: ayuda y enlace | Aquí se verá cuántas pueden salir hoy. · Agregar una unidad en Movilidades | **Nuevos.** | La ayuda dice qué va ahí; el enlace, cómo empezar. Si el peso aprieta, la ayuda es lo primero que se saca. |
| 22 | Sello de la barra: texto visible | Datos ficticios | **Nuevo.** | 15 caracteres (tope: 15). Las mayúsculas las pone la hoja de estilos. Oculto a lectores. |
| 23 | Sello de la barra: texto para lectores | Demo con datos ficticios | `TEXTO_MARCO.etiquetaDemo`. | Sin cambios. |
| 24 | Código de lámina | (sin texto para lectores) | — | **Decisión:** el código («FL-01») va con `aria-hidden="true"`. No agrega nada a lo que ya dice el `h1`. |
| 25 | Lateral: rótulos de sección | Flota · Operación | **Nuevos.** | Una palabra cada uno; son presentación (`aria-hidden`). Decisión DE2 de Matías (28/11/2026): «Operación», y no «Jornada» como proponía esta fila. |
| 26 | Apariencia: título del grupo | Apariencia | **Nuevo.** | No empieza con «Ver como». |
| 27 | Apariencia: leyenda y opciones del tema | Tema · Claro · Oscuro · Automático | **Nuevos.** | Si al medir «Automático» no entra en el lateral, ahí se muestra «Auto» y el nombre accesible sigue siendo «Automático» (lo contiene). En «Más», siempre la palabra entera. |
| 28 | Apariencia: nota del tema (solo en «Más») | Automático: sigue el tema del dispositivo. | **Nuevo.** | En el lateral no se muestra. |
| 29 | Apariencia: botón de movimiento | Sin animaciones | **Nuevo.** | Botón con `aria-pressed`: el texto no cambia al apretarlo. |
| 30 | Veredicto, sale (sin parte, borrador) | Puede salir | **Nuevo.** | 11 caracteres (tope: 14). |
| 31 | Veredicto, en uso | En uso | `TEXTO_ESTADO_PARTE_EN_USO`. | La hora va aparte, en la etiqueta («En uso desde las 06:52»). DE3 (28/11/2026): no es un veredicto nuevo, el pie lleva esta etiqueta. |
| 32 | Veredicto, cerrado | Parte cerrado | **Nuevo.** | 13 caracteres (tope: 14). DE3 (28/11/2026): el pie lleva la etiqueta de estado que ya existe, sin texto nuevo. |
| 33 | Veredicto, no sale (unidad) | No puede salir hoy | **Nuevo.** | Vale para los tres casos de unidad: bloqueada por documentos, fuera de servicio y cerrado sin salida. |
| 34 | Veredicto, no sale (licencia) | Sin licencia vigente | **Nuevo.** | Habla del conductor. **Desvío de la propuesta**, ver «Decisiones». |
| 35 | Veredicto, tarea («Cerrar antes») | Cierre pendiente | **Nuevo.** | 16 caracteres (tope: 16). No es un bloqueo. DE3 (28/11/2026): es el único veredicto nuevo además de los de «sale» y «no sale». |
| 36 | Cuadro cero | Preparando la flota de ejemplo… | `TEXTO_AVISO.preparando`. | **No cambia** (lo fijan las pruebas). |
| 37 | Estados vacíos de las pantallas | Los actuales | `TEXTO_INICIO.noDisponiblesVacio`, `TEXTO_VACIO_PANTALLAS`, `TEXTO_CENTRO` y `TEXTO_FLOTA.sinUnidades`. | No cambian; solo cambia la pieza que los muestra. |
| 38 | `og:image:alt` (imagen nueva de Inicio) | Inicio de la demo Control de flota: cuántas unidades pueden salir hoy, cuáles no y por qué. | **Nuevo.** | Sin cifras. Se confirma contra la imagen final: si la captura no muestra los motivos, se quita «y por qué». |

**Decisiones de redacción que se apartan de la propuesta de partida.**

- **Fila 5, nombre del sello.** «Ver las N no disponibles en Movilidades» hoy solo aparece con más de seis unidades;
  en el sello aparecería también con una, y diría «Ver las 1 no disponibles». Además, lo que se ve en el sello es
  «4 · No disponibles hoy» y ese nombre no lo contiene (WCAG 2.5.3). El nombre final empieza con lo que se ve,
  resuelve el singular y termina igual que la fila 11. El enlace del panel «No disponibles hoy» conserva su texto.
- **Filas 6, 9 y 12, sin metáforas en los nombres accesibles.** «Llaves» y «lecturas» son del dibujo. La lista es de
  unidades y la ayuda de teclado se lee igual de bien mirando las llaves que escuchándola.
- **Fila 8, «Número» en lugar de «Pieza».** «Pieza» no aparece en ningún texto visible y, en una flota, se entiende
  como repuesto. El número no remite a la lista «No disponibles hoy» porque esa lista muestra seis como máximo.
- **Fila 25, «Operación» y no «Jornada».** La propuesta era «Jornada» para no repetir la palabra en dos renglones seguidos
  («Operación» y, debajo, «Operación diaria»). Matías eligió «Operación» (DE2, 28/11/2026) y el lateral la repite.
- **Fila 34, «Sin licencia vigente» en lugar de «No puede manejar hoy».** El aviso que sigue al veredicto ya empieza
  con «No puede manejar hoy: …» y no puede cambiar: las mismas cuatro palabras se leerían dos veces seguidas. El
  veredicto dice la causa y el aviso, la consecuencia. Vale para los tres motivos (falta, vencida y válida desde otra
  fecha).

**Comprobado sobre esta tabla (27/11/2026).** Ningún nombre accesible nuevo empieza con «Ver como». Los textos nuevos
no usan voseo y respetan el vocabulario único («No disponibles hoy», «Disponible», «Bloqueada», «Fuera de
servicio»): los estados de las filas 7, 8 y 8b salen de `TEXTO_FLOTA.estado`, no se escriben. Las cuentas de
caracteres son de las cadenas de esta tabla; que entren en su caja se mide sobre lo maquetado (15.15).

---

### 15.15 Lista de control de esta sección

| Qué | Dónde está |
| --- | --- |
| Las 9 pantallas | 15.9.1 a 15.9.9 (Inicio, Movilidades, Vencimientos, Operación diaria, Ficha, Parte, Hoy, Mis partes, Más). |
| Los 15 diálogos | 15.5.11, tabla. |
| Cada fila de la tabla de estados de la sección 8, más la de la regla y la del marco | 15.9.10. |
| Componentes base con sus estados | 15.5.1 a 15.5.12. |
| Marco: corte único, barra a 360 px, lámina con enlace al padre, «Apariencia», cuadro cero y error de arranque | 15.4. |
| Regla de salida: mordaza con renglones, lista de piezas, convivencia con el horizonte, celular, límites | 15.6. |
| «Acción del día» con su segundo botón y la escena mínima, con foco y anuncio | 15.7. |
| Hoy: veredicto, llave y variante bloqueada | 15.8. |
| Coreografía con tiempos y estado final accesible | 15.10. |
| Tokens, pares de contraste y correspondencia `--c-*` | 15.3. |
| Contratos | 15.11. |
| Reglas de producción y lo que no hay que hacer | 15.2 y 15.12. |
| Íconos y textos | 15.13 y 15.14. |
| Lo que se volcó de la revisión del boceto y de la auditoría, y las siete decisiones de Matías | 15.16. |

**Los tres pedidos de la revisión de diseño, y dónde quedan resueltos:** patentes en horizontal en el celular (tablero
corto, 15.6.3); «Acción del día» de 40 px de alto y entera en la primera pantalla del celular (15.7); llaves colgadas
desde el primer cuadro, donde solo se mueven las que no salen (15.10).

**Qué falta medir sobre lo maquetado** (no se puede afirmar desde esta especificación): los tamaños reales de los
objetivos; el contraste en imagen del texto sobre el pleno y de los píxeles de grano; que la «Acción del día», **ahora
con la frase de «Probar como conductor» a la vista**, entre en 390 × 844 y 360 × 800 con los textos finales (15.7); el
salto de diseño entre el cuadro cero y la regla; que el título de 14 px («Disponibles hoy») no pise la cifra ni el canto
con la mordaza angosta (15.6.2); que «Vencimientos» entre en su columna a 360 y a 320 px y que todo lo pulsable del
marco mida 44 px o más (15.4.4); el contraste, sobre lo maquetado, del borde del primario de noche (15.5.1); la
condición de teclado del tablero al cambiar de forma (15.6.3); el texto al 200 % en la barra inferior; y el
comportamiento en motores que no sean Chromium. **Ya medido en el boceto:** el sello fuera de la zona roja con una
sola no disponible, a 360 y a 1280 px (15.6.7).

**Revisión de accesibilidad de esta especificación (27/11/2026).** Se midió antes de construir y cambió esto:

| Qué | Dónde |
| --- | --- |
| El anillo de foco se elige por dónde se dibuja (por fuera o por dentro). Destino actual del menú: `--c-sobre-pleno` por dentro. Botón pleno: anillo general, por fuera. | 15.5, 15.4.2, 15.4.4, 15.4.5, 15.5.1 |
| Lista cerrada de lo que `.objeto` vuelve a declarar (con filetes, alias, pleno y fondos de tono); `.objeto` nunca en el elemento que recibe el foco; tokens `--obj-contorno`, `--obj-sobre-franja`, `--obj-pleno-suave`, `--obj-crit-fondo` y `--obj-ok-fondo`. | 15.3.2 |
| Llave y chapa críticas, y llave disponible con el cursor encima: contorno `--obj-contorno`. | 15.6.3, 15.3.3 |
| Tablero corto como lista aparte, con una parada de Tab por chapa; ayuda de las flechas a la vista. | 15.6.3, 15.6.8, 15.14 |
| Canto de la mordaza en `--c-sobre-pleno`; el cursor se dibuja fuera de la caja. | 15.6.1 |
| Sello cuando la zona roja es más angosta que él; tablero sin relleno lateral. | 15.6.1, 15.6.3, 15.6.7 |
| 22 pares más en la tabla de contraste; número del globo en 12 px; texto prohibido sobre `--obj-papel-2`. | 15.3.3, 15.3.2, 15.6.3 |
| Contratos que faltaban: títulos por posición, `enterkeyhint`, clases alcanzadas con `:global`, nombres de trozo. | 15.11 |

---

### 15.16 Revisión del boceto y de la auditoría: qué se volcó y qué se decidió (27 y 28/11/2026)

Junta lo que quedó de dos revisiones: la auditoría de accesibilidad de esta especificación (T1) y la revisión de diseño
del boceto estático de Inicio y Hoy (T2, veredicto «apto con menores»). Tiene dos partes: lo que **ya está volcado** en
el cuerpo de la sección y las siete decisiones que Matías contestó el 28/11/2026 (15.16.3), ya volcadas también.

#### 15.16.1 Los cinco pedidos de la revisión del boceto, ya volcados

| # | Pedido | Qué se decidió | Dónde |
| --- | --- | --- | --- |
| 1 | El cuadro 0 de la entrada decía «23 /23» con cuatro llaves rojas a la vista: un dato falso bajo el título «Disponibles hoy». | La cifra marca el **valor final desde el cuadro 0** y no cuenta. El gesto queda en la tapa que descubre la zona roja y el cursor que viaja a la lectura; el recuadro de la lectura y la cota aparecen con un fundido al final del mismo gesto (540–660 ms), sin abrir un gesto nuevo. `--desde` pasa a valer lo mismo que `--d` en la entrada. **Descartada:** conservar la cuenta con la caja sin cifra mientras dura la pausa: agregaba un estado nuevo (cifra ausente) y un salto de diseño al soltarse la pausa. | 15.10, 15.6.8, 15.12 |
| 2 | El título «Disponibles hoy» (único epígrafe de la cifra) medía 12 px en `--c-sobre-pleno-2`. | 14 px desde 37,5 rem de regla y 13 px en el celular, peso 600, `--c-sobre-pleno` (7,81:1 y 6,63:1), en placa lisa. El corte de la mordaza angosta sube de 9 a 10,25 rem (9,75 en el celular), porque el título ocupa más (cuenta, a confirmar). El tope del texto pasa a 15 caracteres. | 15.6.1, 15.6.2, 15.14 fila 1 |
| 3 | En el celular la frase de «Probar como conductor» quedaba solo como descripción: el botón no decía para qué sirve. | Visible en todos los anchos: 13 px, hasta dos renglones, debajo del propio botón y alineada con su borde izquierdo (también a 56 rem o más, donde parecía describir a «Renovar»). La holgura de la primera pantalla baja de 145,1 y 101,1 px a unos 107 y 63 px (cuenta; se vuelve a medir). | 15.7, 15.14 fila 17 |
| 4 | Barra inferior: con columnas repartidas por el largo del nombre, «Más» medía 43,4 px a 360 y 35,4 a 320 (menos de 44). | Columnas iguales (72 px a 360, 64 a 320), nombres en cartel angosto, 12 px, peso 600. Medido con la fuente real: «Vencimientos» 62,6 px. Sin abreviar ni bajar de 12 px; piso de 44 px en el control de medidas. | 15.4.4, 15.12 |
| 5 | De noche, el primario («Empezar la revisión» en Hoy) se leía como un campo vacío. | Token nuevo `--c-tinta-borde` (`#6F8FB8` de noche; la tinta de día): borde y sombra dura distintos del relleno. Tres pares nuevos en 15.3.3 (4,52, 4,32 y 3,55:1). **Descartada:** darle el aspecto pleno. | 15.3.1, 15.3.3, 15.5.1, 15.12 |

El conjunto de 15.3.3 pasa a **124 pares y 231 mediciones, 0 fallan, 12 justas**. Los valores de `--c-tinta-borde` los
calculé con la fórmula de luminancia de WCAG 2.x y el ancho de los textos lo medí con las tres fuentes alojadas; el
control `scripts/contraste.mjs` todavía tiene que reproducirlos (T5 y T6).

#### 15.16.2 Lo que quedó abierto de la auditoría de accesibilidad (T1)

| Qué | Estado |
| --- | --- |
| Referencias con marca en 15.2 y en la línea 97 (repositorio público). | **Cerrado.** DE1 (15.16.3): descritas sin marca. |
| Segunda pasada del auditor sobre la sección corregida. | **Pendiente de proceso.** No volvió a pasar después de las correcciones de la auditoría ni después de estos cambios. Le toca: los 25 pares agregados desde la primera versión (22 de la auditoría y 3 de este cambio), los cinco `--obj-*` nuevos, el título de 14 px con la mordaza angosta, los nombres de la barra inferior y la regla del anillo por fuera o por dentro. |
| Sello fuera de la zona roja con una sola no disponible: el anclaje era una decisión de T1 «a medir en el boceto». | **Cerrado.** Medido por T2 a 360 y 1280 px: 44 × 44, dentro de la caja, sin pisar título, cifra ni renglones; quedan 10 px libres a 1280 px (15.6.7). |
| Largo de la ayuda de las flechas («unos 60 caracteres»). | **Cerrado.** La frase final tiene 43 caracteres (15.14, fila 9). Se confirma sobre lo maquetado. |
| `scripts/contraste.mjs` tiene que reproducir los 124 pares y los tokens nuevos (`--obj-*` y `--c-tinta-borde`). | **Pendiente de código** (T5 y T6). |

#### 15.16.3 Decisiones de Matías (28/11/2026)

Las siete decisiones que esta sección dejaba abiertas las contestó Matías el 28/11/2026 (están al final de `docs/36` del
repositorio de trabajo). Todas están volcadas en el cuerpo de la sección, salvo DE5.

| # | Tema | Decisión | Dónde quedó |
| --- | --- | --- | --- |
| DE1 | Referencias con marca en un repositorio público. | Describirlas sin marca. | Sección 1 y 15.2. |
| DE2 | Segundo rótulo del lateral. | «Operación». | 15.4.1, 15.4.2 y 15.14, fila 25. |
| DE3 | Veredictos de Hoy. | Solo donde hay algo que decidir: «En uso» y el parte cerrado llevan en el pie la etiqueta de estado que ya existe. | 15.8 y 15.14, filas 31, 32 y 35. |
| DE4 | «Quincena». | Tinta, sin azul (círculo lleno; «mes» es el aro). | 15.1.1 y 15.3.1. |
| DE5 | `public/404.html`. | Agregarla, midiendo antes `responseStatus` y `contentType` en Firefox y WebKit. | **Sin hacer todavía** (no estaba entre los hallazgos de T15). |
| DE6 | Pedidos de la primera visita. | Aceptar 30. | 15.11. Con `public/arranque.js` (T16) son 31. |
| DE7 | Recortes 1 y 2 del presupuesto de peso. | Los dos: odómetro fijo y «Apariencia» solo en «Más». | 15.4.5 y 15.10. |
#### 15.16.4 Menores de la revisión del boceto que todavía no se volcaron

No frenan la construcción. Se resuelven antes de T9 (esqueleto) o de T11 (maquetación), según el caso. Los números son
los del informe del crítico de T2.

| # | Tema | Lo que propone el crítico |
| --- | --- | --- |
| 6 | Sello de la zona roja con desglose torcido y de 12 px (1440). | Número y nombre en todos los anchos; el desglose queda en la cabecera del panel, en el rótulo del tablero corto y como descripción del enlace. Toca 15.6.1 y 15.14, fila 4. |
| 7 | Placa lisa de los renglones de lectura dentro de la mordaza. | Filete de 1 px en `--c-sobre-pleno-2` y encabezado visible «Resumen de hoy» (15.14, fila 12). |
| 8 | Celular: la fecha se repite y el nombre del producto no aparece en la primera pantalla. | Renglón de lámina «FL-01 · CONTROL DE FLOTA» sin fecha, por debajo de 64 rem. |
| 9 | Tablero corto: riel de 23 ganchos vacíos y rótulo de fila con viuda. | Sacar el riel (la escala lleva una marca por unidad); nombre y desglose en renglones separados o `text-wrap: balance`. |
| 10 | De noche, texto de 12 y 13 px directo sobre la cuadrícula de la página (regla 8 de 15.2). | O la regla 8 exceptúa la cuadrícula de página, con el par medido en el peor punto, o el rótulo de la fila va en placa lisa. |
| 11 | Operación diaria: precinto ámbar en renglones que no son críticos. | Precinto solo en el renglón crítico; los demás, filete liso de 2 px en el color de su tono, o nada. |
| 12 | El anillo de foco de la llave vecina al cursor tapa el recuadro de la lectura; la cota con una sola no disponible queda apretada. | El recuadro va por encima del anillo, o el anillo baja a 2 px en esa llave; la cota se dibuja solo si su rótulo entra entre los topes. |
| 13 | Desvíos del maquetador por escribir. | En 15.8: por debajo de 23,75 rem, marca del veredicto de 36 px, separación de 8 px y «Puede salir» nunca en dos renglones. Un solo token para «elegido» en el segmentado del lateral. La barra de escritorio de Inicio muestra solo «FL-01»: observación, sin cambio. |

Aparte: el maquetador dejó 2 px de margen lateral en la escala y el tablero, contra el «sin relleno lateral» de 15.6.3.
La holgura de 24 px (12 por lado) lo admite, pero hay que escribirlo o revertirlo antes de T9.

### 15.17 Decisiones del programador en la T9 (28/11/2026): el esqueleto de la regla de salida

Lo que el esqueleto (`ReglaDeSalida`, `Llave`, `Odometro`, `Apariencia`, encabezado de lámina, cuadro cero) decidió donde 15.6 a 15.14 no dicen o se apartan. El maquetador (T10, T11, T13) parte de acá.

| # | Decisión | Por qué |
| --- | --- | --- |
| 1 | **«Apariencia» vive solo en «Más»** (`PantallaMas.svelte` monta `Apariencia.svelte`). El plan decía «enganchado en Lateral y MenuMas»: `MenuMas` es el menú «Más acciones» de la ficha, no la pantalla. | DE7 (los dos recortes). Se tocó `PantallaMas.svelte`, que no estaba en la lista de la T9. |
| 2 | **El odómetro es la cifra fija con estilo de tambor** (DE7): un `.tambor` por dígito dentro de `.odometro` (`aria-hidden`), sin ceros de relleno, sin `--d` ni `--desde`. Al resolver, los dígitos cambian de una vez. | Recorte 1 del presupuesto de peso. Reemplaza la fila «Tambor» de 15.6.8. |
| 3 | **El nombre accesible del sello incluye el desglose**: «4 no disponibles hoy: 2 bloqueadas por documentos · 2 fuera de servicio: ver en Movilidades». Ya no hay `aria-describedby`. | axe (`label-content-name-mismatch`, grave) y WCAG 2.5.3: el desglose se ve dentro del sello y tiene que ser parte del nombre. Cambia la fila 5 de 15.14. |
| 4 | **No hay `data-lado` en el rótulo de cota.** La hoja de estilos alinea al borde con `clamp()` sobre `--x` (por ejemplo `clamp(0px, calc(var(--x) * 100% - 7.125rem), calc(100% - 14.25rem))`). | El código no conoce el ancho del rótulo ni el de la regla: medirlo sería código de más. Cambia la fila «Rótulo de cota» de 15.6.8. |
| 5 | **Escala:** cada número es `.escala-num` con `data-tipo="extremo"`, `"marca"` o `"lectura"` y `style:--x`; las marcas menores se apagan con `.escala-marcas[data-menores="no"]` (más de 60 activas). | Reemplaza las clases `.inicio`, `.medio`, `.fin` y `.lectura-num` del boceto. |
| 6 | **Dos copias de los renglones de lectura** (`.renglones[data-donde="dentro"]` y `"fuera"`) y **dos listas de unidades** (`ul.llaves` y `.corto > ul.colgadas`), como en el boceto. La hoja de estilos muestra una de cada par con `display: none`. | 15.6.3 y 15.6.4. El tablero corto no lleva globos ni parada única. |
| 7 | **Rótulo de cota:** un solo `.rotulo-cota.objeto` (`aria-hidden`), dentro de `.tablero`. Aparece con el puntero fino (mouse o lápiz; el toque no) y con el foco de las llaves, y se va al salir el puntero del tablero, al salir el foco o con Escape (sin mover el foco). Con el foco de teclado (`:focus-visible`) lleva `data-origen="teclado"` y `.rc-ayuda`. | 15.6.3 y WCAG 1.4.13. |
| 8 | **La región `role="status"` de la «Acción del día» existe en las tres variantes** (con acción, sin acción y en orden), siempre vacía hasta que hay algo que decir, y también cuando no hay botones. El mensaje es `textoAnuncioAlResolver` (el del diálogo y la medida nueva) y entra con el retraso de `textoAnunciado`. | Para que lo que se dice al resolver la última pieza se anuncie: la nota «en orden» no desaparece. |
| 9 | **Flota vacía:** `.caja-cero` con el `h2`, el mensaje, la ayuda y el enlace; no hay mordaza, cifra, escala ni llaves, pero los renglones de lectura «fuera» se muestran. | 15.6.7. |
| 10 | **Veredicto de Hoy** (`lib/estado/veredicto.ts`, `veredictoDelDia(estado, unidadBloqueada)`): con DE3 (solo donde hay algo que decidir). «Sin parte» y «Borrador» dicen «No puede salir hoy» si el aviso de aptitud (P9) está; «Cerrado» con `hastaManana` cuenta como sin salida. En «En uso» y «Cerrado» el pie lleva la etiqueta que ya existe, así que esa etiqueta se ve dos veces hasta que T13 saque la de abajo. | Una revisión automática marcó que «sale» contradecía al aviso. |
| 11 | **Encabezado de lámina** (`componentes/lamina.ts`): `codigoDeLamina(ruta)` y `padreDeLamina(padre)`. `Migas` ahora recibe `{ codigo, padre }`; `App.svelte` usa `padreDeLamina` también para «Atrás» (antes lo armaba aparte). El renglón de lámina del celular y el sello son de T10: el código ya está en `codigoDeLaLamina`. | 15.4.3. |
| 12 | **Cuadro cero del arranque:** `.cuadro-cero` con `.cuadro-cero-reserva`, `.cuadro-cero-caja` (dentro, el `role="status"` con el texto y el `progress` de siempre) y `.cuadro-cero-escala`. **Error de arranque:** el párrafo va dentro de `.ficha-error[data-tono="critico"]`. | 15.4.6. |
| 13 | **La entrada de cada vista se pide al montarla** (`entrada.empezar` + `onDestroy`) y «Reiniciar demo» llama a `entrada.reiniciar()` (en `App.svelte`, al reiniciar bien). Para repetir la coreografía sin desmontar, alcanza con que la hoja de estilos aplique las animaciones solo con `[data-entrada="completa"]` y ninguna con `fija`: el cambio de atributo las reinicia. | Aviso de la T7. |
| 14 | **La frase de la «Acción del día» (`textoUnidadNoPuedeSalir`) vive en `textos-base.ts`** y `textos-conductor.ts` la vuelve a exportar. | `salida.ts` lo importaba de `textos-conductor.ts` y arrastraba a la carga inicial todo el código de «Hoy» (+1.900 B) y rompía la prueba de la primera visita. Hay una prueba que lo vigila. |
| 15 | **`ReglaDeSalida.svelte` lleva un bloque `<style>` provisorio** (container `regla`, una de las dos listas según el ancho, objetivos de 24 px). Lo reemplaza T11. | Sin él las 24 pruebas de punta a punta originales fallaban en axe (objetivos menores de 24 px con las dos listas a la vista). |
| 16 | **`PantallaInicio.svelte`:** se borraron del `<style>` las reglas de lo que se fue (franja del recorrido y las cinco cifras). Cada fila de «No disponibles hoy» suma `.globo` con el número de pieza (con «Número N.» para lectores). | `svelte-check` marca como aviso el CSS sin uso. |
