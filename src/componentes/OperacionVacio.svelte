<script lang="ts">
  // El estado vacío de una solapa de Operación diaria (no hay nada pendiente): dos líneas, qué pasó y qué va a aparecer ahí, en una caja punteada (15.5.12; sin ilustración).
  // El título no es un encabezado: el de la hoja ya lo es.
  let { titulo, ayuda }: { titulo: string; ayuda: string } = $props();
</script>

<div class="vacio">
  <p class="titulo">{titulo}</p>
  <p class="ayuda">{ayuda}</p>
</div>

<style>
  /* Pieza de vacío (15.5.12): caja punteada de 1 px en `--c-control` sobre la hoja, el porqué en cartel (78 %, 24 px) y una frase que dice qué va a aparecer ahí. Sin ilustración. */
  .vacio {
    display: grid;
    justify-items: start;
    gap: var(--e-2);
    margin: var(--e-4);
    padding: var(--e-5) var(--e-4);
    border: 1px dashed var(--c-control);
    background: var(--c-hoja);
  }
  .titulo {
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: var(--t-h2);
    font-weight: var(--t-peso-cartel);
    line-height: 1.25;
    color: var(--c-tinta);
    overflow-wrap: anywhere;
  }
  .ayuda {
    max-width: 46ch;
    color: var(--c-tinta-2);
  }
</style>