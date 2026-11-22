# Plan de implementación — Control de flota (18/11/2026)

Pasos chicos, cada uno con su verificación. **TDD en toda la lógica**: primero el test que falla (con el identificador
de la regla en el nombre), después el código mínimo, después limpiar. Los identificadores (T, V, A, P, K, N, U, H, D)
son los de `docs/diseno.md`. Antes del paso 0: Matías decide S1 (stack) y S2 (`fake-indexeddb`); si no contesta, vale
la recomendación.

Regla de sala limpia durante todo el plan: **no se abren** repositorios, documentos ni material de terceros, ni se le pasan a
la IA. Fuentes permitidas: estos documentos, la ficha de la demo (en el portafolio) y el código propio de la Demo 1.

Agentes del portafolio sugeridos: `programador` (lógica, TDD), `maquetador` (presentación), `revisor-codigo`,
`qa-destructor`, `auditor-accesibilidad`, `disenador-ui` (revisión contra `diseno-ui.md`), `critico-reclutador`.

---

## Etapa 0 — Proyecto y verificaciones de riesgo

| Paso | Qué | Hecho cuando |
| --- | --- | --- |
| 0.1 | `package.json` con las dependencias de `stack.md` (versiones exactas), `tsconfig.json` estricto (mismas opciones que la Demo 1), `vite.config.ts` con Svelte y Vitest, `.gitignore`. Revisión de dependencias con `seguridad-aplicada`. | `npm ci` limpio; `npm audit` sin altas ni críticas (o excepción documentada). |
| 0.2 | **S3:** `svelte-check` con TypeScript 7.0.2. | `npm run check` corre sobre un componente con `<script lang="ts">` y detecta un error de tipo plantado. Si no anda, fijar la versión de TS que corresponda y anotarlo. |
| 0.3 | **CSP con Svelte:** `public/_headers` (de `stack.md`) y un componente de prueba que usa `style:grid-column-start`. | `npm run build` + servir `dist/` con las cabeceras: consola sin violaciones; la marca aparece en la columna correcta. Un `style="…"` plantado **sí** da violación (prueba de que la CSP está activa). Se borra el componente de prueba. |
| 0.4 | CI en GitHub Actions: `check`, `test` con matriz `TZ` (UTC, Asia/Tokyo, America/Los_Angeles), `build`, `audit`, búsquedas de la sección 7 de `stack.md`. | Un *push* de prueba pasa en verde en la rama (cuando exista el remoto). |
| 0.5 | Medición de tamaño de la compilación vacía. | Número anotado en el registro. |

## Etapa 1 — Dominio con TDD (sin interfaz)

Orden pensado para que cada paso use solo lo anterior.

| Paso | Módulo | Tests primero (reglas) | Hecho cuando |
| --- | --- | --- | --- |
| 1.1 | `dominio/fechas.ts` | T1 (borde 02:59:59.999Z / 03:00Z), T2 (matriz), T3 (2009 con UTC−2), T4 (bisiestos, días inválidos, formatos), T5 (cruces de mes y año), T6 (formato con hora de Argentina y día de la semana), T7. | Todos verdes en las tres zonas horarias. Ninguna llamada a métodos locales de `Date` (búsqueda). |
| 1.2 | `dominio/vencimientos.ts` — **clasificación** | V1–V8 (cada borde: d = −1, 0, 1, 7, 8, 15, 16, 30, 31), V7 (propiedad: −400..400 da una sola clasificación). | Verde. Es el corazón de la demo: se revisa con `revisor-codigo` antes de seguir. |
| 1.3 | `dominio/vencimientos.ts` — **vigente y requisitos** | V9–V17 con `REQUISITOS`. | Verde. |
| 1.4 | `dominio/patente.ts` | U1 (normalizar, formatear, rechazar). | Verde. |
| 1.5 | `dominio/kilometraje.ts` | K1–K4, K6–K9 (K5 en 1.9). | Verde. |
| 1.6 | `dominio/parte.ts` | P2, P3, P4 (faltantes en orden), P10, P11, P13; advertencias K6, K7 y P9. | Verde. |
| 1.7 | `dominio/aptitud.ts` | A1, A2, A8. | Verde. |
| 1.8 | `dominio/alertas.ts` | Sección 7 completa: cada tipo, gravedad, orden (V16, N5), exclusiones (V14, P6), resumen y puntos del horizonte. | Verde. |
| 1.9 | `dominio/comandos.ts` | Un bloque por comando de la sección 8: validaciones (A4–A7, N1–N3, P1, P7, P8, U2–U7, V10, V11, K5) y **eventos exactos** (H1). Invariante A3 comprobada después de cada comando. | Verde. `tsc` confirma que no hay forma de editar o borrar eventos (H2). |
| 1.10 | `dominio/textos.ts` | Los textos de error y de estado de las tablas, con singular/plural ("hace 1 día", "1 unidad"). | Verde; `redactor-ux` revisa la lista. |

