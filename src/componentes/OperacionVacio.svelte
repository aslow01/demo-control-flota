<script lang="ts">
  // El estado vacío de una solapa de Operación diaria (no hay nada pendiente): la marca de la regla de vencimientos vacía (tres tramos, la línea de «hoy» y un tilde) y dos líneas, qué pasó
  // y qué va a aparecer ahí. La marca es decorativa (la dice el texto). El título no es un encabezado: el de la hoja ya lo es.
  let { titulo, ayuda }: { titulo: string; ayuda: string } = $props();
</script>

<div class="vacio">
  <span class="marca" aria-hidden="true"><i></i><i></i><i></i><b></b></span>
  <p class="titulo">{titulo}</p>
  <p class="ayuda">{ayuda}</p>
</div>

<style>
  .vacio {
    display: grid;
    justify-items: start;
    gap: var(--e-2);
    padding: var(--e-5) var(--e-4);
  }
  .marca {
    position: relative;
    display: grid;
    grid-template-columns: 7fr 8fr 15fr;
    width: min(10.5rem, 100%);
    height: 1rem;
    margin: 1.5rem 0 var(--e-2) 0.125rem;
  }
  .marca i {
    border: 1px solid transparent;
  }
  .marca i:nth-child(1) {
    background: var(--c-semana-f);
    border-radius: 3px 0 0 3px;
  }
  .marca i:nth-child(2) {
    background: var(--c-quincena-f);
  }
  .marca i:nth-child(3) {
    background: var(--c-mes-f);
    border-radius: 0 3px 3px 0;
  }
  /* La línea de «hoy». */
  .marca::before {
    content: "";
    position: absolute;
    left: -0.125rem;
    top: -0.375rem;
    bottom: -0.375rem;
    width: 3px;
    border-radius: 2px;
    background: var(--c-hoy);
  }
  /* El tilde, sobre «hoy». */
  .marca b {
    position: absolute;
    left: 0.5rem;
    top: -1.375rem;
    width: 0.75rem;
    height: 1.375rem;
    border: solid var(--c-vigente-r);
    border-width: 0 4px 4px 0;
    rotate: 40deg;
  }
  .titulo {
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: var(--t-h2);
    font-weight: 700;
    line-height: 1.25;
    color: var(--c-texto);
  }
  .ayuda {
    max-width: 46ch;
    color: var(--c-texto-2);
  }
  @media (forced-colors: active) {
    .marca b {
      border-color: CanvasText;
    }
  }
</style>
