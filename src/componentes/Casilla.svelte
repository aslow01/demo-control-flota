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
  /* Pie de rey (15.5.7): caja de 20 px con borde de 1,5 px y esquinas de 2 px; marcada, fondo de tinta con la marca de verificación. El rótulo es parte del objetivo (44 px
     de alto). Sigue siendo la casilla nativa (teclado, foco y lectores salen solos): solo se le cambia la piel. */
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
    appearance: none;
    position: relative;
    flex: none;
    width: 1.25rem;
    height: 1.25rem;
    margin: 0;
    background: var(--c-hoja);
    border: var(--b-control) solid var(--c-control);
    border-radius: var(--r-1);
    cursor: pointer;
  }
  input:checked {
    background: var(--c-tinta);
    border-color: var(--c-tinta);
  }
  /* La marca: dos bordes de un rectángulo girado, en el color del texto sobre la tinta. */
  input:checked::after {
    content: "";
    position: absolute;
    left: 0.3125rem;
    top: 0.0625rem;
    width: 0.375rem;
    height: 0.6875rem;
    border: solid var(--c-sobre-tinta);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  @media (hover: hover) {
    input:hover:not(:disabled) {
      border-color: var(--c-tinta);
    }
  }
  input:disabled {
    background: var(--c-papel-2);
    border-color: var(--c-control);
    cursor: not-allowed;
  }
  .ayuda {
    padding-left: calc(1.25rem + var(--e-3));
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-tinta-2);
  }

  @media (forced-colors: active) {
    input {
      appearance: auto;
      forced-color-adjust: auto;
    }
    input:checked::after {
      display: none;
    }
  }
</style>
