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
    tamano?: "normal" | "grande";
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
  aria-label={etiqueta ?? resto["aria-label"]}
  aria-disabled={cargando ? "true" : resto["aria-disabled"]}
  onclick={alHacerClic}
>
  {#if icono !== undefined}<Icono nombre={icono} />{/if}
  {#if variante !== "icono"}{@render children?.()}{/if}
</button>

<style>
  .boton {
    --icono-tam: 1.125rem;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    padding: 0 var(--e-4);
    border: 1px solid transparent;
    border-radius: var(--r-2);
    background: var(--c-acento);
    color: var(--c-acento-texto);
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition:
      background-color var(--m-rapido) var(--m-curva),
      border-color var(--m-rapido) var(--m-curva);
  }
  .boton[data-tamano="grande"] {
    min-height: 3rem;
    padding: 0 var(--e-5);
    font-size: 1.0625rem;
  }
  .boton[aria-disabled="true"] {
    cursor: progress;
  }
  .boton:active {
    transform: translateY(1px);
  }
  @media (hover: hover) {
    .boton:hover {
      background: var(--c-acento-hover);
    }
  }

  /* Secundario */
  .boton[data-variante="secundario"] {
    background: var(--c-superficie);
    border-color: var(--c-borde-fuerte);
    color: var(--c-texto);
  }
  @media (hover: hover) {
    .boton[data-variante="secundario"]:hover {
      background: var(--c-superficie-2);
    }
  }
  /* Deshabilitado: solo el secundario (siempre con una explicación visible al lado, que pone quien lo usa). */
  .boton[data-variante="secundario"]:disabled {
    background: var(--c-superficie);
    border-color: var(--c-borde);
    color: var(--c-texto-3);
    cursor: not-allowed;
  }

  /* Texto: sin fondo, acento, subrayado de 1 px (2 px con el cursor encima). */
  .boton[data-variante="texto"] {
    padding: 0 var(--e-2);
    background: none;
    color: var(--c-acento);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
  .boton[data-variante="texto"]:active {
    transform: none;
  }
  @media (hover: hover) {
    .boton[data-variante="texto"]:hover {
      background: none;
      text-decoration-thickness: 2px;
    }
  }

  /* Peligro */
  .boton[data-variante="peligro"] {
    background: var(--c-critico-r);
    color: var(--c-peligro-texto);
  }
  @media (hover: hover) {
    .boton[data-variante="peligro"]:hover {
      background: var(--c-peligro-hover);
    }
  }

  /* Ícono: 44 × 44 de área, 2 rem de caja visible. El anillo de foco rodea la caja visible. */
  .boton[data-variante="icono"] {
    --icono-tam: 1.125rem;
    width: var(--alto-tactil);
    padding: 0;
    background: none;
    color: var(--c-texto-2);
  }
  .boton[data-variante="icono"]::before {
    content: "";
    position: absolute;
    inset: 0.375rem;
    border-radius: var(--r-2);
    transition: background-color var(--m-rapido) var(--m-curva);
  }
  .boton[data-variante="icono"] > :global(.icono) {
    position: relative;
  }
  .boton[data-variante="icono"]:focus-visible {
    outline: none;
  }
  .boton[data-variante="icono"]:focus-visible::before {
    outline: 2px solid var(--c-foco);
    outline-offset: 1px;
  }
  @media (hover: hover) {
    .boton[data-variante="icono"]:hover {
      background: none;
      color: var(--c-texto);
    }
    .boton[data-variante="icono"]:hover::before {
      background: var(--c-ventana-control-hover);
    }
  }
  .boton[data-variante="icono"]:active {
    transform: none;
  }

  @media (forced-colors: active) {
    .boton[data-variante="icono"]:focus-visible::before {
      outline-color: Highlight;
    }
  }
</style>
