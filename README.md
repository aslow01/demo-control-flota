# Control de flota (demo)

Aplicación web de demostración que responde, en una pantalla, a dos preguntas: **¿qué unidades no pueden salir hoy?
y ¿qué documentos vencen pronto?** Además, el conductor completa su parte diario desde el celular sin perder lo escrito.

Funciona entera en el navegador: sin servidor, sin cuenta y sin conexiones externas. Los datos son ficticios y se guardan
solo en el navegador de quien la abre. Forma parte del portafolio de Matías Ariel Ormeño.

<!-- URL de la demo en vivo: pendiente -->
**Demo en vivo:** todavía no está publicada. Cuando lo esté, el enlace va aquí.

## Qué problema resuelve

En una operación con muchas camionetas se escapan los vencimientos (seguro, revisión técnica, habilitaciones, licencia
de conducir) y los partes diarios quedan en papel. A primera hora nadie sabe con certeza qué unidad no debería salir, qué
vence esta semana ni qué novedad informó un conductor hace tres días.

La demo muestra cómo se resuelve con tres ideas:

- **Vencimientos con fecha y regla:** cada documento tiene un vencimiento y la aplicación lo clasifica (vencido, vence en
  7, 15 o 30 días, vigente). Un documento renovado reemplaza al anterior, que queda en el historial.
- **Parte diario del conductor:** kilometraje, revisión de la unidad (diez puntos), combustible y novedades. Se guarda
  como borrador mientras se escribe.
- **Aptitud para salir:** cada unidad aparece como «Puede salir» o «No puede salir» según sus documentos, sus novedades
  críticas y si está fuera de servicio. La aptitud se calcula siempre; no se guarda ni se edita a mano.

## Qué se puede hacer en la demo

La barra «Ver como» cambia la perspectiva entre **Encargado** (perfil de entrada) y **Conductor**. Es una perspectiva,
no un control de acceso: no hay cuentas ni contraseñas.

| Pantalla | Perfil | Qué permite |
| --- | --- | --- |
| Centro de alertas | Encargado | Ver cuántas unidades no pueden salir hoy, los vencimientos agrupados en 7, 15 y 30 días y los pendientes de operación. Renovar o cargar un documento desde la propia alerta. |
| Flota | Encargado | Buscar por patente o número interno, filtrar por estado y proyecto, ordenar y agregar una unidad nueva. |
| Ficha de la unidad | Encargado | Ver documentos, novedades, kilometraje e historial. Renovar documentos, resolver novedades, poner la unidad fuera de servicio o devolverla a servicio, corregir el kilometraje, cambiar la asignación y dar de baja. |
| Inicio del conductor | Conductor | Ver la unidad de hoy, los partes pendientes, el vencimiento de la propia licencia y los últimos partes. Elegir otra unidad. |
| Parte diario | Conductor y Encargado | Completar kilometraje, revisión, combustible y novedades; guardado automático de borrador; aviso antes de enviar si falta documentación o hay un salto de kilometraje; parte enviado en solo lectura. |

Todo cambio se refleja en las demás pantallas al instante: renovar un documento lo saca de las alertas, mejora el estado
en la flota y actualiza la insignia de la pestaña «Alertas». Un parte con una novedad crítica en los frenos pone la
unidad fuera de servicio y la suma a «No pueden salir». El botón **Reiniciar demo** (en la barra de la aplicación y en el
menú «Más») borra los cambios y vuelve a cargar la flota de ejemplo con las fechas de hoy.

## Cómo usarla

1. Abra la demo. Entra como Encargado, en el centro de alertas.
2. Pruebe renovar el seguro vencido de la unidad ZK 214 BD: la alerta desaparece y la unidad deja de figurar en
   «No pueden salir».
3. En «Ver como», elija **Conductor** y una persona ficticia. Complete un parte con una novedad crítica en los frenos y
   envíelo; vuelva al perfil Encargado y verá la unidad en «No pueden salir».
4. Para empezar de nuevo, use **Reiniciar demo**.

## Cómo correrla localmente

Requisitos: Node 24 y npm 11.

```
npm install
npm run dev          # servidor de desarrollo
npm run build        # compilación en dist/
npm run servir       # sirve dist/ con las mismas cabeceras de seguridad que se usarán al publicar
```

`npm run dev` usa el puerto 5173 de Vite (si está ocupado, toma el siguiente). `npm run servir` acepta un puerto
(`node scripts/servir-dist.mjs 4173`) y requiere compilar antes.

## Cómo está hecha

- **Tecnología:** Vite 8, TypeScript 6 y Svelte 5, sin SvelteKit. La única dependencia de producción es `svelte`; el resto
  son herramientas de desarrollo (Vite, Vitest, `svelte-check`, TypeScript y `fake-indexeddb` para probar la base en
  Node). Las versiones son exactas. Las alternativas descartadas y el criterio están en [`docs/stack.md`](docs/stack.md).
