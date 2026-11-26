<script lang="ts">
  // Lateral oscuro del escritorio (64 rem o más): marca y rótulo «Demo», los destinos (con Operación diaria desplegada en Checklists y Novedades),
  // y abajo «Cómo funciona», «Reiniciar demo», «Ver como» y «Volver al portafolio». Oscuro en claro y en oscuro (es el «turno» de la marca).
  // El destino de la pantalla actual sale del contenido como una pestaña de fichero (corte en diagonal) y además lleva una marca de 3 px y negrita:
  // en oscuro el recorte solo no alcanza contraste. Sin la demo cargada (arranque o error) solo muestra la marca.
  import type { ItemNavegacion } from "./BarraInferior.svelte";
  import Icono from "./Icono.svelte";
  import { NOMBRES_DE_PANTALLA } from "../lib/dominio/textos.ts";
  import { TEXTO_MARCO, TEXTO_MAS, TEXTO_NAVEGACION, TEXTO_PIE, URL_PORTAFOLIO } from "./textos-marco.ts";

  let {
    items,
    cargada,
    inicioHref,
    masHref,
    masActual,
    perfilTexto,
    alComoFunciona,
    alReiniciar,
    alVerComo,
  }: {
    items: ItemNavegacion[];
    /** `false` mientras arranca o si falló: no hay datos para contar ni perfil para cambiar. */
    cargada: boolean;
    /** A dónde lleva la marca: el inicio del perfil. */
    inicioHref: string;
    /** A dónde lleva el enlace «Más» del texto de autoría: la pantalla «Más», donde está el detalle. */
    masHref: string;
    /** «page» si la pantalla de ahora es «Más». */
    masActual?: "page";
    /** «Encargado» o «Conductor · Tamara». */
    perfilTexto: string;
    alComoFunciona: () => void;
    alReiniciar: () => void;
    alVerComo: () => void;
  } = $props();

  /** Un destino con solapas no es «la pantalla actual» por sí mismo: la solapa activa lo es. Él queda como «dentro de la sección». */
  function actualDe(item: ItemNavegacion): "page" | "true" | undefined {
    return item.subitems !== undefined && item.actual !== undefined ? "true" : item.actual;
  }
</script>

