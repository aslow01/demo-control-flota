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
  .dato {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    min-width: 0;
  }
  dt {
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-texto-2);
  }
  dd {
    margin: 0;
    color: var(--c-texto);
    line-height: 1.5;
  }
</style>
