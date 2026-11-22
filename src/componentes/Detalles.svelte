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
  summary {
    display: flex;
    align-items: center;
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
  /* El texto lleva la flecha al principio de su primer renglón (sangría francesa): con el resumen partido en dos renglones la flecha queda en el primero y no entre los dos,
     y el bloque entero sigue centrado en los 44 px. */
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
    transition: rotate var(--m-rapido) var(--m-curva);
  }
  details[open] > summary .texto::before {
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
    padding: 0 0 var(--e-2) 1.5rem;
    font-size: var(--t-tabla);
    line-height: 1.4;
  }
  /* Texto agrandado (el parte mide 17 rem o menos): el contenido usa todo el ancho, sin la sangría de la flecha (S5 de la etapa 7). */
  @container parte (max-width: 17rem) {
    .contenido {
      padding-left: 0;
    }
  }
  @container interior (max-width: 17rem) {
    .contenido {
      padding-left: 0;
    }
  }
</style>
