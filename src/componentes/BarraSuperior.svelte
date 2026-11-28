<script lang="ts">
  // Barra superior del celular y la tableta (menos de 64 rem; desde ahí es el lateral). Fija arriba, un solo piso (docs/diseno-ui.md, 15.4.4):
  //  - Pantallas del menú: la marca, el sello «Datos ficticios» y el chip del perfil, que abre «Ver como». Al bajar la página el título de la pantalla ocupa el lugar de la marca.
  //  - Ficha y parte: «‹» (el enlace al padre), el título y el chip. El sello no entra: baja al renglón de lámina que abre `main`.
  // «Atrás» es un enlace al padre de la pantalla (la ficha vuelve a Movilidades como la dejó la persona); la historia del navegador sigue andando con su propio botón.
  // Sin la demo cargada (arranque o error) no hay chip: no hay perfil que cambiar.
  import Icono from "./Icono.svelte";
  import SelloDatos from "./SelloDatos.svelte";
  import { TEXTO_MARCO, TEXTO_NAVEGACION } from "./textos-marco.ts";

  let {
    cargada,
    atras = null,
    titulo,
    perfil,
    esConductor,
    alVerComo,
  }: {
    cargada: boolean;
    /** Solo en las pantallas que no son de la barra inferior. `nombreAccesible` es «Volver a Movilidades». */
    atras?: { href: string; texto: string; nombreAccesible: string } | null;
    /** El nombre de la pantalla; solo se ve cuando el h1 salió de la vista. */
    titulo: string;
    /** «Encargado» o «Conductor». */
    perfil: string;
    /** El punto del chip cambia de color con el perfil (además del texto: el color nunca va solo). */
    esConductor: boolean;
    alVerComo: () => void;
  } = $props();


  // El título entra cuando el h1 ya salió de la vista: ocupa el lugar de la marca. ~3,5 rem desde arriba.
  const UMBRAL_TITULO_PX = 56;
  let conTitulo = $state(false);
  function alDesplazar(): void {
    conTitulo = window.scrollY > UMBRAL_TITULO_PX;
  }
</script>

<svelte:window onscroll={alDesplazar} />

