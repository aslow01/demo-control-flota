<script lang="ts">
  // Casilla de verificación (5.11): un sí o un no con su etiqueta a la derecha y, debajo, la nota que explica qué pasa si se marca.
  // La etiqueta es parte del área que se toca (44 px de alto como mínimo). Usa la casilla nativa: teclado, foco y lectores salen solos.
  import type { Snippet } from "svelte";

  let {
    etiqueta,
    marcada = $bindable(false),
    id,
    ayuda = "",
    children,
  }: {
    etiqueta: string;
    marcada?: boolean;
    /** Id del control (para el resumen de errores o para enlazar la ayuda). Si no se da, se genera uno. */
    id?: string;
    /** La nota que explica qué cambia al marcarla. */
    ayuda?: string;
    /** Contenido extra debajo de la nota (un aviso). */
    children?: Snippet;
  } = $props();

  const uid = $props.id();
  const idControl = $derived(id ?? `${uid}-casilla`);
  const idAyuda = $derived(`${idControl}-ayuda`);
</script>

<div class="casilla">
  <label for={idControl}>
    <input id={idControl} type="checkbox" bind:checked={marcada} aria-describedby={ayuda !== "" ? idAyuda : undefined} />
    <span>{etiqueta}</span>
  </label>
  {#if ayuda !== ""}<p class="ayuda" id={idAyuda}>{ayuda}</p>{/if}
  {@render children?.()}
</div>

<style>
  .casilla {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    min-width: 0;
  }
  label {
    display: flex;
    align-items: center;
    gap: var(--e-3);
    min-height: var(--alto-tactil);
    font-weight: 600;
    line-height: 1.4;
    cursor: pointer;
  }
  input {
    flex: none;
    width: 1.375rem;
    height: 1.375rem;
    margin: 0;
    accent-color: var(--c-acento);
    cursor: pointer;
  }
  .ayuda {
    padding-left: calc(1.375rem + var(--e-3));
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto-2);
  }
</style>