- **Todo en el navegador:** los datos viven en IndexedDB (base `control-flota-demo`). No hay servidor ni base remota. Si el
  navegador no permite guardar datos, la demo sigue funcionando en memoria y avisa que los cambios se pierden al recargar.
- **Reglas en TypeScript puro:** vencimientos, aptitud, parte, kilometraje y alertas están en `src/lib/dominio`, sin
  una línea de interfaz, y se prueban en Node. Las fechas son fechas civiles en la zona horaria de Argentina y las pruebas
  corren también en otras dos zonas (Tokio y Los Ángeles) para evitar errores de día.
- **Seguridad:** política de contenido (CSP) estricta, sin `unsafe-inline` ni `unsafe-eval` (`public/_headers`):
  `default-src 'none'`, todo lo demás limitado al propio origen y `connect-src 'none'`, es decir, la página no puede
  conectarse a ningún servidor. No se usa `{@html}`, `innerHTML` ni `eval`; el texto que escribe la persona se muestra
  siempre como texto.
- **Tamaño medido (`npm run build`):** 360 KB de JavaScript (106 KB comprimido con gzip), 77 KB de CSS (13 KB con gzip)
  y 6 KB de HTML.
- **Accesibilidad:** pensada para el teclado, con foco visible, controles táctiles de 44 px como mínimo, modo claro y
  oscuro, colores forzados y anchos desde 320 px. Lo que se midió y lo que falta probar está más abajo.

## Cómo se usó la IA

Esta demo se hizo con IA y el repositorio lo muestra tal cual:

- **Matías Ariel Ormeño** definió el problema y el alcance (incluido lo que la demo no hace), tomó las decisiones de
  diseño y de tecnología (están listadas en [`docs/diseno.md`](docs/diseno.md), sección 15, y en
  [`docs/stack.md`](docs/stack.md), sección 9), dirigió el trabajo paso a paso y revisó los resultados.
- **La IA (Claude, de Anthropic) escribió el código, las pruebas y los documentos.** Matías no escribió el código a mano.
- **El método:** primero se escribió el diseño (modelo de datos, reglas de negocio con un caso de prueba cada una,
  pantallas y accesibilidad); después un plan de pasos chicos ([`docs/plan.md`](docs/plan.md)); la lógica se hizo con
  pruebas primero (TDD: se escribe la prueba que falla y después el código que la hace pasar).
- **Revisiones:** al terminar cada etapa, agentes de IA con rol distinto revisaron el código, intentaron romper la
  aplicación (QA adversarial) y auditaron la accesibilidad. Sus hallazgos se corrigieron por gravedad. Son revisiones
  hechas también por IA, no por terceras personas.
- **Rastro verificable:** cada paso, cada decisión y lo que quedó sin hacer están en [`docs/registro.md`](docs/registro.md),
  y el historial de git cuenta la misma historia, con el diseño como primer commit.

## Cómo se verificó

Cifras medidas el 19/11/2026 sobre la rama `interfaz-etapa-0`:

| Comprobación | Comando | Resultado |
| --- | --- | --- |
| Pruebas automáticas | `npm test` | 1.323 pruebas en 54 archivos, todas pasan |
| Las mismas en tres zonas horarias | `npm run test:tz` | 1.323 pruebas en UTC, Asia/Tokio y América/Los Ángeles, todas pasan |
| Tipos | `npm run check` | 0 errores y 0 avisos en 327 archivos |
| Contraste de la paleta | `npm run contraste` | 158 mediciones, 0 fallan, 9 pasan por poco margen |
| Búsqueda de lo prohibido | `npm run buscar` | Sin hallazgos (8 reglas, 193 archivos): sin `{@html}`, sin `eval`, sin `Math.random` en `src/lib`, sin reloj del sistema fuera de `estado/reloj.ts` |
| Dependencias | `npm audit` | 0 vulnerabilidades |

**Probado en un navegador** (Chromium con Playwright, contra el servidor de desarrollo y contra la compilación servida
con la CSP real; detalle en `docs/registro.md`): 24 pantallas y estados, a 320, 360, 768 y 1280 px, en modo claro y
oscuro (192 combinaciones sin problemas de desborde, de tamaño de los controles ni de consola), 0 violaciones de CSP y
0 violaciones de axe-core (WCAG 2.0 a 2.2, niveles A y AA). También zoom al 200 % y al 400 % en el parte. Los guiones de
Playwright no están en este repositorio.

**No se probó:**

