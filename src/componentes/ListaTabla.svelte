<script lang="ts" module>
  import type { Tono } from "./tipos.ts";

  export interface GrupoDeLista<T> {
    clave: string;
    titulo: string;
    tono: Tono;
    /** Id del título del grupo (destino de "Ver"). */
    idTitulo?: string;
    filas: T[];
  }
</script>

<script lang="ts" generics="F">
  // 5.9 Lista-tabla de alertas: una sola `table` (caption, encabezados con `scope`, un `tbody` por grupo con su fila de encabezado) con tres
  // disposiciones por consulta de contenedor del propio componente (no de la ventana):
  //   ≥ 66 rem  tabla completa · 40 a 65,99 rem  compacta (dos líneas por celda) · < 40 rem  tarjetas con la etiqueta de cada dato.
  // El componente pone la estructura, la franja del tono y los cortes; quien lo usa pone las celdas (`fila`) con `data-col` (qué dato es)
  // y `data-etiqueta` (cómo se rotula en la tarjeta) y los roles de `lista-roles.ts`. Los encabezados de columna solo se ven en la tabla completa.
  // El título de cada grupo es un `span` con `role="heading"` y `tabindex="-1"`: así "Ver" de la operación diaria puede llevar el foco ahí
  // (un `h3` no puede ir dentro de una celda de encabezado).
  import type { Snippet } from "svelte";
  import { ENCABEZADO_DE_COLUMNA, ENCABEZADO_DE_GRUPO, FILA, GRUPO_DE_FILAS, TABLA } from "./lista-roles.ts";

  let {
    variante,
    titulo,
    columnas,
    grupos,
    claveDeFila,
    tonoDeFila,
    fila,
  }: {
    variante: "vencimientos" | "operacion";
    /** Nombre de la tabla para lectores (el `caption` no se ve). */
    titulo: string;
    columnas: { id: string; titulo: string }[];
    grupos: GrupoDeLista<F>[];
    claveDeFila: (f: F) => string;
    tonoDeFila: (f: F) => Tono;
    /** Las celdas (`td`) de una fila. */
    fila: Snippet<[F]>;
  } = $props();
</script>

