<script lang="ts">
  // 5.7 Etiqueta de estado: rectángulo con ícono de forma distinta y texto. El color nunca va solo.
  // Los colores salen del tono (`data-tono`, definido en base.css). El texto va como contenido: <Etiqueta ...>Vence en 6 días</Etiqueta>.
  import type { Snippet } from "svelte";
  import Icono from "./Icono.svelte";
  import type { NombreIcono, Tono } from "./tipos.ts";

  let {
    tono,
    icono,
    children,
  }: {
    tono: Tono;
    icono: NombreIcono;
    children: Snippet;
  } = $props();
</script>

<span class="etiqueta" data-tono={tono}><Icono nombre={icono} />{@render children()}</span>

<style>
  .etiqueta {
    --icono-tam: 0.875rem;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 1.5rem;
    padding: 0 0.5rem;
    /* El borde es transparente: solo se ve en colores forzados, donde el fondo desaparece. */
    border: 1px solid transparent;
    border-radius: var(--r-1);
    background: var(--tono-f);
    color: var(--tono-t);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.2;
    vertical-align: middle;
    /* Un solo renglón: las columnas se dimensionan para que la etiqueta entre entera. */
    white-space: nowrap;
  }
</style>
