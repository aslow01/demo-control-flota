<script lang="ts">
  // 5.5 Patente: rótulo chico, monoespaciado, con borde fino y una banda superior de 3 px. No imita la placa oficial.
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
    --alto: 1.5rem;
    --relleno: 0.375rem;
    --tam: var(--t-patente-chica);
    display: inline-flex;
    align-items: center;
    height: var(--alto);
    padding-inline: var(--relleno);
    background: var(--c-patente-fondo);
    color: var(--c-texto);
    border: 1px solid var(--c-borde-fuerte);
    border-top: 3px solid var(--c-patente-banda);
    border-radius: var(--r-1);
    font-family: var(--t-mono);
    font-size: var(--tam);
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.06em;
    white-space: nowrap;
    vertical-align: middle;
  }
  .patente[data-tamano="grande"] {
    --alto: 2.25rem;
    --relleno: 0.625rem;
    --tam: var(--t-patente-grande);
  }

  /* Dentro de un enlace: el rótulo es el enlace. El área de toque llega a 44 px de alto sin cambiar el aspecto. */
  .enlace-patente {
    position: relative;
    display: inline-flex;
    border-radius: var(--r-1);
    text-decoration: none;
    vertical-align: middle;
  }
  .enlace-patente::after {
    content: "";
    position: absolute;
    inset-inline: -0.25rem;
    inset-block: calc((var(--alto-tactil) - 1.5rem) / -2);
  }
  .enlace-patente:has(.patente[data-tamano="grande"])::after {
    inset-block: calc((var(--alto-tactil) - 2.25rem) / -2);
  }
  @media (hover: hover) {
    .enlace-patente:hover .patente {
      background: var(--c-acento-suave);
      border-left-color: var(--c-acento);
      border-right-color: var(--c-acento);
      border-bottom-color: var(--c-acento);
    }
  }

  @media (forced-colors: active) {
    .patente {
      border-color: CanvasText;
      border-top: 3px solid CanvasText;
    }
  }
</style>
