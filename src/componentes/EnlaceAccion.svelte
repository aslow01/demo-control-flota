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
    tamano?: "normal" | "grande" | "chico";
    etiqueta?: string;
    alActivar?: (evento: MouseEvent) => void;
    children: Snippet;
  } = $props();
</script>

<a class="enlace-accion" data-variante={variante} data-tamano={tamano} {href} aria-label={etiqueta} onclick={alActivar}>{@render children()}</a>

<style>
  /* Pie de rey (15.5.1): el mismo aspecto y los mismos estados que `Boton.svelte` (mismas propiedades `--b-*`, mismo cursor de calibre y misma sombra dura). */
  .enlace-accion {
    --_fondo: var(--b-fondo, var(--c-hoja));
    --_texto: var(--b-texto, var(--c-tinta));
    --_borde: var(--b-borde, var(--c-tinta));
    --_hover: var(--b-fondo-hover, var(--c-papel-2));
    --_sombra: 2px;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--alto-control);
    padding: 0 0.875rem;
    min-width: min-content; /* ver `Boton.svelte`: con `overflow: hidden` el mínimo automático sería 0 */
    overflow: hidden; /* solo recorta el cursor de calibre */
    background: var(--_fondo);
    border: var(--b-control) solid var(--_borde);
    border-radius: var(--r-1);
    box-shadow: 0 var(--_sombra) 0 var(--_borde);
    color: var(--_texto);
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    text-decoration: none;
    transition:
      background-color var(--m-rapido) linear,
      transform var(--m-rapido) linear,
      box-shadow var(--m-rapido) linear;
  }
  .enlace-accion[data-tamano="grande"] {
    --_sombra: 3px;
    min-height: 3.25rem;
    padding: 0 var(--e-5);
    font-size: 1rem;
  }
  .enlace-accion[data-tamano="chico"] {
    min-height: 1.75rem;
    padding: 0 var(--e-3);
    font-size: 0.8125rem;
  }
  @media (max-width: 63.99rem) {
    .enlace-accion[data-tamano="chico"] {
      min-height: 2.5rem;
    }
  }
  .enlace-accion[data-variante="primario"] {
    --_fondo: var(--b-fondo, var(--c-tinta));
    --_texto: var(--b-texto, var(--c-sobre-tinta));
    --_borde: var(--b-borde, var(--c-tinta-borde));
    --_hover: var(--b-fondo-hover, var(--c-tinta-hover));
  }

  /* Cursor de calibre (ver `Boton.svelte`): solo en primario y secundario. */
  .enlace-accion::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent calc(100% - 1.5px), currentColor calc(100% - 1.5px));
    opacity: 0;
    pointer-events: none;
  }
  @keyframes calibre {
    from {
      opacity: 0.35;
      transform: translateX(-100%);
    }
    to {
      opacity: 0.35;
      transform: translateX(0);
    }
  }
  @media (hover: hover) {
    .enlace-accion:hover {
      background: var(--_hover);
    }
    .enlace-accion:hover::after {
      animation: calibre 520ms var(--m-curva-carro) 1;
    }
  }
  .enlace-accion:active {
    transform: translateY(2px);
    box-shadow: none;
  }

  /* Texto: sin fondo, borde ni sombra, en el color del enlace con subrayado de 1 px (2 px con el cursor encima), como el botón-texto. */
  .enlace-accion[data-variante="texto"] {
    --_fondo: transparent;
    --_texto: var(--c-pleno-texto);
    --_borde: transparent;
    --_hover: transparent;
    /* C12: sin relleno horizontal (ver `Boton.svelte`); el alto lo da `min-height`. */
    padding-inline: 0;
    box-shadow: none;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
  .enlace-accion[data-variante="texto"]::after {
    display: none;
  }
  .enlace-accion[data-variante="texto"]:active {
    transform: none;
  }
  /* C8: el anillo de foco no toca la primera letra (ver `Boton.svelte`). */
  .enlace-accion[data-variante="texto"]:focus-visible {
    outline-offset: 0.25rem;
  }
  @media (hover: hover) {
    .enlace-accion[data-variante="texto"]:hover {
      text-decoration-thickness: 2px;
    }
  }
  /* m2: en colores forzados el borde transparente se dibuja con un color del sistema; sin relleno tocaría las letras. */
  @media (forced-colors: active) {
    .enlace-accion {
      forced-color-adjust: none;
      background: ButtonFace;
      border-color: ButtonText;
      color: ButtonText;
      box-shadow: none;
    }
    .enlace-accion[data-variante="primario"] {
      background: ButtonText;
      color: ButtonFace;
    }
    .enlace-accion[data-variante="texto"] {
      padding-inline: var(--e-2);
      background: transparent;
      border-color: transparent;
      color: LinkText;
    }
  }
</style>
