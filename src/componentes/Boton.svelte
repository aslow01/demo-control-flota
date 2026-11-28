<script lang="ts">
  // 5.1 Botones: primario, secundario, texto, peligro e ícono. Siempre un <button> (los enlaces son <a>).
  //
  // - Un solo primario visible por zona. El primario no se deshabilita: si no aplica, no se muestra.
  // - `cargando`: el botón queda con aria-disabled="true" (no `disabled`, para no perder el foco) y no dispara `onclick`.
  //   El texto "Guardando…" lo pone quien usa el botón.
  // - Variante `icono`: 44 × 44 de área, caja visible de 2 rem. Lleva `etiqueta` (nombre accesible) en vez de texto.
  // - La confirmación en dos pasos (Descartar borrador, 5.1) es de la pantalla: acá solo está la variante peligro.
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icono from "./Icono.svelte";
  import type { NombreIcono } from "./tipos.ts";

  type Props = Omit<HTMLButtonAttributes, "children" | "class" | "style"> & {
    variante?: "primario" | "secundario" | "texto" | "peligro" | "icono";
    /** «chico» (40 px) es para las filas y los detalles con mouse; por debajo de 64 rem mide 44 px como todo lo que se pulsa. */
    tamano?: "normal" | "grande" | "chico";
    /** Ícono a la izquierda del texto; en la variante `icono` es el único contenido. */
    icono?: NombreIcono;
    /** Nombre accesible del botón de ícono. */
    etiqueta?: string;
    cargando?: boolean;
    children?: Snippet;
  };

  let {
    variante = "primario",
    tamano = "normal",
    icono,
    etiqueta,
    cargando = false,
    type = "button",
    onclick,
    children,
    ...resto
  }: Props = $props();

  function alHacerClic(evento: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }): void {
    if (cargando) {
      evento.preventDefault();
      return;
    }
    onclick?.(evento);
  }
</script>

<button
  {...resto}
  {type}
  class="boton"
  data-variante={variante}
  data-tamano={tamano}
  data-cargando={cargando ? "" : undefined}
  aria-label={etiqueta ?? resto["aria-label"]}
  aria-disabled={cargando ? "true" : resto["aria-disabled"]}
  aria-busy={cargando ? "true" : undefined}
  onclick={alHacerClic}
