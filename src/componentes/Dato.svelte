<script lang="ts">
  // 5.11 "Solo lectura": un dato que no se edita (parte enviado, datos de la unidad) se muestra como texto con su etiqueta,
  // sin caja. No se usan campos deshabilitados para esto.
  import type { Snippet } from "svelte";

  let {
    etiqueta,
    valor,
    children,
  }: {
    etiqueta: string;
    /** Valor en texto simple; si hace falta marcado (una patente, una etiqueta de estado), va como contenido. */
    valor?: string;
    children?: Snippet;
  } = $props();
</script>

<div class="dato">
  <dt>{etiqueta}</dt>
  <dd>{#if children !== undefined}{@render children()}{:else}{valor ?? ""}{/if}</dd>
</div>

<style>
  /* Pie de rey (15.5.9): rótulo en técnica de 12 px y mayúsculas, valor de 14 px y peso 600. Sin estados. */
  .dato {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    min-width: 0;
  }
  dt {
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 500;
    letter-spacing: 0.06em;
    line-height: 1.3;
    text-transform: uppercase;
    color: var(--c-tinta-3);
  }
  dd {
    margin: 0;
    color: var(--c-tinta);
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.5;
  }
</style>