## Etapa 2 — Datos de ejemplo y persistencia

| Paso | Qué | Tests primero | Hecho cuando |
| --- | --- | --- | --- |
| 2.1 | `datos/azar.ts` (mulberry32) | Secuencia conocida para la semilla 20261118 (los primeros 5 valores fijados en el test). | Verde. |
| 2.2 | `datos/generador.ts` | D1 (determinismo y corrimiento de fechas), D2 (C01–C20, uno por test), D3 (patentes con Z, CUIT válido, nombres de la lista). Coherencia: cantidad exacta de alertas por grupo y protagonista "4 unidades" con fechaBase 2026-11-18. | Verde. Tiempo de generación medido (< 100 ms en Node). |
| 2.3 | `persistencia/repositorio.ts` + `memoria.ts` | Suite de contrato: escribir cambios y eventos en una operación, índice único de partes (P1), falla inyectada sin cambios a medias (P12, D10). | Verde. |
| 2.4 | `persistencia/indexeddb.ts` | La misma suite de contrato con `fake-indexeddb` (S2). | Verde con las dos implementaciones. |
| 2.5 | `persistencia/arranque.ts` | D4, D5 (dos caminos), D6, D7, D8 (fábrica que lanza), D11. | Verde. |
| 2.6 | `persistencia/pestanas.ts` | D9 con un canal falso. | Verde. |

## Etapa 3 — Marco de la aplicación

| Paso | Qué | Hecho cuando |
| --- | --- | --- |
| 3.1 | Programador: `estado/reloj.ts` (único `new Date()`), `estado/enrutador.ts` (con tests: rutas válidas, inválidas, patente normalizada en la ruta), `estado/app.svelte.ts` (estado reactivo, perfil). | Tests verdes; cambiar el hash cambia la pantalla y mueve el foco al `h1`. |
| 3.2 | **Hecho (18/11/2026).** Maquetador: `tokens.css`, `base.css`, sprite de íconos, componentes `Patente`, `Etiqueta`, `Panel`, botones, campos (5.1, 5.4, 5.5, 5.7, 5.11), con una página de muestras **solo en desarrollo** (`/muestras.html`). | Claro y oscuro a 360 y 1280 px; contraste medido con `scripts/contraste.mjs` (`npm run contraste`: 158 mediciones, 0 fallan). |
| 3.3 | **Hecho (18/11/2026).** `App.svelte`: barra superior, barra de la aplicación, selector de perfil, menú "Más", avisos globales, pie, estados de arranque y de error (4.x, 5.2, 5.3, 5.18, 5.19). | Recorrido con teclado por el marco; avisos D5/D7/D8/D9 forzados a mano se ven y se anuncian. |
| 3.4 | **Hecho (18/11/2026).** Diálogo base (5.17), "Reiniciar demo" (barra, menú y aviso D5; la pantalla de error solo ofrece recargar, ver `diseno.md`), "Cómo funciona" y "¿Quién completa el parte?"; `BotonConfirmar` (dos pasos) para el parte. | Reiniciar vuelve al ejemplo; foco y Esc según la especificación. |

## Etapa 4 — Pantallas (una por paso, cada una cerrada antes de la siguiente)

