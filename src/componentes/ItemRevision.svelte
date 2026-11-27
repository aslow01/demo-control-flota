<script lang="ts">
  // 5.12 Ítem de checklist del parte: un `fieldset` con el punto como `legend` (y la marca «Punto crítico» si lo es), dos radios con aspecto de segmentos
  // («En orden» / «Con novedad», 48 px, mitad y mitad; elegidos: tinta y cobre sólido) y, con «Con novedad», la descripción («¿Qué encontró?») y: en un punto crítico, la nota
  // de que la unidad queda fuera de servicio; en uno que no lo es, la casilla «Impide usar la unidad». El texto escrito se conserva aunque se vuelva a «En orden».
  //  - El riel izquierdo de 4 px habla de la respuesta (no de si el punto es crítico: eso lo dice la forma junto al nombre): gris sin responder, malaquita «En orden»,
  //    cobre «Con novedad» (con un fondo cobre suave) y cobre también sin responder después de intentar enviar. Va con `box-shadow` interior: no mueve nada.
  //  - Sin responder después de intentar enviar: el mensaje va arriba de los segmentos (si ya eligió «Con novedad», sobre la descripción). El error no desaparece solo:
  //    se vuelve a calcular al enviar.
  //  - El `fieldset` es un `radiogroup` obligatorio (`aria-required`: el punto no lleva asterisco y el lector lo dice) y, sin responder tras intentar enviar, `aria-invalid`.
  //  - El primer radio lleva el id del ítem (`idBase`): el resumen de errores enlaza ahí; la descripción, `idBase-descripcion`.
  //  - El campo de la descripción aparece con el radio, sin animación de alto, y no roba el foco (se llega con Tab).
  import type { ValoresItem } from "../lib/dominio/formulario-parte-valores.ts";
  import { TEXTO_DIALOGOS_FICHA } from "../lib/dominio/textos-base.ts";
  import Campo from "./Campo.svelte";
  import Casilla from "./Casilla.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import Forma from "./Forma.svelte";
  import { TEXTO_PARTE_VISTA as T } from "./textos-marco-parte.ts";

  let {
    texto,
    critico,
    notaCritica,
    etiquetaImpideUso,
    idBase,
    valor = $bindable(),
    error = "",
  }: {
    texto: string;
    critico: boolean;
    /** Solo en los críticos. */
    notaCritica: string | null;
    etiquetaImpideUso: string;
    idBase: string;
    valor: ValoresItem;
    error?: string;
  } = $props();

  const uid = $props.id();
  const nombre = $derived(`${uid}-respuesta`);
  const idError = $derived(`${idBase}-error`);
  const idNota = $derived(`${idBase}-nota`);
  const conNovedad = $derived(valor.respuesta === "con-novedad");
  // El error de la descripción va sobre su campo; el de «sin responder», sobre los segmentos.
  const errorDeSegmentos = $derived(conNovedad ? "" : error);
  const errorDeDescripcion = $derived(conNovedad ? error : "");
  const sinResponder = $derived(errorDeSegmentos !== "");
  const describedby = $derived([errorDeSegmentos !== "" ? idError : "", conNovedad && critico ? idNota : ""].filter((s) => s !== "").join(" ") || undefined);
</script>

<fieldset
  class="item"
  class:con-error={error !== ""}
  class:critico
  data-resp={conNovedad ? "novedad" : valor.respuesta === "en-orden" ? "orden" : undefined}
  role="radiogroup"
  aria-required="true"
  aria-invalid={sinResponder ? "true" : undefined}
  aria-describedby={describedby}
