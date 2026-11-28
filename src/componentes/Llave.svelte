<script lang="ts">
  // Una llave del tablero completo de la regla de salida (docs/diseno-ui.md, 15.6.3): el enlace a la ficha de una unidad activa y, si no sale, su globo con el número de pieza.
  // No decide nada: todo lo que muestra lo armó `salida.ts`. La posición va por `style:--i` y `style:--j` (CSSOM: la CSP no deja el atributo `style`).
  // El enlace ocupa toda la división de la escala (es el objetivo); `.objeto` va en el cuerpo dibujado y nunca en el enlace, que es lo que recibe el foco (15.3.2).
  // `tabindex` lo pone `ReglaDeSalida`: el tablero es UNA sola parada de Tab (solo una llave lleva 0). El estilo está en el `<style>` de este archivo.
  import type { LlaveDeSalida } from "../lib/estado/salida.ts";
  import { textoNombreDeLlave } from "./textos-marco.ts";

  let {
    llave,
    indice,
    orden,
    tabindex,
    alEnfocar,
    alApuntar,
  }: {
    llave: LlaveDeSalida;
    /** Posición en la escala (`--i`, de 0). */
    indice: number;
    /** Orden entre las que no salen (`--j`, de 0): el escalón de la caída. `null` en las que salen. */
    orden: number | null;
    tabindex: 0 | -1;
    /** El foco llegó a esta llave; `conTeclado` es `:focus-visible` (muestra la ayuda de las flechas en el rótulo de cota). */
    alEnfocar: (indice: number, conTeclado: boolean) => void;
    /** El puntero (mouse o lápiz) está sobre esta llave: muestra el rótulo de cota. */
    alApuntar: (indice: number) => void;
  } = $props();
</script>

