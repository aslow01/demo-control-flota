# Control de flota (demo)

Aplicación web de demostración que responde, en una pantalla, a dos preguntas: **¿qué unidades no pueden salir hoy?
y ¿qué documentos vencen pronto?** Además, el conductor completa su parte diario desde el celular, en dos pasos y sin perder lo escrito.

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
- **Parte diario del conductor, en dos pasos:** antes de salir, la **revisión** (kilometraje de salida, diez puntos de la
  unidad y otra novedad, si la hay); al volver, el **cierre** (kilometraje final y combustible). Se guarda como borrador
  mientras se escribe. Una falla crítica en la revisión deja la unidad fuera de servicio antes de que salga.
- **Licencia de conducir que bloquea:** sin una licencia vigente para la fecha del parte, el conductor no puede enviar la
  revisión. No hay un aviso que se pueda aceptar: el envío se rechaza hasta que el encargado cargue una licencia vigente
  o tome el parte otro conductor.
- **Aptitud para salir:** cada unidad aparece como «Puede salir» o «No puede salir» según sus documentos, sus novedades
  críticas y si está fuera de servicio. La aptitud se calcula siempre; no se guarda ni se edita a mano. La licencia es del
  conductor, no de la unidad: la unidad de un conductor sin licencia puede salir con otro conductor.

## Qué se puede hacer en la demo

La barra «Ver como» cambia la perspectiva entre **Encargado** (perfil de entrada) y **Conductor**. Es una perspectiva,
no un control de acceso: no hay cuentas ni contraseñas.

| Pantalla | Perfil | Qué permite |
| --- | --- | --- |
| Centro de alertas | Encargado | Ver cuántas unidades no pueden salir hoy y qué conductores no pueden manejar hoy (sin licencia vigente), los vencimientos agrupados en 7, 15 y 30 días y los pendientes de operación (partes sin enviar o sin cerrar, unidades sin parte de ayer). Renovar o cargar un documento, incluida una licencia, desde la propia alerta. |
| Flota | Encargado | Buscar por patente o número interno, filtrar por estado y proyecto, ordenar y agregar una unidad nueva. Cada fila muestra el último parte («En uso» o «Sin cerrar», según el caso) y marca al conductor sin licencia vigente. |
| Ficha de la unidad | Encargado | Ver documentos, novedades, kilometraje (con las salidas en curso) e historial (la revisión y el cierre de cada parte). Renovar documentos, resolver novedades, poner la unidad fuera de servicio o devolverla a servicio, corregir el kilometraje, cambiar la asignación y dar de baja. |
| Inicio del conductor | Conductor | Ver en qué punto está el parte de hoy (sin empezar, borrador, en uso, cerrado o sin salida), los partes sin cerrar, el vencimiento de la propia licencia y los últimos partes. Si la licencia no está vigente, el aviso de bloqueo reemplaza al botón de empezar la revisión. Elegir otra unidad. |
| Parte diario, paso 1: revisión antes de salir | Conductor y Encargado | Completar kilometraje de salida, diez puntos de revisión y, si hace falta, otra novedad; guardado automático de borrador; aviso antes de enviar si falta documentación de la unidad o hay un salto de kilometraje. Al enviar, la unidad sale de servicio si hay una novedad crítica; si no, queda «En uso». |
| Parte diario, paso 2: cierre de la jornada | Conductor y Encargado | Completar kilometraje final y combustible, con el resumen de la revisión a la vista. Al cerrar, el parte queda en solo lectura. |

Todo cambio se refleja en las demás pantallas al instante: renovar un documento lo saca de las alertas, mejora el estado
en la flota y actualiza la insignia de la pestaña «Alertas». Una revisión con una novedad crítica en los frenos pone la
unidad fuera de servicio, la suma a «No pueden salir» y deja el parte cerrado sin salida (recorrido 0). Una revisión sin
novedades críticas deja la unidad «En uso» hasta que se cierra el parte. El botón **Reiniciar demo** (en la barra de la aplicación y en el
menú «Más») borra los cambios y vuelve a cargar la flota de ejemplo con las fechas de hoy.

## Cómo usarla

1. Abra la demo. Entra como Encargado, en el centro de alertas.
2. Pruebe renovar el seguro vencido de la unidad ZK 214 BD: la alerta desaparece y la unidad deja de figurar en
   «No pueden salir».
3. En el mismo centro de alertas, busque «Conductores que no pueden manejar hoy»: aparece una persona ficticia cuya
   licencia venció hace 3 días (caso C21).
