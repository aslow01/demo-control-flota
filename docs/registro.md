# Registro

## 18/11/2026 — Etapa 1 completa y pasos 2.1 a 2.3 (trabajo autónomo)

**Qué se hizo.** Lógica de dominio en TypeScript puro y sin DOM, con TDD (cada archivo de pruebas se escribió y se vio
fallar antes que el código), datos de ejemplo con semilla y repositorio en memoria con su suite de contrato.

| Paso | Qué quedó | Archivos principales |
| --- | --- | --- |
| Base | `package.json` (typescript 7.0.2, vite 8.3.5, vitest 5.1.0, versiones exactas, sin Svelte), `tsconfig.json` estricto igual al de la Demo 1, scripts `test`, `test:tz`, `typecheck` | `package.json`, `tsconfig.json`, `vite.config.ts`, `scripts/test-tz.mjs` |
| 1.1 | Fechas civiles e instantes, T1 a T7 | `dominio/fechas.ts` |
| 1.2 | Clasificación de vencimientos, V1 a V8 (todos los bordes y la propiedad de −400 a 400) | `dominio/vencimientos.ts` |
| 1.3 | Documento vigente, requisitos, faltantes, orden por urgencia, V9, V12, V13, V16, V17 | `dominio/vencimientos.ts` |
| 1.4 | Patentes, U1 | `dominio/patente.ts` |
| 1.5 | Kilometraje, K1 a K4 y K6 a K9 (K5 se prueba en 1.9) | `dominio/kilometraje.ts` |
| 1.6 | Parte: P2, P4, P5, P9 a P11, P13, D11 (borrador vacío), advertencias K6, K7 y P9 | `dominio/parte.ts` |
| 1.7 | Aptitud, A1, A2, A8, y rótulos de novedades | `dominio/aptitud.ts`, `dominio/novedades.ts` |
| 1.8 | Alertas: los ocho tipos, gravedad, orden (V16, N5), exclusiones (V14, P6), resumen y puntos del horizonte | `dominio/alertas.ts` |
| 1.9 | Los 14 comandos con eventos exactos (H1), A3 a A7, K5, N1 a N3, P1 a P3, P7, P8, V10, V11, U1 a U7, D11, historial (H3, H4) e invariante A3 después de cada comando | `dominio/comandos.ts`, `estado.ts`, `historial.ts`, `validacion.ts` |
| 1.10 | Textos de errores, resúmenes de eventos y textos de estado de las pantallas, con singular y plural | `dominio/textos.ts` |
| 2.1 | `mulberry32`, primeros cinco valores de la semilla 20261118 fijados (calculados aparte con la implementación de referencia) | `datos/azar.ts` |
| 2.2 | Generador con los casos C01 a C20 (un test por caso), coherencia del ejemplo (protagonista 4, 19 de 23, 2/4/3/2, 6 de operación, 4 críticas), D1 con hash fijado, D3; también con otras fechas base | `datos/generador.ts`, `datos/cuit.ts` |
| 2.3 | Interfaz `Repositorio`, `RepositorioMemoria` y suite de contrato reutilizable (índices únicos, transacción única, falla inyectada sin cambios a medias, historial solo de agregado comprobado por `tsc`) | `persistencia/repositorio.ts`, `persistencia/memoria.ts`, `tests/contrato-repositorio.ts` |

**Verificación.**

- `npm test`: 438 tests en 19 archivos, todos verdes (antes: 0, el repositorio solo tenía el diseño).
- `npm run test:tz`: los mismos 438 en las tres zonas (`UTC`, `Asia/Tokyo`, `America/Los_Angeles`). Un test
  (`tests/zona-horaria.test.ts`) comprueba que la zona pedida de verdad está activa, para que la matriz no pruebe nada en falso.
- `npx tsc --noEmit`: sin errores. No hay `npm run build` todavía: no hay aplicación (queda para la Etapa 3, con Svelte).
- Búsqueda en `src/`: ninguna llamada a métodos locales de `Date`, ningún constructor `new Date(...)`, ningún uso del azar del
  sistema ni `toLocale`. El dominio usa `Date.UTC`, `Date.parse` e `Intl.DateTimeFormat` con zona explícita.
