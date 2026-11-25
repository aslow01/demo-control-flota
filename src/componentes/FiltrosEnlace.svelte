<script lang="ts" generics="Id extends string">
  // ESQUELETO (E3-M, paso 0): pastillas de filtro que son enlaces (`aria-current="page"` en la elegida). Las usan Vencimientos y Movilidades; cambiar de filtro es
  // navegar a `href` (la consulta no mueve foco ni desplazamiento: lo garantiza el estado). Quien lo completa maqueta; el contrato de `props` no cambia.
  import Forma, { type FormaVisual } from "./Forma.svelte";
  import type { Tono } from "./tipos.ts";

  let {
    leyenda,
    opciones,
    valor,
  }: {
    /** El nombre accesible del grupo (`nav`): «Mostrar». */
    leyenda: string;
    opciones: { id: Id; etiqueta: string; cantidad: number; tono?: Tono | null; forma?: FormaVisual | null; href: string }[];
    /** El id elegido (lleva `aria-current`). */
    valor: Id;
  } = $props();
</script>

<nav class="filtros" aria-label={leyenda}>
  <ul>
    {#each opciones as o (o.id)}
      <li>
        <a href={o.href} aria-current={valor === o.id ? "page" : undefined} data-tono={o.tono ?? undefined}>
          {#if o.forma != null}<Forma forma={o.forma} tono={o.tono ?? undefined} />{/if}
          <span class="etiqueta">{o.etiqueta}</span>
          <span class="conteo num">{o.cantidad}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-2);
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    padding-inline: var(--e-3);
    color: var(--c-texto);
    text-decoration: none;
  }
  a[aria-current="page"] {
    font-weight: 700;
  }
</style>
