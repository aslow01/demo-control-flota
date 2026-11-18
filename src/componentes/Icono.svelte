<script lang="ts">
  // Un ícono del sprite de index.html. Decorativo: el texto que lo acompaña es el que se lee (aria-hidden).
  // El tamaño se cambia desde afuera con la propiedad --icono-tam (por defecto 1.25rem).
  import type { NombreIcono } from "./tipos.ts";

  let { nombre }: { nombre: NombreIcono } = $props();
</script>

<svg class="icono" aria-hidden="true" focusable="false"><use href={`#i-${nombre}`} /></svg>

<style>
  .icono {
    flex: none;
    width: var(--icono-tam, 1.25rem);
    height: var(--icono-tam, 1.25rem);
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
    vertical-align: middle;
  }
</style>
