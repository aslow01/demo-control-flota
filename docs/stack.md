# Stack — Control de flota (18/11/2026)

Elección de tecnología para la Demo 2, con alternativas y criterio. Decide Matías (decisión S1); hasta entonces vale
la recomendación.

## 1. Qué tiene que soportar

- **Aplicación 100 % en el navegador**, sin servidor ni login, con datos en IndexedDB y un botón "Reiniciar demo".
- **Varias pantallas con estado compartido** (Inicio, Movilidades, Vencimientos, Operación diaria, ficha, y Hoy y parte del conductor): renovar un documento en la ficha cambia Inicio, Movilidades y las insignias de la navegación al mismo tiempo. Formularios largos con borrador automático (parte diario).
- **CSP estricta** como la Demo 1: `default-src 'none'`, todo en `'self'`, sin `'unsafe-inline'` ni `'unsafe-eval'`.
- **TypeScript** de punta a punta y **lógica pura testeable** (las reglas son el corazón de la demo).
- **Pocas dependencias**, con versión exacta y más de 14 días publicadas.
- Punto de partida: la ficha de la demo (en el portafolio) propone SvelteKit o Astro con islas. Es una indicación de
  Matías, no una restricción; la decisión final es S1 (sección 9).

## 2. Alternativas

| | A. Vite + TS sin framework (como la Demo 1) | **B. Vite + TS + Svelte 5, sin SvelteKit** | C. SvelteKit (adaptador estático, SPA) | D. Astro con islas | E. Vite + Preact |
| --- | --- | --- | --- | --- | --- |
| Dependencias de producción | 0 | 1 (`svelte`, se compila dentro del paquete) | 1 + kit | astro + framework de islas | 1–2 (`preact`, señales) |
| Dependencias de desarrollo nuevas | 0 | 2 (`@sveltejs/vite-plugin-svelte`, `svelte-check`) | 4+ (kit, adaptador, plugin, check) | 2+ (astro, integración) | 1 (`@preact/preset-vite`) |
| Estado compartido entre pantallas | A mano: cada cambio repinta el DOM a mano. En la Demo 1 eso trajo bugs de foco y de filas reconstruidas. | Reactivo (*runes*: `$state`, `$derived`), sin DOM virtual. | Igual que B. | Cada isla aislada; compartir estado entre islas es incómodo. | Reactivo (*hooks* o señales). |
| CSP estricta | Sin fricción. | Sin fricción si se cumplen dos reglas (sección 4). | Fricción: el arranque usa un script en línea; hay que generar *hashes* por compilación y llevarlos a `_headers`. | Fricción: las islas se hidratan con scripts en línea; hay soporte de CSP con *hashes*, pero es otra pieza a mantener. | Sin fricción. |
| Encaje con el problema | Bueno para una pantalla (Demo 1); costoso para cuatro con formularios. | Muy bueno: aplicación de cliente con formularios y estado. | Pensado para sitios con rutas de servidor y prerenderizado: acá sobra casi todo. | Pensado para sitios de contenido con poca interactividad: acá **todo** es interactivo. | Bueno; JSX y *hooks* tienen más trampas (dependencias de efectos) para alguien que está aprendiendo. |
| Curva de aprendizaje | Conocido (Demo 1). | Nuevo, pero los componentes son HTML + CSS + TS en un archivo; se lee casi como la Demo 1. | Nuevo y más conceptos (cargas, servidor, prerender). | Conocido por la web (Astro), pero las islas agregan otro framework adentro. | Nuevo; modelo mental de React. |
| Señal para un líder técnico | "Sabe sin framework." (ya lo muestra la Demo 1) | "Elige la herramienta según el problema", y el portafolio muestra dos enfoques. | Puede leerse como sobredimensionado para una SPA local. | Puede leerse como herramienta equivocada para una app. | Neutro. |

## 3. Recomendación: B — Vite + TypeScript + Svelte 5, sin SvelteKit

1. **El problema pide estado reactivo.** Cuatro pantallas que se recalculan con cada comando (alertas, aptitud,
   kilometraje). Hacerlo a mano repite lo que costó en la Demo 1 (sincronizar DOM, conservar foco al repintar).
