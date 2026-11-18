<script lang="ts">
  // 5.3 Menú "Más": patrón disclosure (no role="menu"). Botón de ícono con aria-expanded y aria-controls; lista de botones
  // en una caja flotante de 15 rem alineada a la derecha. Esc cierra y devuelve el foco al botón; un clic afuera, o salir
  // con Tab, también cierran. Los ítems miden 44 px de alto.
  import Boton from "./Boton.svelte";
  import { TEXTO_MARCO } from "./textos-marco.ts";
  import type { ItemMenu } from "./tipos.ts";

  let { items }: { items: ItemMenu[] } = $props();

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
    cerrar(false);
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
    <Boton
      variante="icono"
      icono="mas"
      etiqueta={TEXTO_MARCO.menuMas}
      aria-expanded={abierto}
      aria-controls={idLista}
      onclick={() => (abierto = !abierto)}
    />
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