4. En «Ver como», elija **Conductor** y esa misma persona (en la lista figura «Sin licencia vigente»). En lugar del botón
   para empezar la revisión, el inicio muestra que no puede manejar hoy y que debe avisar al encargado. Vuelva al perfil
   Encargado y pulse **Renovar** en esa fila: se carga una licencia vigente y la persona sale de la lista. Si repite el
   paso anterior con ella, ahora sí puede empezar la revisión.
5. Con otra persona ficticia, pulse **Empezar la revisión**, complete el kilometraje y los diez puntos, con una novedad
   crítica en los frenos, y envíe la revisión. La pantalla dice que la unidad no puede salir. Vuelva al perfil Encargado y
   verá la unidad en «No pueden salir».
6. Con otra persona y otra unidad, envíe una revisión sin novedades: el inicio muestra «En uso». Pulse **Cerrar el parte**,
   cargue el kilometraje final y el combustible y ciérrelo: el parte queda en solo lectura.
7. Para empezar de nuevo, use **Reiniciar demo**.

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
- **Tamaño medido (`npm run build`, 22/11/2026):** 394 KB de JavaScript (115 KB comprimido con gzip), 87 KB de CSS
  (14 KB con gzip) y 6 KB de HTML.
- **Accesibilidad:** pensada para el teclado, con foco visible, controles táctiles de 44 px como mínimo, modo claro y
  oscuro, colores forzados y anchos desde 320 px. Lo que se midió y lo que falta probar está más abajo.

## Cómo se usó la IA

Esta demo se hizo con IA y el repositorio lo muestra tal cual:

- **Matías Ariel Ormeño** propuso la demo y definió el problema: el parte en papel se daña, tarda en completarse y no
  deja evidencia. Definió el alcance (incluido lo que la demo no hace) y las reglas de operación: el encargado ve primero
  qué unidades no pueden salir y qué vence pronto; el conductor hace la revisión en el celular antes de salir y cierra el
  parte al volver; una unidad fuera de servicio o un conductor sin licencia vigente no salen. En las decisiones técnicas
  y de alcance comparó las alternativas que propuso la IA y eligió. Cada decisión figura con quién la tomó y cuándo en
  [`docs/diseno.md`](docs/diseno.md), sección 15, y en [`docs/stack.md`](docs/stack.md), sección 9.
- **Criterio de calidad:** pidió pruebas destructivas en cada etapa (intentar romper la aplicación, no solo recorrer el
  camino esperado) y que los errores se corrigieran antes de avanzar.
- **La IA (Claude, de Anthropic) propuso alternativas y escribió el código, las pruebas y los documentos.** Matías no
  escribió el código a mano.
- **El método:** primero se escribió el diseño (modelo de datos, reglas de negocio con un caso de prueba cada una,
  pantallas y accesibilidad); después un plan de pasos chicos ([`docs/plan.md`](docs/plan.md)); la lógica se hizo con
  pruebas primero (TDD: se escribe la prueba que falla y después el código que la hace pasar).
- **Los roles de `docs/`:** «programador», «QA», «revisor» y «auditor» son agentes de IA con un rol asignado, dirigidos
  por Matías; no son personas del equipo.
<!-- Falta (crítica R2): lo que Matías verificó en persona; la prueba en el celular está pendiente. -->
- **Revisiones:** al terminar cada etapa, agentes de IA con rol distinto revisaron el código, intentaron romper la
  aplicación (QA adversarial) y auditaron la accesibilidad. Sus hallazgos se corrigieron por gravedad. Son revisiones
  hechas también por IA, no por terceras personas.
- **Rastro verificable:** cada paso, cada decisión y lo que quedó sin hacer están en [`docs/registro.md`](docs/registro.md),
  y el historial de git cuenta la misma historia, con el diseño como primer commit.

## Cómo se verificó

Cifras medidas el 22/11/2026 sobre la rama `textos-etapa6` (a partir de `interfaz-etapa-0`):

| Comprobación | Comando | Resultado |
| --- | --- | --- |
| Pruebas automáticas | `npm test` | 1.489 pruebas en 56 archivos, todas pasan |
| Las mismas en tres zonas horarias | `npm run test:tz` | 1.489 pruebas en UTC, Asia/Tokio y América/Los Ángeles, todas pasan |
| Tipos | `npm run check` | 0 errores y 0 avisos en 335 archivos |
| Contraste de la paleta | `npm run contraste` | 174 mediciones, 0 fallan, 9 pasan por poco margen |
| Búsqueda de lo prohibido | `npm run buscar` | Sin hallazgos (8 reglas, 192 archivos): sin `{@html}`, sin `eval`, sin `Math.random` en `src/lib`, sin reloj del sistema fuera de `estado/reloj.ts` |
| Dependencias | `npm audit` | 0 vulnerabilidades |