>
  {#if icono !== undefined}<Icono nombre={icono} />{/if}
  {#if variante !== "icono"}{@render children?.()}{/if}
</button>

<style>
  /* Pie de rey (15.5.1). El botón lee cuatro propiedades que un contenedor puede dar sin tocar el `<script>`: `--b-fondo`, `--b-texto`, `--b-borde` y `--b-fondo-hover`
     (así la «Acción del día» le da el aspecto pleno). Las privadas `--_*` resuelven «lo que pidió el contenedor o, si no, lo de la variante»: una declaración propia del
     botón le ganaría a la herencia del contenedor, por eso la variante cambia el valor de reserva y no la propiedad. */
  .boton {
    --icono-tam: 1.125rem;
    --_fondo: var(--b-fondo, var(--c-tinta));
    --_texto: var(--b-texto, var(--c-sobre-tinta));
    --_borde: var(--b-borde, var(--c-tinta-borde));
    --_hover: var(--b-fondo-hover, var(--c-tinta-hover));
    --_sombra: 2px;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--e-2);
    min-height: var(--alto-control);
    padding: 0 0.875rem;
    min-width: min-content; /* con `overflow` distinto de visible el mínimo automático es 0: en una fila que reparte el ancho el texto se cortaba con la letra agrandada */
    overflow: hidden; /* solo recorta el cursor de calibre: el anillo de foco y la sombra se dibujan afuera de la caja */
    border: var(--b-control) solid var(--_borde);
    border-radius: var(--r-1);
    background: var(--_fondo);
    box-shadow: 0 var(--_sombra) 0 var(--_borde);
    color: var(--_texto);
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition:
      background-color var(--m-rapido) linear,
      transform var(--m-rapido) linear,
      box-shadow var(--m-rapido) linear;
  }
  .boton[data-tamano="grande"] {
    --_sombra: 3px;
    min-height: 3.25rem;
    padding: 0 var(--e-5);
    font-size: 1rem;
  }
  .boton[data-tamano="chico"] {
    min-height: 1.75rem;
    padding: 0 var(--e-3);
    font-size: 0.8125rem;
  }
  @media (max-width: 63.99rem) {
    .boton[data-tamano="chico"] {
      min-height: 2.5rem;
    }
  }

  /* Cursor de calibre (15.5.1): una línea de 1,5 px cruza el botón de izquierda a derecha una vez por entrada del puntero. Solo `transform` y `opacity`: el elemento mide todo
     el botón, con la línea en su borde derecho, y entra desde afuera por la izquierda. Decorativo: no lleva texto ni recibe el puntero. */
  .boton::after {
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

  /* Cursor encima (solo con mouse): el fondo y el calibre. */
  @media (hover: hover) {
    .boton:hover:not(:disabled, [aria-disabled="true"]) {
      background: var(--_hover);
    }
    .boton:hover:not(:disabled, [aria-disabled="true"])::after {
      animation: calibre 520ms var(--m-curva-carro) 1;
    }
  }

  /* Pulsado: baja 2 px y pierde la sombra. */
  .boton:active:not(:disabled, [aria-disabled="true"]) {
    transform: translateY(2px);
    box-shadow: none;
  }

  /* Cargando: igual que el normal de su variante, sin sombra y con el cursor de espera. El texto lo dice todo («Guardando…»). */
  .boton[data-cargando] {
    box-shadow: none;
    cursor: progress;
  }
  /* Secundario */
  .boton[data-variante="secundario"] {
    --_fondo: var(--b-fondo, var(--c-hoja));
    --_texto: var(--b-texto, var(--c-tinta));
    --_borde: var(--b-borde, var(--c-tinta));
    --_hover: var(--b-fondo-hover, var(--c-papel-2));
  }

  /* Texto: sin fondo, sin borde ni sombra, en el color del enlace con subrayado de 1 px (2 px con el cursor encima). */
  .boton[data-variante="texto"] {
    --_fondo: transparent;
    --_texto: var(--c-pleno-texto);
    --_borde: transparent;
    --_hover: transparent;
    /* C12: sin relleno horizontal, así empieza en la misma columna que el primario de arriba; el alto lo da `min-height`. */
    padding-inline: 0;
    box-shadow: none;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
  .boton[data-variante="texto"]:active:not(:disabled, [aria-disabled="true"]) {
    transform: none;
  }
  /* C8: el anillo de foco no toca la primera letra; sale 4 px dentro del relleno del contenedor, el texto no se mueve. */
  .boton[data-variante="texto"]:focus-visible {
    outline-offset: 0.25rem;
  }
  @media (hover: hover) {
    .boton[data-variante="texto"]:hover:not(:disabled, [aria-disabled="true"]) {
      text-decoration-thickness: 2px;
    }
  }
  .boton[data-variante="texto"]:disabled,
  .boton[data-variante="texto"][aria-disabled="true"]:not([data-cargando]) {
    --_fondo: transparent;
    --_texto: var(--c-tinta-3);
    --_borde: transparent;
  }

  /* Peligro: de contorno (15.5.1). Hoja, texto y borde en el crítico; con el cursor encima, su fondo suave. El relleno rojo con texto blanco no llega a 4,5:1 de noche. */
  .boton[data-variante="peligro"] {
    --_fondo: var(--b-fondo, var(--c-hoja));
    --_texto: var(--b-texto, var(--c-crit));
    --_borde: var(--b-borde, var(--c-crit));
    --_hover: var(--b-fondo-hover, var(--c-crit-fondo));
  }

  /* Ícono: caja de 36 px (44 por debajo de 64 rem); transparente, sin borde ni sombra. */
  .boton[data-variante="icono"] {
    --icono-tam: 1.125rem;
    --_fondo: transparent;
    --_texto: var(--c-tinta);
    --_borde: transparent;
    --_hover: var(--c-papel-2);
    flex: none; /* en una barra con un título largo no se achica */
    width: var(--alto-control);
    padding: 0;
    box-shadow: none;
  }
  .boton[data-variante="icono"]:active:not(:disabled, [aria-disabled="true"]) {
    transform: none;
  }
  .boton[data-variante="icono"]:disabled,
  .boton[data-variante="icono"][aria-disabled="true"]:not([data-cargando]),
  .boton[data-variante="icono"][data-cargando] {
    --_fondo: transparent;
    --_texto: var(--c-tinta-3);
    --_borde: transparent;
  }

  /* Deshabilitado (`disabled`, o `aria-disabled` sin carga): papel, tinta apagada y sin sombra. Va después de las variantes: si no, ellas le ganarían. */
  .boton:disabled,
  .boton[aria-disabled="true"]:not([data-cargando]) {
    --_fondo: var(--c-papel-2);
    --_texto: var(--c-tinta-3);
    --_borde: var(--c-control);
    box-shadow: none;
    cursor: not-allowed;
  }

  /* El calibre es de los botones con relleno (primario, secundario y pleno): los demás no lo llevan. */
  .boton[data-variante="texto"]::after,
  .boton[data-variante="peligro"]::after,
  .boton[data-variante="icono"]::after {
    display: none;
  }

  @media (forced-colors: active) {
    .boton {
      forced-color-adjust: none;
      background: ButtonFace;
      border-color: ButtonText;
      color: ButtonText;
      box-shadow: none;
    }
    .boton[data-variante="primario"] {
      background: ButtonText;
      color: ButtonFace;
    }
    .boton:disabled,
    .boton[aria-disabled="true"]:not([data-cargando]) {
      border-color: GrayText;
      color: GrayText;
    }
    /* m2: en colores forzados el borde transparente se dibuja con un color del sistema; sin relleno tocaría las letras. */
    .boton[data-variante="texto"] {
      padding-inline: var(--e-2);
      background: transparent;
      border-color: transparent;
      color: LinkText;
    }
    .boton[data-variante="icono"] {
      background: transparent;
      border-color: transparent;
    }
  }
</style>
