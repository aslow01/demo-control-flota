<script lang="ts">
  // Panel «Kilometraje» de la ficha (6.3): los últimos partes enviados y correcciones (fecha, inicio → fin y recorrido), el más nuevo primero. Los saltos y
  // recorridos largos que se aceptaron al enviar llevan `i-alerta` en tono semana; las correcciones, `i-km` y su motivo. No tiene reglas: todo lo arma
  // `ficha.kilometraje`. «Corregir kilometraje» avisa con `alCorregir`. La tabla tiene encabezados solo para lectores de pantalla.
  import type { PanelKilometraje } from "../lib/estado/ficha.ts";
  import Boton from "./Boton.svelte";
  import Icono from "./Icono.svelte";
  import Panel from "./Panel.svelte";
  import { TEXTO_FICHA_VISTA as T } from "./textos-marco.ts";

  let {
    kilometraje,
    idTitulo,
    estado = "",
    repetir,
    alCorregir,
  }: {
    kilometraje: PanelKilometraje;
    idTitulo: string;
    estado?: string;
    /** Cambia cada vez que la pantalla emite un mensaje, aunque el texto sea el mismo (así se vuelve a anunciar). */
    repetir?: unknown;
    alCorregir: () => void;
  } = $props();
</script>

<Panel id={idTitulo} titulo={kilometraje.titulo} icono="km" meta={kilometraje.rotuloKm} {estado} {repetir}>
  <p class="subtitulo">{kilometraje.subtitulo}</p>
  {#if kilometraje.vacio !== null}
    <p class="vacio"><Icono nombre="guion" />{kilometraje.vacio}</p>
  {:else}
    <table>
      <caption class="solo-lectores">{kilometraje.subtitulo}</caption>
      <thead class="solo-lectores">
        <tr>
          <th scope="col">{T.kilometraje.columnas.fecha}</th>
          <th scope="col">{T.kilometraje.columnas.registro}</th>
          <th scope="col">{T.kilometraje.columnas.recorrido}</th>
        </tr>
      </thead>
      <tbody>
        {#each kilometraje.filas as f (f.clave)}
          <tr>
            <th scope="row" class="fecha num">
              {#if f.href !== null}
                <a href={f.href}><span class="solo-lectores">{T.kilometraje.parteDel}</span>{f.fecha}</a>
              {:else}
                {f.fecha}
              {/if}
            </th>
            <td class="registro">
              <span class="texto num">
                {#if f.tipo === "correccion"}<Icono nombre="km" />{/if}{f.texto}
              </span>
              {#if f.motivo !== null}<span class="nota">{T.kilometraje.motivo(f.motivo)}</span>{/if}
              {#each f.advertencias as advertencia (advertencia)}
                <span class="advertencia"><Icono nombre="alerta" />{advertencia}</span>
              {/each}
            </td>
            <td class="recorrido num">{f.recorrido ?? ""}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
  {#if kilometraje.corregir !== null}
    <div class="corregir"><Boton variante="secundario" onclick={alCorregir}>{kilometraje.corregir.etiqueta}</Boton></div>
  {/if}
</Panel>

<style>
  .subtitulo {
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--t-tabla);
    line-height: 1.4;
  }
  tr {
    border-bottom: 1px solid var(--c-borde);
  }
  tbody tr:last-child {
    border-bottom: 0;
  }
  th,
  td {
    padding: var(--e-2) var(--e-2) var(--e-2) 0;
    vertical-align: top;
    text-align: left;
  }
  .fecha {
    width: 5.25rem;
    font-weight: 400;
    white-space: nowrap;
  }
  .fecha a {
    display: inline-flex;
    align-items: center;
    min-height: var(--alto-tactil);
    margin-block: calc((var(--alto-tactil) - 1.4em) / -2);
  }
  .registro {
    min-width: 0;
    /* El motivo de una corrección lo escribe la persona: sin espacios, no tiene que ensanchar la tabla ni la página. */
    overflow-wrap: anywhere;
  }
  .texto {
    display: inline-flex;
    align-items: center;
    gap: var(--e-1);
  }
  .texto :global(.icono) {
    --icono-tam: 1rem;
    color: var(--c-texto-2);
  }
  .nota,
  .advertencia {
    display: block;
  }
  .advertencia {
    --icono-tam: 1rem;
    display: flex;
    align-items: flex-start;
    gap: var(--e-1);
    margin-top: var(--e-1);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.35;
    color: var(--c-semana-t);
  }
  .advertencia :global(.icono) {
    margin-top: 0.05rem;
  }
  .recorrido {
    padding-right: 0;
    text-align: right;
    white-space: nowrap;
    color: var(--c-texto-2);
  }
  .corregir {
    display: flex;
  }
  .vacio {
    --icono-tam: 1.5rem;
    display: flex;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-4);
    border: 1px dashed var(--c-borde-fuerte);
    border-radius: var(--r-2);
    color: var(--c-texto-2);
  }
</style>
