<script lang="ts">
  // Un `details` con aspecto propio: el resumen mide 44 px de alto como mínimo, lleva una flecha dibujada (gira al abrir) y el foco se ve.
  // Lo usan «Anteriores (N)» de los documentos y los partes enviados del historial. El resumen es texto; el contenido, lo que se abre.
  import type { Snippet } from "svelte";

  let {
    resumen,
    suave = false,
    children,
  }: {
    resumen: string;
    /** El resumen con el peso y el tamaño del resto de la lista (el historial); si no, en negrita. */
    suave?: boolean;
    children: Snippet;
  } = $props();
</script>

<details class:suave>
  <summary>{resumen}</summary>
  <div class="contenido">{@render children()}</div>
</details>

<style>
  summary {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    list-style: none;
    cursor: pointer;
    font-weight: 600;
    line-height: 1.35;
    color: var(--c-texto);
  }
  .suave summary {
    font-size: var(--t-tabla);
    font-weight: 400;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  /* La flecha: dos bordes de un cuadrado girado (no hay un ícono de flecha hacia abajo en el sprite). */
  summary::before {
    content: "";
    flex: none;
    width: 0.5rem;
    height: 0.5rem;
    margin-inline: 0.25rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    rotate: -45deg;
    transition: rotate var(--m-rapido) var(--m-curva);
  }
  details[open] > summary::before {
    rotate: 45deg;
  }
  @media (hover: hover) {
    summary:hover {
      color: var(--c-acento);
    }
  }
  .contenido {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    padding: 0 0 var(--e-2) calc(0.5rem + 0.5rem + var(--e-2));
    font-size: var(--t-tabla);
    line-height: 1.4;
  }
</style>