>
  <legend>
    <span class="nombre">{texto}</span>
    {#if critico}<Etiqueta tono="critico" variante="texto">{T.puntoCritico}</Etiqueta>{/if}
  </legend>

  {#if errorDeSegmentos !== ""}
    <p class="error" id={idError}><Forma forma="rombo" tono="critico" /><span>{errorDeSegmentos}</span></p>
  {/if}

  <div class="segmentos">
    <label class="segmento" data-respuesta="en-orden">
      <input type="radio" id={idBase} name={nombre} value="en-orden" bind:group={valor.respuesta} />
      <span>{T.enOrden}</span>
    </label>
    <label class="segmento" data-respuesta="con-novedad">
      <input type="radio" name={nombre} value="con-novedad" bind:group={valor.respuesta} />
      <span>{T.conNovedad}</span>
    </label>
  </div>

  {#if conNovedad}
    <div class="novedad">
      <Campo etiqueta={T.queEncontro} tipo="area" id={`${idBase}-descripcion`} bind:valor={valor.descripcion} requerido error={errorDeDescripcion} />
      {#if critico && notaCritica !== null}
        <p class="nota-critica" id={idNota}><Forma forma="rombo" tono="critico" /><span>{notaCritica}</span></p>
      {:else if !critico}
        <Casilla etiqueta={etiquetaImpideUso} bind:marcada={valor.impideUso} ayuda={TEXTO_DIALOGOS_FICHA.cargarNovedad.impideNota} />
      {/if}
    </div>
  {/if}
</fieldset>

<style>
  /* Una fila del checklist dentro de la tarjeta de la revisión (que pone el divisor entre filas). El riel va con `box-shadow` interior: no ocupa lugar. */
  .item {
    --riel: var(--c-superficie-2);
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    min-width: 0;
    padding: var(--e-3) var(--e-4) var(--e-4) calc(var(--e-4) + 2px);
    box-shadow: inset 4px 0 0 var(--riel);
    transition:
      box-shadow var(--m-medio) linear,
      background-color var(--m-medio) linear;
  }
  .item[data-resp="orden"] {
    --riel: var(--c-vigente-r);
  }
  .item[data-resp="novedad"] {
    --riel: var(--c-critico-r);
    background: color-mix(in srgb, var(--c-critico-f) 40%, var(--c-superficie));
  }
  .item.con-error {
    --riel: var(--c-critico-r);
  }
  /* Texto agrandado (el parte mide 17 rem o menos): casi sin relleno a los lados (el riel de 4 px y un poco más) y el nombre del punto en el tamaño del cuerpo, para que una palabra\n     como «Documentación» entre entera en su renglón (S5 de la etapa 7). */
  @container parte (max-width: 17rem) {
    .item {
      padding-inline: calc(var(--e-1) + 4px) var(--e-1);
    }
  }
  /* 320 px con el texto agrandado (el parte mide 8 rem): sin relleno a la derecha, para que una palabra de 7 rem entre entera. */
  @container parte (max-width: 8.5rem) {
    .item {
      padding-inline: calc(var(--e-1) + 2px) 0;
    }
  }
  /* El nombre y la marca de «Punto crítico» en un renglón; si no entran, la marca baja. Flotado, el `legend` deja de ser «el rótulo sobre el borde» y es un hijo más:
     el relleno del `fieldset` queda arriba, como en el resto de la fila. */
  legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    float: left;
    width: 100%;
    padding: 0;
    gap: var(--e-1) var(--e-2);
  }
  legend ~ :global(*) {
    clear: both;
  }
  .nombre {
    font-size: 1.0625rem;
    font-weight: 650;
    line-height: 1.3;
    /* m1 de la etapa 7: si el nombre del punto no entra ni en su propio renglón (320 px con el texto al 200 %), se parte en vez de ensanchar la página. */
    overflow-wrap: anywhere;
  }
  @container parte (max-width: 17rem) {
    .nombre {
      font-size: var(--t-cuerpo);
      font-weight: 600;
    }
  }

  .error {
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-size: var(--t-chico);
    font-weight: 650;
    line-height: 1.4;
    color: var(--c-critico-t);
    overflow-wrap: anywhere;
  }
  .error :global(.forma),
  .nota-critica :global(.forma) {
    margin-block: 0.3125rem 0;
  }
  /* Texto agrandado: el mensaje baja debajo de su forma si no entra a su lado sin partir una palabra (S5 de la etapa 7). */
  @container parte (max-width: 17rem) {
    .error,
    .nota-critica {
      flex-wrap: wrap;
    }
    .error > span:last-child,
    .nota-critica > span:last-child {
      flex: 1 1 7rem;
      min-width: 0;
    }
  }

  /* Dos segmentos, 50 % y 50 %, 48 px. El radio ocupa toda la caja y no se ve: el segmento dice si está elegido. */
  .segmentos {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--e-2);
  }
  /* Texto agrandado: los dos segmentos uno debajo del otro (va después de la regla base: a igual especificidad, gana la última). */
  @container parte (max-width: 17rem) {
    .segmentos {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .segmento {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--alto-segmento);
    padding: 0 var(--e-2);
    background: var(--c-superficie);
    border: var(--b-control) solid var(--c-borde-fuerte);
    border-radius: var(--r-1);
    color: var(--c-texto);
    font-size: 0.9375rem;
    font-weight: 650;
    line-height: 1.2;
    text-align: center;
    cursor: pointer;
    transition: background-color var(--m-rapido) linear;
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
  @media (hover: hover) {
    .segmento:not(:has(input:checked)):hover {
      background: var(--c-superficie-2);
    }
  }
  /* Elegido: «En orden» en tinta (la acción), «Con novedad» en cobre sólido; con un filete interior que da el contraste del borde también en oscuro. */
  .segmento[data-respuesta="en-orden"]:has(input:checked) {
    background: var(--c-tinta);
    border-color: var(--c-tinta);
    color: var(--c-sobre-tinta);
  }
  .segmento[data-respuesta="con-novedad"]:has(input:checked) {
    background: var(--c-critico-solido);
    border-color: var(--c-critico-r);
    box-shadow: inset 0 0 0 1px var(--c-critico-r);
    color: var(--c-sobre-solido);
  }
  .item.con-error .segmento:not(:has(input:checked)) {
    border-color: var(--c-critico-r);
  }
  .segmento:has(input:focus-visible) {
    outline: 3px solid var(--c-foco);
    outline-offset: 2px;
  }

  .novedad {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    min-width: 0;
  }
  /* La nota del punto crítico es texto llano (como la ayuda de un campo), con la forma del tono al lado. */
  .nota-critica {
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto-2);
    overflow-wrap: anywhere;
  }

  @media (forced-colors: active) {
    .item {
      border-left: 4px solid CanvasText;
      box-shadow: none;
    }
    .segmento:has(input:checked) {
      background: Highlight;
      color: HighlightText;
      box-shadow: none;
      forced-color-adjust: none;
    }
  }
</style>
