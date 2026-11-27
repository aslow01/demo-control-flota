<script lang="ts">
  import { CELDA, ENCABEZADO_DE_GRUPO, FILA, GRUPO_DE_FILAS, TABLA } from "./lista-roles.ts";
  // Panel «Kilometraje» de la ficha (6.3): los últimos partes enviados y correcciones (fecha, inicio → fin y recorrido), el más nuevo primero. Los saltos y
  // recorridos largos que se aceptaron al enviar llevan `i-alerta` en tono semana; las correcciones, `i-km` y su motivo. No tiene reglas: todo lo arma
  // `ficha.kilometraje`. «Corregir kilometraje» avisa con `alCorregir`. La tabla tiene encabezados solo para lectores de pantalla.
  import type { PanelKilometraje } from "../lib/estado/ficha.ts";
  import Boton from "./Boton.svelte";
  import Icono from "./Icono.svelte";
  import Panel from "./Panel.svelte";
  import { TEXTO_FICHA_VISTA as T } from "./textos-marco-ficha.ts";

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
    <table {...TABLA}>
      <caption class="solo-lectores">{kilometraje.subtitulo}</caption>
      <thead class="solo-lectores" {...GRUPO_DE_FILAS}>
        <tr {...FILA}>
          <th scope="col" role="columnheader">{T.kilometraje.columnas.fecha}</th>
          <th scope="col" role="columnheader">{T.kilometraje.columnas.registro}</th>
          <th scope="col" role="columnheader">{T.kilometraje.columnas.recorrido}</th>
        </tr>
      </thead>
      <tbody {...GRUPO_DE_FILAS}>
        {#each kilometraje.filas as f (f.clave)}
          <tr {...FILA}>
            <th scope="row" {...ENCABEZADO_DE_GRUPO} class="fecha num">
              {#if f.href !== null}
                <a href={f.href}><span class="solo-lectores">{T.kilometraje.parteDel}</span>{f.fecha}</a>
              {:else}
                {f.fecha}
              {/if}
            </th>
            <td {...CELDA} class="registro">
              <span class="texto">
                {#if f.tipo === "correccion"}<Icono nombre="km" />{/if}{f.texto}
              </span>
              {#if f.motivo !== null}<span class="nota">{T.kilometraje.motivo(f.motivo)}</span>{/if}
              {#each f.advertencias as advertencia (advertencia)}
                <span class="advertencia"><Icono nombre="alerta" />{advertencia}</span>
              {/each}
            </td>
            <td {...CELDA} class="recorrido num">
              {#if f.recorrido !== null}{f.recorrido}{:else if f.tipo === "salida"}<!-- Parte en uso (C16): el recorrido todavía no se conoce; la raya ocupa su lugar para que la fila se alinee con las demás. --><span aria-hidden="true">—</span><span class="solo-lectores">{T.kilometraje.sinRecorrido}</span>{/if}
            </td>
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
  /* Texto agrandado (el interior mide 17 rem o menos): tres columnas no caben; cada fila pasa a dos renglones, la fecha a la izquierda y el recorrido a la derecha, y el registro (inicio → fin)
     a todo el ancho debajo. Con `display: block` los roles escritos en el marcado mantienen la tabla para los lectores de pantalla. */
  @container interior (max-width: 17rem) {
    table,
    tbody {
      display: block;
    }
    thead {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    tr {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      column-gap: var(--e-3);
      padding-block: var(--e-2);
    }
    th,
    td {
      padding: 0;
    }
    .fecha {
      width: auto;
    }
    .registro {
      order: 3;
      flex: 1 0 100%;
    }
    .recorrido {
      margin-inline-start: auto;
    }
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
