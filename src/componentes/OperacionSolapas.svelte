<script lang="ts" module>
  /** El `id` del enlace de cada solapa: la pantalla le devuelve el foco ahí cuando la fila que lo tenía desaparece (resolver una novedad). */
  export function idDeSolapa(id: string): string {
    return `solapa-${id}`;
  }
</script>

<script lang="ts">
  // Las dos solapas de Operación diaria (Partes y Novedades): son ENLACES (cada una es una ruta, `#/operacion/partes` y `#/operacion/novedades`), no pestañas con roles de
  // `tablist`: la elegida lleva `aria-current="page"`, Tab recorre las dos y Enter navega. Pestañas de archivo como las de la ficha: la elegida es del color de la hoja, lleva una barra
  // de tinta arriba y el corte en diagonal a la derecha. El número es la cuenta de pendientes (en tono crítico si hay una novedad crítica); un lector de pantalla lo oye con palabras.
  import type { PanelSolapaOperacion } from "../lib/estado/centro-alertas.ts";
  import { TEXTO_NAVEGACION } from "./textos-marco.ts";

  let {
    nombre,
    solapas,
    activa,
  }: {
    /** El nombre accesible de la navegación: «Operación diaria». */
    nombre: string;
    solapas: readonly PanelSolapaOperacion[];
    /** El id de la solapa elegida. */
    activa: PanelSolapaOperacion["id"];
  } = $props();

  /** «3 pendientes» (Partes) · «2 abiertas» (Novedades): lo mismo que dicen las insignias de la navegación. */
  function cuenta(s: PanelSolapaOperacion): string {
    return s.id === "partes" ? TEXTO_NAVEGACION.insignias.pendientes(s.cantidad) : TEXTO_NAVEGACION.insignias.abiertas(s.cantidad);
  }
</script>

<nav aria-label={nombre}>
  <ul class="solapas">
    {#each solapas as s (s.id)}
      <li>
        <a class="solapa" id={idDeSolapa(s.id)} href={s.href} aria-current={activa === s.id ? "page" : undefined}>
          {s.rotulo}
          <span class="n" class:critica={s.critica} aria-hidden="true">{s.cantidad}</span>
          <span class="solo-lectores">, {cuenta(s)}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  /* La fila se desplaza sola si no entran las dos (texto muy agrandado); no desplaza la página. Los 3 px de la barra y el borde de 1 px de la hoja se solapan con `margin-bottom: -1px`. */
  .solapas {
    --corte: 0.5rem;
    position: relative;
    z-index: 1;
    display: flex;
    gap: 2px;
    margin: 0 -2px -1px;
    padding: 4px 2px 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  li {
    flex: none;
  }
  .solapa {
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: var(--alto-tactil);
    padding: 0 calc(0.125rem + var(--corte)) 0 0.75rem;
    color: var(--c-texto-2);
    font-family: var(--t-familia-titulo);
    font-stretch: 75%;
    font-size: 1rem;
    font-weight: 650;
    text-decoration: none;
  }
  .solapa::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--c-superficie-2);
    border-radius: var(--r-2) 0 0 0;
    clip-path: polygon(0 0, calc(100% - var(--corte)) 0, 100% 100%, 0 100%);
  }
  @media (hover: hover) {
    .solapa:hover {
      color: var(--c-texto);
    }
    .solapa:hover::before {
      background: color-mix(in srgb, var(--c-superficie-2) 70%, var(--c-borde-fuerte));
    }
  }
  .solapa[aria-current="page"] {
    color: var(--c-texto);
  }
  .solapa[aria-current="page"]::before {
    background: var(--c-superficie);
    box-shadow: inset 1px 1px 0 var(--c-borde);
  }
  .solapa[aria-current="page"]::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0.625rem;
    right: calc(var(--corte) + 0.625rem);
    height: 3px;
    background: var(--c-tinta);
  }
  .solapa:focus-visible {
    outline-offset: -3px;
  }
  .n {
    display: inline-grid;
    place-items: center;
    min-width: 1.375rem;
    height: 1.25rem;
    padding: 0 0.375rem;
    border-radius: var(--r-pildora);
    background: var(--c-superficie-2);
    color: var(--c-texto-2);
    font-family: var(--t-familia);
    font-stretch: 100%;
    font-size: 0.8125rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .solapa[aria-current="page"] .n {
    background: var(--c-texto-2);
    color: var(--c-superficie);
  }
  .n.critica,
  .solapa[aria-current="page"] .n.critica {
    background: var(--c-critico-solido);
    color: var(--c-sobre-solido);
  }
  @media (forced-colors: active) {
    .solapa[aria-current="page"]::after {
      background: Highlight;
    }
    .n {
      border: 1px solid CanvasText;
    }
  }
</style>