2. **Una sola dependencia de producción**, que además se compila: el paquete final no lleva un framework "en tiempo de
   ejecución" grande. Las de desarrollo son dos, más las que ya están aprobadas en la Demo 1.
3. **Compatible con la CSP estricta** sin `'unsafe-inline'` (con las reglas de la sección 4), cosa que SvelteKit y Astro
   no dan "gratis".
4. **Sigue la indicación de la ficha** (familia Svelte) **sin lo que sobra** (servidor, prerender, adaptador).
5. **La lógica queda en TypeScript puro** (`src/lib/dominio`), sin una línea de Svelte: se prueba con Vitest en Node
   igual que en la Demo 1, y sobreviviría a un cambio de framework.
6. **Para el portafolio**, dos demos con dos enfoques justificados (sin framework cuando alcanza; con framework cuando
   el estado lo pide) dicen más que dos demos iguales.

Plan B si Matías prefiere cero framework: alternativa A con una capa mínima propia (`render(estado) → DOM` por
pantalla y un pequeño almacén con suscripción). Costo estimado: un 30–50 % más de código de interfaz y más pruebas
manuales de foco. Viable, no recomendado.

## 4. Reglas para que Svelte cumpla la CSP

1. **Nada de atributo `style` en el marcado** (`<div style="…">`), por regla de la casa. Para valores dinámicos (posición
   de las marcas del horizonte) se usa **la directiva `style:propiedad`**, que asigna por CSSOM
   (`element.style.setProperty`), que la CSP permite. **Quién vigila la regla:** la revisión de código, no la CSP. El
   18/11/2026 esta demo midió, en Chrome con la CSP real, que un `style="…"` estático producía la violación
   `style-src-attr`; el 22/11/2026 la Demo 3 midió lo contrario en Svelte 5 con Chrome: un `style="…"` escrito en el marcado,
   estático o con valores dinámicos, **no** da violación (Svelte lo clona desde una plantilla o lo asigna por CSSOM). Esta
   demo no repitió esa medición, así que no se debe confiar en que la CSP detecte un `style` olvidado en el marcado
   (Firefox y Safari no se probaron). Que la CSP **sí** está activa se comprueba con otras pruebas, que dan violación:
   `setAttribute("style", …)` y `innerHTML` con un `style` (`style-src-attr`), un `<style>` inyectado (`style-src-elem`),
   un `<script>` inyectado (`script-src-elem`) y un `fetch`, que falla por `connect-src`. Se comprueba en el paso 0 del
   plan con un componente de prueba y la CSP real.
2. **CSS de los componentes a archivo**: `vite-plugin-svelte` con `emitCss` (valor por defecto) para que la compilación
   de producción saque todo el CSS a `assets/*.css` (`style-src 'self'`). En desarrollo Vite inyecta estilos; no
   importa, la CSP de `_headers` aplica solo en producción y se verifica con `vite preview` + cabeceras.
3. **Prohibido `{@html}`** (además de la CSP, es la puerta del XSS). Revisión por búsqueda en CI (`grep -r "{@html"`
   debe dar vacío).
4. **Sin transiciones de Svelte** (`transition:`): el movimiento va por CSS con `prefers-reduced-motion`.

