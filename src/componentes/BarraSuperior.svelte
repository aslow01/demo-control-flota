<script lang="ts">
  // Barra superior del celular y la tableta (menos de 64 rem; desde ahí es el lateral). Fija arriba, en dos pisos:
  //  - Fila: a la izquierda la marca (en las pantallas de la barra inferior) o «‹ Atrás» (en la ficha y el parte); a la derecha el chip del perfil, que abre «Ver como».
  //    Al bajar la página el título de la pantalla ocupa el lugar de la marca (el h1 ya salió de la vista); «Atrás» queda solo con la flecha.
  //  - Franja «Demo con datos ficticios · día»: siempre visible, para que nadie confunda esto con un sistema real.
  // «Atrás» es un enlace al padre de la pantalla (la ficha vuelve a Movilidades como la dejó la persona); la historia del navegador sigue andando con su propio botón.
  // Sin la demo cargada (arranque o error) no hay chip: no hay perfil que cambiar.
  import Icono from "./Icono.svelte";
  import { TEXTO_MARCO, TEXTO_NAVEGACION } from "./textos-marco.ts";

  let {
    cargada,
    atras = null,
    titulo,
    perfil,
    esConductor,
    fecha,
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
    /** «miércoles 25/11/2026». */
    fecha: string;
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
        <p class="marca"><Icono nombre="marca" />{TEXTO_MARCO.nombreApp}</p>
      {/if}
      <span class="titulo" aria-hidden="true">{titulo}</span>
    </div>
    {#if cargada}
      <button type="button" class="chip" class:conductor={esConductor} aria-haspopup="dialog" aria-label={TEXTO_NAVEGACION.chipPerfil(perfil)} onclick={alVerComo}>
        <span class="punto" aria-hidden="true"></span><span aria-hidden="true">{perfil}</span><Icono nombre="abajo" />
      </button>
    {/if}
  </div>
  <p class="franja"><b>{TEXTO_MARCO.etiquetaDemoMarca}</b> <span>{TEXTO_MARCO.etiquetaDemoDatos}{cargada ? ` · ${fecha}` : ""}</span></p>
</header>

<style>
  .barra {
    position: sticky;
    top: 0;
    z-index: 50;
    padding-top: env(safe-area-inset-top, 0px);
    background: var(--c-fondo);
    border-bottom: 1px solid transparent;
    transition: border-color var(--m-rapido) linear;
  }
  .barra.con-titulo {
    border-bottom-color: var(--c-borde);
  }
  .fila {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--e-1) var(--e-2);
    /* Sin alto fijo, y si no entran los dos la marca y el chip van en renglones separados (1.4.4): nada se monta ni se parte letra por letra. */
    min-height: var(--alto-barra);
    padding: 0 0.625rem 0 var(--gutter);
  }
  .izquierda {
    position: relative;
    display: flex;
    flex: 1 1 8rem;
    align-items: center;
    align-self: stretch;
    gap: var(--e-2);
    min-width: 0;
  }
  .marca {
    --icono-tam: 1.375rem;
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-width: 0;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    transition:
      opacity var(--m-medio) var(--m-curva),
      transform var(--m-medio) var(--m-curva);
  }
  .titulo {
    position: absolute;
    inset: 50% 0 auto;
    overflow: hidden;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: 1.125rem;
    font-weight: 700;
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
  /* «Atrás» queda con la flecha sola y el título se corre a su derecha. */
  .con-atras .titulo {
    left: 2.5rem;
  }
  .con-titulo .atras-texto {
    display: none;
  }
  .atras {
    --icono-tam: 1.375rem;
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    min-height: var(--alto-tactil);
    margin-left: -0.375rem;
    padding: 0 0.625rem 0 0.125rem;
    border-radius: var(--r-1);
    color: var(--c-texto);
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
  }
  .con-titulo .atras {
    padding-right: 0.125rem;
  }
  @media (hover: hover) {
    .atras:hover {
      background: var(--c-superficie-2);
      text-decoration: none;
    }
  }

  .chip {
    --icono-tam: 1rem;
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 0.375rem;
    min-height: var(--alto-tactil);
    padding: 0 0.625rem 0 0.75rem;
    border: 1.5px solid var(--c-borde-fuerte);
    border-radius: var(--r-pildora);
    background: var(--c-superficie);
    color: var(--c-texto);
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
  }
  @media (hover: hover) {
    .chip:hover {
      background: var(--c-superficie-2);
    }
  }
  .punto {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--c-tinta);
  }
  .chip.conductor .punto {
    background: var(--c-quincena-r);
  }

  .franja {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: var(--e-2);
    min-height: var(--alto-franja);
    padding: 0.125rem var(--gutter);
    border-block: 1px solid var(--c-borde);
    background: var(--c-superficie-2);
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    line-height: 1.3;
  }
  .franja b {
    color: var(--c-texto);
    font-size: 0.7188rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* Desde 64 rem la navegación es el lateral y la barra de migas. */
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