<header class="barra" class:con-titulo={conTitulo}>
  <div class="fila">
    <div class="izquierda" class:con-atras={atras !== null}>
      {#if atras !== null}
        <a class="atras" href={atras.href} aria-label={atras.nombreAccesible}>
          <Icono nombre="atras" /><span class="atras-texto">{atras.texto}</span>
        </a>
      {:else}
        <p class="marca"><Icono nombre="marca" /><span class="marca-texto">{TEXTO_MARCO.nombreApp}</span></p>
      {/if}
      <span class="titulo" aria-hidden="true">{titulo}</span>
    </div>
    {#if atras === null}<SelloDatos />{/if}
    {#if cargada}
      <button type="button" class="chip" class:conductor={esConductor} aria-haspopup="dialog" aria-label={TEXTO_NAVEGACION.chipPerfil(perfil)} onclick={alVerComo}>
        <span class="punto" aria-hidden="true"></span><span class="nombre" aria-hidden="true">{perfil}</span><Icono nombre="abajo" />
      </button>
    {/if}
  </div>
</header>

<style>
  .barra {
    position: sticky;
    top: 0;
    z-index: 50;
    padding-top: env(safe-area-inset-top, 0px);
    /* Opaca y sin desenfoque (15.2, regla 14): el desenfoque es solo de la barra de escritorio. */
    background: var(--c-papel);
    border-bottom: 1px solid var(--c-filete-medio);
  }
  .fila {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--e-1) var(--e-2);
    /* Sin alto fijo, y si con el texto agrandado no entran las tres piezas, la que sobra baja a otro renglón (1.4.4): nada se monta ni se parte letra por letra. */
    min-height: var(--alto-barra);
    padding-inline: var(--gutter);
  }
  .izquierda {
    position: relative;
    display: flex;
    flex: 1 1 2rem;
    align-items: center;
    align-self: stretch;
    gap: var(--e-2);
    min-width: 1.75rem;
  }
  .marca {
    --icono-tam: 1.75rem;
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-width: 0;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: 1.125rem;
    font-weight: var(--t-peso-cartel);
    line-height: 1;
    letter-spacing: -0.005em;
    transition:
      opacity var(--m-medio) var(--m-curva),
      transform var(--m-medio) var(--m-curva);
  }
  .marca-texto {
    white-space: nowrap;
  }
  .titulo {
    position: absolute;
    inset: 50% 0 auto;
    overflow: hidden;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: 1.125rem;
    font-weight: var(--t-peso-cartel);
    line-height: 1.2;
    white-space: nowrap;
    text-overflow: ellipsis;
    opacity: 0;
    transform: translateY(-20%);
    pointer-events: none;
    transition:
      opacity var(--m-medio) var(--m-curva),
      transform var(--m-medio) var(--m-curva);
  }
  .con-titulo .titulo {
    opacity: 1;
    transform: translateY(-50%);
  }
  .con-titulo .marca {
    opacity: 0;
    transform: translateY(-30%);
  }
  /* Ficha y parte: el título siempre se ve, a la derecha de la flecha. */
  .con-atras .titulo {
    left: 2.75rem;
    opacity: 1;
    transform: translateY(-50%);
  }
  .atras {
    --icono-tam: 1.5rem;
    display: inline-grid;
    flex: none;
    place-items: center;
    width: var(--alto-tactil);
    height: var(--alto-tactil);
    margin-left: -0.625rem;
    border-radius: var(--r-1);
    color: var(--c-pleno-texto);
    text-decoration: none;
  }
  .atras-texto {
    display: none;
  }
  @media (hover: hover) {
    .atras:hover {
      background: var(--c-papel-2);
    }
  }

  /* Chip de perfil: 44 px, el botón secundario (borde de tinta, sombra dura). Nunca se parte: un nombre largo se corta con elipsis dentro del chip. */
  .chip {
    --icono-tam: 1rem;
    display: inline-flex;
    flex: 0 1 auto;
    align-items: center;
    gap: var(--e-2);
    min-width: 0;
    min-height: var(--alto-tactil);
    padding: 0 var(--e-2) 0 var(--e-3);
    border: var(--b-control) solid var(--c-tinta);
    border-radius: var(--r-1);
    background: var(--c-hoja);
    box-shadow: var(--s-dura) var(--c-tinta);
    color: var(--c-tinta);
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
  }
  .nombre {
    min-width: 0;
    padding-block: 0.1em; /* `overflow: hidden` con interlínea 1 cortaba la cola de la «g» con el texto al 200 % */
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (hover: hover) {
    .chip:hover {
      background: var(--c-papel-2);
    }
  }
  .chip:active {
    transform: translateY(2px);
    box-shadow: none;
  }
  .punto {
    flex: none;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: var(--r-redondo);
    background: var(--c-tinta);
  }
  /* El conductor lleva un punto vacío (aro): además del texto, la forma lo distingue. */
  .chip.conductor .punto {
    background: none;
    box-shadow: inset 0 0 0 1.5px var(--c-tinta);
  }

  /* Lo que cede cuando falta ancho, en orden (15.4.4): la marca queda en su ícono; el sello aprieta su espaciado (en SelloDatos); por debajo de 22,5 rem el sello baja al renglón de lámina. */
  @media (max-width: 29.99rem) {
    .marca-texto {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }
  @media (max-width: 23.74rem) {
    .fila {
      padding-inline: var(--e-3);
    }
  }
  @media (max-width: 22.49rem) {
    .fila :global(.sello) {
      display: none;
    }
  }
  /* Al desplazar, el título ocupa el lugar de la marca y manda sobre el sello: entre 360 y 480 px el sello le dejaba 45 px y el título quedaba cortado. El sello sale de la vista pero sigue en el árbol
     de accesibilidad («Demo con datos ficticios»), y vuelve al subir. */
  @media (max-width: 29.99rem) {
    .con-titulo .fila :global(.sello) {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }

  /* Desde 64 rem la navegación es el lateral y la barra de escritorio. */
  @media (min-width: 64rem) {
    .barra {
      display: none;
    }
  }
  /* Con poca altura (zoom grande) la barra deja de estar pegada: ocuparía media pantalla. */
  @media (max-height: 30rem) {
    .barra {
      position: static;
    }
  }
</style>
