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
  <summary><span class="texto">{resumen}</span></summary>
  <div class="contenido">{@render children()}</div>
</details>

<style>
  /* Pie de rey (15.5.9): el resumen mide `--alto-control` (36 px; 44 por debajo de 64 rem), con texto de 13 px y peso 600 en el color del enlace; la flecha gira 90° al abrir y el
     contenido lleva un filete a la izquierda. Estados: cerrado, abierto, cursor encima (subrayado) y foco (el anillo general). */
  summary {
    display: flex;
    align-items: center;
    min-height: var(--alto-control);
    list-style: none;
    cursor: pointer;
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.35;
    color: var(--c-pleno-texto);
  }
  .suave summary {
    font-size: var(--t-tabla);
    font-weight: 400;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  /* El texto lleva la flecha al principio de su primer renglón (sangría francesa): con el resumen partido en dos renglones la flecha queda en el primero y no entre los dos,
     y el bloque entero sigue centrado en el alto del resumen. */
  .texto {
    display: block;
    min-width: 0;
    padding-left: 1.5rem;
    text-indent: -1.5rem;
  }
  /* La flecha: dos bordes de un cuadrado girado (no hay un ícono de flecha hacia abajo en el sprite). Mide 0,5 rem y ocupa 1,5 rem con sus márgenes. */
  .texto::before {
    content: "";
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    margin-left: 0.25rem;
    margin-right: 0.75rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    rotate: -45deg;
    text-indent: 0;
    vertical-align: 0.05em;
    transition: rotate var(--m-medio) var(--m-curva);
  }
  details[open] > summary .texto::before {
    rotate: 45deg;
  }
  @media (hover: hover) {
    summary:hover .texto {
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 3px;
    }
  }
  .contenido {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    margin-left: 0.4375rem; /* el filete cae bajo el centro de la flecha */
    padding: var(--e-1) 0 var(--e-2) 1rem;
    border-left: 1px solid var(--c-filete-medio);
    font-size: var(--t-tabla);
    line-height: 1.4;
  }
  /* Texto agrandado (el parte mide 17 rem o menos): el contenido usa todo el ancho, sin la sangría de la flecha (S5 de la etapa 7). */
  @container parte (max-width: 17rem) {
    .contenido {
      margin-left: 0;
      padding-left: 0;
      border-left: 0;
    }
  }
  @container interior (max-width: 17rem) {
    .contenido {
      margin-left: 0;
      padding-left: 0;
      border-left: 0;
    }
  }
</style>
