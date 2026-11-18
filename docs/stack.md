# Stack — Control de flota (18/11/2026)

Elección de tecnología para la Demo 2, con alternativas y criterio. Decide Matías (decisión S1); hasta entonces vale
la recomendación.

## 1. Qué tiene que soportar

- **Aplicación 100 % en el navegador**, sin servidor ni login, con datos en IndexedDB y un botón "Reiniciar demo".
- **Cuatro pantallas con estado compartido**: renovar un documento en la ficha cambia el centro de alertas, la flota y
  la insignia de la pestaña al mismo tiempo. Formularios largos con borrador automático (parte diario).
- **CSP estricta** como la Demo 1: `default-src 'none'`, todo en `'self'`, sin `'unsafe-inline'` ni `'unsafe-eval'`.
- **TypeScript** de punta a punta y **lógica pura testeable** (las reglas son el corazón de la demo).
- **Pocas dependencias**, con versión exacta y más de 14 días publicadas.
- Regla común de las demos: **stack distinto al del sistema de la empresa cuando sea razonable**. La ficha propone
  SvelteKit o Astro con islas. (Por la regla de sala limpia no se consultó qué usa la empresa: se toma la indicación de
  la ficha, que escribió Matías, y él lo confirma en S1.)

## 2. Alternativas

| | A. Vite + TS sin framework (como la Demo 1) | **B. Vite + TS + Svelte 5, sin SvelteKit** | C. SvelteKit (adaptador estático, SPA) | D. Astro con islas | E. Vite + Preact |
| --- | --- | --- | --- | --- | --- |
| Dependencias de producción | 0 | 1 (`svelte`, se compila dentro del paquete) | 1 + kit | astro + framework de islas | 1–2 (`preact`, señales) |
| Dependencias de desarrollo nuevas | 0 | 2 (`@sveltejs/vite-plugin-svelte`, `svelte-check`) | 4+ (kit, adaptador, plugin, check) | 2+ (astro, integración) | 1 (`@preact/preset-vite`) |
| Estado compartido entre pantallas | A mano: cada cambio repinta el DOM a mano. En la Demo 1 eso trajo bugs de foco y de filas reconstruidas. | Reactivo (*runes*: `$state`, `$derived`), sin DOM virtual. | Igual que B. | Cada isla aislada; compartir estado entre islas es incómodo. | Reactivo (*hooks* o señales). |
| CSP estricta | Sin fricción. | Sin fricción si se cumplen dos reglas (sección 4). | Fricción: el arranque usa un script en línea; hay que generar *hashes* por compilación y llevarlos a `_headers`. | Fricción: las islas se hidratan con scripts en línea; hay soporte de CSP con *hashes*, pero es otra pieza a mantener. | Sin fricción. |
| Encaje con el problema | Bueno para una pantalla (Demo 1); costoso para cuatro con formularios. | Muy bueno: aplicación de cliente con formularios y estado. | Pensado para sitios con rutas de servidor y prerenderizado: acá sobra casi todo. | Pensado para sitios de contenido con poca interactividad: acá **todo** es interactivo. | Bueno; JSX y *hooks* tienen más trampas (dependencias de efectos) para alguien que está aprendiendo. |
| Distinto al sistema de la empresa (según la ficha) | No lo dice la ficha. | Sí (misma familia que lo propuesto). | Sí (propuesto). | Sí (propuesto). | No lo dice la ficha. |
| Para Matías (nivel inicial, quiere aprender) | Conocido (Demo 1). | Nuevo, pero los componentes son HTML + CSS + TS en un archivo; se lee casi como la Demo 1. | Nuevo y más conceptos (cargas, servidor, prerender). | Conocido por la web (Astro), pero las islas agregan otro framework adentro. | Nuevo; modelo mental de React. |
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

