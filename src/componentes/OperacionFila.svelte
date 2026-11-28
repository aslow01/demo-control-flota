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
  /* Una fila de Operación diaria (15.9.4): estado, qué pasó, unidad (chapa) y la acción. Hoja lisa: el texto nunca va sobre una trama.
     Con tono: el renglón crítico lleva el precinto de 6 px (rayado a -45°) en el borde izquierdo; los demás, un filete liso de 2 px del color de su tono (el precinto es para lo que
     no puede salir o está vencido, no para todo lo pendiente). Las filas no se pintan al pasar el cursor: no son un enlace, tienen sus propios controles. */
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    gap: var(--e-2) var(--e-3);
    padding: var(--e-3) var(--e-3) var(--e-3) var(--e-4);
    border-bottom: 1px solid var(--c-filete);
    box-shadow: inset 2px 0 0 var(--tono-r, transparent);
  }
  li[data-tono="critico"] {
    box-shadow: none;
    background-image: repeating-linear-gradient(-45deg, var(--tono-r) 0 1.5px, transparent 1.5px 7px);
    background-repeat: no-repeat;
    background-size: 6px 100%;
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
  /* La fecha, en técnica. */
  .fecha {
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    line-height: 1.2;
    color: var(--c-tinta-2);
  }
  .titulo {
    font-weight: 600;
    line-height: 1.35;
    color: var(--c-tinta);
    overflow-wrap: anywhere;
  }
  .unidad {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--e-2);
    color: var(--c-tinta-2);
    font-size: var(--t-tabla);
  }
  /* El enlace de la patente mide 44 px de alto (su blanco táctil) y la patente solo 24: el aire que sobra no es espacio entre renglones. */
  .unidad :global(.enlace-patente) {
    margin-block: -0.625rem;
  }
  .interno {
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    color: var(--c-tinta-2);
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
      background-image: none;
      border-left: 6px solid CanvasText;
    }
  }
</style>