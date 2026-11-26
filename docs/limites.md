# Límites, bordes de las reglas y detalle de la verificación

Este documento reúne lo que el [README](../README.md) resume: los bordes de cada regla, los límites menores, el detalle de lo que se probó y de los datos ficticios. Las pantallas están en [`pantallas.md`](pantallas.md) y cada regla con su caso de prueba, en [`diseno.md`](diseno.md), sección 6.

Las cifras de este documento se midieron el 22/11/2026 salvo que se indique otra fecha. Lo que dice «navegador» y «axe-core» en la sección 3 es de la interfaz anterior al porte a la interfaz «tipo app» del 25/11/2026 (Inicio, Movilidades, Vencimientos, Operación diaria, Hoy): se repite en la revisión final de ese porte.

## 1. Bordes de cada regla

- **Vencimientos con fecha y regla:** cada documento tiene un vencimiento y la aplicación lo clasifica (vencido, vence en 7, 15 o 30 días, vigente). Un documento renovado reemplaza al anterior, que queda en el historial.
- **Parte diario del conductor, en dos pasos:** antes de salir, la **revisión** (kilometraje de salida, catorce puntos de la unidad y otra novedad, si la hay); al volver, el **cierre** (kilometraje final y combustible). Se guarda como borrador mientras se escribe. Una falla crítica en la revisión deja la unidad fuera de servicio antes de que salga. De los 14 puntos, 7 son críticos; cuatro son de minería (decisión de Matías del 22/11/2026): pértiga con banderola y baliza y alarma de retroceso (críticos), calzas y kit antiderrame y radio (no críticos).
- **Licencia de conducir que bloquea:** sin una licencia vigente para la fecha del parte, el conductor no puede enviar la revisión. No hay un aviso que se pueda aceptar: el envío se rechaza hasta que el encargado cargue una licencia vigente o tome el parte otro conductor.
- **La documentación de la unidad bloquea (P21, decisión de Matías del 22/11/2026):** si a la fecha del parte la unidad tiene un documento obligatorio vencido o faltante, la revisión no se envía, igual que con la licencia. El conductor ve «No se puede cargar este parte» con el motivo y la indicación de avisar al encargado; el encargado ve qué renovar. El borrador se conserva y se puede enviar cuando se renueve la documentación. Hasta ese día la demo dejaba enviar con un aviso y registraba que la unidad había circulado con documentación vencida; esa alerta ya no existe.
- **Cerrar antes:** si la unidad tiene un parte anterior sin cerrar, no se empieza la revisión de hoy: primero se cierra ese parte. Sin esta regla, la revisión de hoy arrancaría con el kilometraje de salida de ayer y el cierre de ayer ya no podría registrar el recorrido real. Quien no tiene licencia vigente igual puede cerrar un parte anterior. Lo mismo vale para el conductor: con un parte sin cerrar en otra unidad, no envía la revisión de una unidad nueva hasta cerrarlo (una unidad por conductor).
- **Hasta mañana:** si hay una novedad crítica de hoy, la unidad no vuelve a salir ese día, aunque se repare. Vale tanto para la que informa el conductor en la revisión como para la que el encargado carga a mano como «Impide usar la unidad». Hay un solo parte por unidad y por día, y Movilidades, la ficha e Inicio muestran «Sin salida hasta mañana». Es una regla conservadora, no un límite técnico.
- **Aptitud para salir:** cada unidad aparece como «Disponible» o «Bloqueada» (por documentos) según sus documentos, o como «Fuera de servicio» (por una novedad crítica o por decisión del encargado); «No disponibles hoy» suma las bloqueadas y las fuera de servicio. La aptitud se calcula siempre; no se guarda ni se edita a mano. La licencia es del conductor, no de la unidad: la unidad de un conductor sin licencia puede salir con otro conductor. «Disponible» describe la aptitud de la unidad: no asegura que hoy se pueda empezar su revisión (con un parte anterior sin cerrar, o con una novedad crítica ya informada hoy, no se puede).

## 2. Límites menores

