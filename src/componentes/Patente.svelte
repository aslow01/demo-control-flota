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
    <span class="solo-lectores">Ficha de </span><span class="patente objeto" data-tamano={tamano}>{texto}</span>
  </a>
{:else}
  <span class="patente objeto" data-tamano={tamano}>{texto}</span>
{/if}

<style>
  /* La chapa (15.5.2): un objeto de papel claro de día y de noche (`.objeto`, base.css, va en `.patente` y no en el enlace: el anillo de foco del enlace usa el plano). Tinta
     sobre `--obj-hoja`, borde de 1,5 px, esquinas de 3 px y una franja cobalto arriba. Sin leyenda, escudo ni bandera: no imita la placa oficial. */
  .patente {
    --tam: var(--t-patente-chica);
    --banda: 3px;
    --borde: 1.5px;
    position: relative;
    display: inline-block;
    /* La franja ocupa los primeros píxeles del relleno de arriba y el texto queda debajo. */
    padding: calc(var(--banda) + 0.1875rem) 0.375rem 0.1875rem;
    background: var(--obj-hoja);
    color: var(--obj-tinta);
    border: var(--borde) solid var(--obj-tinta);
    border-radius: var(--r-chapa);
    box-shadow: var(--s-pieza);
    font-family: var(--t-mono);
    font-size: var(--tam);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.04em;
    white-space: nowrap;
    vertical-align: middle;
  }
  .patente::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: var(--banda);
    background: var(--obj-franja);
  }
  /* La grande es la del título de la ficha y del parte: borde de 2 px y franja de 8 px. */
  .patente[data-tamano="grande"] {
    --tam: var(--t-patente-grande);
    --banda: 8px;
    --borde: 2px;
    padding: calc(var(--banda) + 0.25rem) 0.75rem 0.25rem;
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
  .enlace-patente .patente {
    transition:
      transform var(--m-rapido) linear,
      box-shadow var(--m-rapido) linear;
  }
  /* Cursor encima: la chapa sube 1 px y se levanta del papel; pulsada, baja 1 px y pierde la sombra. */
  @media (hover: hover) {
    .enlace-patente:hover .patente {
      transform: translateY(-1px);
      box-shadow: var(--s-flotante);
    }
  }
  .enlace-patente:active .patente {
    transform: translateY(1px);
    box-shadow: none;
  }

  @media (forced-colors: active) {
    .patente {
      border-color: CanvasText;
    }
    .patente::before {
      forced-color-adjust: none;
      background: CanvasText;
    }
  }
</style>