| Paso | Pantalla | Hecho cuando |
| --- | --- | --- |
| 4.1 | **Lógica y componente hechos (18/11/2026); enchufado en el centro de alertas (4.2); enchufado también en la flota (4.3); enchufado en la ficha (4.4).** Horizonte (5.6) en sus tres variantes, con datos del generador. | Las marcas caen en el día correcto (comparado con la lista); `aria-label` correcto; colores forzados legibles; CSP limpia. |
| 4.2 | **Hecho (18/11/2026): lógica y pantalla.** Centro de alertas (6.1) + diálogos Renovar y Cargar documento. | Con el ejemplo: protagonista "4 unidades", 11 vencimientos en los grupos esperados, 6 pendientes de operación. Renovar C01 lo saca de la lista y de "No pueden salir" sin recargar; el foco cae donde dice 5.17. |
| 4.3 | **Hecho (18/11/2026): lógica y pantalla.** Flota (6.2) + Agregar unidad. Al agregar bien, el estado navega a la ficha (4.4) y la flota ya no se queda con el mensaje. | Búsqueda "zk214" encuentra la unidad; filtros y orden; alta nueva aparece con sus faltantes (U5). |
| 4.4 | **Hecho (18/11/2026): lógica y pantalla.** Ficha (6.3) + diálogos restantes (resolver novedad, fuera de servicio, volver a servicio, corregir kilometraje, cambiar asignación, dar de baja, corregir documento, cargar novedad). | Cada comando de la sección 8 se ejecuta desde la interfaz y su evento aparece arriba del historial. A4 y N2 visibles con C11. |
| 4.5 | **Hecho (18/11/2026): lógica y pantallas.** Inicio del conductor (6.4) y parte diario (6.5), con autoguardado y "Parte enviado". | En un celular (o emulación táctil a 360 px): parte completo con el pulgar; recargar a mitad y encontrar el borrador; enviar vacío → resumen con foco; K3 con 1 km menos → error; frenos con novedad → la unidad aparece en "No pueden salir" del encargado. |

## Etapa 5 — Revisión y cierre del mínimo

| Paso | Qué | Hecho cuando |
| --- | --- | --- |
| 5.1 | `revisor-codigo`, `qa-destructor` y `auditor-accesibilidad` en paralelo sobre todo lo anterior. | Informes en `docs/`. |
| 5.2 | Correcciones por gravedad. | Altas y medias cerradas o anotadas con decisión. |
| 5.3 | `disenador-ui` revisa contra `diseno-ui.md`; `critico-reclutador` mira como reclutador y como técnico. | Diferencias resueltas o decididas por Matías. |
| 5.4 | README completo (problema, uso, cómo se usó la IA, cómo se verificó, límites, origen), licencia, ficha en la web del portafolio. Verificación de nombres de proyectos (no reales) y del dato de la serie de patentes. | Checklist de `13-publicacion-y-seguridad.md` del portafolio pasado; versión de prueba privada en `*.pages.dev` mirada por Matías. |

## Etapa 6 — Extras (después de publicar el mínimo, si Matías los aprueba)

| Paso | Extra | Hecho cuando |
| --- | --- | --- |
| 6.1 | Imprimir o guardar el parte en PDF (`@media print`, 6.6). | Vista previa de impresión limpia en Chrome y Firefox. |
| 6.2 | Fecha de consulta simulada (D4). | Cambiar la fecha mueve las alertas según V1–V8; aviso fijo mientras está activa. |
| 6.3 | Modo sin conexión (PWA: manifiesto y *service worker* propios; CSP `connect-src 'self'`). | Con la red cortada en DevTools, la demo abre y guarda. |
| 6.4 | Fotos en el parte (P3 de alcance, reglas de seguridad de `diseno.md` §11). | EXIF quitado (verificado con una foto con ubicación ficticia generada para la prueba); topes de tamaño. |

---

## Cómo se retoma

Leer `README.md`, este plan y la última entrada de `docs/registro.md` (se crea en el paso 0.1). Cada paso termina con
tests verdes, `npm run check` limpio y un commit en español que dice qué regla o pantalla quedó hecha.