1. **Nada de atributo `style` en el marcado** (medido el 18/11/2026 en Chrome con la CSP real: un `style="…"` estático **sí produce la violación `style-src-attr`**, aunque Chrome igual aplica el estilo porque Svelte clona la plantilla; Firefox y Safari pueden no hacerlo. La regla se mantiene) (`<div style="…">`): Svelte lo pone en la plantilla HTML y la CSP lo
   bloquea. Para valores dinámicos (posición de las marcas del horizonte) se usa **la directiva `style:propiedad`**, que
   asigna por CSSOM (`element.style.setProperty`), que la CSP permite. Se comprueba en el paso 0 del plan con un
   componente de prueba y la CSP real.
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
│   ├── App.svelte             marco: barras, avisos, rutas, pie
│   ├── lib/
│   │   ├── dominio/           reglas puras (fechas, vencimientos, aptitud, parte, km, alertas, comandos, textos)
│   │   ├── datos/             azar con semilla, generador, cuit
│   │   ├── persistencia/      Repositorio, memoria, IndexedDB, arranque, aviso entre pestañas
│   │   └── estado/            estado reactivo (*.svelte.ts), reloj, perfil, enrutador
│   ├── rutas/                 contenedores por pantalla (programador)
│   ├── componentes/           piezas de presentación (maquetador)
│   └── estilos/               tokens.css, base.css, impresion.css
├── tests/                     *.test.ts (dominio, generador, persistencia, enrutador)
├── scripts/contraste.mjs      medición de contraste de la paleta
└── .github/workflows/ci.yml
```

## 7. Verificación y CI

- `npm run check`: `svelte-check` + `tsc --noEmit`, 0 errores.
- `npm test`: Vitest. En CI con **matriz de zonas horarias** (`TZ=UTC`, `TZ=Asia/Tokyo`, `TZ=America/Los_Angeles`) para
  la regla T2.
- `npm run build` + `vite preview` con las cabeceras de `_headers` (script de verificación o prueba manual) sin
  violaciones de CSP en la consola.
- `npm audit --audit-level=high` sin altas ni críticas (si aparece la misma excepción de herramientas de desarrollo que
  en la Demo 1, se documenta con fecha de revisión).
- Búsqueda: sin `{@html}`, sin `Math.random` en `src/lib`, sin `new Date(` fuera de `estado/reloj.ts`, sin nombres de
  empresas reales ni datos personales.
- Tamaño: medir el JS y el CSS de la compilación en el paso 0; tope propuesto 100 KB de JS comprimido con gzip.

## 8. Publicación

Cloudflare Pages, proyecto propio, subdominio `flota.matiasormeno.com.ar` (lo hace el hilo principal con Matías).
Rutas por *hash*: no hace falta regla de reescritura para la SPA. Primero, versión de prueba privada en `*.pages.dev`,
como se decidió para la Demo 1.

## 9. Decisiones (para Matías)

| # | Pregunta | Opciones | Recomendación |
| --- | --- | --- | --- |
| S1 | Stack | A sin framework · **B Svelte 5 sin Kit** · C SvelteKit · D Astro con islas · E Preact | B, por las razones de la sección 3. Confirmar que Svelte es distinto del stack del sistema de la empresa (lo sabe Matías; acá no se consultó). |
| S2 | IndexedDB en los tests | `fake-indexeddb` en Node (una dependencia de desarrollo) · tests en navegador real (Vitest modo navegador + Playwright: mucho más pesado) · sin tests automáticos del adaptador | `fake-indexeddb`: prueba el adaptador real con la misma suite que el repositorio en memoria; no viaja en el paquete. |
| S3 | TypeScript 7 y `svelte-check` | Mantener TS 7.0.2 si `svelte-check` lo soporta · fijar la versión de TS que pida `svelte-check` | **Resuelta el 18/11/2026: TypeScript 6.0.3.** `svelte-check` 4.7.8 declara `typescript ^5 || ^6` (npm rechaza la instalación con 7.0.2) y, forzándola, se detiene con "TypeScript 7 support currently requires both TypeScript 7 and TypeScript 6 installed ... and requires using the --tsgo flag". La vía oficial (TS 6 y TS 7 con un alias, más una opción experimental) agrega un paquete y una pieza frágil sin ganar nada acá. Volver a mirar cuando `svelte-check` soporte 7 sin alias. |
| S4 | Rutas | *Hash* (`#/flota`) · historial (`/flota` con reescritura en Pages) | *Hash*: cero configuración y funciona igual en la vista previa y en el dominio. |
