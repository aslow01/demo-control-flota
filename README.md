# Control de flota (demo)

Aplicación web de demostración para el control de una flota de vehículos: documentos con vencimiento, parte diario
desde el celular, centro de alertas con lo que vence en 7, 15 y 30 días e historial por unidad. Funciona entera en el
navegador, con datos ficticios guardados en IndexedDB y un botón para reiniciar la demo. Sin servidor y sin login.

Forma parte del portafolio de Matías Ariel Ormeño.

## Estado: diseño y lógica (sin interfaz)

El diseño se escribió antes de cualquier línea de código. Desde el 18/11/2026 también están hechas la **lógica de dominio**
(`src/lib/dominio`, TypeScript puro y probado en tres zonas horarias), el **generador de datos de ejemplo**
(`src/lib/datos`) y el **repositorio en memoria** (`src/lib/persistencia`). Todavía no hay interfaz ni IndexedDB; el avance
está en [`docs/registro.md`](docs/registro.md). Documentos:

| Documento | Contenido |
| --- | --- |
| [`docs/diseno.md`](docs/diseno.md) | Problema, usuarios, modelo de datos, reglas de negocio con su caso de test, datos ficticios, persistencia y seguridad. |
| [`docs/diseno-ui.md`](docs/diseno-ui.md) | Dirección visual, tokens, componentes con sus estados, pantallas a 360, 768 y 1280 px, accesibilidad. |
| [`docs/stack.md`](docs/stack.md) | Tecnología elegida, alternativas y criterio. |
| [`docs/plan.md`](docs/plan.md) | Pasos de implementación chicos y verificables, con la lógica de vencimientos primero y con tests. |

Todavía no hay demo en vivo. Cuando la haya, estará en `flota.matiasormeno.com.ar`.

## Origen

- **Fecha de inicio:** 18/11/2026.
- Escrita **desde cero**, a partir de un enunciado propio de una página. El diseño (modelo de datos, pantallas y
  reglas) se escribió primero, en este repositorio, y el historial de git empieza con él.
- **Datos 100 % ficticios:** empresa inventada ("Logística Andina Demo S.A."), patentes con formato argentino
  y una serie elegida para que no se parezca a vehículos reales (todas empiezan con `Z`; falta verificar qué series se
  emitieron), personas, proyectos, aseguradoras y números de documento inventados, generados con una semilla fija.
- **El CUIT de la empresa también es ficticio:** tiene dígito verificador válido (lo exige el generador), así que podría
  coincidir con el de un contribuyente real. Por eso la aplicación siempre lo muestra con la palabra «ficticio».
- **No usa código, datos, documentos ni capturas de terceros.** Solo reutiliza código propio y público del autor (la
  validación de CUIT de su demo "Lector de facturas").

## Licencia

Pendiente (propuesta: MIT, como la demo "Lector de facturas").