- **Pestañas desactualizadas:** si el navegador no tiene `BroadcastChannel`, una pestaña abierta antes no se entera de los cambios hechos en otra. Donde sí lo tiene, la pestaña vieja pasa a solo lectura hasta que se actualiza.
- **Requisitos simplificados:** sin exenciones de revisión técnica ni clases de licencia (la licencia vale o no vale, sin distinguir qué categoría de vehículo habilita).
- **Un registro de parte por unidad y por día, con dos envíos:** la revisión y el cierre son dos envíos sobre el mismo registro. No hay turnos ni relevos de conductor dentro del mismo día. Una jornada que cruza la medianoche pertenece a la fecha de su revisión, y la licencia se mira para esa fecha.
- **«Sin cerrar» desde las 00:00:** el modelo es por fecha y no tiene turnos ni relevos. Un parte en uso de una jornada que cruza la medianoche figura como «sin cerrar» en las alertas desde las 00:00 del día siguiente, aunque su fecha siga siendo la de la revisión; la demo no distingue una jornada en curso de un cierre olvidado.
- **Una revisión o un cierre enviados no se editan ni se reabren:** la revisión de un parte en uso no se modifica y un parte cerrado queda en solo lectura. Un borrador de revisión sí se descarta.
- **El cierre no pregunta por fallas durante el uso (decisión de alcance del 22/11/2026):** una falla que aparece a mitad de la jornada no tiene campo propio en el cierre. El conductor avisa y el encargado la carga con «Cargar novedad».
- **La licencia bloquea también partes de días pasados:** si el conductor no tenía licencia vigente el día del parte, la revisión de ese día tampoco se envía. Queda la alerta «Sin parte de ayer» o «Parte sin enviar», no un registro de que manejó sin licencia.
- **La habilitación de manejo del proyecto sigue siendo opcional:** exigirla cuando el proyecto pide habilitación de ingreso está pendiente de una próxima tanda. (Decisión del 22/11/2026: queda como límite; se puede sumar después.)
- **Imprimir o guardar el parte en PDF:** previsto, todavía no está.
- **Fotos en el parte (próximo paso):** el papel no deja evidencia y la demo todavía tampoco; adjuntar una foto a una novedad es lo siguiente que se va a sumar.
- **Otros extras sin hacer:** fecha de consulta simulada y modo sin conexión.
- **Contraste de un color de la paleta de neutros (`--c-neutro-r`):** era un hallazgo menor y quedó corregido en el modo claro (`#737980`, B8); consta en [`registro.md`](registro.md).
- **Escribir y recargar en menos de 500 ms puede perder lo último:** el parte se guarda 500 ms después de la última tecla (y al salir del campo, al enviar o al irse de la pantalla). Guardar en IndexedDB requiere varias idas y vueltas con el navegador y una recarga no las espera. Se probó otra forma de guardado al cerrar la página y no alcanzó.

## 3. Qué se verificó, en detalle

**Probado en un navegador** (Chromium con Playwright, contra la compilación servida con la CSP real; detalle en [`registro.md`](registro.md), entrada del 22/11/2026): el recorrido completo del conductor con teclado (revisión, aviso antes de enviar, resultado, cierre y vuelta al inicio), el caso de la novedad crítica, el caso de la conductora sin licencia (inicio del conductor y renovación de la licencia como encargado) y el encargado con el selector de conductor, a 320, 360, 768 y 1280 px, en modo claro y oscuro: sin desbordes, sin controles pulsables de menos de 44 px, sin mensajes en la consola y sin violaciones de CSP. Los guiones de Playwright no están en este repositorio: estas comprobaciones salen del registro y no se pueden reproducir con un comando del repositorio.

**Accesibilidad medida con axe-core** (auditoría del 22/11/2026 de la etapa 7, sobre 36 pantallas o estados): 180 escaneos, 0 violaciones (144 en 1280 y 360 px, en modo claro y oscuro, más 36 a 360 px con el texto al 200 %). También se midieron los contrastes de texto (0 fallas) y el tamaño de los controles (ninguno baja de 44 px). Con el texto al 200 % a 360 px, en «Mis últimos partes» la fecha, la patente y el kilometraje no se superponen (0 px) y ninguna de las 36 pantallas se desplaza en horizontal (0 px). El informe de esa auditoría es interno (no publicado), igual que los guiones de Playwright: no se puede reproducir con un comando.

