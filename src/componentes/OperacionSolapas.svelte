<script lang="ts" module>
  /** El `id` del enlace de cada solapa: la pantalla le devuelve el foco ahí cuando la fila que lo tenía desaparece (resolver una novedad). */
  export function idDeSolapa(id: string): string {
    return `solapa-${id}`;
  }
</script>

<script lang="ts">
  // Las dos solapas de Operación diaria (Partes y Novedades): son ENLACES (cada una es una ruta, `#/operacion/partes` y `#/operacion/novedades`), no pestañas con roles de
  // `tablist`: la elegida lleva `aria-current="page"`, Tab recorre las dos y Enter navega. Pestañas de archivo (15.9.4): la elegida es del color de la hoja y lleva una barra
  // de tinta abajo. El número es la cuenta de pendientes (en tono crítico si hay una novedad crítica); un lector de pantalla lo oye con palabras.
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
  /* Pestañas de archivo del segmentado (15.9.4): enlaces de 36 px en escritorio y 44 por debajo de 64 rem. Caja lisa con borde de 1 px: la elegida sobre la hoja, con la barra de 3 px
     en tinta abajo (no en el pleno); la otra, sobre el papel-2. El número va en técnica. Nada de texto sobre el grano de la página. */
  .solapas {
    display: flex;
    gap: 0.375rem;
    /* El relleno deja lugar al anillo de foco (3 px + 2 de separación) y el margen negativo lo devuelve; si no entran las dos (texto muy agrandado) la fila se desplaza sola. */
    margin: calc(var(--e-2) * -1);
    padding: var(--e-2);
    overflow-x: auto;
    scrollbar-width: none;
  }
  li {
    flex: none;
  }
  .solapa {
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-control);
    padding: 0 var(--e-4);
    background: var(--c-papel-2);
    border: 1px solid var(--c-filete-medio);
    border-radius: var(--r-1) var(--r-1) 0 0;
    color: var(--c-tinta-2);
    font-size: var(--t-cuerpo);
    font-weight: 600;
    line-height: 1.2;
    text-decoration: none;
    white-space: nowrap;
  }
  @media (hover: hover) {
    .solapa:hover {
      border-color: var(--c-tinta);
      color: var(--c-tinta);
    }
  }
  .solapa[aria-current="page"] {
    background: var(--c-hoja);
    box-shadow: inset 0 -3px 0 var(--c-tinta);
    color: var(--c-tinta);
    font-weight: 700;
  }
  .n {
    display: inline-grid;
    place-items: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.3125rem;
    border: 1px solid var(--c-filete-medio);
    color: var(--c-tinta-2);
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  /* Con una novedad crítica el número es una placa roja lisa con texto blanco; el rombo y la palabra «críticas» los dice el texto de la fila. */
  .n.critica {
    background: var(--c-crit-relleno);
    border-color: var(--c-crit-relleno);
    color: var(--c-sobre-solido);
  }
  @media (forced-colors: active) {
    .solapa {
      border-color: CanvasText;
    }
    .solapa[aria-current="page"] {
      box-shadow: none;
      border-bottom: 3px solid Highlight;
    }
    .n {
      border-color: CanvasText;
    }
  }
</style>