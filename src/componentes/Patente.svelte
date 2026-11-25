<script lang="ts">
  // 5.5 Patente: la «chapa». Rótulo monoespaciado con borde fino y una banda superior gruesa, como un cartel de matrícula; no imita la placa oficial.
  // Recibe la patente ya normalizada (`ZK214BD`) y la muestra con espacios (`ZK 214 BD`).
  // Sin `href` no es interactiva. Con `href` es el enlace a la ficha: el texto oculto dice "Ficha de ZK 214 BD".
  import { formatearPatente } from "../lib/dominio/patente.ts";

  let {
    patente,
    tamano = "chica",
    href,
  }: {
    patente: string;
    tamano?: "chica" | "grande";
    href?: string;
  } = $props();

  const texto = $derived(formatearPatente(patente));
</script>

{#if href !== undefined}
  <a class="enlace-patente" {href} data-tamano={tamano}>
    <span class="solo-lectores">Ficha de </span><span class="patente" data-tamano={tamano}>{texto}</span>
  </a>
{:else}
  <span class="patente" data-tamano={tamano}>{texto}</span>
{/if}

<style>
  .patente {
    --tam: var(--t-patente-chica);
    --banda: 4px;
    --borde: 1.5px;
    --color-banda: var(--c-patente-banda);
    display: inline-block;
    padding: 0.0625rem 0.375rem 0.125rem;
    background: var(--c-patente-fondo);
    color: var(--c-texto);
    border: var(--borde) solid var(--c-borde-fuerte);
    border-top: var(--banda) solid var(--color-banda);
    border-radius: 3px;
    font-family: var(--t-mono);
    font-size: var(--tam);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.04em;
    white-space: nowrap;
    vertical-align: middle;
  }
  /* La grande es la de la ficha: banda de 6 px en el color del texto. */
  .patente[data-tamano="grande"] {
    --tam: var(--t-patente-grande);
    --banda: 6px;
    --borde: 2px;
    --color-banda: var(--c-texto);
    padding: 0.125rem 0.75rem 0.25rem;
  }
  @media (max-width: 22.5rem) {
    .patente[data-tamano="grande"] {
      --tam: 1.375rem;
      padding-inline: 0.625rem;
    }
  }

  /* Dentro de un enlace: el rótulo es el enlace. El propio enlace mide 44 px de alto como mínimo (no solo un área invisible), con el rótulo centrado. */
  .enlace-patente {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-height: var(--alto-tactil);
    border-radius: var(--r-1);
    text-decoration: none;
    vertical-align: middle;
  }
  .enlace-patente::after {
    content: "";
    position: absolute;
    inset-inline: -0.25rem;
    inset-block: 0;
  }
  @media (hover: hover) {
    .enlace-patente:hover .patente {
      border-color: var(--c-texto);
    }
  }

  @media (forced-colors: active) {
    .patente {
      border-color: CanvasText;
      border-top: var(--banda) solid CanvasText;
    }
  }
</style>
