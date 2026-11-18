<script lang="ts">
  // 5.2 Selector de perfil ("Ver como"): grupo con leyenda visible y dos botones con aspecto de segmentos (aria-pressed).
  // Son botones y no radios nativos a propósito: elegir "Conductor" abre un diálogo, y con radios una flecha del teclado lo abriría de
  // golpe (WCAG 3.2.2). Con botones se cambia activando (Enter, Espacio o toque), y la leyenda se describe con un aviso previo.
  // Es solo un punto de vista de la demo (no hay usuarios ni contraseñas).
  // El componente no decide nada: avisa lo que se eligió y refleja el perfil que recibe (sin parpadeos: no hay estado propio).
  // Con conductor elegido, debajo del selector va "Conductor: {nombre} (persona ficticia) · Cambiar conductor".
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

  const uid = $props.id();
  const idAyuda = $derived(`${uid}-ayuda`);

  function elegir(valor: TipoPerfil): void {
    if (valor !== tipo) alElegir(valor);
  }
</script>

<div class="selector">
  <div class="grupo" role="group" aria-labelledby="{uid}-leyenda" aria-describedby={idAyuda}>
    <span class="leyenda" id="{uid}-leyenda">{TEXTO_MARCO.verComo}</span>
    <span class="solo-lectores" id={idAyuda}>{TEXTO_MARCO.ayudaPerfilConductor}</span>
    <div class="segmentos">
      {#each opciones as o (o.valor)}
        <button type="button" class="segmento" aria-pressed={o.valor === tipo} onclick={() => elegir(o.valor)}>
          <span>{o.texto}</span>{#if o.valor === "conductor" && tipo !== "conductor"}<span aria-hidden="true">…</span>{/if}
        </button>
      {/each}
    </div>
  </div>
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
  .grupo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-3);
  }
  .leyenda {
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
  .segmento[aria-pressed="true"] {
    z-index: 1;
    background: var(--c-acento-suave);
    box-shadow: inset 0 -3px 0 var(--c-acento);
    color: var(--c-texto);
    font-weight: 600;
  }
  .segmento:focus-visible {
    z-index: 2;
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
    .segmento[aria-pressed="true"] {
      background: Highlight;
      color: HighlightText;
      box-shadow: none;
      forced-color-adjust: none;
    }
  }
</style>