- un lector de pantalla real (los avisos llevan su rol, pero el anuncio real no se escuchó);
- Firefox ni Safari;
- una pantalla táctil real (solo emulación y clics de mouse);
- el modo de contraste alto de Windows (solo colores forzados emulados).

El flujo de integración continua (`.github/workflows/ci.yml`) está escrito pero no se ejecutó todavía.

## Límites conocidos

- **Sin login:** el perfil es una perspectiva; cualquiera puede «ser» el encargado.
- **Los datos viven en un solo navegador:** no se comparten entre equipos ni personas, y se pierden si se borran los datos
  del sitio.
- **Escribir y recargar en menos de 500 ms puede perder lo último:** el parte se guarda 500 ms después de la última tecla
  (y al salir del campo, al enviar o al irse de la pantalla). Guardar en IndexedDB requiere varias idas y vueltas con el
  navegador y una recarga no las espera. Se probó otra forma de guardado al cerrar la página y no alcanzó.
- **Pestañas desactualizadas:** si el navegador no tiene `BroadcastChannel`, una pestaña abierta antes no se entera de los
  cambios hechos en otra. Donde sí lo tiene, la pestaña vieja pasa a solo lectura hasta que se actualiza.
- **Requisitos simplificados:** sin exenciones de revisión técnica ni clases de licencia.
- **Un parte por unidad y por día:** no hay turnos ni relevos de conductor dentro del mismo día.
- **Sin pruebas automáticas de las pantallas:** las pruebas cubren las reglas, el generador, la persistencia y el estado;
  las pantallas se verificaron a mano y con guiones que no forman parte del repositorio.
- **Imprimir o guardar el parte en PDF:** previsto, todavía no está.
- **Otros extras sin hacer:** fecha de consulta simulada, modo sin conexión y fotos en el parte.
- **Un hallazgo menor de contraste** de un color de la paleta de neutros (`--c-neutro-r`) sigue sin corregirse; consta
  en el registro.

## Datos ficticios

Todo lo que se ve es inventado y se genera con una semilla fija, de modo que la flota de ejemplo es siempre la misma:

- **Empresa:** «Logística Andina Demo S.A.». Su CUIT es ficticio pero tiene dígito verificador válido (lo exige el
  generador), así que podría coincidir con el de un contribuyente real. Por eso la aplicación siempre lo muestra junto a
  la palabra «ficticio».
- **Unidades:** 24 (14 camionetas, 4 utilitarios, 3 camiones livianos, 2 minibuses y 1 dada de baja), 16 conductores y
  una encargada, con partes de los 45 días anteriores.
- **Patentes:** con formato argentino y en una serie elegida para que no se parezca a la de vehículos reales: todas
  empiezan con `Z`. **Falta verificar** qué series se emitieron realmente; hasta entonces, no se afirma que sean
  inexistentes.
- **Nombres:** personas, proyectos, aseguradoras, plantas de revisión y números de documento, inventados (los de póliza
  llevan el prefijo `DEMO-`). Falta verificar que los nombres de proyectos no coincidan con proyectos reales.
- **Fechas relativas a hoy:** el generador planta casos conocidos a distancias fijas de la fecha de hoy (un seguro vencido
  ayer, una revisión que vence hoy, otra dentro de 30 días, un borrador sin enviar, etc.). Con el ejemplo recién cargado
  aparecen 4 unidades en «No pueden salir», 2 documentos vencidos o faltantes y 9 vencimientos próximos (4 en hasta
  7 días, 3 entre 8 y 15 y 2 entre 16 y 30). Una prueba automática fija esos valores.

## Origen

- **Fecha de inicio:** 18/11/2026.
- Escrita **desde cero**, a partir de un enunciado propio de una página. El diseño (modelo de datos, pantallas y reglas)
  se escribió primero, en este repositorio, y el historial de git empieza con él.
- **No usa código, datos, documentos ni capturas de terceros.** Solo reutiliza código propio y público del autor (la
  validación de CUIT de su demo «Lector de facturas»).

## Documentos

| Documento | Contenido |
| --- | --- |
| [`docs/diseno.md`](docs/diseno.md) | Problema, usuarios, modelo de datos, reglas de negocio con su caso de prueba, datos ficticios, persistencia y seguridad. |
| [`docs/diseno-ui.md`](docs/diseno-ui.md) | Dirección visual, tokens, componentes con sus estados, pantallas a 360, 768 y 1280 px, accesibilidad. |
| [`docs/stack.md`](docs/stack.md) | Tecnología elegida, alternativas y criterio. |
| [`docs/plan.md`](docs/plan.md) | Pasos de implementación chicos y verificables. |
| [`docs/registro.md`](docs/registro.md) | Registro de cada paso: qué se hizo, qué se verificó y qué quedó pendiente. |

## Licencia

[MIT](LICENSE).