CSP propuesta (`public/_headers`, igual a la de la Demo 1 salvo `connect-src`):

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'
```

`connect-src 'none'`: la demo no habla con nadie. Si se hace el modo sin conexión (P2), el *service worker* necesita
`connect-src 'self'` para leer sus propios archivos: se cambia en ese paso, con una línea en el registro.

## 5. Dependencias

Versiones **exactas** (sin `^`), publicadas hace más de 14 días al instalar, revisadas con la skill
`seguridad-aplicada`. Las tres primeras ya están aprobadas en la Demo 1 y se usan iguales.

| Paquete | Tipo | Para qué | Nota |
| --- | --- | --- | --- |
| `vite` 8.3.5 | desarrollo | Servidor de desarrollo y compilación. | Igual que Demo 1. |
| `vitest` 5.1.0 | desarrollo | Tests. | Igual que Demo 1. |
| `typescript` **6.0.3** | desarrollo | Tipos. | **Distinto de la Demo 1 (7.0.2), resuelto S3:** `svelte-check` 4.7.8 pide TypeScript 5 o 6 y con 7 no arranca (ver sección 9). |
| `svelte` **5.57.3** (26/10/2026) | producción (compilada) | Componentes y reactividad. | 13 dependencias propias (compilador); ninguna con script de instalación. Entra en el paquete solo su *runtime* (~20 KB). |
| `@sveltejs/vite-plugin-svelte` **7.3.1** (23/09/2026) | desarrollo | Compila `.svelte` y `.svelte.ts` en Vite. | Acepta Vite 8 y Svelte 5.46.4 o más. |
| `svelte-check` **4.7.8** (01/11/2026) | desarrollo | Tipos dentro de los `.svelte` (CI). | Pide TypeScript 5 o 6 (S3). |
| `fake-indexeddb` **6.2.7** (30/10/2026) | desarrollo | IndexedDB en Node para la suite de contrato del repositorio. | Decisión S2 aprobada. Cero dependencias. Su `prepare: husky` no corre al instalar desde el registro. |
| `@playwright/test` **1.65.0** (05/11/2026) | desarrollo | Pruebas de punta a punta en Chromium (`npm run e2e`, `e2e/`): cada pantalla, el generador de datos y la escritura contra `dist/` con la CSP real. | Decisión S5. Trae `playwright` y `playwright-core` 1.65.0; ninguno con script de instalación (el navegador se baja aparte con `npx playwright install chromium`, y la CI lo hace). La 1.65.1 (13/11/2026) tenía menos de 14 días. |
| `@axe-core/playwright` **4.14.0** (15/10/2026) | desarrollo | Pasa axe (WCAG 2.2 AA y mejores prácticas) en cada pantalla de esas pruebas. | Decisión S5. Trae `axe-core` (sin dependencias ni scripts de instalación). La 4.14.1 (24/11/2026) tenía menos de 14 días. |

`package.json` fija con `overrides` `axe-core` 4.14.0 (05/10/2026) y `playwright-core` 1.65.0: sin eso, `@axe-core/playwright` (que pide `axe-core ~4.14.0`) y su dependencia de pares aceptan una versión más nueva y el lockfile se llevaría la 4.14.1 (16/11/2026) y la 1.65.1, que no cumplen los 14 días. Al subir de versión alguno de los cuatro paquetes, revisar las fechas con `npm view <paquete> time --json` y sacar el `override` que ya no haga falta.

**No se usan** (y por qué): enrutador (uno propio por *hash* de ~50 líneas, con tests); envoltorio de IndexedDB tipo
`idb` (uno propio de ~100 líneas: solo hacen falta transacciones con varios almacenes); librería de fechas (`Intl`
alcanza y se prueba con la matriz de zonas horarias); kit de componentes o framework de CSS (el sistema visual es
propio); paquete de íconos (sprite propio); `workbox` (si hay PWA, *service worker* propio de pocas líneas).

## 6. Estructura del repositorio

```
demo-control-flota/
├── index.html                 sprite de íconos, favicon, raíz
├── public/_headers            CSP y cabeceras de Cloudflare Pages
├── src/
│   ├── main.ts                monta la aplicación
│   ├── App.svelte             marco: lateral, barras superior e inferior, migas, avisos y rutas
│   ├── lib/
│   │   ├── dominio/           reglas puras (fechas, vencimientos, aptitud, parte, km, alertas, comandos, textos)
│   │   ├── datos/             azar con semilla, generador, cuit
│   │   ├── persistencia/      Repositorio, memoria, IndexedDB, arranque, aviso entre pestañas
│   │   └── estado/            estado reactivo (*.svelte.ts), reloj, perfil, enrutador
│   ├── componentes/           pantallas y piezas de presentación (maquetador); movimiento.ts: transición entre pantallas y cuenta de la cifra
│   └── estilos/               tokens.css, base.css, fuentes.css y fuentes/ (woff2 con su licencia OFL)
├── tests/                     *.test.ts (dominio, generador, persistencia, enrutador)
├── e2e/                       pruebas de punta a punta (Playwright + axe); ejemplo.ts: los datos del ejemplo que usan
├── scripts/                   contraste.mjs (contraste de la paleta), peso-js.mjs (topes de peso), servir-dist.mjs, buscar-prohibidos.mjs
└── .github/workflows/ci.yml
```

## 7. Verificación y CI

- `npm run check`: `svelte-check` + `tsc --noEmit`, 0 errores.
- `npm test`: Vitest. En CI con **matriz de zonas horarias** (`TZ=UTC`, `TZ=Asia/Tokyo`, `TZ=America/Los_Angeles`) para
  la regla T2.
- `npm run e2e`: `vite build` y Playwright con axe en Chromium, contra `dist/` servido por `scripts/servir-dist.mjs` con las cabeceras de `_headers` (la CSP real; un archivo con extensión que falta da 404). Una prueba por ruta (consola, pedidos, CSP, axe y desborde a 360 px), la de los trozos (el generador solo en la primera visita, el estado de carga, el error de descarga, el generador caído, colgado o lento, «hay una versión nueva») y la escritura. Ninguna toca la red de afuera: una guarda la corta y hace fallar la prueba. Solo en modo claro. El puerto es el 4180 o el de `E2E_PUERTO`. En CI, si falla, se suben el informe y las trazas como artefacto durante 7 días.
- `npm run build` + `vite preview` con las cabeceras de `_headers` (script de verificación o prueba manual) sin
  violaciones de CSP en la consola.
- `npm audit --audit-level=high` sin altas ni críticas (si aparece la misma excepción de herramientas de desarrollo que
  en la Demo 1, se documenta con fecha de revisión).
- Búsqueda: sin `{@html}`, sin `Math.random` en `src/lib`, sin `new Date(` fuera de `estado/reloj.ts`, sin nombres de
  empresas reales ni datos personales. Los nombres de terceros se buscan con una lista que **no se versiona**
  (`scripts/prohibidos.local.json`, ignorado por git), porque un repositorio público no puede nombrarlos ni en la
  herramienta que los busca (tampoco por su SHA-256: sin sal, se recupera probando un diccionario). Sin ese archivo, la
  regla se omite con un aviso y las demás corren igual; los correos, con una regla genérica (cualquier correo que no sea de un dominio de ejemplo o `noreply`).
- Tamaño: `npm run peso` (`scripts/peso-js.mjs`, también en la integración continua) mide el JS comprimido con gzip nivel 9 de `node:zlib`, siempre el mismo método; no coincide con lo que imprime `vite build` (hasta ~1,2 kB menos). Tres medidas, con los topes que fijó la etapa 1 del rediseño (27/11/2026):
  - **Carga inicial** (lo que baja quien vuelve el mismo día con datos guardados: el script de entrada y los `modulepreload` de `index.html`, o sea el marco e Inicio): tope de **95.000 B**; falla. Era de 120 kB (subido de 100 el 19/11/2026; el 25/11/2026 pasó a valer solo para la carga inicial y no para el total, porque el porte a interfaz tipo app parte la carga con `import()`); la etapa 1 lo bajó a 95 kB con lo ganado, y no se vuelve a subir.
  - **Primera visita** (la carga inicial más el generador de datos y lo que este importa de forma estática, que se pide enseguida cuando no hay datos guardados: lo que baja un visitante nuevo): tope de **100.000 B**; falla. Existe porque sacar el generador de la carga inicial lo dejaba sin medir.
  - **Total** y **cada trozo**: solo avisan, a **180.000 B** el total y a **30.000 B** cada trozo. El aviso del total subió a 240.000 B al terminar la etapa 1 y se bajó a 180.000 B el 27/11/2026 (medido: 165.809 B): con 240.000 B nunca habría avisado. Subirlo de nuevo es una decisión que se anota acá, no un ajuste. En GitHub Actions los avisos salen como anotaciones `::warning::` y la medición queda en el resumen de la corrida.
  - **Medido el 27/11/2026** (`npm run build` y `npm run peso`): carga inicial **93.886 B** (margen 1.114 B), primera visita **99.276 B** (margen 724 B), JS total **165.809 B** en 19 trozos (el mayor, la ficha, 15.991 B). Antes de la etapa 1 el generador viajaba dentro de la carga inicial (116.520 B). Ahora quien vuelve el mismo día baja 93.886 B (**−19 %**) y quien entra por primera vez baja 99.276 B (**−15 %**) y, además, un pedido más y en serie (el generador se pide recién cuando la aplicación arrancó y no hay datos): **la mejora grande es para quien vuelve**. El total subió de 143.033 a 165.809 B por la sobrecarga de partir en trozos. `vite build` imprime, además del JS, el CSS y unos 200 kB de fuentes `.woff2` (tres familias, subconjunto latino) que no cuentan como JS.
  - Reparto del JS del 22/11/2026 (408 kB sin comprimir, antes del porte a la interfaz tipo app y de la etapa 1): vistas `.svelte` 23 %; lógica de dominio 16 % más sus textos 11 %; estado de la aplicación 15 %; runtime de Svelte 12 % más un 16 % que el mapa de fuentes no atribuye y es en su mayoría de Svelte; generador de datos 3,5 %; persistencia 3 %. No hay otras dependencias. Los textos pesan lo que dicen: no hay una reducción segura sin tocar el contenido.

## 8. Publicación

Cloudflare Pages, proyecto propio, subdominio `flota.matiasormeno.com.ar` (lo hace el hilo principal con Matías).
Rutas por *hash*: no hace falta regla de reescritura para la SPA. Primero, versión de prueba privada en `*.pages.dev`,
como se decidió para la Demo 1.

## 9. Decisiones

La IA propuso las opciones con una recomendación; Matías comparó y eligió.

| # | Pregunta | Opciones | Decisión |
| --- | --- | --- | --- |
| S1 | Stack | A sin framework · **B Svelte 5 sin Kit** · C SvelteKit · D Astro con islas · E Preact | **B** (Matías, 18/11/2026), por las razones de la sección 3. |
| S2 | IndexedDB en los tests | `fake-indexeddb` en Node (una dependencia de desarrollo) · tests en navegador real (Vitest modo navegador + Playwright: mucho más pesado) · sin tests automáticos del adaptador | `fake-indexeddb` (Matías; confirmada por escrito el 22/11/2026): prueba el adaptador real con la misma suite que el repositorio en memoria; no viaja en el paquete. |
| S3 | TypeScript 7 y `svelte-check` | Mantener TS 7.0.2 si `svelte-check` lo soporta · fijar la versión de TS que pida `svelte-check` | **Resuelta el 18/11/2026: TypeScript 6.0.3 (confirmada por Matías).** `svelte-check` 4.7.8 declara `typescript ^5 || ^6` (npm rechaza la instalación con 7.0.2) y, forzándola, se detiene con "TypeScript 7 support currently requires both TypeScript 7 and TypeScript 6 installed ... and requires using the --tsgo flag". La vía oficial (TS 6 y TS 7 con un alias, más una opción experimental) agrega un paquete y una pieza frágil sin ganar nada acá. Volver a mirar cuando `svelte-check` soporte 7 sin alias. |
| S4 | Rutas | *Hash* (`#/flota`) · historial (`/flota` con reescritura en Pages) | *Hash* (Matías; confirmada por escrito el 22/11/2026): cero configuración y funciona igual en la vista previa y en el dominio. |
| S5 | Pruebas de punta a punta | Ninguna (las pantallas se miran a mano) · Playwright con axe en Chromium · Playwright en tres navegadores | **Playwright con axe en Chromium** (aprobada con el encargo de la etapa 1 del rediseño, 27/11/2026): sin pruebas de las pantallas, partir la carga por rutas no tenía cómo comprobarse (una pantalla que no baja, el generador lento, la CSP). Dos dependencias de desarrollo (sección 5), sin tocar lo que viaja al navegador. Cubre solo el modo claro, a 1280 y 360 px; Firefox, Safari, el modo oscuro y lo visual siguen a mano. Esto matiza S2: Playwright se usa para las pantallas, no para el adaptador de IndexedDB. |
