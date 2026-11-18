# CLAUDE.md — Demo 2: Control de flota

Demo propia del portafolio de Matías Ariel Ormeño (`D:\Matias Ariel Ormeño web Portafolio`, ficha en su
`docs/09-demos.md`). Diseño: `docs/diseno.md` y `docs/diseno-ui.md`. Tecnología: `docs/stack.md`. Pasos: `docs/plan.md`.

## Objetivo

Aplicación web, en el navegador, para controlar una flota ficticia: documentos con vencimiento, parte diario con
checklist desde el celular, centro de alertas (7, 15 y 30 días) e historial por unidad. IndexedDB con "Reiniciar demo".
En vivo, cuando esté, en `flota.matiasormeno.com.ar`.

## Qué NO hace

- No tiene servidor, login ni base de datos remota. Nada sale del navegador.
- No usa código, datos, documentos ni repositorios de terceros. **Sala limpia:** mientras se trabaja acá no se abren
  los repositorios ni los documentos de una empresa de terceros, ni los casos de estudio del portafolio, ni
  `material-de-terceros/`, y no se le pasan a la IA. Fuentes permitidas: estos documentos, la ficha de la demo y el código
  propio de la Demo 1 (`D:\demo-lector-facturas`).
- No usa datos reales (empresas, patentes, personas, proyectos mineros). Todo sale del generador con semilla.
- No dice en ningún texto que reproduce el sistema de una empresa.

## Entorno

- Windows 11, PowerShell 7. Node 24, npm 11, git, `gh` (`aslow01`).
- Stack recomendado (pendiente de OK, decisión S1): Vite + TypeScript + Svelte 5 sin SvelteKit. Dependencias con
  versión exacta y ≥ 14 días publicadas; sumar otra requiere justificarla (skill `seguridad-aplicada`).
- `npm run dev` en el puerto 5173 (si la Demo 1 está corriendo, Vite toma el siguiente libre).

## Respaldo

Repositorio git local (rama `main`). El remoto (privado hasta publicar) lo crea el hilo principal con Matías. Antes de
hacerlo público: revisar todo el historial (checklist `docs/13-publicacion-y-seguridad.md` del portafolio).

## Cómo se verifica

`npm run check`, `npm test` (con matriz de zonas horarias en CI), `npm run build` con la CSP real, `npm audit`, y la
verificación de `docs/diseno-ui.md` (sección 12). Búsquedas: sin `{@html}`, sin `Math.random` en `src/lib`, sin
nombres reales.

## Cómo se retoma

Leer este archivo, el `README.md`, `docs/plan.md` y la última entrada de `docs/registro.md` (se crea con el primer paso
de código). Conversación en rioplatense; **textos de la interfaz y README en español neutro**.
