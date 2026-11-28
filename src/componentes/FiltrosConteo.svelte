<script lang="ts" generics="Id extends string">
  // 5.8 Filtros por radios con conteo: `fieldset` con `legend`, radios nativos con aspecto de segmentos (flechas para moverse), cada uno con su
  // cantidad. Elegido: texto firme y una línea interior de 3 px del tono del grupo (los demás, del acento). Sin opción con 0: se muestra igual.
  // A menos de 40 rem, grilla de 2 columnas. El valor elegido es de quien lo usa (`valor`); al cambiar llama `alElegir` (que anuncia).
  import type { Tono } from "./tipos.ts";

  let {
    leyenda,
    opciones,
    valor,
    alElegir,
  }: {
    leyenda: string;
    opciones: { id: Id; etiqueta: string; cantidad: number; tono?: Tono }[];
    valor: Id;
    alElegir: (id: Id) => void;
  } = $props();

  const uid = $props.id();
</script>

<fieldset class="filtros">
  <legend>{leyenda}</legend>
  <div class="opciones">
    {#each opciones as o (o.id)}
      <label class="opcion" data-tono={o.tono}>
        <input type="radio" name={`${uid}-filtro`} value={o.id} checked={valor === o.id} onchange={() => alElegir(o.id)} />
        <span class="etiqueta">{o.etiqueta}</span>
        <span class="conteo num">{o.cantidad}</span>
      </label>
    {/each}
  </div>
</fieldset>

<style>
  /* Pie de rey (15.5.8): el segmentado. Cajas rectas (radio 2 px) de `--alto-control`, con 6 px entre sí, que bajan de renglón. Elegido: el campo pleno. */
  .filtros {
    min-width: 0;
  }
  legend {
    float: left;
    margin-right: var(--e-3);
    padding: 0;
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: var(--alto-control);
    color: var(--c-tinta-2);
  }
  .opciones {
    display: grid;
    /* Dos columnas en el teléfono; con el texto agrandado (el rem crece) pasa a una sola en lugar de ensanchar la página. */
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr));
    gap: 0.375rem;
  }
  .opcion {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-3);
    min-height: var(--alto-control);
    padding: 0 var(--e-3);
    background: var(--c-hoja);
    border: var(--b-control) solid var(--c-control);
    border-radius: var(--r-1);
    color: var(--c-tinta-2);
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
  }
  /* El radio ocupa toda la caja (se puede tocar en cualquier parte) y no se ve: el segmento dice si está elegido. */
  input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .conteo {
    font-family: var(--t-mono);
    font-size: var(--t-rotulo);
    font-weight: 600;
    color: var(--c-tinta-3);
  }
  @media (hover: hover) {
    .opcion:hover {
      background: var(--c-papel-2);
      border-color: var(--c-tinta);
      color: var(--c-tinta);
    }
  }
  /* Elegido: fondo pleno, texto y forma `--c-sobre-pleno`, conteo `--c-sobre-pleno-2`. El cero se muestra igual que cualquier otro conteo. */
  .opcion:has(input:checked),
  .opcion:has(input:checked):hover {
    background: var(--c-pleno);
    border-color: var(--c-pleno);
    color: var(--c-sobre-pleno);
  }
  .opcion:has(input:checked) .conteo {
    color: var(--c-sobre-pleno-2);
  }
  /* El anillo general, por fuera y con 2 px de separación: el mismo en el elegido y en los demás. */
  .opcion:has(input:focus-visible) {
    outline: 3px solid var(--c-foco);
    outline-offset: 2px;
  }

  @media (min-width: 40rem) {
    .opciones {
      display: flex;
      flex-wrap: wrap;
    }
    .opcion {
      justify-content: flex-start;
    }
  }
  /* Con la leyenda arriba cuando no entra al costado (poco ancho). */
  @media (max-width: 39.99rem) {
    legend {
      float: none;
      margin-bottom: var(--e-1);
      line-height: 1.4;
    }
  }

  @media (forced-colors: active) {
    .opcion:has(input:checked) {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
    .opcion:has(input:checked) .conteo {
      color: HighlightText;
    }
  }
</style>
