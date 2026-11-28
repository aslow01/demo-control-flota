<script lang="ts">
  // 5.13 Selector de combustible: un `fieldset` con cinco radios como segmentos contiguos (Reserva, 1/4, 1/2, 3/4, Lleno; 48 px). Los segmentos hasta el elegido llevan
  // una barra inferior de 6 px de tinta (se lee como un medidor); el elegido, además, va relleno de tinta con el tilde. El valor se lee por el radio, no por la barra. Con poco ancho
  // (menos de 22 rem) el texto baja a --t-chico y el tilde se va: el fondo, la barra y el peso siguen diciendo cuál es.
  // El primer radio lleva `id` (el resumen de errores enlaza ahí).
  import type { NivelCombustible } from "../lib/dominio/tipos.ts";
  import Forma from "./Forma.svelte";
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
    <p class="error" id={idError}><Forma forma="rombo" tono="critico" /><span>{error}</span></p>
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
  /* Pie de rey (15.5.10): cinco segmentos de 48 px con borde de tinta; se llenan en tinta hasta el elegido (`data-lleno`) y el elegido lleva, además, su texto en peso 650 y una
     marca de 3 px abajo (un medidor que se lee por la forma, no por el color). Sigue siendo un grupo de radios. */
  .combustible {
    container: combustible / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    min-width: 0;
  }
  /* Error: como en `Campo`, una barra de 3 px a la izquierda en el color de marca crítico y el borde de los segmentos en el mismo color. */
  .combustible.con-error {
    padding-left: var(--e-3);
    border-left: 3px solid var(--c-crit-marca);
  }
  .combustible.con-error .segmento {
    border-color: var(--c-crit-marca);
  }
  legend {
    padding: 0;
    margin-bottom: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-tinta);
  }
  .error {
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-crit);
  }
  .error :global(.forma) {
    margin-block: 0.3125rem 0;
  }

  .segmentos {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .segmento {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--alto-segmento);
    padding: 0 var(--e-1);
    background: var(--c-hoja);
    border: var(--b-control) solid var(--c-tinta);
    color: var(--c-tinta);
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    cursor: pointer;
    transition: background-color var(--m-rapido) linear;
  }
  .segmento + .segmento {
    margin-left: calc(-1 * var(--b-control));
  }
  .segmento:first-child {
    border-radius: var(--r-1) 0 0 var(--r-1);
  }
  .segmento:last-child {
    border-radius: 0 var(--r-1) var(--r-1) 0;
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
  /* La marca de verificación ya no se dibuja: el medidor lleno y la marca de abajo dicen cuál es. */
  .icono-elegido {
    display: none;
  }
  /* El medidor: los segmentos hasta el elegido, llenos de tinta. */
  .segmento[data-lleno] {
    background: var(--c-tinta);
    color: var(--c-sobre-tinta);
  }
  @media (hover: hover) {
    .segmento:not([data-lleno]):hover {
      background: var(--c-papel-2);
    }
  }
  /* El elegido: peso 650 y una marca de 3 px abajo, en el color del texto sobre la tinta. */
  .segmento:has(input:checked) {
    z-index: 1;
    font-weight: 650;
    box-shadow: inset 0 -3px 0 var(--c-sobre-tinta);
  }
  .segmento:has(input:focus-visible) {
    z-index: 2;
    outline: 3px solid var(--c-foco);
    outline-offset: 2px;
  }

  @container combustible (max-width: 21.99rem) {
    .segmento {
      font-size: var(--t-chico);
    }
  }

  /* B4 de la etapa 7: con el texto agrandado (el selector mide 17 rem o menos) cinco columnas dejan segmentos de 32 a 41 px, menos de 44 y con «Reserva» partida;
     los cinco segmentos pasan a una columna (uno debajo del otro) y la marca del elegido, de abajo a la izquierda. */
  @container combustible (max-width: 17rem) {
    .segmentos {
      grid-template-columns: minmax(0, 1fr);
    }
    .segmento + .segmento {
      margin-left: 0;
      margin-top: calc(-1 * var(--b-control));
    }
    .segmento:first-child {
      border-radius: var(--r-1) var(--r-1) 0 0;
    }
    .segmento:last-child {
      border-radius: 0 0 var(--r-1) var(--r-1);
    }
    .segmento:has(input:checked) {
      box-shadow: inset 3px 0 0 var(--c-sobre-tinta);
    }
  }

  @media (forced-colors: active) {
    .segmento[data-lleno] {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
    .segmento:has(input:checked) {
      box-shadow: inset 0 -3px 0 HighlightText;
    }
  }
</style>
