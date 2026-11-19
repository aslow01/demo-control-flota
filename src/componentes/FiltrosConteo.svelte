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
  .filtros {
    min-width: 0;
  }
  legend {
    float: left;
    margin-right: var(--e-3);
    padding: 0;
    font-size: var(--t-chico);
    font-weight: 600;
    line-height: var(--alto-tactil);
    color: var(--c-texto-2);
  }
  .opciones {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--e-2);
  }
  .opcion {
    --linea: var(--tono-r, var(--c-acento));
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-3);
    min-height: var(--alto-tactil);
    padding: 0 var(--e-3);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-2);
    color: var(--c-texto-2);
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
    font-size: var(--t-chico);
    font-weight: 600;
  }
  @media (hover: hover) {
    .opcion:hover {
      background: var(--c-superficie-2);
    }
  }
  /* Elegido (S2): fondo de superficie 2 + línea de 3 px del tono + texto firme. El fondo verde azulado (`--c-acento-suave`) quedaba junto a la línea ámbar o roja del tono. */
  .opcion:has(input:checked) {
    background: var(--c-superficie-2);
    box-shadow: inset 0 -3px 0 var(--linea);
    color: var(--c-texto);
    font-weight: 600;
  }
  .opcion:has(input:focus-visible) {
    outline: 2px solid var(--c-foco);
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
      box-shadow: none;
      forced-color-adjust: none;
    }
  }
</style>
