<script lang="ts">
  // 5.3 Menú "Más": patrón disclosure (no role="menu"). Botón de ícono con aria-expanded y aria-controls; lista de botones
  // en una caja flotante de 15 rem alineada a la derecha. Esc cierra y devuelve el foco al botón; un clic afuera, o salir
  // con Tab, también cierran. Los ítems miden 44 px de alto.
  // Por defecto es el botón de ícono "Más" de la barra; con `conTexto` es un botón secundario con su rótulo y una flecha ("Más acciones ▾", ficha).
  import Boton from "./Boton.svelte";
  import Icono from "./Icono.svelte";
  import { TEXTO_MARCO } from "./textos-marco.ts";
  import type { ItemMenu } from "./tipos.ts";

  let {
    items,
    etiqueta = TEXTO_MARCO.menuMas,
    conTexto = false,
  }: {
    items: ItemMenu[];
    /** Nombre del botón. */
    etiqueta?: string;
    /** Botón secundario con el nombre visible, en vez del ícono. */
    conTexto?: boolean;
  } = $props();

  const uid = $props.id();
  const idLista = $derived(`${uid}-lista`);
  let abierto = $state(false);
  let raiz = $state<HTMLElement | null>(null);

  function cerrar(devolverFoco: boolean): void {
    abierto = false;
    if (devolverFoco) raiz?.querySelector<HTMLElement>("button[aria-controls]")?.focus();
  }

  function alTeclear(evento: KeyboardEvent): void {
    if (evento.key === "Escape" && abierto) {
      evento.preventDefault();
      cerrar(true);
    }
  }

  function alSalirElFoco(evento: FocusEvent): void {
    const destino = evento.relatedTarget;
    if (abierto && destino instanceof Node && raiz !== null && !raiz.contains(destino)) abierto = false;
  }

  function activar(item: ItemMenu): void {
    // El foco vuelve al botón "Más" antes de la acción: si abre un diálogo, ese es el disparador al que se regresa.
    cerrar(true);
    item.alActivar();
  }
</script>

<svelte:window
  onkeydown={alTeclear}
  onclick={(evento) => {
    if (abierto && raiz !== null && evento.target instanceof Node && !raiz.contains(evento.target)) abierto = false;
  }}
/>

{#if items.length > 0}
  <div class="menu" bind:this={raiz} onfocusout={alSalirElFoco}>
    {#if conTexto}
      <Boton variante="secundario" aria-expanded={abierto} aria-controls={idLista} onclick={() => (abierto = !abierto)}>
        {etiqueta}<span class="flecha"><Icono nombre="chevron" /></span>
      </Boton>
    {:else}
      <Boton variante="icono" icono="mas" {etiqueta} aria-expanded={abierto} aria-controls={idLista} onclick={() => (abierto = !abierto)} />
    {/if}
    <ul class="lista" id={idLista} hidden={!abierto}>
      {#each items as item (item.id)}
        <li><button type="button" class="item" onclick={() => activar(item)}>{item.texto}</button></li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .menu {
    position: relative;
  }
  .menu :global(.boton[data-variante="secundario"]) {
    width: 100%;
  }
  .flecha {
    display: inline-flex;
    rotate: 90deg;
  }
  .lista {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 20;
    width: 15rem;
    max-width: calc(100vw - 2rem);
    padding: var(--e-1);
    background: var(--c-superficie);
    border: 1px solid var(--c-ventana-borde);
    border-radius: var(--r-2);
    box-shadow: var(--s-flotante);
  }
  .item {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: var(--alto-tactil);
    padding: 0 var(--e-3);
    border: 0;
    border-radius: var(--r-1);
    background: none;
    color: var(--c-texto);
    font-weight: 500;
    text-align: left;
    cursor: pointer;
  }
  .item:focus-visible {
    outline-offset: -2px;
  }
  @media (hover: hover) {
    .item:hover {
      background: var(--c-superficie-2);
    }
  }
</style>
