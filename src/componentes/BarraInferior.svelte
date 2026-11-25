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
    /** Solo los usa el lateral (las solapas de Operación diaria). */
    subitems?: ItemNavegacion[];
  }
</script>

<script lang="ts">
  // Barra inferior de pestañas (celular y tableta, menos de 64 rem): 5 destinos con el encargado, 3 con el conductor. Fija abajo, respeta el
  // área segura del teléfono. Cada pestaña mide 4 rem de alto (más de 44 px) y la activa lleva la píldora de tinta (no solo color: también `aria-current`).
  // Las insignias cuentan lo pendiente; el lector las lee después del nombre. Se oculta dentro del parte (ahí manda la barra de envío).
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
    background: var(--c-superficie);
    border-top: 1px solid var(--c-borde);
    box-shadow: 0 -0.375rem 1.25rem rgb(0 0 0 / 0.05);
  }
  /* Una sola fila. Con el cuerpo de texto normal las pestañas se reparten el ancho; con el texto agrandado (rem) cada una se queda con lo que ocupa su palabra y la fila
     se desplaza por dentro (la página no): así ninguna palabra se parte y la barra no crece. El foco mueve la fila sola. */
  ul {
    display: flex;
    max-width: 40rem;
    margin: 0 auto;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
  }
  li {
    flex: 1 1 0;
    min-width: max-content;
  }
  .pestana {
    --icono-tam: 1.5rem;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1875rem;
    min-width: 4rem;
    min-height: var(--alto-pestanas);
    padding: 0.375rem 0 0.25rem;
    color: var(--c-texto-2);
    text-decoration: none;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: var(--t-rotulo);
    font-weight: 600;
    line-height: 1.1;
    -webkit-tap-highlight-color: transparent;
  }
  /* «Vencimientos» mide 69 px a 12 px de cuerpo: a 360 px de pantalla entra justo en su casilla de 72 px; por debajo de eso baja un punto en vez de partirse. */
  @media (max-width: 21.99rem) {
    .pestana {
      font-size: 0.6875rem;
    }
  }
  .pestana:focus-visible {
    outline-offset: -0.25rem;
    border-radius: var(--r-2);
  }
  .caja-icono {
    position: relative;
    display: grid;
    place-items: center;
    width: 3.25rem;
    height: 1.875rem;
    border-radius: var(--r-pildora);
    transition: background-color var(--m-rapido) linear;
  }
  @media (hover: hover) {
    .pestana:hover .caja-icono {
      background: var(--c-superficie-2);
    }
  }
  .pestana:active .caja-icono {
    background: var(--c-superficie-2);
  }
  .pestana[aria-current] {
    color: var(--c-texto);
    font-weight: 750;
  }
  .pestana[aria-current] .caja-icono {
    background: var(--c-tinta);
    color: var(--c-sobre-tinta);
  }
  .texto {
    text-align: center;
  }

  /* Insignia: cobre sólido para lo crítico, gris para lo que solo se cuenta. El anillo del color de la barra la separa del ícono. */
  .insignia {
    position: absolute;
    top: -0.3125rem;
    left: calc(50% + 0.5rem);
    display: grid;
    place-items: center;
    min-width: 1.1875rem;
    height: 1.1875rem;
    padding: 0 0.3125rem;
    border-radius: var(--r-pildora);
    background: var(--c-critico-solido);
    color: var(--c-sobre-solido);
    box-shadow: 0 0 0 2px var(--c-superficie);
    font-family: var(--t-familia);
    font-stretch: 100%;
    font-size: 0.7188rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .insignia.neutra {
    background: var(--c-texto-2);
    color: var(--c-superficie);
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

  /* Colores forzados: la píldora de la pestaña activa desaparece; queda el subrayado. */
  @media (forced-colors: active) {
    .pestana[aria-current] .texto {
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 0.25rem;
    }
  }
</style>
