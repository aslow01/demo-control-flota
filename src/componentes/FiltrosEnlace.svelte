<script lang="ts" generics="Id extends string">
  // Pastillas de filtro que son enlaces (prototipo «Turno»): un `nav` con una lista de `<a>`, y `aria-current="page"` en la elegida. Las usan Vencimientos y Movilidades.
  // Cambiar de filtro es navegar a `href`: la consulta de la dirección no mueve el foco ni el desplazamiento (lo garantiza el estado: `versionDePantalla` no sube) y el enlace
  // que se tocó conserva el foco porque la lista tiene clave por `id`.
  //  - Con poco ancho (menos de 40 rem) van en una sola fila que se desplaza de costado dentro de su propia caja (la página no se ensancha): una pastilla cortada en el borde
  //    avisa que hay más. Cada una es un enlace enfocable, así que el teclado también llega. Con más lugar pasan a renglones.
  //  - Lo único que se mueve por programa es el desplazamiento horizontal de esa caja, para que la elegida (por ejemplo, tras abrir un enlace con `?filtro=7`) quede a la vista.
  //  - Cada pastilla mide 44 px de alto, lleva la forma del tono (rombo, triángulo, círculo, aro: el color nunca va solo) y la cuenta. La elegida es tinta con la forma sobre un disco claro.
  import Forma, { type FormaVisual } from "./Forma.svelte";
  import type { Tono } from "./tipos.ts";

  let {
    leyenda,
    opciones,
    valor,
  }: {
    /** El nombre accesible del grupo (`nav`): «Mostrar». */
    leyenda: string;
    opciones: { id: Id; etiqueta: string; cantidad: number; tono?: Tono | null; forma?: FormaVisual | null; href: string }[];
    /** El id elegido (lleva `aria-current`). */
    valor: Id;
  } = $props();

  let lista = $state<HTMLUListElement>();

  // Deja a la vista la pastilla elegida moviendo SOLO el desplazamiento horizontal de la lista (no `scrollIntoView`, que también podría mover la página).
  $effect(() => {
    void valor;
    const ul = lista;
    const actual = ul?.querySelector<HTMLElement>('[aria-current="page"]');
    if (ul === undefined || actual == null) return;
    const aire = 16;
    const desde = actual.offsetLeft - aire;
    const hasta = actual.offsetLeft + actual.offsetWidth + aire;
    if (desde < ul.scrollLeft) ul.scrollLeft = Math.max(0, desde);
    else if (hasta > ul.scrollLeft + ul.clientWidth) ul.scrollLeft = hasta - ul.clientWidth;
  });
</script>

<nav class="filtros" aria-label={leyenda}>
  <ul bind:this={lista}>
    {#each opciones as o (o.id)}
      <li>
        <a href={o.href} aria-current={valor === o.id ? "page" : undefined}>
          {#if o.forma != null}<span class="marca"><Forma forma={o.forma} tono={o.tono ?? undefined} /></span>{/if}
          <span class="etiqueta">{o.etiqueta}</span>
          <span class="conteo num">{o.cantidad}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .filtros {
    min-width: 0;
  }
  /* Poco ancho: una fila que se desplaza. El relleno deja lugar al anillo de foco (3 px + 2 de separación) y el margen negativo lo devuelve. */
  ul {
    position: relative;
    display: flex;
    gap: var(--e-2);
    margin: calc(var(--e-2) * -1);
    padding: var(--e-2);
    overflow-x: auto;
    scrollbar-width: thin;
    scroll-padding-inline: var(--e-4);
  }
  li {
    flex: none;
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    padding-inline: var(--e-4);
    background: var(--c-superficie);
    border: var(--b-control) solid var(--c-borde-fuerte);
    border-radius: var(--r-pildora);
    color: var(--c-texto);
    font-size: var(--t-tabla);
    font-weight: 600;
    line-height: 1.2;
    text-decoration: none;
    white-space: nowrap;
  }
  /* Disco de 18 px detrás de la forma: invisible en las pastillas sin elegir (misma medida, sin saltos) y claro en la elegida, donde el color de la forma sobre la tinta no llegaría a 3:1. */
  .marca {
    display: inline-grid;
    flex: none;
    place-items: center;
    width: 1.125rem;
    height: 1.125rem;
    border-radius: 50%;
  }
  .conteo {
    color: var(--c-texto-2);
    font-weight: 700;
  }
  @media (hover: hover) {
    a:hover {
      background: var(--c-superficie-2);
      text-decoration: none;
    }
  }
  a[aria-current="page"] {
    background: var(--c-tinta);
    border-color: var(--c-tinta);
    color: var(--c-sobre-tinta);
  }
  a[aria-current="page"] .conteo {
    color: var(--c-sobre-tinta);
  }
  a[aria-current="page"] .marca {
    background: var(--c-sobre-tinta);
  }
  @media (hover: hover) {
    a[aria-current="page"]:hover {
      background: var(--c-tinta-hover);
      border-color: var(--c-tinta-hover);
    }
  }
  /* Con lugar, a renglones (nada que desplazar). */
  @media (min-width: 40rem) {
    ul {
      flex-wrap: wrap;
      overflow-x: visible;
    }
  }

  @media (forced-colors: active) {
    a[aria-current="page"] {
      forced-color-adjust: none;
      background: Highlight;
      border-color: Highlight;
      color: HighlightText;
    }
    a[aria-current="page"] .conteo {
      color: HighlightText;
    }
    a[aria-current="page"] .marca {
      background: Canvas;
    }
  }
</style>
