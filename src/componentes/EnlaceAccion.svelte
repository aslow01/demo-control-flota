<script lang="ts">
  // Un enlace con el aspecto de un botón (5.1): para las acciones que llevan a otra pantalla («Abrir parte», «Ver ficha», «Empezar el parte»).
  // Es un <a>: navega; las acciones que hacen algo en el lugar son <button> (componente Boton).
  //  - `variante`: «secundario» (por defecto), «primario» (el que lleva a lo principal de la pantalla; uno solo por zona) o «texto» (sin fondo ni borde, como el botón-texto: «Volver al inicio»
  //    junto a un primario).
  //  - `alActivar`: para el enlace que lleva a la misma pantalla (la dirección no cambia y el enrutador no se entera): quien lo usa cancela la navegación y hace el cambio él.
  //  - `tamano`: «grande» (3 rem) para «Empezar el parte» y «Continuar el parte».
  //  - `etiqueta`: nombre accesible cuando el texto visible solo no alcanza («Cargarlo» + la patente y la fecha). Tiene que empezar con el texto visible.
  import type { Snippet } from "svelte";

  let {
    href,
    variante = "secundario",
    tamano = "normal",
    etiqueta,
    alActivar,
    children,
  }: {
    href: string;
    variante?: "primario" | "secundario" | "texto";
    tamano?: "normal" | "grande";
    etiqueta?: string;
    alActivar?: (evento: MouseEvent) => void;
    children: Snippet;
  } = $props();
</script>

<a class="enlace-accion" data-variante={variante} data-tamano={tamano} {href} aria-label={etiqueta} onclick={alActivar}>{@render children()}</a>

<style>
  .enlace-accion {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--alto-tactil);
    padding: 0 var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-2);
    color: var(--c-texto);
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    text-decoration: none;
    transition: background-color var(--m-rapido) var(--m-curva);
  }
  .enlace-accion[data-tamano="grande"] {
    min-height: 3rem;
    padding: 0 var(--e-5);
    font-size: 1.0625rem;
  }
  .enlace-accion[data-variante="primario"] {
    background: var(--c-acento);
    border-color: transparent;
    color: var(--c-acento-texto);
  }
  /* Texto: sin fondo, acento, subrayado de 1 px (2 px con el cursor encima), como el botón-texto. */
  .enlace-accion[data-variante="texto"] {
    /* C12: sin relleno horizontal (ver `Boton.svelte`); el alto de 44 px lo da `min-height`. */
    padding-inline: 0;
    background: none;
    border-color: transparent;
    color: var(--c-acento);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
  .enlace-accion:active {
    transform: translateY(1px);
  }
  .enlace-accion[data-variante="texto"]:active {
    transform: none;
  }
  /* C8: el anillo de foco no toca la primera letra (ver `Boton.svelte`). */
  .enlace-accion[data-variante="texto"]:focus-visible {
    outline-offset: 0.25rem;
  }
  /* m2: en colores forzados el borde transparente se dibuja con un color del sistema; sin relleno tocaría las letras. */
  @media (forced-colors: active) {
    .enlace-accion[data-variante="texto"] {
      padding-inline: var(--e-2);
    }
  }
  @media (hover: hover) {
    .enlace-accion:hover {
      background: var(--c-superficie-2);
    }
    .enlace-accion[data-variante="primario"]:hover {
      background: var(--c-acento-hover);
    }
    .enlace-accion[data-variante="texto"]:hover {
      background: none;
      text-decoration-thickness: 2px;
    }
  }
</style>
