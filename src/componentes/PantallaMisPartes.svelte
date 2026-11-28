<script lang="ts">
  // Mis partes (`#/conductor/partes`), la pantalla del perfil Conductor a la que lleva «Ver todos» de «Mis últimos partes»: los últimos cinco partes cerrados, el más nuevo primero. No tiene reglas de
  // negocio: todo lo arma `leerMisPartes(app)` (`titulo`, `conductor`, `filas`, `vacio`; lib/estado/conductor.ts, que se baja con esta pantalla). Cada fila es un enlace al parte (en lectura): fecha, patente, recorrido y la etiqueta «Cerrado».
  //  - La línea de contexto dice de quién son y cuántos hay: «Tamara Olivera (persona ficticia) · los últimos cinco» (los dos textos salen de `textos-conductor.ts` y `textos-marco.ts`).
  //  - Sin partes cerrados no hay lista: el panel dice por qué (`partes.vacio`).
  //  - Se carga bajo demanda como `PantallaConductor` (ver `App.svelte`); el foco va al `h1` al llegar (lo hace `App.svelte`).
  import { TEXTO_INICIO_CONDUCTOR, textoUltimosPartes } from "../lib/dominio/textos-conductor.ts";
  import { leerMisPartes } from "../lib/estado/conductor.ts";
  import { app } from "../lib/estado/instancia.ts";
  import EtiquetaParte from "./EtiquetaParte.svelte";
  import Icono from "./Icono.svelte";
  import Panel from "./Panel.svelte";
  import Patente from "./Patente.svelte";
  import { TEXTO_ALERTAS } from "./textos-marco.ts";
  import { TEXTO_CONDUCTOR_VISTA as T } from "./textos-marco-parte.ts";

  const partes = $derived(leerMisPartes(app));
</script>

{#if partes !== null}
  <div class="pantalla">
    <div class="encabezado">
      <h1 tabindex="-1">{partes.titulo}</h1>
      <p class="contexto">{TEXTO_ALERTAS.conductorFicticio(partes.conductor)} · {textoUltimosPartes(partes.filas.length)}</p>
    </div>

    <Panel titulo={TEXTO_INICIO_CONDUCTOR.ultimosTitulo} icono="km" sinRelleno>
      {#if partes.vacio !== null}
        <p class="vacio">{partes.vacio}</p>
      {:else}
        <ul class="partes">
          {#each partes.filas as f (f.parteId)}
            <li>
              <a class="fila" href={f.href}>
                <span class="cuerpo">
                  <span class="fecha num"><span class="solo-lectores">{T.parteDel}</span>{f.fecha}</span>
                  <span class="detalle">
                    <span class="patente-fila"><Patente patente={f.patenteTexto.replaceAll(" ", "")} /></span>
                    <span class="recorrido num">{f.recorrido}</span>
                  </span>
                </span>
                <span class="estado"><EtiquetaParte tipo="cerrado" /></span>
                <span class="chev" aria-hidden="true"><Icono nombre="chevron" /></span>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </Panel>
  </div>
{/if}

<style>
  /* Mis partes (FL-08, 15.9.8): título, línea de contexto de 13 px y una ficha con la lista. Sin campo pleno: el cobalto no aparece en esta pantalla. Entre piezas, 12 px, como en Movilidades. */
  .pantalla {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    width: min(100%, 47.5rem);
    min-width: 0;
    margin-inline: auto;
  }
  .encabezado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
  }
  .contexto {
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-tinta-2);
    overflow-wrap: anywhere;
  }

  /* La lista de filas llega hasta los bordes de la ficha (`sinRelleno`): cada fila trae su relleno. */
  .partes {
    /* El umbral mira el ancho de la lista y no el de la pantalla: con el texto al 200 % la etiqueta baja a su renglón. */
    container: partes / inline-size;
    display: flex;
    flex-direction: column;
  }
  .partes li + li {
    border-top: 1px solid var(--c-filete);
  }
  /* Celular: dos renglones por parte (la fecha y, debajo, la chapa con el recorrido), la etiqueta y la flecha a la derecha. */
  .fila {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-areas: "cuerpo estado chev";
    align-items: center;
    column-gap: var(--e-3);
    min-height: 3.5rem;
    padding: var(--e-2) var(--e-3) var(--e-2) var(--e-4);
    color: var(--c-tinta);
    text-decoration: none;
  }
  .cuerpo {
    grid-area: cuerpo;
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    min-width: 0;
  }
  .fecha {
    font-weight: 700;
    color: var(--c-tinta);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .detalle {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-3);
    min-width: 0;
  }
  .patente-fila {
    white-space: nowrap;
  }
  /* El recorrido es un dato: en técnica. */
  .recorrido {
    font-family: var(--t-mono);
    font-size: var(--t-tabla);
    color: var(--c-tinta-2);
    white-space: nowrap;
  }
  .estado {
    grid-area: estado;
  }
  .chev {
    --icono-tam: 1.25rem;
    grid-area: chev;
    display: inline-flex;
    color: var(--c-tinta-3);
  }
  @media (hover: hover) {
    .fila:hover {
      background: var(--c-papel-2);
    }
    .fila:hover .fecha {
      text-decoration-thickness: 2px;
    }
  }
  /* Con lugar (la lista mide 32 rem o más): un solo renglón, con el recorrido a la derecha, pegado a la etiqueta. */
  @container partes (min-width: 32rem) {
    .cuerpo,
    .detalle {
      display: contents;
    }
    .fila {
      grid-template-columns: 8.5rem auto minmax(0, 1fr) auto auto;
      grid-template-areas: "fecha patente recorrido estado chev";
    }
    .fecha {
      grid-area: fecha;
    }
    .patente-fila {
      grid-area: patente;
    }
    .recorrido {
      grid-area: recorrido;
      justify-self: end;
    }
  }
  /* Poco ancho (la lista mide 20 rem o menos: un celular chico o el texto agrandado): la etiqueta baja debajo de la fecha y el recorrido, y la flecha queda a la derecha. */
  @container partes (max-width: 20rem) {
    .fila {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        "cuerpo chev"
        "estado chev";
      row-gap: var(--e-2);
      justify-items: start;
    }
    .chev {
      justify-self: end;
    }
  }

  /* Vacío (15.5.12): caja de 1 px punteada en `--c-control` sobre la hoja y el porqué en cartel a 78 % y 24 px. Sin ilustración. */
  .vacio {
    margin: var(--e-4);
    padding: var(--e-5) var(--e-4);
    border: 1px dashed var(--c-control);
    background: var(--c-hoja);
    color: var(--c-tinta);
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: var(--t-h2);
    font-weight: var(--t-peso-cartel);
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
</style>