<li>
  <a
    class="llave"
    href={llave.href}
    data-sale={llave.sale ? "si" : "no"}
    data-tono={llave.tono ?? undefined}
    style:--i={indice}
    style:--j={orden}
    {tabindex}
    aria-label={textoNombreDeLlave(llave)}
    onfocus={(e) => alEnfocar(indice, e.currentTarget.matches(":focus-visible"))}
    onpointerenter={(e) => {
      if (e.pointerType !== "touch") alApuntar(indice);
    }}
  >
    <span class="llave-cuerpo objeto"><span class="llave-pat" aria-hidden="true">{llave.patenteTexto}</span></span>
  </a>
  {#if llave.pieza !== null}<span class="globo" data-tono={llave.tono ?? undefined} aria-hidden="true">{llave.pieza}</span>{/if}
</li>

<style>
  /* La llave del tablero completo (15.6.3): un objeto de papel claro que cuelga de un riel. Todo lo que cambia con el ancho de la regla se decide por contenedor (`salida`, el que declara
     `ReglaDeSalida`). El enlace ocupa la división entera (es el objetivo: 24 px o más); el cuerpo dibujado es `.llave-cuerpo.objeto`, nunca el enlace (que es lo que recibe el foco).
     El globo (`.globo`, de `ReglaDeSalida`) cuelga debajo de las que no salen. */
  li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }
  .llave {
    position: relative;
    display: flex;
    justify-content: center;
    width: 100%;
    height: 5.75rem;
    padding-top: 6px;
    color: var(--c-tinta);
    text-decoration: none;
  }
  /* Gancho de 2 px que une la llave con el riel. */
  .llave::before {
    content: "";
    position: absolute;
    z-index: 1;
    top: 0;
    left: calc(50% - 1px);
    width: 2px;
    height: 12px;
    background: var(--c-tinta);
  }
  .llave:focus-visible {
    z-index: 6;
    outline: 3px solid var(--c-foco);
    outline-offset: 4px;
  }

  .llave-cuerpo {
    --giro: 0deg;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(100% - 6px, 2.625rem);
    height: 100%;
    padding-top: 13px;
    background: var(--c-hoja);
    border: var(--b-control) solid var(--c-tinta);
    border-radius: 3px 3px 10px 10px;
    box-shadow: var(--s-pieza);
    transform-origin: 50% -6px;
    transform: rotate(var(--giro));
    transition:
      transform var(--m-medio) var(--m-curva-resorte),
      box-shadow var(--m-medio) linear;
  }
  /* Agujero de la argolla y franja cobalto, como la chapa. */
  .llave-cuerpo::before {
    content: "";
    position: absolute;
    top: 4px;
    left: calc(50% - 3.5px);
    width: 7px;
    height: 7px;
    background: var(--c-papel);
    border: var(--b-control) solid var(--c-tinta);
    border-radius: var(--r-redondo);
  }
  .llave-cuerpo::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--obj-franja);
  }
  .llave-pat {
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    writing-mode: vertical-rl;
  }

  /* Las que no salen cuelgan torcidas (+4° o −3°, alternando). */
  .llave[data-sale="no"] .llave-cuerpo {
    --giro: 4deg;
  }
  li:nth-child(even) .llave[data-sale="no"] .llave-cuerpo {
    --giro: -3deg;
  }
  .llave[data-tono="critico"] .llave-cuerpo {
    background-color: var(--c-crit-relleno);
    background-image: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--obj-tinta) 26%, transparent) 0 2px, transparent 2px 6px);
    border-color: var(--obj-contorno);
  }
  .llave[data-tono="critico"] .llave-cuerpo::after {
    display: none;
  }
  .llave[data-tono="critico"] .llave-pat {
    padding: 3px 2px;
    background: var(--c-crit-relleno);
    color: var(--c-sobre-solido);
    border: 1px solid var(--c-sobre-solido);
  }
  .llave[data-tono="neutro"] .llave-cuerpo {
    background-color: var(--c-papel-2);
    background-image: repeating-linear-gradient(-45deg, var(--c-tinta-3) 0 1.5px, transparent 1.5px 6px);
  }
  .llave[data-tono="neutro"] .llave-pat {
    padding: 3px 2px;
    background: var(--c-hoja);
    color: var(--c-tinta);
    border: 1px solid var(--c-tinta-3);
  }

  /* Cursor encima o foco: se endereza, sube 3 px y toma sombra flotante; la que sale pasa a franja cobalto con texto blanco. El cursor encima solo con puntero fino. */
  .llave:focus-visible .llave-cuerpo {
    z-index: 5;
    box-shadow: var(--s-flotante);
    transform: translateY(-3px) rotate(0deg);
  }
  .llave[data-sale="si"]:focus-visible .llave-cuerpo {
    background: var(--obj-franja);
    color: var(--obj-sobre-franja);
    border-color: var(--obj-contorno);
  }
  @media (hover: hover) {
    .llave:hover .llave-cuerpo {
      z-index: 5;
      box-shadow: var(--s-flotante);
      transform: translateY(-3px) rotate(0deg);
    }
    .llave[data-sale="si"]:hover .llave-cuerpo {
      background: var(--obj-franja);
      color: var(--obj-sobre-franja);
      border-color: var(--obj-contorno);
    }
  }
  .llave:active .llave-cuerpo {
    transform: translateY(1px) rotate(0deg);
  }

  /* Regla de 60 rem o más: llaves de 108 px. */
  @container salida (min-width: 60rem) {
    .llave {
      height: 6.75rem;
    }
    .llave-cuerpo {
      padding-top: 16px;
    }
    .llave-cuerpo::before {
      top: 5px;
    }
    .llave-pat {
      letter-spacing: 0.08em;
    }
    .llave[data-sale="no"] .llave-pat {
      padding-block: 6px;
    }
  }

  /* Entrada (15.10): las llaves cuelgan derechas desde el primer cuadro; solo las que no salen caen 6 px y quedan torcidas, una por vez entre los 660 y los 880 ms. Las que salen no se mueven nunca.
     Sin `data-entrada="completa"` (fija, breve, quieta) no hay ninguna regla de animación: el estado final es el de arriba. */
  :global([data-entrada="completa"]) .llave[data-sale="no"] .llave-cuerpo {
    animation: cae 160ms var(--m-curva-resorte) calc(660ms + var(--j, 0) * var(--paso-caida, 20ms)) backwards;
  }
  :global([data-pausa]) .llave-cuerpo {
    animation-play-state: paused;
  }
  @keyframes cae {
    from {
      translate: 0 -6px;
      transform: rotate(0deg);
    }
  }

  @media (forced-colors: active) {
    .llave-cuerpo {
      forced-color-adjust: none;
      background: Canvas;
      color: CanvasText;
      border-color: CanvasText;
    }
    .llave[data-tono] .llave-cuerpo {
      background-image: none;
    }
    .llave-pat {
      background: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
    }
  }
</style>