<div class="lista" data-variante={variante}>
  <table {...TABLA}>
    <caption class="solo-lectores">{titulo}</caption>
    <thead {...GRUPO_DE_FILAS}>
      <tr {...FILA}>
        {#each columnas as c (c.id)}
          <th scope="col" {...ENCABEZADO_DE_COLUMNA} data-col={c.id}>{c.titulo}</th>
        {/each}
      </tr>
    </thead>
    {#each grupos as g (g.clave)}
      <tbody {...GRUPO_DE_FILAS}>
        <tr {...FILA} class="grupo" data-tono={g.tono}>
          <th scope="rowgroup" {...ENCABEZADO_DE_GRUPO} colspan={columnas.length}>
            <span class="titulo-grupo" id={g.idTitulo} role="heading" aria-level="3" tabindex="-1">{g.titulo}</span>
          </th>
        </tr>
        {#each g.filas as f (claveDeFila(f))}
          <tr {...FILA} class="fila" data-tono={tonoDeFila(f)}>{@render fila(f)}</tr>
        {/each}
      </tbody>
    {/each}
  </table>
</div>

<style>
  .lista {
    container: lista / inline-size;
    min-width: 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--t-tabla);
    line-height: 1.4;
  }

  /* ---------- Tabla completa ---------- */
  th[scope="col"] {
    padding: var(--e-2) var(--e-3);
    border-bottom: 1px solid var(--c-borde-fuerte);
    font-size: var(--t-rotulo);
    line-height: 1.3;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-align: left;
    text-transform: uppercase;
    color: var(--c-texto-2);
  }
  .grupo th {
    padding: var(--e-4) var(--e-3) var(--e-2);
    border-bottom: 1px solid var(--c-borde);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
    text-align: left;
    color: var(--c-texto);
  }
  .titulo-grupo {
    display: inline-block;
    font-family: var(--t-familia-titulo);
  }
  .titulo-grupo::before {
    content: "";
    display: inline-block;
    width: 0.625rem;
    height: 0.625rem;
    margin-right: var(--e-2);
    border-radius: 50%;
    background: var(--tono-r);
  }
  .fila :global(td) {
    height: 3.5rem;
    padding: var(--e-2) var(--e-3);
    border-bottom: 1px solid var(--c-borde);
    vertical-align: middle;
  }
  /* Franja de 4 px del tono de la alerta, a la izquierda de la fila. */
  .fila :global(td:first-of-type) {
    padding-left: var(--e-4);
    box-shadow: inset 4px 0 0 var(--tono-r);
  }
  .fila :global(td[data-col="vence"]),
  .fila :global(td[data-col="fecha"]) {
    white-space: nowrap;
    font-variant-numeric: tabular-nums lining-nums;
  }
  .fila :global(td[data-col="accion"]) {
    text-align: right;
    white-space: nowrap;
  }
  @media (hover: hover) {
    .fila:hover :global(td) {
      background: var(--c-superficie-2);
    }
  }

  /* ---------- Compacta y tarjetas: la tabla deja de ser una tabla visual (los roles la mantienen para los lectores) ---------- */
  @container lista (max-width: 65.99rem) {
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
      white-space: nowrap;
    }
    .grupo,
    .grupo th {
      display: block;
    }
    .grupo th {
      padding-inline: 0;
    }
    .fila {
      display: grid;
      align-items: center;
      column-gap: var(--e-4);
      row-gap: var(--e-1);
      min-height: 3.5rem;
      padding: var(--e-3) var(--e-3) var(--e-3) var(--e-4);
      border-bottom: 1px solid var(--c-borde);
      box-shadow: inset 4px 0 0 var(--tono-r);
    }
    .fila :global(td),
    .fila :global(td:first-of-type) {
      display: block;
      min-width: 0;
      height: auto;
      padding: 0;
      border: 0;
      background: none;
      box-shadow: none;
    }
    .fila :global(td[data-col="accion"]) {
      text-align: left;
    }
    @media (hover: hover) {
      .fila:hover {
        background: var(--c-superficie-2);
      }
      .fila:hover :global(td) {
        background: none;
      }
    }
  }

  /* Compacta: (estado + documento) · (titular + proyecto) · (vence + acción). */
  @container lista (min-width: 40rem) and (max-width: 65.99rem) {
    [data-variante="vencimientos"] .fila {
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(0, 0.9fr);
      grid-template-areas:
        "estado titular vence"
        "documento proyecto accion";
    }
    [data-variante="vencimientos"] .fila :global(td[data-col="estado"]) {
      grid-area: estado;
    }
    [data-variante="vencimientos"] .fila :global(td[data-col="documento"]) {
      grid-area: documento;
    }
    [data-variante="vencimientos"] .fila :global(td[data-col="titular"]) {
      grid-area: titular;
    }
    [data-variante="vencimientos"] .fila :global(td[data-col="proyecto"]) {
      grid-area: proyecto;
    }
    [data-variante="vencimientos"] .fila :global(td[data-col="vence"]) {
      grid-area: vence;
    }
    [data-variante="vencimientos"] .fila :global(td[data-col="accion"]) {
      grid-area: accion;
    }
    /* Operación: (estado + fecha) · (qué pasó + unidad) · acción. */
    [data-variante="operacion"] .fila {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) auto;
      grid-template-areas:
        "estado que accion"
        "fecha unidad accion";
    }
    [data-variante="operacion"] .fila :global(td[data-col="estado"]) {
      grid-area: estado;
    }
    [data-variante="operacion"] .fila :global(td[data-col="que"]) {
      grid-area: que;
    }
    [data-variante="operacion"] .fila :global(td[data-col="unidad"]) {
      grid-area: unidad;
    }
    [data-variante="operacion"] .fila :global(td[data-col="fecha"]) {
      grid-area: fecha;
    }
    [data-variante="operacion"] .fila :global(td[data-col="accion"]) {
      grid-area: accion;
    }
  }

  /* Tarjetas: una columna, cada fila es una tarjeta con su borde y el botón a todo el ancho. */
  @container lista (max-width: 39.99rem) {
    .fila {
      grid-template-columns: minmax(0, 1fr);
      row-gap: var(--e-2);
      margin-top: var(--e-3);
      border: 1px solid var(--c-borde);
      border-radius: var(--r-2);
    }
    .fila :global(td[data-etiqueta])::before {
      content: attr(data-etiqueta);
      content: attr(data-etiqueta) / "";
      display: block;
      font-size: var(--t-rotulo);
      line-height: 1.3;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--c-texto-2);
    }
    .fila :global(td[data-col="accion"] > *) {
      width: 100%;
    }
  }

  @media (forced-colors: active) {
    .fila {
      box-shadow: none;
      border-left: 4px solid CanvasText;
    }
    @container lista (min-width: 66rem) {
      .fila {
        border-left: 0;
      }
      .fila :global(td:first-of-type) {
        box-shadow: none;
        border-left: 4px solid CanvasText;
      }
    }
    .titulo-grupo::before {
      background: CanvasText;
    }
  }
</style>
