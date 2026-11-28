<script lang="ts" module>
  import type { NombreIcono } from "./tipos.ts";

  /** Un destino de la navegación: lo arma `App.svelte` una vez y lo usan la barra inferior (celular y tableta) y el lateral (escritorio). */
  export interface ItemNavegacion {
    id: string;
    href: string;
    texto: string;
    /** Lo que se agrega al nombre y en la barra inferior no se ve: «Operación» + « diaria». El lateral lo muestra completo. */
    textoOculto?: string;
    icono?: NombreIcono;
    /** Solo si hay algo que contar (con 0 no se pasa). `texto` es lo que lee el lector de pantalla después del nombre: «4 alertas críticas». */
    insignia?: { cantidad: number; texto: string; critica: boolean };
    /** `page` en la pantalla de la sección; `true` si la pantalla actual está dentro de la sección pero no es su inicio (la ficha, el parte). */
    actual?: "page" | "true";
  }
</script>

<script lang="ts">
  // Barra inferior de pestañas (celular y tableta, menos de 64 rem; docs/diseno-ui.md, 15.4.4): 5 destinos con el encargado, 3 con el conductor. Fija abajo, de tinta (de día) o Prusia profundo
  // (de noche), con un filete superior de 2 px; respeta el área segura del teléfono. Las columnas son iguales y cada destino ocupa la suya entera (62 px de alto): el pulgar lo encuentra
  // siempre en el mismo lugar. El actual es el campo pleno (no solo color: también `aria-current`). Las insignias cuentan lo pendiente; el lector las lee después del nombre.
  // Se oculta dentro del parte (ahí manda la barra de envío).
  import Icono from "./Icono.svelte";
  import { TEXTO_NAVEGACION } from "./textos-marco.ts";

  let { items, oculta = false }: { items: ItemNavegacion[]; oculta?: boolean } = $props();
</script>

<nav class="barra-inferior" class:oculta aria-label={TEXTO_NAVEGACION.secciones}>
  <ul>
    {#each items as it (it.id)}
      <li>
        <a class="pestana" href={it.href} aria-current={it.actual}>
          <span class="caja-icono">
            {#if it.icono !== undefined}<Icono nombre={it.icono} />{/if}
            {#if it.insignia !== undefined}
              <span class="insignia" class:neutra={!it.insignia.critica} aria-hidden="true">{it.insignia.cantidad}</span>
            {/if}
          </span>
          <span class="texto">{it.texto}{#if it.textoOculto !== undefined}<span class="solo-lectores">{it.textoOculto}</span>{/if}</span>
          {#if it.insignia !== undefined}<span class="solo-lectores">, {it.insignia.texto}</span>{/if}
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .barra-inferior {
    position: fixed;
    inset: auto 0 0;
    z-index: 60;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--c-lat);
    border-top: 2px solid var(--c-tinta);
    color: var(--c-lat-tx-2);
    /* Sobre lo oscuro el anillo de foco es el blanco. */
    --c-foco: var(--c-foco-oscuro);
  }
  /* Columnas iguales. Con el texto agrandado (rem) una palabra que no entra le da a su columna lo que ocupa y la fila se desplaza por dentro (la página no): así ninguna palabra se parte y la
     barra no crece. El foco mueve la fila solo. */
  ul {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(max-content, 1fr);
    max-width: 40rem;
    margin: 0 auto;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
    /* Pista de que hay más destinos: una sombra en el borde por donde la fila sigue (solo con el texto agrandado, que es cuando no entran). Las dos capas de arriba (`local`) tapan la sombra cuando la fila está en ese extremo. */
    background:
      linear-gradient(to right, var(--c-lat) 30%, transparent) 0 0 / 1.5rem 100% no-repeat local,
      linear-gradient(to left, var(--c-lat) 30%, transparent) 100% 0 / 1.5rem 100% no-repeat local,
      linear-gradient(to right, color-mix(in srgb, var(--c-lat-tx) 40%, transparent), transparent) 0 0 / 0.75rem 100% no-repeat scroll,
      linear-gradient(to left, color-mix(in srgb, var(--c-lat-tx) 40%, transparent), transparent) 100% 0 / 0.75rem 100% no-repeat scroll;
  }
  .pestana {
    --icono-tam: 1.25rem;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--e-1);
    min-height: var(--alto-pestanas);
    /* Aire entre palabras solo con el texto agrandado: `1rem - 16px` vale 0 con el cuerpo de siempre (a 320 px «Vencimientos» llena su columna) y crece con el texto (8 px como tope por lado). */
    padding-inline: clamp(0px, calc(1rem - 16px), 0.25rem);
    color: var(--c-lat-tx-2);
    text-decoration: none;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: var(--t-rotulo);
    font-weight: 600;
    line-height: 1;
    -webkit-tap-highlight-color: transparent;
  }
  /* «Vencimientos» mide 62,6 px a 12 px de cuerpo y en el cartel angosto: a 320 px (columna de 64) queda 1,4 px de aire. Sin relleno lateral y sin abreviar. */
  .pestana:focus-visible {
    outline-offset: -3px;
  }
  .pestana:active {
    background: color-mix(in srgb, var(--c-lat-tx) 14%, transparent);
  }
  .pestana[aria-current] {
    color: var(--c-lat-tx);
  }
  /* La pantalla actual: el campo pleno, columna entera. En la ficha o el parte (`aria-current="true"`) solo se enciende el texto. */
  .pestana[aria-current="page"] {
    background: var(--c-pleno);
    color: var(--c-sobre-pleno);
  }
  /* Con el foco sobre el actual: el anillo es el del texto sobre el pleno (el blanco daría 1,18:1 contra el crema de noche). */
  .pestana[aria-current="page"]:focus-visible {
    outline-color: var(--c-sobre-pleno);
  }
  @media (hover: hover) {
    .pestana:hover:not([aria-current="page"]) {
      background: var(--c-lat-hover);
      color: var(--c-lat-tx);
    }
  }
  .caja-icono {
    position: relative;
    display: grid;
    place-items: center;
  }
  .texto {
    text-align: center;
    white-space: nowrap;
  }

  /* Insignia: cuadrada, arriba a la derecha del ícono, como en el lateral. Crítica: relleno crítico; la demás, borde y texto de la barra. */
  .insignia {
    position: absolute;
    bottom: calc(100% - 0.5rem);
    left: calc(100% - 0.25rem);
    min-width: 1.125rem;
    padding: 0.125rem 0.1875rem;
    background: var(--c-crit-relleno);
    border: 1px solid var(--c-crit-relleno);
    color: var(--c-sobre-solido);
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-stretch: 100%;
    font-weight: 600;
    line-height: 1;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .insignia.neutra {
    background: var(--c-lat);
    border-color: var(--c-lat-borde);
    color: var(--c-lat-tx);
  }
  .pestana[aria-current="page"] .insignia.neutra {
    background: var(--c-pleno);
    border-color: var(--c-sobre-pleno-2);
    color: var(--c-sobre-pleno);
  }

  .oculta {
    display: none;
  }
  /* Desde 64 rem la navegación es el lateral. */
  @media (min-width: 64rem) {
    .barra-inferior {
      display: none;
    }
  }

  /* Colores forzados: el campo de la pestaña activa desaparece; queda el subrayado. */
  @media (forced-colors: active) {
    .pestana[aria-current] .texto {
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 0.25rem;
    }
  }
</style>
