<script lang="ts">
  // 5.13 Selector de combustible: un `fieldset` con cinco radios como segmentos contiguos (Reserva, 1/4, 1/2, 3/4, Lleno; 48 px). Los segmentos hasta el elegido llevan
  // una barra inferior de 6 px (se lee como un medidor); el elegido, además, fondo, texto firme e ícono. El valor se lee por el radio, no por la barra. Con poco ancho
  // (menos de 22 rem) el texto baja a --t-chico y el ícono se va: el fondo, la barra y el peso siguen diciendo cuál es.
  // El primer radio lleva `id` (el resumen de errores enlaza ahí).
  import type { NivelCombustible } from "../lib/dominio/tipos.ts";
  import Icono from "./Icono.svelte";

  let {
    leyenda,
    opciones,
    valor = $bindable(""),
    id,
    error = "",
    requerido = false,
  }: {
    leyenda: string;
    /** Lleva el asterisco de obligatorio en la leyenda (el nivel de combustible lo es en el cierre). */
    requerido?: boolean;
    opciones: readonly { valor: NivelCombustible; etiqueta: string }[];
    valor?: "" | NivelCombustible;
    id: string;
    error?: string;
  } = $props();

  const uid = $props.id();
  const nombre = $derived(`${uid}-nivel`);
  const idError = $derived(`${id}-error`);
  const elegido = $derived(opciones.findIndex((o) => o.valor === valor));
</script>

<fieldset class="combustible" class:con-error={error !== ""} role="radiogroup" aria-required="true" aria-invalid={error !== "" ? "true" : undefined} aria-describedby={error !== "" ? idError : undefined}>
  <legend>{leyenda}{#if requerido}<span aria-hidden="true"> *</span>{/if}</legend>
  {#if error !== ""}
    <p class="error" id={idError}><Icono nombre="vencido" /><span>{error}</span></p>
  {/if}
  <div class="segmentos">
    {#each opciones as o, i (o.valor)}
      <label class="segmento" data-lleno={i <= elegido ? "" : undefined}>
        <input type="radio" id={i === 0 ? id : undefined} name={nombre} value={o.valor} bind:group={valor} />
        <span class="texto"><span class="icono-elegido"><Icono nombre="check" /></span>{o.etiqueta}</span>
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .combustible {
    container: combustible / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    min-width: 0;
  }
  .combustible.con-error {
    padding-left: var(--e-3);
    border-left: 4px solid var(--c-critico-r);
  }
  legend {
    padding: 0;
    margin-bottom: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
  }
  .error {
    --icono-tam: 1rem;
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-critico-t);
  }
  .error :global(.icono) {
    margin-top: 0.1rem;
  }

  .segmentos {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .segmento {
    --icono-tam: 1rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--alto-segmento);
    padding: 0 var(--e-1);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde-fuerte);
    color: var(--c-texto);
    line-height: 1.2;
    text-align: center;
    cursor: pointer;
  }
  .segmento + .segmento {
    margin-left: -1px;
  }
  .segmento:first-child {
    border-radius: var(--r-2) 0 0 var(--r-2);
  }
  .segmento:last-child {
    border-radius: 0 var(--r-2) var(--r-2) 0;
  }
  .segmento input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .texto {
    display: inline-flex;
    align-items: center;
    gap: var(--e-1);
  }
  .icono-elegido {
    display: none;
    color: var(--c-acento);
  }
  /* El medidor: una barra de 6 px abajo en todos los segmentos hasta el elegido. */
  .segmento[data-lleno] {
    box-shadow: inset 0 -6px 0 var(--c-acento);
  }
  @media (hover: hover) {
    .segmento:hover {
      background: var(--c-superficie-2);
    }
  }
  .segmento:has(input:checked) {
    z-index: 1;
    background: var(--c-acento-suave);
    font-weight: 600;
  }
  .segmento:has(input:checked) .icono-elegido {
    display: inline-flex;
  }
  .segmento:has(input:focus-visible) {
    z-index: 2;
    outline: 2px solid var(--c-foco);
    outline-offset: 2px;
  }

  @container combustible (max-width: 21.99rem) {
    .segmento {
      font-size: var(--t-chico);
    }
    .segmento:has(input:checked) .icono-elegido {
      display: none;
    }
  }

  /* B4 de la etapa 7: con el texto agrandado (el selector mide 17 rem o menos) cinco columnas dejan segmentos de 32 a 41 px, menos de 44 y con «Reserva» partida;
     los cinco segmentos pasan a una columna (uno debajo del otro) y el medidor, de la barra de abajo a una barra a la izquierda. */
  @container combustible (max-width: 17rem) {
    .segmentos {
      grid-template-columns: minmax(0, 1fr);
    }
    .segmento + .segmento {
      margin-left: 0;
      margin-top: -1px;
    }
    .segmento:first-child {
      border-radius: var(--r-2) var(--r-2) 0 0;
    }
    .segmento:last-child {
      border-radius: 0 0 var(--r-2) var(--r-2);
    }
    .segmento[data-lleno] {
      box-shadow: inset 6px 0 0 var(--c-acento);
    }
  }

  @media (forced-colors: active) {
    .segmento[data-lleno] {
      border-bottom: 6px solid Highlight;
      box-shadow: none;
    }
    @container combustible (max-width: 17rem) {
      .segmento[data-lleno] {
        border-bottom: 1px solid Highlight;
        border-left: 6px solid Highlight;
      }
    }
    .segmento:has(input:checked) {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
    .segmento:has(input:checked) .icono-elegido {
      color: HighlightText;
    }
  }
</style>
