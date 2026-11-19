<script lang="ts">
  // 5.12 Ítem de checklist del parte: un `fieldset` con el punto como `legend` (y la etiqueta «Punto crítico» si lo es), dos radios con aspecto de segmentos
  // («En orden» / «Con novedad», 48 px, mitad y mitad) y, con «Con novedad», la descripción («¿Qué encontró?») y: en un punto crítico, la nota de que la unidad
  // queda fuera de servicio; en uno que no lo es, la casilla «Impide usar la unidad». El texto escrito se conserva aunque se vuelva a «En orden».
  //  - Sin responder después de intentar enviar: borde izquierdo de 4 px crítico y el mensaje arriba de los segmentos (si ya eligió «Con novedad», el
  //    mensaje va sobre la descripción). El error no desaparece solo: se vuelve a calcular al enviar.
  //  - El primer radio lleva el id del ítem (`idBase`): el resumen de errores enlaza ahí; la descripción, `idBase-descripcion`.
  //  - El campo de la descripción aparece con el radio, sin animación de alto, y no roba el foco (se llega con Tab).
  import type { ValoresItem } from "../lib/dominio/formulario-parte.ts";
  import { TEXTO_DIALOGOS_FICHA } from "../lib/dominio/textos.ts";
  import Campo from "./Campo.svelte";
  import Casilla from "./Casilla.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import Icono from "./Icono.svelte";
  import { TEXTO_PARTE_VISTA as T } from "./textos-marco.ts";

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
  const describedby = $derived([errorDeSegmentos !== "" ? idError : "", conNovedad && critico ? idNota : ""].filter((s) => s !== "").join(" ") || undefined);
</script>

<fieldset class="item" class:con-error={error !== ""} class:critico aria-describedby={describedby}>
  <legend>
    <span class="nombre">{texto}</span>
    {#if critico}<Etiqueta tono="neutro" icono="octogono">{T.puntoCritico}</Etiqueta>{/if}
  </legend>

  {#if errorDeSegmentos !== ""}
    <p class="error" id={idError}><Icono nombre="vencido" /><span>{errorDeSegmentos}</span></p>
  {/if}

  <div class="segmentos">
    <label class="segmento" data-respuesta="en-orden">
      <input type="radio" id={idBase} name={nombre} value="en-orden" bind:group={valor.respuesta} />
      <Icono nombre="check" />
      <span>{T.enOrden}</span>
    </label>
    <label class="segmento" data-respuesta="con-novedad" data-critico={critico ? "" : undefined}>
      <input type="radio" name={nombre} value="con-novedad" bind:group={valor.respuesta} />
      <Icono nombre="alerta" />
      <span>{T.conNovedad}</span>
    </label>
  </div>

  {#if conNovedad}
    <div class="novedad">
      <Campo etiqueta={T.queEncontro} tipo="area" id={`${idBase}-descripcion`} bind:valor={valor.descripcion} requerido error={errorDeDescripcion} />
      {#if critico && notaCritica !== null}
        <p class="nota-critica" id={idNota}><Icono nombre="octogono" /><span>{notaCritica}</span></p>
      {:else if !critico}
        <Casilla etiqueta={etiquetaImpideUso} bind:marcada={valor.impideUso} ayuda={TEXTO_DIALOGOS_FICHA.cargarNovedad.impideNota} />
      {/if}
    </div>
  {/if}
</fieldset>

<style>
  .item {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    min-width: 0;
    padding-block: 0 var(--e-4);
    /* Separados por un divisor de 1 px (quien los junta le quita el del último). Va abajo: el de arriba lo cortaría la leyenda. */
    border-bottom: 1px solid var(--c-borde);
  }
  /* Sin responder tras intentar enviar: borde izquierdo de 4 px crítico (el mensaje lo dice con texto: el color no va solo). */
  .item.con-error {
    padding-left: var(--e-3);
    border-left: 4px solid var(--c-critico-r);
  }
  legend {
    display: flex;
    width: 100%;
    padding: var(--e-4) 0 0;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2) var(--e-3);
  }
  .nombre {
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

  /* Dos segmentos, 50 % y 50 %, 48 px. El radio ocupa toda la caja y no se ve: el segmento dice si está elegido. */
  .segmentos {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--e-2);
  }
  .segmento {
    --icono-tam: 1.125rem;
    --fondo: var(--c-superficie);
    --marca: var(--c-borde-fuerte);
    --icono-color: var(--c-texto-2);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--e-2);
    min-height: var(--alto-segmento);
    padding: 0 var(--e-3);
    background: var(--fondo);
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-2);
    color: var(--c-texto);
    line-height: 1.2;
    text-align: center;
    cursor: pointer;
  }
  .segmento :global(.icono) {
    flex: none;
    color: var(--icono-color);
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
    .segmento:hover {
      --fondo: var(--c-superficie-2);
    }
  }
  /* Elegido: fondo y borde de 2 px (el borde de 1 px más un anillo interior, para que la caja no se mueva), texto firme e ícono del tono. */
  .segmento:has(input:checked) {
    border-color: var(--marca);
    box-shadow: inset 0 0 0 1px var(--marca);
    font-weight: 600;
  }
  .segmento[data-respuesta="en-orden"]:has(input:checked) {
    --fondo: var(--c-vigente-f);
    --marca: var(--c-vigente-r);
    --icono-color: var(--c-vigente-t);
  }
  .segmento[data-respuesta="con-novedad"]:has(input:checked) {
    --fondo: var(--c-semana-f);
    --marca: var(--c-semana-r);
    --icono-color: var(--c-semana-t);
  }
  .segmento[data-respuesta="con-novedad"][data-critico]:has(input:checked) {
    --fondo: var(--c-critico-f);
    --marca: var(--c-critico-r);
    --icono-color: var(--c-critico-t);
  }
  .segmento:has(input:focus-visible) {
    outline: 2px solid var(--c-foco);
    outline-offset: 2px;
  }

  .novedad {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    min-width: 0;
  }
  .nota-critica {
    --icono-tam: 1rem;
    display: flex;
    align-items: flex-start;
    gap: var(--e-2);
    padding: var(--e-3);
    background: var(--c-critico-f);
    border-left: 4px solid var(--c-critico-r);
    border-radius: var(--r-2);
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto);
  }
  .nota-critica :global(.icono) {
    flex: none;
    margin-top: 0.1rem;
    color: var(--c-critico-t);
  }

  @media (forced-colors: active) {
    .segmento:has(input:checked) {
      background: Highlight;
      color: HighlightText;
      box-shadow: none;
      forced-color-adjust: none;
    }
    .segmento:has(input:checked) :global(.icono) {
      color: HighlightText;
    }
  }
</style>
