<script lang="ts">
  // Una fila de Operación diaria (Partes o Novedades): riel del color del estado, etiqueta, el texto de la alerta, la unidad (chapa que lleva a su ficha) y a la derecha la acción:
  // «Resolver» (botón: abre el diálogo), «Abrir parte» o «Ver ficha» (enlaces). Todo lo arma `FilaOperacion` (`centro-alertas.ts`); acá solo se dibuja.
  //  - La fecha solo se muestra en las novedades: en los partes ya está dentro del texto de la alerta («Parte del 24/11/2026 sin enviar»).
  //  - Con poco ancho (el interior de la hoja mide menos de 30 rem, también con el texto agrandado) la acción baja a su renglón, debajo del texto.
  import type { FilaOperacion } from "../lib/estado/centro-alertas.ts";
  import Boton from "./Boton.svelte";
  import EnlaceAccion from "./EnlaceAccion.svelte";
  import Etiqueta from "./Etiqueta.svelte";
  import Patente from "./Patente.svelte";
  import { TEXTO_ALERTAS } from "./textos-marco.ts";
  import type { Tono } from "./tipos.ts";

  let {
    fila,
    tono,
    conFecha,
    alResolver,
  }: {
    fila: FilaOperacion;
    tono: Tono;
    /** Mostrar la fecha junto a la etiqueta (novedades). */
    conFecha: boolean;
    alResolver: (novedadId: string) => void;
  } = $props();

  /** El resto del nombre accesible de una acción, después del texto visible: «Resolver» + « novedad de ZU 899 QE: Frenos». */
  function sufijoAccesible(nombreAccesible: string, visible: string): string {
    return nombreAccesible.startsWith(visible) ? nombreAccesible.slice(visible.length) : ` ${nombreAccesible}`;
  }
</script>

<li data-tono={tono}>
  <div class="texto">
    <div class="cabecera">
      <Etiqueta {tono}>{fila.estado}</Etiqueta>
      {#if conFecha}
        {#if fila.sinFecha}
          <span class="fecha"><span aria-hidden="true">{fila.fecha}</span><span class="solo-lectores">{TEXTO_ALERTAS.sinFecha}</span></span>
        {:else}
          <span class="fecha num">{fila.fecha}</span>
        {/if}
      {/if}
    </div>
    <p class="titulo">{fila.texto}</p>
    <p class="unidad">
      <Patente patente={fila.unidad.patente} href={fila.unidad.href} />
      <span class="interno">{fila.unidad.interno}</span>
    </p>
  </div>
  <div class="accion">
    {#if fila.accion.tipo === "resolver"}
      {@const accion = fila.accion}
      <Boton variante="secundario" tamano="chico" onclick={() => alResolver(accion.novedadId)}>
        {accion.etiqueta}<span class="solo-lectores">{sufijoAccesible(accion.nombreAccesible, accion.etiqueta)}</span>
      </Boton>
    {:else}
      <EnlaceAccion href={fila.accion.href} tamano="chico">
        {fila.accion.etiqueta}<span class="solo-lectores">{sufijoAccesible(fila.accion.nombreAccesible, fila.accion.etiqueta)}</span>
      </EnlaceAccion>
    {/if}
  </div>
</li>

<style>
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    gap: var(--e-2) var(--e-3);
    padding: var(--e-3) var(--e-3) var(--e-3) var(--e-4);
    border-bottom: 1px solid var(--c-borde);
    box-shadow: inset 4px 0 0 var(--tono-r, transparent);
  }
  li:last-child {
    border-bottom: 0;
  }
  .texto {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-1);
    min-width: 0;
  }
  .cabecera {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-3);
  }
  .fecha {
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }
  .titulo {
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .unidad {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--e-2);
    color: var(--c-texto-2);
    font-size: var(--t-tabla);
  }
  /* El enlace de la patente mide 44 px de alto (su blanco táctil) y la patente solo 24: el aire que sobra no es espacio entre renglones. */
  .unidad :global(.enlace-patente) {
    margin-block: -0.625rem;
  }
  .interno {
    color: var(--c-texto-2);
    font-size: var(--t-tabla);
  }
  .accion {
    display: flex;
  }
  /* Con lugar: el texto a la izquierda y la acción a la derecha. */
  @container interior (min-width: 30rem) {
    li {
      grid-template-columns: minmax(0, 1fr) auto;
      padding-inline: var(--e-4);
    }
    .accion {
      justify-content: flex-end;
    }
  }
  @media (forced-colors: active) {
    li[data-tono] {
      box-shadow: none;
      border-left: 4px solid CanvasText;
    }
  }
</style>
