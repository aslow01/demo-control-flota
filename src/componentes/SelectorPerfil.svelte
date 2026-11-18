<script lang="ts">
  // 5.2 Selector de perfil ("Ver como"): fieldset con legend visible y dos radios con aspecto de segmentos.
  // Es solo un punto de vista de la demo (no hay usuarios ni contraseñas). Navegación con flechas (radios nativos).
  // El componente no decide nada: avisa lo que se eligió y se mantiene alineado con el perfil que recibe. Si quien lo usa
  // no cambia el perfil (por ejemplo, porque primero hay que elegir quién es el conductor), el segmento vuelve a como estaba.
  // Con conductor elegido, debajo del selector va "Conductor: {nombre} (ficticia) · Cambiar".
  import Boton from "./Boton.svelte";
  import { TEXTO_MARCO } from "./textos-marco.ts";

  type TipoPerfil = "encargado" | "conductor";

  let {
    tipo,
    nombreConductor,
    alElegir,
    alCambiarConductor,
  }: {
    tipo: TipoPerfil;
    nombreConductor?: string;
    alElegir: (tipo: TipoPerfil) => void;
    alCambiarConductor?: () => void;
  } = $props();

  const opciones: { valor: TipoPerfil; texto: string }[] = [
    { valor: "encargado", texto: TEXTO_MARCO.perfilEncargado },
    { valor: "conductor", texto: TEXTO_MARCO.perfilConductor },
  ];

  let radios = $state<Record<TipoPerfil, HTMLInputElement | null>>({ encargado: null, conductor: null });

  /** Deja los radios como dice el perfil: el navegador ya marcó el que se pulsó, aunque el perfil no haya cambiado. */
  function sincronizar(): void {
    for (const o of opciones) {
      const radio = radios[o.valor];
      if (radio !== null) radio.checked = o.valor === tipo;
    }
  }

  function alCambiar(valor: TipoPerfil): void {
    if (valor !== tipo) alElegir(valor);
    sincronizar();
  }
</script>

<div class="selector">
  <fieldset>
    <legend>{TEXTO_MARCO.verComo}</legend>
    <div class="segmentos">
      {#each opciones as o (o.valor)}
        <label class="segmento">
          <input
            type="radio"
            name="perfil"
            class="solo-lectores"
            value={o.valor}
            checked={o.valor === tipo}
            bind:this={radios[o.valor]}
            onchange={() => alCambiar(o.valor)}
          />
          <span>{o.texto}</span>
        </label>
      {/each}
    </div>
  </fieldset>
  {#if tipo === "conductor" && nombreConductor !== undefined}
    <p class="conductor">
      <span>{TEXTO_MARCO.conductorElegido(nombreConductor)}</span>
      {#if alCambiarConductor !== undefined}
        <span aria-hidden="true">·</span>
        <Boton variante="texto" onclick={alCambiarConductor}>{TEXTO_MARCO.cambiarConductor}</Boton>
      {/if}
    </p>
  {/if}
</div>

<style>
  .selector {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    min-width: 0;
  }
  fieldset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-3);
  }
  /* El legend es visible, a la izquierda de los segmentos. Flotado para que quede en el flujo del fieldset. */
  legend {
    float: left;
    padding: 0;
    margin-right: var(--e-3);
    font-size: var(--t-chico);
    line-height: var(--alto-tactil);
    color: var(--c-texto-2);
  }
  .segmentos {
    display: flex;
  }

  .segmento {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 6.5rem;
    min-height: var(--alto-tactil);
    padding: 0 var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde-fuerte);
    color: var(--c-texto-2);
    cursor: pointer;
  }
  .segmento:first-child {
    border-radius: var(--r-2) 0 0 var(--r-2);
  }
  .segmento:last-child {
    margin-left: -1px;
    border-radius: 0 var(--r-2) var(--r-2) 0;
  }
  @media (hover: hover) {
    .segmento:hover {
      background: var(--c-superficie-2);
    }
  }
  /* Elegido: fondo suave, texto firme y una línea interior de 3 px del acento (una sola forma de decir "elegido"). */
  .segmento:has(input:checked) {
    z-index: 1;
    background: var(--c-acento-suave);
    box-shadow: inset 0 -3px 0 var(--c-acento);
    color: var(--c-texto);
    font-weight: 600;
  }
  .segmento:has(input:focus-visible) {
    z-index: 2;
    outline: 2px solid var(--c-foco);
    outline-offset: 2px;
  }

  .conductor {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--e-1);
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }

  @media (forced-colors: active) {
    .segmento:has(input:checked) {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
    .segmento:has(input:focus-visible) {
      outline-color: Highlight;
    }
  }
</style>
