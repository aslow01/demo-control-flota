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
  /* Pie de rey: la flecha apunta hacia abajo cerrado y hacia arriba abierto, así el estado no depende solo del color. */
  .flecha {
    display: inline-flex;
    rotate: 90deg;
    transition: rotate var(--m-medio) var(--m-curva);
  }
  .menu :global(.boton[aria-expanded="true"] .flecha) {
    rotate: -90deg;
  }
  /* La caja flotante es una ficha suelta: hoja lisa, contorno fino, cabeza de 1,5 px en tinta y sombra de apoyo. Los renglones se separan con un filete. */
  .lista {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 20;
    width: 15rem;
    max-width: calc(100vw - 2rem);
    margin-top: var(--e-1);
    padding: 0;
    background: var(--c-hoja);
    border: 1px solid var(--c-filete-medio);
    border-top: var(--b-fuerte) solid var(--c-tinta);
    border-radius: var(--r-0);
    box-shadow: var(--s-flotante);
  }
  li + li {
    border-top: 1px solid var(--c-filete);
  }
  .item {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: var(--alto-tactil);
    padding: 0 var(--e-3);
    border: 0;
    border-radius: var(--r-0);
    background: none;
    color: var(--c-tinta);
    font-size: var(--t-cuerpo);
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .item:focus-visible {
    outline-offset: -3px;
  }
  @media (hover: hover) {
    .item:hover {
      background: var(--c-papel-2);
    }
  }
  .item:active {
    background: var(--c-papel-2);
  }

  /* Colores forzados: el fondo del cursor encima desaparece; el renglón lleva un contorno del color de selección. */
  @media (forced-colors: active) {
    .lista {
      border-top-width: 3px;
    }
    .item:hover {
      outline: 2px solid Highlight;
      outline-offset: -2px;
    }
  }
</style>
