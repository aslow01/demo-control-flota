# CLAUDE.md — Demo 2: Control de flota

Demo propia del portafolio de Matías Ariel Ormeño (la ficha vive en el repositorio privado del portafolio).
Diseño: `docs/diseno.md` y `docs/diseno-ui.md`. Tecnología: `docs/stack.md`. Pasos: `docs/plan.md`.

## Objetivo

Aplicación web, en el navegador, para controlar una flota ficticia: documentos con vencimiento, parte diario con
checklist desde el celular, centro de alertas (7, 15 y 30 días) e historial por unidad. IndexedDB con "Reiniciar demo".
En vivo, cuando esté, en `flota.matiasormeno.com.ar`.

## Qué NO hace

- No tiene servidor, login ni base de datos remota. Nada sale del navegador.
- No usa código, datos, documentos ni repositorios de terceros. **Sala limpia:** mientras se trabaja acá no se abren
  ni se le pasan a la IA repositorios, documentos ni material de terceros, ni los casos de estudio del portafolio.
  Fuentes permitidas: estos documentos, la ficha de la demo y el código
  propio de la Demo 1 (Lector de facturas, otro repositorio propio).
- No usa datos reales (empresas, patentes, personas, proyectos mineros). Todo sale del generador con semilla.
- No se presenta, en ningún texto, como copia o adaptación de un sistema existente: es un proyecto propio.

## Entorno

- Windows 11, PowerShell 7. Node 24, npm 11, git, `gh` (`aslow01`).
- Stack (decisión S1 de Matías, 18/11/2026): Vite + TypeScript + Svelte 5 sin SvelteKit. Dependencias con
  versión exacta y ≥ 14 días publicadas; sumar otra requiere justificarla (skill `seguridad-aplicada`).
- `npm run dev` en el puerto 5173 (si la Demo 1 está corriendo, Vite toma el siguiente libre).

## Respaldo

El repositorio remoto es privado y sigue así hasta que se cumplan dos condiciones: revisar todo el historial (nombres de
terceros y correos de autor, no solo los archivos actuales) y que `main` tenga la versión final. Recién entonces se pasa a
público, con la aprobación de Matías (es irreversible).

## Cómo se verifica

`npm run check`, `npm test` (con matriz de zonas horarias en CI), `npm run build` con la CSP real, `npm audit`, y la
verificación de `docs/diseno-ui.md` (sección 12). Búsquedas: sin `{@html}`, sin `Math.random` en `src/lib`, sin
nombres reales.

## Cómo se retoma

Leer este archivo, el `README.md`, `docs/plan.md` y la última entrada de `docs/registro.md`. Conversación en rioplatense; **textos de la interfaz y README en español neutro**.
