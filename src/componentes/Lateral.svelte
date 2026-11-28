<script lang="ts">
  // Lateral de tinta del escritorio (64 rem o más; docs/diseno-ui.md, 15.4.2): la marca, los destinos con sus rótulos de sección («Flota» y «Operación»; Operación diaria es uno solo: sus solapas,
  // Partes y Novedades, se eligen dentro de la pantalla) y abajo «Cómo funciona», «Reiniciar demo», «Ver como», «Volver al portafolio» y la autoría. Es tinta de día y Prusia profundo de noche.
  // En el canto derecho lleva una regla graduada (decorativa). El destino de la pantalla actual es el campo pleno y sobresale del lateral sobre la página, como la mordaza de un calibre.
  // Sin la demo cargada (arranque o error) solo muestra la marca y la autoría. «Apariencia» no está acá: vive en «Más» (DE7).
  import type { ItemNavegacion } from "./BarraInferior.svelte";
  import Icono from "./Icono.svelte";
  import { NOMBRES_DE_PANTALLA } from "../lib/dominio/textos-base.ts";
  import { TEXTO_LATERAL, TEXTO_MARCO, TEXTO_MAS, TEXTO_NAVEGACION, TEXTO_PIE, URL_PORTAFOLIO } from "./textos-marco.ts";

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

  /** Rótulos de sección: presentación pura, van antes del destino que abre cada sección (el conductor no tiene). */
  const ROTULO_ANTES_DE: Record<string, string> = { movilidades: TEXTO_LATERAL.flota, operacion: TEXTO_LATERAL.operacion };
</script>

<!-- Un `div` y no un `aside`: esto no es un complemento del contenido (landmark `complementary`) sino la navegación principal, que ya es su propio `nav`. Lleva `role="region"` con nombre para que
     la marca, «Volver al portafolio» y la autoría no queden fuera de todo landmark (axe, regla `region`). -->