**Texto al 200 %:** con el texto al 200 % y a 320 px de ancho, la página no se desplaza en horizontal. En la medición del registro previa a P21 (432 combinaciones) quedaba un solo caso, la etiqueta «Circuló con documentación vencida» del antiguo centro de alertas (hoy Inicio), que se partía dentro de una palabra; esa alerta ya no existe. La última medición (22/11/2026, 38 pantallas y estados por claro y oscuro por 320, 360, 768 y 1280 px, y 320 y 360 con el texto al 200 %: 456 combinaciones) dio 0 desbordes, 0 palabras partidas y 0 controles de menos de 44 px.

**No se probó:**

- axe-core y el zoom se midieron una sola vez, el 22/11/2026: no se repiten con cada cambio de interfaz;
- un lector de pantalla real (los avisos llevan su rol, pero el anuncio real no se escuchó);
- Firefox ni Safari;
- una pantalla táctil real (solo emulación y clics de mouse);
- las transiciones entre pantallas fuera de Chromium (View Transitions; en otros navegadores entra una animación CSS que no se miró), ni con un lector de pantalla: la cuenta de la cifra de Inicio deja el valor final en un texto aparte para lectores, pero no se escuchó;
- axe-core, el texto al 200 % y las pruebas destructivas sobre la interfaz «tipo app»: pendientes de la revisión final del porte (etapa 5);
- el modo de contraste alto de Windows (solo colores forzados emulados).

**Integración continua:** el archivo `.github/workflows/ci.yml` corrió por primera vez el 25/11/2026, al publicar el repositorio, y pasó (según el README). Las cifras de este documento y del README salen de corridas locales, no de ella; desde el porte a la interfaz «tipo app» el flujo también controla el tope de JavaScript de la carga inicial (`npm run peso`).

**Sin pruebas automáticas de las pantallas:** las pruebas cubren las reglas, el generador, la persistencia y el estado; las pantallas se verificaron a mano y con guiones que no forman parte del repositorio.

## 4. Datos ficticios, en detalle

Todo lo que se ve es inventado y se genera con una semilla fija, de modo que la flota de ejemplo es siempre la misma:

- **Empresa:** «Logística Andina Demo S.A.». Su CUIT es ficticio pero tiene dígito verificador válido (lo exige el generador), así que podría coincidir con el de un contribuyente real. Por eso la aplicación siempre lo muestra junto a la palabra «ficticio».
- **Unidades:** 24 (14 camionetas, 4 utilitarios, 3 camiones livianos, 2 minibuses y 1 dada de baja), 24 conductores (16 con unidad asignada y 8 de relevo, que conducen por turnos las unidades sin conductor asignado) y una encargada, con partes de los 45 días anteriores. Nadie tiene dos partes el mismo día (lo comprueba una prueba automática).
- **Patentes:** con formato argentino y en una serie elegida para que no se parezca a la de vehículos reales: todas empiezan con `Z`. **Falta verificar** qué series se emitieron realmente; hasta entonces, no se afirma que sean inexistentes.
- **Nombres:** personas, proyectos, aseguradoras, plantas de revisión y números de documento, inventados (los de póliza llevan el prefijo `DEMO-`). Falta verificar que los nombres de proyectos no coincidan con proyectos reales.
- **Fechas relativas a hoy:** el generador planta casos conocidos a distancias fijas de la fecha de hoy (un seguro vencido ayer, una revisión que vence hoy, otra dentro de 30 días, un borrador sin enviar, etc.). Con el ejemplo recién cargado aparecen 4 unidades en «No disponibles hoy», 3 documentos vencidos o faltantes (un seguro, una habilitación de ingreso que falta y la licencia de la conductora sin licencia), 9 vencimientos próximos (4 en hasta 7 días, 3 entre 8 y 15 y 2 entre 16 y 30; 12 en total con los vencidos), una insignia de 4 en Inicio, 5 pendientes de operación y 1 conductor que no puede manejar hoy. Una prueba automática fija esos valores (`tests/generador.test.ts`).