**Probado en un navegador** (Chromium con Playwright, contra la compilación servida con la CSP real; detalle en
`docs/registro.md`, entrada del 22/11/2026): el recorrido completo del conductor con teclado (revisión, aviso antes de
enviar, resultado, cierre y vuelta al inicio), el caso de la novedad crítica, el caso C21 (inicio del conductor y
renovación de la licencia como encargado) y el encargado con el selector de conductor, a 320, 360, 768 y 1280 px, en modo
claro y oscuro: sin desbordes, sin controles pulsables de menos de 44 px, sin mensajes en la consola y sin violaciones de
CSP. Los guiones de Playwright no están en este repositorio: estas comprobaciones salen del registro y no se pueden
reproducir con un comando del repositorio.
<!-- revisar: las cifras del barrido anterior (24 pantallas y estados, 192 combinaciones, 0 violaciones de axe-core, zoom al 200 % y 400 % en el parte) eran de la versión de un solo envío y se retiraron. El registro del 22/11/2026 dice que axe-core y el zoom no se volvieron a medir con los dos pasos. Si Matías o `qa-destructor` los repiten, sumar las cifras nuevas aquí. -->

**No se probó:**

- axe-core ni el zoom al 200 % y al 400 % sobre los dos pasos del parte nuevos (no se repitieron tras el cambio);
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
- **Requisitos simplificados:** sin exenciones de revisión técnica ni clases de licencia (la licencia vale o no vale, sin
  distinguir qué categoría de vehículo habilita).
- **Un registro de parte por unidad y por día, con dos envíos:** la revisión y el cierre son dos envíos sobre el mismo
  registro. No hay turnos ni relevos de conductor dentro del mismo día. Una jornada que cruza la medianoche pertenece a la
  fecha de su revisión, y la licencia se mira para esa fecha.
- **Una revisión o un cierre enviados no se editan ni se reabren:** la revisión de un parte en uso no se modifica y un parte
  cerrado queda en solo lectura. Un borrador de revisión sí se descarta.
- **Sin pruebas automáticas de las pantallas:** las pruebas cubren las reglas, el generador, la persistencia y el estado;
  las pantallas se verificaron a mano y con guiones que no forman parte del repositorio.
- **El cierre no pregunta por fallas durante el uso (decisión de alcance del 22/11/2026):** una falla que aparece a mitad
  de la jornada no tiene campo propio en el cierre. El conductor avisa y el encargado la carga con «Cargar novedad».
- **La documentación de la unidad no bloquea la revisión (decisión de alcance del 22/11/2026):** un seguro vencido, por
  ejemplo, genera un aviso que el conductor puede aceptar y queda registrado que la unidad salió con documentación vencida.
  Solo la licencia del conductor bloquea. Es una asimetría elegida, y cambiarla es sustituir ese aviso por un bloqueo como el
  de la licencia.
- **La licencia bloquea también partes de días pasados:** si el conductor no tenía licencia vigente el día del parte, la
  revisión de ese día tampoco se envía. Queda la alerta «Sin parte de ayer» o «Parte sin enviar», no un registro de que
  manejó sin licencia.
- **La habilitación de manejo del proyecto sigue siendo opcional:** exigirla cuando el proyecto pide habilitación de ingreso
  está pendiente de una próxima tanda.
- **Imprimir o guardar el parte en PDF:** previsto, todavía no está.
- **Fotos en el parte (próximo paso):** el papel no deja evidencia y la demo todavía tampoco; adjuntar una foto a una
  novedad es lo siguiente que se va a sumar.
- **Otros extras sin hacer:** fecha de consulta simulada y modo sin conexión.
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
  aparecen 4 unidades en «No pueden salir», 3 documentos vencidos o faltantes (un seguro, una habilitación de ingreso que
  falta y la licencia de la persona del caso C21), 9 vencimientos próximos (4 en hasta 7 días, 3 entre 8 y 15 y 2 entre
  16 y 30; 12 en total con los vencidos), 5 alertas críticas y 1 conductor que no puede manejar hoy. Una prueba automática
  fija esos valores (`tests/generador.test.ts`).

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