- Búsqueda de nombres reales, dominios o correos en todo el repositorio (sin `node_modules`, `dist` ni `.git`): sin resultados.
- Generar la flota completa (24 unidades, 1.044 partes, 1.112 eventos) tarda unos 14 ms en Node, medido como promedio de 20 corridas.
- Mutación de prueba: si `RepositorioMemoria.escribir` confirma antes de validar, fallan 5 tests de la suite de contrato.
- `npm audit`: 5 altas, todas por `picomatch` (ReDoS en extglobs, GHSA-fc5q-39xc-vjpf), sin versión corregida publicada.
  Es la misma excepción de la Demo 1; son herramientas de desarrollo y no entran en el paquete. Volver a mirar cuando salga el parche.

**Decisiones que no estaban en el diseño.** Están todas en `docs/diseno.md`, sección 16. Las que más pesan:
`nuevoId` en el contexto; gravedad `critica`/`media`/`baja`; categorías de aptitud (fuera de servicio se cuenta aparte);
línea de tiempo de kilometraje con desempate por instante cuando una corrección cae el mismo día que un parte; P9 evaluado a la
fecha del parte con el documento vigente de hoy; borradores con el texto sin recortar hasta enviar; definición de "borrador
vacío" para D11; `resolverNovedad` con `volverAServicio` reutilizando A4; guardas de V9 y V10 en `corregirDocumento`;
"24 unidades" = 23 activas + 1 de baja.

**Huecos o contradicciones del diseño encontrados.**

1. "24 unidades (14 + 4 + 3 + 2 + 1 de baja)" suman 24 solo si la de baja se cuenta aparte (23 activas); coincide con "19 de 23".
2. P5 dice que un borrador anterior a hoy "se puede completar y enviar mientras cumpla P2", pero la alerta no desaparece
   cuando el borrador pasa de 7 días: queda hasta que se descarta. P2 también impide guardar cambios en ese borrador.
3. K3 y K5 no dicen qué pasa si la corrección "desde F" cae el mismo día que un parte: se resolvió por instante
   (la corrección cuenta como anterior para el parte de F).
4. P9 no aclara si el documento se mira "como estaba entonces" o "como está hoy": se usa el vigente de hoy (V9).
5. `diseno.md` 5.1 llama "Revisión técnica (VTV/RTO)" al documento y la sección 7 lo escribe "Revisión técnica": se usa el
   corto en las alertas y las siglas se dejan para la interfaz.
6. A8 habla de unidades que "no pueden salir" y de unidades "fuera de servicio" como dos grupos; A1 define "no puede salir"
   para las dos. `aptitud` devuelve las dos categorías por separado.
7. El diseño dice "reloj inyectado `ahora: () => Date`" y el contexto de comandos `{ hoy, ahora, autor }`: el dominio recibe el
   resultado ya calculado (`hoy` y `ahora` como texto) y el reloj (Etapa 3) será el único lugar con `new Date()`.
8. V11 fija el piso del vencimiento en 2000-01-01, pero T4 ya rechaza años anteriores a 2000: el piso no tiene mensaje propio.
9. `stack.md` pide `npm run check` (`svelte-check`) y `npm run build`: todavía no existen porque falta la decisión S1.

**Lo que falta.**

- Paso 2.4 (IndexedDB con la misma suite de contrato), que necesita la decisión S2 (`fake-indexeddb`).
- Pasos 2.5 y 2.6 (arranque D4 a D8 y D11, aviso entre pestañas D9): dependen de 2.4 para las pruebas con la fábrica real, pero
  se pueden empezar contra `RepositorioMemoria`.
- Etapa 0 (Svelte, CSP, CI) y Etapas 3 a 6: esperan las decisiones S1 a S4.
- Revisión de `revisor-codigo` sobre `dominio/` (el plan la pide después del paso 1.2) y de `redactor-ux` sobre `textos.ts`.
- Verificar antes de publicar el dato de la serie de patentes (todas empiezan con Z) y que los nombres de proyectos no
  coincidan con proyectos mineros reales.