<div class="lateral" role="region" aria-label={TEXTO_MARCO.nombreApp}>
  <div class="cabecera">
    {#if cargada}
      <a class="marca" href={inicioHref}><Icono nombre="marca" />{TEXTO_MARCO.nombreApp}</a>
    {:else}
      <p class="marca"><Icono nombre="marca" />{TEXTO_MARCO.nombreApp}</p>
    {/if}
  </div>

  {#if cargada}
    <nav aria-label={TEXTO_NAVEGACION.secciones}>
      <ul>
        {#each items as it (it.id)}
          {#if ROTULO_ANTES_DE[it.id] !== undefined}<li class="seccion rotulo" aria-hidden="true">{ROTULO_ANTES_DE[it.id]}</li>{/if}
          <li>
            <a class="item" href={it.href} aria-current={it.actual}>
              {#if it.icono !== undefined}<Icono nombre={it.icono} />{/if}
              <span>{it.texto}{it.textoOculto ?? ""}</span>
              {#if it.insignia !== undefined}
                <span class="insignia" class:neutra={!it.insignia.critica} aria-hidden="true">{it.insignia.cantidad}</span>
                <span class="solo-lectores">, {it.insignia.texto}</span>
              {/if}
            </a>
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
          <span class="perfil-texto" aria-hidden="true"><small>{TEXTO_MARCO.verComo}</small>{" "}<b>{perfilTexto}</b></span>
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
    /* Cuánto sale el destino actual del lateral sobre la página: nunca más de lo que deja libre el medianil (queda un filete de aire de 10 px). */
    --sobresale: min(1.375rem, var(--gutter) - 0.625rem);
    display: none;
    flex-direction: column;
    gap: var(--e-2);
    position: sticky;
    top: 0;
    z-index: 30;
    align-self: start;
    height: 100dvh;
    padding: var(--e-4) var(--e-3);
    background: var(--c-lat);
    color: var(--c-lat-tx);
    /* Sobre la tinta el anillo de foco azurita no llega a 3:1: es el blanco. */
    --c-foco: var(--c-foco-oscuro);
  }
  @media (min-width: 64rem) {
    .lateral {
      display: flex;
    }
  }
  /* La regla graduada del canto derecho: marca cada 8 px, mayor cada 40. Decorativa. */
  .lateral::after {
    content: "";
    position: absolute;
    inset: 0 0 0 auto;
    width: 9px;
    background:
      repeating-linear-gradient(to bottom, var(--c-lat-borde) 0 1px, transparent 1px 40px) right top / 9px 100% no-repeat,
      repeating-linear-gradient(to bottom, var(--c-lat-borde) 0 1px, transparent 1px 8px) right top / 4px 100% no-repeat;
    pointer-events: none;
  }

  .marca {
    --icono-tam: 2.125rem;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.25rem 0.375rem 0.75rem;
    color: var(--c-lat-tx);
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: 1.25rem;
    font-weight: var(--t-peso-cartel);
    line-height: 1;
    letter-spacing: -0.005em;
    text-decoration: none;
  }

  ul {
    display: grid;
    gap: 2px;
  }
  .seccion {
    margin: var(--e-3) 0.5rem 0.125rem;
    color: var(--c-lat-tx-2);
    letter-spacing: 0.08em;
  }

  /* Destino, botón del pie y enlace «Volver al portafolio»: la misma pieza. */
  .item {
    --icono-tam: 1.0625rem;
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    min-height: var(--alto-control);
    padding: 0.375rem 0.625rem 0.375rem 0.75rem;
    border: 0;
    border-radius: var(--r-1);
    background: none;
    color: var(--c-lat-tx);
    font: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.3;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  /* Cursor encima: fondo y una marca de 3 px a la izquierda. */
  .item::before {
    content: "";
    position: absolute;
    inset: 0.4375rem auto 0.4375rem 0;
    width: 3px;
    background: var(--c-lat-tx);
    opacity: 0;
  }
  @media (hover: hover) {
    .item:hover {
      background: var(--c-lat-hover);
      text-decoration: none;
    }
    .item:hover::before {
      opacity: 1;
    }
  }
  .item:active {
    background: color-mix(in srgb, var(--c-lat-tx) 14%, transparent);
  }
  .item:focus-visible,
  .perfil:focus-visible {
    outline-offset: -3px;
  }

  /* La pantalla actual: el campo pleno, que sale del lateral sobre la página. */
  .item[aria-current="page"] {
    z-index: 1;
    width: calc(100% + var(--e-3) + var(--sobresale));
    margin-right: calc(-1 * (var(--e-3) + var(--sobresale)));
    padding-right: calc(var(--sobresale) + 0.625rem);
    border-radius: 0;
    background: var(--c-pleno);
    color: var(--c-sobre-pleno);
    font-weight: 650;
  }
  .item[aria-current="page"]::before {
    background: var(--c-sobre-pleno);
    opacity: 1;
  }
  /* Con el foco sobre el actual: el anillo es el del texto sobre el pleno (el blanco daría 1,18:1 contra el crema de noche). */
  .item[aria-current="page"]:focus-visible {
    outline-color: var(--c-sobre-pleno);
  }
  /* En la ficha o el parte: la sección sigue marcada, sin campo pleno (la pantalla actual es otra). */
  .item[aria-current="true"] {
    font-weight: 650;
  }

  .insignia {
    min-width: 1.375rem;
    margin-left: auto;
    padding: 0.125rem 0.3125rem;
    border: 1px solid var(--c-lat-borde);
    color: var(--c-lat-tx);
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 600;
    line-height: 1;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .insignia:not(.neutra) {
    background: var(--c-crit-relleno);
    border-color: var(--c-crit-relleno);
    color: var(--c-sobre-solido);
  }
  .item[aria-current="page"] .insignia.neutra {
    border-color: var(--c-sobre-pleno);
    color: var(--c-sobre-pleno);
  }

  /* Pie: separado por un filete. */
  /* El pie llega con la demo cargada; antes de eso el alto se reserva y la autoría queda abajo, donde va a quedar (sin salto de diseño). */
  .abajo {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 17.5rem;
    margin-top: auto;
  }
  .pie {
    display: grid;
    gap: 2px;
    padding-top: var(--e-3);
    border-top: 1px solid var(--c-lat-borde);
  }
  .perfil {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2);
    width: 100%;
    min-height: 3rem;
    margin: 0.375rem 0;
    padding: 0.375rem 0.625rem 0.375rem 0.75rem;
    border: 1px solid var(--c-lat-borde);
    border-radius: var(--r-1);
    background: none;
    color: var(--c-lat-tx);
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
  }
  @media (hover: hover) {
    .perfil:hover {
      background: var(--c-lat-hover);
    }
  }
  .perfil-texto {
    min-width: 0;
  }
  .perfil small {
    display: block;
    color: var(--c-lat-tx-2);
    font-size: var(--t-rotulo);
  }
  .perfil b {
    display: block;
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Texto fijo de autoría: 12 px, a 5:1 o más contra el lateral. */
  .autoria {
    margin: var(--e-3) 0.5rem 0;
    color: var(--c-lat-tx-2);
    font-size: var(--t-rotulo);
    line-height: 1.45;
  }
  .enlace-mas {
    --icono-tam: 0.875rem;
    display: inline-flex;
    align-items: center;
    gap: var(--e-1);
    min-width: 1.5rem;
    min-height: 1.5rem;
    color: var(--c-lat-tx);
    font-weight: 600;
    text-underline-offset: 3px;
  }
  .enlace-mas[aria-current="page"] {
    font-weight: 750;
    text-decoration: underline;
  }

  /* Ventanas bajas (menos de 47,5 rem de alto): el lateral se desplaza por dentro y el actual ya no sobresale. */
  @media (max-height: 47.5rem) {
    .lateral {
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
    }
    .item[aria-current="page"] {
      width: 100%;
      margin-right: 0;
      padding-right: 0.625rem;
    }
  }

  @media (forced-colors: active) {
    .item[aria-current="page"] {
      text-decoration: underline;
      text-decoration-thickness: 3px;
      text-underline-offset: 0.375rem;
    }
  }
</style>
