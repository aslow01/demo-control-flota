<script lang="ts">
  // "Demo con datos ficticios" (4.1): rótulo con borde fino. Va en la barra superior y, con poco ancho, arriba del h1 de cada pantalla.
  import { TEXTO_MARCO } from "./textos-marco.ts";
</script>

<span class="etiqueta-demo rotulo">{TEXTO_MARCO.etiquetaDemo}</span>

<style>
  .etiqueta-demo {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-1);
    color: var(--c-texto-2);
    white-space: nowrap;
  }
</style>