{#snippet destino(it: ItemNavegacion, sub: boolean)}
  <a class="item" class:sub href={it.href} aria-current={sub ? it.actual : actualDe(it)}>
    {#if it.icono !== undefined}<Icono nombre={it.icono} />{/if}
    <span>{it.texto}{it.textoOculto ?? ""}</span>
    {#if it.insignia !== undefined}
      <span class="insignia" class:neutra={!it.insignia.critica} aria-hidden="true">{it.insignia.cantidad}</span>
      <span class="solo-lectores">, {it.insignia.texto}</span>
    {/if}
  </a>
{/snippet}

<!-- Un `div` y no un `aside`: esto no es un complemento del contenido (landmark `complementary`) sino la navegación principal, que ya es su propio `nav`. -->
<div class="lateral">
  <div class="cabecera">
    {#if cargada}
      <a class="marca" href={inicioHref}><Icono nombre="marca" />{TEXTO_MARCO.nombreApp}</a>
    {:else}
      <p class="marca"><Icono nombre="marca" />{TEXTO_MARCO.nombreApp}</p>
    {/if}
    <span class="etiqueta-demo rotulo">{TEXTO_MARCO.etiquetaDemo}</span>
  </div>

  {#if cargada}
    <nav aria-label={TEXTO_NAVEGACION.secciones}>
      <ul>
        {#each items as it (it.id)}
          <li>
            {@render destino(it, false)}
            {#if it.subitems !== undefined}
              <ul>
                {#each it.subitems as sub (sub.id)}
                  <li>{@render destino(sub, true)}</li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </nav>

  {/if}

  <!-- Abajo del todo: los controles de la demo y, siempre visible (también al arrancar o con un error), quién hizo qué, con el enlace al detalle en «Más». -->
  <div class="abajo">
    {#if cargada}
      <div class="pie">
        <ul>
          <li><button type="button" class="item" onclick={alComoFunciona}>{TEXTO_MARCO.comoFunciona}</button></li>
          <li><button type="button" class="item" onclick={alReiniciar}>{TEXTO_MARCO.reiniciarDemo}</button></li>
        </ul>
        <button type="button" class="perfil" aria-haspopup="dialog" aria-label={TEXTO_NAVEGACION.chipPerfil(perfilTexto)} onclick={alVerComo}>
          <span class="perfil-texto" aria-hidden="true"><small>{TEXTO_MARCO.verComo}</small>{perfilTexto}</span>
          <span aria-hidden="true"><Icono nombre="abajo" /></span>
        </button>
        <a class="item portafolio" href={URL_PORTAFOLIO}><Icono nombre="salir" /><span>{TEXTO_MAS.laDemo.portafolio.rotulo}</span></a>
      </div>
    {/if}
    <div class="autoria">
      <p>{TEXTO_PIE.autoria}</p>
      {#if cargada}
        <a class="enlace-mas" href={masHref} aria-current={masActual}>{NOMBRES_DE_PANTALLA.mas}<Icono nombre="flecha" /></a>
      {/if}
    </div>
  </div>
</div>

<style>
  .lateral {
    --corte: 0.75rem;
    display: none;
    flex-direction: column;
    position: sticky;
    top: 0;
    align-self: start;
    height: 100dvh;
    overflow-y: auto;
    background: var(--c-lat);
    color: var(--c-lat-tx);
    /* Sobre lo oscuro el anillo de foco azurita no llega a 3:1. */
    --c-foco: var(--c-foco-oscuro);
  }
  @media (min-width: 64rem) {
    .lateral {
      display: flex;
    }
  }

  .cabecera {
    padding: 1.375rem 1.25rem 1.125rem;
    border-bottom: 1px solid var(--c-lat-borde);
  }
  .marca {
    --icono-tam: 1.375rem;
    display: flex;
    align-items: center;
    gap: var(--e-2);
    color: var(--c-lat-tx);
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    text-decoration: none;
  }
  .etiqueta-demo {
    display: inline-block;
    margin-top: var(--e-3);
    padding: 0.1875rem var(--e-2);
    border: 1px solid var(--c-lat-borde);
    border-radius: var(--r-1);
    color: var(--c-lat-tx-2);
    font-weight: 700;
    letter-spacing: 0.06em;
  }

  nav {
    padding: var(--e-3) 0 var(--e-3) var(--e-3);
  }
  .item {
    --icono-tam: 1.25rem;
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--e-3);
    min-height: var(--alto-tactil);
    padding: 0 var(--e-4) 0 var(--e-3);
    border-radius: var(--r-1) 0 0 var(--r-1);
    color: var(--c-lat-tx-2);
    font-size: 0.9375rem;
    font-weight: 600;
    text-decoration: none;
    isolation: isolate;
  }
  .item:hover {
    background: var(--c-lat-hover);
    color: var(--c-lat-tx);
    text-decoration: none;
  }
  .item.sub {
    min-height: var(--alto-tactil);
    padding-left: 2.75rem;
    font-size: 0.875rem;
    font-weight: 500;
  }
  .item .insignia {
    margin-left: auto;
  }

  /* La pantalla actual: la pestaña de fichero sale de la barra y se mete en el contenido (corte en diagonal arriba a la derecha). */
  .item[aria-current="page"] {
    color: var(--c-lat-activo-tx);
    background: none;
    font-weight: 750;
  }
  .item[aria-current="page"]::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: var(--r-1) 0 0 var(--r-1);
    background: var(--c-fondo);
    clip-path: polygon(0 0, calc(100% - var(--corte)) 0, 100% var(--corte), 100% 100%, 0 100%);
  }
  .item[aria-current="page"]::after {
    content: "";
    position: absolute;
    top: 0.5625rem;
    bottom: 0.5625rem;
    left: 0;
    width: 3px;
    border-radius: 2px;
    background: var(--c-texto);
  }
  .item[aria-current="true"],
  .item[aria-current="true"] :global(.icono) {
    color: var(--c-lat-tx);
  }
  @media (prefers-color-scheme: dark) {
    .item[aria-current="page"] {
      color: var(--c-texto);
    }
  }

  .insignia {
    display: grid;
    place-items: center;
    min-width: 1.1875rem;
    height: 1.1875rem;
    padding: 0 0.3125rem;
    border-radius: var(--r-pildora);
    background: var(--c-critico-solido);
    color: var(--c-sobre-solido);
    font-size: 0.7188rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .insignia.neutra {
    background: rgb(244 238 228 / 0.18);
    color: var(--c-lat-tx);
  }
  .item[aria-current="page"] .insignia.neutra {
    background: var(--c-texto-2);
    color: var(--c-superficie);
  }

  .abajo {
    margin-top: auto;
  }
  .pie {
    padding: var(--e-3) var(--e-3) var(--e-2);
    border-top: 1px solid var(--c-lat-borde);
  }
  /* Texto fijo de autoría: chico, pero a 5:1 o más contra el lateral (el texto secundario del lateral mide 7,2:1). */
  .autoria {
    padding: var(--e-3) var(--e-4) var(--e-2);
    border-top: 1px solid var(--c-lat-borde);
    color: var(--c-lat-tx-2);
    font-size: 0.75rem;
    line-height: 1.45;
  }
  .enlace-mas {
    --icono-tam: 0.875rem;
    display: inline-flex;
    align-items: center;
    gap: var(--e-1);
    min-height: var(--alto-tactil);
    color: var(--c-lat-tx);
    font-size: 0.8125rem;
    font-weight: 600;
    text-underline-offset: 3px;
  }
  .enlace-mas[aria-current="page"] {
    font-weight: 750;
  }
  .pie .item {
    min-height: 2.75rem;
    border-radius: var(--r-1);
    font-size: 0.875rem;
    font-weight: 500;
  }
  .pie button.item {
    width: 100%;
    border: 0;
    background: none;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
  }
  .perfil {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2);
    width: 100%;
    min-height: var(--alto-tactil);
    margin: var(--e-2) 0 0.375rem;
    padding: 0 var(--e-3);
    border: 1px solid var(--c-lat-borde);
    border-radius: var(--r-1);
    background: rgb(244 238 228 / 0.05);
    color: var(--c-lat-tx);
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
  }
  .perfil:hover {
    background: var(--c-lat-hover);
  }
  .perfil-texto {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .perfil small {
    display: block;
    color: var(--c-lat-tx-2);
    font-size: 0.75rem;
  }

  @media (forced-colors: active) {
    .item[aria-current="page"] {
      text-decoration: underline;
      text-decoration-thickness: 3px;
      text-underline-offset: 0.375rem;
    }
  }
</style>
