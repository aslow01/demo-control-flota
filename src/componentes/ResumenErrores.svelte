<script lang="ts">
  // 5.15 Resumen de errores (patrón GOV.UK): panel arriba del formulario con borde izquierdo crítico, un título y una lista de enlaces a cada
  // campo con su mensaje, en el orden del formulario. No es `role="alert"`: es un `div` con `tabindex="-1"` al que quien lo usa le da el foco
  // cuando aparece (`enfocar()`). Los enlaces mueven el foco al campo sin tocar la dirección de la página (el enrutador lee el hash).
  import Icono from "./Icono.svelte";

  let {
    titulo,
    items,
    general = "",
  }: {
    titulo: string;
    /** `campoId` es el id del control al que lleva el enlace. */
    items: { campoId: string; mensaje: string }[];
    /** Un error que no es de ningún campo (la fecha ya no vale, no se pudo guardar): va como texto, antes de la lista. */
    general?: string;
  } = $props();

  const uid = $props.id();
  const idTitulo = $derived(`${uid}-titulo`);
  let caja = $state<HTMLElement | null>(null);

  export function enfocar(): void {
    caja?.focus();
  }

  function ir(evento: MouseEvent, campoId: string): void {
    evento.preventDefault();
    document.getElementById(campoId)?.focus();
  }
</script>

<div class="resumen" tabindex="-1" bind:this={caja} role="group" aria-labelledby={idTitulo}>
  <h3 id={idTitulo}><Icono nombre="vencido" />{titulo}</h3>
  {#if general !== ""}<p class="general">{general}</p>{/if}
  <ul>
    {#each items as item (item.campoId)}
      <li><a href={`#${item.campoId}`} onclick={(e) => ir(e, item.campoId)}>{item.mensaje}</a></li>
    {/each}
  </ul>
</div>

<style>
  .resumen {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    padding: var(--e-3) var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-left: 4px solid var(--c-critico-r);
    border-radius: var(--r-2);
  }
  h3 {
    --icono-tam: 1.125rem;
    display: flex;
    align-items: center;
    gap: var(--e-2);
    font-size: 1rem;
    color: var(--c-critico-t);
  }
  .general {
    font-size: var(--t-chico);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
  }
  li {
    font-size: var(--t-chico);
    line-height: 1.4;
  }
  a {
    display: inline-block;
    padding-block: var(--e-1);
    color: var(--c-critico-t);
    font-weight: 600;
  }
</style>
